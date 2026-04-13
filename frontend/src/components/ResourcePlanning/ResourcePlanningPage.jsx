import { useState, useEffect, useMemo, useRef } from 'react';
import { organizationApi, personnelApi, projectApi } from '../../services/api';

const MONTHS_SHORT = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const NAME_W = 220;
const COL_W  = 76;

const FILTER_LABELS = ['SGE', 'Teknoloji', 'Hizmetler'];
const FILTER_PATTERNS = {
  'SGE':       ['sge', 'enstitü'],
  'Teknoloji': ['teknoloji'],
  'Hizmetler': ['hizmetler'],
};

function getMonths(count = 16) {
  const now = new Date();
  let y = now.getFullYear(), m = 1; // Ocak'tan başla
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push({ year: y, month: m });
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return result;
}

function utilColor(pct) {
  if (!pct) return 'var(--text-muted)';
  if (pct > 100) return '#a78bfa'; // mor: aşım
  if (pct >= 80)  return '#34d399'; // yeşil: iyi
  if (pct >= 50)  return '#fbbf24'; // sarı: orta
  return '#f87171';                  // kırmızı: düşük
}

function utilBg(pct) {
  if (!pct) return 'transparent';
  if (pct > 100) return 'rgba(167,139,250,0.13)';
  if (pct >= 80)  return 'rgba(52,211,153,0.09)';
  if (pct >= 50)  return 'rgba(251,191,36,0.11)';
  return 'rgba(248,113,113,0.13)';
}

