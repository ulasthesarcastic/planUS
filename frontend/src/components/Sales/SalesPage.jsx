import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi, personnelApi, productApi, organizationApi, seniorityApi } from '../../services/api';
import SearchableSelect from '../SearchableSelect';
import { ProjectDetail } from '../Projects/ProjectsPage';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const YEARS = [2024, 2025, 2026, 2027, 2028, 2029];
const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP'];
const fmt = (n) => (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const probColor = (p) => p >= 70 ? '#34c97a' : p >= 40 ? '#f5a623' : '#f05c5c';
const currentYear = new Date().getFullYear();

// Başlama tarihi + süre → bitiş tarihi
const computeEnd = (startMonth, startYear, duration) => {
  const total = (startMonth - 1) + (Number(duration) - 1);
  return { endMonth: (total % 12) + 1, endYear: startYear + Math.floor(total / 12) };
};
// Başlama + bitiş → süre (ay)
const computeDuration = (sm, sy, em, ey) => (ey - sy) * 12 + (em - sm) + 1;

function AmountInput({ value, onChange, placeholder = '0', style = {} }) {
  const toDisplay = (v) => (v !== '' && v !== null && v !== undefined && !isNaN(Number(v))) ? Number(v).toLocaleString('tr-TR') : '';
  const [display, setDisplay] = useState(toDisplay(value));
  useEffect(() => { setDisplay(toDisplay(value)); }, [value]);
  const handleChange = (e) => {
    const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
    if (raw === '') { setDisplay(''); onChange(''); return; }
    const num = Number(raw);
    setDisplay(num.toLocaleString('tr-TR'));
    onChange(num);
  };
  return (
    <input className="form-input" value={display} onChange={handleChange}
      placeholder={placeholder}
      style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', ...style }} />
  );
}

function PlusIcon()  { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function EditIcon()  { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon() { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function XIcon()     { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }

// ── Modal: Potansiyel Proje Oluştur / Düzenle ────────────────────────────────
function PotentialProjectModal({ project, personnel, onSave, onClose }) {
  const isEdit = !!project?.id;

  const initDuration = project?.id && project.startMonth && project.endMonth
    ? computeDuration(project.startMonth, project.startYear, project.endMonth, project.endYear)
    : 3;

  const [form, setForm] = useState(project?.id ? {
    name: project.name,
    budget: project.budget || '',
    budgetCurrency: project.budgetCurrency || 'TRY',
    probability: project.probability ?? 50,
    startMonth: project.startMonth || (new Date().getMonth() + 1),
    startYear: project.startYear || currentYear,
    durationMonths: initDuration,
    projectManagerId: project.projectManagerId || '',
  } : {
    name: '',
    budget: '',
    budgetCurrency: 'TRY',
    probability: 50,
    startMonth: new Date().getMonth() + 1,
    startYear: currentYear,
    durationMonths: 3,
    projectManagerId: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const dur = Number(form.durationMonths);
  const calcEnd = dur >= 1 ? computeEnd(form.startMonth, form.startYear, dur) : null;

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Proje adı zorunludur.');
    if (!dur || dur < 1) return setError('Proje süresi girilmelidir.');
    setError(''); setSaving(true);
    try {
      const { endMonth, endYear } = computeEnd(form.startMonth, form.startYear, dur);
      const payload = {
        name: form.name,
        budget: parseFloat(form.budget) || 0,
        budgetCurrency: form.budgetCurrency,
        probability: form.probability,
        startMonth: form.startMonth,
        startYear: form.startYear,
        endMonth,
        endYear,
        projectManagerId: form.projectManagerId || null,
        projectStatus: 'POTANSIYEL',
      };
      if (isEdit) {
        await projectApi.update(project.id, { ...project, ...payload });
      } else {
        await projectApi.create(payload);
      }
      onSave();
    } catch (e) {
      setError(e.response?.data?.error || 'Bir hata oluştu.');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Potansiyel Proje Düzenle' : 'Yeni Potansiyel Proje'}</div>
          <button className="btn-icon" onClick={onClose}><XIcon /></button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Proje Adı</label>
          <input className="form-input" value={form.name}
            onChange={e => set('name', e.target.value)} autoFocus />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Bütçe</label>
            <AmountInput value={form.budget} onChange={v => set('budget', v)} />
          </div>
          <div className="form-group">
            <label className="form-label">Para Birimi</label>
            <select className="form-select" value={form.budgetCurrency} onChange={e => set('budgetCurrency', e.target.value)}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Gerçekleşme Olasılığı: <strong style={{ color: probColor(form.probability) }}>%{form.probability}</strong>
          </label>
          <input type="range" min={0} max={100} step={5} value={form.probability}
            onChange={e => set('probability', Number(e.target.value))}
            style={{ width: '100%' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            <span>%0</span><span>%50</span><span>%100</span>
          </div>
        </div>

        {/* Tarih & Süre */}
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Tahmini Başlama Tarihi <span style={{ color: 'var(--danger)' }}>*</span></label>
            <div className="month-year-row">
              <select className="form-select" value={form.startMonth} onChange={e => set('startMonth', +e.target.value)}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select className="form-select" value={form.startYear} onChange={e => set('startYear', +e.target.value)}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Süre (Ay) <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              className="form-input"
              type="number" min={1} max={120}
              value={form.durationMonths}
              onChange={e => set('durationMonths', e.target.value === '' ? '' : +e.target.value)}
              style={{ textAlign: 'center' }}
            />
          </div>
        </div>

        {/* Otomatik hesaplanan bitiş tarihi */}
        <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tahmini Tamamlanma Tarihi</span>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: calcEnd ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {calcEnd ? `${MONTHS[calcEnd.endMonth - 1]} ${calcEnd.endYear}` : '—'}
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">Proje Yöneticisi <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opsiyonel)</span></label>
          <SearchableSelect
            value={form.projectManagerId || ''}
            onChange={v => set('projectManagerId', v)}
            placeholder="— Seçilmedi —"
            style={{ width: '100%' }}
            options={[
              { value: '', label: '— Seçilmedi —' },
              ...(personnel || []).map(p => ({ value: String(p.id), label: `${p.firstName} ${p.lastName}` })),
            ]}
          />
        </div>

        <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Tahminlenen Değer</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#34c97a', fontFamily: 'DM Mono, monospace' }}>
            {fmt((parseFloat(form.budget) || 0) * (form.probability || 0) / 100)} {form.budgetCurrency}
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

// ── Proje Kartı (POTANSIYEL statüsündeki projeler) ────────────────────────────
function ProjectCard({ item, personnelMap, onEdit, onDelete, onConvert, onDetail }) {
  const [hovered, setHovered] = useState(false);
  const [converting, setConverting] = useState(false);
  const prob = item.probability ?? 50;
  const estimated = (item.budget || 0) * prob / 100;
  const mgr = item.projectManagerId ? personnelMap[String(item.projectManagerId)] : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onDetail}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${hovered ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 12, padding: 16,
        display: 'flex', flexDirection: 'column', gap: 10,
        boxShadow: hovered ? '0 2px 14px rgba(99,102,241,0.12)' : 'none',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        cursor: 'pointer',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
        }}>Potansiyel</span>
        <div style={{ display: 'flex', gap: 2 }}>
          <button className="btn-icon" onClick={e => { e.stopPropagation(); onEdit(item); }} style={{ padding: 4 }}><EditIcon /></button>
          <button className="btn-icon danger" onClick={e => { e.stopPropagation(); onDelete(item); }} style={{ padding: 4 }}><TrashIcon /></button>
        </div>
      </div>

      {/* Title */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>{item.name}</div>
        {mgr && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{mgr.firstName} {mgr.lastName}</div>}
      </div>

      {/* Probability bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Olasılık</span>
          <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: probColor(prob), fontWeight: 600 }}>%{prob}</span>
        </div>
        <div style={{ height: 5, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${prob}%`, height: '100%', background: probColor(prob), borderRadius: 3 }} />
        </div>
      </div>

      {/* Amount boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Bütçe', value: fmt(item.budget), color: 'var(--text-primary)', currency: item.budgetCurrency || 'TRY' },
          { label: 'Tahminlenen', value: fmt(estimated), color: '#34c97a', currency: item.budgetCurrency || 'TRY' },
        ].map(box => (
          <div key={box.label} style={{ padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{box.label}</div>
            <div style={{ fontSize: 14, fontFamily: 'DM Mono, monospace', fontWeight: 700, color: box.color }}>{box.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{box.currency}</div>
          </div>
        ))}
      </div>

      {/* Tarih bilgisi */}
      {item.startMonth && item.endMonth && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span>{MONTHS[item.startMonth - 1]} {item.startYear}</span>
          <span style={{ opacity: 0.4 }}>→</span>
          <span>{MONTHS[item.endMonth - 1]} {item.endYear}</span>
          <span style={{ marginLeft: 4, padding: '1px 7px', borderRadius: 10, fontSize: 11, background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
            {computeDuration(item.startMonth, item.startYear, item.endMonth, item.endYear)} ay
          </span>
        </div>
      )}

      {/* Projeye Dönüştür */}
      <button
        onClick={async (e) => { e.stopPropagation(); setConverting(true); await onConvert(item); setConverting(false); }}
        disabled={converting}
        style={{
          width: '100%', padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', border: '1px solid rgba(52,201,122,0.4)',
          background: 'rgba(52,201,122,0.1)', color: '#34c97a',
          fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
        }}
      >
        {converting ? 'Güncelleniyor...' : '→ Projeye Dönüştür'}
      </button>
    </div>
  );
}

// ── Ana Sayfa ─────────────────────────────────────────────────────────────────
export default function SalesPage() {
  const navigate = useNavigate();
  const [potProjects, setPotProjects] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [seniorities, setSeniorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = async () => {
    const [pRes, perRes, prRes, uRes, sRes] = await Promise.all([
      projectApi.getAll(), personnelApi.getAll(), productApi.getAll(),
      organizationApi.getAll(), seniorityApi.getAll(),
    ]);
    const allProjects = pRes.data;
    setPotProjects(allProjects.filter(p => p.projectStatus === 'POTANSIYEL'));
    setPersonnel(perRes.data);
    setProducts(prRes.data);
    setUnits(uRes.data);
    setSeniorities(sRes.data);
    setLoading(false);
    // Detay açıksa tazele
    setSelectedProject(prev => prev ? (allProjects.find(p => p.id === prev.id) || null) : null);
  };

  useEffect(() => { load(); }, []);

  const personnelMap = Object.fromEntries(personnel.map(p => [String(p.id), p]));

  const handleConvert = async (project) => {
    await projectApi.update(project.id, { ...project, projectStatus: 'BASLADI' });
    navigate('/projects');
  };

  const handleDelete = async (item) => {
    await projectApi.delete(item.id);
    setDeleteConfirm(null);
    load();
  };

  const totalEstimated = potProjects.reduce((sum, p) => sum + (p.budget || 0) * (p.probability ?? 50) / 100, 0);

  const summaryCards = [
    { label: 'Toplam',     value: potProjects.length,    color: 'var(--accent)',   mono: false },
    { label: 'Tahminlenen', value: fmt(totalEstimated) + ' ₺', color: '#34c97a', mono: true  },
  ];

  if (loading) return <div className="loading">Yükleniyor...</div>;

  // Proje detayı açıksa inline göster
  if (selectedProject) {
    return (
      <>
        <ProjectDetail
          project={selectedProject}
          allPersonnel={personnel}
          allProducts={products}
          units={units}
          seniorities={seniorities}
          onBack={() => setSelectedProject(null)}
          onEdit={(p) => setEditing(p)}
          onUpdate={load}
        />
        {editing && (
          <PotentialProjectModal
            project={editing?.id ? editing : null}
            personnel={personnel}
            onSave={() => { setEditing(null); load(); }}
            onClose={() => setEditing(null)}
          />
        )}
      </>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Potansiyel Projeler</div>
          <div className="page-subtitle">{potProjects.length} proje takip ediliyor</div>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}>
          <PlusIcon /> Yeni Proje
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20, maxWidth: 480 }}>
        {summaryCards.map(c => (
          <div key={c.label} style={{ padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.color, fontFamily: c.mono ? 'DM Mono, monospace' : 'inherit' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Cards grid */}
      {potProjects.length === 0 ? (
        <div className="empty-state"><p>Potansiyel proje yok. "Yeni Proje" ile ekleyin veya projeler sayfasından "Potansiyele Taşı" butonunu kullanın.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {[...potProjects].sort((a, b) => (b.probability ?? 50) - (a.probability ?? 50)).map(item => (
            <ProjectCard
              key={item.id}
              item={item}
              personnelMap={personnelMap}
              onEdit={setEditing}
              onDelete={setDeleteConfirm}
              onConvert={handleConvert}
              onDetail={() => setSelectedProject(item)}
            />
          ))}
        </div>
      )}

      {editing !== null && (
        <PotentialProjectModal
          project={editing?.id ? editing : null}
          personnel={personnel}
          onSave={() => { setEditing(null); load(); }}
          onClose={() => setEditing(null)}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title" style={{ marginBottom: 8 }}>Projeyi Sil</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
              <strong>{deleteConfirm.name}</strong> silinecek. Bu işlem geri alınamaz.
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
