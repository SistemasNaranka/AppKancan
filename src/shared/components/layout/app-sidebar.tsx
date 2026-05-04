import { useMemo, useState } from "react";
import {
  Drawer,
  Box,
  useMediaQuery,
  Toolbar,
  IconButton,
  Divider,
} from "@mui/material";
import Menu from '@mui/icons-material/Menu';
import { useTheme } from "@mui/material/styles";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";
import { SidebarHeader } from "@/shared/components/ui-sidebar/SidebarHeader";
import { SidebarList } from "@/shared/components/ui-sidebar/SidebarList";
import { SidebarFooter } from "@/shared/components/ui-sidebar/SidebarFooter";
import LogoBlack from "@/assets/Logo_oficial.png";
const drawerWidth = 240;
const collapsedWidth = 70;

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function AppSidebar({ open, setOpen }: Props) {
  const { isAuthenticated } = useAuth();
  const { apps, loading, area } = useApps();
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
    // Filtrar apps si el usuario es de bodega/logística
    const filteredApps = (area === 'logistica' || area === 'bodega')
      ? apps.filter(app => app.nombre === 'Curvas de Distribución')
      : apps;

    const groups: Record<string, any[]> = {};
    for (const app of filteredApps) {
      const categoria = app.categoria || "Sin categoría";
      if (!groups[categoria]) groups[categoria] = [];
      groups[categoria].push(app);
    }
    return groups;
  }, [apps, area]);

  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden", // 🔹 evita que el footer sea desplazado
      }}
    >
      {/* HEADER */}
      <SidebarHeader open={open} toggleDrawer={toggleDrawer} />
      <Divider />

      {/* LISTA con scroll independiente */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto", // 🔹 solo la lista hace scroll
          overflowX: "hidden",
        }}
      >
        <SidebarList
          open={open}
          expanded={expanded}
          groupedApps={groupedApps}
          toggleCategory={toggleCategory}
          loading={loading}
          location={location}
        />
      </Box>

      <Divider />

      {/* FOOTER fijo */}
      <Box
        sx={{
          flexShrink: 0,

          borderTop: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
        }}
      >
        <SidebarFooter open={open} />
      </Box>
    </Box>
  );

  // === MÓVIL: Drawer temporal (overlay) ===
  if (isMobile) {
    return (
      <Box sx={{ position: "relative" }}>
        {/* toolbar fijo en móvil */}
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "center",
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
          {/* Botón de menú */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              onClick={toggleDrawer}
              sx={{ position: "absolute", left: 8 }}
            >
              <Menu />
            </IconButton>
            <img
              src={LogoBlack}
              alt="logo"
              style={{
                height: "50px",
                width: "auto",

                objectFit: "contain",
                // 🔹 evita que se expanda más de lo necesario
              }}
            />
          </Box>
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
