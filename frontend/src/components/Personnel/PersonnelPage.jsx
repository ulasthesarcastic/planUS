import { useState, useEffect } from 'react';
import { personnelApi, seniorityApi, organizationApi } from '../../services/api';
import SearchableSelect from '../SearchableSelect';

function XIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function EditIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }

function FilterBtn({ label, active, onClick, color = 'var(--accent)' }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
      fontFamily: 'DM Sans, sans-serif', fontWeight: 500, border: '1px solid',
      background: active ? color : 'transparent',
      color: active ? '#fff' : 'var(--text-secondary)',
      borderColor: active ? color : 'var(--border)',
      transition: 'all 0.15s',
    }}>{label}</button>
  );
}

function PersonnelModal({ personnel, seniorities, units, onSave, onClose }) {
  const isEdit = !!personnel;
  const roots = units.filter(u => !u.parentId);

  const [form, setForm] = useState({
    firstName: personnel?.firstName || '',
    lastName: personnel?.lastName || '',
    seniorityId: personnel?.seniorityId ? String(personnel.seniorityId) : (seniorities[0]?.id ? String(seniorities[0].id) : ''),
    unitId: personnel?.unitId ? String(personnel.unitId) : '',
  });
  const [selectedRoot, setSelectedRoot] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (personnel?.unitId) {
      const unit = units.find(u => String(u.id) === String(personnel.unitId));
      if (unit?.parentId) setSelectedRoot(String(unit.parentId));
      else setSelectedRoot(String(personnel.unitId));
    }
  }, [personnel, units]);

  const children = units.filter(u => String(u.parentId) === String(selectedRoot));

  const handleRootChange = (rootId) => {
    setSelectedRoot(rootId);
    setForm(f => ({ ...f, unitId: rootId }));
  };

  const handleSave = async () => {
    if (!form.firstName.trim()) return setError('Ad zorunludur.');
    if (!form.lastName.trim()) return setError('Soyad zorunludur.');
    if (!form.seniorityId) return setError('Kıdem seçilmelidir.');
    setError(''); setSaving(true);
    try {
      const payload = { ...form, seniorityId: Number(form.seniorityId), unitId: form.unitId ? Number(form.unitId) : null };
      if (isEdit) await personnelApi.update(personnel.id, payload);
      else await personnelApi.create(payload);
      onSave();
    } catch (e) {
      setError(e.response?.data?.error || 'Bir hata oluştu.');
    } finally { setSaving(false); }
  };

  const label = (text) => (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{text}</label>
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Personel Düzenle' : 'Yeni Personel'}</div>
          <button className="btn-icon" onClick={onClose}><XIcon /></button>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            {label('Ad')}
            <input className="form-input" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Ad" autoFocus />
          </div>
          <div>
            {label('Soyad')}
            <input className="form-input" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Soyad" />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          {label('Kıdem')}
          <SearchableSelect
            value={form.seniorityId}
            onChange={v => setForm(f => ({ ...f, seniorityId: v }))}
            placeholder="— Seçin —"
            options={seniorities.map(s => ({ value: String(s.id), label: s.name }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 }}>
          <div>
            {label('1. Seviye Birim')}
            <SearchableSelect
              value={selectedRoot}
              onChange={handleRootChange}
              placeholder="— Seçin —"
              options={[{ value: '', label: '— Seçin —' }, ...roots.map(r => ({ value: String(r.id), label: r.name }))]}
            />
          </div>
          <div>
            {label('2. Seviye Birim')}
            <SearchableSelect
              value={form.unitId === selectedRoot ? '' : (form.unitId || '')}
              onChange={v => setForm(f => ({ ...f, unitId: v }))}
              placeholder="— Seçin —"
              disabled={!selectedRoot || children.length === 0}
              options={[{ value: '', label: '— Seçin —' }, ...children.map(c => ({ value: String(c.id), label: c.name }))]}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
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
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [filterRoot, setFilterRoot] = useState('ALL');
  const [filterChild, setFilterChild] = useState('ALL');

  const load = async () => {
    try {
      const [pRes, sRes, uRes] = await Promise.all([personnelApi.getAll(), seniorityApi.getAll(), organizationApi.getAll()]);
      setPersonnel(pRes.data); setSeniorities(sRes.data); setUnits(uRes.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const roots = units.filter(u => !u.parentId);
  const getChildren = (rootId) => units.filter(u => String(u.parentId) === String(rootId));
  const getSeniorityName = (id) => seniorities.find(s => String(s.id) === String(id))?.name || '—';
  const getUnitName = (id) => units.find(u => String(u.id) === String(id))?.name || '—';
  const getRootOfUnit = (unitId) => {
    const unit = units.find(u => String(u.id) === String(unitId));
    if (!unit) return null;
    return unit.parentId ? String(unit.parentId) : String(unit.id);
  };

  const handleDelete = async (id) => { await personnelApi.delete(id); setDeleteConfirm(null); load(); };

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const SortIcon = ({ col }) => <span style={{ opacity: sortCol !== col ? 0.3 : 1, fontSize: 10 }}>{sortCol !== col ? '↕' : sortDir === 'asc' ? '↑' : '↓'}</span>;

  const childrenOfSelected = filterRoot !== 'ALL' ? getChildren(filterRoot) : [];

  const filtered = personnel
    .filter(p => filterRoot === 'ALL' || getRootOfUnit(p.unitId) === filterRoot)
    .filter(p => filterChild === 'ALL' || String(p.unitId) === String(filterChild))
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
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>+ Yeni Personel</button>
      </div>

      {/* Filtreler */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterBtn label={`Tümü (${personnel.length})`} active={filterRoot === 'ALL'} onClick={() => { setFilterRoot('ALL'); setFilterChild('ALL'); }} />
        {roots.map(r => {
          const count = personnel.filter(p => getRootOfUnit(p.unitId) === String(r.id)).length;
          return (
            <FilterBtn key={r.id}
              label={`${r.name} (${count})`}
              active={filterRoot === String(r.id)}
              onClick={() => { setFilterRoot(String(r.id)); setFilterChild('ALL'); }}
            />
          );
        })}
        {filterRoot !== 'ALL' && childrenOfSelected.length > 0 && (
          <>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>›</span>
            {childrenOfSelected.map(c => {
              const count = personnel.filter(p => String(p.unitId) === String(c.id)).length;
              return (
                <FilterBtn key={c.id}
                  label={`${c.name} (${count})`}
                  active={filterChild === String(c.id)}
                  color="#a78bfa"
                  onClick={() => setFilterChild(filterChild === String(c.id) ? 'ALL' : String(c.id))}
                />
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
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title">Personeli Sil</div>
              <button className="btn-icon" onClick={() => setDeleteConfirm(null)}><XIcon /></button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.firstName} {deleteConfirm.lastName}</strong> silinecek. Bu işlem geri alınamaz.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>İptal</button>
              <button className="btn" style={{ background: 'var(--danger)', color: '#fff' }} onClick={() => handleDelete(deleteConfirm.id)}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
