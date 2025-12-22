import React from "react";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import { TopSellersByRoleChart } from "./charts/TopSellersByRoleChart";
import { CommissionDistributionChart } from "./charts/CommissionDistributionChart";
import { MesResumen } from "../types";

interface ChartsProps {
  mesResumen: MesResumen | null;
  esUnaSolaTienda?: boolean;
}

export const Charts: React.FC<ChartsProps> = ({
  mesResumen,
  esUnaSolaTienda = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        p: 2,
      }}
    >
      {/* Título de la sección */}
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Typography
          variant="h4"
          component="h2"
          fontWeight="bold"
          color="primary"
          sx={{
            background: "linear-gradient(45deg, #2196F3, #21CBF3)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 1,
          }}
        >
          Análisis de Comisiones
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visualización detallada del rendimiento por roles, tiendas y
          vendedores
        </Typography>
      </Box>

      {/* Grid responsivo para los gráficos */}
      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 2 : 3,
        }}
      >
        {/* Gráfico 1: Top 5 por Rol */}
        <Box
          sx={{
            width: isMobile ? "100%" : "50%",
            minHeight: isMobile ? 400 : 450,
          }}
        >
          <TopSellersByRoleChart mesResumen={mesResumen} />
        </Box>

        {/* Gráfico 2: Distribución de Comisiones */}
        <Box
          sx={{
            width: isMobile ? "100%" : "50%",
            minHeight: isMobile ? 400 : 450,
          }}
        >
          <CommissionDistributionChart
            mesResumen={mesResumen}
            esUnaSolaTienda={esUnaSolaTienda}
          />
        </Box>
      </Box>
    </Box>
  );
};
