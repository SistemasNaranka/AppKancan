// Tooltip flotante (Popper) que muestra el paso actual del tour interno del diálogo.

import React from "react";
import { Box, Button, Chip, Fade, Paper, Popper, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { DialogTourStep } from "./DialogTourSteps";

interface TourTooltipProps {
  anchorEl: HTMLElement | null;
  step: DialogTourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  open: boolean;
}

export const TourTooltip: React.FC<TourTooltipProps> = ({
  anchorEl,
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onClose,
  open,
}) => {
  if (!anchorEl || !open) return null;

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement={step.placement}
      transition
      modifiers={[
        { name: "offset", options: { offset: [0, 16] } },
        { name: "preventOverflow", options: { padding: 20 } },
        { name: "flip", options: { boundary: "viewport" } },
      ]}
      sx={{ zIndex: 9999 }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={350}>
          <Paper
            elevation={8}
            sx={{
              maxWidth: 280,
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                px: 2,
                py: 1.5,
                borderBottom: "1px solid #e0e0e0",
                backgroundColor: "#f9fafb",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#004680" }}>
                Paso {stepIndex + 1} de {totalSteps}
              </Typography>
              <Button
                size="small"
                onClick={onClose}
                sx={{
                  minWidth: "auto",
                  p: 0.5,
                  color: "text.secondary",
                  "&:hover": { backgroundColor: "transparent", color: "text.primary" },
                }}
              >
                <CloseIcon fontSize="small" />
              </Button>
            </Box>

            <Box sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: "1rem" }}>
                {step.title}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {step.content}
              </Typography>
              {step.highlight && (
                <Chip
                  label={
                    step.isLast
                      ? 'Haz clic en "Confirmar Reservación"'
                      : "Llena el formulario y haz clic"
                  }
                  size="small"
                  sx={{
                    mt: 1.5,
                    backgroundColor: "#D1FAE5",
                    color: "#065F46",
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>

            {!step.isLast && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 2,
                  py: 1.5,
                  borderTop: "1px solid #e0e0e0",
                  backgroundColor: "#f9fafb",
                }}
              >
                <Button
                  variant="text"
                  size="small"
                  disabled={stepIndex === 0}
                  onClick={onPrev}
                  sx={{
                    textTransform: "none",
                    color: stepIndex === 0 ? "text.disabled" : "text.secondary",
                  }}
                >
                  Atrás
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={onNext}
                  sx={{
                    backgroundColor: "#004680",
                    textTransform: "none",
                    borderRadius: 1,
                    "&:hover": { backgroundColor: "#005AA3" },
                  }}
                >
                  Siguiente
                </Button>
              </Box>
            )}
          </Paper>
        </Fade>
      )}
    </Popper>
  );
};
