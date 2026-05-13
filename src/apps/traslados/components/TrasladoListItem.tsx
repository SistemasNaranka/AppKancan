import React from "react";
import { Paper, Box, Typography, Chip } from "@mui/material";
import { Traslado } from "../hooks/types";
import { useAuth } from "@/auth/hooks/useAuth";

interface Props {
  traslado: Traslado;
  onTrasladoClick?: () => void;
  compact?: boolean;
  isSelected?: boolean;
  tienePoliticaTrasladosTiendas?: boolean;
  isSplitView?: boolean;
}

const TrasladoListItem: React.FC<Props> = ({
  traslado,
  onTrasladoClick,
  compact,
  isSelected,
  tienePoliticaTrasladosTiendas = false,
  isSplitView = false,
}) => {
  const { user } = useAuth();
  const codigoUltra = user?.ultra_code ?? "";

  // Determinar si es enviado (Saliente) o por recibir (Entrante)
  const esEnviado = traslado.bodega_origen === codigoUltra;

  // Definir color de borde dinámico para tienda
  let borderColor = "divider";

  if (tienePoliticaTrasladosTiendas) {
    borderColor = esEnviado ? "#2563EB" : "#F59E0B"; // Azul para Enviados, Ámbar para Por Recibir
  }

  return (
    <Paper
      id={`traslado-card-${traslado.traslado}`}
      onClick={onTrasladoClick}
      elevation={isSelected ? 8 : 3}
      sx={(theme) => ({
        position: "relative",
        display: "flex",
        flexDirection: "column",
        p: compact ? 1 : 1.5,
        gap: 0.8,
        borderRadius: 2,
        width: "100%",
        maxWidth: tienePoliticaTrasladosTiendas && isSplitView ? 300 : 280,
        mb: 1,
        minWidth: tienePoliticaTrasladosTiendas && isSplitView ? 220 : 280,
        boxSizing: "border-box",

        backgroundColor: isSelected
          ? theme.palette.primary.light
          : theme.palette.background.paper,

        border: `1px solid`,
        borderColor: isSelected
          ? theme.palette.primary.main
          : tienePoliticaTrasladosTiendas
            ? "#CBD5E1"
            : theme.palette.divider,

        borderLeft: tienePoliticaTrasladosTiendas
          ? `4px solid ${borderColor}`
          : "",

        boxShadow: isSelected
          ? `0 0 15px ${theme.palette.primary.main}44`
          : tienePoliticaTrasladosTiendas
            ? "0 10px 20px -10px rgba(0, 0, 0, 0.15)"
            : theme.shadows[2],

        // 🎨 Color de texto global
        color: theme.palette.text.primary,

        cursor: onTrasladoClick ? "pointer" : "default",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": onTrasladoClick
          ? {
              boxShadow: tienePoliticaTrasladosTiendas
                ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                : theme.shadows[6],
              transform: "translateY(-4px)",
            }
          : {},
      })}
    >
      {/* Detalles */}
      <Typography fontWeight={700} fontSize={compact ? 16 : 12}>
        Traslado: {traslado.traslado}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography
          variant="body2"
          fontSize={compact ? 12 : 10}
          color="text.secondary"
        >
          Fecha: {traslado.fecha}
        </Typography>
      </Box>

      {/* Encabezado */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography
          fontSize={compact ? 13 : 11}
          noWrap
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <Box
            component="span"
            sx={{
              fontWeight: 700,
              color: "text.secondary",
              fontSize: "0.75rem",
            }}
          >
            ORIGEN:
          </Box>{" "}
          {traslado.nombre_origen}
        </Typography>
        <Typography
          fontSize={compact ? 13 : 11}
          noWrap
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <Box
            component="span"
            sx={{
              fontWeight: 700,
              color: "text.secondary",
              fontSize: "0.75rem",
            }}
          >
            DESTINO:
          </Box>{" "}
          {traslado.nombre_destino}
        </Typography>
      </Box>

      {/* Chip de Unidades */}
      <Chip
        label={`${traslado.unidades} Unds`}
        size="small"
        sx={(theme) => ({
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 2,
          fontWeight: 700,
          backgroundColor: isSelected ? theme.palette.primary.main : "#F1F5F9",
          color: isSelected
            ? theme.palette.primary.contrastText
            : "primary.main",
          border: `1px solid ${isSelected ? theme.palette.primary.main : "#CBD5E1"}`,
        })}
      />
    </Paper>
  );
};

export default TrasladoListItem;
