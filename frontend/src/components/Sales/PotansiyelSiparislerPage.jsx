import { useState, useEffect, useMemo } from 'react';
import { potentialSaleApi } from '../../services/api';
import { usePotentialSales, useProjects, useCategories, useInvalidate } from '../../hooks/useQueries';
import SearchableSelect from '../SearchableSelect';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const YEARS = [2024, 2025, 2026, 2027, 2028];
const fmt = (n) => (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Bu sayfa: sadece AKTIF + KAYBEDILDI siparişler
// KAZANILDI olanlar → Siparişler sayfasında gösterilir
const STATUS_CFG = {
  AKTIF:      { label: 'Aktif',      color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)' },
  KAYBEDILDI: { label: 'Kaybedildi', color: '#f05c5c', bg: 'rgba(240,92,92,0.12)' },
  KAZANILDI:  { label: 'Kazanıldı',  color: '#34c97a', bg: 'rgba(52,201,122,0.12)' },
};

const probColor = (p) => p >= 70 ? '#34c97a' : p >= 40 ? '#f5a623' : '#f05c5c';

const emptySale = () => ({
  name: '', categoryId: '', projectId: '', amount: '', currency: 'TRY',
  probability: 50, targetMonth: new Date().getMonth() + 1,
  targetYear: new Date().getFullYear(), status: 'AKTIF', saleType: 'SIPARIS',
});

function AmountInput({ value, onChange, placeholder = '0', style = {} }) {
  const toDisplay = (v) => (v !== '' && v !== null && v !== undefined && !isNaN(Number(v))) ? Number(v).toLocaleString('tr-TR') : '';
  const [display, setDisplay] = useState(toDisplay(value));
  useEffect(() => { setDisplay(toDisplay(value)); }, [value]);
  const handleChange = (e) => {
    const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
    if (raw === '') { setDisplay(''); onChange(''); return; }
    const num = Number(raw);
    setDisplay(num.toLocaleString('tr-TR'));
    onChange(num);
  };
  return (
    <input className="form-input" value={display} onChange={handleChange}
      placeholder={placeholder}
      style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', ...style }} />
  );
}

function PlusIcon()  { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function EditIcon()  { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon() { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function XIcon()     { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function CheckIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>; }

function SaleModal({ sale, projects, categories, onSave, onClose }) {
  const isEdit = !!sale?.id;
  const [form, setForm] = useState(sale?.id ? { ...sale } : emptySale());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Seçili kategoriye göre projeleri filtrele
  const filteredProjects = useMemo(() => {
    if (!form.categoryId) return projects;
    return projects.filter(p => String(p.categoryId) === String(form.categoryId));
  }, [projects, form.categoryId]);

  const handleCategoryChange = (catId) => {
    setForm(f => ({ ...f, categoryId: catId, projectId: '' }));
  };

  const handleStatusChange = (status) => {
    const prob = status === 'KAYBEDILDI' ? 0 : form.probability;
    setForm(f => ({ ...f, status, probability: prob }));
  };

  const handleProbChange = (val) => {
    const p = Math.min(99, Math.max(0, +val));
    const status = p === 0 ? 'KAYBEDILDI' : 'AKTIF';
    setForm(f => ({ ...f, probability: p, status }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Sipariş adı zorunludur.');
    setSaving(true);
    try {
      const prob = parseFloat(form.probability) || 0;
      const status = prob === 0 ? 'KAYBEDILDI' : 'AKTIF';
      const data = {
        ...form,
        amount: parseFloat(form.amount) || 0,
        probability: prob,
        status,
        projectId: form.projectId || null,
        categoryId: form.categoryId || null,
      };
      if (isEdit) await potentialSaleApi.update(sale.id, data);
      else await potentialSaleApi.create(data);
      onSave();
    } catch (e) {
      setError(e.response?.data?.error || 'Bir hata oluştu.');
    } finally { setSaving(false); }
  };

  // Kazanıldı olarak işaretleme
  const handleMarkWon = async () => {
    if (!form.name.trim()) return setError('Sipariş adı zorunludur.');
    setSaving(true);
    try {
      const data = {
        ...form,
        amount: parseFloat(form.amount) || 0,
        probability: 100,
        status: 'KAZANILDI',
        projectId: form.projectId || null,
        categoryId: form.categoryId || null,
      };
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
          <div className="modal-title">{isEdit ? 'Sipariş Düzenle' : 'Yeni Potansiyel Sipariş'}</div>
          <button className="btn-icon" onClick={onClose}><XIcon /></button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Sipariş Adı</label>
          <input className="form-input" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
        </div>

        {/* Kategori seçimi */}
        <div className="form-group">
          <label className="form-label">Portföy Kategorisi <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opsiyonel)</span></label>
          <SearchableSelect
            value={form.categoryId || ''}
            onChange={handleCategoryChange}
            placeholder="— Seçin —"
            style={{ width: '100%' }}
            options={[
              { value: '', label: '— Seçin —' },
              ...categories.map(c => ({ value: String(c.id), label: c.menuLabel || c.name })),
            ]}
          />
        </div>

        {/* Proje linki (kategoriye göre filtrelenmiş) */}
        <div className="form-group">
          <label className="form-label">
            İlgili Proje <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opsiyonel — kazanılınca ödeme planına eklenir)</span>
          </label>
          <SearchableSelect
            value={form.projectId || ''}
            onChange={v => setForm(f => ({ ...f, projectId: v }))}
            placeholder="— Seçin —"
            style={{ width: '100%' }}
            options={[
              { value: '', label: '— Seçin —' },
              ...filteredProjects.map(p => ({ value: String(p.id), label: p.name })),
            ]}
          />
          {form.categoryId && filteredProjects.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Bu kategoride aktif proje bulunamadı.
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tutar</label>
            <AmountInput value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Para Birimi</label>
            <select className="form-select" value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
              {['TRY','USD','EUR'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Olasılık (%)</label>
          <input className="form-input" type="number" min="0" max="99"
            value={form.probability}
            onChange={e => handleProbChange(e.target.value)}
            style={{ fontFamily: 'DM Mono, monospace' }} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Hedef Tarih:</label>
          <select className="form-select" style={{ width: 130 }} value={form.targetMonth}
            onChange={e => setForm(f => ({ ...f, targetMonth: +e.target.value }))}>
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select className="form-select" style={{ width: 90 }} value={form.targetYear}
            onChange={e => setForm(f => ({ ...f, targetYear: +e.target.value }))}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Durum</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['AKTIF','KAYBEDILDI'].map(key => {
              const cfg = STATUS_CFG[key];
              return (
                <button key={key} onClick={() => handleStatusChange(key)} style={{
                  flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${form.status === key ? cfg.color : 'var(--border)'}`,
                  background: form.status === key ? cfg.bg : 'var(--bg-secondary)',
                  color: form.status === key ? cfg.color : 'var(--text-muted)',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600,
                }}>{cfg.label}</button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Tahminlenen Değer</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#34c97a', fontFamily: 'DM Mono, monospace' }}>
            {fmt((parseFloat(form.amount) || 0) * (parseFloat(form.probability) || 0) / 100)} {form.currency}
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>İptal</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Oluştur'}
          </button>
          <button className="btn" onClick={handleMarkWon} disabled={saving}
            style={{ background: '#34c97a', color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckIcon /> Kazanıldı
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ s, projectName, categoryName, categoryColor, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const cfg = STATUS_CFG[s.status] || STATUS_CFG.AKTIF;
  const estimated = (s.amount || 0) * (s.probability || 0) / 100;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px',
        background: hovered ? 'var(--bg-hover)' : 'transparent',
        transition: 'background 0.12s',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Durum */}
      <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>{cfg.label}</span>

      {/* İsim + proje */}
      <div style={{ flex: '0 0 200px', minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
        {projectName && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{projectName}</div>}
      </div>

      {/* Kategori */}
      <div style={{ flex: '0 0 120px' }}>
        {categoryName
          ? <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: `${categoryColor}22`, color: categoryColor, border: `1px solid ${categoryColor}44` }}>{categoryName}</span>
          : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>}
      </div>

      {/* Olasılık */}
      <div style={{ flex: '0 0 100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Olasılık</span>
          <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: probColor(s.probability), fontWeight: 700 }}>%{s.probability}</span>
        </div>
        <div style={{ height: 4, background: 'var(--bg-hover)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${s.probability}%`, height: '100%', background: probColor(s.probability), borderRadius: 2 }} />
        </div>
      </div>

      {/* Tutar */}
      <div style={{ flex: '0 0 130px', textAlign: 'right' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 1 }}>Tutar</div>
        <div style={{ fontSize: 13, fontFamily: 'DM Mono, monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
          {fmt(s.amount)} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.currency}</span>
        </div>
      </div>

      {/* Tahminlenen */}
      <div style={{ flex: '0 0 130px', textAlign: 'right' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 1 }}>Tahminlenen</div>
        <div style={{ fontSize: 13, fontFamily: 'DM Mono, monospace', fontWeight: 600, color: '#34c97a' }}>
          {fmt(estimated)} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.currency}</span>
        </div>
      </div>

      {/* Hedef tarih */}
      <div style={{ flex: '0 0 100px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
          {MONTHS[s.targetMonth - 1]} {s.targetYear}
        </div>
      </div>

      {/* Aksiyonlar */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, flexShrink: 0 }}>
        <button className="btn-icon" onClick={() => onEdit(s)} style={{ padding: 4 }}><EditIcon /></button>
        <button className="btn-icon danger" onClick={() => onDelete(s)} style={{ padding: 4 }}><TrashIcon /></button>
      </div>
    </div>
  );
}

export default function PotansiyelSiparislerPage() {
  const { data: sales = [], isLoading: loading } = usePotentialSales();
  const { data: projects = [] }                   = useProjects();
  const { data: categoriesRaw = [] }              = useCategories();
  const categories = [...categoriesRaw].sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0));
  const invalidate = useInvalidate();

  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [catFilter, setCatFilter] = useState('ALL');

  const projectMap  = Object.fromEntries(projects.map(p => [String(p.id), p]));
  const categoryMap = Object.fromEntries(categories.map(c => [String(c.id), c]));

  // Sadece SIPARIS + KAZANILDI olmayanlar
  const siparisler = sales.filter(s => s.saleType === 'SIPARIS' && s.status !== 'KAZANILDI');

  const getInfo = (s) => {
    const project = s.projectId ? projectMap[String(s.projectId)] : null;
    const cat = s.categoryId
      ? categoryMap[String(s.categoryId)]
      : project?.categoryId ? categoryMap[String(project.categoryId)] : null;
    return {
      projectName:   project?.name || '',
      categoryName:  cat?.menuLabel || cat?.name || '',
      categoryColor: cat?.color || '#94a3b8',
    };
  };

  const filtered = siparisler.filter(s => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (catFilter !== 'ALL') {
      const effectiveCatId = s.categoryId || projectMap[s.projectId]?.categoryId;
      if (String(effectiveCatId) !== catFilter) return false;
    }
    return true;
  });

  const totalEstimated = siparisler.filter(s => s.status === 'AKTIF')
    .reduce((sum, s) => sum + (s.amount || 0) * (s.probability || 0) / 100, 0);

  const summaryCards = [
    { label: 'Toplam',      value: siparisler.length,                                        color: 'var(--accent)',       mono: false },
    { label: 'Aktif',       value: siparisler.filter(s => s.status === 'AKTIF').length,      color: 'var(--text-primary)', mono: false },
    { label: 'Kaybedildi',  value: siparisler.filter(s => s.status === 'KAYBEDILDI').length, color: '#f05c5c',             mono: false },
    { label: 'Tahminlenen', value: fmt(totalEstimated) + ' ₺',                               color: '#34c97a',             mono: true  },
  ];

  const handleDelete = async (s) => {
    try {
      await potentialSaleApi.delete(s.id);
      setDeleteConfirm(null);
      invalidate.potentialSales();
    } catch (e) {
      alert(e.response?.data?.error || 'Silinemedi.');
      setDeleteConfirm(null);
    }
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Potansiyel Siparişler</div>
          <div className="page-subtitle">{siparisler.length} sipariş takip ediliyor</div>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}>
          <PlusIcon /> Yeni Sipariş
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {summaryCards.map(c => (
          <div key={c.label} style={{ padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.color, fontFamily: c.mono ? 'DM Mono, monospace' : 'inherit' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filtreler */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['ALL','Tümü'], ['AKTIF','Aktif'], ['KAYBEDILDI','Kaybedildi']].map(([key, label]) => (
          <button key={key} onClick={() => setStatusFilter(key)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${statusFilter === key ? (STATUS_CFG[key]?.color || 'var(--accent)') : 'var(--border)'}`,
            background: statusFilter === key ? `${STATUS_CFG[key]?.color || 'var(--accent)'}22` : 'var(--bg-secondary)',
            color: statusFilter === key ? (STATUS_CFG[key]?.color || 'var(--accent)') : 'var(--text-secondary)',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            {label} ({key === 'ALL' ? siparisler.length : siparisler.filter(s => s.status === key).length})
          </button>
        ))}
        {categories.length > 0 && (
          <>
            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
            {[{ id: 'ALL', label: 'Tümü', color: null }, ...categories.map(c => ({ id: String(c.id), label: c.menuLabel || c.name, color: c.color }))].map(c => (
              <button key={c.id} onClick={() => setCatFilter(c.id)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${catFilter === c.id ? (c.color || 'var(--accent)') : 'var(--border)'}`,
                background: catFilter === c.id ? `${c.color || 'var(--accent)'}22` : 'var(--bg-secondary)',
                color: catFilter === c.id ? (c.color || 'var(--accent)') : 'var(--text-secondary)',
                fontFamily: 'DM Sans, sans-serif',
              }}>{c.label}</button>
            ))}
          </>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><p>Gösterilecek potansiyel sipariş yok.</p></div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 12, padding: '8px 14px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            {[['60px','Durum'],['200px','Sipariş'],['120px','Kategori'],['100px','Olasılık'],['130px','Tutar','right'],['130px','Tahminlenen','right'],['100px','Hedef']].map(([w, label, align]) => (
              <span key={label} style={{ flex: `0 0 ${w}`, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', textAlign: align || 'left' }}>{label}</span>
            ))}
          </div>
          {[...filtered].sort((a, b) => (b.probability || 0) - (a.probability || 0)).map(s => {
            const info = getInfo(s);
            return (
              <OrderRow key={s.id} s={s}
                projectName={info.projectName}
                categoryName={info.categoryName}
                categoryColor={info.categoryColor}
                onEdit={setEditing}
                onDelete={setDeleteConfirm}
              />
            );
          })}
        </div>
      )}

      {editing !== null && (
        <SaleModal
          sale={editing?.id ? editing : null}
          projects={projects}
          categories={categories}
          onSave={() => { setEditing(null); invalidate.potentialSales(); }}
          onClose={() => setEditing(null)}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title" style={{ marginBottom: 8 }}>Siparişi Sil</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
              <strong>{deleteConfirm.name}</strong> silinecek.
            </p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>İptal</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
