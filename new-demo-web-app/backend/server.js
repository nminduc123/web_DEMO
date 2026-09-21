const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const dbConfig = { host: 'localhost', port: 3306, user: 'root', password: '', database: 'food_app' };
const otpStorage = {};

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

app.get('/api/shops', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    const [shops] = await connection.execute('SELECT id, shop_name, shop_category, is_open, avatar FROM users WHERE role = "seller" AND is_published = TRUE');
    await connection.end();
    res.json(shops);
});

app.get('/api/foods/:sellerId', async (req, res) => {
    const { role } = req.query;
    const connection = await mysql.createConnection(dbConfig);
    const [shops] = await connection.execute('SELECT is_published, is_open FROM users WHERE id = ?', [req.params.sellerId]);
    
    if (role !== 'seller' && (shops.length === 0 || shops[0].is_published === 0)) {
        await connection.end();
        return res.status(400).json({ error: true, message: "Rất tiếc! Quán này vừa mới ẩn khỏi sàn hoặc ngừng hoạt động." });
    }

    const [rows] = await connection.execute('SELECT * FROM menu WHERE seller_id = ? ORDER BY id DESC', [req.params.sellerId]);
    await connection.end();
    res.json({ error: false, foods: rows, is_open: shops.length > 0 ? shops[0].is_open : 0 });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    await connection.end();

    if (users.length > 0) {
        if (!users[0].is_verified) return res.status(400).json({ success: false, message: "Tài khoản chưa xác thực OTP!" });
        res.json({ 
            success: true, 
            user: { 
                id: users[0].id, email: users[0].email, role: users[0].role, phone: users[0].phone,
                shop_name: users[0].shop_name, shop_category: users[0].shop_category,
                is_published: !!users[0].is_published,
                is_open: !!users[0].is_open,
                avatar: users[0].avatar
            } 
        });
    } else res.status(400).json({ success: false, message: "Sai email hoặc mật khẩu!" });
});

app.post('/api/register', async (req, res) => {
    const { email, phone, password, verifyMethod, role, shopName, shopCategory } = req.body;
    const userRole = role === 'seller' ? 'seller' : 'user'; 

    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO users (email, phone, password, role, shop_name, shop_category) VALUES (?, ?, ?, ?, ?, ?)', 
            [email, phone, password, userRole, shopName || null, shopCategory || null]
        );
        await connection.end();
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStorage[email] = otp;
        console.log(`\n🔑 [2FA] Đang gửi OTP cho [${email}]: ${otp}\n`);
        
        res.json({ success: true, message: "Đã gửi mã OTP." });
    } catch (error) { 
        res.status(400).json({ success: false, message: "Email hoặc SĐT đã tồn tại!" }); 
    }
});

app.post('/api/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (otpStorage[email] === otp) {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('UPDATE users SET is_verified = TRUE WHERE email = ?', [email]);
        await connection.end();
        delete otpStorage[email];
        res.json({ success: true, message: "Xác thực thành công!" });
    } else res.status(400).json({ success: false, message: "Mã OTP không hợp lệ!" });
});

