import { useState, useEffect } from 'react';
import { projectTypeApi } from '../../services/api';

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

import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

export default function ProjectTypesPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const load = () => projectTypeApi.getAll().then(r => { setTypes(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const openNew  = () => { setEditing('new'); setName(''); setError(''); };
  const openEdit = (t) => { setEditing(t); setName(t.name); setError(''); };
  const cancel   = () => { setEditing(null); setName(''); setError(''); };

  const save = async () => {
    if (!name.trim()) { setError('Ad zorunludur.'); return; }
    setSaving(true); setError('');
    try {
      if (editing === 'new') await projectTypeApi.create({ name: name.trim() });
      else await projectTypeApi.update(editing.id, { name: name.trim() });
      cancel(); load();
    } catch (e) {
      setError(e.response?.data?.error || 'Bir hata oluştu.');
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    setSaving(true);
    try { await projectTypeApi.delete(deleteId); setDeleteId(null); load(); }
    catch (e) { setError(e.response?.data?.error || 'Silinemedi.'); setDeleteId(null); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Proje Tipleri</div>
          <div className="page-subtitle">{types.length} tip tanımlı</div>
        </div>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>Yeni Tip</Button>
      </div>

      {error && !editing && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {editing && (
        <Paper variant="outlined" sx={{ p: 2.5, mb: 2.5, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            {editing === 'new' ? 'Yeni Proje Tipi' : 'Proje Tipini Düzenle'}
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
          <TextField
            label="Tip Adı" placeholder="örn. Müşterili" value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()} autoFocus fullWidth sx={{ mb: 1.5 }}
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={cancel}>İptal</Button>
            <Button variant="contained" onClick={save} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
          </Box>
        </Paper>
      )}

      {types.length === 0 ? (
        <div className="empty-state"><p>Henüz proje tipi tanımlanmamış.</p></div>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {types.map(t => (
            <Paper key={t.id} variant="outlined" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '10px 16px', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{t.name}</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton size="small" onClick={() => openEdit(t)}><EditOutlinedIcon sx={{ fontSize: 16 }} /></IconButton>
                <IconButton size="small" color="error" onClick={() => setDeleteId(t.id)}><DeleteOutlineIcon sx={{ fontSize: 16 }} /></IconButton>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Proje Tipini Sil</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">Bu proje tipini silmek istediğinize emin misiniz? Bu tipe atanmış projeler varsa silinemez.</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDeleteId(null)}>İptal</Button>
          <Button variant="contained" color="error" onClick={confirmDelete} disabled={saving}>{saving ? 'Siliniyor...' : 'Sil'}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
