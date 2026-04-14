import { useState, useEffect } from 'react';
import { productApi, personnelApi } from '../../services/api';
import SearchableSelect from '../SearchableSelect';

const TRL_DESCRIPTIONS = {
  1:'Temel prensipler gözlemlendi', 2:'Teknoloji konsepti oluşturuldu', 3:'Deneysel kanıt gösterildi',
  4:'Laboratuvar ortamında doğrulandı', 5:'İlgili ortamda doğrulandı', 6:'İlgili ortamda gösterildi',
  7:'Operasyonel ortamda prototip', 8:'Sistem tamamlandı ve nitelendi', 9:'Operasyonel ortamda başarıyla çalıştı',
};

const TRL_COLOR = (n) => n <= 3 ? '#9ca3af' : n <= 6 ? '#a78bfa' : '#34d399';
const TRL_BG    = (n) => n <= 3 ? 'rgba(156,163,175,0.12)' : n <= 6 ? 'rgba(167,139,250,0.12)' : 'rgba(52,211,153,0.12)';

function EditIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function XIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }

function TrlBadge({ level }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
      fontFamily: 'DM Mono, monospace',
      color: TRL_COLOR(level), background: TRL_BG(level),
      border: `1px solid ${TRL_COLOR(level)}44`,
    }}>TRL {level}</span>
  );
}

function TrlSelector({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {[1,2,3,4,5,6,7,8,9].map(n => (
        <button key={n} onClick={() => onChange(n)} style={{
          width: 36, height: 36, borderRadius: 8, border: '1px solid',
          borderColor: value === n ? TRL_COLOR(n) : 'var(--border)',
          background: value === n ? TRL_COLOR(n) + '22' : 'transparent',
          color: value === n ? TRL_COLOR(n) : 'var(--text-secondary)',
          fontWeight: 700, fontSize: 13, cursor: 'pointer',
          fontFamily: 'DM Mono, monospace', transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{n}</button>
      ))}
    </div>
  );
}

function ProductModal({ product, personnel, onSave, onClose }) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name || '',
    ownerId: product?.ownerId ? String(product.ownerId) : '',
    description: product?.description || '',
    trlLevel: product?.trlLevel || 1,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Ürün adı zorunludur.');
    setError(''); setSaving(true);
    try {
      const payload = { ...form, ownerId: form.ownerId || null };
      isEdit ? await productApi.update(product.id, payload) : await productApi.create(payload);
      onSave();
    } catch(e) { setError(e.response?.data?.error || 'Bir hata oluştu.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Ürün Düzenle' : 'Yeni Ürün'}</div>
          <button className="btn-icon" onClick={onClose}><XIcon /></button>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Ürün Adı</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ürün adı" autoFocus />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Ürün Sahibi (opsiyonel)</label>
            <SearchableSelect
              value={form.ownerId}
              onChange={v => set('ownerId', v)}
              placeholder="— Seçilmedi —"
              options={[{ value: '', label: '— Seçilmedi —' }, ...personnel.map(p => ({ value: String(p.id), label: `${p.firstName} ${p.lastName}` }))]}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Açıklama (opsiyonel)</label>
          <textarea className="form-input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Ürün açıklaması..." rows={3} style={{ resize: 'vertical', minHeight: 80 }} />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>TRL Seviyesi</label>
          <TrlSelector value={form.trlLevel} onChange={v => set('trlLevel', v)} />
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>TRL {form.trlLevel} — {TRL_DESCRIPTIONS[form.trlLevel]}</div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onClose}>İptal</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Oluştur'}</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="btn-icon" onClick={onClose}><XIcon /></button>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>İptal</button>
          <button className="btn" style={{ background: 'var(--danger)', color: '#fff' }} onClick={onConfirm}>Sil</button>
        </div>
      </div>
    </div>
  );
}

const TRL_GROUPS = [
  { label: 'Araştırma (1-3)', min: 1, max: 3, color: '#9ca3af', bg: 'rgba(156,163,175,0.08)' },
  { label: 'Geliştirme (4-6)', min: 4, max: 6, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
  { label: 'Olgunlaşma (7-9)', min: 7, max: 9, color: '#34d399', bg: 'rgba(52,211,153,0.08)'  },
];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const load = async () => {
    const [prRes, perRes] = await Promise.all([productApi.getAll(), personnelApi.getAll()]);
    setProducts(prRes.data); setPersonnel(perRes.data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const getOwnerName = (id) => {
    if (!id) return '—';
    const p = personnel.find(p => String(p.id) === String(id));
    return p ? `${p.firstName} ${p.lastName}` : '—';
  };
  const handleDelete = async (id) => { await productApi.delete(id); setDeleteConfirm(null); load(); };

  const sorted = [...products].sort((a, b) => {
    if (!sortCol) return 0;
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortCol === 'name') return dir * (a.name || '').localeCompare(b.name || '', 'tr');
    if (sortCol === 'owner') return dir * getOwnerName(a.ownerId).localeCompare(getOwnerName(b.ownerId), 'tr');
    if (sortCol === 'trl') return dir * ((a.trlLevel || 0) - (b.trlLevel || 0));
    return 0;
  });

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const SortIcon = ({ col }) => <span style={{ opacity: sortCol !== col ? 0.3 : 1, fontSize: 10 }}>{sortCol !== col ? '↕' : sortDir === 'asc' ? '↑' : '↓'}</span>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Ürün Yönetimi</div>
          <div className="page-subtitle">Ürünleri ve olgunluk seviyelerini yönetin</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>+ Yeni Ürün</button>
      </div>

      {products.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {TRL_GROUPS.map(g => {
            const count = products.filter(p => p.trlLevel >= g.min && p.trlLevel <= g.max).length;
            return (
              <div key={g.label} style={{ flex: 1, padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: g.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{g.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: g.color, marginBottom: 8 }}>{count}</div>
                <div style={{ height: 4, background: 'var(--bg-hover)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${products.length ? (count / products.length) * 100 : 0}%`, background: g.color, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card">
        {loading ? <div className="loading">Yükleniyor...</div>
          : products.length === 0 ? <div className="empty-state"><p>Henüz ürün eklenmemiş.</p></div>
          : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Ürün Adı <SortIcon col="name" /></th>
                  <th onClick={() => handleSort('owner')} style={{ cursor: 'pointer' }}>Ürün Sahibi <SortIcon col="owner" /></th>
                  <th onClick={() => handleSort('trl')} style={{ cursor: 'pointer' }}>TRL Seviyesi <SortIcon col="trl" /></th>
                  <th>Açıklama</th>
                  <th style={{ textAlign: 'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{getOwnerName(p.ownerId)}</td>
                    <td>
                      <TrlBadge level={p.trlLevel} />
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{TRL_DESCRIPTIONS[p.trlLevel]}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{p.description || '—'}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon" onClick={() => { setEditing(p); setModalOpen(true); }}><EditIcon /></button>
                        <button className="btn-icon danger" onClick={() => setDeleteConfirm(p)}><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && <ProductModal product={editing} personnel={personnel} onSave={() => { setModalOpen(false); load(); }} onClose={() => setModalOpen(false)} />}
      {deleteConfirm && <ConfirmModal title="Ürünü Sil" message={`"${deleteConfirm.name}" ürününü silmek istediğinizden emin misiniz?`} onConfirm={() => handleDelete(deleteConfirm.id)} onClose={() => setDeleteConfirm(null)} />}
    </div>
  );
}
