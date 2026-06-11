import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProjects, usePersonnel, useSeniorities, usePotentialSales, useOrganization, useAllProjectCosts, useAllSeniorityHistory, useAllProcurements } from '../../hooks/useQueries';
import { generalExpenseApi } from '../../services/api';

// ── Sabitler & Yardımcılar ────────────────────────────────────────────────────

const MONTHS_SHORT = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const MONTHS_LONG  = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const COL_W   = 96;
const LABEL_W = 224;
const YEARS   = Array.from({ length: 14 }, (_, i) => 2024 + i);

function inPeriod(year, month, sy, sm, ey, em) {
  return (year > sy || (year === sy && month >= sm)) &&
         (year < ey || (year === ey && month <= em));
}

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
    gider: 0, genExp: 0, sozlesmeli: 0, potPrije: 0, potSiparis: 0,
    gerceklesenGider: 0, gerceklesenGelir: 0,
    giderBreakdown: [], genExpBreakdown: [], sozlesmeliBreakdown: [],
    gerceklesenGiderBreakdown: [], gerceklesenGelirBreakdown: [],
    potPrijeBreakdown: [], potSiparisBreakdown: [],
    gerceklesenToplam: 0, toplam: 0, potansiyelGelir: 0, toplamPotansiyel: 0,
  };
}

function recalcTotals(d) {
  d.gerceklesenToplam = d.gerceklesenGelir - d.gerceklesenGider;
  d.toplam            = d.sozlesmeli - d.gider - d.genExp;
  d.potansiyelGelir   = d.potPrije + d.potSiparis;
  d.toplamPotansiyel  = d.sozlesmeli + d.potPrije + d.potSiparis - d.gider - d.genExp;
}

// Bir personelin belirli bir ay/yıl için kıdem ID'sini geçmişten bul
// historyByPersonnel: { [personnelId]: [{seniorityId, startDate, endDate}] }
function getSeniorityIdForMonth(person, year, month, historyByPersonnel) {
  const entries = historyByPersonnel[String(person.id)];
  if (entries && entries.length > 0) {
    // Tarihe göre sıralı, ilgili dönemdeki kaydı bul
    const firstOfMonth = new Date(year, month - 1, 1);
    for (const e of [...entries].sort((a, b) => new Date(b.startDate) - new Date(a.startDate))) {
      const start = new Date(e.startDate);
      const end   = e.endDate ? new Date(e.endDate) : null;
      if (start <= firstOfMonth && (!end || end >= firstOfMonth)) {
        return String(e.seniorityId);
      }
    }
  }
  // Geçmiş yoksa mevcut kıdeme dön
  return String(person.seniorityId);
}

