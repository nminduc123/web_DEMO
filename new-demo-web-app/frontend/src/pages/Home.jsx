import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home({ 
    currentUser, 
    selectedCategory = 'Tất cả', 
    setSelectedCategory,
    searchKeyword = '',
    setSearchKeyword
}) {
    const [shops, setShops] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchInput, setSearchInput] = useState(searchKeyword || '');
    const navigate = useNavigate();

    // Đồng bộ searchInput khi searchKeyword thay đổi từ bên ngoài
    useEffect(() => {
        setSearchInput(searchKeyword || '');
    }, [searchKeyword]);

    const handleSearchSubmit = () => {
        if (setSearchKeyword) {
            setSearchKeyword(searchInput.trim());
        }
    };

    const handleClearSearch = () => {
        setSearchInput('');
        if (setSearchKeyword) setSearchKeyword('');
    };

    // Hàm kiểm tra đăng nhập trước khi cho phép vào xem quán
    const handleShopClick = (shopId) => {
        if (!currentUser) {
            // Lưu lại id quán muốn vào để sau khi đăng nhập xong tự động quay lại
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
                    maxWidth: '800px', 
                    background: '#1c1c1c', 
                    borderRadius: '8px', 
                    padding: '20px',
                    maxHeight: '600px', 
                    overflowY: 'auto',
                    border: '1px solid #333',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
                }}>
                    {/* THANH TÌM KIẾM TRỰC TIẾP TRÊN NỀN DYNAMIC (NGAY TRÊN DÒNG KẾT QUẢ TÌM KIẾM) */}
                    <div style={{ marginBottom: '18px' }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            background: '#242424', 
                            borderRadius: '8px', 
                            border: '1px solid #444', 
                            padding: '4px 6px 4px 14px',
                            gap: '10px',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
                            transition: 'border-color 0.2s'
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ee4d2d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: '18px' }}>
                                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input 
                                type="text"
                                placeholder="Tìm kiếm quán ăn, món ăn, thực đơn..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearchSubmit();
                                }}
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: '#fff',
                                    fontSize: '14px',
                                    padding: '8px 0'
                                }}
                            />
                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#888',
                                        cursor: 'pointer',
                                        padding: '6px',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '50%'
                                    }}
                                    title="Xóa tìm kiếm"
                                >
                                    ✕
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleSearchSubmit}
                                style={{
                                    background: '#ee4d2d',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '8px 18px',
                                    fontWeight: 'bold',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#d73a1c'}
                                onMouseLeave={e => e.currentTarget.style.background = '#ee4d2d'}
                            >
                                Tìm kiếm
                            </button>
                        </div>
                    </div>

                    {/* DÒNG KẾT QUẢ TÌM KIẾM CHO / DANH SÁCH QUÁN ĂN */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 20px 0', borderBottom: '1px solid #333', paddingBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                        <h3 style={{ color: '#fff', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {searchKeyword ? (
                                <>
                                    <span>🔍 Kết quả tìm kiếm cho: <strong style={{ color: '#ee4d2d' }}>"{searchKeyword}"</strong></span>
                                    <span style={{ fontSize: '14px', color: '#888', fontWeight: 'normal' }}>
                                        ({displayedShops.length} quán phù hợp)
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
                                    setSearchInput('');
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
                                ✕ Xem tất cả quán
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
                                ⏳ Đang tìm kiếm quán ăn...
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
                                        <span style={{ color: '#aaa', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                                            <span style={{ color: isClosed ? '#888' : '#ee4d2d' }}>🏷 Danh mục: {shop.shop_category || 'Đồ ăn'}</span> • 
                                            <span style={{ color: shop.is_open ? '#28a745' : '#888' }}>
                                                {shop.is_open ? '● Đang mở cửa' : '● Đã đóng cửa'}
                                            </span>
                                            {shop.shop_address && (
                                                <span style={{ color: '#777' }}>
                                                    • 📍 {shop.shop_address}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                                );
                            })
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                                <div style={{ fontSize: '48px', marginBottom: '15px' }}>{searchKeyword ? '🔍' : '🍽️'}</div>
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