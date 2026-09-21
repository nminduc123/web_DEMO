# 🍔 M-Bite Food Delivery Web App

Dự án ứng dụng đặt đồ ăn trực tuyến M-Bite (Fullstack: Node.js/Express + React/Vite + MySQL).

---

## 🚀 Hướng dẫn cài đặt và chạy trên máy mới

### 1. Chuẩn bị môi trường
- Cài đặt **Node.js** (khuyến nghị v18 hoặc v20+).
- Cài đặt **MySQL Server** (hoặc dùng **XAMPP / Laragon**).

---

### 2. Cài đặt Cơ sở dữ liệu (Database)
File cơ sở dữ liệu đã được xuất đầy đủ cấu trúc bảng và toàn bộ dữ liệu mẫu (Admin, Seller, Buyer, Menu, Voucher, Đơn hàng) tại thư mục `db/food_app.sql`.

- **Cách 1: Dùng phpMyAdmin / Laragon**
  1. Mở phpMyAdmin (`http://localhost/phpmyadmin`).
  2. Bấm vào tab **Import** (Nhập).
  3. Chọn file `db/food_app.sql` trong thư mục dự án và bấm **Import** (hoặc tạo database `food_app` rồi import).

- **Cách 2: Dùng dòng lệnh (Terminal / PowerShell)**
  ```bash
  mysql -u root -p < db/food_app.sql
  ```
  *(Nếu root không có mật khẩu thì chỉ cần gõ `mysql -u root < db/food_app.sql`)*

---

### 3. Khởi chạy Backend (Port 5000)
Mở một cửa sổ Terminal tại thư mục gốc của dự án:
```bash
cd backend
npm install
npm start
```
> Backend sẽ chạy tại: `http://localhost:5000`

---

### 4. Khởi chạy Frontend (Port 5173)
Mở một cửa sổ Terminal thứ hai tại thư mục gốc của dự án:
```bash
cd frontend
npm install
npm run dev
```
> Frontend sẽ chạy tại: `http://localhost:5173`

---

## 🔑 Danh sách tài khoản thử nghiệm

| Vai trò (Role) | Email đăng nhập | Mật khẩu | Mô tả quyền hạn |
| :--- | :--- | :--- | :--- |
| **🛡️ Quản trị viên (Admin)** | `admin@mbite.com` | `admin123` | Toàn quyền quản lý: Phân quyền, Khóa/Mở tài khoản, Phát hành voucher sàn, Duyệt đơn giải trình/minh oan. |
| **👨‍🍳 Chủ quán (Seller)** | `1@4.com` | `4` | Kênh quản lý nhà hàng: Quản lý thực đơn món ăn, Cài đặt quán, Duyệt/Từ chối đơn hàng kèm lý do, Thống kê doanh thu. |
| **👨‍🍳 Chủ quán (Seller 2)** | `1@3.com` | `3` | Quán thứ hai trên hệ thống. |
| **🛒 Khách hàng (Buyer)** | `1@2.com` | `2` | Khách mua hàng: Chọn món, Đặt hàng (COD / VietQR), Theo dõi tiến độ tại "Đơn hàng của tôi", Hủy đơn sau 5 phút và nhận thông báo hoàn tiền VietQR. |
| **🛒 Khách hàng (Buyer 2)**| `1@5.com` | `5` | Tài khoản khách hàng mẫu khác. |

---

## 🛠️ Công nghệ sử dụng
- **Backend**: Node.js, Express.js, MySQL2, Multer (xử lý upload ảnh), CORS.
- **Frontend**: React 18, Vite, React Router DOM, Toast Context, CSS Module/Inline Styling hiện đại chuẩn Dark Theme.
- **Database**: MySQL (`food_app`), lưu trữ các bảng: `users`, `menu`, `orders`, `vouchers`, `ban_appeals`, `favorite_shops`.
