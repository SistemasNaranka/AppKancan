import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Popover,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Fade,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DateRangeIcon from "@mui/icons-material/DateRange";
import ViewListIcon from "@mui/icons-material/ViewList";
import { useTourContext, TabReservas } from "./TourContext";

interface FloatingHelpButtonProps {
  onStartTour?: (tab: TabReservas) => void;
  activeTab?: TabReservas;
  onTabChange?: (tab: TabReservas) => void;
}

const FloatingHelpButton: React.FC<FloatingHelpButtonProps> = ({
  onStartTour,
  activeTab: externalActiveTab,
  onTabChange: externalOnTabChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { setActiveTab, requestTourForTab } = useTourContext();

  // Use external tab state if provided, otherwise use context
  const currentTab = externalActiveTab;
  const handleTabChange = externalOnTabChange || setActiveTab;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Toggle menu: if already open, close it; otherwise open it
    if (anchorEl) {
      setAnchorEl(null);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleTourSelect = async (tab: TabReservas) => {
    // Close the menu
    setAnchorEl(null);

    try {
      // Check if we need to navigate to a different tab
      const needsNavigation = currentTab && currentTab !== tab;

      if (needsNavigation && handleTabChange) {
        // Navigate to the target tab first
        handleTabChange(tab);

        // Wait for tab transition animation (300ms matches MUI TabContainer animation)
        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      // Request tour for the target tab
      requestTourForTab(tab);

      // Call optional callback
      if (onStartTour) {
        onStartTour(tab);
      }
    } catch (error) {
      console.error("Error during tour navigation:", error);
      // Fallback: just request tour without tab navigation
      requestTourForTab(tab);
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? "help-menu" : undefined;

  const tourOptions: { id: TabReservas; label: string; icon: React.ReactNode }[] = [
    {
      id: "Reserva",
      label: "Tutorial de Reservas",
      icon: <DateRangeIcon />,
    },
    {
      id: "mis",
      label: "Tutorial de Mis Reservas",
      icon: <ViewListIcon />,
    },
    {
      id: "calendario",
      label: "Tutorial de Calendario",
      icon: <CalendarMonthIcon />,
    },
  ];

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 1,
      }}
    >
      {/* Menu Popover */}
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            minWidth: 220,
          },
        }}
        TransitionComponent={Fade}
      >
        <Box sx={{ p: 1.5, borderBottom: "1px solid #e8e8e8" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#004680" }}>
            Ayudas Disponibles
          </Typography>
        </Box>
        <List sx={{ p: 1 }}>
          {tourOptions.map((option) => (
            <ListItemButton
              key={option.id}
              onClick={() => handleTourSelect(option.id)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "#757575" }}>
                {option.icon}
              </ListItemIcon>
              <ListItemText
                primary={option.label}
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#424242",
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Popover>

      {/* Main Help Button - Subtle */}
      <Button
        ref={buttonRef}
        onClick={handleClick}
        variant="contained"
        startIcon={<HelpOutlineIcon sx={{ fontSize: 18 }} />}
        sx={{
          backgroundColor: "rgba(0, 0, 0, 0.06)",
          color: "#004680",
          borderRadius: 1.5,
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.8125rem",
          px: 2,
          py: 0.75,
          boxShadow: "none",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          opacity: 0.65,
          transition: "all 0.2s ease-in-out",
          backdropFilter: "blur(4px)",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            color: "#004680",
            boxShadow: "none",
            opacity: 1,
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "translateY(0)",
            backgroundColor: "rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        Ayuda
      </Button>
    </Box>
  );
};

export default FloatingHelpButton;
