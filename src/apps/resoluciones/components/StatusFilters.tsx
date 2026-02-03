import React from "react";
import { Button, Box } from "@mui/material";
import { EstadoResolucion } from "../types";

interface StatusFiltersProps {
  estadoActivo: EstadoResolucion | null;
  onFiltrar: (estado: EstadoResolucion | null) => void;
}

const StatusFilters: React.FC<StatusFiltersProps> = ({
  estadoActivo,
  onFiltrar,
}) => {
  const estados: { valor: EstadoResolucion; color: string }[] = [
    { valor: "Pendiente", color: "#9E9E9E" },
    { valor: "Por vencer", color: "#FFA000" },
    { valor: "Vigente", color: "#4CAF50" },
    { valor: "Vencido", color: "#F44336" },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        flexWrap: { xs: "wrap", sm: "nowrap" },
      }}
    >
      {estados.map((estado) => (
        <Button
          key={estado.valor}
          size="small"
          onClick={() =>
            onFiltrar(estadoActivo === estado.valor ? null : estado.valor)
          }
          sx={{
            backgroundColor:
              estadoActivo === estado.valor ? estado.color : "#E0E0E0",
            color: estadoActivo === estado.valor ? "white" : "#333",
            boxShadow: "none",
            border: "none",
            fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
            px: { xs: 1, sm: 1.5, md: 2 },
            py: { xs: 0.5, sm: 0.6, md: 0.8 },
            minWidth: { xs: "auto", sm: "auto" },
            flex: { xs: "1 1 calc(50% - 4px)", sm: "none" },
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: estado.color,
              color: "white",
              boxShadow: "none",
            },
          }}
        >
          {estado.valor}
        </Button>
      ))}
    </Box>
  );
};

export default StatusFilters;
