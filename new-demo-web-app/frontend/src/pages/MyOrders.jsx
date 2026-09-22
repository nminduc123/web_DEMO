import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { 
    PackageIcon, RefreshIcon, ClockIcon, ChefHatIcon, CheckCircleIcon, 
    XCircleIcon, CartIcon, StoreIcon, AlertTriangleIcon, XIcon, 
    RevenueIcon, UtensilsIcon, FileTextIcon, CreditCardIcon, BanknoteIcon, 
    TicketIcon, InfoIcon 
} from '../components/Icons';

export default function MyOrders({ currentUser }) {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('all'); // all, pending, preparing, completed, cancelled

    // Đồng hồ đếm thời gian thực mỗi 1 giây để cập nhật đồng hồ đếm ngược 5 phút
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    // State cho Modal hủy đơn hàng của Buyer (Không dùng alert/confirm trình duyệt)
    const [cancelModalOrder, setCancelModalOrder] = useState(null);
    const [selectedReasonPreset, setSelectedReasonPreset] = useState('Quán xác nhận quá lâu (quá 5 phút)');
    const [customCancelReason, setCustomCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

    const fetchOrders = async () => {
        if (!currentUser?.id) return;
        try {
            const res = await fetch(`http://localhost:5000/api/user/orders?userId=${currentUser.id}`);
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách đơn hàng:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        fetchOrders();
        // Polling mỗi 5 giây để cập nhật tiến độ duyệt đơn và thông báo hoàn tiền thời gian thực
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, [currentUser]);

    const filteredOrders = orders.filter(order => {
        if (selectedTab === 'all') return true;
        if (selectedTab === 'preparing' || selectedTab === 'accepted') {
            return order.status === 'preparing' || order.status === 'accepted';
        }
        return order.status === selectedTab;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return {
                    label: 'Chờ quán duyệt',
                    icon: <ClockIcon size={13} />,
                    bg: 'rgba(250, 173, 20, 0.15)',
                    color: '#faad14',
                    border: '#faad14'
                };
            case 'accepted':
            case 'preparing':
                return {
                    label: 'Đang làm',
                    icon: <ChefHatIcon size={13} />,
                    bg: 'rgba(24, 144, 255, 0.15)',
                    color: '#1890ff',
                    border: '#1890ff'
                };
            case 'completed':
                return {
                    label: 'Giao thành công',
                    icon: <CheckCircleIcon size={13} />,
                    bg: 'rgba(82, 196, 26, 0.15)',
                    color: '#52c41a',
                    border: '#52c41a'
                };
            case 'cancelled':
                return {
                    label: 'Đã từ chối / Hủy',
                    icon: <XCircleIcon size={13} />,
                    bg: 'rgba(255, 77, 79, 0.15)',
                    color: '#ff4d4f',
                    border: '#ff4d4f'
                };
            default:
                return {
                    label: status,
                    icon: null,
                    bg: '#333',
                    color: '#fff',
                    border: '#444'
                };
        }
    };

    const countByStatus = (status) => {
        if (status === 'all') return orders.length;
        if (status === 'preparing' || status === 'accepted') {
            return orders.filter(o => o.status === 'preparing' || o.status === 'accepted').length;
        }
        return orders.filter(o => o.status === status).length;
    };

    const parseCart = (cartStr) => {
        try {
            return JSON.parse(cartStr) || [];
        } catch (e) {
            return [];
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Xử lý mở Modal hủy đơn
    const handleOpenCancelModal = (order) => {
        setCancelModalOrder(order);
        setSelectedReasonPreset('Quán xác nhận quá lâu (quá 5 phút)');
        setCustomCancelReason('');
    };

    // Xác nhận hủy đơn hàng qua API
    const handleConfirmCancelOrder = async () => {
        if (!cancelModalOrder || !currentUser) return;
        const finalReason = customCancelReason.trim() ? customCancelReason.trim() : selectedReasonPreset;
        
        setIsCancelling(true);
        try {
            const res = await fetch('http://localhost:5000/api/user/cancel-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: cancelModalOrder.id,
                    userId: currentUser.id,
                    cancel_reason: finalReason
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast("Đã hủy đơn hàng thành công!", "success");
                setCancelModalOrder(null);
                fetchOrders();
            } else {
                showToast(data.message || "Không thể hủy đơn hàng!", "error");
            }
        } catch (error) {
            console.error("Lỗi khi hủy đơn:", error);
            showToast("Lỗi hệ thống khi hủy đơn!", "error");
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <div style={{ minHeight: '85vh', background: '#141414', color: '#fff', padding: '30px 20px' }}>
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
                
                {/* TIÊU ĐỀ TRANG */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h1 style={{ fontSize: '26px', fontWeight: 'bold', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <PackageIcon size={26} color="#ee4d2d" /> Đơn Hàng Của Tôi
                        </h1>
                        <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>
                            Theo dõi tiến độ đơn hàng, hủy đơn khi quán lâu duyệt và nhận hoàn tiền VietQR tự động
                        </p>
                    </div>

                    <button 
                        onClick={fetchOrders}
                        style={{
                            background: '#242424',
                            border: '1px solid #444',
                            color: '#ccc',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#ee4d2d'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#ccc'; }}
                    >
                        <RefreshIcon size={14} /> Làm mới
                    </button>
                </div>

                {/* BỘ LỌC TRẠNG THÁI TABS */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px', borderBottom: '1px solid #282828' }}>
                    {[
                        { key: 'all', label: 'Tất cả', icon: null },
                        { key: 'pending', label: 'Chờ duyệt', icon: <ClockIcon size={13} /> },
                        { key: 'preparing', label: 'Đang làm', icon: <ChefHatIcon size={13} /> },
                        { key: 'completed', label: 'Hoàn thành', icon: <CheckCircleIcon size={13} /> },
                        { key: 'cancelled', label: 'Đã từ chối / Hủy', icon: <XCircleIcon size={13} /> }
                    ].map(tab => {
                        const count = countByStatus(tab.key);
                        const isActive = selectedTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setSelectedTab(tab.key)}
                                style={{
                                    padding: '8px 18px',
                                    borderRadius: '50px',
                                    border: isActive ? '1px solid #ee4d2d' : '1px solid #333',
                                    background: isActive ? '#ee4d2d' : '#222',
                                    color: isActive ? '#fff' : '#aaa',
                                    fontWeight: isActive ? 'bold' : '500',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                {tab.icon}
                                {tab.label} {count > 0 && `(${count})`}
                            </button>
                        );
                    })}
                </div>

                {/* DANH SÁCH ĐƠN HÀNG */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
                        <div style={{ marginBottom: '10px' }}>
                            <ClockIcon size={28} color="#888" />
                        </div>
                        Đang tải danh sách đơn hàng...
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '70px 20px', background: '#1c1c1c', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
                        <div style={{ marginBottom: '15px' }}>
                            <CartIcon size={48} color="#888" />
                        </div>
                        <h3 style={{ fontSize: '18px', color: '#eee', marginBottom: '8px' }}>Chưa có đơn hàng nào</h3>
                        <p style={{ color: '#777', fontSize: '14px', marginBottom: '20px' }}>
                            {selectedTab === 'all' 
                                ? "Bạn chưa đặt đơn hàng nào trên M-Bite." 
                                : `Không có đơn hàng nào ở trạng thái này.`}
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                background: '#ee4d2d',
                                color: '#fff',
                                border: 'none',
                                padding: '10px 24px',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            Khám phá món ngon ngay
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {filteredOrders.map(order => {
                            const badge = getStatusBadge(order.status);
                            const items = parseCart(order.cart_details);
                            const isQR = order.payment_method === 'CK';
                            const isCancelled = order.status === 'cancelled';
                            const isPending = order.status === 'pending';

                            // Tính toán thời gian 5 phút cho đơn đang chờ duyệt
                            let remainingSeconds = 0;
                            let canCancel = false;
                            if (isPending && order.created_at) {
                                const orderTime = new Date(order.created_at).getTime();
                                const elapsed = (now - orderTime) / 1000;
                                remainingSeconds = Math.max(0, Math.ceil(300 - elapsed));
                                canCancel = remainingSeconds <= 0;
                            }

                            return (
                                <div 
                                    key={order.id} 
                                    style={{ 
                                        background: '#1c1c1c', 
                                        borderRadius: '12px', 
                                        border: isCancelled && isQR ? '1px solid #13c2c2' : '1px solid #2a2a2a',
                                        overflow: 'hidden',
                                        boxShadow: isCancelled && isQR ? '0 0 15px rgba(19, 194, 194, 0.15)' : '0 4px 15px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    {/* HEADER ĐƠN HÀNG */}
                                    <div style={{ 
                                        padding: '16px 20px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between', 
                                        flexWrap: 'wrap', 
                                        gap: '10px',
                                        borderBottom: '1px solid #333'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <StoreIcon size={18} color="#ee4d2d" />
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff' }}>
                                                    {order.shop_name || 'Quán đối tác M-Bite'}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#888' }}>
                                                    Mã đơn: <strong style={{ color: '#ccc' }}>#{order.id}</strong> • Đặt lúc: {formatDate(order.created_at)}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                padding: '4px 14px',
                                                borderRadius: '50px',
                                                fontSize: '13px',
                                                fontWeight: 'bold',
                                                background: badge.bg,
                                                color: badge.color,
                                                border: `1px solid ${badge.border}`,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                {badge.icon}
                                                {badge.label}
                                            </div>
                                        </div>
                                    </div>

                                    {/* THANH THÔNG BÁO TIẾN ĐỘ VÀ NÚT HỦY ĐƠN 5 PHÚT (KHI ĐƠN CHỜ DUYỆT) */}
                                    {isPending && (
                                        <div style={{ 
                                            padding: '12px 20px', 
                                            background: canCancel ? 'rgba(255, 77, 79, 0.08)' : 'rgba(250, 173, 20, 0.08)', 
                                            borderBottom: '1px solid #333',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            flexWrap: 'wrap',
                                            gap: '12px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {canCancel ? <AlertTriangleIcon size={18} color="#ff7875" /> : <ClockIcon size={18} color="#ffd666" />}
                                                <div>
                                                    {canCancel ? (
                                                        <div style={{ color: '#ff7875', fontSize: '13px', fontWeight: 'bold' }}>
                                                            Quán chưa nhận đơn sau 5 phút chờ. Bạn có thể hủy đơn và nhận hoàn tiền ngay bây giờ!
                                                        </div>
                                                    ) : (
                                                        <div style={{ color: '#ffd666', fontSize: '13px' }}>
                                                            Quán đang trong thời gian 5 phút tiếp nhận đơn. Đếm ngược: <strong style={{ color: '#fff', fontSize: '14px', background: '#333', padding: '2px 8px', borderRadius: '4px', marginLeft: '4px' }}>
                                                                {Math.floor(remainingSeconds / 60).toString().padStart(2, '0')}:{(remainingSeconds % 60).toString().padStart(2, '0')}
                                                            </strong>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* NÚT HỦY ĐƠN */}
                                            {canCancel ? (
                                                <button
                                                    onClick={() => handleOpenCancelModal(order)}
                                                    style={{
                                                        background: 'rgba(255, 77, 79, 0.15)',
                                                        color: '#ff4d4f',
                                                        border: '1px solid #ff4d4f',
                                                        padding: '7px 16px',
                                                        borderRadius: '6px',
                                                        fontSize: '13px',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = '#ff4d4f'; e.currentTarget.style.color = '#fff'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 77, 79, 0.15)'; e.currentTarget.style.color = '#ff4d4f'; }}
                                                >
                                                    <XIcon size={14} /> Hủy đơn hàng
                                                </button>
                                            ) : (
                                                <button
                                                    disabled
                                                    style={{
                                                        background: '#242424',
                                                        color: '#777',
                                                        border: '1px solid #3d3d3d',
                                                        padding: '7px 14px',
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        cursor: 'not-allowed',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                    title="Bạn có thể hủy đơn nếu quán không tiếp nhận sau 5 phút"
                                                >
                                                    <ClockIcon size={13} /> Hủy đơn sau {Math.floor(remainingSeconds / 60).toString().padStart(2, '0')}:{(remainingSeconds % 60).toString().padStart(2, '0')}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* KHUNG THÔNG BÁO HOÀN TIỀN VIETQR ĐẶC BIỆT KHI ĐƠN BỊ TỪ CHỐI / HỦY */}
                                    {isCancelled && (
                                        <div style={{ padding: '16px 20px', background: isQR ? 'rgba(19, 194, 194, 0.08)' : 'rgba(255, 77, 79, 0.06)', borderBottom: '1px solid #333' }}>
                                            
                                            {/* Lý do từ chối / hủy đơn */}
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: isQR ? '12px' : '0' }}>
                                                <AlertTriangleIcon size={16} color="#ff7875" />
                                                <div>
                                                    <span style={{ color: '#ff7875', fontWeight: 'bold', fontSize: '13px' }}>
                                                        Lý do hủy / từ chối:
                                                    </span>
                                                    <span style={{ color: '#ffccc7', fontSize: '13px', marginLeft: '6px' }}>
                                                        "{order.cancel_reason || 'Đã hủy đơn hàng'}"
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Box thông báo hoàn tiền dành riêng cho thanh toán VietQR (CK) */}
                                            {isQR ? (
                                                <div style={{ 
                                                    background: 'rgba(19, 194, 194, 0.12)', 
                                                    border: '1px solid #13c2c2', 
                                                    borderRadius: '8px', 
                                                    padding: '12px 16px',
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '12px'
                                                }}>
                                                    <RevenueIcon size={22} color="#5cdbd3" />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
                                                            <strong style={{ color: '#5cdbd3', fontSize: '14px', letterSpacing: '0.3px' }}>
                                                                THÔNG BÁO HOÀN TIỀN THANH TOÁN VIETQR
                                                            </strong>
                                                            <span style={{ 
                                                                background: '#13c2c2', 
                                                                color: '#002329', 
                                                                fontSize: '11px', 
                                                                fontWeight: 'bold', 
                                                                padding: '2px 8px', 
                                                                borderRadius: '4px' 
                                                            }}>
                                                                ĐÃ GHI NHẬN HOÀN TIỀN
                                                            </span>
                                                        </div>
                                                        <p style={{ color: '#b5f5ec', fontSize: '13px', margin: '0 0 6px 0', lineHeight: '1.5' }}>
                                                            Đơn hàng đã được quý khách thanh toán chuyển khoản qua <strong>VietQR</strong>. Số tiền <strong style={{ color: '#fff', fontSize: '14px' }}>{order.total_price?.toLocaleString('vi-VN')}đ</strong> đã được hệ thống tạo lệnh hoàn trả về số tài khoản quý khách đã thực hiện chuyển.
                                                        </p>
                                                        <div style={{ fontSize: '12px', color: '#87e8de', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <ClockIcon size={12} /> Thời gian nhận lại tiền: Từ <strong>5 phút - 24 giờ làm việc</strong> tuỳ theo ngân hàng thụ hưởng.
                                                            {order.shop_phone && ` Hotline hỗ trợ quán: ${order.shop_phone}`}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <InfoIcon size={13} /> Đơn hàng thanh toán khi nhận hàng (COD), bạn chưa bị trừ bất kỳ khoản chi phí nào.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* DANH SÁCH MÓN ĂN */}
                                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {items.map((item, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {item.img ? (
                                                        <img 
                                                            src={item.img} 
                                                            alt={item.name} 
                                                            style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', background: '#333' }}
                                                        />
                                                    ) : (
                                                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <UtensilsIcon size={20} color="#888" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: '500', fontSize: '14px', color: '#fff' }}>{item.name}</div>
                                                        <div style={{ fontSize: '12px', color: '#888' }}>
                                                            {Number(item.price)?.toLocaleString('vi-VN')}đ × {item.quantity || 1}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#ddd' }}>
                                                    {((Number(item.price) || 0) * (item.quantity || 1)).toLocaleString('vi-VN')}đ
                                                </div>
                                            </div>
                                        ))}

                                        {/* Ghi chú đơn nếu có */}
                                        {order.note && (
                                            <div style={{ padding: '8px 12px', background: '#222', borderRadius: '6px', fontSize: '12px', color: '#bbb', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <FileTextIcon size={14} color="#aaa" />
                                                <span><strong>Ghi chú cho quán:</strong> {order.note}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* FOOTER ĐƠN HÀNG: PHƯƠNG THỨC THANH TOÁN & TỔNG TIỀN */}
                                    <div style={{ 
                                        padding: '14px 20px', 
                                        background: '#222', 
                                        borderTop: '1px solid #2e2e2e',
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '12px', color: '#888' }}>Hình thức thanh toán:</span>
                                            {isQR ? (
                                                <span style={{ 
                                                    background: 'rgba(24, 144, 255, 0.15)', 
                                                    color: '#40a9ff', 
                                                    border: '1px solid #1890ff', 
                                                    padding: '3px 10px', 
                                                    borderRadius: '4px', 
                                                    fontSize: '12px', 
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}>
                                                    <CreditCardIcon size={13} /> Chuyển khoản VietQR
                                                </span>
                                            ) : (
                                                <span style={{ 
                                                    background: 'rgba(82, 196, 26, 0.15)', 
                                                    color: '#73d13d', 
                                                    border: '1px solid #52c41a', 
                                                    padding: '3px 10px', 
                                                    borderRadius: '4px', 
                                                    fontSize: '12px', 
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}>
                                                    <BanknoteIcon size={13} /> Tiền mặt (COD)
                                                </span>
                                            )}

                                            {order.voucher_code && (
                                                <span style={{ background: 'rgba(238, 77, 45, 0.15)', color: '#ee4d2d', border: '1px solid #ee4d2d', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <TicketIcon size={12} /> {order.voucher_code} (-{order.discount_amount?.toLocaleString('vi-VN')}đ)
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '14px', color: '#aaa' }}>Tổng thanh toán:</span>
                                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: isCancelled ? '#888' : '#ee4d2d', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                                                {order.total_price?.toLocaleString('vi-VN')}đ
                                            </span>
                                        </div>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                )}

            </div>

            {/* MODAL TỰ TẠO XÁC NHẬN HỦY ĐƠN (KHÔNG DÙNG ALERT / CONFIRM TRÌNH DUYỆT) */}
            {cancelModalOrder && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 99999,
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#222',
                        border: '1px solid #444',
                        borderRadius: '12px',
                        width: '100%',
                        maxWidth: '520px',
                        padding: '24px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #333', paddingBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#ff4d4f', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <XCircleIcon size={18} color="#ff4d4f" /> Xác Nhận Hủy Đơn Hàng #{cancelModalOrder.id}
                            </h3>
                            <button 
                                onClick={() => setCancelModalOrder(null)}
                                style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <XIcon size={18} />
                            </button>
                        </div>

                        {/* Lưu ý hoàn tiền nếu thanh toán VietQR */}
                        {cancelModalOrder.payment_method === 'CK' ? (
                            <div style={{
                                background: 'rgba(19, 194, 194, 0.12)',
                                border: '1px solid #13c2c2',
                                borderRadius: '8px',
                                padding: '12px 14px',
                                marginBottom: '16px',
                                fontSize: '13px',
                                color: '#87e8de',
                                lineHeight: '1.5'
                            }}>
                                <strong style={{ color: '#5cdbd3', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <RevenueIcon size={15} color="#5cdbd3" /> Lưu ý hoàn tiền VietQR:
                                </strong>
                                Đơn hàng này đã được thanh toán. Sau khi bạn xác nhận hủy, hệ thống sẽ <strong>tự động hoàn tiền {cancelModalOrder.total_price?.toLocaleString('vi-VN')}đ</strong> về tài khoản ngân hàng của bạn.
                            </div>
                        ) : (
                            <div style={{
                                background: '#2a2a2a',
                                borderRadius: '8px',
                                padding: '10px 14px',
                                marginBottom: '16px',
                                fontSize: '13px',
                                color: '#ccc',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <InfoIcon size={14} /> Đơn thanh toán khi nhận hàng (COD), bạn không bị trừ bất kỳ chi phí nào khi hủy.
                            </div>
                        )}

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#ddd', marginBottom: '8px' }}>
                                Chọn lý do hủy đơn:
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                    "Quán xác nhận quá lâu (quá 5 phút)",
                                    "Tôi muốn đổi quán / chọn món khác",
                                    "Đặt nhầm địa chỉ hoặc số điện thoại",
                                    "Bận việc đột xuất không nhận được món"
                                ].map((preset, idx) => (
                                    <label key={idx} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '10px', 
                                        fontSize: '13px', 
                                        color: '#ccc', 
                                        cursor: 'pointer',
                                        background: selectedReasonPreset === preset ? '#333' : '#282828',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: selectedReasonPreset === preset ? '1px solid #ee4d2d' : '1px solid transparent'
                                    }}>
                                        <input 
                                            type="radio" 
                                            name="cancelReasonPreset"
                                            checked={selectedReasonPreset === preset}
                                            onChange={() => setSelectedReasonPreset(preset)}
                                            style={{ accentColor: '#ee4d2d' }}
                                        />
                                        <span>{preset}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>
                                Hoặc ghi rõ lý do khác (tùy chọn):
                            </label>
                            <textarea
                                value={customCancelReason}
                                onChange={e => setCustomCancelReason(e.target.value)}
                                placeholder="Nhập lý do cụ thể nếu có..."
                                style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    background: '#1a1a1a',
                                    border: '1px solid #444',
                                    borderRadius: '6px',
                                    padding: '10px',
                                    color: '#fff',
                                    fontSize: '13px',
                                    minHeight: '60px',
                                    outline: 'none',
                                    resize: 'none'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => setCancelModalOrder(null)}
                                style={{
                                    background: '#333',
                                    border: '1px solid #444',
                                    color: '#ccc',
                                    padding: '9px 18px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={handleConfirmCancelOrder}
                                disabled={isCancelling}
                                style={{
                                    background: '#ff4d4f',
                                    border: 'none',
                                    color: '#fff',
                                    padding: '9px 20px',
                                    borderRadius: '6px',
                                    cursor: isCancelling ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                {isCancelling ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
