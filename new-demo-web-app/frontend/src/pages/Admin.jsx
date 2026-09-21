import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export default function Admin({ currentUser }) {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState('users'); // 'users' | 'vouchers'
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    // ==========================================
    // STATE CHO TAB 1: QUẢN LÝ NGƯỜI DÙNG
    // ==========================================
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'user' | 'seller' | 'admin'
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'blocked'
    const [actionLoadingId, setActionLoadingId] = useState(null);

    // ==========================================
    // STATE CHO TAB 2: VOUCHER (ĐỘC QUYỀN ADMIN)
    // ==========================================
    const [vouchers, setVouchers] = useState([]);
    const [loadingVouchers, setLoadingVouchers] = useState(false);
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState(null);
    const [voucherForm, setVoucherForm] = useState({
        code: '',
        name: '',
        description: '',
        discount_type: 'fixed',
        discount_value: '',
        max_discount: '',
        min_order: '0',
        usage_limit: '100',
        expires_at: '',
        is_active: 1
    });

    // ==========================================
    // STATE CHO TAB 3: XỬ LÝ KHIẾU NẠI & MINH OAN
    // ==========================================
    const [appeals, setAppeals] = useState([]);
    const [loadingAppeals, setLoadingAppeals] = useState(false);
    const [appealFilter, setAppealFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
    const [resolvingAppealId, setResolvingAppealId] = useState(null);
    const [adminResponses, setAdminResponses] = useState({}); // { [appealId]: string }

    // ==========================================
    // STATE CHO CÁC MODAL XÁC NHẬN (THAY THẾ HOÀN TOÀN WINDOW.CONFIRM / ALERT)
    // ==========================================
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Xác nhận',
        confirmColor: '#ee4d2d',
        onConfirm: null
    });

    const [banModal, setBanModal] = useState({
        isOpen: false,
        userId: null,
        userEmail: '',
        userName: '',
        reason: 'Vi phạm điều khoản & tiêu chuẩn cộng đồng M-Bite'
    });

    // Tải số liệu thống kê tổng quan
    const fetchStats = async () => {
        try {
            setLoadingStats(true);
            const res = await fetch('http://localhost:5000/api/admin/stats');
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (err) {
            console.error("Lỗi lấy stats:", err);
        } finally {
            setLoadingStats(false);
        }
    };

    // Tải danh sách người dùng
    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const res = await fetch('http://localhost:5000/api/admin/users');
            const data = await res.json();
            if (data.success) {
                setUsers(data.users || []);
            }
        } catch (err) {
            console.error("Lỗi lấy users:", err);
            showToast("Không thể tải danh sách người dùng!", "error");
        } finally {
            setLoadingUsers(false);
        }
    };

    // Tải danh sách voucher
    const fetchVouchers = async () => {
        try {
            setLoadingVouchers(true);
            const res = await fetch('http://localhost:5000/api/admin/vouchers');
            const data = await res.json();
            if (data.success) {
                setVouchers(data.vouchers || []);
            }
        } catch (err) {
            console.error("Lỗi lấy vouchers:", err);
            showToast("Không thể tải danh sách voucher!", "error");
        } finally {
            setLoadingVouchers(false);
        }
    };

    // Tải danh sách khiếu nại minh oan
    const fetchAppeals = async () => {
        try {
            setLoadingAppeals(true);
            const res = await fetch('http://localhost:5000/api/admin/appeals');
            const data = await res.json();
            if (data.success) {
                setAppeals(data.appeals || []);
            }
        } catch (err) {
            console.error("Lỗi lấy danh sách khiếu nại:", err);
            showToast("Không thể tải danh sách khiếu nại!", "error");
        } finally {
            setLoadingAppeals(false);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchUsers();
        fetchVouchers();
        fetchAppeals();
    }, []);

    // ==========================================
    // CÁC HÀM XỬ LÝ NGƯỜI DÙNG
    // ==========================================
    const handleChangeRole = (userId, targetRole, userEmail) => {
        setConfirmModal({
            isOpen: true,
            title: 'Thay Đổi Quyền Hạn Tài Khoản',
            message: `Bạn có chắc muốn đổi vai trò của [${userEmail}] thành [${targetRole.toUpperCase()}]?`,
            confirmText: 'Xác nhận thay đổi',
            confirmColor: '#722ed1',
            onConfirm: async () => {
                try {
                    setActionLoadingId(userId);
                    const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role: targetRole })
                    });
                    const data = await res.json();
                    if (data.success) {
                        showToast(data.message || "Cập nhật vai trò thành công!", "success");
                        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: targetRole } : u));
                        fetchStats();
                    } else {
                        showToast(data.message || "Lỗi cập nhật vai trò!", "error");
                    }
                } catch (err) {
                    showToast("Lỗi kết nối máy chủ!", "error");
                } finally {
                    setActionLoadingId(null);
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const handleToggleBlock = (userId, currentBlocked, userEmail, userName) => {
        if (currentBlocked) {
            // Mở khóa: Hiện popup xác nhận mở khóa
            setConfirmModal({
                isOpen: true,
                title: 'Mở Khóa Tài Khoản',
                message: `Bạn có chắc muốn MỞ KHÓA cho tài khoản [${userEmail}]? Người dùng sẽ lấy lại toàn bộ quyền sử dụng ứng dụng.`,
                confirmText: 'Mở khóa ngay',
                confirmColor: '#52c41a',
                onConfirm: async () => {
                    try {
                        setActionLoadingId(userId);
                        const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/toggle-block`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ban_reason: null })
                        });
                        const data = await res.json();
                        if (data.success) {
                            showToast(data.message, "success");
                            setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_blocked: 0, ban_reason: null } : u));
                            fetchStats();
                        } else {
                            showToast(data.message || "Lỗi thực hiện thao tác!", "error");
                        }
                    } catch (err) {
                        showToast("Lỗi kết nối máy chủ!", "error");
                    } finally {
                        setActionLoadingId(null);
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }
                }
            });
        } else {
            // Khóa tài khoản: Hiện modal nhập lý do khóa chi tiết
            setBanModal({
                isOpen: true,
                userId,
                userEmail,
                userName: userName || '',
                reason: 'Vi phạm điều khoản & quy tắc cộng đồng M-Bite'
            });
        }
    };

    const handleConfirmBanSubmit = async (e) => {
        e.preventDefault();
        if (!banModal.userId) return;
        try {
            setActionLoadingId(banModal.userId);
            const res = await fetch(`http://localhost:5000/api/admin/users/${banModal.userId}/toggle-block`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ban_reason: banModal.reason })
            });
            const data = await res.json();
            if (data.success) {
                showToast(data.message, "info");
                setUsers(prev => prev.map(u => u.id === banModal.userId ? { ...u, is_blocked: 1, ban_reason: banModal.reason } : u));
                setBanModal({ isOpen: false, userId: null, userEmail: '', userName: '', reason: '' });
                fetchStats();
            } else {
                showToast(data.message || "Lỗi khóa tài khoản!", "error");
            }
        } catch (err) {
            showToast("Lỗi kết nối máy chủ!", "error");
        } finally {
            setActionLoadingId(null);
        }
    };

    // ==========================================
    // CÁC HÀM XỬ LÝ KHIẾU NẠI & MINH OAN
    // ==========================================
    const handleResolveAppeal = (appealId, action, userId) => {
        const responseText = adminResponses[appealId] || '';
        const actionLabel = action === 'approved' ? 'DUYỆT MINH OAN & MỞ KHÓA' : 'TỪ CHỐI KHIẾU NẠI';

        setConfirmModal({
            isOpen: true,
            title: `Xác Nhận ${actionLabel}`,
            message: action === 'approved' 
                ? `Bạn có chắc muốn chấp nhận đơn minh oan và mở khóa ngay lập tức cho tài khoản này?`
                : `Bạn có chắc muốn từ chối đơn minh oan này kèm theo lời giải thích đã nhập?`,
            confirmText: action === 'approved' ? 'Duyệt & Mở Khóa' : 'Từ Chối',
            confirmColor: action === 'approved' ? '#52c41a' : '#ff4d4f',
            onConfirm: async () => {
                try {
                    setResolvingAppealId(appealId);
                    const res = await fetch(`http://localhost:5000/api/admin/appeals/${appealId}/resolve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action,
                            admin_response: responseText,
                            userId
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        showToast(data.message, "success");
                        fetchAppeals();
                        fetchUsers();
                        fetchStats();
                    } else {
                        showToast(data.message || "Lỗi xử lý khiếu nại!", "error");
                    }
                } catch (err) {
                    showToast("Lỗi kết nối máy chủ!", "error");
                } finally {
                    setResolvingAppealId(null);
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    // Lọc danh sách người dùng
    const filteredUsers = users.filter(user => {
        const query = userSearch.toLowerCase().trim();
        const matchText = (
            (user.email && user.email.toLowerCase().includes(query)) ||
            (user.full_name && user.full_name.toLowerCase().includes(query)) ||
            (user.phone && user.phone.includes(query)) ||
            (user.shop_name && user.shop_name.toLowerCase().includes(query))
        );
        const matchRole = roleFilter === 'all' || user.role === roleFilter;
        const matchStatus = statusFilter === 'all' || 
            (statusFilter === 'active' && !user.is_blocked) ||
            (statusFilter === 'blocked' && !!user.is_blocked);

        return matchText && matchRole && matchStatus;
    });

    // ==========================================
    // CÁC HÀM XỬ LÝ VOUCHER
    // ==========================================
    const handleOpenCreateVoucher = () => {
        setEditingVoucher(null);
        setVoucherForm({
            code: '',
            name: '',
            description: '',
            discount_type: 'fixed',
            discount_value: '',
            max_discount: '',
            min_order: '0',
            usage_limit: '100',
            expires_at: '',
            is_active: 1
        });
        setShowVoucherModal(true);
    };

    const handleOpenEditVoucher = (voucher) => {
        setEditingVoucher(voucher);
        setVoucherForm({
            code: voucher.code,
            name: voucher.name,
            description: voucher.description || '',
            discount_type: voucher.discount_type || 'fixed',
            discount_value: voucher.discount_value,
            max_discount: voucher.max_discount || '',
            min_order: voucher.min_order || '0',
            usage_limit: voucher.usage_limit || '100',
            expires_at: voucher.expires_at ? voucher.expires_at.slice(0, 10) : '',
            is_active: voucher.is_active ? 1 : 0
        });
        setShowVoucherModal(true);
    };

    const handleSaveVoucher = async (e) => {
        e.preventDefault();
        if (!voucherForm.code.trim() || !voucherForm.name.trim() || !voucherForm.discount_value) {
            showToast("Vui lòng điền đầy đủ Mã, Tên và Mức giảm!", "warning");
            return;
        }

        try {
            const url = editingVoucher
                ? `http://localhost:5000/api/admin/vouchers/${editingVoucher.id}`
                : 'http://localhost:5000/api/admin/vouchers';
            const method = editingVoucher ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(voucherForm)
            });
            const data = await res.json();
            if (data.success) {
                showToast(data.message || "Lưu voucher thành công!", "success");
                setShowVoucherModal(false);
                fetchVouchers();
                fetchStats();
            } else {
                showToast(data.message || "Không thể lưu voucher!", "error");
            }
        } catch (err) {
            showToast("Lỗi kết nối máy chủ!", "error");
        }
    };

    const handleToggleVoucher = async (voucherId, currentActive, code) => {
        try {
            const res = await fetch(`http://localhost:5000/api/admin/vouchers/${voucherId}/toggle`, {
                method: 'PATCH'
            });
            const data = await res.json();
            if (data.success) {
                showToast(data.message, "info");
                setVouchers(prev => prev.map(v => v.id === voucherId ? { ...v, is_active: data.isActive ? 1 : 0 } : v));
                fetchStats();
            } else {
                showToast(data.message || "Lỗi cập nhật voucher!", "error");
            }
        } catch (err) {
            showToast("Lỗi kết nối máy chủ!", "error");
        }
    };

    const handleDeleteVoucher = (voucherId, code) => {
        setConfirmModal({
            isOpen: true,
            title: 'Xóa Vĩnh Viễn Voucher',
            message: `Bạn có chắc chắn muốn XÓA vĩnh viễn voucher [${code}]? Hành động này sẽ không thể khôi phục lại.`,
            confirmText: 'Xóa voucher',
            confirmColor: '#ff4d4f',
            onConfirm: async () => {
                try {
                    const res = await fetch(`http://localhost:5000/api/admin/vouchers/${voucherId}`, {
                        method: 'DELETE'
                    });
                    const data = await res.json();
                    if (data.success) {
                        showToast(data.message, "success");
                        setVouchers(prev => prev.filter(v => v.id !== voucherId));
                        fetchStats();
                    } else {
                        showToast(data.message || "Lỗi xóa voucher!", "error");
                    }
                } catch (err) {
                    showToast("Lỗi kết nối máy chủ!", "error");
                } finally {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
            
            {/* TIÊU ĐỀ TRANG ADMIN */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #333', paddingBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ 
                        background: 'linear-gradient(135deg, #722ed1 0%, #eb2f96 100%)', 
                        width: '50px', height: '50px', borderRadius: '12px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' 
                    }}>
                        🛡️
                    </div>
                    <div>
                        <h1 style={{ margin: '0 0 5px 0', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            Trang Quản Trị Hệ Thống (Admin Control Center)
                            <span style={{ fontSize: '12px', background: '#722ed1', color: '#fff', padding: '3px 8px', borderRadius: '20px', fontWeight: 'bold' }}>
                                TOÀN QUYỀN
                            </span>
                        </h1>
                        <span style={{ fontSize: '13px', color: '#aaa' }}>
                            Xin chào, <strong style={{ color: '#fff' }}>{currentUser?.full_name || currentUser?.email}</strong>! Quản lý người dùng, phân quyền và phát hành khuyến mãi sàn.
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        padding: '9px 18px',
                        background: '#222',
                        color: '#ccc',
                        border: '1px solid #444',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = '#333'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#ccc'; e.currentTarget.style.background = '#222'; }}
                >
                    ← Về Trang Chủ M-Bite
                </button>
            </div>

            {/* CÁC THẺ THỐNG KÊ KPI TỔNG QUAN */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                <div style={kpiCardStyle}>
                    <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>👥 Tổng Thành Viên</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1890ff' }}>
                        {loadingStats ? '...' : (stats?.users?.total_users || 0)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#777', marginTop: '6px' }}>
                        {stats?.users?.total_buyers || 0} Khách • {stats?.users?.total_sellers || 0} Quán • {stats?.users?.total_admins || 0} Admin
                    </div>
                </div>

                <div style={kpiCardStyle}>
                    <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>🏪 Quán Đối Tác Mở Cửa</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#52c41a' }}>
                        {loadingStats ? '...' : (stats?.shops?.open_shops || 0)}
                        <span style={{ fontSize: '16px', color: '#888', fontWeight: 'normal' }}> / {stats?.shops?.total_shops || 0} quán</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#777', marginTop: '6px' }}>
                        Sẵn sàng phục vụ khách hàng
                    </div>
                </div>

                <div style={kpiCardStyle}>
                    <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>🎟️ Voucher Đang Hoạt Động</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fa8c16' }}>
                        {loadingStats ? '...' : (stats?.vouchers?.active_vouchers || 0)}
                        <span style={{ fontSize: '16px', color: '#888', fontWeight: 'normal' }}> / {stats?.vouchers?.total_vouchers || 0}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#777', marginTop: '6px' }}>
                        Độc quyền phát hành bởi Admin
                    </div>
                </div>

                <div style={kpiCardStyle}>
                    <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>💰 Doanh Thu & Đơn Hàng</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#eb2f96' }}>
                        {loadingStats ? '...' : Number(stats?.orders?.total_revenue || 0).toLocaleString('vi-VN')}đ
                    </div>
                    <div style={{ fontSize: '12px', color: '#777', marginTop: '6px' }}>
                        Từ {stats?.orders?.total_orders || 0} đơn hàng toàn sàn
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATION CHÍNH */}
            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #333', marginBottom: '25px', overflowX: 'auto', paddingBottom: '2px' }}>
                <button
                    onClick={() => setActiveTab('users')}
                    style={tabBtnStyle(activeTab === 'users')}
                >
                    👥 Quản Lý Người Dùng & Phân Quyền
                    <span style={badgeCountStyle}>{users.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('vouchers')}
                    style={tabBtnStyle(activeTab === 'vouchers')}
                >
                    🎟️ Độc Quyền Phát Hành Voucher
                    <span style={badgeCountStyle}>{vouchers.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('appeals')}
                    style={tabBtnStyle(activeTab === 'appeals')}
                >
                    📬 Xử Lý Khiếu Nại & Minh Oan
                    {appeals.filter(a => a.status === 'pending').length > 0 ? (
                        <span style={{ ...badgeCountStyle, backgroundColor: '#ff4d4f', color: '#fff' }}>
                            {appeals.filter(a => a.status === 'pending').length} chờ duyệt
                        </span>
                    ) : (
                        <span style={badgeCountStyle}>{appeals.length}</span>
                    )}
                </button>
            </div>

            {/* ========================================================================= */}
            {/* NỘI DUNG TAB 1: QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN */}
            {/* ========================================================================= */}
            {activeTab === 'users' && (
                <div>
                    {/* BỘ LỌC VÀ TÌM KIẾM NGƯỜI DÙNG */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: '#222', padding: '16px', borderRadius: '8px', border: '1px solid #333' }}>
                        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
                            <input
                                type="text"
                                placeholder="🔍 Tìm theo email, họ tên, SĐT, tên quán..."
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                style={filterInputStyle}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <select
                                value={roleFilter}
                                onChange={e => setRoleFilter(e.target.value)}
                                style={selectFilterStyle}
                            >
                                <option value="all">Tất cả vai trò</option>
                                <option value="user">Người mua (Buyer)</option>
                                <option value="seller">Chủ quán (Seller)</option>
                                <option value="admin">Quản trị viên (Admin)</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                style={selectFilterStyle}
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="active">🟢 Đang hoạt động</option>
                                <option value="blocked">🔴 Đang bị khóa</option>
                            </select>

                            <button
                                onClick={fetchUsers}
                                style={{
                                    padding: '8px 14px',
                                    background: '#333',
                                    color: '#fff',
                                    border: '1px solid #555',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                }}
                                title="Tải lại danh sách"
                            >
                                🔄 Làm mới
                            </button>
                        </div>
                    </div>

                    {/* BẢNG DANH SÁCH NGƯỜI DÙNG */}
                    {loadingUsers ? (
                        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#888' }}>
                            ⏳ Đang tải danh sách người dùng...
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#888', background: '#222', borderRadius: '8px' }}>
                            Không tìm thấy người dùng nào phù hợp với điều kiện tìm kiếm.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto', background: '#222', borderRadius: '8px', border: '1px solid #333' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: '#1a1a1a', borderBottom: '1px solid #333', color: '#aaa', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                                        <th style={{ padding: '14px 16px' }}>Thành Viên</th>
                                        <th style={{ padding: '14px 16px' }}>Liên Hệ</th>
                                        <th style={{ padding: '14px 16px' }}>Thông Tin Quán</th>
                                        <th style={{ padding: '14px 16px' }}>Vai Trò (Phân Quyền)</th>
                                        <th style={{ padding: '14px 16px' }}>Trạng Thái</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'right' }}>Thao Tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr 
                                            key={user.id} 
                                            style={{ 
                                                borderBottom: '1px solid #2a2a2a',
                                                background: user.is_blocked ? '#2a1818' : 'transparent',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <img
                                                        src={user.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                        alt="Avatar"
                                                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', background: '#333' }}
                                                    />
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>
                                                            {user.full_name || 'Chưa đặt tên'}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#888' }}>
                                                            ID: #{user.id} • Ngày tạo: {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'Mới'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ color: '#ccc' }}>✉️ {user.email}</div>
                                                <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>📞 {user.phone || 'Chưa cập nhật'}</div>
                                            </td>

                                            <td style={{ padding: '14px 16px' }}>
                                                {user.role === 'seller' ? (
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', color: '#fa8c16' }}>🏪 {user.shop_name || 'Chưa đặt tên quán'}</div>
                                                        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
                                                            🏷 {user.shop_category || 'Đồ ăn'} • {user.is_open ? '🟢 Mở cửa' : '🔴 Đóng cửa'}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#666', fontStyle: 'italic' }}>Không có</span>
                                                )}
                                            </td>

                                            <td style={{ padding: '14px 16px' }}>
                                                <select
                                                    value={user.role}
                                                    disabled={actionLoadingId === user.id || user.id === currentUser?.id}
                                                    onChange={(e) => handleChangeRole(user.id, e.target.value, user.email)}
                                                    style={{
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        cursor: user.id === currentUser?.id ? 'not-allowed' : 'pointer',
                                                        background: user.role === 'admin' ? '#722ed1' : user.role === 'seller' ? '#d46b08' : '#1f3d68',
                                                        color: '#fff',
                                                        border: '1px solid rgba(255,255,255,0.2)'
                                                    }}
                                                >
                                                    <option value="user" style={{ background: '#222', color: '#fff' }}>👤 Khách hàng (Buyer)</option>
                                                    <option value="seller" style={{ background: '#222', color: '#fff' }}>🏪 Chủ quán (Seller)</option>
                                                    <option value="admin" style={{ background: '#222', color: '#fff' }}>🛡️ Quản trị viên (Admin)</option>
                                                </select>
                                                {user.id === currentUser?.id && (
                                                    <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>(Tài khoản của bạn)</div>
                                                )}
                                            </td>

                                            <td style={{ padding: '14px 16px' }}>
                                                {user.is_blocked ? (
                                                    <div>
                                                        <span style={{ 
                                                            background: '#ff4d4f22', color: '#ff4d4f', border: '1px solid #ff4d4f', 
                                                            padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' 
                                                        }}>
                                                            🔴 ĐÃ KHÓA
                                                        </span>
                                                        {user.ban_reason && (
                                                            <div style={{ fontSize: '11px', color: '#ff7875', marginTop: '5px', maxWidth: '180px', lineHeight: '1.3' }}>
                                                                Lý do: <em>"{user.ban_reason}"</em>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span style={{ 
                                                        background: '#52c41a22', color: '#52c41a', border: '1px solid #52c41a', 
                                                        padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' 
                                                    }}>
                                                        🟢 HOẠT ĐỘNG
                                                    </span>
                                                )}
                                            </td>

                                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                                {user.id !== currentUser?.id && (
                                                    <button
                                                        onClick={() => handleToggleBlock(user.id, user.is_blocked, user.email, user.full_name)}
                                                        disabled={actionLoadingId === user.id}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold',
                                                            background: user.is_blocked ? '#52c41a' : '#ff4d4f',
                                                            color: '#fff',
                                                            transition: 'opacity 0.2s'
                                                        }}
                                                    >
                                                        {user.is_blocked ? '🔓 Mở khóa' : '🔒 Khóa tài khoản'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* NỘI DUNG TAB 2: ĐỘC QUYỀN PHÁT HÀNH VOUCHER */}
            {/* ========================================================================= */}
            {activeTab === 'vouchers' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                        <div>
                            <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#fff' }}>
                                Quản Lý Voucher Toàn Sàn
                            </h3>
                            <span style={{ fontSize: '13px', color: '#888' }}>
                                Chỉ Admin mới có quyền tạo và phát hành voucher. Người mua sẽ nhận được các voucher này khi thanh toán.
                            </span>
                        </div>
                        <button
                            onClick={handleOpenCreateVoucher}
                            style={{
                                padding: '10px 20px',
                                background: 'linear-gradient(135deg, #fa541c 0%, #ee4d2d 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(238, 77, 45, 0.4)'
                            }}
                        >
                            ➕ Phát Hành Voucher Mới
                        </button>
                    </div>

                    {loadingVouchers ? (
                        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#888' }}>
                            ⏳ Đang tải danh sách voucher...
                        </div>
                    ) : vouchers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#222', borderRadius: '8px', color: '#888' }}>
                            Chưa có voucher nào được phát hành. Hãy nhấn <strong>"Phát Hành Voucher Mới"</strong> để kích cầu người mua!
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
                            {vouchers.map(v => (
                                <div
                                    key={v.id}
                                    style={{
                                        background: '#222',
                                        border: `1px solid ${v.is_active ? '#444' : '#333'}`,
                                        borderRadius: '10px',
                                        padding: '18px',
                                        position: 'relative',
                                        opacity: v.is_active ? 1 : 0.6,
                                        transition: 'all 0.2s',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div>
                                            <span style={{
                                                background: v.is_active ? '#ee4d2d' : '#555',
                                                color: '#fff',
                                                fontWeight: 'bold',
                                                fontSize: '14px',
                                                padding: '4px 10px',
                                                borderRadius: '4px',
                                                letterSpacing: '1px'
                                            }}>
                                                {v.code}
                                            </span>
                                            <h4 style={{ margin: '10px 0 4px 0', fontSize: '16px', color: '#fff' }}>
                                                {v.name}
                                            </h4>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>
                                                {v.description || 'Áp dụng cho toàn bộ đơn hàng đủ điều kiện'}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => handleToggleVoucher(v.id, v.is_active, v.code)}
                                            style={{
                                                background: v.is_active ? '#52c41a22' : '#ff4d4f22',
                                                color: v.is_active ? '#52c41a' : '#ff4d4f',
                                                border: `1px solid ${v.is_active ? '#52c41a' : '#ff4d4f'}`,
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer'
                                            }}
                                            title="Bật/Tắt kích hoạt"
                                        >
                                            {v.is_active ? '🟢 ĐANG BẬT' : '⏸ TẠM DỪNG'}
                                        </button>
                                    </div>

                                    <div style={{ background: '#1a1a1a', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ color: '#ccc' }}>
                                            💵 Mức giảm: <strong style={{ color: '#52c41a' }}>
                                                {v.discount_type === 'percent' 
                                                    ? `${v.discount_value}% (Tối đa ${Number(v.max_discount).toLocaleString('vi-VN')}đ)` 
                                                    : `${Number(v.discount_value).toLocaleString('vi-VN')}đ`}
                                            </strong>
                                        </div>
                                        <div style={{ color: '#aaa' }}>
                                            📦 Đơn tối thiểu: <strong>{Number(v.min_order).toLocaleString('vi-VN')}đ</strong>
                                        </div>
                                        <div style={{ color: '#aaa' }}>
                                            📊 Đã dùng: <strong>{v.used_count || 0} / {v.usage_limit || '∞'} lượt</strong>
                                        </div>
                                        {v.expires_at && (
                                            <div style={{ color: '#fa8c16' }}>
                                                ⏳ Hạn dùng: {new Date(v.expires_at).toLocaleDateString('vi-VN')}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => handleOpenEditVoucher(v)}
                                            style={{
                                                padding: '6px 12px',
                                                background: '#333',
                                                color: '#ccc',
                                                border: '1px solid #555',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            ✏️ Sửa
                                        </button>
                                        <button
                                            onClick={() => handleDeleteVoucher(v.id, v.code)}
                                            style={{
                                                padding: '6px 12px',
                                                background: '#ff4d4f22',
                                                color: '#ff4d4f',
                                                border: '1px solid #ff4d4f',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            🗑️ Xóa
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* MODAL TẠO / SỬA VOUCHER */}
                    {showVoucherModal && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                            <div style={{ background: '#222', padding: '25px', borderRadius: '10px', width: '100%', maxWidth: '520px', border: '1px solid #444', maxHeight: '90vh', overflowY: 'auto' }}>
                                <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#ee4d2d' }}>
                                    {editingVoucher ? `✏️ Chỉnh Sửa Voucher [${editingVoucher.code}]` : '➕ Phát Hành Voucher Mới'}
                                </h3>

                                <form onSubmit={handleSaveVoucher} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div>
                                        <label style={formLabelStyle}>Mã Voucher (Code) *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ví dụ: MBITE50, FREESHIP"
                                            value={voucherForm.code}
                                            onChange={e => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                                            style={formInputStyle}
                                        />
                                    </div>

                                    <div>
                                        <label style={formLabelStyle}>Tên chương trình voucher *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ví dụ: Giảm 20k cho đơn từ 100k"
                                            value={voucherForm.name}
                                            onChange={e => setVoucherForm({ ...voucherForm, name: e.target.value })}
                                            style={formInputStyle}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div>
                                            <label style={formLabelStyle}>Loại giảm giá *</label>
                                            <select
                                                value={voucherForm.discount_type}
                                                onChange={e => setVoucherForm({ ...voucherForm, discount_type: e.target.value })}
                                                style={formInputStyle}
                                            >
                                                <option value="fixed">Tiền mặt cố định (VNĐ)</option>
                                                <option value="percent">Phần trăm (%)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={formLabelStyle}>
                                                {voucherForm.discount_type === 'percent' ? 'Mức giảm (%) *' : 'Số tiền giảm (VNĐ) *'}
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                placeholder={voucherForm.discount_type === 'percent' ? '10' : '20000'}
                                                value={voucherForm.discount_value}
                                                onChange={e => setVoucherForm({ ...voucherForm, discount_value: e.target.value })}
                                                style={formInputStyle}
                                            />
                                        </div>
                                    </div>

                                    {voucherForm.discount_type === 'percent' && (
                                        <div>
                                            <label style={formLabelStyle}>Giảm tối đa (VNĐ)</label>
                                            <input
                                                type="number"
                                                placeholder="Ví dụ: 30000"
                                                value={voucherForm.max_discount}
                                                onChange={e => setVoucherForm({ ...voucherForm, max_discount: e.target.value })}
                                                style={formInputStyle}
                                            />
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div>
                                            <label style={formLabelStyle}>Đơn tối thiểu (VNĐ)</label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={voucherForm.min_order}
                                                onChange={e => setVoucherForm({ ...voucherForm, min_order: e.target.value })}
                                                style={formInputStyle}
                                            />
                                        </div>

                                        <div>
                                            <label style={formLabelStyle}>Lượt dùng tối đa</label>
                                            <input
                                                type="number"
                                                placeholder="100"
                                                value={voucherForm.usage_limit}
                                                onChange={e => setVoucherForm({ ...voucherForm, usage_limit: e.target.value })}
                                                style={formInputStyle}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={formLabelStyle}>Ngày hết hạn (tùy chọn)</label>
                                        <input
                                            type="date"
                                            value={voucherForm.expires_at}
                                            onChange={e => setVoucherForm({ ...voucherForm, expires_at: e.target.value })}
                                            style={formInputStyle}
                                        />
                                    </div>

                                    <div>
                                        <label style={formLabelStyle}>Mô tả chi tiết</label>
                                        <textarea
                                            rows="2"
                                            placeholder="Mô tả điều kiện áp dụng..."
                                            value={voucherForm.description}
                                            onChange={e => setVoucherForm({ ...voucherForm, description: e.target.value })}
                                            style={{ ...formInputStyle, resize: 'none' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoucherModal(false)}
                                            style={{ flex: 1, padding: '10px', background: '#444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            type="submit"
                                            style={{ flex: 1, padding: '10px', background: '#ee4d2d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            {editingVoucher ? 'Cập Nhật' : 'Phát Hành Ngay'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* NỘI DUNG TAB 3: XỬ LÝ KHIẾU NẠI & MINH OAN (BAN APPEALS) */}
            {/* ========================================================================= */}
            {activeTab === 'appeals' && (
                <div>
                    {/* BỘ LỌC KHIẾU NẠI */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: '#222', padding: '16px', borderRadius: '8px', border: '1px solid #333' }}>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setAppealFilter('all')}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    background: appealFilter === 'all' ? '#ee4d2d' : '#333',
                                    color: '#fff'
                                }}
                            >
                                Tất Cả ({appeals.length})
                            </button>
                            <button
                                onClick={() => setAppealFilter('pending')}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    background: appealFilter === 'pending' ? '#faad14' : '#333',
                                    color: appealFilter === 'pending' ? '#000' : '#fff'
                                }}
                            >
                                ⏳ Chờ Xét Duyệt ({appeals.filter(a => a.status === 'pending').length})
                            </button>
                            <button
                                onClick={() => setAppealFilter('approved')}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    background: appealFilter === 'approved' ? '#52c41a' : '#333',
                                    color: '#fff'
                                }}
                            >
                                ✅ Đã Chấp Nhận ({appeals.filter(a => a.status === 'approved').length})
                            </button>
                            <button
                                onClick={() => setAppealFilter('rejected')}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    background: appealFilter === 'rejected' ? '#ff4d4f' : '#333',
                                    color: '#fff'
                                }}
                            >
                                ❌ Đã Từ Chối ({appeals.filter(a => a.status === 'rejected').length})
                            </button>
                        </div>

                        <button
                            onClick={fetchAppeals}
                            style={{
                                padding: '8px 14px',
                                background: '#333',
                                color: '#fff',
                                border: '1px solid #555',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px'
                            }}
                            title="Tải lại danh sách khiếu nại"
                        >
                            🔄 Làm mới
                        </button>
                    </div>

                    {/* DANH SÁCH CÁC ĐƠN MINH OAN */}
                    {loadingAppeals ? (
                        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#888' }}>
                            ⏳ Đang tải danh sách khiếu nại...
                        </div>
                    ) : appeals.filter(a => appealFilter === 'all' || a.status === appealFilter).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#888', background: '#222', borderRadius: '8px', border: '1px solid #333' }}>
                            Không có đơn khiếu nại / minh oan nào trong mục này.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {appeals
                                .filter(a => appealFilter === 'all' || a.status === appealFilter)
                                .map((appeal) => (
                                    <div
                                        key={appeal.id}
                                        style={{
                                            background: '#222',
                                            borderRadius: '12px',
                                            border: appeal.status === 'pending' ? '1px solid #faad14' : '1px solid #333',
                                            padding: '24px',
                                            boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        {/* Header đơn khiếu nại */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #333', paddingBottom: '16px', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '44px',
                                                    height: '44px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#333',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '20px'
                                                }}>
                                                    👤
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {appeal.email}
                                                        <span style={{ fontSize: '11px', background: '#444', color: '#ccc', padding: '2px 8px', borderRadius: '10px' }}>
                                                            {appeal.role === 'seller' ? 'Chủ quán' : appeal.role === 'admin' ? 'Admin' : 'Khách hàng'}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
                                                        Họ tên: <strong style={{ color: '#eee' }}>{appeal.full_name || 'Chưa đặt'}</strong> • SĐT: {appeal.phone || 'Chưa cập nhật'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ textAlign: 'right' }}>
                                                <span
                                                    style={{
                                                        padding: '5px 12px',
                                                        borderRadius: '14px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        backgroundColor: appeal.status === 'pending' ? 'rgba(250, 173, 20, 0.15)' : appeal.status === 'approved' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(255, 77, 79, 0.15)',
                                                        color: appeal.status === 'pending' ? '#faad14' : appeal.status === 'approved' ? '#52c41a' : '#ff4d4f',
                                                        border: `1px solid ${appeal.status === 'pending' ? '#faad14' : appeal.status === 'approved' ? '#52c41a' : '#ff4d4f'}`
                                                    }}
                                                >
                                                    {appeal.status === 'pending' && '⏳ Chờ xét duyệt'}
                                                    {appeal.status === 'approved' && '✅ Đã chấp thuận minh oan'}
                                                    {appeal.status === 'rejected' && '❌ Đã từ chối'}
                                                </span>
                                                <div style={{ fontSize: '11px', color: '#777', marginTop: '6px' }}>
                                                    Gửi lúc: {new Date(appeal.created_at).toLocaleString('vi-VN')}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nội dung giải trình của người dùng */}
                                        <div style={{ marginBottom: '18px' }}>
                                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#bbb', marginBottom: '6px' }}>
                                                📝 Lời giải trình / Minh oan từ người dùng:
                                            </div>
                                            <div style={{ background: '#161922', border: '1px solid #30363d', borderRadius: '8px', padding: '14px', color: '#e6edf3', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                                {appeal.appeal_reason}
                                            </div>
                                        </div>

                                        {/* Thông tin bằng chứng kèm theo */}
                                        {appeal.evidence_info && (
                                            <div style={{ marginBottom: '18px' }}>
                                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#bbb', marginBottom: '4px' }}>
                                                    🔗 Thông tin xác minh / Bằng chứng bổ sung:
                                                </div>
                                                <div style={{ background: '#161922', border: '1px solid #30363d', borderRadius: '8px', padding: '10px 14px', color: '#58a6ff', fontSize: '13px', wordBreak: 'break-all' }}>
                                                    {appeal.evidence_info}
                                                </div>
                                            </div>
                                        )}

                                        {/* Phản hồi và thao tác của Admin */}
                                        {appeal.status === 'pending' ? (
                                            <div style={{ background: '#1a1a1a', border: '1px dashed #555', borderRadius: '8px', padding: '16px', marginTop: '15px' }}>
                                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#eee', marginBottom: '8px' }}>
                                                    💬 Lời phản hồi / Nhắn gửi của Admin tới người dùng:
                                                </div>
                                                <textarea
                                                    rows={2}
                                                    value={adminResponses[appeal.id] || ''}
                                                    onChange={(e) => setAdminResponses({ ...adminResponses, [appeal.id]: e.target.value })}
                                                    placeholder="Nhập ghi chú phản hồi (ví dụ: 'Đã xác minh sự cố nhầm lẫn, tài khoản đã được gỡ phạt' hoặc lý do từ chối)..."
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px 12px',
                                                        background: '#111',
                                                        border: '1px solid #444',
                                                        borderRadius: '6px',
                                                        color: '#fff',
                                                        fontSize: '13px',
                                                        boxSizing: 'border-box',
                                                        marginBottom: '14px',
                                                        resize: 'vertical'
                                                    }}
                                                />
                                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                    <button
                                                        type="button"
                                                        disabled={resolvingAppealId === appeal.id}
                                                        onClick={() => handleResolveAppeal(appeal.id, 'rejected', appeal.user_id)}
                                                        style={{
                                                            padding: '9px 18px',
                                                            background: '#ff4d4f22',
                                                            color: '#ff4d4f',
                                                            border: '1px solid #ff4d4f',
                                                            borderRadius: '6px',
                                                            cursor: resolvingAppealId === appeal.id ? 'not-allowed' : 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: 'bold',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        ❌ Từ Chối Khiếu Nại
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={resolvingAppealId === appeal.id}
                                                        onClick={() => handleResolveAppeal(appeal.id, 'approved', appeal.user_id)}
                                                        style={{
                                                            padding: '9px 20px',
                                                            background: '#52c41a',
                                                            color: '#fff',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: resolvingAppealId === appeal.id ? 'not-allowed' : 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: 'bold',
                                                            boxShadow: '0 2px 8px rgba(82,196,26,0.3)',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        ✅ Chấp Thuận & Mở Khóa Tài Khoản
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{
                                                marginTop: '14px',
                                                padding: '12px 16px',
                                                borderRadius: '8px',
                                                background: appeal.status === 'approved' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(255, 77, 79, 0.1)',
                                                borderLeft: `4px solid ${appeal.status === 'approved' ? '#52c41a' : '#ff4d4f'}`
                                            }}>
                                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: appeal.status === 'approved' ? '#73d13d' : '#ff7875', marginBottom: '4px' }}>
                                                    Phản hồi chính thức của Admin:
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#fff' }}>
                                                    {appeal.admin_response || '(Không kèm lời nhắn)'}
                                                </div>
                                                {appeal.updated_at && (
                                                    <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
                                                        Xử lý lúc: {new Date(appeal.updated_at).toLocaleString('vi-VN')}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL NHẬP LÝ DO KHÓA TÀI KHOẢN (BAN MODAL) */}
            {/* ========================================================================= */}
            {banModal.isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                    <div style={{ background: '#1c1f26', padding: '26px', borderRadius: '12px', width: '100%', maxWidth: '480px', border: '1px solid #ff4d4f', boxShadow: '0 20px 50px rgba(0,0,0,0.7)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255, 77, 79, 0.2)', border: '1px solid #ff4d4f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                                🔒
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', color: '#ff4d4f' }}>
                                    Khóa & Giới Hạn Tài Khoản
                                </h3>
                                <span style={{ fontSize: '12px', color: '#aaa' }}>
                                    Tài khoản: <strong style={{ color: '#fff' }}>{banModal.userEmail}</strong>
                                </span>
                            </div>
                        </div>

                        <p style={{ fontSize: '13px', color: '#ccc', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                            Khi bị khóa, người dùng này sẽ <strong>bị chặn hoàn toàn</strong> mọi tương tác mua hàng, bán hàng, và chỉ có thể truy cập màn hình giải trình minh oan.
                        </p>

                        <form onSubmit={handleConfirmBanSubmit}>
                            <div style={{ marginBottom: '18px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#ff7875', marginBottom: '6px' }}>
                                    Lý do kỷ luật / Khóa tài khoản: <span style={{ color: '#ff4d4f' }}>*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={banModal.reason}
                                    onChange={(e) => setBanModal({ ...banModal, reason: e.target.value })}
                                    placeholder="Nhập lý do cụ thể (sẽ hiển thị trực tiếp cho người dùng bị khóa)..."
                                    style={{
                                        width: '100%',
                                        background: '#0e1117',
                                        border: '1px solid #444',
                                        borderRadius: '6px',
                                        padding: '10px 12px',
                                        color: '#fff',
                                        fontSize: '13px',
                                        boxSizing: 'border-box',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setBanModal({ isOpen: false, userId: null, userEmail: '', userName: '', reason: '' })}
                                    style={{ padding: '9px 18px', background: '#333', color: '#ccc', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoadingId === banModal.userId}
                                    style={{ padding: '9px 20px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                                >
                                    {actionLoadingId === banModal.userId ? 'Đang xử lý...' : 'Xác Nhận Khóa'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL XÁC NHẬN CHUNG (THAY THẾ WINDOW.CONFIRM) */}
            {/* ========================================================================= */}
            {confirmModal.isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                    <div style={{ background: '#1c1f26', padding: '26px', borderRadius: '12px', width: '100%', maxWidth: '440px', border: '1px solid #444', boxShadow: '0 20px 50px rgba(0,0,0,0.7)' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ⚠️ {confirmModal.title}
                        </h3>
                        <p style={{ fontSize: '14px', color: '#ccc', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                            {confirmModal.message}
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                style={{ padding: '9px 18px', background: '#333', color: '#ccc', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirmModal.onConfirm) confirmModal.onConfirm();
                                }}
                                style={{
                                    padding: '9px 20px',
                                    background: confirmModal.confirmColor || '#ee4d2d',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {confirmModal.confirmText || 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const kpiCardStyle = {
    background: '#222',
    border: '1px solid #333',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
};

const tabBtnStyle = (isActive) => ({
    padding: '12px 20px',
    background: isActive ? '#333' : 'transparent',
    color: isActive ? '#ee4d2d' : '#aaa',
    border: 'none',
    borderBottom: isActive ? '3px solid #ee4d2d' : '3px solid transparent',
    borderRadius: '6px 6px 0 0',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: isActive ? 'bold' : '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s'
});

const badgeCountStyle = {
    background: '#444',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 'bold'
};

const filterInputStyle = {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid #444',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '13px'
};

const selectFilterStyle = {
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid #444',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '13px',
    cursor: 'pointer'
};

const formLabelStyle = {
    display: 'block',
    fontSize: '12px',
    color: '#aaa',
    marginBottom: '4px',
    fontWeight: 'bold'
};

const formInputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #444',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '13px',
    boxSizing: 'border-box'
};
