import { useState, useEffect } from 'react';
import { organizationApi } from '../../services/api';

function XIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function EditIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function ChevronIcon({ open }) { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="9 18 15 12 9 6"/></svg>; }

function UnitModal({ unit, units, onSave, onClose }) {
  const [name, setName] = useState(unit?.name || '');
  const [parentId, setParentId] = useState(unit?.parentId ? String(unit.parentId) : '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const roots = units.filter(u => !u.parentId && u.id !== unit?.id);

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
          <button className="btn-icon" onClick={onClose}><XIcon /></button>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Birim Adı</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Birim adı" autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()} />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Üst Birim</label>
          <select className="form-select" value={parentId} onChange={e => setParentId(e.target.value)}>
            <option value="">— 1. Seviye Birim —</option>
            {roots.map(r => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
          </select>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Boş bırakılırsa 1. seviye olur</div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onClose}>İptal</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, error, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="btn-icon" onClick={onClose}><XIcon /></button>
        </div>
        {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>İptal</button>
          <button className="btn" style={{ background: 'var(--danger)', color: '#fff' }} onClick={onConfirm}>Sil</button>
        </div>
      </div>
    </div>
  );
}

const BADGE_STYLE = (color) => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
  color, background: color + '22', border: `1px solid ${color}44`,
});

export default function OrganizationPage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [openUnits, setOpenUnits] = useState({});

  const load = async () => { const res = await organizationApi.getAll(); setUnits(res.data); setLoading(false); };
  useEffect(() => { load(); }, []);

  const roots = units.filter(u => !u.parentId);
  const getChildren = (parentId) => units.filter(u => String(u.parentId) === String(parentId));
  const toggleUnit = (id) => setOpenUnits(prev => ({ ...prev, [id]: !prev[id] }));

  const handleDelete = async (unit) => {
    try { await organizationApi.delete(unit.id); setDeleteConfirm(null); load(); }
    catch (e) { setDeleteError(e.response?.data?.error || 'Silinemedi.'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Organizasyon Yönetimi</div>
          <div className="page-subtitle">Birim hiyerarşisini tanımlayın</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>+ Yeni Birim</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: '1. Seviye Birim', value: roots.length, color: '#60a5fa' },
          { label: '2. Seviye Birim', value: units.filter(u => u.parentId).length, color: '#a78bfa' },
        ].map(c => (
          <div key={c.label} style={{ flex: 1, padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: c.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {loading ? <div className="loading">Yükleniyor...</div> : (
        <div className="card">
          {roots.length === 0 ? <div className="empty-state"><p>Henüz birim eklenmemiş.</p></div> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Birim</th><th>Seviye</th><th style={{ textAlign: 'right' }}>İşlemler</th></tr></thead>
                <tbody>
                  {roots.map(root => {
                    const children = getChildren(root.id);
                    const isOpen = openUnits[root.id] !== false;
                    return [
                      <tr key={root.id} style={{ cursor: children.length > 0 ? 'pointer' : 'default' }} onClick={() => children.length > 0 && toggleUnit(root.id)}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ opacity: children.length > 0 ? 1 : 0 }}><ChevronIcon open={isOpen} /></span>
                            <span style={{ fontWeight: 700 }}>{root.name}</span>
                            {children.length > 0 && <span style={BADGE_STYLE('#60a5fa')}>{children.length} alt birim</span>}
                          </div>
                        </td>
                        <td><span style={BADGE_STYLE('#60a5fa')}>1. Seviye</span></td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="actions-cell">
                            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '3px 10px' }}
                              onClick={() => { setEditing({ parentId: root.id }); setModalOpen(true); }}>+ Alt Birim</button>
                            <button className="btn-icon" onClick={() => { setEditing(root); setModalOpen(true); }}><EditIcon /></button>
                            <button className="btn-icon danger" onClick={() => { setDeleteError(''); setDeleteConfirm(root); }}><TrashIcon /></button>
                          </div>
                        </td>
                      </tr>,
                      ...(isOpen ? children.map(child => (
                        <tr key={child.id}>
                          <td><div style={{ paddingLeft: 36, fontWeight: 500 }}>{child.name}</div></td>
                          <td><span style={BADGE_STYLE('#a78bfa')}>2. Seviye</span></td>
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
            </div>
          )}
        </div>
      )}

      {modalOpen && <UnitModal unit={editing} units={units} onSave={() => { setModalOpen(false); load(); }} onClose={() => setModalOpen(false)} />}
      {deleteConfirm && (
        <ConfirmModal
          title="Birimi Sil"
          message={`"${deleteConfirm.name}" birimi silinecek.`}
          error={deleteError}
          onConfirm={() => handleDelete(deleteConfirm)}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
