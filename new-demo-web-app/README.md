# 🍔 M-Bite Food Delivery Web App

Dự án ứng dụng đặt đồ ăn trực tuyến M-Bite (Fullstack: Node.js/Express + React/Vite + MySQL).

---

## 🚀 Hướng dẫn cài đặt và chạy trên máy mới

### 1. Chuẩn bị môi trường
- Cài đặt **Node.js** (khuyến nghị v18 hoặc v20+).
- Cài đặt **MySQL Server** (hoặc dùng **XAMPP / Laragon**).

---

### 2. Cài đặt Cơ sở dữ liệu (Database)

Hệ thống cung cấp sẵn 2 lựa chọn CSDL trong thư mục `db/`:

- **Lựa chọn 1: CSDL Mới Sạch (Khuyên dùng) - `db/food_app.sql`**
  - Đầy đủ cấu trúc bảng và hệ thống voucher sàn mặc định.
  - **Không chứa bất kỳ tài khoản người dùng cũ nào**.
  - **Chỉ có duy nhất tài khoản Quản trị viên tối cao cố định**: `admin@mbite.com` (mật khẩu: `admin123`, ID #0).
  - Bạn có thể tự do bấm **Đăng ký** trên web để tạo các tài khoản Khách hàng (Buyer) hoặc Chủ quán (Seller) mới theo ý muốn.
  
- **Lựa chọn 2: CSDL Kèm Dữ Liệu Thử Nghiệm Mẫu - `db/sample_data.sql` (Tùy chọn)**
  - Chứa sẵn 2 quán ăn có thực đơn ("Bếp Ăn Đêm", "Minh"), các tài khoản khách hàng và đơn hàng mẫu để test nhanh mà không cần tạo quán.

#### Hướng dẫn import:
- **Cách 1: Dùng phpMyAdmin / Laragon**
  1. Mở phpMyAdmin (`http://localhost/phpmyadmin`).
  2. Bấm vào tab **Import** (Nhập).
  3. Chọn file `db/food_app.sql` (hoặc `db/sample_data.sql` nếu muốn nạp dữ liệu mẫu) và bấm **Import**.

- **Cách 2: Dùng dòng lệnh (Terminal / PowerShell)**
  ```bash
  mysql -u root -p < db/food_app.sql
  ```
  *(Nếu MySQL root không đặt mật khẩu: `mysql -u root < db/food_app.sql`)*

---

### 3. Khởi chạy Backend (Port 5000)
Mở một cửa sổ Terminal tại thư mục gốc của dự án:
```bash
cd backend
npm install
npm start
```
> Backend sẽ chạy tại: `http://localhost:5000`  
> *(Hệ thống Backend có cơ chế tự động kiểm tra và khởi tạo tài khoản Admin tối cao nếu phát hiện CSDL trống).*

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

## 🔑 Tài khoản Quản trị viên (Cố định sẵn có)

| Vai trò (Role) | Email đăng nhập | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **🛡️ Quản trị viên (Admin)** | `admin@mbite.com` | `admin123` | ID #0. Toàn quyền quản lý: Phân quyền, Khóa/Mở tài khoản, Phát hành voucher sàn, Duyệt phản hồi người dùng. |

> 💡 **Tạo thêm tài khoản**: Bấm nút **Đăng ký** trên trang web (`/register`) để tự tạo tài khoản **Khách hàng** hoặc **Chủ quán (Seller)**.  
> *(Nếu trước đó bạn import `db/sample_data.sql`, bạn có thể dùng thêm các tài khoản mẫu: Chủ quán `1@4.com` (pass `4`), `1@3.com` (pass `3`); Khách hàng `1@2.com` (pass `2`))*.

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
