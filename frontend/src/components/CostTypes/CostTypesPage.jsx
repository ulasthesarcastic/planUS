import { useState } from 'react';
import { costTypeApi } from '../../services/api';
import { useCostTypes, useInvalidate } from '../../hooks/useQueries';
import { useToast } from '../Toast/Toaster';

function PlusIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function EditIcon() {
  return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function TrashIcon() {
  return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
}

function CostTypeModal({ initial, onSave, onClose }) {
  const [name, setName]     = useState(initial?.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError]         = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Ad boş olamaz.'); return; }
    setSaving(true);
    try {
      if (initial?.id) {
        await costTypeApi.update(initial.id, { name: name.trim() });
      } else {
        await costTypeApi.create({ name: name.trim() });
      }
      onSave();
    } catch (e) {
      setError(e.response?.data?.error || 'Bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 360 }}>
        <div className="modal-header">
          <div className="modal-title">{initial?.id ? 'Maliyet Tipini Düzenle' : 'Yeni Maliyet Tipi'}</div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <div className="form-group">
          <label className="form-label">Ad</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)}
            placeholder="ör. Personel, Malzeme, Seyahat..." autoFocus />
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>İptal</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CostTypesPage() {
  const { data: costTypes = [], isLoading } = useCostTypes();
  const invalidate = useInvalidate();
  const toast      = useToast();

  const [modal, setModal]         = useState(null); // null | {} | { id, name, ... }
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleSave = async () => {
    await invalidate.costTypes();
    toast.success(modal?.id ? 'Maliyet tipi güncellendi.' : 'Maliyet tipi oluşturuldu.');
    setModal(null);
  };

  const handleDelete = async (ct) => {
    try {
      await costTypeApi.delete(ct.id);
      await invalidate.costTypes();
      toast.success('Maliyet tipi silindi.');
    } catch {
      toast.error('Silinemedi. Maliyet verisi içeren tipler silinemez.');
    }
    setDeleteConfirm(null);
  };

  if (isLoading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Maliyet Tipleri</div>
          <div className="page-subtitle">{costTypes.length} tip tanımlı</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}>
          <PlusIcon /> Yeni Tip
        </button>
      </div>

      {costTypes.length === 0 ? (
        <div className="empty-state">
          <p>Henüz maliyet tipi yok. "Yeni Tip" ile ekleyin.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ad</th>
                <th style={{ width: 80 }} />
              </tr>
            </thead>
            <tbody>
              {costTypes.map((ct, i) => (
                <tr key={ct.id} style={{ borderBottom: i < costTypes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{ct.name}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn-icon" title="Düzenle" onClick={() => setModal(ct)}><EditIcon /></button>
                      <button className="btn-icon" title="Sil" style={{ color: '#f87171' }} onClick={() => setDeleteConfirm(ct)}><TrashIcon /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <CostTypeModal initial={modal} onSave={handleSave} onClose={() => setModal(null)} />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title" style={{ marginBottom: 8 }}>Tipi Sil</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
              <strong>{deleteConfirm.name}</strong> silinecek.
            </p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>İptal</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
