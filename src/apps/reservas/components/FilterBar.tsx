import React, { useRef, useEffect, useState } from "react";
import { Box, Paper, Typography, IconButton, Button, FormControl, Select, MenuItem } from "@mui/material";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { SALAS_DISPONIBLES } from "../types/reservas.types";
import { MESES, AÑOS } from "./CalendarUtils";

interface FilterBarProps {
  salaSeleccionada: string;
  setSalaSeleccionada: (s: string) => void;
  vistaCalendario: string;
  onCambiarVista?: (v: "semanal" | "mes") => void;
  fechaActual: Date;
  navegarAnterior: () => void;
  navegarSiguiente: () => void;
  irAHoy: () => void;
  handleCambiarMes: (m: number) => void;
  handleCambiarAño: (a: number) => void;
  mostrarFinesSemana: boolean;
  setMostrarFinesSemana: (v: boolean) => void;
  mesActual: string;
}

export const FilterBar: React.FC<FilterBarProps> = (props) => {
  const {
    salaSeleccionada, setSalaSeleccionada, vistaCalendario, onCambiarVista,
    fechaActual, navegarAnterior, navegarSiguiente, irAHoy,
    handleCambiarMes, handleCambiarAño, mostrarFinesSemana, setMostrarFinesSemana, mesActual
  } = props;

  // Refs y lógica de sliders preservada exactamente del original
  const sala1Ref = useRef<HTMLDivElement>(null);
  const sala2Ref = useRef<HTMLDivElement>(null);
  const semanalRef = useRef<HTMLDivElement>(null);
  const mesRef = useRef<HTMLDivElement>(null);
  
  const [salaSliderPos, setSalaSliderPos] = useState({ left: 4, width: 60 });
  const [sliderPos, setSliderPos] = useState({ left: 4, width: 60 });

  useEffect(() => {
    if (sala1Ref.current && sala2Ref.current) {
      const s1 = sala1Ref.current.getBoundingClientRect();
      const s2 = sala2Ref.current.getBoundingClientRect();
      const cont = sala1Ref.current.parentElement?.getBoundingClientRect();
      if (cont) {
        const isSala1 = salaSeleccionada === SALAS_DISPONIBLES[0];
        setSalaSliderPos({
          left: (isSala1 ? s1.left : s2.left) - cont.left + 4,
          width: (isSala1 ? s1.width : s2.width) - 8
        });
      }
    }
  }, [salaSeleccionada]);

  useEffect(() => {
    if (semanalRef.current && mesRef.current) {
      const sem = semanalRef.current.getBoundingClientRect();
      const mes = mesRef.current.getBoundingClientRect();
      const cont = semanalRef.current.parentElement?.getBoundingClientRect();
      if (cont) {
        const isSem = vistaCalendario === "semanal";
        setSliderPos({
          left: (isSem ? sem.left : mes.left) - cont.left + 4,
          width: (isSem ? sem.width : mes.width) - 8
        });
      }
    }
  }, [vistaCalendario]);

  return (
    <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e0e0e0", borderRadius: 2, backgroundColor: "#fff" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
        {/* Grupo Sala */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: "bold", color: "#303030", fontSize: "0.7rem", textTransform: "uppercase" }}>Sala</Typography>
          <Box sx={{ display: "inline-flex", backgroundColor: "#f1f5f9", borderRadius: "10px", padding: "4px", position: "relative" }}>
            <Box sx={{ position: "absolute", top: "4px", left: salaSliderPos.left, width: salaSliderPos.width, height: "calc(100% - 8px)", backgroundColor: "#004680", borderRadius: "8px", transition: "all 0.25s ease" }} />
            {SALAS_DISPONIBLES.map((sala, idx) => (
              <Box key={sala} ref={idx === 0 ? sala1Ref : sala2Ref} onClick={() => setSalaSeleccionada(sala)}
                sx={{ px: 2, py: 0.5, fontSize: "0.85rem", color: salaSeleccionada === sala ? "#fff" : "#64748b", cursor: "pointer", position: "relative", zIndex: 1 }}>
                {sala}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Grupo Vista */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: "bold", color: "#303030", fontSize: "0.7rem", textTransform: "uppercase" }}>Vista</Typography>
          <Box sx={{ display: "inline-flex", backgroundColor: "#f1f5f9", borderRadius: "10px", padding: "4px", position: "relative" }}>
            <Box sx={{ position: "absolute", top: "4px", left: sliderPos.left, width: sliderPos.width, height: "calc(100% - 8px)", backgroundColor: "#004680", borderRadius: "8px", transition: "all 0.25s ease" }} />
            <Box ref={semanalRef} onClick={() => onCambiarVista?.("semanal")} sx={{ px: 2, py: 0.5, fontSize: "0.85rem", color: vistaCalendario === "semanal" ? "#fff" : "#64748b", cursor: "pointer", position: "relative", zIndex: 1 }}>Semanal</Box>
            <Box ref={mesRef} onClick={() => onCambiarVista?.("mes")} sx={{ px: 2, py: 0.5, fontSize: "0.85rem", color: vistaCalendario === "mes" ? "#fff" : "#64748b", cursor: "pointer", position: "relative", zIndex: 1 }}>Mes</Box>
          </Box>
        </Box>

        {/* Navegación */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#303030", fontSize: "0.7rem", textTransform: "uppercase" }}>Navegación</Typography>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <IconButton onClick={navegarAnterior} size="small" sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}><ChevronLeftIcon fontSize="small" /></IconButton>
            <IconButton onClick={navegarSiguiente} size="small" sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}><ChevronRightIcon fontSize="small" /></IconButton>
            <Button variant="outlined" size="small" onClick={irAHoy} sx={{ textTransform: "none", borderColor: "#e0e0e0", color: "#374151", fontSize: "0.8rem" }}>Hoy</Button>
          </Box>
        </Box>

        {/* Selectores de Fecha */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#303030", fontSize: "0.7rem", textTransform: "uppercase" }}>Fecha</Typography>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select value={fechaActual.getMonth()} onChange={(e) => handleCambiarMes(e.target.value as number)} sx={{ fontSize: "0.85rem" }}>
                {MESES.map((mes, index) => <MenuItem key={mes} value={index}>{mes}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select value={fechaActual.getFullYear()} onChange={(e) => handleCambiarAño(e.target.value as number)} sx={{ fontSize: "0.85rem" }}>
                {AÑOS.map(año => <MenuItem key={año} value={año}>{año}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Fines de Semana */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#303030", fontSize: "0.7rem", textTransform: "uppercase" }}>Fines de semana</Typography>
          <Box onClick={() => setMostrarFinesSemana(!mostrarFinesSemana)} sx={{ display: "inline-flex", alignItems: "center", px: 1.5, py: 0.5, backgroundColor: mostrarFinesSemana ? "#004680" : "#f1f5f9", borderRadius: "10px", cursor: "pointer" }}>
            {mostrarFinesSemana ? <VisibilityIcon sx={{ fontSize: 18, color: "#fff" }} /> : <VisibilityOffIcon sx={{ fontSize: 18, color: "#64748b" }} />}
          </Box>
        </Box>

        {/* Período Actual */}
        <Box sx={{ ml: "auto", display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#303030", fontSize: "0.7rem", textTransform: "uppercase" }}>Período</Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#1a2a3a", backgroundColor: "#f3f4f6", px: 2, py: 0.75, borderRadius: 1 }}>{mesActual}</Typography>
        </Box>
      </Box>
    </Paper>
  );
};