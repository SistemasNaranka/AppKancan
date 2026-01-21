import React from "react";
import { Box, Typography } from "@mui/material";
import {
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { green, orange, blue, grey, pink, red } from "@mui/material/colors";
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

    // Usar configuración proporcionada o array vacío
    const umbrales = thresholdConfig || [];

    // Si no hay umbrales configurados, mostrar sin comisión
    if (umbrales.length === 0) {
      return {
        message: "Sin comisión",
        icon: <CancelIcon sx={{ fontSize: size === "small" ? 14 : 16 }} />,
        color: grey[600],
      };
    }

    // Ordenar umbrales por cumplimiento_min ascendente
    const umbralesOrdenados = [...umbrales].sort(
      (a, b) => a.cumplimiento_min - b.cumplimiento_min,
    );

    // Si no alcanza el primer umbral
    if (cumplimientoPct < umbralesOrdenados[0].cumplimiento_min) {
      // Encontrar al gerente de la tienda
      const gerente = tienda.empleados.find((e) => e.rol === "gerente");
      if (gerente && gerente.proxima_venta) {
        return {
          message: `Vende ${formatCurrency(
            gerente.proxima_venta,
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

    // Mapa de colores MUI a nombres de colores
    const colorMap: Record<string, string> = {
      red: red[300],
      pink: pink[300],
      orange: orange[600],
      blue: blue[600],
      green: green[600],
      purple: "#9c27b0",
      yellow: "#ffeb3b",
    };

    // Colores basados en los umbrales configurados para el mes
    const getCumplimientoColor = (pct: number) => {
      // Verificar si el cumplimiento está dentro de alguno de los umbrales configurados
      const isWithinThresholds = umbralesOrdenados.some((umbral) => {
        const nextUmbral =
          umbralesOrdenados[umbralesOrdenados.indexOf(umbral) + 1];
        return (
          pct >= umbral.cumplimiento_min &&
          (!nextUmbral || pct < nextUmbral.cumplimiento_min)
        );
      });

      // Asignar color SOLO si el cumplimiento está dentro de los umbrales configurados
      if (!isWithinThresholds) {
        return grey[600]; // Gris (sin color) para cumplimiento < umbral mínimo o fuera de rango
      }

      // Asignar color basado EN LOS UMBRALES CONFIGURADOS para el mes
      for (let i = 0; i < umbralesOrdenados.length; i++) {
        const umbral = umbralesOrdenados[i];
        const nextUmbral = umbralesOrdenados[i + 1];

        if (
          pct >= umbral.cumplimiento_min &&
          (!nextUmbral || pct < nextUmbral.cumplimiento_min)
        ) {
          // Si el umbral tiene un color configurado, usarlo
          if (umbral.color && colorMap[umbral.color]) {
            return colorMap[umbral.color];
          }

          // Si no, usar la lógica de color por defecto
          if (umbral.cumplimiento_min >= 85 && umbral.cumplimiento_min < 90) {
            return red[300]; // Rojo para umbrales 85-89%
          } else if (
            umbral.cumplimiento_min >= 90 &&
            umbral.cumplimiento_min < 95
          ) {
            return pink[300]; // Rosa para umbrales 90-94%
          } else if (
            umbral.cumplimiento_min >= 95 &&
            umbral.cumplimiento_min < 100
          ) {
            return orange[600]; // Naranja para umbrales 95-99%
          } else if (
            umbral.cumplimiento_min >= 100 &&
            umbral.cumplimiento_min < 110
          ) {
            return blue[600]; // Azul para umbrales 100-109%
          } else {
            return green[600]; // Verde para umbrales ≥110%
          }
        }
      }

      return grey[600]; // Default
    };

    // Obtener el color basado en el cumplimiento real de la tienda y la configuración del mes
    const color = getCumplimientoColor(cumplimientoPct);

    const icons = [
      <TrendingUpIcon sx={{ fontSize: size === "small" ? 14 : 16 }} />,
      <TrendingUpIcon sx={{ fontSize: size === "small" ? 14 : 16 }} />,
      <CheckCircleIcon sx={{ fontSize: size === "small" ? 14 : 16 }} />,
      <StarIcon sx={{ fontSize: size === "small" ? 14 : 16 }} />,
    ];

    return {
      message: messages[Math.min(currentLevel, messages.length - 1)],
      icon: icons[Math.min(currentLevel, icons.length - 1)],
      color: color,
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
