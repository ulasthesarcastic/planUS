import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import logo from '../assets/logo.png';

const Icons = {
  Users:    () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Award:    () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
  Folder:   () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  Box:      () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Building: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>,
  TrendUp:  () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  DollarSign: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Settings: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Back:     () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
  LogoIcon: () => (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <circle cx="15" cy="15" r="13" stroke="currentColor" strokeWidth="1.5"/>
      {/* 3×2 grid — bottom-left */}
      <rect x="6"  y="15" width="3" height="3" fill="currentColor"/>
      <rect x="10" y="15" width="3" height="3" fill="currentColor"/>
      <rect x="14" y="15" width="3" height="3" fill="currentColor"/>
      <rect x="6"  y="19" width="3" height="3" fill="currentColor"/>
      <rect x="10" y="19" width="3" height="3" fill="currentColor"/>
      <rect x="14" y="19" width="3" height="3" fill="currentColor"/>
      {/* rotated squares — upper-right */}
      <rect x="17.5" y="8"  width="2.8" height="2.8" fill="currentColor" transform="rotate(45 18.9 9.4)"/>
      <rect x="14"   y="6"  width="2.2" height="2.2" fill="currentColor" transform="rotate(45 15.1 7.1)"/>
    </svg>
  ),
  Grid:     () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
};

const SETTINGS_ROUTES = ['/seniorities', '/personnel', '/organization', '/project-types', '/project-categories'];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const collapseKey = user ? `sidebar_collapsed_${user.username}` : 'sidebar_collapsed';
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(collapseKey) === 'true');

  const inSettings = SETTINGS_ROUTES.includes(location.pathname);

  const toggleCollapse = () => {
    setCollapsed(c => {
      const next = !c;
      localStorage.setItem(collapseKey, String(next));
      return next;
    });
  };

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo area */}
      <div className="sidebar-logo" style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: 8 }}>
        <Link to="/projects" style={{ display: 'block', overflow: 'hidden', flex: 1, minWidth: 0 }}>
          {collapsed ? (
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-primary)' }}>
              <Icons.LogoIcon />
            </div>
          ) : (
            <img src={logo} alt="planUS" style={{ width: '100%', maxWidth: 180, height: 'auto', display: 'block' }} />
          )}
        </Link>
      </div>

      {/* Scrollable nav area */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {inSettings ? (
          <div className="sidebar-section">
            <button
              onClick={() => navigate('/projects')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, justifyContent: collapsed ? 'center' : 'flex-start',
                width: '100%', padding: collapsed ? '7px' : '7px 10px', marginBottom: 6,
                borderRadius: 7, border: 'none', cursor: 'pointer',
                background: 'transparent', color: 'var(--text-muted)',
                fontSize: 12, fontFamily: 'DM Sans, sans-serif',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Icons.Back />
              {!collapsed && <span>Geri Dön</span>}
            </button>
            {!collapsed && <div className="sidebar-section-label">Ayarlar</div>}
            {!collapsed && <div className="sidebar-section-label">Projeler</div>}
            <NavLink to="/project-types" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Proje Tipleri">
              <Icons.Folder />{!collapsed && <span className="nav-item-label">Proje Tipleri</span>}
            </NavLink>
            <NavLink to="/project-categories" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Proje Kategorileri">
              <Icons.Grid />{!collapsed && <span className="nav-item-label">Proje Kategorileri</span>}
            </NavLink>
            {!collapsed && <div className="sidebar-section-label" style={{ marginTop: 8 }}>Kaynaklar</div>}
            <NavLink to="/seniorities" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Kıdem Yönetimi">
              <Icons.Award />{!collapsed && <span className="nav-item-label">Kıdem Yönetimi</span>}
            </NavLink>
            <NavLink to="/personnel" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Personel Yönetimi">
              <Icons.Users />{!collapsed && <span className="nav-item-label">Personel Yönetimi</span>}
            </NavLink>
            <NavLink to="/organization" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Organizasyon Yönetimi">
              <Icons.Building />{!collapsed && <span className="nav-item-label">Organizasyon Yönetimi</span>}
            </NavLink>
          </div>
        ) : (
          <>
            <div className="sidebar-section">
              {!collapsed && <div className="sidebar-section-label">Projeler</div>}
              <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Proje Yönetimi">
                <Icons.Folder />{!collapsed && <span className="nav-item-label">Proje Yönetimi</span>}
              </NavLink>
            </div>

            <div className="sidebar-section">
              {!collapsed && <div className="sidebar-section-label">Ürünler</div>}
              <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Ürün Yönetimi">
                <Icons.Box />{!collapsed && <span className="nav-item-label">Ürün Yönetimi</span>}
              </NavLink>
            </div>

            <div className="sidebar-section">
              {!collapsed && <div className="sidebar-section-label">Kaynak Yönetimi</div>}
              <NavLink to="/resource-planning" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Kaynak Planlama">
                <Icons.Grid />{!collapsed && <span className="nav-item-label">Kaynak Planlama</span>}
              </NavLink>
            </div>

            <div className="sidebar-section">
              {!collapsed && <div className="sidebar-section-label">Finans</div>}
              <NavLink to="/pnl" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="P&L">
                <Icons.TrendUp />{!collapsed && <span className="nav-item-label">P&amp;L</span>}
              </NavLink>
              <NavLink to="/budget" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Bütçe Yönetimi">
                <Icons.DollarSign />{!collapsed && <span className="nav-item-label">Bütçe Yönetimi</span>}
              </NavLink>
              <NavLink to="/sales" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Potansiyel Projeler">
                <Icons.TrendUp />{!collapsed && <span className="nav-item-label">Potansiyel Projeler</span>}
              </NavLink>
              <NavLink to="/potansiyel-siparisler" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Potansiyel Siparişler">
                <Icons.Box />{!collapsed && <span className="nav-item-label">Potansiyel Siparişler</span>}
              </NavLink>
            </div>
          </>
        )}
      </div>

      {/* Ayarlar — only in normal mode, always at bottom */}
      {!inSettings && (
        <div className="sidebar-section" style={{ paddingTop: 4, paddingBottom: 4 }}>
          <button
            onClick={() => navigate('/seniorities')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, justifyContent: collapsed ? 'center' : 'flex-start',
              width: '100%', padding: collapsed ? '7px' : '7px 10px',
              borderRadius: 7, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-muted)',
              fontSize: 12, fontFamily: 'DM Sans, sans-serif',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="Ayarlar"
          >
            <Icons.Settings />{!collapsed && <span>Ayarlar</span>}
          </button>
        </div>
      )}

      {/* Collapse toggle — always at the very bottom */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={toggleCollapse}
          title={collapsed ? 'Genişlet' : 'Daralt'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
            width: '100%', padding: '9px 0',
            border: 'none', background: 'transparent',
            cursor: 'pointer', color: 'var(--text-muted)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {[0, 1, 2].map(i => (
            <svg key={i} width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
              style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}>
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          ))}
        </button>
      </div>
    </aside>
  );
}
