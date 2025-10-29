import { useState, useMemo } from "react";
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import { Logout, Settings } from "@mui/icons-material";
import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";
import { ConfigPanel } from "@/apps/Configuracion/pages/ConfigPanel";

// 🎨 Paleta clara
const avatarColorsLight = [
  "#1976d2", // azul
  "#9c27b0", // morado
  "#2e7d32", // verde
  "#f57c00", // naranja
  "#d32f2f", // rojo
  "#0288d1", // celeste
  "#7b1fa2", // violeta
  "#00897b", // verde azulado
  "#c2185b", // rosa oscuro
  "#5d4037", // marrón
];

// 🌙 Paleta oscura (más suaves para contraste sobre fondo oscuro)
const avatarColorsDark = [
  "#64b5f6", // azul claro
  "#ba68c8", // morado claro
  "#81c784", // verde suave
  "#ffb74d", // naranja suave
  "#e57373", // rojo suave
  "#4dd0e1", // celeste
  "#9575cd", // violeta
  "#4db6ac", // verde azulado claro
  "#f06292", // rosa brillante
  "#8d6e63", // marrón claro
];

interface Props {
  open: boolean;
}

export const SidebarFooter = ({ open }: Props) => {
  const { user, logout } = useAuth();
  const { area } = useApps();
  const [openConfig, setOpenConfig] = useState(false);
  const theme = useTheme(); // 🎨 Detecta si es dark o light

  const avatarColor = useMemo(() => {
    const palette =
      theme.palette.mode === "dark" ? avatarColorsDark : avatarColorsLight;
    const storageKey = `avatarColor_${user?.email ?? "default"}_${
      theme.palette.mode
    }`;

    // ✅ Si ya hay color guardado para ese tema → úsalo
    const storedColor = sessionStorage.getItem(storageKey);
    if (storedColor) return storedColor;

    // 🔄 Si no, genera uno nuevo
    const randomIndex = Math.floor(Math.random() * palette.length);
    const color = palette[randomIndex];
    sessionStorage.setItem(storageKey, color);
    return color;
  }, [user, theme.palette.mode]);

  const getInitials = (nombre: string) => {
    const p = nombre.trim().split(" ");
    return (p[0]?.[0] + (p[1]?.[0] || "")).toUpperCase();
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: open ? "row" : "column",
          alignItems: "center",
          justifyContent: "space-between",
          m: 1,
          borderRadius: 2,
          bgcolor: "action.hover",
          transition: "all 0.3s ease",
          gap: open ? 0 : 1.5,
        }}
      >
        {/* Avatar e info */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mt: open ? 0 : 1,
            flexDirection: open ? "row" : "column",
            gap: open ? 1 : 0.5,
          }}
        >
          <Avatar
            sx={{
              bgcolor: avatarColor,
              width: 36,
              height: 36,
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            {getInitials(
              `${user?.nombre ?? ""} ${user?.apellido ?? ""}`.trim()
            )}
          </Avatar>

          {open && (
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {`${user?.nombre ?? ""} ${user?.apellido ?? ""}`.trim()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {area ?? "Sin rol"}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Botones */}
        <Box
          sx={{
            display: "flex",
            flexDirection: open ? "row" : "column",
            alignItems: "center",
            gap: open ? 0 : 1.2,
          }}
        >
          <Tooltip title="Configuración">
            <IconButton
              size="small"
              onClick={() => setOpenConfig(true)}
              sx={{
                color: "text.secondary",
                "&:hover": { color: "primary.main", bgcolor: "transparent" },
              }}
            >
              <Settings fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Cerrar sesión">
            <IconButton
              size="small"
              onClick={logout}
              sx={{
                color: "text.secondary",
                "&:hover": { color: "error.main", bgcolor: "transparent" },
              }}
            >
              <Logout fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Modal de configuración */}
      <ConfigPanel
        open={openConfig}
        onClose={() => setOpenConfig(false)}
        user={user}
        area={area ?? undefined}
      />
    </>
  );
};
