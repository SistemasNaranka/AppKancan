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
  Modal,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
} from "@mui/material";
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  AccessTime as ClockIcon,
  AutoAwesomeMosaic as AutoAwesomeMosaicICon,
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  SettingsSuggest as SettingsSuggestIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  Speed as SpeedIcon,
  ShowChart as ShowChartIcon,
  Close as CloseIcon,
  AutoMode as AutoModeIcon,
  CalendarToday as CalendarTodayIcon,
  DateRange as DateRangeIcon,
} from "@mui/icons-material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
import { formatTiempo, calcularMetricasProyecto } from "../lib/calculos";
import {
  useProyectos,
  getEstadoColor,
  getEstadoLabel,
} from "../hooks/useProyectos";
import type {
  Proyecto,
  MetricasProyecto,
  EstadoProyecto,
} from "../types";
import { ProjectStatusIcon } from "../components/ProjectStatusIcon";

interface MetricasTotales {
  totalAhorroMensual: number;
  totalAhorroAnual: number;
}

// ─── Animaciones tabs ─────────────────────────────────────────────────────────
const tabPulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;
const tabFadeIn = keyframes`
  from { opacity: 0.8; transform: translateY(1px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ─── Styled ───────────────────────────────────────────────────────────────────
const TabContainer = styled(Box)({
  display: "inline-flex",
  backgroundColor: "#f3f4f6",
  borderRadius: 12,
  padding: 4,
  gap: 4,
});

const AnimatedTab = styled(Box, {
  shouldForwardProp: (p) => p !== "isActive" && p !== "isFirst" && p !== "isLast",
})<{ isActive: boolean; isFirst: boolean; isLast: boolean }>(({ isActive }) => ({
  padding: "8px 16px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.875rem",
  borderRadius: 10,
  backgroundColor: isActive ? "white" : "transparent",
  color: isActive ? "#1976d2" : "#6b7280",
  boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
  minWidth: 80,
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  transform: isActive ? "scale(1)" : "scale(0.95)",
  animation: isActive ? `${tabPulse} 0.3s ease-out, ${tabFadeIn} 0.2s ease-out` : "none",
  "&:hover": {
    backgroundColor: isActive ? "white" : "rgba(25,118,210,0.06)",
    color: isActive ? "#1976d2" : "#374151",
    transform: isActive ? "scale(1.02)" : "scale(1)",
  },
  "&:active": { transform: "scale(0.98)" },
}));

// ─── Panel de Ahorro (Modal) ──────────────────────────────────────────────────
interface AhorroPanelProps {
  open: boolean;
  onClose: () => void;
  tipo: "mensual" | "anual";
  total: number;
  proyectos: Proyecto[];
}

function AhorroPanel({ open, onClose, tipo, total, proyectos }: AhorroPanelProps) {
  const esMensual = tipo === "mensual";
  const label     = esMensual ? "Ahorro Mensual" : "Ahorro Anual";
  const color     = "#34a853";
  const bgColor   = "#e6f4ea";

  // Estados para los accordions
  const [metricasExpanded, setMetricasExpanded] = useState(true);
  const [graficosExpanded, setGraficosExpanded] = useState(false);

  // Desglose por proyecto
  const desglose = proyectos
    .map((p) => {
      const m = calcularMetricasProyecto(p.procesos ?? []);
      return {
        nombre:   p.nombre,
        estado:   p.estado,
        ahorro:   esMensual ? m.ahorro_total_mensual : m.ahorro_total_anual,
        mensual:  m.ahorro_total_mensual,
        anual:    m.ahorro_total_anual,
        procesos: p.procesos ?? [],
      };
    })
    .sort((a, b) => b.ahorro - a.ahorro);

  const conAhorro  = desglose.filter((d) => d.ahorro > 0);
  const sinAhorro  = desglose.filter((d) => d.ahorro === 0);
  const promedio   = conAhorro.length > 0 ? Math.round(total / conAhorro.length) : 0;
  const maxAhorro  = conAhorro[0]?.ahorro ?? 0;

  // Preparar datos para el gráfico de comparación Manual vs Sistema
  const datosGraficoProcesos = proyectos.flatMap((p) =>
    (p.procesos ?? []).map((proceso) => ({
      proyecto: p.nombre,
      nombre: proceso.nombre,
      tiempoAntes: proceso.tiempo_antes,
      tiempoDespues: proceso.tiempo_despues,
    }))
  ).slice(0, 10); // Limitar a 10 procesos para mejor visualización

  const chartData = {
    labels: datosGraficoProcesos.map((d) => d.nombre.length > 15 ? d.nombre.substring(0, 15) + "..." : d.nombre),
    datasets: [
      {
        label: "Manual (Antes)",
        data: datosGraficoProcesos.map((d) => d.tiempoAntes),
        backgroundColor: "#e53935", // Rojo
        borderColor: "#c62828",
        borderWidth: 1,
      },
      {
        label: "Sistema (Ahora)",
        data: datosGraficoProcesos.map((d) => d.tiempoDespues),
        backgroundColor: "#43a047", // Verde
        borderColor: "#2e7d32",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.raw} seg`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Tiempo (segundos)",
        },
      },
    },
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "95vw", sm: "85vw", md: 1000 },
          maxHeight: "88vh",
          overflowY: "auto",
          bgcolor: "transparent",
          outline: "none",
          borderRadius: 3,
        }}
      >
        {/* ── Header del panel ── */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: "12px 12px 0 0",
            background: "#004680",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ p: 1.25, bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2, display: "flex" }}>
              {esMensual
                ? <CalendarTodayIcon sx={{ fontSize: 28 }} />
                : <DateRangeIcon    sx={{ fontSize: 28 }} />
              }
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                {label}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.15)" } }}>
            <CloseIcon />
          </IconButton>
        </Paper>

        {/* ── Cuerpo ── */}
        <Paper elevation={3} sx={{ 
              borderRadius: "12px 12px 0px 0px", 
              p: 2.5, 
              display: "flex", 
              flexDirection: "column", 
              gap: 1.5, 
              bgcolor: "#fff" }}>

          {/* ── Accordion 1: Métricas de Ahorro ── */}
          <Accordion 
            expanded={metricasExpanded}
            onChange={() => setMetricasExpanded(!metricasExpanded)} 
            elevation={0} 
            sx={{ 
              borderRadius: "12px !important",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "none",
              overflow: "hidden",
              bgcolor: "white",
              mt: 2,
              "&:before": { display: "none" },
              "&.Mui-expanded": { margin: "8px 0 0 0" },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: "#1a2a3a" }} />}
              sx={{ 
                bgcolor: "#f1f3f4", 
                "&:hover": { 
                  bgcolor: "#f8f9fa" 
                } }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <SpeedIcon sx={{ color: "#004680", fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#1a2b45" }}>
                  Métricas de Ahorro
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
                {[
                  { label: esMensual ? "Ahorro Mensual" : "Ahorro Anual", value: formatTiempo(total), sub: esMensual ? "este mes" : "este año" },
                  { label: "Promedio",           value: formatTiempo(promedio),    sub: "por proyecto" },
                  { label: "Proyectos con ahorro", value: conAhorro.length,        sub: `de ${desglose.length} totales` },
                  { label: "Mayor ahorro",       value: formatTiempo(maxAhorro),   sub: conAhorro[0]?.nombre ?? "—" },
                ].map((item, i) => (
                  <Paper key={i} sx={{ p: 2, bgcolor: "#EBF9EF", textAlign: "center", borderRadius: 3, boxShadow: "none" }}>
                    <Typography variant="body2" sx={{ color: "success.dark" }}>
                      {item.label}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: "bold", color: "success.dark" }}>
                      {item.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {item.sub}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* ── Accordion 2: Gráficos Comparativos ── */}
          <Accordion 
            expanded={graficosExpanded}
            onChange={() => setGraficosExpanded(!graficosExpanded)}
            disableGutters 
            elevation={0} 
            sx={{ 
              "&:before": { display: "none" },
              borderRadius: "12px !important",
              border: "1px solid #cecece",
              overflow: "hidden",
              bgcolor: "white",
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: "#1a2a3a" }} />}
              sx={{ 
                 bgcolor: "#f1f3f4", 
                 "&:hover": { bgcolor: "#f8f9fa" 
                 } }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ShowChartIcon sx={{ color: "#004680", fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#1a2b45" }}>
                  Gráficos Comparativos
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
              {conAhorro.length === 0 ? (
                <Typography variant="body2" sx={{ color: "text.disabled", textAlign: "center", py: 2 }}>
                  No hay datos para mostrar
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {/* Gráfico de comparación Manual vs Sistema */}
                  {datosGraficoProcesos.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5, display: "block" }}>
                        Reducción de Tiempo por Tarea (segundos)
                      </Typography>
                      <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}>
                        <Box sx={{ height: 300 }}>
                          <Bar data={chartData} options={chartOptions} />
                        </Box>
                      </Paper>
                    </Box>
                  )}

                  {/* Comparativo Mensual vs Anual */}
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5, display: "block" }}>
                      Mensual vs Anual por proyecto
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {desglose.filter((d) => d.mensual > 0).map((item, i) => {
                        const maxVal     = Math.max(...desglose.map((d) => d.anual));
                        const pctMensual = maxVal > 0 ? (item.mensual / maxVal) * 100 : 0;
                        const pctAnual   = maxVal > 0 ? (item.anual   / maxVal) * 100 : 0;
                        return (
                          <Box key={i} sx={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 1.5, alignItems: "center" }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#374151" }}>
                              {item.nombre}
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                              {/* Barra mensual */}
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box sx={{ flex: 1, height: 8, bgcolor: "#e0e0e0", borderRadius: 2, overflow: "hidden" }}>
                                  <Box sx={{ height: "100%", width: `${pctMensual}%`, bgcolor: "#34a853", borderRadius: 2, transition: "width 0.6s ease" }} />
                                </Box>
                                <Typography variant="caption" sx={{ color: "#34a853", fontWeight: 600, minWidth: 50, textAlign: "right" }}>
                                  {formatTiempo(item.mensual)}
                                </Typography>
                              </Box>
                              {/* Barra anual */}
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box sx={{ flex: 1, height: 8, bgcolor: "#e0e0e0", borderRadius: 2, overflow: "hidden" }}>
                                  <Box sx={{ height: "100%", width: `${pctAnual}%`, bgcolor: "#1976d2", borderRadius: 2, transition: "width 0.6s ease" }} />
                                </Box>
                                <Typography variant="caption" sx={{ color: "#1976d2", fontWeight: 600, minWidth: 50, textAlign: "right" }}>
                                  {formatTiempo(item.anual)}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                    {/* Leyenda */}
                    <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Box sx={{ width: 12, height: 8, bgcolor: "#34a853", borderRadius: 1 }} />
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>Mensual</Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Box sx={{ width: 12, height: 8, bgcolor: "#1976d2", borderRadius: 1 }} />
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>Anual</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

        </Paper>
      </Box>
    </Modal>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { proyectos, loading, error, recargar } = useProyectos();
  const [filtroEstado, setFiltroEstado] = useState<EstadoProyecto | "todos">("todos");
  const [panelAbierto, setPanelAbierto] = useState<"mensual" | "anual" | null>(null);

  const proyectosFiltrados: Proyecto[] =
    filtroEstado === "todos"
      ? proyectos
      : proyectos.filter((p: Proyecto) => p.estado === filtroEstado);

  const metricasTotales: MetricasTotales =
    proyectosFiltrados.reduce<MetricasTotales>(
      (acc, proyecto) => {
        const metricas = calcularMetricasProyecto(proyecto.procesos ?? []);
        return {
          totalAhorroMensual: acc.totalAhorroMensual + metricas.ahorro_total_mensual,
          totalAhorroAnual:   acc.totalAhorroAnual   + metricas.ahorro_total_anual,
        };
      },
      { totalAhorroMensual: 0, totalAhorroAnual: 0 }
    );

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress color="primary" />
          <Typography sx={{ mt: 2, color: "text.secondary" }}>Cargando proyectos...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ color: "error.main", fontSize: 18 }}>{error}</Typography>
          <Button variant="contained" onClick={recargar} sx={{ mt: 2 }}>Reintentar</Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ paddingX: 3, paddingY: 3, minHeight: "100vh", backgroundColor: "transparent", width: "100%" }}>

      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          px: 3,
          py: 2,
          borderRadius: 3,
          backgroundColor: "white",
          border: "1px solid #e8eaed",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <SettingsSuggestIcon sx={{ color: "#004680", fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1a2a3ae0", fontSize: 20 }}>
              Gestión de Proyectos - Área de Sistemas
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Registro y seguimiento de proyectos desarrollados por el área de sistemas
          </Typography>
        </Box>
        <Button
          sx={{ backgroundColor: "#004680", boxShadow: "none", "&:hover": { backgroundColor: "#005AA3", boxShadow: "none" } }}
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/gestion_proyectos/nuevo")}
        >
          Nuevo Proyecto
        </Button>
      </Paper>

      {/* Tarjetas de Resumen */}
      <Grid container spacing={2} sx={{ mb: 3 }}>

        {/* Total Proyectos */}
        <Grid size={{ xs: 12, sm: 6, md: "auto" }}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e8eaed", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ backgroundColor: "#e8f0fe", borderRadius: 2, p: 1.25, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AutoAwesomeMosaicICon sx={{ color: "#1a73e8", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>Total Proyectos</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "text.primary", lineHeight: 1.2 }}>
                  {proyectosFiltrados.length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* En Seguimiento */}
        <Grid size={{ xs: 12, sm: 6, md: "auto" }}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e8eaed", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ backgroundColor: "#fef3e2", borderRadius: 2, p: 1.25, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarIcon sx={{ color: "#f9ab00", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>En Seguimiento</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "warning.main", lineHeight: 1.2 }}>
                  {proyectosFiltrados.filter((p: Proyecto) => p.estado === "en_seguimiento").length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* En Progreso */}
        <Grid size={{ xs: 12, sm: 6, md: "auto" }}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e8eaed", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ backgroundColor: "#e8f0fe", borderRadius: 2, p: 1.25, display: "flex", justifyContent: "center" }}>
                <ClockIcon sx={{ color: "#1a73e8", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>En Progreso</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1a73e8", lineHeight: 1.2 }}>
                  {proyectosFiltrados.filter((p: Proyecto) => p.estado === "en_proceso").length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Entregados */}
        <Grid size={{ xs: 12, sm: 6, md: "auto" }}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e8eaed", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ backgroundColor: "#e8f5e9", borderRadius: 2, p: 1.25, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckIcon sx={{ color: "#2e7d32", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>Entregados</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "#2e7d32", lineHeight: 1.2 }}>
                  {proyectosFiltrados.filter((p: Proyecto) => p.estado === "entregado").length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* ── Ahorro Mensual ── */}
        <Grid size={{ xs: 12, sm: 6, md: "auto" }}>
          <Paper
            elevation={0}
            onClick={() => setPanelAbierto("mensual")}
            sx={{
              p: 2,
              border: "1px solid #ede8e8",
              borderRadius: 2,
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": { border: "1px solid #34a853", boxShadow: "0 4px 12px rgba(52,168,83,0.15)", transform: "translateY(-1px)" },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ backgroundColor: "#e6f4ea", borderRadius: 2, p: 1.25, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarTodayIcon sx={{ color: "#34a853", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>Ahorro Mensual</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "#34a853", lineHeight: 1.2 }}>
                  {formatTiempo(metricasTotales.totalAhorroMensual)}
                </Typography>
              </Box>
              <TrendingUpIcon sx={{ color: "#c8e6c9", fontSize: 20, ml: 1 }} />
            </Box>
          </Paper>
        </Grid>

        {/* ── Ahorro Anual ── */}
        <Grid size={{ xs: 12, sm: 6, md: "auto" }}>
          <Paper
            elevation={0}
            onClick={() => setPanelAbierto("anual")}
            sx={{
              p: 2,
              border: "1px solid #e8eaed",
              borderRadius: 2,
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": { border: "1px solid #1976d2", boxShadow: "0 4px 12px rgba(25,118,210,0.15)", transform: "translateY(-1px)" },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ backgroundColor: "#e3f2fd", borderRadius: 2, p: 1.25, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DateRangeIcon sx={{ color: "#1976d2", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>Ahorro Anual</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1976d2", lineHeight: 1.2 }}>
                  {formatTiempo(metricasTotales.totalAhorroAnual)}
                </Typography>
              </Box>
              <TrendingUpIcon sx={{ color: "#bbdefb", fontSize: 20, ml: 1 }} />
            </Box>
          </Paper>
        </Grid>

      </Grid>

      {/* Filtros */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <TabContainer>
          {[
            { id: "todos",          label: "Todos" },
            { id: "en_proceso",     label: "En Proceso" },
            { id: "entregado",      label: "Entregado" },
            { id: "en_seguimiento", label: "En Seguimiento" },
          ].map((tab, index) => {
            const isActive = filtroEstado === tab.id;
            return (
              <AnimatedTab
                key={tab.id}
                isActive={isActive}
                isFirst={index === 0}
                isLast={index === 3}
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
      </Box>

      {/* Grid de Proyectos */}
      {proyectosFiltrados.length === 0 ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <Typography sx={{ color: "text.secondary", fontSize: 18 }}>No hay proyectos registrados</Typography>
          <Typography variant="body2" sx={{ color: "text.disabled", mt: 1 }}>Los proyectos que crees aparecerán aquí</Typography>
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
                  <Box sx={{ width: 64, height: 64, borderRadius: 2, backgroundColor: estadoColor.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ProjectStatusIcon status={proyecto.estado} size={36} color={estadoColor.text} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, textAlign: "center", color: "text.primary", fontSize: "1rem", lineHeight: 1.3 }}>
                    {proyecto.nombre}
                  </Typography>
                  <Chip
                    label={getEstadoLabel(proyecto.estado)}
                    size="small"
                    sx={{ fontSize: 11, fontWeight: "bold", backgroundColor: estadoColor.bg, color: estadoColor.text, border: `1px solid ${estadoColor.text}30` }}
                  />
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── Modal de Ahorro ── */}
      <AhorroPanel
        open={panelAbierto !== null}
        onClose={() => setPanelAbierto(null)}
        tipo={panelAbierto ?? "mensual"}
        total={panelAbierto === "mensual" ? metricasTotales.totalAhorroMensual : metricasTotales.totalAhorroAnual}
        proyectos={proyectosFiltrados}
      />

    </Box>
  );
};

export default Home;