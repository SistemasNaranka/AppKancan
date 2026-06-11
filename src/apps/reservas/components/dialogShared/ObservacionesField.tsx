// Textarea de observaciones con contador de caracteres y alerta cerca del límite.

import React from "react";
import { Box, Typography, TextField } from "@mui/material";

interface ObservacionesFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  errorMessage?: string;
  placeholder?: string;
  maxChars?: number;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export const ObservacionesField: React.FC<ObservacionesFieldProps> = ({
  value,
  onChange,
  disabled,
  errorMessage,
  placeholder = "Detalles adicionales...",
  maxChars = 500,
  containerRef,
}) => {
  const caracteres = value?.length || 0;
  const restantes = maxChars - caracteres;
  const aproximandoLimite = caracteres >= Math.max(maxChars - 50, 0);

  return (
    <Box ref={containerRef}>
      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "#374151" }}>
        Observaciones
      </Typography>
      <TextField
        value={value}
        onChange={(e) => onChange(e.target.value)}
        fullWidth
        multiline
        rows={3}
        placeholder={placeholder}
        error={!!errorMessage}
        helperText={
          errorMessage || (
            <Typography
              component="span"
              sx={{
                color: aproximandoLimite
                  ? caracteres >= maxChars
                    ? "#ef4444"
                    : "#f59e0b"
                  : "#6b7280",
                fontSize: "0.75rem",
              }}
            >
              {caracteres >= maxChars
                ? "Límite alcanzado"
                : `Opcional - ${restantes} caracteres restantes`}
            </Typography>
          )
        }
        disabled={disabled}
        sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "white" } }}
      />
    </Box>
  );
};
