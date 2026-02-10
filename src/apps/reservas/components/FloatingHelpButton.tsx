/**
 * Floating Help Button Component
 * Botón que inicia el tour completo secuencial
 */
import React from "react";
import { Button } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useTourContext } from "./TourContext";

const FloatingHelpButton: React.FC = () => {
  const { startFullTour, isFullTourRunning } = useTourContext();

  const handleClick = () => {
    if (!isFullTourRunning) {
      startFullTour();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isFullTourRunning}
      variant="contained"
      startIcon={<HelpOutlineIcon sx={{ fontSize: 18 }} />}
      sx={{
        backgroundColor: isFullTourRunning ? "#9CA3AF" : "#004680",
        color: "#ffffff",
        borderRadius: 1.5,
        textTransform: "none",
        fontWeight: "bold",
        px: 2,
        py: 0.75,
        boxShadow: "none",
        opacity: isFullTourRunning ? 0.6 : 0.9,
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          backgroundColor: isFullTourRunning ? "#9CA3AF" : "#005AA3",
          boxShadow: "none",
          transform: isFullTourRunning ? "none" : "translateY(-1px)",
        },
        "&:disabled": {
          backgroundColor: "#9CA3AF",
          color: "#ffffff",
        },
      }}
    >
      {isFullTourRunning ? "Tutorial..." : "Tutorial"}
    </Button>
  );
};

export default FloatingHelpButton;