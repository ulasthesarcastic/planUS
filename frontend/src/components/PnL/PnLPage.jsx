import { useState, useEffect, useMemo, useRef } from 'react';
import { projectApi, personnelApi, seniorityApi, potentialSaleApi, projectTypeApi, organizationApi } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';

// ── Sabitler & Yardımcılar ────────────────────────────────────────────────────

const MONTHS_SHORT = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const COL_W   = 96;
const LABEL_W = 224;

function getRateForMonth(rates = [], year, month) {
  for (const r of rates) {
    const afterStart = (year > r.startYear) || (year === r.startYear && month >= r.startMonth);
    const beforeEnd  = !r.endYear || (year < r.endYear) || (year === r.endYear && month <= r.endMonth);
    if (afterStart && beforeEnd) return r.amount || 0;
  }
  return 0;
}

function monthsBetween(sy, sm, ey, em) {
  const months = [];
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    months.push({ year: y, month: m });
    m++; if (m > 12) { m = 1; y++; }
  }
  return months;
}

function fmtK(val) {
  if (val == null) return '—';
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);
}

// Pozitif = kâr → yeşil, negatif = zarar → kırmızı
function valColor(val) {
  if (val >  0.5) return '#22c55e';
  if (val < -0.5) return '#ef4444';
  return 'var(--text-muted)';
}

// ── Hesaplama ─────────────────────────────────────────────────────────────────

function emptyMonthData(year, month) {
  return {
    year, month,
    gider: 0, sozlesmeli: 0, potPrije: 0, potSiparis: 0, planSiparis: 0,
    giderBreakdown: [], sozlesmeliBreakdown: [],
    potPrijeBreakdown: [], potSiparisBreakdown: [], planSiparisBreakdown: [],
    toplam: 0, toplamPotansiyel: 0,
  };
}

function recalcTotals(d) {
  d.toplam           = d.sozlesmeli - d.gider;
  d.toplamPotansiyel = d.sozlesmeli + d.potPrije + d.potSiparis + d.planSiparis - d.gider;
}

// Aktif/başlamış/devam eden/tamamlanan proje için gider + sözleşmeli hesapla
function calcProjectPnL(project, personnelMap, seniorityMap, linkedSiparisler = []) {
  const months = monthsBetween(
    project.startYear, project.startMonth,
    project.endYear,   project.endMonth,
  );
  const hasPayments = (project.paymentPlan || []).some(i => i.amount > 0);
  const effectiveBudget = project.remainingBudget || project.budget || 0;
  const monthlyBudget = hasPayments ? 0 : effectiveBudget / (months.length || 1);

  const result = {};
  for (const { year, month } of months) {
    const key = `${year}_${month}`;
    const d = emptyMonthData(year, month);

    // Planlanan Gider (kaynak planı)
    for (const entry of (project.resourcePlan || [])) {
      if (entry.year !== year || entry.month !== month) continue;
      if (entry.planned == null) continue;
      const person    = personnelMap[String(entry.personnelId)];
      if (!person) continue;
      const seniority = seniorityMap[String(person.seniorityId)];
      if (!seniority) continue;
      d.gider += getRateForMonth(seniority.rates, year, month) * entry.planned;
    }
    if (d.gider > 0) d.giderBreakdown.push({ id: project.id, name: project.name, amount: d.gider });

    // Sözleşmeli Planlanan Gelir (ödeme planı / bütçe)
    d.sozlesmeli = hasPayments ? 0 : monthlyBudget;
    if (hasPayments) {
      for (const item of (project.paymentPlan || [])) {
        if (item.plannedYear === year && item.plannedMonth === month)
          d.sozlesmeli += item.amount || 0;
      }
    }
    if (d.sozlesmeli > 0) d.sozlesmeliBreakdown.push({ id: project.id, name: project.name, amount: d.sozlesmeli });

    // Bağlı Potansiyel Siparişler
    for (const sale of linkedSiparisler) {
      if (sale.targetYear !== year || sale.targetMonth !== month) continue;
      if (sale.status === 'KAZANILDI') {
        d.planSiparis += sale.amount || 0;
        d.planSiparisBreakdown.push({ id: sale.id, name: `📦 ${sale.name}`, amount: sale.amount || 0 });
      } else if (sale.status === 'AKTIF') {
        const est = (sale.amount || 0) * (sale.probability || 0) / 100;
        d.potSiparis += est;
        d.potSiparisBreakdown.push({ id: sale.id, name: sale.name, amount: est });
      }
    }

    recalcTotals(d);
    result[key] = d;
  }
  return result;
}

