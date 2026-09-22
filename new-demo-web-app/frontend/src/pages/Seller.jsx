import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { SHOP_CATEGORIES } from '../constants/categories';
import { 
    StoreIcon, TrendingUpIcon, UtensilsIcon, PackageIcon, SettingsIcon,
    CheckCircleIcon, XCircleIcon, RevenueIcon, FileTextIcon, CreditCardIcon,
    BanknoteIcon, EditIcon, PlusIcon, TrashIcon, CheckIcon, XIcon,
    TicketIcon, AlertTriangleIcon, SaveIcon, StatusDot, SearchIcon,
    EyeIcon, EyeOffIcon, ShieldAlertIcon, ClockIcon, TruckIcon
} from '../components/Icons';

export default function Seller({ currentUser, setCurrentUser }) {
    const navigate = useNavigate();
    const { showToast } = useToast();

    // 4 Tab chính của kênh Seller
    const [activeSellerTab, setActiveSellerTab] = useState('revenue'); // 'revenue' | 'menu' | 'orders' | 'settings'

    // Dữ liệu từ server
    const [foods, setFoods] = useState([]);
    const [sellerOrders, setSellerOrders] = useState([]);

    // State cho Tab 1: Doanh thu
    const [revenueTimeRange, setRevenueTimeRange] = useState('all'); // 'today' | 'week' | 'month' | 'all'

    // State cho Tab 2: Thực đơn
    const [newFoodName, setNewFoodName] = useState('');
    const [newFoodPrice, setNewFoodPrice] = useState('');
    const [newFoodImgFile, setNewFoodImgFile] = useState(null);
    const [editFoodId, setEditFoodId] = useState(null);
    const [menuSearch, setMenuSearch] = useState('');
    const [menuFilter, setMenuFilter] = useState('all'); // 'all' | 'selling' | 'sold_out'

    // State cho Tab 3: Đơn hàng
    const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'pending' | 'accepted' | 'completed' | 'cancelled'

    // State cho Modal từ chối nhận đơn hàng
    const [rejectModal, setRejectModal] = useState({
        isOpen: false,
        orderId: null,
        reason: 'Quán đang tạm thời quá tải đơn'
    });

    // State cho Modal xóa món ăn (thay thế hoàn toàn window.confirm)
    const [deleteFoodModal, setDeleteFoodModal] = useState({
        isOpen: false,
        foodId: null,
        foodName: ''
    });

    // State cho Tab 4: Cài đặt quán
    const [avatarFile, setAvatarFile] = useState(null);
    const [shopNameInput, setShopNameInput] = useState(currentUser?.shop_name || '');
    const [shopCategoryInput, setShopCategoryInput] = useState(currentUser?.shop_category || 'Đồ ăn');
    const [shopPhoneInput, setShopPhoneInput] = useState(currentUser?.phone || '');
    const [shopAddressInput, setShopAddressInput] = useState(currentUser?.shop_address || '');
    const [shopDescriptionInput, setShopDescriptionInput] = useState(currentUser?.shop_description || '');
    const [isSavingShopInfo, setIsSavingShopInfo] = useState(false);

    // Đồng bộ form cài đặt khi currentUser thay đổi
    useEffect(() => {
        if (currentUser) {
            setShopNameInput(currentUser.shop_name || '');
            setShopCategoryInput(currentUser.shop_category || 'Đồ ăn');
            setShopPhoneInput(currentUser.phone || '');
            setShopAddressInput(currentUser.shop_address || '');
            setShopDescriptionInput(currentUser.shop_description || '');
        }
    }, [currentUser]);

    // Lấy danh sách món ăn của quán
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

    // Lấy danh sách đơn hàng của quán
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
    const pendingOrdersCount = useMemo(() => {
        return sellerOrders.filter(o => o.status === 'pending').length;
    }, [sellerOrders]);

    // --- TÍNH TOÁN DOANH THU & THỐNG KÊ (TAB 1) ---
    const { filteredOrders, totalRevenue, completedOrdersCount, bestSellers } = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

        const filtered = sellerOrders.filter(order => {
            if (revenueTimeRange === 'all') return true;
            const orderTime = new Date(order.created_at).getTime();
            if (revenueTimeRange === 'today') return orderTime >= startOfToday;
            if (revenueTimeRange === 'week') return orderTime >= sevenDaysAgo;
            if (revenueTimeRange === 'month') return orderTime >= thirtyDaysAgo;
            return true;
        });

        const completed = filtered.filter(o => o.status === 'completed');
        const revenue = completed.reduce((sum, o) => sum + Number(o.total_price || 0), 0);

        // Bóc tách món bán chạy từ các đơn hoàn thành
        const itemStats = {};
        completed.forEach(order => {
            try {
                const items = JSON.parse(order.cart_details || '[]');
                items.forEach(item => {
                    const key = item.name;
                    if (!itemStats[key]) {
                        itemStats[key] = {
                            name: item.name,
                            quantity: 0,
                            revenue: 0,
                            img: item.img
                        };
                    }
                    const q = Number(item.quantity || 1);
                    itemStats[key].quantity += q;
                    itemStats[key].revenue += Number(item.price || 0) * q;
                });
            } catch (e) {}
        });

        const sortedBestSellers = Object.values(itemStats).sort((a, b) => b.quantity - a.quantity);

        return {
            filteredOrders: filtered,
            totalRevenue: revenue,
            completedOrdersCount: completed.length,
            bestSellers: sortedBestSellers
        };
    }, [sellerOrders, revenueTimeRange]);

    // --- CÁC HÀM THAO TÁC CÀI ĐẶT QUÁN ---
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
                sessionStorage.setItem('user', JSON.stringify(updatedUser));
                
                if (field === 'is_published') {
                    showToast(updatedValue ? "Đã bật: Quán đang hiển thị trên sàn!" : "Đã ẩn: Quán đã tạm ẩn khỏi sàn!", updatedValue ? "success" : "info");
                } else {
                    showToast(updatedValue ? "Đã mở cửa đón khách đặt món!" : "Đã chuyển sang trạng thái đóng cửa!", updatedValue ? "success" : "info");
                }
            }
        } catch (err) {
            console.error("Lỗi cập nhật trạng thái quán:", err);
            showToast("Lỗi kết nối máy chủ khi cập nhật quán!", "error");
        }
    };

    const handleUpdateAvatar = async () => {
        if (!avatarFile) return showToast("Vui lòng chọn 1 tấm ảnh trước!", "warning");
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
                showToast(data.message || "Đổi ảnh đại diện quán thành công!", "success");
                const updatedUser = { ...currentUser, avatar: data.avatarUrl };
                setCurrentUser(updatedUser);
                sessionStorage.setItem('user', JSON.stringify(updatedUser));
                setAvatarFile(null);
                const inputEl = document.getElementById('avatarInput');
                if (inputEl) inputEl.value = '';
            } else {
                showToast(data.message || "Lỗi đổi avatar!", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Lỗi kết nối máy chủ!", "error");
        }
    };

    const handleSaveShopInfo = async (e) => {
        e.preventDefault();
        setIsSavingShopInfo(true);
        try {
            const res = await fetch('http://localhost:5000/api/seller/update-shop-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sellerId: currentUser.id,
                    shopName: shopNameInput,
                    shopCategory: shopCategoryInput,
                    shopDescription: shopDescriptionInput,
                    shopAddress: shopAddressInput,
                    phone: shopPhoneInput
                })
            });
            const data = await res.json();
            if (data.success) {
                const updatedUser = {
                    ...currentUser,
                    shop_name: shopNameInput,
                    shop_category: shopCategoryInput,
                    shop_description: shopDescriptionInput,
                    shop_address: shopAddressInput,
                    phone: shopPhoneInput
                };
                setCurrentUser(updatedUser);
                sessionStorage.setItem('user', JSON.stringify(updatedUser));
                showToast("Cập nhật thông tin quán thành công!", "success");
            } else {
                showToast(data.message || "Không thể lưu thông tin quán!", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Lỗi kết nối máy chủ!", "error");
        } finally {
            setIsSavingShopInfo(false);
        }
    };

    // --- CÁC HÀM THAO TÁC MÓN ĂN (TAB 2) ---
    const handleAddOrUpdateFood = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', newFoodName);
        formData.append('price', Number(newFoodPrice));
        formData.append('sellerId', currentUser.id);

        if (newFoodImgFile) {
            formData.append('image', newFoodImgFile);
        } else if (!editFoodId) {
            return showToast("Vui lòng chọn ảnh cho món ăn!", "warning");
        }

        try {
            if (editFoodId) {
                const res = await fetch(`http://localhost:5000/api/seller/update-food/${editFoodId}`, {
                    method: 'PUT',
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    showToast(data.message || "Cập nhật món thành công!", "success");
                    cancelEdit();
                    fetchMenu(currentUser.id);
                } else {
                    showToast(data.message || "Lỗi cập nhật món ăn!", "error");
                }
            } else {
                const res = await fetch('http://localhost:5000/api/seller/add-food', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    showToast(data.message || "Thêm món ăn thành công!", "success");
                    cancelEdit();
                    fetchMenu(currentUser.id);
                } else {
                    showToast(data.message || "Lỗi thêm món ăn!", "error");
                }
            }
        } catch (err) {
            console.error(err);
            showToast("Lỗi kết nối khi lưu món ăn!", "error");
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

    const toggleFoodStatus = async (food) => {
        try {
            await fetch('http://localhost:5000/api/seller/toggle-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: food.id, is_sold_out: !food.is_sold_out })
            });
            showToast(food.is_sold_out ? `Đã mở bán lại món "${food.name}"` : `Đã báo hết món "${food.name}"`, "info");
            fetchMenu(currentUser.id);
        } catch (err) {
            console.error(err);
            showToast("Lỗi cập nhật trạng thái món!", "error");
        }
    };

    const handleDeleteFood = (id, name) => {
        setDeleteFoodModal({
            isOpen: true,
            foodId: id,
            foodName: name
        });
    };

    const handleConfirmDeleteFood = async () => {
        if (!deleteFoodModal.foodId) return;
        try {
            const res = await fetch(`http://localhost:5000/api/seller/delete-food/${deleteFoodModal.foodId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                showToast(`Đã xóa món "${deleteFoodModal.foodName}" thành công!`, "success");
                fetchMenu(currentUser.id);
            } else {
                showToast(data.message || "Lỗi xóa món ăn!", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Lỗi kết nối khi xóa món!", "error");
        } finally {
            setDeleteFoodModal({ isOpen: false, foodId: null, foodName: '' });
        }
    };

    // Lọc danh sách món ăn theo tìm kiếm & trạng thái
    const displayedFoods = useMemo(() => {
        return foods.filter(food => {
            const matchesSearch = food.name.toLowerCase().includes(menuSearch.toLowerCase().trim());
            if (!matchesSearch) return false;
            if (menuFilter === 'selling') return !food.is_sold_out;
            if (menuFilter === 'sold_out') return !!food.is_sold_out;
            return true;
        });
    }, [foods, menuSearch, menuFilter]);

    // --- CÁC HÀM THAO TÁC ĐƠN HÀNG (TAB 3) ---
    const handleUpdateOrderStatus = async (orderId, status) => {
        try {
            const res = await fetch('http://localhost:5000/api/seller/update-order-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status })
            });
            if (res.ok) {
                showToast(status === 'accepted' ? `Đã xác nhận đơn #${orderId}` : `Đã hoàn thành đơn #${orderId}`, "success");
                fetchSellerOrders();
            } else {
                showToast("Không thể cập nhật đơn hàng!", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Lỗi kết nối khi cập nhật đơn hàng!", "error");
        }
    };

    // Từ chối nhận đơn hàng
    const handleConfirmReject = async (e) => {
        e.preventDefault();
        if (!rejectModal.orderId) return;
        try {
            const res = await fetch('http://localhost:5000/api/seller/update-order-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: rejectModal.orderId,
                    status: 'cancelled',
                    cancel_reason: rejectModal.reason
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`Đã từ chối đơn hàng #${rejectModal.orderId}`, "info");
                setRejectModal({ isOpen: false, orderId: null, reason: '' });
                fetchSellerOrders();
            } else {
                showToast(data.message || "Không thể từ chối đơn!", "error");
            }
        } catch (err) {
            showToast("Lỗi kết nối khi từ chối đơn!", "error");
        }
    };

    // Lọc đơn hàng theo tab trạng thái
    const displayedOrders = useMemo(() => {
        if (orderFilter === 'all') return sellerOrders;
        return sellerOrders.filter(o => o.status === orderFilter);
    }, [sellerOrders, orderFilter]);

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
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '30px 20px', fontFamily: 'Arial, sans-serif', color: '#fff' }}>
            
            {/* TIÊU ĐỀ TRANG QUẢN TRỊ SELLER */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StoreIcon size={24} color="#ee4d2d" />
                    Kênh Quản Lý Nhà Hàng
                </h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>
                    Hệ thống quản lý thực đơn, xử lý đơn hàng, theo dõi doanh thu và cấu hình thông tin quán
                </p>
            </div>

            {/* BỐ CỤC 2 CỘT: CỘT TRÁI (SIDEBAR) & CỘT PHẢI (MAIN CONTENT) */}
            <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', gap: '24px', alignItems: 'start' }}>
                
                {/* CỘT MENU BÊN TRÁI (LEFT SIDEBAR) */}
                <aside style={{
                    background: '#1c1f26',
                    borderRadius: '12px',
                    border: '1px solid #2d333f',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    position: 'sticky',
                    top: '110px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
                }}>
                    {/* Thẻ thông tin nhanh về quán */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingBottom: '16px', borderBottom: '1px solid #2d333f' }}>
                        <div style={{ position: 'relative', marginBottom: '12px' }}>
                            <img 
                                src={currentUser.avatar || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836'} 
                                alt="Avatar Shop" 
                                style={{ 
                                    width: '68px', 
                                    height: '68px', 
                                    borderRadius: '50%', 
                                    objectFit: 'cover', 
                                    border: `3px solid ${currentUser.is_open ? '#28a745' : '#ff4d4f'}`,
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                                }} 
                            />
                            <span 
                                title={currentUser.is_open ? 'Quán đang mở cửa' : 'Quán đang tạm đóng'}
                                style={{
                                    position: 'absolute',
                                    bottom: '2px',
                                    right: '2px',
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '50%',
                                    background: currentUser.is_open ? '#28a745' : '#ff4d4f',
                                    border: '2px solid #1c1f26'
                                }}
                            />
                        </div>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 'bold', color: '#fff', maxWidth: '230px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {currentUser.shop_name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <span style={{ background: 'rgba(238, 77, 45, 0.15)', color: '#ee4d2d', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                                {currentUser.shop_category || 'Đồ ăn'}
                            </span>
                            <span style={{ fontSize: '11px', color: currentUser.is_open ? '#52c41a' : '#ff4d4f', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <StatusDot color={currentUser.is_open ? '#52c41a' : '#ff4d4f'} size={6} />
                                {currentUser.is_open ? 'Đang mở cửa' : 'Tạm đóng cửa'}
                            </span>
                        </div>
                    </div>

                    {/* Danh sách mục menu dọc */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '0 8px 4px' }}>
                            Danh mục quản lý
                        </span>

                        <button 
                            type="button"
                            onClick={() => setActiveSellerTab('revenue')}
                            style={sidebarNavStyle(activeSellerTab === 'revenue')}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <TrendingUpIcon size={16} color={activeSellerTab === 'revenue' ? '#ee4d2d' : '#aaa'} />
                                <span>Doanh Thu & KPI</span>
                            </div>
                        </button>

                        <button 
                            type="button"
                            onClick={() => setActiveSellerTab('menu')}
                            style={sidebarNavStyle(activeSellerTab === 'menu')}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <UtensilsIcon size={16} color={activeSellerTab === 'menu' ? '#ee4d2d' : '#aaa'} />
                                <span>Thực Đơn Món</span>
                            </div>
                            <span style={sidebarBadgeStyle(activeSellerTab === 'menu')}>
                                {foods.length}
                            </span>
                        </button>

                        <button 
                            type="button"
                            onClick={() => setActiveSellerTab('orders')}
                            style={sidebarNavStyle(activeSellerTab === 'orders')}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <PackageIcon size={16} color={activeSellerTab === 'orders' ? '#ee4d2d' : '#aaa'} />
                                <span>Đơn Hàng</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {pendingOrdersCount > 0 && (
                                    <span 
                                        title={`${pendingOrdersCount} đơn chờ xác nhận`}
                                        style={{ 
                                            background: '#ff4d4f', 
                                            color: '#fff',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            padding: '1px 6px',
                                            borderRadius: '10px',
                                            boxShadow: '0 2px 6px rgba(255, 77, 79, 0.4)'
                                        }}
                                    >
                                        {pendingOrdersCount} mới
                                    </span>
                                )}
                                <span style={sidebarBadgeStyle(activeSellerTab === 'orders')}>
                                    {sellerOrders.length}
                                </span>
                            </div>
                        </button>

                        <button 
                            type="button"
                            onClick={() => setActiveSellerTab('settings')}
                            style={sidebarNavStyle(activeSellerTab === 'settings')}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <SettingsIcon size={16} color={activeSellerTab === 'settings' ? '#ee4d2d' : '#aaa'} />
                                <span>Hồ Sơ & Cài Đặt</span>
                            </div>
                        </button>
                    </div>

                    {/* Chân sidebar */}
                    <div style={{ paddingTop: '14px', borderTop: '1px solid #2d333f', textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                            M-Bite Merchant v2.0
                        </span>
                    </div>
                </aside>

                {/* CỘT NỘI DUNG CHÍNH BÊN PHẢI (MAIN CONTENT) */}
                <div style={{
                    background: '#1c1f26',
                    borderRadius: '12px',
                    border: '1px solid #2d333f',
                    padding: '24px',
                    minHeight: '600px',
                    minWidth: 0,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
                }}>
                    {/* ========================================================= */}
                    {/* TAB 1: DOANH THU & THỐNG KÊ KINH DOANH */}
                    {/* ========================================================= */}
                    {activeSellerTab === 'revenue' && (
                <div>
                    {/* BỘ LỌC THỜI GIAN DOANH THU */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px' }}>Báo Cáo Hoạt Động & Doanh Thu</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#888' }}>
                                Dữ liệu được tính toán dựa trên các đơn hàng khách đã hoàn tất thành công.
                            </p>
                        </div>

                        <div style={{ display: 'flex', background: '#222', padding: '4px', borderRadius: '8px', border: '1px solid #333', gap: '4px' }}>
                            {[
                                { key: 'today', label: 'Hôm nay' },
                                { key: 'week', label: '7 ngày qua' },
                                { key: 'month', label: '30 ngày qua' },
                                { key: 'all', label: 'Toàn thời gian' }
                            ].map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => setRevenueTimeRange(item.key)}
                                    style={{
                                        padding: '7px 14px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: 'bold',
                                        background: revenueTimeRange === item.key ? '#ee4d2d' : 'transparent',
                                        color: revenueTimeRange === item.key ? '#fff' : '#aaa',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 4 THẺ KPI CHỈ SỐ QUAN TRỌNG */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '30px' }}>
                        {/* Thẻ 1: Doanh thu thực tế */}
                        <div style={kpiCardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '13px', color: '#aaa', fontWeight: 'bold' }}> DOANH THU THỰC TẾ</span>
                                <TrendingUpIcon size={20} color="#52c41a" />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '26px', color: '#52c41a' }}>
                                {totalRevenue.toLocaleString('vi-VN')}đ
                            </h3>
                            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#888' }}>
                                Từ {completedOrdersCount} đơn đã giao thành công
                            </p>
                        </div>

                        {/* Thẻ 2: Tổng đơn hoàn thành */}
                        <div style={kpiCardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '13px', color: '#aaa', fontWeight: 'bold' }}> ĐƠN HOÀN THÀNH</span>
                                <CheckCircleIcon size={20} color="#1890ff" />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '26px', color: '#1890ff' }}>
                                {completedOrdersCount} <span style={{ fontSize: '15px', color: '#888' }}>/ {filteredOrders.length} đơn</span>
                            </h3>
                            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#888' }}>
                                Tỷ lệ hoàn thành: {filteredOrders.length > 0 ? Math.round((completedOrdersCount / filteredOrders.length) * 100) : 0}%
                            </p>
                        </div>

                        {/* Thẻ 3: Đơn chờ xử lý */}
                        <div style={kpiCardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '13px', color: '#aaa', fontWeight: 'bold' }}> ĐƠN CẦN XỬ LÝ</span>
                                <AlertTriangleIcon size={20} color="#ff4d4f" />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '26px', color: pendingOrdersCount > 0 ? '#ff4d4f' : '#fff' }}>
                                {pendingOrdersCount} <span style={{ fontSize: '15px', color: '#888' }}>đơn chờ duyệt</span>
                            </h3>
                            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#888' }}>
                                {pendingOrdersCount > 0 ? 'Có khách đang chờ xác nhận đơn!' : 'Tất cả đơn đều đã được xử lý'}
                            </p>
                        </div>

                        {/* Thẻ 4: Tổng món trong kho */}
                        <div style={kpiCardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '13px', color: '#aaa', fontWeight: 'bold' }}> THỰC ĐƠN QUÁN</span>
                                <UtensilsIcon size={20} color="#fa8c16" />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '26px', color: '#fa8c16' }}>
                                {foods.length} <span style={{ fontSize: '15px', color: '#888' }}>món ăn</span>
                            </h3>
                            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#888' }}>
                                {foods.filter(f => !f.is_sold_out).length} món đang mở bán trực tiếp
                            </p>
                        </div>
                    </div>

                    {/* KHU VỰC: TOP MÓN BÁN CHẠY NHẤT & LỊCH SỬ DÒNG TIỀN */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                        
                        {/* CỘT TRÁI: TOP MÓN BÁN CHẠY NHẤT */}
                        <div style={{ background: '#222', borderRadius: '8px', padding: '22px', border: '1px solid #333' }}>
                            <h3 style={{ margin: '0 0 15px 0', fontSize: '17px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <TrendingUpIcon size={18} color="#faad14" /> Top Món Ăn Bán Chạy Nhất
                            </h3>
                            
                            {bestSellers.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 10px', color: '#888', fontSize: '13px' }}>
                                    <div style={{ marginBottom: '8px', color: '#555', display: 'flex', justifyContent: 'center' }}><UtensilsIcon size={32} /></div>
                                    Chưa có dữ liệu bán hàng trong khoảng thời gian này.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {bestSellers.slice(0, 5).map((item, idx) => (
                                        <div 
                                            key={idx}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                background: '#1c1c1c',
                                                padding: '12px 14px',
                                                borderRadius: '6px',
                                                border: '1px solid #2e2e2e'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ 
                                                    width: '26px', height: '26px', borderRadius: '50%', 
                                                    background: idx === 0 ? '#faad14' : idx === 1 ? '#d9d9d9' : idx === 2 ? '#d48806' : '#333',
                                                    color: idx < 3 ? '#000' : '#aaa',
                                                    fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    {idx + 1}
                                                </span>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: '14px', color: '#fff' }}>{item.name}</h4>
                                                    <span style={{ fontSize: '12px', color: '#888' }}>
                                                        Đã bán: <strong style={{ color: '#ee4d2d' }}>{item.quantity} phần</strong>
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontSize: '14px', color: '#52c41a', fontWeight: 'bold' }}>
                                                    {item.revenue.toLocaleString('vi-VN')}đ
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* CỘT PHẢI: ĐƠN HÀNG HOÀN THÀNH GẦN NHẤT */}
                        <div style={{ background: '#222', borderRadius: '8px', padding: '22px', border: '1px solid #333' }}>
                            <h3 style={{ margin: '0 0 15px 0', fontSize: '17px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <RevenueIcon size={18} color="#52c41a" /> Dòng Tiền Đơn Hàng Gần Đây
                            </h3>

                            {completedOrdersCount === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 10px', color: '#888', fontSize: '13px' }}>
                                    <div style={{ marginBottom: '8px', color: '#555', display: 'flex', justifyContent: 'center' }}><FileTextIcon size={32} /></div>
                                    Chưa có đơn hàng hoàn thành nào trong khoảng thời gian này.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {filteredOrders.filter(o => o.status === 'completed').slice(0, 5).map(order => (
                                        <div 
                                            key={order.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                background: '#1c1c1c',
                                                padding: '12px 14px',
                                                borderRadius: '6px',
                                                border: '1px solid #2e2e2e'
                                            }}
                                        >
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <strong style={{ fontSize: '14px', color: '#fff' }}>Đơn #{order.id}</strong>
                                                    <span style={{ fontSize: '11px', color: '#888', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        {order.payment_method === 'CK' ? (
                                                            <>
                                                                <CreditCardIcon size={12} /> VietQR
                                                            </>
                                                        ) : (
                                                            <>
                                                                <BanknoteIcon size={12} /> Tiền mặt
                                                            </>
                                                        )}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '11px', color: '#666' }}>
                                                    {order.created_at ? new Date(order.created_at).toLocaleString('vi-VN') : ''}
                                                </span>
                                            </div>

                                            <span style={{ fontSize: '15px', color: '#52c41a', fontWeight: 'bold' }}>
                                                +{Number(order.total_price || 0).toLocaleString('vi-VN')}đ
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: QUẢN LÝ THỰC ĐƠN MÓN ĂN */}
            {/* ========================================================= */}
            {activeSellerTab === 'menu' && (
                <div>
                    {/* FORM THÊM / CẬP NHẬT MÓN ĂN */}
                    <form 
                        onSubmit={handleAddOrUpdateFood} 
                        style={{ 
                            background: '#222', 
                            padding: '22px', 
                            borderRadius: '8px', 
                            marginBottom: '25px', 
                            border: editFoodId ? '2px solid #007bff' : '1px solid #333',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                        }}
                    >
                        <h3 style={{ margin: '0 0 15px 0', color: editFoodId ? '#007bff' : '#fff', fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {editFoodId ? <><EditIcon size={18} /> Cập nhật thông tin món ăn</> : <><PlusIcon size={18} /> Thêm món ăn mới vào thực đơn quán</>}
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

                    {/* BỘ LỌC VÀ TÌM KIẾM MÓN ĂN */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '350px' }}>
                            <input
                                type="text"
                                placeholder="Tìm kiếm món ăn trong quán..."
                                value={menuSearch}
                                onChange={e => setMenuSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '9px 14px',
                                    background: '#222',
                                    border: '1px solid #444',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    fontSize: '13px',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[
                                { key: 'all', label: `Tất cả (${foods.length})` },
                                { key: 'selling', label: `Đang mở bán (${foods.filter(f => !f.is_sold_out).length})` },
                                { key: 'sold_out', label: `Hết hàng (${foods.filter(f => f.is_sold_out).length})` }
                            ].map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => setMenuFilter(item.key)}
                                    style={{
                                        padding: '7px 14px',
                                        borderRadius: '6px',
                                        border: '1px solid #444',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: 'bold',
                                        background: menuFilter === item.key ? '#ee4d2d' : '#222',
                                        color: menuFilter === item.key ? '#fff' : '#aaa',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* DANH SÁCH MÓN ĂN */}
                    {displayedFoods.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#222', borderRadius: '8px', border: '1px solid #333', color: '#888' }}>
                            <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>Không tìm thấy món ăn nào phù hợp.</p>
                            <p style={{ fontSize: '13px', margin: 0 }}>Hãy thử tìm kiếm với từ khóa khác hoặc thêm món mới ở form phía trên!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                            {displayedFoods.map(food => (
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
                                                    color: '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                <StatusDot color="#fff" size={8} />
                                                {food.is_sold_out ? 'Mở bán lại' : 'Báo hết món'}
                                            </button>

                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    onClick={() => handleEditClick(food)}
                                                    style={{ flex: 1, padding: '8px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                                >
                                                    <EditIcon size={14} /> Sửa
                                                </button>
                                                
                                                <button 
                                                    onClick={() => handleDeleteFood(food.id, food.name)}
                                                    style={{ flex: 1, padding: '8px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                                >
                                                    <TrashIcon size={14} /> Xóa
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: QUẢN LÝ ĐƠN HÀNG */}
            {/* ========================================================= */}
            {activeSellerTab === 'orders' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px' }}>Danh Sách Đơn Hàng Của Khách</h3>
                            <span style={{ fontSize: '12px', color: '#888' }}>Hệ thống tự động cập nhật đơn mới mỗi 5 giây</span>
                        </div>

                        {/* BỘ LỌC TRẠNG THÁI ĐƠN HÀNG */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {[
                                { key: 'all', label: 'Tất cả', count: sellerOrders.length },
                                { key: 'pending', label: 'Chờ xác nhận', count: sellerOrders.filter(o => o.status === 'pending').length, dotColor: '#ff4d4f' },
                                { key: 'accepted', label: 'Đang chuẩn bị', count: sellerOrders.filter(o => o.status === 'accepted').length, dotColor: '#1890ff' },
                                { key: 'completed', label: 'Đã hoàn thành', count: sellerOrders.filter(o => o.status === 'completed').length, dotColor: '#52c41a' },
                                { key: 'cancelled', label: 'Đã từ chối', count: sellerOrders.filter(o => o.status === 'cancelled').length, dotColor: '#888' }
                            ].map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => setOrderFilter(item.key)}
                                    style={{
                                        padding: '7px 14px',
                                        borderRadius: '6px',
                                        border: '1px solid #444',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: 'bold',
                                        background: orderFilter === item.key ? '#ee4d2d' : '#222',
                                        color: orderFilter === item.key ? '#fff' : '#aaa',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    {item.dotColor && <StatusDot color={item.dotColor} size={7} />}
                                    {item.label} ({item.count})
                                </button>
                            ))}
                        </div>
                    </div>

                    {displayedOrders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#222', borderRadius: '8px', border: '1px solid #333', color: '#888' }}>
                            <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>Không có đơn hàng nào trong mục này.</p>
                            <p style={{ fontSize: '13px', margin: 0 }}>Khi có khách đặt món qua App, đơn hàng sẽ hiển thị tại đây ngay lập tức!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {displayedOrders.map(order => {
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
                                            border: order.status === 'pending' ? '1px solid #ee4d2d' : (order.status === 'cancelled' ? '1px solid #552222' : '1px solid #333'), 
                                            borderRadius: '8px', 
                                            padding: '20px',
                                            boxShadow: '0 3px 12px rgba(0,0,0,0.3)',
                                            opacity: order.status === 'cancelled' ? 0.75 : 1
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
                                                background: order.status === 'pending' ? '#ff4d4f22' : (order.status === 'accepted' ? '#007bff22' : (order.status === 'cancelled' ? '#ff4d4f22' : '#28a74522')),
                                                color: order.status === 'pending' ? '#ff4d4f' : (order.status === 'accepted' ? '#1890ff' : (order.status === 'cancelled' ? '#ff4d4f' : '#52c41a')),
                                                border: `1px solid ${order.status === 'pending' ? '#ff4d4f' : (order.status === 'accepted' ? '#1890ff' : (order.status === 'cancelled' ? '#ff4d4f' : '#52c41a'))}`,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                {order.status === 'pending' && <><StatusDot color="#ff4d4f" size={7} />Chờ xác nhận</>}
                                                {order.status === 'accepted' && <><StatusDot color="#1890ff" size={7} />Đang chuẩn bị</>}
                                                {order.status === 'cancelled' && <><StatusDot color="#ff4d4f" size={7} />Đã từ chối</>}
                                                {order.status === 'completed' && <><StatusDot color="#52c41a" size={7} />Đã hoàn thành</>}
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

                                            {/* HIỂN THỊ GHI CHÚ CỦA KHÁCH NẾU CÓ */}
                                            {order.note && (
                                                <div style={{
                                                    marginTop: '12px',
                                                    padding: '10px 14px',
                                                    background: '#332616',
                                                    border: '1px solid #fa8c16',
                                                    borderRadius: '6px',
                                                    fontSize: '13px',
                                                    display: 'flex',
                                                    gap: '10px',
                                                    alignItems: 'flex-start'
                                                }}>
                                                    <FileTextIcon size={16} color="#ffa940" />
                                                    <div>
                                                        <strong style={{ color: '#ffa940' }}>Ghi chú của khách cho quán:</strong>
                                                        <div style={{ color: '#fff', marginTop: '2px', fontStyle: 'italic' }}>"{order.note}"</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* HIỂN THỊ LÝ DO TỪ CHỐI NẾU CÓ */}
                                            {order.cancel_reason && (
                                                <div style={{
                                                    marginTop: '12px',
                                                    padding: '10px 14px',
                                                    background: 'rgba(255, 77, 79, 0.12)',
                                                    border: '1px solid rgba(255, 77, 79, 0.4)',
                                                    borderRadius: '6px',
                                                    fontSize: '13px',
                                                    display: 'flex',
                                                    gap: '10px',
                                                    alignItems: 'flex-start'
                                                }}>
                                                    <ShieldAlertIcon size={16} color="#ff7875" />
                                                    <div>
                                                        <strong style={{ color: '#ff7875' }}>Lý do quán từ chối nhận đơn:</strong>
                                                        <div style={{ color: '#fff', marginTop: '2px' }}>"{order.cancel_reason}"</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* HIỂN THỊ VOUCHER ĐÃ ÁP DỤNG NẾU CÓ */}
                                            {order.voucher_code && (
                                                <div style={{ marginTop: '8px', fontSize: '13px', color: '#52c41a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <TicketIcon size={14} color="#52c41a" />
                                                    <span>Khách đã dùng Voucher: <strong style={{ textDecoration: 'underline' }}>{order.voucher_code}</strong> (Đã trừ: -{Number(order.discount_amount || 0).toLocaleString('vi-VN')}đ)</span>
                                                </div>
                                            )}
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
                                            
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                {order.status === 'pending' && (
                                                    <>
                                                        <button 
                                                            onClick={() => setRejectModal({
                                                                isOpen: true,
                                                                orderId: order.id,
                                                                reason: 'Quán đang tạm thời quá tải đơn'
                                                            })}
                                                            style={{ 
                                                                padding: '8px 14px', 
                                                                background: '#ff4d4f22', 
                                                                color: '#ff4d4f', 
                                                                border: '1px solid #ff4d4f', 
                                                                borderRadius: '4px', 
                                                                cursor: 'pointer', 
                                                                fontWeight: 'bold', 
                                                                fontSize: '13px',
                                                                transition: 'all 0.2s',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px'
                                                            }}
                                                        >
                                                            <XIcon size={14} /> Từ chối đơn
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateOrderStatus(order.id, 'accepted')}
                                                            style={{ padding: '8px 18px', background: '#ee4d2d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                        >
                                                            <CheckIcon size={14} /> Xác nhận đơn
                                                        </button>
                                                    </>
                                                )}
                                                {order.status === 'accepted' && (
                                                    <button 
                                                        onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                                        style={{ padding: '8px 18px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                    >
                                                        <TruckIcon size={15} /> Giao xong
                                                    </button>
                                                )}
                                                {order.status === 'completed' && (
                                                    <span style={{ color: '#28a745', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <CheckCircleIcon size={15} /> Đơn đã xong
                                                    </span>
                                                )}
                                                {order.status === 'cancelled' && (
                                                    <span style={{ color: '#ff4d4f', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <XCircleIcon size={15} /> Đã hủy
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

            {/* ========================================================= */}
            {/* TAB 4: CÀI ĐẶT & HỒ SƠ QUÁN */}
            {/* ========================================================= */}
            {activeSellerTab === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    
                    {/* KHỐI 1: BẬT TẮT TRẠNG THÁI HOẠT ĐỘNG & ĐỔI AVATAR */}
                    <div style={{ background: '#222', padding: '22px', borderRadius: '8px', border: '1px solid #333' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <SettingsIcon size={18} /> Hoạt Động & Ảnh Đại Diện Quán
                        </h3>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <img 
                                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836'} 
                                    alt="Avatar Shop" 
                                    style={{ width: '85px', height: '85px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #ee4d2d' }} 
                                />
                                <div>
                                    <h4 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>Ảnh đại diện quán</h4>
                                    <p style={{ fontSize: '13px', color: '#888', margin: '0 0 10px 0' }}>
                                        Ảnh này sẽ hiển thị cho khách hàng ở trang chủ và chi tiết quán.
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

                            {/* CÔNG TẮC ĐẨY SÀN & MỞ CỬA */}
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
                                        transition: 'background 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    {currentUser.is_published ? <><EyeIcon size={16} /> Đang Hiện Sàn</> : <><EyeOffIcon size={16} /> Đã Ẩn Khỏi Sàn</>}
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
                                        transition: 'background 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <StatusDot color="#fff" size={8} />
                                    {currentUser.is_open ? 'Đang Mở Cửa' : 'Đang Đóng Cửa'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* KHỐI 2: FORM THÔNG TIN CHI TIẾT CỦA QUÁN */}
                    <form onSubmit={handleSaveShopInfo} style={{ background: '#222', padding: '25px', borderRadius: '8px', border: '1px solid #333' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <StoreIcon size={18} /> Thông Tin Chi Tiết Cửa Hàng
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={formLabelStyle}>Tên quán ăn / cửa hàng *</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={shopNameInput} 
                                    onChange={e => setShopNameInput(e.target.value)}
                                    style={formInputStyle} 
                                />
                            </div>

                            <div>
                                <label style={formLabelStyle}>Danh mục kinh doanh *</label>
                                <select 
                                    required 
                                    value={shopCategoryInput} 
                                    onChange={e => setShopCategoryInput(e.target.value)}
                                    style={{
                                        ...formInputStyle,
                                        cursor: 'pointer'
                                    }} 
                                >
                                    {SHOP_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat} style={{ background: '#222', color: '#fff' }}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={formLabelStyle}>Số điện thoại hotline quán *</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={shopPhoneInput} 
                                    onChange={e => setShopPhoneInput(e.target.value)}
                                    style={formInputStyle} 
                                />
                            </div>

                            <div>
                                <label style={formLabelStyle}>Địa chỉ chi tiết của quán *</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                                    value={shopAddressInput} 
                                    onChange={e => setShopAddressInput(e.target.value)}
                                    style={formInputStyle} 
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={formLabelStyle}>Mô tả / Giới thiệu ngắn gọn về quán</label>
                            <textarea 
                                rows="3"
                                placeholder="Ví dụ: Chuyên các món ăn đêm tươi ngon, đảm bảo vệ sinh an toàn thực phẩm..."
                                value={shopDescriptionInput} 
                                onChange={e => setShopDescriptionInput(e.target.value)}
                                style={{ ...formInputStyle, resize: 'none' }} 
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSavingShopInfo}
                            style={{ 
                                padding: '12px 28px', 
                                background: isSavingShopInfo ? '#666' : '#ee4d2d', 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: '6px', 
                                cursor: isSavingShopInfo ? 'not-allowed' : 'pointer', 
                                fontWeight: 'bold', 
                                fontSize: '15px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {isSavingShopInfo ? 'Đang lưu...' : <><SaveIcon size={16} /> Lưu Thay Đổi Cài Đặt</>}
                        </button>
                    </form>
                </div>
            )}
                </div>
            </div>

            {/* ========================================================= */}
            {/* MODAL TỪ CHỐI NHẬN ĐƠN HÀNG */}
            {/* ========================================================= */}
            {rejectModal.isOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                    <div style={{ background: '#1c1f26', padding: '26px', borderRadius: '12px', width: '100%', maxWidth: '480px', border: '1px solid #ff4d4f', boxShadow: '0 20px 50px rgba(0,0,0,0.7)', color: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255, 77, 79, 0.2)', border: '1px solid #ff4d4f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ShieldAlertIcon size={22} color="#ff4d4f" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', color: '#ff4d4f' }}>
                                    Từ Chối Đơn Hàng #{rejectModal.orderId}
                                </h3>
                                <span style={{ fontSize: '12px', color: '#aaa' }}>
                                    Đơn hàng sẽ chuyển sang trạng thái "Đã từ chối" và gửi thông báo tới khách.
                                </span>
                            </div>
                        </div>

                        {/* Chọn nhanh lý do từ chối */}
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '6px' }}>
                                Chọn nhanh lý do từ chối:
                            </label>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {[
                                    'Quán đang tạm thời quá tải đơn',
                                    'Hết món / thiếu nguyên liệu',
                                    'Quán chuẩn bị đóng cửa',
                                    'Ngoài khoảng cách giao hàng'
                                ].map(preset => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setRejectModal(prev => ({ ...prev, reason: preset }))}
                                        style={{
                                            padding: '5px 10px',
                                            background: rejectModal.reason === preset ? '#ff4d4f33' : '#2a2a2a',
                                            color: rejectModal.reason === preset ? '#ff7875' : '#ccc',
                                            border: rejectModal.reason === preset ? '1px solid #ff4d4f' : '1px solid #444',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleConfirmReject}>
                            <div style={{ marginBottom: '18px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#ff7875', marginBottom: '6px' }}>
                                    Nội dung lý do từ chối đơn: <span style={{ color: '#ff4d4f' }}>*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={rejectModal.reason}
                                    onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                                    placeholder="Nhập lý do gửi tới khách hàng..."
                                    style={{
                                        width: '100%',
                                        background: '#0e1117',
                                        border: '1px solid #444',
                                        borderRadius: '6px',
                                        padding: '10px 12px',
                                        color: '#fff',
                                        fontSize: '13px',
                                        boxSizing: 'border-box',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setRejectModal({ isOpen: false, orderId: null, reason: '' })}
                                    style={{ padding: '9px 18px', background: '#333', color: '#ccc', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '9px 20px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                                >
                                    Xác Nhận Từ Chối
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL XÁC NHẬN XÓA MÓN ĂN */}
            {/* ========================================================= */}
            {deleteFoodModal.isOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                    <div style={{ background: '#1c1f26', padding: '26px', borderRadius: '12px', width: '100%', maxWidth: '440px', border: '1px solid #444', boxShadow: '0 20px 50px rgba(0,0,0,0.7)', color: '#fff' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#ff4d4f', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrashIcon size={18} color="#ff4d4f" /> Xác Nhận Xóa Món Ăn
                        </h3>
                        <p style={{ fontSize: '14px', color: '#ccc', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                            Bạn có chắc chắn muốn xóa vĩnh viễn món <strong style={{ color: '#fff' }}>"{deleteFoodModal.foodName}"</strong> khỏi thực đơn quán?
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setDeleteFoodModal({ isOpen: false, foodId: null, foodName: '' })}
                                style={{ padding: '9px 18px', background: '#333', color: '#ccc', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDeleteFood}
                                style={{
                                    padding: '9px 20px',
                                    background: '#ff4d4f',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 'bold'
                                }}
                            >
                                Xóa Món
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

// Helpers style
const sidebarNavStyle = (isActive) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '11px 14px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    background: isActive ? 'rgba(238, 77, 45, 0.15)' : 'transparent',
    color: isActive ? '#ff5722' : '#9ca3af',
    fontWeight: isActive ? 'bold' : '500',
    fontSize: '13.5px',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxSizing: 'border-box'
});

const sidebarBadgeStyle = (isActive) => ({
    background: isActive ? 'rgba(238, 77, 45, 0.25)' : 'rgba(255, 255, 255, 0.08)',
    color: isActive ? '#ff5722' : '#888',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold'
});

const getTabButtonStyle = (isActive) => ({
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    background: isActive ? '#ee4d2d' : '#2a2a2a',
    color: isActive ? '#fff' : '#aaa',
    fontWeight: 'bold',
    fontSize: '14px',
    transition: 'all 0.2s'
});

const kpiCardStyle = {
    background: '#222',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #333',
    boxShadow: '0 4px 15px rgba(0,0,0,0.25)'
};

const formLabelStyle = {
    display: 'block',
    fontSize: '13px',
    color: '#ccc',
    marginBottom: '6px'
};

const formInputStyle = {
    width: '100%',
    padding: '11px 14px',
    background: '#1c1c1c',
    border: '1px solid #444',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none'
};