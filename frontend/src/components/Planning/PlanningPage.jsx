import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { projectApi, personnelApi, organizationApi, seniorityApi, potentialSaleApi } from '../../services/api';
import SearchableSelect from '../SearchableSelect';

const MONTHS      = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const MONTHS_FULL = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const TYPES       = ['need','planned','actual'];
const TYPE_LABELS = { need: 'İht', planned: 'Pln', actual: 'Grc' };
const TYPE_COLORS = { need: '#60a5fa', planned: '#a78bfa', actual: '#34d399' };


const PROJECT_TYPE_TABS = [
  { key: 'MUSTERILI',     label: 'Müşterili'     },
  { key: 'BOLUM',         label: 'Bölüm'         },
  { key: 'DIS',           label: 'Dış'           },
  { key: 'IS_GELISTIRME', label: 'İş Geliştirme' },
  { key: 'ALL',           label: 'Tümü'          },
];

function fmtBudget(v) {
  if (v == null) return '—';
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(v) + ' ₺';
}

function getProjectMonths(project) {
  const months = [];
  let m = project.startMonth, y = project.startYear;
  while (y < project.endYear || (y === project.endYear && m <= project.endMonth)) {
    months.push({ month: m, year: y });
    m++; if (m > 12) { m = 1; y++; }
  }
  return months;
}

// Backend stores need/planned as 0–1 fractions, actual as 0–100.
// UI always works in 0–100. Convert at the boundary.
function fromDb(val, type) {
  if (val == null) return null;
  return type === 'actual' ? val : Math.round(val * 100);
}
function toDb(val, type) {
  if (val == null) return null;
  return type === 'actual' ? val : val / 100;
}

// ── Budget analysis helpers ──────────────────────────────────────────────────
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

  // Calculate planned costs from analysisMonth to Dec
  let plannedCost = 0;
  const monthlyCosts = {};
  for (const entry of (project.resourcePlan || [])) {
    if (entry.planned == null) continue;
    if (entry.year < analysisYear || (entry.year === analysisYear && entry.month < analysisMonth)) continue;
    if (entry.year > analysisYear) continue;
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

  // Deficit month calculation
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

function XIcon()    { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function BackIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>; }
function PlusIcon() { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }

// ── Percentage input (shows "80" + trailing %) ────────────────────────────────
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
      <input
        value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={commit}
        onFocus={e => e.target.select()}
        onKeyDown={e => { if (e.key === 'Enter') { commit(); e.target.blur(); } }}
        style={{
          width: 28, height: 20, textAlign: 'center', fontSize: 11,
          background: 'transparent', border: 'none', outline: 'none',
          color: textColor,
          fontFamily: 'DM Mono, monospace', padding: 0,
        }}
        placeholder="—"
      />
      {local !== '' && <span style={{ fontSize: 9, color: isModified ? '#fbbf24' : 'var(--text-muted)', lineHeight: 1 }}>%</span>}
    </div>
  );
}

// ── Confirm modal ────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, buttons, onClose }) {
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

