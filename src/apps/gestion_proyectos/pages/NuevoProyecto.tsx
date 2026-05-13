// src/apps/gestion_proyectos/pages/NuevoProyecto.tsx
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import DescriptionIcon from '@mui/icons-material/Description';
import TimerIcon from '@mui/icons-material/Timer';
import StarIcon from '@mui/icons-material/Star';
import {
  createProject,
  createProcesses,
  createBenefits,
} from "../api/directus/create";
import type {
  CreateProjectInput,
  CreateProcessInput,
  CreateBenefitInput,
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
interface ProcessForm {
  id: string;
  name: string;
  time_before: number;
  time_after: number;
  frequency_type: string;
  frequency_quantity: number;
  weekdays: number;
}

interface BenefitForm {
  id: string;
  description: string;
}

interface ProjectFormData {
  name: string;
  benefitedArea: string;
  description: string;
  assignees: string;
  startDate: string;
  estimatedDate: string;
  deliveryDate: string;
  status: string;
  projectType: string;
}

type TabId = "info" | "processes" | "benefits";

// ──────────── Componente ───────────────
export default function NewProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("info");

  const [projectData, setProjectData] = useState<ProjectFormData>({
    name: "",
    benefitedArea: "",
    description: "",
    assignees: "",
    startDate: "",
    estimatedDate: "",
    deliveryDate: "",
    status: "en_proceso",
    projectType: "mejora",
  });

  const [processes, setProcesses] = useState<ProcessForm[]>([]);
  const [globalWeekdays, setGlobalWeekdays] = useState<string>("5");
  const [globalFrequencyType, setGlobalFrequencyType] = useState<string>("diaria");
  const [globalFrequencyQuantity, setGlobalFrequencyQuantity] = useState<string>("1");
  const [benefits, setBenefits] = useState<BenefitForm[]>([]);
  const [assigneesList, setAssigneesList] = useState<string[]>([]);

  // ─── Assignees ─────────────────────────────────────────────────────────────
  const handleAddAssignee = (name: string) =>
    setAssigneesList((prev) => [...prev, name]);
  const handleRemoveAssignee = (index: number) =>
    setAssigneesList((prev) => prev.filter((_, i) => i !== index));
  const handleProjectChange = (field: keyof ProjectFormData, value: string) =>
    setProjectData((prev) => ({ ...prev, [field]: value }));

  // ─── Global frequency ──────────────────────────────────────────────────────
  const handleWeekdaysChange = (value: string) => {
    setGlobalWeekdays(value);
    setProcesses((prev) =>
      prev.map((p) => ({ ...p, weekdays: Number(value) || 5 }))
    );
  };
  const handleFrequencyTypeChange = (value: string) => {
    setGlobalFrequencyType(value);
    setProcesses((prev) => prev.map((p) => ({ ...p, frequency_type: value })));
  };
  const handleFrequencyQuantityChange = (value: string) => {
    setGlobalFrequencyQuantity(value);
    setProcesses((prev) =>
      prev.map((p) => ({ ...p, frequency_quantity: Number(value) }))
    );
  };

  // ─── Processes ────────────────────────────────────────────────────────────────
  const addProcess = () =>
    setProcesses((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "",
        time_before: 0,
        time_after: 0,
        frequency_type: globalFrequencyType,
        frequency_quantity: Number(globalFrequencyQuantity),
        weekdays: Number(globalWeekdays) || 5,
      },
    ]);
  const removeProcess = (id: string) =>
    setProcesses((prev) => prev.filter((p) => p.id !== id));
  const updateProcess = (id: string, field: string, value: any) =>
    setProcesses((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );

  // ─── Benefits ──────────────────────────────────────────────────────────────
  const addBenefit = () =>
    setBenefits((prev) => [
      ...prev,
      { id: Date.now().toString(), description: "" },
    ]);
  const removeBenefit = (id: string) =>
    setBenefits((prev) => prev.filter((b) => b.id !== id));
  const updateBenefit = (id: string, description: string) =>
    setBenefits((prev) =>
      prev.map((b) => (b.id === id ? { ...b, description } : b))
    );

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (
        !projectData.name ||
        !projectData.benefitedArea ||
        !projectData.startDate ||
        !projectData.estimatedDate
      ) {
        setError("Por favor complete los campos requeridos en Información General");
        setActiveTab("info");
        setLoading(false);
        return;
      }

      const inputData: CreateProjectInput = {
        name: projectData.name,
        benefited_area: projectData.benefitedArea,
        description: projectData.description,
        assignees: assigneesList
          .map((name) => ({ name }))
          .filter((e) => e.name),
        start_date: projectData.startDate,
        estimated_date: projectData.estimatedDate,
        delivery_date: projectData.deliveryDate || null,
        status: projectData.status as any,
        project_type: projectData.projectType as any,
      };

      const projectId = await createProject(inputData);
      if (!projectId) throw new Error("Error al crear el proyecto");

      // ✅ Save processes
      if (processes.length > 0) {
        const processesData: CreateProcessInput[] = processes.map((p, index) => ({
          project_id: projectId,
          name: p.name,
          time_before: Number(p.time_before),
          time_after: Number(p.time_after),
          frequency_type: (p.frequency_type || globalFrequencyType) as any,
          frequency_quantity:
            Number(p.frequency_quantity) || Number(globalFrequencyQuantity),
          weekdays: Number(p.weekdays) || Number(globalWeekdays) || 5,
          order: index + 1,
        }));
        await createProcesses(processesData);
      }

      // ✅ Save benefits
      if (benefits.length > 0) {
        const benefitsData: CreateBenefitInput[] = benefits.map((b) => ({
          project_id: projectId,
          description: b.description,
        }));
        await createBenefits(benefitsData);
      }

      navigate(`/gestion_proyectos/${projectId}`);
    } catch (err) {
      console.error("Error guardando proyecto:", err);
      setError("Error al guardar el proyecto. Intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Tabs config ─────────────────────────────────────────────────────────────
  const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "info", label: "Información General", icon: <DescriptionIcon sx={{ fontSize: 16 }} /> },
    { id: "processes", label: "Procesos", icon: <TimerIcon sx={{ fontSize: 16 }} />, badge: processes.length || undefined },
    { id: "benefits", label: "Beneficios", icon: <StarIcon sx={{ fontSize: 16 }} />, badge: benefits.length || undefined },
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

        {/* ── Tabs ── */}
        <Box sx={{ overflow: "visible" }}>
          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, pl: 2.5, position: "relative", zIndex: 0 }}>
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                startIcon={tab.icon}
              >
                {tab.label}
                {tab.badge !== undefined && (
                  <Box sx={{
                    ml: 0.5, minWidth: 18, height: 18, borderRadius: "50%",
                    bgcolor: activeTab === tab.id ? "#004680" : "#9ca3af",
                    color: "white", fontSize: 11, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {tab.badge}
                  </Box>
                )}
              </TabButton>
            ))}
          </Box>

          <Paper
            elevation={1}
            sx={{ p: 3, borderRadius: "16px 16px 16px 16px", position: "relative", zIndex: 1 }}
          >
            {activeTab === "info" && (
              <ProjectForm
                data={projectData}
                onChange={handleProjectChange}
                assigneesList={assigneesList}
                onAddAssignee={handleAddAssignee}
                onRemoveAssignee={handleRemoveAssignee}
              />
            )}

            {activeTab === "processes" && (
              <ProcessList
                processes={processes}
                onAdd={addProcess}
                onDelete={removeProcess}
                onUpdate={updateProcess}
                daysPerWeek={globalWeekdays}
                onDaysPerWeekChange={handleWeekdaysChange}
                frequencyType={globalFrequencyType}
                onFrequencyTypeChange={handleFrequencyTypeChange}
                frequencyQuantity={globalFrequencyQuantity}
                onFrequencyQuantityChange={handleFrequencyQuantityChange}
              />
            )}

            {activeTab === "benefits" && (
              <BenefitList
                benefits={benefits}
                onAdd={addBenefit}
                onDelete={removeBenefit}
                onUpdate={updateBenefit}
              />
            )}
          </Paper>
        </Box>

      </Box>
    </Box>
  );
}