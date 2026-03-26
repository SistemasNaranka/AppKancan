import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  styled,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Description as DescriptionIcon,
  Timer as TimerIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import {
  createProyecto,
  createProcesos,
  createBeneficios,
} from "../api/directus/create";
import type {
  CreateProyectoInput,
  CreateProcesoInput,
  CreateBeneficioInput,
} from "../types";
import { ProjectForm } from "../components/ProjectForm";
import { ProcessList } from "../components/ProcessList";
import { BenefitList } from "../components/BenefitList";

// ─── Styled ───────────────────────────────────────────────────────────────────
const VolverButton = styled(Button)({
  backgroundColor: "#004680",
  color: "white",
  borderRadius: 8,
  padding: "8px 16px",
  fontWeight: 500,
  textTransform: "none",
  boxShadow: "none",
  "&:hover": { backgroundColor: "#005AA3", boxShadow: "none" },
});

const TabButton = styled(Button, {
  shouldForwardProp: (p) => p !== "active",
})<{ active?: boolean }>(({ active }) => ({
  borderRadius: "12px 12px 0 0",
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProcesoForm {
  id: string;
  nombre: string;
  tiempo_antes: number;
  tiempo_despues: number;
  frecuencia_tipo: string;
  frecuencia_cantidad: number;
  dias_semana: number;
}

interface BeneficioForm {
  id: string;
  descripcion: string;
}

interface ProjectFormData {
  nombre: string;
  areaBeneficiada: string;
  descripcion: string;
  encargados: string;
  fechaInicio: string;
  fechaEstimada: string;
  fechaEntrega: string;
  estado: string;
  tipoProyecto: string;
}

type TabId = "info" | "procesos" | "beneficios";

// ──────────── Componente ───────────────
export default function NuevoProyecto() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabActiva, setTabActiva] = useState<TabId>("info");

  const [projectData, setProjectData] = useState<ProjectFormData>({
    nombre: "",
    areaBeneficiada: "",
    descripcion: "",
    encargados: "",
    fechaInicio: "",
    fechaEstimada: "",
    fechaEntrega: "",
    estado: "en_proceso",
    tipoProyecto: "Actualizacion",
  });

  const [procesos, setProcesos] = useState<ProcesoForm[]>([]);
  const [diasPorSemana, setDiasPorSemana] = useState<string>("5");
  const [frecuenciaTipo, setFrecuenciaTipo] = useState<string>("diaria");
  const [frecuenciaCantidad, setFrecuenciaCantidad] = useState<string>("1");
  const [beneficios, setBeneficios] = useState<BeneficioForm[]>([]);
  const [encargadosList, setEncargadosList] = useState<string[]>([]);

  // ─── Encargados ─────────────────────────────────────────────────────────────
  const handleAddEncargado = (nombre: string) =>
    setEncargadosList((prev) => [...prev, nombre]);
  const handleRemoveEncargado = (index: number) =>
    setEncargadosList((prev) => prev.filter((_, i) => i !== index));
  const handleProjectChange = (field: keyof ProjectFormData, value: string) =>
    setProjectData((prev) => ({ ...prev, [field]: value }));

  // ─── Frecuencia global ───────────────────────────────────────────────────────
  const handleDiasPorSemanaChange = (value: string) => {
    setDiasPorSemana(value);
    setProcesos((prev) =>
      prev.map((p) => ({ ...p, dias_semana: Number(value) || 5 }))
    );
  };
  const handleFrecuenciaTipoChange = (value: string) => {
    setFrecuenciaTipo(value);
    setProcesos((prev) => prev.map((p) => ({ ...p, frecuencia_tipo: value })));
  };
  const handleFrecuenciaCantidadChange = (value: string) => {
    setFrecuenciaCantidad(value);
    setProcesos((prev) =>
      prev.map((p) => ({ ...p, frecuencia_cantidad: Number(value) }))
    );
  };

  // ─── Procesos ────────────────────────────────────────────────────────────────
  const agregarProceso = () =>
    setProcesos((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        nombre: "",
        tiempo_antes: 0,
        tiempo_despues: 0,
        frecuencia_tipo: frecuenciaTipo,
        frecuencia_cantidad: Number(frecuenciaCantidad),
        dias_semana: Number(diasPorSemana) || 5,
      },
    ]);
  const eliminarProceso = (id: string) =>
    setProcesos((prev) => prev.filter((p) => p.id !== id));
  const actualizarProceso = (id: string, campo: string, valor: any) =>
    setProcesos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p))
    );

  // ─── Beneficios ──────────────────────────────────────────────────────────────
  const agregarBeneficio = () =>
    setBeneficios((prev) => [
      ...prev,
      { id: Date.now().toString(), descripcion: "" },
    ]);
  const eliminarBeneficio = (id: string) =>
    setBeneficios((prev) => prev.filter((b) => b.id !== id));
  const actualizarBeneficio = (id: string, descripcion: string) =>
    setBeneficios((prev) =>
      prev.map((b) => (b.id === id ? { ...b, descripcion } : b))
    );

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (
        !projectData.nombre ||
        !projectData.areaBeneficiada ||
        !projectData.fechaInicio ||
        !projectData.fechaEstimada
      ) {
        setError("Por favor complete los campos requeridos en Información General");
        setTabActiva("info");
        setLoading(false);
        return;
      }

      const proyectoData: CreateProyectoInput = {
        nombre: projectData.nombre,
        area_beneficiada: projectData.areaBeneficiada,
        descripcion: projectData.descripcion,
        encargados: encargadosList
          .map((nombre) => ({ nombre }))
          .filter((e) => e.nombre),
        fecha_inicio: projectData.fechaInicio,
        fecha_estimada: projectData.fechaEstimada,
        fecha_entrega: projectData.fechaEntrega || null,
        estado: projectData.estado as any,
        tipo_proyecto: "actualizacion",
      };

      const proyectoId = await createProyecto(proyectoData);
      if (!proyectoId) throw new Error("Error al crear el proyecto");

      // ✅ Guardar procesos
      if (procesos.length > 0) {
        const procesosData: CreateProcesoInput[] = procesos.map((p, index) => ({
          proyecto_id: proyectoId,
          nombre: p.nombre,
          tiempo_antes: Number(p.tiempo_antes),
          tiempo_despues: Number(p.tiempo_despues),
          frecuencia_tipo: (p.frecuencia_tipo || frecuenciaTipo) as any,
          frecuencia_cantidad:
            Number(p.frecuencia_cantidad) || Number(frecuenciaCantidad),
          dias_semana: Number(p.dias_semana) || Number(diasPorSemana) || 5,
          orden: index + 1,
        }));
        await createProcesos(procesosData);
      }

      // ✅ Guardar beneficios
      if (beneficios.length > 0) {
        const beneficiosData: CreateBeneficioInput[] = beneficios.map((b) => ({
          proyecto_id: proyectoId,
          descripcion: b.descripcion,
        }));
        await createBeneficios(beneficiosData);
      }

      navigate(`/gestion_proyectos/${proyectoId}`);
    } catch (err) {
      console.error("Error guardando proyecto:", err);
      setError("Error al guardar el proyecto. Intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Tabs config ─────────────────────────────────────────────────────────────
  const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "info",       label: "Información General", icon: <DescriptionIcon sx={{ fontSize: 16 }} /> },
    { id: "procesos",   label: "Procesos",             icon: <TimerIcon       sx={{ fontSize: 16 }} />, badge: procesos.length   || undefined },
    { id: "beneficios", label: "Beneficios",           icon: <StarIcon        sx={{ fontSize: 16 }} />, badge: beneficios.length || undefined },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ minHeight: "100vh", p: 3 }}>
      <Box sx={{ maxWidth: "90%", mx: "auto" }}>

        {/* ── Header ── */}
        <Paper
          elevation={0}
          sx={{
            mb: 3, px: 3, py: 2,
            borderRadius: 3,
            backgroundColor: "white",
            border: "1px solid #e8eaed",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <VolverButton
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/gestion_proyectos")}
            >
              Volver
            </VolverButton>
            <Box>
              <Typography variant="h6" fontWeight="bold" color="#1a2a3ae0">
                Crear Nuevo Proyecto
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registra un nuevo proyecto y mide el impacto en tiempo
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => navigate("/gestion_proyectos")}
              sx={{ boxShadow: "none", border: "1px solid #e0e0e0", color: "#555", "&:hover": { bgcolor: "#f5f5f5", boxShadow: "none" } }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              sx={{ backgroundColor: "#004680", boxShadow: "none", "&:hover": { bgcolor: "#005aa3", boxShadow: "none" } }}
            >
              {loading ? "Guardando..." : "Crear Proyecto"}
            </Button>
          </Box>
        </Paper>

            {/* ── Error ── */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* ── Tabs pegadas al panel ── */}
            <Box sx={{ overflow: "visible" }}>
              {/* Fila de pestañas */}
              <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, pl: 2.5, position: "relative", zIndex: 0 }}>
                {tabs.map((tab) => (
                  <TabButton
                    key={tab.id}
                    active={tabActiva === tab.id}
                    onClick={() => setTabActiva(tab.id)}
                    startIcon={tab.icon}
                  >
                    {tab.label}
                    {tab.badge !== undefined && (
                      <Box sx={{
                        ml: 0.5, minWidth: 18, height: 18, borderRadius: "50%",
                        bgcolor: tabActiva === tab.id ? "#004680" : "#9ca3af",
                        color: "white", fontSize: 11, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {tab.badge}
                      </Box>
                    )}
                  </TabButton>
                ))}
              </Box>

              {/* Panel de contenido conectado */}
              <Paper
                elevation={1}
                sx={{ p: 3, borderRadius: "16px 16px 16px 16px", position: "relative", zIndex: 1 }}
              >
                {tabActiva === "info" && (
                  <ProjectForm
                    data={projectData}
                    onChange={handleProjectChange}
                    encargadosList={encargadosList}
                    onAddEncargado={handleAddEncargado}
                    onRemoveEncargado={handleRemoveEncargado}
                  />
                )}

                {tabActiva === "procesos" && (
                  <ProcessList
                    procesos={procesos}
                    onAgregar={agregarProceso}
                    onEliminar={eliminarProceso}
                    onActualizar={actualizarProceso}
                    diasPorSemana={diasPorSemana}
                    onDiasPorSemanaChange={handleDiasPorSemanaChange}
                    frecuenciaTipo={frecuenciaTipo}
                    onFrecuenciaTipoChange={handleFrecuenciaTipoChange}
                    frecuenciaCantidad={frecuenciaCantidad}
                    onFrecuenciaCantidadChange={handleFrecuenciaCantidadChange}
                  />
                )}

                {tabActiva === "beneficios" && (
                  <BenefitList
                    beneficios={beneficios}
                    onAgregar={agregarBeneficio}
                    onEliminar={eliminarBeneficio}
                    onActualizar={actualizarBeneficio}
                  />
                )}
              </Paper>
            </Box>

      </Box>
    </Box>
  );
}