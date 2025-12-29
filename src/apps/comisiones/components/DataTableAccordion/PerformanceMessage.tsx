import React from "react";
import { Box, Typography } from "@mui/material";
import {
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { green, orange, blue, grey, pink } from "@mui/material/colors";
import { TiendaResumen } from "../../types";
import { formatCurrency } from "../../lib/utils";

interface PerformanceMessageProps {
  tienda: TiendaResumen;
  size?: "small" | "medium";
}

/**
 * Componente que muestra mensajes de desempeño basados en el porcentaje de cumplimiento
 * Muestra texto con icono (sin chip)
 */
const PerformanceMessage: React.FC<PerformanceMessageProps> = ({
  tienda,
  size = "medium",
}) => {
  const getPerformanceInfo = () => {
    const cumplimientoPct = tienda.cumplimiento_tienda_pct;

    if (cumplimientoPct < 90) {
      // Encontrar al gerente de la tienda
      const gerente = tienda.empleados.find((e) => e.rol === "gerente");
      if (gerente && gerente.proxima_venta) {
        return {
          message: `Vende ${formatCurrency(
            gerente.proxima_venta
          )} para comisionar`,
          icon: <CancelIcon sx={{ fontSize: size === "small" ? 14 : 16 }} />,
          color: grey[800],
        };
      } else {
        return {
          message: "Sin comisión",
          icon: <CancelIcon sx={{ fontSize: size === "small" ? 14 : 16 }} />,
          color: grey[600],
        };
      }
    } else if (cumplimientoPct < 95) {
      return {
        message: "Buen Inicio",
        icon: <TrendingUpIcon sx={{ fontSize: size === "small" ? 14 : 16 }} />,
        color: pink[300],
      };
    } else if (cumplimientoPct < 100) {
      return {
        message: "Buen progreso",
        icon: <TrendingUpIcon sx={{ fontSize: size === "small" ? 14 : 16 }} />,
        color: orange[600],
      };
    } else if (cumplimientoPct < 110) {
      return {
        message: "Muy buen trabajo",
        icon: <CheckCircleIcon sx={{ fontSize: size === "small" ? 14 : 16 }} />,
        color: blue[600],
      };
    } else {
      return {
        message: "Excelente desempeño",
        icon: <StarIcon sx={{ fontSize: size === "small" ? 14 : 16 }} />,
        color: green[600],
      };
    }
  };

  const performanceInfo = getPerformanceInfo();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        color: performanceInfo.color,
        fontWeight: 600,
        fontSize: size === "small" ? "0.75rem" : "0.875rem",
        whiteSpace: "nowrap",
      }}
    >
      {performanceInfo.icon}
      <Typography
        variant="body2"
        sx={{
          color: performanceInfo.color,
          fontWeight: 600,
          fontSize: size === "small" ? "0.75rem" : "0.875rem",
          whiteSpace: "nowrap",
        }}
      >
        {performanceInfo.message}
      </Typography>
    </Box>
  );
};

export default PerformanceMessage;
