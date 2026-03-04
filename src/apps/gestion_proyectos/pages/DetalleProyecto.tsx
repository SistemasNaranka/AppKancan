import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  styled,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type TooltipItem,
  type ChartOptions,
  type LegendOptions,
} from "chart.js";
import {
  ArrowBack,
  PostAdd,
  AccessTimeFilled,
  Description,
  Stars,
  Edit,
  Close,
  Save,
  ExpandMore,
  TrendingUp,
  Speed,
  ShowChart,
  PieChart,
  Add,
  Delete,
} from "@mui/icons-material";
import {
  useProyectoById,
  getEstadoColor,
  getEstadoLabel,
} from "../hooks/useProyectos";
import { updateProyecto } from "../api/directus/create";
import { updateProceso, deleteProceso, createProceso } from "../api/directus/create";
import { formatTiempo, getTextoFrecuencia } from "../lib/calculos";
import type { CreateProyectoInput } from "../types";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/es";

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

/**
 * Página de detalle de un proyecto
 */

type TabId = "info" | "tiempos" | "beneficios";

// Tipo para datos del formulario de edición
interface EditProjectFormData {
  nombre: string;
  areaBeneficiada: string;
  descripcion: string;
  encargado: string;
  fechaInicio: string;
  fechaEstimada: string;
  fechaEntrega: string;
  estado: string;
  tipoProyecto: string;
}

// Styled component para botón Volver
const VolverButton = styled(Button)({
  backgroundColor: "#004680",
  color: "white",
  borderRadius: 8,
  padding: "8px 16px",
  fontWeight: 500,
  textTransform: "none",
  "&:hover": {
    backgroundColor: "#003d66",
  },
});

// Header container con margen y border-radius
const HeaderContainer = styled(Box)({
  margin: "24px 0",
  padding: "20px 24px",
  borderRadius: 12,
  backgroundColor: "white",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  position: "relative",
});

// Estilos para el botón de editar
const EditButton = styled(Button)({
  backgroundColor: "#f5f5f5",
  color: "#5A6A7E",
  borderRadius: 8,
  padding: "8px 16px",
  fontWeight: 500,
  textTransform: "none",
  "&:hover": {
    backgroundColor: "#e8e8e8",
  },
});

// Modal de edición
const EditModalOverlay = styled(Box)({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1300,
});

const EditModalContent = styled(Paper)({
  padding: 24,
  borderRadius: 12,
  maxWidth: 600,
  width: "90%",
  maxHeight: "90vh",
  overflow: "auto",
});

// Tab container con estilo segmented control - fondo gris y tabs integradas
const TabContainer = styled(Box)({
  //backgroundColor: "#E8ECF1",
  borderRadius: "20px 20px 20px 20px",
  padding: "2px 2px 0px 20px",
  position: "relative",
});

// Tab button — estilo pill/segmented con borde gota en la unión
const TabButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "active" && prop !== "isFirst" && prop !== "isLast",
})<{ active?: boolean; isFirst?: boolean; isLast?: boolean }>(({ active, isFirst, isLast }) => ({
  borderRadius: isFirst ? "12px 12px 0 0" : isLast ? "12px 12px 0 0" : "12px 12px 0 0",
  padding: "10px 20px",
  fontWeight: active ? 600 : 500,
  fontSize: "0.85rem",
  textTransform: "none",
  minWidth: 0,
  gap: 6,
  transition: "all 0.3s ease",
  backgroundColor: active ? "white" : "transparent",
  color: active ? "#004680" : "#5A6A7E",
  boxShadow: active ? "0 -2px 8px rgba(0,0,0,0.08)" : "none",
  marginBottom: active ? "-8px" : "-1px",
  zIndex: active ? 2 : 1,
  position: "relative",
  height: active ? 44 : 40,
  "&:hover": {
    backgroundColor: active ? "white" : "rgba(255,255,255,0.5)",
    boxShadow: active ? "0 -2px 8px rgba(0,0,0,0.08)" : "none",
  },
}));

