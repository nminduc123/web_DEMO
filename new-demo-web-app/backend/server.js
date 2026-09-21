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
const tempUsers = {}; // <-- Thêm biến này để lưu tạm thông tin đăng ký chờ xác thực

// Hàm tiện ích kiểm tra xem một tài khoản có đang bị khóa (is_blocked = 1) hay không
const checkUserBlocked = async (connection, userId) => {
    if (!userId) return false;
    try {
        const [rows] = await connection.execute('SELECT is_blocked FROM users WHERE id = ?', [userId]);
        return rows.length > 0 && !!rows[0].is_blocked;
    } catch (e) {
        return false;
    }
};

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

app.get('/api/shops', async (req, res) => {
    const { search } = req.query;
    try {
        const connection = await mysql.createConnection(dbConfig);
        let query = `
            SELECT DISTINCT u.id, u.shop_name, u.shop_category, u.shop_description, u.shop_address, u.is_open, u.avatar 
            FROM users u 
            LEFT JOIN menu m ON m.seller_id = u.id 
            WHERE u.role = 'seller' AND u.is_published = 1 AND (u.is_blocked IS NULL OR u.is_blocked = 0)
        `;
        let params = [];
        if (search && search.trim() !== '') {
            const term = `%${search.trim()}%`;
            query += ` AND (u.shop_name LIKE ? OR u.shop_category LIKE ? OR u.shop_description LIKE ? OR m.name LIKE ?)`;
            params = [term, term, term, term];
        }
        const [shops] = await connection.execute(query, params);
        await connection.end();
        res.json(shops);
    } catch (error) {
        console.error("Lỗi lấy danh sách quán:", error);
        res.status(500).json([]);
    }
});

app.get('/api/foods/:sellerId', async (req, res) => {
    const { role } = req.query;
    const connection = await mysql.createConnection(dbConfig);
    const [shops] = await connection.execute('SELECT id, shop_name, shop_category, shop_description, shop_address, avatar, is_published, is_open, is_blocked FROM users WHERE id = ?', [req.params.sellerId]);
    
    if (shops.length > 0 && shops[0].is_blocked === 1) {
        await connection.end();
        return res.status(403).json({ error: true, message: "Rất tiếc! Quán này hiện đang bị tạm khóa hoạt động bởi Quản trị viên." });
    }

    if (role !== 'seller' && (shops.length === 0 || shops[0].is_published === 0)) {
        await connection.end();
        return res.status(400).json({ error: true, message: "Rất tiếc! Quán này vừa mới ẩn khỏi sàn hoặc ngừng hoạt động." });
    }

    const [rows] = await connection.execute('SELECT * FROM menu WHERE seller_id = ? ORDER BY id DESC', [req.params.sellerId]);
    await connection.end();
    res.json({ error: false, foods: rows, shop: shops[0] || null, is_open: shops.length > 0 ? shops[0].is_open : 0 });
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
                full_name: users[0].full_name || '',
                address: users[0].address || '',
                shop_name: users[0].shop_name, shop_category: users[0].shop_category,
                is_published: !!users[0].is_published,
                is_open: !!users[0].is_open,
                avatar: users[0].avatar,
                is_blocked: !!users[0].is_blocked,
                ban_reason: users[0].ban_reason || ''
            } 
        });
    } else res.status(400).json({ success: false, message: "Sai email hoặc mật khẩu!" });
});

app.post('/api/register', async (req, res) => {
    const { email, phone, password, verifyMethod, role, shopName, shopCategory, shopDescription, shopAddress } = req.body;
    const userRole = role === 'seller' ? 'seller' : 'user'; 

    try {
        const connection = await mysql.createConnection(dbConfig);
        // Kiểm tra xem email hoặc SĐT đã tồn tại thật trong Database chưa
        const [existingUsers] = await connection.execute('SELECT * FROM users WHERE email = ? OR phone = ?', [email, phone]);
        await connection.end();

        if (existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: "Email hoặc SĐT đã tồn tại!" });
        }
        
        // Tạo OTP và lưu toàn bộ dữ liệu vào biến tạm (thời hạn 60 giây)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        tempUsers[email] = {
            data: { email, phone, password, userRole, shopName, shopCategory, shopDescription, shopAddress },
            otp: otp,
            expiresAt: Date.now() + 60000 // Hết hạn sau 60 giây (60000 ms)
        };

        console.log(`\n======================================================`);
        console.log(`🔑 [2FA ĐĂNG KÝ] MÃ OTP CHO [${email}]: ${otp}`);
        console.log(`======================================================\n`);
        
        res.json({ success: true, message: "Đã gửi mã OTP." });
    } catch (error) { 
        console.error("Lỗi đăng ký:", error);
        res.status(500).json({ success: false, message: "Lỗi kết nối cơ sở dữ liệu!" }); 
    }
});

