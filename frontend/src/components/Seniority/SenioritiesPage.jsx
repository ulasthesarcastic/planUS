import { useState, useEffect } from 'react';
import { seniorityApi } from '../../services/api';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const CURRENCIES = ['TL', 'USD', 'EUR', 'GBP', 'CHF'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 15 }, (_, i) => currentYear - 5 + i);

function XIcon()     { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function EditIcon()  { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function PlusIcon()  { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }

const emptyRate = () => ({ startMonth: 1, startYear: currentYear, endMonth: null, endYear: null, amount: '', currency: 'TL', openEnded: true });

const label = (text) => (
  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>{text}</label>
);

function AmountInput({ value, onChange }) {
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
      placeholder="0" style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace' }} />
  );
}

function RateForm({ rate, onChange, onRemove }) {
  return (
    <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg-secondary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dönem</span>
        <button className="btn-icon danger" onClick={onRemove}><TrashIcon /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          {label('Başlangıç')}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 6 }}>
            <select className="form-select" value={rate.startMonth} onChange={e => onChange({ ...rate, startMonth: +e.target.value })}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select className="form-select" value={rate.startYear} onChange={e => onChange({ ...rate, startYear: +e.target.value })}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bitiş</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={rate.openEnded}
                onChange={e => onChange({ ...rate, openEnded: e.target.checked, endMonth: e.target.checked ? null : (rate.endMonth || rate.startMonth), endYear: e.target.checked ? null : (rate.endYear || rate.startYear) })}
                style={{ accentColor: 'var(--accent)', cursor: 'pointer' }} />
              Açık uçlu
            </label>
          </div>
          {!rate.openEnded ? (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 6 }}>
              <select className="form-select" value={rate.endMonth || 1} onChange={e => onChange({ ...rate, endMonth: +e.target.value })}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select className="form-select" value={rate.endYear || currentYear} onChange={e => onChange({ ...rate, endYear: +e.target.value })}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          ) : (
            <div style={{ padding: '7px 10px', background: 'var(--bg-card)', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
              Süresiz geçerli
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          {label('Tutar')}
          <AmountInput value={rate.amount} onChange={v => onChange({ ...rate, amount: v })} />
        </div>
        <div>
          {label('Para Birimi')}
          <select className="form-select" value={rate.currency} onChange={e => onChange({ ...rate, currency: e.target.value })}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function SeniorityModal({ seniority, onSave, onClose }) {
  const isEdit = !!seniority?.id;
  const [name, setName] = useState(seniority?.name || '');
  const [rates, setRates] = useState(seniority?.rates?.map(r => ({ ...r, openEnded: r.endYear == null })) || []);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return setError('Kıdem adı zorunludur.');
    setError(''); setSaving(true);
    try {
      const payload = {
        id: seniority?.id,
        name: name.trim(),
        rates: rates.map(r => ({
          startYear: r.startYear, startMonth: r.startMonth,
          endYear: r.openEnded ? null : (r.endYear || r.startYear),
          endMonth: r.openEnded ? null : (r.endMonth || r.startMonth),
          amount: parseFloat(r.amount) || 0,
          currency: r.currency,
        })),
      };
      if (isEdit) await seniorityApi.update(seniority.id, payload);
      else await seniorityApi.create(payload);
      onSave();
    } catch (e) {
      setError(e.response?.data?.error || 'Bir hata oluştu.');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Kıdem Düzenle' : 'Yeni Kıdem'}</div>
          <button className="btn-icon" onClick={onClose}><XIcon /></button>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <div style={{ marginBottom: 16 }}>
          {label('Kıdem Adı')}
          <input className="form-input" value={name} onChange={e => setName(e.target.value)}
            placeholder="örn. Araştırmacı, Uzman, Kıdemli Mühendis..." autoFocus />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Maliyet Dönemleri</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aylık bazda maliyet tanımlayın</div>
          </div>
          <button className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
            onClick={() => setRates([...rates, emptyRate()])}>
            <PlusIcon /> Dönem Ekle
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
          {rates.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed var(--border)', borderRadius: 10, color: 'var(--text-muted)', fontSize: 13 }}>
              Henüz maliyet dönemi eklenmedi
            </div>
          )}
          {rates.map((rate, idx) => (
            <RateForm key={idx} rate={rate}
              onChange={updated => setRates(rates.map((r, i) => i === idx ? updated : r))}
              onRemove={() => setRates(rates.filter((_, i) => i !== idx))} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onClose}>İptal</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatPeriod(rate) {
  const start = `${MONTHS[rate.startMonth - 1]} ${rate.startYear}`;
  const end = rate.endYear ? `${MONTHS[rate.endMonth - 1]} ${rate.endYear}` : '∞';
  return `${start} → ${end}`;
}

export default function SenioritiesPage() {
  const [seniorities, setSeniorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const load = async () => {
    try { const res = await seniorityApi.getAll(); setSeniorities(res.data); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    setDeleteError('');
    try { await seniorityApi.delete(id); setDeleteConfirm(null); load(); }
    catch (e) { setDeleteError(e.response?.data?.error || 'Silinemedi.'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Kıdem Yönetimi</div>
          <div className="page-subtitle">Kıdem seviyeleri ve dönemsel maliyetleri yönetin</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>+ Yeni Kıdem</button>
      </div>

      <div className="card">
        {loading ? <div className="loading">Yükleniyor...</div>
          : seniorities.length === 0 ? <div className="empty-state"><p>Henüz kıdem tanımlanmamış.</p></div>
          : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Kıdem Adı</th>
                  <th>Maliyet Dönemleri</th>
                  <th style={{ textAlign: 'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {seniorities.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td>
                      {!s.rates?.length
                        ? <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Tanımlanmamış</span>
                        : s.rates.map((r, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < s.rates.length - 1 ? 4 : 0 }}>
                            <span className="rate-period">{formatPeriod(r)}</span>
                            <span className="rate-amount">{r.amount.toLocaleString('tr-TR')}</span>
                            <span className="rate-currency">{r.currency}</span>
                          </div>
                        ))}
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon" onClick={() => { setEditing(s); setModalOpen(true); }}><EditIcon /></button>
                        <button className="btn-icon danger" onClick={() => { setDeleteConfirm(s); setDeleteError(''); }}><TrashIcon /></button>
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
        <SeniorityModal seniority={editing}
          onSave={() => { setModalOpen(false); load(); }}
          onClose={() => setModalOpen(false)} />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title">Kıdemi Sil</div>
              <button className="btn-icon" onClick={() => setDeleteConfirm(null)}><XIcon /></button>
            </div>
            {deleteError && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{deleteError}</div>}
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm?.name}</strong> kıdemini silmek istediğinizden emin misiniz?
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>İptal</button>
              <button className="btn" style={{ background: 'var(--danger)', color: '#fff' }} onClick={() => handleDelete(deleteConfirm.id)}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
