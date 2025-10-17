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
import { DynamicIcon } from "./DynamicIcon";

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
    <List sx={{ flexGrow: 1 }}>
      {/* INICIO */}
      <Tooltip title={!open ? "Inicio" : ""} placement="right">
        <ListItemButton
          component={Link}
          to="/home"
          selected={location.pathname === "/home"}
          sx={getItemStyles(location.pathname === "/home", open)}
        >
          <ListItemIcon>
            <Home />
          </ListItemIcon>
          <ListItemText primary="Inicio" />
        </ListItemButton>
      </Tooltip>

      {/* CATEGORÍAS */}
      {!loading &&
        Object.entries(groupedApps).map(([categoria, apps]) => (
          <Box key={categoria}>
            <ListItemButton onClick={() => toggleCategory(categoria)} sx={getItemStyles(false, open)}>
              <ListItemIcon>
                <DynamicIcon iconName={apps[0]?.icono_categoria} />
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
                {apps.map((app) => (
                  <ListItemButton
                    key={app.id}
                    component={Link}
                    to={app.ruta}
                    selected={location.pathname === app.ruta}
                    sx={getItemStyles(location.pathname === app.ruta, open, 1)}
                  >
                    <ListItemIcon>
                        <DynamicIcon iconName={app.icono_app} />
                    </ListItemIcon>
                    <ListItemText primary={app.nombre} />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </Box>
        ))}
    </List>
  );
};
