import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { generalExpenseApi } from '../../services/api';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const YEARS  = Array.from({ length: 14 }, (_, i) => 2024 + i);

function fmt(val) {
  if (!val && val !== 0) return '—';
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);
}

const now = new Date();

function emptyForm() {
  return {
    name: '',
    amount: '',
    startMonth: now.getMonth() + 1,
    startYear: now.getFullYear(),
    endMonth: 12,
    endYear: now.getFullYear(),
  };
}

function ExpenseForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Gider adı zorunludur.');
    if (!form.amount || Number(form.amount) <= 0) return setError('Geçerli bir tutar giriniz.');
    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, amount: Number(form.amount) });
    } catch (e) {
      setError(e?.response?.data?.error || 'Bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const sel = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, padding: '6px 10px', fontFamily: 'inherit', cursor: 'pointer' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label className="form-label">Gider Adı</label>
        <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="ör. Kira, Elektrik, Muhasebe" autoFocus />
      </div>

      <div>
        <label className="form-label">Aylık Tutar (₺)</label>
        <input className="form-input" type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" min="0" />
      </div>

      <div>
        <label className="form-label">Başlangıç</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={form.startMonth} onChange={e => set('startMonth', Number(e.target.value))} style={sel}>
            {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={form.startYear} onChange={e => set('startYear', Number(e.target.value))} style={sel}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="form-label">Bitiş</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={form.endMonth} onChange={e => set('endMonth', Number(e.target.value))} style={sel}>
            {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={form.endYear} onChange={e => set('endYear', Number(e.target.value))} style={sel}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {error && <div style={{ color: '#ef4444', fontSize: 12 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        <button className="btn btn-ghost" onClick={onCancel}>İptal</button>
      </div>
    </div>
  );
}

export default function GeneralExpensesPage() {
  const qc = useQueryClient();
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['general-expenses'],
    queryFn: () => generalExpenseApi.getAll().then(r => r.data),
  });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['general-expenses'] });

  const handleCreate = async (data) => {
    await generalExpenseApi.create(data);
    await invalidate();
    setShowForm(false);
  };

  const handleUpdate = async (data) => {
    await generalExpenseApi.update(editing.id, data);
    await invalidate();
    setEditing(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu genel gider silinecek. Emin misiniz?')) return;
    await generalExpenseApi.delete(id);
    await invalidate();
  };

  const periodLabel = (e) =>
    `${MONTHS[e.startMonth - 1]} ${e.startYear} – ${MONTHS[e.endMonth - 1]} ${e.endYear}`;

  const monthCount = (e) => {
    const diff = (e.endYear - e.startYear) * 12 + (e.endMonth - e.startMonth) + 1;
    return Math.max(0, diff);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Genel Giderler</div>
          <div className="page-subtitle">{expenses.length} kayıt</div>
        </div>
        {!showForm && !editing && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Yeni Gider</button>
        )}
      </div>

      {(showForm || editing) && (
        <div className="card" style={{ padding: 24, marginBottom: 20, maxWidth: 480 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: 'var(--text-primary)' }}>
            {editing ? 'Gider Düzenle' : 'Yeni Genel Gider'}
          </div>
          <ExpenseForm
            initial={editing || undefined}
            onSave={editing ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {isLoading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Yükleniyor…</div>
      ) : expenses.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
          Henüz genel gider tanımlanmamış.
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Gider Adı</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>Aylık Tutar</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Periyot</th>
                <th style={{ padding: '10px 16px', width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>{e.name}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>{fmt(e.amount)}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{periodLabel(e)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn-icon" title="Düzenle" onClick={() => { setEditing(e); setShowForm(false); }}>✏️</button>
                      <button className="btn-icon" title="Sil" onClick={() => handleDelete(e.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