app.post('/api/checkout', async (req, res) => {
    const { userId, cart, paymentMethod, totalPrice } = req.body; 
    try {
        const connection = await mysql.createConnection(dbConfig);
        const foodIds = cart.map(item => item.id);
        
        const [menuRows] = await connection.execute(
            `SELECT id, name, is_sold_out, seller_id FROM menu WHERE id IN (${foodIds.map(() => '?').join(',')})`, 
            foodIds
        );

        const existingFoodIds = menuRows.map(row => row.id);
        const deletedItems = cart.filter(item => !existingFoodIds.includes(item.id));
        if (deletedItems.length > 0) {
            await connection.end();
            return res.status(400).json({ success: false, message: "Có món ăn đã bị ngừng kinh doanh.", invalidIds: deletedItems.map(item => item.id) });
        }

        const sellerIds = [...new Set(menuRows.map(row => row.seller_id))];
        const [shopRows] = await connection.execute(
            `SELECT id, shop_name, is_open, is_published FROM users WHERE id IN (${sellerIds.map(() => '?').join(',')})`, 
            sellerIds
        );
        
        const unavailableShops = shopRows.filter(shop => shop.is_open === 0 || shop.is_published === 0);
        if (unavailableShops.length > 0) {
            await connection.end();
            const unavailableShopIds = unavailableShops.map(shop => shop.id);
            const invalidFoodIds = menuRows.filter(row => unavailableShopIds.includes(row.seller_id)).map(row => row.id);
            return res.status(400).json({ success: false, message: "Quán đang tạm nghỉ.", invalidIds: invalidFoodIds });
        }

        const soldOutItems = menuRows.filter(row => row.is_sold_out === 1);
        if (soldOutItems.length > 0) {
            await connection.end();
            return res.status(400).json({ success: false, message: "Món đã hết hàng.", invalidIds: soldOutItems.map(item => item.id) });
        }

        const sellerId = menuRows[0].seller_id;
        const cartDetails = JSON.stringify(cart);
        await connection.execute(
            'INSERT INTO orders (user_id, seller_id, cart_details, total_price, payment_method) VALUES (?, ?, ?, ?, ?)',
            [userId, sellerId, cartDetails, totalPrice, paymentMethod || 'COD']
        );

        await connection.end();
        res.json({ success: true, message: "Đặt hàng thành công!" });
    } catch (error) { 
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống!" }); 
    }
});

app.get('/api/seller/orders', async (req, res) => {
    const { sellerId } = req.query;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [orders] = await connection.execute('SELECT * FROM orders WHERE seller_id = ? ORDER BY created_at DESC', [sellerId]);
        await connection.end();
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy đơn hàng" });
    }
});

app.post('/api/seller/update-order-status', async (req, res) => {
    const { orderId, status } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
        await connection.end();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/seller/toggle-shop', async (req, res) => {
    const { sellerId, is_published, is_open } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('UPDATE users SET is_published = ?, is_open = ? WHERE id = ?', [is_published, is_open, sellerId]);
    await connection.end();
    res.json({ success: true });
});

app.post('/api/seller/add-food', upload.single('image'), async (req, res) => {
    const { name, price, sellerId } = req.body;
    const imgUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : '';
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('INSERT INTO menu (name, price, img, is_sold_out, seller_id) VALUES (?, ?, ?, false, ?)', [name, price, imgUrl, sellerId]);
    await connection.end();
    res.json({ success: true, message: "Thêm món thành công!" });
});

app.put('/api/seller/update-food/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, price } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    if (req.file) {
        const imgUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        await connection.execute('UPDATE menu SET name = ?, price = ?, img = ? WHERE id = ?', [name, price, imgUrl, id]);
    } else {
        await connection.execute('UPDATE menu SET name = ?, price = ? WHERE id = ?', [name, price, id]);
    }
    await connection.end();
    res.json({ success: true, message: "Cập nhật thành công!" });
});

app.post('/api/seller/toggle-status', async (req, res) => {
    const { id, is_sold_out } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('UPDATE menu SET is_sold_out = ? WHERE id = ?', [is_sold_out, id]);
    await connection.end();
    res.json({ success: true });
});

app.delete('/api/seller/delete-food/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('DELETE FROM menu WHERE id = ?', [id]);
    await connection.end();
    res.json({ success: true, message: "Đã xóa món ăn thành công!" });
});

app.post('/api/seller/update-avatar', upload.single('avatar'), async (req, res) => {
    const { sellerId } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: "Vui lòng chọn ảnh!" });
    const avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, sellerId]);
        await connection.end();
        res.json({ success: true, avatarUrl, message: "Cập nhật thành công!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống!" });
    }
});

