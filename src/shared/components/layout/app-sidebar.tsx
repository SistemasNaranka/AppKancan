import { useMemo, useState } from "react";
import { Drawer, Box, useMediaQuery, Toolbar, IconButton, Divider } from "@mui/material";
import { Menu } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";

import { SidebarHeader } from "@/shared/components/ui-sidebar/SidebarHeader";
import { SidebarList } from "@/shared/components/ui-sidebar/SidebarList";
import { SidebarFooter } from "@/shared/components/ui-sidebar/SidebarFooter";

const drawerWidth = 240;
const collapsedWidth = 64;

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function AppSidebar({ open, setOpen }: Props) {
  const { isAuthenticated } = useAuth();
  const { apps, loading } = useApps();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();

  // Estado local solo para expandir categorías del menú (NO controla si drawer está abierto)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!isAuthenticated) return <Navigate to="/login" />;

  const toggleDrawer = () => setOpen(!open);
  const toggleCategory = (cat: string) =>
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));

  // Agrupar apps por categoría
  const groupedApps = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const app of apps) {
      const categoria = app.categoria || "Sin categoría";
      if (!groups[categoria]) groups[categoria] = [];
      groups[categoria].push(app);
    }
    return groups;
  }, [apps]);

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <SidebarHeader open={open} toggleDrawer={toggleDrawer} />
      <Divider />
      <SidebarList
        open={open}
        expanded={expanded}
        groupedApps={groupedApps}
        toggleCategory={toggleCategory}
        loading={loading}
        location={location}
      />
      <Divider />
      <SidebarFooter open={open} />
    </Box>
  );

  // === MÓVIL: Drawer temporal (overlay) ===
  if (isMobile) {
    return (
      <Box sx={{ position: "relative" }}>
        {/* toolbar que está fijo en móvil - el layout ya añade espacio con <Toolbar/> */}
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            background: "white",
            zIndex: 1200,
            height: "64px",
          }}
        >
          <span style={{ fontWeight: "bold", marginLeft: 8 }}>App Kancan</span>
          <IconButton onClick={toggleDrawer}>
            <Menu />
          </IconButton>
        </Toolbar>

        <Box sx={{ height: "64px" }} />

        <Drawer
          variant="temporary"
          open={open}
          onClose={toggleDrawer}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": { width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>
    );
  }

  // === DESKTOP: Drawer permanente con ancho animado ===
  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? drawerWidth : collapsedWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: open ? drawerWidth : collapsedWidth,
          overflowX: "hidden",
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: 300,
          }),
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
