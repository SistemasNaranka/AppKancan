import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/shared/components/layout/app-sidebar";
import { Toolbar, Box, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState, useEffect } from "react";

const drawerWidth = 240;
const collapsedWidth = 64;

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(!isMobile);

  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      {!isMobile && (
        <Box
          sx={{
            width: open ? drawerWidth : collapsedWidth,
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 1201,
            transition: "width 0.5s ease",
          }}
        >
          <AppSidebar open={open} setOpen={setOpen} />
        </Box>
      )}

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: "100vh",
          overflowY: "auto",
          transition: "margin-left 0.5s ease",
          marginLeft: isMobile ? 0 : open ? `${drawerWidth}px` : `${collapsedWidth}px`,
        }}
      >
        {/* En móvil, el AppSidebar se muestra dentro del flujo (overlay controlado) */}
        {isMobile && (
          <AppSidebar open={open} setOpen={setOpen} />
        )}
        {isMobile && <Toolbar />}
        <Outlet />
      </Box>
    </Box>
  );
}