// Aktif/başlamış/devam eden/tamamlanan proje için gider + sözleşmeli hesapla
function calcProjectPnL(project, personnelMap, seniorityMap, linkedSiparisler = [], projectCosts = [], historyByPersonnel = {}, procurements = []) {
  const months = monthsBetween(
    project.startYear, project.startMonth,
    project.endYear,   project.endMonth,
  );

  const result = {};
  for (const { year, month } of months) {
    const key = `${year}_${month}`;
    const d = emptyMonthData(year, month);

    // Planlanan Gider (kaynak planı) — pnlExcludeExpense ile devre dışı bırakılabilir
    if (!project.pnlExcludeExpense) {
      for (const entry of (project.resourcePlan || [])) {
        if (entry.year !== year || entry.month !== month) continue;
        if (entry.planned == null) continue;
        const person    = personnelMap[String(entry.personnelId)];
        if (!person) continue;
        const seniorityId = getSeniorityIdForMonth(person, year, month, historyByPersonnel);
        const seniority   = seniorityMap[seniorityId];
        if (!seniority) continue;
        d.gider += getRateForMonth(seniority.rates, year, month) * entry.planned;
      }
    }
    // Planlanan satın alma giderleri — pnlExcludeExpense'ten bağımsız, her zaman dahil
    for (const p of procurements) {
      if (p.plannedYear === year && p.plannedMonth === month && p.plannedAmount) {
        d.gider += Number(p.plannedAmount);
      }
    }
    if (d.gider > 0) d.giderBreakdown.push({ id: project.id, name: project.name, amount: d.gider });

    // Sözleşmeli Planlanan Gelir — pnlExcludeRevenue ile devre dışı bırakılabilir
    // completed=true olan ödemeler gerçekleşen'de sayıldığından planlanan'a dahil edilmez
    if (!project.pnlExcludeRevenue) {
      for (const item of (project.paymentPlan || [])) {
        if (item.plannedYear === year && item.plannedMonth === month && !item.completed)
          d.sozlesmeli += item.amount || 0;
      }
      if (d.sozlesmeli > 0) d.sozlesmeliBreakdown.push({ id: project.id, name: project.name, amount: d.sozlesmeli });
    }

    // Gerçekleşen Gider — her zaman dahil edilir
    for (const cost of projectCosts) {
      if (cost.year === year && cost.month === month) {
        d.gerceklesenGider += Number(cost.amount) || 0;
      }
    }
    // Gerçekleşen satın alma giderleri
    for (const p of procurements) {
      if (p.actualYear === year && p.actualMonth === month && p.actualAmount) {
        d.gerceklesenGider += Number(p.actualAmount);
      }
    }
    if (d.gerceklesenGider > 0)
      d.gerceklesenGiderBreakdown.push({ id: project.id, name: project.name, amount: d.gerceklesenGider });

    // Gerçekleşen Proje Geliri — her zaman dahil edilir
    for (const item of (project.paymentPlan || [])) {
      if (item.actualYear === year && item.actualMonth === month) {
        const amt = item.actualAmount || item.amount || 0;
        d.gerceklesenGelir += amt;
        // Aynı proje birden fazla ödeme kalemi içerebilir → miktarları birleştir
        const existing = d.gerceklesenGelirBreakdown.find(b => b.id === project.id);
        if (existing) existing.amount += amt;
        else d.gerceklesenGelirBreakdown.push({ id: project.id, name: project.name, amount: amt });
      }
    }

    // Bağlı Potansiyel Siparişler (yalnızca AKTIF olanlar — KAZANILDI olanlar payment_items'a dönüşür, sozlesmeli'de sayılır)
    for (const sale of linkedSiparisler) {
      if (sale.targetYear !== year || sale.targetMonth !== month) continue;
      if (sale.status === 'AKTIF') {
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
  let gider = 0, sozlesmeli = 0, potPrije = 0, potSiparis = 0,
      gerceklesenGider = 0, gerceklesenGelir = 0;
  for (const v of Object.values(monthlyMap)) {
    gider            += v.gider;
    sozlesmeli       += v.sozlesmeli;
    potPrije         += v.potPrije;
    potSiparis       += v.potSiparis;
    gerceklesenGider += v.gerceklesenGider;
    gerceklesenGelir += v.gerceklesenGelir;
  }
  return {
    gider, sozlesmeli, potPrije, potSiparis,
    gerceklesenGider, gerceklesenGelir,
    gerceklesenToplam: gerceklesenGelir - gerceklesenGider,
    toplam:            sozlesmeli - gider,
    potansiyelGelir:   potPrije + potSiparis,
    toplamPotansiyel:  sozlesmeli + potPrije + potSiparis - gider,
  };
}

function aggPnL(activeProjects, potProjects, personnelMap, seniorityMap, allSiparisler, costsByProject = {}, historyByPersonnel = {}, procurementsByProject = {}) {
  const agg = {};

  const merge = (key, val) => {
    if (!agg[key]) {
      agg[key] = { ...val,
        giderBreakdown:             [...val.giderBreakdown],
        genExpBreakdown:            [...val.genExpBreakdown],
        sozlesmeliBreakdown:        [...val.sozlesmeliBreakdown],
        gerceklesenGiderBreakdown:  [...val.gerceklesenGiderBreakdown],
        gerceklesenGelirBreakdown:  [...val.gerceklesenGelirBreakdown],
        potPrijeBreakdown:          [...val.potPrijeBreakdown],
        potSiparisBreakdown:        [...val.potSiparisBreakdown],
      };
    } else {
      const a = agg[key];
      a.gider                    += val.gider;
      a.genExp                   += val.genExp;
      a.sozlesmeli               += val.sozlesmeli;
      a.potPrije                 += val.potPrije;
      a.potSiparis               += val.potSiparis;
      a.gerceklesenGider          += val.gerceklesenGider;
      a.gerceklesenGelir          += val.gerceklesenGelir;
      a.gerceklesenToplam         += val.gerceklesenToplam;
      a.toplam                    += val.toplam;
      a.potansiyelGelir           += val.potansiyelGelir;
      a.toplamPotansiyel          += val.toplamPotansiyel;
      a.giderBreakdown             = a.giderBreakdown.concat(val.giderBreakdown);
      a.genExpBreakdown            = a.genExpBreakdown.concat(val.genExpBreakdown);
      a.sozlesmeliBreakdown        = a.sozlesmeliBreakdown.concat(val.sozlesmeliBreakdown);
      a.gerceklesenGiderBreakdown  = a.gerceklesenGiderBreakdown.concat(val.gerceklesenGiderBreakdown);
      a.gerceklesenGelirBreakdown  = a.gerceklesenGelirBreakdown.concat(val.gerceklesenGelirBreakdown);
      a.potPrijeBreakdown         = a.potPrijeBreakdown.concat(val.potPrijeBreakdown);
      a.potSiparisBreakdown       = a.potSiparisBreakdown.concat(val.potSiparisBreakdown);
    }
  };

  // Aktif projeler: gider + sozlesmeli + bağlı siparişler + gerçekleşen
  for (const p of activeProjects) {
    const linked = allSiparisler.filter(s => s.projectId && String(s.projectId) === String(p.id));
    const projectCosts = costsByProject[String(p.id)] || [];
    const procurements = procurementsByProject[String(p.id)] || [];
    const md = calcProjectPnL(p, personnelMap, seniorityMap, linked, projectCosts, historyByPersonnel, procurements);
    for (const [key, val] of Object.entries(md)) merge(key, val);
  }

  // Bağlı olmayan siparişler (projectId null) — yalnızca AKTIF olanlar
  const unlinkedSiparisler = allSiparisler.filter(s => !s.projectId);
  for (const sale of unlinkedSiparisler) {
    if (sale.status !== 'AKTIF') continue;
    const key = `${sale.targetYear}_${sale.targetMonth}`;
    if (!agg[key]) agg[key] = emptyMonthData(sale.targetYear, sale.targetMonth);
    const est = (sale.amount || 0) * (sale.probability || 0) / 100;
    agg[key].potSiparis += est;
    agg[key].potSiparisBreakdown.push({ id: sale.id, name: sale.name, amount: est });
    recalcTotals(agg[key]);
  }

  // Potansiyel projeler: ödeme kalemlerine göre aylara dağıtılır
  // Ödeme kalemi yoksa fallback: budget × olasılık → endMonth
  for (const p of potProjects) {
    const prob = (p.probability ?? 50) / 100;
    const paymentPlan = (p.paymentPlan || []).filter(i => i.plannedYear && i.plannedMonth && (i.amount || 0) > 0);

    if (paymentPlan.length > 0) {
      for (const item of paymentPlan) {
        const key = `${item.plannedYear}_${item.plannedMonth}`;
        if (!agg[key]) agg[key] = emptyMonthData(item.plannedYear, item.plannedMonth);
        const est = (item.amount || 0) * prob;
        agg[key].potPrije += est;
        agg[key].potPrijeBreakdown.push({ id: p.id, name: p.name, amount: est });
        recalcTotals(agg[key]);
      }
    } else {
      // Ödeme planı girilmemişse tüm tahmini endMonth'a düşer
      if (!p.endYear || !p.endMonth) continue;
      const key = `${p.endYear}_${p.endMonth}`;
      if (!agg[key]) agg[key] = emptyMonthData(p.endYear, p.endMonth);
      const est = (p.budget || 0) * prob;
      if (est > 0) {
        agg[key].potPrije += est;
        agg[key].potPrijeBreakdown.push({ id: p.id, name: p.name, amount: est });
        recalcTotals(agg[key]);
      }
    }
  }

  return agg;
}

// ── Grid ──────────────────────────────────────────────────────────────────────

const ROWS = [
  // ── Gerçekleşen ──────────────────────────────────────────────
  { key: 'gerceklesenGelir',  label: 'Gerçekleşen Proje Gelirleri', bold: false, color: '#22c55e', expandable: 'grcGelir', section: 'gerceklesen' },
  { key: 'gerceklesenGider',  label: 'Gerçekleşen Gider',           bold: false, color: '#f97316', expandable: 'grcGid',   section: 'gerceklesen' },
  { key: 'gerceklesenToplam', label: 'Toplam',                      bold: true,  color: 'dynamic', expandable: false,      section: 'gerceklesen', sectionEnd: true },
  // ── Planlanan ────────────────────────────────────────────────
  { key: 'sozlesmeli',        label: 'Planlanan Proje Gelirleri',   bold: false, color: '#4ade80', expandable: 'soz',      section: 'planlanan' },
  { key: 'gider',             label: 'Planlanan Gider',             bold: false, color: '#ef4444', expandable: 'gid',      section: 'planlanan' },
  { key: 'genExp',            label: 'Genel Giderler',              bold: false, color: '#ef4444', expandable: false,      section: 'planlanan' },
  { key: 'toplam',            label: 'Toplam',                      bold: true,  color: 'dynamic', expandable: false,      section: 'planlanan',   sectionEnd: true },
  // ── Potansiyel ───────────────────────────────────────────────
  { key: 'potPrije',          label: 'Potansiyel Proje Geliri',     bold: false, color: '#f59e0b', expandable: 'ppj',      section: 'potansiyel' },
  { key: 'potSiparis',        label: 'Potansiyel Sipariş Geliri',   bold: false, color: '#60a5fa', expandable: 'psp',      section: 'potansiyel' },
  { key: 'potansiyelGelir',   label: 'Potansiyel Gelir',            bold: true,  color: 'dynamic', expandable: false,      section: 'potansiyel',  sectionEnd: true },
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
    if (!scrollRef.current || months.length === 0) return;
    const idx = months.findIndex(m => m.year === curYear && m.month === curMonth);
    if (idx < 0) return;
    scrollRef.current.scrollLeft = Math.max(0, idx * COL_W - COL_W / 2);
  }, [months.length]); // eslint-disable-line

  // Kırılım listelerini önceden hesapla
  const collectBreakdown = (bdKey) => {
    const map = {};
    for (const m of months)
      for (const s of (monthlyData[`${m.year}_${m.month}`]?.[bdKey] || []))
        if (!map[s.id]) map[s.id] = s.name;
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  };

  const allGiderProjects         = useMemo(() => collectBreakdown('giderBreakdown'),             [months, monthlyData]); // eslint-disable-line
  const allSozProjects           = useMemo(() => collectBreakdown('sozlesmeliBreakdown'),        [months, monthlyData]); // eslint-disable-line
  const allGerceklesenGiderProj  = useMemo(() => collectBreakdown('gerceklesenGiderBreakdown'),  [months, monthlyData]); // eslint-disable-line
  const allGerceklesenGelirProj  = useMemo(() => collectBreakdown('gerceklesenGelirBreakdown'),  [months, monthlyData]); // eslint-disable-line
  const allPotPrijeProjects      = useMemo(() => collectBreakdown('potPrijeBreakdown'),          [months, monthlyData]); // eslint-disable-line
  const allPotSiparis            = useMemo(() => collectBreakdown('potSiparisBreakdown'),        [months, monthlyData]); // eslint-disable-line
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
        {ROWS.map(({ key, label, bold, color, expandable, section, sectionEnd }, ri) => {
          // Toplam satırları için section'a özel arka plan
          // ÖNEMLİ: stickyBg daima OPAK olmalı — semi-transparent renkler sticky'de üst üste binmeye yol açar
          const isTotalRow = bold && !expandable;
          const rowBg    = isTotalRow ? 'var(--bg-secondary)' : (ri % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-alt-row)');
          const stickyBg = isTotalRow ? 'var(--bg-secondary)' : (ri % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)');
          // Yeni section başlangıcı: önceki satır sectionEnd ise üstte kalın çizgi
          const prevRow = ri > 0 ? ROWS[ri - 1] : null;
          const isSectionStart = prevRow?.sectionEnd === true;
          const isExp = expandable && expandedRow === expandable;
          const toggleExp = expandable
            ? () => setExpandedRow(r => r === expandable ? null : expandable)
            : undefined;

          const arrowColor = expandable === 'soz'     ? '#4ade80'
                           : expandable === 'gid'     ? '#ef4444'
                           : expandable === 'grcGid'  ? '#f97316'
                           : expandable === 'grcGelir'? '#22c55e'
                           : expandable === 'ppj'     ? '#f59e0b'
                           : expandable === 'psp'     ? '#60a5fa'
                           : 'var(--accent)';

          return (
            <div key={key}>
              {/* Ana satır */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: rowBg, borderTop: isSectionStart ? '2px solid var(--border)' : 'none' }}>
                <div
                  style={{ ...stickyCell(stickyBg), color: isTotalRow ? 'var(--text-primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, cursor: expandable ? 'pointer' : 'default' }}
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
                    <div key={`${year}_${month}`} style={{ ...dataCell(isCur), fontWeight: bold ? 700 : 400, color: c }}>
                      {Math.abs(val) > 0.5 ? fmtK(val) : '—'}
                    </div>
                  );
                })}
              </div>

              {/* Kırılım satırları — expandable key'e göre */}
              {isExp && (() => {
                const cfg = {
                  gid:     { list: allGiderProjects,        bdKey: 'giderBreakdown',             color: val => val > 0.5 ? '#ef4444' : 'var(--text-muted)' },
                  soz:     { list: allSozProjects,          bdKey: 'sozlesmeliBreakdown',        color: val => val > 0.5 ? '#4ade80' : 'var(--text-muted)' },
                  grcGid:  { list: allGerceklesenGiderProj, bdKey: 'gerceklesenGiderBreakdown',  color: val => val > 0.5 ? '#f97316' : 'var(--text-muted)' },
                  grcGelir:{ list: allGerceklesenGelirProj, bdKey: 'gerceklesenGelirBreakdown',  color: val => val > 0.5 ? '#22c55e' : 'var(--text-muted)' },
                  ppj:     { list: allPotPrijeProjects,     bdKey: 'potPrijeBreakdown',          color: val => val > 0.5 ? '#f59e0b' : 'var(--text-muted)' },
                  psp:     { list: allPotSiparis,           bdKey: 'potSiparisBreakdown',        color: val => val > 0.5 ? '#60a5fa' : 'var(--text-muted)' },
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

// ── Dönem Analiz Paneli ───────────────────────────────────────────────────────

function MonthYearSelect({ year, month, onChange }) {
  const sel = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit' };
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      <select value={month} onChange={e => onChange(year, Number(e.target.value))} style={sel}>
        {MONTHS_LONG.map((n, i) => <option key={i+1} value={i+1}>{n}</option>)}
      </select>
      <select value={year} onChange={e => onChange(Number(e.target.value), month)} style={sel}>
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </span>
  );
}

function SummaryMiniCard({ title, gelir, gider, accentColor }) {
  const fark = gelir - gider;
  const titleColor = accentColor || 'var(--text-secondary)';
  const borderColor = accentColor || 'var(--border)';
  const row = (label, val, color) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color }}>{fmtK(val)}</span>
    </div>
  );
  return (
    <div style={{ background: 'var(--bg-secondary)', border: `1px solid ${borderColor}`, borderRadius: 8, padding: '12px 14px', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: titleColor, marginBottom: 10, letterSpacing: '0.03em' }}>{title}</div>
      {row('Gelir', gelir, accentColor || '#4ade80')}
      {gider > 0 && row('Gider', gider, '#ef4444')}
      {row('Fark', fark, valColor(fark))}
    </div>
  );
}

function PeriodAnalysisPanel({ monthlyAgg }) {
  const now = new Date();
  const curYear = now.getFullYear(), curMonth = now.getMonth() + 1;

  const [sy, setSy] = useState(curYear);
  const [sm, setSm] = useState(1);        // Ocak'tan başla — gerçekleşen veriler yılın başından gelir
  const [ey, setEy] = useState(curYear);
  const [em, setEm] = useState(12);

  const [custom, setCustom] = useState(false);

  const [gSy, setGSy] = useState(curYear); const [gSm, setGSm] = useState(1);
  const [gEy, setGEy] = useState(curYear); const [gEm, setGEm] = useState(12);

  const [pSy, setPSy] = useState(curYear); const [pSm, setPSm] = useState(curMonth);
  const [pEy, setPEy] = useState(curYear); const [pEm, setPEm] = useState(12);

  const [potSy, setPotSy] = useState(curYear); const [potSm, setPotSm] = useState(curMonth);
  const [potEy, setPotEy] = useState(curYear); const [potEm, setPotEm] = useState(12);

  const calc = useMemo(() => {
    const rSy = custom ? gSy : sy,  rSm = custom ? gSm : sm;
    const rEy = custom ? gEy : ey,  rEm = custom ? gEm : em;
    const rPSy = custom ? pSy : sy,  rPSm = custom ? pSm : sm;
    const rPEy = custom ? pEy : ey,  rPEm = custom ? pEm : em;
    const rPotSy = custom ? potSy : sy,  rPotSm = custom ? potSm : sm;
    const rPotEy = custom ? potEy : ey,  rPotEm = custom ? potEm : em;

    let gercGelir = 0, gercGider = 0, planGelir = 0, planGider = 0, potGelir = 0, bekleyenGelir = 0;
    for (const d of Object.values(monthlyAgg)) {
      const { year, month } = d;
      const isPast = year < curYear || (year === curYear && month < curMonth);
      const isFuture = year > curYear || (year === curYear && month > curMonth);
      const isCurrent = year === curYear && month === curMonth;

      if (inPeriod(year, month, rSy, rSm, rEy, rEm)) {
        gercGelir += d.gerceklesenGelir;
        gercGider += d.gerceklesenGider;
      }
      // Bekleyen alacak: geçmiş ayda planlı ama henüz tahsil edilmemiş
      if (isPast && inPeriod(year, month, rPSy, rPSm, rPEy, rPEm)) {
        bekleyenGelir += d.sozlesmeli;
      }
      // Planlanan: cari + gelecek aylar
      if ((isCurrent || isFuture) && inPeriod(year, month, rPSy, rPSm, rPEy, rPEm)) {
        planGelir += d.sozlesmeli;
        // Gider: sadece gelecek aylar — cari ay zaten gerçekleşen gider ile kapsanıyor
        if (isFuture) planGider += d.gider;
        else planGider += Math.max(0, d.gider - d.gerceklesenGider);
      }
      if ((isCurrent || isFuture) && inPeriod(year, month, rPotSy, rPotSm, rPotEy, rPotEm)) {
        potGelir += d.potSiparis + d.potPrije;
      }
    }
    return { gercGelir, gercGider, planGelir, planGider, potGelir, bekleyenGelir };
  }, [monthlyAgg, sy, sm, ey, em, custom, gSy, gSm, gEy, gEm, pSy, pSm, pEy, pEm, potSy, potSm, potEy, potEm, curYear, curMonth]);

  const { gercGelir, gercGider, planGelir, planGider, potGelir, bekleyenGelir } = calc;
  const tahGelir = gercGelir + bekleyenGelir + planGelir;
  const tahGider = gercGider + planGider;

  const labelStyle = { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' };
  const dashStyle  = { fontSize: 13, color: 'var(--text-muted)', margin: '0 6px' };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', marginBottom: 14 }}>

      {/* Periyot satırı */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginRight: 4 }}>Periyot:</span>
        {!custom ? (
          <>
            <MonthYearSelect year={sy} month={sm} onChange={(y, m) => { setSy(y); setSm(m); }} />
            <span style={dashStyle}>—</span>
            <MonthYearSelect year={ey} month={em} onChange={(y, m) => { setEy(y); setEm(m); }} />
          </>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Her bölüm için ayrı periyot seçildi</span>
        )}
        <button
          onClick={() => setCustom(c => !c)}
          style={{ marginLeft: 'auto', fontSize: 11, padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: custom ? 'var(--accent)' : 'var(--bg-secondary)', color: custom ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
        >
          ⚙ Hesaplama tarihlerini özelleştir
        </button>
      </div>

      {/* Özelleştirilmiş periyot seçicileri */}
      {custom && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
          {[
            { title: 'Gerçekleşen', sy: gSy, sm: gSm, ey: gEy, em: gEm, setSy: setGSy, setSm: setGSm, setEy: setGEy, setEm: setGEm },
            { title: 'Planlanan',   sy: pSy, sm: pSm, ey: pEy, em: pEm, setSy: setPSy, setSm: setPSm, setEy: setPEy, setEm: setPEm },
            { title: 'Potansiyel',  sy: potSy, sm: potSm, ey: potEy, em: potEm, setSy: setPotSy, setSm: setPotSm, setEy: setPotEy, setEm: setPotEm },
          ].map(({ title, sy, sm, ey, em, setSy, setSm, setEy, setEm }) => (
            <div key={title} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
              <span style={labelStyle}>{title} Periyodu</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                <MonthYearSelect year={sy} month={sm} onChange={(y, m) => { setSy(y); setSm(m); }} />
                <span style={dashStyle}>—</span>
                <MonthYearSelect year={ey} month={em} onChange={(y, m) => { setEy(y); setEm(m); }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Üst iki büyük kart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent)', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 12 }}>Tahminlenen Finansal Durum</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Gerçekleşen Gelir</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#4ade80' }}>{fmtK(gercGelir)}</span>
          </div>
          {bekleyenGelir > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#f59e0b' }}>Bekleyen Alacak</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>{fmtK(bekleyenGelir)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Planlanan Gelir</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#4ade80' }}>{fmtK(planGelir)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Gider</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>{fmtK(tahGider)}</span>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Fark</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: valColor(tahGelir - tahGider) }}>{fmtK(tahGelir - tahGider)}</span>
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid #f59e0b', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 12 }}>Tahminlenen Potansiyel</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Gelir</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#4ade80' }}>{fmtK(tahGelir + potGelir)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Gider</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>{fmtK(tahGider)}</span>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Fark</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: valColor(tahGelir + potGelir - tahGider) }}>{fmtK(tahGelir + potGelir - tahGider)}</span>
          </div>
        </div>
      </div>

      {/* Alt küçük kartlar */}
      <div style={{ display: 'grid', gridTemplateColumns: bekleyenGelir > 0 ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: 10 }}>
        <SummaryMiniCard title="Gerçekleşen"    gelir={gercGelir}    gider={gercGider} />
        {bekleyenGelir > 0 && (
          <SummaryMiniCard title="Bekleyen Alacak" gelir={bekleyenGelir} gider={0} accentColor="#f59e0b" />
        )}
        <SummaryMiniCard title="Planlanan"      gelir={planGelir}    gider={planGider} />
        <SummaryMiniCard title="Potansiyel"     gelir={potGelir}     gider={0} />
      </div>
    </div>
  );
}

// ── Güncel Cari Durum ─────────────────────────────────────────────────────────

const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function GuncelDurum({ monthlyAgg }) {
  const now = new Date();
  const curYear  = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const prevMonth = curMonth === 1 ? 12 : curMonth - 1;
  const prevYear  = curMonth === 1 ? curYear - 1 : curYear;

  const [selYear,  setSelYear]  = useState(prevYear);
  const [selMonth, setSelMonth] = useState(prevMonth);

  const years = Array.from({ length: 3 }, (_, i) => curYear - 1 + i);

  // Kümülatif: seçilen yılın Ocak'ından seçilen aya kadar toplam
  const calc = useMemo(() => {
    let gercGelir = 0, gercGider = 0, bekleyen = 0;
    for (let m = 1; m <= selMonth; m++) {
      const d = monthlyAgg[`${selYear}_${m}`];
      if (!d) continue;
      gercGelir += d.gerceklesenGelir || 0;
      gercGider += d.gerceklesenGider || 0;
      // Bekleyen alacak: planlı ama tamamlanmamış (sozlesmeli), geçmiş veya seçilen ay
      const isNotFuture = selYear < curYear || (selYear === curYear && m <= curMonth);
      if (isNotFuture) bekleyen += d.sozlesmeli || 0;
    }
    const toplam = gercGelir + bekleyen - gercGider;
    return { gercGelir, gercGider, bekleyen, toplam };
  }, [monthlyAgg, selYear, selMonth, curYear, curMonth]);

  const selStyle = { fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' };

  const row = (label, val, color) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: color === '#f59e0b' ? '#f59e0b' : 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: color || 'var(--text-primary)' }}>{fmtK(val)}</span>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 10, padding: '14px 18px' }}>
      {/* Başlık + seçici */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Güncel Cari Durum</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Periyot</span>
          <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))} style={selStyle}>
            {MONTHS_TR.map((name, i) => <option key={i+1} value={i+1}>{name}</option>)}
          </select>
          <select value={selYear} onChange={e => setSelYear(Number(e.target.value))} style={selStyle}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Satırlar */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
        Ocak {selYear} – {MONTHS_TR[selMonth - 1]} {selYear} kümülatif
      </div>
      {row('Gerçekleşen Gelir', calc.gercGelir, '#4ade80')}
      {row('Gerçekleşen Gider', calc.gercGider, '#ef4444')}
      {row('Bekleyen Alacak', calc.bekleyen, '#f59e0b')}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, marginTop: 2 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Toplam</span>
        <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'DM Mono, monospace', color: valColor(calc.toplam) }}>{fmtK(calc.toplam)}</span>
      </div>
    </div>
  );
}

