import React from "react";
import { TooltipRenderProps } from "react-joyride";
import { Box, Button, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export const CustomTooltip: React.FC<TooltipRenderProps> = ({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  size,
  isLastStep,
}) => {
  const isFirstStep = index === 0;
  const hideFooter = (step as any).hideFooter === true;

  return (
    <Box
      {...tooltipProps}
      sx={{
        maxWidth: 380,
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        overflow: "hidden",
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
          Paso {index + 1} de {size}
        </Typography>
        <Button
          {...closeProps}
          title=""
          size="small"
          disableElevation
          sx={{
            minWidth: "auto",
            p: 0.5,
            color: "text.secondary",
            boxShadow: "none",
            "&:hover": { backgroundColor: "transparent", color: "text.primary" },
          }}
        >
          <CloseIcon fontSize="small" />
        </Button>
      </Box>

      <Box sx={{ p: 2 }}>{step.content}</Box>

      {!hideFooter && (
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
            {...backProps}
            title=""
            variant="text"
            size="small"
            disableElevation
            disabled={isFirstStep}
            sx={{
              textTransform: "none",
              boxShadow: "none",
              color: isFirstStep ? "text.disabled" : "text.secondary",
            }}
          >
            Atrás
          </Button>
          <Button
            {...primaryProps}
            title=""
            variant="contained"
            size="small"
            disableElevation
            sx={{
              backgroundColor: "#004680",
              textTransform: "none",
              borderRadius: 1,
              boxShadow: "none",
              "&:hover": { backgroundColor: "#003366", boxShadow: "none" },
            }}
          >
            {isLastStep ? "Continuar" : "Siguiente"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CustomTooltip;