app.post('/api/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    const pendingUser = tempUsers[email];

    // 1. Kiểm tra yêu cầu có tồn tại không
    if (!pendingUser) {
        return res.status(400).json({ success: false, message: "Không tìm thấy yêu cầu đăng ký hoặc đã bị hủy!" });
    }

    // 2. Kiểm tra thời hạn 60s
    if (Date.now() > pendingUser.expiresAt) {
        delete tempUsers[email]; // Xóa dữ liệu tạm
        return res.status(400).json({ success: false, message: "Mã OTP đã hết hạn! Vui lòng đăng ký lại." });
    }

    // 3. Kiểm tra tính hợp lệ của OTP
    if (pendingUser.otp === otp) {
        try {
            const u = pendingUser.data;
            const connection = await mysql.createConnection(dbConfig);
            
            // LƯU CHÍNH THỨC VÀO DATABASE VÀ ĐÁNH DẤU LÀ ĐÃ XÁC THỰC (is_verified = TRUE)
            await connection.execute(
                'INSERT INTO users (email, phone, password, role, shop_name, shop_category, shop_description, shop_address, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)', 
                [
                    u.email, u.phone, u.password, u.userRole, 
                    u.shopName || null, u.shopCategory || null, 
                    u.shopDescription || null, u.shopAddress || null
                ]
            );
            await connection.end();
            
            // Xóa rác trong RAM sau khi đã insert DB thành công
            delete tempUsers[email];
            
            res.json({ success: true, message: "Xác thực và tạo tài khoản thành công!" });
        } catch (error) {
            console.error("Lỗi insert DB:", error);
            res.status(500).json({ success: false, message: "Lỗi hệ thống khi lưu tài khoản!" });
        }
    } else {
        res.status(400).json({ success: false, message: "Mã OTP không hợp lệ!" });
    }
});

// API KIỂM TRA GIỎ HÀNG THỜI GIAN THỰC (GIÁ TIỀN, TỒN KHO, TRẠNG THÁI QUÁN)
app.post('/api/cart/verify', async (req, res) => {
    const { cart } = req.body;
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
        return res.json({ success: true, changedItems: [], unavailableItems: [] });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const foodIds = cart.map(item => item.id);
        const [menuRows] = await connection.execute(
            `SELECT m.id, m.name, m.price, m.is_sold_out, m.seller_id, u.shop_name, u.is_open, u.is_published 
             FROM menu m 
             JOIN users u ON m.seller_id = u.id 
             WHERE m.id IN (${foodIds.map(() => '?').join(',')})`,
            foodIds
        );
        await connection.end();

        const changedItems = [];
        const unavailableItems = [];

        for (const item of cart) {
            const dbItem = menuRows.find(r => r.id === item.id);
            if (!dbItem || dbItem.is_published === 0) {
                unavailableItems.push({ id: item.id, name: item.name, reason: "Món ăn hoặc quán đã ngừng hoạt động" });
            } else if (dbItem.is_open === 0) {
                unavailableItems.push({ id: item.id, name: dbItem.name, reason: "Quán đang tạm nghỉ" });
            } else if (dbItem.is_sold_out === 1) {
                unavailableItems.push({ id: item.id, name: dbItem.name, reason: "Món đã hết hàng" });
            } else if (Number(dbItem.price) !== Number(item.price)) {
                changedItems.push({
                    id: item.id,
                    name: dbItem.name,
                    oldPrice: Number(item.price),
                    newPrice: Number(dbItem.price)
                });
            }
        }

        res.json({ success: true, changedItems, unavailableItems });
    } catch (error) {
        console.error("Lỗi verify cart:", error);
        res.status(500).json({ success: false, message: "Lỗi kiểm tra giỏ hàng" });
    }
});

// API GỢI Ý MÓN HAY ĐƯỢC MUA KÈM
app.get('/api/recommendations', async (req, res) => {
    const { sellerId } = req.query;
    try {
        const connection = await mysql.createConnection(dbConfig);
        let foods = [];
        if (sellerId) {
            const [rows] = await connection.execute(
                'SELECT m.*, u.shop_name FROM menu m JOIN users u ON m.seller_id = u.id WHERE m.seller_id = ? AND m.is_sold_out = 0 AND u.is_open = 1 AND u.is_published = 1 LIMIT 8',
                [sellerId]
            );
            foods = rows;
        }

        // Nếu quán ít hơn 4 món, lấy thêm món từ các quán đang mở bán khác để danh sách phong phú
        if (foods.length < 4) {
            const [otherRows] = await connection.execute(
                'SELECT m.*, u.shop_name FROM menu m JOIN users u ON m.seller_id = u.id WHERE m.is_sold_out = 0 AND u.is_open = 1 AND u.is_published = 1 AND (? IS NULL OR m.seller_id != ?) ORDER BY RAND() LIMIT 6',
                [sellerId || null, sellerId || 0]
            );
            foods = [...foods, ...otherRows];
        }

        await connection.end();
        res.json({ success: true, recommendations: foods });
    } catch (error) {
        console.error("Lỗi lấy gợi ý món:", error);
        res.status(500).json({ success: false, recommendations: [] });
    }
});

