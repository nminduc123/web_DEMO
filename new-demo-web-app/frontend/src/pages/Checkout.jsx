import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export default function Checkout({ cart, updateQuantity, removeFromCart, clearCart, updateCartPrices, currentUser, addToCart }) {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [showQR, setShowQR] = useState(false);
    const [timeLeft, setTimeLeft] = useState(180); // 3 phút
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. State Ghi chú cho quán
    const [orderNote, setOrderNote] = useState('');

    // 2. State Voucher (Được tải động từ CSDL do Admin quản lý)
    const [availableVouchers, setAvailableVouchers] = useState([]);
    const [voucherCodeInput, setVoucherCodeInput] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState(null);

    // 3. State Món mua kèm (Upsell recommendations)
    const [recommendations, setRecommendations] = useState([]);
    const [loadingRecs, setLoadingRecs] = useState(false);

    // Lấy sellerId từ món đầu tiên trong giỏ
    const sellerId = cart[0]?.seller_id;

    // Tải các món ăn gợi ý mua kèm từ quán
    useEffect(() => {
        if (!sellerId && cart.length === 0) return;
        setLoadingRecs(true);
        fetch(`http://localhost:5000/api/recommendations?sellerId=${sellerId || ''}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.recommendations)) {
                    setRecommendations(data.recommendations);
                }
            })
            .catch(err => console.error("Lỗi lấy gợi ý món:", err))
            .finally(() => setLoadingRecs(false));
    }, [sellerId]);

    // Tải danh sách voucher đang phát hành từ CSDL (do Admin quản lý)
    useEffect(() => {
        fetch('http://localhost:5000/api/vouchers/active')
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.vouchers)) {
                    setAvailableVouchers(data.vouchers);
                }
            })
            .catch(err => console.error("Lỗi tải voucher:", err));
    }, []);

    // Lọc ra các món chưa có trong giỏ hàng
    const addOnItems = recommendations.filter(item => !cart.some(c => c.id === item.id) && !item.is_sold_out);

    // Tính toán tiền
    const subtotalPrice = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity || 1), 0);
    const baseShippingFee = 15000;

    // Tính toán mức giảm giá
    let discountAmount = 0;
    if (appliedVoucher) {
        const minOrder = Number(appliedVoucher.min_order) || 0;
        if (subtotalPrice >= minOrder) {
            if (appliedVoucher.discount_type === 'percent') {
                const rawDiscount = Math.round(subtotalPrice * (Number(appliedVoucher.discount_value) / 100));
                const maxD = Number(appliedVoucher.max_discount);
                discountAmount = maxD > 0 ? Math.min(rawDiscount, maxD) : rawDiscount;
            } else {
                discountAmount = Number(appliedVoucher.discount_value) || 0;
            }
        }
    }

    // Tự động hủy voucher nếu giỏ hàng giảm xuống dưới mức tối thiểu
    useEffect(() => {
        const minOrder = Number(appliedVoucher?.min_order) || 0;
        if (appliedVoucher && subtotalPrice < minOrder) {
            setAppliedVoucher(null);
            showToast(`Đơn hàng dưới ${minOrder.toLocaleString('vi-VN')}đ, voucher "${appliedVoucher.code}" đã tự động hủy.`, "warning");
        }
    }, [subtotalPrice, appliedVoucher]);

    const finalTotalPrice = Math.max(0, subtotalPrice + baseShippingFee - discountAmount);

    // Áp dụng voucher
    const handleApplyVoucher = (voucher) => {
        if (!voucher) return;
        const minOrder = Number(voucher.min_order) || 0;
        if (subtotalPrice < minOrder) {
            showToast(`Voucher "${voucher.code}" yêu cầu đơn hàng tối thiểu từ ${minOrder.toLocaleString('vi-VN')}đ!`, "warning");
            return;
        }
        setAppliedVoucher(voucher);
        setVoucherCodeInput(voucher.code);
        showToast(`🎉 Áp dụng mã "${voucher.code}" thành công!`, "success");
    };

    const handleRemoveVoucher = () => {
        setAppliedVoucher(null);
        setVoucherCodeInput('');
        showToast("Đã hủy áp dụng mã giảm giá.", "info");
    };

    const handleCustomVoucherSubmit = (e) => {
        e.preventDefault();
        const cleanCode = voucherCodeInput.trim().toUpperCase();
        if (!cleanCode) return;
        const found = availableVouchers.find(v => v.code === cleanCode);
        if (!found) {
            showToast("Mã voucher không tồn tại hoặc đã hết hạn!", "error");
            return;
        }
        handleApplyVoucher(found);
    };

    // Thêm món gợi ý mua kèm vào giỏ hàng
    const handleAddRecommendation = (item) => {
        if (addToCart) {
            addToCart(item, { shop_name: item.shop_name || cart[0]?.shopName });
            showToast(`✅ Đã thêm "${item.name}" vào giỏ hàng!`, "success");
        }
    };

    // Kiểm tra giá tiền và trạng thái món thời gian thực từ CSDL
    const verifyCartPrices = async () => {
        if (cart.length === 0) return true;
        try {
            const res = await fetch('http://localhost:5000/api/cart/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cart })
            });
            const data = await res.json();
            if (data.success) {
                let hasChange = false;

                // Xử lý các món bị xóa/hết hàng/quán nghỉ
                if (data.unavailableItems && data.unavailableItems.length > 0) {
                    hasChange = true;
                    data.unavailableItems.forEach(item => {
                        removeFromCart(item.id);
                        showToast(`⚠️ "${item.name}": ${item.reason}, đã tự động xóa khỏi giỏ!`, "warning", 5000);
                    });
                }

                // Xử lý các món bị Seller đổi giá
                if (data.changedItems && data.changedItems.length > 0) {
                    hasChange = true;
                    if (updateCartPrices) {
                        updateCartPrices(data.changedItems);
                    }
                    data.changedItems.forEach(item => {
                        showToast(
                            `⚠️ Món "${item.name}" vừa được quán cập nhật giá từ ${item.oldPrice.toLocaleString('vi-VN')}đ thành ${item.newPrice.toLocaleString('vi-VN')}đ!`,
                            "warning",
                            6000
                        );
                    });
                }

                return !hasChange;
            }
        } catch (e) {
            console.error("Lỗi kiểm tra giỏ hàng:", e);
        }
        return true;
    };

    // Kiểm tra giỏ hàng ngay khi vừa mở trang Checkout
    useEffect(() => {
        verifyCartPrices();
    }, []);

    // Đếm ngược 3 phút khi hiển thị mã QR chuyển khoản
    useEffect(() => {
        let timer;
        if (showQR && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (showQR && timeLeft === 0) {
            setShowQR(false);
            showToast("Mã QR đã hết hạn giao dịch, vui lòng thử lại!", "warning");
        }
        return () => clearInterval(timer);
    }, [showQR, timeLeft]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const triggerCheckout = async () => {
        if (!currentUser) {
            showToast("Vui lòng đăng nhập tài khoản trước khi đặt hàng!", "warning");
            navigate('/login');
            return;
        }

        if (cart.length === 0) {
            showToast("Giỏ hàng của bạn đang trống!", "warning");
            return;
        }

        // BẮT BUỘC KIỂM TRA LẠI GIÁ TRƯỚC KHI TẠO QR HOẶC CHỐT ĐƠN
        const isClean = await verifyCartPrices();
        if (!isClean) {
            showToast("Giá một số món ăn vừa được chủ quán thay đổi. Giỏ hàng đã cập nhật lại tổng tiền mới, vui lòng kiểm tra và xác nhận lại!", "info", 6000);
            return;
        }

        if (paymentMethod === 'COD') {
            handlePlaceOrder();
        } else {
            setTimeLeft(180);
            setShowQR(true);
        }
    };

    const handlePlaceOrder = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch('http://localhost:5000/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.id,
                    cart: cart,
                    paymentMethod: paymentMethod,
                    note: orderNote.trim(),
                    voucherCode: appliedVoucher ? appliedVoucher.code : null,
                    discountAmount: discountAmount
                })
            });
            const data = await res.json();

            if (data.success) {
                setShowQR(false);
                clearCart();
                showToast("🎉 Đặt hàng thành công! Quán đã nhận được đơn và đang chuẩn bị món.", "success", 5000);
                navigate('/');
            } else {
                if (data.priceChanged) {
                    if (data.changedItems && updateCartPrices) {
                        updateCartPrices(data.changedItems);
                    }
                    setShowQR(false);
                    showToast("⚠️ Giá món ăn đã thay đổi! Giỏ hàng đã được cập nhật giá mới nhất từ quán, vui lòng xác nhận lại đơn.", "warning", 6000);
                    return;
                }

                showToast(data.message || "Đặt hàng thất bại!", "error");
                if (data.invalidIds && Array.isArray(data.invalidIds)) {
                    data.invalidIds.forEach(id => removeFromCart(id));
                }
            }
        } catch (error) {
            console.error("Lỗi đặt hàng:", error);
            showToast("Lỗi kết nối máy chủ khi tạo đơn hàng!", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px', color: '#fff', textAlign: 'center' }}>
                <div style={{ padding: '60px 30px', background: '#222', borderRadius: '8px', border: '1px solid #333' }}>
                    <div style={{ fontSize: '50px', marginBottom: '15px' }}>🛒</div>
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '22px' }}>Giỏ hàng của bạn đang trống</h2>
                    <p style={{ color: '#888', marginBottom: '25px', fontSize: '14px' }}>
                        Hãy quay lại danh sách quán để chọn những món ăn thơm ngon nhé!
                    </p>
                    <button
                        onClick={() => navigate('/')}
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
                        Khám phá món ăn ngay
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '920px', margin: '0 auto', padding: '30px 20px', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
                <h1 style={{ margin: 0, fontSize: '24px' }}>
                    🛍️ Giỏ Hàng Của Bạn ({cart.reduce((sum, item) => sum + (item.quantity || 1), 0)} món)
                </h1>
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
                    ← Chọn thêm món khác
                </button>
            </div>

            {/* ĐỊA CHỈ NHẬN HÀNG CỦA BUYER */}
            <div style={{
                background: '#222',
                padding: '16px 20px',
                borderRadius: '8px',
                border: '1px solid #333',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '240px' }}>
                    <span style={{ fontSize: '24px' }}>📍</span>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                            Địa chỉ giao hàng: {currentUser?.full_name ? <span style={{ color: '#ee4d2d' }}>{currentUser.full_name} ({currentUser.phone || 'Chưa có SĐT'})</span> : (currentUser?.email || '')}
                        </div>
                        <div style={{ fontSize: '13px', color: currentUser?.address ? '#ccc' : '#888', marginTop: '3px' }}>
                            {currentUser?.address || 'Bạn chưa thiết lập địa chỉ nhận hàng mặc định.'}
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/profile?tab=info')}
                    style={{
                        background: '#333',
                        color: '#fff',
                        border: '1px solid #555',
                        padding: '7px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#ee4d2d'; e.currentTarget.style.borderColor = '#ee4d2d'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#333'; e.currentTarget.style.borderColor = '#555'; }}
                >
                    {currentUser?.address ? '✏️ Đổi địa chỉ' : '➕ Thêm địa chỉ'}
                </button>
            </div>

            {/* DANH SÁCH CÁC MÓN TRONG GIỎ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
                {cart.map((item) => (
                    <div
                        key={item.id}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#222',
                            padding: '16px 20px',
                            borderRadius: '8px',
                            border: '1px solid #333',
                            flexWrap: 'wrap',
                            gap: '15px'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, minWidth: '220px' }}>
                            <img
                                src={item.img || "https://images.unsplash.com/photo-1504674900247-0877df9cc836"}
                                alt={item.name}
                                style={{ width: '70px', height: '70px', borderRadius: '6px', objectFit: 'cover' }}
                            />
                            <div>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#fff' }}>{item.name}</h3>
                                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#aaa' }}>
                                    Quán: <strong style={{ color: '#ee4d2d' }}>{item.shopName || 'Quán ăn'}</strong>
                                </p>
                                <p style={{ margin: 0, fontSize: '14px', color: '#ee4d2d', fontWeight: 'bold' }}>
                                    Đơn giá: {Number(item.price).toLocaleString('vi-VN')}đ
                                </p>
                            </div>
                        </div>

                        {/* BỘ CHỌN SỐ LƯỢNG */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                                onClick={() => updateQuantity(item.id, -1)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '4px',
                                    border: '1px solid #555',
                                    background: '#333',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}
                            >
                                -
                            </button>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', minWidth: '24px', textAlign: 'center' }}>
                                {item.quantity || 1}
                            </span>
                            <button
                                onClick={() => updateQuantity(item.id, 1)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '4px',
                                    border: '1px solid #555',
                                    background: '#333',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}
                            >
                                +
                            </button>
                        </div>

                        {/* THÀNH TIỀN & XÓA */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', minWidth: '90px', textAlign: 'right' }}>
                                {(Number(item.price) * (item.quantity || 1)).toLocaleString('vi-VN')}đ
                            </span>
                            <button
                                onClick={() => removeFromCart(item.id)}
                                style={{
                                    background: '#ff4d4f22',
                                    color: '#ff4d4f',
                                    border: '1px solid #ff4d4f',
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                }}
                            >
                                🗑️ Xóa
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ========================================================= */}
            {/* KHU VỰC: CÁC MÓN HAY ĐƯỢC ĐẶT THÊM (UPSELL / MUA KÈM) */}
            {/* ========================================================= */}
            {addOnItems.length > 0 && (
                <div style={{
                    background: '#222',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    padding: '20px',
                    marginBottom: '25px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                🔥 Món thường được đặt kèm (Gợi ý cho bạn)
                            </h3>
                            <span style={{ fontSize: '12px', color: '#888' }}>
                                Khách hàng thường gọi thêm đồ uống hoặc món kèm này khi đặt tại quán
                            </span>
                        </div>
                        <span style={{ fontSize: '11px', background: '#ee4d2d22', color: '#ee4d2d', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                            MUA KÈM GIÁ TỐT
                        </span>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '12px'
                    }}>
                        {addOnItems.slice(0, 4).map(food => (
                            <div
                                key={food.id}
                                style={{
                                    background: '#1c1c1c',
                                    borderRadius: '6px',
                                    border: '1px solid #383838',
                                    padding: '10px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    transition: 'border-color 0.2s'
                                }}
                            >
                                <img
                                    src={food.img || "https://images.unsplash.com/photo-1504674900247-0877df9cc836"}
                                    alt={food.name}
                                    style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }}
                                />
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {food.name}
                                    </h4>
                                    <p style={{ margin: '0 0 10px 0', color: '#ee4d2d', fontWeight: 'bold', fontSize: '14px' }}>
                                        {Number(food.price).toLocaleString('vi-VN')}đ
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleAddRecommendation(food)}
                                    style={{
                                        width: '100%',
                                        padding: '7px',
                                        background: '#333',
                                        color: '#fff',
                                        border: '1px solid #555',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = '#ee4d2d';
                                        e.currentTarget.style.borderColor = '#ee4d2d';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = '#333';
                                        e.currentTarget.style.borderColor = '#555';
                                    }}
                                >
                                    ➕ Thêm vào giỏ
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* KHU VỰC: GHI CHÚ CHO QUÁN (NOTE) */}
            {/* ========================================================= */}
            <div style={{ background: '#222', padding: '20px', borderRadius: '8px', border: '1px solid #333', marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📝 Ghi chú cho quán:
                    </h3>
                    <span style={{ fontSize: '12px', color: '#888' }}>
                        {orderNote.length}/200 ký tự
                    </span>
                </div>
                <textarea
                    rows="2"
                    maxLength={200}
                    placeholder="Ví dụ: Không lấy hành, cho ít cay, thêm tương ớt, để ở cửa lễ tân..."
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#1a1a1a',
                        border: '1px solid #444',
                        color: '#fff',
                        borderRadius: '6px',
                        padding: '12px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: 'inherit'
                    }}
                />
            </div>

            {/* ========================================================= */}
            {/* KHU VỰC: MÃ GIẢM GIÁ / VOUCHER M-BITE */}
            {/* ========================================================= */}
            <div style={{ background: '#222', padding: '20px', borderRadius: '8px', border: '1px solid #333', marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🎟️ Mã Giảm Giá / Voucher M-Bite
                    </h3>
                    {appliedVoucher && (
                        <span style={{ fontSize: '12px', color: '#52c41a', background: '#52c41a22', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                            ✓ Đang áp dụng {appliedVoucher.code} (-{discountAmount.toLocaleString('vi-VN')}đ)
                        </span>
                    )}
                </div>

                {/* Form nhập mã tùy chỉnh */}
                <form onSubmit={handleCustomVoucherSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                    <input
                        type="text"
                        placeholder="Nhập mã voucher (VD: MBITE10, FREESHIP...)"
                        value={voucherCodeInput}
                        onChange={(e) => setVoucherCodeInput(e.target.value)}
                        style={{
                            flex: 1,
                            background: '#1a1a1a',
                            border: '1px solid #444',
                            borderRadius: '6px',
                            padding: '10px 14px',
                            color: '#fff',
                            fontSize: '14px',
                            textTransform: 'uppercase'
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            padding: '10px 20px',
                            background: '#ee4d2d',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }}
                    >
                        Áp Dụng
                    </button>
                    {appliedVoucher && (
                        <button
                            type="button"
                            onClick={handleRemoveVoucher}
                            style={{
                                padding: '10px 15px',
                                background: '#333',
                                color: '#ff4d4f',
                                border: '1px solid #ff4d4f55',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px'
                            }}
                        >
                            Hủy mã
                        </button>
                    )}
                </form>

                {/* Danh sách thẻ Voucher bấm chọn nhanh */}
                {availableVouchers.length === 0 ? (
                    <div style={{ fontSize: '13px', color: '#888', fontStyle: 'italic', textAlign: 'center', padding: '15px' }}>
                        Hiện tại chưa có mã giảm giá nào được phát hành.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        {availableVouchers.map(v => {
                            const isSelected = appliedVoucher?.code === v.code;
                            const minOrder = Number(v.min_order) || 0;
                            const isEligible = subtotalPrice >= minOrder;

                            return (
                                <div
                                    key={v.code}
                                    style={{
                                        background: isSelected ? '#33201a' : '#1c1c1c',
                                        border: isSelected ? '1px solid #ee4d2d' : '1px solid #383838',
                                        borderRadius: '6px',
                                        padding: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        opacity: isEligible ? 1 : 0.6,
                                        position: 'relative'
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ee4d2d', background: '#ee4d2d22', padding: '2px 6px', borderRadius: '3px' }}>
                                                {v.code}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#52c41a', fontWeight: 'bold', background: '#52c41a22', padding: '2px 6px', borderRadius: '3px' }}>
                                                {v.discount_type === 'percent' ? `-${v.discount_value}%` : `-${Number(v.discount_value).toLocaleString('vi-VN')}đ`}
                                            </span>
                                        </div>
                                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>
                                            {v.name}
                                        </p>
                                        <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#888', lineHeight: '1.4' }}>
                                            {v.description || (minOrder > 0 ? `Đơn từ ${minOrder.toLocaleString('vi-VN')}đ` : 'Áp dụng mọi đơn hàng')}
                                        </p>
                                    </div>

                                    <div>
                                        {isSelected ? (
                                            <button
                                                type="button"
                                                onClick={handleRemoveVoucher}
                                                style={{
                                                    width: '100%',
                                                    padding: '6px',
                                                    background: '#28a745',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                ✓ Đang dùng (Bấm để hủy)
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleApplyVoucher(v)}
                                                disabled={!isEligible}
                                                style={{
                                                    width: '100%',
                                                    padding: '6px',
                                                    background: isEligible ? '#333' : '#222',
                                                    color: isEligible ? '#fff' : '#666',
                                                    border: isEligible ? '1px solid #555' : '1px solid #333',
                                                    borderRadius: '4px',
                                                    cursor: isEligible ? 'pointer' : 'not-allowed',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {isEligible ? 'Dùng ngay' : `Thiếu ${(minOrder - subtotalPrice).toLocaleString('vi-VN')}đ`}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* CHỌN PHƯƠNG THỨC THANH TOÁN */}
            <div style={{ background: '#222', padding: '20px', borderRadius: '8px', border: '1px solid #333', marginBottom: '25px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#fff' }}>
                    💳 Phương thức thanh toán:
                </h3>
                <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                        <input
                            type="radio"
                            name="payment"
                            value="COD"
                            checked={paymentMethod === 'COD'}
                            onChange={() => setPaymentMethod('COD')}
                            style={{ accentColor: '#ee4d2d', transform: 'scale(1.2)' }}
                        />
                        💵 Tiền mặt khi nhận hàng (COD)
                    </label>

                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                        <input
                            type="radio"
                            name="payment"
                            value="CK"
                            checked={paymentMethod === 'CK'}
                            onChange={() => setPaymentMethod('CK')}
                            style={{ accentColor: '#ee4d2d', transform: 'scale(1.2)' }}
                        />
                        📱 Chuyển khoản QR ngân hàng (VietQR)
                    </label>
                </div>
            </div>

            {/* BẢNG TỔNG KẾT TIỀN VÀ NÚT ĐẶT HÀNG */}
            <div style={{
                background: '#1c1c1c',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '22px 25px',
                marginBottom: '40px'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#aaa' }}>
                        <span>Tạm tính món ăn:</span>
                        <span style={{ color: '#fff' }}>{subtotalPrice.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#aaa' }}>
                        <span>Phí giao hàng tiêu chuẩn:</span>
                        <span style={{ color: '#fff' }}>{baseShippingFee.toLocaleString('vi-VN')}đ</span>
                    </div>
                    {discountAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#52c41a', fontWeight: 'bold' }}>
                            <span>Giảm giá Voucher ({appliedVoucher?.code}):</span>
                            <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <span style={{ fontSize: '14px', color: '#888' }}>Tổng thanh toán:</span>
                        <h2 style={{ margin: '4px 0 0 0', color: '#ee4d2d', fontSize: '28px' }}>
                            {finalTotalPrice.toLocaleString('vi-VN')}đ
                        </h2>
                    </div>

                    <button
                        onClick={triggerCheckout}
                        disabled={isSubmitting}
                        style={{
                            padding: '14px 36px',
                            background: isSubmitting ? '#555' : '#ee4d2d',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            boxShadow: '0 4px 15px rgba(238, 77, 45, 0.4)',
                            transition: 'background 0.2s'
                        }}
                    >
                        {isSubmitting ? 'Đang xử lý...' : 'Tiến Hành Đặt Hàng ➔'}
                    </button>
                </div>
            </div>

            {/* POPUP HIỂN THỊ MÃ QR KHI CHỌN CHUYỂN KHOẢN */}
            {showQR && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#222',
                        padding: '30px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        maxWidth: '380px',
                        width: '90%',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                        border: '1px solid #444'
                    }}>
                        <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '20px' }}>Quét mã để thanh toán</h3>
                        
                        <p style={{ color: '#ee4d2d', fontWeight: 'bold', fontSize: '22px', margin: '8px 0' }}>
                            ⏳ {formatTime(timeLeft)}
                        </p>
                        
                        <p style={{ fontSize: '13px', color: '#aaa', margin: '0 0 15px 0' }}>
                            Mở ứng dụng Ngân hàng hoặc Ví điện tử để quét mã QR bên dưới:
                        </p>

                        <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', display: 'inline-block' }}>
                            <img
                                src={`https://img.vietqr.io/image/vietcombank-1111111111-compact.png?amount=${finalTotalPrice}&addInfo=MBite%20Dat%20Mon`}
                                alt="Mã VietQR"
                                style={{ width: '230px', height: '230px', display: 'block' }}
                            />
                        </div>

                        <p style={{ margin: '15px 0', fontSize: '15px', color: '#ee4d2d', fontWeight: 'bold' }}>
                            Số tiền: {finalTotalPrice.toLocaleString('vi-VN')}đ
                        </p>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowQR(false)}
                                style={{ flex: 1, padding: '10px', background: '#333', color: '#ccc', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
                            >
                                Hủy
                            </button>
                            
                            <button
                                onClick={handlePlaceOrder}
                                disabled={isSubmitting}
                                style={{ flex: 1.5, padding: '10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                            >
                                {isSubmitting ? 'Đang gửi...' : '✅ Đã Chuyển Tiền'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
