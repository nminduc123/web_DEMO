import { useState, useEffect } from 'react';
import { 
    ShieldAlertIcon, 
    AlertTriangleIcon, 
    EditIcon, 
    MailIcon, 
    SendIcon, 
    CalendarIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    ClockIcon, 
    MessageSquareIcon, 
    RefreshIcon, 
    LogOutIcon 
} from './Icons';

export default function BannedScreen({ currentUser, setCurrentUser }) {
    const [appealReason, setAppealReason] = useState('');
    const [evidenceInfo, setEvidenceInfo] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [appeals, setAppeals] = useState([]);
    const [loadingAppeals, setLoadingAppeals] = useState(false);
    const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
    const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Lấy lịch sử các khiếu nại đã gửi của tài khoản
    const fetchMyAppeals = async () => {
        if (!currentUser?.id) return;
        setLoadingAppeals(true);
        try {
            const res = await fetch(`/api/appeal/my-appeals?userId=${currentUser.id}`);
            const data = await res.json();
            if (data.success) {
                setAppeals(data.appeals || []);
                if (data.appeals && data.appeals.length > 0 && activeTab === 'new') {
                    // Nếu đã có đơn gửi trước đó, mặc định mở tab lịch sử để xem phản hồi
                    setActiveTab('history');
                }
            }
        } catch (err) {
            console.error("Lỗi tải khiếu nại:", err);
        } finally {
            setLoadingAppeals(false);
        }
    };

    useEffect(() => {
        fetchMyAppeals();
    }, [currentUser?.id]);

    // Kiểm tra nhanh xem Admin đã gỡ ban chưa
    const handleCheckStatus = async () => {
        if (!currentUser?.id) return;
        setIsRefreshing(true);
        try {
            const res = await fetch(`/api/user/status?userId=${currentUser.id}`);
            const data = await res.json();
            if (data.success) {
                if (!data.is_blocked) {
                    setStatusMessage({ text: "Chúc mừng! Tài khoản của bạn đã được Quản trị viên mở khóa!", type: "success" });
                    setTimeout(() => {
                        setCurrentUser(prev => prev ? ({ ...prev, is_blocked: false, ban_reason: null }) : null);
                    }, 1200);
                } else {
                    setStatusMessage({ text: "Tài khoản hiện vẫn đang trong danh sách bị khóa. Vui lòng kiểm tra phản hồi từ Admin.", type: "warning" });
                    fetchMyAppeals();
                }
            }
        } catch (err) {
            setStatusMessage({ text: "Không thể kết nối máy chủ để kiểm tra trạng thái.", type: "error" });
        } finally {
            setIsRefreshing(false);
        }
    };

    // Gửi ý kiến phản hồi
    const handleSubmitAppeal = async (e) => {
        e.preventDefault();
        if (!appealReason.trim()) {
            setStatusMessage({ text: "Vui lòng nhập nội dung phản hồi cụ thể!", type: "error" });
            return;
        }

        setSubmitting(true);
        setStatusMessage({ text: '', type: '' });
        try {
            const res = await fetch('/api/appeal/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.id,
                    email: currentUser.email,
                    appeal_reason: appealReason,
                    evidence_info: evidenceInfo
                })
            });
            const data = await res.json();
            if (data.success) {
                setStatusMessage({ text: "Đã gửi phản hồi thành công! Vui lòng theo dõi kết quả phản hồi từ Admin ở tab bên cạnh.", type: "success" });
                setAppealReason('');
                setEvidenceInfo('');
                fetchMyAppeals();
                setActiveTab('history');
            } else {
                setStatusMessage({ text: data.message || "Gửi phản hồi không thành công!", type: "error" });
            }
        } catch (err) {
            setStatusMessage({ text: "Lỗi kết nối khi gửi phản hồi.", type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        localStorage.removeItem('user');
        setCurrentUser(null);
        window.location.href = '/login';
    };

    return (
        <div 
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 999999,
                backgroundColor: 'rgba(10, 10, 15, 0.94)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                overflowY: 'auto'
            }}
        >
            <div 
                style={{
                    backgroundColor: '#161922',
                    border: '1px solid #ff4d4f',
                    borderRadius: '16px',
                    boxShadow: '0 25px 60px rgba(255, 77, 79, 0.25), 0 0 40px rgba(0,0,0,0.8)',
                    maxWidth: '680px',
                    width: '100%',
                    padding: '32px',
                    color: '#f0f0f0',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    position: 'relative'
                }}
            >
                {/* Header biểu tượng Bị Khóa */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div 
                        style={{
                            width: '72px',
                            height: '72px',
                            backgroundColor: 'rgba(255, 77, 79, 0.15)',
                            border: '2px solid #ff4d4f',
                            borderRadius: '50%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '14px',
                            boxShadow: '0 0 25px rgba(255, 77, 79, 0.4)'
                        }}
                    >
                        <ShieldAlertIcon size={36} color="#ff4d4f" />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Tài Khoản Đã Bị Khóa / Tạm Dừng
                    </h2>
                    <p style={{ color: '#aaa', fontSize: '14px', margin: 0 }}>
                        Tài khoản <strong style={{ color: '#fff' }}>{currentUser?.email}</strong> hiện bị đình chỉ quyền tương tác trên toàn hệ thống M-Bite.
                    </p>
                </div>

                {/* Khối hiển thị lý do Ban từ Admin */}
                <div 
                    style={{
                        backgroundColor: 'rgba(255, 77, 79, 0.08)',
                        border: '1px solid rgba(255, 77, 79, 0.3)',
                        borderRadius: '10px',
                        padding: '14px 18px',
                        marginBottom: '20px'
                    }}
                >
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ff7875', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangleIcon size={16} color="#ff7875" /> Lý do kỷ luật từ Quản trị viên:
                    </div>
                    <div style={{ fontSize: '15px', color: '#fff', fontWeight: '500', lineHeight: '1.5' }}>
                        "{currentUser?.ban_reason || 'Vi phạm điều khoản & quy định sử dụng dịch vụ của hệ thống.'}"
                    </div>
                </div>

                {/* Thông báo trạng thái nếu có */}
                {statusMessage.text && (
                    <div 
                        style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            marginBottom: '18px',
                            fontSize: '14px',
                            backgroundColor: statusMessage.type === 'success' ? 'rgba(82, 196, 26, 0.15)' : statusMessage.type === 'warning' ? 'rgba(250, 173, 20, 0.15)' : 'rgba(255, 77, 79, 0.15)',
                            border: `1px solid ${statusMessage.type === 'success' ? '#52c41a' : statusMessage.type === 'warning' ? '#faad14' : '#ff4d4f'}`,
                            color: statusMessage.type === 'success' ? '#73d13d' : statusMessage.type === 'warning' ? '#ffc53d' : '#ff7875'
                        }}
                    >
                        {statusMessage.text}
                    </div>
                )}

                {/* Thanh chuyển tab: Gửi giải trình & Lịch sử/Phản hồi */}
                <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #30363d', marginBottom: '20px' }}>
                    <button
                        type="button"
                        onClick={() => setActiveTab('new')}
                        style={{
                            padding: '10px 18px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'new' ? '3px solid #ff4d4f' : '3px solid transparent',
                            color: activeTab === 'new' ? '#fff' : '#8b949e',
                            fontWeight: activeTab === 'new' ? 'bold' : 'normal',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <EditIcon size={15} /> Gửi Ý Kiến Phản Hồi
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        style={{
                            padding: '10px 18px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'history' ? '3px solid #ff4d4f' : '3px solid transparent',
                            color: activeTab === 'history' ? '#fff' : '#8b949e',
                            fontWeight: activeTab === 'history' ? 'bold' : 'normal',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <MailIcon size={15} /> Lịch Sử Phản Hồi
                        {appeals.length > 0 && (
                            <span style={{ backgroundColor: '#ff4d4f', color: '#fff', fontSize: '11px', padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                                {appeals.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* TAB 1: FORM GỬI PHẢN HỒI */}
                {activeTab === 'new' && (
                    <form onSubmit={handleSubmitAppeal}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#ccc', marginBottom: '6px' }}>
                                Nội dung phản hồi & ý kiến đóng góp: <span style={{ color: '#ff4d4f' }}>*</span>
                            </label>
                            <textarea
                                rows={4}
                                required
                                value={appealReason}
                                onChange={(e) => setAppealReason(e.target.value)}
                                placeholder="Hãy chia sẻ nội dung phản hồi, ý kiến đóng góp hoặc nguyên nhân (ví dụ: Tài khoản bị đăng nhập lạ, sự cố mạng, hiểu nhầm trong giao dịch...)..."
                                style={{
                                    width: '100%',
                                    backgroundColor: '#0d1117',
                                    border: '1px solid #30363d',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#ccc', marginBottom: '6px' }}>
                                Thông tin xác minh bổ sung (Link ảnh chứng cứ / SĐT liên hệ):
                            </label>
                            <input
                                type="text"
                                value={evidenceInfo}
                                onChange={(e) => setEvidenceInfo(e.target.value)}
                                placeholder="Ví dụ: Link ảnh chụp màn hình, Zalo hoặc số điện thoại để đối chiếu..."
                                style={{
                                    width: '100%',
                                    backgroundColor: '#0d1117',
                                    border: '1px solid #30363d',
                                    borderRadius: '8px',
                                    padding: '10px 12px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: submitting ? '#555' : '#ff4d4f',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                fontSize: '15px',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyCenter: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <SendIcon size={16} />
                            {submitting ? 'Đang gửi phản hồi...' : 'Gửi Phản Hồi & Yêu Cầu Mở Khóa'}
                        </button>
                    </form>
                )}

                {/* TAB 2: LỊCH SỬ PHẢN HỒI CỦA ADMIN */}
                {activeTab === 'history' && (
                    <div style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                        {loadingAppeals ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                Đang tải danh sách phản hồi...
                            </div>
                        ) : appeals.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#888', background: '#0d1117', borderRadius: '8px' }}>
                                Bạn chưa gửi phản hồi nào. Hãy chuyển qua tab "Gửi Ý Kiến Phản Hồi" nếu bạn muốn gửi thông tin tới Ban Quản Trị.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {appeals.map((item) => (
                                    <div 
                                        key={item.id}
                                        style={{
                                            backgroundColor: '#0d1117',
                                            border: '1px solid #30363d',
                                            borderRadius: '10px',
                                            padding: '16px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                                            <span style={{ fontSize: '12px', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <CalendarIcon size={13} /> Gửi lúc: {new Date(item.created_at).toLocaleString('vi-VN')}
                                            </span>
                                            <span 
                                                style={{
                                                    padding: '3px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    backgroundColor: item.status === 'pending' ? 'rgba(250, 173, 20, 0.15)' : item.status === 'approved' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(255, 77, 79, 0.15)',
                                                    color: item.status === 'pending' ? '#faad14' : item.status === 'approved' ? '#52c41a' : '#ff4d4f',
                                                    border: `1px solid ${item.status === 'pending' ? 'rgba(250, 173, 20, 0.4)' : item.status === 'approved' ? 'rgba(82, 196, 26, 0.4)' : 'rgba(255, 77, 79, 0.4)'}`,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}
                                            >
                                                {item.status === 'pending' && <><ClockIcon size={12} /> Đang chờ Admin xét duyệt</>}
                                                {item.status === 'approved' && <><CheckCircleIcon size={12} /> Đã chấp nhận & Gỡ khóa</>}
                                                {item.status === 'rejected' && <><XCircleIcon size={12} /> Đã bị từ chối</>}
                                            </span>
                                        </div>

                                        <div style={{ fontSize: '13px', color: '#ccc', marginBottom: '8px' }}>
                                            <strong style={{ color: '#fff' }}>Nội dung giải trình:</strong>
                                            <div style={{ marginTop: '4px', whiteSpace: 'pre-wrap', color: '#e6edf3', background: '#161b22', padding: '8px 12px', borderRadius: '6px' }}>
                                                {item.appeal_reason}
                                            </div>
                                        </div>

                                        {item.evidence_info && (
                                            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px' }}>
                                                <strong>Thông tin bổ sung:</strong> {item.evidence_info}
                                            </div>
                                        )}

                                        {/* Phản hồi từ Admin */}
                                        {item.admin_response ? (
                                            <div 
                                                style={{
                                                    marginTop: '10px',
                                                    padding: '10px 14px',
                                                    borderRadius: '8px',
                                                    backgroundColor: item.status === 'approved' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(255, 77, 79, 0.1)',
                                                    borderLeft: `4px solid ${item.status === 'approved' ? '#52c41a' : '#ff4d4f'}`
                                                }}
                                            >
                                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: item.status === 'approved' ? '#73d13d' : '#ff7875', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <MessageSquareIcon size={13} /> Phản hồi chính thức từ Ban Quản Trị:
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#fff' }}>
                                                    {item.admin_response}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '12px', color: '#faad14', fontStyle: 'italic', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <ClockIcon size={12} /> Admin đang đối chiếu hồ sơ và sẽ phản hồi trong vòng 24 giờ.
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer nút hành động: Kiểm tra lại & Đăng xuất */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #30363d', flexWrap: 'wrap', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={handleCheckStatus}
                        disabled={isRefreshing}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#21262d',
                            color: '#58a6ff',
                            border: '1px solid #30363d',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: isRefreshing ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <RefreshIcon size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                        {isRefreshing ? 'Đang kiểm tra...' : 'Kiểm tra trạng thái mở khóa'}
                    </button>

                    <button
                        type="button"
                        onClick={handleLogout}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: 'transparent',
                            color: '#8b949e',
                            border: '1px solid #30363d',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ff4d4f'; e.currentTarget.style.borderColor = '#ff4d4f'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#8b949e'; e.currentTarget.style.borderColor = '#30363d'; }}
                    >
                        <LogOutIcon size={14} /> Đăng xuất tài khoản
                    </button>
                </div>
            </div>
        </div>
    );
}
