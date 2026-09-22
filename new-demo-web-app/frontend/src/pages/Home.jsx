import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, TagIcon, MapPinIcon, UtensilsIcon, XIcon, TicketIcon, CheckCircleIcon } from '../components/Icons';
import { useToast } from '../context/ToastContext';

export default function Home({ 
    currentUser, 
    selectedCategory = 'Tất cả', 
    setSelectedCategory,
    searchKeyword = '',
    setSearchKeyword
}) {
    const { showToast } = useToast();
    const [shops, setShops] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [vouchers, setVouchers] = useState([]);
    const [isVoucherLoading, setIsVoucherLoading] = useState(false);
    const [savingVoucherId, setSavingVoucherId] = useState(null);
    const navigate = useNavigate();

    // Tải danh sách voucher phát hành công khai khi vào danh mục 'Voucher'
    const fetchPublicVouchers = () => {
        setIsVoucherLoading(true);
        const url = currentUser?.id 
            ? `http://localhost:5000/api/vouchers/public?userId=${currentUser.id}`
            : 'http://localhost:5000/api/vouchers/public';
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.vouchers)) {
                    setVouchers(data.vouchers);
                }
            })
            .catch(err => console.error("Lỗi lấy danh sách voucher:", err))
            .finally(() => setIsVoucherLoading(false));
    };

    useEffect(() => {
        if (selectedCategory === 'Voucher') {
            fetchPublicVouchers();
        }
    }, [selectedCategory, currentUser]);

    // Xử lý người dùng bấm lưu voucher vào ví
    const handleSaveVoucher = async (voucherId) => {
        if (!currentUser) {
            localStorage.setItem('redirect_to', '/');
            navigate('/login');
            return;
        }
        setSavingVoucherId(voucherId);
        try {
            const res = await fetch('http://localhost:5000/api/user/save-voucher', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.id,
                    voucherId: voucherId
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast(data.message || "Đã lưu voucher vào ví thành công!", "success");
                setVouchers(prev => prev.map(v => v.id === voucherId ? { ...v, isSaved: true } : v));
            } else {
                showToast(data.message || "Không thể lưu voucher!", "error");
            }
        } catch (error) {
            console.error("Lỗi lưu voucher:", error);
            showToast("Lỗi kết nối máy chủ!", "error");
        } finally {
            setSavingVoucherId(null);
        }
    };

    // Hàm kiểm tra đăng nhập trước khi cho phép vào xem quán
    const handleShopClick = (shopId) => {
        if (!currentUser) {
            localStorage.setItem('redirect_shop_id', shopId);
            navigate('/login');
        } else {
            navigate(`/shop/${shopId}`);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        const url = searchKeyword && searchKeyword.trim() !== ''
            ? `http://localhost:5000/api/shops?search=${encodeURIComponent(searchKeyword.trim())}`
            : 'http://localhost:5000/api/shops';

        fetch(url)
            .then(res => res.json())
            .then(data => setShops(Array.isArray(data) ? data : []))
            .catch(err => console.error("Lỗi lấy danh sách quán ăn:", err))
            .finally(() => setIsLoading(false));
    }, [searchKeyword]);

    // Lọc danh sách quán:
    // - Trước khi đăng nhập (!currentUser): chỉ hiện những quán đang mở cửa
    // - Sau khi đăng nhập (currentUser): hiện đầy đủ cả quán mở và quán đóng (quán đóng được làm xám)
    const displayedShops = shops.filter(shop => {
        if (!currentUser && !shop.is_open) {
            return false;
        }
        if (searchKeyword) return true; // Backend đã lọc chính xác theo từ khóa
        if (!selectedCategory || selectedCategory === 'Tất cả') return true;
        return (shop.shop_category || 'Đồ ăn') === selectedCategory;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* NHÚNG CSS ANIMATION CHO HÌNH NỀN Ở ĐÂY */}
            <style>
                {`
                    @keyframes moveBackground {
                        0% { background-position: 0% 0%; }
                        50% { background-position: 100% 100%; }
                        100% { background-position: 0% 0%; }
                    }
                `}
            </style>

            {/* 1. KHU VỰC HÌNH NỀN CHUYỂN ĐỘNG VÀ DANH SÁCH QUÁN */}
            <div style={{ 
                background: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url("https://images.unsplash.com/photo-1555396273-367ea4eb4db5")',
                backgroundSize: '120%',
                backgroundRepeat: 'no-repeat',
                animation: 'moveBackground 40s ease-in-out infinite', 
                padding: '60px 20px', 
                minHeight: '80vh', 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'flex-start'
            }}>
                <div style={{ 
                    width: '100%',
                    maxWidth: selectedCategory === 'Voucher' ? '960px' : '800px', 
                    background: '#1c1c1c', 
                    borderRadius: '8px', 
                    padding: '20px',
                    maxHeight: '650px', 
                    overflowY: 'auto',
                    border: '1px solid #333',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    transition: 'max-width 0.3s ease'
                }}>
                    {/* DÒNG TIÊU ĐỀ: DANH MỤC / KẾT QUẢ TÌM KIẾM / SĂN VOUCHER */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 20px 0', borderBottom: '1px solid #333', paddingBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                        <h3 style={{ color: '#fff', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {searchKeyword ? (
                                <>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><SearchIcon size={16} /> Kết quả tìm kiếm cho: <strong style={{ color: '#ee4d2d' }}>"{searchKeyword}"</strong></span>
                                    <span style={{ fontSize: '14px', color: '#888', fontWeight: 'normal' }}>
                                        ({displayedShops.length} quán phù hợp)
                                    </span>
                                </>
                            ) : selectedCategory === 'Voucher' ? (
                                <>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                        <TicketIcon size={20} color="#ee4d2d" />
                                        <span>Săn Voucher Ưu Đãi M-Bite</span>
                                    </span>
                                    <span style={{ fontSize: '14px', color: '#888', fontWeight: 'normal', marginLeft: '6px' }}>
                                        ({vouchers.length} mã đang phát hành)
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span>{selectedCategory === 'Tất cả' ? 'Danh sách Quán ăn' : `Danh mục: ${selectedCategory}`}</span>
                                    <span style={{ fontSize: '14px', color: '#888', fontWeight: 'normal', marginLeft: '10px' }}>
                                        ({displayedShops.length} quán)
                                    </span>
                                </>
                            )}
                        </h3>
                        {(searchKeyword || selectedCategory !== 'Tất cả') && (
                            <button 
                                onClick={() => {
                                    if (setSearchKeyword) setSearchKeyword('');
                                    if (setSelectedCategory) setSelectedCategory('Tất cả');
                                }}
                                style={{ 
                                    background: '#333', 
                                    color: '#fff', 
                                    border: '1px solid #555', 
                                    padding: '6px 14px', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer', 
                                    fontSize: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <XIcon size={12} /> Xem tất cả quán
                            </button>
                        )}
                    </div>

                    {/* NỘI DUNG: TAB VOUCHER HOẶC DANH SÁCH QUÁN ĂN */}
                    {selectedCategory === 'Voucher' ? (
                        <div>
                            {isVoucherLoading ? (
                                <div style={{ textAlign: 'center', padding: '50px 20px', color: '#888' }}>
                                    Đang tải danh sách voucher ưu đãi...
                                </div>
                            ) : vouchers.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                                        <TicketIcon size={48} color="#555" />
                                    </div>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#fff' }}>Hiện tại chưa có voucher ưu đãi nào được phát hành.</p>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#777' }}>Quản trị viên sẽ sớm phát hành các voucher ưu đãi hấp dẫn. Quý khách vui lòng quay lại sau!</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                                    {vouchers.map(v => {
                                        const minOrder = Number(v.min_order) || 0;
                                        const maxDiscount = Number(v.max_discount) || 0;
                                        const isSaving = savingVoucherId === v.id;
                                        const isLimitReached = v.usage_limit > 0 && v.used_count >= v.usage_limit;

                                        return (
                                            <div
                                                key={v.id}
                                                style={{
                                                    background: '#242424',
                                                    border: v.isSaved ? '1px solid #52c41a55' : '1px solid #383838',
                                                    borderRadius: '8px',
                                                    padding: '16px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-between',
                                                    position: 'relative',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                                }}
                                            >
                                                {/* Dải màu nhận diện cạnh trái */}
                                                <div style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: '4px',
                                                    borderTopLeftRadius: '8px',
                                                    borderBottomLeftRadius: '8px',
                                                    background: v.isUsed ? '#555' : v.isSaved ? '#52c41a' : '#ee4d2d'
                                                }} />

                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                        <span style={{ 
                                                            fontSize: '13px', 
                                                            fontWeight: 'bold', 
                                                            color: '#ee4d2d', 
                                                            background: 'rgba(238, 77, 45, 0.12)', 
                                                            border: '1px dashed #ee4d2d66',
                                                            padding: '4px 10px', 
                                                            borderRadius: '4px',
                                                            letterSpacing: '1px'
                                                        }}>
                                                            {v.code}
                                                        </span>
                                                        <span style={{ 
                                                            fontSize: '12px', 
                                                            color: '#52c41a', 
                                                            fontWeight: 'bold', 
                                                            background: 'rgba(82, 196, 26, 0.12)', 
                                                            padding: '3px 8px', 
                                                            borderRadius: '4px' 
                                                        }}>
                                                            {v.discount_type === 'percent' 
                                                                ? `Giảm ${v.discount_value}%` 
                                                                : `Giảm ${Number(v.discount_value).toLocaleString('vi-VN')}đ`}
                                                        </span>
                                                    </div>

                                                    <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#fff', fontWeight: '600' }}>
                                                        {v.name}
                                                    </h4>

                                                    {v.description && (
                                                        <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#aaa', lineHeight: '1.4' }}>
                                                            {v.description}
                                                        </p>
                                                    )}

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px', color: '#888', marginBottom: '14px' }}>
                                                        <span>• Đơn tối thiểu: <strong style={{ color: '#ccc' }}>{minOrder > 0 ? `${minOrder.toLocaleString('vi-VN')}đ` : 'Mọi đơn hàng'}</strong></span>
                                                        {v.discount_type === 'percent' && maxDiscount > 0 && (
                                                            <span>• Giảm tối đa: <strong style={{ color: '#ccc' }}>{maxDiscount.toLocaleString('vi-VN')}đ</strong></span>
                                                        )}
                                                        {v.expires_at && (
                                                            <span>• Hạn dùng: <strong style={{ color: '#ccc' }}>{new Date(v.expires_at).toLocaleDateString('vi-VN')}</strong></span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Nút hành động */}
                                                <div style={{ borderTop: '1px solid #333', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '11px', color: '#777' }}>
                                                        {v.usage_limit > 0 ? `Đã dùng ${v.used_count}/${v.usage_limit}` : `Đã dùng ${v.used_count || 0}`}
                                                    </span>

                                                    {!currentUser ? (
                                                        <button
                                                            onClick={() => navigate('/login')}
                                                            style={{
                                                                padding: '6px 14px',
                                                                background: '#333',
                                                                color: '#ee4d2d',
                                                                border: '1px solid #ee4d2d55',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Đăng nhập để lưu
                                                        </button>
                                                    ) : v.isUsed ? (
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '5px',
                                                            padding: '6px 12px',
                                                            background: '#2b2b2b',
                                                            color: '#777',
                                                            borderRadius: '6px',
                                                            fontSize: '12px',
                                                            fontWeight: '500'
                                                        }}>
                                                            Đã sử dụng
                                                        </span>
                                                    ) : v.isSaved ? (
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '5px',
                                                            padding: '6px 12px',
                                                            background: '#52c41a15',
                                                            border: '1px solid #52c41a44',
                                                            color: '#52c41a',
                                                            borderRadius: '6px',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            <CheckCircleIcon size={14} /> Đã lưu vào ví
                                                        </span>
                                                    ) : isLimitReached ? (
                                                        <span style={{
                                                            padding: '6px 12px',
                                                            background: '#2b2b2b',
                                                            color: '#ff4d4f',
                                                            borderRadius: '6px',
                                                            fontSize: '12px',
                                                            fontWeight: '500'
                                                        }}>
                                                            Hết lượt dùng
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleSaveVoucher(v.id)}
                                                            disabled={isSaving}
                                                            style={{
                                                                padding: '7px 16px',
                                                                background: '#ee4d2d',
                                                                color: '#fff',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                fontWeight: 'bold',
                                                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                transition: 'background 0.2s',
                                                                opacity: isSaving ? 0.7 : 1
                                                            }}
                                                            onMouseEnter={e => { if (!isSaving) e.currentTarget.style.background = '#d73a1c'; }}
                                                            onMouseLeave={e => { if (!isSaving) e.currentTarget.style.background = '#ee4d2d'; }}
                                                        >
                                                            <TicketIcon size={14} />
                                                            {isSaving ? 'Đang lưu...' : 'Lưu voucher'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
                                Đang tìm kiếm quán ăn...
                            </div>
                        ) : displayedShops.length > 0 ? (
                            displayedShops.map(shop => {
                                const isClosed = !shop.is_open;
                                return (
                                <div 
                                    key={shop.id} 
                                    onClick={() => handleShopClick(shop.id)}
                                    style={{ 
                                        display: 'flex', gap: '15px', padding: '12px', 
                                        background: isClosed ? '#1f1f1f' : '#2a2a2a', 
                                        borderRadius: '8px', 
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease-in-out',
                                        filter: isClosed ? 'grayscale(100%)' : 'none',
                                        opacity: isClosed ? 0.55 : 1,
                                        border: isClosed ? '1px dashed #444' : '1px solid transparent',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = isClosed ? '#272727' : '#333';
                                        if (isClosed) e.currentTarget.style.opacity = '0.85';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = isClosed ? '#1f1f1f' : '#2a2a2a';
                                        if (isClosed) e.currentTarget.style.opacity = '0.55';
                                    }}
                                >
                                    <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                                        <img 
                                            src={shop.avatar || "https://images.unsplash.com/photo-1504674900247-0877df9cc836"} 
                                            alt={shop.shop_name} 
                                            style={{ 
                                                width: '80px', 
                                                height: '80px', 
                                                objectFit: 'cover', 
                                                borderRadius: '6px', 
                                                display: 'block'
                                            }} 
                                        />
                                        {isClosed && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0, left: 0, right: 0, bottom: 0,
                                                background: 'rgba(0,0,0,0.55)',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                letterSpacing: '0.5px'
                                            }}>
                                                Tạm đóng
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <h4 style={{ color: isClosed ? '#aaa' : '#fff', margin: 0, fontSize: '15px' }}>{shop.shop_name}</h4>
                                            {isClosed && (
                                                <span style={{ 
                                                    background: '#333', 
                                                    color: '#aaa', 
                                                    fontSize: '10px', 
                                                    padding: '2px 6px', 
                                                    borderRadius: '4px', 
                                                    fontWeight: 'bold', 
                                                    border: '1px solid #444'
                                                }}>
                                                    ĐÃ ĐÓNG CỬA
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ color: '#aaa', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            <span style={{ color: isClosed ? '#888' : '#ee4d2d', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><TagIcon size={12} /> Danh mục: {shop.shop_category || 'Đồ ăn'}</span> • 
                                            <span style={{ color: shop.is_open ? '#28a745' : '#888' }}>
                                                {shop.is_open ? '● Đang mở cửa' : '● Đã đóng cửa'}
                                            </span>
                                            {shop.shop_address && (
                                                <span style={{ color: '#777', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    • <MapPinIcon size={12} /> {shop.shop_address}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                                );
                            })
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                                <div style={{ marginBottom: '15px', color: '#555', display: 'flex', justifyContent: 'center' }}>
                                    {searchKeyword ? <SearchIcon size={48} /> : <UtensilsIcon size={48} />}
                                </div>
                                {searchKeyword ? (
                                    <>
                                        <h4 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '16px' }}>
                                            Không tìm thấy quán nào có từ khóa "{searchKeyword}".
                                        </h4>
                                        <p style={{ fontSize: '13px', margin: '0 0 20px 0', color: '#888' }}>
                                            Bạn hãy thử tìm kiếm với từ khóa khác (ví dụ: "Quán", "Cơm", "Bếp",...) nhé!
                                        </p>
                                        <button 
                                            onClick={() => {
                                                if (setSearchKeyword) setSearchKeyword('');
                                                if (setSelectedCategory) setSelectedCategory('Tất cả');
                                            }}
                                            style={{ background: '#ee4d2d', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                                        >
                                            Xem tất cả quán
                                        </button>
                                    </>
                                ) : selectedCategory !== 'Tất cả' ? (
                                    <>
                                        <p style={{ fontSize: '16px', margin: '0 0 8px 0', color: '#fff' }}>Chưa có quán nào thuộc danh mục "{selectedCategory}".</p>
                                        <p style={{ fontSize: '13px', margin: '0 0 15px 0', color: '#888' }}>Hãy chọn danh mục khác hoặc quay lại xem tất cả quán nhé!</p>
                                        <button 
                                            onClick={() => setSelectedCategory && setSelectedCategory('Tất cả')}
                                            style={{ background: '#ee4d2d', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                                        >
                                            Xem tất cả quán
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>Chưa có quán ăn nào trên sàn.</p>
                                        <p style={{ fontSize: '13px', margin: 0, color: '#555' }}>Hãy đăng ký tài khoản Seller, tạo quán và bật "Đẩy lên sàn" để quán tự động xuất hiện ở đây!</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    )}
                </div>
            </div>

            {/* 2. KHU VỰC THÔNG TIN APP & DANH MỤC TRƯỚC FOOTER (Giữ nguyên phần dưới của ông) */}
            <div style={{ background: '#222', padding: '50px 20px', borderTop: '1px solid #333' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#ccc', lineHeight: '1.6' }}>
                    <h2 style={{ color: '#fff', fontSize: '18px', marginBottom: '15px' }}>Trải nghiệm thân thiện, thanh toán đơn giản với App M-Bite</h2>
                    <p style={{ fontSize: '13px', marginBottom: '15px' }}>
                        Giao diện M-Bite Fresh được tối ưu với các đề mục cụ thể, đồng thời phân chia rõ thành các bộ sưu tập khác nhau trên ứng dụng giúp cho việc đi chợ online trở nên dễ dàng hơn.
                    </p>
                    <p style={{ fontSize: '13px', marginBottom: '40px' }}>
                        Ứng dụng đi chợ bên cạnh hình thức trả tiền mặt khi nhận hàng, người dùng M-Bite còn có thể thanh toán qua ví điện tử hoặc tài khoản ngân hàng online.
                    </p>

                    <h3 style={{ color: '#fff', fontSize: '14px', marginBottom: '20px', fontWeight: 'bold' }}>DANH MỤC</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'space-between', fontSize: '12px' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <strong style={{ display: 'block', color: '#fff', marginBottom: '8px' }}>THUỐC</strong>
                                <span style={{ color: '#999' }}>Hoá mỹ phẩm | BCS | Thiết bị | Vitamins | Thuốc tây | Khẩu trang</span>
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <strong style={{ display: 'block', color: '#fff', marginBottom: '8px' }}>ĐỒ ĂN</strong>
                                <span style={{ color: '#999' }}>Vỉa hè | Món lẩu | Cơm hộp | Đồ uống | Đồ chay | Bánh kem</span>
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <strong style={{ display: 'block', color: '#fff', marginBottom: '8px' }}>SẢN PHẨM</strong>
                                <span style={{ color: '#999' }}>Mỹ phẩm | Đồ chơi | Sữa | Tã bỉm | Dụng cụ | Quần áo | Giày dép</span>
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <strong style={{ display: 'block', color: '#fff', marginBottom: '8px' }}>THỰC PHẨM & HOA</strong>
                                <span style={{ color: '#999' }}>Trái cây | Thịt trứng | Hải sản | Rau củ | Hoa sinh nhật | Cây cảnh</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}