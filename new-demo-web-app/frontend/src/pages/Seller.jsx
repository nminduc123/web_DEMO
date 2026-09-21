import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Seller({ currentUser, setCurrentUser }) {
    const navigate = useNavigate();

    const [activeSellerTab, setActiveSellerTab] = useState('menu'); // 'menu' | 'orders'
    const [foods, setFoods] = useState([]);
    const [sellerOrders, setSellerOrders] = useState([]);

    // State thêm / sửa món
    const [newFoodName, setNewFoodName] = useState('');
    const [newFoodPrice, setNewFoodPrice] = useState('');
    const [newFoodImgFile, setNewFoodImgFile] = useState(null);
    const [editFoodId, setEditFoodId] = useState(null);

    // State đổi avatar quán
    const [avatarFile, setAvatarFile] = useState(null);

    // Hàm lấy danh sách món ăn của quán
    const fetchMenu = async (sellerId) => {
        if (!sellerId) return;
        try {
            const res = await fetch(`http://localhost:5000/api/foods/${sellerId}?role=seller`);
            const data = await res.json();
            if (data.foods) {
                setFoods(data.foods);
            }
        } catch (err) {
            console.error("Lỗi lấy menu quán:", err);
        }
    };

    // Hàm lấy danh sách đơn hàng của quán
    const fetchSellerOrders = async () => {
        if (!currentUser?.id) return;
        try {
            const res = await fetch(`http://localhost:5000/api/seller/orders?sellerId=${currentUser.id}`);
            const data = await res.json();
            if (data.success) {
                setSellerOrders(data.orders || []);
            }
        } catch (err) {
            console.error("Lỗi lấy đơn hàng:", err);
        }
    };

    // Khởi tạo và quét đơn hàng thời gian thực mỗi 5s
    useEffect(() => {
        if (currentUser?.id && currentUser?.role === 'seller') {
            fetchMenu(currentUser.id);
            fetchSellerOrders();
            const interval = setInterval(fetchSellerOrders, 5000);
            return () => clearInterval(interval);
        }
    }, [currentUser?.id]);

    // Kiểm tra có đơn hàng mới (chờ xác nhận)
    const hasNewOrders = sellerOrders.some(order => order.status === 'pending');

    // Bật/tắt trạng thái quán (Đẩy sàn / Mở cửa)
    const toggleShopSettings = async (field, currentValue) => {
        const updatedValue = !currentValue;
        const updatedUser = { ...currentUser, [field]: updatedValue };

        try {
            const res = await fetch('http://localhost:5000/api/seller/toggle-shop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sellerId: currentUser.id,
                    is_published: field === 'is_published' ? (updatedValue ? 1 : 0) : (currentUser.is_published ? 1 : 0),
                    is_open: field === 'is_open' ? (updatedValue ? 1 : 0) : (currentUser.is_open ? 1 : 0)
                })
            });
            const data = await res.json();
            if (data.success) {
                setCurrentUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (err) {
            console.error("Lỗi cập nhật trạng thái quán:", err);
        }
    };

    // Đổi Avatar Quán
    const handleUpdateAvatar = async () => {
        if (!avatarFile) return alert("Vui lòng chọn 1 tấm ảnh trước!");
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        formData.append('sellerId', currentUser.id);

        try {
            const res = await fetch('http://localhost:5000/api/seller/update-avatar', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                const updatedUser = { ...currentUser, avatar: data.avatarUrl };
                setCurrentUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setAvatarFile(null);
                const inputEl = document.getElementById('avatarInput');
                if (inputEl) inputEl.value = '';
            } else {
                alert(data.message || "Lỗi đổi avatar!");
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi kết nối máy chủ!");
        }
    };

    // Thêm hoặc Cập nhật món ăn
    const handleAddOrUpdateFood = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', newFoodName);
        formData.append('price', Number(newFoodPrice));
        formData.append('sellerId', currentUser.id);

        if (newFoodImgFile) {
            formData.append('image', newFoodImgFile);
        } else if (!editFoodId) {
            return alert("Vui lòng chọn ảnh cho món ăn!");
        }

        try {
            if (editFoodId) {
                const res = await fetch(`http://localhost:5000/api/seller/update-food/${editFoodId}`, {
                    method: 'PUT',
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    alert(data.message);
                    cancelEdit();
                    fetchMenu(currentUser.id);
                }
            } else {
                const res = await fetch('http://localhost:5000/api/seller/add-food', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    alert(data.message);
                    cancelEdit();
                    fetchMenu(currentUser.id);
                }
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi kết nối khi lưu món ăn!");
        }
    };

    const handleEditClick = (food) => {
        setEditFoodId(food.id);
        setNewFoodName(food.name);
        setNewFoodPrice(food.price);
        setNewFoodImgFile(null);
        const fileInput = document.getElementById('foodFileInput');
        if (fileInput) fileInput.value = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditFoodId(null);
        setNewFoodName('');
        setNewFoodPrice('');
        setNewFoodImgFile(null);
        const fileInput = document.getElementById('foodFileInput');
        if (fileInput) fileInput.value = '';
    };

    // Bật/tắt trạng thái Mở bán / Báo hết
    const toggleFoodStatus = async (food) => {
        try {
            await fetch('http://localhost:5000/api/seller/toggle-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: food.id, is_sold_out: !food.is_sold_out })
            });
            fetchMenu(currentUser.id);
        } catch (err) {
            console.error(err);
        }
    };

    // Xóa món ăn
    const handleDeleteFood = async (id, name) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn món "${name}"?`)) {
            try {
                const res = await fetch(`http://localhost:5000/api/seller/delete-food/${id}`, {
                    method: 'DELETE'
                });
                const data = await res.json();
                if (data.success) {
                    fetchMenu(currentUser.id);
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    // Đổi trạng thái đơn hàng (Xác nhận đơn / Giao xong)
    const handleUpdateOrderStatus = async (orderId, status) => {
        try {
            const res = await fetch('http://localhost:5000/api/seller/update-order-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status })
            });
            if (res.ok) {
                fetchSellerOrders();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Nếu chưa đăng nhập hoặc không phải seller
    if (!currentUser || currentUser.role !== 'seller') {
        return (
            <div style={{ textAlign: 'center', marginTop: '80px', color: '#fff' }}>
                <h2>Bạn không có quyền truy cập trang quản lý này!</h2>
                <button 
                    onClick={() => navigate('/login')}
                    style={{ marginTop: '15px', padding: '10px 20px', background: '#ee4d2d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Đăng nhập tài khoản Chủ Quán
                </button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', fontFamily: 'Arial, sans-serif', color: '#fff' }}>
            
            {/* THANH ĐIỀU HƯỚNG TAB: THỰC ĐƠN & ĐƠN HÀNG */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #333', paddingBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h2 style={{ margin: 0, fontSize: '24px' }}>
                        🏪 Quản lý quán: <span style={{ color: '#ee4d2d' }}>{currentUser.shop_name}</span>
                    </h2>
                    <span style={{ fontSize: '13px', background: '#333', padding: '4px 10px', borderRadius: '20px', color: '#aaa' }}>
                        {currentUser.shop_category || 'Đồ ăn'}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        onClick={() => setActiveSellerTab('menu')}
                        style={{ 
                            padding: '10px 22px', 
                            border: 'none', 
                            borderRadius: '6px', 
                            cursor: 'pointer', 
                            background: activeSellerTab === 'menu' ? '#ee4d2d' : '#2a2a2a', 
                            color: activeSellerTab === 'menu' ? '#fff' : '#aaa', 
                            fontWeight: 'bold',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                    >
                        📋 Thực Đơn & Trạng Thái
                    </button>
                    
                    <button 
                        onClick={() => setActiveSellerTab('orders')}
                        style={{ 
                            position: 'relative', 
                            padding: '10px 22px', 
                            border: 'none', 
                            borderRadius: '6px', 
                            cursor: 'pointer', 
                            background: activeSellerTab === 'orders' ? '#ee4d2d' : '#2a2a2a', 
                            color: activeSellerTab === 'orders' ? '#fff' : '#aaa', 
                            fontWeight: 'bold',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                    >
                        📦 Quản Lý Đơn Hàng ({sellerOrders.length})
                        {hasNewOrders && (
                            <span 
                                title="Có đơn mới chờ xác nhận"
                                style={{ 
                                    position: 'absolute', 
                                    top: '-4px', 
                                    right: '-4px', 
                                    width: '12px', 
                                    height: '12px', 
                                    background: '#ff4d4f', 
                                    borderRadius: '50%', 
                                    border: '2px solid #1a1a1a', 
                                    boxShadow: '0 0 8px #ff4d4f' 
                                }}
                            />
                        )}
                    </button>
                </div>
            </div>

            {/* TAB 1: QUẢN LÝ THỰC ĐƠN VÀ TRẠNG THÁI QUÁN */}
            {activeSellerTab === 'menu' && (
                <>
                    {/* PANEL QUẢN LÝ TRẠNG THÁI & AVATAR QUÁN */}
                    <div style={{ background: '#222', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #333', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <img 
                                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836'} 
                                    alt="Avatar Shop" 
                                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #ee4d2d' }} 
                                />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px' }}>⚙️ Hoạt động & Thông tin quán</h3>
                                    <p style={{ fontSize: '13px', color: '#999', margin: '5px 0 10px 0' }}>
                                        Chỉ khi <strong>Đang Hiện Sàn</strong> và <strong>Đang Mở Cửa</strong> thì khách hàng mới thấy và đặt món được.
                                    </p>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            id="avatarInput" 
                                            onChange={e => setAvatarFile(e.target.files[0])} 
                                            style={{ fontSize: '12px', color: '#ccc', maxWidth: '200px' }} 
                                        />
                                        <button 
                                            onClick={handleUpdateAvatar} 
                                            style={{ padding: '6px 14px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                                        >
                                            Đổi Avatar
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button 
                                    onClick={() => toggleShopSettings('is_published', currentUser.is_published)}
                                    style={{ 
                                        padding: '12px 18px', 
                                        borderRadius: '6px', 
                                        border: 'none', 
                                        cursor: 'pointer', 
                                        fontWeight: 'bold', 
                                        fontSize: '14px',
                                        background: currentUser.is_published ? '#28a745' : '#444', 
                                        color: '#fff',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    {currentUser.is_published ? '✅ Đang Hiện Sàn' : '👁️ Đã Ẩn Khỏi Sàn'}
                                </button>
                                
                                <button 
                                    onClick={() => toggleShopSettings('is_open', currentUser.is_open)}
                                    style={{ 
                                        padding: '12px 18px', 
                                        borderRadius: '6px', 
                                        border: 'none', 
                                        cursor: 'pointer', 
                                        fontWeight: 'bold', 
                                        fontSize: '14px',
                                        background: currentUser.is_open ? '#007bff' : '#dc3545', 
                                        color: '#fff',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    {currentUser.is_open ? '🟢 Đang Mở Cửa' : '🔴 Đang Đóng Cửa'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* FORM THÊM / CẬP NHẬT MÓN ĂN */}
                    <form 
                        onSubmit={handleAddOrUpdateFood} 
                        style={{ 
                            background: '#222', 
                            padding: '20px', 
                            borderRadius: '8px', 
                            marginBottom: '30px', 
                            border: editFoodId ? '2px solid #007bff' : '1px solid #333',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                        }}
                    >
                        <h3 style={{ margin: '0 0 15px 0', color: editFoodId ? '#007bff' : '#fff', fontSize: '17px' }}>
                            {editFoodId ? '✏️ Cập nhật thông tin món ăn' : '➕ Thêm món ăn mới vào thực đơn'}
                        </h3>
                        
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input 
                                type="text" 
                                placeholder="Tên món ăn (vd: Phở Bò, Cơm Tấm...)" 
                                required 
                                value={newFoodName} 
                                onChange={e => setNewFoodName(e.target.value)}
                                style={{ flex: '2', minWidth: '200px', padding: '10px 14px', background: '#2a2a2a', border: '1px solid #444', borderRadius: '4px', color: '#fff', fontSize: '14px', outline: 'none' }} 
                            />
                            
                            <input 
                                type="number" 
                                placeholder="Giá tiền (VNĐ)" 
                                required 
                                value={newFoodPrice} 
                                onChange={e => setNewFoodPrice(e.target.value)}
                                style={{ flex: '1', minWidth: '130px', padding: '10px 14px', background: '#2a2a2a', border: '1px solid #444', borderRadius: '4px', color: '#fff', fontSize: '14px', outline: 'none' }} 
                            />
                            
                            <div style={{ flex: '1.5', minWidth: '200px' }}>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    id="foodFileInput" 
                                    onChange={e => setNewFoodImgFile(e.target.files[0])} 
                                    style={{ fontSize: '13px', color: '#aaa', width: '100%' }} 
                                />
                            </div>

                            <button 
                                type="submit" 
                                style={{ 
                                    padding: '10px 24px', 
                                    background: editFoodId ? '#007bff' : '#ee4d2d', 
                                    color: '#fff', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer', 
                                    fontWeight: 'bold', 
                                    fontSize: '14px' 
                                }}
                            >
                                {editFoodId ? 'Lưu Thay Đổi' : 'Thêm Món'}
                            </button>

                            {editFoodId && (
                                <button 
                                    type="button" 
                                    onClick={cancelEdit} 
                                    style={{ padding: '10px 16px', border: '1px solid #555', background: '#333', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
                                >
                                    Hủy
                                </button>
                            )}
                        </div>
                    </form>

                    {/* DANH SÁCH MÓN ĂN */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>
                            📋 Danh sách món ăn ({foods.length} món)
                        </h3>
                    </div>

                    {foods.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px 20px', background: '#222', borderRadius: '8px', border: '1px solid #333', color: '#888' }}>
                            <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>Kho món ăn của quán hiện đang trống.</p>
                            <p style={{ fontSize: '13px', margin: 0 }}>Hãy điền thông tin vào form phía trên để thêm món ăn đầu tiên nhé!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                            {foods.map(food => (
                                <div 
                                    key={food.id} 
                                    style={{ 
                                        background: '#222', 
                                        borderRadius: '8px', 
                                        overflow: 'hidden', 
                                        border: '1px solid #333',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        opacity: food.is_sold_out ? 0.65 : 1,
                                        transition: 'opacity 0.2s'
                                    }}
                                >
                                    <div style={{ position: 'relative', width: '100%', height: '180px', background: '#1a1a1a' }}>
                                        <img 
                                            src={food.img || "https://images.unsplash.com/photo-1504674900247-0877df9cc836"} 
                                            alt={food.name} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                        {food.is_sold_out ? (
                                            <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#dc3545', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                                Hết hàng
                                            </div>
                                        ) : (
                                            <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#28a745', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                                Đang bán
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#fff' }}>{food.name}</h4>
                                            <p style={{ margin: '0 0 15px 0', color: '#ee4d2d', fontWeight: 'bold', fontSize: '16px' }}>
                                                {Number(food.price).toLocaleString('vi-VN')}đ
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <button 
                                                onClick={() => toggleFoodStatus(food)}
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '8px', 
                                                    border: 'none', 
                                                    borderRadius: '4px', 
                                                    cursor: 'pointer', 
                                                    fontWeight: 'bold', 
                                                    fontSize: '13px',
                                                    background: food.is_sold_out ? '#28a745' : '#fa8c16', 
                                                    color: '#fff' 
                                                }}
                                            >
                                                {food.is_sold_out ? '🟢 Mở bán lại' : '🔴 Báo hết món'}
                                            </button>

                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    onClick={() => handleEditClick(food)}
                                                    style={{ flex: 1, padding: '8px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                                                >
                                                    ✏️ Sửa
                                                </button>
                                                
                                                <button 
                                                    onClick={() => handleDeleteFood(food.id, food.name)}
                                                    style={{ flex: 1, padding: '8px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                                                >
                                                    🗑️ Xóa
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* TAB 2: QUẢN LÝ ĐƠN HÀNG */}
            {activeSellerTab === 'orders' && (
                <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>Danh sách Đơn Hàng Của Khách</h3>
                        <span style={{ fontSize: '13px', color: '#888' }}>Tự động làm mới mỗi 5 giây</span>
                    </div>

                    {sellerOrders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#222', borderRadius: '8px', border: '1px solid #333', color: '#888' }}>
                            <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>Chưa có đơn hàng nào.</p>
                            <p style={{ fontSize: '13px', margin: 0 }}>Khi có khách đặt món qua App, đơn hàng sẽ hiển thị tại đây ngay lập tức!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {sellerOrders.map(order => {
                                let cartItems = [];
                                try {
                                    cartItems = JSON.parse(order.cart_details || '[]');
                                } catch (e) {
                                    cartItems = [];
                                }

                                return (
                                    <div 
                                        key={order.id} 
                                        style={{ 
                                            background: order.status === 'pending' ? '#2e261f' : '#222', 
                                            border: order.status === 'pending' ? '1px solid #ee4d2d' : '1px solid #333', 
                                            borderRadius: '8px', 
                                            padding: '20px',
                                            boxShadow: '0 3px 12px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3a3a3a', paddingBottom: '12px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                                            <div>
                                                <strong style={{ fontSize: '16px', color: '#fff' }}>Mã đơn: #{order.id}</strong>
                                                <span style={{ marginLeft: '12px', fontSize: '12px', color: '#888' }}>
                                                    {order.created_at ? new Date(order.created_at).toLocaleString('vi-VN') : ''}
                                                </span>
                                            </div>
                                            
                                            <span style={{ 
                                                fontSize: '13px', 
                                                fontWeight: 'bold', 
                                                padding: '4px 12px', 
                                                borderRadius: '20px',
                                                background: order.status === 'pending' ? '#ff4d4f22' : (order.status === 'accepted' ? '#007bff22' : '#28a74522'),
                                                color: order.status === 'pending' ? '#ff4d4f' : (order.status === 'accepted' ? '#1890ff' : '#52c41a'),
                                                border: `1px solid ${order.status === 'pending' ? '#ff4d4f' : (order.status === 'accepted' ? '#1890ff' : '#52c41a')}`
                                            }}>
                                                {order.status === 'pending' ? '🔴 Chờ xác nhận' : (order.status === 'accepted' ? '🔵 Đang chuẩn bị' : '🟢 Đã hoàn thành')}
                                            </span>
                                        </div>

                                        <div style={{ marginBottom: '15px' }}>
                                            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#aaa' }}>Món đặt:</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {cartItems.map((item, idx) => (
                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '4px 0', borderBottom: '1px dashed #333' }}>
                                                        <span><strong style={{ color: '#ee4d2d' }}>{item.quantity}x</strong> {item.name}</span>
                                                        <span style={{ color: '#ccc' }}>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1c1c1c', padding: '12px 16px', borderRadius: '6px', flexWrap: 'wrap', gap: '10px' }}>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '13px', color: '#aaa' }}>
                                                    Hình thức thanh toán: <strong style={{ color: '#fff' }}>{order.payment_method === 'CK' ? 'Chuyển khoản QR' : 'Tiền mặt (COD)'}</strong>
                                                </p>
                                                <h4 style={{ margin: '4px 0 0 0', color: '#ee4d2d', fontSize: '16px' }}>
                                                    Tổng thu: {Number(order.total_price || 0).toLocaleString('vi-VN')}đ
                                                </h4>
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                {order.status === 'pending' && (
                                                    <button 
                                                        onClick={() => handleUpdateOrderStatus(order.id, 'accepted')}
                                                        style={{ padding: '8px 18px', background: '#ee4d2d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                                                    >
                                                        ✅ Xác nhận đơn
                                                    </button>
                                                )}
                                                {order.status === 'accepted' && (
                                                    <button 
                                                        onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                                        style={{ padding: '8px 18px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                                                    >
                                                        🚀 Giao xong
                                                    </button>
                                                )}
                                                {order.status === 'completed' && (
                                                    <span style={{ color: '#28a745', fontSize: '13px', fontWeight: 'bold' }}>
                                                        ✔️ Đơn đã xong
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}