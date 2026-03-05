import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Grid,
  CircularProgress,
  styled,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
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

const VolverButton = styled(Button)({
  backgroundColor: "#004680",
  color: "white",
  borderRadius: 8,
  padding: "8px 16px",
  fontWeight: 500,
  textTransform: "none",
  "&:hover": { backgroundColor: "#005AA3" },
});

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

export default function NuevoProyecto() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectData, setProjectData] = useState<ProjectFormData>({
    nombre: "",
    areaBeneficiada: "",
    descripcion: "",
    encargados: "",
    fechaInicio: "",
    fechaEstimada: "",
    fechaEntrega: "",
    estado: "en_proceso",
    tipoProyecto: "mejora",
  });

  const [procesos, setProcesos] = useState<ProcesoForm[]>([]);
  const [diasPorSemana, setDiasPorSemana] = useState<string>("5");
  const [frecuenciaTipo, setFrecuenciaTipo] = useState<string>("diaria");
  const [frecuenciaCantidad, setFrecuenciaCantidad] = useState<string>("1");
  const [beneficios, setBeneficios] = useState<BeneficioForm[]>([]);
  const [encargadosList, setEncargadosList] = useState<string[]>([]);

  const handleAddEncargado = (nombre: string) => {
    setEncargadosList([...encargadosList, nombre]);
  };

  const handleRemoveEncargado = (index: number) => {
    setEncargadosList(encargadosList.filter((_, i) => i !== index));
  };

  const handleProjectChange = (field: keyof ProjectFormData, value: string) => {
    setProjectData((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ FIX: Al cambiar valores globales, sincronizarlos en todos los procesos
  const handleDiasPorSemanaChange = (value: string) => {
    setDiasPorSemana(value);
    setProcesos((prev) =>
      prev.map((p) => ({ ...p, dias_semana: Number(value) || 5 })),
    );
  };

  const handleFrecuenciaTipoChange = (value: string) => {
    setFrecuenciaTipo(value);
    setProcesos((prev) => prev.map((p) => ({ ...p, frecuencia_tipo: value })));
  };

  const handleFrecuenciaCantidadChange = (value: string) => {
    setFrecuenciaCantidad(value);
    setProcesos((prev) =>
      prev.map((p) => ({ ...p, frecuencia_cantidad: Number(value) })),
    );
  };

  const agregarBeneficio = () => {
    setBeneficios([
      ...beneficios,
      { id: Date.now().toString(), descripcion: "" },
    ]);
  };

  const eliminarBeneficio = (id: string) => {
    setBeneficios(beneficios.filter((b) => b.id !== id));
  };

  const actualizarBeneficio = (id: string, descripcion: string) => {
    setBeneficios(
      beneficios.map((b) => (b.id === id ? { ...b, descripcion } : b)),
    );
  };

  // ✅ FIX: Inicializar proceso nuevo con los valores globales actuales
  const agregarProceso = () => {
    setProcesos([
      ...procesos,
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
  };

  const eliminarProceso = (id: string) => {
    setProcesos(procesos.filter((p) => p.id !== id));
  };

  const actualizarProceso = (id: string, campo: string, valor: any) => {
    setProcesos(
      procesos.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)),
    );
  };

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
        setError("Por favor complete los campos requeridos");
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
        tipo_proyecto: projectData.tipoProyecto as any,
      };

      const proyectoId = await createProyecto(proyectoData);
      if (!proyectoId) throw new Error("Error al crear el proyecto");

      // 🔍 DEBUG: Verificar que el ID del proyecto es correcto
      console.log(
        "✅ Proyecto creado con ID:",
        proyectoId,
        "Tipo:",
        typeof proyectoId,
      );

      if (procesos.length > 0) {
        // ✅ FIX: Usar valores del proceso con fallback a los globales
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

      }

      // ✅ NUEVO: Crear beneficios si es tipo "nuevo"
      if (beneficios.length > 0 && projectData.tipoProyecto === "nuevo") {
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

  return (
    <Box sx={{ minHeight: "100vh", p: 3 }}>
      <Box sx={{ maxWidth: "90%", mx: "auto", mb: 2 }}>
        <VolverButton
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/gestion_proyectos")}
          sx={{ mb: 1 }}
        >
          Volver a proyectos
        </VolverButton>
        <Paper
          sx={{
            p: 2,
            borderLeft: 4,
            borderColor: "#fff",
            boxShadow: "none",
            borderRadius: 3,
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            Crear Nuevo Proyecto
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Registra un nuevo proyecto y mide el impacto en tiempo
          </Typography>
        </Paper>
      </Box>

      {error && (
        <Box sx={{ maxWidth: "90%", mx: "auto", mb: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <Box
        sx={{ maxWidth: "90%", mx: "auto" }}
        component="form"
        onSubmit={handleSubmit}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <ProjectForm
              data={projectData}
              onChange={handleProjectChange}
              encargadosList={encargadosList}
              onAddEncargado={handleAddEncargado}
              onRemoveEncargado={handleRemoveEncargado}
            />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            {projectData.tipoProyecto === "mejora" ? (
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
            ) : (
              <BenefitList
                beneficios={beneficios}
                onAgregar={agregarBeneficio}
                onEliminar={eliminarBeneficio}
                onActualizar={actualizarBeneficio}
              />
            )}
          </Grid>
        </Grid>

        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}
        >
          <Button
            sx={{
              backgroundColor: "#fff",
              boxShadow: "none",
              border: "none",
              "&:hover": { bgcolor: "#ebe4e4", border: "none" },
            }}
            variant="outlined"
            onClick={() => navigate("/gestion_proyectos")}
          >
            Cancelar
          </Button>
          <Button
            sx={{
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#005aa3",
                boxShadow: "none",
                borderColor: "#ff0000",
              },
            }}
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
          >
            {loading ? "Guardando..." : "Crear Proyecto"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
