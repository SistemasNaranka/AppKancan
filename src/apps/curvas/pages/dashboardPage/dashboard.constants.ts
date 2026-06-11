export const MAIN_FONT = "'Inter', sans-serif";
export const MONO_FONT = "'Roboto Mono', 'Consolas', monospace";

export const BRAND = {
  primary: "#006ACC",
  dark: "#004680",
  light: "#B8DCFF",
  bg: "#E6F4FF",
  text: "#1e293b",
  textLight: "#64748b",
};

export const getTodayStr = () => new Date().toISOString().split("T")[0];