// ── Tümü Özet Tablosu ─────────────────────────────────────────────────────────

function SummaryCard({ label, monthlyAgg }) {
  const [open, setOpen] = useState(true);
  const totals = useMemo(() => sumPnL(monthlyAgg), [monthlyAgg]);

  return (
    <div style={{ borderRadius: 8, border: '2px solid var(--accent)', background: 'var(--bg-card)', overflow: 'hidden', marginBottom: 8 }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>{label}</div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
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

function ProjectDetail({ project, personnelMap, seniorityMap, linkedSiparisler, projectCosts, historyByPersonnel, procurements, onBack }) {
  const monthlyData = useMemo(
    () => calcProjectPnL(project, personnelMap, seniorityMap, linkedSiparisler, projectCosts, historyByPersonnel, procurements),
    [project, personnelMap, seniorityMap, linkedSiparisler, projectCosts, historyByPersonnel, procurements],
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
  const { data: projects = [] }          = useProjects();
  const { data: personnel = [] }         = usePersonnel();
  const { data: seniorities = [] }       = useSeniorities();
  const { data: potSales = [] }          = usePotentialSales();
  const { data: units = [] }             = useOrganization();
  const { data: allCosts = [] }             = useAllProjectCosts();
  const { data: allSeniorityHistory = [] }  = useAllSeniorityHistory();
  const { data: allProcurementsData = [] }  = useAllProcurements();

  const [selected, setSelected] = useState(null);

  const personnelMap = useMemo(() => Object.fromEntries(personnel.map(p => [p.id, p])), [personnel]);

  // Kıdem geçmişini kişi bazında grupla: { [personnelId]: [{seniorityId, startDate, endDate}] }
  const historyByPersonnel = useMemo(() => {
    const map = {};
    for (const h of allSeniorityHistory) {
      const pid = String(h.personnelId);
      if (!map[pid]) map[pid] = [];
      map[pid].push(h);
    }
    return map;
  }, [allSeniorityHistory]);
  const seniorityMap = useMemo(() => Object.fromEntries(seniorities.map(s => [s.id, s])), [seniorities]);
  // Sadece kök (1. seviye) birimler
  const unitMap = useMemo(() => Object.fromEntries(units.filter(u => !u.parentId).map(u => [String(u.id), u])), [units]);
  // Maliyet verilerini proje bazında grupla: { [projectId]: [{year, month, amount, ...}] }
  const costsByProject = useMemo(() => {
    const map = {};
    for (const c of allCosts) {
      const pid = String(c.projectId);
      if (!map[pid]) map[pid] = [];
      map[pid].push(c);
    }
    return map;
  }, [allCosts]);

  // Satın alma kayıtlarını proje bazında grupla: { [projectId]: [{...}] }
  const procurementsByProject = useMemo(() => {
    const map = {};
    for (const p of allProcurementsData) {
      const pid = String(p.projectId);
      if (!map[pid]) map[pid] = [];
      map[pid].push(p);
    }
    return map;
  }, [allProcurementsData]);

  // Aktif projeler (POTANSIYEL olmayanlar) — P&L'de bunlar görünür
  const activeProjects = useMemo(() => projects.filter(p => !p.projectStatus || p.projectStatus !== 'POTANSIYEL'), [projects]);
  const potProjects    = useMemo(() => projects.filter(p => p.projectStatus === 'POTANSIYEL'), [projects]);
  const siparisler     = useMemo(() => potSales.filter(s => s.saleType === 'SIPARIS'), [potSales]);

  const sortedProjects = useMemo(() => [...activeProjects].sort((a, b) => a.name.localeCompare(b.name, 'tr')), [activeProjects]);

  // Genel Giderler
  const { data: generalExpenses = [] } = useQuery({
    queryKey: ['general-expenses'],
    queryFn: () => generalExpenseApi.getAll().then(r => r.data),
  });

  // Her (yıl_ay) için toplam adam-ay: kişi başı tüm projelerdeki planlama toplanır (çifte sayım yok)
  const personMonthTotals = useMemo(() => {
    const byMonthPerson = {}; // { "2026_1": { "pid": toplam } }
    for (const project of activeProjects) {
      for (const entry of (project.resourcePlan || [])) {
        if (entry.planned == null) continue;
        const key = `${entry.year}_${entry.month}`;
        if (!byMonthPerson[key]) byMonthPerson[key] = {};
        const pid = String(entry.personnelId);
        byMonthPerson[key][pid] = (byMonthPerson[key][pid] || 0) + entry.planned;
      }
    }
    const totals = {};
    for (const [key, persons] of Object.entries(byMonthPerson)) {
      totals[key] = Object.values(persons).reduce((s, v) => s + v, 0);
    }
    return totals;
  }, [activeProjects]);

  // Ay bazında genel gider katkısı: toplam adam-ay × o aya denk gelen genel gider tutarları
  const genExpContrib = useMemo(() => {
    const result = {};
    for (const [key, personMonths] of Object.entries(personMonthTotals)) {
      const [year, month] = key.split('_').map(Number);
      const applicable = generalExpenses.filter(e =>
        inPeriod(year, month, e.startYear, e.startMonth, e.endYear, e.endMonth)
      );
      const rate = applicable.reduce((s, e) => s + e.amount, 0);
      if (rate > 0) result[key] = personMonths * rate;
    }
    return result;
  }, [personMonthTotals, generalExpenses]);

  // Tek seferde hesapla — hem PeriodAnalysisPanel hem SummaryCard kullanır
  const monthlyAgg = useMemo(() => {
    const base = aggPnL(sortedProjects, potProjects, personnelMap, seniorityMap, siparisler, costsByProject, historyByPersonnel, procurementsByProject);
    if (Object.keys(genExpContrib).length === 0) return base;

    const result = {};
    for (const [key, val] of Object.entries(base)) {
      result[key] = { ...val, giderBreakdown: [...val.giderBreakdown] };
    }
    for (const [key, amount] of Object.entries(genExpContrib)) {
      if (!result[key]) {
        const [y, m] = key.split('_').map(Number);
        result[key] = emptyMonthData(y, m);
      }
      result[key].genExp += amount;
      recalcTotals(result[key]);
    }
    return result;
  }, [sortedProjects, potProjects, personnelMap, seniorityMap, siparisler, costsByProject, genExpContrib, historyByPersonnel, procurementsByProject]);

  const allTotals = useMemo(() => {
    const map = {};
    for (const p of activeProjects) {
      const linked = siparisler.filter(s => s.projectId && String(s.projectId) === String(p.id));
      const projectCosts  = costsByProject[String(p.id)]  || [];
      const procurements  = procurementsByProject[String(p.id)] || [];
      map[p.id] = sumPnL(calcProjectPnL(p, personnelMap, seniorityMap, linked, projectCosts, historyByPersonnel, procurements));
    }
    return map;
  }, [activeProjects, personnelMap, seniorityMap, siparisler, costsByProject, historyByPersonnel, procurementsByProject]);

  if (selected) {
    const linkedSiparisler = siparisler.filter(s => s.projectId && String(s.projectId) === String(selected.id));
    const selectedCosts        = costsByProject[String(selected.id)]       || [];
    const selectedProcurements = procurementsByProject[String(selected.id)] || [];
    return (
      <ProjectDetail
        project={selected}
        personnelMap={personnelMap}
        seniorityMap={seniorityMap}
        linkedSiparisler={linkedSiparisler}
        projectCosts={selectedCosts}
        historyByPersonnel={historyByPersonnel}
        procurements={selectedProcurements}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">P&amp;L</div>
          <div className="page-subtitle">{activeProjects.length} aktif proje</div>
        </div>
      </div>

      {/* Dönem analiz paneli */}
      <PeriodAnalysisPanel monthlyAgg={monthlyAgg} />

      {/* Güncel durum — ay bazlı gelir/gider özeti */}
      <GuncelDurum monthlyAgg={monthlyAgg} />

      {/* Tümü özet tablosu */}
      <SummaryCard label="Tümü Toplamı" monthlyAgg={monthlyAgg} />

      {/* Proje listesi */}
      <div style={{ marginTop: 20 }}>
        <GroupSection
          title="Tümü"
          projects={sortedProjects}
          allTotals={allTotals}
          onSelect={setSelected}
          unitMap={unitMap}
          byEmy={false}
        />
      </div>
    </div>
  );
}
