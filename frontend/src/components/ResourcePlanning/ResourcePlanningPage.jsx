import { useState, useEffect } from 'react';
import { organizationApi, personnelApi } from '../../services/api';
import SearchableSelect from '../SearchableSelect';

const EditIcon = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

const FILTER_LABELS = ['SGE', 'Teknoloji', 'Hizmetler'];

// Her etiket için birden fazla arama terimi (veritabanındaki gerçek isimlerle eşleşmesi için)
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
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <div className="modal-title">{unit.name} — Yönetici</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}>✕</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
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

function UnitCard({ unit, personnel, parentName, onEdit }) {
  const manager = personnel.find(p => String(p.id) === String(unit.managerId));
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '14px 16px',
        borderRadius: 8,
        border: `1px solid ${hovered ? 'var(--accent)' : 'var(--border)'}`,
        background: 'var(--bg-card)',
        boxShadow: hovered ? '0 2px 14px rgba(99,102,241,0.12)' : 'none',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
    >
      {/* Title row with edit button */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
            {unit.name}
          </div>
          {parentName && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{parentName}</div>
          )}
        </div>
        <div onClick={e => e.stopPropagation()}>
          <button className="btn-icon" onClick={() => onEdit(unit)} title="Düzenle" style={{ padding: 3 }}>
            <EditIcon />
          </button>
        </div>
      </div>

      {/* Manager info */}
      <div style={{ fontSize: 11 }}>
        <span style={{ color: 'var(--text-secondary)' }}>Bölüm Yöneticisi: </span>
        {manager
          ? <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{manager.firstName} {manager.lastName}</span>
          : <span style={{ color: 'var(--text-muted)' }}>—</span>
        }
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

  // Sadece kök birimler arasında ara — aksi hâlde "hizmetler" gibi bir kelime
  // çocuk birimlerde de geçeceğinden yanlış eşleşme olur.
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

  // Build a map of unitId → unit for parent name lookup
  const unitMap = Object.fromEntries(units.map(u => [u.id, u]));

  const toggleFilter = (label) => {
    setSelectedFilters(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  // Seçili kök birimlerin tüm çocukları — dış kaynak dahil, alfabetik
  const visibleUnits = units
    .filter(u => u.parentId && selectedGroupIds.has(u.parentId))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Kaynak Planlama</div>
          <div className="page-subtitle">{visibleUnits.length} bölüm</div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {filterGroups.map(({ label, unit }) => {
          const active = selectedFilters.has(label);
          return (
            <button
              key={label}
              onClick={() => toggleFilter(label)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                background: active ? 'var(--accent-dim)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.15s',
                opacity: unit ? 1 : 0.4,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {visibleUnits.length === 0 ? (
        <div className="empty-state">
          <p>Gösterilecek bölüm yok.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
          gap: 10,
        }}>
          {visibleUnits.map(unit => (
            <UnitCard
              key={unit.id}
              unit={unit}
              personnel={personnel}
              parentName={unitMap[unit.parentId]?.name}
              onEdit={setEditing}
            />
          ))}
        </div>
      )}

      {editing && (
        <ManagerModal
          unit={editing}
          personnel={personnel}
          onSave={() => { setEditing(null); load(); }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
