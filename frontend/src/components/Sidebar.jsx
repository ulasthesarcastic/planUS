import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import logo from '../assets/logo.png';

const Icons = {
  Users:    () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Award:    () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
  Folder:   () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  Calendar: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Box:      () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Building: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>,
  TrendUp:  () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  DollarSign: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Settings: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Back:     () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
};

const SETTINGS_ROUTES = ['/seniorities', '/personnel', '/organization'];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const inSettings = SETTINGS_ROUTES.includes(location.pathname);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" style={{ paddingBottom: 20, borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
        <Link to="/projects" style={{ display: 'block' }}>
          <img src={logo} alt="planUS" style={{ width: '100%', maxWidth: 180, height: 'auto', display: 'block' }} />
        </Link>
      </div>

      {inSettings ? (
        /* ── Ayarlar modu: sadece ayarlar maddeleri ── */
        <div className="sidebar-section">
          <button
            onClick={() => navigate('/projects')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '7px 10px', marginBottom: 6,
              borderRadius: 7, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-muted)',
              fontSize: 12, fontFamily: 'DM Sans, sans-serif',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Icons.Back /> Geri Dön
          </button>
          <div className="sidebar-section-label">Ayarlar</div>
          <NavLink to="/seniorities" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icons.Award /> Kıdem Yönetimi
          </NavLink>
          <NavLink to="/personnel" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icons.Users /> Personel Yönetimi
          </NavLink>
          <NavLink to="/organization" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icons.Building /> Organizasyon Yönetimi
          </NavLink>
        </div>
      ) : (
        /* ── Normal mod: ana bölümler + ayarlar başlığı ── */
        <>
          <div className="sidebar-section">
            <div className="sidebar-section-label">Projeler</div>
            <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icons.Folder /> Proje Yönetimi
            </NavLink>
            <NavLink to="/planning" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icons.Calendar /> Proje Planlama
            </NavLink>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-label">Ürünler</div>
            <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icons.Box /> Ürün Yönetimi
            </NavLink>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-label">Finans</div>
            <NavLink to="/sales" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icons.DollarSign /> Potansiyel Satışlar
            </NavLink>
            <NavLink to="/budget" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icons.TrendUp /> Bütçe Yönetimi
            </NavLink>
          </div>

          <div className="sidebar-section" style={{ marginTop: 'auto' }}>
            <button
              onClick={() => navigate('/seniorities')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '7px 10px',
                borderRadius: 7, border: 'none', cursor: 'pointer',
                background: 'transparent', color: 'var(--text-muted)',
                fontSize: 12, fontFamily: 'DM Sans, sans-serif',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Icons.Settings /> Ayarlar
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
