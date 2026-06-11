import { useMemo, useState } from 'react';
import { useProjects } from '../../hooks/useQueries';

const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function fmtK(val) {
  if (val == null) return '—';
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);
}

function monthLabel(m, y) {
  if (!m || !y) return '—';
  return `${MONTHS_TR[m - 1]} ${y}`;
}

function ItemTable({ items, sortBy, setSortBy }) {
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sortBy === 'date')    return (a.plannedYear * 12 + a.plannedMonth) - (b.plannedYear * 12 + b.plannedMonth);
      if (sortBy === 'amount')  return b.amount - a.amount;
      if (sortBy === 'project') return a.projectName.localeCompare(b.projectName, 'tr');
      return 0;
    });
  }, [items, sortBy]);

  const total = items.reduce((s, i) => s + i.amount, 0);

  const th = (key, label, align = 'left') => (
    <th onClick={() => setSortBy(key)} style={{
      padding: '9px 14px', textAlign: align, fontSize: 11, fontWeight: 600,
      color: sortBy === key ? 'var(--accent)' : 'var(--text-muted)',
      cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
      borderBottom: '1px solid var(--border)',
    }}>{label}</th>
  );

  if (items.length === 0)
    return <div style={{ padding: '24px 16px', color: 'var(--text-muted)', fontSize: 13 }}>Kayıt yok.</div>;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead style={{ background: 'var(--bg-secondary)' }}>
        <tr>
          {th('project', 'Proje')}
          <th style={{ padding: '9px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Ödeme Kalemi</th>
          {th('date', 'Planlanan Ay')}
          <th style={{ padding: '9px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Gecikme</th>
          {th('amount', 'Tutar', 'right')}
        </tr>
      </thead>
      <tbody>
        {sorted.map((item, idx) => (
          <tr key={item.id || idx}
            style={{ borderTop: '1px solid var(--border)', background: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.projectName}</td>
            <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
              {item.itemName || '—'}
              {item.fromOrder && (
                <span style={{ marginLeft: 6, fontSize: 10, color: '#6366f1', background: 'rgba(99,102,241,0.12)', padding: '1px 5px', borderRadius: 4 }}>sipariş</span>
              )}
            </td>
            <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
              {monthLabel(item.plannedMonth, item.plannedYear)}
            </td>
            <td style={{ padding: '10px 14px' }}>
              {item.overdue === 0
                ? <span style={{ fontSize: 11, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 7px', borderRadius: 4 }}>Bu ay</span>
                : <span style={{ fontSize: 11, color: '#ef4444', background: 'rgba(239,68,68,0.10)', padding: '2px 7px', borderRadius: 4 }}>{item.overdue} ay</span>
              }
            </td>
            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontFamily: 'DM Mono, monospace', color: '#f59e0b' }}>
              {fmtK(item.amount)}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <td colSpan={4} style={{ padding: '10px 14px', fontWeight: 700, fontSize: 13 }}>Toplam</td>
          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, fontFamily: 'DM Mono, monospace', fontSize: 14, color: '#f59e0b' }}>
            {fmtK(total)}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

export default function BekleyenOdemelerPage() {
  const { data: projects = [] } = useProjects();
  const [tab, setTab] = useState('gecmis'); // 'gecmis' | 'bekleyen'
  const [sortBy, setSortBy] = useState('date');

  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear  = now.getFullYear();

  const { gecmis, bekleyen } = useMemo(() => {
    const gecmis = [], bekleyen = [];
    for (const p of projects) {
      if (p.projectStatus === 'POTANSIYEL') continue;
      for (const item of (p.paymentPlan || [])) {
        if (item.completed) continue;
        if (!item.plannedMonth || !item.plannedYear) continue;
        const overdue = (curYear * 12 + curMonth) - (item.plannedYear * 12 + item.plannedMonth);
        const entry = {
          id: item.id,
          projectName: p.name,
          itemName: item.name,
          amount: item.amount || 0,
          currency: item.currency || 'TRY',
          plannedMonth: item.plannedMonth,
          plannedYear: item.plannedYear,
          overdue,
          fromOrder: !!item.sourceOrderId,
        };
        if (overdue > 0) gecmis.push(entry);       // tarihi geçmiş
        else if (overdue === 0) bekleyen.push(entry); // bu ay bekleyen
      }
    }
    return { gecmis, bekleyen };
  }, [projects, curMonth, curYear]);

  const tabs = [
    { key: 'gecmis',  label: 'Tarihi Geçenler', count: gecmis.length,  total: gecmis.reduce((s,i)=>s+i.amount,0),  color: '#ef4444' },
    { key: 'bekleyen',label: 'Bekleyenler',      count: bekleyen.length,total: bekleyen.reduce((s,i)=>s+i.amount,0), color: '#f59e0b' },
  ];

  const activeItems = tab === 'gecmis' ? gecmis : bekleyen;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Bekleyen Ödemeler</div>
          <div className="page-subtitle">
            {gecmis.length + bekleyen.length} kalem · Toplam {fmtK(gecmis.reduce((s,i)=>s+i.amount,0) + bekleyen.reduce((s,i)=>s+i.amount,0))}
          </div>
        </div>
      </div>

      {/* Sekmeler */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSortBy('date'); }}
            style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: '1px solid',
              borderColor: tab === t.key ? t.color : 'var(--border)',
              background: tab === t.key ? `${t.color}18` : 'var(--bg-card)',
              color: tab === t.key ? t.color : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}>
            {t.label}
            <span style={{
              marginLeft: 8, fontSize: 11, fontWeight: 700,
              background: tab === t.key ? t.color : 'var(--bg-hover)',
              color: tab === t.key ? '#fff' : 'var(--text-muted)',
              padding: '1px 7px', borderRadius: 10,
            }}>{t.count}</span>
          </button>
        ))}
        <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
          {fmtK(tabs.find(t => t.key === tab)?.total)}
        </span>
      </div>

      {/* Tablo */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <ItemTable items={activeItems} sortBy={sortBy} setSortBy={setSortBy} />
      </div>
    </div>
  );
}
