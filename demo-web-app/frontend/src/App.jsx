import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    // KHAI BÁO AVATAR MẶC ĐỊNH
    const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    // State cho Dropdown Menu và Đổi mật khẩu
    const [showDropdown, setShowDropdown] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Hàm xử lý đổi mật khẩu
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) return alert("Mật khẩu nhập lại không khớp!");
        const res = await fetch('http://localhost:5000/api/user/change-password', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, oldPassword, newPassword })
        });
        const data = await res.json();
        alert(data.message);
        if (data.success) {
            setOldPassword(''); setNewPassword(''); setConfirmPassword('');
            setView(currentUser.role === 'seller' ? 'seller-dashboard' : 'shop-list'); // Đổi xong quay về trang chủ
        }
    };
    // BIẾN CHO PHƯƠNG THỨC THANH TOÁN VÀ MÃ QR
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [showQR, setShowQR] = useState(false);
    const [timeLeft, setTimeLeft] = useState(180); // 180 giây = 3 phút

    const [view, setView] = useState('login'); 
    const [shops, setShops] = useState([]);
    const [selectedShop, setSelectedShop] = useState(null);
    const [foods, setFoods] = useState([]);
    const [editPhone, setEditPhone] = useState('');
    // KHỞI TẠO GIỎ HÀNG TỪ Ổ CỨNG (NẾU CÓ)
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('foodAppCart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // TỰ ĐỘNG LƯU VÀO Ổ CỨNG MỖI KHI GIỎ HÀNG THAY ĐỔI
    useEffect(() => {
        localStorage.setItem('foodAppCart', JSON.stringify(cart));
    }, [cart]);
    const [currentUser, setCurrentUser] = useState(null);

    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [registerRole, setRegisterRole] = useState('user');
    const [shopName, setShopName] = useState('');
    const [shopCategory, setShopCategory] = useState('');
    
    const [newFoodName, setNewFoodName] = useState('');
    const [newFoodPrice, setNewFoodPrice] = useState('');
    const [newFoodImgFile, setNewFoodImgFile] = useState(null);
    const [editFoodId, setEditFoodId] = useState(null);

    // STATE CHO QUẢN LÝ ĐƠN HÀNG CỦA SELLER
    const [sellerOrders, setSellerOrders] = useState([]);
    const [activeSellerTab, setActiveSellerTab] = useState('menu'); // 'menu' hoặc 'orders'

    // HÀM LẤY ĐƠN HÀNG & AUTO REFRESH (Làm chấm đỏ thời gian thực)
    const fetchSellerOrders = async () => {
        if (currentUser?.role === 'seller') {
            try {
                const res = await fetch(`http://localhost:5000/api/seller/orders?sellerId=${currentUser.id}`);
                const data = await res.json();
                if (data.success) setSellerOrders(data.orders);
            } catch (err) { console.log(err); }
        }
    };

    // Tự động quét đơn mới mỗi 5 giây khi đang ở trang chủ quán
    useEffect(() => {
        if (view === 'seller-dashboard' && currentUser?.role === 'seller') {
            fetchSellerOrders();
            const interval = setInterval(fetchSellerOrders, 5000);
            return () => clearInterval(interval);
        }
    }, [view, currentUser]);

    // HÀM ĐỔI TRẠNG THÁI ĐƠN HÀNG
    const handleUpdateOrderStatus = async (orderId, status) => {
        const res = await fetch('http://localhost:5000/api/seller/update-order-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, status })
        });
        if (res.ok) fetchSellerOrders();
    };

    // KIỂM TRA XEM CÓ ĐƠN NÀO MỚI TINH (pending) ĐỂ HIỆN CHẤM ĐỎ KHÔNG
    const hasNewOrders = sellerOrders.some(order => order.status === 'pending');

    // State cho Avatar
    const [avatarFile, setAvatarFile] = useState(null);

    const handleUpdateAvatar = async () => {
        if (!avatarFile) return alert("Vui lòng chọn 1 tấm ảnh trước!");
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        formData.append('sellerId', currentUser.id);

        const res = await fetch('http://localhost:5000/api/seller/update-avatar', { method: 'POST', body: formData });
        const data = await res.json();
        
        if (data.success) {
            alert(data.message);
            const updatedUser = { ...currentUser, avatar: data.avatarUrl };
            setCurrentUser(updatedUser);
            localStorage.setItem('foodAppUser', JSON.stringify(updatedUser)); // Lưu lại vào local
            setAvatarFile(null);
            document.getElementById('avatarInput').value = ''; // Reset ô chọn file
        } else {
            alert(data.message);
        }
    };

    // XỬ LÝ ĐẾM NGƯỢC THỜI GIAN MÃ QR (Dán ngay dưới handleUpdateAvatar)
    useEffect(() => {
        let timer;
        if (showQR && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (showQR && timeLeft === 0) {
            alert("⏳ Đã hết 3 phút! Giao dịch bị hủy do chưa thanh toán.");
            setShowQR(false);
            setPaymentMethod('COD'); // Trả lại mặc định
        }
        return () => clearInterval(timer);
    }, [showQR, timeLeft]);

    // HÀM ĐỔI GIÂY THÀNH ĐỊNH DẠNG PHÚT:GIÂY (VD: 02:59)
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // HÀM TRẠM TRUNG CHUYỂN THANH TOÁN
    const triggerCheckout = () => {
        if (cart.length === 0) return alert("Giỏ hàng trống!");
        
        if (paymentMethod === 'COD') {
            // Nếu là COD thì gọi hàm thanh toán cũ của ông để chốt đơn luôn
            handleCheckout(); 
        } else {
            // Nếu là CK thì bật QR và reset đồng hồ 3 phút (180s)
            setTimeLeft(180); 
            setShowQR(true);  
        }
    };

    // Cập nhật thông tin cá nhân (số điện thoại)
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('userId', currentUser.id);
        formData.append('phone', editPhone);
        if (avatarFile) formData.append('avatar', avatarFile);

        const res = await fetch('http://localhost:5000/api/user/update-profile', { method: 'POST', body: formData });
        const data = await res.json();
        
        if (data.success) {
            alert(data.message);
            const updatedUser = { ...currentUser, phone: editPhone, avatar: data.avatarUrl || currentUser.avatar };
            setCurrentUser(updatedUser);
            localStorage.setItem('foodAppUser', JSON.stringify(updatedUser));
            setAvatarFile(null);
        } else {
            alert(data.message);
        }
    };

    const fetchShops = async () => {
        const res = await fetch('http://localhost:5000/api/shops');
        const data = await res.json();
        setShops(data);
    };

    const fetchMenu = async (sellerId) => {
        // Lấy quyền user hiện tại (nếu đang ở màn login nhảy vào thì check localStorage)
        const savedUser = JSON.parse(localStorage.getItem('foodAppUser') || '{}');
        const role = currentUser?.role || savedUser.role || 'user';

        // Gắn thêm role vào đường dẫn API
        const res = await fetch(`http://localhost:5000/api/foods/${sellerId}?role=${role}`);
        const data = await res.json();
        
        // NẾU BACKEND BÁO QUÁN ĐÃ ẨN -> ĐÁ VĂNG RA TRANG CHỦ
        if (data.error) {
            alert(data.message);
            setView('shop-list');
            fetchShops(); // Load lại trang chủ để cập nhật danh sách mới
            return;
        }
        
        // Nếu quán bình thường thì load món ăn
        setFoods(data.foods);
        
        // Cập nhật real-time luôn trạng thái Đóng/Mở (lỡ chủ quán vừa gạt nút đóng cửa)
        setSelectedShop(prev => prev ? { ...prev, is_open: data.is_open } : prev);
    };

    useEffect(() => {
        const savedUser = localStorage.getItem('foodAppUser');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            setCurrentUser(user);
            if (user.role === 'seller') {
                setView('seller-dashboard');
                fetchMenu(user.id);
            } else {
                setView('shop-list');
                fetchShops();
            }
        }
    }, []); 

    const handleSelectShop = (shop) => {
        setSelectedShop(shop);
        fetchMenu(shop.id);
        setView('shop-detail');
    };

    // --- CÁC HÀM GIỎ HÀNG ---
    const addToCart = (food) => {
        const existingItem = cart.find(item => item.id === food.id);
        if (existingItem) setCart(cart.map(item => item.id === food.id ? { ...item, quantity: Number(item.quantity) + 1 } : item));
        else setCart([...cart, { ...food, quantity: 1, shopName: selectedShop.shop_name }]);
        alert(`Đã thêm ${food.name} vào giỏ!`);
    };

    const updateQuantity = (id, delta) => {
        const updatedCart = cart.map(item => item.id === id ? { ...item, quantity: Number(item.quantity) + delta } : item);
        setCart(updatedCart.filter(item => item.quantity > 0));
    };

    const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

    const handleCheckout = async () => {
        if (cart.length === 0) return alert("Giỏ hàng trống!");
        
        // Tính toán tổng tiền của giỏ hàng hiện tại
        const calculatedTotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

        const res = await fetch('http://localhost:5000/api/checkout', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            // THÊM PAYMENT METHOD VÀ TOTAL PRICE VÀO ĐÂY
            body: JSON.stringify({ 
                userId: currentUser.id, 
                cart: cart,
                paymentMethod: paymentMethod, 
                totalPrice: calculatedTotal
            })
        });
        
        const data = await res.json();
        
        if (data.success) { 
            alert(data.message); 
            setCart([]); 
            setView('shop-list'); 
            fetchShops();
        } else { 
            alert(data.message); 
            
            // TỰ ĐỘNG XÓA MÓN LỖI KHỎI GIỎ HÀNG
            if (data.invalidIds && data.invalidIds.length > 0) {
                setCart(prevCart => prevCart.filter(item => !data.invalidIds.includes(item.id)));
            }
            
            if(selectedShop) fetchMenu(selectedShop.id); 
            fetchShops(); // Refresh luôn danh sách shop cho mới
        }
    };

    const totalPrice = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const totalItems = cart.reduce((sum, item) => sum + Number(item.quantity), 0);

    // --- XỬ LÝ AUTH ---
    const handleLogin = async (e) => {
        e.preventDefault();
        const res = await fetch('http://localhost:5000/api/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
            setCurrentUser(data.user);
            localStorage.setItem('foodAppUser', JSON.stringify(data.user));
            if (data.user.role === 'seller') {
                setView('seller-dashboard'); fetchMenu(data.user.id);
            } else {
                setView('shop-list'); fetchShops();
            }
        } else alert(data.message);
    };

    const handleRegister = async (e) => { 
        e.preventDefault();
        const res = await fetch('http://localhost:5000/api/register', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ email, phone, password, verifyMethod: 'email', role: registerRole, shopName, shopCategory })
        });
        const data = await res.json();
        if (data.success) { alert(data.message); setView('verify'); } 
        else alert(data.message);
    };

    const handleVerify = async (e) => { 
        e.preventDefault(); 
        const res = await fetch('http://localhost:5000/api/verify-otp', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp })
        });
        const data = await res.json();
        if (data.success) { alert(data.message); setView('login'); } else alert(data.message);
    };

    // --- CÁC HÀM CỦA SELLER ---
    
    // Hàm Toggle Bật/Tắt Trạng thái Quán
    const toggleShopSettings = async (field, currentValue) => {
        const updatedUser = { ...currentUser, [field]: !currentValue };
        
        const res = await fetch('http://localhost:5000/api/seller/toggle-shop', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                sellerId: currentUser.id, 
                is_published: updatedUser.is_published ? 1 : 0, 
                is_open: updatedUser.is_open ? 1 : 0 
            })
        });
        const data = await res.json();
        if (data.success) {
            setCurrentUser(updatedUser);
            localStorage.setItem('foodAppUser', JSON.stringify(updatedUser));
        }
    };

    const handleAddOrUpdateFood = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', newFoodName);
        formData.append('price', Number(newFoodPrice));
        formData.append('sellerId', currentUser.id);
        
        if (newFoodImgFile) formData.append('image', newFoodImgFile);
        else if (!editFoodId) return alert("Vui lòng chọn ảnh cho món ăn!");

        if (editFoodId) {
            const res = await fetch(`http://localhost:5000/api/seller/update-food/${editFoodId}`, { method: 'PUT', body: formData });
            const data = await res.json();
            if (data.success) { alert(data.message); cancelEdit(); fetchMenu(currentUser.id); }
        } else {
            const res = await fetch('http://localhost:5000/api/seller/add-food', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) { alert(data.message); cancelEdit(); fetchMenu(currentUser.id); }
        }
    };

    const handleEditClick = (food) => {
        setEditFoodId(food.id); setNewFoodName(food.name); setNewFoodPrice(food.price); setNewFoodImgFile(null);
        if (document.getElementById('fileInput')) document.getElementById('fileInput').value = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditFoodId(null); setNewFoodName(''); setNewFoodPrice(''); setNewFoodImgFile(null);
        if (document.getElementById('fileInput')) document.getElementById('fileInput').value = '';
    };

    const toggleFoodStatus = async (food) => {
        await fetch('http://localhost:5000/api/seller/toggle-status', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: food.id, is_sold_out: !food.is_sold_out })
        });
        fetchMenu(currentUser.id); 
    };

    const handleDeleteFood = async (id, name) => {
        if (window.confirm(`Xóa vĩnh viễn món "${name}"?`)) {
            const res = await fetch(`http://localhost:5000/api/seller/delete-food/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) fetchMenu(currentUser.id);
        }
    };

    return (
        <div className="app-container">
            {(view === 'shop-list' || view === 'shop-detail' || view === 'cart' || view === 'seller-dashboard') && (
                <nav className="navbar">
                    <h2 onClick={() => {
                        if(currentUser?.role === 'user') { setView('shop-list'); fetchShops(); }
                    }} style={{cursor: 'pointer'}}>
                        {currentUser?.role === 'seller' ? `Gian Hàng: ${currentUser.shop_name}` : 'Shopee Food Fake 🍔'}
                    </h2>
                    
                    <div className="nav-right" style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                        {currentUser?.role === 'user' && (
                            <button className="cart-btn" onClick={() => setView('cart')}>🛒 Giỏ hàng ({totalItems})</button>
                        )}

                        {/* CỤM AVATAR VÀ DROPDOWN MENU */}
                        <div style={{ position: 'relative' }}>
                            <div 
                                onClick={() => setShowDropdown(!showDropdown)} 
                                style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '5px 12px', background: '#f0f2f5', borderRadius: '20px', transition: '0.2s'}}
                            >
                                <img 
                                    src={(currentUser?.avatar && currentUser.avatar !== 'null' && currentUser.avatar !== '') ? currentUser.avatar : 'https://i.imgur.com/V4RclNb.png'} 
                                    alt="avatar" 
                                    style={{width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid #ccc', backgroundColor: '#fff'}} 
                                    onError={(e) => { e.target.src = 'https://i.imgur.com/V4RclNb.png' }}
                                />
                                <span style={{fontWeight: '500', color: '#333'}}>{currentUser?.email}</span>
                                <span style={{fontSize: '12px', color: '#666'}}>▼</span>
                            </div>

                            {/* BẢNG MENU THẢ XUỐNG */}
                            {showDropdown && (
                                <div style={{
                                    position: 'absolute', top: '120%', right: 0, 
                                    background: '#fff', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                                    width: '200px', overflow: 'hidden', zIndex: 100, border: '1px solid #eee'
                                }}>
                                    <div 
                                        onClick={() => { setEditPhone(currentUser.phone || ''); setView('profile'); setShowDropdown(false); }}
                                        style={{padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #eee'}}
                                    >
                                        👤 Thông tin tài khoản
                                    </div>
                                    
                                    <div 
                                        onClick={() => { setView('change-password'); setShowDropdown(false); }}
                                        style={{padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #eee'}}
                                    >
                                        🔑 Đổi mật khẩu
                                    </div>
                                    
                                    <div 
                                        onClick={() => {
                                            setShowDropdown(false);
                                            if(window.confirm("Thoát tài khoản?")) { 
                                                setCurrentUser(null); setCart([]); 
                                                localStorage.removeItem('foodAppUser'); localStorage.removeItem('foodAppCart'); 
                                                setView('login'); 
                                            }
                                        }}
                                        style={{padding: '12px 15px', cursor: 'pointer', color: '#ff4d4f', fontWeight: 'bold'}}
                                    >
                                        🚪 Đăng xuất
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>
            )}

            {/* MÀN HÌNH ĐỔI MẬT KHẨU */}
            {view === 'change-password' && (
                <div style={{maxWidth: '400px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                        <h2 style={{margin: 0}}>Đổi Mật Khẩu</h2>
                        <button className="btn-back" onClick={() => setView(currentUser.role === 'seller' ? 'seller-dashboard' : 'shop-list')}>← Trở lại</button>
                    </div>
                    <form onSubmit={handleChangePassword} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                        <input type="password" placeholder="Mật khẩu cũ" required value={oldPassword} onChange={e => setOldPassword(e.target.value)} style={{padding: '12px', border: '1px solid #ccc', borderRadius: '5px'}}/>
                        <input type="password" placeholder="Mật khẩu mới" required value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{padding: '12px', border: '1px solid #ccc', borderRadius: '5px'}}/>
                        <input type="password" placeholder="Nhập lại mật khẩu mới" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{padding: '12px', border: '1px solid #ccc', borderRadius: '5px'}}/>
                        <button type="submit" className="btn-primary" style={{marginTop: '10px', padding: '12px'}}>Xác Nhận Đổi</button>
                    </form>
                </div>
            )}

            <div className="content">
                {/* LOGIN & ĐĂNG KÝ (Giữ nguyên như cũ) */}
                {view === 'login' && (
                    <form className="auth-form" onSubmit={handleLogin}>
                        <h2>Đăng Nhập</h2>
                        <input type="email" placeholder="Nhập Email" required onChange={e => setEmail(e.target.value)} />
                        <input type="password" placeholder="Nhập Mật khẩu" required onChange={e => setPassword(e.target.value)} />
                        <button type="submit" className="btn-primary">Đăng Nhập</button>
                        <p>Chưa có tài khoản? <span onClick={() => setView('register')}>Đăng ký ngay</span></p>
                    </form>
                )}

                {view === 'register' && (
                    <form className="auth-form" onSubmit={handleRegister}>
                        <h2>Đăng Ký Tài Khoản</h2>
                        <input type="email" placeholder="Nhập Email" required onChange={e => setEmail(e.target.value)} />
                        <input type="text" placeholder="Số điện thoại" required onChange={e => setPhone(e.target.value)} />
                        <input type="password" placeholder="Mật khẩu" required onChange={e => setPassword(e.target.value)} />
                        
                        <div style={{ display: 'flex', gap: '15px', margin: '10px 0', fontSize: '15px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                <input type="radio" value="user" checked={registerRole === 'user'} onChange={() => setRegisterRole('user')} /> Mua hàng
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                <input type="radio" value="seller" checked={registerRole === 'seller'} onChange={() => setRegisterRole('seller')} /> Trở thành Chủ quán
                            </label>
                        </div>
                        {registerRole === 'seller' && (
                            <div style={{display: 'flex', flexDirection: 'column', gap: '15px', background: '#fff0ed', padding: '15px', borderRadius: '4px', marginBottom: '15px'}}>
                                <input type="text" placeholder="Tên Quán (VD: Trà Đá Vỉa Hè)" required onChange={e => setShopName(e.target.value)} />
                                <input type="text" placeholder="Thể loại (VD: Ăn vặt, Cơm trưa...)" required onChange={e => setShopCategory(e.target.value)} />
                            </div>
                        )}
                        <button type="submit" className="btn-primary">Tạo tài khoản</button>
                        <p>Đã có tài khoản? <span onClick={() => setView('login')}>Đăng nhập</span></p>
                    </form>
                )}
                {view === 'verify' && (
                    <form className="auth-form" onSubmit={handleVerify}>
                        <h2>Xác Thực OTP</h2>
                        <input type="text" placeholder="Nhập mã OTP 6 số" required onChange={e => setOtp(e.target.value)} />
                        <button type="submit" className="btn-primary">Xác Nhận</button>
                    </form>
                )}

                {/* TRANG THÔNG TIN TÀI KHOẢN (PROFILE) */}
                {view === 'profile' && (
                    <div style={{maxWidth: '500px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                            <h2 style={{margin: 0}}>Hồ Sơ Cá Nhân</h2>
                            <button className="btn-back" onClick={() => setView(currentUser.role === 'seller' ? 'seller-dashboard' : 'shop-list')}>← Trở lại</button>
                        </div>
                        
                        <form onSubmit={handleUpdateProfile} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                            <div style={{textAlign: 'center'}}>
                                <img 
                                    src={currentUser.avatar || 'https://via.placeholder.com/100?text=U'} 
                                    alt="Avatar" 
                                    style={{width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid #ee4d2d', marginBottom: '10px'}} 
                                />
                                <br />
                                <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files[0])} style={{fontSize: '13px'}} />
                            </div>

                            <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                                <label style={{fontWeight: 'bold', color: '#555'}}>Email (Không thể đổi):</label>
                                <input type="email" value={currentUser.email} disabled style={{padding: '10px', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '5px', color: '#999'}} />
                            </div>

                            <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                                <label style={{fontWeight: 'bold', color: '#555'}}>Số điện thoại:</label>
                                <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} required style={{padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}} />
                            </div>

                            <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                                <label style={{fontWeight: 'bold', color: '#555'}}>Loại tài khoản:</label>
                                <input type="text" value={currentUser.role === 'seller' ? `Chủ quán (${currentUser.shop_name})` : 'Khách hàng'} disabled style={{padding: '10px', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '5px', color: '#999'}} />
                            </div>

                            <button type="submit" className="btn-primary" style={{marginTop: '10px', padding: '12px'}}>💾 Lưu Cập Nhật</button>
                        </form>
                    </div>
                )}

                {/* BUYER: MÀN HÌNH CHỌN QUÁN */}
                {view === 'shop-list' && (
                    <div style={{width: '100%'}}>
                        <h2 style={{marginBottom: 20}}>Hôm nay bạn muốn ăn ở đâu?</h2>
                        <div className="food-grid">
                            {shops.length === 0 ? <p>Chưa có quán nào đang hoạt động trên sàn.</p> : shops.map(shop => (
                                <div key={shop.id} className={`food-card ${!shop.is_open ? 'card-dimmed' : ''}`} onClick={() => handleSelectShop(shop)} style={{cursor: 'pointer'}}>
                                    
                                    {/* PHẦN MỚI: Hiển thị Avatar quán, nếu chưa có thì hiện nền đỏ và emoji */}
                                    <div style={{
                                        background: shop.avatar ? `url(${shop.avatar}) center/cover no-repeat` : '#ee4d2d',
                                        color: 'white', 
                                        height: '150px', 
                                        display: 'flex', 
                                        justifyContent: 'center', 
                                        alignItems: 'center',
                                        borderBottom: '1px solid #eee'
                                    }}>
                                        {!shop.avatar && <h1 style={{fontSize: '40px'}}>🏪</h1>}
                                    </div>

                                    <div className="food-info" style={{alignItems: 'center'}}>
                                        <h3 style={{fontSize: 22, margin: '5px 0'}}>{shop.shop_name || 'Quán vô danh'}</h3>
                                        <p style={{color: '#666', fontSize: 13}}>Phân loại: {shop.shop_category || 'Chưa cập nhật'}</p>
                                        <p style={{marginTop: 5, fontWeight: 'bold', color: shop.is_open ? '#52c41a' : '#ff4d4f'}}>
                                            {shop.is_open ? '🟢 Đang mở cửa' : '🔴 Quán tạm nghỉ'}
                                        </p>
                                        <button className="btn-add-cart" style={{marginTop: 15, background: shop.is_open ? '#ee4d2d' : '#999'}}>Vào Quán</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* BUYER: MÀN HÌNH CHỌN MÓN */}
                {view === 'shop-detail' && (
                    <div style={{width: '100%'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
                            <h2>Thực đơn của quán: <span style={{color: '#ee4d2d'}}>{selectedShop?.shop_name}</span></h2>
                            <button className="btn-back" onClick={() => { setView('shop-list'); fetchShops(); }}>← Trở lại danh sách quán</button>
                        </div>
                        
                        {!selectedShop?.is_open && (
                            <div style={{background: '#ffccc7', padding: 15, borderRadius: 8, color: '#d4380d', fontWeight: 'bold', marginBottom: 20}}>
                                ⚠️ Hiện tại quán đang tạm nghỉ, bạn không thể thêm món vào giỏ hàng.
                            </div>
                        )}

                        <div className="food-grid">
                            {foods.length === 0 ? <p>Quán này chưa cập nhật món ăn nào.</p> : foods.map(food => (
                                <div key={food.id} className={`food-card ${(!selectedShop?.is_open || food.is_sold_out) ? 'card-dimmed' : ''}`}>
                                    {(food.is_sold_out) && <div className="sold-out-overlay"><span>HẾT HÀNG</span></div>}
                                    <img src={food.img} alt={food.name} />
                                    <div className="food-info">
                                        <h3>{food.name}</h3>
                                        <p className="price">{food.price.toLocaleString('vi-VN')}đ</p>
                                        
                                        {/* Logic chặn nút: Nếu quán đóng hoặc món hết hàng thì xám nút */}
                                        {!selectedShop?.is_open ? (
                                            <button className="btn-disabled" disabled style={{background: '#999'}}>Quán nghỉ</button>
                                        ) : food.is_sold_out ? (
                                            <button className="btn-disabled" disabled>Không thể đặt</button>
                                        ) : (
                                            <button className="btn-add-cart" onClick={() => addToCart(food)}>Thêm vào giỏ</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CART (Giữ nguyên) */}
                {view === 'cart' && (
                    <div className="cart-container">
                        <div className="cart-header">
                            <h2>Giỏ hàng của bạn</h2>
                            <button className="btn-back" onClick={() => setView('shop-list')}>← Mua thêm</button>
                        </div>
                        {cart.length === 0 ? <p style={{marginTop: 20}}>Giỏ hàng trống.</p> : (
                            <div className="cart-list">
                                {cart.map(item => (
                                    <div key={item.id} className="cart-item">
                                        <img src={item.img} alt={item.name} />
                                        <div className="cart-item-info">
                                            <h4>{item.name}</h4>
                                            <p className="item-price">Quán: <strong style={{color: '#ee4d2d'}}>{item.shopName}</strong> | Đơn giá: {item.price.toLocaleString('vi-VN')}đ</p>
                                            <div className="qty-controls">
                                                <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                                            </div>
                                        </div>
                                        <div className="cart-item-right">
                                            <p className="subtotal">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
                                            <button className="btn-remove" onClick={() => removeFromCart(item.id)}>Xóa</button>
                                        </div>
                                    </div>
                                ))}

                                {/* KHỐI CHỌN PHƯƠNG THỨC THANH TOÁN (MỚI THÊM) */}
                                <div style={{ marginTop: '20px', padding: '15px', background: '#f0f2f5', borderRadius: '8px', textAlign: 'left' }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Phương thức thanh toán:</h3>
                                    <div style={{ display: 'flex', gap: '20px' }}>
                                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} />
                                            Thanh toán khi nhận hàng (COD)
                                        </label>
                                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <input type="radio" name="payment" value="CK" checked={paymentMethod === 'CK'} onChange={(e) => setPaymentMethod(e.target.value)} />
                                            Chuyển khoản (Quét mã QR)
                                        </label>
                                    </div>
                                </div>

                                <div className="cart-total">
                                    <h3>Tổng thanh toán: <span className="price">{totalPrice.toLocaleString('vi-VN')}đ</span></h3>
                                    
                                    {/* ĐỔI SANG DÙNG triggerCheckout THAY VÌ handleCheckout */}
                                    <button className="btn-checkout" onClick={triggerCheckout}>Tiến hành thanh toán</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* SELLER DASHBOARD CÓ BẢNG ĐIỀU KHIỂN */}
                {/* GIAO DIỆN CHỦ QUÁN (SELLER DASHBOARD) */}
                {view === 'seller-dashboard' && (
                    <div className="seller-container">
                        
                        {/* THANH ĐIỀU HƯỚNG TAB: THỰC ĐƠN & ĐƠN HÀNG */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                            <h2 style={{ margin: 0 }}>Quản lý Quán: <span style={{color: '#ee4d2d'}}>{currentUser?.shop_name}</span></h2>
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    onClick={() => setActiveSellerTab('menu')}
                                    style={{ padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', background: activeSellerTab === 'menu' ? '#ee4d2d' : '#e0e0e0', color: activeSellerTab === 'menu' ? '#fff' : '#333', fontWeight: 'bold' }}
                                >
                                    📋 Thực Đơn
                                </button>
                                <button 
                                    onClick={() => setActiveSellerTab('orders')}
                                    style={{ position: 'relative', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', background: activeSellerTab === 'orders' ? '#ee4d2d' : '#e0e0e0', color: activeSellerTab === 'orders' ? '#fff' : '#333', fontWeight: 'bold' }}
                                >
                                    📦 Đơn Hàng
                                    {/* CHẤM ĐỎ BÁO ĐƠN MỚI */}
                                    {hasNewOrders && (
                                        <span style={{ position: 'absolute', top: '-5px', right: '-5px', width: '12px', height: '12px', background: 'red', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 5px rgba(255,0,0,0.5)' }}></span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* ========================================= */}
                        {/* TAB 1: QUẢN LÝ THỰC ĐƠN VÀ TRẠNG THÁI QUÁN */}
                        {/* ========================================= */}
                        {activeSellerTab === 'menu' && (
                            <>
                                {/* PANEL QUẢN LÝ TRẠNG THÁI & AVATAR QUÁN */}
                                <div style={{ background: '#fff', padding: 20, borderRadius: 8, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <img 
                                                src={currentUser.avatar || 'https://via.placeholder.com/80?text=Shop'} 
                                                alt="Avatar Shop" 
                                                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #ee4d2d' }} 
                                            />
                                            <div>
                                                <h3 style={{margin: 0}}>⚙️ Quản lý hoạt động</h3>
                                                <p style={{fontSize: 14, color: '#666', marginTop: 5}}>Chỉ khi Đẩy lên sàn & Mở cửa khách mới mua được hàng.</p>
                                                <div style={{ marginTop: 8, display: 'flex', gap: 10 }}>
                                                    <input type="file" accept="image/*" id="avatarInput" onChange={e => setAvatarFile(e.target.files[0])} style={{ fontSize: 13, width: '180px' }} />
                                                    <button onClick={handleUpdateAvatar} style={{ padding: '4px 10px', background: '#333', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Đổi Avatar</button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div style={{display: 'flex', gap: 15}}>
                                            <button 
                                                onClick={() => toggleShopSettings('is_published', currentUser.is_published)}
                                                style={{ padding: '10px 15px', borderRadius: 5, border: 'none', cursor: 'pointer', fontWeight: 'bold', background: currentUser.is_published ? '#52c41a' : '#d9d9d9', color: currentUser.is_published ? '#fff' : '#333' }}>
                                                {currentUser.is_published ? '✅ Đang Hiện Sàn' : '👁️ Đã Ẩn Khỏi Sàn'}
                                            </button>
                                            <button 
                                                onClick={() => toggleShopSettings('is_open', currentUser.is_open)}
                                                style={{ padding: '10px 15px', borderRadius: 5, border: 'none', cursor: 'pointer', fontWeight: 'bold', background: currentUser.is_open ? '#1890ff' : '#ff4d4f', color: '#fff' }}>
                                                {currentUser.is_open ? '🟢 Đang Mở Cửa' : '🔴 Đang Đóng Cửa'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Form thêm món */}
                                <form className="add-food-form" onSubmit={handleAddOrUpdateFood} style={{ border: editFoodId ? '2px solid #1890ff' : 'none' }}>
                                    <h3 style={{ color: editFoodId ? '#1890ff' : '#333' }}>
                                        {editFoodId ? '✏️ Cập nhật thông tin món ăn' : '➕ Thêm món ăn mới'}
                                    </h3>
                                    <div className="form-row" style={{ alignItems: 'center' }}>
                                        <input type="text" placeholder="Tên món ăn" required value={newFoodName} onChange={e => setNewFoodName(e.target.value)} />
                                        <input type="number" placeholder="Giá tiền (VNĐ)" required value={newFoodPrice} onChange={e => setNewFoodPrice(e.target.value)} />
                                        <input type="file" accept="image/*" id="fileInput" onChange={e => setNewFoodImgFile(e.target.files[0])} style={{ flex: 1, padding: '7px' }} />
                                        <button type="submit" className="btn-primary" style={{width: 'auto', background: editFoodId ? '#1890ff' : '#ee4d2d'}}>
                                            {editFoodId ? 'Cập nhật' : 'Thêm món'}
                                        </button>
                                        {editFoodId && (
                                            <button type="button" onClick={cancelEdit} style={{ padding: '0 15px', border: '1px solid #ccc', background: 'white', borderRadius: '4px', cursor: 'pointer', height: '100%' }}>Hủy</button>
                                        )}
                                    </div>
                                </form>

                                <h3>📋 Quản lý Menu của {currentUser.shop_name}</h3>
                                <div className="food-grid">
                                    {foods.length === 0 ? <p>Chưa có món nào trong kho.</p> : foods.map(food => (
                                        <div key={food.id} className={`food-card ${food.is_sold_out ? 'card-dimmed' : ''}`}>
                                            <img src={food.img} alt={food.name} />
                                            <div className="food-info">
                                                <h3>{food.name}</h3>
                                                <p className="price">{food.price.toLocaleString('vi-VN')}đ</p>
                                                <p style={{marginBottom: 10}}>Trạng thái: <strong>{food.is_sold_out ? '🔴 Hết hàng' : '🟢 Đang bán'}</strong></p>
                                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                                    <button className={food.is_sold_out ? "btn-open" : "btn-sold-out"} onClick={() => toggleFoodStatus(food)} style={{ flex: 1 }}>
                                                        {food.is_sold_out ? 'Mở bán' : 'Báo hết'}
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button onClick={() => handleEditClick(food)} style={{ flex: 1, padding: '8px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Sửa</button>
                                                    <button className="btn-remove" onClick={() => handleDeleteFood(food.id, food.name)} style={{ flex: 1, padding: '8px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Xóa</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ========================================= */}
                        {/* TAB 2: QUẢN LÝ ĐƠN HÀNG (MỚI)               */}
                        {/* ========================================= */}
                        {activeSellerTab === 'orders' && (
                            <div style={{ marginTop: '20px' }}>
                                <h3>Danh sách Đơn hàng</h3>
                                {sellerOrders.length === 0 ? <p>Chưa có đơn hàng nào.</p> : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {sellerOrders.map(order => {
                                            const cartItems = JSON.parse(order.cart_details);
                                            return (
                                                <div key={order.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', background: order.status === 'pending' ? '#fff9e6' : '#fff' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                                                        <strong>Mã đơn: #{order.id}</strong>
                                                        <span style={{ color: order.status === 'pending' ? 'red' : (order.status === 'accepted' ? 'blue' : 'green'), fontWeight: 'bold' }}>
                                                            {order.status === 'pending' ? '🔴 Chờ xác nhận' : (order.status === 'accepted' ? '🔵 Đang chuẩn bị' : '🟢 Đã hoàn thành')}
                                                        </span>
                                                    </div>
                                                    
                                                    <div style={{ marginBottom: '15px' }}>
                                                        {cartItems.map((item, idx) => (
                                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px' }}>
                                                                <span>{item.quantity}x {item.name}</span>
                                                                <span>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: '14px' }}>Khách trả: <strong>{order.payment_method === 'CK' ? 'Chuyển khoản QR' : 'Tiền mặt (COD)'}</strong></p>
                                                            <h4 style={{ margin: '5px 0 0 0', color: '#ee4d2d' }}>Tổng thu: {order.total_price.toLocaleString('vi-VN')}đ</h4>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                            {order.status === 'pending' && (
                                                                <button className="btn-primary" onClick={() => handleUpdateOrderStatus(order.id, 'accepted')}>Xác nhận đơn</button>
                                                            )}
                                                            {order.status === 'accepted' && (
                                                                <button className="btn-primary" style={{background: '#28a745'}} onClick={() => handleUpdateOrderStatus(order.id, 'completed')}>Giao xong</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                )}
            </div>
            {/* POPUP HIỂN THỊ MÃ QR KHI CHỌN CHUYỂN KHOẢN */}
            {showQR && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', textAlign: 'center', width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <h2 style={{ margin: '0 0 10px 0' }}>Quét mã để thanh toán</h2>
                        
                        <p style={{ color: '#ee4d2d', fontWeight: 'bold', fontSize: '24px', margin: '10px 0' }}>
                            ⏳ {formatTime(timeLeft)}
                        </p>
                        
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                            Đơn hàng sẽ tự động hủy nếu quá hạn 3 phút.
                        </p>

                        <img 
                            src={`https://img.vietqr.io/image/vietcombank-1111111111-compact.png?amount=${totalPrice}&addInfo=Thanh%20toan%20ShopeeFood`} 
                            alt="Mã QR" 
                            style={{ width: '250px', height: '250px', border: '1px solid #ccc', borderRadius: '8px', margin: '15px 0' }} 
                        />
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                            <button className="btn-back" style={{ padding: '10px 15px' }} onClick={() => setShowQR(false)}>
                                Hủy giao dịch
                            </button>
                            
                            <button className="btn-primary" style={{ padding: '10px 15px' }} onClick={() => {
                                setShowQR(false);
                                handleCheckout(); // Gọi hàm chốt đơn thật sự sau khi khách xác nhận
                            }}>
                                Đã thanh toán
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;