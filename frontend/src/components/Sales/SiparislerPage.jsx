import { useState } from 'react';
import { potentialSaleApi } from '../../services/api';
import { useSiparisler, useProjects, useCategories, useInvalidate } from '../../hooks/useQueries';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const fmt = (n) => (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function EditIcon()  { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon() { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function UndoIcon()  { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>; }
function XIcon()     { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }

function SiparisRow({ s, projectName, categoryName, categoryColor, onMoveToPotential, onDelete }) {
  const [hovered, setHovered] = useState(false);

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
      <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(52,201,122,0.12)', color: '#34c97a', whiteSpace: 'nowrap' }}>✓ Kazanıldı</span>

      {/* İsim + proje */}
      <div style={{ flex: '0 0 220px', minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
        {projectName
          ? <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>↗ {projectName}</div>
          : <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, fontStyle: 'italic' }}>Proje linki yok</div>}
      </div>

      {/* Kategori */}
      <div style={{ flex: '0 0 140px' }}>
        {categoryName
          ? <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: `${categoryColor}22`, color: categoryColor, border: `1px solid ${categoryColor}44` }}>{categoryName}</span>
          : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>}
      </div>

      {/* Tutar */}
      <div style={{ flex: '0 0 160px', textAlign: 'right' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 1 }}>Tutar</div>
        <div style={{ fontSize: 14, fontFamily: 'DM Mono, monospace', fontWeight: 700, color: '#34c97a' }}>
          {fmt(s.amount)} <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)' }}>{s.currency}</span>
        </div>
      </div>

      {/* Hedef tarih */}
      <div style={{ flex: '0 0 120px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
          {MONTHS[(s.targetMonth || 1) - 1]} {s.targetYear}
        </div>
      </div>

      {/* Aksiyonlar */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, flexShrink: 0 }}>
        <button className="btn-icon" title="Potansiyele Çevir" onClick={() => onMoveToPotential(s)} style={{ padding: 4 }}><UndoIcon /></button>
        <button className="btn-icon danger" title="Sil" onClick={() => onDelete(s)} style={{ padding: 4 }}><TrashIcon /></button>
      </div>
    </div>
  );
}

