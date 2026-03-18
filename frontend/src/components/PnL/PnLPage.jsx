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
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M ₺`;
  if (abs >= 1_000)     return `${sign}${Math.round(abs / 1_000)}K ₺`;
  return `${sign}${Math.round(abs)} ₺`;
}

// Pozitif = kâr → yeşil, negatif = zarar → kırmızı
function valColor(val) {
  if (val >  0.5) return '#22c55e';
  if (val < -0.5) return '#ef4444';
  return 'var(--text-muted)';
}

// ── Hesaplama ─────────────────────────────────────────────────────────────────

function calcProjectPnL(project, personnelMap, seniorityMap, potentialSales) {
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

    // Planlanan Gider
    let gider = 0;
    for (const entry of (project.resourcePlan || [])) {
      if (entry.year !== year || entry.month !== month) continue;
      if (entry.planned == null) continue;
      const person    = personnelMap[String(entry.personnelId)];
      if (!person) continue;
      const seniority = seniorityMap[String(person.seniorityId)];
      if (!seniority) continue;
      gider += getRateForMonth(seniority.rates, year, month) * entry.planned;
    }

    // Sözleşmeli Planlanan Gelir
    let sozlesmeli = hasPayments ? 0 : monthlyBudget;
    if (hasPayments) {
      for (const item of (project.paymentPlan || [])) {
        if (item.plannedYear === year && item.plannedMonth === month)
          sozlesmeli += item.amount || 0;
      }
    }

    // Potansiyel Gelir + kırılım
    let potansiyel = 0;
    const salesBreakdown = [];
    for (const sale of potentialSales) {
      if (sale.status !== 'AKTIF') continue;
      if (String(sale.projectId) !== String(project.id)) continue;
      if (sale.targetYear === year && sale.targetMonth === month) {
        const est = sale.amount * sale.probability / 100;
        potansiyel += est;
        salesBreakdown.push({ id: sale.id, name: sale.name, amount: est, probability: sale.probability });
      }
    }

    result[key] = {
      year, month, gider, sozlesmeli, potansiyel,
      salesBreakdown,
      sozlesmeliBreakdown: sozlesmeli > 0 ? [{ id: project.id, name: project.name, amount: sozlesmeli }] : [],
      giderBreakdown: gider > 0 ? [{ id: project.id, name: project.name, amount: gider }] : [],
      toplam:           sozlesmeli - gider,
      toplamPotansiyel: sozlesmeli + potansiyel - gider,
    };
  }
  return result;
}

function sumPnL(monthlyMap) {
  let gider = 0, sozlesmeli = 0, potansiyel = 0;
  for (const v of Object.values(monthlyMap)) {
    gider      += v.gider;
    sozlesmeli += v.sozlesmeli;
    potansiyel += v.potansiyel;
  }
  return {
    gider, sozlesmeli, potansiyel,
    toplam:           sozlesmeli - gider,
    toplamPotansiyel: sozlesmeli + potansiyel - gider,
  };
}

function aggPnL(projects, personnelMap, seniorityMap, potentialSales) {
  const agg = {};
  for (const p of projects) {
    const md = calcProjectPnL(p, personnelMap, seniorityMap, potentialSales);
    for (const [key, val] of Object.entries(md)) {
      if (!agg[key]) agg[key] = { ...val };  // salesBreakdown dahil ilk projeyi koru
      else {
        agg[key].gider                += val.gider;
        agg[key].sozlesmeli           += val.sozlesmeli;
        agg[key].potansiyel           += val.potansiyel;
        agg[key].toplam               += val.toplam;
        agg[key].toplamPotansiyel     += val.toplamPotansiyel;
        agg[key].salesBreakdown       = agg[key].salesBreakdown.concat(val.salesBreakdown);
        agg[key].sozlesmeliBreakdown  = agg[key].sozlesmeliBreakdown.concat(val.sozlesmeliBreakdown);
        agg[key].giderBreakdown       = agg[key].giderBreakdown.concat(val.giderBreakdown);
      }
    }
  }
  return agg;
}

// ── Grid ──────────────────────────────────────────────────────────────────────

const ROWS = [
  { key: 'gider',            label: 'Planlanan Gider',            bold: false, color: '#ef4444',       expandable: 'gid' },
  { key: 'potansiyel',       label: 'Potansiyel Gelir',           bold: false, color: 'var(--accent)', expandable: 'pot' },
  { key: 'sozlesmeli',       label: 'Sözleşmeli Planlanan Gelir', bold: false, color: '#22c55e',       expandable: 'soz' },
  { key: 'toplam',           label: 'Toplam',                     bold: true,  color: 'dynamic',       expandable: false },
  { key: 'toplamPotansiyel', label: 'Toplam Potansiyel',          bold: true,  color: 'dynamic',       expandable: false },
];

function MonthlyGrid({ monthlyData }) {
  const scrollRef = useRef(null);
  // Tek seferde sadece bir satır açık olabilir: 'gid' | 'pot' | 'soz' | null
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

  // Tüm aylardaki benzersiz satışlar (potansiyel kırılım)
  const allSales = useMemo(() => {
    const map = {};
    for (const m of months)
      for (const s of (monthlyData[`${m.year}_${m.month}`]?.salesBreakdown || []))
        if (!map[s.id]) map[s.id] = s.name;
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  }, [months, monthlyData]);

  // Tüm aylardaki benzersiz projeler (sözleşmeli kırılım)
  const allSozProjects = useMemo(() => {
    const map = {};
    for (const m of months)
      for (const s of (monthlyData[`${m.year}_${m.month}`]?.sozlesmeliBreakdown || []))
        if (!map[s.id]) map[s.id] = s.name;
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  }, [months, monthlyData]);

  // Tüm aylardaki benzersiz projeler (gider kırılım)
  const allGiderProjects = useMemo(() => {
    const map = {};
    for (const m of months)
      for (const s of (monthlyData[`${m.year}_${m.month}`]?.giderBreakdown || []))
        if (!map[s.id]) map[s.id] = s.name;
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  }, [months, monthlyData]);

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
          const isExp = expandable && expandedRow === expandable;
          const toggleExp = expandable
            ? () => setExpandedRow(r => r === expandable ? null : expandable)
            : undefined;

          const arrowColor = expandable === 'soz' ? '#22c55e'
                           : expandable === 'gid' ? '#ef4444'
                           : 'var(--accent)';

          return (
            <div key={key}>
              {/* Ana satır */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: rowBg }}>
                <div
                  style={{ ...stickyCell(rowBg), color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, cursor: expandable ? 'pointer' : 'default' }}
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

              {/* Gider kırılım satırları (proje bazlı) */}
              {isExp && expandable === 'gid' && allGiderProjects.map(proj => (
                <div key={proj.id} style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                  <div style={{ ...stickyCell('var(--bg-secondary)'), color: 'var(--text-muted)', paddingLeft: 28, fontSize: 11 }}>
                    {proj.name}
                  </div>
                  {months.map(({ year, month }) => {
                    const isCur = year === curYear && month === curMonth;
                    const d = monthlyData[`${year}_${month}`];
                    const s = (d?.giderBreakdown || []).find(b => b.id === proj.id);
                    const val = s ? s.amount : 0;
                    return (
                      <div key={`${year}_${month}`} style={{ ...dataCell(isCur), fontSize: 11, color: val > 0.5 ? '#ef4444' : 'var(--text-muted)' }}>
                        {val > 0.5 ? fmtK(val) : '—'}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Potansiyel kırılım satırları */}
              {isExp && expandable === 'pot' && allSales.map(sale => (
                <div key={sale.id} style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                  <div style={{ ...stickyCell('var(--bg-secondary)'), color: 'var(--text-muted)', paddingLeft: 28, fontSize: 11 }}>
                    {sale.name}
                  </div>
                  {months.map(({ year, month }) => {
                    const isCur = year === curYear && month === curMonth;
                    const d = monthlyData[`${year}_${month}`];
                    const s = (d?.salesBreakdown || []).find(b => b.id === sale.id);
                    const val = s ? s.amount : 0;
                    return (
                      <div key={`${year}_${month}`} style={{ ...dataCell(isCur), fontSize: 11, color: val > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {val > 0.5 ? fmtK(val) : '—'}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Sözleşmeli kırılım satırları (proje bazlı) */}
              {isExp && expandable === 'soz' && allSozProjects.map(proj => (
                <div key={proj.id} style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                  <div style={{ ...stickyCell('var(--bg-secondary)'), color: 'var(--text-muted)', paddingLeft: 28, fontSize: 11 }}>
                    {proj.name}
                  </div>
                  {months.map(({ year, month }) => {
                    const isCur = year === curYear && month === curMonth;
                    const d = monthlyData[`${year}_${month}`];
                    const s = (d?.sozlesmeliBreakdown || []).find(b => b.id === proj.id);
                    const val = s ? s.amount : 0;
                    return (
                      <div key={`${year}_${month}`} style={{ ...dataCell(isCur), fontSize: 11, color: val > 0 ? '#22c55e' : 'var(--text-muted)' }}>
                        {val > 0.5 ? fmtK(val) : '—'}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Özet Kartı ────────────────────────────────────────────────────────────────

function SummaryCard({ label, projects, personnelMap, seniorityMap, potentialSales }) {
  const [open, setOpen] = useState(false);
  const { totals, monthlyAgg } = useMemo(() => {
    const agg = aggPnL(projects, personnelMap, seniorityMap, potentialSales);
    return { totals: sumPnL(agg), monthlyAgg: agg };
  }, [projects, personnelMap, seniorityMap, potentialSales]);

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

function ProjectDetail({ project, personnelMap, seniorityMap, potentialSales, onBack }) {
  const monthlyData = useMemo(
    () => calcProjectPnL(project, personnelMap, seniorityMap, potentialSales),
    [project, personnelMap, seniorityMap, potentialSales],
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

  const allTotals = useMemo(() => {
    const map = {};
    for (const p of projects)
      map[p.id] = sumPnL(calcProjectPnL(p, personnelMap, seniorityMap, potSales));
    return map;
  }, [projects, personnelMap, seniorityMap, potSales]);

  const filteredProjects = useMemo(() => {
    const base = typeFilter === 'ALL'
      ? projects
      : projects.filter(p => p.projectType === typeFilter);
    return [...base].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [projects, typeFilter]);

  const selectedTypeName = projectTypes.find(t => t.id === typeFilter)?.name || 'Tümü';
  const isMusterili = selectedTypeName.toLowerCase() === 'müşterili';

  if (loading) return <div className="loading">Yükleniyor...</div>;

  if (selected) {
    return (
      <ProjectDetail
        project={selected}
        personnelMap={personnelMap}
        seniorityMap={seniorityMap}
        potentialSales={potSales}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">P&amp;L</div>
          <div className="page-subtitle">{filteredProjects.length} proje</div>
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
              ? (t.id === 'ALL' ? projects.length : filteredProjects.length)
              : projects.filter(p => p.projectType === t.id).length})
          </button>
        ))}
      </div>

      {/* Seçilen tipe göre özet */}
      <SummaryCard
        label={`${selectedTypeName} Toplamı`}
        projects={filteredProjects}
        personnelMap={personnelMap}
        seniorityMap={seniorityMap}
        potentialSales={potSales}
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