app.post('/api/checkout', async (req, res) => {
    const { userId, cart, paymentMethod, note, voucherCode } = req.body; 
    try {
        const connection = await mysql.createConnection(dbConfig);

        // Kiểm tra xem tài khoản Người mua có đang bị khóa hay không
        if (userId) {
            const isBuyerBlocked = await checkUserBlocked(connection, userId);
            if (isBuyerBlocked) {
                await connection.end();
                return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa, không thể thực hiện đặt hàng!" });
            }
        }

        const foodIds = cart.map(item => item.id);
        
        const [menuRows] = await connection.execute(
            `SELECT id, name, price, is_sold_out, seller_id FROM menu WHERE id IN (${foodIds.map(() => '?').join(',')})`, 
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
            `SELECT id, shop_name, is_open, is_published, is_blocked FROM users WHERE id IN (${sellerIds.map(() => '?').join(',')})`, 
            sellerIds
        );
        
        const unavailableShops = shopRows.filter(shop => shop.is_open === 0 || shop.is_published === 0 || shop.is_blocked === 1);
        if (unavailableShops.length > 0) {
            await connection.end();
            const unavailableShopIds = unavailableShops.map(shop => shop.id);
            const invalidFoodIds = menuRows.filter(row => unavailableShopIds.includes(row.seller_id)).map(row => row.id);
            return res.status(400).json({ success: false, message: "Quán đang tạm nghỉ hoặc đang bị tạm khóa hoạt động.", invalidIds: invalidFoodIds });
        }

        const soldOutItems = menuRows.filter(row => row.is_sold_out === 1);
        if (soldOutItems.length > 0) {
            await connection.end();
            return res.status(400).json({ success: false, message: "Món đã hết hàng.", invalidIds: soldOutItems.map(item => item.id) });
        }

        // KIỂM TRA GIÁ TIỀN: NẾU SELLER VỪA ĐỔI GIÁ THÌ TỪ CHỐI THANH TOÁN THEO GIÁ CŨ VÀ BÁO LẠI CLIENT
        const priceChangedItems = [];
        for (const item of cart) {
            const dbItem = menuRows.find(row => row.id === item.id);
            if (dbItem && Number(dbItem.price) !== Number(item.price)) {
                priceChangedItems.push({
                    id: item.id,
                    name: dbItem.name,
                    oldPrice: Number(item.price),
                    newPrice: Number(dbItem.price)
                });
            }
        }

        if (priceChangedItems.length > 0) {
            await connection.end();
            return res.status(400).json({
                success: false,
                priceChanged: true,
                message: "Giá của một số món đã thay đổi. Giỏ hàng đã được cập nhật giá mới nhất!",
                changedItems: priceChangedItems
            });
        }

        // TÍNH TỔNG TIỀN THEO GIÁ CHÍNH THỨC TỪ DATABASE (CHỐNG GIAN LẬN GIÁ CŨ HOẶC SỬA GIÁ CLIENT)
        const verifiedTotalPrice = cart.reduce((sum, item) => {
            const dbItem = menuRows.find(row => row.id === item.id);
            return sum + (Number(dbItem.price) * Number(item.quantity || 1));
        }, 0);

        // XỬ LÝ VOUCHER & TÍNH TOÁN GIẢM GIÁ CHUẨN XÁC TỪ SERVER
        let serverDiscount = 0;
        let appliedVoucherCode = null;

        if (voucherCode) {
            const code = String(voucherCode).trim().toUpperCase();
            if (code === 'MBITE10') {
                serverDiscount = Math.min(30000, Math.round(verifiedTotalPrice * 0.1));
                appliedVoucherCode = 'MBITE10';
            } else if (code === 'FREESHIP' && verifiedTotalPrice >= 50000) {
                serverDiscount = 15000;
                appliedVoucherCode = 'FREESHIP';
            } else if (code === 'GIAM20K' && verifiedTotalPrice >= 100000) {
                serverDiscount = 20000;
                appliedVoucherCode = 'GIAM20K';
            } else if (code === 'SIEUTIEC50K' && verifiedTotalPrice >= 200000) {
                serverDiscount = 50000;
                appliedVoucherCode = 'SIEUTIEC50K';
            }
        }

        const baseShippingFee = 15000;
        const verifiedFinalPrice = Math.max(0, verifiedTotalPrice + baseShippingFee - serverDiscount);

        const sellerId = menuRows[0].seller_id;
        const updatedCartDetails = cart.map(item => {
            const dbItem = menuRows.find(row => row.id === item.id);
            return {
                ...item,
                name: dbItem.name,
                price: Number(dbItem.price)
            };
        });

        await connection.execute(
            'INSERT INTO orders (user_id, seller_id, cart_details, total_price, payment_method, note, voucher_code, discount_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                userId, 
                sellerId, 
                JSON.stringify(updatedCartDetails), 
                verifiedFinalPrice, 
                paymentMethod || 'COD',
                note ? String(note).trim() : null,
                appliedVoucherCode,
                serverDiscount
            ]
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

// Lấy danh sách đơn hàng của người mua (Buyer)
app.get('/api/user/orders', async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin người dùng!" });
    }
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [orders] = await connection.execute(
            `SELECT o.*, u.shop_name, u.phone AS shop_phone, u.address AS shop_address 
             FROM orders o 
             LEFT JOIN users u ON o.seller_id = u.id 
             WHERE o.user_id = ? 
             ORDER BY o.created_at DESC`,
            [userId]
        );
        await connection.end();
        res.json({ success: true, orders });
    } catch (error) {
        console.error("Lỗi lấy đơn hàng của user:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy đơn hàng!" });
    }
});

