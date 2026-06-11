// Selectores de hora de inicio y fin con el banner informativo de horario disponible.

import React from "react";
import { Box, Typography, FormControl, Select, MenuItem } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { formatearHoraLegible } from "./horaHelpers";

interface HoraOpcion {
  value: string;
  label: string;
}

interface HorasFieldsProps {
  horaApertura: string;
  horaCierre: string;
  opcionesInicio: HoraOpcion[];
  opcionesFin: HoraOpcion[];
  startTime: string;
  endTime: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  disabled?: boolean;
  errorStart?: string;
  errorEnd?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export const HorasFields: React.FC<HorasFieldsProps> = ({
  horaApertura,
  horaCierre,
  opcionesInicio,
  opcionesFin,
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  disabled,
  errorStart,
  errorEnd,
  containerRef,
}) => {
  return (
    <Box ref={containerRef}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 2,
          p: 1.5,
          backgroundColor: "#EFF6FF",
          borderRadius: 1,
          border: "1px solid #BFDBFE",
        }}
      >
        <InfoIcon sx={{ color: "#3B82F6", fontSize: 20 }} />
        <Typography variant="body2" sx={{ color: "#1E40AF" }}>
          Horario disponible:{" "}
          <strong>{formatearHoraLegible(horaApertura)}</strong> a{" "}
          <strong>{formatearHoraLegible(horaCierre)}</strong>
        </Typography>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <Box>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "#374151" }}>
            Hora de Inicio *
          </Typography>
          <FormControl fullWidth error={!!errorStart}>
            <Select
              value={startTime}
              onChange={(e) => onStartChange(e.target.value as string)}
              disabled={disabled}
              size="small"
              sx={{ backgroundColor: "white" }}
            >
              {opcionesInicio.map((opcion) => (
                <MenuItem key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </MenuItem>
              ))}
            </Select>
            {errorStart && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errorStart}
              </Typography>
            )}
          </FormControl>
        </Box>
        <Box>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "#374151" }}>
            Hora de Fin *
          </Typography>
          <FormControl fullWidth error={!!errorEnd}>
            <Select
              value={endTime}
              onChange={(e) => onEndChange(e.target.value as string)}
              disabled={disabled}
              size="small"
              sx={{ backgroundColor: "white" }}
            >
              {opcionesFin.map((opcion) => (
                <MenuItem key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </MenuItem>
              ))}
            </Select>
            {errorEnd && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errorEnd}
              </Typography>
            )}
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
};
