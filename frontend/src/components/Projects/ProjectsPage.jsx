import { useState, useEffect } from 'react';
import { projectApi, personnelApi } from '../../services/api';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                 'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const CURRENCIES = ['TL', 'USD', 'EUR', 'GBP', 'CHF'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 15 }, (_, i) => currentYear - 5 + i);

const fmt = (n) => (n || 0).toLocaleString('tr-TR');
const monthLabel = (m, y) => m && y ? `${MONTHS[m - 1]} ${y}` : '—';

// Binlik ayraçlı tutar input
function AmountInput({ value, onChange, placeholder = '0', style = {} }) {
  const toDisplay = (v) => (v !== '' && v !== null && v !== undefined && !isNaN(Number(v))) ? Number(v).toLocaleString('tr-TR') : '';
  const [display, setDisplay] = useState(toDisplay(value));

  // value dışarıdan değişince (modal açılınca vs.) güncelle
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

function EditIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function PlusIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function XIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function ArrowIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>; }

function MonthYearSelect({ month, year, onMonthChange, onYearChange, allowEmpty }) {
  return (
    <div className="month-year-row">
      <select className="form-select" value={month || ''} onChange={e => onMonthChange(e.target.value ? +e.target.value : null)}>
        {allowEmpty && <option value="">Ay</option>}
        {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
      </select>
      <select className="form-select" value={year || ''} onChange={e => onYearChange(e.target.value ? +e.target.value : null)}>
        {allowEmpty && <option value="">Yıl</option>}
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

// ── PROJE FORMU MODALI ──────────────────────────────────────────
function ProjectModal({ project, personnel, onSave, onClose }) {
  const isEdit = !!project;
  const [form, setForm] = useState(project ? {
    name: project.name, customerName: project.customerName || '',
    startMonth: project.startMonth, startYear: project.startYear,
    endMonth: project.endMonth, endYear: project.endYear,
    budget: project.budget, budgetCurrency: project.budgetCurrency,
    projectManagerId: project.projectManagerId || '',
    techLeadId: project.techLeadId || '',
  } : {
    name: '', customerName: '',
    startMonth: new Date().getMonth()+1, startYear: currentYear,
    endMonth: new Date().getMonth()+1, endYear: currentYear+1,
    budget: '', budgetCurrency: 'TL', projectManagerId: '', techLeadId: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Proje adı zorunludur.');
    setError(''); setSaving(true);
    try {
      const payload = {
        ...form,
        budget: Number(form.budget) || 0,
        projectManagerId: form.projectManagerId || null,
        techLeadId: form.techLeadId || null,
      };
      isEdit ? await projectApi.update(project.id, payload) : await projectApi.create(payload);
      onSave();
    } catch(e) { setError(e.response?.data?.error || 'Bir hata oluştu.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Proje Düzenle' : 'Yeni Proje'}</div>
          <button className="btn-icon" onClick={onClose}><XIcon /></button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Proje Adı</label>
            <input className="form-input" autoFocus placeholder="Proje adı" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Müşteri Adı</label>
            <input className="form-input" placeholder="Müşteri adı" value={form.customerName} onChange={e => set('customerName', e.target.value)} />
          </div>
        </div>
        <div className="form-row" style={{ marginBottom: 16 }}>
          <div>
            <div className="form-label">Başlangıç Tarihi</div>
            <MonthYearSelect month={form.startMonth} year={form.startYear}
              onMonthChange={v => set('startMonth', v)} onYearChange={v => set('startYear', v)} />
          </div>
          <div>
            <div className="form-label">Bitiş Tarihi</div>
            <MonthYearSelect month={form.endMonth} year={form.endYear}
              onMonthChange={v => set('endMonth', v)} onYearChange={v => set('endYear', v)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Bütçe</label>
            <AmountInput value={form.budget} onChange={v => set('budget', v)} />
          </div>
          <div className="form-group">
            <label className="form-label">Para Birimi</label>
            <select className="form-select" value={form.budgetCurrency} onChange={e => set('budgetCurrency', e.target.value)}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <hr className="section-divider" />
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Proje Yöneticisi <span style={{color:'var(--text-muted)',fontWeight:400}}>(opsiyonel)</span></label>
            <select className="form-select" value={form.projectManagerId} onChange={e => set('projectManagerId', e.target.value)}>
              <option value="">— Seçilmedi —</option>
              {personnel.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Teknik Lider <span style={{color:'var(--text-muted)',fontWeight:400}}>(opsiyonel)</span></label>
            <select className="form-select" value={form.techLeadId} onChange={e => set('techLeadId', e.target.value)}>
              <option value="">— Seçilmedi —</option>
              {personnel.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
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

// ── TAB 1: PERSONEL ─────────────────────────────────────────────
function PersonnelTab({ project, allPersonnel, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const assigned = project.personnelIds || [];
  const assignedSet = new Set(assigned);

  const toggle = async (personId, add) => {
    setSaving(true);
    const newIds = add ? [...assigned, personId] : assigned.filter(id => id !== personId);
    try {
      await projectApi.updatePersonnel(project.id, newIds);
      await onUpdate();
    } finally { setSaving(false); }
  };

  const assignedPersonnel = allPersonnel.filter(p => assignedSet.has(p.id));
  const available = allPersonnel.filter(p => !assignedSet.has(p.id));

  return (
    <div>
      {assignedPersonnel.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 10 }}>
            Projede Çalışan ({assignedPersonnel.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {assignedPersonnel.map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'var(--bg-secondary)', borderRadius:8, border:'1px solid var(--border)' }}>
                <span style={{ fontWeight: 500 }}>{p.firstName} {p.lastName}</span>
                <button className="btn-icon danger" disabled={saving} onClick={() => toggle(p.id, false)}><TrashIcon /></button>
              </div>
            ))}
          </div>
        </div>
      )}
      {available.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 10 }}>
            Eklenebilir Personel
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {available.map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'var(--bg-card)', borderRadius:8, border:'1px dashed var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{p.firstName} {p.lastName}</span>
                <button className="btn btn-ghost" style={{ padding:'4px 10px', fontSize:12 }} disabled={saving} onClick={() => toggle(p.id, true)}>
                  <PlusIcon /> Ekle
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {allPersonnel.length === 0 && <div className="empty-state"><p>Henüz personel tanımlanmamış.</p></div>}
    </div>
  );
}

// ── TAB 2: ÖDEME PLANI ──────────────────────────────────────────
function CompletePaymentModal({ item, onConfirm, onCancel }) {
  const [month, setMonth] = useState(item.plannedMonth || (new Date().getMonth()+1));
  const [year, setYear] = useState(item.plannedYear || currentYear);
  const [amount, setAmount] = useState(item.amount || 0);

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <div className="modal-title">Ödeme Tamamlandı</div>
          <button className="btn-icon" onClick={onCancel}><XIcon /></button>
        </div>
        <p style={{ color:'var(--text-secondary)', fontSize:13, marginBottom:20 }}>
          <strong style={{ color:'var(--text-primary)' }}>{item.name}</strong> ödemesini tamamlanmış olarak işaretleyin.
        </p>
        <div className="form-group">
          <label className="form-label">Gerçekleşen Tarih</label>
          <MonthYearSelect month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />
        </div>
        <div className="form-group">
          <label className="form-label">Gerçekleşen Tutar</label>
          <div style={{ display:'flex', gap:8 }}>
            <AmountInput value={amount} onChange={setAmount} style={{ flex:1 }} />
            <div style={{ padding:'9px 12px', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:6, fontSize:13, color:'var(--text-secondary)', whiteSpace:'nowrap' }}>
              {item.currency}
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onCancel}>İptal</button>
          <button className="btn btn-primary" onClick={() => onConfirm({ actualMonth: month, actualYear: year, actualAmount: Number(amount)||0 })}>
            Tamamlandı Olarak İşaretle
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentTab({ project, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const emptyPayment = () => ({
    id: crypto.randomUUID(), name: '', amount: '',
    currency: project.budgetCurrency || 'TL',
    plannedMonth: new Date().getMonth()+1, plannedYear: currentYear,
    actualMonth: null, actualYear: null, actualAmount: null,
  });

  const [form, setForm] = useState(emptyPayment());
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setEditing(null); setForm(emptyPayment()); setShowForm(true); };
  const openEdit = (item) => { setEditing(item); setForm({ ...item, amount: item.amount, actualAmount: item.actualAmount ?? '' }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await projectApi.getById(project.id);
      const freshItems = res.data.paymentPlan || [];
      const completed = !!(form.actualMonth && form.actualYear && form.actualAmount !== '' && form.actualAmount !== null);
      const newItem = {
        ...form,
        amount: Number(form.amount) || 0,
        actualAmount: completed ? (Number(form.actualAmount) || 0) : null,
        actualMonth: completed ? form.actualMonth : null,
        actualYear: completed ? form.actualYear : null,
        completed,
      };
      const newItems = editing
        ? freshItems.map(i => i.id === editing.id ? newItem : i)
        : [...freshItems, newItem];
      await projectApi.updatePaymentPlan(project.id, newItems);
      setShowForm(false);
      await onUpdate();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      const res = await projectApi.getById(project.id);
      const freshItems = (res.data.paymentPlan || []).filter(i => i.id !== id);
      await projectApi.updatePaymentPlan(project.id, freshItems);
      setDeleteId(null);
      await onUpdate();
    } finally { setSaving(false); }
  };

  const items = project.paymentPlan || [];
  const plannedTotal = items.reduce((s, i) => s+(i.amount||0), 0);
  const actualTotal = items.filter(i => i.completed).reduce((s, i) => s+(i.actualAmount||0), 0);

  return (
    <div>
      <div style={{ display:'flex', gap:24, marginBottom:20, padding:'14px 18px', background:'var(--bg-secondary)', borderRadius:8, border:'1px solid var(--border)', flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>Proje Bütçesi</div>
          <div style={{ fontWeight:700, color:'var(--accent)' }}>{fmt(project.budget)} {project.budgetCurrency}</div>
        </div>
        <div style={{ width:1, background:'var(--border)' }} />
        <div>
          <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>Planlanan Toplam</div>
          <div style={{ fontWeight:700, color: plannedTotal>project.budget ? 'var(--danger)' : 'var(--success)' }}>
            {fmt(plannedTotal)} {project.budgetCurrency}
            {plannedTotal!==project.budget && <span style={{ fontSize:11, fontWeight:400, marginLeft:6, color:'var(--danger)' }}>(bütçeyle eşleşmiyor)</span>}
          </div>
        </div>
        <div style={{ width:1, background:'var(--border)' }} />
        <div>
          <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>Gerçekleşen</div>
          <div style={{ fontWeight:700, color:'var(--success)' }}>{fmt(actualTotal)} {project.budgetCurrency}</div>
        </div>
        <div style={{ flex:1 }} />
        <button className="btn btn-primary" onClick={openNew}><PlusIcon /> Ödeme Kalemi Ekle</button>
      </div>

      {showForm && (
        <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:10, padding:20, marginBottom:20 }}>
          <div style={{ fontWeight:600, marginBottom:14 }}>{editing ? 'Kalemi Düzenle' : 'Yeni Ödeme Kalemi'}</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Açıklama</label>
              <input className="form-input" autoFocus placeholder="Ödeme açıklaması" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-row" style={{ marginBottom:0 }}>
              <div className="form-group">
                <label className="form-label">Planlanan Tutar</label>
                <AmountInput value={form.amount} onChange={v => set('amount', v)} />
              </div>
              <div className="form-group">
                <label className="form-label">Para Birimi</label>
                <select className="form-select" value={form.currency} onChange={e => set('currency', e.target.value)}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="form-row">
            <div>
              <label className="form-label">Planlanan Tarih</label>
              <MonthYearSelect month={form.plannedMonth} year={form.plannedYear}
                onMonthChange={v => set('plannedMonth', v)} onYearChange={v => set('plannedYear', v)} />
            </div>
            <div></div>
          </div>

          <hr className="section-divider" />
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 }}>
            Gerçekleşen Ödeme <span style={{ fontWeight:400, textTransform:'none', fontSize:11 }}>(doldurulursa tamamlandı sayılır)</span>
          </div>
          <div className="form-row">
            <div>
              <label className="form-label">Gerçekleşen Tarih</label>
              <MonthYearSelect month={form.actualMonth} year={form.actualYear} allowEmpty
                onMonthChange={v => set('actualMonth', v)} onYearChange={v => set('actualYear', v)} />
            </div>
            <div className="form-group">
              <label className="form-label">Gerçekleşen Tutar</label>
              <AmountInput value={form.actualAmount ?? ''} onChange={v => set('actualAmount', v)} />
            </div>
          </div>

          <div className="form-actions" style={{ marginTop:12, paddingTop:12 }}>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>İptal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Kaydediliyor...' : editing ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state"><p>Henüz ödeme kalemi eklenmemiş.</p></div>
      ) : (
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)' }}>
              {['Açıklama','Planlanan Tutar','Planlanan Tarih','Gerçekleşen Tutar','Gerçekleşen Tarih',''].map((h,i) => (
                <th key={i} style={{ padding:'9px 12px', textAlign: i===1||i===3 ? 'right' : 'left', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom:'1px solid var(--border)', background: item.completed ? 'var(--success-dim)' : 'transparent', transition:'background 0.2s' }}>
                <td style={{ padding:'11px 12px', fontSize:13.5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {item.completed && <span style={{ color:'var(--success)', fontSize:14 }}>✓</span>}
                    <span style={{ textDecoration: item.completed ? 'none' : 'none', color:'var(--text-primary)' }}>{item.name}</span>
                  </div>
                </td>
                <td style={{ padding:'11px 12px', textAlign:'right', fontWeight:600, color:'var(--text-secondary)', fontFamily:'DM Mono, monospace', fontSize:13 }}>
                  {fmt(item.amount)} <span style={{ fontSize:11, fontWeight:400, color:'var(--text-muted)' }}>{item.currency}</span>
                </td>
                <td style={{ padding:'11px 12px', fontSize:13, color:'var(--text-secondary)', fontFamily:'DM Mono, monospace' }}>
                  {monthLabel(item.plannedMonth, item.plannedYear)}
                </td>
                <td style={{ padding:'11px 12px', textAlign:'right', fontFamily:'DM Mono, monospace', fontSize:13 }}>
                  {item.completed
                    ? <span style={{ fontWeight:600, color:'var(--success)' }}>{fmt(item.actualAmount)} <span style={{ fontSize:11, fontWeight:400, color:'var(--text-muted)' }}>{item.currency}</span></span>
                    : <span style={{ color:'var(--text-muted)' }}>—</span>}
                </td>
                <td style={{ padding:'11px 12px', fontSize:13, fontFamily:'DM Mono, monospace' }}>
                  {item.completed
                    ? <span style={{ color:'var(--success)' }}>{monthLabel(item.actualMonth, item.actualYear)}</span>
                    : <span style={{ color:'var(--text-muted)' }}>—</span>}
                </td>
                <td style={{ padding:'11px 12px' }}>
                  <div className="actions-cell">
                    <button className="btn-icon" onClick={() => openEdit(item)}><EditIcon /></button>
                    <button className="btn-icon danger" onClick={() => setDeleteId(item.id)}><TrashIcon /></button>
                  </div>
                </td>
              </tr>
            ))}
            <tr style={{ background:'var(--bg-secondary)', borderTop:'2px solid var(--border)' }}>
              <td style={{ padding:'11px 12px', fontWeight:600, fontSize:13 }}>Toplam</td>
              <td style={{ padding:'11px 12px', textAlign:'right', fontWeight:700, fontFamily:'DM Mono, monospace' }}>{fmt(plannedTotal)} <span style={{ fontSize:11, fontWeight:400, color:'var(--text-muted)' }}>{project.budgetCurrency}</span></td>
              <td></td>
              <td style={{ padding:'11px 12px', textAlign:'right', fontWeight:700, color:'var(--success)', fontFamily:'DM Mono, monospace' }}>{fmt(actualTotal)} <span style={{ fontSize:11, fontWeight:400, color:'var(--text-muted)' }}>{project.budgetCurrency}</span></td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth:380 }}>
            <div className="modal-title" style={{ marginBottom:12 }}>Ödeme Kalemini Sil</div>
            <p style={{ color:'var(--text-secondary)', fontSize:14, marginBottom:16 }}>Bu ödeme kalemini silmek istediğinizden emin misiniz?</p>
            <div className="form-actions" style={{ marginTop:8, paddingTop:16 }}>
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>İptal</button>
              <button className="btn" style={{ background:'var(--danger)', color:'white' }} onClick={() => handleDelete(deleteId)}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB 3: KİLOMETRE TAŞLARI ────────────────────────────────────
function MilestonesTab({ project, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const emptyMilestone = () => ({
    id: crypto.randomUUID(), name: '', description: '',
    month: new Date().getMonth()+1, year: currentYear,
    completed: false, completedMonth: null, completedYear: null,
  });

  const [form, setForm] = useState(emptyMilestone());
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setEditing(null); setForm(emptyMilestone()); setShowForm(true); };
  const openEdit = (item) => { setEditing(item); setForm({ ...item }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await projectApi.getById(project.id);
      const freshItems = res.data.milestones || [];
      const completed = !!(form.completedMonth && form.completedYear);
      const newItem = {
        ...form,
        completed,
        completedMonth: completed ? form.completedMonth : null,
        completedYear: completed ? form.completedYear : null,
      };
      const newItems = editing
        ? freshItems.map(i => i.id === editing.id ? newItem : i)
        : [...freshItems, newItem];
      await projectApi.updateMilestones(project.id, newItems);
      setShowForm(false);
      await onUpdate();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      const res = await projectApi.getById(project.id);
      const freshItems = (res.data.milestones || []).filter(i => i.id !== id);
      await projectApi.updateMilestones(project.id, freshItems);
      setDeleteId(null);
      await onUpdate();
    } finally { setSaving(false); }
  };

  const items = [...(project.milestones||[])].sort((a,b) => a.year!==b.year ? a.year-b.year : a.month-b.month);
  const completedCount = items.filter(i => i.completed).length;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontSize:13, color:'var(--text-muted)' }}>
          {completedCount}/{items.length} tamamlandı
        </div>
        <button className="btn btn-primary" onClick={openNew}><PlusIcon /> Kilometre Taşı Ekle</button>
      </div>

      {showForm && (
        <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:10, padding:20, marginBottom:20 }}>
          <div style={{ fontWeight:600, marginBottom:14 }}>{editing ? 'Kilometre Taşını Düzenle' : 'Yeni Kilometre Taşı'}</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ad</label>
              <input className="form-input" autoFocus placeholder="Kilometre taşı adı" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Açıklama <span style={{color:'var(--text-muted)',fontWeight:400}}>(opsiyonel)</span></label>
              <input className="form-input" placeholder="Kısa açıklama" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div>
              <label className="form-label">Hedef Tarih</label>
              <MonthYearSelect month={form.month} year={form.year}
                onMonthChange={v => set('month', v)} onYearChange={v => set('year', v)} />
            </div>
            <div></div>
          </div>
          <hr className="section-divider" />
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 }}>
            Gerçekleşen <span style={{ fontWeight:400, textTransform:'none', fontSize:11 }}>(doldurulursa tamamlandı sayılır)</span>
          </div>
          <div className="form-row">
            <div>
              <label className="form-label">Gerçekleşen Tarih</label>
              <MonthYearSelect month={form.completedMonth} year={form.completedYear} allowEmpty
                onMonthChange={v => set('completedMonth', v)} onYearChange={v => set('completedYear', v)} />
            </div>
            <div></div>
          </div>
          <div className="form-actions" style={{ marginTop:12, paddingTop:12 }}>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>İptal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Kaydediliyor...' : editing ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state"><p>Henüz kilometre taşı eklenmemiş.</p></div>
      ) : (
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)' }}>
              {['Ad','Açıklama','Hedef Tarih','Gerçekleşen Tarih',''].map((h,i) => (
                <th key={i} style={{ padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom:'1px solid var(--border)', background: item.completed ? 'var(--success-dim)' : 'transparent', transition:'background 0.2s' }}>
                <td style={{ padding:'11px 12px', fontSize:13.5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {item.completed && <span style={{ color:'var(--success)' }}>✓</span>}
                    <span style={{ fontWeight:500, color:'var(--text-primary)' }}>{item.name}</span>
                  </div>
                </td>
                <td style={{ padding:'11px 12px', fontSize:13, color:'var(--text-muted)' }}>{item.description || '—'}</td>
                <td style={{ padding:'11px 12px', fontSize:13, fontFamily:'DM Mono, monospace', color:'var(--text-secondary)' }}>
                  {MONTHS[item.month-1]} {item.year}
                </td>
                <td style={{ padding:'11px 12px', fontSize:13, fontFamily:'DM Mono, monospace' }}>
                  {item.completed && item.completedMonth
                    ? <span style={{ color:'var(--success)', fontWeight:600 }}>{MONTHS[item.completedMonth-1]} {item.completedYear}</span>
                    : <span style={{ color:'var(--text-muted)' }}>—</span>}
                </td>
                <td style={{ padding:'11px 12px' }}>
                  <div className="actions-cell">
                    <button className="btn-icon" onClick={() => openEdit(item)}><EditIcon /></button>
                    <button className="btn-icon danger" onClick={() => setDeleteId(item.id)}><TrashIcon /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth:380 }}>
            <div className="modal-title" style={{ marginBottom:12 }}>Kilometre Taşını Sil</div>
            <p style={{ color:'var(--text-secondary)', fontSize:14, marginBottom:16 }}>Bu kilometre taşını silmek istediğinizden emin misiniz?</p>
            <div className="form-actions" style={{ marginTop:8, paddingTop:16 }}>
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>İptal</button>
              <button className="btn" style={{ background:'var(--danger)', color:'white' }} onClick={() => handleDelete(deleteId)}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PROJE DETAY EKRANI ───────────────────────────────────────────
function ProjectDetail({ project, allPersonnel, onBack, onEdit, onUpdate }) {
  const [activeTab, setActiveTab] = useState('personnel');
  const tabs = [
    { id:'personnel', label:'Proje Personeli' },
    { id:'payment', label:'Ödeme Planı' },
    { id:'milestones', label:'Kilometre Taşları' },
  ];
  const projectAmount = (project.paymentPlan||[]).reduce((s,i) => s+(i.amount||0), 0);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ padding:'6px 10px' }}>← Geri</button>
        <div style={{ flex:1 }}>
          <div className="page-title">{project.name}</div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>
            {project.customerName && <span>{project.customerName} · </span>}
            <span style={{ fontFamily:'DM Mono, monospace', fontSize:12 }}>
              {MONTHS[project.startMonth-1]} {project.startYear} – {MONTHS[project.endMonth-1]} {project.endYear}
            </span>
          </div>
        </div>
        <div style={{ textAlign:'right', marginRight:8 }}>
          <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Bütçe</div>
          <div style={{ fontWeight:700, color:'var(--accent)' }}>{fmt(project.budget)} {project.budgetCurrency}</div>
        </div>
        <div style={{ textAlign:'right', marginRight:8 }}>
          <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Proje Tutarı</div>
          <div style={{ fontWeight:700, color: projectAmount===project.budget ? 'var(--success)' : 'var(--warning)' }}>
            {fmt(projectAmount)} {project.budgetCurrency}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={onEdit}><EditIcon /> Düzenle</button>
      </div>

      <div style={{ display:'flex', gap:2, marginBottom:24, borderBottom:'1px solid var(--border)' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding:'9px 18px', fontSize:13.5, fontWeight: activeTab===tab.id ? 600 : 400,
            color: activeTab===tab.id ? 'var(--accent)' : 'var(--text-secondary)',
            background:'none', border:'none', cursor:'pointer',
            borderBottom: activeTab===tab.id ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom:-1, transition:'all 0.15s', fontFamily:'DM Sans, sans-serif',
          }}>{tab.label}</button>
        ))}
      </div>

      <div className="card" style={{ padding:24 }}>
        {activeTab==='personnel' && <PersonnelTab project={project} allPersonnel={allPersonnel} onUpdate={onUpdate} />}
        {activeTab==='payment' && <PaymentTab project={project} onUpdate={onUpdate} />}
        {activeTab==='milestones' && <MilestonesTab project={project} onUpdate={onUpdate} />}
      </div>
    </div>
  );
}

