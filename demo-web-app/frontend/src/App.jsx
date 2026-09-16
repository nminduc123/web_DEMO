import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [view, setView] = useState('login'); 
    const [shops, setShops] = useState([]);
    const [selectedShop, setSelectedShop] = useState(null);
    const [foods, setFoods] = useState([]);
    const [cart, setCart] = useState([]);
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
        const res = await fetch('http://localhost:5000/api/checkout', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, cart })
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
                    <div className="nav-right">
                        <span>Xin chào, {currentUser?.email}</span>
                        {currentUser?.role === 'user' && (
                            <button className="cart-btn" onClick={() => setView('cart')}>🛒 Giỏ hàng ({totalItems})</button>
                        )}
                        <button className="logout-btn" onClick={() => {
                            if(window.confirm("Thoát tài khoản?")) { setCurrentUser(null); setCart([]); localStorage.removeItem('foodAppUser'); setView('login'); }
                        }}>Thoát</button>
                    </div>
                </nav>
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
                                <div className="cart-total">
                                    <h3>Tổng thanh toán: <span className="price">{totalPrice.toLocaleString('vi-VN')}đ</span></h3>
                                    <button className="btn-checkout" onClick={handleCheckout}>Tiến hành thanh toán</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* SELLER DASHBOARD CÓ BẢNG ĐIỀU KHIỂN */}
                {view === 'seller-dashboard' && (
                    <div className="seller-container">
                        
                        {/* PANEL QUẢN LÝ TRẠNG THÁI & AVATAR QUÁN */}
                        <div style={{ background: '#fff', padding: 20, borderRadius: 8, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    {/* Hiển thị Avatar hiện tại */}
                                    <img 
                                        src={currentUser.avatar || 'https://via.placeholder.com/80?text=Shop'} 
                                        alt="Avatar Shop" 
                                        style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #ee4d2d' }} 
                                    />
                                    <div>
                                        <h3 style={{margin: 0}}>⚙️ Quản lý hoạt động</h3>
                                        <p style={{fontSize: 14, color: '#666', marginTop: 5}}>Chỉ khi Đẩy lên sàn & Mở cửa khách mới mua được hàng.</p>
                                        
                                        {/* Nút Upload Avatar */}
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
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;