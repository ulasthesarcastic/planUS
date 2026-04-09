import { useState, useEffect } from 'react';
import { organizationApi } from '../../services/api';

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
import Chip from '@mui/material/Chip';

import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

function UnitModal({ unit, units, onSave, onClose }) {
  const [name, setName] = useState(unit?.name || '');
  const [parentId, setParentId] = useState(unit?.parentId || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const roots = units.filter(u => !u.parentId);

  const handleSave = async () => {
    if (!name.trim()) return setError('Birim adı zorunludur.');
    setSaving(true);
    try {
      const data = { name: name.trim(), parentId: parentId || null };
      if (unit?.id) await organizationApi.update(unit.id, data);
      else await organizationApi.create(data);
      onSave();
    } catch (e) {
      setError(e.response?.data?.error || 'Bir hata oluştu.');
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {unit?.id ? 'Birimi Düzenle' : 'Yeni Birim'}
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
        <TextField label="Birim Adı" placeholder="Birim adı" value={name} onChange={e => setName(e.target.value)} autoFocus fullWidth sx={{ mt: 1, mb: 2 }} />
        <TextField
          label="Üst Birim"
          select size="small" value={parentId} onChange={e => setParentId(e.target.value)} fullWidth
          helperText="Boş bırakılırsa 1. seviye olur"
          SelectProps={{ native: true }}
        >
          <option value="">— 1. Seviye Birim —</option>
          {roots.filter(r => r.id !== unit?.id).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>İptal</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function OrganizationPage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [openUnits, setOpenUnits] = useState({});

  const load = async () => { const res = await organizationApi.getAll(); setUnits(res.data); setLoading(false); };
  useEffect(() => { load(); }, []);

  const roots = units.filter(u => !u.parentId);
  const getChildren = (parentId) => units.filter(u => u.parentId === parentId);
  const toggleUnit = (id) => setOpenUnits(prev => ({ ...prev, [id]: !prev[id] }));

  const handleDelete = async (unit) => {
    try { await organizationApi.delete(unit.id); setDeleteConfirm(null); load(); }
    catch (e) { setDeleteError(e.response?.data?.error || 'Silinemedi.'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Organizasyon Yönetimi</div>
          <div className="page-subtitle">Birim hiyerarşisini tanımlayın</div>
        </div>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setModalOpen(true); }}>Yeni Birim</Button>
      </div>

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
        {[
          { label: '1. Seviye Birim', value: roots.length, color: 'primary' },
          { label: '2. Seviye Birim', value: units.filter(u => u.parentId).length, color: 'secondary' },
        ].map(c => (
          <Box key={c.label} sx={{ flex: 1, p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color={`${c.color}.main`} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, display: 'block', mb: 0.5 }}>{c.label}</Typography>
            <Typography variant="h5" color={`${c.color}.main`} sx={{ fontFamily: '"DM Mono", monospace', fontWeight: 700 }}>{c.value}</Typography>
          </Box>
        ))}
      </Box>

      {loading ? <div className="loading">Yükleniyor...</div> : (
        <div className="card">
          {roots.length === 0 ? <div className="empty-state"><p>Henüz birim eklenmemiş.</p></div> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Birim</th><th>Seviye</th><th style={{ textAlign: 'right' }}>İşlemler</th></tr></thead>
                <tbody>
                  {roots.map(root => {
                    const children = getChildren(root.id);
                    const isOpen = openUnits[root.id] !== false;
                    return [
                      <tr key={root.id} style={{ cursor: children.length > 0 ? 'pointer' : 'default' }} onClick={() => children.length > 0 && toggleUnit(root.id)}>
                        <td>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ChevronRightIcon sx={{ fontSize: 16, opacity: children.length > 0 ? 1 : 0, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', color: 'text.disabled' }} />
                            <span style={{ fontWeight: 700 }}>{root.name}</span>
                            {children.length > 0 && <Chip label={`${children.length} alt birim`} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />}
                          </Box>
                        </td>
                        <td><Chip label="1. Seviye" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} /></td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="actions-cell">
                            <Button size="small" variant="outlined" startIcon={<AddIcon sx={{ fontSize: 12 }} />} sx={{ fontSize: 12, py: 0.25, px: 1 }}
                              onClick={() => { setEditing({ parentId: root.id }); setModalOpen(true); }}>Alt Birim</Button>
                            <IconButton size="small" onClick={() => { setEditing(root); setModalOpen(true); }}><EditOutlinedIcon sx={{ fontSize: 15 }} /></IconButton>
                            <IconButton size="small" color="error" onClick={() => { setDeleteError(''); setDeleteConfirm(root); }}><DeleteOutlineIcon sx={{ fontSize: 15 }} /></IconButton>
                          </div>
                        </td>
                      </tr>,
                      ...(isOpen ? children.map(child => (
                        <tr key={child.id}>
                          <td><Box sx={{ pl: 4.5 }}><span style={{ fontWeight: 500 }}>{child.name}</span></Box></td>
                          <td><Chip label="2. Seviye" size="small" color="secondary" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} /></td>
                          <td>
                            <div className="actions-cell">
                              <IconButton size="small" onClick={() => { setEditing(child); setModalOpen(true); }}><EditOutlinedIcon sx={{ fontSize: 15 }} /></IconButton>
                              <IconButton size="small" color="error" onClick={() => { setDeleteError(''); setDeleteConfirm(child); }}><DeleteOutlineIcon sx={{ fontSize: 15 }} /></IconButton>
                            </div>
                          </td>
                        </tr>
                      )) : [])
                    ];
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modalOpen && <UnitModal unit={editing} units={units} onSave={() => { setModalOpen(false); load(); }} onClose={() => setModalOpen(false)} />}

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Birimi Sil</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 1.5 }}>{deleteError}</Alert>}
          <Typography variant="body2" color="text.secondary"><strong>{deleteConfirm?.name}</strong> birimi silinecek.</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDeleteConfirm(null)}>İptal</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(deleteConfirm)}>Sil</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
