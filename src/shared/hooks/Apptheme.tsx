// src/shared/hooks/Apptheme.tsx
import { createTheme } from "@mui/material/styles";
import "@fontsource/inter/400.css";
import "@fontsource/inter/400-italic.css";

const interTypography = {
  fontFamily: "'Inter', sans-serif",
  allVariants: {
    fontFamily: "'Inter', sans-serif",
  },
};

declare module "@mui/material/styles" {
  interface Palette {
    bgAlt?: string;
  }
  interface PaletteOptions {
    bgAlt?: string;
  }
}

// Configuración común para la posición del Snackbar
const snackbarGlobalConfig = {
  defaultProps: {
    // CAMBIA AQUÍ: vertical ('top'/'bottom') y horizontal ('left'/'center'/'right')
    anchorOrigin: { vertical: 'top', horizontal: 'right' } as const,
    autoHideDuration: 4000,
  },
};

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#006ACC", light: "#B8DCFF", dark: "#003D75", contrastText: "#FFFFFF" },
    secondary: { main: "#48A9A6", light: "#6FC7C4", dark: "#2D7E7B", contrastText: "#FFFFFF" },
    error: { main: "#E57373", light: "#EF9A9A", dark: "#B71C1C", contrastText: "#FFFFFF" },
    warning: { main: "#FFB74D", light: "#FFD54F", dark: "#E6A700", contrastText: "#1E1E1E" },
    success: { main: "#428F44", light: "#CEE9CF", dark: "#255026", contrastText: "#FFFFFF" },
    info: { main: "#4FC3F7", light: "#81D4FA", dark: "#0288D1", contrastText: "#FFFFFF" },
    background: { default: "#121212", paper: "#1E1E1E" },
    text: { primary: "#FFFFFF", secondary: "#B0BEC5" },
    divider: "#333",
    bgAlt: "#2B2B2B",
  },
  typography: { ...interTypography, fontSize: 13 },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiSnackbar: snackbarGlobalConfig, // Aplicar posición global
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#004680", light: "#E6F4FF", dark: "#002747", contrastText: "#FFFFFF" },
    secondary: { main: "#117888", light: "#48A9A6", contrastText: "#FFFFFF" },
    error: { main: "#88112F", light: "#F7BFCD", dark: "#88112F", contrastText: "#FFFFFF" },
    warning: { main: "#E6A700", light: "#FFD54F", contrastText: "#333333" },
    success: { main: "#50AF53", light: "#CEE9CF", dark: "#337035", contrastText: "#FFFFFF" },
    info: { main: "#2196F3", light: "#64B5F6", dark: "#1976D2", contrastText: "#FFFFFF" },
    background: { default: "#E6E6E6", paper: "#FFFFFF" },
    text: { primary: "#333333", secondary: "#555555" },
    divider: "#E0E0E0",
    bgAlt: "#F5F5F5",
  },
  typography: { ...interTypography, fontSize: 13 },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiSnackbar: snackbarGlobalConfig, // Aplicar posición global
  },
});