import React from "react";
import { Paper, Box, Typography, Chip } from "@mui/material";
import { Traslado } from "../hooks/types";
import { useAuth } from "@/auth/hooks/useAuth";
import dayjs from "dayjs";

interface Props {
  traslado: Traslado;
  onTrasladoClick?: () => void;
  compact?: boolean;
  isSelected?: boolean;
  tienePoliticaTrasladosTiendas?: boolean;
  tienePoliticaTrasladosJefezona?: boolean;
  isSplitView?: boolean;
}

const TrasladoListItem: React.FC<Props> = ({
  traslado,
  onTrasladoClick,
  compact,
  isSelected,
  tienePoliticaTrasladosTiendas = false,
  tienePoliticaTrasladosJefezona = false,
  isSplitView = false,
}) => {
  const { user } = useAuth();
  const codigoUltra = user?.ultra_code ?? "";

  const esEnviado = traslado.bodega_origen === codigoUltra;
  const colorearBordes = tienePoliticaTrasladosTiendas && !tienePoliticaTrasladosJefezona;

  const diasTranscurridos = React.useMemo(() => {
    if (!traslado.fecha) return null;
    const fechaTraslado = dayjs(traslado.fecha);
    if (!fechaTraslado.isValid()) return null;
    const hoy = dayjs();
    const diff = hoy.diff(fechaTraslado, "day");
    return diff >= 0 ? diff : 0;
  }, [traslado.fecha]);

  let borderColor = "divider";

  if (colorearBordes) {
    borderColor = esEnviado ? "#2563EB" : "#F59E0B";
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
        maxWidth: colorearBordes && isSplitView ? 300 : 280,
        mb: 1,
        minWidth: colorearBordes && isSplitView ? 220 : 280,
        boxSizing: "border-box",

        backgroundColor: isSelected
          ? theme.palette.primary.light
          : theme.palette.background.paper,

        border: `1px solid`,
        borderColor: isSelected
          ? theme.palette.primary.main
          : colorearBordes
            ? "#CBD5E1"
            : theme.palette.divider,

        borderLeft: colorearBordes
          ? `4px solid ${borderColor}`
          : "",

        boxShadow: isSelected
          ? `0 0 15px ${theme.palette.primary.main}44`
          : colorearBordes
            ? "0 10px 20px -10px rgba(0, 0, 0, 0.15)"
            : theme.shadows[2],
            
        color: theme.palette.text.primary,

        cursor: onTrasladoClick ? "pointer" : "default",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": onTrasladoClick
          ? {
              boxShadow: colorearBordes
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

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography
          variant="body2"
          fontSize={compact ? 12 : 10}
          color="text.secondary"
        >
          Fecha: {traslado.fecha}
        </Typography>
        {diasTranscurridos !== null && tienePoliticaTrasladosJefezona && (
          <Typography
            variant="caption"
            sx={{
              backgroundColor: diasTranscurridos > 7 ? "#FEE2E2" : "#E0F2FE",
              color: diasTranscurridos > 7 ? "#991B1B" : "#0369A1",
              px: 1,
              py: 0.1,
              borderRadius: "4px",
              fontWeight: 700,
              fontSize: compact ? "0.7rem" : "0.65rem",
            }}
          >
            {diasTranscurridos === 0
              ? "Hoy"
              : diasTranscurridos === 1
              ? "Hace 1 día"
              : `Hace ${diasTranscurridos} días`}
          </Typography>
        )}
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
