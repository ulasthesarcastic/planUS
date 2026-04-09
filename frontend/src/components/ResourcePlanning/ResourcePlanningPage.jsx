import { useState, useEffect } from 'react';
import { organizationApi, personnelApi } from '../../services/api';
import SearchableSelect from '../SearchableSelect';
import {
  Box, Typography, Chip, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

const FILTER_LABELS = ['SGE', 'Teknoloji', 'Hizmetler'];

const FILTER_PATTERNS = {
  'SGE':        ['sge', 'enstitü'],
  'Teknoloji':  ['teknoloji'],
  'Hizmetler':  ['hizmetler'],
};

function ManagerModal({ unit, personnel, onSave, onClose }) {
  const [managerId, setManagerId] = useState(unit.managerId ? String(unit.managerId) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const options = [...personnel]
    .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'tr'))
    .map(p => ({ value: String(p.id), label: `${p.firstName} ${p.lastName}` }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await organizationApi.update(unit.id, { ...unit, managerId: managerId || null });
      onSave();
    } catch (e) {
      setError(e.response?.data?.error || 'Bir hata oluştu.');
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {unit.name}
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <div className="form-group">
          <label className="form-label">Bölüm Yöneticisi</label>
          <SearchableSelect
            options={[{ value: '', label: '— Yönetici Seç —' }, ...options]}
            value={managerId}
            onChange={setManagerId}
            placeholder="— Yönetici Seç —"
            style={{ width: '100%' }}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>İptal</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function UnitCard({ unit, personnel, parentName, onEdit }) {
  const manager = personnel.find(p => String(p.id) === String(unit.managerId));
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '14px 16px', borderRadius: 8,
        border: `1px solid ${hovered ? 'var(--accent)' : 'var(--border)'}`,
        background: 'var(--bg-card)',
        boxShadow: hovered ? '0 2px 14px rgba(99,102,241,0.12)' : 'none',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{unit.name}</div>
          {parentName && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{parentName}</div>}
        </div>
        <div onClick={e => e.stopPropagation()}>
          <IconButton size="small" onClick={() => onEdit(unit)} title="Düzenle" style={{ padding: 3 }}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </div>
      </div>
      <div style={{ fontSize: 11 }}>
        <span style={{ color: 'var(--text-secondary)' }}>Bölüm Yöneticisi: </span>
        {manager
          ? <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{manager.firstName} {manager.lastName}</span>
          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
      </div>
    </div>
  );
}

export default function ResourcePlanningPage() {
  const [units, setUnits] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState(new Set(FILTER_LABELS));

  const load = async () => {
    const [unitRes, personnelRes] = await Promise.all([
      organizationApi.getAll(),
      personnelApi.getAll(),
    ]);
    setUnits(unitRes.data);
    setPersonnel(personnelRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const rootUnits = units.filter(u => !u.parentId);

  const filterGroups = FILTER_LABELS.map(label => ({
    label,
    unit: rootUnits.find(u => {
      const name = u.name.toLowerCase();
      return FILTER_PATTERNS[label].some(p => name.includes(p));
    }),
  }));

  const selectedGroupIds = new Set(
    filterGroups
      .filter(f => selectedFilters.has(f.label) && f.unit)
      .map(f => f.unit.id)
  );

  const unitMap = Object.fromEntries(units.map(u => [u.id, u]));

  const toggleFilter = (label) => {
    setSelectedFilters(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const visibleUnits = units
    .filter(u => u.parentId && selectedGroupIds.has(u.parentId))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  if (loading) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 8 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <Typography variant="h6" fontWeight={700}>Kaynak Planlama</Typography>
          <Typography variant="body2" color="text.secondary">{visibleUnits.length} bölüm</Typography>
        </div>
      </div>

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {filterGroups.map(({ label, unit }) => (
          <Chip
            key={label}
            label={label}
            onClick={() => toggleFilter(label)}
            color={selectedFilters.has(label) ? 'primary' : 'default'}
            variant={selectedFilters.has(label) ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer', opacity: unit ? 1 : 0.4 }}
          />
        ))}
      </Box>

      {visibleUnits.length === 0 ? (
        <div className="empty-state"><p>Gösterilecek bölüm yok.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 10 }}>
          {visibleUnits.map(unit => (
            <UnitCard key={unit.id} unit={unit} personnel={personnel}
              parentName={unitMap[unit.parentId]?.name} onEdit={setEditing} />
          ))}
        </div>
      )}

      {editing && (
        <ManagerModal unit={editing} personnel={personnel}
          onSave={() => { setEditing(null); load(); }}
          onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
