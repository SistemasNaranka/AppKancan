import React from "react";
import { Paper, Box, Typography, Chip } from "@mui/material";
import { Traslado } from "../hooks/types";
interface Props {
  traslado: Traslado;
  onTrasladoClick?: () => void;
  compact?: boolean;
  isSelected?: boolean;
}

const TrasladoListItem: React.FC<Props> = ({
  traslado,
  onTrasladoClick,
  compact,
  isSelected,
}) => {
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
        maxWidth: 280,
        mb: 1,
        minWidth: 240,
        boxSizing: "border-box",

        // 🎨 Fondo y borde dinámicos
        backgroundColor: isSelected
          ? theme.palette.primary.light
          : theme.palette.background.paper,
        border: `1px solid ${
          isSelected ? theme.palette.primary.main : theme.palette.divider
        }`,
        boxShadow: isSelected
          ? `0 1 10px ${theme.palette.primary.main}55`
          : theme.palette.primary.main,

        // 🎨 Color de texto global
        color: isSelected
          ? theme.palette.text.primary
          : theme.palette.text.primary,

        cursor: onTrasladoClick ? "pointer" : "default",
        transition: "all 0.25s ease",
        "&:hover": onTrasladoClick
          ? {
              boxShadow: theme.shadows[6],
              transform: "translateY(-3px)",
            }
          : {},
      })}
    >
      {/* Detalles */}
      <Typography fontWeight={700} fontSize={compact ? 16 : 12}>
        Traslado: {traslado.traslado}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
        {/* 👇 Mostrar el ícono solo si NO está seleccionado */}

        <Typography
          variant="body2"
          fontSize={compact ? 12 : 10}
          color="inherit"
        >
          Fecha: {traslado.fecha}
        </Typography>
      </Box>

      {/* Encabezado */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* 👇 Mostrar el ícono solo si NO está seleccionado */}

        <Typography
          fontSize={compact ? 13 : 10}
          noWrap
          color="inherit" // hereda del Paper
        >
          Origen: {traslado.nombre_origen}
        </Typography>
      </Box>
      <Typography variant="body2" fontSize={compact ? 13 : 9} color="inherit">
        Destino: {traslado.nombre_destino}
      </Typography>
      {/* Chip cuando está seleccionado */}
      {
        <Chip
          label={`${traslado.unidades} Unds`}
          color="info"
          size="small"
          sx={(theme) => ({
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 2,

            boxShadow: `0 0 1px 1px ${theme.palette.primary.light}`,
            backgroundColor: isSelected
              ? theme.palette.primary.main
              : theme.palette.background.paper,
            color: isSelected
              ? theme.palette.primary.contrastText
              : theme.palette.primary.main,
            "& .MuiChip-icon": {
              color: isSelected
                ? theme.palette.primary.contrastText
                : theme.palette.primary.main,
            },
          })}
        />
      }
    </Paper>
  );
};

export default TrasladoListItem;
