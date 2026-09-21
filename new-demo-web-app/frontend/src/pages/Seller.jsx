import { useNavigate } from 'react-router-dom';

export default function Seller({ currentUser, setCurrentUser }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Xóa state và localStorage
        setCurrentUser(null);
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Nếu chưa đăng nhập mà lén vào trang này thì đá về login
    if (!currentUser || currentUser.role !== 'seller') {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h2>Bạn không có quyền truy cập trang này!</h2>
                <button onClick={() => navigate('/login')}>Quay lại đăng nhập</button>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ee4d2d', paddingBottom: '15px', marginBottom: '20px' }}>
                <h2>🛒 Kênh Quản Lý Của Quán: <span style={{ color: '#ee4d2d' }}>{currentUser.shop_name}</span></h2>
                <button 
                    onClick={handleLogout} 
                    style={{ background: '#444', color: '#fff', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Đăng Xuất
                </button>
            </div>
            
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>Danh mục quán:</strong> {currentUser.shop_category}</p>
                <br />
                <h3 style={{ color: '#777' }}>🚧 Khu vực quản lý sản phẩm (Đang chuyển từ folder cũ sang...) 🚧</h3>
                <p style={{ color: '#777' }}>Mai mốt ông copy form thêm/sửa/xóa món ăn đắp vào chỗ này là đẹp!</p>
            </div>
        </div>
    );
}