// Người mua (Buyer) hủy đơn hàng khi quán chưa duyệt và đã quá 5 phút chờ
app.post('/api/user/cancel-order', async (req, res) => {
    const { orderId, userId, cancel_reason } = req.body;
    if (!orderId || !userId) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin đơn hàng hoặc người dùng!" });
    }
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [orders] = await connection.execute(
            'SELECT id, user_id, status, created_at, payment_method, total_price FROM orders WHERE id = ?',
            [orderId]
        );

        if (orders.length === 0) {
            await connection.end();
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng!" });
        }

        const order = orders[0];
        if (Number(order.user_id) !== Number(userId)) {
            await connection.end();
            return res.status(403).json({ success: false, message: "Bạn không có quyền hủy đơn hàng này!" });
        }

        if (order.status !== 'pending') {
            await connection.end();
            return res.status(400).json({ 
                success: false, 
                message: order.status === 'cancelled' 
                    ? "Đơn hàng này đã bị hủy trước đó!" 
                    : "Quán đã tiếp nhận và đang chuẩn bị món, không thể hủy đơn!" 
            });
        }

        // Kiểm tra thời gian: phải quá 5 phút (300 giây, cho phép dung sai 10 giây = 290s)
        const orderTime = new Date(order.created_at).getTime();
        const elapsedSeconds = (Date.now() - orderTime) / 1000;
        const MIN_WAIT_SECONDS = 300; // 5 phút

        if (elapsedSeconds < MIN_WAIT_SECONDS) {
            const remainingSeconds = Math.ceil(MIN_WAIT_SECONDS - elapsedSeconds);
            const mins = Math.floor(remainingSeconds / 60);
            const secs = remainingSeconds % 60;
            await connection.end();
            return res.status(400).json({ 
                success: false, 
                message: `Quán đang trong thời gian tiếp nhận đơn (còn ${mins} phút ${secs} giây). Vui lòng đợi sau 5 phút nếu muốn hủy!` 
            });
        }

        const reason = cancel_reason && cancel_reason.trim() 
            ? `Khách hủy: ${cancel_reason.trim()}` 
            : 'Khách hủy đơn do quán không tiếp nhận sau 5 phút';

        await connection.execute(
            'UPDATE orders SET status = "cancelled", cancel_reason = ? WHERE id = ?',
            [reason, orderId]
        );
        await connection.end();

        res.json({
            success: true,
            message: "Đã hủy đơn hàng thành công!",
            is_qr: order.payment_method === 'CK'
        });
    } catch (error) {
        console.error("Lỗi khi user hủy đơn hàng:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi hủy đơn hàng!" });
    }
});

app.post('/api/seller/update-order-status', async (req, res) => {
    const { orderId, status, cancel_reason } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        if (cancel_reason !== undefined) {
            await connection.execute('UPDATE orders SET status = ?, cancel_reason = ? WHERE id = ?', [status, cancel_reason || null, orderId]);
        } else {
            await connection.execute('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
        }
        await connection.end();
        res.json({ success: true, message: status === 'cancelled' ? "Đã từ chối đơn hàng thành công!" : "Cập nhật trạng thái đơn thành công!" });
    } catch (error) {
        console.error("Lỗi update order status:", error);
        res.status(500).json({ success: false, message: "Lỗi khi cập nhật đơn hàng!" });
    }
});

app.post('/api/seller/toggle-shop', async (req, res) => {
    const { sellerId, is_published, is_open } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        if (await checkUserBlocked(connection, sellerId)) {
            await connection.end();
            return res.status(403).json({ success: false, message: "Tài khoản quán của bạn đã bị khóa bởi Quản trị viên!" });
        }
        await connection.execute('UPDATE users SET is_published = ?, is_open = ? WHERE id = ?', [is_published, is_open, sellerId]);
        await connection.end();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/seller/add-food', upload.single('image'), async (req, res) => {
    const { name, price, sellerId } = req.body;
    const imgUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : '';
    try {
        const connection = await mysql.createConnection(dbConfig);
        if (await checkUserBlocked(connection, sellerId)) {
            await connection.end();
            return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa bởi Quản trị viên, không thể thêm món!" });
        }
        await connection.execute('INSERT INTO menu (name, price, img, is_sold_out, seller_id) VALUES (?, ?, ?, false, ?)', [name, price, imgUrl, sellerId]);
        await connection.end();
        res.json({ success: true, message: "Thêm món thành công!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống!" });
    }
});

app.put('/api/seller/update-food/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, price } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [foods] = await connection.execute('SELECT seller_id FROM menu WHERE id = ?', [id]);
        if (foods.length > 0 && await checkUserBlocked(connection, foods[0].seller_id)) {
            await connection.end();
            return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa bởi Quản trị viên, không thể sửa món!" });
        }
        if (req.file) {
            const imgUrl = `http://localhost:5000/uploads/${req.file.filename}`;
            await connection.execute('UPDATE menu SET name = ?, price = ?, img = ? WHERE id = ?', [name, price, imgUrl, id]);
        } else {
            await connection.execute('UPDATE menu SET name = ?, price = ? WHERE id = ?', [name, price, id]);
        }
        await connection.end();
        res.json({ success: true, message: "Cập nhật thành công!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống!" });
    }
});

