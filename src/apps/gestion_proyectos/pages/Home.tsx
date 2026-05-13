// src/apps/gestion_proyectos/pages/Home.tsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  AccessTime as ClockIcon,
  AutoAwesomeMosaic as AutoAwesomeMosaicICon,
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  SettingsSuggest as SettingsSuggestIcon,
  Check as CheckIcon,
  CalendarToday as CalendarTodayIcon,
  DateRange as DateRangeIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import { formatTime } from "../lib/calculos";
import { useProjects } from "../hooks/useProjects";
import type { Project, ProjectStatus } from "../types";

import { SavingsPanel } from "../components/AhorroPanel";
import { ProjectsAreaPanel } from "../components/ProyectosAreaPanel";
import { TabContainer, AnimatedTab } from "./Home.styles";
import { getTotalMetrics } from "./Home.helpers";
import { ProjectCard } from "./ProjectCard";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { projects, loading, error, reload } = useProjects();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "todos">("todos");
  const [panelOpen, setPanelOpen] = useState<"mensual" | "anual" | null>(null);
  const [panelProjectsAreaOpen, setPanelProjectsAreaOpen] = useState(false);

  const filteredProjects: Project[] =
    statusFilter === "todos"
      ? (projects ?? [])
      : (projects ?? []).filter((p: Project) => p.status === statusFilter);

  const totalMetrics = getTotalMetrics(filteredProjects);

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
          <Button variant="contained" onClick={reload} sx={{ mt: 2 }}>Reintentar</Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ paddingX: 3, paddingY: 3, minHeight: "100vh", backgroundColor: "transparent", width: "100%" }}>
      <Paper
        elevation={0}
        sx={{
          mb: 3, px: 3, py: 2, borderRadius: 3, backgroundColor: "white", border: "1px solid #e8eaed",
          display: "flex", alignItems: "center", justifyContent: "space-between",
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
          variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/gestion_proyectos/nuevo")}
        >
          Nuevo Proyecto
        </Button>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: "auto" }}>
          <Paper
            elevation={0}
            onClick={() => setPanelProjectsAreaOpen(true)}
            sx={{
              p: 2, border: "1px solid #e8eaed", borderRadius: 2, cursor: "pointer", transition: "all 0.2s ease",
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
                  {filteredProjects.length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: "auto" }}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e8eaed", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ backgroundColor: "#fef3e2", borderRadius: 2, p: 1.25, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarIcon sx={{ color: "#f9ab00", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>En Seguimiento</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "warning.main", lineHeight: 1.2 }}>
                  {filteredProjects.filter((p: Project) => p.status === "en_seguimiento").length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: "auto" }}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e8eaed", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ backgroundColor: "#e8f0fe", borderRadius: 2, p: 1.25, display: "flex", justifyContent: "center" }}>
                <ClockIcon sx={{ color: "#1a73e8", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>En Progreso</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1a73e8", lineHeight: 1.2 }}>
                  {filteredProjects.filter((p: Project) => p.status === "en_proceso").length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: "auto" }}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e8eaed", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ backgroundColor: "#e8f5e9", borderRadius: 2, p: 1.25, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckIcon sx={{ color: "#2e7d32", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>Entregados</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "#2e7d32", lineHeight: 1.2 }}>
                  {filteredProjects.filter((p: Project) => p.status === "entregado").length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: "auto" }}>
          <Paper
            elevation={0}
            onClick={() => setPanelOpen("mensual")}
            sx={{
              p: 2, border: "1px solid #ede8e8", borderRadius: 2, cursor: "pointer", transition: "all 0.2s ease",
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
                  {formatTime(totalMetrics.totalMonthlySavings)}
                </Typography>
              </Box>
              <TrendingUpIcon sx={{ color: "#c8e6c9", fontSize: 20, ml: 1 }} />
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: "auto" }}>
          <Paper
            elevation={0}
            onClick={() => setPanelOpen("anual")}
            sx={{
              p: 2, border: "1px solid #e8eaed", borderRadius: 2, cursor: "pointer", transition: "all 0.2s ease",
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
                  {formatTime(totalMetrics.totalYearlySavings)}
                </Typography>
              </Box>
              <TrendingUpIcon sx={{ color: "#bbdefb", fontSize: 20, ml: 1 }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <TabContainer>
          {[
            { id: "todos", label: "Todos" },
            { id: "en_proceso", label: "En Proceso" },
            { id: "entregado", label: "Entregado" },
            { id: "en_seguimiento", label: "En Seguimiento" },
          ].map((tab, index) => {
            const isActive = statusFilter === tab.id;
            return (
              <AnimatedTab
                key={tab.id}
                isActive={isActive}
                isFirst={index === 0}
                isLast={index === 3}
                onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
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

      {filteredProjects.length === 0 ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <Typography sx={{ color: "text.secondary", fontSize: 18 }}>No hay proyectos registrados</Typography>
          <Typography variant="body2" sx={{ color: "text.disabled", mt: 1 }}>Los proyectos que crees aparecerán aquí</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredProjects.map((project: Project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/gestion_proyectos/${project.id}`)}
            />
          ))}
        </Grid>
      )}

      <SavingsPanel
        open={panelOpen !== null}
        onClose={() => setPanelOpen(null)}
        tipo={panelOpen ?? "mensual"}
        total={panelOpen === "mensual" ? totalMetrics.totalMonthlySavings : totalMetrics.totalYearlySavings}
        proyectos={filteredProjects}
        vistaGrafico={panelOpen ?? "mensual"}
      />

      <ProjectsAreaPanel
        open={panelProjectsAreaOpen}
        onClose={() => setPanelProjectsAreaOpen(false)}
        projects={filteredProjects}
      />
    </Box>
  );
};

export default Home;