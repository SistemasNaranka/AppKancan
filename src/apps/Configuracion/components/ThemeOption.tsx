import { Box, Typography } from "@mui/material";
import { Brightness4 } from "@mui/icons-material";
import { ThemeSwitch } from "@/apps/Configuracion/components/ThemeSwitch";

interface Props {
  darkMode: boolean;
  onChange: (value: boolean) => void;
}

export const ThemeOption = ({ darkMode, onChange }: Props) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Brightness4 sx={{ color: "text.secondary", fontSize: 28 }} />
        <Box>
          <Typography variant="body1" fontWeight={600}>
            Tema
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {darkMode ? "Modo oscuro" : "Modo claro"}
          </Typography>
        </Box>
      </Box>
      <ThemeSwitch darkMode={darkMode} onChange={onChange} />
    </Box>
  );
};
