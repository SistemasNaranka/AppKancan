import React from "react";
import { Box, Typography, Chip, Button, Tooltip, useTheme } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HelpIcon from "@mui/icons-material/Help";
import { useTrasladosTourContext } from "./TrasladosTourContext";

interface StoreTrasladosHeaderProps {
  totalPendientes: number;
}

export const StoreTrasladosHeader: React.FC<StoreTrasladosHeaderProps> = ({
  totalPendientes,
}) => {
  const theme = useTheme();
  const { startFullTour, isFullTourRunning, resetTourState } = useTrasladosTourContext();

  const handleStartTour = () => {
    if (!isFullTourRunning) {
      resetTourState();
      setTimeout(() => startFullTour(), 150);
    }
  };

  return (
    <Box
      data-tour="store-header"
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        width: "100%",
        mb: 0,
      }}
    >
      <Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "#1E293B",
            letterSpacing: "-0.01em",
            mb: 0,
          }}
        >
          Traslados en Tránsito
        </Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Chip
          icon={
            <AccessTimeIcon
              sx={{
                fontSize: "20px",
                color: "primary.main",
              }}
            />
          }
          label={`En Tránsito: ${totalPendientes}`}
          sx={{
            backgroundColor: "#EFF6FF",
            color: "primary.main",
            fontWeight: 700,
            borderRadius: "8px",
            border: "1px solid #DBEAFE",
            height: "32px",
            fontSize: "0.9rem",
            "& .MuiChip-label": {
              px: 1.5,
            },
          }}
        />

        <Tooltip title={isFullTourRunning ? "Tutorial en curso..." : "Ver tutorial"}>
          <span>
            <Button
              data-tour="store-btn-tutorial"
              onClick={handleStartTour}
              disabled={isFullTourRunning}
              variant="contained"
              size="small"
              startIcon={<HelpIcon sx={{ fontSize: 16 }} />}
              sx={{
                backgroundColor: isFullTourRunning
                  ? theme.palette.grey[400]
                  : theme.palette.secondary.main,
                color: "#ffffff",
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.8rem",
                px: 1.5,
                py: 0.6,
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
              {isFullTourRunning ? "Tutorial..." : "Tutorial"}
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default StoreTrasladosHeader;
