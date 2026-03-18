import { useState, useEffect, useMemo } from 'react';
import { projectApi, personnelApi, seniorityApi, potentialSaleApi } from '../../services/api';

// ── Yardımcı ─────────────────────────────────────────────────────────────────

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
  if (abs >= 1_000)     return `${sign}${(abs / 1_000).toFixed(0)}K ₺`;
  return `${sign}${abs.toFixed(0)} ₺`;
}

const MONTHS_SHORT = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

// ── Hesaplama ─────────────────────────────────────────────────────────────────

function calcProjectPnL(project, personnelMap, seniorityMap, potentialSales) {
  const months = monthsBetween(
    project.startYear, project.startMonth,
    project.endYear,   project.endMonth
  );

  const result = {};
  for (const { year, month } of months) {
    const key = `${year}_${month}`;
    // Planlanan Gider: planned (0–1 fraction) × aylık kıdem ücreti
    let gider = 0;
    for (const entry of (project.resourcePlan || [])) {
      if (entry.year !== year || entry.month !== month) continue;
      if (entry.planned == null) continue;
      const person = personnelMap[String(entry.personnelId)];
      if (!person) continue;
      const seniority = seniorityMap[String(person.seniorityId)];
      if (!seniority) continue;
      const rate = getRateForMonth(seniority.rates, year, month);
      gider += rate * entry.planned;
    }

    // Sözleşmeli Planlanan Gelir: payment_plan'daki planlanan ödemeler
    let sozlesmeli = 0;
    for (const item of (project.paymentPlan || [])) {
      if (item.plannedYear === year && item.plannedMonth === month) {
        sozlesmeli += item.amount || 0;
      }
    }

    // Potansiyel Gelir: targetYear/targetMonth eşleşen aktif satışlar
    let potansiyel = 0;
    for (const sale of potentialSales) {
      if (sale.status !== 'AKTIF') continue;
      if (String(sale.projectId) !== String(project.id)) continue;
      if (sale.targetYear === year && sale.targetMonth === month) {
        potansiyel += (sale.amount * sale.probability / 100);
      }
    }

    result[key] = { year, month, gider, sozlesmeli, potansiyel,
      toplam: gider - sozlesmeli,
      toplamPotansiyel: gider - sozlesmeli - potansiyel,
    };
  }
  return result;
}

function sumPnL(monthlyMap) {
  let gider = 0, sozlesmeli = 0, potansiyel = 0;
  for (const v of Object.values(monthlyMap)) {
    gider       += v.gider;
    sozlesmeli  += v.sozlesmeli;
    potansiyel  += v.potansiyel;
  }
  return { gider, sozlesmeli, potansiyel,
    toplam: gider - sozlesmeli,
    toplamPotansiyel: gider - sozlesmeli - potansiyel,
  };
}

// ── Monthly Grid ──────────────────────────────────────────────────────────────

