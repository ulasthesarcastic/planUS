import { useState, useRef, useEffect } from 'react';

/**
 * Searchable select dropdown.
 * - Alphabetically sorted options
 * - Max 3 items visible at a time (scroll to see more when filtered)
 * - Type to filter
 * - Props: options=[{value,label}], value, onChange, placeholder, style
 */
export default function SearchableSelect({ options = [], value, onChange, placeholder = 'Seçiniz...', style }) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const containerRef          = useRef(null);
  const inputRef              = useRef(null);

  const sorted = [...options].sort((a, b) => a.label.localeCompare(b.label, 'tr'));

  const filtered = query.trim()
    ? sorted.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : sorted;

  const selected = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(opt) {
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  }

  function handleOpen() {
    setOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const ITEM_H = 34; // px per item
  const MAX_VISIBLE = 3;
  const dropH = Math.min(filtered.length, MAX_VISIBLE) * ITEM_H;

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
      {/* Trigger */}
      <div
        onClick={handleOpen}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
          border: '1px solid var(--border)',
          background: open ? 'var(--bg-hover)' : 'var(--bg-secondary)',
          minWidth: 160, userSelect: 'none',
          fontSize: 13, color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {open ? '' : (selected?.label || placeholder)}
        </span>
        <svg width={12} height={12} viewBox="0 0 12 12" style={{ flexShrink: 0, marginLeft: 4, opacity: 0.5, transform: open ? 'rotate(180deg)' : '' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 1000, marginTop: 4,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
          minWidth: '100%', width: 'max-content', maxWidth: 300,
        }}>
          {/* Search input */}
          <div style={{ padding: '8px 8px 4px' }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ara..."
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '5px 8px', borderRadius: 5, fontSize: 12,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                fontFamily: 'DM Sans, sans-serif', outline: 'none',
              }}
            />
          </div>

          {/* Options list */}
          <div style={{ overflowY: 'auto', maxHeight: dropH || ITEM_H }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>Sonuç yok</div>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt)}
                  style={{
                    padding: '7px 12px', fontSize: 13, cursor: 'pointer',
                    background: String(opt.value) === String(value) ? 'var(--accent)11' : 'transparent',
                    color: String(opt.value) === String(value) ? 'var(--accent)' : 'var(--text-primary)',
                    fontFamily: 'DM Sans, sans-serif',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = String(opt.value) === String(value) ? 'var(--accent)11' : 'transparent'}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
