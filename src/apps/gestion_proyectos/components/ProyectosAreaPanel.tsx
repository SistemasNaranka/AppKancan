// src/apps/gestion_proyectos/components/ProyectosAreaPanel.tsx
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
} from "@mui/material";
import {
  Close as CloseIcon,
  AutoAwesomeMosaic as AutoAwesomeMosaicICon,
  ExpandMore as ExpandMoreIcon,
  ShowChart as ShowChartIcon,
} from "@mui/icons-material";
import { PieChart } from "@mui/x-charts/PieChart";
import { Bar } from "react-chartjs-2";
import type { Project } from "../types";

interface ProyectosAreaPanelProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
}

export function ProjectsAreaPanel({ open, onClose, projects }: ProyectosAreaPanelProps) {
  const COLORES_AREA = [
    "#E91E63", "#FF9800", "#009688", "#3F51B5", "#8BC34A",
    "#CDDC39", "#673AB7", "#03A9F4", "#FFC107", "#9E9E9E",
    "#7B1FA2", "#004D40",
  ];

  const AREAS_PREDEFINIDAS = [
    "Contabilidad", "Recursos Humanos", "Logística", "Diseño",
    "Sistemas", "Mercadeo", "Comercial", "Administrativa"
  ];

  const projectsByArea = React.useMemo(() => {
    const counts = new Map<string, number>();
    AREAS_PREDEFINIDAS.forEach(area => counts.set(area, 0));
    
    projects.forEach(project => {
      const area = project.benefited_area || "Sin área";
      if (counts.has(area)) {
        counts.set(area, (counts.get(area) || 0) + 1);
      } else if (!counts.has(area)) {
        counts.set(area, 1);
      }
    });
    
    return Array.from(counts.entries())
      .map(([area, quantity]) => ({ area, quantity }))
      .filter(item => item.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity);
  }, [projects]);

  const totalProjects = projects.length;
  const colorsUsed = projectsByArea.map((_, i) => COLORES_AREA[i % COLORES_AREA.length]);

  const pieChartData = projectsByArea.map((item, index) => ({
    id: index,
    value: item.quantity,
    label: item.area,
    color: colorsUsed[index],
  }));

  const barData = {
    labels: projectsByArea.map(d => d.area.length > 20 ? d.area.substring(0, 20) + "..." : d.area),
    datasets: [{
      label: "Cantidad de Proyectos",
      data: projectsByArea.map(d => d.quantity),
      backgroundColor: colorsUsed,
      borderColor: colorsUsed.map(c => c),
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const barOptions = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context: any) => `${context.raw} proyectos (${((context.raw / totalProjects) * 100).toFixed(1)}%)` } },
    },
    scales: {
      x: { beginAtZero: true, title: { display: true, text: "Cantidad de Proyectos" }, ticks: { stepSize: 1 } },
      y: { ticks: { font: { size: 11 } } },
    },
  };

  const [accordionExpanded, setAccordionExpanded] = useState(true);

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: { xs: "95vw", sm: "85vw", md: 1200 }, maxHeight: "88vh", overflowY: "auto",
          bgcolor: "transparent", outline: "none", borderRadius: 3,
        }}
      >
        <Paper elevation={0} sx={{ p: 3, borderRadius: "12px 12px 0 0", background: "#004680", color: "white", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ p: 1.25, bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2, display: "flex" }}>
              <AutoAwesomeMosaicICon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>Proyectos por Área</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>Total: {totalProjects} proyectos</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.15)" } }}>
            <CloseIcon />
          </IconButton>
        </Paper>

        <Paper elevation={3} sx={{ borderRadius: "12px 12px 0px 0px", p: 2.5, display: "flex", flexDirection: "column", gap: 1.5, bgcolor: "#fff" }}>
          <Accordion 
            expanded={accordionExpanded}
            onChange={() => setAccordionExpanded(!accordionExpanded)} 
            elevation={0} 
            sx={{ borderRadius: "12px !important", border: "1px solid", borderColor: "divider", boxShadow: "none", overflow: "hidden", bgcolor: "white", mt: 2, "&:before": { display: "none" }, "&.Mui-expanded": { margin: "8px 0 0 0" } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#1a2a3a" }} />} sx={{ bgcolor: "#f1f3f4", "&:hover": { bgcolor: "#f8f9fa" } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ShowChartIcon sx={{ color: "#004680", fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#1a2b45" }}>Distribución de Proyectos por Área</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
              {projectsByArea.length === 0 ? (
                <Typography variant="body2" sx={{ color: "text.disabled", textAlign: "center", py: 4 }}>No hay proyectos para mostrar</Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mt: 1 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5, display: "block", textAlign: "center" }}>Distribución Porcentual</Typography>
                      <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}>
                        <Box sx={{ height: 280, width: '100%', display: 'flex', justifyContent: 'center' }}>
                          <PieChart
                            series={[{
                              data: pieChartData, innerRadius: 50, outerRadius: 90, paddingAngle: 2, cornerRadius: 4, highlightScope: { fade: 'global', highlight: 'item' }, faded: { innerRadius: 40, additionalRadius: -10 }, valueFormatter: (item) => `${item.value} proyectos (${((item.value / totalProjects) * 100).toFixed(1)}%)`,
                            }]}
                            width={320} height={260}
                            sx={{ '& .MuiChartsLegend-root': { fontSize: '11px', padding: '4px' }, '& .MuiChartsLegend-mark': { width: 15, height: 15 } }}
                            slotProps={{ legend: { direction: 'vertical' as const, position: { vertical: 'middle' as const, horizontal: 'end' as const } }, tooltip: { sx: { bgcolor: 'white', color: 'text.primary', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: 1, p: 1.5, fontSize: '12px' } } }}
                          />
                        </Box>
                      </Paper>
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5, display: "block", textAlign: "center" }}>Cantidades Absolutas</Typography>
                      <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}>
                        <Box sx={{ height: 280 }}><Bar data={barData} options={barOptions} /></Box>
                      </Paper>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2, p: 2, bgcolor: "#f8f9fa", borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: "#1a2a3a" }}>Detalle por Área</Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {projectsByArea.map((item, i) => (
                        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1, borderRadius: 1, bgcolor: "white", border: "1px solid #e0e0e0" }}>
                          <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: colorsUsed[i], flexShrink: 0 }} />
                          <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>{item.area}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#004680" }}>{item.quantity}</Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", minWidth: 50, textAlign: "right" }}>{((item.quantity / totalProjects) * 100).toFixed(1)}%</Typography>
                        </Box>
                      ))}
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