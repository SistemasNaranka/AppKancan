import { createTheme } from "@mui/material/styles";

// Extender la paleta para colores personalizados
declare module "@mui/material/styles" {
  interface Palette {
    bgAlt?: string; // tu color extra
  }
  interface PaletteOptions {
    bgAlt?: string;
  }
}

const basePalette = {
  primary: {
    main: "#004680",
    light: "#117888",
    dark: "#002747",
    contrastText: "#FFFFFF",
  },
  secondary: { main: "#117888", light: "#48A9A6", contrastText: "#FFFFFF" },
  error: { main: "#88112F", light: "#B7324B", contrastText: "#FFFFFF" },
  warning: { main: "#E6A700", light: "#FFD54F", contrastText: "#333333" },
  success: { main: "#3B8E4D", light: "#6FBF73", contrastText: "#FFFFFF" },
  typography: {
    fontFamily: "'Poppins', 'Roboto', sans-serif",
    fontSize: 15,
  },
};

// Light theme
export const lightTheme = createTheme({
  palette: {
    ...basePalette,
    mode: "light",
    background: { default: "#E6E6E6", paper: "#ffffff" },
    text: { primary: "#333333", secondary: "#000000" },
    bgAlt: "#F5F5F5", // ✅ color extra para usar como fondo alternativo
  },
  typography: basePalette.typography,
});

// Dark theme
export const darkTheme = createTheme({
  palette: {
    primary: {
      main: "#008CFF",
      light: "#48A9A6",
      dark: "#004680",
      contrastText: "#FFFFFF",
    },
    secondary: { main: "#48A9A6", light: "#117888", contrastText: "#FFFFFF" },
    error: { main: "#B7324B", light: "#88112F", contrastText: "#FFFFFF" },
    warning: { main: "#FFD54F", light: "#E6A700", contrastText: "#333333" },
    success: { main: "#6FBF73", light: "#3B8E4D", contrastText: "#FFFFFF" },
    mode: "dark",
    background: { default: "#121212", paper: "#3B3B3B" },
    text: { primary: "#fff", secondary: "#B0B0B0" },
    bgAlt: "#9E9E9E", // ✅ color extra en dark mode
  },
  typography: basePalette.typography,
});
