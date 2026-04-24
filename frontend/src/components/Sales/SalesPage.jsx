import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../../services/api';
import { useProjects, usePersonnel, useProducts, useOrganization, useSeniorities, useInvalidate } from '../../hooks/useQueries';
import SearchableSelect from '../SearchableSelect';
import { ProjectDetail } from '../Projects/ProjectsPage';

import { MONTHS, addMonths, applyShift, buildShiftInfo } from '../../utils/salesUtils';
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
  const [shiftConfirm, setShiftConfirm] = useState(null); // { payload, info, entries, endMonth, endYear }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const dur = Number(form.durationMonths);
  const calcEnd = dur >= 1 ? computeEnd(form.startMonth, form.startYear, dur) : null;

  const doSave = async (payload, entries, info) => {
    setSaving(true);
    setShiftConfirm(null);
    try {
      await projectApi.update(project.id, { ...project, ...payload });
      if (entries && info) {
        await projectApi.updateResourcePlan(project.id, applyShift(entries, info.offset, payload.endMonth, payload.endYear));
      }
      onSave();
    } catch (e) { setError(e.response?.data?.error || 'Bir hata oluştu.'); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Proje adı zorunludur.');
    if (!dur || dur < 1) return setError('Proje süresi girilmelidir.');
    setError('');
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
    if (!isEdit) { setSaving(true); try { await projectApi.create(payload); onSave(); } catch(e) { setError(e.response?.data?.error || 'Bir hata oluştu.'); } finally { setSaving(false); } return; }
    const entries = project.resourcePlan || [];
    if (entries.length > 0) {
      const info = buildShiftInfo(entries, project.startMonth, project.startYear, form.startMonth, form.startYear, endMonth, endYear);
      if (info) { setShiftConfirm({ payload, info, entries }); return; }
    }
    doSave(payload, null, null);
  };

  if (shiftConfirm) {
    const { payload, info, entries } = shiftConfirm;
    const abs = Math.abs(info.offset);
    const dir = info.offset > 0 ? 'ileri' : 'geri';
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">Kaynak Planlaması Etkilenecek</div>
            <button className="btn-icon" onClick={() => setShiftConfirm(null)}><XIcon /></button>
          </div>
          {info.offset !== 0 && (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
              Proje başlangıcı <strong>{abs} ay {dir}</strong> kaydırıldı.
              Bu projedeki tüm kaynak planlaması da aynı oranda ötelenecek.
            </p>
          )}
          {info.dropped > 0 && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f87171', marginBottom: 4 }}>
                {info.dropped} kayıt yeni proje süresi dışında kalacak ve silinecek:
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{info.droppedMonths.join(', ')}</div>
            </div>
          )}
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShiftConfirm(null)}>İptal</button>
            <button className="btn btn-primary" disabled={saving} onClick={() => doSave(payload, entries, info)}>
              {saving ? 'Kaydediliyor...' : 'Onayla'}
            </button>
          </div>
        </div>
      </div>
    );
  }

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

