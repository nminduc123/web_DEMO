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
| **🛡️ Quản trị viên (Admin)** | `admin@mbite.com` | `admin123` | ID #0. Toàn quyền quản lý: Phân quyền, Khóa/Mở tài khoản, Phát hành voucher sàn (phần trăm / tiền mặt), Duyệt phản hồi người dùng. |
| **👨‍🍳 Chủ quán (Seller 1)** | `1@4.com` | `4` | Quán "Bếp Ăn Đêm": Quản lý món ăn, cập nhật giá/hết hàng/bật tắt món, Duyệt & xác nhận giao đơn hàng, Thống kê doanh thu. |
| **👨‍🍳 Chủ quán (Seller 2)** | `1@3.com` | `3` | Quán "Minh": Quán ăn thứ hai trên hệ thống. |
| **🛒 Khách hàng (Buyer 1)** | `1@2.com` | `2` | Khách mua hàng: Săn voucher, Lưu voucher vào ví (mỗi acc dùng 1 lần), Thêm giỏ hàng, Đặt món COD/VietQR, Theo dõi đơn và hủy đơn sau 5 phút. |
| **🛒 Khách hàng (Buyer 2)** | `1@5.com` | `5` | Tài khoản khách hàng mẫu khác. |

---

## ✨ Tính năng nổi bật đã tích hợp hoàn chỉnh
1. **Quản trị viên toàn quyền (`/admin`)**:
   - Giao diện Admin Control Center tối giản, hiện đại với bố cục thanh menu trái (Sidebar) trực quan.
   - Quản trị viên tối cao mang `ID: #0`, được ẩn khỏi danh sách thành viên tự do và được bảo vệ tuyệt đối (không thể tự khóa hoặc bị đổi quyền).
   - Quản lý phân quyền người dùng (Buyer / Seller / Admin).
   - Phát hành voucher sàn, bật/tắt kích hoạt, xóa voucher.
   - Hộp thư xử lý phản hồi/khiếu nại từ người dùng bị khóa tài khoản.
2. **Kênh Nhà hàng (`/seller`)**:
   - Quản lý thực đơn: Thêm/Sửa/Xóa món ăn, gắn tag gợi ý (Phổ biến, Bán chạy, Mới).
   - Kiểm soát đơn hàng theo luồng chuẩn: *Chờ xác nhận -> Đang chuẩn bị -> Đã giao xong / Từ chối*.
   - Báo cáo doanh thu và đơn hàng thời gian thực.
3. **Kênh Người mua (`/`, `/shop/:id`, `/checkout`, `/my-orders`, `/my-vouchers`)**:
   - Danh mục "Voucher" trên Header để săn và lưu voucher vào Ví cá nhân.
   - Ví voucher (`/my-vouchers`) trong dropdown người dùng: Tự động lưu voucher, xóa voucher khỏi ví ngay sau khi đặt hàng (mỗi tài khoản chỉ được sử dụng 1 lần duy nhất).
   - Quán yêu thích (Thả tim và quản lý quán yêu thích trong Profile).
   - Theo dõi đơn hàng theo thời gian thực tại "Đơn hàng của tôi".
   - Tự động phát hiện tài khoản bị khóa và hiển thị màn hình gửi ý kiến phản hồi tới Admin.

---

## 🛠️ Công nghệ sử dụng
- **Backend**: Node.js, Express.js, MySQL2, Multer (xử lý upload ảnh), CORS.
- **Frontend**: React 19, Vite, React Router DOM v7, Toast Context, SVG Icon System.
- **Database**: MySQL (`food_app`), lưu trữ các bảng: `users`, `menu`, `orders`, `vouchers`, `user_vouchers`, `favorite_shops`, `ban_appeals`.
