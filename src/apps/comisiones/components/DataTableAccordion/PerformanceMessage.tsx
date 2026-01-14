import React from "react";
import { Box, Typography } from "@mui/material";
import {
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { green, orange, blue, grey, pink, purple } from "@mui/material/colors";
import { TiendaResumen, CommissionThreshold } from "../../types";
import { formatCurrency } from "../../lib/utils";

interface PerformanceMessageProps {
  tienda: TiendaResumen;
  size?: "small" | "medium";
  thresholdConfig?: CommissionThreshold[];
}

/**
 * Componente que muestra mensajes de desempeño basados en el porcentaje de cumplimiento
 * Muestra texto con icono (sin chip)
 */
const PerformanceMessage: React.FC<PerformanceMessageProps> = ({
  tienda,
  size = "medium",
  thresholdConfig,
}) => {
  const getPerformanceInfo = () => {
    const cumplimientoPct = tienda.cumplimiento_tienda_pct;

    // Usar configuración proporcionada o valores por defecto
    const DEFAULT_THRESHOLDS = [
      { cumplimiento_min: 90, comision_pct: 0.0035, nombre: "Muy Regular" },
      { cumplimiento_min: 95, comision_pct: 0.005, nombre: "Regular" },
      { cumplimiento_min: 100, comision_pct: 0.007, nombre: "Buena" },
      { cumplimiento_min: 110, comision_pct: 0.01, nombre: "Excelente" },
    ];

    const umbrales =
      thresholdConfig && thresholdConfig.length > 0
        ? thresholdConfig
        : DEFAULT_THRESHOLDS;

    // Ordenar umbrales por cumplimiento_min ascendente
    const umbralesOrdenados = [...umbrales].sort(
      (a, b) => a.cumplimiento_min - b.cumplimiento_min
    );

    // Si no alcanza el primer umbral
    if (cumplimientoPct < umbralesOrdenados[0].cumplimiento_min) {
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
    }

    // Determinar el nivel actual basado en los umbrales
    let currentLevel = 0;
    for (let i = 0; i < umbralesOrdenados.length; i++) {
      if (cumplimientoPct >= umbralesOrdenados[i].cumplimiento_min) {
        currentLevel = i;
      } else {
        break;
      }
    }

    // Mensajes basados en el nivel actual
    const messages = umbralesOrdenados.map((umbral) => umbral.nombre);

    // Colores basados en los umbrales
    const getCumplimientoColor = (pct: number) => {
      if (pct < 80) return grey[600];
      if (pct < 90) return purple[300];
      if (pct < 95) return pink[300];
      if (pct < 100) return orange[600];
      if (pct < 110) return blue[600];
      return green[600];
    };

    const colors = umbralesOrdenados.map((umbral) =>
      getCumplimientoColor(umbral.cumplimiento_min)
    );

    const icons = [
      <TrendingUpIcon sx={{ fontSize: size === "small" ? 14 : 16 }} />,
      <TrendingUpIcon sx={{ fontSize: size === "small" ? 14 : 16 }} />,
      <CheckCircleIcon sx={{ fontSize: size === "small" ? 14 : 16 }} />,
      <StarIcon sx={{ fontSize: size === "small" ? 14 : 16 }} />,
    ];

    return {
      message: messages[Math.min(currentLevel, messages.length - 1)],
      icon: icons[Math.min(currentLevel, icons.length - 1)],
      color: colors[Math.min(currentLevel, colors.length - 1)],
    };
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
