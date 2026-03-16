import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

const Icons = {
  Users:    () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Award:    () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
  Folder:   () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  Calendar: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Box:      () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Building:  () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>,
  TrendUp:  () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  DollarSign: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Logout:   () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

function todayStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [today, setToday] = useState(todayStr());

  useEffect(() => {
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
    const timer = setTimeout(() => setToday(todayStr()), msUntilMidnight);
    return () => clearTimeout(timer);
  }, [today]);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>planUS</h1>
        <span>v1.0.0</span>
      </div>

      <div style={{ padding: '0 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>Tarih</div>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{today}</div>
      </div>

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

      <div className="sidebar-section">
        <div className="sidebar-section-label">Kaynak Yönetimi</div>
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

      {/* Kullanıcı bilgisi + çıkış */}
      <div style={{ marginTop: 'auto', padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '10px 10px', borderRadius: 8, background: 'var(--bg-hover)' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
            {user?.fullName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
            {user?.role === 'ADMIN' ? 'Yönetici' : 'Kullanıcı'}
          </div>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 8px', borderRadius: 6, cursor: 'pointer',
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-muted)', fontSize: 12, fontFamily: 'DM Sans, sans-serif',
            width: '100%',
          }}>
            <Icons.Logout /> Çıkış Yap
          </button>
        </div>
      </div>
    </aside>
  );
}
