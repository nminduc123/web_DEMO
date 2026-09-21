import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const [step, setStep] = useState(1); // Step 1: Đăng ký cơ bản, Step 2: Nhập thông tin quán (nếu là seller)
    
    // Data cơ bản
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    
    // Data riêng của quán (chỉ dùng khi là seller)
    const [shopName, setShopName] = useState('');
    const [shopCategory, setShopCategory] = useState('');
    const [shopDescription, setShopDescription] = useState(''); // Thêm Mô tả
    const [shopAddress, setShopAddress] = useState('');         // Thêm Địa chỉ
    
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleNextStep = (e) => {
        e.preventDefault();
        setError('');

        if (role === 'seller' && step === 1) {
            // Nếu chọn seller thì chuyển sang bước 2 để nhập thông tin quán
            setStep(2);
        } else {
            // Nếu là user thường hoặc đã ở bước nhập quán thì gọi API đăng ký luôn
            submitRegistration();
        }
    };

    const submitRegistration = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, phone, password, role, 
                    shopName: role === 'seller' ? shopName : null, 
                    shopCategory: role === 'seller' ? shopCategory : null,
                    shopDescription: role === 'seller' ? shopDescription : null, // Gửi kèm lên Backend
                    shopAddress: role === 'seller' ? shopAddress : null          // Gửi kèm lên Backend
                })
            });
            const data = await res.json();

            if (data.success) {
                navigate('/login');
            } else {
                setError(data.message || 'Đăng ký thất bại!');
            }
        } catch (error) {
            console.error(error);
            setError("Lỗi kết nối đến server!");
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', background: '#2a2a2a', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', color: '#fff' }}>
            
            {/* CĂN GIỮA TIÊU ĐỀ ĐĂNG NHẬP / ĐĂNG KÝ */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '25px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                <span 
                    onClick={() => navigate('/login')} 
                    style={{ fontSize: '18px', fontWeight: 'bold', color: '#777', cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.target.style.color = '#bbb'}
                    onMouseLeave={(e) => e.target.style.color = '#777'}
                >
                    Đăng Nhập
                </span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ee4d2d', cursor: 'pointer' }}>
                    Đăng Ký {role === 'seller' && `(Bước ${step}/2)`}
                </span>
            </div>

            {error && (
                <div style={{ background: '#ff4d4f22', border: '1px solid #ff4d4f', color: '#ff4d4f', padding: '10px 12px', borderRadius: '4px', marginBottom: '15px', fontSize: '13px', textAlign: 'center' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {/* BƯỚC 1: THÔNG TIN TÀI KHOẢN CƠ BẢN */}
                {step === 1 && (
                    <>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#ccc' }}>Email</label>
                            <input 
                                type="email" placeholder="Nhập email của bạn" required
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #444', background: '#1c1c1c', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#ccc' }}>Số điện thoại</label>
                            <input 
                                type="tel" placeholder="Nhập số điện thoại" required
                                value={phone} onChange={(e) => setPhone(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #444', background: '#1c1c1c', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#ccc' }}>Mật khẩu</label>
                            <input 
                                type="password" placeholder="Nhập mật khẩu" required
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #444', background: '#1c1c1c', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#ccc' }}>Vai trò tài khoản</label>
                            <select 
                                value={role} onChange={(e) => setRole(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #444', background: '#1c1c1c', color: '#fff', fontSize: '14px' }}
                            >
                                <option value="user">Người mua (User)</option>
                                <option value="seller">Chủ quán (Seller)</option>
                            </select>
                        </div>
                    </>
                )}

                {/* BƯỚC 2: THÔNG TIN RIÊNG CHO SELLER (HIỆN KHI CHUYỂN TAB) */}
                {step === 2 && (
                    <>
                        <div style={{ color: '#ee4d2d', fontSize: '14px', fontWeight: 'bold', textAlign: 'center', marginBottom: '5px' }}>
                            Thông Tin Quán Của Bạn
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#ccc' }}>Tên quán</label>
                            <input 
                                type="text" placeholder="Nhập tên quán của bạn" required
                                value={shopName} onChange={(e) => setShopName(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #444', background: '#1c1c1c', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#ccc' }}>Danh mục quán</label>
                            <input 
                                type="text" placeholder="Ví dụ: Đồ ăn nhanh, Trà sữa..." required
                                value={shopCategory} onChange={(e) => setShopCategory(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #444', background: '#1c1c1c', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#ccc' }}>Mô tả ngắn gọn</label>
                            <textarea 
                                placeholder="Ví dụ: Siêu thị cao cấp, Rau củ quả sạch..." rows="2"
                                value={shopDescription} onChange={(e) => setShopDescription(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #444', background: '#1c1c1c', color: '#fff', fontSize: '14px', boxSizing: 'border-box', resize: 'none' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#ccc' }}>Địa chỉ quán</label>
                            <input 
                                type="text" placeholder="Nhập địa chỉ chi tiết..." required
                                value={shopAddress} onChange={(e) => setShopAddress(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #444', background: '#1c1c1c', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                type="button" 
                                onClick={() => setStep(1)} 
                                style={{ flex: 1, background: '#444', color: '#fff', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                            >
                                Quay lại
                            </button>
                            <button 
                                type="submit" 
                                style={{ flex: 2, background: '#ee4d2d', color: '#fff', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
                            >
                                Hoàn Tất Đăng Ký
                            </button>
                        </div>
                    </>
                )}

                {/* Nút bấm ở bước 1 */}
                {step === 1 && (
                    <button type="submit" style={{ background: '#ee4d2d', color: '#fff', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '5px' }}>
                        {role === 'seller' ? 'Tiếp tục (Nhập thông tin quán) ➔' : 'Đăng Ký'}
                    </button>
                )}
            </form>
        </div>
    );
}