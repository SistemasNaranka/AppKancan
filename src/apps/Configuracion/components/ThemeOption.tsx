import { Box, Typography, IconButton } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
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
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: "center",
        gap: { xs: 1.5, sm: 0 },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {/* Ícono con animación sin desplazamiento */}
        <IconButton
          sx={{
            position: "relative",
            width: 40,
            height: 40,
          }}
        >
          {/* Mismo contenedor, solo cambia la rotación y opacidad */}
          <Box
            sx={{
              position: "absolute",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.4s ease-in-out",
              transform: darkMode
                ? "rotate(1deg) scale(180deg)"
                : "rotate(180deg) scale(1)",
            }}
          >
            {darkMode ? (
              <DarkModeIcon
                sx={{
                  color: "#004680",
                  fontSize: 28,
                  opacity: 1,
                  transition: "opacity 0.3s ease-in-out",
                }}
              />
            ) : (
              <LightModeIcon
                sx={{
                  color: "#f5d742",
                  fontSize: 28,
                  opacity: 1,
                  transition: "opacity 0.3s ease-in-out",
                }}
              />
            )}
          </Box>
        </IconButton>

        {/* Texto descriptivo */}
        <Box>
          <Typography
            variant="body1"
            fontWeight={600}
            sx={{ fontSize: { xs: 15, sm: 16 } }}
          >
            Tema
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {darkMode ? "Modo oscuro" : "Modo claro"}
          </Typography>
        </Box>
      </Box>

      {/* Switch que cambia el tema */}
      <ThemeSwitch darkMode={darkMode} onChange={onChange} />
    </Box>
  );
};
