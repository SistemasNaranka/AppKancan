import { useState, useMemo } from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Box,
  Toolbar,
  Collapse,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import {
  Home,
  Inventory2,
  Logout,
  Menu,
  ChevronLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
  Folder,
} from "@mui/icons-material";
import { Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";
import { useTheme } from "@mui/material/styles";

const drawerWidth = 240;
const collapsedWidth = 64;

export function AppSidebar() {
  const { isAuthenticated, logout } = useAuth();
  const { apps, loading } = useApps();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [open, setOpen] = useState(!isMobile);
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

  /** === ESTILOS BASE Y FUNCIONALIDAD === **/
  const getItemStyles = (selected: boolean, level = 0) => ({
    borderRadius: 2,
    mx: 1,
    my: 0.5,
    pl: open ? 2 + level * 2 : 0,
    justifyContent: open ? "flex-start" : "center",
    transition: "all 0.2s ease-in-out",
    color: selected ? theme.palette.primary.main : theme.palette.text.primary,
    backgroundColor: selected ? `${theme.palette.primary.main}22` : "transparent",
    "& .MuiListItemIcon-root": {
      minWidth: 0,
      mr: open ? 1 : 0,
      display: "flex",
      justifyContent: "center",
      color: selected ? theme.palette.primary.main : theme.palette.text.primary,
      width: open ? "auto" : "100%",
    },
    "& .MuiListItemText-root": {
      display: open ? "block" : "none",
    },
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
      "& .MuiListItemIcon-root, & .MuiListItemText-primary": {
        color: theme.palette.primary.main,
      },
    },
  });

  /** === CONTENIDO DEL SIDEBAR === **/
  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* HEADER */}
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: open ? "space-between" : "center",
          alignItems: "center",
        }}
      >
        {open && <span style={{ fontWeight: "bold" }}>App Kancan</span>}
        <IconButton onClick={toggleDrawer}>
          {open ? <ChevronLeft /> : <ChevronRight />}
        </IconButton>
      </Toolbar>

      <Divider />

      {/* MENÚ PRINCIPAL */}
      <List sx={{ flexGrow: 1 }}>
        {/* === INICIO === */}
        <Tooltip title={!open ? "Inicio" : ""} placement="right">
          <ListItemButton
            component={Link}
            to="/home"
            selected={location.pathname === "/home"}
            sx={getItemStyles(location.pathname === "/home")}
          >
            <ListItemIcon>
              <Home />
            </ListItemIcon>
            <ListItemText primary="Inicio" />
          </ListItemButton>
        </Tooltip>

        <Divider sx={{ my: 1 }} />

        {/* === CATEGORÍAS === */}
        {!loading &&
          Object.entries(groupedApps).map(([categoria, appsCat]) => (
            <Box key={categoria}>
              <ListItemButton onClick={() => toggleCategory(categoria)} sx={getItemStyles(false)}>
                <ListItemIcon>
                  <Folder />
                </ListItemIcon>
                {open && (
                  <>
                    <ListItemText primary={categoria} />
                    {expanded[categoria] ? <ExpandLess /> : <ExpandMore />}
                  </>
                )}
              </ListItemButton>

              <Collapse in={expanded[categoria]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {appsCat.map((app) => (
                    <ListItemButton
                      key={app.id}
                      component={Link}
                      to={app.ruta}
                      selected={location.pathname === app.ruta}
                      sx={getItemStyles(location.pathname === app.ruta, 1)} // nivel 1 = hijo
                    >
                      <ListItemIcon>
                        <Inventory2 />
                      </ListItemIcon>
                      <ListItemText primary={app.nombre} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </Box>
          ))}
      </List>

      <Divider />

      {/* === FOOTER === */}
      <List sx={{ pb: 1 }}>
        <Tooltip title={!open ? "Cerrar sesión" : ""} placement="right">
          <ListItemButton onClick={logout} sx={getItemStyles(false)}>
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="Cerrar sesión" />
          </ListItemButton>
        </Tooltip>
      </List>
    </Box>
  );

  /** === VERSION MÓVIL === **/
  if (isMobile) {
    return (
      <Box sx={{ position: "relative" }}>
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

  /** === VERSION ESCRITORIO === **/
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
            duration: theme.transitions.duration.standard,
          }),
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
