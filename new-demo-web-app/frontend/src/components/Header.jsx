import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoMBite from '../assets/logo-mbite.png';
import { useToast } from '../context/ToastContext';
import { SHOP_CATEGORIES } from '../constants/categories';
import { StoreIcon, SettingsIcon, UserIcon, PackageIcon, HeartIcon, KeyIcon, LogOutIcon, TicketIcon } from './Icons';

export default function Header({ 
    currentUser, 
    setCurrentUser, 
    cart = [], 
    selectedCategory = 'Tất cả', 
    setSelectedCategory,
    searchKeyword = '',
    setSearchKeyword
}) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchText, setSearchText] = useState(searchKeyword || '');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    const searchRef = useRef(null);
    const searchInputRef = useRef(null);
    const profileDropdownRef = useRef(null);

    const navigate = useNavigate();
    const { showToast } = useToast();

    const categoryTabs = ['Tất cả', ...SHOP_CATEGORIES, 'Voucher'];

    // Đồng bộ searchText khi searchKeyword thay đổi từ bên ngoài (ví dụ xóa tìm kiếm)
    useEffect(() => {
        setSearchText(searchKeyword || '');
    }, [searchKeyword]);

    // Tự động thu lại thanh tìm kiếm và đóng dropdown profile khi bấm ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        localStorage.removeItem('user');
        if (setCurrentUser) setCurrentUser(null);
        showToast("Đã đăng xuất thành công!", "info");
        navigate('/'); 
    };

    const handleSearchSubmit = () => {
        const term = searchText.trim();
        if (term !== '') {
            if (setSearchKeyword) setSearchKeyword(term);
            navigate('/');
        } else {
            if (setSearchKeyword) setSearchKeyword('');
        }
    };

    const toggleSearch = () => {
        if (!isSearchOpen) {
            setIsSearchOpen(true);
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        } else {
            if (searchText.trim() !== '') {
                handleSearchSubmit();
            } else {
                setIsSearchOpen(false);
            }
        }
    };

    const isSeller = currentUser?.role === 'seller';
    const isAdmin = currentUser?.role === 'admin';

    return (
        <header style={{ background: '#1c1c1c', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'center', height: '90px', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 1px 5px rgba(0,0,0,0.5)' }}>
            <div style={{ width: '100%', padding: '0 50px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                
                {/* KHỐI BÊN TRÁI: Logo + Phân biệt Seller / Buyer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                    <div 
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            cursor: isSeller ? 'default' : 'pointer' 
                        }} 
                        onClick={() => {
                            if (!isSeller) {
                                if (setSearchKeyword) setSearchKeyword('');
                                if (setSelectedCategory) setSelectedCategory('Tất cả');
                                navigate('/');
                            }
                        }}
                        title={isSeller ? "Kênh Người Bán" : "Trang chủ M-Bite"}
                    >
                        <img 
                            src={logoMBite} 
                            alt="M-Bite Logo" 
                            style={{ 
                                height: '100px', 
                                width: 'auto', 
                                objectFit: 'contain',
                                display: 'block'
                            }} 
                        />
                    </div>
                    
                    {isSeller ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ 
                                background: 'linear-gradient(45deg, #ee4d2d, #ff7337)', 
                                color: '#fff', 
                                padding: '6px 14px', 
                                borderRadius: '4px', 
                                fontSize: '13px', 
                                fontWeight: 'bold',
                                letterSpacing: '0.5px'
                            }}>
                                KÊNH QUẢN LÝ NHÀ HÀNG
                            </span>
                            <span style={{ color: '#aaa', fontSize: '14px' }}>
                                Quán: <strong style={{ color: '#fff' }}>{currentUser.shop_name || 'Của bạn'}</strong>
                            </span>
                        </div>
                    ) : isAdmin ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span 
                                onClick={() => navigate('/admin')}
                                style={{ 
                                    background: 'linear-gradient(135deg, #722ed1 0%, #eb2f96 100%)', 
                                    color: '#fff', 
                                    padding: '7px 16px', 
                                    borderRadius: '6px', 
                                    fontSize: '13px', 
                                    fontWeight: 'bold', 
                                    letterSpacing: '0.5px',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(114, 46, 209, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                Admin-Panel
                            </span>
                            <span 
                                onClick={() => navigate('/')}
                                style={{ color: '#aaa', fontSize: '14px', cursor: 'pointer', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                onMouseLeave={e => e.currentTarget.style.color = '#aaa'}
                            >
                                <StoreIcon size={16} /> Xem sàn M-Bite →
                            </span>
                        </div>
                    ) : (
                        <>
                            <div style={{ background: '#2a2a2a', padding: '8px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#fff' }}>
                                Hà Nội <span style={{ fontSize: '10px', color: '#999' }}>▼</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '15px', fontWeight: '500' }}>
                                {categoryTabs.map((tab) => {
                                    const isSelected = selectedCategory === tab;
                                    return (
                                        <span 
                                            key={tab}
                                            onClick={() => {
                                                if (setSearchKeyword) setSearchKeyword('');
                                                if (setSelectedCategory) setSelectedCategory(tab);
                                                navigate('/');
                                            }}
                                            style={{ 
                                                color: isSelected ? '#ee4d2d' : '#ccc', 
                                                borderBottom: isSelected ? '3px solid #ee4d2d' : '3px solid transparent', 
                                                padding: '33px 0', 
                                                cursor: 'pointer', 
                                                transition: 'all 0.2s ease-in-out',
                                                fontWeight: isSelected ? 'bold' : '500',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {tab}
                                        </span>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* KHỐI BÊN PHẢI: Phân biệt Seller / Buyer */}
                {isSeller ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img 
                                src={currentUser?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                                alt="Avatar" 
                                style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#fff', objectFit: 'cover', border: '2px solid #ee4d2d' }} 
                            />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '600', color: '#fff', fontSize: '14px' }}>{currentUser.shop_name || 'Chủ quán'}</span>
                                <span style={{ fontSize: '12px', color: '#888' }}>{currentUser.email}</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleLogout} 
                            style={{ 
                                padding: '8px 18px', 
                                border: 'none', 
                                color: '#fff', 
                                background: '#ee4d2d', 
                                borderRadius: '6px', 
                                cursor: 'pointer', 
                                fontWeight: 'bold', 
                                fontSize: '13px',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#d73a1c'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#ee4d2d'}
                        >
                            Đăng xuất
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                        {/* THANH TÌM KIẾM CÓ TỰ ĐỘNG THU LẠI KHI CLICK RA NGOÀI */}
                        <div 
                            ref={searchRef}
                            style={{ 
                                display: 'flex', alignItems: 'center', border: isSearchOpen ? '1px solid #ee4d2d' : '1px solid transparent', 
                                borderRadius: '50px', width: isSearchOpen ? '260px' : '40px', height: '40px', padding: isSearchOpen ? '0 15px' : '0',
                                justifyContent: 'center', transition: 'all 0.3s ease-in-out', overflow: 'hidden', boxSizing: 'border-box',
                                background: isSearchOpen ? '#fff' : 'transparent', cursor: isSearchOpen ? 'default' : 'pointer'
                            }}
                            onClick={() => {
                                if (!isSearchOpen) {
                                    setIsSearchOpen(true);
                                    setTimeout(() => searchInputRef.current?.focus(), 100);
                                }
                            }}
                            title={isSearchOpen ? "" : "Bấm để tìm kiếm món ăn hoặc quán"}
                        >
                            <input 
                                ref={searchInputRef}
                                type="text" 
                                placeholder="Tìm món ăn, tên quán..." 
                                value={searchText} 
                                onChange={(e) => setSearchText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearchSubmit();
                                    } else if (e.key === 'Escape') {
                                        setIsSearchOpen(false);
                                    }
                                }}
                                style={{ 
                                    flex: 1, border: 'none', outline: 'none', fontSize: '14px', background: 'transparent',
                                    color: '#333', opacity: isSearchOpen ? 1 : 0, width: isSearchOpen ? '100%' : '0px', padding: 0, transition: 'opacity 0.2s ease-in-out'
                                }} 
                            />
                            <svg 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSearch();
                                }}
                                style={{ minWidth: '20px', cursor: 'pointer', color: isSearchOpen ? '#666' : '#ccc', transition: 'color 0.2s' }} 
                                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                title="Tìm kiếm"
                            >
                                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                        
                        {currentUser ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                {/* NÚT GIỎ HÀNG THU GỌN: KHÔNG VIỀN, TỐI GIẢN HIỆN ĐẠI */}
                                <div 
                                    style={{ 
                                        position: 'relative',
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        cursor: 'pointer', 
                                        padding: '8px',
                                        background: 'transparent',
                                        border: 'none',
                                        transition: 'color 0.2s ease, transform 0.2s ease',
                                        flexShrink: 0,
                                        color: '#ccc'
                                    }} 
                                    onClick={() => navigate('/checkout')}
                                    title={`Giỏ hàng (${cart.reduce((sum, item) => sum + (item.quantity || 1), 0)} món)`}
                                    onMouseEnter={(e) => { 
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.transform = 'translateY(-1px)'; 
                                    }}
                                    onMouseLeave={(e) => { 
                                        e.currentTarget.style.color = '#ccc';
                                        e.currentTarget.style.transform = 'translateY(0)'; 
                                    }}
                                >
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                    </svg>
                                    {cart.length > 0 && (
                                        <span style={{ 
                                            position: 'absolute', 
                                            top: '-2px', 
                                            right: '-2px', 
                                            background: '#ee4d2d', 
                                            color: '#fff', 
                                            borderRadius: '10px', 
                                            minWidth: '18px', 
                                            height: '18px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            fontSize: '11px', 
                                            fontWeight: 'bold', 
                                            padding: '0 5px',
                                            boxShadow: '0 2px 6px rgba(238, 77, 45, 0.4)',
                                            border: '2px solid #1c1c1c'
                                        }}>
                                            {cart.reduce((sum, item) => sum + (item.quantity || 1), 0)}
                                        </span>
                                    )}
                                </div>

                                {/* DROPDOWN PROFILE CÓ TỰ ĐỘNG THU LẠI KHI CLICK RA NGOÀI */}
                                <div style={{ position: 'relative' }} ref={profileDropdownRef}>
                                    <div 
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#2a2a2a', padding: '4px 12px 4px 4px', borderRadius: '50px' }}
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    >
                                        <img 
                                            src={currentUser?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                                            alt="Avatar" 
                                            style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fff', objectFit: 'cover' }} 
                                        />
                                        <span style={{ fontWeight: '600', color: '#fff', fontSize: '14px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {currentUser?.full_name || 'Khách hàng'}
                                        </span>
                                        <span style={{ fontSize: '10px', color: '#999' }}>▼</span>
                                    </div>

                                    {isProfileOpen && (
                                        <div style={{ position: 'absolute', top: '130%', right: 0, background: '#1c1c1c', border: '1px solid #333', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', width: '220px', zIndex: 1001, display: 'flex', flexDirection: 'column', fontSize: '14px', overflow: 'hidden' }}>
                                            {isAdmin && (
                                                <div 
                                                    style={{ padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', background: 'rgba(114, 46, 209, 0.2)' }} 
                                                    onClick={() => { setIsProfileOpen(false); navigate('/admin'); }}
                                                >
                                                    <SettingsIcon size={18} color="#d3adf7" /><span style={{ fontWeight: 'bold', color: '#d3adf7' }}>Admin-Panel</span>
                                                </div>
                                            )}
                                            <div 
                                                style={{ padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }} 
                                                onClick={() => { setIsProfileOpen(false); navigate('/profile?tab=info'); }}
                                            >
                                                <UserIcon size={18} color="#aaa" /><span style={{ fontWeight: '500' }}>Thông tin tài khoản</span>
                                            </div>
                                            <div 
                                                style={{ padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }} 
                                                onClick={() => { setIsProfileOpen(false); navigate('/my-orders'); }}
                                            >
                                                <PackageIcon size={18} color="#aaa" /><span style={{ fontWeight: '500' }}>Đơn hàng của tôi</span>
                                            </div>
                                            <div 
                                                style={{ padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }} 
                                                onClick={() => { setIsProfileOpen(false); navigate('/my-vouchers'); }}
                                            >
                                                <TicketIcon size={18} color="#aaa" /><span style={{ fontWeight: '500' }}>Ví voucher</span>
                                            </div>
                                            <div 
                                                style={{ padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }} 
                                                onClick={() => { setIsProfileOpen(false); navigate('/profile?tab=favorites'); }}
                                            >
                                                <HeartIcon size={18} color="#aaa" /><span style={{ fontWeight: '500' }}>Quán yêu thích</span>
                                            </div>
                                            <div 
                                                style={{ padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }} 
                                                onClick={() => { setIsProfileOpen(false); navigate('/profile?tab=password'); }}
                                            >
                                                <KeyIcon size={18} color="#aaa" /><span style={{ fontWeight: '500' }}>Đổi mật khẩu</span>
                                            </div>
                                            <div 
                                                onClick={() => { setIsProfileOpen(false); handleLogout(); }} 
                                                style={{ padding: '12px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: '#2a2a2a' }}
                                            >
                                                <LogOutIcon size={18} color="#ee4d2d" /><span style={{ color: '#ee4d2d', fontWeight: 'bold' }}>Đăng xuất</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => navigate('/login')} style={{ padding: '8px 20px', border: '1px solid #ee4d2d', color: '#ee4d2d', background: 'transparent', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}>Đăng nhập</button>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}