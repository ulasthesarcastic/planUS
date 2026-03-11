import { useState, useEffect } from 'react';
import { personnelApi, seniorityApi } from '../../services/api';

function EditIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function PersonnelModal({ personnel, seniorities, onSave, onClose }) {
  const isEdit = !!personnel;
  const [form, setForm] = useState({
    firstName: personnel?.firstName || '',
    lastName: personnel?.lastName || '',
    seniorityId: personnel?.seniorityId || (seniorities[0]?.id || ''),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.firstName.trim()) return setError('Ad zorunludur.');
    if (!form.lastName.trim()) return setError('Soyad zorunludur.');
    if (!form.seniorityId) return setError('Kıdem seçilmelidir.');
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await personnelApi.update(personnel.id, form);
      } else {
        await personnelApi.create(form);
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
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Personel Düzenle' : 'Yeni Personel'}</div>
          <button className="btn-icon" onClick={onClose}><XIcon /></button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Ad</label>
            <input className="form-input" placeholder="Ad"
              value={form.firstName}
              onChange={e => setForm({ ...form, firstName: e.target.value })}
              autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Soyad</label>
            <input className="form-input" placeholder="Soyad"
              value={form.lastName}
              onChange={e => setForm({ ...form, lastName: e.target.value })} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Kıdem</label>
          {seniorities.length === 0 ? (
            <div className="alert alert-error">Önce kıdem tanımlamanız gerekiyor.</div>
          ) : (
            <select className="form-select" value={form.seniorityId}
              onChange={e => setForm({ ...form, seniorityId: e.target.value })}>
              {seniorities.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>İptal</button>
          <button className="btn btn-primary" onClick={handleSave}
            disabled={saving || seniorities.length === 0}>
            {saving ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PersonnelPage() {
  const [personnel, setPersonnel] = useState([]);
  const [seniorities, setSeniorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = async () => {
    try {
      const [pRes, sRes] = await Promise.all([personnelApi.getAll(), seniorityApi.getAll()]);
      setPersonnel(pRes.data);
      setSeniorities(sRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getSeniorityName = (id) => seniorities.find(s => s.id === id)?.name || '—';

  const handleDelete = async (id) => {
    await personnelApi.delete(id);
    setDeleteConfirm(null);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Personel Yönetimi</div>
          <div className="page-subtitle">Proje personelini tanımlayın ve yönetin</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          <PlusIcon /> Yeni Personel
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : personnel.length === 0 ? (
          <div className="empty-state">
            <p>Henüz personel eklenmemiş.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Ad Soyad</th>
                  <th>Kıdem</th>
                  <th style={{ textAlign: 'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {personnel.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.firstName} {p.lastName}</td>
                    <td><span className="seniority-badge">{getSeniorityName(p.seniorityId)}</span></td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon" title="Düzenle"
                          onClick={() => { setEditing(p); setModalOpen(true); }}>
                          <EditIcon />
                        </button>
                        <button className="btn-icon danger" title="Sil"
                          onClick={() => setDeleteConfirm(p)}>
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <PersonnelModal
          personnel={editing}
          seniorities={seniorities}
          onSave={() => { setModalOpen(false); load(); }}
          onClose={() => setModalOpen(false)}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-title" style={{ marginBottom: 12 }}>Personeli Sil</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.firstName} {deleteConfirm.lastName}</strong> adlı personeli silmek istediğinizden emin misiniz?
            </p>
            <div className="form-actions" style={{ marginTop: 8, paddingTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>İptal</button>
              <button className="btn" style={{ background: 'var(--danger)', color: 'white' }}
                onClick={() => handleDelete(deleteConfirm.id)}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
