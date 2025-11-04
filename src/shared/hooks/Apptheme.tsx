import { createTheme } from "@mui/material/styles";
// removed generic fontsource import because TypeScript lacks module declarations; keep explicit css imports
import "@fontsource/inter/400.css"; // Specify weight
import "@fontsource/inter/400-italic.css"; // Specify weight and style

const interTypography = {
  fontFamily: "'Inter', sans-serif",
  allVariants: {
    fontFamily: "'Inter', sans-serif",
  },
};

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
      main: "#006ACC", // Azul principal brillante (resalta bien en fondo oscuro)
      light: "#B8DCFF", // Azul claro para hover o resaltes
      dark: "#003D75", // Azul más profundo
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#48A9A6", // Verde azulado (igual que el claro, pero resalta sobre fondo oscuro)
      light: "#6FC7C4",
      dark: "#2D7E7B",
      contrastText: "#FFFFFF",
    },
    error: {
      main: "#E57373", // Rojo claro (más legible en dark)
      light: "#EF9A9A",
      dark: "#B71C1C",
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#FFB74D", // Ámbar suave
      light: "#FFD54F",
      dark: "#E6A700",
      contrastText: "#1E1E1E",
    },
    success: {
      main: "#428F44", // Verde suave
      light: "#CEE9CF",
      dark: "#255026",
      contrastText: "#FFFFFF",
    },
    info: {
      main: "#4FC3F7", // Azul claro (resalta sin saturar)
      light: "#81D4FA",
      dark: "#0288D1",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#121212", // Fondo general
      paper: "#1E1E1E", // Superficies elevadas (tarjetas, paneles)
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#B0BEC5", // Gris azulado suave
    },
    divider: "#333",
    bgAlt: "#2B2B2B", // Fondo alternativo para secciones o áreas intermedias
  },
  typography: {
    ...interTypography,
    fontSize: 13,
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
      main: "#50AF53", // Verde suave
      light: "#CEE9CF",
      dark: "#337035",
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
    ...interTypography,
    fontSize: 13,
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
