import React from "react";
import { Box, Typography } from "@mui/material";
import CancelIcon from '@mui/icons-material/Cancel';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
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

    const umbrales = thresholdConfig || [];

    if (umbrales.length === 0) {
      return {
        message: "Sin comisión",
        icon: <CancelIcon sx={{ fontSize: size === "small" ? 14 : 16 }} />,
        color: grey[600],
      };
    }

    const umbralesOrdenados = [...umbrales].sort(
      (a, b) => a.min_compliance - b.min_compliance,
    );

    if (cumplimientoPct < umbralesOrdenados[0].min_compliance) {
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

    let currentLevel = 0;
    for (let i = 0; i < umbralesOrdenados.length; i++) {
      if (cumplimientoPct >= umbralesOrdenados[i].min_compliance) {
        currentLevel = i;
      } else {
        break;
      }
    }

    const messages = umbralesOrdenados.map((umbral) => umbral.name);

    const colorMap: Record<string, string> = {
      red: red[300],
      pink: pink[300],
      orange: orange[600],
      blue: blue[600],
      green: green[600],
      purple: "#9c27b0",
      yellow: "#ffeb3b",
    };

    const getCumplimientoColor = (pct: number) => {
      const isWithinThresholds = umbralesOrdenados.some((umbral) => {
        const nextUmbral =
          umbralesOrdenados[umbralesOrdenados.indexOf(umbral) + 1];
        return (
          pct >= umbral.min_compliance &&
          (!nextUmbral || pct < nextUmbral.min_compliance)
        );
      });

      if (!isWithinThresholds) {
        return grey[600];
      }

      for (let i = 0; i < umbralesOrdenados.length; i++) {
        const umbral = umbralesOrdenados[i];
        const nextUmbral = umbralesOrdenados[i + 1];

        if (
          pct >= umbral.min_compliance &&
          (!nextUmbral || pct < nextUmbral.min_compliance)
        ) {

          if (umbral.color && colorMap[umbral.color]) {
            return colorMap[umbral.color];
          }

          if (umbral.min_compliance >= 85 && umbral.min_compliance < 90) {
            return red[300];
          } else if (
            umbral.min_compliance >= 90 &&
            umbral.min_compliance < 95
          ) {
            return pink[300];
          } else if (
            umbral.min_compliance >= 95 &&
            umbral.min_compliance < 100
          ) {
            return orange[600];
          } else if (
            umbral.min_compliance >= 100 &&
            umbral.min_compliance < 110
          ) {
            return blue[600];
          } else {
            return green[600];
          }
        }
      }

      return grey[600];
    };

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
