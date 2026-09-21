import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export default function Profile({ currentUser, setCurrentUser, defaultTab = 'info' }) {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    // Xác định tab ban đầu (từ URL param ?tab=... hoặc prop defaultTab)
    const tabFromUrl = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabFromUrl || defaultTab);

    // Đồng bộ khi URL thay đổi
    useEffect(() => {
        const currentParam = searchParams.get('tab');
        if (currentParam && ['info', 'favorites', 'password'].includes(currentParam)) {
            setActiveTab(currentParam);
        }
    }, [searchParams]);

    // Chuyển tab và cập nhật URL query param
    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
        setSearchParams({ tab: tabKey });
    };

    // ==========================================
    // STATE TAB 1: THÔNG TIN CÁ NHÂN & ĐỊA CHỈ
    // ==========================================
    const [fullName, setFullName] = useState(currentUser?.full_name || '');
    const [phone, setPhone] = useState(currentUser?.phone || '');
    const [address, setAddress] = useState(currentUser?.address || '');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar || '');
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (currentUser) {
            setFullName(currentUser.full_name || '');
            setPhone(currentUser.phone || '');
            setAddress(currentUser.address || '');
            setAvatarPreview(currentUser.avatar || '');
        }
    }, [currentUser]);

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showToast("Vui lòng chọn file hình ảnh hợp lệ (jpg, png, webp...)", "warning");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast("Kích thước ảnh tối đa là 5MB!", "warning");
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setFullName(currentUser?.full_name || '');
        setPhone(currentUser?.phone || '');
        setAddress(currentUser?.address || '');
        setAvatarFile(null);
        setAvatarPreview(currentUser?.avatar || '');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsSavingProfile(true);

        try {
            let updatedAvatarUrl = currentUser.avatar;

            // 1. Nếu có chọn file ảnh đại diện mới, tải ảnh lên server trước
            if (avatarFile) {
                const formData = new FormData();
                formData.append('userId', currentUser.id);
                formData.append('avatar', avatarFile);

                const avatarRes = await fetch('http://localhost:5000/api/user/update-avatar', {
                    method: 'POST',
                    body: formData
                });
                const avatarData = await avatarRes.json();
                if (avatarData.success && avatarData.user) {
                    updatedAvatarUrl = avatarData.avatarUrl || avatarData.user.avatar;
                } else if (!avatarData.success) {
                    showToast(avatarData.message || "Không thể tải lên ảnh đại diện!", "error");
                    setIsSavingProfile(false);
                    return;
                }
            }

            // 2. Cập nhật thông tin họ tên, SĐT, địa chỉ
            const res = await fetch('http://localhost:5000/api/user/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.id,
                    fullName: fullName.trim(),
                    phone: phone.trim(),
                    address: address.trim()
                })
            });
            const data = await res.json();

            if (data.success && data.user) {
                const finalUser = {
                    ...data.user,
                    avatar: updatedAvatarUrl || data.user.avatar
                };
                if (setCurrentUser) setCurrentUser(finalUser);
                sessionStorage.setItem('user', JSON.stringify(finalUser));
                localStorage.setItem('user', JSON.stringify(finalUser));
                setAvatarFile(null);
                setIsEditing(false);
                showToast("🎉 Cập nhật thông tin tài khoản thành công!", "success");
            } else {
                showToast(data.message || "Cập nhật thất bại!", "error");
            }
        } catch (error) {
            console.error("Lỗi cập nhật profile:", error);
            showToast("Lỗi kết nối máy chủ!", "error");
        } finally {
            setIsSavingProfile(false);
        }
    };

    // ==========================================
    // STATE TAB 2: QUÁN YÊU THÍCH
    // ==========================================
    const [favoriteShops, setFavoriteShops] = useState([]);
    const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);

    const fetchFavorites = async () => {
        if (!currentUser) return;
        setIsLoadingFavorites(true);
        try {
            const res = await fetch(`http://localhost:5000/api/favorites?userId=${currentUser.id}`);
            const data = await res.json();
            if (data.success && Array.isArray(data.shops)) {
                setFavoriteShops(data.shops);
            }
        } catch (err) {
            console.error("Lỗi lấy quán yêu thích:", err);
        } finally {
            setIsLoadingFavorites(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'favorites') {
            fetchFavorites();
        }
    }, [activeTab, currentUser]);

    // Bỏ thích quán ngay trong tab danh sách
    const handleRemoveFavorite = async (e, shopId, shopName) => {
        e.stopPropagation();
        if (!currentUser) return;

        try {
            const res = await fetch('http://localhost:5000/api/favorites/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, shopId })
            });
            const data = await res.json();
            if (data.success) {
                setFavoriteShops(prev => prev.filter(s => s.id !== shopId));
                showToast(`💔 Đã xóa "${shopName}" khỏi danh sách yêu thích.`, "info");
            }
        } catch (err) {
            showToast("Lỗi khi bỏ yêu thích quán!", "error");
        }
    };

    // ==========================================
    // STATE TAB 3: ĐỔI MẬT KHẨU
    // ==========================================
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        if (newPassword.length < 6) {
            showToast("Mật khẩu mới phải có ít nhất 6 ký tự!", "warning");
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast("Mật khẩu xác nhận không trùng khớp!", "warning");
            return;
        }

        setIsSavingPassword(true);
        try {
            const res = await fetch('http://localhost:5000/api/user/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.id,
                    currentPassword: currentPassword,
                    newPassword: newPassword
                })
            });
            const data = await res.json();

            if (data.success) {
                showToast("🎉 Đổi mật khẩu thành công!", "success");
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                showToast(data.message || "Đổi mật khẩu thất bại!", "error");
            }
        } catch (error) {
            showToast("Lỗi kết nối máy chủ khi đổi mật khẩu!", "error");
        } finally {
            setIsSavingPassword(false);
        }
    };

    // Nếu chưa đăng nhập, chuyển về login
    if (!currentUser) {
        return (
            <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 20px', textAlign: 'center', color: '#fff' }}>
                <div style={{ background: '#222', padding: '40px 30px', borderRadius: '8px', border: '1px solid #333' }}>
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔒</div>
                    <h2 style={{ margin: '0 0 10px 0' }}>Vui lòng đăng nhập</h2>
                    <p style={{ color: '#888', marginBottom: '25px', fontSize: '14px' }}>
                        Bạn cần đăng nhập để quản lý thông tin tài khoản và xem các quán yêu thích.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            padding: '12px 28px',
                            background: '#ee4d2d',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '15px'
                        }}
                    >
                        Đăng nhập ngay
                    </button>
                </div>
            </div>
        );
    }

    const navItemStyle = (tabKey) => ({
        padding: '12px 20px',
        background: activeTab === tabKey ? '#ee4d2d' : 'transparent',
        color: activeTab === tabKey ? '#fff' : '#ccc',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: activeTab === tabKey ? 'bold' : '500',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        transition: 'all 0.2s',
        textAlign: 'left',
        width: '100%'
    });

    const formInputStyle = {
        width: '100%',
        boxSizing: 'border-box',
        background: '#1a1a1a',
        border: '1px solid #444',
        borderRadius: '6px',
        padding: '12px 14px',
        color: '#fff',
        fontSize: '14px',
        outline: 'none',
        fontFamily: 'inherit'
    };

    const formLabelStyle = {
        display: 'block',
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#aaa',
        marginBottom: '6px'
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
            
            {/* TIÊU ĐỀ TRANG */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #333', paddingBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <h1 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>
                        Tài Khoản Của Tôi
                    </h1>
                    <span style={{ fontSize: '13px', color: '#888' }}>
                        Quản lý hồ sơ cá nhân, địa chỉ nhận hàng và các quán ăn yêu thích
                    </span>
                </div>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        padding: '8px 16px',
                        background: '#2a2a2a',
                        color: '#ccc',
                        border: '1px solid #444',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px'
                    }}
                >
                    ← Về trang chủ
                </button>
            </div>

            {/* BỐ CỤC CHÍNH: CỘT MENU TRÁI & KHU VỰC NỘI DUNG PHẢI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px', alignItems: 'start' }}>
                
                {/* MENU ĐIỀU HƯỚNG TRÁI */}
                <div style={{
                    background: '#222',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    {/* Header hồ sơ nhanh */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '15px', marginBottom: '10px', borderBottom: '1px solid #333' }}>
                        <img
                            src={currentUser.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt="Avatar"
                            style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#fff', border: '2px solid #ee4d2d', objectFit: 'cover' }}
                        />
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {currentUser.full_name || 'Khách hàng'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {currentUser.email}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => handleTabChange('info')}
                        style={navItemStyle('info')}
                    >
                        <span>👤</span> Hồ Sơ & Địa Chỉ Nhận Hàng
                    </button>

                    <button
                        onClick={() => navigate('/my-orders')}
                        style={navItemStyle('orders')}
                    >
                        <span>📦</span> Đơn Hàng Của Tôi
                    </button>

                    <button
                        onClick={() => handleTabChange('favorites')}
                        style={navItemStyle('favorites')}
                    >
                        <span>❤️</span> Quán Ăn Yêu Thích
                    </button>

                    <button
                        onClick={() => handleTabChange('password')}
                        style={navItemStyle('password')}
                    >
                        <span>🔑</span> Đổi Mật Khẩu
                    </button>
                </div>

                {/* KHU VỰC NỘI DUNG PHẢI */}
                <div style={{
                    background: '#222',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    padding: '25px',
                    minHeight: '400px'
                }}>
                    
                    {/* ========================================================= */}
                    {/* TAB 1: THÔNG TIN HỒ SƠ & ĐỊA CHỈ GIAO HÀNG */}
                    {/* ========================================================= */}
                    {activeTab === 'info' && (
                        <div>
                            {!isEditing ? (
                                /* CHẾ ĐỘ XEM THÔNG TIN MẶC ĐỊNH */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#fff' }}>
                                                Hồ Sơ Của Bạn
                                            </h3>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>
                                                Thông tin cá nhân và địa chỉ đã lưu trong hệ thống từ lúc tạo tài khoản
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(true)}
                                            style={{
                                                padding: '10px 18px',
                                                background: '#ee4d2d',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                fontSize: '14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                boxShadow: '0 2px 8px rgba(238, 77, 45, 0.4)',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                        >
                                            <span>⚙️</span> Cài Đặt / Chỉnh Sửa
                                        </button>
                                    </div>

                                    {/* THẺ HỒ SƠ CHI TIẾT */}
                                    <div style={{
                                        background: '#1a1a1a',
                                        border: '1px solid #333',
                                        borderRadius: '10px',
                                        padding: '24px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '24px'
                                    }}>
                                        {/* Avatar lớn và Tên hiển thị */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                                            <div style={{ position: 'relative' }}>
                                                <img
                                                    src={currentUser.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                    alt="Avatar"
                                                    style={{
                                                        width: '80px',
                                                        height: '80px',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover',
                                                        border: '3px solid #ee4d2d',
                                                        background: '#fff'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>
                                                    {currentUser.full_name || 'Khách hàng'}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    <span style={{
                                                        background: '#2e7d32',
                                                        color: '#fff',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        padding: '3px 10px',
                                                        borderRadius: '12px'
                                                    }}>
                                                        Tài khoản Khách hàng
                                                    </span>
                                                    <span style={{ fontSize: '12px', color: '#888' }}>
                                                        Mã ID: #{currentUser.id}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bảng chi tiết các trường thông tin */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                                            <div style={{ background: '#252525', padding: '14px 16px', borderRadius: '8px', border: '1px solid #383838' }}>
                                                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '6px', fontWeight: '600' }}>
                                                    👤 HỌ VÀ TÊN
                                                </div>
                                                <div style={{ fontSize: '15px', color: currentUser.full_name ? '#fff' : '#888', fontWeight: '500' }}>
                                                    {currentUser.full_name || '(Chưa cập nhật họ tên)'}
                                                </div>
                                            </div>

                                            <div style={{ background: '#252525', padding: '14px 16px', borderRadius: '8px', border: '1px solid #383838' }}>
                                                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '6px', fontWeight: '600' }}>
                                                    📞 SỐ ĐIỆN THOẠI
                                                </div>
                                                <div style={{ fontSize: '15px', color: currentUser.phone ? '#fff' : '#888', fontWeight: '500' }}>
                                                    {currentUser.phone || '(Chưa cập nhật số điện thoại)'}
                                                </div>
                                            </div>

                                            <div style={{ background: '#252525', padding: '14px 16px', borderRadius: '8px', border: '1px solid #383838' }}>
                                                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '6px', fontWeight: '600' }}>
                                                    ✉️ ĐỊA CHỈ EMAIL
                                                </div>
                                                <div style={{ fontSize: '15px', color: '#fff', fontWeight: '500' }}>
                                                    {currentUser.email}
                                                </div>
                                            </div>

                                            <div style={{ background: '#252525', padding: '14px 16px', borderRadius: '8px', border: '1px solid #383838', gridColumn: '1 / -1' }}>
                                                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '6px', fontWeight: '600' }}>
                                                    📍 ĐỊA CHỈ GIAO HÀNG MẶC ĐỊNH
                                                </div>
                                                <div style={{ fontSize: '15px', color: currentUser.address ? '#fff' : '#888', fontWeight: '500', lineHeight: '1.5' }}>
                                                    {currentUser.address || '(Chưa thiết lập địa chỉ mặc định)'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* CHẾ ĐỘ CHỈNH SỬA / CÀI ĐẶT */
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '20px' }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#fff' }}>
                                                ⚙️ Cài Đặt & Chỉnh Sửa Thông Tin
                                            </h3>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>
                                                Cập nhật họ tên, ảnh đại diện, số điện thoại và địa chỉ nhận hàng
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            style={{
                                                padding: '8px 16px',
                                                background: '#333',
                                                color: '#ccc',
                                                border: '1px solid #555',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '13px'
                                            }}
                                        >
                                            ✕ Quay lại xem thông tin
                                        </button>
                                    </div>

                                    <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {/* KHU VỰC THAY ĐỔI ẢNH ĐẠI DIỆN */}
                                        <div style={{
                                            background: '#1a1a1a',
                                            border: '1px solid #333',
                                            borderRadius: '8px',
                                            padding: '18px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '20px',
                                            flexWrap: 'wrap'
                                        }}>
                                            <div style={{ position: 'relative' }}>
                                                <img
                                                    src={avatarPreview || currentUser.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                    alt="Avatar Preview"
                                                    style={{
                                                        width: '80px',
                                                        height: '80px',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover',
                                                        border: '3px solid #ee4d2d',
                                                        background: '#fff'
                                                    }}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff', marginBottom: '6px' }}>
                                                    Ảnh đại diện tài khoản
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
                                                    Hỗ trợ file: JPG, PNG, WEBP. Kích thước tối đa 5MB.
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        style={{
                                                            padding: '8px 16px',
                                                            background: '#2a2a2a',
                                                            color: '#fff',
                                                            border: '1px solid #555',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: '500',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}
                                                    >
                                                        📷 Chọn ảnh đại diện mới
                                                    </button>
                                                    {avatarFile && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '12px', color: '#4caf50', fontWeight: '500' }}>
                                                                ✓ {avatarFile.name}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setAvatarFile(null);
                                                                    setAvatarPreview(currentUser.avatar || '');
                                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                                }}
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    color: '#ff5252',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px',
                                                                    textDecoration: 'underline'
                                                                }}
                                                            >
                                                                Hủy chọn
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleAvatarChange}
                                                    style={{ display: 'none' }}
                                                />
                                            </div>
                                        </div>

                                        {/* ĐỊA CHỈ EMAIL */}
                                        <div>
                                            <label style={formLabelStyle}>Địa chỉ Email</label>
                                            <input
                                                type="email"
                                                disabled
                                                value={currentUser.email || ''}
                                                style={{ ...formInputStyle, background: '#141414', color: '#888', cursor: 'not-allowed' }}
                                            />
                                            <span style={{ fontSize: '11px', color: '#666', marginTop: '4px', display: 'block' }}>Email tài khoản không thể chỉnh sửa</span>
                                        </div>

                                        {/* HỌ VÀ TÊN */}
                                        <div>
                                            <label style={formLabelStyle}>Họ và tên *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ví dụ: Nguyễn Văn A"
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                style={formInputStyle}
                                            />
                                        </div>

                                        {/* SỐ ĐIỆN THOẠI */}
                                        <div>
                                            <label style={formLabelStyle}>Số điện thoại nhận hàng *</label>
                                            <input
                                                type="tel"
                                                required
                                                placeholder="Ví dụ: 0987654321"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                style={formInputStyle}
                                            />
                                        </div>

                                        {/* ĐỊA CHỈ GIAO HÀNG */}
                                        <div>
                                            <label style={formLabelStyle}>Địa chỉ giao hàng mặc định *</label>
                                            <textarea
                                                rows="3"
                                                required
                                                placeholder="Ví dụ: Số 25 ngõ 123 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội"
                                                value={address}
                                                onChange={e => setAddress(e.target.value)}
                                                style={{ ...formInputStyle, resize: 'vertical' }}
                                            />
                                        </div>

                                        {/* NÚT THAO TÁC */}
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                            <button
                                                type="submit"
                                                disabled={isSavingProfile}
                                                style={{
                                                    padding: '12px 28px',
                                                    background: isSavingProfile ? '#555' : '#ee4d2d',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                                                    fontWeight: 'bold',
                                                    fontSize: '14px',
                                                    boxShadow: '0 2px 8px rgba(238, 77, 45, 0.4)',
                                                    transition: 'background 0.2s'
                                                }}
                                            >
                                                {isSavingProfile ? 'Đang lưu...' : '💾 Lưu Thay Đổi'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                disabled={isSavingProfile}
                                                style={{
                                                    padding: '12px 20px',
                                                    background: '#2a2a2a',
                                                    color: '#ccc',
                                                    border: '1px solid #444',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                ✕ Hủy Bỏ
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 2: QUÁN ĂN YÊU THÍCH */}
                    {/* ========================================================= */}
                    {activeTab === 'favorites' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#fff' }}>
                                        Quán Ăn Yêu Thích Của Bạn
                                    </h3>
                                    <span style={{ fontSize: '13px', color: '#888' }}>
                                        Danh sách các quán bạn đã thả tim ({favoriteShops.length} quán)
                                    </span>
                                </div>
                            </div>

                            {isLoadingFavorites ? (
                                <div style={{ textAlign: 'center', padding: '50px 20px', color: '#888' }}>
                                    ⏳ Đang tải danh sách quán yêu thích...
                                </div>
                            ) : favoriteShops.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>💔</div>
                                    <h4 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '16px' }}>
                                        Bạn chưa lưu quán yêu thích nào
                                    </h4>
                                    <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                                        Hãy bấm vào biểu tượng Trái tim (❤️) nằm cùng hàng với tên quán khi vào xem thực đơn để lưu quán vào danh sách này nhé!
                                    </p>
                                    <button
                                        onClick={() => navigate('/')}
                                        style={{
                                            padding: '10px 24px',
                                            background: '#ee4d2d',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Khám phá quán ăn ngay
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                                    {favoriteShops.map(shop => {
                                        const isClosed = !shop.is_open;
                                        return (
                                        <div
                                            key={shop.id}
                                            onClick={() => navigate(`/shop/${shop.id}`)}
                                            style={{
                                                background: isClosed ? '#181818' : '#1c1c1c',
                                                borderRadius: '8px',
                                                border: `1px ${isClosed ? 'dashed #444' : 'solid #333'}`,
                                                padding: '14px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease-in-out',
                                                position: 'relative',
                                                filter: isClosed ? 'grayscale(100%)' : 'none',
                                                opacity: isClosed ? 0.6 : 1
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.borderColor = '#ee4d2d';
                                                if (isClosed) e.currentTarget.style.opacity = '0.85';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.borderColor = isClosed ? '#444' : '#333';
                                                if (isClosed) e.currentTarget.style.opacity = '0.6';
                                            }}
                                        >
                                            {/* Nút hủy thích nhanh */}
                                            <button
                                                onClick={(e) => handleRemoveFavorite(e, shop.id, shop.shop_name)}
                                                title="Bỏ thích quán này"
                                                style={{
                                                    position: 'absolute',
                                                    top: '12px',
                                                    right: '12px',
                                                    background: 'rgba(0,0,0,0.6)',
                                                    border: '1px solid #ff4d4f',
                                                    borderRadius: '50%',
                                                    width: '32px',
                                                    height: '32px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    fontSize: '16px',
                                                    color: '#ff4d4f',
                                                    zIndex: 2
                                                }}
                                            >
                                                ❤️
                                            </button>

                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                                                <div style={{ position: 'relative', width: '65px', height: '65px', flexShrink: 0 }}>
                                                    <img
                                                        src={shop.avatar || "https://images.unsplash.com/photo-1504674900247-0877df9cc836"}
                                                        alt={shop.shop_name}
                                                        style={{ width: '65px', height: '65px', borderRadius: '6px', objectFit: 'cover', display: 'block' }}
                                                    />
                                                    {isClosed && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: 0, left: 0, right: 0, bottom: 0,
                                                            background: 'rgba(0,0,0,0.5)',
                                                            borderRadius: '6px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#fff',
                                                            fontSize: '10px',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            Đóng cửa
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: isClosed ? '#aaa' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {shop.shop_name}
                                                        </h4>
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: isClosed ? '#888' : '#ee4d2d', fontWeight: 'bold' }}>
                                                        🏷 {shop.shop_category || 'Đồ ăn'}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: shop.is_open ? '#28a745' : '#888', marginTop: '2px' }}>
                                                        {shop.is_open ? '● Đang mở cửa' : '● Tạm đóng cửa'}
                                                    </div>
                                                </div>
                                            </div>

                                            {shop.shop_address && (
                                                <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    📍 {shop.shop_address}
                                                </p>
                                            )}

                                            <button
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    background: '#2a2a2a',
                                                    color: '#fff',
                                                    border: '1px solid #444',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#ee4d2d'; e.currentTarget.style.borderColor = '#ee4d2d'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#2a2a2a'; e.currentTarget.style.borderColor = '#444'; }}
                                            >
                                                Xem Thực Đơn ➔
                                            </button>
                                        </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 3: ĐỔI MẬT KHẨU */}
                    {/* ========================================================= */}
                    {activeTab === 'password' && (
                        <div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#fff' }}>
                                Đổi Mật Khẩu
                            </h3>
                            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#888' }}>
                                Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác.
                            </p>

                            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '450px' }}>
                                <div>
                                    <label style={formLabelStyle}>Mật khẩu hiện tại *</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Nhập mật khẩu hiện tại"
                                        value={currentPassword}
                                        onChange={e => setCurrentPassword(e.target.value)}
                                        style={formInputStyle}
                                    />
                                </div>

                                <div>
                                    <label style={formLabelStyle}>Mật khẩu mới * (tối thiểu 6 ký tự)</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Nhập mật khẩu mới"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        style={formInputStyle}
                                    />
                                </div>

                                <div>
                                    <label style={formLabelStyle}>Xác nhận mật khẩu mới *</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Nhập lại mật khẩu mới"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        style={formInputStyle}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSavingPassword}
                                    style={{
                                        padding: '12px 24px',
                                        background: isSavingPassword ? '#555' : '#ee4d2d',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: isSavingPassword ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        alignSelf: 'flex-start',
                                        marginTop: '10px',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    {isSavingPassword ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
                                </button>
                            </form>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
