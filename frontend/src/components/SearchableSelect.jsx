import { useState, useRef, useEffect } from 'react';

export default function SearchableSelect({ options = [], value, onChange, placeholder = 'Seçiniz...', style, disabled }) {
  const selected = options.find(o => String(o.value) === String(value)) || null;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Dışarı tıklanınca kapat
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const handleSelect = (opt) => {
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  };

  const displayValue = open ? query : (selected?.label || '');

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          className="form-input"
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={!open}
          onChange={e => setQuery(e.target.value)}
          onClick={() => {
            if (disabled) return;
            setOpen(true);
            setQuery('');
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          onFocus={() => { if (!disabled) setOpen(true); }}
          style={{ cursor: disabled ? 'not-allowed' : 'pointer', paddingRight: 28, opacity: disabled ? 0.5 : 1 }}
        />
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          style={{ position: 'absolute', right: 10, top: '50%', transform: `translateY(-50%) ${open ? 'rotate(180deg)' : ''}`, pointerEvents: 'none', color: 'var(--text-muted)', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1000,
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxHeight: 220, overflowY: 'auto',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-muted)' }}>Sonuç yok</div>
          ) : filtered.map(opt => (
            <div key={opt.value} onMouseDown={() => handleSelect(opt)} style={{
              padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: 'var(--text-primary)',
              background: String(opt.value) === String(value) ? 'var(--accent-dim)' : 'transparent',
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = String(opt.value) === String(value) ? 'var(--accent-dim)' : 'transparent'}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
