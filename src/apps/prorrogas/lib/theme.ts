import { createTheme } from '@mui/material/styles';

// ─────────────────────────────────────────────────────────────────────────────
// THEME — El Archivero Digital
// Color primario de marca: #004680
// ─────────────────────────────────────────────────────────────────────────────

export const theme = createTheme({
  palette: {
    primary: {
      main: '#004680',
      light: '#0070c0',
      dark: '#002d54',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0080c8',
      light: '#40a9e0',
      dark: '#005a8e',
    },
    error:   { main: '#c62828', light: '#fdecea' },
    warning: { main: '#e65100', light: '#fff3e0' },
    success: { main: '#1a7a4a', light: '#e6f7ef' },
    background: {
      default: 'transparent',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a2535',
      secondary: '#667788',
    },
    divider: '#e8edf5',
  },

  typography: {
    // Instala la fuente en index.html:
    // <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    fontFamily: '"Plus Jakarta Sans", "DM Sans", "Segoe UI", sans-serif',
    h4: { fontWeight: 800, color: '#1a2535' },
    h5: { fontWeight: 700, color: '#1a2535' },
    h6: { fontWeight: 700, color: '#1a2535' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, color: '#667788' },
    body2: { color: '#667788' },
    caption: { color: '#8899aa', letterSpacing: '0.04em' },
    button: { fontWeight: 700, textTransform: 'none', letterSpacing: '0.01em' },
    overline: {
      fontWeight: 700,
      fontSize: '0.65rem',
      letterSpacing: '0.08em',
      color: '#8899aa',
    },
  },

  shape: { borderRadius: 10 },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#f4f7fc' },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 16px rgba(0,70,128,0.06)',
          border: '1px solid #e8edf5',
          borderRadius: 14,
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, textTransform: 'none', fontWeight: 700 },
        containedPrimary: {
          background: "#004680",
          '&:hover': { background: "#005aa3" },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.72rem', borderRadius: 20 },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f8fafd',
          fontWeight: 700,
          fontSize: '0.68rem',
          letterSpacing: '0.07em',
          color: '#8899aa',
          textTransform: 'uppercase',
          borderBottom: '1px solid #e8edf5',
        },
        body: {
          borderBottom: '1px solid #f4f7fc',
          padding: '14px 16px',
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background 0.15s',
          '&:hover': { backgroundColor: '#f0f6ff', cursor: 'pointer' },
          '&:last-child td': { borderBottom: 'none' },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 18 },
      },
    },

    MuiInputBase: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#c8d8e8' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#004680' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#004680' },
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1a2535',
          boxShadow: '0 2px 8px rgba(0,70,128,0.06)',
          borderBottom: '1px solid #e8edf5',
        },
      },
    },
  },
});