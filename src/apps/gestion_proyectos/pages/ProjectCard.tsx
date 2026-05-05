import React from "react";
import { Grid, Paper, Box, Typography, Chip } from "@mui/material";
import { Proyecto } from "../types";
import { getEstadoColor, getEstadoLabel } from "../hooks/useProyectos";
import { ProjectStatusIcon } from "../components/ProjectStatusIcon";

interface ProjectCardProps {
  proyecto: Proyecto;
  onClick: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ proyecto, onClick }) => {
  const estadoColor = getEstadoColor(proyecto.estado);
  
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
      <Paper
        elevation={0}
        onClick={onClick}
        sx={{
          cursor: "pointer", border: `2px solid ${estadoColor.bg}`, borderRadius: 3, p: 3,
          height: "100%", display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 2, transition: "all 0.2s ease", backgroundColor: "white",
          "&:hover": { boxShadow: `0 4px 12px ${estadoColor.bg}40`, transform: "translateY(-2px)", borderColor: estadoColor.text },
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
};