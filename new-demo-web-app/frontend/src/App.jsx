import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Seller from './pages/Seller';
import ShopDetail from './pages/ShopDetail';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import MyOrders from './pages/MyOrders';
import MyVouchers from './pages/MyVouchers';
import BannedScreen from './components/BannedScreen';
import { ShieldAlertIcon } from './components/Icons';

export default function App() {
    // Khởi tạo state ưu tiên đọc từ sessionStorage (cô lập riêng biệt cho từng tab)
    // Nếu tab mới mở chưa có session thì mới lấy từ localStorage (nếu trước đó có chọn ghi nhớ)
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const fixAdminUser = (u) => {
                if (u && (u.email === 'admin@mbite.com' || u.role === 'admin')) {
                    u.id = 0;
                    u.role = 'admin';
                }
                return u;
            };

            const sessionUser = sessionStorage.getItem('user');
            if (sessionUser) {
                const u = fixAdminUser(JSON.parse(sessionUser));
                sessionStorage.setItem('user', JSON.stringify(u));
                return u;
            }

            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                const u = fixAdminUser(JSON.parse(savedUser));
                sessionStorage.setItem('user', JSON.stringify(u));
                localStorage.setItem('user', JSON.stringify(u));
                return u;
            }
        } catch (e) {
            console.error("Lỗi đọc dữ liệu người dùng:", e);
        }
        return null;
    });

    // Quản lý giỏ hàng
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('foodAppCart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('foodAppCart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (food, shop) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === food.id);
            if (existing) {
                return prev.map(item => item.id === food.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item);
            }
            return [...prev, { ...food, quantity: 1, shopName: shop?.shop_name || 'Quán ăn' }];
        });
    };

    const updateQuantity = (foodId, delta) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.id === foodId) {
                    const newQty = (item.quantity || 1) + delta;
                    return newQty > 0 ? { ...item, quantity: newQty } : null;
                }
                return item;
            }).filter(Boolean);
        });
    };

    const removeFromCart = (foodId) => {
        setCart(prev => prev.filter(item => item.id !== foodId));
    };

    const updateCartPrices = (changedItems) => {
        setCart(prev => {
            return prev.map(item => {
                const found = changedItems.find(c => c.id === item.id);
                if (found) {
                    return { ...item, price: found.newPrice };
                }
                return item;
            });
        });
    };

    const clearCart = () => setCart([]);

    // Đồng bộ currentUser vào sessionStorage của riêng tab hiện tại
    useEffect(() => {
        if (currentUser) {
            sessionStorage.setItem('user', JSON.stringify(currentUser));
            // Chỉ đồng bộ sang localStorage nếu localStorage đang lưu chính tài khoản này
            const localUserStr = localStorage.getItem('user');
            if (localUserStr) {
                try {
                    const localUser = JSON.parse(localUserStr);
                    if (localUser.id === currentUser.id || (localUser.email && localUser.email === currentUser.email)) {
                        localStorage.setItem('user', JSON.stringify(currentUser));
                    }
                } catch (e) {}
            }
        } else {
            sessionStorage.removeItem('user');
        }
    }, [currentUser]);

    // Kiểm tra trạng thái tài khoản thời gian thực (real-time ban detection & unlock sync)
    useEffect(() => {
        if (!currentUser || (currentUser.id === undefined && currentUser.id === null && !currentUser.email)) return;

        const checkStatus = async () => {
            try {
                const queryParam = currentUser.email ? `email=${encodeURIComponent(currentUser.email)}` : `userId=${currentUser.id}`;
                const res = await fetch(`/api/user/status?${queryParam}`);
                if (!res.ok) return;
                const data = await res.json();
                if (data.success) {
                    const isBlocked = !!data.is_blocked;
                    const banReason = data.ban_reason || null;
                    const trueId = (data.email === 'admin@mbite.com' || data.role === 'admin') ? 0 : (data.id !== undefined ? data.id : currentUser.id);
                    const trueRole = (data.email === 'admin@mbite.com' || data.role === 'admin') ? 'admin' : data.role;
                    if (
                        isBlocked !== !!currentUser.is_blocked || 
                        banReason !== (currentUser.ban_reason || null) || 
                        trueRole !== currentUser.role ||
                        trueId !== currentUser.id
                    ) {
                        setCurrentUser(prev => prev ? ({
                            ...prev,
                            id: trueId,
                            is_blocked: isBlocked,
                            ban_reason: banReason,
                            role: trueRole
                        }) : null);
                    }
                }
            } catch (e) {
                // Im lặng khi máy chủ bận hoặc ngắt quãng
            }
        };

        checkStatus(); // Gọi kiểm tra ngay lập tức khi component mount
        const interval = setInterval(checkStatus, 2000); // Quét lại mỗi 2 giây để đồng bộ tức thì
        return () => clearInterval(interval);
    }, [currentUser?.id, currentUser?.email, currentUser?.is_blocked, currentUser?.ban_reason, currentUser?.role]);

    const isSeller = currentUser?.role === 'seller';
    const isAdmin = currentUser?.role === 'admin';
    const [selectedCategory, setSelectedCategory] = useState('Tất cả');
    const [searchKeyword, setSearchKeyword] = useState('');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            <Header 
                currentUser={currentUser} 
                setCurrentUser={setCurrentUser} 
                cart={cart} 
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                searchKeyword={searchKeyword}
                setSearchKeyword={setSearchKeyword}
            />
            
            <main style={{ flex: 1, backgroundColor: '#141414' }}>
                {currentUser?.is_blocked ? (
                    <div style={{ padding: '80px 20px', textAlign: 'center', color: '#ff4d4f', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '22px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <ShieldAlertIcon size={24} color="#ff4d4f" /> Tài khoản đang bị giới hạn hoạt động
                            </h2>
                            <p style={{ color: '#888', fontSize: '14px' }}>Mọi tính năng mua bán trên hệ thống tạm thời bị ngưng. Vui lòng gửi phản hồi ở màn hình hiển thị.</p>
                        </div>
                    </div>
                ) : (
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
                            <Route 
                                path="/" 
                                element={
                                    <Home 
                                        currentUser={currentUser} 
                                        selectedCategory={selectedCategory}
                                        setSelectedCategory={setSelectedCategory}
                                        searchKeyword={searchKeyword}
                                        setSearchKeyword={setSearchKeyword}
                                    />
                                } 
                            />
                            
                            {/* Các trang xác thực */}
                            <Route path="/login" element={<Login setCurrentUser={setCurrentUser} />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            
                            {/* Menu món ăn của quán và Giỏ hàng / Thanh toán */}
                            <Route path="/shop/:id" element={<ShopDetail currentUser={currentUser} addToCart={addToCart} />} />
                            <Route path="/checkout" element={<Checkout cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} clearCart={clearCart} updateCartPrices={updateCartPrices} currentUser={currentUser} addToCart={addToCart} />} />

                            {/* Quản lý tài khoản, quán yêu thích và đổi mật khẩu cho Buyer */}
                            <Route path="/profile" element={<Profile currentUser={currentUser} setCurrentUser={setCurrentUser} defaultTab="info" />} />
                            <Route path="/favorites" element={<Profile currentUser={currentUser} setCurrentUser={setCurrentUser} defaultTab="favorites" />} />
                            <Route path="/change-password" element={<Profile currentUser={currentUser} setCurrentUser={setCurrentUser} defaultTab="password" />} />

                            {/* Theo dõi đơn hàng & Hoàn tiền VietQR cho Buyer */}
                            <Route path="/my-orders" element={<MyOrders currentUser={currentUser} />} />
                            <Route path="/orders" element={<Navigate to="/my-orders" replace />} />

                            {/* Ví Voucher của Buyer */}
                            <Route path="/my-vouchers" element={<MyVouchers currentUser={currentUser} setSelectedCategory={setSelectedCategory} />} />
                            <Route path="/vouchers" element={<MyVouchers currentUser={currentUser} setSelectedCategory={setSelectedCategory} />} />

                            {/* Quản trị viên hệ thống (Admin) */}
                            <Route path="/admin" element={currentUser?.role === 'admin' ? <Admin currentUser={currentUser} /> : <Navigate to="/" replace />} />

                            {/* Trang quản lý của quán */}
                            <Route path="/seller" element={<Seller currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </>
                    )}
                </Routes>
            )}
            </main>
            
            {/* Ẩn footer khách khi tài khoản là seller */}
            {!isSeller && <Footer />}

            {/* Khóa hoàn toàn giao diện và hiển thị màn hình gửi phản hồi khi tài khoản bị khóa */}
            {currentUser?.is_blocked && (
                <BannedScreen currentUser={currentUser} setCurrentUser={setCurrentUser} />
            )}
        </div>
    );
}