import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Logout } from "@mui/icons-material";
import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";
interface Props {
  open: boolean;
  
}

export const SidebarFooter = ({ open }: Props) => {
  const { user , logout } = useAuth();
  const {  area } = useApps();

  const getInitials = (nombre: string) => {
    const p = nombre.split(" ");
    return (p[0][0] + (p[1]?.[0] || "")).toUpperCase();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: open ? "row" : "column", // 🔹 Cambia a columna cuando está cerrado
        alignItems: "center",
        justifyContent: open ? "space-between" : "space-between", // Mantiene separación
        px: open ? 2 : 0,
      
        m: 1,
        borderRadius: 2,
        bgcolor: "action.hover",
        transition: "all 0.3s ease",
        height: open ? "auto" : 73, // 🔹 Espacio vertical cuando está cerrado
      }}
    >
      {/* Avatar + info */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexDirection: open ? "row" : "column", // 🔹 Vertical cuando está cerrado
          gap: open ? 1 : 0.5,
        }}
      >
        <Avatar
          sx={{
            bgcolor: "secondary.main",
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

      {/* Botón logout */}
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
  );
};
