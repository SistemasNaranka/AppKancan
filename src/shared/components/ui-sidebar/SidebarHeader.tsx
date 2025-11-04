import { Toolbar, IconButton, Box, Avatar } from "@mui/material";
import { ChevronLeft, ChevronRight } from "lucide-react";
import LogoBlack from "@/assets/Logo_oficial.png";

interface Props {
  open: boolean;
  toggleDrawer: () => void;
}

export const SidebarHeader = ({ open, toggleDrawer }: Props) => (
  <Toolbar
    sx={{
      display: "flex",
      flexDirection: open ? "row" : "column", // 👈 horizontal si está abierto, vertical si cerrado
      alignItems: "center",
      justifyContent: open ? "space-between" : "space-between", // 👈 distribuye bien ambos estados
      px: open ? 2 : 0,
      py: open ? 1 : 2,
      height: open ? 70 : 120,
      position: "relative",
      gap: open ? 0 : 0.5, // 👈 más separación cuando está cerrado
      transition: "all 0.3s ease",
    }}
  >
    {/* 🔹 Logo o Avatar */}
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexGrow: open ? 1 : 0,
        transition: "all 0.3s ease",
      }}
    >
      {open ? (
        // ✅ Logo cuando está abierto
        <Box
          component="img"
          src={LogoBlack}
          alt="Logo"
          sx={{
            height: 50,
            width: "auto",
            mr: 2,
            objectFit: "contain",
            transition: "all 0.3s ease",
          }}
        />
      ) : (
        // ✅ Avatar cuadrado cuando está cerrado
        <Avatar
          variant="square"
          sx={{
            bgcolor: "primary.main",
            color: "white",
            width: 40,
            height: 40,
            fontSize: 25,
            borderRadius: 1,
            transition: "all 0.3s ease",
          }}
        >
          K
        </Avatar>
      )}
    </Box>

    {/* 🔹 Botón de abrir/cerrar */}
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <IconButton
        onClick={toggleDrawer}
        sx={{
          color: "text.secondary",
          "&:hover": { bgcolor: "action.dark" },
          transition: "all 0.3s ease",
        }}
      >
        {open ? <ChevronLeft /> : <ChevronRight />}
      </IconButton>
    </Box>
  </Toolbar>
);
