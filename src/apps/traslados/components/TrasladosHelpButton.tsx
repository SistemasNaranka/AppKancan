import React from "react";
import { Button, Tooltip, useTheme } from "@mui/material";
import HelpIcon from "@mui/icons-material/Help";
import { useTrasladosTourContext } from "./TrasladosTourContext";

interface TrasladosHelpButtonProps {
  onBeforeStart?: () => void;
  compact?: boolean;
}

const TrasladosHelpButton: React.FC<TrasladosHelpButtonProps> = ({
  onBeforeStart,
  compact = false,
}) => {
  const theme = useTheme();
  const { startFullTour, isFullTourRunning, resetTourState } = useTrasladosTourContext();

  const handleClick = () => {
    if (!isFullTourRunning) {
      resetTourState();
      
      if (onBeforeStart) {
        onBeforeStart();
      }
      
      setTimeout(() => {
        startFullTour();
      }, 150);
    }
  };

  if (compact) {
    return (
      <Tooltip title={isFullTourRunning ? "Tutorial en curso..." : "Ver tutorial"}>
        <span>
          <Button
            onClick={handleClick}
            disabled={isFullTourRunning}
            variant="contained"
            data-tour="btn-tutorial"
            sx={{
              minWidth: "auto",
              p: 1,
              backgroundColor: isFullTourRunning 
                ? theme.palette.grey[400] 
                : theme.palette.secondary.main,
              color: "#ffffff",
              borderRadius: 2,
              boxShadow: 2,
              opacity: isFullTourRunning ? 0.6 : 1,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                backgroundColor: isFullTourRunning 
                  ? theme.palette.grey[400] 
                  : theme.palette.secondary.dark,
                transform: isFullTourRunning ? "none" : "translateY(-1px)",
                boxShadow: 3,
              },
              "&:disabled": {
                backgroundColor: theme.palette.grey[400],
                color: "#ffffff",
              },
            }}
          >
            <HelpIcon fontSize="small" />Tutorial
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isFullTourRunning}
      variant="contained"
      data-tour="btn-tutorial"
      startIcon={<HelpIcon sx={{ fontSize: 18 }} />}
      sx={{
        backgroundColor: isFullTourRunning 
          ? theme.palette.grey[400] 
          : theme.palette.secondary.main,
        color: "#ffffff",
        borderRadius: 2,
        textTransform: "none",
        fontWeight: "bold",
        px: 2,
        py: 0.75,
        boxShadow: 2,
        opacity: isFullTourRunning ? 0.6 : 0.95,
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          backgroundColor: isFullTourRunning 
            ? theme.palette.grey[400] 
            : theme.palette.secondary.dark,
          boxShadow: 3,
          transform: isFullTourRunning ? "none" : "translateY(-1px)",
        },
        "&:disabled": {
          backgroundColor: theme.palette.grey[400],
          color: "#ffffff",
        },
      }}
    >
      {isFullTourRunning ? "Tutorial..." : "Tutorial"}
    </Button>
  );
};

export default TrasladosHelpButton;