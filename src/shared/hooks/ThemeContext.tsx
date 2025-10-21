import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { lightTheme, darkTheme } from "@/shared/hooks/Apptheme";

interface ThemeContextType {
  darkMode: boolean;
  toggleTheme: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleTheme: () => {},
});

export const useAppTheme = () => useContext(ThemeContext);

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Primero intenta leer de localStorage
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) return JSON.parse(saved);

    // Si no hay valor guardado, usar preferencia del sistema
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Cambiar clase del body
  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    // Solo sincronizamos localStorage si el usuario cambia manualmente
    // no sobrescribimos si queremos respetar la preferencia del sistema
  }, [darkMode]);

  // Escuchar cambios en localStorage desde otras pestañas
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "darkMode" && event.newValue !== null) {
        setDarkMode(JSON.parse(event.newValue));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Escuchar cambios en la preferencia del sistema en tiempo real
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const theme = useMemo(() => (darkMode ? darkTheme : lightTheme), [darkMode]);
  const toggleTheme = (value: boolean) => {
    setDarkMode(value);
    localStorage.setItem("darkMode", JSON.stringify(value)); // solo si el usuario cambia manualmente
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};
