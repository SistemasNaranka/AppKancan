import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Tooltip,
} from "@mui/material";
import { Home, ExpandLess, ExpandMore } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { getItemStyles } from "./styles";
import { DynamicIcon } from "@/shared/utils/DynamicIcon";

interface Props {
  open: boolean;
  expanded: Record<string, boolean>;
  groupedApps: Record<string, any[]>;
  toggleCategory: (cat: string) => void;
  loading: boolean;
  location: any;
}

export const SidebarList = ({
  open,
  expanded,
  groupedApps,
  toggleCategory,
  loading,
  location,
}: Props) => {
  return (
    <List
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: open ? "stretch" : "center", // 👈 centra íconos en modo cerrado
        justifyContent: "flex-start",
        px: open ? 1 : 0,
      }}
    >
      {/* INICIO */}
      <Tooltip title={!open ? "Inicio" : ""} placement="right">
        <ListItemButton
          component={Link}
          to="/home"
          selected={location.pathname === "/home"}
          sx={{
            ...getItemStyles(location.pathname === "/home", open),
            justifyContent: open ? "initial" : "center", // 👈 centra horizontalmente
            px: open ? 2 : 1,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: open ? 2 : 0,
              justifyContent: "center", // 👈 centra el ícono
            }}
          >
            <Home color={location.pathname === "/home" ? "primary" : "inherit"} />
          </ListItemIcon>
          {open && <ListItemText primary="Inicio" />}
        </ListItemButton>
      </Tooltip>

      {/* CATEGORÍAS */}
      {!loading &&
        Object.entries(groupedApps).map(([categoria, apps]) => (
          <Box key={categoria} sx={{ width: open ? "auto" : "100%" }}>
            <Tooltip title={!open ? categoria : ""} placement="right">
              <ListItemButton
                onClick={() => toggleCategory(categoria)}
                sx={{
                  ...getItemStyles(false, open),
                  justifyContent: open ? "initial" : "center",
                  px: open ? 2 : 1,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 2 : 0,
                    justifyContent: "center",
                  }}
                >
                  <DynamicIcon iconName={apps[0]?.icono_categoria} />
                </ListItemIcon>

                {open && (
                  <>
                    <ListItemText primary={categoria} />
                    {expanded[categoria] ? <ExpandLess /> : <ExpandMore />}
                  </>
                )}
              </ListItemButton>
            </Tooltip>

            <Collapse in={expanded[categoria]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {apps.map((app) => (
                  <Tooltip key={app.id} title={!open ? app.nombre : ""} placement="right">
                    <ListItemButton
                      component={Link}
                      to={app.ruta}
                      selected={location.pathname === app.ruta}
                      sx={{
                        ...getItemStyles(location.pathname === app.ruta, open, 1),
                        justifyContent: open ? "initial" : "center",
                        px: open ? 4 : 1,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: open ? 2 : 0,
                          justifyContent: "center",
                        }}
                      >
                        <DynamicIcon iconName={app.icono_app} />
                      </ListItemIcon>
                      {open && <ListItemText primary={app.nombre} />}
                    </ListItemButton>
                  </Tooltip>
                ))}
              </List>
            </Collapse>
          </Box>
        ))}
    </List>
  );
};