// ── Proje Satırı (kompakt liste görünümü) ─────────────────────────────────────
function ProjectRow({ item, personnelMap, onEdit, onDelete, onConvert, onDetail }) {
  const [hovered, setHovered] = useState(false);
  const [converting, setConverting] = useState(false);
  const prob = item.probability ?? 50;
  const estimated = (item.budget || 0) * prob / 100;
  const mgr = item.projectManagerId ? personnelMap[String(item.projectManagerId)] : null;
  const dur = item.startMonth && item.endMonth
    ? computeDuration(item.startMonth, item.startYear, item.endMonth, item.endYear)
    : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onDetail}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px',
        background: hovered ? 'var(--bg-hover)' : 'transparent',
        cursor: 'pointer',
        transition: 'background 0.12s',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Durum badge */}
      <span style={{
        flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
        background: 'rgba(245,158,11,0.12)', color: '#f59e0b', whiteSpace: 'nowrap',
      }}>Potansiyel</span>

      {/* İsim + yönetici */}
      <div style={{ flex: '0 0 220px', minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
        {mgr && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{mgr.firstName} {mgr.lastName}</div>}
      </div>

      {/* Olasılık bar */}
      <div style={{ flex: '0 0 100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Olasılık</span>
          <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: probColor(prob), fontWeight: 700 }}>%{prob}</span>
        </div>
        <div style={{ height: 4, background: 'var(--bg-hover)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${prob}%`, height: '100%', background: probColor(prob), borderRadius: 2 }} />
        </div>
      </div>

      {/* Bütçe */}
      <div style={{ flex: '0 0 140px', textAlign: 'right' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 1 }}>Bütçe</div>
        <div style={{ fontSize: 13, fontFamily: 'DM Mono, monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
          {fmt(item.budget)} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.budgetCurrency || 'TRY'}</span>
        </div>
      </div>

      {/* Tahminlenen */}
      <div style={{ flex: '0 0 140px', textAlign: 'right' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 1 }}>Tahminlenen</div>
        <div style={{ fontSize: 13, fontFamily: 'DM Mono, monospace', fontWeight: 600, color: '#34c97a' }}>
          {fmt(estimated)} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.budgetCurrency || 'TRY'}</span>
        </div>
      </div>

      {/* Tarih & süre */}
      <div style={{ flex: '0 0 160px' }}>
        {item.startMonth && item.endMonth ? (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            {MONTHS[item.startMonth - 1]} {item.startYear} → {MONTHS[item.endMonth - 1]} {item.endYear}
            {dur && <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 8, fontSize: 10, background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{dur} ay</span>}
          </div>
        ) : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>}
      </div>

      {/* Aksiyonlar */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <button
          onClick={async (e) => { e.stopPropagation(); setConverting(true); await onConvert(item); setConverting(false); }}
          disabled={converting}
          style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            border: '1px solid rgba(52,201,122,0.4)', background: 'rgba(52,201,122,0.1)', color: '#34c97a',
            fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap',
          }}
        >{converting ? '...' : '→ Dönüştür'}</button>
        <button className="btn-icon" onClick={e => { e.stopPropagation(); onEdit(item); }} style={{ padding: 4 }}><EditIcon /></button>
        <button className="btn-icon danger" onClick={e => { e.stopPropagation(); onDelete(item); }} style={{ padding: 4 }}><TrashIcon /></button>
      </div>
    </div>
  );
}

// ── Ana Sayfa ─────────────────────────────────────────────────────────────────
export default function SalesPage() {
  const navigate = useNavigate();
  const { data: allProjects = [], isLoading: loading } = useProjects();
  const potProjects = allProjects.filter(p => p.projectStatus === 'POTANSIYEL');
  const { data: personnel = [] }   = usePersonnel();
  const { data: products = [] }    = useProducts();
  const { data: units = [] }       = useOrganization();
  const { data: seniorities = [] } = useSeniorities();
  const invalidate                 = useInvalidate();

  const [selectedProject, setSelectedProject] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const personnelMap = Object.fromEntries(personnel.map(p => [String(p.id), p]));

  const handleConvert = async (project) => {
    await projectApi.update(project.id, { ...project, projectStatus: 'BASLADI' });
    navigate('/projects');
  };

  const handleDelete = async (item) => {
    await projectApi.delete(item.id);
    setDeleteConfirm(null);
    setSelectedProject(null);
    invalidate.projects();
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
          onUpdate={() => invalidate.projects()}
        />
        {editing && (
          <PotentialProjectModal
            project={editing?.id ? editing : null}
            personnel={personnel}
            onSave={() => { setEditing(null); invalidate.projects(); }}
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

      {/* Liste */}
      {potProjects.length === 0 ? (
        <div className="empty-state"><p>Potansiyel proje yok. "Yeni Proje" ile ekleyin veya projeler sayfasından "Potansiyele Taşı" butonunu kullanın.</p></div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {/* Başlık satırı */}
          <div style={{ display: 'flex', gap: 12, padding: '8px 14px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <span style={{ flex: '0 0 72px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>Durum</span>
            <span style={{ flex: '0 0 220px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>Proje</span>
            <span style={{ flex: '0 0 100px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>Olasılık</span>
            <span style={{ flex: '0 0 140px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', textAlign: 'right' }}>Bütçe</span>
            <span style={{ flex: '0 0 140px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', textAlign: 'right' }}>Tahminlenen</span>
            <span style={{ flex: '0 0 160px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>Tarih Aralığı</span>
          </div>
          {[...potProjects].sort((a, b) => (b.probability ?? 50) - (a.probability ?? 50)).map(item => (
            <ProjectRow
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
          onSave={() => { setEditing(null); invalidate.projects(); }}
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