// ── Bulk assignment modal ─────────────────────────────────────────────────────
function BulkAssignModal({ person, project, onSave, onClose }) {
  const curY = new Date().getFullYear();
  const YEARS = Array.from({ length: 10 }, (_, i) => curY - 2 + i);
  const [sM, setSM] = useState(project.startMonth);
  const [sY, setSY] = useState(project.startYear);
  const [eM, setEM] = useState(project.endMonth);
  const [eY, setEY] = useState(project.endYear);
  const [need, setNeed]       = useState('');
  const [planned, setPlanned] = useState('');
  const [actual, setActual]   = useState('');

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
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
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

// ── Planning grid ─────────────────────────────────────────────────────────────
function PlanningGrid({ project, allPersonnel, units, onBack, onReload }) {
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
  const currentMonthRef   = useRef(null);

  // Unit hierarchy for root org detection
  const unitMap = Object.fromEntries((units || []).map(u => [String(u.id), u]));
  const getPersonRoot = uid => {
    let u = unitMap[String(uid)];
    while (u?.parentId) u = unitMap[String(u.parentId)];
    return u;
  };

  // Load from project prop — convert fractions to display values (×100 for need/planned)
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

  // Auto-scroll to current month after render (NAME_W=190, COL_W=36, 3 cols/month)
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

  // Person sets and map
  const personnelIdSet = new Set((localProject.personnelIds || []).map(String));
  const plannedPersonIds = new Set(Object.keys(localPlan).map(k => k.split('_')[0]));
  const allGridPersonIds = new Set([...personnelIdSet, ...plannedPersonIds]);
  const personMap = Object.fromEntries(allPersonnel.map(p => [String(p.id), p]));

  const sortName = (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'tr');

  // Group: "Siber Güvenlik Enstitüsü" vs "Dış Kaynaklar" (root org named "Dış Kaynak")
  const allPeople = [...allGridPersonIds].map(id => personMap[id]).filter(Boolean);
  const isDısKaynak = person => {
    if (!person.unitId) return true;
    const root = getPersonRoot(person.unitId);
    return root?.name?.toLowerCase().includes('dış kaynak') || false;
  };
  // Proje dışı kaynak: herhangi bir ayda ihtiyaç=0 ve planlanan>0
  const isPlannedWithoutNeed = person => {
    const s = String(person.id);
    const keys = Object.keys(localPlan).filter(k => k.startsWith(`${s}_`));
    return keys.some(k => {
      const v = localPlan[k];
      return (v.need == null || v.need === 0) && v.planned != null && v.planned > 0;
    });
  };
  // Proje dışı ama herhangi bir ayda ihtiyaç da var
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
    // Auto-save this single cell
    const updatedEntry = { ...localPlan[key], [type]: val };
    const resourcePlan = [];
    // Build full plan for save
    const allEntries = { ...localPlan, [key]: updatedEntry };
    for (const [k, vals] of Object.entries(allEntries)) {
      const [p, yr, mo] = k.split('_');
      if (vals.need != null || vals.planned != null || vals.actual != null) {
        resourcePlan.push({
          personnelId: p, year: +yr, month: +mo,
          need:    toDb(vals.need,    'need'),
          planned: toDb(vals.planned, 'planned'),
          actual:  toDb(vals.actual,  'actual'),
        });
      }
    }
    try {
      await projectApi.updateResourcePlan(localProject.id, resourcePlan);
    } catch (e) { console.error('Auto-save failed', e); }
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
    // Auto-save
    const resourcePlan = [];
    for (const [k, vals] of Object.entries(newPlan)) {
      const [p, yr, mo] = k.split('_');
      if (vals.need != null || vals.planned != null || vals.actual != null) {
        resourcePlan.push({
          personnelId: p, year: +yr, month: +mo,
          need:    toDb(vals.need,    'need'),
          planned: toDb(vals.planned, 'planned'),
          actual:  toDb(vals.actual,  'actual'),
        });
      }
    }
    try {
      await projectApi.updateResourcePlan(localProject.id, resourcePlan);
    } catch (e) { console.error('Bulk auto-save failed', e); }
  };


  const handleAddResource = async personId => {
    const newIds = [...personnelIdSet, String(personId)];
    await projectApi.updatePersonnel(localProject.id, [...newIds]);
    setLocalProject(prev => ({ ...prev, personnelIds: [...newIds] }));
    setAddingResource(false);
  };

  const handleDeleteResource = async person => {
    const pid = String(person.id);
    // Remove from personnelIds
    const newIds = [...personnelIdSet].filter(id => id !== pid);
    // Remove all plan entries for this person
    const newPlan = { ...localPlan };
    for (const key of Object.keys(newPlan)) {
      if (key.startsWith(`${pid}_`)) delete newPlan[key];
    }
    setLocalPlan(newPlan);
    setLocalProject(prev => ({ ...prev, personnelIds: newIds }));
    setDeleteConfirm(null);
    // Save to backend
    try {
      await projectApi.updatePersonnel(localProject.id, newIds);
      const resourcePlan = [];
      for (const [k, vals] of Object.entries(newPlan)) {
        const [p, yr, mo] = k.split('_');
        if (vals.need != null || vals.planned != null || vals.actual != null) {
          resourcePlan.push({
            personnelId: p, year: +yr, month: +mo,
            need:    toDb(vals.need,    'need'),
            planned: toDb(vals.planned, 'planned'),
            actual:  toDb(vals.actual,  'actual'),
          });
        }
      }
      await projectApi.updateResourcePlan(localProject.id, resourcePlan);
    } catch (e) { console.error('Delete resource failed', e); }
  };

  const availablePersonnel = allPersonnel
    .filter(p => !allGridPersonIds.has(String(p.id)))
    .sort(sortName);

  // Monthly planned adam-ay totals (UI stores 0-100, divide by 100)
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
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
          <BackIcon /> Geri
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{localProject.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {MONTHS[localProject.startMonth-1]} {localProject.startYear} – {MONTHS[localProject.endMonth-1]} {localProject.endYear}
            &nbsp;·&nbsp;{allGridPersonIds.size} kaynak
          </div>
        </div>
        {saving && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Kaydediliyor...</span>}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {TYPES.map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLORS[t] }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t === 'need' ? 'İhtiyaç' : t === 'planned' ? 'Planlanan' : 'Gerçekleşen'}</span>
          </div>
        ))}
      </div>

      {/* Add resource bar */}
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        {addingResource ? (
          <>
            <SearchableSelect
              options={availablePersonnel.map(p => ({ value: p.id, label: `${p.firstName} ${p.lastName}` }))}
              value=""
              onChange={handleAddResource}
              placeholder="Personel seçin..."
              style={{ minWidth: 240 }}
            />
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
                    ref={isCur ? currentMonthRef : null}
                    style={{
                      padding: '6px 4px', textAlign: 'center', minWidth: COL_W * 3,
                      borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)',
                      color: isCur ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: isCur ? 700 : 600, whiteSpace: 'nowrap', fontSize: 11,
                      background: isCur ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
                    }}>
                    {MONTHS[month-1]} {year}
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
                    style={{
                      padding: '3px 2px', textAlign: 'center', width: COL_W,
                      borderBottom: '2px solid var(--border)',
                      borderLeft: type === 'need' ? '1px solid var(--border)' : 'none',
                      color: TYPE_COLORS[type], fontSize: 10, fontWeight: 600,
                      background: isCur ? 'rgba(99,102,241,0.06)' : 'var(--bg-secondary)',
                    }}>
                    {TYPE_LABELS[type]}
                  </th>
                ));
              })}
            </tr>
          </thead>
          <tbody>
            {!hasPersonnel ? (
              <tr>
                <td colSpan={months.length * 3 + 1} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Henüz kaynak eklenmemiş.
                </td>
              </tr>
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
                    <td colSpan={months.length * 3}
                      style={{ background: 'rgba(255,255,255,0.06)', borderTop: '2px solid var(--border)', borderBottom: '1px solid var(--border)' }} />
                  </tr>,
                  ...grp.people.map((person, pi) => {
                    return (
                    <tr key={person.id} style={{ borderBottom: '1px solid var(--border)', background: pi % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                      <td style={{ padding: '3px 12px', position: 'sticky', left: 0, zIndex: 1, background: pi % 2 === 0 ? 'var(--bg-card)' : '#1e2130', borderRight: '2px solid var(--border)', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontWeight: 500, fontSize: 12, color: grp.nameColor }}>
                            {person.firstName} {person.lastName}
                          </span>
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
                              style={{
                                padding: '1px 0', textAlign: 'center',
                                borderLeft: type === 'need' ? '1px solid var(--border)' : 'none',
                                background: modified ? 'rgba(251,191,36,0.12)' : v != null ? `${TYPE_COLORS[type]}1a` : isCur ? 'rgba(99,102,241,0.03)' : 'transparent',
                              }}>
                              <PctInput value={v} onChange={val => setVal(person.id, year, month, type, val)} isModified={modified} />
                            </td>
                          );
                        });
                      })}
                    </tr>
                  );}),
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
                      style={{
                        padding: '5px 2px', textAlign: 'center',
                        borderLeft: type === 'need' ? '1px solid var(--border)' : 'none',
                        fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 600,
                        color: type === 'planned' ? (monthlyTotals[idx] > 0 ? '#a78bfa' : 'var(--text-muted)') : 'transparent',
                      }}>
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
        <BulkAssignModal person={bulkPerson} project={localProject} onSave={handleBulkSave} onClose={() => setBulkPerson(null)} />
      )}

      {deleteConfirm && (
        <ConfirmModal
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

// ── Project card (selection screen) ──────────────────────────────────────────
function ProjectCard({ project, personnel, personnelMap, seniorityMap, onClick }) {
  const mgr = personnel.find(p => String(p.id) === String(project.projectManagerId));
  const analysis = analyzeBudget(project, personnelMap, seniorityMap);
  const isAcik = analysis.status === 'acik';
  const [hovered, setHovered] = useState(false);

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '14px 16px', borderRadius: 8, cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s',
        border: `${isAcik ? '2px' : '1px'} solid ${hovered ? 'var(--accent)' : isAcik ? '#f87171' : 'var(--border)'}`,
        background: isAcik ? 'rgba(248,113,113,0.08)' : 'var(--bg-card)',
        boxShadow: hovered ? '0 2px 14px rgba(99,102,241,0.12)' : isAcik ? '0 0 0 1px rgba(248,113,113,0.25)' : 'none',
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', flex: 1 }}>{project.name}</div>
        {isAcik && analysis.eksiyeAy && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(248,113,113,0.2)', color: '#f87171', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {analysis.eksiyeAy}
          </span>
        )}
        {isAcik && !analysis.eksiyeAy && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(248,113,113,0.2)', color: '#f87171', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Açık
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
        {project.customerName && (
          <div style={{ fontSize: 11 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Müşteri: </span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{project.customerName}</span>
          </div>
        )}
        <div style={{ fontSize: 11 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Proje Yöneticisi: </span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{mgr ? `${mgr.firstName} ${mgr.lastName}` : '—'}</span>
        </div>
        <div style={{ fontSize: 11 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Bütçe: </span>
          <span style={{ color: '#34d399', fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>{fmtBudget(project.budget)}</span>
        </div>
        <div style={{ fontSize: 11 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Kalan: </span>
          <span style={{ color: '#f97316', fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>{fmtBudget(project.remainingBudget)}</span>
        </div>
        <div style={{ fontSize: 11 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Potansiyel: </span>
          <span style={{ color: '#22c55e', fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>{fmtBudget(project.potentialSales || 0)}</span>
        </div>
        <div style={{ fontSize: 11 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Dönem: </span>
          <span style={{ color: 'var(--text-primary)' }}>{MONTHS[project.startMonth-1]} {project.startYear} – {MONTHS[project.endMonth-1]} {project.endYear}</span>
        </div>
      </div>
    </div>
  );
}

// ── Collapsible EMY section ───────────────────────────────────────────────────
function EmySection({ name, projects, personnel, personnelMap, seniorityMap, onSelectProject, defaultOpen }) {
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
          {projects.map(p => <ProjectCard key={p.id} project={p} personnel={personnel} personnelMap={personnelMap} seniorityMap={seniorityMap} onClick={() => onSelectProject(p)} />)}
        </div>
      )}
    </div>
  );
}

// ── Project selection screen ──────────────────────────────────────────────────
function ProjectSelectionScreen({ projects, personnel, personnelMap, seniorityMap, units, typeFilter, setTypeFilter, onSelectProject }) {
  const counts = Object.fromEntries(
    ['MUSTERILI','BOLUM','DIS','IS_GELISTIRME'].map(k => [k, projects.filter(p => p.projectType === k).length])
  );
  counts.ALL = projects.length;

  const filtered = typeFilter === 'ALL' ? projects : projects.filter(p => p.projectType === typeFilter);
  const unitMap  = Object.fromEntries(units.map(u => [String(u.id), u]));

  const renderContent = () => {
    if (typeFilter === 'MUSTERILI') {
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
        <EmySection
          key={eid}
          name={unitMap[eid]?.name || 'Birim Yok'}
          projects={[...groups[eid]].sort((a, b) => a.name.localeCompare(b.name, 'tr'))}
          personnel={personnel}
          personnelMap={personnelMap}
          seniorityMap={seniorityMap}
          onSelectProject={onSelectProject}
          defaultOpen={idx === 0}
        />
      ));
    }
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 10 }}>
        {sorted.map(p => <ProjectCard key={p.id} project={p} personnel={personnel} personnelMap={personnelMap} seniorityMap={seniorityMap} onClick={() => onSelectProject(p)} />)}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {PROJECT_TYPE_TABS.map(t => (
          <button key={t.key} onClick={() => setTypeFilter(t.key)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: '1px solid var(--border)', fontFamily: 'DM Sans, sans-serif',
            background: typeFilter === t.key ? 'var(--accent)' : 'var(--bg-secondary)',
            color: typeFilter === t.key ? '#fff' : 'var(--text-secondary)',
          }}>
            {t.label} ({counts[t.key] ?? 0})
          </button>
        ))}
      </div>
      {filtered.length === 0
        ? <div className="empty-state"><p>Bu tipte proje yok.</p></div>
        : renderContent()
      }
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PlanningPage() {
  const [projects,    setProjects]    = useState([]);
  const [personnel,   setPersonnel]   = useState([]);
  const [units,       setUnits]       = useState([]);
  const [seniorities, setSeniorities] = useState([]);
  const [potentialSalesAll, setPotentialSalesAll] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [typeFilter, setTypeFilter] = useState('MUSTERILI');

  const location = useLocation();
  const selectedIdRef = useRef(null);
  selectedIdRef.current = selectedProject?.id ?? null;

  // Sidebar'dan aynı route'a tıklanınca proje seçimini sıfırla
  useEffect(() => {
    setSelectedProject(null);
  }, [location.key]);

  const personnelMap = Object.fromEntries(personnel.map(p => [String(p.id), p]));
  const seniorityMap = Object.fromEntries(seniorities.map(s => [String(s.id), s]));

  const load = async () => {
    const [pRes, perRes, uRes, sRes, psRes] = await Promise.all([
      projectApi.getAll(), personnelApi.getAll(), organizationApi.getAll(), seniorityApi.getAll(), potentialSaleApi.getAll(),
    ]);
    setProjects(pRes.data);
    setPersonnel(perRes.data);
    setUnits(uRes.data);
    setSeniorities(sRes.data);
    setPotentialSalesAll(psRes.data);
    setLoading(false);
  };

  const handleReload = async () => {
    const pRes = await projectApi.getAll();
    setProjects(pRes.data);
    const sid = selectedIdRef.current;
    if (sid) {
      const fresh = pRes.data.find(p => p.id === sid);
      if (fresh) setSelectedProject(fresh);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Proje Planlama</div>
          <div className="page-subtitle">
            {selectedProject ? selectedProject.name : 'Kaynak ihtiyaç, planlama ve gerçekleşen atamalarını yönetin'}
          </div>
        </div>
      </div>

      {selectedProject ? (
        <PlanningGrid
          project={selectedProject}
          allPersonnel={personnel}
          units={units}
          onBack={() => setSelectedProject(null)}
          onReload={handleReload}
        />
      ) : (
        <ProjectSelectionScreen
          projects={projects.map(p => {
            const pot = potentialSalesAll
              .filter(s => s.status === 'AKTIF' && String(s.projectId) === String(p.id))
              .reduce((sum, s) => sum + (s.amount * s.probability / 100), 0);
            return { ...p, potentialSales: pot };
          })}
          personnel={personnel}
          personnelMap={personnelMap}
          seniorityMap={seniorityMap}
          units={units}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          onSelectProject={setSelectedProject}
        />
      )}
    </div>
  );
}
