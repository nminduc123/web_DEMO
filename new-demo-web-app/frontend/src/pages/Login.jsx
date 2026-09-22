import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { EyeIcon, EyeOffIcon } from '../components/Icons';

export default function Login({ setCurrentUser }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Tự động điền email nếu trước đó đã tích chọn "Nhớ tài khoản"
    useEffect(() => {
        const savedEmail = localStorage.getItem('remembered_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); // Xóa lỗi cũ

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (data.success) {
                // 1. Xử lý ghi nhớ tài khoản
                if (rememberMe) {
                    localStorage.setItem('remembered_email', email);
                    localStorage.setItem('user', JSON.stringify(data.user));
                } else {
                    localStorage.removeItem('remembered_email');
                    localStorage.removeItem('user');
                }

                // 2. Lưu phiên vào sessionStorage riêng biệt của tab này
                sessionStorage.setItem('user', JSON.stringify(data.user));
                setCurrentUser(data.user);

                showToast(`Chào mừng bạn quay trở lại!`, 'success');

                // 3. Điều hướng thông minh:
                const redirectShopId = localStorage.getItem('redirect_shop_id');
                if (redirectShopId) {
                    localStorage.removeItem('redirect_shop_id');
                    navigate(`/shop/${redirectShopId}`);
                } else {
                    navigate(data.user.role === 'seller' ? '/seller' : '/'); 
                }
            } else {
                setError(data.message || 'Email hoặc mật khẩu không chính xác!');
            }
        } catch (error) {
            console.error(error);
            setError("Lỗi kết nối đến server!");
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', background: '#2a2a2a', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', color: '#fff' }}>
            
            {/* THANH CHUYỂN ĐỔI ĐĂNG NHẬP / ĐĂNG KÝ Ở GÓC TRÊN BÊN TRÁI */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '25px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ee4d2d', cursor: 'pointer' }}>
                    Đăng Nhập
                </span>
                <span 
                    onClick={() => navigate('/register')} 
                    style={{ fontSize: '18px', fontWeight: 'bold', color: '#777', cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.target.style.color = '#bbb'}
                    onMouseLeave={(e) => e.target.style.color = '#777'}
                >
                    Đăng Ký
                </span>
            </div>
            
            {error && (
                <div style={{ background: '#ff4d4f22', border: '1px solid #ff4d4f', color: '#ff4d4f', padding: '10px 12px', borderRadius: '4px', marginBottom: '15px', fontSize: '13px', textAlign: 'center' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#ccc' }}>Email</label>
                    <input 
                        type="email" placeholder="Nhập email của bạn" required
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #444', background: '#1c1c1c', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#ccc' }}>Mật khẩu</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Nhập mật khẩu" 
                            required
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', padding: '12px 42px 12px 12px', borderRadius: '4px', border: '1px solid #444', background: '#1c1c1c', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: '#888',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ee4d2d'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                            title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                            {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#ccc' }}>
                        <input 
                            type="checkbox" 
                            checked={rememberMe} 
                            onChange={(e) => setRememberMe(e.target.checked)} 
                            style={{ accentColor: '#ee4d2d' }}
                        />
                        Nhớ tài khoản
                    </label>
                    {/* Bấm vào đây sẽ chuyển sang trang /forgot-password */}
                    <span 
                        onClick={() => navigate('/forgot-password')} 
                        style={{ color: '#ee4d2d', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Quên mật khẩu?
                    </span>
                </div>

                <button type="submit" style={{ background: '#ee4d2d', color: '#fff', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '5px' }}>
                    Đăng Nhập
                </button>
            </form>
        </div>
    );
}