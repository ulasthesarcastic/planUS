import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

/**
 * MUI Autocomplete wrapper that keeps the same API as the old custom SearchableSelect.
 * Props: options=[{value,label}], value, onChange(value), placeholder, style, disabled
 */
export default function SearchableSelect({ options = [], value, onChange, placeholder = 'Seçiniz...', style, disabled }) {
  const selected = options.find(o => String(o.value) === String(value)) || null;

  return (
    <Autocomplete
      options={options}
      value={selected}
      onChange={(_, opt) => onChange(opt ? opt.value : '')}
      getOptionLabel={(opt) => opt.label || ''}
      isOptionEqualToValue={(opt, val) => String(opt.value) === String(val.value)}
      disabled={disabled}
      size="small"
      noOptionsText="Sonuç yok"
      style={style}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          variant="outlined"
          size="small"
        />
      )}
    />
  );
}
