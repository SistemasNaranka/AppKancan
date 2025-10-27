import { createTheme } from "@mui/material/styles";

// 🧩 Extiende la paleta para agregar colores personalizados (opcional)
declare module "@mui/material/styles" {
  interface Palette {
    bgAlt?: string;
  }
  interface PaletteOptions {
    bgAlt?: string;
  }
}

// 🕶️ Tema Oscuro
export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#008CFF",
      light: "#48A9A6",
      dark: "#004680",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#48A9A6",
      light: "#117888",
      contrastText: "#FFFFFF",
    },
    error: {
      main: "#B7324B",
      light: "#88112F",
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#FFD54F",
      light: "#E6A700",
      contrastText: "#333333",
    },
    success: {
      main: "#6FBF73",
      light: "#3B8E4D",
      contrastText: "#FFFFFF",
    },
    info: {
      main: "#2196F3",
      light: "#64B5F6",
      dark: "#1976D2",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#121212",
      paper: "#2A2A2A",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#B0B0B0",
    },
    divider: "#444",
    bgAlt: "#3B3B3B", // fondo alternativo para tarjetas o secciones
  },
  typography: {
    fontFamily: "'Poppins', 'Roboto', sans-serif",
    fontSize: 15,
  },

  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});

// ☀️ Tema Claro
export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#004680",
      light: "#E6F4FF",
      dark: "#002747",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#117888",
      light: "#48A9A6",
      contrastText: "#FFFFFF",
    },
    error: {
      main: "#88112F",
      light: "#F7BFCD",
      dark: "#88112F",
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#E6A700",
      light: "#FFD54F",
      contrastText: "#333333",
    },
    success: {
      main: "#3B8E4D",
      light: "#6FBF73",
      contrastText: "#FFFFFF",
    },
    info: {
      main: "#2196F3",
      light: "#64B5F6",
      dark: "#1976D2",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#E6E6E6",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#333333",

      secondary: "#555555",
    },
    divider: "#E0E0E0",
    bgAlt: "#F5F5F5", // fondo alternativo para tarjetas o secciones
  },
  typography: {
    fontFamily: "'Poppins', 'Roboto', sans-serif",
    fontSize: 15,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});
