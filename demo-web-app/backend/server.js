const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = { host: 'localhost', user: 'root', password: '', database: 'food_app' };
const otpStorage = {};

// 1. API Lấy danh sách món ăn
app.get('/api/foods', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM menu ORDER BY id DESC'); 
    await connection.end();
    res.json(rows);
});

// 2. API Đăng nhập (Trả về role)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    await connection.end();

    if (users.length > 0) {
        if (!users[0].is_verified) return res.status(400).json({ success: false, message: "Tài khoản chưa xác thực OTP!" });
        res.json({ success: true, user: { id: users[0].id, email: users[0].email, role: users[0].role } });
    } else {
        res.status(400).json({ success: false, message: "Sai email hoặc mật khẩu!" });
    }
});

// 3. API Đăng ký & Tạo OTP
app.post('/api/register', async (req, res) => {
    const { email, phone, password, verifyMethod } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('INSERT INTO users (email, phone, password) VALUES (?, ?, ?)', [email, phone, password]);
        await connection.end();
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStorage[email] = otp;
        console.log(`\n🔑 [2FA] Đang gửi OTP qua ${verifyMethod.toUpperCase()} cho [${email}]: ${otp}\n`);
        res.json({ success: true, message: "Đã gửi mã OTP." });
    } catch (error) {
        res.status(400).json({ success: false, message: "Email hoặc SĐT đã tồn tại!" });
    }
});

// 4. API Xác thực OTP
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

// 5. API Quên mật khẩu
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
    await connection.end();

    if (users.length === 0) return res.status(404).json({ success: false, message: "Email không tồn tại!" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage[email] = otp;
    console.log(`\n🔑 [QUÊN MẬT KHẨU] Mã OTP khôi phục cho [${email}]: ${otp}\n`);
    res.json({ success: true, message: "Đã gửi mã OTP khôi phục." });
});

// 6. API Đổi mật khẩu
app.post('/api/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (otpStorage[email] === otp) {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('UPDATE users SET password = ? WHERE email = ?', [newPassword, email]);
        await connection.end();
        delete otpStorage[email];
        res.json({ success: true, message: "Đổi mật khẩu thành công!" });
    } else {
        res.status(400).json({ success: false, message: "Mã OTP sai hoặc hết hạn!" });
    }
});

// 7. API Checkout (Giỏ hàng)
// 7. API Checkout (Giỏ hàng) - BẢN NÂNG CẤP CHẶN LỖI HẾT HÀNG
app.post('/api/checkout', async (req, res) => {
    const { userId, cart } = req.body;
    
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Lấy danh sách ID của các món ăn trong giỏ
        const foodIds = cart.map(item => item.id);
        
        // Query kiểm tra trạng thái 'is_sold_out' MỚI NHẤT thẳng từ DB
        const [menuRows] = await connection.execute(
            `SELECT id, name, is_sold_out FROM menu WHERE id IN (${foodIds.map(() => '?').join(',')})`,
            foodIds
        );
        await connection.end();

        // Lọc ra xem có món nào bị Seller chuyển sang Hết hàng không
        const soldOutItems = menuRows.filter(row => row.is_sold_out === 1);
        
        if (soldOutItems.length > 0) {
            // Nếu có món hết hàng -> Chặn thanh toán và báo lỗi
            const soldOutNames = soldOutItems.map(item => item.name).join(', ');
            return res.status(400).json({ 
                success: false, 
                message: `Thanh toán thất bại!\n\nMón "${soldOutNames}" vừa mới hết hàng. Vui lòng quay lại Giỏ hàng để xóa món này trước khi thanh toán.`
            });
        }

        // Nếu mọi thứ trong kho vẫn ổn -> Cho phép thanh toán
        res.json({ success: true, message: "Đặt hàng thành công! Đơn của bạn đang được giao." });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi thanh toán!" });
    }
});

// ==========================================
// CÁC API DÀNH CHO SELLER
// ==========================================
app.post('/api/seller/add-food', async (req, res) => {
    const { name, price, img } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('INSERT INTO menu (name, price, img, is_sold_out) VALUES (?, ?, ?, false)', [name, price, img]);
    await connection.end();
    res.json({ success: true, message: "Thêm món thành công!" });
});

app.post('/api/seller/toggle-status', async (req, res) => {
    const { id, is_sold_out } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('UPDATE menu SET is_sold_out = ? WHERE id = ?', [is_sold_out, id]);
    await connection.end();
    res.json({ success: true });
});

// Xóa món ăn khỏi Menu
app.delete('/api/seller/delete-food/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await mysql.createConnection(dbConfig);
    // Chạy lệnh SQL xóa dòng có id tương ứng
    await connection.execute('DELETE FROM menu WHERE id = ?', [id]);
    await connection.end();
    
    console.log(`-> [BE] Seller vừa xóa vĩnh viễn món có ID: ${id}`);
    res.json({ success: true, message: "Đã xóa món ăn thành công!" });
});

// Cập nhật thông tin món ăn
app.put('/api/seller/update-food/:id', async (req, res) => {
    const { id } = req.params;
    const { name, price, img } = req.body;
    
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE menu SET name = ?, price = ?, img = ? WHERE id = ?',
            [name, price, img, id]
        );
        await connection.end();
        console.log(`-> [BE] Seller vừa cập nhật thông tin món ID: ${id}`);
        res.json({ success: true, message: "Cập nhật món ăn thành công!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống!" });
    }
});

app.listen(5000, () => console.log('Backend đang chạy ở port 5000...'));