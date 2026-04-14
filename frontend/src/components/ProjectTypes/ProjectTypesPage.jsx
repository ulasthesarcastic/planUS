import { useState, useEffect } from 'react';
import { projectTypeApi } from '../../services/api';

function XIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function EditIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }

export default function ProjectTypesPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | {id, name}
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const load = () => projectTypeApi.getAll().then(r => { setTypes(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const openNew  = () => { setEditing('new'); setName(''); setError(''); };
  const openEdit = (t) => { setEditing(t); setName(t.name); setError(''); };
  const cancel   = () => { setEditing(null); setName(''); setError(''); };

  const save = async () => {
    if (!name.trim()) { setError('Ad zorunludur.'); return; }
    setSaving(true); setError('');
    try {
      if (editing === 'new') await projectTypeApi.create({ name: name.trim() });
      else await projectTypeApi.update(editing.id, { name: name.trim() });
      cancel(); load();
    } catch (e) {
      setError(e.response?.data?.error || 'Bir hata oluştu.');
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    setSaving(true);
    try { await projectTypeApi.delete(deleteId); setDeleteId(null); load(); }
    catch (e) { setError(e.response?.data?.error || 'Silinemedi.'); setDeleteId(null); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Proje Tipleri</div>
          <div className="page-subtitle">{types.length} tip tanımlı</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Yeni Tip</button>
      </div>

      {error && !editing && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</div>
      )}

      {editing && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
            {editing === 'new' ? 'Yeni Proje Tipi' : 'Proje Tipini Düzenle'}
          </div>
          {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <input
            className="form-input" value={name} onChange={e => setName(e.target.value)}
            placeholder="örn. Müşterili" autoFocus
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
            style={{ marginBottom: 14 }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={cancel}>İptal</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
          </div>
        </div>
      )}

      {types.length === 0 ? (
        <div className="empty-state"><p>Henüz proje tipi tanımlanmamış.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {types.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 14 }}>{t.name}</span>
              <div className="actions-cell">
                <button className="btn-icon" onClick={() => openEdit(t)}><EditIcon /></button>
                <button className="btn-icon danger" onClick={() => setDeleteId(t.id)}><TrashIcon /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title">Proje Tipini Sil</div>
              <button className="btn-icon" onClick={() => setDeleteId(null)}><XIcon /></button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>Bu proje tipini silmek istediğinize emin misiniz? Bu tipe atanmış projeler varsa silinemez.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>İptal</button>
              <button className="btn" style={{ background: 'var(--danger)', color: '#fff' }} onClick={confirmDelete} disabled={saving}>{saving ? 'Siliniyor...' : 'Sil'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