export default function DetalleProyecto() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { proyecto, metricas, loading, error, recargar } = useProyectoById(id || "");
  const [activeTab, setActiveTab] = useState<TabId>("info");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [procesosExpanded, setProcesosExpanded] = useState(true);
  const [metricasExpanded, setMetricasExpanded] = useState(true);
  const [graficosExpanded, setGraficosExpanded] = useState(true);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 256,
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2, color: "text.secondary" }}>
              Cargando proyecto...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (error || !proyecto) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ p: 3 }}>
          <VolverButton
            startIcon={<ArrowBack />}
            onClick={() => navigate("/gestion_proyectos")}
            sx={{ mb: 2 }}
          >
            Volver a proyectos
          </VolverButton>
          <Paper
            sx={{
              p: 3,
              bgcolor: "error.light",
              color: "error.contrastText",
              border: 1,
              borderColor: "error.main",
            }}
          >
            <Typography>{error || "Proyecto no encontrado"}</Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  const estadoColors = getEstadoColor(proyecto.estado);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "info", label: "Información General", icon: <Description sx={{ fontSize: 16 }} /> },
    { id: "tiempos", label: "Impacto en Tiempos", icon: <AccessTimeFilled sx={{ fontSize: 16 }} /> },
    { id: "beneficios", label: "Beneficios", icon: <Stars sx={{ fontSize: 16 }} /> },
  ];

  return (
    <Container maxWidth="lg" sx={{ p: 3 }}>
      {/* Header — 3 zonas: botón izq | info centro | botones der */}
      <HeaderContainer>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            alignItems: "center",
            gap: 3,
            minHeight: 80,
          }}
        >
          {/* Zona izquierda: botón Volver */}
          <Box sx={{ flexShrink: 0 }}>
            <VolverButton
              startIcon={<ArrowBack />}
              onClick={() => navigate("/gestion_proyectos")}
            >
              Volver a proyectos
            </VolverButton>
          </Box>

          {/* Zona central: nombre, descripción, estado */}
          <Box sx={{ textAlign: "center", overflow: "hidden" }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                color: "#1a2b45",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {proyecto.nombre}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                color: "text.secondary",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {proyecto.descripcion}
            </Typography>
            <Box sx={{ mt: 1, display: "flex", justifyContent: "center" }}>
              <Chip
                label={getEstadoLabel(proyecto.estado)}
                size="small"
                sx={{
                  fontWeight: "medium",
                  backgroundColor: estadoColors.bg,
                  color: estadoColors.text,
                }}
              />
            </Box>
          </Box>

          {/* Zona derecha: botones Editar y Post-Lanzamiento alineados verticalmente */}
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 1,
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <EditButton
              startIcon={<Edit sx={{ fontSize: 18 }} />}
              onClick={() => setEditModalOpen(true)}
              aria-label="Editar proyecto"
            >
              Editar
            </EditButton>
            <Button
              sx={{
                backgroundColor: "#004680",
                boxShadow: "none",
                "&:hover": { boxShadow: "none", backgroundColor: "#005AA3" },
                borderRadius: 2,
                padding: "8px 16px",
                fontWeight: 500,
                textTransform: "none",
              }}
              variant="contained"
              startIcon={<PostAdd />}
              onClick={() => navigate(`/gestion_proyectos/${id}/postlanzamiento`)}
            >
              Post-Lanzamiento
            </Button>
          </Box>
        </Box>
      </HeaderContainer>

      {/* Modal de edición de proyecto */}
      <EditProyectoModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        proyecto={proyecto}
        onSuccess={() => {
          recargar();
          setEditModalOpen(false);
        }}
        loading={editLoading}
        setLoading={setEditLoading}
      />

      {/* Tabs estilo segmented control con borde gota */}
      <Box sx={{ borderRadius: "16px 16px 0 0", overflow: "visible" }}>
        {/* Tab strip con estilo pill/segmented */}
        <TabContainer>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              gap: 0.5,
              position: "relative",
              zIndex: 0,
            }}
          >
            {tabs.map((tab, index) => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                isFirst={index === 0}
                isLast={index === tabs.length - 1}
                onClick={() => setActiveTab(tab.id)}
                startIcon={tab.icon}
                disableRipple={activeTab === tab.id}
              >
                {tab.label}
              </TabButton>
            ))}
          </Box>
        </TabContainer>

        {/* Panel de contenido — blanco, conectado con borde gota */}
        <Paper
          elevation={1}
          sx={{
            p: 3,
            borderRadius: "16px 16px 16px 16px",
            position: "relative",
            zIndex: 1,
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}
        >

          {/* Información General */}
          {activeTab === "info" && (
            <>
              {/* <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: "semibold", display: "flex", alignItems: "center", gap: 1, color: "#004680" }}
              >
                <Description />
                Información General
              </Typography> */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>Área Beneficiada</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "medium" }}>{proyecto.area_beneficiada}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>Encargados</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                    {proyecto.encargados?.map((e) => e.nombre).join(", ") || "Sin asignar"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>Fecha de Inicio</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "medium" }}>{proyecto.fecha_inicio}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>Fecha de Entrega</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "medium" }}>{proyecto.fecha_entrega}</Typography>
                </Box>
              </Box>
            </>
          )}

          {/* Impacto en Tiempos */}
          {activeTab === "tiempos" && (
            <>
              {/* <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: "semibold", display: "flex", alignItems: "center", gap: 1, color: "#004680" }}
              >
                <AccessTimeFilled />
                Impacto en Tiempos
              </Typography> */}
              {/* Primer Accordion: Métricas de Ahorro */}
              <Accordion
                expanded={metricasExpanded}
                onChange={() => setMetricasExpanded(!metricasExpanded)}
                sx={{
                  boxShadow: "none",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: "12px !important",
                  "&:before": { display: "none" },
                  "&.Mui-expanded": { margin: 0 },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    borderRadius: metricasExpanded ? "12px 12px 0 0" : "12px",
                    backgroundColor: "#f8f9fa",
                    "&:hover": { backgroundColor: "#f1f3f4" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TrendingUp sx={{ color: "#004680", fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#1a2b45" }}>
                      Métricas de Ahorro
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2 }}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                      gap: 2,
                    }}
                  >
                    <Paper sx={{ p: 2, bgcolor: "#EBF9EF", textAlign: "center", borderRadius: 3, boxShadow: "none" }}>
                      <Typography variant="body2" sx={{ color: "success.dark" }}>Ahorro Mensual</Typography>
                      <Typography variant="h5" sx={{ fontWeight: "bold", color: "success.dark" }}>
                        {formatTiempo(metricas.ahorro_total_mensual)}
                      </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, bgcolor: "#EBF9EF", textAlign: "center", borderRadius: 3, boxShadow: "none" }}>
                      <Typography variant="body2" sx={{ color: "success.dark" }}>Ahorro Anual</Typography>
                      <Typography variant="h5" sx={{ fontWeight: "bold", color: "success.dark" }}>
                        {formatTiempo(metricas.ahorro_total_anual)}
                      </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, bgcolor: "#E6F4FF", textAlign: "center", borderRadius: 3, boxShadow: "none" }}>
                      <Typography variant="body2" sx={{ color: "info.dark" }}>Total Procesos</Typography>
                      <Typography variant="h5" sx={{ fontWeight: "bold", color: "info.dark" }}>
                        {metricas.total_procesos}
                      </Typography>
                    </Paper>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Segundo Accordion: Detalle de Procesos */}
              <Accordion
                expanded={procesosExpanded}
                onChange={() => setProcesosExpanded(!procesosExpanded)}
                sx={{
                  boxShadow: "none",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: "12px !important",
                  mt: 2,
                  "&:before": { display: "none" },
                  "&.Mui-expanded": { margin: "8px 0 0 0" },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    borderRadius: procesosExpanded ? "12px 12px 0 0" : "12px",
                    backgroundColor: "#f8f9fa",
                    "&:hover": { backgroundColor: "#f1f3f4" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Speed sx={{ color: "#004680", fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#1a2b45" }}>
                      Detalle de Procesos
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2 }}>
                  {proyecto.procesos && proyecto.procesos.length > 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {proyecto.procesos.map((proceso, index) => {
                        const mProceso = metricas.procesos[index] || {
                          ahorro_por_ejecucion: 0,
                          ahorro_mensual: 0,
                          ahorro_anual: 0,
                        };
                        return (
                          <Paper key={proceso.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
                                  {index + 1}. {proceso.nombre}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
                                  Frecuencia:{" "}
                                  {getTextoFrecuencia(proceso.frecuencia_tipo as any, proceso.frecuencia_cantidad)}
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: "right" }}>
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                  Ahorro por ejecución
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: "medium", color: "success.main" }}>
                                  {proceso.tiempo_antes}s → {proceso.tiempo_despues}s
                                  <Typography component="span" variant="body2" sx={{ ml: 1, color: "success.dark" }}>
                                    (-{proceso.tiempo_antes - proceso.tiempo_despues}s)
                                  </Typography>
                                </Typography>
                              </Box>
                            </Box>
                            {mProceso.ahorro_mensual > 0 && (
                              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: 1, borderColor: "divider" }}>
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                  Ahorra {formatTiempo(mProceso.ahorro_mensual)}/mes (
                                  {formatTiempo(mProceso.ahorro_anual)}/año)
                                </Typography>
                              </Box>
                            )}
                          </Paper>
                        );
                      })}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <Typography variant="body1" sx={{ color: "text.secondary" }}>
                        No hay procesos registrados para este proyecto
                      </Typography>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>

              {/* Tercer Accordion: Gráficos Comparativos */}
              <Accordion
                expanded={graficosExpanded}
                onChange={() => setGraficosExpanded(!graficosExpanded)}
                sx={{
                  boxShadow: "none",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: "12px !important",
                  mt: 2,
                  "&:before": { display: "none" },
                  "&.Mui-expanded": { margin: "8px 0 0 0" },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    borderRadius: graficosExpanded ? "12px 12px 0 0" : "12px",
                    backgroundColor: "#f8f9fa",
                    "&:hover": { backgroundColor: "#f1f3f4" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ShowChart sx={{ color: "#004680", fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#1a2b45" }}>
                      Gráficos Comparativos
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2 }}>
                  {proyecto.procesos && proyecto.procesos.length > 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {/* Gráfico de Líneas: Comparación Antes vs Después */}
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: "#1a2b45" }}>
                          Comparación de Tiempos: Antes vs Después
                        </Typography>
                        <Box sx={{ height: 250 }}>
                          <Line
                            data={{
                              labels: proyecto.procesos.map((p, i) => `${i + 1}. ${p.nombre.substring(0, 15)}${p.nombre.length > 15 ? '...' : ''}`),
                              datasets: [
                                {
                                  label: 'Tiempo Original (seg)',
                                  data: proyecto.procesos.map(p => p.tiempo_antes),
                                  borderColor: '#ef4444',
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  tension: 0.3,
                                  fill: true,
                                },
                                {
                                  label: 'Tiempo Optimizado (seg)',
                                  data: proyecto.procesos.map(p => p.tiempo_despues),
                                  borderColor: '#22c55e',
                                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                  tension: 0.3,
                                  fill: true,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'top',
                                },
                                tooltip: {
                                  callbacks: {
                                    label: (context) => `${context.dataset.label}: ${context.parsed.y} segundos`,
                                  },
                                },
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  title: {
                                    display: true,
                                    text: 'Segundos',
                                  },
                                },
                              },
                            }}
                          />
                        </Box>
                      </Paper>

                      {/* Gráfico de Pastel: Tiempo Total */}
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: "#1a2b45" }}>
                          Distribución del Tiempo Total
                        </Typography>
                        <Box sx={{ height: 280, display: 'flex', justifyContent: 'center' }}>
                          {(() => {
                            const totalAntes = proyecto.procesos.reduce((sum, p) => sum + p.tiempo_antes, 0);
                            const totalDespues = proyecto.procesos.reduce((sum, p) => sum + p.tiempo_despues, 0);
                            const data = {
                              labels: ['Tiempo Original', 'Tiempo Optimizado'],
                              datasets: [{
                                data: [totalAntes, totalDespues],
                                backgroundColor: ['#ef4444', '#22c55e'],
                                borderColor: ['#dc2626', '#16a34a'],
                                borderWidth: 2,
                              }],
                            };
                            const options: ChartOptions<"doughnut"> = {
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: "bottom" as const,
                                },
                                tooltip: {
                                  callbacks: {
                                    label: (context: TooltipItem<"doughnut">) => {
                                      const total = totalAntes + totalDespues;
                                      const value = context.raw as number;
                                      const percentage = ((value / total) * 100).toFixed(1);
                                      return `${context.label}: ${value} segundos (${percentage}%)`;
                                    },
                                  },
                                },
                              },
                              cutout: "50%",
                            };
                            return <Doughnut data={data} options={options} />;
                          })()}
                        </Box>
                      </Paper>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        No hay procesos suficientes para mostrar gráficos comparativos
                      </Typography>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            </>
          )}

          {/* Beneficios */}
          {activeTab === "beneficios" && (
            <>
              {/* <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: "semibold", display: "flex", alignItems: "center", gap: 1, color: "#004680" }}
              >
                <Stars />
                Beneficios del Proyecto
              </Typography> */}
              {proyecto.beneficios && proyecto.beneficios.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {proyecto.beneficios.slice(0, 3).map((beneficio) => (
                    <Paper key={beneficio.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                        {beneficio.descripcion}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body1" sx={{ color: "text.secondary" }}>
                    No hay beneficios registrados para este proyecto
                  </Typography>
                </Box>
              )}
            </>
          )}

        </Paper>
      </Box>
    </Container>
  );
}

// ============================================
// Componente Modal de Edición de Proyecto
// ============================================

interface EditProyectoModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: import("../types").Proyecto | null;
  onSuccess: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

function EditProyectoModal({ open, onClose, proyecto, onSuccess, loading, setLoading }: EditProyectoModalProps) {
  const [formData, setFormData] = useState<EditProjectFormData>({
    nombre: "",
    areaBeneficiada: "",
    descripcion: "",
    encargado: "",
    fechaInicio: "",
    fechaEstimada: "",
    fechaEntrega: "",
    estado: "en_proceso",
    tipoProyecto: "mejora",
  });

  // Inicializar formulario cuando cambia el proyecto
  useEffect(() => {
    if (proyecto && open) {
      setFormData({
        nombre: proyecto.nombre,
        areaBeneficiada: proyecto.area_beneficiada,
        descripcion: proyecto.descripcion,
        encargado: proyecto.encargados?.map((e) => e.nombre).join(", ") || "",
        fechaInicio: proyecto.fecha_inicio,
        fechaEstimada: proyecto.fecha_estimada,
        fechaEntrega: proyecto.fecha_entrega || "",
        estado: proyecto.estado,
        tipoProyecto: proyecto.tipo_proyecto,
      });
    }
  }, [proyecto, open]);

  const handleChange = (field: keyof EditProjectFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Estado para gestionar procesos en el modal
  const [procesosEdit, setProcesosEdit] = useState<Array<{
    id: string;
    nombre: string;
    tiempo_antes: number;
    tiempo_despues: number;
    frecuencia_tipo: string;
    frecuencia_cantidad: number;
    dias_semana: number;
    isNew?: boolean;
  }>>([]);

  // Inicializar procesos cuando cambia el proyecto
  useEffect(() => {
    if (proyecto && open) {
      setProcesosEdit(
        (proyecto.procesos || []).map((p) => ({
          id: p.id,
          nombre: p.nombre,
          tiempo_antes: p.tiempo_antes,
          tiempo_despues: p.tiempo_despues,
          frecuencia_tipo: p.frecuencia_tipo,
          frecuencia_cantidad: p.frecuencia_cantidad,
          dias_semana: p.dias_semana,
        }))
      );
    }
  }, [proyecto, open]);

  // Agregar nuevo proceso
  const handleAgregarProceso = () => {
    setProcesosEdit([
      ...procesosEdit,
      {
        id: `new_${Date.now()}`,
        nombre: "",
        tiempo_antes: 0,
        tiempo_despues: 0,
        frecuencia_tipo: "diaria",
        frecuencia_cantidad: 1,
        dias_semana: 5,
        isNew: true,
      },
    ]);
  };

  // Eliminar proceso
  const handleEliminarProceso = async (index: number) => {
    const proceso = procesosEdit[index];
    if (!proceso.isNew && proceso.id) {
      // Eliminar de la base de datos si no es nuevo
      await deleteProceso(proceso.id);
    }
    setProcesosEdit(procesosEdit.filter((_, i) => i !== index));
  };

  // Actualizar proceso
  const handleActualizarProceso = (index: number, field: string, value: any) => {
    setProcesosEdit(
      procesosEdit.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyecto) return;

    setLoading(true);
    try {
      // Lógica bidireccional: cambio de estado basado en fecha de entrega
      // 1. Si el proyecto está "entregado" y la fecha de entrega es FUTURA (> hoy), cambiar a "en proceso"
      // 2. Si el proyecto está "en proceso" y la fecha de entrega es <= hoy (actual o pasada), cambiar a "entregado"
      let nuevoEstado = formData.estado;
      
      if (formData.fechaEntrega) {
        const fechaEntrega = dayjs(formData.fechaEntrega);
        const hoy = dayjs();
        const esFechaPasadaOActual = fechaEntrega.isBefore(hoy) || fechaEntrega.isSame(hoy, "day");
        const esFechaFutura = fechaEntrega.isAfter(hoy, "day");
        
        // Caso 1: Proyecto está entregado pero fecha de entrega es futura -> cambiar a "en proceso"
        if (formData.estado === "entregado" && esFechaFutura) {
          nuevoEstado = "en_proceso";
        }
        // Caso 2: Proyecto está en proceso pero fecha de entrega es actual o pasada -> cambiar a "entregado"
        else if (formData.estado === "en_proceso" && esFechaPasadaOActual) {
          nuevoEstado = "entregado";
        }
      } else {
        // Si no hay fecha de entrega y el proyecto está entregado, mantener en proceso
        if (formData.estado === "entregado") {
          nuevoEstado = "en_proceso";
        }
      }

      const proyectoData: Partial<CreateProyectoInput> = {
        nombre: formData.nombre,
        area_beneficiada: formData.areaBeneficiada,
        descripcion: formData.descripcion,
        fecha_inicio: formData.fechaInicio,
        fecha_estimada: formData.fechaEstimada,
        fecha_entrega: formData.fechaEntrega || null,
        estado: nuevoEstado as any,
        tipo_proyecto: formData.tipoProyecto as any,
        encargados: formData.encargado
          .split(",")
          .map((n) => ({ nombre: n.trim() }))
          .filter((e) => e.nombre),
      };

      const success = await updateProyecto(proyecto.id, proyectoData);
      if (success) {
        // Guardar procesos
        for (const proceso of procesosEdit) {
          if (proceso.isNew) {
            // Crear nuevo proceso
            await createProceso({
              proyecto_id: proyecto.id,
              nombre: proceso.nombre,
              tiempo_antes: proceso.tiempo_antes,
              tiempo_despues: proceso.tiempo_despues,
              frecuencia_tipo: proceso.frecuencia_tipo as any,
              frecuencia_cantidad: proceso.frecuencia_cantidad,
              dias_semana: proceso.dias_semana,
              orden: procesosEdit.indexOf(proceso) + 1,
            });
          } else {
            // Actualizar proceso existente
            await updateProceso(proceso.id, {
              nombre: proceso.nombre,
              tiempo_antes: proceso.tiempo_antes,
              tiempo_despues: proceso.tiempo_despues,
              frecuencia_tipo: proceso.frecuencia_tipo as any,
              frecuencia_cantidad: proceso.frecuencia_cantidad,
              dias_semana: proceso.dias_semana,
              orden: procesosEdit.indexOf(proceso) + 1,
            });
          }
        }
        onSuccess();
      } else {
        console.error("Error al actualizar el proyecto");
      }
    } catch (error) {
      console.error("Error al guardar cambios:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <EditModalOverlay onClick={onClose}>
        <EditModalContent onClick={(e) => e.stopPropagation()} elevation={8}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: "#1a2b45" }}>
              Editar Proyecto
            </Typography>
            <IconButton onClick={onClose} aria-label="Cerrar modal" size="small">
              <Close />
            </IconButton>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Nombre del Proyecto"
              value={formData.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              required
              fullWidth
              size="medium"
            />

            <TextField
              label="Área Beneficiada"
              value={formData.areaBeneficiada}
              onChange={(e) => handleChange("areaBeneficiada", e.target.value)}
              required
              fullWidth
              size="medium"
            />

            <FormControl fullWidth size="medium">
              <InputLabel>Estado</InputLabel>
              <Select
                value={formData.estado}
                label="Estado"
                onChange={(e) => handleChange("estado", e.target.value)}
              >
                <MenuItem value="en_proceso">En Proceso</MenuItem>
                <MenuItem value="entregado">Entregado</MenuItem>
                <MenuItem value="en_seguimiento">En Seguimiento</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="medium">
              <InputLabel>Tipo de Proyecto</InputLabel>
              <Select
                value={formData.tipoProyecto}
                label="Tipo de Proyecto"
                onChange={(e) => handleChange("tipoProyecto", e.target.value)}
              >
                <MenuItem value="mejora">Mejora</MenuItem>
                <MenuItem value="nuevo">Nueva Creación</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", gap: 2 }}>
              <DatePicker
                label="Fecha Inicio"
                value={formData.fechaInicio ? dayjs(formData.fechaInicio) : null}
                slotProps={{ textField: { fullWidth: true, required: true, size: "medium", disabled: true } }}
              />
              <DatePicker
                label="Fecha Estimada"
                value={formData.fechaEstimada ? dayjs(formData.fechaEstimada) : null}
                slotProps={{ textField: { fullWidth: true, required: true, size: "medium", disabled: true } }}
              />
              <DatePicker
                label="Fecha Entrega"
                value={formData.fechaEntrega ? dayjs(formData.fechaEntrega) : null}
                onChange={(newValue) => handleChange("fechaEntrega", newValue ? dayjs(newValue).format("YYYY-MM-DD") : "")}
                slotProps={{ textField: { fullWidth: true, size: "medium" } }}
              />
            </Box>

            <TextField
              label="Encargados (separados por coma)"
              value={formData.encargado}
              onChange={(e) => handleChange("encargado", e.target.value)}
              fullWidth
              size="medium"
              placeholder="Nombre1, Nombre2, ..."
            />

            <TextField
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => handleChange("descripcion", e.target.value)}
              fullWidth
              size="medium"
              multiline
              rows={3}
            />

            {/* Sección de Procesos */}
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#1a2b45" }}>
                  Procesos del Proyecto
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={handleAgregarProceso}
                  sx={{ textTransform: "none" }}
                >
                  Agregar Proceso
                </Button>
              </Box>

              {procesosEdit.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 300, overflow: "auto" }}>
                  {procesosEdit.map((proceso, index) => (
                    <Paper
                      key={proceso.id}
                      variant="outlined"
                      sx={{ p: 2, borderRadius: 2 }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                          Proceso {index + 1}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleEliminarProceso(index)}
                          sx={{ color: "error.main" }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <TextField
                          label="Nombre"
                          value={proceso.nombre}
                          onChange={(e) => handleActualizarProceso(index, "nombre", e.target.value)}
                          size="small"
                          sx={{ flex: 1, minWidth: 150 }}
                        />
                        <TextField
                          label="Tiempo antes (seg)"
                          type="number"
                          value={proceso.tiempo_antes}
                          onChange={(e) => handleActualizarProceso(index, "tiempo_antes", Number(e.target.value))}
                          size="small"
                          sx={{ width: 120 }}
                        />
                        <TextField
                          label="Tiempo después (seg)"
                          type="number"
                          value={proceso.tiempo_despues}
                          onChange={(e) => handleActualizarProceso(index, "tiempo_despues", Number(e.target.value))}
                          size="small"
                          sx={{ width: 120 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                          <InputLabel>Frecuencia</InputLabel>
                          <Select
                            value={proceso.frecuencia_tipo}
                            label="Frecuencia"
                            onChange={(e) => handleActualizarProceso(index, "frecuencia_tipo", e.target.value)}
                          >
                            <MenuItem value="diaria">Diaria</MenuItem>
                            <MenuItem value="semanal">Semanal</MenuItem>
                            <MenuItem value="mensual">Mensual</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 2 }}>
                  No hay procesos. Agrega uno nuevo.
                </Typography>
              )}
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}>
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={loading}
                startIcon={<Close />}
                sx={{ borderColor: "#ddd", color: "#5A6A7E" }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? undefined : <Save />}
                sx={{
                  backgroundColor: "#004680",
                  "&:hover": { backgroundColor: "#005AA3" },
                }}
              >
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </Box>
          </Box>
        </EditModalContent>
      </EditModalOverlay>
    </LocalizationProvider>
  );
}