function sumPnL(monthlyMap) {
  let gider = 0, sozlesmeli = 0, potPrije = 0, potSiparis = 0, planSiparis = 0;
  for (const v of Object.values(monthlyMap)) {
    gider       += v.gider;
    sozlesmeli  += v.sozlesmeli;
    potPrije    += v.potPrije;
    potSiparis  += v.potSiparis;
    planSiparis += v.planSiparis;
  }
  return {
    gider, sozlesmeli, potPrije, potSiparis, planSiparis,
    toplam:           sozlesmeli - gider,
    toplamPotansiyel: sozlesmeli + potPrije + potSiparis + planSiparis - gider,
  };
}

function aggPnL(activeProjects, potProjects, personnelMap, seniorityMap, allSiparisler) {
  const agg = {};

  const merge = (key, val) => {
    if (!agg[key]) {
      agg[key] = { ...val,
        giderBreakdown: [...val.giderBreakdown],
        sozlesmeliBreakdown: [...val.sozlesmeliBreakdown],
        potPrijeBreakdown: [...val.potPrijeBreakdown],
        potSiparisBreakdown: [...val.potSiparisBreakdown],
        planSiparisBreakdown: [...val.planSiparisBreakdown],
      };
    } else {
      const a = agg[key];
      a.gider                += val.gider;
      a.sozlesmeli           += val.sozlesmeli;
      a.potPrije             += val.potPrije;
      a.potSiparis           += val.potSiparis;
      a.planSiparis          += val.planSiparis;
      a.toplam               += val.toplam;
      a.toplamPotansiyel     += val.toplamPotansiyel;
      a.giderBreakdown       = a.giderBreakdown.concat(val.giderBreakdown);
      a.sozlesmeliBreakdown  = a.sozlesmeliBreakdown.concat(val.sozlesmeliBreakdown);
      a.potPrijeBreakdown    = a.potPrijeBreakdown.concat(val.potPrijeBreakdown);
      a.potSiparisBreakdown  = a.potSiparisBreakdown.concat(val.potSiparisBreakdown);
      a.planSiparisBreakdown = a.planSiparisBreakdown.concat(val.planSiparisBreakdown);
    }
  };

  // Aktif projeler: gider + sozlesmeli + bağlı siparişler
  for (const p of activeProjects) {
    const linked = allSiparisler.filter(s => s.projectId && String(s.projectId) === String(p.id));
    const md = calcProjectPnL(p, personnelMap, seniorityMap, linked);
    for (const [key, val] of Object.entries(md)) merge(key, val);
  }

  // Bağlı olmayan siparişler (projectId null)
  const unlinkedSiparisler = allSiparisler.filter(s => !s.projectId);
  for (const sale of unlinkedSiparisler) {
    const key = `${sale.targetYear}_${sale.targetMonth}`;
    if (!agg[key]) agg[key] = emptyMonthData(sale.targetYear, sale.targetMonth);
    if (sale.status === 'KAZANILDI') {
      agg[key].planSiparis += sale.amount || 0;
      agg[key].planSiparisBreakdown.push({ id: sale.id, name: `📦 ${sale.name}`, amount: sale.amount || 0 });
    } else if (sale.status === 'AKTIF') {
      const est = (sale.amount || 0) * (sale.probability || 0) / 100;
      agg[key].potSiparis += est;
      agg[key].potSiparisBreakdown.push({ id: sale.id, name: sale.name, amount: est });
    }
    recalcTotals(agg[key]);
  }

  // Potansiyel projeler: potPrije (endMonth/endYear'a atanır)
  for (const p of potProjects) {
    if (!p.endYear || !p.endMonth) continue;
    const key = `${p.endYear}_${p.endMonth}`;
    if (!agg[key]) agg[key] = emptyMonthData(p.endYear, p.endMonth);
    const est = (p.budget || 0) * (p.probability ?? 50) / 100;
    if (est > 0) {
      agg[key].potPrije += est;
      agg[key].potPrijeBreakdown.push({ id: p.id, name: p.name, amount: est });
      recalcTotals(agg[key]);
    }
  }

  return agg;
}

