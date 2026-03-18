import { useState, useEffect } from 'react';
import { personnelApi, seniorityApi, organizationApi } from '../../services/api';
import SearchableSelect from '../SearchableSelect';

function EditIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function TrashIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
}
function PlusIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function XIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}

function PersonnelModal({ personnel, seniorities, units, onSave, onClose }) {
  const isEdit = !!personnel;
  const roots = units.filter(u => !u.parentId);

  const [form, setForm] = useState({
    firstName: personnel?.firstName || '',
    lastName: personnel?.lastName || '',
    seniorityId: personnel?.seniorityId || (seniorities[0]?.id || ''),
    unitId: personnel?.unitId || '',
  });
  const [selectedRoot, setSelectedRoot] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (personnel?.unitId) {
      const unit = units.find(u => u.id === personnel.unitId);
      if (unit?.parentId) setSelectedRoot(unit.parentId);
      else setSelectedRoot(personnel.unitId);
    }
  }, [personnel, units]);

  const children = units.filter(u => u.parentId === selectedRoot);

  const handleRootChange = (rootId) => {
    setSelectedRoot(rootId);
    setForm(f => ({ ...f, unitId: rootId }));
  };

  const handleChildChange = (childId) => {
    setForm(f => ({ ...f, unitId: childId }));
  };

  const handleSave = async () => {
    if (!form.firstName.trim()) return setError('Ad zorunludur.');
    if (!form.lastName.trim()) return setError('Soyad zorunludur.');
    if (!form.seniorityId) return setError('Kıdem seçilmelidir.');
    setError('');
    setSaving(true);
    try {
      if (isEdit) await personnelApi.update(personnel.id, form);
      else await personnelApi.create(form);
      onSave();
    } catch (e) {
      setError(e.response?.data?.error || 'Bir hata oluştu.');
    } finally { setSaving(false); }
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
            <input className="form-input" placeholder="Ad" value={form.firstName}
              onChange={e => setForm({ ...form, firstName: e.target.value })} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Soyad</label>
            <input className="form-input" placeholder="Soyad" value={form.lastName}
              onChange={e => setForm({ ...form, lastName: e.target.value })} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Kıdem</label>
          <SearchableSelect
            value={form.seniorityId || ''}
            onChange={v => setForm({ ...form, seniorityId: v })}
            placeholder="— Seçin —"
            style={{ width: '100%' }}
            options={seniorities.map(s => ({ value: String(s.id), label: s.name }))}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">1. Seviye Birim</label>
            <SearchableSelect
              value={selectedRoot || ''}
              onChange={v => handleRootChange(v)}
              placeholder="— Seçin —"
              style={{ width: '100%' }}
              options={[
                { value: '', label: '— Seçin —' },
                ...roots.map(r => ({ value: String(r.id), label: r.name })),
              ]}
            />
          </div>
          <div className="form-group">
            <label className="form-label">2. Seviye Birim</label>
            <SearchableSelect
              value={(form.unitId === selectedRoot ? '' : form.unitId) || ''}
              onChange={v => handleChildChange(v)}
              placeholder="— Seçin —"
              style={{ width: '100%', opacity: !selectedRoot || children.length === 0 ? 0.5 : 1, pointerEvents: !selectedRoot || children.length === 0 ? 'none' : 'auto' }}
              options={[
                { value: '', label: '— Seçin —' },
                ...children.map(c => ({ value: String(c.id), label: c.name })),
              ]}
            />
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>İptal</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || seniorities.length === 0}>
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
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [filterRoot, setFilterRoot] = useState('ALL');
  const [filterChild, setFilterChild] = useState('ALL');

  const load = async () => {
    try {
      const [pRes, sRes, uRes] = await Promise.all([personnelApi.getAll(), seniorityApi.getAll(), organizationApi.getAll()]);
      setPersonnel(pRes.data);
      setSeniorities(sRes.data);
      setUnits(uRes.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const roots = units.filter(u => !u.parentId);
  const getChildren = (rootId) => units.filter(u => u.parentId === rootId);
  const getSeniorityName = (id) => seniorities.find(s => s.id === id)?.name || '—';
  const getUnitName = (id) => units.find(u => u.id === id)?.name || '—';
  const getRootOfUnit = (unitId) => {
    const unit = units.find(u => u.id === unitId);
    if (!unit) return null;
    return unit.parentId ? unit.parentId : unit.id;
  };

  const handleDelete = async (id) => {
    await personnelApi.delete(id);
    setDeleteConfirm(null);
    load();
  };

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const SortIcon = ({ col }) => sortCol !== col
    ? <span style={{ opacity: 0.3, fontSize: 10 }}>↕</span>
    : <span style={{ fontSize: 10 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;

  const childrenOfSelected = filterRoot !== 'ALL' ? getChildren(filterRoot) : [];

  const filtered = personnel
    .filter(p => {
      if (filterRoot === 'ALL') return true;
      return getRootOfUnit(p.unitId) === filterRoot;
    })
    .filter(p => {
      if (filterChild === 'ALL') return true;
      return p.unitId === filterChild;
    })
    .sort((a, b) => {
      if (!sortCol) return 0;
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortCol === 'name') return dir * (`${a.firstName} ${a.lastName}`).localeCompare(`${b.firstName} ${b.lastName}`, 'tr');
      if (sortCol === 'seniority') return dir * getSeniorityName(a.seniorityId).localeCompare(getSeniorityName(b.seniorityId), 'tr');
      if (sortCol === 'unit') return dir * getUnitName(a.unitId).localeCompare(getUnitName(b.unitId), 'tr');
      return 0;
    });

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

      {/* Filtreler */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => { setFilterRoot('ALL'); setFilterChild('ALL'); }} style={{
          padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          border: '1px solid var(--border)', fontFamily: 'DM Sans, sans-serif',
          background: filterRoot === 'ALL' ? 'var(--accent)' : 'var(--bg-secondary)',
          color: filterRoot === 'ALL' ? '#fff' : 'var(--text-secondary)',
        }}>Tümü ({personnel.length})</button>

        {roots.map(r => {
          const count = personnel.filter(p => getRootOfUnit(p.unitId) === r.id).length;
          return (
            <button key={r.id} onClick={() => { setFilterRoot(r.id); setFilterChild('ALL'); }} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: '1px solid var(--border)', fontFamily: 'DM Sans, sans-serif',
              background: filterRoot === r.id ? 'var(--accent)' : 'var(--bg-secondary)',
              color: filterRoot === r.id ? '#fff' : 'var(--text-secondary)',
            }}>{r.name} ({count})</button>
          );
        })}

        {filterRoot !== 'ALL' && childrenOfSelected.length > 0 && (
          <>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>›</span>
            {childrenOfSelected.map(c => {
              const count = personnel.filter(p => p.unitId === c.id).length;
              return (
                <button key={c.id} onClick={() => setFilterChild(filterChild === c.id ? 'ALL' : c.id)} style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: '1px solid var(--border)', fontFamily: 'DM Sans, sans-serif',
                  background: filterChild === c.id ? '#7c3aed' : 'var(--bg-secondary)',
                  color: filterChild === c.id ? '#fff' : 'var(--text-secondary)',
                }}>{c.name} ({count})</button>
              );
            })}
          </>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p>Personel bulunamadı.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Ad Soyad <SortIcon col="name" /></th>
                  <th onClick={() => handleSort('seniority')} style={{ cursor: 'pointer' }}>Kıdem <SortIcon col="seniority" /></th>
                  <th onClick={() => handleSort('unit')} style={{ cursor: 'pointer' }}>Birim <SortIcon col="unit" /></th>
                  <th style={{ textAlign: 'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.firstName} {p.lastName}</td>
                    <td><span className="seniority-badge">{getSeniorityName(p.seniorityId)}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{getUnitName(p.unitId)}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon" onClick={() => { setEditing(p); setModalOpen(true); }}><EditIcon /></button>
                        <button className="btn-icon danger" onClick={() => setDeleteConfirm(p)}><TrashIcon /></button>
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
        <PersonnelModal personnel={editing} seniorities={seniorities} units={units}
          onSave={() => { setModalOpen(false); load(); }}
          onClose={() => setModalOpen(false)} />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title" style={{ marginBottom: 8 }}>Personeli Sil</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
              <strong>{deleteConfirm.firstName} {deleteConfirm.lastName}</strong> silinecek.
            </p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>İptal</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
