import { Box, Switch } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

interface Props {
  darkMode: boolean;
  onChange: (value: boolean) => void;
}

export const ThemeSwitch = ({ darkMode, onChange }: Props) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        transition: "color 0.4s ease-in-out",
      }}
    >
      {/* Ícono modo claro */}
      <LightModeIcon
        sx={{
          color: darkMode ? "grey.500" : "warning.main",
          fontSize: { xs: 20, sm: 22 },
          transition: "color 0.4s ease-in-out, transform 0.4s ease-in-out",
          transform: darkMode ? "scale(0.9)" : "scale(1.1)",
        }}
      />

      {/* Switch con animación */}
      <Switch
        checked={darkMode}
        onChange={(e) => onChange(e.target.checked)}
        color="primary"
        sx={{
          transform: { xs: "scale(0.9)", sm: "scale(1)" },
          transition:
            "background-color 0.3s ease-in-out, transform 0.3s ease-in-out",
          "& .MuiSwitch-thumb": {
            bgcolor: darkMode ? "primary.main" : "warning.main",
            transition:
              "background-color 0.3s ease-in-out, transform 0.3s ease",
          },
          "& .MuiSwitch-track": {
            bgcolor: darkMode ? "grey.600" : "grey.400",
            opacity: 1,
            transition: "background-color 0.3s ease-in-out, opacity 0.3s ease",
          },
          "& .Mui-checked .MuiSwitch-thumb": {
            transform: "scale(1.05)",
          },
        }}
      />

      {/* Ícono modo oscuro */}
      <DarkModeIcon
        sx={{
          color: darkMode ? "primary.main" : "grey.500",
          fontSize: { xs: 20, sm: 22 },
          transition: "color 0.4s ease-in-out, transform 0.4s ease-in-out",
          transform: darkMode ? "scale(1.1)" : "scale(0.9)",
        }}
      />
    </Box>
  );
};
