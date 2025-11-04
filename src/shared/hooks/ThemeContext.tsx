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

export const AppThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // 🔹 Forzamos siempre modo claro
  const darkMode = false;

  // 🔹 Desactiva todos los efectos relacionados con dark mode
  /*
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) return JSON.parse(saved);
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "darkMode" && event.newValue !== null) {
        setDarkMode(JSON.parse(event.newValue));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);
  */

  const theme = useMemo(() => (darkMode ? darkTheme : lightTheme), [darkMode]);
  const toggleTheme = (value: boolean) => {
    /* 
    setDarkMode(value);
    localStorage.setItem("darkMode", JSON.stringify(value));  */
    // solo si el usuario cambia manualmente
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <div
          style={{
            transition: "background-color 0.6s ease, color 0.6s ease",
            minHeight: "100vh",
          }}
        >
          {children}
        </div>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
