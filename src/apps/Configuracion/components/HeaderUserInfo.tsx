import { Box, Typography, Avatar } from "@mui/material";

interface Props {
  user?: any;
  area?: string;
}

const avatarColors = [
  "#0288d1", // celeste
];

const getInitials = (nombre: string) => {
  const p = nombre.trim().split(" ");
  return (p[0]?.[0] + (p[1]?.[0] || "")).toUpperCase();
};

export const HeaderUserInfo = ({ user, area }: Props) => {
  const storageKey = `avatarColor_${user?.email ?? "default"}`;

  // 1️⃣ Buscar el color guardado (mismo que en SidebarFooter)
  let avatarColor = sessionStorage.getItem(storageKey);

  // 2️⃣ Si no hay, generar uno nuevo (solo en casos raros)
  if (!avatarColor) {
    const randomIndex = Math.floor(Math.random() * avatarColors.length);
    avatarColor = avatarColors[randomIndex];
    sessionStorage.setItem(storageKey, avatarColor);
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", p: 4, gap: 3 }}>
      <Avatar
        sx={{
          width: 80,
          height: 80,
          fontSize: 32,
          fontWeight: "bold",
          bgcolor: avatarColor,
        }}
      >
        {getInitials(`${user?.nombre ?? ""} ${user?.apellido ?? ""}`.trim())}
      </Avatar>

      <Box sx={{ flex: 1 }}>
        <Typography fontWeight="bold" variant="h6">
          {user?.nombre ?? "Usuario"}
        </Typography>
        <Typography variant="body1" color="text.secondary">
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
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {area ?? "Sin rol"}
        </Box>
      </Box>
    </Box>
  );
};
