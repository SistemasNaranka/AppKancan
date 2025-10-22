import { Box, Typography, Avatar } from "@mui/material";

interface Props {
  user?: any;
  area?: string;
}

const avatarColors = ["#0288d1"];

const getInitials = (nombre: string) => {
  const p = nombre.trim().split(" ");
  return (p[0]?.[0] + (p[1]?.[0] || "")).toUpperCase();
};

export const HeaderUserInfo = ({ user, area }: Props) => {
  const storageKey = `avatarColor_${user?.email ?? "default"}`;
  let avatarColor = sessionStorage.getItem(storageKey);

  if (!avatarColor) {
    const randomIndex = Math.floor(Math.random() * avatarColors.length);
    avatarColor = avatarColors[randomIndex];
    sessionStorage.setItem(storageKey, avatarColor);
  }

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
            wordBreak: "break-all", // evita desbordes
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