app.post('/api/seller/toggle-status', async (req, res) => {
    const { id, is_sold_out } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [foods] = await connection.execute('SELECT seller_id FROM menu WHERE id = ?', [id]);
        if (foods.length > 0 && await checkUserBlocked(connection, foods[0].seller_id)) {
            await connection.end();
            return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa bởi Quản trị viên!" });
        }
        await connection.execute('UPDATE menu SET is_sold_out = ? WHERE id = ?', [is_sold_out, id]);
        await connection.end();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.delete('/api/seller/delete-food/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [foods] = await connection.execute('SELECT seller_id FROM menu WHERE id = ?', [id]);
        if (foods.length > 0 && await checkUserBlocked(connection, foods[0].seller_id)) {
            await connection.end();
            return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa bởi Quản trị viên!" });
        }
        await connection.execute('DELETE FROM menu WHERE id = ?', [id]);
        await connection.end();
        res.json({ success: true, message: "Đã xóa món ăn thành công!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống!" });
    }
});

app.post('/api/seller/update-avatar', upload.single('avatar'), async (req, res) => {
    const { sellerId } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: "Vui lòng chọn ảnh!" });
    const avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    try {
        const connection = await mysql.createConnection(dbConfig);
        if (await checkUserBlocked(connection, sellerId)) {
            await connection.end();
            return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa bởi Quản trị viên!" });
        }
        await connection.execute('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, sellerId]);
        await connection.end();
        res.json({ success: true, avatarUrl, message: "Cập nhật thành công!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống!" });
    }
});

app.post('/api/seller/update-shop-info', async (req, res) => {
    const { sellerId, shopName, shopCategory, shopDescription, shopAddress, phone } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        if (await checkUserBlocked(connection, sellerId)) {
            await connection.end();
            return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa bởi Quản trị viên!" });
        }
        await connection.execute(
            'UPDATE users SET shop_name = ?, shop_category = ?, shop_description = ?, shop_address = ?, phone = ? WHERE id = ?',
            [shopName, shopCategory, shopDescription, shopAddress, phone, sellerId]
        );
        await connection.end();
        res.json({ success: true, message: "Cập nhật thông tin quán thành công!" });
    } catch (error) {
        console.error("Lỗi update shop info:", error);
        res.status(500).json({ success: false, message: "Lỗi kết nối cơ sở dữ liệu!" });
    }
});

app.post('/api/user/update-avatar', upload.single('avatar'), async (req, res) => {
    const { userId } = req.body;
    if (!req.file) {
        return res.status(400).json({ success: false, message: "Vui lòng chọn ảnh đại diện!" });
    }
    const avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, userId]);
        const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);
        await connection.end();

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng!" });
        }

        const updatedUser = {
            id: rows[0].id,
            email: rows[0].email,
            role: rows[0].role,
            phone: rows[0].phone,
            full_name: rows[0].full_name || '',
            address: rows[0].address || '',
            shop_name: rows[0].shop_name,
            shop_category: rows[0].shop_category,
            is_published: !!rows[0].is_published,
            is_open: !!rows[0].is_open,
            avatar: rows[0].avatar
        };

        res.json({ success: true, message: "Cập nhật ảnh đại diện thành công!", avatarUrl, user: updatedUser });
    } catch (error) {
        console.error("Lỗi cập nhật avatar:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi cập nhật ảnh đại diện!" });
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

// ==========================================
// CÁC API PROFILE & QUÁN YÊU THÍCH CHO BUYER
// ==========================================

// 1. Cập nhật thông tin tài khoản Buyer
app.post('/api/user/update-profile', async (req, res) => {
    const { userId, fullName, phone, address } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE users SET full_name = ?, phone = ?, address = ? WHERE id = ?',
            [fullName || null, phone || null, address || null, userId]
        );

        const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);
        await connection.end();

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng!" });
        }

        const updatedUser = {
            id: rows[0].id,
            email: rows[0].email,
            role: rows[0].role,
            phone: rows[0].phone,
            full_name: rows[0].full_name || '',
            address: rows[0].address || '',
            shop_name: rows[0].shop_name,
            shop_category: rows[0].shop_category,
            is_published: !!rows[0].is_published,
            is_open: !!rows[0].is_open,
            avatar: rows[0].avatar
        };

        res.json({ success: true, message: "Cập nhật hồ sơ thành công!", user: updatedUser });
    } catch (error) {
        console.error("Lỗi cập nhật hồ sơ:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi cập nhật hồ sơ!" });
    }
});

// 2. Đổi mật khẩu trực tiếp trong Profile
app.post('/api/user/change-password', async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);

        if (rows.length === 0) {
            await connection.end();
            return res.status(404).json({ success: false, message: "Tài khoản không tồn tại!" });
        }

        if (rows[0].password !== currentPassword) {
            await connection.end();
            return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không chính xác!" });
        }

        await connection.execute('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
        await connection.end();

        res.json({ success: true, message: "Đổi mật khẩu thành công!" });
    } catch (error) {
        console.error("Lỗi đổi mật khẩu:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi đổi mật khẩu!" });
    }
});

