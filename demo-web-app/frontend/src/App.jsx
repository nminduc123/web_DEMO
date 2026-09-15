import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [view, setView] = useState('login'); 
    const [foods, setFoods] = useState([]);
    const [cart, setCart] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [verifyMethod, setVerifyMethod] = useState('email');
    const [otp, setOtp] = useState('');
    
    // States cho Seller
    const [newFoodName, setNewFoodName] = useState('');
    const [newFoodPrice, setNewFoodPrice] = useState('');
    const [newFoodImg, setNewFoodImg] = useState('');
    const [editFoodId, setEditFoodId] = useState(null); // Lưu ID món ăn đang được sửa

    const fetchMenu = async () => {
        const res = await fetch('http://localhost:5000/api/foods');
        const data = await res.json();
        setFoods(data);
    };

    useEffect(() => {
        const savedUser = localStorage.getItem('foodAppUser');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            setCurrentUser(user);
            setView(user.role === 'seller' ? 'seller-dashboard' : 'shop');
        }
    }, []); 

    useEffect(() => {
        if (view === 'shop' || view === 'seller-dashboard') fetchMenu();
    }, [view]);

    // --- CÁC HÀM GIỎ HÀNG ---
    const addToCart = (food) => {
        const existingItem = cart.find(item => item.id === food.id);
        if (existingItem) {
            setCart(cart.map(item => item.id === food.id ? { ...item, quantity: Number(item.quantity) + 1 } : item));
        } else setCart([...cart, { ...food, quantity: 1 }]);
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
            alert(data.message); setCart([]); setView('shop'); 
        } else {
            alert(data.message); fetchMenu(); 
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
            if (data.user.role === 'seller') setView('seller-dashboard'); else setView('shop');
        } else alert(data.message);
    };

    const handleRegister = async (e) => { e.preventDefault(); setView('verify'); };
    const handleVerify = async (e) => { e.preventDefault(); setView('login'); };
    const handleForgotPassword = async (e) => { e.preventDefault(); setView('reset-password'); };
    const handleResetPassword = async (e) => { e.preventDefault(); setView('login'); };

    // --- CÁC HÀM CỦA SELLER ---
    
    // Gộp chung 2 tính năng: Thêm mới (POST) và Cập nhật (PUT)
    const handleAddOrUpdateFood = async (e) => {
        e.preventDefault();
        
        if (editFoodId) {
            // NẾU ĐANG Ở CHẾ ĐỘ SỬA -> GỌI API PUT
            const res = await fetch(`http://localhost:5000/api/seller/update-food/${editFoodId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newFoodName, price: Number(newFoodPrice), img: newFoodImg })
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                cancelEdit(); // Dọn dẹp form
                fetchMenu();
            }
        } else {
            // NẾU LÀ THÊM MỚI -> GỌI API POST
            const res = await fetch('http://localhost:5000/api/seller/add-food', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newFoodName, price: Number(newFoodPrice), img: newFoodImg })
            });
            const data = await res.json();
            if (data.success) { 
                alert(data.message); cancelEdit(); fetchMenu(); 
            }
        }
    };

    // Khi ấn nút Sửa ở thẻ món ăn
    const handleEditClick = (food) => {
        setEditFoodId(food.id);
        setNewFoodName(food.name);
        setNewFoodPrice(food.price);
        setNewFoodImg(food.img);
        // Cuộn mượt mà lên đầu trang để Seller thấy form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Hủy bỏ việc sửa, đưa form về trạng thái Thêm mới
    const cancelEdit = () => {
        setEditFoodId(null);
        setNewFoodName('');
        setNewFoodPrice('');
        setNewFoodImg('');
    };

    const toggleFoodStatus = async (food) => {
        await fetch('http://localhost:5000/api/seller/toggle-status', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: food.id, is_sold_out: !food.is_sold_out })
        });
        fetchMenu(); 
    };

    const handleDeleteFood = async (id, name) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn món "${name}" không?`)) {
            const res = await fetch(`http://localhost:5000/api/seller/delete-food/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) fetchMenu();
        }
    };

    return (
        <div className="app-container">
            {(view === 'shop' || view === 'cart' || view === 'seller-dashboard') && (
                <nav className="navbar">
                    <h2 onClick={() => currentUser?.role === 'user' ? setView('shop') : null} style={{cursor: 'pointer'}}>
                        {currentUser?.role === 'seller' ? 'Kênh Người Bán' : 'Shopee Food Fake 🍔'}
                    </h2>
                    <div className="nav-right">
                        <span>Xin chào, {currentUser?.email}</span>
                        {currentUser?.role === 'user' && (
                            <button className="cart-btn" onClick={() => setView('cart')}>🛒 Giỏ hàng ({totalItems})</button>
                        )}
                        <button className="logout-btn" onClick={() => {
                            if(window.confirm("Thoát tài khoản?")) { 
                                setCurrentUser(null); setCart([]); localStorage.removeItem('foodAppUser'); setView('login'); 
                            }
                        }}>Thoát</button>
                    </div>
                </nav>
            )}

            <div className="content">
                {/* LOGIN & AUTH */}
                {view === 'login' && (
                    <form className="auth-form" onSubmit={handleLogin}>
                        <h2>Đăng Nhập</h2>
                        <input type="email" placeholder="Nhập Email" required onChange={e => setEmail(e.target.value)} />
                        <input type="password" placeholder="Nhập Mật khẩu" required onChange={e => setPassword(e.target.value)} />
                        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                            <span style={{fontSize: 13, cursor: 'pointer', color: '#ee4d2d'}} onClick={() => setView('forgot-password')}>Quên mật khẩu?</span>
                        </div>
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
                        <button type="submit" className="btn-primary">Tạo tài khoản</button>
                        <p>Đã có tài khoản? <span onClick={() => setView('login')}>Đăng nhập</span></p>
                    </form>
                )}

                {view === 'forgot-password' && (
                    <form className="auth-form" onSubmit={handleForgotPassword}>
                        <h2>Khôi Phục Mật Khẩu</h2>
                        <input type="email" placeholder="Nhập Email của bạn" required onChange={e => setEmail(e.target.value)} />
                        <button type="submit" className="btn-primary">Gửi mã OTP</button>
                        <p><span onClick={() => setView('login')}>← Quay lại Đăng nhập</span></p>
                    </form>
                )}

                {view === 'verify' && (
                    <form className="auth-form" onSubmit={handleVerify}>
                        <h2>Xác Thực OTP</h2>
                        <input type="text" placeholder="Nhập mã OTP 6 số" required onChange={e => setOtp(e.target.value)} />
                        <button type="submit" className="btn-primary">Xác Nhận</button>
                    </form>
                )}

                {view === 'reset-password' && (
                    <form className="auth-form" onSubmit={handleResetPassword}>
                        <h2>Đặt Mật Khẩu Mới</h2>
                        <input type="text" placeholder="Mã OTP 6 số" required onChange={e => setOtp(e.target.value)} />
                        <input type="password" placeholder="Mật khẩu mới" required onChange={e => setPassword(e.target.value)} />
                        <button type="submit" className="btn-primary">Xác nhận đổi</button>
                    </form>
                )}

                {/* SHOP (USER) */}
                {view === 'shop' && (
                    <div className="food-grid">
                        {foods.map(food => (
                            <div key={food.id} className="food-card">
                                {food.is_sold_out && <div className="sold-out-overlay"><span>HẾT HÀNG</span></div>}
                                <img src={food.img} alt={food.name} />
                                <div className="food-info">
                                    <h3>{food.name}</h3>
                                    <p className="price">{food.price.toLocaleString('vi-VN')}đ</p>
                                    {food.is_sold_out ? (
                                        <button className="btn-disabled" disabled>Không thể đặt</button>
                                    ) : (
                                        <button className="btn-add-cart" onClick={() => addToCart(food)}>Thêm vào giỏ</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* CART */}
                {view === 'cart' && (
                    <div className="cart-container">
                        <div className="cart-header">
                            <h2>Giỏ hàng của bạn</h2>
                            <button className="btn-back" onClick={() => setView('shop')}>← Quay lại mua thêm</button>
                        </div>
                        {cart.length === 0 ? <p style={{marginTop: 20}}>Giỏ hàng trống.</p> : (
                            <div className="cart-list">
                                {cart.map(item => (
                                    <div key={item.id} className="cart-item">
                                        <img src={item.img} alt={item.name} />
                                        <div className="cart-item-info">
                                            <h4>{item.name}</h4>
                                            <p className="item-price">Đơn giá: {item.price.toLocaleString('vi-VN')}đ</p>
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

                {/* SELLER DASHBOARD */}
                {view === 'seller-dashboard' && (
                    <div className="seller-container">
                        
                        {/* FORM DÙNG CHUNG CHO CẢ THÊM MỚI VÀ SỬA */}
                        <form className="add-food-form" onSubmit={handleAddOrUpdateFood} style={{ border: editFoodId ? '2px solid #1890ff' : 'none' }}>
                            <h3 style={{ color: editFoodId ? '#1890ff' : '#333' }}>
                                {editFoodId ? '✏️ Cập nhật thông tin món ăn' : '➕ Thêm món ăn mới vào Menu'}
                            </h3>
                            <div className="form-row">
                                <input type="text" placeholder="Tên món ăn" required value={newFoodName} onChange={e => setNewFoodName(e.target.value)} />
                                <input type="number" placeholder="Giá tiền (VNĐ)" required value={newFoodPrice} onChange={e => setNewFoodPrice(e.target.value)} />
                                <input type="text" placeholder="Link ảnh (URL)" required value={newFoodImg} onChange={e => setNewFoodImg(e.target.value)} />
                                
                                <button type="submit" className="btn-primary" style={{width: 'auto', background: editFoodId ? '#1890ff' : '#ee4d2d'}}>
                                    {editFoodId ? 'Cập nhật' : 'Thêm món'}
                                </button>
                                
                                {/* Nếu đang sửa thì hiện thêm nút Hủy */}
                                {editFoodId && (
                                    <button type="button" onClick={cancelEdit} style={{ padding: '0 15px', border: '1px solid #ccc', background: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                                        Hủy
                                    </button>
                                )}
                            </div>
                        </form>

                        <h3>📋 Quản lý Menu hiện tại</h3>
                        <div className="food-grid">
                            {foods.map(food => (
                                <div key={food.id} className={`food-card ${food.is_sold_out ? 'card-dimmed' : ''}`}>
                                    <img src={food.img} alt={food.name} />
                                    <div className="food-info">
                                        <h3>{food.name}</h3>
                                        <p className="price">{food.price.toLocaleString('vi-VN')}đ</p>
                                        <p style={{marginBottom: 10}}>Trạng thái: <strong>{food.is_sold_out ? '🔴 Hết hàng' : '🟢 Đang bán'}</strong></p>
                                        
                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                            <button 
                                                className={food.is_sold_out ? "btn-open" : "btn-sold-out"} 
                                                onClick={() => toggleFoodStatus(food)} 
                                                style={{ flex: 1 }}>
                                                {food.is_sold_out ? 'Mở bán' : 'Báo hết'}
                                            </button>
                                        </div>

                                        {/* HÀNG NÚT SỬA & XÓA */}
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button 
                                                onClick={() => handleEditClick(food)}
                                                style={{ flex: 1, padding: '8px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                Sửa
                                            </button>
                                            <button 
                                                className="btn-remove" 
                                                onClick={() => handleDeleteFood(food.id, food.name)}
                                                style={{ flex: 1, padding: '8px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                Xóa
                                            </button>
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