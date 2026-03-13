import { useState, useEffect, useMemo } from 'react';
import { projectApi, personnelApi, seniorityApi } from '../../services/api';

const MONTHS_SHORT = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const MONTHS_FULL  = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const ALL_MONTHS   = [1,2,3,4,5,6,7,8,9,10,11,12];

const fmt = (n) => (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const METRICS = [
  { key: 'plannedCost',     label: 'Planlanan Maliyet',    color: '#f5a623', dash: true  },
  { key: 'actualCost',      label: 'Gerçekleşen Maliyet',  color: '#f05c5c', dash: false },
  { key: 'plannedRevenue',  label: 'Planlanan Gelir',       color: '#4f8ef7', dash: true  },
  { key: 'actualRevenue',   label: 'Gerçekleşen Gelir',     color: '#34c97a', dash: false },
  { key: 'plannedCashflow', label: 'Planlanan Nakit Akışı', color: '#a78bfa', dash: true  },
];

function getRateForMonth(rates, year, month) {
  if (!rates || rates.length === 0) return 0;
  for (const r of rates) {
    const afterStart = (year > r.startYear) || (year === r.startYear && month >= r.startMonth);
    const beforeEnd  = !r.endYear || (year < r.endYear) || (year === r.endYear && month <= r.endMonth);
    if (afterStart && beforeEnd) return r.amount || 0;
  }
  return 0;
}

function calcProjectMonthlyCosts(project, personnelMap, seniorityMap) {
  const planned = {}, actual = {};
  for (const entry of (project.resourcePlan || [])) {
    const person   = personnelMap[entry.personnelId];
    if (!person) continue;
    const seniority = seniorityMap[person.seniorityId];
    if (!seniority) continue;
    const rate = getRateForMonth(seniority.rates, entry.year, entry.month);
    const key  = `${entry.year}_${entry.month}`;
    if (entry.planned != null) planned[key] = (planned[key] || 0) + (rate * entry.planned / 100);
    if (entry.actual  != null) actual[key]  = (actual[key]  || 0) + (rate * entry.actual  / 100);
  }
  return { planned, actual };
}

function calcProjectMonthlyRevenue(project) {
  const planned = {}, actual = {};
  for (const item of (project.paymentPlan || [])) {
    if (item.plannedMonth && item.plannedYear) {
      const key = `${item.plannedYear}_${item.plannedMonth}`;
      planned[key] = (planned[key] || 0) + (item.amount || 0);
    }
    if (item.completed && item.actualMonth && item.actualYear) {
      const key = `${item.actualYear}_${item.actualMonth}`;
      actual[key] = (actual[key] || 0) + (item.actualAmount || item.amount || 0);
    }
  }
  return { planned, actual };
}

function getProjectYears(projects) {
  const years = new Set();
  for (const p of projects) {
    if (!p.startYear || !p.endYear) continue;
    for (let y = p.startYear; y <= p.endYear; y++) years.add(y);
  }
  return [...years].sort((a, b) => a - b);
}

// ── SVG CHART ─────────────────────────────────────────────────────
function Chart({ monthlyData, chartType, onToggleType, activeMetrics }) {
  const W = 860, H = 300;
  const PAD = { top: 20, right: 20, bottom: 46, left: 90 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;

  const visibleMetrics = METRICS.filter(m => activeMetrics.has(m.key));

  const allVals = monthlyData.flatMap(d => visibleMetrics.map(m => d[m.key] || 0));
  const minV = Math.min(0, ...allVals);
  const maxV = Math.max(0, ...allVals, 1);
  const range = maxV - minV || 1;

  const gap  = iW / 12;
  const xPos = (i) => PAD.left + i * gap + gap / 2;
  const toY  = (v) => PAD.top + iH - ((v - minV) / range) * iH;
  const zeroY = toY(0);
  const barW  = Math.max(4, Math.min(14, gap / (visibleMetrics.length + 1)));

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {['bar', 'line'].map(t => (
          <button key={t} onClick={() => onToggleType(t)} style={{
            padding: '5px 14px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
            border: '1px solid var(--border)',
            background: chartType === t ? 'var(--accent)' : 'var(--bg-secondary)',
            color: chartType === t ? 'white' : 'var(--text-secondary)',
            fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
          }}>
            {t === 'bar' ? '▬ Çubuk' : '╱ Çizgi'}
          </button>
        ))}
      </div>

      <svg width={W} height={H} style={{ display: 'block', width: '100%' }}>
        {/* Y grid */}
        {Array.from({ length: 6 }, (_, i) => {
          const v = minV + (range / 5) * (5 - i);
          const y = toY(v);
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                stroke="var(--border)" strokeWidth={0.5} strokeDasharray="4,4" />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize={10}
                fill="var(--text-muted)" fontFamily="DM Mono, monospace">
                {fmt(v)}
              </text>
            </g>
          );
        })}

        {minV < 0 && (
          <line x1={PAD.left} y1={zeroY} x2={W - PAD.right} y2={zeroY}
            stroke="var(--border-light)" strokeWidth={1.5} />
        )}

        {/* X labels */}
        {ALL_MONTHS.map((m, i) => (
          <text key={m} x={xPos(i)} y={H - PAD.bottom + 16}
            textAnchor="middle" fontSize={11} fill="var(--text-muted)"
            fontFamily="DM Mono, monospace">
            {MONTHS_SHORT[m - 1]}
          </text>
        ))}

        {/* BAR */}
        {chartType === 'bar' && monthlyData.map((d, i) => {
          const cx = xPos(i);
          const totalW = barW * visibleMetrics.length;
          return visibleMetrics.map((m, mi) => {
            const val = d[m.key] || 0;
            if (val === 0) return null;
            const h = Math.abs(val) * iH / range;
            const x = cx - totalW / 2 + mi * barW;
            const y = val >= 0 ? toY(val) : zeroY;
            return <rect key={m.key} x={x} y={y} width={barW - 1} height={h}
              fill={m.color} opacity={0.85} rx={2} />;
          });
        })}

        {/* LINE */}
        {chartType === 'line' && visibleMetrics.map(m => (
          <g key={m.key}>
            <polyline
              points={monthlyData.map((d, i) => `${xPos(i)},${toY(d[m.key] || 0)}`).join(' ')}
              fill="none" stroke={m.color} strokeWidth={2.5}
              strokeDasharray={m.dash ? '7,4' : ''} opacity={0.9} />
            {monthlyData.map((d, i) => (d[m.key] || 0) !== 0 && (
              <circle key={i} cx={xPos(i)} cy={toY(d[m.key] || 0)} r={3.5} fill={m.color} />
            ))}
          </g>
        ))}

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + iH} stroke="var(--border)" strokeWidth={1} />
        <line x1={PAD.left} y1={PAD.top + iH} x2={W - PAD.right} y2={PAD.top + iH} stroke="var(--border)" strokeWidth={1} />
      </svg>
    </div>
  );
}

