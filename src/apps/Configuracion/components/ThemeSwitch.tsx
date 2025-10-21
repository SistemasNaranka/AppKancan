import { Box, Switch } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

interface Props {
  darkMode: boolean;
  onChange: (value: boolean) => void;
}

export const ThemeSwitch = ({ darkMode, onChange }: Props) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <LightModeIcon
        sx={{
          color: darkMode ? "grey.500" : "warning.main",
          fontSize: 22,
        }}
      />
      <Switch
        checked={darkMode}
        onChange={(e) => onChange(e.target.checked)}
        color="primary"
        sx={{
          "& .MuiSwitch-thumb": {
            bgcolor: darkMode ? "primary.main" : "warning.main",
          },
          "& .MuiSwitch-track": {
            bgcolor: darkMode ? "grey.600" : "grey.400",
          },
        }}
      />
      <DarkModeIcon
        sx={{
          color: darkMode ? "primary.main" : "grey.500",
          fontSize: 22,
        }}
      />
    </Box>
  );
};
