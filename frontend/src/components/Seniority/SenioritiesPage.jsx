import { useState, useEffect } from 'react';
import { seniorityApi } from '../../services/api';

import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const CURRENCIES = ['TL', 'USD', 'EUR', 'GBP', 'CHF'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 15 }, (_, i) => currentYear - 5 + i);

const emptyRate = () => ({ startMonth: 1, startYear: currentYear, endMonth: null, endYear: null, amount: '', currency: 'TL', openEnded: true });

function RateForm({ rate, onChange, onRemove }) {
  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Dönem</Typography>
        <IconButton size="small" color="error" onClick={onRemove}><DeleteOutlineIcon sx={{ fontSize: 16 }} /></IconButton>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Başlangıç</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 1 }}>
            <TextField select size="small" value={rate.startMonth} onChange={e => onChange({ ...rate, startMonth: +e.target.value })} SelectProps={{ native: true }}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </TextField>
            <TextField select size="small" value={rate.startYear} onChange={e => onChange({ ...rate, startYear: +e.target.value })} SelectProps={{ native: true }}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </TextField>
          </Box>
        </Box>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Bitiş</Typography>
            <FormControlLabel
              control={<Checkbox size="small" checked={rate.openEnded} onChange={e => onChange({ ...rate, openEnded: e.target.checked, endMonth: e.target.checked ? null : (rate.endMonth || rate.startMonth), endYear: e.target.checked ? null : (rate.endYear || rate.startYear) })} />}
              label={<Typography variant="caption">Açık uçlu</Typography>}
              sx={{ m: 0 }}
            />
          </Box>
          {!rate.openEnded ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 1 }}>
              <TextField select size="small" value={rate.endMonth || 1} onChange={e => onChange({ ...rate, endMonth: +e.target.value })} SelectProps={{ native: true }}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </TextField>
              <TextField select size="small" value={rate.endYear || currentYear} onChange={e => onChange({ ...rate, endYear: +e.target.value })} SelectProps={{ native: true }}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </TextField>
            </Box>
          ) : (
            <Box sx={{ p: 1.25, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.disabled">Süresiz geçerli</Typography>
            </Box>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <TextField label="Tutar" type="number" size="small" placeholder="0.00" value={rate.amount} onChange={e => onChange({ ...rate, amount: e.target.value })} />
        <TextField label="Para Birimi" select size="small" value={rate.currency} onChange={e => onChange({ ...rate, currency: e.target.value })} SelectProps={{ native: true }}>
          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
        </TextField>
      </Box>
    </Box>
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
      const payload = { id: seniority?.id, name: name.trim(), rates: rates.map(r => ({ startYear: r.startYear, startMonth: r.startMonth, endYear: r.openEnded ? null : (r.endYear || r.startYear), endMonth: r.openEnded ? null : (r.endMonth || r.startMonth), amount: parseFloat(r.amount) || 0, currency: r.currency })) };
      if (isEdit) await seniorityApi.update(seniority.id, payload);
      else await seniorityApi.create(payload);
      onSave();
    } catch (e) {
      setError(e.response?.data?.error || 'Bir hata oluştu.');
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {isEdit ? 'Kıdem Düzenle' : 'Yeni Kıdem'}
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
        <TextField label="Kıdem Adı" placeholder="örn. Araştırmacı, Uzman, Kıdemli Mühendis..." value={name} onChange={e => setName(e.target.value)} autoFocus fullWidth sx={{ mt: 1, mb: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box>
            <Typography variant="subtitle2">Maliyet Dönemleri</Typography>
            <Typography variant="caption" color="text.disabled">Aylık bazda maliyet tanımlayın</Typography>
          </Box>
          <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => setRates([...rates, emptyRate()])}>Dönem Ekle</Button>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {rates.length === 0 && (
            <Box sx={{ textAlign: 'center', p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2, color: 'text.disabled' }}>
              <Typography variant="body2">Henüz maliyet dönemi eklenmedi</Typography>
            </Box>
          )}
          {rates.map((rate, idx) => (
            <RateForm key={idx} rate={rate}
              onChange={updated => setRates(rates.map((r, i) => i === idx ? updated : r))}
              onRemove={() => setRates(rates.filter((_, i) => i !== idx))} />
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>İptal</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Oluştur'}</Button>
      </DialogActions>
    </Dialog>
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
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setModalOpen(true); }}>Yeni Kıdem</Button>
      </div>

      <div className="card">
        {loading ? <div className="loading">Yükleniyor...</div>
          : seniorities.length === 0 ? <div className="empty-state"><p>Henüz kıdem tanımlanmamış.</p></div>
          : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Kıdem Adı</th><th>Maliyet Dönemleri</th><th style={{ textAlign: 'right' }}>İşlemler</th></tr></thead>
              <tbody>
                {seniorities.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td>
                      {!s.rates?.length ? <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Tanımlanmamış</span>
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
                        <IconButton size="small" onClick={() => { setEditing(s); setModalOpen(true); }}><EditOutlinedIcon sx={{ fontSize: 16 }} /></IconButton>
                        <IconButton size="small" color="error" onClick={() => { setDeleteConfirm(s); setDeleteError(''); }}><DeleteOutlineIcon sx={{ fontSize: 16 }} /></IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && <SeniorityModal seniority={editing} onSave={() => { setModalOpen(false); load(); }} onClose={() => setModalOpen(false)} />}

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Kıdemi Sil</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 1.5 }}>{deleteError}</Alert>}
          <Typography variant="body2" color="text.secondary"><strong>{deleteConfirm?.name}</strong> kıdemini silmek istediğinizden emin misiniz?</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDeleteConfirm(null)}>İptal</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(deleteConfirm.id)}>Sil</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
