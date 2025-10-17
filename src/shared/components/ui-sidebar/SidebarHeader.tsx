import { Toolbar, IconButton } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

interface Props {
  open: boolean;
  toggleDrawer: () => void;
}

export const SidebarHeader = ({ open, toggleDrawer }: Props) => (
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
);
