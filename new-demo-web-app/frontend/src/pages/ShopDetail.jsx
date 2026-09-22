import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { StoreIcon, HeartIcon, TagIcon, MapPinIcon, AlertTriangleIcon, UtensilsIcon, CartIcon, ClockIcon } from '../components/Icons';

export default function ShopDetail({ currentUser, addToCart }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [shop, setShop] = useState(null);
    const [foods, setFoods] = useState([]);
    const [isOpen, setIsOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [isFavorited, setIsFavorited] = useState(false);

    // Kiểm tra xem quán đã được buyer yêu thích chưa
    useEffect(() => {
        if (currentUser && id) {
            fetch(`/api/favorites/check?userId=${currentUser.id}&shopId=${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setIsFavorited(!!data.isFavorited);
                    }
                })
                .catch(err => console.error("Lỗi kiểm tra favorite:", err));
        } else {
            setIsFavorited(false);
        }
    }, [id, currentUser]);

    const handleToggleFavorite = async () => {
        if (!currentUser) {
            showToast("Vui lòng đăng nhập để lưu quán yêu thích!", "warning");
            navigate('/login');
            return;
        }

        try {
            const res = await fetch('/api/favorites/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, shopId: id })
            });
            const data = await res.json();
            if (data.success) {
                setIsFavorited(data.isFavorited);
                if (data.isFavorited) {
                    showToast(`Đã thêm "${shop?.shop_name || 'Quán'}" vào danh sách quán yêu thích!`, "success");
                } else {
                    showToast(`Đã xóa "${shop?.shop_name || 'Quán'}" khỏi quán yêu thích.`, "info");
                }
            }
        } catch (err) {
            console.error("Lỗi toggle favorite:", err);
            showToast("Lỗi khi lưu quán yêu thích!", "error");
        }
    };

    useEffect(() => {
        const fetchShopMenu = async () => {
            setLoading(true);
            setErrorMsg('');
            try {
                const role = currentUser?.role || 'user';
                const res = await fetch(`/api/foods/${id}?role=${role}`);
                const data = await res.json();

                if (data.error) {
                    setErrorMsg(data.message || 'Quán ăn hiện không khả dụng.');
                    showToast(data.message || 'Quán ăn hiện không khả dụng.', 'error');
                } else {
                    setFoods(data.foods || []);
                    setIsOpen(!!data.is_open);
                    if (data.shop) {
                        setShop(data.shop);
                    }
                }
            } catch (err) {
                console.error("Lỗi tải thực đơn quán:", err);
                setErrorMsg("Lỗi kết nối đến máy chủ!");
                showToast("Lỗi kết nối đến máy chủ!", "error");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchShopMenu();
        }
    }, [id, currentUser]);

    const handleAddToCart = (food) => {
        if (!isOpen) {
            showToast("Quán đang tạm nghỉ, chưa thể đặt món!", "warning");
            return;
        }
        if (food.is_sold_out) {
            showToast("Món này hiện đã hết hàng!", "warning");
            return;
        }

        if (addToCart) {
            addToCart(food, shop);
            showToast(`Đã thêm "${food.name}" vào giỏ hàng!`, "success");
        }
    };

    if (loading) {
        return (
            <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', color: '#fff', textAlign: 'center' }}>
                <div style={{ padding: '60px 20px', background: '#222', borderRadius: '8px', border: '1px solid #333' }}>
                    <p style={{ fontSize: '18px', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <ClockIcon size={20} /> Đang tải thực đơn của quán...
                    </p>
                </div>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px', color: '#fff', textAlign: 'center' }}>
                <div style={{ padding: '50px 30px', background: '#2a2222', borderRadius: '8px', border: '1px solid #ff4d4f55' }}>
                    <div style={{ marginBottom: '15px', color: '#ff4d4f', display: 'flex', justifyContent: 'center' }}><StoreIcon size={48} /></div>
                    <h3 style={{ color: '#ff4d4f', margin: '0 0 10px 0' }}>Không thể xem thực đơn</h3>
                    <p style={{ color: '#ccc', marginBottom: '25px', lineHeight: '1.6' }}>{errorMsg}</p>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            padding: '10px 24px',
                            background: '#ee4d2d',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        ← Quay lại danh sách quán
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
            
            {/* NÚT QUAY LẠI TRANG CHỦ */}
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        padding: '8px 16px',
                        background: '#2a2a2a',
                        color: '#ccc',
                        border: '1px solid #444',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.background = '#333';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#ccc';
                        e.currentTarget.style.background = '#2a2a2a';
                    }}
                >
                    ← Trở lại danh sách quán
                </button>
            </div>

            {/* BANNER THÔNG TIN QUÁN */}
            <div style={{
                background: '#222',
                borderRadius: '10px',
                padding: '25px',
                marginBottom: '30px',
                border: '1px solid #333',
                boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <img
                        src={shop?.avatar || "https://images.unsplash.com/photo-1504674900247-0877df9cc836"}
                        alt={shop?.shop_name || "Quán ăn"}
                        style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '10px',
                            objectFit: 'cover',
                            border: '3px solid #ee4d2d'
                        }}
                    />
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h1 style={{ margin: 0, fontSize: '26px', color: '#fff' }}>
                                {shop?.shop_name || "Quán Ăn"}
                            </h1>
                            <button
                                onClick={handleToggleFavorite}
                                title={isFavorited ? "Bỏ yêu thích quán này" : "Lưu vào Quán yêu thích"}
                                style={{
                                    background: isFavorited ? '#ff4d4f22' : '#2a2a2a',
                                    border: isFavorited ? '1px solid #ff4d4f' : '1px solid #555',
                                    borderRadius: '50%',
                                    width: '38px',
                                    height: '38px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    transform: isFavorited ? 'scale(1.1)' : 'scale(1)',
                                    boxShadow: isFavorited ? '0 0 12px rgba(255, 77, 79, 0.6)' : 'none'
                                }}
                            >
                                <HeartIcon size={20} color={isFavorited ? '#ff4d4f' : '#888'} fill={isFavorited ? '#ff4d4f' : 'none'} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>
                            <span style={{ color: '#ee4d2d', background: '#ee4d2d22', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <TagIcon size={12} /> {shop?.shop_category || 'Đồ ăn'}
                            </span>
                            {shop?.shop_address && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><MapPinIcon size={13} /> {shop.shop_address}</span>
                            )}
                        </div>
                        {shop?.shop_description && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#888', maxWidth: '600px' }}>
                                {shop.shop_description}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        background: isOpen ? '#28a74522' : '#dc354522',
                        color: isOpen ? '#52c41a' : '#ff4d4f',
                        border: `1px solid ${isOpen ? '#52c41a' : '#ff4d4f'}`
                    }}>
                        {isOpen ? '● Đang mở cửa đón khách' : '● Quán đang tạm nghỉ'}
                    </span>
                </div>
            </div>

            {/* CẢNH BÁO NẾU QUÁN ĐANG ĐÓNG CỬA */}
            {!isOpen && (
                <div style={{
                    background: '#ff4d4f22',
                    border: '1px solid #ff4d4f',
                    color: '#ff4d4f',
                    padding: '14px 20px',
                    borderRadius: '8px',
                    marginBottom: '25px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <AlertTriangleIcon size={20} color="#ff4d4f" />
                    <span>Hiện tại quán đang tạm nghỉ đóng cửa, bạn chỉ có thể xem menu nhưng chưa thể thêm món vào giỏ hàng!</span>
                </div>
            )}

            {/* TIÊU ĐỀ MENU */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><UtensilsIcon size={20} /> Thực Đơn Món Ăn</span>
                    <span style={{ fontSize: '13px', color: '#888', fontWeight: 'normal' }}>
                        ({foods.length} món)
                    </span>
                </h2>
            </div>

            {/* LƯỚI DANH SÁCH MÓN ĂN */}
            {foods.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '70px 20px', background: '#222', borderRadius: '8px', border: '1px solid #333', color: '#888' }}>
                    <p style={{ fontSize: '18px', margin: '0 0 8px 0' }}>Quán chưa cập nhật món ăn nào trong thực đơn.</p>
                    <p style={{ fontSize: '13px', margin: 0 }}>Vui lòng quay lại sau khi chủ quán đã đăng món nhé!</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '20px'
                }}>
                    {foods.map((food) => {
                        const isSoldOut = !!food.is_sold_out;
                        const canOrder = isOpen && !isSoldOut;

                        return (
                            <div
                                key={food.id}
                                style={{
                                    background: '#222',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: '1px solid #333',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    opacity: canOrder ? 1 : 0.7,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ position: 'relative', width: '100%', height: '180px', background: '#1a1a1a' }}>
                                    <img
                                        src={food.img || "https://images.unsplash.com/photo-1504674900247-0877df9cc836"}
                                        alt={food.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    {isSoldOut && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: 'rgba(0,0,0,0.6)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#ff4d4f',
                                            fontWeight: 'bold',
                                            fontSize: '18px',
                                            letterSpacing: '1px'
                                        }}>
                                            HẾT HÀNG
                                        </div>
                                    )}
                                </div>

                                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', color: '#fff' }}>
                                            {food.name}
                                        </h3>
                                        <p style={{ margin: '0 0 16px 0', color: '#ee4d2d', fontWeight: 'bold', fontSize: '17px' }}>
                                            {Number(food.price).toLocaleString('vi-VN')}đ
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => handleAddToCart(food)}
                                        disabled={!canOrder}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: canOrder ? 'pointer' : 'not-allowed',
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            background: !isOpen ? '#444' : isSoldOut ? '#555' : '#ee4d2d',
                                            color: canOrder ? '#fff' : '#aaa',
                                            transition: 'background 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (canOrder) e.currentTarget.style.background = '#d73a1c';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (canOrder) e.currentTarget.style.background = '#ee4d2d';
                                        }}
                                    >
                                        {!isOpen ? 'Quán đang nghỉ' : isSoldOut ? 'Đã hết hàng' : (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                <CartIcon size={16} /> Thêm vào giỏ
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
