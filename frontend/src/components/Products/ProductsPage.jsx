import { useState, useEffect } from 'react';
import { productApi, personnelApi } from '../../services/api';

const TRL_DESCRIPTIONS = {
  1: 'Temel prensipler gözlemlendi',
  2: 'Teknoloji konsepti oluşturuldu',
  3: 'Deneysel kanıt gösterildi',
  4: 'Laboratuvar ortamında doğrulandı',
  5: 'İlgili ortamda doğrulandı',
  6: 'İlgili ortamda gösterildi',
  7: 'Operasyonel ortamda prototip',
  8: 'Sistem tamamlandı ve nitelendi',
  9: 'Operasyonel ortamda başarıyla çalıştı',
};

function EditIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function PlusIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function XIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }

function TrlBadge({ level }) {
  const colors = [
    null,
    '#6b7280', '#6b7280', // 1-2 gri
    '#2563eb', '#2563eb', // 3-4 mavi
    '#7c3aed', '#7c3aed', // 5-6 mor
    '#d97706', '#d97706', // 7-8 turuncu
    '#16a34a',            // 9 yeşil
  ];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: colors[level] + '22', color: colors[level], border: `1px solid ${colors[level]}44`,
      fontFamily: 'DM Mono, monospace',
    }}>
      TRL {level}
    </span>
  );
}

function TrlSelector({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {[1,2,3,4,5,6,7,8,9].map(n => (
        <button key={n} onClick={() => onChange(n)} style={{
          width: 36, height: 36, borderRadius: 8, border: '1px solid',
          borderColor: value === n ? 'var(--accent)' : 'var(--border)',
          background: value === n ? 'var(--accent)' : 'var(--bg-card)',
          color: value === n ? 'white' : 'var(--text-secondary)',
          fontWeight: 700, fontSize: 13, cursor: 'pointer',
          fontFamily: 'DM Mono, monospace', transition: 'all 0.15s',
        }}>
          {n}
        </button>
      ))}
    </div>
  );
}

function ProductModal({ product, personnel, onSave, onClose }) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name || '',
    ownerId: product?.ownerId || '',
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
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Ürün Adı</label>
            <input className="form-input" autoFocus placeholder="Ürün adı" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Ürün Sahibi <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opsiyonel)</span></label>
            <select className="form-select" value={form.ownerId} onChange={e => set('ownerId', e.target.value)}>
              <option value="">— Seçilmedi —</option>
              {personnel.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Açıklama <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opsiyonel)</span></label>
          <textarea className="form-input" placeholder="Ürün açıklaması..." value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={3} style={{ resize: 'vertical', fontFamily: 'DM Sans, sans-serif' }} />
        </div>

        <div className="form-group">
          <label className="form-label">TRL Seviyesi</label>
          <TrlSelector value={form.trlLevel} onChange={v => set('trlLevel', v)} />
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            TRL {form.trlLevel} — {TRL_DESCRIPTIONS[form.trlLevel]}
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

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = async () => {
    const [prRes, perRes] = await Promise.all([productApi.getAll(), personnelApi.getAll()]);
    setProducts(prRes.data);
    setPersonnel(perRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getOwnerName = (id) => {
    if (!id) return '—';
    const p = personnel.find(p => p.id === id);
    return p ? `${p.firstName} ${p.lastName}` : '—';
  };

  const handleDelete = async (id) => {
    await productApi.delete(id);
    setDeleteConfirm(null);
    load();
  };

  // TRL dağılımı için mini progress bar
  const trlGroups = [
    { label: 'Araştırma (1-3)', min: 1, max: 3, color: '#6b7280' },
    { label: 'Geliştirme (4-6)', min: 4, max: 6, color: '#7c3aed' },
    { label: 'Olgunlaşma (7-9)', min: 7, max: 9, color: '#16a34a' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Ürün Yönetimi</div>
          <div className="page-subtitle">Ürünleri ve olgunluk seviyelerini yönetin</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          <PlusIcon /> Yeni Ürün
        </button>
      </div>

      {/* TRL Özet Kartları */}
      {products.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {trlGroups.map(g => {
            const count = products.filter(p => p.trlLevel >= g.min && p.trlLevel <= g.max).length;
            return (
              <div key={g.label} style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8, border: `1px solid ${g.color}33` }}>
                <div style={{ fontSize: 11, color: g.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{g.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: g.color, fontFamily: 'DM Mono, monospace' }}>{count}</div>
                <div style={{ marginTop: 6, height: 4, background: 'var(--bg-hover)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${products.length ? (count/products.length)*100 : 0}%`, background: g.color, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : products.length === 0 ? (
          <div className="empty-state"><p>Henüz ürün eklenmemiş.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Ürün Adı</th>
                  <th>Açıklama</th>
                  <th>Ürün Sahibi</th>
                  <th>TRL Seviyesi</th>
                  <th style={{ textAlign: 'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 300 }}>
                      {p.description
                        ? <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{getOwnerName(p.ownerId)}</td>
                    <td>
                      <div>
                        <TrlBadge level={p.trlLevel} />
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{TRL_DESCRIPTIONS[p.trlLevel]}</div>
                      </div>
                    </td>
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

      {modalOpen && (
        <ProductModal product={editing} personnel={personnel}
          onSave={() => { setModalOpen(false); load(); }}
          onClose={() => setModalOpen(false)} />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-title" style={{ marginBottom: 12 }}>Ürünü Sil</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.name}</strong> ürününü silmek istediğinizden emin misiniz?
            </p>
            <div className="form-actions" style={{ marginTop: 8, paddingTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>İptal</button>
              <button className="btn" style={{ background: 'var(--danger)', color: 'white' }} onClick={() => handleDelete(deleteConfirm.id)}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
