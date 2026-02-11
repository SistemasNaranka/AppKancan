import { useState } from "react";
import { Toolbar, IconButton, Box, Avatar } from "@mui/material";
import { ChevronLeft, ChevronRight } from "lucide-react";
import LogoBlack from "@/assets/Logo_oficial.png";

interface Props {
  open: boolean;
  toggleDrawer: () => void;
}

export const SidebarHeader = ({ open, toggleDrawer }: Props) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Toolbar
      sx={{
        display: "flex",
        flexDirection: open ? "row" : "column",
        alignItems: "center",
        justifyContent: open ? "space-between" : "center",
        px: open ? 2 : 0,
        py: open ? 1 : 1,
        height: open ? 70 : 64,
        position: "relative",
        gap: open ? 0 : 0,
        transition: "all 0.3s ease",
      }}
    >
      {/* 🔹 Logo o Avatar - Solo visible cuando está ABIERTO */}
      {open && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexGrow: 1,
            transition: "all 0.3s ease",
          }}
        >
          <Box
            component="img"
            src={LogoBlack}
            alt="Logo"
            sx={{
              height: 50,
              width: "auto",
              objectFit: "contain",
              transition: "all 0.3s ease",
            }}
          />
        </Box>
      )}

      {/* 🔹 Botón de abrir/cerrar - Colapsado */}
      {!open && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
            cursor: "pointer",
            borderRadius: 1,
            transition: "all 0.2s ease",
            bgcolor: isHovered ? "action.hover" : "transparent",
            p: 1,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={toggleDrawer}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              transform: isHovered ? "scale(1.1)" : "scale(1)",
            }}
          >
            {/* Animación: Si está en hover, muestra flecha, si no, muestra K */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: 1,
                bgcolor: isHovered ? "primary.main" : "transparent",
                color: isHovered ? "white" : "text.secondary",
                transition: "all 0.2s ease",
              }}
            >
              {isHovered ? (
                <ChevronRight size={24} />
              ) : (
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
          </Box>
        </Box>
      )}

      {/* 🔹 Botón de abrir/cerrar - ABIERTO */}
      {open && (
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
            <ChevronLeft />
          </IconButton>
        </Box>
      )}
    </Toolbar>
  );
};