// 3. Thả tim / Bỏ thích quán (Toggle Favorite)
app.post('/api/favorites/toggle', async (req, res) => {
    const { userId, shopId } = req.body;
    if (!userId || !shopId) {
        return res.status(400).json({ success: false, message: "Thiếu userId hoặc shopId" });
    }
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [existing] = await connection.execute(
            'SELECT id FROM favorite_shops WHERE user_id = ? AND shop_id = ?',
            [userId, shopId]
        );

        let isFavorited = false;
        if (existing.length > 0) {
            await connection.execute(
                'DELETE FROM favorite_shops WHERE user_id = ? AND shop_id = ?',
                [userId, shopId]
            );
            isFavorited = false;
        } else {
            await connection.execute(
                'INSERT INTO favorite_shops (user_id, shop_id) VALUES (?, ?)',
                [userId, shopId]
            );
            isFavorited = true;
        }

        await connection.end();
        res.json({ 
            success: true, 
            isFavorited, 
            message: isFavorited ? "Đã thêm vào danh sách quán yêu thích!" : "Đã xóa khỏi danh sách quán yêu thích!" 
        });
    } catch (error) {
        console.error("Lỗi toggle favorite:", error);
        res.status(500).json({ success: false, message: "Lỗi khi lưu quán yêu thích!" });
    }
});

// 4. Kiểm tra trạng thái thích của 1 quán
app.get('/api/favorites/check', async (req, res) => {
    const { userId, shopId } = req.query;
    if (!userId || !shopId) {
        return res.json({ success: true, isFavorited: false });
    }
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT id FROM favorite_shops WHERE user_id = ? AND shop_id = ?',
            [userId, shopId]
        );
        await connection.end();
        res.json({ success: true, isFavorited: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ success: false, isFavorited: false });
    }
});

