import { useState, useEffect } from 'react';
import { personnelApi, seniorityApi, organizationApi } from '../../services/api';
import SearchableSelect from '../SearchableSelect';

import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';

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

  const handleSave = async () => {
    if (!form.firstName.trim()) return setError('Ad zorunludur.');
    if (!form.lastName.trim()) return setError('Soyad zorunludur.');
    if (!form.seniorityId) return setError('Kıdem seçilmelidir.');
    setError(''); setSaving(true);
    try {
      if (isEdit) await personnelApi.update(personnel.id, form);
      else await personnelApi.create(form);
      onSave();
    } catch (e) {
      setError(e.response?.data?.error || 'Bir hata oluştu.');
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {isEdit ? 'Personel Düzenle' : 'Yeni Personel'}
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
          <TextField label="Ad" placeholder="Ad" value={form.firstName} autoFocus
            onChange={e => setForm({ ...form, firstName: e.target.value })} />
          <TextField label="Soyad" placeholder="Soyad" value={form.lastName}
            onChange={e => setForm({ ...form, lastName: e.target.value })} />
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Kıdem</Typography>
          <SearchableSelect
            value={form.seniorityId || ''}
            onChange={v => setForm({ ...form, seniorityId: v })}
            placeholder="— Seçin —"
            style={{ width: '100%' }}
            options={seniorities.map(s => ({ value: String(s.id), label: s.name }))}
          />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>1. Seviye Birim</Typography>
            <SearchableSelect
              value={selectedRoot || ''}
              onChange={handleRootChange}
              placeholder="— Seçin —"
              style={{ width: '100%' }}
              options={[{ value: '', label: '— Seçin —' }, ...roots.map(r => ({ value: String(r.id), label: r.name }))]}
            />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>2. Seviye Birim</Typography>
            <SearchableSelect
              value={(form.unitId === selectedRoot ? '' : form.unitId) || ''}
              onChange={v => setForm(f => ({ ...f, unitId: v }))}
              placeholder="— Seçin —"
              style={{ width: '100%' }}
              disabled={!selectedRoot || children.length === 0}
              options={[{ value: '', label: '— Seçin —' }, ...children.map(c => ({ value: String(c.id), label: c.name }))]}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>İptal</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || seniorities.length === 0}>
          {saving ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Oluştur'}
        </Button>
      </DialogActions>
    </Dialog>
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
      setPersonnel(pRes.data); setSeniorities(sRes.data); setUnits(uRes.data);
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
    setDeleteConfirm(null); load();
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
    .filter(p => filterRoot === 'ALL' || getRootOfUnit(p.unitId) === filterRoot)
    .filter(p => filterChild === 'ALL' || p.unitId === filterChild)
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
        <Button variant="contained" startIcon={<AddIcon />}
          onClick={() => { setEditing(null); setModalOpen(true); }}>
          Yeni Personel
        </Button>
      </div>

      {/* Filtreler */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip
          label={`Tümü (${personnel.length})`}
          onClick={() => { setFilterRoot('ALL'); setFilterChild('ALL'); }}
          color={filterRoot === 'ALL' ? 'primary' : 'default'}
          variant={filterRoot === 'ALL' ? 'filled' : 'outlined'}
          size="small"
        />
        {roots.map(r => {
          const count = personnel.filter(p => getRootOfUnit(p.unitId) === r.id).length;
          return (
            <Chip key={r.id}
              label={`${r.name} (${count})`}
              onClick={() => { setFilterRoot(r.id); setFilterChild('ALL'); }}
              color={filterRoot === r.id ? 'primary' : 'default'}
              variant={filterRoot === r.id ? 'filled' : 'outlined'}
              size="small"
            />
          );
        })}
        {filterRoot !== 'ALL' && childrenOfSelected.length > 0 && (
          <>
            <Typography variant="caption" color="text.disabled">›</Typography>
            {childrenOfSelected.map(c => {
              const count = personnel.filter(p => p.unitId === c.id).length;
              return (
                <Chip key={c.id}
                  label={`${c.name} (${count})`}
                  onClick={() => setFilterChild(filterChild === c.id ? 'ALL' : c.id)}
                  color={filterChild === c.id ? 'secondary' : 'default'}
                  variant={filterChild === c.id ? 'filled' : 'outlined'}
                  size="small"
                />
              );
            })}
          </>
        )}
      </Box>

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
                        <IconButton size="small" onClick={() => { setEditing(p); setModalOpen(true); }}>
                          <EditOutlinedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteConfirm(p)}>
                          <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                        </IconButton>
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

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Personeli Sil</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            <strong>{deleteConfirm?.firstName} {deleteConfirm?.lastName}</strong> silinecek. Bu işlem geri alınamaz.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDeleteConfirm(null)}>İptal</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(deleteConfirm.id)}>Sil</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
