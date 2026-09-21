import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home({ currentUser }) { // 1. Nhận currentUser từ component cha truyền vào
    const [shops, setShops] = useState([]);
    const navigate = useNavigate();

    // Hàm kiểm tra đăng nhập trước khi cho phép vào xem quán
    const handleShopClick = (shopId) => {
        if (!currentUser) {
        // Lưu lại id quán muốn vào để sau khi đăng nhập xong tự động quay lại
            localStorage.setItem('redirect_shop_id', shopId);
        
        // Không dùng alert nữa, chuyển hướng thẳng lập tức
            navigate('/login');
        } else {
            navigate(`/shop/${shopId}`);
        }
    };

    useEffect(() => {
        fetch('http://localhost:5000/api/shops')
            .then(res => res.json())
            .then(data => setShops(data))
            .catch(err => console.error("Lỗi lấy danh sách quán ăn:", err));
    }, []);

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
                    <h3 style={{ color: '#fff', margin: '0 0 20px 0', borderBottom: '1px solid #333', paddingBottom: '15px', textAlign: 'center' }}>
                        Danh sách Quán ăn
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {shops.length > 0 ? (
                            shops.map(shop => (
                                <div 
                                    key={shop.id} 
                                    onClick={() => handleShopClick(shop.id)} // 2. Gọi qua hàm bảo vệ handleShopClick thay vì navigate thẳng
                                    style={{ 
                                        display: 'flex', gap: '15px', padding: '10px', 
                                        background: '#2a2a2a', borderRadius: '8px', cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#2a2a2a'}
                                >
                                    <img src={shop.avatar || "https://images.unsplash.com/photo-1504674900247-0877df9cc836"} alt={shop.shop_name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <h4 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '15px' }}>{shop.shop_name}</h4>
                                        <span style={{ color: '#aaa', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ color: '#ee4d2d' }}>🏷 Danh mục: {shop.shop_category || 'Đồ ăn'}</span> • 
                                            <span style={{ color: shop.is_open ? '#28a745' : '#dc3545' }}>
                                                {shop.is_open ? '● Đang mở cửa' : '● Đã đóng cửa'}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                                <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>Chưa có quán ăn nào trên sàn.</p>
                                <p style={{ fontSize: '13px', margin: 0, color: '#555' }}>Hãy đăng ký tài khoản Seller, tạo quán và bật "Đẩy lên sàn" để quán tự động xuất hiện ở đây!</p>
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