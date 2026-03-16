import { useState, useEffect } from 'react';
import { organizationApi } from '../../services/api';

const PlusIcon = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const EditIcon = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const ChevronIcon = ({ open }) => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><polyline points="9 18 15 12 9 6"/></svg>;

function UnitModal({ unit, units, onSave, onClose }) {
  const [name, setName] = useState(unit?.name || '');
  const [parentId, setParentId] = useState(unit?.parentId || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const roots = units.filter(u => !u.parentId);

  const handleSave = async () => {
    if (!name.trim()) return setError('Birim adı zorunludur.');
    setSaving(true);
    try {
      const data = { name: name.trim(), parentId: parentId || null };
      if (unit?.id) await organizationApi.update(unit.id, data);
      else await organizationApi.create(data);
      onSave();
    } catch (e) {
      setError(e.response?.data?.error || 'Bir hata oluştu.');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <div className="modal-title">{unit?.id ? 'Birimi Düzenle' : 'Yeni Birim'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
        <div className="form-group">
          <label className="form-label">Birim Adı</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Birim adı" autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Üst Birim <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(boş bırakılırsa 1. seviye olur)</span></label>
          <select className="form-input" value={parentId} onChange={e => setParentId(e.target.value)}>
            <option value="">— 1. Seviye Birim —</option>
            {roots.filter(r => r.id !== unit?.id).map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>İptal</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrganizationPage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [openUnits, setOpenUnits] = useState({});

  const load = async () => {
    const res = await organizationApi.getAll();
    setUnits(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const roots = units.filter(u => !u.parentId);
  const getChildren = (parentId) => units.filter(u => u.parentId === parentId);
  const toggleUnit = (id) => setOpenUnits(prev => ({ ...prev, [id]: !prev[id] }));

  const handleDelete = async (unit) => {
    try {
      await organizationApi.delete(unit.id);
      setDeleteConfirm(null);
      load();
    } catch (e) {
      setDeleteError(e.response?.data?.error || 'Silinemedi.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Organizasyon Yönetimi</div>
          <div className="page-subtitle">Birim hiyerarşisini tanımlayın</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          <PlusIcon /> Yeni Birim
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: '1. Seviye Birim', value: roots.length, color: 'var(--accent)' },
          { label: '2. Seviye Birim', value: units.filter(u => u.parentId).length, color: '#7c3aed' },
        ].map(c => (
          <div key={c.label} style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8, border: `1px solid ${c.color}33` }}>
            <div style={{ fontSize: 11, color: c.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color, fontFamily: 'DM Mono, monospace' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {loading ? <div className="loading">Yükleniyor...</div> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {roots.length === 0 ? (
            <div className="empty-state"><p>Henüz birim eklenmemiş.</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Birim</th>
                  <th>Seviye</th>
                  <th style={{ textAlign: 'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {roots.map(root => {
                  const children = getChildren(root.id);
                  const isOpen = openUnits[root.id] !== false;
                  return [
                    <tr key={root.id} style={{ background: 'var(--bg-hover)', cursor: children.length > 0 ? 'pointer' : 'default' }}
                      onClick={() => children.length > 0 && toggleUnit(root.id)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {children.length > 0 && <ChevronIcon open={isOpen} />}
                          {children.length === 0 && <span style={{ width: 14 }} />}
                          <span style={{ fontWeight: 700 }}>{root.name}</span>
                          {children.length > 0 && (
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--accent)22', color: 'var(--accent)', fontWeight: 600 }}>
                              {children.length} alt birim
                            </span>
                          )}
                        </div>
                      </td>
                      <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--accent)22', color: 'var(--accent)', fontWeight: 600 }}>1. Seviye</span></td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="actions-cell">
                          <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}
                            onClick={() => { setEditing({ parentId: root.id }); setModalOpen(true); }}>
                            <PlusIcon /> Alt Birim
                          </button>
                          <button className="btn-icon" onClick={() => { setEditing(root); setModalOpen(true); }}><EditIcon /></button>
                          <button className="btn-icon danger" onClick={() => { setDeleteError(''); setDeleteConfirm(root); }}><TrashIcon /></button>
                        </div>
                      </td>
                    </tr>,
                    ...(isOpen ? children.map(child => (
                      <tr key={child.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 30 }}>
                            <span style={{ fontWeight: 500 }}>{child.name}</span>
                          </div>
                        </td>
                        <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#7c3aed22', color: '#7c3aed', fontWeight: 600 }}>2. Seviye</span></td>
                        <td>
                          <div className="actions-cell">
                            <button className="btn-icon" onClick={() => { setEditing(child); setModalOpen(true); }}><EditIcon /></button>
                            <button className="btn-icon danger" onClick={() => { setDeleteError(''); setDeleteConfirm(child); }}><TrashIcon /></button>
                          </div>
                        </td>
                      </tr>
                    )) : [])
                  ];
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modalOpen && (
        <UnitModal unit={editing} units={units}
          onSave={() => { setModalOpen(false); load(); }}
          onClose={() => setModalOpen(false)} />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title" style={{ marginBottom: 8 }}>Birimi Sil</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
              <strong>{deleteConfirm.name}</strong> birimi silinecek.
            </p>
            {deleteError && <div className="alert alert-error" style={{ marginBottom: 12 }}>{deleteError}</div>}
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
