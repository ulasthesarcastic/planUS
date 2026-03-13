import { useState, useEffect, useMemo } from 'react';
import { projectApi, personnelApi, seniorityApi } from '../../services/api';

const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const MONTHS_FULL = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

const fmt = (n) => (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Verilen ay için kıdem maliyetini hesapla
function getRateForMonth(rates, year, month) {
  if (!rates || rates.length === 0) return 0;
  for (const r of rates) {
    const afterStart = (year > r.startYear) || (year === r.startYear && month >= r.startMonth);
    const beforeEnd = !r.endYear || (year < r.endYear) || (year === r.endYear && month <= r.endMonth);
    if (afterStart && beforeEnd) return r.amount || 0;
  }
  return 0;
}

// Proje resource plan'ından aylık maliyet hesapla
function calcProjectMonthlyCosts(project, personnelMap, seniorityMap) {
  const planned = {}; // key: "YYYY_M" => amount
  const actual = {};

  for (const entry of (project.resourcePlan || [])) {
    const person = personnelMap[entry.personnelId];
    if (!person) continue;
    const seniority = seniorityMap[person.seniorityId];
    if (!seniority) continue;

    const rate = getRateForMonth(seniority.rates, entry.year, entry.month);
    const key = `${entry.year}_${entry.month}`;

    if (entry.planned != null) {
      planned[key] = (planned[key] || 0) + (rate * entry.planned / 100);
    }
    if (entry.actual != null) {
      actual[key] = (actual[key] || 0) + (rate * entry.actual / 100);
    }
  }
  return { planned, actual };
}

// Ödeme planından aylık gelir hesapla
function calcProjectMonthlyRevenue(project) {
  const planned = {};
  const actual = {};

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

// Tüm ayları kapsayan timeline oluştur
function buildTimeline(projects) {
  let minYear = Infinity, minMonth = Infinity;
  let maxYear = -Infinity, maxMonth = -Infinity;

  for (const p of projects) {
    if (!p.startYear) continue;
    if (p.startYear < minYear || (p.startYear === minYear && p.startMonth < minMonth)) {
      minYear = p.startYear; minMonth = p.startMonth;
    }
    if (p.endYear > maxYear || (p.endYear === maxYear && p.endMonth > maxMonth)) {
      maxYear = p.endYear; maxMonth = p.endMonth;
    }
  }

  if (!isFinite(minYear)) return [];

  const months = [];
  let y = minYear, m = minMonth;
  while (y < maxYear || (y === maxYear && m <= maxMonth)) {
    months.push({ year: y, month: m, key: `${y}_${m}` });
    m++; if (m > 12) { m = 1; y++; }
  }
  return months;
}

// ── SVG CHART ────────────────────────────────────────────────────
function Chart({ data, chartType, onToggleType }) {
  const W = 900, H = 320, PAD = { top: 20, right: 20, bottom: 60, left: 80 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  if (!data.length) return null;

  const maxVal = Math.max(
    ...data.flatMap(d => [d.plannedCost, d.actualCost, d.plannedRevenue, d.actualRevenue, 0])
  );
  const scale = maxVal > 0 ? innerH / maxVal : 1;

  const barW = Math.max(4, Math.min(18, (innerW / data.length) * 0.22));
  const gap = innerW / data.length;

  const xPos = (i) => PAD.left + i * gap + gap / 2;

  const linePoints = (key) =>
    data.map((d, i) => `${xPos(i)},${PAD.top + innerH - (d[key] || 0) * scale}`).join(' ');

  const yTicks = 5;

  return (
    <div style={{ position: 'relative' }}>
      {/* Toggle buttons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {['bar', 'line'].map(t => (
          <button key={t} onClick={() => onToggleType(t)}
            style={{
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

      <div style={{ overflowX: 'auto' }}>
        <svg width={Math.max(W, data.length * 50)} height={H} style={{ display: 'block' }}>
          {/* Grid lines */}
          {Array.from({ length: yTicks + 1 }, (_, i) => {
            const y = PAD.top + (innerH / yTicks) * i;
            const val = maxVal - (maxVal / yTicks) * i;
            return (
              <g key={i}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                  stroke="var(--border)" strokeWidth={0.5} strokeDasharray="4,4" />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize={10}
                  fill="var(--text-muted)" fontFamily="DM Mono, monospace">
                  {fmt(val)}
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
          {data.map((d, i) => (
            (i % Math.ceil(data.length / 12) === 0 || data.length <= 12) && (
              <text key={i} x={xPos(i)} y={H - PAD.bottom + 16}
                textAnchor="middle" fontSize={10} fill="var(--text-muted)"
                fontFamily="DM Mono, monospace">
                {MONTHS[d.month - 1]} {String(d.year).slice(2)}
              </text>
            )
          ))}

          {chartType === 'bar' && data.map((d, i) => {
            const cx = xPos(i);
            const bars = [
              { key: 'plannedCost',    color: '#f5a623', offset: -barW * 1.6 },
              { key: 'actualCost',     color: '#f05c5c', offset: -barW * 0.5 },
              { key: 'plannedRevenue', color: '#4f8ef7', offset: barW * 0.5 },
              { key: 'actualRevenue',  color: '#34c97a', offset: barW * 1.6 },
            ];
            return bars.map(({ key, color, offset }) => {
              const val = d[key] || 0;
              const h = val * scale;
              return val > 0 ? (
                <rect key={key}
                  x={cx + offset - barW / 2} y={PAD.top + innerH - h}
                  width={barW} height={h}
                  fill={color} opacity={0.85} rx={2}
                />
              ) : null;
            });
          })}

          {chartType === 'line' && (
            <>
              {[
                { key: 'plannedCost',    color: '#f5a623', dash: '6,3' },
                { key: 'actualCost',     color: '#f05c5c', dash: '' },
                { key: 'plannedRevenue', color: '#4f8ef7', dash: '6,3' },
                { key: 'actualRevenue',  color: '#34c97a', dash: '' },
              ].map(({ key, color, dash }) => (
                <polyline key={key}
                  points={linePoints(key)}
                  fill="none" stroke={color} strokeWidth={2}
                  strokeDasharray={dash} opacity={0.9}
                />
              ))}
              {/* Dots */}
              {data.map((d, i) => [
                { key: 'plannedCost', color: '#f5a623' },
                { key: 'actualCost', color: '#f05c5c' },
                { key: 'plannedRevenue', color: '#4f8ef7' },
                { key: 'actualRevenue', color: '#34c97a' },
              ].map(({ key, color }) => (
                d[key] > 0 ? (
                  <circle key={`${i}_${key}`}
                    cx={xPos(i)} cy={PAD.top + innerH - (d[key] || 0) * scale}
                    r={3} fill={color} />
                ) : null
              )))}
            </>
          )}

          {/* Axis */}
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + innerH}
            stroke="var(--border)" strokeWidth={1} />
          <line x1={PAD.left} y1={PAD.top + innerH} x2={W - PAD.right} y2={PAD.top + innerH}
            stroke="var(--border)" strokeWidth={1} />
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 8 }}>
        {[
          { color: '#f5a623', label: 'Planlanan Maliyet', dash: true },
          { color: '#f05c5c', label: 'Gerçekleşen Maliyet', dash: false },
          { color: '#4f8ef7', label: 'Planlanan Gelir', dash: true },
          { color: '#34c97a', label: 'Gerçekleşen Gelir', dash: false },
        ].map(({ color, label, dash }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width={24} height={12}>
              <line x1={0} y1={6} x2={24} y2={6} stroke={color} strokeWidth={2}
                strokeDasharray={dash ? '5,3' : ''} />
            </svg>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ANA SAYFA ─────────────────────────────────────────────────────
export default function BudgetPage() {
  const [projects, setProjects] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);
  const [seniorities, setSeniorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('bar');
  const [selectedProjectId, setSelectedProjectId] = useState('all');

  useEffect(() => {
    Promise.all([projectApi.getAll(), personnelApi.getAll(), seniorityApi.getAll()])
      .then(([pRes, perRes, sRes]) => {
        setProjects(pRes.data);
        setPersonnelList(perRes.data);
        setSeniorities(sRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const personnelMap = useMemo(() =>
    Object.fromEntries(personnelList.map(p => [p.id, p])), [personnelList]);

  const seniorityMap = useMemo(() =>
    Object.fromEntries(seniorities.map(s => [s.id, s])), [seniorities]);

  const filteredProjects = useMemo(() =>
    selectedProjectId === 'all' ? projects : projects.filter(p => p.id === selectedProjectId),
    [projects, selectedProjectId]);

  const timeline = useMemo(() => buildTimeline(filteredProjects), [filteredProjects]);

  const monthlyData = useMemo(() => {
    return timeline.map(({ year, month, key }) => {
      let plannedCost = 0, actualCost = 0, plannedRevenue = 0, actualRevenue = 0;

      for (const project of filteredProjects) {
        const costs = calcProjectMonthlyCosts(project, personnelMap, seniorityMap);
        const revenue = calcProjectMonthlyRevenue(project);

        plannedCost += costs.planned[key] || 0;
        actualCost += costs.actual[key] || 0;
        plannedRevenue += revenue.planned[key] || 0;
        actualRevenue += revenue.actual[key] || 0;
      }

      return { year, month, key, plannedCost, actualCost, plannedRevenue, actualRevenue };
    });
  }, [timeline, filteredProjects, personnelMap, seniorityMap]);

  // Kümülatif hesap
  const cumulativeData = useMemo(() => {
    let cumPlannedCost = 0, cumActualCost = 0, cumPlannedRev = 0, cumActualRev = 0;
    return monthlyData.map(d => {
      cumPlannedCost += d.plannedCost;
      cumActualCost += d.actualCost;
      cumPlannedRev += d.plannedRevenue;
      cumActualRev += d.actualRevenue;
      return {
        ...d,
        cumPlannedCost, cumActualCost, cumPlannedRev, cumActualRev,
        plannedCashflow: cumPlannedRev - cumPlannedCost,
        actualCashflow: cumActualRev - cumActualCost,
      };
    });
  }, [monthlyData]);

  // Özet kartları
  const totals = useMemo(() => {
    const last = cumulativeData[cumulativeData.length - 1];
    if (!last) return { plannedCost: 0, actualCost: 0, plannedRevenue: 0, actualRevenue: 0 };
    return {
      plannedCost: last.cumPlannedCost,
      actualCost: last.cumActualCost,
      plannedRevenue: last.cumPlannedRev,
      actualRevenue: last.cumActualRev,
    };
  }, [cumulativeData]);

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Bütçe Yönetimi</div>
          <div className="page-subtitle">Nakit akışı ve maliyet analizi</div>
        </div>
        {/* Proje filtresi */}
        <select className="form-select" style={{ width: 220 }}
          value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
          <option value="all">Tüm Projeler</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Özet Kartlar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Toplam Planlanan Maliyet', value: totals.plannedCost, color: '#f5a623' },
          { label: 'Toplam Gerçekleşen Maliyet', value: totals.actualCost, color: '#f05c5c' },
          { label: 'Toplam Planlanan Gelir', value: totals.plannedRevenue, color: '#4f8ef7' },
          { label: 'Toplam Gerçekleşen Gelir', value: totals.actualRevenue, color: '#34c97a' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ padding: '16px 20px', background: 'var(--bg-card)', border: `1px solid ${color}33`, borderRadius: 10 }}>
            <div style={{ fontSize: 11, color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'DM Mono, monospace' }}>{fmt(value)}</div>
          </div>
        ))}
      </div>

      {/* Nakit akışı özet */}
      {cumulativeData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Planlanan Net Nakit Akışı', value: totals.plannedRevenue - totals.plannedCost, color: totals.plannedRevenue - totals.plannedCost >= 0 ? '#34c97a' : '#f05c5c' },
            { label: 'Gerçekleşen Net Nakit Akışı', value: totals.actualRevenue - totals.actualCost, color: totals.actualRevenue - totals.actualCost >= 0 ? '#34c97a' : '#f05c5c' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding: '16px 20px', background: 'var(--bg-card)', border: `1px solid ${color}33`, borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'DM Mono, monospace' }}>
                {value >= 0 ? '+' : ''}{fmt(value)}
              </div>
            </div>
          ))}
        </div>
      )}

      {monthlyData.length === 0 ? (
        <div className="card">
          <div className="empty-state"><p>Henüz proje veya kaynak planı eklenmemiş.</p></div>
        </div>
      ) : (
        <>
          {/* Grafik */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Aylık Maliyet & Gelir Grafiği</div>
            <Chart data={monthlyData} chartType={chartType} onToggleType={setChartType} />
          </div>

          {/* Kümülatif Nakit Akışı Grafiği */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Kümülatif Nakit Akışı</div>
            <div style={{ overflowX: 'auto' }}>
              <svg width={Math.max(900, cumulativeData.length * 50)} height={260} style={{ display: 'block' }}>
                {(() => {
                  const W = Math.max(900, cumulativeData.length * 50);
                  const H = 260;
                  const PAD = { top: 20, right: 20, bottom: 50, left: 90 };
                  const iW = W - PAD.left - PAD.right;
                  const iH = H - PAD.top - PAD.bottom;
                  const gap = iW / cumulativeData.length;
                  const xPos = (i) => PAD.left + i * gap + gap / 2;

                  const allVals = cumulativeData.flatMap(d => [d.plannedCashflow, d.actualCashflow]);
                  const minV = Math.min(0, ...allVals);
                  const maxV = Math.max(0, ...allVals);
                  const range = maxV - minV || 1;
                  const toY = (v) => PAD.top + iH - ((v - minV) / range) * iH;
                  const zeroY = toY(0);

                  const lines = [
                    { key: 'plannedCashflow', color: '#4f8ef7', dash: '6,3', label: 'Planlanan' },
                    { key: 'actualCashflow', color: '#34c97a', dash: '', label: 'Gerçekleşen' },
                  ];

                  return (
                    <>
                      {/* Zero line */}
                      <line x1={PAD.left} y1={zeroY} x2={W - PAD.right} y2={zeroY}
                        stroke="var(--border-light)" strokeWidth={1} />
                      <text x={PAD.left - 8} y={zeroY + 4} textAnchor="end" fontSize={10}
                        fill="var(--text-muted)" fontFamily="DM Mono, monospace">0</text>

                      {/* Y ticks */}
                      {[minV, minV + (maxV - minV) * 0.25, minV + (maxV - minV) * 0.5, minV + (maxV - minV) * 0.75, maxV].map((v, i) => (
                        <g key={i}>
                          <line x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)}
                            stroke="var(--border)" strokeWidth={0.5} strokeDasharray="4,4" />
                          <text x={PAD.left - 8} y={toY(v) + 4} textAnchor="end" fontSize={10}
                            fill="var(--text-muted)" fontFamily="DM Mono, monospace">
                            {v >= 0 ? '+' : ''}{fmt(v)}
                          </text>
                        </g>
                      ))}

                      {/* X labels */}
                      {cumulativeData.map((d, i) => (
                        (i % Math.ceil(cumulativeData.length / 12) === 0 || cumulativeData.length <= 12) && (
                          <text key={i} x={xPos(i)} y={H - PAD.bottom + 16}
                            textAnchor="middle" fontSize={10} fill="var(--text-muted)"
                            fontFamily="DM Mono, monospace">
                            {MONTHS[d.month - 1]} {String(d.year).slice(2)}
                          </text>
                        )
                      ))}

                      {lines.map(({ key, color, dash }) => (
                        <g key={key}>
                          <polyline
                            points={cumulativeData.map((d, i) => `${xPos(i)},${toY(d[key])}`).join(' ')}
                            fill="none" stroke={color} strokeWidth={2.5} strokeDasharray={dash} />
                          {cumulativeData.map((d, i) => (
                            <circle key={i} cx={xPos(i)} cy={toY(d[key])} r={3} fill={color} />
                          ))}
                        </g>
                      ))}

                      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + iH}
                        stroke="var(--border)" strokeWidth={1} />
                      <line x1={PAD.left} y1={PAD.top + iH} x2={W - PAD.right} y2={PAD.top + iH}
                        stroke="var(--border)" strokeWidth={1} />
                    </>
                  );
                })()}
              </svg>
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
              {[
                { color: '#4f8ef7', label: 'Planlanan Nakit Akışı', dash: true },
                { color: '#34c97a', label: 'Gerçekleşen Nakit Akışı', dash: false },
              ].map(({ color, label, dash }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width={24} height={12}>
                    <line x1={0} y1={6} x2={24} y2={6} stroke={color} strokeWidth={2}
                      strokeDasharray={dash ? '5,3' : ''} />
                  </svg>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Aylık Tablo */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
              Aylık Detay Tablosu
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Ay</th>
                    <th style={{ textAlign: 'right', color: '#f5a623' }}>Pln. Maliyet</th>
                    <th style={{ textAlign: 'right', color: '#f05c5c' }}>Ger. Maliyet</th>
                    <th style={{ textAlign: 'right', color: '#4f8ef7' }}>Pln. Gelir</th>
                    <th style={{ textAlign: 'right', color: '#34c97a' }}>Ger. Gelir</th>
                    <th style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Pln. Nakit Ak.</th>
                    <th style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Kümülatif Pln.</th>
                    <th style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Kümülatif Ger.</th>
                  </tr>
                </thead>
                <tbody>
                  {cumulativeData.map((d, i) => {
                    const monthCashflow = d.plannedRevenue - d.plannedCost;
                    return (
                      <tr key={d.key}>
                        <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {MONTHS_FULL[d.month - 1]} {d.year}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#f5a623' }}>
                          {d.plannedCost > 0 ? fmt(d.plannedCost) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#f05c5c' }}>
                          {d.actualCost > 0 ? fmt(d.actualCost) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#4f8ef7' }}>
                          {d.plannedRevenue > 0 ? fmt(d.plannedRevenue) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#34c97a' }}>
                          {d.actualRevenue > 0 ? fmt(d.actualRevenue) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, color: monthCashflow >= 0 ? '#34c97a' : '#f05c5c' }}>
                          {monthCashflow !== 0 ? `${monthCashflow >= 0 ? '+' : ''}${fmt(monthCashflow)}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, color: d.plannedCashflow >= 0 ? '#34c97a' : '#f05c5c', fontWeight: 600 }}>
                          {d.plannedCashflow !== 0 ? `${d.plannedCashflow >= 0 ? '+' : ''}${fmt(d.plannedCashflow)}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, color: d.actualCashflow >= 0 ? '#34c97a' : '#f05c5c', fontWeight: 600 }}>
                          {d.actualCashflow !== 0 ? `${d.actualCashflow >= 0 ? '+' : ''}${fmt(d.actualCashflow)}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Toplam satırı */}
                <tfoot>
                  <tr style={{ background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                    <td style={{ fontWeight: 700, fontSize: 12 }}>TOPLAM</td>
                    <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 700, color: '#f5a623' }}>{fmt(totals.plannedCost)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 700, color: '#f05c5c' }}>{fmt(totals.actualCost)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 700, color: '#4f8ef7' }}>{fmt(totals.plannedRevenue)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 700, color: '#34c97a' }}>{fmt(totals.actualRevenue)}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
