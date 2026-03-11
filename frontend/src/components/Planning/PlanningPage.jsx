import { useState, useEffect, useRef } from 'react';
import { projectApi, personnelApi } from '../../services/api';

const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const MONTHS_FULL = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const TYPES = ['need','planned','actual'];
const TYPE_LABELS = { need: 'İhtiyaç', planned: 'Planlanan', actual: 'Gerçekleşen' };
const TYPE_COLORS = { need: 'var(--accent)', planned: '#a78bfa', actual: 'var(--success)' };

function XIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }

function getProjectMonths(project) {
  const months = [];
  let m = project.startMonth, y = project.startYear;
  while (y < project.endYear || (y === project.endYear && m <= project.endMonth)) {
    months.push({ month: m, year: y });
    m++; if (m > 12) { m = 1; y++; }
  }
  return months;
}

function PctInput({ value, onChange }) {
  const [local, setLocal] = useState(value === null || value === undefined ? '' : String(value));

  useEffect(() => {
    setLocal(value === null || value === undefined ? '' : String(value));
  }, [value]);

  const commit = () => {
    const trimmed = local.trim();
    if (trimmed === '') { onChange(null); return; }
    const n = Number(trimmed);
    if (isNaN(n)) { setLocal(''); onChange(null); return; }
    onChange(Math.min(100, Math.max(0, n)));
  };

  return (
    <input
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={commit}
      onFocus={e => e.target.select()}
      onKeyDown={e => { if (e.key === 'Enter') { commit(); } }}
      style={{
        width: 34, height: 22, textAlign: 'center', fontSize: 11,
        background: 'transparent', border: 'none', outline: 'none',
        color: local ? 'var(--text-primary)' : 'var(--text-muted)',
        fontFamily: 'DM Mono, monospace', padding: 0,
      }}
      placeholder="—"
    />
  );
}

