import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MailIcon, PhoneIcon } from '../components/Icons';

export default function ForgotPassword() {
    const [step, setStep] = useState(1); // 1: Nhập thông tin, 2: Nhập OTP, 3: Đổi mật khẩu mới
    const [recoveryType, setRecoveryType] = useState('email'); // 'email' hoặc 'phone'
    const [countryCode, setCountryCode] = useState('+84'); // Mã vùng
    const [contactValue, setContactValue] = useState(''); // Giá trị email hoặc sđt
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const navigate = useNavigate();

    // Bước 1: Kiểm tra email/sđt có tồn tại và gửi OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        const payloadValue = recoveryType === 'phone' ? `${countryCode}${contactValue}` : contactValue;

        try {
            const res = await fetch('/api/forgot-password/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: recoveryType, value: payloadValue })
            });
            const data = await res.json();

            if (res.ok) {
                setStep(2); // Chuyển sang bước nhập OTP
                setMessage(`Mã OTP đã được gửi đến ${payloadValue}.`);
            } else {
                setIsError(true);
                setMessage(data.message || 'Thông tin khôi phục không tồn tại trong hệ thống!');
            }
        } catch (error) {
            console.error(error);
            setIsError(true);
            setMessage('Lỗi kết nối đến server!');
        }
    };

    // Bước 2: Xác thực mã OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        const payloadValue = recoveryType === 'phone' ? `${countryCode}${contactValue}` : contactValue;

        try {
            const res = await fetch('/api/forgot-password/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: payloadValue, otp })
            });
            const data = await res.json();

            if (res.ok) {
                setStep(3); // Chuyển sang bước đổi mật khẩu mới
                setMessage('Xác thực OTP thành công! Vui lòng nhập mật khẩu mới.');
            } else {
                setIsError(true);
                setMessage(data.message || 'Mã OTP không chính xác!');
            }
        } catch (error) {
            console.error(error);
            setIsError(true);
            setMessage('Lỗi kết nối đến server!');
        }
    };

    // Bước 3: Đổi mật khẩu mới
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        const payloadValue = recoveryType === 'phone' ? `${countryCode}${contactValue}` : contactValue;

        try {
            const res = await fetch('/api/forgot-password/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: recoveryType, value: payloadValue, newPassword })
            });
            const data = await res.json();

            if (res.ok) {
                setMessage('Đổi mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setIsError(true);
                setMessage(data.message || 'Không thể đổi mật khẩu, vui lòng thử lại!');
            }
        } catch (error) {
            console.error(error);
            setIsError(true);
            setMessage('Lỗi kết nối đến server!');
        }
    };

    return (
        <div style={{ maxWidth: '420px', margin: '50px auto', background: '#2a2a2a', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', color: '#fff' }}>
            <h2 style={{ textAlign: 'center', color: '#ee4d2d', marginBottom: '20px' }}>Khôi phục Mật khẩu</h2>
            
            {message && (
                <div style={{ 
                    background: isError ? '#ff4d4f22' : '#52c41a22', 
                    border: `1px solid ${isError ? '#ff4d4f' : '#52c41a'}`, 
                    color: isError ? '#ff4d4f' : '#52c41a', 
                    padding: '10px 12px', borderRadius: '4px', marginBottom: '15px', fontSize: '13px', textAlign: 'center' 
                }}>
                    {message}
                </div>
            )}

            {/* BƯỚC 1: Nhập Email hoặc SĐT */}
            {step === 1 && (
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                        <button 
                            type="button" 
                            onClick={() => { setRecoveryType('email'); setContactValue(''); }}
                            style={{ 
                                flex: 1, padding: '8px', background: recoveryType === 'email' ? '#ee4d2d' : '#1c1c1c', 
                                color: '#fff', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontSize: '13px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}
                        >
                            <MailIcon size={14} /> Qua Email
                        </button>
                        <button 
                            type="button" 
                            onClick={() => { setRecoveryType('phone'); setContactValue(''); }}
                            style={{ 
                                flex: 1, padding: '8px', background: recoveryType === 'phone' ? '#ee4d2d' : '#1c1c1c', 
                                color: '#fff', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontSize: '13px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}
                        >
                            <PhoneIcon size={14} /> Qua Số điện thoại
                        </button>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#ccc' }}>
                            {recoveryType === 'email' ? 'Nhập Email đăng ký' : 'Nhập Số điện thoại'}
                        </label>

                        {recoveryType === 'email' ? (
                            <input 
                                type="email" placeholder="name@example.com" required
                                value={contactValue} onChange={(e) => setContactValue(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #444', background: '#1c1c1c', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                        ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select 
                                    value={countryCode} 
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    style={{ width: '90px', padding: '12px', borderRadius: '4px', border: '1px solid #444', background: '#1c1c1c', color: '#fff', fontSize: '14px' }}
                                >
                                    <option value="+84">+84 (VN)</option>
                                    <option value="+1">+1 (US)</option>
                                    <option value="+44">+44 (UK)</option>
                                    <option value="+81">+81 (JP)</option>
                                    <option value="+82">+82 (KR)</option>
                                </select>
                                <input 
                                    type="tel" placeholder="987654321 (bỏ số 0 đầu)" required
                                    value={contactValue} onChange={(e) => setContactValue(e.target.value)}
                                    style={{ flex: 1, padding: '12px', borderRadius: '4px', border: '1px solid #444', background: '#1c1c1c', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                                />
                            </div>
                        )}
                    </div>

                    <button type="submit" style={{ background: '#ee4d2d', color: '#fff', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
                        Gửi mã OTP
                    </button>
                </form>
            )}

            {/* BƯỚC 2: Nhập mã OTP */}
            {step === 2 && (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#ccc' }}>Nhập mã OTP (6 chữ số)</label>
                        <input 
                            type="text" placeholder="Ví dụ: 123456" required maxLength={6}
                            value={otp} onChange={(e) => setOtp(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #444', background: '#1c1c1c', color: '#fff', fontSize: '16px', letterSpacing: '4px', textAlign: 'center', boxSizing: 'border-box' }}
                        />
                    </div>
                    <button type="submit" style={{ background: '#ee4d2d', color: '#fff', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
                        Xác thực OTP
                    </button>
                </form>
            )}

            {/* BƯỚC 3: Đổi mật khẩu mới */}
            {step === 3 && (
                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#ccc' }}>Mật khẩu mới</label>
                        <input 
                            type="password" placeholder="Nhập mật khẩu mới" required
                            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #444', background: '#1c1c1c', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>
                    <button type="submit" style={{ background: '#ee4d2d', color: '#fff', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
                        Xác nhận đổi mật khẩu
                    </button>
                </form>
            )}

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
                <span onClick={() => navigate('/login')} style={{ color: '#aaa', cursor: 'pointer', textDecoration: 'underline' }}>
                    Quay lại đăng nhập
                </span>
            </div>
        </div>
    );
}