// ── Grid ──────────────────────────────────────────────────────────────────────

const ROWS = [
  { key: 'gider',            label: 'Planlanan Gider',             bold: false, color: '#ef4444',    expandable: 'gid'  },
  { key: 'sozlesmeli',       label: 'Sözleşmeli Gelir',            bold: false, color: '#22c55e',    expandable: 'soz'  },
  { key: 'potPrije',         label: 'Potansiyel Proje Geliri',     bold: false, color: '#f59e0b',    expandable: 'ppj'  },
  { key: 'potSiparis',       label: 'Potansiyel Sipariş Geliri',   bold: false, color: '#60a5fa',    expandable: 'psp'  },
  { key: 'planSiparis',      label: 'Planlanan Sipariş Geliri',    bold: false, color: '#34d399',    expandable: 'plsp' },
  { key: 'toplam',           label: 'Toplam',                      bold: true,  color: 'dynamic',    expandable: false  },
  { key: 'toplamPotansiyel', label: 'Toplam Potansiyel',           bold: true,  color: 'dynamic',    expandable: false  },
];

function MonthlyGrid({ monthlyData }) {
  const scrollRef = useRef(null);
  // Tek seferde sadece bir satır açık olabilir
  const [expandedRow, setExpandedRow] = useState(null);
  const now = new Date();
  const curYear = now.getFullYear(), curMonth = now.getMonth() + 1;

  const months = Object.values(monthlyData).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month,
  );

  useEffect(() => {
    if (!scrollRef.current) return;
    const idx = months.findIndex(m => m.year === curYear && m.month === curMonth);
    if (idx < 0) return;
    scrollRef.current.scrollLeft = Math.max(0, LABEL_W + idx * COL_W - 120);
  }, []); // eslint-disable-line

  // Kırılım listelerini önceden hesapla
  const collectBreakdown = (bdKey) => {
    const map = {};
    for (const m of months)
      for (const s of (monthlyData[`${m.year}_${m.month}`]?.[bdKey] || []))
        if (!map[s.id]) map[s.id] = s.name;
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  };

  const allGiderProjects    = useMemo(() => collectBreakdown('giderBreakdown'),       [months, monthlyData]); // eslint-disable-line
  const allSozProjects      = useMemo(() => collectBreakdown('sozlesmeliBreakdown'),  [months, monthlyData]); // eslint-disable-line
  const allPotPrijeProjects = useMemo(() => collectBreakdown('potPrijeBreakdown'),    [months, monthlyData]); // eslint-disable-line
  const allPotSiparis       = useMemo(() => collectBreakdown('potSiparisBreakdown'),  [months, monthlyData]); // eslint-disable-line
  const allPlanSiparis      = useMemo(() => collectBreakdown('planSiparisBreakdown'), [months, monthlyData]); // eslint-disable-line

  const stickyCell = (bg, extra = {}) => ({
    minWidth: LABEL_W, width: LABEL_W, padding: '5px 12px',
    fontSize: 12, flexShrink: 0,
    position: 'sticky', left: 0, zIndex: 2,
    background: bg, borderRight: '1px solid var(--border)',
    ...extra,
  });

  const dataCell = (isCur, extra = {}) => ({
    minWidth: COL_W, width: COL_W, padding: '5px 8px',
    fontSize: 12, textAlign: 'right', flexShrink: 0,
    background: isCur ? 'var(--accent-dim)' : 'transparent',
    borderLeft: isCur ? '2px solid var(--accent)' : 'none',
    ...extra,
  });

  return (
    <div ref={scrollRef} style={{ overflowX: 'auto', position: 'relative' }}>
      <div style={{ display: 'inline-block', minWidth: '100%' }}>

        {/* Sticky header */}
        <div style={{
          display: 'flex', position: 'sticky', top: 0, zIndex: 4,
          background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)',
        }}>
          <div style={{ ...stickyCell('var(--bg-secondary)'), fontWeight: 600, color: 'var(--text-primary)', zIndex: 5 }}>
            Kalem
          </div>
          {months.map(({ year, month }) => {
            const isCur = year === curYear && month === curMonth;
            return (
              <div key={`${year}_${month}`} style={{
                minWidth: COL_W, width: COL_W, padding: '6px 4px',
                fontSize: 11, textAlign: 'center', flexShrink: 0,
                fontWeight: isCur ? 700 : 400,
                color: isCur ? 'var(--accent)' : 'var(--text-secondary)',
                background: isCur ? 'var(--accent-dim)' : 'transparent',
                borderLeft: isCur ? '2px solid var(--accent)' : '1px solid transparent',
              }}>
                {MONTHS_SHORT[month - 1]} {String(year).slice(2)}
              </div>
            );
          })}
        </div>

        {/* Rows */}
        {ROWS.map(({ key, label, bold, color, expandable }, ri) => {
          const rowBg = ri % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-alt-row)';
          const stickyBg = ri % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)';
          const isExp = expandable && expandedRow === expandable;
          const toggleExp = expandable
            ? () => setExpandedRow(r => r === expandable ? null : expandable)
            : undefined;

          const arrowColor = expandable === 'soz'  ? '#22c55e'
                           : expandable === 'gid'  ? '#ef4444'
                           : expandable === 'ppj'  ? '#f59e0b'
                           : expandable === 'psp'  ? '#60a5fa'
                           : expandable === 'plsp' ? '#34d399'
                           : 'var(--accent)';

          return (
            <div key={key}>
              {/* Ana satır */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: rowBg }}>
                <div
                  style={{ ...stickyCell(stickyBg), color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, cursor: expandable ? 'pointer' : 'default' }}
                  onClick={toggleExp}
                >
                  {expandable && (
                    <span style={{ fontSize: 9, color: arrowColor, flexShrink: 0 }}>
                      {isExp ? '▼' : '▶'}
                    </span>
                  )}
                  {label}
                </div>
                {months.map(({ year, month }) => {
                  const isCur = year === curYear && month === curMonth;
                  const d   = monthlyData[`${year}_${month}`];
                  const val = d ? d[key] : 0;
                  const c   = color === 'dynamic' ? valColor(val) : (color || 'var(--text-primary)');
                  return (
                    <div key={`${year}_${month}`} style={{ ...dataCell(isCur), fontWeight: bold ? 600 : 400, color: c }}>
                      {Math.abs(val) > 0.5 ? fmtK(val) : '—'}
                    </div>
                  );
                })}
              </div>

              {/* Kırılım satırları — expandable key'e göre */}
              {isExp && (() => {
                const cfg = {
                  gid:  { list: allGiderProjects,    bdKey: 'giderBreakdown',        color: val => val > 0.5 ? '#ef4444' : 'var(--text-muted)' },
                  soz:  { list: allSozProjects,       bdKey: 'sozlesmeliBreakdown',   color: val => val > 0.5 ? '#22c55e' : 'var(--text-muted)' },
                  ppj:  { list: allPotPrijeProjects,  bdKey: 'potPrijeBreakdown',     color: val => val > 0.5 ? '#f59e0b' : 'var(--text-muted)' },
                  psp:  { list: allPotSiparis,        bdKey: 'potSiparisBreakdown',   color: val => val > 0.5 ? '#60a5fa' : 'var(--text-muted)' },
                  plsp: { list: allPlanSiparis,       bdKey: 'planSiparisBreakdown',  color: val => val > 0.5 ? '#34d399' : 'var(--text-muted)' },
                }[expandable];
                if (!cfg) return null;
                return cfg.list.map(item => (
                  <div key={item.id} style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                    <div style={{ ...stickyCell('var(--bg-secondary)'), color: 'var(--text-muted)', paddingLeft: 28, fontSize: 11 }}>
                      {item.name}
                    </div>
                    {months.map(({ year, month }) => {
                      const isCur = year === curYear && month === curMonth;
                      const d = monthlyData[`${year}_${month}`];
                      const s = (d?.[cfg.bdKey] || []).find(b => b.id === item.id);
                      const val = s ? s.amount : 0;
                      return (
                        <div key={`${year}_${month}`} style={{ ...dataCell(isCur), fontSize: 11, color: cfg.color(val) }}>
                          {val > 0.5 ? fmtK(val) : '—'}
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Özet Kartı ────────────────────────────────────────────────────────────────

function SummaryCard({ label, activeProjects, potProjects, personnelMap, seniorityMap, siparisler }) {
  const [open, setOpen] = useState(false);
  const { totals, monthlyAgg } = useMemo(() => {
    const agg = aggPnL(activeProjects, potProjects, personnelMap, seniorityMap, siparisler);
    return { totals: sumPnL(agg), monthlyAgg: agg };
  }, [activeProjects, potProjects, personnelMap, seniorityMap, siparisler]);

  return (
    <div style={{ borderRadius: 8, border: '2px solid var(--accent)', background: 'var(--bg-card)', overflow: 'hidden', marginBottom: 8 }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>{label}</div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <span style={{ fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Toplam: </span>
            <span style={{ fontWeight: 700, color: valColor(totals.toplam) }}>{fmtK(totals.toplam)}</span>
          </span>
          <span style={{ fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Toplam Pot.: </span>
            <span style={{ fontWeight: 700, color: valColor(totals.toplamPotansiyel) }}>{fmtK(totals.toplamPotansiyel)}</span>
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <MonthlyGrid monthlyData={monthlyAgg} />
        </div>
      )}
    </div>
  );
}

// ── Proje Kartı (ProjectsPage boyutlarında) ───────────────────────────────────

function ProjectCard({ project, totals, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '14px 16px', borderRadius: 8, cursor: 'pointer',
        border: `1px solid ${hov ? 'var(--accent)' : 'var(--border)'}`,
        background: 'var(--bg-card)',
        boxShadow: hov ? '0 2px 14px rgba(99,102,241,0.12)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
        {project.name}
      </div>
      {project.customerName && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{project.customerName}</div>
      )}
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
        {MONTHS_SHORT[project.startMonth - 1]} {project.startYear} – {MONTHS_SHORT[project.endMonth - 1]} {project.endYear}
      </div>
      <div style={{ fontSize: 11 }}>
        <span style={{ color: 'var(--text-secondary)' }}>Toplam: </span>
        <span style={{ fontWeight: 600, color: valColor(totals.toplam) }}>{fmtK(totals.toplam)}</span>
      </div>
      <div style={{ fontSize: 11, marginTop: 2 }}>
        <span style={{ color: 'var(--text-secondary)' }}>Top. Pot.: </span>
        <span style={{ fontWeight: 600, color: valColor(totals.toplamPotansiyel) }}>{fmtK(totals.toplamPotansiyel)}</span>
      </div>
    </div>
  );
}

// ── Proje Detay ───────────────────────────────────────────────────────────────

function ProjectDetail({ project, personnelMap, seniorityMap, linkedSiparisler, onBack }) {
  const monthlyData = useMemo(
    () => calcProjectPnL(project, personnelMap, seniorityMap, linkedSiparisler),
    [project, personnelMap, seniorityMap, linkedSiparisler],
  );
  const totals = useMemo(() => sumPnL(monthlyData), [monthlyData]);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={onBack} style={{ padding: '6px 10px' }}>← Geri</button>
          <div>
            <div className="page-title">{project.name}</div>
            {project.customerName && <div className="page-subtitle">{project.customerName}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Toplam: </span>
            <span style={{ fontWeight: 700, color: valColor(totals.toplam) }}>{fmtK(totals.toplam)}</span>
          </div>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Toplam Pot.: </span>
            <span style={{ fontWeight: 700, color: valColor(totals.toplamPotansiyel) }}>{fmtK(totals.toplamPotansiyel)}</span>
          </div>
        </div>
      </div>
      <div style={{ borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', overflow: 'hidden' }}>
        <MonthlyGrid monthlyData={monthlyData} />
      </div>
    </div>
  );
}

// ── EMY Alt Grubu ─────────────────────────────────────────────────────────────

function EMySubGroup({ managerName, projects, allTotals, onSelect }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          marginBottom: open ? 8 : 0, paddingLeft: 2,
        }}
      >
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{open ? '▼' : '▶'}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
          {managerName} ({projects.length})
        </span>
      </div>
      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 10 }}>
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} totals={allTotals[p.id]} onClick={() => onSelect(p)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Grup Bölümü (kapanabilir) ─────────────────────────────────────────────────

function GroupSection({ title, projects, allTotals, onSelect, unitMap = {}, byEmy = false }) {
  const [open, setOpen] = useState(true);
  if (projects.length === 0) return null;

  // 1. seviye org birimine göre gruplama
  const groups = byEmy ? (() => {
    const map = {};
    for (const p of projects) {
      const unit = unitMap[String(p.unitId)];
      const name = unit ? unit.name : 'Birim Atanmamış';
      const id   = String(p.unitId || '__none__');
      if (!map[id]) map[id] = { name, rows: [] };
      map[id].rows.push(p);
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => a.name.localeCompare(b.name, 'tr'))
      .map(([id, g]) => [id, g.name, g.rows]);
  })() : null;

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Başlık — kapanabilir */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: open ? 12 : 0, paddingLeft: 2 }}
      >
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{open ? '▼' : '▶'}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
          {title}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({projects.length})</span>
      </div>

      {open && (
        byEmy ? (
          groups.map(([unitId, unitName, unitProjects]) => (
            <EMySubGroup
              key={unitId}
              managerName={unitName}
              projects={unitProjects}
              allTotals={allTotals}
              onSelect={onSelect}
            />
          ))
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 10 }}>
            {projects.map(p => (
              <ProjectCard key={p.id} project={p} totals={allTotals[p.id]} onClick={() => onSelect(p)} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ── Ana Bileşen ───────────────────────────────────────────────────────────────

export default function PnLPage() {
  const { user } = useAuth();
  const filterKey = user ? `pnl_filter_${user.username}` : 'pnl_filter';

  const [projects, setProjects]       = useState([]);
  const [personnel, setPersonnel]     = useState([]);
  const [seniorities, setSeniorities] = useState([]);
  const [potSales, setPotSales]       = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [units, setUnits]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [typeFilter, setTypeFilter]   = useState(() => localStorage.getItem(filterKey) || 'ALL');

  useEffect(() => {
    Promise.all([
      projectApi.getAll(),
      personnelApi.getAll(),
      seniorityApi.getAll(),
      potentialSaleApi.getAll(),
      organizationApi.getAll(),
    ]).then(([pj, pe, se, ps, org]) => {
      setProjects(pj.data);
      setPersonnel(pe.data);
      setSeniorities(se.data);
      setPotSales(ps.data);
      setUnits(org.data);
      setLoading(false);
    });
    projectTypeApi.getAll().then(r => setProjectTypes(r.data)).catch(() => {});
  }, []);

  const personnelMap = useMemo(() => Object.fromEntries(personnel.map(p => [p.id, p])), [personnel]);
  const seniorityMap = useMemo(() => Object.fromEntries(seniorities.map(s => [s.id, s])), [seniorities]);
  // Sadece kök (1. seviye) birimler
  const unitMap = useMemo(() => Object.fromEntries(units.filter(u => !u.parentId).map(u => [String(u.id), u])), [units]);

  // Aktif projeler (POTANSIYEL olmayanlar) — P&L'de bunlar görünür
  const activeProjects = useMemo(() => projects.filter(p => !p.projectStatus || p.projectStatus !== 'POTANSIYEL'), [projects]);
  const potProjects    = useMemo(() => projects.filter(p => p.projectStatus === 'POTANSIYEL'), [projects]);
  const siparisler     = useMemo(() => potSales.filter(s => s.saleType === 'SIPARIS'), [potSales]);

  const allTotals = useMemo(() => {
    const map = {};
    for (const p of activeProjects) {
      const linked = siparisler.filter(s => s.projectId && String(s.projectId) === String(p.id));
      map[p.id] = sumPnL(calcProjectPnL(p, personnelMap, seniorityMap, linked));
    }
    return map;
  }, [activeProjects, personnelMap, seniorityMap, siparisler]);

  const filteredProjects = useMemo(() => {
    const base = typeFilter === 'ALL'
      ? activeProjects
      : activeProjects.filter(p => p.projectType === typeFilter);
    return [...base].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [activeProjects, typeFilter]);

  const selectedTypeName = projectTypes.find(t => t.id === typeFilter)?.name || 'Tümü';
  const isMusterili = selectedTypeName.toLowerCase() === 'müşterili';

  if (loading) return <div className="loading">Yükleniyor...</div>;

  if (selected) {
    const linkedSiparisler = siparisler.filter(s => s.projectId && String(s.projectId) === String(selected.id));
    return (
      <ProjectDetail
        project={selected}
        personnelMap={personnelMap}
        seniorityMap={seniorityMap}
        linkedSiparisler={linkedSiparisler}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">P&amp;L</div>
          <div className="page-subtitle">{filteredProjects.length} aktif proje</div>
        </div>
      </div>

      {/* Filtre butonları */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[...projectTypes.map(t => ({ id: t.id, label: t.name })), { id: 'ALL', label: 'Tümü' }].map(t => (
          <button key={t.id} onClick={() => { setTypeFilter(t.id); localStorage.setItem(filterKey, t.id); }} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: '1px solid var(--border)', fontFamily: 'DM Sans, sans-serif',
            background: typeFilter === t.id ? 'var(--accent)' : 'var(--bg-secondary)',
            color: typeFilter === t.id ? '#fff' : 'var(--text-secondary)',
          }}>
            {t.label} ({typeFilter === t.id || t.id === 'ALL'
              ? (t.id === 'ALL' ? activeProjects.length : filteredProjects.length)
              : activeProjects.filter(p => p.projectType === t.id).length})
          </button>
        ))}
      </div>

      {/* Seçilen tipe göre özet */}
      <SummaryCard
        label={`${selectedTypeName} Toplamı`}
        activeProjects={filteredProjects}
        potProjects={potProjects}
        personnelMap={personnelMap}
        seniorityMap={seniorityMap}
        siparisler={siparisler}
      />

      {/* Proje listesi */}
      <div style={{ marginTop: 20 }}>
        <GroupSection
          title={selectedTypeName}
          projects={filteredProjects}
          allTotals={allTotals}
          onSelect={setSelected}
          unitMap={unitMap}
          byEmy={isMusterili}
        />
      </div>
    </div>
  );
}
