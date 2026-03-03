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
  styled,
} from "@mui/material";
import { ArrowBack, PostAdd, AccessTimeFilled, Description, Stars } from "@mui/icons-material";
import {
  useProyectoById,
  getEstadoColor,
  getEstadoLabel,
} from "../hooks/useProyectos";
import { formatTiempo, getTextoFrecuencia } from "../lib/calculos";

/**
 * Página de detalle de un proyecto
 */

type TabId = "info" | "tiempos" | "beneficios";

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
  const { proyecto, metricas, loading, error } = useProyectoById(id || "");
  const [activeTab, setActiveTab] = useState<TabId>("info");

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
      {/* Header — 3 zonas: botón izq | info centro | botón der */}
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

          {/* Zona derecha: botón Post-Lanzamiento */}
          <Box sx={{ flexShrink: 0 }}>
            <Button
              sx={{
                backgroundColor: "#004680",
                boxShadow: "none",
                "&:hover": { boxShadow: "none", backgroundColor: "#005AA3" },
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
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                  gap: 2,
                  mb: 3,
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

              {proyecto.procesos && proyecto.procesos.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>Detalle de Procesos</Typography>
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
                              ⏱️ Ahorra {formatTiempo(mProceso.ahorro_mensual)}/mes (
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