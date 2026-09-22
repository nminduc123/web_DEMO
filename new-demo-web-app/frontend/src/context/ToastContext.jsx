import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon, InfoIcon, XIcon } from '../components/Icons';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message, type = 'info', duration = 3500) => {
        const id = Date.now() + Math.random().toString(36).substring(2, 9);
        const newToast = { id, message, type };
        
        setToasts((prev) => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
        return id;
    }, [removeToast]);

    // Ghi đè window.alert để triệt tiêu vĩnh viễn popup alert mặc định của trình duyệt
    useEffect(() => {
        const originalAlert = window.alert;
        window.alert = (msg) => {
            showToast(typeof msg === 'object' ? JSON.stringify(msg) : String(msg), 'info');
        };
        return () => {
            window.alert = originalAlert;
        };
    }, [showToast]);

    const getToastStyle = (type) => {
        switch (type) {
            case 'success':
                return {
                    borderColor: '#28a745',
                    icon: <CheckCircleIcon size={20} color="#28a745" />,
                    titleColor: '#28a745',
                    bgGradient: 'linear-gradient(135deg, #1f2d22 0%, #171f19 100%)'
                };
            case 'error':
                return {
                    borderColor: '#ff4d4f',
                    icon: <XCircleIcon size={20} color="#ff4d4f" />,
                    titleColor: '#ff4d4f',
                    bgGradient: 'linear-gradient(135deg, #331c1e 0%, #201315 100%)'
                };
            case 'warning':
                return {
                    borderColor: '#fa8c16',
                    icon: <AlertTriangleIcon size={20} color="#fa8c16" />,
                    titleColor: '#fa8c16',
                    bgGradient: 'linear-gradient(135deg, #332717 0%, #1f1a12 100%)'
                };
            case 'info':
            default:
                return {
                    borderColor: '#ee4d2d',
                    icon: <InfoIcon size={20} color="#ee4d2d" />,
                    titleColor: '#ee4d2d',
                    bgGradient: 'linear-gradient(135deg, #2a201d 0%, #1c1918 100%)'
                };
        }
    };

    return (
        <ToastContext.Provider value={{ showToast, removeToast }}>
            {children}

            {/* Container chứa các Toast nổi */}
            <div style={{
                position: 'fixed',
                top: '24px',
                right: '24px',
                zIndex: 999999,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxWidth: '380px',
                width: 'calc(100% - 48px)',
                pointerEvents: 'none'
            }}>
                <style>
                    {`
                        @keyframes toastSlideIn {
                            from {
                                transform: translateX(120%);
                                opacity: 0;
                            }
                            to {
                                transform: translateX(0);
                                opacity: 1;
                            }
                        }
                    `}
                </style>

                {toasts.map((toast) => {
                    const style = getToastStyle(toast.type);
                    return (
                        <div
                            key={toast.id}
                            style={{
                                pointerEvents: 'auto',
                                background: style.bgGradient,
                                border: `1px solid ${style.borderColor}`,
                                borderLeft: `5px solid ${style.borderColor}`,
                                borderRadius: '8px',
                                padding: '14px 16px',
                                color: '#fff',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                                animation: 'toastSlideIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards',
                                fontFamily: 'Arial, sans-serif'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: '18px', flexShrink: 0 }}>{style.icon}</span>
                                <span style={{ fontSize: '14px', lineHeight: '1.4', wordBreak: 'break-word', color: '#eee' }}>
                                    {toast.message}
                                </span>
                            </div>

                            <button
                                onClick={() => removeToast(toast.id)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#888',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    lineHeight: 1,
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'color 0.2s'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
                                title="Đóng thông báo"
                            >
                                <XIcon size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        return {
            showToast: (msg) => console.log('[Toast fallback]:', msg),
            removeToast: () => {}
        };
    }
    return context;
}
