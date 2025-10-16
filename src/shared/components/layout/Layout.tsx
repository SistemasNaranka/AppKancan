import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/shared/components/ui/sidebar";
import { AppSidebar } from "@/shared/components/layout/app-sidebar";
import { Toolbar, Box, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // true solo en pantallas pequeñas

  return (
    <SidebarProvider>
      <Box sx={{ display: "flex" }}>
        <AppSidebar />
        <Box component="main" sx={{ flexGrow: 1 }}>
          {/* 👇 El Toolbar solo se renderiza si es móvil */}
          {isMobile && <Toolbar />}
          <Outlet />
        </Box>
      </Box>
    </SidebarProvider>
  );
}
