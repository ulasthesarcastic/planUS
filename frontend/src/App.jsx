import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { useState, useEffect, useRef } from 'react';
import LoginPage from './auth/LoginPage';
import Sidebar from './components/Sidebar';
import SenioritiesPage from './components/Seniority/SenioritiesPage';
import PersonnelPage from './components/Personnel/PersonnelPage';
import ProjectsPage from './components/Projects/ProjectsPage';
import ProductsPage from './components/Products/ProductsPage';
import OrganizationPage from './components/Organization/OrganizationPage';
import SalesPage from './components/Sales/SalesPage';
import BudgetPage from './components/Budget/BudgetPage';
import ResourcePlanningPage from './components/ResourcePlanning/ResourcePlanningPage';
import PnLPage from './components/PnL/PnLPage';
import './styles/global.css';

function UserIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}
function SunIcon() {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
}
function MoonIcon() {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
}

function todayStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}

function TopBar({ user, logout, theme, toggleTheme }) {
  const [open, setOpen] = useState(false);
  const [today, setToday] = useState(todayStr());
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
    const timer = setTimeout(() => setToday(todayStr()), msUntilMidnight);
    return () => clearTimeout(timer);
  }, [today]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="topbar">
      {/* Tarih - sol */}
      <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Tarih</span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{today}</span>
      </div>
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
            background: open ? 'var(--bg-hover)' : 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)', fontSize: 13,
            fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#fff' }}>
            <UserIcon />
          </span>
          <span>{user?.fullName || 'Kullanıcı'}</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.6 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            minWidth: 180, background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)', padding: '6px',
            zIndex: 200,
          }}>
            <div style={{ padding: '8px 12px', marginBottom: 4, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {user?.role === 'ADMIN' ? 'Yönetici' : 'Kullanıcı'}
              </div>
            </div>
            <button
              onClick={() => { toggleTheme(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '9px 12px', borderRadius: 6, cursor: 'pointer',
                background: 'transparent', border: 'none',
                color: 'var(--text-primary)', fontSize: 13,
                fontFamily: 'DM Sans, sans-serif', textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />} {theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
            </button>
            <button
              onClick={() => { setOpen(false); navigate('/seniorities'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '9px 12px', borderRadius: 6, cursor: 'pointer',
                background: 'transparent', border: 'none',
                color: 'var(--text-primary)', fontSize: 13,
                fontFamily: 'DM Sans, sans-serif', textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <SettingsIcon /> Ayarlar
            </button>
            <button
              onClick={() => { setOpen(false); logout(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '9px 12px', borderRadius: 6, cursor: 'pointer',
                background: 'transparent', border: 'none',
                color: '#f87171', fontSize: 13,
                fontFamily: 'DM Sans, sans-serif', textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <LogoutIcon /> Çıkış Yap
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading, logout } = useAuth();

  const [theme, setTheme] = useState(() => {
    const key = user ? `theme_${user.username || 'default'}` : 'theme_default';
    return localStorage.getItem(key) || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const key = user ? `theme_${user.username || 'default'}` : 'theme_default';
    localStorage.setItem(key, theme);
  }, [theme, user]);

  // Apply saved theme when user changes (login/logout)
  useEffect(() => {
    const key = user ? `theme_${user.username || 'default'}` : 'theme_default';
    const saved = localStorage.getItem(key) || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    setTheme(saved);
  }, [user?.username]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-muted)', fontSize: 14 }}>
      Yükleniyor...
    </div>
  );

  if (!user) return <LoginPage />;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="content-wrapper">
        <TopBar user={user} logout={logout} theme={theme} toggleTheme={toggleTheme} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/seniorities" element={<SenioritiesPage />} />
            <Route path="/personnel" element={<PersonnelPage />} />
            <Route path="/organization" element={<OrganizationPage />} />
            <Route path="/resource-planning" element={<ResourcePlanningPage />} />
            <Route path="/pnl" element={<PnLPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/budget" element={<BudgetPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
