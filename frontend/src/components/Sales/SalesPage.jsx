import { useState, useEffect } from 'react';
import { potentialSaleApi, projectApi, projectCategoryApi } from '../../services/api';
import SearchableSelect from '../SearchableSelect';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const YEARS = [2024, 2025, 2026, 2027, 2028];
const fmt = (n) => (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const STATUS_CFG = {
  AKTIF:      { label: 'Aktif',      color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)' },
  KAZANILDI:  { label: 'Kazanıldı', color: '#34c97a', bg: 'rgba(52,201,122,0.12)' },
  KAYBEDILDI: { label: 'Kaybedildi',color: '#f05c5c', bg: 'rgba(240,92,92,0.12)' },
};

const probColor = (p) => p >= 70 ? '#34c97a' : p >= 40 ? '#f5a623' : '#f05c5c';

const emptySale = () => ({
  name: '', projectId: '', amount: '', currency: 'TRY',
  probability: 50, targetMonth: new Date().getMonth() + 1,
  targetYear: new Date().getFullYear(), status: 'AKTIF', saleType: 'PROJE',
});

function PlusIcon()   { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function EditIcon()   { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon()  { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function XIcon()      { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }

function SaleModal({ sale, projects, onSave, onClose }) {
  const isEdit = !!sale?.id;
  const [form, setForm] = useState(sale?.id ? { ...sale } : emptySale());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleStatusChange = (status) => {
    let prob = form.probability;
    if (status === 'KAZANILDI') prob = 100;
    else if (status === 'KAYBEDILDI') prob = 0;
    setForm(f => ({ ...f, status, probability: prob }));
  };

  const handleProbChange = (val) => {
    const p = Math.min(100, Math.max(0, +val));
    const status = p === 100 ? 'KAZANILDI' : p === 0 ? 'KAYBEDILDI' : 'AKTIF';
    setForm(f => ({ ...f, probability: p, status }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Proje adı zorunludur.');
    setSaving(true);
    try {
      const prob = parseFloat(form.probability) || 0;
      const status = prob === 100 ? 'KAZANILDI' : form.status;
      const data = { ...form, amount: parseFloat(form.amount) || 0, probability: prob, status };
      if (isEdit) await potentialSaleApi.update(sale.id, data);
      else await potentialSaleApi.create(data);
      onSave();
    } catch (e) {
      setError(e.response?.data?.error || 'Bir hata oluştu.');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Proje Düzenle' : 'Yeni Potansiyel Proje'}</div>
          <button className="btn-icon" onClick={onClose}><XIcon /></button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Proje Adı</label>
          <input className="form-input" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
        </div>

        <div className="form-group">
          <label className="form-label">İlgili Proje <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opsiyonel)</span></label>
          <SearchableSelect
            value={form.projectId || ''}
            onChange={v => setForm(f => ({ ...f, projectId: v }))}
            placeholder="— Seçin —"
            style={{ width: '100%' }}
            options={[
              { value: '', label: '— Seçin —' },
              ...projects.map(p => ({ value: String(p.id), label: p.name })),
            ]}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tutar</label>
            <input className="form-input" type="number" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              style={{ fontFamily: 'DM Mono, monospace' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Para Birimi</label>
            <select className="form-select" value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
              {['TRY','USD','EUR'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Olasılık (%) — %100'de otomatik Kazanıldı</label>
          <input className="form-input" type="number" min="0" max="100"
            value={form.probability}
            onChange={e => handleProbChange(e.target.value)}
            style={{ fontFamily: 'DM Mono, monospace' }} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Hedef Tarih:</label>
          <select className="form-select" style={{ width: 130 }} value={form.targetMonth}
            onChange={e => setForm(f => ({ ...f, targetMonth: +e.target.value }))}>
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select className="form-select" style={{ width: 90 }} value={form.targetYear}
            onChange={e => setForm(f => ({ ...f, targetYear: +e.target.value }))}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Durum</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(STATUS_CFG).map(([key, cfg]) => (
              <button key={key} onClick={() => handleStatusChange(key)} style={{
                flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer',
                border: `2px solid ${form.status === key ? cfg.color : 'var(--border)'}`,
                background: form.status === key ? cfg.bg : 'var(--bg-secondary)',
                color: form.status === key ? cfg.color : 'var(--text-muted)',
                fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600,
              }}>{cfg.label}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Tahminlenen Değer</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#34c97a', fontFamily: 'DM Mono, monospace' }}>
            {fmt((parseFloat(form.amount) || 0) * (parseFloat(form.probability) || 0) / 100)} {form.currency}
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>İptal</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ s, projectName, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const cfg = STATUS_CFG[s.status] || STATUS_CFG.AKTIF;
  const estimated = (s.amount || 0) * (s.probability || 0) / 100;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${hovered ? 'var(--accent)' : s.status === 'KAZANILDI' ? 'rgba(52,201,122,0.3)' : s.status === 'KAYBEDILDI' ? 'rgba(240,92,92,0.2)' : 'var(--border)'}`,
        borderRadius: 12, padding: 16,
        display: 'flex', flexDirection: 'column', gap: 10,
        boxShadow: hovered ? '0 2px 14px rgba(99,102,241,0.12)' : 'none',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          background: cfg.bg, color: cfg.color,
        }}>{cfg.label}</span>
        <div style={{ display: 'flex', gap: 2 }}>
          <button className="btn-icon" onClick={() => onEdit(s)} style={{ padding: 4 }}><EditIcon /></button>
          <button className="btn-icon danger" onClick={() => onDelete(s)} style={{ padding: 4 }}><TrashIcon /></button>
        </div>
      </div>

      {/* Title */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>{s.name}</div>
        {projectName && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{projectName}</div>}
      </div>

      {/* Probability bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Olasılık</span>
          <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: probColor(s.probability), fontWeight: 600 }}>%{s.probability}</span>
        </div>
        <div style={{ height: 5, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${s.probability}%`, height: '100%', background: probColor(s.probability), borderRadius: 3 }} />
        </div>
      </div>

      {/* Amount boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Tutar', value: fmt(s.amount), color: 'var(--text-primary)', currency: s.currency },
          { label: 'Tahminlenen', value: fmt(estimated), color: '#34c97a', currency: s.currency },
        ].map(box => (
          <div key={box.label} style={{ padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{box.label}</div>
            <div style={{ fontSize: 14, fontFamily: 'DM Mono, monospace', fontWeight: 700, color: box.color }}>{box.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{box.currency}</div>
          </div>
        ))}
      </div>

      {/* Target date */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
        Hedef: {MONTHS[s.targetMonth - 1]} {s.targetYear}
      </div>
    </div>
  );
}

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const load = async () => {
    const [sRes, pRes, cRes] = await Promise.all([
      potentialSaleApi.getAll(),
      projectApi.getAll(),
      projectCategoryApi.getAll(),
    ]);
    setSales(sRes.data);
    setProjects(pRes.data);
    setCategories(cRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const projectMap = Object.fromEntries(projects.map(p => [String(p.id), p]));
  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]));

  // Only show sales with saleType === 'PROJE' (or legacy records without saleType)
  const projeSales = sales.filter(s => !s.saleType || s.saleType === 'PROJE');

  // Projects for modal: only PROJE type (or no category)
  const projeProjects = projects.filter(p => {
    if (!p.categoryId) return true;
    const cat = categoryMap[p.categoryId];
    return !cat || cat.categoryType === 'PROJE';
  });

  const getProjectName = (id) => id ? (projectMap[String(id)]?.name || '') : '';
  const filtered = projeSales.filter(s => statusFilter === 'ALL' || s.status === statusFilter);
  const totalEstimated = projeSales.filter(s => s.status === 'AKTIF').reduce((sum, s) => sum + (s.amount || 0) * (s.probability || 0) / 100, 0);

  const summaryCards = [
    { label: 'Toplam',     value: projeSales.length,                                          color: 'var(--accent)',       mono: false },
    { label: 'Aktif',      value: projeSales.filter(s => s.status === 'AKTIF').length,        color: 'var(--text-primary)', mono: false },
    { label: 'Kazanıldı',  value: projeSales.filter(s => s.status === 'KAZANILDI').length,    color: '#34c97a',             mono: false },
    { label: 'Tahminlenen',value: fmt(totalEstimated) + ' ₺',                                 color: '#34c97a',             mono: true  },
  ];

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Potansiyel Projeler</div>
          <div className="page-subtitle">{projeSales.length} proje takip ediliyor</div>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}>
          <PlusIcon /> Yeni Proje
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {summaryCards.map(c => (
          <div key={c.label} style={{ padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.color, fontFamily: c.mono ? 'DM Mono, monospace' : 'inherit' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['ALL','Tümü'], ['AKTIF','Aktif'], ['KAZANILDI','Kazanıldı'], ['KAYBEDILDI','Kaybedildi']].map(([key, label]) => (
          <button key={key} onClick={() => setStatusFilter(key)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${statusFilter === key ? (STATUS_CFG[key]?.color || 'var(--accent)') : 'var(--border)'}`,
            background: statusFilter === key ? `${STATUS_CFG[key]?.color || 'var(--accent)'}22` : 'var(--bg-secondary)',
            color: statusFilter === key ? (STATUS_CFG[key]?.color || 'var(--accent)') : 'var(--text-secondary)',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            {label} ({key === 'ALL' ? projeSales.length : projeSales.filter(s => s.status === key).length})
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="empty-state"><p>Gösterilecek proje yok.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.map(s => (
            <ProjectCard
              key={s.id} s={s}
              projectName={getProjectName(s.projectId)}
              onEdit={setEditing}
              onDelete={setDeleteConfirm}
            />
          ))}
        </div>
      )}

      {editing !== null && (
        <SaleModal
          sale={editing?.id ? editing : null}
          projects={projeProjects}
          onSave={() => { setEditing(null); load(); }}
          onClose={() => setEditing(null)}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title" style={{ marginBottom: 8 }}>Projeyi Sil</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
              <strong>{deleteConfirm.name}</strong> silinecek.
            </p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>İptal</button>
              <button className="btn btn-danger" onClick={async () => {
                await potentialSaleApi.delete(deleteConfirm.id);
                setDeleteConfirm(null); load();
              }}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
