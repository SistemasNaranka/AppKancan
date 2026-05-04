import React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/OutlinedInput";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import SearchIcon from "@mui/icons-material/Search";
import NotificationBell from "./NotificationBell";
import { useContractContext } from "../contexts/ContractContext";

// ─────────────────────────────────────────────────────────────────────────────
// TopBar
// ─────────────────────────────────────────────────────────────────────────────

const TopBar: React.FC = () => {
  const { filters, setFilter } = useContractContext();

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar
        sx={{ px: { xs: 2, sm: 3 }, gap: 2, minHeight: "64px !important" }}
      >
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mr: 2 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AssignmentOutlinedIcon sx={{ color: "#fff", fontSize: 20 }} />
          </Box>
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ lineHeight: 1.1, color: "#004680", fontWeight: "bold" }}
            >
              Gestión de Prórrogas
            </Typography>
          </Box>

          <Box />
        </Box>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Search */}
        <OutlinedInput
          value={filters.search}
          onChange={(e) => setFilter({ search: e.target.value })}
          placeholder="Buscar contratos, empleados…"
          size="small"
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
            </InputAdornment>
          }
          sx={{
            width: { xs: 160, sm: 240 },
            bgcolor: "background.default",
            borderRadius: 2.5,
            "& fieldset": { borderColor: "divider" },
            fontSize: "0.85rem",
          }}
        />

        {/* Notifications */}
          <span>
            <NotificationBell />
          </span>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;