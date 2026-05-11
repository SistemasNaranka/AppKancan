import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
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
} from "chart.js";
import {
  ArrowBack,
  PostAdd,
  AccessTimeFilled,
  Description,
  Stars,
  Edit,
  ExpandMore,
  TrendingUp,
  Speed,
  ShowChart,
} from "@mui/icons-material";
import {
  getProjectById,
  getEstadoColor,
  getEstadoLabel,
} from "../hooks/useProyectos";
import { formatTime, getFrequencyText } from "../lib/calculos";
import EditProyectoModal from "./EditProyectoModal";
import { getTipoProyectoLabel } from "./utils";
import {
  VolverButton,
  HeaderContainer,
  EditButton,
  TabContainer,
  TabButton,
} from "./styles";

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

type TabId = "info" | "tiempos" | "beneficios";

export default function DetalleProyecto() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { proyecto, metricas, loading, error, recargar } = getProjectById(id || "");
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
          <Box sx={{ flexShrink: 0 }}>
            <VolverButton
              startIcon={<ArrowBack />}
              onClick={() => navigate("/gestion_proyectos")}
            >
              Volver a proyectos
            </VolverButton>
          </Box>

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

      <Box sx={{ borderRadius: "16px 16px 0 0", overflow: "visible" }}>
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
          {activeTab === "info" && (
            <>
              <Box
                sx={{
                  display: "flex",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                  gap: 10,
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, fontWeight: "bold", }}>Área Beneficiada</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "medium" }}>{proyecto.area_beneficiada}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, fontWeight: "bold", }}>Tipo de proyecto</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "medium" }}>{getTipoProyectoLabel(proyecto.tipo_proyecto)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, fontWeight: "bold", }}>Encargados</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                    {proyecto.encargados?.map((e) => e.nombre).join(", ") || "Sin asignar"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, fontWeight: "bold", }}>Fecha de Inicio</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "medium" }}>{proyecto.fecha_inicio}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, fontWeight: "bold", }}>Fecha Estimada</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "medium" }}>{proyecto.fecha_estimada}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, fontWeight: "bold", }}>Fecha de Entrega</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "medium" }}>{proyecto.fecha_entrega}</Typography>
                </Box>
              </Box>
            </>
          )}

          {activeTab === "tiempos" && (
            <>
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
                        {formatTime(metricas.ahorro_total_mensual)}
                      </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, bgcolor: "#EBF9EF", textAlign: "center", borderRadius: 3, boxShadow: "none" }}>
                      <Typography variant="body2" sx={{ color: "success.dark" }}>Ahorro Anual</Typography>
                      <Typography variant="h5" sx={{ fontWeight: "bold", color: "success.dark" }}>
                        {formatTime(metricas.ahorro_total_anual)}
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
                                  {getFrequencyText(proceso.frecuencia_tipo as any, proceso.frecuencia_cantidad)}
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
                                  Ahorra {formatTime(mProceso.ahorro_mensual)}/mes (
                                  {formatTime(mProceso.ahorro_anual)}/año)
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
                                  backgroundColor: 'rgba(255, 255, 255, 0)',
                                  tension: 0.3,
                                  fill: true,
                                },
                                {
                                  label: 'Tiempo Optimizado (seg)',
                                  data: proyecto.procesos.map(p => p.tiempo_despues),
                                  borderColor: '#22c55e',
                                  backgroundColor: 'rgba(255, 255, 255, 0)',
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

          {activeTab === "beneficios" && (
            <>
              {proyecto.beneficios && proyecto.beneficios.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  {proyecto.beneficios.slice(0, 12).map((beneficio) => (
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