// ── ANA SAYFA ────────────────────────────────────────────────────
export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = async () => {
    const [pRes, perRes] = await Promise.all([projectApi.getAll(), personnelApi.getAll()]);
    setProjects(pRes.data);
    setPersonnel(perRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Seçili projeyi backend'den taze çeker
  const refreshSelected = async () => {
    const res = await projectApi.getAll();
    setProjects(res.data);
    if (selectedProject) {
      const fresh = res.data.find(p => p.id === selectedProject.id);
      if (fresh) setSelectedProject(fresh);
    }
  };

  const getPersonnelName = (id) => {
    const p = personnel.find(p => p.id === id);
    return p ? `${p.firstName} ${p.lastName}` : '—';
  };

  const handleDelete = async (id) => {
    await projectApi.delete(id);
    setDeleteConfirm(null);
    load();
  };

  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        allPersonnel={personnel}
        onBack={() => { setSelectedProject(null); load(); }}
        onEdit={() => { setEditing(selectedProject); setModalOpen(true); }}
        onUpdate={refreshSelected}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Proje Yönetimi</div>
          <div className="page-subtitle">Projeleri tanımlayın ve yönetin</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          <PlusIcon /> Yeni Proje
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : projects.length === 0 ? (
          <div className="empty-state"><p>Henüz proje eklenmemiş.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Proje Adı</th><th>Müşteri</th><th>Dönem</th>
                  <th>Bütçe</th><th>Proje Tutarı</th><th>Proje Yöneticisi</th>
                  <th style={{ textAlign:'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => {
                  const projectAmount = (p.paymentPlan||[]).reduce((s,i) => s+(i.amount||0), 0);
                  return (
                    <tr key={p.id} onClick={() => setSelectedProject(p)} style={{ cursor:'pointer' }}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontWeight:500 }}>{p.name}</span>
                          <span style={{ color:'var(--accent)', opacity:0.5 }}><ArrowIcon /></span>
                        </div>
                      </td>
                      <td style={{ color:'var(--text-secondary)' }}>{p.customerName||'—'}</td>
                      <td><span style={{ fontFamily:'DM Mono, monospace', fontSize:12, color:'var(--text-secondary)' }}>{MONTHS[p.startMonth-1]} {p.startYear} – {MONTHS[p.endMonth-1]} {p.endYear}</span></td>
                      <td><span style={{ fontWeight:600, color:'var(--accent)' }}>{fmt(p.budget)}</span> <span style={{ fontSize:11, color:'var(--text-muted)' }}>{p.budgetCurrency}</span></td>
                      <td><span style={{ fontWeight:600, color: projectAmount===p.budget ? 'var(--success)' : 'var(--warning)' }}>{fmt(projectAmount)}</span> <span style={{ fontSize:11, color:'var(--text-muted)' }}>{p.budgetCurrency}</span></td>
                      <td style={{ color:'var(--text-secondary)', fontSize:13 }}>{p.projectManagerId ? getPersonnelName(p.projectManagerId) : '—'}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="actions-cell">
                          <button className="btn-icon" onClick={() => { setEditing(p); setModalOpen(true); }}><EditIcon /></button>
                          <button className="btn-icon danger" onClick={() => setDeleteConfirm(p)}><TrashIcon /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <ProjectModal project={editing} personnel={personnel}
          onSave={() => { setModalOpen(false); load(); if (selectedProject) refreshSelected(); }}
          onClose={() => setModalOpen(false)} />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth:400 }}>
            <div className="modal-title" style={{ marginBottom:12 }}>Projeyi Sil</div>
            <p style={{ color:'var(--text-secondary)', fontSize:14, marginBottom:16 }}>
              <strong style={{ color:'var(--text-primary)' }}>{deleteConfirm.name}</strong> projesini silmek istediğinizden emin misiniz?
            </p>
            <div className="form-actions" style={{ marginTop:8, paddingTop:16 }}>
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>İptal</button>
              <button className="btn" style={{ background:'var(--danger)', color:'white' }} onClick={() => handleDelete(deleteConfirm.id)}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
