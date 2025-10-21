import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    bgAlt?: string;
  }
  interface PaletteOptions {
    bgAlt?: string;
  }
}

// 🎨 Paleta específica para el login
export const loginTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#797979", // 👈 gris neutro principal
      light: "#A0A0A0",
      dark: "#5A5A5A",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#004680", // azul acento
      light: "#117888",
      dark: "#002747",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F2F2F2",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#303030",
      secondary: "#666666",
    },
    error: { main: "#B7324B", contrastText: "#FFFFFF" },
    warning: { main: "#E6A700", contrastText: "#333333" },
    success: { main: "#3B8E4D", contrastText: "#FFFFFF" },
    bgAlt: "#EAEAEA", // fondo alternativo
  },
  typography: {
    fontFamily: "'Poppins', 'Roboto', sans-serif",
    fontSize: 15,
  },
});
