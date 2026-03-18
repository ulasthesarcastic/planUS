import { useState, useEffect } from 'react';
import { projectTypeApi } from '../../services/api';

const EditIcon  = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;

export default function ProjectTypesPage() {
  const [types, setTypes]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(null);   // null | 'new' | {id, name}
  const [name, setName]         = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
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
    try {
      await projectTypeApi.delete(deleteId);
      setDeleteId(null); load();
    } catch (e) {
      setError(e.response?.data?.error || 'Silinemedi.');
      setDeleteId(null);
    } finally { setSaving(false); }
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

      {error && !editing && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Form */}
      {editing && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '16px 20px', marginBottom: 20,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
            {editing === 'new' ? 'Yeni Proje Tipi' : 'Proje Tipini Düzenle'}
          </div>
          {error && <div className="alert alert-error" style={{ marginBottom: 10 }}>{error}</div>}
          <div className="form-group">
            <label className="form-label">Tip Adı</label>
            <input
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="örn. Müşterili"
              autoFocus
            />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={cancel}>İptal</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      {types.length === 0 ? (
        <div className="empty-state"><p>Henüz proje tipi tanımlanmamış.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {types.map(t => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--bg-card)',
            }}>
              <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>{t.name}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn-icon" onClick={() => openEdit(t)} title="Düzenle"><EditIcon /></button>
                <button className="btn-icon danger" onClick={() => setDeleteId(t.id)} title="Sil"><TrashIcon /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Silme onayı */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Proje Tipini Sil</div>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '12px 0' }}>
              Bu proje tipini silmek istediğinize emin misiniz? Bu tipe atanmış projeler varsa silinemez.
            </p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>İptal</button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={saving}>
                {saving ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