// 5. Lấy danh sách toàn bộ quán yêu thích của Buyer
app.get('/api/favorites', async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ success: false, message: "Thiếu userId" });
    }
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT u.id, u.shop_name, u.avatar, u.shop_category, u.shop_address, u.shop_description, u.is_open, u.is_published
             FROM favorite_shops f
             JOIN users u ON f.shop_id = u.id
             WHERE f.user_id = ? AND u.role = 'seller'
             ORDER BY f.created_at DESC`,
            [userId]
        );
        await connection.end();
        res.json({ success: true, shops: rows });
    } catch (error) {
        console.error("Lỗi lấy danh sách yêu thích:", error);
        res.status(500).json({ success: false, shops: [] });
    }
});

// ==========================================
// HỆ THỐNG QUẢN TRỊ ADMIN & PHÁT HÀNH VOUCHER
// ==========================================

// 1. Thống kê tổng quan cho Admin
app.get('/api/admin/stats', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [[userCounts]] = await connection.execute(`
            SELECT 
                COUNT(*) AS total_users,
                SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) AS total_buyers,
                SUM(CASE WHEN role = 'seller' THEN 1 ELSE 0 END) AS total_sellers,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS total_admins,
                SUM(CASE WHEN is_blocked = 1 THEN 1 ELSE 0 END) AS total_blocked
            FROM users
        `);
        const [[shopCounts]] = await connection.execute(`
            SELECT 
                COUNT(*) AS total_shops,
                SUM(CASE WHEN is_open = 1 THEN 1 ELSE 0 END) AS open_shops
            FROM users 
            WHERE role = 'seller' AND is_published = 1
        `);
        const [[orderCounts]] = await connection.execute(`
            SELECT 
                COUNT(*) AS total_orders,
                COALESCE(SUM(total_price), 0) AS total_revenue
            FROM orders
        `);
        const [[voucherCounts]] = await connection.execute(`
            SELECT 
                COUNT(*) AS total_vouchers,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_vouchers
            FROM vouchers
        `);
        await connection.end();

        res.json({
            success: true,
            stats: {
                users: userCounts,
                shops: shopCounts,
                orders: orderCounts,
                vouchers: voucherCounts
            }
        });
    } catch (error) {
        console.error("Lỗi lấy admin stats:", error);
        res.status(500).json({ success: false, message: "Lỗi lấy số liệu thống kê!" });
    }
});

// 2. Lấy danh sách toàn bộ người dùng
app.get('/api/admin/users', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [users] = await connection.execute(`
            SELECT id, email, phone, role, is_blocked, ban_reason, is_verified, full_name, avatar, 
                   shop_name, shop_category, is_open, is_published, created_at
            FROM users
            ORDER BY id DESC
        `);
        await connection.end();
        res.json({ success: true, users });
    } catch (error) {
        console.error("Lỗi lấy danh sách users:", error);
        res.status(500).json({ success: false, users: [] });
    }
});

// 2.1 Kiểm tra trạng thái tài khoản thời gian thực (Polling status & ban check)
app.get('/api/user/status', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'Thiếu userId' });
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [users] = await connection.execute('SELECT id, is_blocked, ban_reason, role FROM users WHERE id = ?', [userId]);
        await connection.end();
        if (users.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        res.json({ 
            success: true, 
            is_blocked: !!users[0].is_blocked, 
            ban_reason: users[0].ban_reason || '',
            role: users[0].role 
        });
    } catch (err) {
        console.error('Lỗi kiểm tra user status:', err);
        res.status(500).json({ success: false, message: 'Lỗi kiểm tra trạng thái' });
    }
});

// 3. Thay đổi vai trò người dùng (Nâng/Hạ quyền: user, seller, admin)
app.post('/api/admin/users/:id/role', async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!['user', 'seller', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: "Vai trò không hợp lệ!" });
    }
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        await connection.end();
        res.json({ success: true, message: `Đã cập nhật vai trò thành công sang [${role}]!` });
    } catch (error) {
        console.error("Lỗi cập nhật role:", error);
        res.status(500).json({ success: false, message: "Lỗi khi cập nhật vai trò!" });
    }
});

// 4. Khóa / Mở khóa người dùng (Toggle is_blocked & ban_reason)
app.post('/api/admin/users/:id/toggle-block', async (req, res) => {
    const { id } = req.params;
    const { ban_reason } = req.body || {};
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [users] = await connection.execute('SELECT id, is_blocked, role FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            await connection.end();
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng!" });
        }
        
        // Không cho phép tự khóa tài khoản admin chính
        if (users[0].role === 'admin' && users[0].id === 19) {
            await connection.end();
            return res.status(400).json({ success: false, message: "Không thể khóa tài khoản Quản trị viên tối cao!" });
        }

        const newBlockedStatus = users[0].is_blocked ? 0 : 1;
        if (newBlockedStatus === 1) {
            const reason = ban_reason && ban_reason.trim() ? ban_reason.trim() : 'Vi phạm điều khoản & quy tắc cộng đồng';
            await connection.execute('UPDATE users SET is_blocked = 1, ban_reason = ? WHERE id = ?', [reason, id]);
        } else {
            await connection.execute('UPDATE users SET is_blocked = 0, ban_reason = NULL WHERE id = ?', [id]);
        }
        await connection.end();

        res.json({ 
            success: true, 
            isBlocked: !!newBlockedStatus,
            ban_reason: newBlockedStatus ? (ban_reason || 'Vi phạm điều khoản & quy tắc cộng đồng') : null,
            message: newBlockedStatus ? "Đã khóa tài khoản người dùng!" : "Đã mở khóa tài khoản thành công!"
        });
    } catch (error) {
        console.error("Lỗi toggle block user:", error);
        res.status(500).json({ success: false, message: "Lỗi khi khóa/mở khóa tài khoản!" });
    }
});

// 4.1 Người dùng gửi đơn khiếu nại / giải trình minh oan
app.post('/api/appeal/submit', async (req, res) => {
    const { userId, email, appeal_reason, evidence_info } = req.body;
    if (!userId || !appeal_reason || !appeal_reason.trim()) {
        return res.status(400).json({ success: false, message: "Vui lòng nhập nội dung giải trình/minh oan!" });
    }
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(`
            INSERT INTO ban_appeals (user_id, email, appeal_reason, evidence_info, status)
            VALUES (?, ?, ?, ?, 'pending')
        `, [userId, email || '', appeal_reason.trim(), evidence_info ? evidence_info.trim() : '']);
        await connection.end();
        res.json({ success: true, message: "Đã gửi đơn minh oan thành công! Admin sẽ sớm xem xét phản hồi." });
    } catch (error) {
        console.error("Lỗi gửi khiếu nại:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi gửi khiếu nại!" });
    }
});

// 4.2 Người dùng xem lịch sử khiếu nại của mình
app.get('/api/appeal/my-appeals', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: "Thiếu userId" });
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT * FROM ban_appeals WHERE user_id = ? ORDER BY id DESC',
            [userId]
        );
        await connection.end();
        res.json({ success: true, appeals: rows });
    } catch (error) {
        console.error("Lỗi lấy danh sách khiếu nại của user:", error);
        res.status(500).json({ success: false, appeals: [] });
    }
});

// 4.3 Admin xem danh sách toàn bộ khiếu nại
app.get('/api/admin/appeals', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [appeals] = await connection.execute(`
            SELECT a.*, u.full_name, u.phone, u.role, u.is_blocked
            FROM ban_appeals a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.id DESC
        `);
        await connection.end();
        res.json({ success: true, appeals });
    } catch (error) {
        console.error("Lỗi lấy danh sách khiếu nại cho admin:", error);
        res.status(500).json({ success: false, appeals: [] });
    }
});

// 4.4 Admin xử lý khiếu nại (Chấp nhận mở khóa hoặc Từ chối)
app.post('/api/admin/appeals/:id/resolve', async (req, res) => {
    const { id } = req.params;
    const { action, admin_response, userId } = req.body;
    if (!['approved', 'rejected'].includes(action)) {
        return res.status(400).json({ success: false, message: "Hành động không hợp lệ!" });
    }
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(`
            UPDATE ban_appeals 
            SET status = ?, admin_response = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [action, admin_response ? admin_response.trim() : '', id]);

        if (action === 'approved' && userId) {
            await connection.execute(`
                UPDATE users 
                SET is_blocked = 0, ban_reason = NULL 
                WHERE id = ?
            `, [userId]);
        }
        await connection.end();

        res.json({ 
            success: true, 
            message: action === 'approved' ? 'Đã duyệt minh oan và mở khóa tài khoản thành công!' : 'Đã từ chối đơn khiếu nại!' 
        });
    } catch (error) {
        console.error("Lỗi xử lý khiếu nại:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi xử lý khiếu nại!" });
    }
});

