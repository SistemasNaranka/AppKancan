import { Box, Typography, Avatar, useTheme } from "@mui/material";
import { useMemo } from "react";

interface Props {
  user?: any;
  area?: string;
}

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

// 🌙 Paleta oscura
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

const getInitials = (nombre: string) => {
  const p = nombre.trim().split(" ");
  return (p[0]?.[0] + (p[1]?.[0] || "")).toUpperCase();
};

export const HeaderUserInfo = ({ user, area }: Props) => {
  const theme = useTheme();

  // 🎨 Reutiliza el mismo sistema de color que SidebarFooter
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

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: "center",
        textAlign: { xs: "center", sm: "left" },
        p: { xs: 3, sm: 4 },
        gap: { xs: 2, sm: 3 },
      }}
    >
      <Avatar
        sx={{
          width: { xs: 64, sm: 80 },
          height: { xs: 64, sm: 80 },
          fontSize: { xs: 24, sm: 32 },
          fontWeight: "bold",
          bgcolor: avatarColor,
        }}
      >
        {getInitials(`${user?.nombre ?? ""} ${user?.apellido ?? ""}`.trim())}
      </Avatar>

      <Box sx={{ flex: 1 }}>
        <Typography
          fontWeight="bold"
          variant="h6"
          sx={{ fontSize: { xs: 20, sm: 20 } }}
        >
          {user?.nombre ?? "Usuario"}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            wordBreak: "break-all",
            fontSize: { xs: 15, sm: 15 },
          }}
        >
          {user?.email ?? "usuario@kancan.com"}
        </Typography>
        <Box
          sx={{
            bgcolor: "action.selected",
            color: "text.secondary",
            borderRadius: 1.5,
            px: 1.5,
            py: 0.5,
            mt: 1,
            display: "inline-block",
            fontSize: { xs: 12, sm: 13 },
            fontWeight: 500,
          }}
        >
          {area ?? "Sin rol"}
        </Box>
      </Box>
    </Box>
  );
};
