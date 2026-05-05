export const BRAND = {
    primary: "#006ACC",
    dark: "#004680",
    light: "#B8DCFF",
    bg: "#E6F4FF",
};

export const MAIN_FONT = "'Inter', sans-serif";
export const MONO_FONT = "'Roboto Mono', 'Consolas', monospace";

export const getHeatColor = (val: number, max: number) => {
    if (val === 0) return { bg: "#e2e8f0", text: "#94a3b8", fw: 500 };
    if (val < 2) return { bg: "#fef3c7", text: "#92400e", fw: 600 };
    if (val <= 5) return { bg: "#dcfce7", text: "#166534", fw: 700 };
    if (val <= 10) return { bg: "#fca5a5", text: "#dc2626", fw: 800 };
    return { bg: "#ef4444", text: "#7f1d1d", fw: 900 };
};

export const getUserBarColor = (index: number) => {
    const colors = [
        "#006ACC", "#0284c7", "#0369a1", "#075985", "#0c4a6e",
        "#082f49", "#1e3a8a", "#1e40af", "#2563eb", "#3b82f6",
    ];
    return colors[index % colors.length];
};