// 5. Lấy danh sách toàn bộ voucher (Admin)
app.get('/api/admin/vouchers', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [vouchers] = await connection.execute('SELECT * FROM vouchers ORDER BY id DESC');
        await connection.end();
        res.json({ success: true, vouchers });
    } catch (error) {
        console.error("Lỗi lấy danh sách vouchers:", error);
        res.status(500).json({ success: false, vouchers: [] });
    }
});

// 6. Admin tạo voucher mới
app.post('/api/admin/vouchers', async (req, res) => {
    const { 
        code, name, description, discount_type, discount_value, 
        max_discount, min_order, usage_limit, expires_at, is_active 
    } = req.body;

    if (!code || !name || !discount_value) {
        return res.status(400).json({ success: false, message: "Vui lòng điền đủ mã, tên và mức giảm!" });
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [existing] = await connection.execute('SELECT id FROM vouchers WHERE code = ?', [cleanCode]);
        if (existing.length > 0) {
            await connection.end();
            return res.status(400).json({ success: false, message: `Mã voucher [${cleanCode}] đã tồn tại!` });
        }

        await connection.execute(`
            INSERT INTO vouchers (code, name, description, discount_type, discount_value, max_discount, min_order, usage_limit, expires_at, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            cleanCode, name.trim(), description || '', discount_type || 'fixed', 
            Number(discount_value), Number(max_discount) || 0, Number(min_order) || 0, 
            Number(usage_limit) || 100, expires_at || null, is_active !== false ? 1 : 0
        ]);
        await connection.end();

        res.json({ success: true, message: `Đã phát hành voucher [${cleanCode}] thành công!` });
    } catch (error) {
        console.error("Lỗi tạo voucher:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi tạo voucher!" });
    }
});

// 7. Admin chỉnh sửa voucher
app.put('/api/admin/vouchers/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        code, name, description, discount_type, discount_value, 
        max_discount, min_order, usage_limit, expires_at, is_active 
    } = req.body;

    const cleanCode = code ? code.trim().toUpperCase().replace(/\s+/g, '') : '';

    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(`
            UPDATE vouchers 
            SET code = ?, name = ?, description = ?, discount_type = ?, discount_value = ?,
                max_discount = ?, min_order = ?, usage_limit = ?, expires_at = ?, is_active = ?
            WHERE id = ?
        `, [
            cleanCode, name.trim(), description || '', discount_type || 'fixed', 
            Number(discount_value), Number(max_discount) || 0, Number(min_order) || 0, 
            Number(usage_limit) || 100, expires_at || null, is_active ? 1 : 0, id
        ]);
        await connection.end();
        res.json({ success: true, message: "Đã cập nhật thông tin voucher thành công!" });
    } catch (error) {
        console.error("Lỗi sửa voucher:", error);
        res.status(500).json({ success: false, message: "Lỗi cập nhật voucher!" });
    }
});

// 8. Admin Bật / Tắt trạng thái voucher
app.patch('/api/admin/vouchers/:id/toggle', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT id, is_active FROM vouchers WHERE id = ?', [id]);
        if (rows.length === 0) {
            await connection.end();
            return res.status(404).json({ success: false, message: "Không tìm thấy voucher!" });
        }
        const newActive = rows[0].is_active ? 0 : 1;
        await connection.execute('UPDATE vouchers SET is_active = ? WHERE id = ?', [newActive, id]);
        await connection.end();
        res.json({ success: true, isActive: !!newActive, message: newActive ? "Đã kích hoạt voucher!" : "Đã tạm dừng voucher!" });
    } catch (error) {
        console.error("Lỗi toggle voucher:", error);
        res.status(500).json({ success: false, message: "Lỗi khi cập nhật trạng thái voucher!" });
    }
});

// 9. Admin xóa voucher
app.delete('/api/admin/vouchers/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM vouchers WHERE id = ?', [id]);
        await connection.end();
        res.json({ success: true, message: "Đã xóa voucher thành công!" });
    } catch (error) {
        console.error("Lỗi xóa voucher:", error);
        res.status(500).json({ success: false, message: "Lỗi khi xóa voucher!" });
    }
});

// 10. API lấy voucher đang hoạt động cho Người mua (Checkout)
app.get('/api/vouchers/active', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT id, code, name, description, discount_type, discount_value, 
                   max_discount, min_order, usage_limit, used_count, expires_at
            FROM vouchers
            WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())
            ORDER BY id DESC
        `);
        await connection.end();
        res.json({ success: true, vouchers: rows });
    } catch (error) {
        console.error("Lỗi lấy voucher active:", error);
        res.status(500).json({ success: false, vouchers: [] });
    }
});

const server = app.listen(5000, (err) => {
    if (err) {
        if (err.code === 'EADDRINUSE') {
            console.error('\n❌ [LỖI KHỞI ĐỘNG]: Cổng 5000 đang bị chiếm dụng bởi một ứng dụng hoặc tiến trình khác!');
            console.error('👉 Vui lòng kiểm tra và tắt tiến trình đang chạy port 5000 trước khi chạy lại.\n');
        } else {
            console.error('❌ Lỗi khởi động server:', err);
        }
        process.exit(1);
    }
    console.log('🚀 Backend M-Bite đang chạy thành công ở port 5000...');
});