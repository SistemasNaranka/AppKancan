// src/apps/gestion_proyectos/pages/Home.tsx
 
import React, { useState, useMemo } from "react";
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
  ToggleButton,
  ToggleButtonGroup,
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
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
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
import { PieChart } from "@mui/x-charts/PieChart";
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
  vistaGrafico?: "mensual" | "anual";
}

function AhorroPanel({ open, onClose, tipo, total, proyectos, vistaGrafico }: AhorroPanelProps) {
  const esMensual = tipo === "mensual";
  const label     = esMensual ? "Ahorro Mensual" : "Ahorro Anual";
  const color     = "#34a853";
  const bgColor   = "#e6f4ea";

  // Estado para el mes/año seleccionado (solo para vista mensual)
  const fechaActual = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState<{ mes: number; año: number }>({
    mes: fechaActual.getMonth(),
    año: fechaActual.getFullYear(),
  });

  // Estado para la vista de gráficos (mensual o anual)
  // Por defecto, la vista de gráficos coincide con el tipo de panel abierto
  const [vistaGraficos, setVistaGraficos] = useState<"mensual" | "anual">(tipo);

  // Estado para la unidad de tiempo en los gráficos (segundos, minutos, horas)
  const [unidadTiempo, setUnidadTiempo] = useState<"segundos" | "minutos" | "horas">("horas");

  // Función para convertir segundos a la unidad seleccionada
  const convertirTiempo = (segundos: number): number => {
    switch (unidadTiempo) {
      case "segundos":
        return segundos;
      case "minutos":
        return Math.round(segundos / 60 * 100) / 100;
      case "horas":
        return Math.round(segundos / 3600 * 100) / 100;
      default:
        return segundos;
    }
  };

  // Función para formatear el label de la unidad de tiempo
  const getUnidadLabel = (): string => {
    switch (unidadTiempo) {
      case "segundos":
        return "seg";
      case "minutos":
        return "min";
      case "horas":
        return "hrs";
      default:
        return "seg";
    }
  };

  // Nombres de meses
  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Funciones de navegación
  const mesAnterior = () => {
    if (mesSeleccionado.mes === 0) {
      setMesSeleccionado({ mes: 11, año: mesSeleccionado.año - 1 });
    } else {
      setMesSeleccionado({ mes: mesSeleccionado.mes - 1, año: mesSeleccionado.año });
    }
  };

  const mesSiguiente = () => {
    const ahora = new Date();
    if (mesSeleccionado.año < ahora.getFullYear() || 
        (mesSeleccionado.año === ahora.getFullYear() && mesSeleccionado.mes < ahora.getMonth())) {
      if (mesSeleccionado.mes === 11) {
        setMesSeleccionado({ mes: 0, año: mesSeleccionado.año + 1 });
      } else {
        setMesSeleccionado({ mes: mesSeleccionado.mes + 1, año: mesSeleccionado.año });
      }
    }
  };

  const esMesActual = () => {
    const ahora = new Date();
    return mesSeleccionado.mes === ahora.getMonth() && mesSeleccionado.año === ahora.getFullYear();
  };

  const esMesAnteriorMinimo = () => {
    // Permitir navegar hasta 12 meses atrás desde el actual
    const ahora = new Date();
    const mesMinimo = new Date(ahora.getFullYear(), ahora.getMonth() - 12, 1);
    const fechaSeleccionada = new Date(mesSeleccionado.año, mesSeleccionado.mes, 1);
    return fechaSeleccionada <= mesMinimo;
  };

  // Estados para los accordions
  const [metricasExpanded, setMetricasExpanded] = useState(true);
  const [graficosExpanded, setGraficosExpanded] = useState(false);

  // Desglose por proyecto - usa esMensual para determinar el tipo de datos a mostrar
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

  // Preparar datos para el gráfico de comparación Manual vs Sistema por Área Beneficiada
  // Los datos dependen del tipo (mensual vs anual) seleccionado en el panel
  const datosGraficoArea = React.useMemo(() => {
    // Áreas predefinidas que siempre deben mostrarse
    const AREAS_PREDEFINIDAS = [
      "Contabilidad",
      "Recursos Humanos",
      "Logística",
      "Diseño",
      "Sistemas",
      "Mercadeo",
      "Comercial"
    ];

    // Inicializar mapa con todas las áreas predefinidas con valores en cero
    const areasAgrupadas = new Map<string, {
      nombreArea: string;
      proyectos: Array<{ nombre: string; tiempoAntes: number; tiempoDespues: number }>;
      tiempoAntes: number;
      tiempoDespues: number;
    }>();

    // Inicializar todas las áreas con cero
    AREAS_PREDEFINIDAS.forEach(area => {
      areasAgrupadas.set(area, {
        nombreArea: area,
        proyectos: [],
        tiempoAntes: 0,
        tiempoDespues: 0
      });
    });

    // Agrupar proyectos por área beneficiada
    proyectos.forEach((proyecto) => {
      const area = proyecto.area_beneficiada || "Sin área";
      
      // Calcular métricas del proyecto
      const m = calcularMetricasProyecto(proyecto.procesos ?? []);
      
      // Determinar tiempos según el tipo de vista
      let tiempoAntes: number;
      let tiempoDespues: number;
      
      if (esMensual) {
        // Para vista mensual: usar tiempos por ejecución (no anualizados)
        let tAntes = 0;
        let tDespues = 0;
        (proyecto.procesos ?? []).forEach((proceso) => {
          tAntes += Number(proceso.tiempo_antes) || 0;
          tDespues += Number(proceso.tiempo_despues) || 0;
        });
        tiempoAntes = tAntes;
        tiempoDespues = tDespues;
      } else {
        // Para vista anual: usar los totales anualizados directamente
        // ahorro_total_anual = tiempo ahorrado por año
        // Por lo tanto, tiempoAntes = ahorro_total_anual + tiempoDespués (el tiempo que toma ahora en un año)
        // O simplemente usamos el ahorro_total como comparación
        tiempoAntes = m.ahorro_total_anual + m.ahorro_total_mensual * 11; // Estimación
        tiempoDespues = m.ahorro_total_mensual * 11; // Tiempo que tomaría en 11 meses
      }

      // Solo agregar si el área está en las predefinidas
      if (areasAgrupadas.has(area)) {
        const areaData = areasAgrupadas.get(area)!;
        areaData.proyectos.push({
          nombre: proyecto.nombre,
          tiempoAntes,
          tiempoDespues
        });
        areaData.tiempoAntes += tiempoAntes;
        areaData.tiempoDespues += tiempoDespues;
      }
    });

    // Convertir a array con todas las áreas predefinidas
    return Array.from(areasAgrupadas.values()).map((area) => ({
      nombreArea: area.nombreArea,
      proyecto: area.proyectos.map(p => p.nombre).join(", ") || "Sin proyectos",
      tiempoAntes: area.tiempoAntes,
      tiempoDespues: area.tiempoDespues,
    }));
  }, [proyectos, esMensual]);

  const chartData = {
    labels: datosGraficoArea.map((d) => d.nombreArea.length > 15 ? d.nombreArea.substring(0, 15) + "..." : d.nombreArea),
    datasets: [
      {
        label: "Manual (Antes)",
        data: datosGraficoArea.map((d) => convertirTiempo(d.tiempoAntes)),
        backgroundColor: "#e53935", // Rojo
        borderColor: "#c62828",
        borderWidth: 1,
      },
      {
        label: "Sistema (Ahora)",
        data: datosGraficoArea.map((d) => convertirTiempo(d.tiempoDespues)),
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
            return `${context.dataset.label}: ${context.raw} ${getUnidadLabel()}`;
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
          text: `Tiempo (${getUnidadLabel()})`,
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
              {/* Control de navegación de mes/año - solo para vista mensual */}
              {esMensual && (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mb: 3 }}>
                  <IconButton 
                    onClick={mesAnterior} 
                    disabled={esMesAnteriorMinimo()}
                    sx={{ color: "#004680" }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, minWidth: 180, textAlign: "center" }}>
                    {nombresMeses[mesSeleccionado.mes]} {mesSeleccionado.año}
                  </Typography>
                  <IconButton 
                    onClick={mesSiguiente} 
                    disabled={esMesActual()}
                    sx={{ color: "#004680" }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </Box>
              )}


              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
                {[
                  { 
                    label: vistaGraficos === "mensual" ? "Ahorro Mensual" : "Ahorro Anual", 
                    value: formatTiempo(total), 
                    sub: vistaGraficos === "mensual" ? `${nombresMeses[mesSeleccionado.mes]} ${mesSeleccionado.año}` : `${mesSeleccionado.año}` 
                  },
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
              {/* Selector de unidad de tiempo */}
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <ToggleButtonGroup
                  value={unidadTiempo}
                  exclusive
                  onChange={(event, newValue) => {
                    if (newValue !== null) {
                      setUnidadTiempo(newValue);
                    }
                  }}
                  size="small"
                  sx={{
                    "& .MuiToggleButton-root": {
                      px: 2,
                      py: 0.5,
                      fontSize: "0.75rem",
                      textTransform: "none",
                      border: "1px solid #e0e0e0",
                      "&.Mui-selected": {
                        backgroundColor: "#004680",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "#003d66",
                        },
                      },
                    },
                  }}
                >
                  <ToggleButton value="segundos">Segundos</ToggleButton>
                  <ToggleButton value="minutos">Minutos</ToggleButton>
                  <ToggleButton value="horas">Horas</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              {conAhorro.length === 0 ? (
                <Typography variant="body2" sx={{ color: "text.disabled", textAlign: "center", py: 2 }}>
                  No hay datos para mostrar
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {/* Gráfico de comparación contextual según vistaGraficos */}
                  {datosGraficoArea.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5, display: "block" }}>
                        {vistaGraficos === "mensual" 
                          ? `Reducción de Tiempo por Área - ${nombresMeses[mesSeleccionado.mes]} ${mesSeleccionado.año}`
                          : `Reducción de Tiempo por Área - Año ${mesSeleccionado.año}`}
                        (segundos)
                      </Typography>
                      <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}>
                        <Box sx={{ height: 300 }}>
                          <Bar data={chartData} options={chartOptions} />
                        </Box>
                      </Paper>
                    </Box>
                  )}

                  {/* Comparativo Mensual - solo en panel mensual */}
                  {esMensual && <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5, display: "block" }}>
                      Comparación Mensual - {mesSeleccionado.año}
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {desglose.filter((d) => d.mensual > 0).map((item, i) => {
                        const maxVal = Math.max(...desglose.map((d) => d.mensual));
                        const pct = maxVal > 0 ? (item.mensual / maxVal) * 100 : 0;
                        return (
                          <Box key={i} sx={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 1.5, alignItems: "center" }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#374151" }}>
                              {item.nombre}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Box sx={{ flex: 1, height: 8, bgcolor: "#e0e0e0", borderRadius: 2, overflow: "hidden" }}>
                                <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: "#34a853", borderRadius: 2, transition: "width 0.6s ease" }} />
                              </Box>
                              <Typography variant="caption" sx={{ color: "#34a853", fontWeight: 600, minWidth: 50, textAlign: "right" }}>
                                {formatTiempo(item.mensual)}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>}

                  {/* Comparación Anual - solo en panel anual */}
                  {!esMensual && <Box sx={{ mt: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5, display: "block" }}>
                      Comparación Anual
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {desglose.filter((d) => d.anual > 0).map((item, i) => {
                        const maxVal = Math.max(...desglose.map((d) => d.anual));
                        const pct = maxVal > 0 ? (item.anual / maxVal) * 100 : 0;
                        return (
                          <Box key={i} sx={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 1.5, alignItems: "center" }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#374151" }}>
                              {item.nombre}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Box sx={{ flex: 1, height: 8, bgcolor: "#e0e0e0", borderRadius: 2, overflow: "hidden" }}>
                                <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: "#1976d2", borderRadius: 2, transition: "width 0.6s ease" }} />
                              </Box>
                              <Typography variant="caption" sx={{ color: "#1976d2", fontWeight: 600, minWidth: 50, textAlign: "right" }}>
                                {formatTiempo(item.anual)}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Paper>
      </Box>
    </Modal>
  );
}

// ─── Panel de Proyectos por Área (Modal) ──────────────────────────────────────
interface ProyectosAreaPanelProps {
  open: boolean;
  onClose: () => void;
  proyectos: Proyecto[];
}

function ProyectosAreaPanel({ open, onClose, proyectos }: ProyectosAreaPanelProps) {

  // Lista de colores para cada área del gráfico

  const COLORES_AREA = [
    "#4285f4",
    "#ea4335",
    "#fbbc04",
    "#34a853",
    "#9c27b0",
    "#ff5722",
    "#00acc1",
    "#795548",
    "#607d8b",
  ];

  // Áreas predefinidas
  const AREAS_PREDEFINIDAS = [
    "Contabilidad",
    "Recursos Humanos",
    "Logística",
    "Diseño",
    "Sistemas",
    "Mercadeo",
    "Comercial"
  ];

  // Calcular proyectos por área
  const proyectosPorArea = React.useMemo(() => {
    const conteo = new Map<string, number>();
    
    // Inicializar todas las áreas con 0
    AREAS_PREDEFINIDAS.forEach(area => {
      conteo.set(area, 0);
    });
    
    // Contar proyectos por área
    proyectos.forEach(proyecto => {
      const area = proyecto.area_beneficiada || "Sin área";
      if (conteo.has(area)) {
        conteo.set(area, (conteo.get(area) || 0) + 1);
      } else if (!conteo.has(area)) {
        // Para áreas no predefinidas, mostrarlas también
        conteo.set(area, 1);
      }
    });
    
    return Array.from(conteo.entries())
      .map(([area, cantidad]) => ({ area, cantidad }))
      .filter(item => item.cantidad > 0)
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [proyectos]);

  const totalProyectos = proyectos.length;
  
  // Colores para las áreas con proyectos
  const coloresUsados = proyectosPorArea.map((_, i) => COLORES_AREA[i % COLORES_AREA.length]);

  // Datos para el gráfico de donut (MUI X)
  const pieChartData = proyectosPorArea.map((item, index) => ({
    id: index,
    value: item.cantidad,
    label: item.area,
    color: coloresUsados[index],
  }));


  // Datos para el gráfico de barras horizontales
  const barData = {
    labels: proyectosPorArea.map(d => d.area.length > 20 ? d.area.substring(0, 20) + "..." : d.area),
    datasets: [
      {
        label: "Cantidad de Proyectos",
        data: proyectosPorArea.map(d => d.cantidad),
        backgroundColor: coloresUsados,
        borderColor: coloresUsados.map(c => c),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const valor = context.raw;
            const porcentaje = ((valor / totalProyectos) * 100).toFixed(1);
            return `${valor} proyectos (${porcentaje}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Cantidad de Proyectos",
        },
        ticks: {
          stepSize: 1,
        },
      },
      y: {
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  // Estado del acordión
  const [accordionExpanded, setAccordionExpanded] = useState(true);

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "95vw", sm: "85vw", md: 1200 },
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
              <AutoAwesomeMosaicICon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                Proyectos por Área
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Total: {totalProyectos} proyectos
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
              bgcolor: "#fff" 
            }}>

          {/* ── Accordion: Distribución por Área ── */}
          <Accordion 
            expanded={accordionExpanded}
            onChange={() => setAccordionExpanded(!accordionExpanded)} 
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
                } 
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ShowChartIcon sx={{ color: "#004680", fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#1a2b45" }}>
                  Distribución de Proyectos por Área
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
              {proyectosPorArea.length === 0 ? (
                <Typography variant="body2" sx={{ color: "text.disabled", textAlign: "center", py: 4 }}>
                  No hay proyectos para mostrar
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  
                  {/* Gráficos alineados horizontalmente */}
                  <Box sx={{ 
                    display: "grid", 
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, 
                    gap: 3,
                    mt: 1 
                  }}>
                    {/* Gráfico de Donut */}
                    <Box>
                      <Typography variant="caption" sx={{ 
                        color: "text.secondary", 
                        fontWeight: 700, 
                        textTransform: "uppercase", 
                        letterSpacing: 0.5, 
                        mb: 1.5, 
                        display: "block",
                        textAlign: "center"
                      }}>
                        Distribución Porcentual
                      </Typography>
                      <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}>
                        <Box sx={{ height: 280, width: '100%', display: 'flex', justifyContent: 'center' }}>
                          <PieChart
                            series={[
                              {
                                data: pieChartData,
                                innerRadius: 50,
                                outerRadius: 90,
                                paddingAngle: 2,
                                cornerRadius: 4,
                                highlightScope: { fade: 'global', highlight: 'item' },
                                faded: { innerRadius: 40, additionalRadius: -10 },
                                valueFormatter: (item) => {
                                  const porcentaje = ((item.value / totalProyectos) * 100).toFixed(1);
                                  return `${item.value} proyectos (${porcentaje}%)`;
                                },
                              },
                            ]}
                            width={320}
                            height={260}
                            sx={{
                              '& .MuiChartsLegend-root': {
                                fontSize: '11px',
                                padding: '4px',
                              },
                              '& .MuiChartsLegend-mark': {
                                width: 15,
                                height: 15,
                              },
                            }}
                            slotProps={{
                              legend: {
                                direction: 'vertical' as const,
                                position: { vertical: 'middle' as const, horizontal: 'end' as const },
                              },
                              tooltip: {
                                sx: {
                                  bgcolor: 'white',
                                  color: 'text.primary',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                  borderRadius: 1,
                                  p: 1.5,
                                  fontSize: '12px',
                                },
                              },
                            }}
                          />
                        </Box>
                      </Paper>
                    </Box>

                    {/* Gráfico de Barras Horizontales */}
                    <Box>
                      <Typography variant="caption" sx={{ 
                        color: "text.secondary", 
                        fontWeight: 700, 
                        textTransform: "uppercase", 
                        letterSpacing: 0.5, 
                        mb: 1.5, 
                        display: "block",
                        textAlign: "center"
                      }}>
                        Cantidades Absolutas
                      </Typography>
                      <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}>
                        <Box sx={{ height: 280 }}>
                          <Bar data={barData} options={barOptions} />
                        </Box>
                      </Paper>
                    </Box>
                  </Box>

                  {/* Leyenda adicional con detalles */}
                  <Box sx={{ mt: 2, p: 2, bgcolor: "#f8f9fa", borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: "#1a2a3a" }}>
                      Detalle por Área
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {proyectosPorArea.map((item, i) => {
                        const porcentaje = ((item.cantidad / totalProyectos) * 100).toFixed(1);
                        return (
                          <Box key={i} sx={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 2,
                            p: 1,
                            borderRadius: 1,
                            bgcolor: "white",
                            border: "1px solid #e0e0e0"
                          }}>
                            <Box sx={{ 
                              width: 16, 
                              height: 16, 
                              borderRadius: 1, 
                              bgcolor: coloresUsados[i],
                              flexShrink: 0
                            }} />
                            <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                              {item.area}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "#004680" }}>
                              {item.cantidad}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary", minWidth: 50, textAlign: "right" }}>
                              {porcentaje}%
                            </Typography>
                          </Box>
                        );
                      })}
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
  const [panelProyectosAreaAbierto, setPanelProyectosAreaAbierto] = useState(false);

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
          <Paper 
            elevation={0} 
            onClick={() => setPanelProyectosAreaAbierto(true)}
            sx={{ 
              p: 2, 
              border: "1px solid #e8eaed", 
              borderRadius: 2,
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": { border: "1px solid #1a73e8", boxShadow: "0 4px 12px rgba(26,115,232,0.15)", transform: "translateY(-1px)" },
            }}
          >
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
        vistaGrafico={panelAbierto ?? "mensual"}
      />

      {/* ── Modal de Proyectos por Área ── */}
      <ProyectosAreaPanel
        open={panelProyectosAreaAbierto}
        onClose={() => setPanelProyectosAreaAbierto(false)}
        proyectos={proyectosFiltrados}
      />

    </Box>
  );
};

export default Home;