export default function ResourcePlanningPage() {
  const [units, setUnits]         = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selectedFilters, setSelectedFilters] = useState(new Set(FILTER_LABELS));
  const [expandedPersons, setExpandedPersons] = useState(new Set());
  const scrollRef = useRef(null);

  const months = useMemo(() => getMonths(15), []);
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  useEffect(() => {
    Promise.all([
      organizationApi.getAll(),
      personnelApi.getAll(),
      projectApi.getAll(),
    ]).then(([uRes, pRes, prRes]) => {
      setUnits(uRes.data);
      setPersonnel(pRes.data);
      setProjects(prRes.data);
      setLoading(false);
    });
  }, []);

  // Tüm projelerden utilization map oluştur
  // { "personnelId_year_month": { total: number, projects: [{id, name, pct}] } }
  // DB'de iki farklı format var:
  //   Eski import: planned=1.0 → %100 (kesir, 0-1 arası)
  //   Yeni kayıt:  planned=10000 → %100 (toDb: v*100, 0-10000 arası)
  const toPct = (v) => v == null ? 0 : v <= 1 ? v * 100 : v / 100;

  const utilMap = useMemo(() => {
    const map = {};
    for (const project of projects) {
      for (const entry of (project.resourcePlan || [])) {
        if (!entry.planned) continue;
        const pct = toPct(entry.planned);
        if (pct < 1) continue; // 1%'den düşük değerleri yoksay
        const key = `${entry.personnelId}_${entry.year}_${entry.month}`;
        if (!map[key]) map[key] = { total: 0, projects: [] };
        map[key].total += pct;
        map[key].projects.push({ id: project.id, name: project.name, pct });
      }
    }
    return map;
  }, [projects]);

  // Bölüm filtreleri
  const rootUnits = units.filter(u => !u.parentId);
  const filterGroups = FILTER_LABELS.map(label => ({
    label,
    unit: rootUnits.find(u => FILTER_PATTERNS[label].some(p => u.name.toLowerCase().includes(p))),
  }));
  const selectedRootIds = new Set(
    filterGroups.filter(f => selectedFilters.has(f.label) && f.unit).map(f => f.unit.id)
  );

  // Seçili kök birimlere ait alt birimler
  const visibleSubUnits = units
    .filter(u => u.parentId && selectedRootIds.has(u.parentId))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  // Her alt birim için personel listesi
  const personnelByUnit = useMemo(() => {
    const map = {};
    for (const unit of visibleSubUnits) {
      map[unit.id] = personnel
        .filter(p => String(p.unitId) === String(unit.id))
        .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'tr'));
    }
    return map;
  }, [visibleSubUnits, personnel]);

  const togglePerson = (id) => {
    setExpandedPersons(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleFilter = (label) => {
    setSelectedFilters(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64 }}>
      <div style={{ color: 'var(--text-muted)' }}>Yükleniyor…</div>
    </div>
  );

  return (
    <div>
      {/* Başlık */}
      <div className="page-header">
        <div>
          <div className="page-title">Kaynak Planlama</div>
          <div className="page-subtitle">Bölüm bazlı aylık doluluk oranları</div>
        </div>
      </div>

      {/* Filtreler */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {filterGroups.map(({ label, unit }) => (
          <button key={label} onClick={() => toggleFilter(label)}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
              cursor: unit ? 'pointer' : 'default',
              opacity: unit ? 1 : 0.4,
              border: selectedFilters.has(label) ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: selectedFilters.has(label) ? 'var(--accent-dim)' : 'transparent',
              color: selectedFilters.has(label) ? 'var(--accent)' : 'var(--text-secondary)',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.15s',
            }}>
            {label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f87171', display: 'inline-block' }} /> &lt;50%
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#fbbf24', display: 'inline-block' }} /> 50-79%
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#34d399', display: 'inline-block' }} /> 80-100%
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#a78bfa', display: 'inline-block' }} /> &gt;100%
          </span>
        </div>
      </div>

      {visibleSubUnits.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48, fontSize: 14 }}>
          Gösterilecek bölüm yok.
        </div>
      ) : (
        <div ref={scrollRef} style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: NAME_W + COL_W * months.length + 2 }}>

            {/* Sticky header */}
            <div style={{
              display: 'flex', position: 'sticky', top: 0, zIndex: 4,
              background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)',
              borderTop: '1px solid var(--border)',
            }}>
              <div style={{
                minWidth: NAME_W, width: NAME_W, padding: '7px 14px',
                fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                position: 'sticky', left: 0, zIndex: 5,
                background: 'var(--bg-secondary)', borderRight: '2px solid var(--border)',
              }}>
                Kaynak
              </div>
              {months.map(({ year, month }) => {
                const isCur = year === curYear && month === curMonth;
                return (
                  <div key={`${year}_${month}`} style={{
                    minWidth: COL_W, width: COL_W, padding: '7px 4px',
                    fontSize: 11, textAlign: 'center', flexShrink: 0,
                    fontWeight: isCur ? 700 : 500,
                    color: isCur ? 'var(--accent)' : 'var(--text-secondary)',
                    background: isCur ? 'rgba(99,102,241,0.1)' : 'transparent',
                    borderLeft: '1px solid var(--border)',
                    whiteSpace: 'nowrap',
                  }}>
                    {MONTHS_SHORT[month - 1]} {String(year).slice(2)}
                    {isCur && <div style={{ fontSize: 9, color: 'var(--accent)', lineHeight: 1 }}>▲</div>}
                  </div>
                );
              })}
            </div>

            {/* Bölümler */}
            {visibleSubUnits.map(unit => {
              const people = personnelByUnit[unit.id] || [];
              if (people.length === 0) return null;

              return (
                <div key={unit.id}>
                  {/* Bölüm başlığı */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                  }}>
                    <div style={{
                      minWidth: NAME_W, width: NAME_W,
                      padding: '9px 14px',
                      fontSize: 12, fontWeight: 700, letterSpacing: '0.03em',
                      color: 'var(--accent)', textTransform: 'uppercase',
                      position: 'sticky', left: 0, zIndex: 2,
                      background: 'var(--bg-card)',
                      borderRight: '2px solid var(--border)',
                      borderTop: '2px solid var(--border)',
                      whiteSpace: 'nowrap', overflow: 'hidden',
                    }}>
                      {unit.name}
                      <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>
                        ({people.length} kişi)
                      </span>
                    </div>
                    {months.map(({ year, month }) => {
                      const isCur = year === curYear && month === curMonth;
                      // Bölüm toplam doluluk: tüm personelin o aydaki toplamı
                      const unitTotal = people.reduce((sum, p) => {
                        const u = utilMap[`${p.id}_${year}_${month}`];
                        return sum + (u ? u.total : 0);
                      }, 0);
                      const avgUtil = people.length ? Math.round(unitTotal / people.length) : 0;
                      return (
                        <div key={`${year}_${month}`} style={{
                          minWidth: COL_W, width: COL_W, flexShrink: 0,
                          textAlign: 'center', fontSize: 11, fontWeight: 600,
                          padding: '9px 4px',
                          color: avgUtil ? utilColor(avgUtil) : 'var(--text-muted)',
                          background: isCur ? 'rgba(99,102,241,0.06)' : 'transparent',
                          borderLeft: '1px solid var(--border)',
                          borderTop: '2px solid var(--border)',
                        }}>
                          {avgUtil ? `${avgUtil}%` : '—'}
                        </div>
                      );
                    })}
                  </div>

                  {/* Personel satırları */}
                  {people.map((person, pi) => {
                    const isExpanded = expandedPersons.has(person.id);
                    const rowBg = pi % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)';
                    const stickyBg = pi % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)';

                    // Bu kişinin projelerini topla
                    const projectsInMonths = {};
                    for (const { year, month } of months) {
                      const u = utilMap[`${person.id}_${year}_${month}`];
                      if (u) projectsInMonths[`${year}_${month}`] = u;
                    }

                    // Expand satırı için proje listesi (tüm aylarda görünen projeler)
                    const allProjectIds = new Set();
                    for (const entry of Object.values(projectsInMonths)) {
                      for (const pr of entry.projects) allProjectIds.add(pr.id);
                    }
                    const projectRows = [...allProjectIds].map(pid => {
                      const prj = projects.find(p => p.id === pid);
                      return { id: pid, name: prj?.name || pid };
                    }).sort((a, b) => a.name.localeCompare(b.name, 'tr'));

                    return (
                      <div key={person.id}>
                        {/* Kişi satırı */}
                        <div
                          onClick={() => togglePerson(person.id)}
                          style={{
                            display: 'flex', alignItems: 'stretch',
                            borderBottom: '1px solid var(--border)',
                            background: rowBg,
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{
                            minWidth: NAME_W, width: NAME_W,
                            padding: '6px 14px',
                            position: 'sticky', left: 0, zIndex: 1,
                            background: stickyBg,
                            borderRight: '2px solid var(--border)',
                            whiteSpace: 'nowrap',
                            display: 'flex', alignItems: 'center', gap: 7,
                          }}>
                            <span style={{
                              fontSize: 9, color: isExpanded ? 'var(--accent)' : 'var(--text-muted)',
                              transition: 'transform 0.15s',
                              display: 'inline-block',
                              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            }}>▶</span>
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                              {person.firstName} {person.lastName}
                            </span>
                          </div>
                          {months.map(({ year, month }) => {
                            const isCur = year === curYear && month === curMonth;
                            const u = utilMap[`${person.id}_${year}_${month}`];
                            const pct = u ? Math.round(u.total) : 0;
                            return (
                              <div key={`${year}_${month}`} style={{
                                minWidth: COL_W, width: COL_W, flexShrink: 0,
                                textAlign: 'center', fontSize: 12, fontWeight: 600,
                                padding: '6px 4px',
                                color: utilColor(pct || null),
                                background: isCur
                                  ? `rgba(99,102,241,0.06)`
                                  : utilBg(pct),
                                borderLeft: '1px solid var(--border)',
                              }}>
                                {pct ? `${pct}%` : '—'}
                              </div>
                            );
                          })}
                        </div>

                        {/* Proje kırılımı (expand) */}
                        {isExpanded && projectRows.map(pr => (
                          <div key={pr.id} style={{
                            display: 'flex', alignItems: 'stretch',
                            borderBottom: '1px solid var(--border)',
                            background: 'var(--bg-secondary)',
                          }}>
                            <div style={{
                              minWidth: NAME_W, width: NAME_W,
                              padding: '5px 14px 5px 34px',
                              position: 'sticky', left: 0, zIndex: 1,
                              background: 'var(--bg-secondary)',
                              borderRight: '2px solid var(--border)',
                              whiteSpace: 'nowrap', overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontSize: 11, color: 'var(--text-muted)',
                            }}>
                              ↳ {pr.name}
                            </div>
                            {months.map(({ year, month }) => {
                              const isCur = year === curYear && month === curMonth;
                              const u = utilMap[`${person.id}_${year}_${month}`];
                              const entry = u?.projects.find(p => p.id === pr.id);
                              const pct = entry ? Math.round(entry.pct) : 0;
                              return (
                                <div key={`${year}_${month}`} style={{
                                  minWidth: COL_W, width: COL_W, flexShrink: 0,
                                  textAlign: 'center', fontSize: 11,
                                  padding: '5px 4px',
                                  color: pct ? 'var(--accent)' : 'var(--text-muted)',
                                  background: isCur ? 'rgba(99,102,241,0.04)' : 'transparent',
                                  borderLeft: '1px solid var(--border)',
                                }}>
                                  {pct ? `${pct}%` : '—'}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
