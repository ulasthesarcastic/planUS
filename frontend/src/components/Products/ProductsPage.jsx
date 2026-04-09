import { useState, useEffect } from 'react';
import { productApi, personnelApi } from '../../services/api';

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
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';

import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';

const TRL_DESCRIPTIONS = {
  1:'Temel prensipler gözlemlendi', 2:'Teknoloji konsepti oluşturuldu', 3:'Deneysel kanıt gösterildi',
  4:'Laboratuvar ortamında doğrulandı', 5:'İlgili ortamda doğrulandı', 6:'İlgili ortamda gösterildi',
  7:'Operasyonel ortamda prototip', 8:'Sistem tamamlandı ve nitelendi', 9:'Operasyonel ortamda başarıyla çalıştı',
};

const TRL_COLORS = [null,'default','default','primary','primary','secondary','secondary','warning','warning','success'];

function TrlBadge({ level }) {
  return <Chip label={`TRL ${level}`} size="small" color={TRL_COLORS[level]} variant="outlined" sx={{ fontFamily: '"DM Mono", monospace', fontWeight: 700, height: 22, fontSize: '0.75rem' }} />;
}

function TrlSelector({ value, onChange }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
      {[1,2,3,4,5,6,7,8,9].map(n => (
        <Tooltip key={n} title={TRL_DESCRIPTIONS[n]} placement="top">
          <Box
            onClick={() => onChange(n)}
            sx={{
              width: 36, height: 36, borderRadius: 2, border: '1px solid',
              borderColor: value === n ? 'primary.main' : 'divider',
              bgcolor: value === n ? 'primary.main' : 'background.paper',
              color: value === n ? 'primary.contrastText' : 'text.secondary',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              fontFamily: '"DM Mono", monospace', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              '&:hover': { borderColor: 'primary.main', bgcolor: value === n ? 'primary.main' : 'action.hover' },
            }}
          >{n}</Box>
        </Tooltip>
      ))}
    </Box>
  );
}

function ProductModal({ product, personnel, onSave, onClose }) {
  const isEdit = !!product;
  const [form, setForm] = useState({ name: product?.name || '', ownerId: product?.ownerId || '', description: product?.description || '', trlLevel: product?.trlLevel || 1 });
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
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {isEdit ? 'Ürün Düzenle' : 'Yeni Ürün'}
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1, mb: 2 }}>
          <TextField label="Ürün Adı" placeholder="Ürün adı" value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
          <TextField label="Ürün Sahibi (opsiyonel)" select value={form.ownerId} onChange={e => set('ownerId', e.target.value)} SelectProps={{ native: true }}>
            <option value="">— Seçilmedi —</option>
            {personnel.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
          </TextField>
        </Box>
        <TextField label="Açıklama (opsiyonel)" placeholder="Ürün açıklaması..." value={form.description} onChange={e => set('description', e.target.value)} multiline rows={3} fullWidth sx={{ mb: 2 }} />
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>TRL Seviyesi</Typography>
          <TrlSelector value={form.trlLevel} onChange={v => set('trlLevel', v)} />
          <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>TRL {form.trlLevel} — {TRL_DESCRIPTIONS[form.trlLevel]}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>İptal</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Oluştur'}</Button>
      </DialogActions>
    </Dialog>
  );
}

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

  const getOwnerName = (id) => { if (!id) return '—'; const p = personnel.find(p => p.id === id); return p ? `${p.firstName} ${p.lastName}` : '—'; };
  const handleDelete = async (id) => { await productApi.delete(id); setDeleteConfirm(null); load(); };

  const trlGroups = [
    { label: 'Araştırma (1-3)', min: 1, max: 3, color: 'text.disabled' },
    { label: 'Geliştirme (4-6)', min: 4, max: 6, color: 'secondary.main' },
    { label: 'Olgunlaşma (7-9)', min: 7, max: 9, color: 'success.main' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Ürün Yönetimi</div>
          <div className="page-subtitle">Ürünleri ve olgunluk seviyelerini yönetin</div>
        </div>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setModalOpen(true); }}>Yeni Ürün</Button>
      </div>

      {products.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
          {trlGroups.map(g => {
            const count = products.filter(p => p.trlLevel >= g.min && p.trlLevel <= g.max).length;
            return (
              <Paper key={g.label} variant="outlined" sx={{ flex: 1, p: 1.5, borderRadius: 2 }}>
                <Typography variant="caption" color={g.color} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, display: 'block', mb: 0.5 }}>{g.label}</Typography>
                <Typography variant="h5" color={g.color} sx={{ fontFamily: '"DM Mono", monospace', fontWeight: 700, mb: 0.75 }}>{count}</Typography>
                <Box sx={{ height: 4, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Box sx={{ height: '100%', width: `${products.length ? (count/products.length)*100 : 0}%`, bgcolor: g.color, borderRadius: 1, transition: 'width 0.3s' }} />
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      <div className="card">
        {loading ? <div className="loading">Yükleniyor...</div>
          : products.length === 0 ? <div className="empty-state"><p>Henüz ürün eklenmemiş.</p></div>
          : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {[['name','Ürün Adı'],['owner','Ürün Sahibi'],['trl','TRL Seviyesi']].map(([col,label]) => (
                    <th key={col} onClick={() => { if(sortCol===col) setSortDir(d=>d==='asc'?'desc':'asc'); else{setSortCol(col);setSortDir('asc');} }} style={{ cursor:'pointer' }}>
                      {label} {sortCol!==col?<span style={{opacity:0.3,fontSize:10}}>↕</span>:<span style={{fontSize:10}}>{sortDir==='asc'?'↑':'↓'}</span>}
                    </th>
                  ))}
                  <th>Açıklama</th>
                  <th style={{ textAlign: 'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {[...products].sort((a,b) => {
                  if(!sortCol) return 0;
                  const dir = sortDir==='asc'?1:-1;
                  if(sortCol==='name') return dir*(a.name||'').localeCompare(b.name||'','tr');
                  if(sortCol==='owner') return dir*getOwnerName(a.ownerId).localeCompare(getOwnerName(b.ownerId),'tr');
                  if(sortCol==='trl') return dir*((a.trlLevel||0)-(b.trlLevel||0));
                  return 0;
                }).map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{getOwnerName(p.ownerId)}</td>
                    <td>
                      <TrlBadge level={p.trlLevel} />
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>{TRL_DESCRIPTIONS[p.trlLevel]}</Typography>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{p.description || '—'}</td>
                    <td>
                      <div className="actions-cell">
                        <IconButton size="small" onClick={() => { setEditing(p); setModalOpen(true); }}><EditOutlinedIcon sx={{ fontSize: 16 }} /></IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteConfirm(p)}><DeleteOutlineIcon sx={{ fontSize: 16 }} /></IconButton>
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

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Ürünü Sil</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary"><strong>{deleteConfirm?.name}</strong> ürününü silmek istediğinizden emin misiniz?</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDeleteConfirm(null)}>İptal</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(deleteConfirm.id)}>Sil</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
