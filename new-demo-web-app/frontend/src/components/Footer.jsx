export default function Footer() {
    return (
        <footer style={{ background: '#181818', padding: '45px 0', borderTop: '1px solid #282828', marginTop: 'auto', color: '#aaa' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '30px', padding: '0 20px', flexWrap: 'wrap' }}>
                
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', margin: '0 0 20px 0' }}>Công ty</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#888' }}>
                        <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ee4d2d'} onMouseLeave={e => e.currentTarget.style.color = '#888'}>Giới thiệu</span>
                        <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ee4d2d'} onMouseLeave={e => e.currentTarget.style.color = '#888'}>Trung tâm Trợ giúp</span>
                        <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ee4d2d'} onMouseLeave={e => e.currentTarget.style.color = '#888'}>Quy chế</span>
                        <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ee4d2d'} onMouseLeave={e => e.currentTarget.style.color = '#888'}>Bảo mật thông tin</span>
                        <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ee4d2d'} onMouseLeave={e => e.currentTarget.style.color = '#888'}>Giải quyết khiếu nại</span>
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                    <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', margin: '0 0 20px 0' }}>Ứng dụng M-Bite</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ background: '#222', color: '#fff', border: '1px solid #383838', padding: '8px 15px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', width: 'fit-content' }}>
                            <span style={{ fontSize: '20px' }}></span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
                                <span style={{ fontSize: '10px', color: '#aaa' }}>Download on the</span>
                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>App Store</span>
                            </div>
                        </div>
                        <div style={{ background: '#222', color: '#fff', border: '1px solid #383838', padding: '8px 15px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', width: 'fit-content' }}>
                            <span style={{ fontSize: '20px' }}>▶</span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
                                <span style={{ fontSize: '10px', color: '#aaa' }}>GET IT ON</span>
                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Google Play</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h1 style={{ color: '#ee4d2d', margin: '0 0 10px 0', fontSize: '20px', fontWeight: 'bold' }}>M-Bite</h1>
                    <span style={{ color: '#666', fontSize: '12px', marginBottom: '15px' }}>© 2026 M-Bite</span>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ width: '32px', height: '32px', background: '#242424', border: '1px solid #383838', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#aaa', fontWeight: 'bold', cursor: 'pointer' }}>f</div>
                        <div style={{ width: '32px', height: '32px', background: '#242424', border: '1px solid #383838', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#aaa', fontWeight: 'bold', cursor: 'pointer' }}>in</div>
                    </div>
                </div>

                <div style={{ flex: 1.5, minWidth: '350px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', lineHeight: '1.8', fontSize: '12px', color: '#888' }}>
                    <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', margin: '0 0 20px 0' }}>Địa chỉ công ty</h4>
                    <span>Công Ty Cổ Phần MFoodie (Chi nhánh Hà Nội)</span>
                    <span>Tầng 5, Tòa nhà MHandSo Mevl,</span>
                    <span>số 29 Liễu Giai, phường Ngọc Khánh, quận Ba Đình, Hà Nội</span>
                    <span>Điện thoại liên hệ: 024 03163139</span>
                    <span>Email: <a href="mailto:hotro@support.m-bite.com" style={{ color: '#ee4d2d', textDecoration: 'none' }}>hotro@support.m-bite.com</a></span>
                </div>
                
            </div>
        </footer>
    );
}