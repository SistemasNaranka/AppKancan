/**
 * Botón flotante de ayuda para iniciar tours interactivos
 * Módulo de Contabilización de Facturas
 */

import React from "react";
import { Button } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useTourContext } from "./TourContext";

interface FloatingHelpButtonProps {
  /** Ocultar el botón cuando hay una notificación mostrando */
  hideWhenNotification?: boolean;
  /** Estado de si hay una notificación mostrando */
  notificationOpen?: boolean;
}

export const FloatingHelpButton: React.FC<FloatingHelpButtonProps> = ({
  hideWhenNotification = false,
  notificationOpen = false,
}) => {
  const { startTour, isTourRunning } = useTourContext();

  // Ocultar cuando hay una notificación mostrando y la prop está habilitada
  const shouldHide = hideWhenNotification && notificationOpen;

  const handleClick = () => {
    startTour();
  };

  if (shouldHide) {
    return null;
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isTourRunning}
      variant="contained"
      startIcon={<HelpOutlineIcon sx={{ fontSize: 18 }} />}
      sx={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 9999,
        backgroundColor: isTourRunning ? "#9CA3AF" : "#004680",
        color: "#ffffff",
        borderRadius: 1.5,
        textTransform: "none",
        fontWeight: "bold",
        px: 2,
        py: 0.75,
        boxShadow: "none",
        opacity: isTourRunning ? 0.6 : 0.9,
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          backgroundColor: isTourRunning ? "#9CA3AF" : "#005AA3",
          boxShadow: "none",
          transform: isTourRunning ? "none" : "translateY(-1px)",
        },
        "&:disabled": {
          backgroundColor: "#9CA3AF",
          color: "#ffffff",
        },
      }}
    >
      {isTourRunning ? "Tutorial..." : "Tutorial"}
    </Button>
  );
};

export default FloatingHelpButton;