function BulkAssignModal({ person, project, onSave, onClose }) {
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);
  const [startMonth, setStartMonth] = useState(project.startMonth);
  const [startYear, setStartYear] = useState(project.startYear);
  const [endMonth, setEndMonth] = useState(project.endMonth);
  const [endYear, setEndYear] = useState(project.endYear);
  const [need, setNeed] = useState('');
  const [planned, setPlanned] = useState('');
  const [actual, setActual] = useState('');

  const handleSave = () => {
    const updates = {};
    let m = startMonth, y = startYear;
    while (y < endYear || (y === endYear && m <= endMonth)) {
      const key = `${person.id}_${y}_${m}`;
      updates[key] = {
        need: need !== '' ? Math.min(100, Math.max(0, Number(need))) : undefined,
        planned: planned !== '' ? Math.min(100, Math.max(0, Number(planned))) : undefined,
        actual: actual !== '' ? Math.min(100, Math.max(0, Number(actual))) : undefined,
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
          Seçilen periyot için yüzde değerlerini girin. Boş bırakılan alanlar değişmez.
        </p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div className="form-label">Başlangıç</div>
            <div className="month-year-row">
              <select className="form-select" value={startMonth} onChange={e => setStartMonth(+e.target.value)}>
                {MONTHS_FULL.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <select className="form-select" value={startYear} onChange={e => setStartYear(+e.target.value)}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="form-label">Bitiş</div>
            <div className="month-year-row">
              <select className="form-select" value={endMonth} onChange={e => setEndMonth(+e.target.value)}>
                {MONTHS_FULL.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <select className="form-select" value={endYear} onChange={e => setEndYear(+e.target.value)}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[['need', need, setNeed], ['planned', planned, setPlanned], ['actual', actual, setActual]].map(([type, val, setter]) => (
            <div key={type}>
              <div className="form-label" style={{ color: TYPE_COLORS[type] }}>{TYPE_LABELS[type]}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input className="form-input" value={val} onChange={e => setter(e.target.value)}
                  placeholder="—" style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>%</span>
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

function ProjectPlanTable({ project, personnel, onSave }) {
  const months = getProjectMonths(project);
  const assignedPersonnel = personnel.filter(p => (project.personnelIds || []).includes(p.id));
  const [bulkPerson, setBulkPerson] = useState(null);
  const [localPlan, setLocalPlan] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const map = {};
    for (const e of (project.resourcePlan || [])) {
      map[`${e.personnelId}_${e.year}_${e.month}`] = { need: e.need ?? null, planned: e.planned ?? null, actual: e.actual ?? null };
    }
    setLocalPlan(map);
    setDirty(false);
  }, [project.id, project.resourcePlan]);

  const getVal = (personId, year, month, type) => {
    return localPlan[`${personId}_${year}_${month}`]?.[type] ?? null;
  };

  const setVal = (personId, year, month, type, value) => {
    const key = `${personId}_${year}_${month}`;
    setLocalPlan(prev => ({ ...prev, [key]: { ...prev[key], [type]: value } }));
    setDirty(true);
  };

  const handleBulkSave = (updates) => {
    setLocalPlan(prev => {
      const next = { ...prev };
      for (const [key, vals] of Object.entries(updates)) {
        next[key] = { ...next[key] };
        if (vals.need !== undefined) next[key].need = vals.need;
        if (vals.planned !== undefined) next[key].planned = vals.planned;
        if (vals.actual !== undefined) next[key].actual = vals.actual;
      }
      return next;
    });
    setDirty(true);
    setBulkPerson(null);
  };

  const handleSave = async () => {
    setSaving(true);
    const resourcePlan = [];
    for (const [key, vals] of Object.entries(localPlan)) {
      const parts = key.split('_');
      const personnelId = parts[0];
      const year = +parts[1];
      const month = +parts[2];
      if (vals.need != null || vals.planned != null || vals.actual != null) {
        resourcePlan.push({ personnelId, year, month, need: vals.need, planned: vals.planned, actual: vals.actual });
      }
    }
    try {
      await projectApi.updateResourcePlan(project.id, resourcePlan);
      setDirty(false);
      onSave();
    } finally { setSaving(false); }
  };

  if (assignedPersonnel.length === 0) {
    return <div style={{ padding: '16px 0', color: 'var(--text-muted)', fontSize: 13 }}>Bu projeye henüz personel atanmamış. Proje detayından personel ekleyin.</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{assignedPersonnel.length} kaynak · {months.length} ay</div>
        {dirty && (
          <button className="btn btn-primary" style={{ padding: '5px 14px', fontSize: 12 }} onClick={handleSave} disabled={saving}>
            {saving ? 'Kaydediliyor...' : '💾 Değişiklikleri Kaydet'}
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              <th style={{ padding: '8px 12px', minWidth: 170, textAlign: 'left', position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 2, borderBottom: '1px solid var(--border)', borderRight: '2px solid var(--border)' }}>
                Kaynak
              </th>
              {months.map(({ month, year }) => (
                <th key={`${year}_${month}`} colSpan={3}
                  style={{ padding: '6px 4px', textAlign: 'center', minWidth: 114, borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {MONTHS[month-1]} {year}
                </th>
              ))}
            </tr>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              <th style={{ position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 2, borderBottom: '2px solid var(--border)', borderRight: '2px solid var(--border)', minWidth: 170 }} />
              {months.map(({ month, year }) =>
                TYPES.map(type => (
                  <th key={`${year}_${month}_${type}`}
                    style={{ padding: '4px 4px', textAlign: 'center', width: 38, borderBottom: '2px solid var(--border)', borderLeft: type === 'need' ? '1px solid var(--border)' : 'none', color: TYPE_COLORS[type], fontSize: 10, fontWeight: 600 }}>
                    {type === 'need' ? 'İht' : type === 'planned' ? 'Pln' : 'Grc'}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {assignedPersonnel.map((person, pi) => (
              <tr key={person.id} style={{ borderBottom: '1px solid var(--border)', background: pi % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                <td style={{ padding: '5px 12px', position: 'sticky', left: 0, background: pi % 2 === 0 ? 'var(--bg-card)' : '#1e2130', zIndex: 1, borderRight: '2px solid var(--border)', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 500, fontSize: 12 }}>{person.firstName} {person.lastName}</span>
                    <button onClick={() => setBulkPerson(person)} title="Toplu atama"
                      style={{ padding: '1px 6px', fontSize: 10, background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 3, cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif', lineHeight: '18px' }}>
                      Toplu
                    </button>
                  </div>
                </td>
                {months.map(({ month, year }) =>
                  TYPES.map(type => {
                    const v = getVal(person.id, year, month, type);
                    return (
                      <td key={`${year}_${month}_${type}`}
                        style={{ padding: '2px 2px', textAlign: 'center', borderLeft: type === 'need' ? '1px solid var(--border)' : 'none', verticalAlign: 'middle', background: v != null ? `${TYPE_COLORS[type]}18` : 'transparent' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <PctInput value={v} onChange={val => setVal(person.id, year, month, type, val)} />
                          {v != null && <span style={{ fontSize: 9, color: TYPE_COLORS[type] }}>%</span>}
                        </div>
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bulkPerson && (
        <BulkAssignModal person={bulkPerson} project={project} onSave={handleBulkSave} onClose={() => setBulkPerson(null)} />
      )}
    </div>
  );
}

export default function PlanningPage() {
  const [projects, setProjects] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openProjectId, setOpenProjectId] = useState(null);

  const load = async () => {
    const [pRes, perRes] = await Promise.all([projectApi.getAll(), personnelApi.getAll()]);
    setProjects(pRes.data);
    setPersonnel(perRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Proje Planlama</div>
          <div className="page-subtitle">Kaynak ihtiyaç, planlama ve gerçekleşen atamalarını yönetin</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 20, padding: '10px 16px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)', width: 'fit-content' }}>
        {TYPES.map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: TYPE_COLORS[t] }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{TYPE_LABELS[t]}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="loading">Yükleniyor...</div>
      ) : projects.length === 0 ? (
        <div className="empty-state"><p>Henüz proje eklenmemiş.</p></div>
      ) : (
        projects.map(project => {
          const isOpen = openProjectId === project.id;
          const assignedCount = (project.personnelIds || []).length;
          return (
            <div key={project.id} className="card" style={{ marginBottom: 12, overflow: 'hidden' }}>
              <div onClick={() => setOpenProjectId(isOpen ? null : project.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ color: 'var(--accent)', fontSize: 12, transition: 'transform 0.2s', display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{project.name}</span>
                  {project.customerName && <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>{project.customerName}</span>}
                </div>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                  {MONTHS[project.startMonth-1]} {project.startYear} – {MONTHS[project.endMonth-1]} {project.endYear}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
                  {assignedCount} kaynak
                </span>
              </div>
              {isOpen && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ paddingTop: 16 }}>
                    <ProjectPlanTable project={project} personnel={personnel} onSave={load} />
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