function MonthlyGrid({ monthlyData }) {
  const months = Object.values(monthlyData).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  );

  const COL_W = 90;
  const LABEL_W = 220;
  const rowStyle = (i) => ({
    display: 'flex', borderBottom: '1px solid var(--border)',
    background: i % 2 === 0 ? 'transparent' : 'var(--bg-alt-row)',
  });
  const cellStyle = (bold, color) => ({
    minWidth: COL_W, width: COL_W, padding: '5px 8px',
    fontSize: 12, textAlign: 'right', flexShrink: 0,
    fontWeight: bold ? 600 : 400,
    color: color || 'var(--text-primary)',
  });
  const labelStyle = {
    minWidth: LABEL_W, width: LABEL_W, padding: '5px 10px',
    fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0,
  };

  const rows = [
    { key: 'gider',            label: 'Planlanan Gider',             bold: false, color: null },
    { key: 'potansiyel',       label: 'Potansiyel Gelir',            bold: false, color: 'var(--accent)' },
    { key: 'sozlesmeli',       label: 'Sözleşmeli Planlanan Gelir',  bold: false, color: '#22c55e' },
    { key: 'toplam',           label: 'Toplam',                      bold: true,  color: null },
    { key: 'toplamPotansiyel', label: 'Toplam Potansiyel',           bold: true,  color: null },
  ];

  return (
    <div style={{ overflowX: 'auto', marginTop: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div style={{ ...labelStyle, fontWeight: 600, color: 'var(--text-primary)' }}>Kalem</div>
        {months.map(({ year, month }) => (
          <div key={`${year}_${month}`} style={{ ...cellStyle(true), textAlign: 'center', color: 'var(--text-secondary)' }}>
            {MONTHS_SHORT[month - 1]} {String(year).slice(2)}
          </div>
        ))}
      </div>

      {rows.map(({ key, label, bold, color }, i) => (
        <div key={key} style={rowStyle(i)}>
          <div style={labelStyle}>{label}</div>
          {months.map(({ year, month }) => {
            const d = monthlyData[`${year}_${month}`];
            const val = d ? d[key] : 0;
            const isNeg = val < 0;
            const displayColor = key === 'toplam' || key === 'toplamPotansiyel'
              ? (isNeg ? '#22c55e' : val > 0 ? '#ef4444' : 'var(--text-muted)')
              : color;
            return (
              <div key={`${year}_${month}`} style={cellStyle(bold, displayColor)}>
                {val !== 0 ? fmtK(val) : '—'}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Proje Kartı ───────────────────────────────────────────────────────────────

function ProjectPnLCard({ project, personnelMap, seniorityMap, potentialSales }) {
  const [open, setOpen] = useState(false);
  const monthlyData = useMemo(
    () => calcProjectPnL(project, personnelMap, seniorityMap, potentialSales),
    [project, personnelMap, seniorityMap, potentialSales]
  );
  const totals = useMemo(() => sumPnL(monthlyData), [monthlyData]);

  const toplam = totals.toplam;
  const toplamPot = totals.toplamPotansiyel;

  return (
    <div style={{
      borderRadius: 8, border: '1px solid var(--border)',
      background: 'var(--bg-card)', overflow: 'hidden',
      transition: 'box-shadow 0.15s',
    }}>
      {/* Card header — tıklanabilir */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '14px 16px', cursor: 'pointer', display: 'flex',
          alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}
        onMouseEnter={e => e.currentTarget.parentElement.style.boxShadow = '0 2px 14px rgba(99,102,241,0.12)'}
        onMouseLeave={e => e.currentTarget.parentElement.style.boxShadow = 'none'}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
            {project.name}
          </div>
          {project.customerName && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
              {project.customerName}
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {MONTHS_SHORT[project.startMonth - 1]} {project.startYear} – {MONTHS_SHORT[project.endMonth - 1]} {project.endYear}
          </div>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <div style={{ fontSize: 11 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Toplam: </span>
            <span style={{
              fontWeight: 600,
              color: toplam < 0 ? '#22c55e' : toplam > 0 ? '#ef4444' : 'var(--text-muted)'
            }}>
              {fmtK(toplam)}
            </span>
          </div>
          <div style={{ fontSize: 11 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Toplam Potansiyel: </span>
            <span style={{
              fontWeight: 600,
              color: toplamPot < 0 ? '#22c55e' : toplamPot > 0 ? '#ef4444' : 'var(--text-muted)'
            }}>
              {fmtK(toplamPot)}
            </span>
          </div>
          <div style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 12 }}>
            {open ? '▲' : '▼'}
          </div>
        </div>
      </div>

      {/* Monthly detail */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '0 16px 16px' }}>
          <MonthlyGrid monthlyData={monthlyData} />
        </div>
      )}
    </div>
  );
}

// ── Özet Kartı ────────────────────────────────────────────────────────────────

function SummaryCard({ label, projects, personnelMap, seniorityMap, potentialSales }) {
  const [open, setOpen] = useState(false);

  const { totals, monthlyAgg } = useMemo(() => {
    const agg = {};
    for (const p of projects) {
      const md = calcProjectPnL(p, personnelMap, seniorityMap, potentialSales);
      for (const [key, val] of Object.entries(md)) {
        if (!agg[key]) agg[key] = { ...val };
        else {
          agg[key].gider            += val.gider;
          agg[key].sozlesmeli       += val.sozlesmeli;
          agg[key].potansiyel       += val.potansiyel;
          agg[key].toplam           += val.toplam;
          agg[key].toplamPotansiyel += val.toplamPotansiyel;
        }
      }
    }
    return { totals: sumPnL(agg), monthlyAgg: agg };
  }, [projects, personnelMap, seniorityMap, potentialSales]);

  return (
    <div style={{
      borderRadius: 8, border: '2px solid var(--accent)',
      background: 'var(--bg-card)', overflow: 'hidden', marginBottom: 8,
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
      >
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>{label}</div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Toplam: </span>
            <span style={{ fontWeight: 700, color: totals.toplam < 0 ? '#22c55e' : '#ef4444' }}>{fmtK(totals.toplam)}</span>
          </div>
          <div style={{ fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Toplam Potansiyel: </span>
            <span style={{ fontWeight: 700, color: totals.toplamPotansiyel < 0 ? '#22c55e' : '#ef4444' }}>{fmtK(totals.toplamPotansiyel)}</span>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '0 16px 16px' }}>
          <MonthlyGrid monthlyData={monthlyAgg} />
        </div>
      )}
    </div>
  );
}

// ── Ana Sayfa ─────────────────────────────────────────────────────────────────

export default function PnLPage() {
  const [projects, setProjects]       = useState([]);
  const [personnel, setPersonnel]     = useState([]);
  const [seniorities, setSeniorities] = useState([]);
  const [potSales, setPotSales]       = useState([]);
  const [loading, setLoading]         = useState(true);

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

  const personnelMap  = useMemo(() => Object.fromEntries(personnel.map(p => [p.id, p])), [personnel]);
  const seniorityMap  = useMemo(() => Object.fromEntries(seniorities.map(s => [s.id, s])), [seniorities]);

  // Sadece müşterili projeler
  const customerProjects = useMemo(
    () => projects.filter(p => p.customerName?.trim()),
    [projects]
  );

  // SGE toplamı: tüm projeler
  const allProjects = projects;

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">P&amp;L</div>
          <div className="page-subtitle">{customerProjects.length} müşterili proje</div>
        </div>
      </div>

      {/* Özet kartları */}
      <SummaryCard
        label="Müşterili Projeler Toplamı"
        projects={customerProjects}
        personnelMap={personnelMap}
        seniorityMap={seniorityMap}
        potentialSales={potSales}
      />
      <SummaryCard
        label="SGE Toplamı (Tüm Projeler)"
        projects={allProjects}
        personnelMap={personnelMap}
        seniorityMap={seniorityMap}
        potentialSales={potSales}
      />

      {/* Proje kartları */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {customerProjects.map(p => (
          <ProjectPnLCard
            key={p.id}
            project={p}
            personnelMap={personnelMap}
            seniorityMap={seniorityMap}
            potentialSales={potSales}
          />
        ))}
      </div>
    </div>
  );
}
