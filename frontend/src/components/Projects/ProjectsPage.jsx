import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { projectApi, personnelApi, productApi, organizationApi, seniorityApi, potentialSaleApi, projectTypeApi, projectCategoryApi } from '../../services/api';
import SearchableSelect from '../SearchableSelect';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                 'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const CURRENCIES = ['TL', 'USD', 'EUR', 'GBP', 'CHF'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 15 }, (_, i) => currentYear - 5 + i);

const fmt = (n) => (n || 0).toLocaleString('tr-TR');
const monthLabel = (m, y) => m && y ? `${MONTHS[m - 1]} ${y}` : '—';

// Binlik ayraçlı tutar input
function AmountInput({ value, onChange, placeholder = '0', style = {} }) {
  const toDisplay = (v) => (v !== '' && v !== null && v !== undefined && !isNaN(Number(v))) ? Number(v).toLocaleString('tr-TR') : '';
  const [display, setDisplay] = useState(toDisplay(value));

  // value dışarıdan değişince (modal açılınca vs.) güncelle
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

function EditIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function PlusIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function XIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function ArrowIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>; }

const MONTHS_SHORT = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

const PROJECT_STATUS_CFG = {
  POTANSIYEL:   { label: 'Potansiyel',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  BASLADI:      { label: 'Başladı',      color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  DEVAM_EDIYOR: { label: 'Devam Ediyor', color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  TAMAMLANDI:   { label: 'Tamamlandı',   color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
};

function fmtBudget(v) {
  if (v == null) return '—';
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(v) + ' ₺';
}

// ── Planning helpers (from PlanningPage) ─────────────────────────────────────
const MONTHS_PLAN = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const MONTHS_FULL = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const TYPES = ['need','planned','actual'];
const TYPE_LABELS = { need: 'İht', planned: 'Pln', actual: 'Grc' };
const TYPE_COLORS = { need: '#60a5fa', planned: '#a78bfa', actual: '#34d399' };

function getProjectMonths(project) {
  const months = [];
  let m = project.startMonth, y = project.startYear;
  while (y < project.endYear || (y === project.endYear && m <= project.endMonth)) {
    months.push({ month: m, year: y });
    m++; if (m > 12) { m = 1; y++; }
  }
  return months;
}

function fromDb(val, type) {
  if (val == null) return null;
  return type === 'actual' ? val : Math.round(val * 100);
}
function toDb(val, type) {
  if (val == null) return null;
  return type === 'actual' ? val : val / 100;
}

function getRateForMonth(rates, year, month) {
  if (!rates || rates.length === 0) return 0;
  for (const r of rates) {
    const afterStart = (year > r.startYear) || (year === r.startYear && month >= r.startMonth);
    const beforeEnd  = !r.endYear || (year < r.endYear) || (year === r.endYear && month <= r.endMonth);
    if (afterStart && beforeEnd) return r.amount || 0;
  }
  return 0;
}

function analyzeBudget(project, personnelMap, seniorityMap) {
  const now = new Date();
  const analysisMonth = now.getMonth() + 1;
  const analysisYear  = now.getFullYear();
  let plannedCost = 0;
  const monthlyCosts = {};
  for (const entry of (project.resourcePlan || [])) {
    if (entry.planned == null) continue;
    if (entry.year < analysisYear || (entry.year === analysisYear && entry.month < analysisMonth)) continue;
    if (entry.year > analysisYear) continue;
    const afterStart = (entry.year > project.startYear) || (entry.year === project.startYear && entry.month >= project.startMonth);
    const beforeEnd  = (entry.year < project.endYear)   || (entry.year === project.endYear   && entry.month <= project.endMonth);
    if (!afterStart || !beforeEnd) continue;
    const person = personnelMap[String(entry.personnelId)];
    if (!person) continue;
    const seniority = seniorityMap[String(person.seniorityId)];
    if (!seniority) continue;
    const rate = getRateForMonth(seniority.rates, entry.year, entry.month);
    const cost = rate * entry.planned;
    const key = `${entry.year}_${entry.month}`;
    monthlyCosts[key] = (monthlyCosts[key] || 0) + cost;
    plannedCost += cost;
  }
  const remainingBudget = project.remainingBudget || 0;
  const potentialSales  = project.potentialSales  || 0;
  const totalAvailable  = remainingBudget + potentialSales;
  const diff = totalAvailable - plannedCost;
  const hasData = remainingBudget > 0 || potentialSales > 0;
  let eksiyeAy = null;
  let cumCost = 0;
  for (let m = analysisMonth; m <= 12; m++) {
    cumCost += monthlyCosts[`${analysisYear}_${m}`] || 0;
    if (!eksiyeAy && cumCost > totalAvailable) {
      eksiyeAy = MONTHS_FULL[m - 1];
    }
  }
  const status = !hasData ? 'nodata' : diff >= 0 ? 'yeterli' : 'acik';
  return { status, diff, eksiyeAy, plannedCost, totalAvailable, potentialSales };
}

function BackIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>; }

// ── PctInput ─────────────────────────────────────────────────────────────────
function PctInput({ value, onChange, isModified }) {
  const [local, setLocal] = useState(value == null ? '' : String(value));
  useEffect(() => { setLocal(value == null ? '' : String(value)); }, [value]);
  const commit = () => {
    const raw = local.trim().replace('%', '');
    if (raw === '') { onChange(null); return; }
    const n = Number(raw);
    if (isNaN(n)) { setLocal(''); onChange(null); return; }
    onChange(Math.min(100, Math.max(0, n)));
  };
  const textColor = isModified ? '#fbbf24' : local ? 'var(--text-primary)' : 'var(--text-muted)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <input value={local} onChange={e => setLocal(e.target.value)} onBlur={commit} onFocus={e => e.target.select()}
        onKeyDown={e => { if (e.key === 'Enter') { commit(); e.target.blur(); } }}
        style={{ width: 28, height: 20, textAlign: 'center', fontSize: 11, background: 'transparent', border: 'none', outline: 'none', color: textColor, fontFamily: 'DM Mono, monospace', padding: 0 }}
        placeholder="—" />
      {local !== '' && <span style={{ fontSize: 9, color: isModified ? '#fbbf24' : 'var(--text-muted)', lineHeight: 1 }}>%</span>}
    </div>
  );
}

// ── Confirm modal for planning ───────────────────────────────────────────────
function ConfirmModalPlanning({ title, message, buttons, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose('cancel')}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 24, minWidth: 320, maxWidth: 420, fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{message}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {buttons.map(b => (
            <button key={b.key} className={b.primary ? 'btn btn-primary' : 'btn btn-ghost'}
              style={{ padding: '6px 16px', fontSize: 12 }}
              onClick={() => onClose(b.key)}>
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Bulk assignment modal ────────────────────────────────────────────────────
function BulkAssignModalPlanning({ person, project, onSave, onClose }) {
  const curY = new Date().getFullYear();
  const BYEARS = Array.from({ length: 10 }, (_, i) => curY - 2 + i);
  const [sM, setSM] = useState(project.startMonth);
  const [sY, setSY] = useState(project.startYear);
  const [eM, setEM] = useState(project.endMonth);
  const [eY, setEY] = useState(project.endYear);
  const [need, setNeed] = useState('');
  const [planned, setPlanned] = useState('');
  const [actual, setActual] = useState('');

  const handleSave = () => {
    const updates = {};
    let m = sM, y = sY;
    while (y < eY || (y === eY && m <= eM)) {
      updates[`${person.id}_${y}_${m}`] = {
        need:    need    !== '' ? Math.min(100, Math.max(0, Number(need)))    : undefined,
        planned: planned !== '' ? Math.min(100, Math.max(0, Number(planned))) : undefined,
        actual:  actual  !== '' ? Math.min(100, Math.max(0, Number(actual)))  : undefined,
      };
      m++; if (m > 12) { m = 1; y++; }
    }
    onSave(updates);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div className="modal-title">Toplu Atama — {person.firstName} {person.lastName}</div>
          <button className="btn-icon" onClick={onClose}><XIcon /></button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
          Seçilen periyot için değerleri girin. Boş alanlar değişmez.
        </p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {[['Başlangıç', sM, setSM, sY, setSY], ['Bitiş', eM, setEM, eY, setEY]].map(([lbl, mv, setMv, yv, setYv]) => (
            <div key={lbl} style={{ flex: 1 }}>
              <div className="form-label">{lbl}</div>
              <div className="month-year-row">
                <select className="form-select" value={mv} onChange={e => setMv(+e.target.value)}>
                  {MONTHS_FULL.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
                <select className="form-select" value={yv} onChange={e => setYv(+e.target.value)}>
                  {BYEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[['need', need, setNeed], ['planned', planned, setPlanned], ['actual', actual, setActual]].map(([type, val, setter]) => (
            <div key={type}>
              <div className="form-label" style={{ color: TYPE_COLORS[type] }}>{TYPE_LABELS[type]}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input className="form-input" value={val} onChange={e => setter(e.target.value)}
                  placeholder="—" style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace' }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>İptal</button>
          <button className="btn btn-primary" onClick={handleSave}>Uygula</button>
        </div>
      </div>
    </div>
  );
}

// ── Planning Tab (full PlanningGrid for project detail) ──────────────────────
function PlanningTab({ project, allPersonnel, units, seniorities, onReload }) {
  const now = new Date();
  const curYear  = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  const [localProject, setLocalProject] = useState(project);
  const [localPlan, setLocalPlan]       = useState({});
  const [originalPlan, setOriginalPlan] = useState({});
  const [saving, setSaving]             = useState(false);
  const [bulkPerson, setBulkPerson]     = useState(null);
  const [addingResource, setAddingResource] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const tableContainerRef = useRef(null);

  const unitMap = Object.fromEntries((units || []).map(u => [String(u.id), u]));
  const getPersonRoot = uid => {
    let u = unitMap[String(uid)];
    while (u?.parentId) u = unitMap[String(u.parentId)];
    return u;
  };

  useEffect(() => {
    const map = {};
    for (const e of (project.resourcePlan || [])) {
      map[`${e.personnelId}_${e.year}_${e.month}`] = {
        need:    fromDb(e.need,    'need'),
        planned: fromDb(e.planned, 'planned'),
        actual:  fromDb(e.actual,  'actual'),
      };
    }
    setLocalPlan(map);
    setOriginalPlan(map);
    setLocalProject(project);
  }, [project.id, project.resourcePlan]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const ms = getProjectMonths(project);
      const idx = ms.findIndex(m => m.year === curYear && m.month === curMonth);
      if (idx >= 0 && tableContainerRef.current) {
        tableContainerRef.current.scrollLeft = idx * 108;
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [project.id]);

  const months = getProjectMonths(localProject);
  const personnelIdSet = new Set((localProject.personnelIds || []).map(String));
  const plannedPersonIds = new Set(Object.keys(localPlan).map(k => k.split('_')[0]));
  const allGridPersonIds = new Set([...personnelIdSet, ...plannedPersonIds]);
  const personMap = Object.fromEntries(allPersonnel.map(p => [String(p.id), p]));

  const sortName = (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'tr');

  const allPeople = [...allGridPersonIds].map(id => personMap[id]).filter(Boolean);
  const isDısKaynak = person => {
    if (!person.unitId) return true;
    const root = getPersonRoot(person.unitId);
    return root?.name?.toLowerCase().includes('dış kaynak') || false;
  };
  const isPlannedWithoutNeed = person => {
    const s = String(person.id);
    const keys = Object.keys(localPlan).filter(k => k.startsWith(`${s}_`));
    return keys.some(k => {
      const v = localPlan[k];
      return (v.need == null || v.need === 0) && v.planned != null && v.planned > 0;
    });
  };
  const hasAnyNeed = person => {
    const s = String(person.id);
    const keys = Object.keys(localPlan).filter(k => k.startsWith(`${s}_`));
    return keys.some(k => localPlan[k].need != null && localPlan[k].need > 0);
  };

  const internal       = allPeople.filter(p => !isDısKaynak(p));
  const projeDışıAll   = internal.filter(p => isPlannedWithoutNeed(p));
  const grpEnstitu     = internal.filter(p => !isPlannedWithoutNeed(p)).sort(sortName);
  const grpPDKullanılan = projeDışıAll.filter(p => hasAnyNeed(p)).sort(sortName);
  const grpProjeDışı   = projeDışıAll.filter(p => !hasAnyNeed(p)).sort(sortName);
  const grpDış         = allPeople.filter(p => isDısKaynak(p)).sort(sortName);

  const getVal = (pid, y, m, type) => localPlan[`${pid}_${y}_${m}`]?.[type] ?? null;
  const isModified = (pid, y, m, type) => {
    const key = `${pid}_${y}_${m}`;
    const orig = originalPlan[key]?.[type] ?? null;
    const curr = localPlan[key]?.[type] ?? null;
    return orig !== curr;
  };

  const setVal = async (pid, y, m, type, val) => {
    const key = `${pid}_${y}_${m}`;
    setLocalPlan(prev => ({ ...prev, [key]: { ...prev[key], [type]: val } }));
    const updatedEntry = { ...localPlan[key], [type]: val };
    const resourcePlan = [];
    const allEntries = { ...localPlan, [key]: updatedEntry };
    for (const [k, vals] of Object.entries(allEntries)) {
      const [p, yr, mo] = k.split('_');
      if (vals.need != null || vals.planned != null || vals.actual != null) {
        resourcePlan.push({ personnelId: p, year: +yr, month: +mo, need: toDb(vals.need,'need'), planned: toDb(vals.planned,'planned'), actual: toDb(vals.actual,'actual') });
      }
    }
    try { await projectApi.updateResourcePlan(localProject.id, resourcePlan); } catch (e) { console.error('Auto-save failed', e); }
  };

  const handleBulkSave = async updates => {
    const newPlan = { ...localPlan };
    for (const [key, vals] of Object.entries(updates)) {
      newPlan[key] = { ...newPlan[key] };
      if (vals.need    !== undefined) newPlan[key].need    = vals.need;
      if (vals.planned !== undefined) newPlan[key].planned = vals.planned;
      if (vals.actual  !== undefined) newPlan[key].actual  = vals.actual;
    }
    setLocalPlan(newPlan);
    setBulkPerson(null);
    const resourcePlan = [];
    for (const [k, vals] of Object.entries(newPlan)) {
      const [p, yr, mo] = k.split('_');
      if (vals.need != null || vals.planned != null || vals.actual != null) {
        resourcePlan.push({ personnelId: p, year: +yr, month: +mo, need: toDb(vals.need,'need'), planned: toDb(vals.planned,'planned'), actual: toDb(vals.actual,'actual') });
      }
    }
    try { await projectApi.updateResourcePlan(localProject.id, resourcePlan); } catch (e) { console.error('Bulk auto-save failed', e); }
  };

  const handleAddResource = async personId => {
    const newIds = [...personnelIdSet, String(personId)];
    await projectApi.updatePersonnel(localProject.id, [...newIds]);
    setLocalProject(prev => ({ ...prev, personnelIds: [...newIds] }));
    setAddingResource(false);
  };

  const handleDeleteResource = async person => {
    const pid = String(person.id);
    const newIds = [...personnelIdSet].filter(id => id !== pid);
    const newPlan = { ...localPlan };
    for (const key of Object.keys(newPlan)) {
      if (key.startsWith(`${pid}_`)) delete newPlan[key];
    }
    setLocalPlan(newPlan);
    setLocalProject(prev => ({ ...prev, personnelIds: newIds }));
    setDeleteConfirm(null);
    try {
      await projectApi.updatePersonnel(localProject.id, newIds);
      const resourcePlan = [];
      for (const [k, vals] of Object.entries(newPlan)) {
        const [p, yr, mo] = k.split('_');
        if (vals.need != null || vals.planned != null || vals.actual != null) {
          resourcePlan.push({ personnelId: p, year: +yr, month: +mo, need: toDb(vals.need,'need'), planned: toDb(vals.planned,'planned'), actual: toDb(vals.actual,'actual') });
        }
      }
      await projectApi.updateResourcePlan(localProject.id, resourcePlan);
    } catch (e) { console.error('Delete resource failed', e); }
  };

  const availablePersonnel = allPersonnel
    .filter(p => !allGridPersonIds.has(String(p.id)))
    .sort(sortName);

  const monthlyTotals = months.map(({ month, year }) => {
    let t = 0;
    for (const id of allGridPersonIds) {
      const v = localPlan[`${id}_${year}_${month}`]?.planned;
      if (v != null) t += v / 100;
    }
    return t;
  });

  const NAME_W = 190;
  const COL_W  = 36;
  const hasPersonnel = allGridPersonIds.size > 0;

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {TYPES.map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLORS[t] }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t === 'need' ? 'İhtiyaç' : t === 'planned' ? 'Planlanan' : 'Gerçekleşen'}</span>
          </div>
        ))}
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{allGridPersonIds.size} kaynak</span>
        {saving && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Kaydediliyor...</span>}
      </div>

      {/* Add resource bar */}
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        {addingResource ? (
          <>
            <SearchableSelect
              options={availablePersonnel.map(p => ({ value: p.id, label: `${p.firstName} ${p.lastName}` }))}
              value="" onChange={handleAddResource} placeholder="Personel seçin..." style={{ minWidth: 240 }} />
            <button onClick={() => setAddingResource(false)} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-hover)', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif' }}>İptal</button>
          </>
        ) : (
          <button onClick={() => setAddingResource(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 5, border: '1px dashed var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif' }}>
            <PlusIcon /> Kaynak Ekle
          </button>
        )}
      </div>

      {/* Table */}
      <div ref={tableContainerRef} style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11, minWidth: 'max-content' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              <th style={{ width: NAME_W, minWidth: NAME_W, position: 'sticky', left: 0, zIndex: 3, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', borderRight: '2px solid var(--border)', padding: '7px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Kaynak
              </th>
              {months.map(({ month, year }) => {
                const isCur = year === curYear && month === curMonth;
                return (
                  <th key={`${year}_${month}`} colSpan={3}
                    style={{ padding: '6px 4px', textAlign: 'center', minWidth: COL_W * 3, borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)',
                      color: isCur ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: isCur ? 700 : 600, whiteSpace: 'nowrap', fontSize: 11,
                      background: isCur ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)' }}>
                    {MONTHS_PLAN[month-1]} {year}
                    {isCur && <div style={{ fontSize: 9, color: 'var(--accent)', marginTop: 1, lineHeight: 1 }}>▲</div>}
                  </th>
                );
              })}
            </tr>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              <th style={{ position: 'sticky', left: 0, zIndex: 3, background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)', borderRight: '2px solid var(--border)', minWidth: NAME_W }} />
              {months.map(({ month, year }) => {
                const isCur = year === curYear && month === curMonth;
                return TYPES.map(type => (
                  <th key={`${year}_${month}_${type}`}
                    style={{ padding: '3px 2px', textAlign: 'center', width: COL_W, borderBottom: '2px solid var(--border)',
                      borderLeft: type === 'need' ? '1px solid var(--border)' : 'none',
                      color: TYPE_COLORS[type], fontSize: 10, fontWeight: 600,
                      background: isCur ? 'rgba(99,102,241,0.06)' : 'var(--bg-secondary)' }}>
                    {TYPE_LABELS[type]}
                  </th>
                ));
              })}
            </tr>
          </thead>
          <tbody>
            {!hasPersonnel ? (
              <tr><td colSpan={months.length * 3 + 1} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Henüz kaynak eklenmemiş.</td></tr>
            ) : (
              [
                { key: 'enstitu',       label: 'Siber Güvenlik Enstitüsü',       people: grpEnstitu,      nameColor: 'var(--text-primary)' },
                { key: 'pdKullanilan',  label: 'Proje Dışı Kullanılan Kaynaklar', people: grpPDKullanılan, nameColor: '#a78bfa' },
                { key: 'projeDisi',     label: 'Proje Dışı Kaynaklar',            people: grpProjeDışı,   nameColor: '#fbbf24' },
                { key: 'dis',           label: 'Dış Kaynaklar',                   people: grpDış,         nameColor: '#f87171' },
              ].flatMap(grp => {
                if (grp.people.length === 0) return [];
                return [
                  <tr key={`grp_${grp.key}`}>
                    <td style={{ position: 'sticky', left: 0, zIndex: 2, padding: '8px 12px', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: grp.nameColor, background: 'var(--bg-card)', borderTop: '2px solid var(--border)', borderBottom: '1px solid var(--border)', borderRight: '2px solid var(--border)', whiteSpace: 'nowrap', minWidth: NAME_W }}>
                      {grp.label} ({grp.people.length})
                    </td>
                    <td colSpan={months.length * 3} style={{ background: 'rgba(255,255,255,0.06)', borderTop: '2px solid var(--border)', borderBottom: '1px solid var(--border)' }} />
                  </tr>,
                  ...grp.people.map((person, pi) => (
                    <tr key={person.id} style={{ borderBottom: '1px solid var(--border)', background: pi % 2 === 0 ? 'transparent' : 'var(--bg-hover)' }}>
                      <td style={{ padding: '3px 12px', position: 'sticky', left: 0, zIndex: 1, background: pi % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)', borderRight: '2px solid var(--border)', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontWeight: 500, fontSize: 12, color: grp.nameColor }}>{person.firstName} {person.lastName}</span>
                          <button onClick={() => setBulkPerson(person)} title="Toplu atama"
                            style={{ padding: '1px 5px', fontSize: 9, background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 3, cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif', flexShrink: 0 }}>
                            Toplu
                          </button>
                          <button onClick={() => setDeleteConfirm(person)} title="Kaynağı sil"
                            style={{ padding: '1px 5px', fontSize: 9, background: 'transparent', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 3, cursor: 'pointer', color: '#f87171', fontFamily: 'DM Sans, sans-serif', flexShrink: 0 }}>
                            Sil
                          </button>
                        </div>
                      </td>
                      {months.map(({ month, year }) => {
                        const isCur = year === curYear && month === curMonth;
                        return TYPES.map(type => {
                          const v = getVal(person.id, year, month, type);
                          const modified = isModified(person.id, year, month, type);
                          return (
                            <td key={`${year}_${month}_${type}`}
                              style={{ padding: '1px 0', textAlign: 'center',
                                borderLeft: type === 'need' ? '1px solid var(--border)' : 'none',
                                background: modified ? 'rgba(251,191,36,0.12)' : v != null ? `${TYPE_COLORS[type]}1a` : isCur ? 'rgba(99,102,241,0.03)' : 'transparent' }}>
                              <PctInput value={v} onChange={val => setVal(person.id, year, month, type, val)} isModified={modified} />
                            </td>
                          );
                        });
                      })}
                    </tr>
                  )),
                ];
              })
            )}

            {/* Monthly adam-ay totals row */}
            {hasPersonnel && (
              <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <td style={{ padding: '5px 12px', position: 'sticky', left: 0, zIndex: 1, background: 'var(--bg-secondary)', borderRight: '2px solid var(--border)', fontWeight: 600, fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  Toplam (Adam-Ay)
                </td>
                {months.map(({ month, year }, idx) =>
                  TYPES.map(type => (
                    <td key={`tot_${year}_${month}_${type}`}
                      style={{ padding: '5px 2px', textAlign: 'center',
                        borderLeft: type === 'need' ? '1px solid var(--border)' : 'none',
                        fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 600,
                        color: type === 'planned' ? (monthlyTotals[idx] > 0 ? '#a78bfa' : 'var(--text-muted)') : 'transparent' }}>
                      {type === 'planned' ? (monthlyTotals[idx] > 0 ? monthlyTotals[idx].toFixed(2).replace('.', ',') : '—') : ''}
                    </td>
                  ))
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {bulkPerson && (
        <BulkAssignModalPlanning person={bulkPerson} project={localProject} onSave={handleBulkSave} onClose={() => setBulkPerson(null)} />
      )}

      {deleteConfirm && (
        <ConfirmModalPlanning
          title="Kaynağı Sil"
          message={`${deleteConfirm.firstName} ${deleteConfirm.lastName} kaynağını ve tüm planlama verilerini silmek istediğinize emin misiniz?`}
          buttons={[
            { key: 'no', label: 'Hayır' },
            { key: 'yes', label: 'Evet', primary: true },
          ]}
          onClose={action => {
            if (action === 'yes') handleDeleteResource(deleteConfirm);
            else setDeleteConfirm(null);
          }}
        />
      )}
    </div>
  );
}

// ── Project card with budget analysis coloring ───────────────────────────────
function ProjectCard({ project, personnel, personnelMap, seniorityMap, categoryMap = {}, stepMap = {}, onClick, onEdit, onDelete, onMoveToPotensiyal }) {
  const mgr = personnel.find(p => String(p.id) === String(project.projectManagerId));
  const analysis = (personnelMap && seniorityMap) ? analyzeBudget(project, personnelMap, seniorityMap) : { status: 'nodata' };
  const isAcik = analysis.status === 'acik';
  const [hovered, setHovered] = useState(false);
  const [moving, setMoving] = useState(false);

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '14px 16px', borderRadius: 8, cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s',
        border: `${isAcik ? '2px' : '1px'} solid ${hovered ? 'var(--accent)' : isAcik ? '#f87171' : 'var(--border)'}`,
        background: isAcik ? 'rgba(248,113,113,0.08)' : 'var(--bg-card)',
        boxShadow: hovered ? '0 2px 14px rgba(99,102,241,0.12)' : isAcik ? '0 0 0 1px rgba(248,113,113,0.25)' : 'none',
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', flex: 1 }}>{project.name}</div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
          {isAcik && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(248,113,113,0.2)', color: '#f87171', whiteSpace: 'nowrap' }}>
              {analysis.eksiyeAy || 'Açık'}
            </span>
          )}
          <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
            <button className="btn-icon" onClick={() => onEdit(project)} title="Düzenle" style={{ padding: 3 }}><EditIcon /></button>
            <button className="btn-icon danger" onClick={() => onDelete(project)} title="Sil" style={{ padding: 3 }}><TrashIcon /></button>
          </div>
        </div>
      </div>
      {/* Category + Status badges */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        {PROJECT_STATUS_CFG[project.projectStatus] && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: PROJECT_STATUS_CFG[project.projectStatus].bg,
            color: PROJECT_STATUS_CFG[project.projectStatus].color,
          }}>{PROJECT_STATUS_CFG[project.projectStatus].label}</span>
        )}
        {project.categoryId && categoryMap[project.categoryId] && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: `${categoryMap[project.categoryId].color || 'var(--accent)'}22`,
            color: categoryMap[project.categoryId].color || 'var(--accent)',
          }}>{categoryMap[project.categoryId].name}</span>
        )}
        {project.currentStepId && stepMap[project.currentStepId] && (
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
            background: 'var(--bg-hover)', color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}>{stepMap[project.currentStepId].label}</span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
        <div style={{ fontSize: 11 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Proje Yöneticisi: </span>
          <span style={{ color: mgr ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: mgr ? 500 : 400 }}>
            {mgr ? `${mgr.firstName} ${mgr.lastName}` : '-'}
          </span>
        </div>
        <div style={{ fontSize: 11 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Müşteri: </span>
          <span style={{ color: project.customerName ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: project.customerName ? 500 : 400 }}>
            {project.customerName || '-'}
          </span>
        </div>
        {project.budget != null && (
          <div style={{ fontSize: 11 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Bütçe: </span>
            <span style={{ color: '#34d399', fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>{fmtBudget(project.budget)}</span>
          </div>
        )}
        <div style={{ fontSize: 11 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Kalan: </span>
          <span style={{ color: '#f97316', fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>{fmtBudget(project.remainingBudget)}</span>
        </div>
        {project.potentialSales > 0 && (
          <div style={{ fontSize: 11 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Potansiyel: </span>
            <span style={{ color: '#22c55e', fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>{fmtBudget(project.potentialSales)}</span>
          </div>
        )}
        <div style={{ fontSize: 11 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Dönem: </span>
          <span style={{ color: 'var(--text-primary)' }}>{MONTHS_SHORT[project.startMonth-1]} {project.startYear} – {MONTHS_SHORT[project.endMonth-1]} {project.endYear}</span>
        </div>
      </div>
      {/* Potansiyele Taşı butonu */}
      {onMoveToPotensiyal && (
        <div onClick={e => e.stopPropagation()} style={{ marginTop: 10 }}>
          <button
            disabled={moving}
            onClick={async () => { setMoving(true); await onMoveToPotensiyal(project); setMoving(false); }}
            style={{
              width: '100%', padding: '6px 0', borderRadius: 6, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', border: '1px solid var(--border)',
              background: 'var(--bg-secondary)', color: 'var(--text-muted)',
              fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.color = '#f59e0b'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            {moving ? 'Taşınıyor...' : '↩ Potansiyele Taşı'}
          </button>
        </div>
      )}
    </div>
  );
}

function EmySectionProjects({ name, projects, personnel, personnelMap, seniorityMap, categoryMap, stepMap, onSelectProject, onEdit, onDelete, onMoveToPotensiyal, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 8, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--bg-secondary)', cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontSize: 11, color: 'var(--accent)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▶</span>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{name}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{projects.length} proje</span>
      </div>
      {open && (
        <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 10 }}>
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} personnel={personnel} personnelMap={personnelMap} seniorityMap={seniorityMap}
              categoryMap={categoryMap} stepMap={stepMap}
              onClick={() => onSelectProject(p)}
              onEdit={onEdit}
              onDelete={onDelete}
              onMoveToPotensiyal={onMoveToPotensiyal}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MonthYearSelect({ month, year, onMonthChange, onYearChange, allowEmpty }) {
  return (
    <div className="month-year-row">
      <select className="form-select" value={month || ''} onChange={e => onMonthChange(e.target.value ? +e.target.value : null)}>
        {allowEmpty && <option value="">Ay</option>}
        {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
      </select>
      <select className="form-select" value={year || ''} onChange={e => onYearChange(e.target.value ? +e.target.value : null)}>
        {allowEmpty && <option value="">Yıl</option>}
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

// ── PROJE FORMU MODALI ──────────────────────────────────────────
function ProjectModal({ project, personnel, projectTypes = [], categories = [], onSave, onClose }) {
  const isEdit = !!project;
  const [units, setUnits] = useState([]);
  const [workflowSteps, setWorkflowSteps] = useState([]);
  const [form, setForm] = useState(project ? {
    name: project.name, customerName: project.customerName || '',
    startMonth: project.startMonth, startYear: project.startYear,
    endMonth: project.endMonth, endYear: project.endYear,
    budget: project.budget, budgetCurrency: project.budgetCurrency,
    projectManagerId: project.projectManagerId || '',
    techLeadId: project.techLeadId || '',
    unitId: project.unitId || '',
    projectType: project.projectType || '',
    categoryId: project.categoryId || '',
    currentStepId: project.currentStepId || '',
    projectStatus: project.projectStatus || 'BASLADI',
    probability: project.probability ?? 50,
  } : {
    name: '', customerName: '',
    startMonth: new Date().getMonth()+1, startYear: currentYear,
    endMonth: new Date().getMonth()+1, endYear: currentYear+1,
    budget: '', budgetCurrency: 'TRY', projectManagerId: '', techLeadId: '',
    unitId: '', projectType: '', categoryId: '', currentStepId: '',
    projectStatus: 'BASLADI', probability: 50,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [dateWarnCount, setDateWarnCount] = useState(0);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    import('../../services/api').then(({ organizationApi }) => {
      organizationApi.getAll().then(res => setUnits(res.data));
    });
  }, []);

  // Load workflow steps when category changes
  useEffect(() => {
    if (!form.categoryId) { setWorkflowSteps([]); return; }
    projectCategoryApi.getWorkflow(form.categoryId)
      .then(res => setWorkflowSteps(res.data || []))
      .catch(() => setWorkflowSteps([]));
  }, [form.categoryId]);

  const rootUnits = units.filter(u => !u.parentId);

  const doSave = async (deleteOutOfRange) => {
    setError(''); setSaving(true);
    try {
      const payload = {
        ...form,
        budget: Number(form.budget) || 0,
        projectManagerId: form.projectManagerId || null,
        techLeadId: form.techLeadId || null,
        unitId: form.unitId || null,
      };
      await (isEdit ? projectApi.update(project.id, payload) : projectApi.create(payload));
      if (deleteOutOfRange && isEdit) {
        const filtered = (project.resourcePlan || []).filter(entry => {
          const afterStart = (entry.year > form.startYear) || (entry.year === form.startYear && entry.month >= form.startMonth);
          const beforeEnd  = (entry.year < form.endYear)   || (entry.year === form.endYear   && entry.month <= form.endMonth);
          return afterStart && beforeEnd;
        });
        await projectApi.updateResourcePlan(project.id, filtered);
      }
      onSave();
    } catch(e) { setError(e.response?.data?.error || 'Bir hata oluştu.'); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Proje adı zorunludur.');
    if (isEdit) {
      const dateChanged =
        form.startYear !== project.startYear || form.startMonth !== project.startMonth ||
        form.endYear   !== project.endYear   || form.endMonth   !== project.endMonth;
      if (dateChanged) {
        const outOfRange = (project.resourcePlan || []).filter(entry => {
          const afterStart = (entry.year > form.startYear) || (entry.year === form.startYear && entry.month >= form.startMonth);
          const beforeEnd  = (entry.year < form.endYear)   || (entry.year === form.endYear   && entry.month <= form.endMonth);
          return !(afterStart && beforeEnd);
        });
        if (outOfRange.length > 0) {
          setDateWarnCount(outOfRange.length);
          return;
        }
      }
    }
    doSave(false);
  };

  if (dateWarnCount > 0) {
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ maxWidth: 440 }}>
          <div className="modal-header">
            <div className="modal-title">Tarih Aralığı Değişti</div>
          </div>
          <div style={{ padding: '16px 20px', color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.6 }}>
            Yeni tarih aralığı dışında kalan <strong>{dateWarnCount}</strong> kaynak planı girişi var.
            Bu girişler silinecektir. Devam etmek istiyor musunuz?
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setDateWarnCount(0)}>İptal</button>
            <button className="btn btn-danger" onClick={() => { setDateWarnCount(0); doSave(true); }}>Evet, Sil ve Kaydet</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Proje Düzenle' : 'Yeni Proje'}</div>
          <button className="btn-icon" onClick={onClose}><XIcon /></button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Proje Adı</label>
            <input className="form-input" autoFocus placeholder="Proje adı" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Müşteri Adı</label>
            <input className="form-input" placeholder="Müşteri adı" value={form.customerName} onChange={e => set('customerName', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Proje Tipi</label>
            <SearchableSelect
              value={form.projectType || ''}
              onChange={v => set('projectType', v)}
              placeholder="— Seçilmedi —"
              style={{ width: '100%' }}
              options={[
                { value: '', label: '— Seçilmedi —' },
                ...projectTypes.map(t => ({ value: t.id, label: t.name })),
              ]}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Kategori</label>
            <SearchableSelect
              value={form.categoryId || ''}
              onChange={v => { set('categoryId', v); set('currentStepId', ''); }}
              placeholder="— Seçilmedi —"
              style={{ width: '100%' }}
              options={[
                { value: '', label: '— Seçilmedi —' },
                ...categories.map(c => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
        </div>
        {/* Yaşam döngüsü statüsü */}
        <div className="form-group">
          <label className="form-label">Proje Aşaması</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(PROJECT_STATUS_CFG).map(([key, cfg]) => (
              <button key={key} type="button" onClick={() => set('projectStatus', key)} style={{
                padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                border: `2px solid ${form.projectStatus === key ? cfg.color : 'var(--border)'}`,
                background: form.projectStatus === key ? cfg.bg : 'var(--bg-secondary)',
                color: form.projectStatus === key ? cfg.color : 'var(--text-muted)',
                fontFamily: 'DM Sans, sans-serif',
              }}>{cfg.label}</button>
            ))}
          </div>
        </div>
        {/* Olasılık — sadece POTANSIYEL'de */}
        {form.projectStatus === 'POTANSIYEL' && (
          <div className="form-group">
            <label className="form-label">Gerçekleşme Olasılığı: <strong style={{ color: 'var(--accent)' }}>%{form.probability}</strong></label>
            <input type="range" min={0} max={100} step={5} value={form.probability}
              onChange={e => set('probability', Number(e.target.value))}
              style={{ width: '100%' }} />
          </div>
        )}
        {workflowSteps.length > 0 && (
          <div className="form-group">
            <label className="form-label">İş Akışı Adımı</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {workflowSteps.map(step => (
                <button key={step.id} onClick={() => set('currentStepId', step.id)} style={{
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  border: `2px solid ${form.currentStepId === step.id ? (categories.find(c => c.id === form.categoryId)?.color || 'var(--accent)') : 'var(--border)'}`,
                  background: form.currentStepId === step.id ? `${categories.find(c => c.id === form.categoryId)?.color || 'var(--accent)'}22` : 'var(--bg-secondary)',
                  color: form.currentStepId === step.id ? (categories.find(c => c.id === form.categoryId)?.color || 'var(--accent)') : 'var(--text-muted)',
                  fontFamily: 'DM Sans, sans-serif',
                }}>{step.label}</button>
              ))}
            </div>
          </div>
        )}
        <div className="form-row" style={{ marginBottom: 16 }}>
          <div>
            <div className="form-label">Başlangıç Tarihi</div>
            <MonthYearSelect month={form.startMonth} year={form.startYear}
              onMonthChange={v => set('startMonth', v)} onYearChange={v => set('startYear', v)} />
          </div>
          <div>
            <div className="form-label">Bitiş Tarihi</div>
            <MonthYearSelect month={form.endMonth} year={form.endYear}
              onMonthChange={v => set('endMonth', v)} onYearChange={v => set('endYear', v)} />
          </div>
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
        <hr className="section-divider" />
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Proje Yöneticisi <span style={{color:'var(--text-muted)',fontWeight:400}}>(opsiyonel)</span></label>
            <SearchableSelect
              value={form.projectManagerId || ''}
              onChange={v => set('projectManagerId', v)}
              placeholder="— Seçilmedi —"
              style={{ width: '100%' }}
              options={[
                { value: '', label: '— Seçilmedi —' },
                ...personnel.map(p => ({ value: String(p.id), label: `${p.firstName} ${p.lastName}` })),
              ]}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Teknik Lider <span style={{color:'var(--text-muted)',fontWeight:400}}>(opsiyonel)</span></label>
            <SearchableSelect
              value={form.techLeadId || ''}
              onChange={v => set('techLeadId', v)}
              placeholder="— Seçilmedi —"
              style={{ width: '100%' }}
              options={[
                { value: '', label: '— Seçilmedi —' },
                ...personnel.map(p => ({ value: String(p.id), label: `${p.firstName} ${p.lastName}` })),
              ]}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">EMY (Üst Birim)</label>
          <SearchableSelect
            value={form.unitId || ''}
            onChange={v => set('unitId', v)}
            placeholder="— Seçilmedi —"
            style={{ width: '100%' }}
            options={[
              { value: '', label: '— Seçilmedi —' },
              ...rootUnits.map(u => ({ value: String(u.id), label: u.name })),
            ]}
          />
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

// ── TAB 1: PERSONEL ─────────────────────────────────────────────
function PersonnelTab({ project, allPersonnel, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const assigned = project.personnelIds || [];
  const assignedSet = new Set(assigned);

  const toggle = async (personId, add) => {
    setSaving(true);
    const newIds = add ? [...assigned, personId] : assigned.filter(id => id !== personId);
    try {
      await projectApi.updatePersonnel(project.id, newIds);
      await onUpdate();
    } finally { setSaving(false); }
  };

  const assignedPersonnel = allPersonnel.filter(p => assignedSet.has(p.id));
  const available = allPersonnel.filter(p => !assignedSet.has(p.id));

  return (
    <div>
      {assignedPersonnel.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 10 }}>
            Projede Çalışan ({assignedPersonnel.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {assignedPersonnel.map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'var(--bg-secondary)', borderRadius:8, border:'1px solid var(--border)' }}>
                <span style={{ fontWeight: 500 }}>{p.firstName} {p.lastName}</span>
                <button className="btn-icon danger" disabled={saving} onClick={() => toggle(p.id, false)}><TrashIcon /></button>
              </div>
            ))}
          </div>
        </div>
      )}
      {available.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 10 }}>
            Eklenebilir Personel
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {available.map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'var(--bg-card)', borderRadius:8, border:'1px dashed var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{p.firstName} {p.lastName}</span>
                <button className="btn btn-ghost" style={{ padding:'4px 10px', fontSize:12 }} disabled={saving} onClick={() => toggle(p.id, true)}>
                  <PlusIcon /> Ekle
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {allPersonnel.length === 0 && <div className="empty-state"><p>Henüz personel tanımlanmamış.</p></div>}
    </div>
  );
}

// ── TAB 2: ÖDEME PLANI ──────────────────────────────────────────
function CompletePaymentModal({ item, onConfirm, onCancel }) {
  const [month, setMonth] = useState(item.plannedMonth || (new Date().getMonth()+1));
  const [year, setYear] = useState(item.plannedYear || currentYear);
  const [amount, setAmount] = useState(item.amount || 0);

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <div className="modal-title">Ödeme Tamamlandı</div>
          <button className="btn-icon" onClick={onCancel}><XIcon /></button>
        </div>
        <p style={{ color:'var(--text-secondary)', fontSize:13, marginBottom:20 }}>
          <strong style={{ color:'var(--text-primary)' }}>{item.name}</strong> ödemesini tamamlanmış olarak işaretleyin.
        </p>
        <div className="form-group">
          <label className="form-label">Gerçekleşen Tarih</label>
          <MonthYearSelect month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />
        </div>
        <div className="form-group">
          <label className="form-label">Gerçekleşen Tutar</label>
          <div style={{ display:'flex', gap:8 }}>
            <AmountInput value={amount} onChange={setAmount} style={{ flex:1 }} />
            <div style={{ padding:'9px 12px', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:6, fontSize:13, color:'var(--text-secondary)', whiteSpace:'nowrap' }}>
              {item.currency}
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onCancel}>İptal</button>
          <button className="btn btn-primary" onClick={() => onConfirm({ actualMonth: month, actualYear: year, actualAmount: Number(amount)||0 })}>
            Tamamlandı Olarak İşaretle
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentTab({ project, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const emptyPayment = () => ({
    id: crypto.randomUUID(), name: '', amount: '',
    currency: project.budgetCurrency || 'TL',
    plannedMonth: new Date().getMonth()+1, plannedYear: currentYear,
    actualMonth: null, actualYear: null, actualAmount: null,
  });

  const [form, setForm] = useState(emptyPayment());
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setEditing(null); setForm(emptyPayment()); setShowForm(true); };
  const openEdit = (item) => { setEditing(item); setForm({ ...item, amount: item.amount, actualAmount: item.actualAmount ?? '' }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await projectApi.getById(project.id);
      const freshItems = res.data.paymentPlan || [];
      const completed = !!(form.actualMonth && form.actualYear && form.actualAmount !== '' && form.actualAmount !== null);
      const newItem = {
        ...form,
        amount: Number(form.amount) || 0,
        actualAmount: completed ? (Number(form.actualAmount) || 0) : null,
        actualMonth: completed ? form.actualMonth : null,
        actualYear: completed ? form.actualYear : null,
        completed,
      };
      const newItems = editing
        ? freshItems.map(i => i.id === editing.id ? newItem : i)
        : [...freshItems, newItem];
      await projectApi.updatePaymentPlan(project.id, newItems);
      setShowForm(false);
      await onUpdate();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      const res = await projectApi.getById(project.id);
      const freshItems = (res.data.paymentPlan || []).filter(i => i.id !== id);
      await projectApi.updatePaymentPlan(project.id, freshItems);
      setDeleteId(null);
      await onUpdate();
    } finally { setSaving(false); }
  };

  const items = project.paymentPlan || [];
  const plannedTotal = items.reduce((s, i) => s+(i.amount||0), 0);
  const actualTotal = items.filter(i => i.completed).reduce((s, i) => s+(i.actualAmount||0), 0);

  return (
    <div>
      <div style={{ display:'flex', gap:24, marginBottom:20, padding:'14px 18px', background:'var(--bg-secondary)', borderRadius:8, border:'1px solid var(--border)', flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>Proje Bütçesi</div>
          <div style={{ fontWeight:700, color:'var(--accent)' }}>{fmt(project.budget)} {project.budgetCurrency}</div>
        </div>
        <div style={{ width:1, background:'var(--border)' }} />
        <div>
          <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>Planlanan Toplam</div>
          <div style={{ fontWeight:700, color: plannedTotal>project.budget ? 'var(--danger)' : 'var(--success)' }}>
            {fmt(plannedTotal)} {project.budgetCurrency}
            {plannedTotal!==project.budget && <span style={{ fontSize:11, fontWeight:400, marginLeft:6, color:'var(--danger)' }}>(bütçeyle eşleşmiyor)</span>}
          </div>
        </div>
        <div style={{ width:1, background:'var(--border)' }} />
        <div>
          <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>Gerçekleşen</div>
          <div style={{ fontWeight:700, color:'var(--success)' }}>{fmt(actualTotal)} {project.budgetCurrency}</div>
        </div>
        <div style={{ flex:1 }} />
        <button className="btn btn-primary" onClick={openNew}><PlusIcon /> Ödeme Kalemi Ekle</button>
      </div>

      {showForm && (
        <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:10, padding:20, marginBottom:20 }}>
          <div style={{ fontWeight:600, marginBottom:14 }}>{editing ? 'Kalemi Düzenle' : 'Yeni Ödeme Kalemi'}</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Açıklama</label>
              <input className="form-input" autoFocus placeholder="Ödeme açıklaması" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-row" style={{ marginBottom:0 }}>
              <div className="form-group">
                <label className="form-label">Planlanan Tutar</label>
                <AmountInput value={form.amount} onChange={v => set('amount', v)} />
              </div>
              <div className="form-group">
                <label className="form-label">Para Birimi</label>
                <select className="form-select" value={form.currency} onChange={e => set('currency', e.target.value)}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="form-row">
            <div>
              <label className="form-label">Planlanan Tarih</label>
              <MonthYearSelect month={form.plannedMonth} year={form.plannedYear}
                onMonthChange={v => set('plannedMonth', v)} onYearChange={v => set('plannedYear', v)} />
            </div>
            <div></div>
          </div>

          <hr className="section-divider" />
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 }}>
            Gerçekleşen Ödeme <span style={{ fontWeight:400, textTransform:'none', fontSize:11 }}>(doldurulursa tamamlandı sayılır)</span>
          </div>
          <div className="form-row">
            <div>
              <label className="form-label">Gerçekleşen Tarih</label>
              <MonthYearSelect month={form.actualMonth} year={form.actualYear} allowEmpty
                onMonthChange={v => set('actualMonth', v)} onYearChange={v => set('actualYear', v)} />
            </div>
            <div className="form-group">
              <label className="form-label">Gerçekleşen Tutar</label>
              <AmountInput value={form.actualAmount ?? ''} onChange={v => set('actualAmount', v)} />
            </div>
          </div>

          <div className="form-actions" style={{ marginTop:12, paddingTop:12 }}>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>İptal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Kaydediliyor...' : editing ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state"><p>Henüz ödeme kalemi eklenmemiş.</p></div>
      ) : (
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)' }}>
              {['Açıklama','Planlanan Tutar','Planlanan Tarih','Gerçekleşen Tutar','Gerçekleşen Tarih',''].map((h,i) => (
                <th key={i} style={{ padding:'9px 12px', textAlign: i===1||i===3 ? 'right' : 'left', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom:'1px solid var(--border)', background: item.completed ? 'var(--success-dim)' : 'transparent', transition:'background 0.2s' }}>
                <td style={{ padding:'11px 12px', fontSize:13.5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {item.completed && <span style={{ color:'var(--success)', fontSize:14 }}>✓</span>}
                    <span style={{ textDecoration: item.completed ? 'none' : 'none', color:'var(--text-primary)' }}>{item.name}</span>
                  </div>
                </td>
                <td style={{ padding:'11px 12px', textAlign:'right', fontWeight:600, color:'var(--text-secondary)', fontFamily:'DM Mono, monospace', fontSize:13 }}>
                  {fmt(item.amount)} <span style={{ fontSize:11, fontWeight:400, color:'var(--text-muted)' }}>{item.currency}</span>
                </td>
                <td style={{ padding:'11px 12px', fontSize:13, color:'var(--text-secondary)', fontFamily:'DM Mono, monospace' }}>
                  {monthLabel(item.plannedMonth, item.plannedYear)}
                </td>
                <td style={{ padding:'11px 12px', textAlign:'right', fontFamily:'DM Mono, monospace', fontSize:13 }}>
                  {item.completed
                    ? <span style={{ fontWeight:600, color:'var(--success)' }}>{fmt(item.actualAmount)} <span style={{ fontSize:11, fontWeight:400, color:'var(--text-muted)' }}>{item.currency}</span></span>
                    : <span style={{ color:'var(--text-muted)' }}>—</span>}
                </td>
                <td style={{ padding:'11px 12px', fontSize:13, fontFamily:'DM Mono, monospace' }}>
                  {item.completed
                    ? <span style={{ color:'var(--success)' }}>{monthLabel(item.actualMonth, item.actualYear)}</span>
                    : <span style={{ color:'var(--text-muted)' }}>—</span>}
                </td>
                <td style={{ padding:'11px 12px' }}>
                  <div className="actions-cell">
                    <button className="btn-icon" onClick={() => openEdit(item)}><EditIcon /></button>
                    <button className="btn-icon danger" onClick={() => setDeleteId(item.id)}><TrashIcon /></button>
                  </div>
                </td>
              </tr>
            ))}
            <tr style={{ background:'var(--bg-secondary)', borderTop:'2px solid var(--border)' }}>
              <td style={{ padding:'11px 12px', fontWeight:600, fontSize:13 }}>Toplam</td>
              <td style={{ padding:'11px 12px', textAlign:'right', fontWeight:700, fontFamily:'DM Mono, monospace' }}>{fmt(plannedTotal)} <span style={{ fontSize:11, fontWeight:400, color:'var(--text-muted)' }}>{project.budgetCurrency}</span></td>
              <td></td>
              <td style={{ padding:'11px 12px', textAlign:'right', fontWeight:700, color:'var(--success)', fontFamily:'DM Mono, monospace' }}>{fmt(actualTotal)} <span style={{ fontSize:11, fontWeight:400, color:'var(--text-muted)' }}>{project.budgetCurrency}</span></td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth:380 }}>
            <div className="modal-title" style={{ marginBottom:12 }}>Ödeme Kalemini Sil</div>
            <p style={{ color:'var(--text-secondary)', fontSize:14, marginBottom:16 }}>Bu ödeme kalemini silmek istediğinizden emin misiniz?</p>
            <div className="form-actions" style={{ marginTop:8, paddingTop:16 }}>
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>İptal</button>
              <button className="btn" style={{ background:'var(--danger)', color:'white' }} onClick={() => handleDelete(deleteId)}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB 3: KİLOMETRE TAŞLARI ────────────────────────────────────
function MilestonesTab({ project, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const emptyMilestone = () => ({
    id: crypto.randomUUID(), name: '', description: '',
    month: new Date().getMonth()+1, year: currentYear,
    completed: false, completedMonth: null, completedYear: null,
  });

  const [form, setForm] = useState(emptyMilestone());
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setEditing(null); setForm(emptyMilestone()); setShowForm(true); };
  const openEdit = (item) => { setEditing(item); setForm({ ...item }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await projectApi.getById(project.id);
      const freshItems = res.data.milestones || [];
      const completed = !!(form.completedMonth && form.completedYear);
      const newItem = {
        ...form,
        completed,
        completedMonth: completed ? form.completedMonth : null,
        completedYear: completed ? form.completedYear : null,
      };
      const newItems = editing
        ? freshItems.map(i => i.id === editing.id ? newItem : i)
        : [...freshItems, newItem];
      await projectApi.updateMilestones(project.id, newItems);
      setShowForm(false);
      await onUpdate();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      const res = await projectApi.getById(project.id);
      const freshItems = (res.data.milestones || []).filter(i => i.id !== id);
      await projectApi.updateMilestones(project.id, freshItems);
      setDeleteId(null);
      await onUpdate();
    } finally { setSaving(false); }
  };

  const items = [...(project.milestones||[])].sort((a,b) => a.year!==b.year ? a.year-b.year : a.month-b.month);
  const completedCount = items.filter(i => i.completed).length;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontSize:13, color:'var(--text-muted)' }}>
          {completedCount}/{items.length} tamamlandı
        </div>
        <button className="btn btn-primary" onClick={openNew}><PlusIcon /> Kilometre Taşı Ekle</button>
      </div>

      {showForm && (
        <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:10, padding:20, marginBottom:20 }}>
          <div style={{ fontWeight:600, marginBottom:14 }}>{editing ? 'Kilometre Taşını Düzenle' : 'Yeni Kilometre Taşı'}</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ad</label>
              <input className="form-input" autoFocus placeholder="Kilometre taşı adı" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Açıklama <span style={{color:'var(--text-muted)',fontWeight:400}}>(opsiyonel)</span></label>
              <input className="form-input" placeholder="Kısa açıklama" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div>
              <label className="form-label">Hedef Tarih</label>
              <MonthYearSelect month={form.month} year={form.year}
                onMonthChange={v => set('month', v)} onYearChange={v => set('year', v)} />
            </div>
            <div></div>
          </div>
          <hr className="section-divider" />
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 }}>
            Gerçekleşen <span style={{ fontWeight:400, textTransform:'none', fontSize:11 }}>(doldurulursa tamamlandı sayılır)</span>
          </div>
          <div className="form-row">
            <div>
              <label className="form-label">Gerçekleşen Tarih</label>
              <MonthYearSelect month={form.completedMonth} year={form.completedYear} allowEmpty
                onMonthChange={v => set('completedMonth', v)} onYearChange={v => set('completedYear', v)} />
            </div>
            <div></div>
          </div>
          <div className="form-actions" style={{ marginTop:12, paddingTop:12 }}>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>İptal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Kaydediliyor...' : editing ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state"><p>Henüz kilometre taşı eklenmemiş.</p></div>
      ) : (
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)' }}>
              {['Ad','Açıklama','Hedef Tarih','Gerçekleşen Tarih',''].map((h,i) => (
                <th key={i} style={{ padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom:'1px solid var(--border)', background: item.completed ? 'var(--success-dim)' : 'transparent', transition:'background 0.2s' }}>
                <td style={{ padding:'11px 12px', fontSize:13.5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {item.completed && <span style={{ color:'var(--success)' }}>✓</span>}
                    <span style={{ fontWeight:500, color:'var(--text-primary)' }}>{item.name}</span>
                  </div>
                </td>
                <td style={{ padding:'11px 12px', fontSize:13, color:'var(--text-muted)' }}>{item.description || '—'}</td>
                <td style={{ padding:'11px 12px', fontSize:13, fontFamily:'DM Mono, monospace', color:'var(--text-secondary)' }}>
                  {MONTHS[item.month-1]} {item.year}
                </td>
                <td style={{ padding:'11px 12px', fontSize:13, fontFamily:'DM Mono, monospace' }}>
                  {item.completed && item.completedMonth
                    ? <span style={{ color:'var(--success)', fontWeight:600 }}>{MONTHS[item.completedMonth-1]} {item.completedYear}</span>
                    : <span style={{ color:'var(--text-muted)' }}>—</span>}
                </td>
                <td style={{ padding:'11px 12px' }}>
                  <div className="actions-cell">
                    <button className="btn-icon" onClick={() => openEdit(item)}><EditIcon /></button>
                    <button className="btn-icon danger" onClick={() => setDeleteId(item.id)}><TrashIcon /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth:380 }}>
            <div className="modal-title" style={{ marginBottom:12 }}>Kilometre Taşını Sil</div>
            <p style={{ color:'var(--text-secondary)', fontSize:14, marginBottom:16 }}>Bu kilometre taşını silmek istediğinizden emin misiniz?</p>
            <div className="form-actions" style={{ marginTop:8, paddingTop:16 }}>
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>İptal</button>
              <button className="btn" style={{ background:'var(--danger)', color:'white' }} onClick={() => handleDelete(deleteId)}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB 4: ÜRÜNLER ──────────────────────────────────────────────
function ProductsTab({ project, allProducts, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const assigned = project.productIds || [];
  const assignedSet = new Set(assigned);

  const toggle = async (productId, add) => {
    setSaving(true);
    const newIds = add ? [...assigned, productId] : assigned.filter(id => id !== productId);
    try {
      await projectApi.updateProducts(project.id, newIds);
      await onUpdate();
    } finally { setSaving(false); }
  };

  const assignedProducts = allProducts.filter(p => assignedSet.has(p.id));
  const available = allProducts.filter(p => !assignedSet.has(p.id));

  const TRL_COLORS = [null,'#6b7280','#6b7280','#2563eb','#2563eb','#7c3aed','#7c3aed','#d97706','#d97706','#16a34a'];

  return (
    <div>
      {assignedProducts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 10 }}>
            Projedeki Ürünler ({assignedProducts.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {assignedProducts.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: `${TRL_COLORS[p.trlLevel]}22`, color: TRL_COLORS[p.trlLevel], border: `1px solid ${TRL_COLORS[p.trlLevel]}44`, fontFamily: 'DM Mono, monospace' }}>
                    TRL {p.trlLevel}
                  </span>
                </div>
                <button className="btn-icon danger" disabled={saving} onClick={() => toggle(p.id, false)}><TrashIcon /></button>
              </div>
            ))}
          </div>
        </div>
      )}
      {available.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 10 }}>
            Eklenebilir Ürünler
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {available.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 8, border: '1px dashed var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{p.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: `${TRL_COLORS[p.trlLevel]}22`, color: TRL_COLORS[p.trlLevel], border: `1px solid ${TRL_COLORS[p.trlLevel]}44`, fontFamily: 'DM Mono, monospace' }}>
                    TRL {p.trlLevel}
                  </span>
                </div>
                <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} disabled={saving} onClick={() => toggle(p.id, true)}>
                  <PlusIcon /> Ekle
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {allProducts.length === 0 && <div className="empty-state"><p>Henüz ürün tanımlanmamış.</p></div>}
      {allProducts.length > 0 && assignedProducts.length === 0 && available.length === 0 && (
        <div className="empty-state"><p>Tüm ürünler bu projeye eklenmiş.</p></div>
      )}
    </div>
  );
}

// ── TAB 5: BÜTÇE ────────────────────────────────────────────────
function BudgetTab({ project, onUpdate }) {
  const [remainingBudget, setRemainingBudget] = useState(project.remainingBudget || 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [projectSales, setProjectSales] = useState([]);

  const fmt = (n) => (n||0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const totalBudget = project.budget || 0;
  const currency = project.budgetCurrency || 'TRY';

  useEffect(() => {
    import('../../services/api').then(({ potentialSaleApi }) => {
      potentialSaleApi.getByProject(project.id).then(res => setProjectSales(res.data));
    });
  }, [project.id]);

  const activeSales = projectSales.filter(s => s.status === 'AKTIF');
  const potentialTotal = activeSales.reduce((sum, s) => sum + (s.amount * s.probability / 100), 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      await projectApi.updateBudget(project.id, {
        remainingBudget: parseFloat(remainingBudget) || 0,
        potentialSales: potentialTotal,
      });
      await onUpdate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const STATUS_COLORS = { AKTIF: '#4f8ef7', KAZANILDI: '#34c97a', KAYBEDILDI: '#f05c5c' };
  const STATUS_LABELS = { AKTIF: 'Aktif', KAZANILDI: 'Kazanıldı', KAYBEDILDI: 'Kaybedildi' };
  const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Toplam Bütçe */}
        <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 6 }}>Toplam Bütçe</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)', fontFamily: 'DM Mono, monospace' }}>
            {fmt(totalBudget)} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{currency}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Proje bilgilerinden güncellenir</div>
        </div>

        {/* Kalan Bütçe */}
        <div className="form-group">
          <label className="form-label">Kalan Bütçe ({currency})</label>
          <AmountInput value={remainingBudget} onChange={setRemainingBudget} />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Kullanılan: {fmt(totalBudget - (parseFloat(remainingBudget) || 0))} {currency}
          </div>
        </div>

        {/* Potansiyel Satış - otomatik */}
        <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 4 }}>Potansiyel Satış (Aktif)</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#34c97a', fontFamily: 'DM Mono, monospace' }}>
                {fmt(potentialTotal)} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{currency}</span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
              {activeSales.length} aktif fırsat<br/>
              <a href="/sales" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 11 }}>Satışları yönet →</a>
            </div>
          </div>
          {activeSales.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              {activeSales.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>%{s.probability}</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', color: '#34c97a' }}>{fmt(s.amount * s.probability / 100)}</span>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: `${STATUS_COLORS[s.status]}22`, color: STATUS_COLORS[s.status] }}>{MONTHS[s.targetMonth-1]} {s.targetYear}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeSales.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bu projeye bağlı aktif potansiyel satış yok.</div>
          )}
        </div>

        <button className="btn btn-primary" onClick={handleSave} disabled={saving}
          style={{ alignSelf: 'flex-start' }}>
          {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi' : 'Kaydet'}
        </button>
      </div>
    </div>
  );
}

// ── PROJE DETAY EKRANI ───────────────────────────────────────────
function ProjectDetail({ project, allPersonnel, allProducts, units, seniorities, onBack, onEdit, onUpdate }) {
  const [activeTab, setActiveTab] = useState('planning');
  const tabs = [
    { id:'planning', label:'Planlama' },
    { id:'payment', label:'Ödeme Planı' },
    { id:'milestones', label:'Kilometre Taşları' },
    { id:'products', label:'Ürünler' },
    { id:'budget', label:'Bütçe' },
  ];
  const projectAmount = (project.paymentPlan||[]).reduce((s,i) => s+(i.amount||0), 0);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ padding:'6px 10px' }}>← Geri</button>
        <div style={{ flex:1 }}>
          <div className="page-title">{project.name}</div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>
            {project.customerName && <span>{project.customerName} · </span>}
            <span style={{ fontFamily:'DM Mono, monospace', fontSize:12 }}>
              {MONTHS[project.startMonth-1]} {project.startYear} – {MONTHS[project.endMonth-1]} {project.endYear}
            </span>
          </div>
        </div>
        <div style={{ textAlign:'right', marginRight:8 }}>
          <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Bütçe</div>
          <div style={{ fontWeight:700, color:'var(--accent)' }}>{fmt(project.budget)} {project.budgetCurrency}</div>
        </div>
        <div style={{ textAlign:'right', marginRight:8 }}>
          <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Proje Tutarı</div>
          <div style={{ fontWeight:700, color: projectAmount===project.budget ? 'var(--success)' : 'var(--warning)' }}>
            {fmt(projectAmount)} {project.budgetCurrency}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => onEdit(project)}><EditIcon /> Düzenle</button>
      </div>

      <div style={{ display:'flex', gap:2, marginBottom:24, borderBottom:'1px solid var(--border)' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding:'9px 18px', fontSize:13.5, fontWeight: activeTab===tab.id ? 600 : 400,
            color: activeTab===tab.id ? 'var(--accent)' : 'var(--text-secondary)',
            background:'none', border:'none', cursor:'pointer',
            borderBottom: activeTab===tab.id ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom:-1, transition:'all 0.15s', fontFamily:'DM Sans, sans-serif',
          }}>{tab.label}</button>
        ))}
      </div>

      <div className="card" style={{ padding:24 }}>
        {activeTab==='personnel' && <PersonnelTab project={project} allPersonnel={allPersonnel} onUpdate={onUpdate} />}
        {activeTab==='planning' && <PlanningTab project={project} allPersonnel={allPersonnel} units={units} seniorities={seniorities} onReload={onUpdate} />}
        {activeTab==='payment' && <PaymentTab project={project} onUpdate={onUpdate} />}
        {activeTab==='milestones' && <MilestonesTab project={project} onUpdate={onUpdate} />}
        {activeTab==='products' && <ProductsTab project={project} allProducts={allProducts} onUpdate={onUpdate} />}
        {activeTab==='budget' && <BudgetTab project={project} onUpdate={onUpdate} />}
      </div>
    </div>
  );
}

// ── ANA SAYFA ────────────────────────────────────────────────────
export default function ProjectsPage() {
  const { user } = useAuth();
  const filterKey = user ? `projects_filter_${user.username}` : 'projects_filter';

  const [projects, setProjects] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [seniorities, setSeniorities] = useState([]);
  const [potentialSalesAll, setPotentialSalesAll] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allSteps, setAllSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [typeFilter, setTypeFilter] = useState(() => localStorage.getItem(filterKey) || 'ALL');

  const location = useLocation();
  const [pendingOpenId, setPendingOpenId] = useState(null);

  // Navigasyon değişince: SalesPage'den geliyorsa projeyi aç, yoksa sıfırla
  useEffect(() => {
    if (location.state?.openProjectId) {
      setPendingOpenId(location.state.openProjectId);
      setSelectedProject(null);
    } else {
      setPendingOpenId(null);
      setSelectedProject(null);
    }
  }, [location.key]);

  // Projeler yüklenince bekleyen ID varsa aç
  useEffect(() => {
    if (pendingOpenId && projects.length > 0) {
      const proj = projects.find(p => p.id === pendingOpenId);
      if (proj) { setSelectedProject(proj); setPendingOpenId(null); }
    }
  }, [pendingOpenId, projects]);

  const personnelMap = Object.fromEntries(personnel.map(p => [String(p.id), p]));
  const seniorityMap = Object.fromEntries(seniorities.map(s => [String(s.id), s]));
  const categoryMap  = Object.fromEntries(categories.map(c => [String(c.id), c]));
  const stepMap      = Object.fromEntries(allSteps.map(s => [String(s.id), s]));

  const load = async () => {
    const [pRes, perRes, prRes, uRes, sRes, psRes] = await Promise.all([
      projectApi.getAll(), personnelApi.getAll(), productApi.getAll(), organizationApi.getAll(), seniorityApi.getAll(), potentialSaleApi.getAll(),
    ]);
    setProjects(pRes.data);
    setPersonnel(perRes.data);
    setProducts(prRes.data);
    setUnits(uRes.data);
    setSeniorities(sRes.data);
    setPotentialSalesAll(psRes.data);
    projectTypeApi.getAll().then(ptRes => setProjectTypes(ptRes.data)).catch(() => {});
    projectCategoryApi.getAll().then(async cRes => {
      const cats = cRes.data || [];
      setCategories(cats);
      const stepArrays = await Promise.all(cats.map(c => projectCategoryApi.getWorkflow(c.id).then(r => r.data).catch(() => [])));
      setAllSteps(stepArrays.flat());
    }).catch(() => {});
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Seçili projeyi backend'den taze çeker
  const refreshSelected = async () => {
    const res = await projectApi.getAll();
    setProjects(res.data);
    if (selectedProject) {
      const fresh = res.data.find(p => p.id === selectedProject.id);
      if (fresh) setSelectedProject(fresh);
    }
  };

  const getPersonnelName = (id) => {
    const p = personnel.find(p => p.id === id);
    return p ? `${p.firstName} ${p.lastName}` : '—';
  };

  const handleDelete = async (id) => {
    await projectApi.delete(id);
    setDeleteConfirm(null);
    setSelectedProject(null);
    load();
  };

  const handleMoveToPotensiyal = async (project) => {
    // Önce bu projeye bağlı PROJE tipi satışları sil (çift sayım önleme)
    const linked = potentialSalesAll.filter(
      s => s.projectId && String(s.projectId) === String(project.id) && (!s.saleType || s.saleType === 'PROJE')
    );
    await Promise.all(linked.map(s => potentialSaleApi.delete(s.id)));
    await projectApi.update(project.id, { ...project, projectStatus: 'POTANSIYEL' });
    load();
  };

  if (selectedProject) {
    return (
      <>
        <ProjectDetail
          project={selectedProject}
          allPersonnel={personnel}
          allProducts={products}
          units={units}
          seniorities={seniorities}
          onBack={() => { setSelectedProject(null); load(); }}
          onEdit={(p) => { setEditing(p || selectedProject); setModalOpen(true); }}
          onUpdate={refreshSelected}
        />
        {modalOpen && (
          <ProjectModal project={editing} personnel={personnel} projectTypes={projectTypes} categories={categories}
            onSave={() => { setModalOpen(false); refreshSelected(); }}
            onClose={() => setModalOpen(false)} />
        )}
      </>
    );
  }

  // Compute per-project potential sales from live data (active sales only)
  const potentialMap = {};
  for (const s of potentialSalesAll) {
    if (s.status === 'AKTIF' && s.projectId != null) {
      const pid = String(s.projectId);
      potentialMap[pid] = (potentialMap[pid] || 0) + (s.amount * s.probability / 100);
    }
  }
  // Enrich projects with dynamically calculated potentialSales
  // POTANSIYEL statüsündeki projeler sadece Potansiyel Projeler sayfasında görünür
  const enrichedProjects = projects
    .filter(p => !p.projectStatus || p.projectStatus !== 'POTANSIYEL')
    .map(p => ({ ...p, potentialSales: potentialMap[String(p.id)] || 0 }));

  const counts = Object.fromEntries(
    projectTypes.map(t => [t.id, enrichedProjects.filter(p => p.projectType === t.id).length])
  );
  counts.ALL = enrichedProjects.length;

  const filtered = typeFilter === 'ALL' ? enrichedProjects : enrichedProjects.filter(p => p.projectType === typeFilter);
  const unitMap  = Object.fromEntries(units.map(u => [String(u.id), u]));

  const selectedTypeName = projectTypes.find(t => t.id === typeFilter)?.name?.toLowerCase() || '';
  const renderProjectCards = () => {
    if (selectedTypeName === 'müşterili') {
      const groups = {};
      for (const p of filtered) {
        const eid = String(p.unitId || '__none__');
        if (!groups[eid]) groups[eid] = [];
        groups[eid].push(p);
      }
      const emyIds = Object.keys(groups).sort((a, b) => {
        const nA = (unitMap[a]?.name || '').toLowerCase();
        const nB = (unitMap[b]?.name || '').toLowerCase();
        if (nA.includes('teknoloji') && !nB.includes('teknoloji')) return -1;
        if (!nA.includes('teknoloji') && nB.includes('teknoloji')) return 1;
        if (nA.includes('hizmet') && !nB.includes('hizmet')) return -1;
        if (!nA.includes('hizmet') && nB.includes('hizmet')) return 1;
        return nA.localeCompare(nB, 'tr');
      });
      return emyIds.map((eid, idx) => (
        <EmySectionProjects
          key={eid}
          name={unitMap[eid]?.name || 'Birim Yok'}
          projects={[...groups[eid]].sort((a, b) => a.name.localeCompare(b.name, 'tr'))}
          personnel={personnel}
          personnelMap={personnelMap}
          seniorityMap={seniorityMap}
          categoryMap={categoryMap}
          stepMap={stepMap}
          onSelectProject={setSelectedProject}
          onEdit={p => { setEditing(p); setModalOpen(true); }}
          onDelete={p => setDeleteConfirm(p)}
          onMoveToPotensiyal={handleMoveToPotensiyal}
          defaultOpen={idx <= 1}
        />
      ));
    }
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 10 }}>
        {sorted.map(p => (
          <ProjectCard key={p.id} project={p} personnel={personnel} personnelMap={personnelMap} seniorityMap={seniorityMap}
            categoryMap={categoryMap} stepMap={stepMap}
            onClick={() => setSelectedProject(p)}
            onEdit={proj => { setEditing(proj); setModalOpen(true); }}
            onDelete={proj => setDeleteConfirm(proj)}
            onMoveToPotensiyal={handleMoveToPotensiyal}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Proje Yönetimi</div>
          <div className="page-subtitle">Projeleri tanımlayın ve yönetin</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          <PlusIcon /> Yeni Proje
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {[...projectTypes.map(t => ({ id: t.id, label: t.name })), { id: 'ALL', label: 'Tümü' }].map(t => (
          <button key={t.id} onClick={() => { setTypeFilter(t.id); localStorage.setItem(filterKey, t.id); }} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: '1px solid var(--border)', fontFamily: 'DM Sans, sans-serif',
            background: typeFilter === t.id ? 'var(--accent)' : 'var(--bg-secondary)',
            color: typeFilter === t.id ? '#fff' : 'var(--text-secondary)',
          }}>
            {t.label} ({counts[t.id] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><p>Bu tipte proje yok.</p></div>
      ) : renderProjectCards()
      }

      {modalOpen && (
        <ProjectModal project={editing} personnel={personnel} projectTypes={projectTypes} categories={categories}
          onSave={() => { setModalOpen(false); load(); if (selectedProject) refreshSelected(); }}
          onClose={() => setModalOpen(false)} />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth:400 }}>
            <div className="modal-title" style={{ marginBottom:12 }}>Projeyi Sil</div>
            <p style={{ color:'var(--text-secondary)', fontSize:14, marginBottom:16 }}>
              <strong style={{ color:'var(--text-primary)' }}>{deleteConfirm.name}</strong> projesini silmek istediğinizden emin misiniz?
            </p>
            <div className="form-actions" style={{ marginTop:8, paddingTop:16 }}>
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>İptal</button>
              <button className="btn" style={{ background:'var(--danger)', color:'white' }} onClick={() => handleDelete(deleteConfirm.id)}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
