// Selector visual (ToggleButtonGroup) de sala para los diálogos de reserva.

import React from "react";
import { Box, Typography, ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { Sala } from "../../types/reservas.types";
import { SALAS_DISPONIBLES } from "../../types/reservas.types";
import { INFO_SALAS } from "./constants";

interface SalaSelectorProps {
  value: Sala | "";
  onChange: (sala: Sala) => void;
  disabled?: boolean;
  errorMessage?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export const SalaSelector: React.FC<SalaSelectorProps> = ({
  value,
  onChange,
  disabled,
  errorMessage,
  containerRef,
}) => {
  return (
    <Box ref={containerRef}>
      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "#374151" }}>
        Seleccionar Sala *
      </Typography>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_e, newSala) => { if (newSala) onChange(newSala as Sala); }}
        fullWidth
        sx={{
          "& .MuiToggleButton-root": {
            flex: 1,
            py: 1,
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.875rem",
            border: "1px solid #d1d5db",
            backgroundColor: "white",
            "&.Mui-selected": {
              backgroundColor: "#EFF6FF",
              borderColor: "#3B82F6",
              color: "#1D4ED8",
              "&:hover": { backgroundColor: "#DBEAFE" },
            },
            "&:hover": { backgroundColor: "#f9fafb" },
          },
        }}
      >
        {SALAS_DISPONIBLES.map((sala) => (
          <ToggleButton key={sala} value={sala} disabled={disabled}>
            {sala} ({INFO_SALAS[sala]})
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {errorMessage && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
          {errorMessage}
        </Typography>
      )}
    </Box>
  );
};