// ── ANA SAYFA ─────────────────────────────────────────────────────
export default function BudgetPage() {
  const currentYear = new Date().getFullYear();

  const [projects,       setProjects]       = useState([]);
  const [personnelList,  setPersonnelList]  = useState([]);
  const [seniorities,    setSeniorities]    = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [selectedYear,   setSelectedYear]   = useState(currentYear);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [chartType,      setChartType]      = useState('bar');
  const [activeMetrics,  setActiveMetrics]  = useState(
    new Set(['plannedCost', 'plannedRevenue', 'plannedCashflow'])
  );

  useEffect(() => {
    Promise.all([projectApi.getAll(), personnelApi.getAll(), seniorityApi.getAll()])
      .then(([pRes, perRes, sRes]) => {
        setProjects(pRes.data);
        setPersonnelList(perRes.data);
        setSeniorities(sRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const personnelMap   = useMemo(() => Object.fromEntries(personnelList.map(p => [p.id, p])), [personnelList]);
  const seniorityMap   = useMemo(() => Object.fromEntries(seniorities.map(s => [s.id, s])),   [seniorities]);
  const availableYears = useMemo(() => getProjectYears(projects), [projects]);

  const filteredProjects = useMemo(() =>
    selectedProjectId === 'all' ? projects : projects.filter(p => p.id === selectedProjectId),
    [projects, selectedProjectId]);

  const monthlyData = useMemo(() => {
    return ALL_MONTHS.map(month => {
      const key = `${selectedYear}_${month}`;
      let plannedCost = 0, actualCost = 0, plannedRevenue = 0, actualRevenue = 0;
      for (const project of filteredProjects) {
        const costs   = calcProjectMonthlyCosts(project, personnelMap, seniorityMap);
        const revenue = calcProjectMonthlyRevenue(project);
        plannedCost    += costs.planned[key]   || 0;
        actualCost     += costs.actual[key]    || 0;
        plannedRevenue += revenue.planned[key] || 0;
        actualRevenue  += revenue.actual[key]  || 0;
      }
      return { month, key, plannedCost, actualCost, plannedRevenue, actualRevenue,
               plannedCashflow: plannedRevenue - plannedCost,
               actualCashflow:  actualRevenue  - actualCost };
    });
  }, [selectedYear, filteredProjects, personnelMap, seniorityMap]);

  const totals = useMemo(() => {
    return monthlyData.reduce((acc, d) => ({
      plannedCost:     acc.plannedCost     + d.plannedCost,
      actualCost:      acc.actualCost      + d.actualCost,
      plannedRevenue:  acc.plannedRevenue  + d.plannedRevenue,
      actualRevenue:   acc.actualRevenue   + d.actualRevenue,
      plannedCashflow: acc.plannedCashflow + d.plannedCashflow,
      actualCashflow:  acc.actualCashflow  + d.actualCashflow,
    }), { plannedCost: 0, actualCost: 0, plannedRevenue: 0, actualRevenue: 0, plannedCashflow: 0, actualCashflow: 0 });
  }, [monthlyData]);

  const toggleMetric = (key) => {
    setActiveMetrics(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div>
      {/* BAŞLIK & FİLTRELER */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="page-title">Bütçe Yönetimi</div>
          <div className="page-subtitle">Nakit akışı ve maliyet analizi</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select className="form-select" style={{ width: 100 }}
            value={selectedYear} onChange={e => setSelectedYear(+e.target.value)}>
            {availableYears.length > 0
              ? availableYears.map(y => <option key={y} value={y}>{y}</option>)
              : <option value={currentYear}>{currentYear}</option>}
          </select>
          <select className="form-select" style={{ width: 200 }}
            value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
            <option value="all">Tüm Projeler</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* METRİK SEÇİCİ */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {METRICS.map(m => (
          <button key={m.key} onClick={() => toggleMetric(m.key)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
            border: `1px solid ${activeMetrics.has(m.key) ? m.color : 'var(--border)'}`,
            background: activeMetrics.has(m.key) ? `${m.color}22` : 'var(--bg-secondary)',
            color: activeMetrics.has(m.key) ? m.color : 'var(--text-muted)',
            fontSize: 12, fontWeight: 500, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
          }}>
            <svg width={20} height={10}>
              <line x1={0} y1={5} x2={20} y2={5} stroke={m.color} strokeWidth={2}
                strokeDasharray={m.dash ? '5,3' : ''} />
            </svg>
            {m.label}
          </button>
        ))}
      </div>

      {/* ÖZET KARTLAR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: `${selectedYear} Planlanan Maliyet`,    value: totals.plannedCost,     color: '#f5a623' },
          { label: `${selectedYear} Planlanan Gelir`,      value: totals.plannedRevenue,  color: '#4f8ef7' },
          { label: 'Planlanan Net Nakit Akışı',            value: totals.plannedCashflow, color: totals.plannedCashflow >= 0 ? '#34c97a' : '#f05c5c', signed: true },
          { label: `${selectedYear} Gerçekleşen Maliyet`,  value: totals.actualCost,      color: '#f05c5c' },
          { label: `${selectedYear} Gerçekleşen Gelir`,    value: totals.actualRevenue,   color: '#34c97a' },
          { label: 'Gerçekleşen Net Nakit Akışı',          value: totals.actualCashflow,  color: totals.actualCashflow >= 0 ? '#34c97a' : '#f05c5c', signed: true },
        ].map(({ label, value, color, signed }) => (
          <div key={label} style={{ padding: '14px 18px', background: 'var(--bg-card)', border: `1px solid ${color}33`, borderRadius: 10 }}>
            <div style={{ fontSize: 11, color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: 'DM Mono, monospace' }}>
              {signed && (value || 0) > 0 ? '+' : ''}{fmt(value || 0)}
            </div>
          </div>
        ))}
      </div>

      {/* GRAFİK */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
          {selectedYear} — Aylık Görünüm
        </div>
        <Chart monthlyData={monthlyData} chartType={chartType}
          onToggleType={setChartType} activeMetrics={activeMetrics} />
      </div>

      {/* TABLO */}
      <div className="card">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
          {selectedYear} — Aylık Detay
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Ay</th>
                {activeMetrics.has('plannedCost')     && <th style={{ textAlign: 'right', color: '#f5a623' }}>Pln. Maliyet</th>}
                {activeMetrics.has('actualCost')      && <th style={{ textAlign: 'right', color: '#f05c5c' }}>Ger. Maliyet</th>}
                {activeMetrics.has('plannedRevenue')  && <th style={{ textAlign: 'right', color: '#4f8ef7' }}>Pln. Gelir</th>}
                {activeMetrics.has('actualRevenue')   && <th style={{ textAlign: 'right', color: '#34c97a' }}>Ger. Gelir</th>}
                {activeMetrics.has('plannedCashflow') && <th style={{ textAlign: 'right', color: '#a78bfa' }}>Pln. Nakit Akışı</th>}
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((d) => (
                <tr key={d.month}>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {MONTHS_FULL[d.month - 1]} {selectedYear}
                  </td>
                  {activeMetrics.has('plannedCost')     && <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#f5a623' }}>{d.plannedCost > 0 ? fmt(d.plannedCost) : '—'}</td>}
                  {activeMetrics.has('actualCost')      && <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#f05c5c' }}>{d.actualCost > 0 ? fmt(d.actualCost) : '—'}</td>}
                  {activeMetrics.has('plannedRevenue')  && <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#4f8ef7' }}>{d.plannedRevenue > 0 ? fmt(d.plannedRevenue) : '—'}</td>}
                  {activeMetrics.has('actualRevenue')   && <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#34c97a' }}>{d.actualRevenue > 0 ? fmt(d.actualRevenue) : '—'}</td>}
                  {activeMetrics.has('plannedCashflow') && (
                    <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, color: d.plannedCashflow >= 0 ? '#a78bfa' : '#f05c5c', fontWeight: d.plannedCashflow !== 0 ? 600 : 400 }}>
                      {d.plannedCashflow !== 0 ? `${d.plannedCashflow > 0 ? '+' : ''}${fmt(d.plannedCashflow)}` : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                <td style={{ fontWeight: 700, fontSize: 12 }}>TOPLAM</td>
                {activeMetrics.has('plannedCost')     && <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 700, color: '#f5a623' }}>{fmt(totals.plannedCost)}</td>}
                {activeMetrics.has('actualCost')      && <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 700, color: '#f05c5c' }}>{fmt(totals.actualCost)}</td>}
                {activeMetrics.has('plannedRevenue')  && <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 700, color: '#4f8ef7' }}>{fmt(totals.plannedRevenue)}</td>}
                {activeMetrics.has('actualRevenue')   && <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 700, color: '#34c97a' }}>{fmt(totals.actualRevenue)}</td>}
                {activeMetrics.has('plannedCashflow') && <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 700, color: totals.plannedCashflow >= 0 ? '#a78bfa' : '#f05c5c' }}>{totals.plannedCashflow > 0 ? '+' : ''}{fmt(totals.plannedCashflow)}</td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
