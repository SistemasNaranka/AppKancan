// src/apps/gestion_proyectos/pages/Home.tsx

import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Chip,
  styled,
  keyframes,
} from "@mui/material";
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  AccessTime as ClockIcon,
  AutoAwesomeMosaic as AutoAwesomeMosaicICon,
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { formatTiempo, calcularMetricasProyecto } from "../lib/calculos";
import {
  useProyectos,
  getEstadoColor,
  getEstadoLabel,
} from "../hooks/useProyectos";
import type {
  Proyecto,
  Encargado,
  Proceso,
  MetricasProyecto,
  EstadoProyecto,
} from "../types";

interface MetricasTotales {
  totalAhorroMensual: number;
  totalAhorroAnual: number;
}

// Configuración de animaciones para tabs animados
const tabPulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

const tabFadeIn = keyframes`
  from { opacity: 0.8; transform: translateY(1px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled components para tabs animados
const TabContainer = styled(Box)({
  display: "inline-flex",
  backgroundColor: "#f3f4f6",
  borderRadius: 12,
  padding: 4,
  gap: 4,
  position: "relative",
  overflow: "hidden",
});

const AnimatedTab = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "isActive" && prop !== "isFirst" && prop !== "isLast",
})<{ isActive: boolean; isFirst: boolean; isLast: boolean }>(
  ({ isActive, isFirst, isLast }) => ({
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.875rem",
    borderRadius: isFirst ? 10 : isLast ? 10 : 6,
    backgroundColor: isActive ? "white" : "transparent",
    color: isActive ? "#1976d2" : "#6b7280",
    boxShadow: isActive
      ? "0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)"
      : "none",
    minWidth: 80,
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    transform: isActive ? "scale(1)" : "scale(0.95)",
    animation: isActive
      ? `${tabPulse} 0.3s ease-out, ${tabFadeIn} 0.2s ease-out`
      : "none",
    "&:hover": {
      backgroundColor: isActive ? "white" : "rgba(25, 118, 210, 0.06)",
      color: isActive ? "#1976d2" : "#374151",
      transform: isActive ? "scale(1.02)" : "scale(1)",
    },
    "&:focus-visible": {
      outline: "2px solid #1976d2",
      outlineOffset: 2,
    },
    "&:active": {
      transform: "scale(0.98)",
    },
  })
);

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Página principal del módulo de Gestión de Proyectos
 */
const Home: React.FC = () => {
  const navigate = useNavigate();
  const { proyectos, loading, error, recargar } = useProyectos();
  const [filtroEstado, setFiltroEstado] = useState<EstadoProyecto | "todos">("todos");

  // Filtrar proyectos
  const proyectosFiltrados: Proyecto[] =
    filtroEstado === "todos"
      ? proyectos
      : proyectos.filter((p: Proyecto) => p.estado === filtroEstado);

  // Calcular métricas totales
  const metricasTotales: MetricasTotales =
    proyectosFiltrados.reduce<MetricasTotales>(
      (acc: MetricasTotales, proyecto: Proyecto) => {
        const metricas: MetricasProyecto = calcularMetricasProyecto(
          proyecto.procesos ?? []
        );
        return {
          totalAhorroMensual:
            acc.totalAhorroMensual + metricas.ahorro_total_mensual,
          totalAhorroAnual: acc.totalAhorroAnual + metricas.ahorro_total_anual,
        };
      },
      { totalAhorroMensual: 0, totalAhorroAnual: 0 }
    );

  // ─── Estados de carga / error ──────────────────────────────────────────────

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 256,
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress color="primary" />
          <Typography sx={{ mt: 2, color: "text.secondary" }}>
            Cargando proyectos...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 256,
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ color: "error.main", fontSize: 18 }}>
            {error}
          </Typography>
          <Button variant="contained" onClick={recargar} sx={{ mt: 2 }}>
            Reintentar
          </Button>
        </Box>
      </Box>
    );
  }

  // ─── Render principal ──────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        paddingX: 3,
        paddingY: 3,
        minHeight: "100vh",
        backgroundColor: "transparent",
        width: "100%",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", color: "#1a2a3ae0", fontSize: 20 }}
          >
            Gestión de Proyectos - Área de Sistemas
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Registro y seguimiento de proyectos desarrollados por el área de
            sistemas
          </Typography>
        </Box>
        <Button
          sx={{
            backgroundColor: "#004680",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#005AA3",
              boxShadow: "none",
            }
          }}

          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/gestion_proyectos/nuevo")}
        >
          Nuevo Proyecto
        </Button>
      </Box>

      {/* Tarjetas de Resumen */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Total Proyectos */}
        <Grid size={{ xs: 12, sm: 6, md: "auto" }}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e8eaed", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{
                backgroundColor: "#e8f0fe",
                borderRadius: 2,
                p: 1.25,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <AutoAwesomeMosaicICon sx={{ color: "#1a73e8", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Total Proyectos
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "text.primary", lineHeight: 1.2 }}>
                  {proyectosFiltrados.length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* En Planning */}
        <Grid size={{ xs: 12, sm: 6, md: "auto" }}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e8eaed", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{
                backgroundColor: "#fef3e2",
                borderRadius: 2,
                p: 1.25,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <CalendarIcon sx={{ color: "#f9ab00", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  En Seguimiento
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "warning.main", lineHeight: 1.2 }}>
                  {proyectosFiltrados.filter((p: Proyecto) => p.estado === "en_proceso").length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* En Progreso */}
        <Grid size={{ xs: 12, sm: 6, md: "auto" }}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e8eaed", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{
                backgroundColor: "#e8f0fe",
                borderRadius: 2,
                p: 1.25,
                display: "flex",
                justifyContent: "center",
              }}>
                <ClockIcon sx={{ color: "#1a73e8", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  En Progreso
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1a73e8", lineHeight: 1.2 }}>
                  {proyectosFiltrados.filter((p: Proyecto) => p.estado === "en_proceso").length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Ahorro Mensual */}
        <Grid size={{ xs: 12, sm: 6, md: "auto" }}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e8eaed", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{
                backgroundColor: "#e6f4ea",
                borderRadius: 2,
                p: 1.25,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <TrendingUpIcon sx={{ color: "#34a853", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Ahorro Mensual
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "success.main", lineHeight: 1.2 }}>
                  {formatTiempo(metricasTotales.totalAhorroMensual)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* ── Quinta tarjeta: llena el espacio restante en la misma fila ── */}
        <Grid size={{ xs: 12, sm: 6, md: "auto", }}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e8eaed", borderRadius: 2, height: "100%", width: "auto",}}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{
                backgroundColor: "#e6f4ea",
                borderRadius: 2,
                p: 1.25,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <TrendingUpIcon sx={{ color: "#34a853", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Ahorro Mensual
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "success.main", lineHeight: 1.2 }}>
                  {formatTiempo(metricasTotales.totalAhorroMensual)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Box
        sx={{ 
          display: "flex", 
          gap: 2, 
          mb: 3, 
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        {/* Animated Tabs */}
        <TabContainer>
          {[
            { id: "todos", label: "Todos" },
            { id: "en_proceso", label: "En Proceso" },
            { id: "entregado", label: "Entregado" },
            { id: "en_seguimiento", label: "En Seguimiento" },
          ].map((tab, index) => {
            const isFirst = index === 0;
            const isLast = index === 3;
            const isActive = filtroEstado === tab.id;

            return (
              <AnimatedTab
                key={tab.id}
                isActive={isActive}
                isFirst={isFirst}
                isLast={isLast}
                onClick={() => setFiltroEstado(tab.id as typeof filtroEstado)}
                tabIndex={0}
                role="tab"
                aria-selected={isActive}
              >
                {tab.label}
              </AnimatedTab>
            );
          })}
        </TabContainer>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={recargar}
          sx={{
            textTransform: "none",
            fontWeight: 500,
          }}
        >
          Actualizar
        </Button>
      </Box>

      {/* Grid de Proyectos */}
      {proyectosFiltrados.length === 0 ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <Typography sx={{ color: "text.secondary", fontSize: 18 }}>
            No hay proyectos registrados
          </Typography>
          <Typography variant="body2" sx={{ color: "text.disabled", mt: 1 }}>
            Los proyectos que crees aparecerán aquí
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {proyectosFiltrados.map((proyecto: Proyecto) => {
            const estadoColor = getEstadoColor(proyecto.estado);
            
            return (
              <Grid key={proyecto.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Paper
                  elevation={0}
                  onClick={() => navigate(`/gestion_proyectos/${proyecto.id}`)}
                  sx={{
                    cursor: "pointer",
                    border: `2px solid ${estadoColor.bg}`,
                    borderRadius: 3,
                    p: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                    transition: "all 0.2s ease",
                    backgroundColor: "white",
                    "&:hover": {
                      boxShadow: `0 4px 12px ${estadoColor.bg}40`,
                      transform: "translateY(-2px)",
                      borderColor: estadoColor.text,
                    },
                  }}
                >
                  {/* Ícono o inicial del proyecto */}
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 2,
                      backgroundColor: estadoColor.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AutoAwesomeMosaicICon 
                      sx={{ 
                        fontSize: 36, 
                        color: estadoColor.text,
                      }} 
                    />
                  </Box>

                  {/* Nombre del proyecto */}
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      textAlign: "center",
                      color: "text.primary",
                      fontSize: "1rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {proyecto.nombre}
                  </Typography>

                  {/* Badge de estado */}
                  <Chip
                    label={getEstadoLabel(proyecto.estado)}
                    size="small"
                    sx={{
                      fontSize: 11,
                      fontWeight: "bold",
                      backgroundColor: estadoColor.bg,
                      color: estadoColor.text,
                      border: `1px solid ${estadoColor.text}30`,
                    }}
                  />
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default Home;