import { createTheme } from '@mui/material/styles';

// MD3 color tokens - dark grey + cream light
// Based on https://m3.material.io/

const dark = {
  palette: {
    mode: 'dark',
    primary:   { main: '#7CB9FF', light: '#9ECAFF', dark: '#5A9BE8', contrastText: '#003060' },
    secondary: { main: '#BFBFBF', light: '#D4D4D4', dark: '#9A9A9A', contrastText: '#1A1A1A' },
    error:     { main: '#FFB4AB', light: '#FFCCC6', dark: '#E8897F', contrastText: '#690005' },
    warning:   { main: '#FFB95E', light: '#FFCF8C', dark: '#E8993A', contrastText: '#3E2200' },
    success:   { main: '#4ED99F', light: '#76E8B7', dark: '#28B87A', contrastText: '#003823' },
    background: {
      default: '#141218',   // MD3 Surface Dim
      paper:   '#211F26',   // MD3 Surface Container
    },
    text: {
      primary:   '#E6E1E5', // MD3 On Surface
      secondary: '#CAC4D0', // MD3 On Surface Variant
      disabled:  '#938F99', // MD3 Outline
    },
    divider: '#49454F',      // MD3 Outline Variant
    action: {
      hover:           'rgba(230, 225, 229, 0.08)',
      selected:        'rgba(124, 185, 255, 0.12)',
      disabledBackground: 'rgba(230, 225, 229, 0.12)',
    },
  },
};

const light = {
  palette: {
    mode: 'light',
    primary:   { main: '#1A5FB4', light: '#3D7FD4', dark: '#0D3D7A', contrastText: '#FFFFFF' },
    secondary: { main: '#5A5465', light: '#7A748A', dark: '#3A3445', contrastText: '#FFFFFF' },
    error:     { main: '#BA1A1A', light: '#D94040', dark: '#8C0A0A', contrastText: '#FFFFFF' },
    warning:   { main: '#985000', light: '#C06B00', dark: '#6E3700', contrastText: '#FFFFFF' },
    success:   { main: '#006D3B', light: '#1A8F55', dark: '#004D29', contrastText: '#FFFFFF' },
    background: {
      default: '#F4EEE0',   // Warm cream
      paper:   '#FAF7F0',   // Light cream white
    },
    text: {
      primary:   '#1C1B1F', // MD3 On Surface
      secondary: '#49454F', // MD3 On Surface Variant
      disabled:  '#79747E', // MD3 Outline
    },
    divider: '#C8C2B8',      // Warm border
    action: {
      hover:           'rgba(28, 27, 31, 0.06)',
      selected:        'rgba(26, 95, 180, 0.10)',
      disabledBackground: 'rgba(28, 27, 31, 0.12)',
    },
  },
};

const shape = { borderRadius: 12 };

const typography = {
  fontFamily: '"DM Sans", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontWeight: 700, letterSpacing: '-0.5px' },
  h2: { fontWeight: 700, letterSpacing: '-0.4px' },
  h3: { fontWeight: 600, letterSpacing: '-0.3px' },
  h4: { fontWeight: 600, letterSpacing: '-0.2px' },
  h5: { fontWeight: 600 },
  h6: { fontWeight: 600 },
  subtitle1: { fontWeight: 500 },
  subtitle2: { fontWeight: 500, fontSize: '0.8rem' },
  body1: { fontSize: '0.875rem' },
  body2: { fontSize: '0.8125rem' },
  caption: { fontSize: '0.75rem' },
  button: { fontWeight: 500, textTransform: 'none', letterSpacing: '0.01em' },
};

function buildComponents(mode) {
  const isDark = mode === 'dark';
  const surfaceContainer     = isDark ? '#211F26' : '#FAF7F0';
  const surfaceContainerHigh = isDark ? '#2B2930' : '#EDE8DE';
  const surfaceContainerLow  = isDark ? '#1D1B20' : '#EDE8DE';
  const outlineVariant       = isDark ? '#49454F' : '#C8C2B8';
  const onSurface            = isDark ? '#E6E1E5' : '#1C1B1F';
  const primaryMain          = isDark ? '#7CB9FF' : '#1A5FB4';

  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: '"DM Sans", "Roboto", sans-serif',
          WebkitFontSmoothing: 'antialiased',
        },
        '*': { boxSizing: 'border-box' },
        '::-webkit-scrollbar': { width: 6, height: 6 },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': {
          background: outlineVariant,
          borderRadius: 3,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? '#1D1B20' : '#FAF7F0',
          borderBottom: `1px solid ${outlineVariant}`,
          boxShadow: 'none',
          color: onSurface,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: isDark ? '#1D1B20' : '#EDE8DE',
          borderRight: `1px solid ${outlineVariant}`,
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: surfaceContainer,
          border: `1px solid ${outlineVariant}`,
          boxShadow: 'none',
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          backgroundColor: surfaceContainer,
          boxShadow: isDark
            ? '0 2px 8px rgba(0,0,0,0.4)'
            : '0 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: surfaceContainerHigh,
          border: `1px solid ${outlineVariant}`,
          borderRadius: 16,
          boxShadow: isDark
            ? '0 12px 48px rgba(0,0,0,0.6)'
            : '0 12px 48px rgba(0,0,0,0.15)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontSize: '1rem', fontWeight: 600, padding: '20px 24px 12px' },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { padding: '8px 24px 16px' },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 24px 20px',
          borderTop: `1px solid ${outlineVariant}`,
          gap: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          textTransform: 'none',
          fontSize: '0.875rem',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        outlined: {
          borderColor: outlineVariant,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: surfaceContainerLow,
            '& fieldset': { borderColor: outlineVariant },
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: outlineVariant },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500, fontSize: '0.75rem' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: surfaceContainerLow,
            color: isDark ? '#938F99' : '#79747E',
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            borderBottom: `1px solid ${outlineVariant}`,
            padding: '10px 16px',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            '&:hover': { backgroundColor: isDark ? 'rgba(230,225,229,0.05)' : 'rgba(28,27,31,0.04)' },
            '&:last-child .MuiTableCell-body': { borderBottom: 'none' },
          },
          '& .MuiTableCell-body': {
            borderBottom: `1px solid ${outlineVariant}`,
            color: onSurface,
            fontSize: '0.8375rem',
            padding: '12px 16px',
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: surfaceContainer,
          border: `1px solid ${outlineVariant}`,
          borderRadius: 12,
          overflow: 'hidden',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '1px 8px',
          width: 'auto',
          padding: '8px 10px',
          '&.Mui-selected': {
            backgroundColor: isDark ? 'rgba(124,185,255,0.12)' : 'rgba(26,95,180,0.10)',
            color: primaryMain,
            '&:hover': {
              backgroundColor: isDark ? 'rgba(124,185,255,0.16)' : 'rgba(26,95,180,0.14)',
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { minWidth: 36 },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: outlineVariant },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.75rem',
          borderRadius: 6,
          backgroundColor: isDark ? '#49454F' : '#1C1B1F',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8, fontSize: '0.8125rem' },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          borderRadius: 6,
          margin: '1px 4px',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: surfaceContainerHigh,
          border: `1px solid ${outlineVariant}`,
          borderRadius: 10,
          boxShadow: isDark
            ? '0 8px 24px rgba(0,0,0,0.4)'
            : '0 8px 24px rgba(0,0,0,0.12)',
          padding: '4px',
        },
      },
    },
  };
}

export function createAppTheme(mode) {
  const base = mode === 'dark' ? dark : light;
  return createTheme({
    ...base,
    shape,
    typography,
    components: buildComponents(mode),
  });
}
