import { useState } from 'react';
import { userApi } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

function XIcon()    { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function EditIcon() { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon(){ return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function PlusIcon() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }

const EMPTY_FORM = { fullName: '', username: '', password: '', role: 'USER', active: true };

export default function UsersPage() {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll().then(r => r.data),
  });

  const [modal, setModal]       = useState(null); // null | 'create' | user-object
  const [deleteTarget, setDel]  = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  // ADMIN koruması
  if (me?.role !== 'ADMIN') {
    return (
      <div className="empty-state">
        <p>Bu sayfaya erişim yetkiniz yok.</p>
        <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => navigate('/')}>Ana Sayfaya Dön</button>
      </div>
    );
  }

  const openCreate = () => { setForm(EMPTY_FORM); setError(''); setModal('create'); };
  const openEdit   = (u)  => { setForm({ fullName: u.fullName, username: u.username, password: '', role: u.role, active: u.active }); setError(''); setModal(u); };
  const closeModal = ()   => { setModal(null); setError(''); };

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] });

  const handleSave = async () => {
    if (!form.fullName.trim()) { setError('Ad Soyad zorunludur.'); return; }
    if (!form.username.trim()) { setError('Kullanıcı adı zorunludur.'); return; }
    if (modal === 'create' && !form.password.trim()) { setError('Şifre zorunludur.'); return; }

    setSaving(true); setError('');
    try {
      if (modal === 'create') {
        await userApi.create(form);
      } else {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await userApi.update(modal.id, payload);
      }
      await invalidate();
      closeModal();
    } catch (e) {
      setError(e.response?.data?.error || 'Kaydedilemedi.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true); setError('');
    try {
      await userApi.delete(deleteTarget.id);
      await invalidate();
      setDel(null);
    } catch (e) {
      setError(e.response?.data?.error || 'Silinemedi.');
    } finally { setSaving(false); }
  };

  const roleBadge = (role) => (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: role === 'ADMIN' ? 'rgba(99,102,241,0.15)' : 'rgba(148,163,184,0.15)',
      color: role === 'ADMIN' ? '#818cf8' : 'var(--text-muted)',
    }}>{role === 'ADMIN' ? 'Yönetici' : 'Kullanıcı'}</span>
  );

  const activeBadge = (active) => (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: active ? 'rgba(52,201,122,0.12)' : 'rgba(248,113,113,0.12)',
      color: active ? '#34c97a' : '#f87171',
    }}>{active ? 'Aktif' : 'Pasif'}</span>
  );

  if (isLoading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Kullanıcı Yönetimi</div>
          <div className="page-subtitle">{users.length} kullanıcı</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <PlusIcon /> Yeni Kullanıcı
        </button>
      </div>

      {users.length === 0 ? (
        <div className="empty-state"><p>Henüz kullanıcı yok.</p></div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', gap: 12, padding: '8px 14px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            {[['180px','Ad Soyad'],['140px','Kullanıcı Adı'],['100px','Rol'],['80px','Durum'],['160px','Oluşturulma']].map(([w, label]) => (
              <span key={label} style={{ flex: `0 0 ${w}`, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>{label}</span>
            ))}
          </div>

          {users.map((u, i) => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none',
              background: u.id === me?.id ? 'var(--accent-dim)' : 'transparent',
            }}>
              <div style={{ flex: '0 0 180px' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{u.fullName}</div>
                {u.id === me?.id && <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 1 }}>sen</div>}
              </div>
              <div style={{ flex: '0 0 140px', fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{u.username}</div>
              <div style={{ flex: '0 0 100px' }}>{roleBadge(u.role)}</div>
              <div style={{ flex: '0 0 80px' }}>{activeBadge(u.active)}</div>
              <div style={{ flex: '0 0 160px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                {u.createdAt ? new Date(u.createdAt).toLocaleDateString('tr-TR') : '—'}
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                <button className="btn-icon" title="Düzenle" onClick={() => openEdit(u)} style={{ padding: 4 }}><EditIcon /></button>
                {u.id !== me?.id && (
                  <button className="btn-icon danger" title="Sil" onClick={() => { setDel(u); setError(''); }} style={{ padding: 4 }}><TrashIcon /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Oluştur / Düzenle Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal === 'create' ? 'Yeni Kullanıcı' : 'Kullanıcıyı Düzenle'}</div>
              <button className="btn-icon" onClick={closeModal}><XIcon /></button>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

            <div className="form-group">
              <label className="form-label">Ad Soyad</label>
              <input className="form-input" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Ad Soyad" />
            </div>
            <div className="form-group">
              <label className="form-label">Kullanıcı Adı</label>
              <input className="form-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="kullanici.adi" disabled={modal !== 'create'} style={{ opacity: modal !== 'create' ? 0.5 : 1 }} />
            </div>
            <div className="form-group">
              <label className="form-label">{modal === 'create' ? 'Şifre' : 'Yeni Şifre (boş bırakırsan değişmez)'}</label>
              <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder={modal === 'create' ? 'Şifre' : 'Değiştirmek için gir'} autoComplete="new-password" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Rol</label>
                <select className="form-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="USER">Kullanıcı</option>
                  <option value="ADMIN">Yönetici</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Durum</label>
                <select className="form-input" value={form.active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, active: e.target.value === 'true' }))}>
                  <option value="true">Aktif</option>
                  <option value="false">Pasif</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-ghost" onClick={closeModal}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sil Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDel(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Kullanıcıyı Sil</div>
              <button className="btn-icon" onClick={() => setDel(null)}><XIcon /></button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
              <strong>{deleteTarget.fullName}</strong> kullanıcısını silmek istediğinizden emin misiniz?
            </p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setDel(null)}>İptal</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