app.post('/api/user/update-profile', upload.single('avatar'), async (req, res) => {
    const { userId, phone } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        if (req.file) {
            const avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;
            await connection.execute('UPDATE users SET phone = ?, avatar = ? WHERE id = ?', [phone, avatarUrl, userId]);
            await connection.end();
            res.json({ success: true, avatarUrl, message: "Cập nhật thành công!" });
        } else {
            await connection.execute('UPDATE users SET phone = ? WHERE id = ?', [phone, userId]);
            await connection.end();
            res.json({ success: true, message: "Cập nhật thành công!" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống!" });
    }
});

app.post('/api/user/change-password', async (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [users] = await connection.execute('SELECT * FROM users WHERE id = ? AND password = ?', [userId, oldPassword]);
        if (users.length === 0) {
            await connection.end();
            return res.status(400).json({ success: false, message: "Mật khẩu cũ không chính xác!" });
        }
        await connection.execute('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
        await connection.end();
        res.json({ success: true, message: "Đổi mật khẩu thành công!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống!" });
    }
});

// ==========================================
// API QUÊN MẬT KHẨU & XÁC THỰC OTP (ĐÃ FIX CHUẨN CẮT MÃ VÙNG)
// ==========================================

// 1. Gửi OTP quên mật khẩu
app.post('/api/forgot-password/send-otp', async (req, res) => {
    const { type, value } = req.body;
    console.log("👉 Dữ liệu client gửi lên - Type:", type, "| Value:", value);

    try {
        const connection = await mysql.createConnection(dbConfig);
        let users = [];
        let lookupKey = value;

        if (type === 'email') {
            const [rows] = await connection.execute("SELECT * FROM users WHERE email = ?", [value]);
            users = rows;
        } else {
            // Cắt bỏ dấu + và 2 ký tự mã vùng đầu tiên (vd: "+84123456789" -> "123456789"), sau đó thêm số 0 vào đầu
            const rawDigits = value.replace('+', '').substring(2); 
            const phoneWithZero = '0' + rawDigits; 
            lookupKey = phoneWithZero; 

            console.log("🔍 Tìm kiếm SĐT trong DB:", phoneWithZero);
            const [rows] = await connection.execute("SELECT * FROM users WHERE phone = ?", [phoneWithZero]);
            users = rows;
        }

        await connection.end();

        if (users.length > 0) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            otpStorage[lookupKey] = otp; 
            console.log(`\n🔑 [OTP QUÊN MẬT KHẨU] Mã xác thực cho [${lookupKey}]: ${otp}\n`);
            res.json({ success: true, message: "Đã gửi mã OTP thành công!" });
        } else {
            console.log("❌ Không tìm thấy user khớp với SĐT:", lookupKey);
            res.status(404).json({ success: false, message: "Không tìm thấy tài khoản với số điện thoại này trong CSDL!" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi kết nối cơ sở dữ liệu!" });
    }
});

// 2. Xác thực OTP
app.post('/api/forgot-password/verify-otp', (req, res) => {
    const { value, otp } = req.body;
    const rawDigits = value.replace('+', '').substring(2);
    const lookupKey = '0' + rawDigits;

    if (otpStorage[lookupKey] && otpStorage[lookupKey] === otp) {
        res.json({ success: true, message: "Mã OTP chính xác!" });
    } else {
        res.status(400).json({ success: false, message: "Mã OTP không hợp lệ hoặc đã hết hạn!" });
    }
});

// 3. Đổi mật khẩu mới
app.post('/api/forgot-password/reset', async (req, res) => {
    const { type, value, newPassword } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        let targetValue = value;
        if (type === 'phone') {
            const rawDigits = value.replace('+', '').substring(2);
            targetValue = '0' + rawDigits;
        }

        const query = type === 'email' 
            ? "UPDATE users SET password = ? WHERE email = ?" 
            : "UPDATE users SET password = ? WHERE phone = ?";
            
        await connection.execute(query, [newPassword, targetValue]);
        await connection.end();

        delete otpStorage[targetValue];
        res.json({ success: true, message: "Đổi mật khẩu thành công!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Không thể cập nhật mật khẩu mới!" });
    }
});

app.listen(5000, () => console.log('Backend đang chạy ở port 5000...'));