import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SHOP_CATEGORIES } from '../constants/categories';
import { EyeIcon, EyeOffIcon } from '../components/Icons';

export default function Register() {
    const [step, setStep] = useState(1); 
    
    // Data cơ bản
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    
    // Data riêng của quán
    const [shopName, setShopName] = useState('');
    const [shopCategory, setShopCategory] = useState(SHOP_CATEGORIES[0]);
    const [shopDescription, setShopDescription] = useState(''); 
    const [shopAddress, setShopAddress] = useState(''); 
    
    // Data OTP Modal
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const [timer, setTimer] = useState(60);
    const inputRefs = useRef([]);

    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);

    // Kiểm tra các tiêu chí mật khẩu mạnh
    const checkPasswordCriteria = (pass) => {
        return {
            length: pass.length >= 8,
            upper: /[A-Z]/.test(pass),
            lower: /[a-z]/.test(pass),
            number: /[0-9]/.test(pass),
            special: /[!@#$%^&*(),.?":{}|<>_\-\[\]\\\/~`+=]/.test(pass)
        };
    };

    const criteria = checkPasswordCriteria(password);
    const passedCount = Object.values(criteria).filter(Boolean).length;

    // Xử lý đếm ngược 60 giây
    useEffect(() => {
        let interval;
        if (showOtpModal && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [showOtpModal, timer]);

    const handleNextStep = (e) => {
        e.preventDefault();
        setError('');

        // Kiểm tra tiêu chuẩn mật khẩu mạnh trước khi tiếp tục
        if (passedCount < 5) {
            setError("Mật khẩu chưa đủ mạnh! Vui lòng đáp ứng đầy đủ 5 tiêu chuẩn an toàn bên dưới.");
            return;
        }

        if (role === 'seller' && step === 1) {
            setStep(2);
        } else {
            submitRegistration();
        }
    };

    const submitRegistration = async () => {
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, phone, password, role, 
                    shopName: role === 'seller' ? shopName : null, 
                    shopCategory: role === 'seller' ? shopCategory : null,
                    shopDescription: role === 'seller' ? shopDescription : null,
                    shopAddress: role === 'seller' ? shopAddress : null
                })
            });
            const data = await res.json();

            if (data.success) {
                // Hiện bảng OTP, reset timer và ô nhập
                setShowOtpModal(true);
                setTimer(60);
                setOtp(new Array(6).fill(""));
            } else {
                setError(data.message || 'Đăng ký thất bại!');
            }
        } catch (error) {
            setError("Lỗi kết nối đến server!");
        }
    };

    // Xử lý nhập từng ô OTP
    const handleChangeOtp = (element, index) => {
        if (isNaN(element.value)) return;
        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // Tự động focus ô tiếp theo
        if (element.value !== "" && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    // Xử lý lùi lại khi xóa
    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerifyOtp = async () => {
        setError('');
        const otpCode = otp.join("");
        
        if (otpCode.length < 6) {
            setError("Vui lòng nhập đủ 6 số OTP");
            return;
        }
        if (timer === 0) {
            setError("Mã OTP đã hết hạn! Vui lòng thử đăng ký lại.");
            return;
        }

        try {
            const res = await fetch('/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Gửi OTP và thông tin người dùng lên để lưu vào DB (nếu OTP đúng)
                body: JSON.stringify({ email, otp: otpCode })
            });
            const data = await res.json();

            if (data.success) {
                // Đóng modal OTP và chuyển thẳng sang trang Đăng nhập cực mượt
                setShowOtpModal(false);
                navigate('/login');
            } else {
                setError(data.message || 'Mã OTP không hợp lệ!');
            }
        } catch (error) {
            setError("Lỗi xác thực!");
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', background: '#2a2a2a', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', color: '#fff', position: 'relative' }}>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '25px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                <span 
                    onClick={() => navigate('/login')} 
                    style={{ fontSize: '18px', fontWeight: 'bold', color: '#777', cursor: 'pointer', transition: 'color 0.2s' }}
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
                {/* BƯỚC 1: CƠ BẢN */}
                {step === 1 && (
                    <>
                        <input type="email" placeholder="Nhập email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                        <input type="tel" placeholder="Nhập số điện thoại" required value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
                        <div>
                            <div style={{ position: 'relative', width: '100%' }}>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)" 
                                    required 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    style={{ ...inputStyle, paddingRight: '42px', boxSizing: 'border-box' }} 
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

                            {/* CHỈ HIỆN KHI NGƯỜI DÙNG BẮT ĐẦU NHẬP MẬT KHẨU: THANH TIẾN ĐỘ TINH TẾ & NHẸ NHÀNG */}
                            {password.length > 0 && (
                                <div style={{ marginTop: '8px', padding: '0 2px' }}>
                                    <div style={{ display: 'flex', gap: '4px', height: '3px', marginBottom: '6px' }}>
                                        {[1, 2, 3, 4, 5].map((lvl) => {
                                            const isActive = passedCount >= lvl;
                                            const activeColor = passedCount === 5 ? '#52c41a' : passedCount >= 3 ? '#faad14' : '#ff4d4f';
                                            return (
                                                <div 
                                                    key={lvl} 
                                                    style={{
                                                        flex: 1,
                                                        height: '100%',
                                                        borderRadius: '2px',
                                                        background: isActive ? activeColor : '#383838',
                                                        transition: 'background 0.3s ease'
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                                        <span style={{ 
                                            fontWeight: '600',
                                            color: passedCount === 5 ? '#52c41a' : passedCount >= 3 ? '#faad14' : '#ff4d4f'
                                        }}>
                                            {passedCount === 5 ? '✓ Mật khẩu an toàn' : passedCount >= 3 ? 'Độ mạnh: Khá' : 'Độ mạnh: Yếu'}
                                        </span>
                                        <span style={{ color: '#888', fontSize: '11px' }}>
                                            {passedCount === 5 ? 'Đã đạt tiêu chuẩn bảo mật' : 'Gồm chữ hoa, thường, số, ký tự đặc biệt'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
                            <option value="user">Người mua (User)</option>
                            <option value="seller">Chủ quán (Seller)</option>
                        </select>
                    </>
                )}

                {/* BƯỚC 2: SELLER */}
                {step === 2 && (
                    <>
                        <div style={{ color: '#ee4d2d', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Thông Tin Quán Của Bạn</div>
                        <input type="text" placeholder="Tên quán" required value={shopName} onChange={(e) => setShopName(e.target.value)} style={inputStyle} />
                        <select 
                            required 
                            value={shopCategory} 
                            onChange={(e) => setShopCategory(e.target.value)} 
                            style={inputStyle}
                        >
                            {SHOP_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <textarea placeholder="Mô tả ngắn gọn" rows="2" value={shopDescription} onChange={(e) => setShopDescription(e.target.value)} style={{...inputStyle, resize: 'none'}} />
                        <input type="text" placeholder="Địa chỉ chi tiết" required value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} style={inputStyle} />
                        <button type="button" onClick={() => setStep(1)} style={{ background: '#444', color: '#fff', padding: '10px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}>Quay lại</button>
                    </>
                )}

                <button type="submit" style={{ background: '#ee4d2d', color: '#fff', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                    {role === 'seller' && step === 1 ? 'Tiếp tục →' : 'Đăng Ký'}
                </button>
            </form>

            {/* POPUP / MODAL NHẬP OTP */}
            {showOtpModal && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', zIndex: 10 }}>
                    <div style={{ background: '#2a2a2a', padding: '25px', borderRadius: '8px', width: '85%', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#ee4d2d' }}>Xác Thực OTP</h3>
                        <p style={{ fontSize: '13px', color: '#ccc', marginBottom: '20px' }}>Mã gồm 6 chữ số đã được gửi tới email của bạn.</p>

                        
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '15px' }}>
                            {otp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    value={data}
                                    onChange={(e) => handleChangeOtp(e.target, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    style={{ width: '35px', height: '45px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', borderRadius: '6px', border: '1px solid #555', background: '#1c1c1c', color: '#fff' }}
                                />
                            ))}
                        </div>

                        <div style={{ fontSize: '13px', color: timer > 10 ? '#ccc' : '#ff4d4f', marginBottom: '20px' }}>
                            Thời gian còn lại: <strong>{timer}s</strong>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setShowOtpModal(false)} style={{ flex: 1, padding: '10px', background: '#444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                            <button onClick={handleVerifyOtp} disabled={timer === 0} style={{ flex: 1, padding: '10px', background: timer === 0 ? '#555' : '#ee4d2d', color: '#fff', border: 'none', borderRadius: '4px', cursor: timer === 0 ? 'not-allowed' : 'pointer' }}>Xác Nhận</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const inputStyle = { width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #444', background: '#1c1c1c', color: '#fff', fontSize: '14px', boxSizing: 'border-box' };