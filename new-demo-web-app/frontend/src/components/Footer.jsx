export default function Footer() {
    return (
        <footer style={{ background: '#f5f5f5', padding: '40px 0', borderTop: '1px solid #e5e5e5', marginTop: 'auto' }}>
            {/* THÊM alignItems: 'flex-start' ĐỂ ÉP CÁC CỘT BẰNG NHAU TRÊN CÙNG */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '30px', padding: '0 20px', flexWrap: 'wrap' }}>
                
                <div style={{ flex: 1, minWidth: '200px' }}>
                    {/* SET CHUẨN MARGIN 0 0 20px 0 */}
                    <h4 style={{ color: '#333', fontSize: '14px', fontWeight: 'bold', margin: '0 0 20px 0' }}>Công ty</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px', color: '#007bff' }}>
                        <span style={{ cursor: 'pointer' }}>Giới thiệu</span>
                        <span style={{ cursor: 'pointer' }}>Trung tâm Trợ giúp</span>
                        <span style={{ cursor: 'pointer' }}>Quy chế</span>
                        <span style={{ cursor: 'pointer' }}>Bảo mật thông tin</span>
                        <span style={{ cursor: 'pointer' }}>Giải quyết khiếu nại</span>
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                    {/* SET CHUẨN MARGIN 0 0 20px 0 */}
                    <h4 style={{ color: '#333', fontSize: '14px', fontWeight: 'bold', margin: '0 0 20px 0' }}>Ứng dụng M-Bite</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ background: '#000', color: '#fff', padding: '8px 15px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', width: 'fit-content' }}>
                            <span style={{ fontSize: '20px' }}></span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
                                <span style={{ fontSize: '10px' }}>Download on the</span>
                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>App Store</span>
                            </div>
                        </div>
                        <div style={{ background: '#000', color: '#fff', padding: '8px 15px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', width: 'fit-content' }}>
                            <span style={{ fontSize: '20px' }}>▶</span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
                                <span style={{ fontSize: '10px' }}>GET IT ON</span>
                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Google Play</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h1 style={{ color: '#ee4d2d', margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>M-Bite</h1>
                    <span style={{ color: '#999', fontSize: '12px', marginBottom: '15px' }}>© 2026 M-Bite</span>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ width: '30px', height: '30px', background: '#ccc', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>f</div>
                        <div style={{ width: '30px', height: '30px', background: '#ccc', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>in</div>
                    </div>
                </div>

                <div style={{ flex: 1.5, minWidth: '350px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', lineHeight: '1.8', fontSize: '12px' }}>
                    {/* SET CHUẨN MARGIN 0 0 20px 0 */}
                    <h4 style={{ color: '#333', fontSize: '14px', fontWeight: 'bold', margin: '0 0 20px 0' }}>Địa chỉ công ty</h4>
                    <span>Công Ty Cổ Phần MFoodie (Chi nhánh Hà Nội)</span>
                    <span>Tầng 5, Tòa nhà MHandSo Mevl,</span>
                    <span>số 29 Liễu Giai, phường Ngọc Khánh, quận Ba Đình, Hà Nội</span>
                    <span>Điện thoại liên hệ: 024 03163139</span>
                    <span>Email: <a href="mailto:hotro@support.m-bite.com" style={{ color: '#007bff', textDecoration: 'none' }}>hotro@support.m-bite.com</a></span>
                </div>
                
            </div>
        </footer>
    );
}