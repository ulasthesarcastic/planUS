import { useState, useEffect } from 'react';
import { potentialSaleApi, projectApi } from '../../services/api';
import SearchableSelect from '../SearchableSelect';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const fmt = (n) => (n||0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const STATUS_COLORS = { AKTIF: '#4f8ef7', KAZANILDI: '#34c97a', KAYBEDILDI: '#f05c5c' };
const STATUS_LABELS = { AKTIF: 'Aktif', KAZANILDI: 'Kazanıldı', KAYBEDILDI: 'Kaybedildi' };

function PlusIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function EditIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }

const YEARS = [2024, 2025, 2026, 2027, 2028];
const emptySale = (projects) => ({
  name: '', projectId: projects[0]?.id || '', amount: '',
  currency: 'TRY', probability: 50, targetMonth: new Date().getMonth() + 1,
  targetYear: new Date().getFullYear(), status: 'AKTIF',
});

function SaleModal({ sale, projects, onSave, onClose }) {
  const isEdit = !!sale?.id;
  const [form, setForm] = useState(sale?.id ? { ...sale } : emptySale(projects));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleStatusChange = (status) => {
    let prob = form.probability;
    if (status === 'KAZANILDI') prob = 100;
    else if (status === 'KAYBEDILDI') prob = 0;
    setForm(f => ({ ...f, status, probability: prob }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Satış adı zorunludur.');
    if (!form.projectId) return setError('Proje seçilmelidir.');
    setSaving(true);
    try {
      const data = { ...form, amount: parseFloat(form.amount) || 0, probability: parseFloat(form.probability) || 0 };
      if (isEdit) await potentialSaleApi.update(sale.id, data);
      else await potentialSaleApi.create(data);
      onSave();
    } catch (e) {
      setError(e.response?.data?.error || 'Bir hata oluştu.');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Satış Düzenle' : 'Yeni Potansiyel Satış'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Satış Adı</label>
          <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
        </div>

        <div className="form-group">
          <label className="form-label">Proje</label>
          <SearchableSelect
            value={form.projectId || ''}
            onChange={v => setForm(f => ({ ...f, projectId: v }))}
            placeholder="— Seçin —"
            style={{ width: '100%' }}
            options={[
              { value: '', label: '— Seçin —' },
              ...projects.map(p => ({ value: String(p.id), label: p.name })),
            ]}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tutar</label>
            <input className="form-input" type="number" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              style={{ fontFamily: 'DM Mono, monospace' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Para Birimi</label>
            <select className="form-select" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
              {['TRY','USD','EUR'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Olasılık (%)</label>
          <input className="form-input" type="number" min="0" max="100"
            value={form.probability}
            onChange={e => setForm(f => ({ ...f, probability: +e.target.value }))}
            disabled={form.status !== 'AKTIF'}
            style={{ fontFamily: 'DM Mono, monospace' }} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <label className="form-label" style={{ margin: 0, alignSelf: 'center' }}>Tahmini Tarih:</label>
          <select className="form-select" style={{ width: 130 }} value={form.targetMonth}
            onChange={e => setForm(f => ({ ...f, targetMonth: +e.target.value }))}>
            {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="form-select" style={{ width: 90 }} value={form.targetYear}
            onChange={e => setForm(f => ({ ...f, targetYear: +e.target.value }))}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Durum</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['AKTIF','KAZANILDI','KAYBEDILDI'].map(s => (
              <button key={s} onClick={() => handleStatusChange(s)} style={{
                flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer',
                border: `2px solid ${form.status === s ? STATUS_COLORS[s] : 'var(--border)'}`,
                background: form.status === s ? `${STATUS_COLORS[s]}22` : 'var(--bg-secondary)',
                color: form.status === s ? STATUS_COLORS[s] : 'var(--text-muted)',
                fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600,
              }}>{STATUS_LABELS[s]}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Tahminlenen Satış</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', fontFamily: 'DM Mono, monospace' }}>
            {fmt((parseFloat(form.amount) || 0) * (parseFloat(form.probability) || 0) / 100)} {form.currency}
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>İptal</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const load = async () => {
    const [sRes, pRes] = await Promise.all([potentialSaleApi.getAll(), projectApi.getAll()]);
    setSales(sRes.data);
    setProjects(pRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getProjectName = (id) => projects.find(p => p.id === id)?.name || '—';

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const SortIcon = ({ col }) => sortCol !== col
    ? <span style={{ opacity: 0.3, fontSize: 10 }}>↕</span>
    : <span style={{ fontSize: 10 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;

  const filtered = sales
    .filter(s => statusFilter === 'ALL' || s.status === statusFilter)
    .sort((a, b) => {
      if (!sortCol) return 0;
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortCol === 'name') return dir * (a.name||'').localeCompare(b.name||'', 'tr');
      if (sortCol === 'project') return dir * (getProjectName(a.projectId)).localeCompare(getProjectName(b.projectId), 'tr');
      if (sortCol === 'amount') return dir * ((a.amount||0) - (b.amount||0));
      if (sortCol === 'probability') return dir * ((a.probability||0) - (b.probability||0));
      if (sortCol === 'estimated') return dir * ((a.amount*a.probability/100) - (b.amount*b.probability/100));
      if (sortCol === 'date') return dir * ((a.targetYear*100+a.targetMonth) - (b.targetYear*100+b.targetMonth));
      if (sortCol === 'status') return dir * (a.status||'').localeCompare(b.status||'');
      return 0;
    });

  const totals = {
    amount: filtered.reduce((s, r) => s + (r.amount || 0), 0),
    estimated: filtered.reduce((s, r) => s + (r.amount * r.probability / 100), 0),
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Potansiyel Satışlar</div>
          <div className="page-subtitle">Satış fırsatlarını takip edin</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          <PlusIcon /> Yeni Satış
        </button>
      </div>

      {/* Özet kartlar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Toplam Fırsat', value: sales.length, color: 'var(--accent)', mono: false },
          { label: 'Aktif', value: sales.filter(s => s.status === 'AKTIF').length, color: '#4f8ef7', mono: false },
          { label: 'Toplam Tutar', value: fmt(sales.reduce((s,r) => s+(r.amount||0), 0)) + ' ₺', color: 'var(--text-primary)', mono: true },
          { label: 'Tahminlenen Satış', value: fmt(sales.filter(s=>s.status==='AKTIF').reduce((s,r) => s+(r.amount*r.probability/100), 0)) + ' ₺', color: '#34c97a', mono: true },
        ].map(c => (
          <div key={c.label} style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.color, fontFamily: c.mono ? 'DM Mono, monospace' : 'inherit' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filtreler */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['ALL','Tümü'], ['AKTIF','Aktif'], ['KAZANILDI','Kazanıldı'], ['KAYBEDILDI','Kaybedildi']].map(([key, label]) => (
          <button key={key} onClick={() => setStatusFilter(key)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${statusFilter === key ? (STATUS_COLORS[key] || 'var(--accent)') : 'var(--border)'}`,
            background: statusFilter === key ? `${STATUS_COLORS[key] || 'var(--accent)'}22` : 'var(--bg-secondary)',
            color: statusFilter === key ? (STATUS_COLORS[key] || 'var(--accent)') : 'var(--text-secondary)',
            fontFamily: 'DM Sans, sans-serif',
          }}>{label} ({key === 'ALL' ? sales.length : sales.filter(s => s.status === key).length})</button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="loading">Yükleniyor...</div> : filtered.length === 0 ? (
          <div className="empty-state"><p>Satış fırsatı bulunamadı.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} style={{ cursor:'pointer' }}>Satış Adı <SortIcon col="name"/></th>
                  <th onClick={() => handleSort('project')} style={{ cursor:'pointer' }}>Proje <SortIcon col="project"/></th>
                  <th onClick={() => handleSort('amount')} style={{ textAlign:'right', cursor:'pointer' }}>Tutar <SortIcon col="amount"/></th>
                  <th onClick={() => handleSort('probability')} style={{ textAlign:'center', cursor:'pointer' }}>Olasılık <SortIcon col="probability"/></th>
                  <th onClick={() => handleSort('estimated')} style={{ textAlign:'right', cursor:'pointer' }}>Tahminlenen <SortIcon col="estimated"/></th>
                  <th onClick={() => handleSort('date')} style={{ textAlign:'center', cursor:'pointer' }}>Hedef Tarih <SortIcon col="date"/></th>
                  <th onClick={() => handleSort('status')} style={{ textAlign:'center', cursor:'pointer' }}>Durum <SortIcon col="status"/></th>
                  <th style={{ textAlign: 'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{getProjectName(s.projectId)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13 }}>{fmt(s.amount)} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.currency}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                        <div style={{ width: 60, height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${s.probability}%`, height: '100%', background: s.probability >= 70 ? '#34c97a' : s.probability >= 40 ? '#f5a623' : '#f05c5c', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text-secondary)' }}>%{s.probability}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#34c97a', fontWeight: 600 }}>
                      {fmt(s.amount * s.probability / 100)} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.currency}</span>
                    </td>
                    <td style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}>{MONTHS[s.targetMonth-1]} {s.targetYear}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                        background: `${STATUS_COLORS[s.status]}22`, color: STATUS_COLORS[s.status] }}>
                        {STATUS_LABELS[s.status]}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon" onClick={() => { setEditing(s); setModalOpen(true); }}><EditIcon /></button>
                        <button className="btn-icon danger" onClick={() => setDeleteConfirm(s)}><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                  <td colSpan={2}>TOPLAM</td>
                  <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{fmt(totals.amount)} ₺</td>
                  <td />
                  <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', color: '#34c97a' }}>{fmt(totals.estimated)} ₺</td>
                  <td colSpan={3} />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <SaleModal sale={editing} projects={projects}
          onSave={() => { setModalOpen(false); load(); }}
          onClose={() => setModalOpen(false)} />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title" style={{ marginBottom: 8 }}>Satışı Sil</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
              <strong>{deleteConfirm.name}</strong> silinecek.
            </p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>İptal</button>
              <button className="btn btn-danger" onClick={async () => {
                await potentialSaleApi.delete(deleteConfirm.id);
                setDeleteConfirm(null); load();
              }}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
