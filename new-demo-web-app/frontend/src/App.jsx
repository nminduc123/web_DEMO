import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register'; // <-- 1. Import trang Đăng ký (đường dẫn tùy theo thư mục của ông)
import ForgotPassword from './pages/ForgotPassword';
import Seller from './pages/Seller';

export default function App() {
    // Khởi tạo state đọc trực tiếp từ localStorage để không bị mất khi F5
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // Đồng bộ currentUser vào localStorage mỗi khi state thay đổi
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('user', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('user');
        }
    }, [currentUser]);

    const isSeller = currentUser?.role === 'seller';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            <Header currentUser={currentUser} setCurrentUser={setCurrentUser} />
            
            <main style={{ flex: 1, backgroundColor: isSeller ? '#1a1a1a' : '#f5f5f5' }}>
                <Routes>
                    {isSeller ? (
                        /* Tài khoản seller: Chỉ có duy nhất 1 giao diện quản lý nhà hàng */
                        <>
                            <Route path="/seller" element={<Seller currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
                            {/* Tất cả các route khác (kể cả '/') đều tự động chuyển hướng về /seller */}
                            <Route path="*" element={<Navigate to="/seller" replace />} />
                        </>
                    ) : (
                        /* Tài khoản khách / người dùng / chưa đăng nhập */
                        <>
                            <Route path="/" element={<Home currentUser={currentUser} />} />
                            
                            {/* Các trang xác thực */}
                            <Route path="/login" element={<Login setCurrentUser={setCurrentUser} />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            
                            {/* Chừa chỗ cho các trang tiếp theo */}
                            <Route path="/checkout" element={<h2 style={{textAlign: 'center', padding: '50px 0'}}>Trang Giỏ hàng (Sắp làm)</h2>} />
                            <Route path="/shop/:id" element={<h2 style={{textAlign: 'center', padding: '50px 0'}}>Trang Menu Của Quán (Sắp làm)</h2>} />

                            {/* Trang quản lý của quán */}
                            <Route path="/seller" element={<Seller currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </>
                    )}
                </Routes>
            </main>
            
            {/* Ẩn footer khách khi tài khoản là seller */}
            {!isSeller && <Footer />}
        </div>
    );
}