import { useState, useEffect, useMemo, useRef } from 'react';
import { projectApi, personnelApi, seniorityApi, potentialSaleApi } from '../../services/api';

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
  const monthlyBudget = hasPayments ? 0 : (project.budget || 0) / (months.length || 1);

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
      // Düzeltilmiş formüller: gelir - gider (pozitif = kâr)
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
        agg[key].gider            += val.gider;
        agg[key].sozlesmeli       += val.sozlesmeli;
        agg[key].potansiyel       += val.potansiyel;
        agg[key].toplam           += val.toplam;
        agg[key].toplamPotansiyel += val.toplamPotansiyel;
        agg[key].salesBreakdown   = agg[key].salesBreakdown.concat(val.salesBreakdown);
      }
    }
  }
  return agg;
}

// ── Grid ──────────────────────────────────────────────────────────────────────

const ROWS = [
  { key: 'gider',            label: 'Planlanan Gider',            bold: false, color: null,      expandable: false },
  { key: 'potansiyel',       label: 'Potansiyel Gelir',           bold: false, color: 'var(--accent)', expandable: true },
  { key: 'sozlesmeli',       label: 'Sözleşmeli Planlanan Gelir', bold: false, color: '#22c55e', expandable: false },
  { key: 'toplam',           label: 'Toplam',                     bold: true,  color: 'dynamic', expandable: false },
  { key: 'toplamPotansiyel', label: 'Toplam Potansiyel',          bold: true,  color: 'dynamic', expandable: false },
];

function MonthlyGrid({ monthlyData }) {
  const scrollRef = useRef(null);
  const [potOpen, setPotOpen] = useState(false);
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

  // Tüm aylardaki tüm benzersiz satışlar
  const allSales = useMemo(() => {
    const map = {};
    for (const m of months) {
      for (const s of (monthlyData[`${m.year}_${m.month}`]?.salesBreakdown || [])) {
        if (!map[s.id]) map[s.id] = s.name;
      }
    }
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
          const isExpanded = expandable && potOpen;

          return (
            <div key={key}>
              {/* Ana satır */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: rowBg }}>
                <div
                  style={{ ...stickyCell(rowBg), color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, cursor: expandable ? 'pointer' : 'default' }}
                  onClick={expandable ? () => setPotOpen(o => !o) : undefined}
                >
                  {expandable && (
                    <span style={{ fontSize: 9, color: 'var(--accent)', flexShrink: 0 }}>
                      {isExpanded ? '▼' : '▶'}
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

              {/* Potansiyel kırılım satırları */}
              {isExpanded && allSales.map(sale => (
                <div key={sale.id} style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                  <div style={{ ...stickyCell('var(--bg-secondary)'), color: 'var(--text-muted)', paddingLeft: 28, fontSize: 11 }}>
                    {sale.name}
                  </div>
                  {months.map(({ year, month }) => {
                    const isCur = year === curYear && month === curMonth;
                    const d = monthlyData[`${year}_${month}`];
                    const breakdown = d?.salesBreakdown || [];
                    const s = breakdown.find(b => b.id === sale.id);
                    const val = s ? s.amount : 0;
                    return (
                      <div key={`${year}_${month}`} style={{ ...dataCell(isCur), fontSize: 11, color: val > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
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

// ── Proje Kartı ───────────────────────────────────────────────────────────────

function ProjectCard({ project, totals, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
        border: `1px solid ${hov ? 'var(--accent)' : 'var(--border)'}`,
        background: 'var(--bg-card)',
        boxShadow: hov ? '0 2px 14px rgba(99,102,241,0.10)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{project.name}</div>
        {project.customerName && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{project.customerName}</div>}
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
          {MONTHS_SHORT[project.startMonth - 1]} {project.startYear} – {MONTHS_SHORT[project.endMonth - 1]} {project.endYear}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
        <div style={{ fontSize: 11 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Toplam: </span>
          <span style={{ fontWeight: 600, color: valColor(totals.toplam) }}>{fmtK(totals.toplam)}</span>
        </div>
        <div style={{ fontSize: 11 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Top. Pot.: </span>
          <span style={{ fontWeight: 600, color: valColor(totals.toplamPotansiyel) }}>{fmtK(totals.toplamPotansiyel)}</span>
        </div>
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

// ── Grup Bölümü ───────────────────────────────────────────────────────────────

function GroupSection({ title, projects, allTotals, onSelect }) {
  if (projects.length === 0) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>
        {title} ({projects.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {projects.map(p => (
          <ProjectCard key={p.id} project={p} totals={allTotals[p.id]} onClick={() => onSelect(p)} />
        ))}
      </div>
    </div>
  );
}

// ── Ana Bileşen ───────────────────────────────────────────────────────────────

export default function PnLPage() {
  const [projects, setProjects]       = useState([]);
  const [personnel, setPersonnel]     = useState([]);
  const [seniorities, setSeniorities] = useState([]);
  const [potSales, setPotSales]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);

  useEffect(() => {
    Promise.all([
      projectApi.getAll(),
      personnelApi.getAll(),
      seniorityApi.getAll(),
      potentialSaleApi.getAll(),
    ]).then(([pj, pe, se, ps]) => {
      setProjects(pj.data);
      setPersonnel(pe.data);
      setSeniorities(se.data);
      setPotSales(ps.data);
      setLoading(false);
    });
  }, []);

  const personnelMap = useMemo(() => Object.fromEntries(personnel.map(p => [p.id, p])), [personnel]);
  const seniorityMap = useMemo(() => Object.fromEntries(seniorities.map(s => [s.id, s])), [seniorities]);

  const allTotals = useMemo(() => {
    const map = {};
    for (const p of projects)
      map[p.id] = sumPnL(calcProjectPnL(p, personnelMap, seniorityMap, potSales));
    return map;
  }, [projects, personnelMap, seniorityMap, potSales]);

  const customerProjects = useMemo(
    () => projects.filter(p => p.customerName?.trim()).sort((a, b) => a.name.localeCompare(b.name, 'tr')),
    [projects],
  );
  const divisionProjects = useMemo(
    () => projects.filter(p => !p.customerName?.trim()).sort((a, b) => a.name.localeCompare(b.name, 'tr')),
    [projects],
  );

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
          <div className="page-subtitle">{customerProjects.length} müşterili · {divisionProjects.length} bölüm projesi</div>
        </div>
      </div>

      <SummaryCard label="Müşterili Projeler Toplamı" projects={customerProjects}
        personnelMap={personnelMap} seniorityMap={seniorityMap} potentialSales={potSales} />
      <SummaryCard label="SGE Toplamı (Tüm Projeler)" projects={projects}
        personnelMap={personnelMap} seniorityMap={seniorityMap} potentialSales={potSales} />

      <div style={{ marginTop: 20 }}>
        <GroupSection title="Müşterili Projeler" projects={customerProjects} allTotals={allTotals} onSelect={setSelected} />
        <GroupSection title="Bölüm Projeleri"    projects={divisionProjects} allTotals={allTotals} onSelect={setSelected} />
      </div>
    </div>
  );
}
