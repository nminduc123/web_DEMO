import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { TicketIcon, CheckCircleIcon, ClockIcon, ArrowLeftIcon, SparklesIcon } from '../components/Icons';

export default function MyVouchers({ currentUser, setSelectedCategory }) {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [vouchers, setVouchers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState('');

    const fetchMyVouchers = async () => {
        if (!currentUser?.id && currentUser?.id !== 0) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/user/my-vouchers?userId=${currentUser.id}`);
            const data = await res.json();
            if (data.success && Array.isArray(data.vouchers)) {
                setVouchers(data.vouchers);
            } else {
                setVouchers([]);
            }
        } catch (error) {
            console.error("Lỗi khi tải ví voucher:", error);
            showToast("Lỗi tải ví voucher!", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        fetchMyVouchers();
    }, [currentUser]);

    const handleCopyCode = (code) => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        showToast(`Đã sao chép mã [${code}]!`, "success");
        setTimeout(() => setCopiedCode(''), 3000);
    };

    const handleExploreVouchers = () => {
        if (setSelectedCategory) {
            setSelectedCategory('Voucher');
        }
        navigate('/');
    };

    const handleUseNow = (code) => {
        // Kiểm tra xem có giỏ hàng không để điều hướng thông minh
        try {
            const savedCart = localStorage.getItem('foodAppCart');
            const cartItems = savedCart ? JSON.parse(savedCart) : [];
            if (cartItems.length > 0) {
                navigate('/checkout');
            } else {
                navigate('/');
            }
        } catch (e) {
            navigate('/');
        }
    };

    return (
        <div style={{ minHeight: '85vh', background: '#141414', color: '#fff', padding: '35px 20px' }}>
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
                {/* THANH ĐIỀU HƯỚNG VÀ TIÊU ĐỀ */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '25px', 
                    flexWrap: 'wrap', 
                    gap: '15px',
                    borderBottom: '1px solid #2a2a2a',
                    paddingBottom: '20px'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <button
                                onClick={() => navigate(-1)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#aaa',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    transition: 'color 0.2s'
                                }}
                                title="Quay lại"
                                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                onMouseLeave={e => e.currentTarget.style.color = '#aaa'}
                            >
                                <ArrowLeftIcon size={18} />
                            </button>
                            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <TicketIcon size={24} color="#ee4d2d" /> Ví Voucher Của Tôi
                            </h2>
                            <span style={{ 
                                background: '#ee4d2d22', 
                                color: '#ee4d2d', 
                                fontSize: '13px', 
                                fontWeight: 'bold', 
                                padding: '3px 10px', 
                                borderRadius: '20px',
                                border: '1px solid #ee4d2d44'
                            }}>
                                {vouchers.length} voucher
                            </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#888', paddingLeft: '32px' }}>
                            Mỗi mã voucher chỉ dùng được 1 lần cho mỗi tài khoản và sẽ tự động được gỡ khỏi ví sau khi sử dụng thành công.
                        </p>
                    </div>

                    <button
                        onClick={handleExploreVouchers}
                        style={{
                            background: 'linear-gradient(135deg, #ee4d2d 0%, #ff7875 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '10px 18px',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(238, 77, 45, 0.3)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <SparklesIcon size={16} /> Săn thêm voucher
                    </button>
                </div>

                {/* DANH SÁCH VOUCHER TRONG VÍ */}
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                        Đang kiểm tra ví voucher của bạn...
                    </div>
                ) : vouchers.length === 0 ? (
                    <div style={{ 
                        background: '#1c1c1c', 
                        borderRadius: '12px', 
                        padding: '60px 20px', 
                        textAlign: 'center', 
                        border: '1px solid #2d2d2d' 
                    }}>
                        <div style={{ 
                            width: '72px', 
                            height: '72px', 
                            borderRadius: '50%', 
                            background: '#242424', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            margin: '0 auto 18px auto',
                            border: '1px dashed #444'
                        }}>
                            <TicketIcon size={36} color="#666" />
                        </div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#fff' }}>
                            Ví voucher của bạn đang trống
                        </h3>
                        <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#888', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.5' }}>
                            Bạn chưa lưu voucher nào hoặc các voucher trước đó đã được sử dụng. Hãy ghé danh mục Voucher trên M-Bite để lưu ngay các ưu đãi giảm giá độc quyền!
                        </p>
                        <button
                            onClick={handleExploreVouchers}
                            style={{
                                background: '#ee4d2d',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '10px 24px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Khám phá Voucher ngay
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {vouchers.map(v => {
                            const minOrder = Number(v.min_order) || 0;
                            const maxDiscount = Number(v.max_discount) || 0;
                            const isCopied = copiedCode === v.code;

                            return (
                                <div
                                    key={v.id}
                                    style={{
                                        background: '#1c1c1c',
                                        border: '1px solid #333',
                                        borderRadius: '10px',
                                        padding: '18px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        position: 'relative',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                        transition: 'border-color 0.2s, transform 0.2s'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = '#ee4d2d77';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = '#333';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    {/* Dải cam nhận diện bên trái */}
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: '4px',
                                        borderTopLeftRadius: '10px',
                                        borderBottomLeftRadius: '10px',
                                        background: '#ee4d2d'
                                    }} />

                                    <div>
                                        {/* Header của thẻ */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    color: '#ee4d2d',
                                                    background: 'rgba(238, 77, 45, 0.15)',
                                                    border: '1px dashed #ee4d2d88',
                                                    padding: '4px 10px',
                                                    borderRadius: '4px',
                                                    letterSpacing: '1px'
                                                }}>
                                                    {v.code}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyCode(v.code)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: isCopied ? '#52c41a' : '#888',
                                                        cursor: 'pointer',
                                                        fontSize: '11px',
                                                        padding: '3px 6px',
                                                        borderRadius: '3px',
                                                        transition: 'color 0.2s'
                                                    }}
                                                    title="Sao chép mã"
                                                >
                                                    {isCopied ? 'Đã chép ✓' : 'Chép'}
                                                </button>
                                            </div>

                                            <span style={{
                                                fontSize: '13px',
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

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#888', marginBottom: '14px' }}>
                                            <span>• Đơn tối thiểu: <strong style={{ color: '#ccc' }}>{minOrder > 0 ? `${minOrder.toLocaleString('vi-VN')}đ` : 'Mọi đơn hàng'}</strong></span>
                                            {v.discount_type === 'percent' && maxDiscount > 0 && (
                                                <span>• Giảm tối đa: <strong style={{ color: '#ccc' }}>{maxDiscount.toLocaleString('vi-VN')}đ</strong></span>
                                            )}
                                            {v.expires_at ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    • Hạn sử dụng: <strong style={{ color: '#faad14' }}>{new Date(v.expires_at).toLocaleDateString('vi-VN')}</strong>
                                                </span>
                                            ) : (
                                                <span>• Thời hạn: <strong style={{ color: '#ccc' }}>Vô thời hạn</strong></span>
                                            )}
                                            {v.saved_at && (
                                                <span style={{ fontSize: '11px', color: '#666' }}>
                                                    • Đã lưu vào ví: {new Date(v.saved_at).toLocaleDateString('vi-VN')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Chân của thẻ */}
                                    <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            gap: '4px', 
                                            fontSize: '11px', 
                                            color: '#52c41a', 
                                            fontWeight: '500' 
                                        }}>
                                            <CheckCircleIcon size={12} /> Sẵn sàng sử dụng
                                        </span>

                                        <button
                                            onClick={() => handleUseNow(v.code)}
                                            style={{
                                                padding: '7px 16px',
                                                background: '#ee4d2d',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#d73a1c'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#ee4d2d'}
                                        >
                                            Dùng ngay →
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
