// src/apps/gestion_proyectos/components/AhorroPanel.tsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Modal,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  Close as CloseIcon,
  CalendarToday as CalendarTodayIcon,
  DateRange as DateRangeIcon,
  ExpandMore as ExpandMoreIcon,
  Speed as SpeedIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ShowChart as ShowChartIcon,
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

import { formatTime, calculateProjectMetrics } from "../lib/calculos";
import type { Project } from "../types";

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AhorroPanelProps {
  open: boolean;
  onClose: () => void;
  tipo: "mensual" | "anual";
  total: number;
  proyectos: Project[];
  vistaGrafico?: "mensual" | "anual";
}

export function SavingsPanel({ open, onClose, tipo, total, proyectos, vistaGrafico }: AhorroPanelProps) {
  const esMensual = tipo === "mensual";
  const label = esMensual ? "Ahorro Mensual" : "Ahorro Anual";

  const fechaActual = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState<{ mes: number; año: number }>({
    mes: fechaActual.getMonth(),
    año: fechaActual.getFullYear(),
  });

  const [vistaGraficos, setVistaGraficos] = useState<"mensual" | "anual">(tipo);
  const [unidadTiempo, setUnidadTiempo] = useState<"segundos" | "minutos" | "horas">("horas");

  const convertirTiempo = (segundos: number): number => {
    switch (unidadTiempo) {
      case "segundos": return segundos;
      case "minutos": return Math.round(segundos / 60 * 100) / 100;
      case "horas": return Math.round(segundos / 3600 * 100) / 100;
      default: return segundos;
    }
  };

  const getUnidadLabel = (): string => {
    switch (unidadTiempo) {
      case "segundos": return "seg";
      case "minutos": return "min";
      case "horas": return "hrs";
      default: return "seg";
    }
  };

  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

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
    const ahora = new Date();
    const mesMinimo = new Date(ahora.getFullYear(), ahora.getMonth() - 12, 1);
    const fechaSeleccionada = new Date(mesSeleccionado.año, mesSeleccionado.mes, 1);
    return fechaSeleccionada <= mesMinimo;
  };

  const [metricasExpanded, setMetricasExpanded] = useState(true);
  const [graficosExpanded, setGraficosExpanded] = useState(false);

  const desglose = proyectos
    .map((p) => {
      const m = calculateProjectMetrics(p.processes ?? []);
      return {
        nombre: p.name,
        estado: p.status,
        ahorro: esMensual ? m.total_monthly_savings : m.total_yearly_savings,
        mensual: m.total_monthly_savings,
        anual: m.total_yearly_savings,
        procesos: p.processes ?? [],
      };
    })
    .sort((a, b) => b.ahorro - a.ahorro);

  const conAhorro = desglose.filter((d) => d.ahorro > 0);
  const promedio = conAhorro.length > 0 ? Math.round(total / conAhorro.length) : 0;
  const maxAhorro = conAhorro[0]?.ahorro ?? 0;

  const datosGraficoArea = React.useMemo(() => {
    const AREAS_PREDEFINIDAS = [
      "Contabilidad", "Recursos Humanos", "Logística", "Diseño",
      "Sistemas", "Mercadeo", "Comercial", "Administrativa"
    ];

    const areasAgrupadas = new Map<string, {
      nombreArea: string;
      proyectos: Array<{ nombre: string; tiempoAntes: number; tiempoDespues: number }>;
      tiempoAntes: number;
      tiempoDespues: number;
    }>();

    AREAS_PREDEFINIDAS.forEach(area => {
      areasAgrupadas.set(area, { nombreArea: area, proyectos: [], tiempoAntes: 0, tiempoDespues: 0 });
    });

    proyectos.forEach((proyecto) => {
      const area = proyecto.benefited_area || "Sin área";
      const m = calculateProjectMetrics(proyecto.processes ?? []);

      let tiempoAntes: number;
      let tiempoDespues: number;

      if (esMensual) {
        let tAntes = 0;
        let tDespues = 0;
        (proyecto.processes ?? []).forEach((proceso) => {
          tAntes += Number(proceso.time_before) || 0;
          tDespues += Number(proceso.time_after) || 0;
        });
        tiempoAntes = tAntes;
        tiempoDespues = tDespues;
      } else {
        tiempoAntes = m.total_yearly_savings + m.total_monthly_savings * 11;
        tiempoDespues = m.total_monthly_savings * 11;
      }

      if (areasAgrupadas.has(area)) {
        const areaData = areasAgrupadas.get(area)!;
        areaData.proyectos.push({ nombre: proyecto.name, tiempoAntes, tiempoDespues });
        areaData.tiempoAntes += tiempoAntes;
        areaData.tiempoDespues += tiempoDespues;
      }
    });

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
        backgroundColor: "#e53935",
        borderColor: "#c62828",
        borderWidth: 1,
      },
      {
        label: "Sistema (Ahora)",
        data: datosGraficoArea.map((d) => convertirTiempo(d.tiempoDespues)),
        backgroundColor: "#43a047",
        borderColor: "#2e7d32",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const, labels: { usePointStyle: true, padding: 20, font: { size: 12 } } },
      title: { display: false },
      tooltip: { callbacks: { label: (context: any) => `${context.dataset.label}: ${context.raw} ${getUnidadLabel()}` } },
    },
    scales: {
      x: { ticks: { maxRotation: 45, minRotation: 0 } },
      y: { beginAtZero: true, title: { display: true, text: `Tiempo (${getUnidadLabel()})` } },
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
              {esMensual ? <CalendarTodayIcon sx={{ fontSize: 28 }} /> : <DateRangeIcon sx={{ fontSize: 28 }} />}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>{label}</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.15)" } }}>
            <CloseIcon />
          </IconButton>
        </Paper>

        <Paper elevation={3} sx={{ borderRadius: "12px 12px 0px 0px", p: 2.5, display: "flex", flexDirection: "column", gap: 1.5, bgcolor: "#fff" }}>
          <Accordion
            expanded={metricasExpanded}
            onChange={() => setMetricasExpanded(!metricasExpanded)}
            elevation={0}
            sx={{
              borderRadius: "12px !important", border: "1px solid", borderColor: "divider", boxShadow: "none",
              overflow: "hidden", bgcolor: "white", mt: 2, "&:before": { display: "none" },
              "&.Mui-expanded": { margin: "8px 0 0 0" },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#1a2a3a" }} />} sx={{ bgcolor: "#f1f3f4", "&:hover": { bgcolor: "#f8f9fa" } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <SpeedIcon sx={{ color: "#004680", fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#1a2b45" }}>Métricas de Ahorro</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
              {esMensual && (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mb: 3 }}>
                  <IconButton onClick={mesAnterior} disabled={esMesAnteriorMinimo()} sx={{ color: "#004680" }}><ChevronLeftIcon /></IconButton>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, minWidth: 180, textAlign: "center" }}>
                    {nombresMeses[mesSeleccionado.mes]} {mesSeleccionado.año}
                  </Typography>
                  <IconButton onClick={mesSiguiente} disabled={esMesActual()} sx={{ color: "#004680" }}><ChevronRightIcon /></IconButton>
                </Box>
              )}

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
                {[
                  { label: vistaGraficos === "mensual" ? "Ahorro Mensual" : "Ahorro Anual", value: formatTime(total), sub: vistaGraficos === "mensual" ? `${nombresMeses[mesSeleccionado.mes]} ${mesSeleccionado.año}` : `${mesSeleccionado.año}` },
                  { label: "Promedio", value: formatTime(promedio), sub: "por proyecto" },
                  { label: "Proyectos con ahorro", value: conAhorro.length, sub: `de ${desglose.length} totales` },
                  { label: "Mayor ahorro", value: formatTime(maxAhorro), sub: conAhorro[0]?.nombre ?? "—" },
                ].map((item, i) => (
                  <Paper key={i} sx={{ p: 2, bgcolor: "#EBF9EF", textAlign: "center", borderRadius: 3, boxShadow: "none" }}>
                    <Typography variant="body2" sx={{ color: "success.dark" }}>{item.label}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: "bold", color: "success.dark" }}>{item.value}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>{item.sub}</Typography>
                  </Paper>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion
            expanded={graficosExpanded}
            onChange={() => setGraficosExpanded(!graficosExpanded)}
            disableGutters
            elevation={0}
            sx={{ "&:before": { display: "none" }, borderRadius: "12px !important", border: "1px solid #cecece", overflow: "hidden", bgcolor: "white" }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#1a2a3a" }} />} sx={{ bgcolor: "#f1f3f4", "&:hover": { bgcolor: "#f8f9fa" } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ShowChartIcon sx={{ color: "#004680", fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#1a2b45" }}>Gráficos Comparativos</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <ToggleButtonGroup
                  value={unidadTiempo}
                  exclusive
                  onChange={(event, newValue) => { if (newValue !== null) setUnidadTiempo(newValue); }}
                  size="small"
                  sx={{
                    "& .MuiToggleButton-root": {
                      px: 2, py: 0.5, fontSize: "0.75rem", textTransform: "none", border: "1px solid #e0e0e0",
                      "&.Mui-selected": { backgroundColor: "#004680", color: "white", "&:hover": { backgroundColor: "#003d66" } },
                    },
                  }}
                >
                  <ToggleButton value="segundos">Segundos</ToggleButton>
                  <ToggleButton value="minutos">Minutos</ToggleButton>
                  <ToggleButton value="horas">Horas</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              {conAhorro.length === 0 ? (
                <Typography variant="body2" sx={{ color: "text.disabled", textAlign: "center", py: 2 }}>No hay datos para mostrar</Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {datosGraficoArea.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5, display: "block" }}>
                        {vistaGraficos === "mensual"
                          ? `Reducción de Tiempo por Área - ${nombresMeses[mesSeleccionado.mes]} ${mesSeleccionado.año}`
                          : `Reducción de Tiempo por Área - Año ${mesSeleccionado.año}`} (segundos)
                      </Typography>
                      <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}>
                        <Box sx={{ height: 300 }}><Bar data={chartData} options={chartOptions} /></Box>
                      </Paper>
                    </Box>
                  )}

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
                            <Typography variant="caption" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#374151" }}>{item.nombre}</Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Box sx={{ flex: 1, height: 8, bgcolor: "#e0e0e0", borderRadius: 2, overflow: "hidden" }}>
                                <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: "#34a853", borderRadius: 2, transition: "width 0.6s ease" }} />
                              </Box>
                              <Typography variant="caption" sx={{ color: "#34a853", fontWeight: 600, minWidth: 50, textAlign: "right" }}>{formatTime(item.mensual)}</Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>}

                  {!esMensual && <Box sx={{ mt: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5, display: "block" }}>Comparación Anual</Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {desglose.filter((d) => d.anual > 0).map((item, i) => {
                        const maxVal = Math.max(...desglose.map((d) => d.anual));
                        const pct = maxVal > 0 ? (item.anual / maxVal) * 100 : 0;
                        return (
                          <Box key={i} sx={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 1.5, alignItems: "center" }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#374151" }}>{item.nombre}</Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Box sx={{ flex: 1, height: 8, bgcolor: "#e0e0e0", borderRadius: 2, overflow: "hidden" }}>
                                <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: "#1976d2", borderRadius: 2, transition: "width 0.6s ease" }} />
                              </Box>
                              <Typography variant="caption" sx={{ color: "#1976d2", fontWeight: 600, minWidth: 50, textAlign: "right" }}>{formatTime(item.anual)}</Typography>
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