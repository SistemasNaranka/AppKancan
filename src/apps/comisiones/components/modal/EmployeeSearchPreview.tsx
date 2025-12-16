import React from "react";
import { Box, Typography, Chip, Avatar, Paper } from "@mui/material";
import { Person, Business } from "@mui/icons-material";
import { DirectusAsesor } from "../../types/modal";

interface EmployeeSearchPreviewProps {
  empleado: DirectusAsesor | null;
  codigo: string;
}

export const EmployeeSearchPreview: React.FC<EmployeeSearchPreviewProps> = ({
  empleado,
  codigo,
}) => {
  if (!codigo.trim()) return null;

  if (!empleado) {
    return (
      <Paper
        elevation={1}
        sx={{
          p: 2,
          mt: 1,
          backgroundColor: "#fff3e0",
          border: "1px solid #ffcc02",
          borderRadius: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Business color="warning" fontSize="small" />
          <Typography variant="body2" color="warning.dark">
            Código {codigo}: No se encontró empleado
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mt: 1,
        backgroundColor: "#e8f5e8",
        border: "1px solid #4caf50",
        borderRadius: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar sx={{ bgcolor: "success.main", width: 40, height: 40 }}>
          <Person />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={600} color="success.dark">
            {empleado.nombre || `Empleado ${empleado.id}`}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
            <Chip
              label={`Código: ${empleado.id}`}
              size="small"
              variant="outlined"
              color="success"
              sx={{ fontSize: "0.75rem", height: 20 }}
            />
            <Chip
              label={`Documento: ${empleado.documento}`}
              size="small"
              variant="outlined"
              color="success"
              sx={{ fontSize: "0.75rem", height: 20 }}
            />
            <Chip
              label={`Tienda: ${
                typeof empleado.tienda_id === "object"
                  ? empleado.tienda_id.nombre
                  : empleado.tienda_id
              }`}
              size="small"
              variant="outlined"
              color="success"
              sx={{ fontSize: "0.75rem", height: 20 }}
            />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};
