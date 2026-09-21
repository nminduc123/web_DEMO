import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoMBite from '../assets/logo-mbite.png';

export default function Header({ currentUser, setCurrentUser }) {
    const [activeTab, setActiveTab] = useState('Đồ ăn');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    const navigate = useNavigate();

    const handleLogout = () => {
        if (setCurrentUser) setCurrentUser(null);
        navigate('/'); 
    };

    const isSeller = currentUser?.role === 'seller';

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
                    ) : (
                        <>
                            <div style={{ background: '#2a2a2a', padding: '8px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#fff' }}>
                                Hà Nội <span style={{ fontSize: '10px', color: '#999' }}>▼</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '15px', fontWeight: '500' }}>
                                {['Đồ ăn', 'Thực phẩm', 'Rượu bia', 'Hoa', 'Siêu thị', 'Thuốc', 'Thú cưng'].map((tab) => (
                                    <span 
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{ 
                                            color: activeTab === tab ? '#ee4d2d' : '#ccc', 
                                            borderBottom: activeTab === tab ? '3px solid #ee4d2d' : '3px solid transparent', 
                                            padding: '33px 0', cursor: 'pointer', transition: 'all 0.2s ease-in-out'
                                        }}
                                    >
                                        {tab}
                                    </span>
                                ))}
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
                        <div style={{ 
                            display: 'flex', alignItems: 'center', border: isSearchOpen ? '1px solid #ee4d2d' : '1px solid transparent', 
                            borderRadius: '50px', width: isSearchOpen ? '260px' : '40px', height: '40px', padding: isSearchOpen ? '0 15px' : '0',
                            justifyContent: 'center', transition: 'all 0.3s ease-in-out', overflow: 'hidden', boxSizing: 'border-box',
                            background: isSearchOpen ? '#fff' : 'transparent', cursor: isSearchOpen ? 'default' : 'pointer'
                        }}
                        onClick={() => !isSearchOpen && setIsSearchOpen(true)}
                        >
                            <input 
                                type="text" placeholder="Tìm món ăn..." 
                                value={searchText} onChange={(e) => setSearchText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && searchText.trim() !== '') alert("Đang tìm: " + searchText);
                                }}
                                style={{ 
                                    flex: 1, border: 'none', outline: 'none', fontSize: '14px', background: 'transparent',
                                    color: '#333', opacity: isSearchOpen ? 1 : 0, width: isSearchOpen ? '100%' : '0px', padding: 0, transition: 'opacity 0.2s ease-in-out'
                                }} 
                            />
                            <svg 
                                onClick={(e) => {
                                    if (isSearchOpen) {
                                        e.stopPropagation();
                                        if (searchText.trim() === '') setIsSearchOpen(false);
                                        else alert("Đang tìm: " + searchText);
                                    }
                                }}
                                style={{ minWidth: '20px', cursor: 'pointer', color: isSearchOpen ? '#666' : '#ccc' }} 
                                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                        
                        {currentUser ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div 
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid #ee4d2d', padding: '6px 15px', borderRadius: '50px', background: '#2a2a2a' }} 
                                    onClick={() => navigate('/checkout')}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ee4d2d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                    </svg>
                                    <span style={{ color: '#ee4d2d', fontWeight: 'bold', fontSize: '14px' }}>Giỏ hàng (0)</span>
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <div 
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#2a2a2a', padding: '4px 12px 4px 4px', borderRadius: '50px' }}
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    >
                                        <img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fff' }} />
                                        <span style={{ fontWeight: '600', color: '#fff', fontSize: '14px' }}>{currentUser?.email?.split('@')[0] || 'User'}</span>
                                        <span style={{ fontSize: '10px', color: '#999' }}>▼</span>
                                    </div>

                                    {isProfileOpen && (
                                        <div style={{ position: 'absolute', top: '130%', right: 0, background: '#1c1c1c', border: '1px solid #333', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', width: '200px', zIndex: 1001, display: 'flex', flexDirection: 'column', fontSize: '14px', overflow: 'hidden' }}>
                                            <div style={{ padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }} onClick={() => navigate('/profile')}>
                                                <span style={{ fontSize: '18px' }}>👤</span><span style={{ fontWeight: '500' }}>Thông tin tài khoản</span>
                                            </div>
                                            <div style={{ padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }} onClick={() => navigate('/change-password')}>
                                                <span style={{ fontSize: '18px' }}>🔑</span><span style={{ fontWeight: '500' }}>Đổi mật khẩu</span>
                                            </div>
                                            <div onClick={() => { setIsProfileOpen(false); handleLogout(); }} style={{ padding: '12px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: '#2a2a2a' }}>
                                                <span style={{ fontSize: '18px' }}>🚪</span><span style={{ color: '#ee4d2d', fontWeight: 'bold' }}>Đăng xuất</span>
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