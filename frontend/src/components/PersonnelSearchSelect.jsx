import { useState, useRef, useEffect } from 'react';
import { personnelApi } from '../services/api';
import styles from './PersonnelSearchSelect.module.css';

/**
 * Arama bazlı personel seçici.
 * Tüm personel listesini yüklemez — kullanıcı yazınca API'dan en fazla 20 sonuç çeker.
 *
 * Props:
 *   value        — seçili personel ID'si (string)
 *   onChange     — (id: string) => void
 *   initialLabel — seçili kişinin adı (parent zaten yüklüyse buradan geçir, ekstra istek gitmez)
 *   allowClear   — boş seçenek göster (opsiyonel alanlar için)
 *   clearLabel   — boş seçenek etiketi
 *   placeholder  — açık olmadığında gösterilecek yer tutucu
 *   excludeIds   — sonuçlardan çıkarılacak ID listesi (zaten eklenmiş personel)
 *   disabled
 *   style        — container'a ek stil
 */
export default function PersonnelSearchSelect({
  value,
  onChange,
  initialLabel = '',
  allowClear   = false,
  clearLabel   = '— Seçilmedi —',
  placeholder  = 'Personel arayın...',
  excludeIds   = [],
  disabled     = false,
  style        = {},
}) {
  const [open, setOpen]               = useState(false);
  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState([]);
  const [searching, setSearching]     = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(initialLabel);

  const containerRef  = useRef(null);
  const inputRef      = useRef(null);
  const debounceRef   = useRef(null);

  // Parent'tan initialLabel veya value değişince etiketi güncelle
  useEffect(() => {
    setSelectedLabel(initialLabel || '');
  }, [initialLabel, value]);

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

  const excludedRef = useRef(new Set(excludeIds.map(String)));
  excludedRef.current = new Set(excludeIds.map(String));

  const doSearch = (q) => {
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    personnelApi.search(q, { page: 0, size: 20 })
      .then(res => {
        const all = res.data?.content ?? [];
        setResults(all.filter(p => !excludedRef.current.has(String(p.id))));
      })
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  };

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    setResults([]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleQueryChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q), 250);
  };

  const handleSelect = (person) => {
    onChange(String(person.id));
    setSelectedLabel(`${person.firstName} ${person.lastName}`);
    setOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    onChange('');
    setSelectedLabel('');
    setOpen(false);
    setQuery('');
  };

  const displayValue = open ? query : selectedLabel;

  return (
    <div ref={containerRef} className={styles.container} style={style}>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          className={`form-input ${styles.input}`}
          value={displayValue}
          placeholder={open ? 'Ad veya soyad ile arayın...' : (selectedLabel || placeholder)}
          disabled={disabled}
          onChange={handleQueryChange}
          onClick={handleOpen}
          onFocus={() => { if (!open && !disabled) handleOpen(); }}
        />
        <svg
          width="12" height="12"
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {open && (
        <div className={styles.dropdown}>
          {allowClear && (
            <div className={styles.clearOption} onMouseDown={handleClear}>
              {clearLabel}
            </div>
          )}

          {searching ? (
            <div className={styles.message}>Aranıyor…</div>
          ) : results.length === 0 ? (
            <div className={styles.message}>
              {query.length >= 2 ? 'Eşleşen personel bulunamadı' : 'En az 2 karakter yazın'}
            </div>
          ) : results.map(p => {
            const isSelected = String(p.id) === String(value);
            return (
              <div
                key={p.id}
                onMouseDown={() => handleSelect(p)}
                className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
              >
                {p.firstName} {p.lastName}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
