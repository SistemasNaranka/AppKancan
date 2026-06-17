import { Box, Typography, Avatar, useTheme } from "@mui/material";
import { useMemo } from "react";

interface Props {
  user?: any;
  area?: string;
}

// 🎨 Paleta clara
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

// 🌙 Paleta oscura
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

const getInitials = (nombre: string) => {
  const p = nombre.trim().split(" ");
  return (p[0]?.[0] + (p[1]?.[0] || "")).toUpperCase();
};

export const HeaderUserInfo = ({ user, area }: Props) => {
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