export default function SiparislerPage() {
  const { data: siparisler = [], isLoading } = useSiparisler();
  const { data: projects = [] }              = useProjects();
  const { data: categoriesRaw = [] }         = useCategories();
  const categories = [...categoriesRaw].sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0));
  const invalidate = useInvalidate();

  const [catFilter, setCatFilter]           = useState('ALL');
  const [moveConfirm, setMoveConfirm]       = useState(null); // sipariş → potansiyele çevir confirm
  const [deleteConfirm, setDeleteConfirm]   = useState(null);
  const [actionError, setActionError]       = useState('');
  const [saving, setSaving]                 = useState(false);

  const projectMap  = Object.fromEntries(projects.map(p => [String(p.id), p]));
  const categoryMap = Object.fromEntries(categories.map(c => [String(c.id), c]));

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
    if (catFilter === 'ALL') return true;
    const effectiveCatId = s.categoryId || projectMap[s.projectId]?.categoryId;
    return String(effectiveCatId) === catFilter;
  });

  const totalAmount = siparisler.reduce((sum, s) => sum + (s.amount || 0), 0);

  // Potansiyele çevir
  const handleMoveToPotential = async (s) => {
    setSaving(true);
    setActionError('');
    try {
      await potentialSaleApi.update(s.id, { ...s, status: 'AKTIF', probability: 50 });
      setMoveConfirm(null);
      invalidate.potentialSales();
      invalidate.projects();
    } catch (e) {
      setActionError(e.response?.data?.error || 'İşlem başarısız.');
    } finally { setSaving(false); }
  };

  // Sil
  const handleDelete = async (s) => {
    setSaving(true);
    setActionError('');
    try {
      await potentialSaleApi.delete(s.id);
      setDeleteConfirm(null);
      invalidate.potentialSales();
      invalidate.projects();
    } catch (e) {
      setActionError(e.response?.data?.error || 'Silinemedi.');
    } finally { setSaving(false); }
  };

  if (isLoading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Siparişler</div>
          <div className="page-subtitle">{siparisler.length} kazanılmış sipariş</div>
        </div>
      </div>

      {/* Özet */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Toplam Sipariş', value: siparisler.length,         color: '#34c97a', mono: false },
          { label: 'Toplam Tutar',   value: fmt(totalAmount) + ' ₺',   color: '#34c97a', mono: true  },
          { label: 'Proje Linkli',   value: siparisler.filter(s => s.projectId).length, color: 'var(--accent)', mono: false },
        ].map(c => (
          <div key={c.label} style={{ padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.color, fontFamily: c.mono ? 'DM Mono, monospace' : 'inherit' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Kategori filtresi */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[{ id: 'ALL', label: 'Tümü', color: null }, ...categories.map(c => ({ id: String(c.id), label: c.menuLabel || c.name, color: c.color }))].map(c => (
            <button key={c.id} onClick={() => setCatFilter(c.id)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${catFilter === c.id ? (c.color || 'var(--accent)') : 'var(--border)'}`,
              background: catFilter === c.id ? `${c.color || 'var(--accent)'}22` : 'var(--bg-secondary)',
              color: catFilter === c.id ? (c.color || 'var(--accent)') : 'var(--text-secondary)',
              fontFamily: 'DM Sans, sans-serif',
            }}>{c.label}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>Henüz kazanılmış sipariş yok.</p>
          <p style={{ fontSize: 12, marginTop: 8, color: 'var(--text-muted)' }}>
            Potansiyel Siparişler sayfasında siparişleri kazanıldı olarak işaretleyin.
          </p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 12, padding: '8px 14px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            {[['80px','Durum'],['220px','Sipariş'],['140px','Kategori'],['160px','Tutar','right'],['120px','Hedef']].map(([w, label, align]) => (
              <span key={label} style={{ flex: `0 0 ${w}`, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', textAlign: align || 'left' }}>{label}</span>
            ))}
          </div>
          {filtered.map(s => {
            const info = getInfo(s);
            return (
              <SiparisRow key={s.id} s={s}
                projectName={info.projectName}
                categoryName={info.categoryName}
                categoryColor={info.categoryColor}
                onMoveToPotential={setMoveConfirm}
                onDelete={setDeleteConfirm}
              />
            );
          })}
        </div>
      )}

      {/* Potansiyele Çevir Modal */}
      {moveConfirm && (
        <div className="modal-overlay" onClick={() => { setMoveConfirm(null); setActionError(''); }}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Potansiyele Çevir</div>
              <button className="btn-icon" onClick={() => { setMoveConfirm(null); setActionError(''); }}><XIcon /></button>
            </div>
            {actionError && <div className="alert alert-error" style={{ marginBottom: 12 }}>{actionError}</div>}
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
              <strong>{moveConfirm.name}</strong> siparişini potansiyele geri taşımak istediğinizden emin misiniz?
            </p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => { setMoveConfirm(null); setActionError(''); }}>İptal</button>
              <button className="btn btn-primary" onClick={() => handleMoveToPotential(moveConfirm)} disabled={saving}>
                {saving ? 'İşleniyor...' : 'Potansiyele Çevir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sil Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => { setDeleteConfirm(null); setActionError(''); }}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Siparişi Sil</div>
              <button className="btn-icon" onClick={() => { setDeleteConfirm(null); setActionError(''); }}><XIcon /></button>
            </div>
            {actionError && <div className="alert alert-error" style={{ marginBottom: 12 }}>{actionError}</div>}
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
              <strong>{deleteConfirm.name}</strong> silinecek.
            </p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => { setDeleteConfirm(null); setActionError(''); }}>İptal</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)} disabled={saving}>
                {saving ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
