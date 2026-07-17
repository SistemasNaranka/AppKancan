import { useState, useMemo } from "react";
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import Logout from '@mui/icons-material/Logout';
import Settings from '@mui/icons-material/Settings';
import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";
import { ConfigPanel } from "@/apps/Configuracion/pages/ConfigPanel";

const avatarColorsLight = [
  "#1976d2", 
  "#9c27b0", 
  "#2e7d32",
  "#f57c00",
  "#d32f2f",
  "#0288d1",
  "#7b1fa2",
  "#00897b",
  "#c2185b",
  "#5d4037",
];

const avatarColorsDark = [
  "#64b5f6",
  "#ba68c8",
  "#81c784",
  "#ffb74d",
  "#e57373",
  "#4dd0e1",
  "#9575cd",
  "#4db6ac",
  "#f06292",
  "#8d6e63",
];

interface Props {
  open: boolean;
}

export const SidebarFooter = ({ open }: Props) => {
  const { user, logout } = useAuth();
  const { area } = useApps();
  const [openConfig, setOpenConfig] = useState(false);
  const theme = useTheme();

  const avatarColor = useMemo(() => {
    const palette =
      theme.palette.mode === "dark" ? avatarColorsDark : avatarColorsLight;
    const storageKey = `avatarColor_${user?.email ?? "default"}_${
      theme.palette.mode
    }`;

    const storedColor = sessionStorage.getItem(storageKey);
    if (storedColor) return storedColor;

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
              `${user?.nombre ?? ""} ${user?.apellido ?? ""}`.trim(),
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

      <ConfigPanel
        open={openConfig}
        onClose={() => setOpenConfig(false)}
        user={user}
        area={area ?? undefined}
      />
    </>
  );
};
