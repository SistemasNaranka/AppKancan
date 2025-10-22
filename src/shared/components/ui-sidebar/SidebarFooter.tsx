import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Logout, Settings } from "@mui/icons-material";
import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";
import { useState, useMemo } from "react";
import { ConfigPanel } from "@/apps/Configuracion/pages/ConfigPanel";

// 🎨 Paleta de colores amigables
const avatarColors = [
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

interface Props {
  open: boolean;
}

export const SidebarFooter = ({ open }: Props) => {
  const { user, logout } = useAuth();
  const { area } = useApps();
  const [openConfig, setOpenConfig] = useState(false);

  // 🌀 Mantener el color durante toda la sesión
  const avatarColor = useMemo(() => {
    const storageKey = `avatarColor_${user?.email ?? "default"}`;

    // 1️⃣ Verificar si ya hay un color guardado en sessionStorage
    const storedColor = sessionStorage.getItem(storageKey);
    if (storedColor) return storedColor;

    // 2️⃣ Si no hay, generar uno nuevo aleatorio
    const randomIndex = Math.floor(Math.random() * avatarColors.length);
    const color = avatarColors[randomIndex];

    // 3️⃣ Guardar en sessionStorage
    sessionStorage.setItem(storageKey, color);

    return color;
  }, [user]);

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
            mt: open ? 0 :1,
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
            {getInitials(`${user?.nombre ?? ""} ${user?.apellido ?? ""}`.trim())}
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
