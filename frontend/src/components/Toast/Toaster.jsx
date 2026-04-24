import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { toastService } from '../../services/toastService';
import styles from './Toaster.module.css';

// ── Context (bileşenler içinden useToast() ile toast göstermek için) ──────────
const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

// ── İkonlar ──────────────────────────────────────────────────────────────────
function SuccessIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}
function ErrorIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="8" strokeLinecap="round" strokeWidth="3"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
    </svg>
  );
}
function WarningIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" strokeWidth="3"/>
    </svg>
  );
}

const ICONS = {
  success: <SuccessIcon />,
  error:   <ErrorIcon />,
  info:    <InfoIcon />,
  warning: <WarningIcon />,
};

// ── Tek toast kartı ───────────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 10);
    const t2 = setTimeout(() => setVisible(false), toast.duration - 300);
    const t3 = setTimeout(() => onRemove(toast.id), toast.duration);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [toast.id, toast.duration, onRemove]);

  const type = toast.type || 'info';

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
      className={[
        styles.toast,
        styles[`toast--${type}`],
        visible ? styles['toast--visible'] : styles['toast--hidden'],
      ].join(' ')}
    >
      <span className={`${styles.icon} ${styles[`icon--${type}`]}`}>
        {ICONS[type]}
      </span>
      <span className={styles.message}>{toast.msg}</span>
    </div>
  );
}

// ── Provider + Toaster ────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    setToasts(prev => [...prev.slice(-4), toast]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    toastService._register(addToast);
    return () => toastService._register(null);
  }, [addToast]);

  const api = {
    success: (msg, d)  => toastService.success(msg, d),
    error:   (msg, d)  => toastService.error(msg, d),
    info:    (msg, d)  => toastService.info(msg, d),
    warning: (msg, d)  => toastService.warning(msg, d),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.stack}>
        {toasts.map(t => (
          <div key={t.id} className={styles.item}>
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
