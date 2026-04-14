import { useState, useEffect, useRef, useCallback } from 'react';
import { projectCategoryApi } from '../../services/api';

// ─── Icons ──────────────────────────────────────────────────────────
function PlusIcon()  { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function EditIcon()  { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon() { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function XIcon()     { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function BackIcon()  { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>; }
function SaveIcon()  { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>; }
function TreeIcon()  { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>; }

// ─── Step type config ────────────────────────────────────────────────
const STEP_TYPES = {
  START:            { label: 'Başlangıç',  color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  NORMAL:           { label: 'Normal',     color: '#94a3b8',  bg: 'rgba(148,163,184,0.1)' },
  TERMINAL_SUCCESS: { label: 'Başarılı',   color: '#22c55e',  bg: 'rgba(34,197,94,0.15)' },
  TERMINAL_FAILURE: { label: 'Başarısız',  color: '#ef4444',  bg: 'rgba(239,68,68,0.15)' },
};

const CANVAS_W = 1200;
const CANVAS_H = 680;
const NODE_W   = 160;
const NODE_H   = 52;

// ─── Workflow Editor ─────────────────────────────────────────────────
function WorkflowEditor({ categoryId, categoryName, onBack }) {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [addDialog, setAddDialog] = useState(null);
  const [editDialog, setEditDialog] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saveMsg, setSaveMsg] = useState('');
  const canvasRef = useRef(null);
  const dragging  = useRef(null);

  const load = useCallback(async () => {
    try { const r = await projectCategoryApi.getWorkflow(categoryId); setSteps(r.data || []); }
    catch { setSteps([]); }
    setLoading(false);
  }, [categoryId]);

  useEffect(() => { load(); }, [load]);

  // drag
  const onNodeMouseDown = (e, stepId) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (connecting) {
      if (connecting !== stepId) {
        setSteps(prev => prev.map(s =>
          s.id === connecting && !s.transitions.includes(stepId)
            ? { ...s, transitions: [...s.transitions, stepId] } : s
        ));
      }
      setConnecting(null);
      return;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    const step = steps.find(s => s.id === stepId);
    dragging.current = { stepId, ox: e.clientX - rect.left - step.positionX, oy: e.clientY - rect.top - step.positionY };
    setSelected(stepId);
  };

  const onMouseMove = (e) => {
    if (!dragging.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(CANVAS_W - NODE_W, e.clientX - rect.left - dragging.current.ox));
    const y = Math.max(0, Math.min(CANVAS_H - NODE_H, e.clientY - rect.top - dragging.current.oy));
    setSteps(prev => prev.map(s => s.id === dragging.current.stepId ? { ...s, positionX: x, positionY: y } : s));
  };

  const onCanvasClick = (e) => {
    if (connecting) { setConnecting(null); return; }
    const tag = e.target.tagName;
    if (tag === 'DIV' || tag === 'svg' || tag === 'rect' || tag === 'circle') {
      setSelected(null);
      const rect = canvasRef.current.getBoundingClientRect();
      setAddDialog({ x: Math.max(0, e.clientX - rect.left - NODE_W / 2), y: Math.max(0, e.clientY - rect.top - NODE_H / 2) });
    }
  };

  const addStep = (label, type) => {
    setSteps(prev => [...prev, {
      id: `new_${Date.now()}`, categoryId, label, stepType: type,
      positionX: addDialog.x, positionY: addDialog.y,
      stepOrder: prev.length, transitions: [],
    }]);
    setAddDialog(null);
  };

  const deleteStep = (stepId) => {
    setSteps(prev => prev.filter(s => s.id !== stepId).map(s => ({ ...s, transitions: s.transitions.filter(t => t !== stepId) })));
    setDeleteId(null);
    if (selected === stepId) setSelected(null);
  };

  const removeTransition = (fromId, toId) => {
    setSteps(prev => prev.map(s => s.id === fromId ? { ...s, transitions: s.transitions.filter(t => t !== toId) } : s));
  };

  const save = async () => {
    setSaving(true);
    try {
      await projectCategoryApi.saveWorkflow(categoryId, steps);
      setSaveMsg('Kaydedildi ✓'); setTimeout(() => setSaveMsg(''), 2000);
      await load();
    } catch { setSaveMsg('Hata!'); setTimeout(() => setSaveMsg(''), 2000); }
    setSaving(false);
  };

  const stepMap = Object.fromEntries(steps.map(s => [s.id, s]));
  const selStep = steps.find(s => s.id === selected);

  const getCenter = (s) => ({ x: s.positionX + NODE_W / 2, y: s.positionY + NODE_H / 2 });

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={onBack} style={{ padding: '6px 10px', display: 'flex', gap: 6, alignItems: 'center' }}>
            <BackIcon /> Geri
          </button>
          <div>
            <div className="page-title">{categoryName} — Süreç Tasarımı</div>
            <div className="page-subtitle">Boş alana tıkla adım ekle · Sürükle konumlandır · Seçip "Bağla" ile ok çiz</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {saveMsg && <span style={{ fontSize: 12, color: saveMsg.includes('✓') ? '#34c97a' : '#f05c5c', fontWeight: 600 }}>{saveMsg}</span>}
          <button className="btn btn-primary" onClick={save} disabled={saving} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <SaveIcon /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Selection toolbar */}
      {selStep && (
        <div style={{ marginBottom: 10, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Seçili: {selStep.label}</span>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => { setConnecting(selected); setSelected(null); }}>→ Bağlantı Çiz</button>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setEditDialog(selStep)}>Düzenle</button>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px', color: '#f05c5c' }} onClick={() => setDeleteId(selected)}>Sil</button>
        </div>
      )}

      {connecting && (
        <div style={{ marginBottom: 10, padding: '8px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', fontSize: 13, color: '#818cf8' }}>
          Bağlantı modu aktif — hedef adıma tıklayın · Boş alana tıklayarak iptal
        </div>
      )}

      {/* Canvas */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-secondary)', overflowX: 'auto' }}>
        <div
          ref={canvasRef}
          style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, cursor: connecting ? 'crosshair' : 'default' }}
          onMouseMove={onMouseMove}
          onMouseUp={() => { dragging.current = null; }}
          onClick={onCanvasClick}
        >
          {/* Dot grid */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
              <pattern id="wf-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="var(--border)" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#wf-dots)" />
          </svg>

          {/* Arrows SVG */}
          <svg style={{ position: 'absolute', inset: 0, width: CANVAS_W, height: CANVAS_H, pointerEvents: 'none' }}>
            <defs>
              <marker id="wf-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#6366f1" opacity="0.8" />
              </marker>
            </defs>
            {steps.flatMap(from =>
              (from.transitions || []).map(toId => {
                const to = stepMap[toId]; if (!to) return null;
                const fc = getCenter(from), tc = getCenter(to);
                const dx = tc.x - fc.x;
                return (
                  <path key={`${from.id}-${toId}`}
                    d={`M${fc.x},${fc.y} C${fc.x + dx * 0.5},${fc.y} ${tc.x - dx * 0.5},${tc.y} ${tc.x},${tc.y}`}
                    fill="none" stroke="#6366f1" strokeWidth="1.5" opacity="0.65" markerEnd="url(#wf-arrow)"
                  />
                );
              })
            )}
          </svg>

          {/* Nodes */}
          {steps.map(step => {
            const cfg = STEP_TYPES[step.stepType] || STEP_TYPES.NORMAL;
            const isSel = selected === step.id;
            const isConnSrc = connecting === step.id;
            return (
              <div key={step.id} onMouseDown={e => onNodeMouseDown(e, step.id)} style={{
                position: 'absolute', left: step.positionX, top: step.positionY,
                width: NODE_W, height: NODE_H,
                background: cfg.bg,
                border: `2px solid ${isSel || isConnSrc ? '#6366f1' : cfg.color}`,
                borderRadius: 10,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: connecting && connecting !== step.id ? 'pointer' : 'grab',
                userSelect: 'none', padding: '4px 8px',
                boxShadow: isSel ? '0 0 0 3px rgba(99,102,241,0.25)' : 'none',
                transition: 'box-shadow 0.15s', zIndex: isSel ? 10 : 1,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: cfg.color === '#94a3b8' ? 'var(--text-primary)' : cfg.color, textAlign: 'center', lineHeight: 1.2 }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{cfg.label}</div>
              </div>
            );
          })}

          {steps.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8, pointerEvents: 'none' }}>
              <TreeIcon />
              <span style={{ fontSize: 14 }}>Boş alana tıklayarak adım ekleyin</span>
            </div>
          )}
        </div>
      </div>

      {/* Add step dialog */}
      {addDialog && (
        <AddStepDialog onAdd={addStep} onClose={() => setAddDialog(null)} />
      )}

      {/* Edit step dialog */}
      {editDialog && (
        <EditStepDialog step={editDialog} allSteps={steps}
          onSave={updated => { setSteps(prev => prev.map(s => s.id === updated.id ? updated : s)); setEditDialog(null); }}
          onRemoveTransition={removeTransition}
          onClose={() => setEditDialog(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title" style={{ marginBottom: 8 }}>Adımı Sil</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>Bu adımı ve bağlantılarını silmek istiyor musunuz?</p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>İptal</button>
              <button className="btn btn-danger" onClick={() => deleteStep(deleteId)}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddStepDialog({ onAdd, onClose }) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState('NORMAL');
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Yeni Adım Ekle</div>
          <button className="btn-icon" onClick={onClose}><XIcon /></button>
        </div>
        <div className="form-group" style={{ marginTop: 4 }}>
          <label className="form-label">Adım Adı</label>
          <input className="form-input" value={label} onChange={e => setLabel(e.target.value)}
            placeholder="örn. Teklif Verildi" autoFocus
            onKeyDown={e => e.key === 'Enter' && label.trim() && onAdd(label.trim(), type)} />
        </div>
        <div className="form-group">
          <label className="form-label">Adım Tipi</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(STEP_TYPES).map(([key, cfg]) => (
              <button key={key} onClick={() => setType(key)} style={{
                padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                border: `2px solid ${type === key ? cfg.color : 'var(--border)'}`,
                background: type === key ? cfg.bg : 'var(--bg-secondary)',
                color: type === key ? cfg.color : 'var(--text-muted)',
                fontFamily: 'DM Sans, sans-serif',
              }}>{cfg.label}</button>
            ))}
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>İptal</button>
          <button className="btn btn-primary" disabled={!label.trim()} onClick={() => onAdd(label.trim(), type)}>Ekle</button>
        </div>
      </div>
    </div>
  );
}

function EditStepDialog({ step, allSteps, onSave, onRemoveTransition, onClose }) {
  const [label, setLabel] = useState(step.label);
  const [type, setType] = useState(step.stepType || 'NORMAL');
  const connections = (step.transitions || []).map(id => allSteps.find(s => s.id === id)).filter(Boolean);
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Adımı Düzenle</div>
          <button className="btn-icon" onClick={onClose}><XIcon /></button>
        </div>
        <div className="form-group" style={{ marginTop: 4 }}>
          <label className="form-label">Adım Adı</label>
          <input className="form-input" value={label} onChange={e => setLabel(e.target.value)} autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Adım Tipi</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(STEP_TYPES).map(([key, cfg]) => (
              <button key={key} onClick={() => setType(key)} style={{
                padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                border: `2px solid ${type === key ? cfg.color : 'var(--border)'}`,
                background: type === key ? cfg.bg : 'var(--bg-secondary)',
                color: type === key ? cfg.color : 'var(--text-muted)',
                fontFamily: 'DM Sans, sans-serif',
              }}>{cfg.label}</button>
            ))}
          </div>
        </div>
        {connections.length > 0 && (
          <div className="form-group">
            <label className="form-label">Mevcut Bağlantılar</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {connections.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13 }}>→ {c.label}</span>
                  <button className="btn-icon" onClick={() => onRemoveTransition(step.id, c.id)}><XIcon /></button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>İptal</button>
          <button className="btn btn-primary" disabled={!label.trim()} onClick={() => onSave({ ...step, label: label.trim(), stepType: type })}>Kaydet</button>
        </div>
      </div>
    </div>
  );
}

// ─── Color Palette ───────────────────────────────────────────────────
const PALETTE = ['#6366f1','#22c55e','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#ec4899','#14b8a6'];

// ─── Main Categories Page ────────────────────────────────────────────
export default function ProjectCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCat, setEditingCat] = useState(null);
  const [deleteCatId, setDeleteCatId] = useState(null);
  const [workflowCat, setWorkflowCat] = useState(null);
  const [form, setForm] = useState({ name: '', color: PALETTE[0] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try { const r = await projectCategoryApi.getAll(); setCategories(r.data || []); }
    catch { setCategories([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm({ name: '', color: PALETTE[0] }); setError(''); setEditingCat('new'); };
  const openEdit = (cat) => { setForm({ name: cat.name, color: cat.color || PALETTE[0] }); setError(''); setEditingCat(cat); };
  const closeForm = () => { setEditingCat(null); setError(''); };

  const save = async () => {
    if (!form.name.trim()) return setError('Kategori adı zorunludur.');
    setSaving(true); setError('');
    try {
      if (editingCat === 'new') await projectCategoryApi.create({ name: form.name.trim(), color: form.color });
      else await projectCategoryApi.update(editingCat.id, { name: form.name.trim(), color: form.color });
      closeForm(); load();
    } catch (e) { setError(e.response?.data?.error || 'Bir hata oluştu.'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    try { await projectCategoryApi.delete(deleteCatId); setDeleteCatId(null); load(); }
    catch (e) { setError(e.response?.data?.error || 'Silinemedi.'); setDeleteCatId(null); }
  };

  if (workflowCat) {
    return <WorkflowEditor categoryId={workflowCat.id} categoryName={workflowCat.name} onBack={() => setWorkflowCat(null)} />;
  }

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Proje Kategorileri</div>
          <div className="page-subtitle">Her kategoriye süreç (workflow) tanımlayın</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}><PlusIcon /> Yeni Kategori</button>
      </div>

      {error && !editingCat && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Inline form */}
      {editingCat && (
        <div style={{ marginBottom: 20, padding: '16px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>{editingCat === 'new' ? 'Yeni Kategori' : 'Kategoriyi Düzenle'}</div>
          {error && <div className="alert alert-error" style={{ marginBottom: 10 }}>{error}</div>}
          <div className="form-group">
            <label className="form-label">Kategori Adı</label>
            <input className="form-input" value={form.name} autoFocus
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="örn. Ürün, Hizmet, Proje" />
          </div>
          <div className="form-group">
            <label className="form-label">Renk</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PALETTE.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{
                  width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                  outline: form.color === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 2,
                }} />
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={closeForm}>İptal</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
          </div>
        </div>
      )}

      {/* List */}
      {categories.length === 0 && !editingCat ? (
        <div className="empty-state"><p>Henüz kategori tanımlanmamış.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...categories].sort((a, b) => a.name.localeCompare(b.name, 'tr')).map(cat => (
            <div key={cat.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--bg-card)',
              borderLeft: `4px solid ${cat.color || 'var(--accent)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color || 'var(--accent)' }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>{cat.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost" onClick={() => setWorkflowCat(cat)}
                  style={{ fontSize: 12, padding: '5px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <TreeIcon /> Süreç Tasarla
                </button>
                <button className="btn-icon" onClick={() => openEdit(cat)}><EditIcon /></button>
                <button className="btn-icon danger" onClick={() => setDeleteCatId(cat.id)}><TrashIcon /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteCatId && (
        <div className="modal-overlay" onClick={() => setDeleteCatId(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title" style={{ marginBottom: 8 }}>Kategoriyi Sil</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>Bu kategoriyi ve sürecini silmek istediğinizden emin misiniz?</p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteCatId(null)}>İptal</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
