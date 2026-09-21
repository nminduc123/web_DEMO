import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register'; // <-- 1. Import trang Đăng ký (đường dẫn tùy theo thư mục của ông)
import ForgotPassword from './pages/ForgotPassword';

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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            <Header currentUser={currentUser} setCurrentUser={setCurrentUser} />
            
            <main style={{ flex: 1, backgroundColor: '#f5f5f5', padding: '30px 0' }}>
                <Routes>
                    {/* Truyền currentUser xuống cho Home để check khi click vào quán */}
                    <Route path="/" element={<Home currentUser={currentUser} />} />
                    
                    {/* Các trang xác thực */}
                    <Route path="/login" element={<Login setCurrentUser={setCurrentUser} />} />
                    <Route path="/register" element={<Register />} /> {/* <-- 2. Thêm route Đăng ký vào đây */}
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    
                    {/* Chừa chỗ cho các trang tiếp theo */}
                    <Route path="/checkout" element={<h2 style={{textAlign: 'center'}}>Trang Giỏ hàng (Sắp làm)</h2>} />
                    <Route path="/shop/:id" element={<h2 style={{textAlign: 'center'}}>Trang Menu Của Quán (Sắp làm)</h2>} />
                </Routes>
            </main>
            
            <Footer />
        </div>
    );
}