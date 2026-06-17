import React, { useRef, useEffect, useState } from "react";
import { Box, Paper, Typography, IconButton, Button, FormControl, Select, MenuItem } from "@mui/material";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { AVAILABLE_ROOMS } from "../types/reservas.types";
import { MESES, AÑOS } from "./CalendarUtils";

interface FilterBarProps {
  selectedRoom: string;
  setSelectedRoom: (s: string) => void;
  calendarView: string;
  onViewChange?: (v: "semanal" | "mes") => void;
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onMonthChange: (m: number) => void;
  onYearChange: (a: number) => void;
  showWeekends: boolean;
  setShowWeekends: (v: boolean) => void;
  currentMonthLabel: string;
}

export const FilterBar: React.FC<FilterBarProps> = (props) => {
  const {
    selectedRoom, setSelectedRoom, calendarView, onViewChange,
    currentDate, onPrevious, onNext, onToday,
    onMonthChange, onYearChange, showWeekends, setShowWeekends, currentMonthLabel
  } = props;

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
        const isSala1 = selectedRoom === AVAILABLE_ROOMS[0];
        setSalaSliderPos({
          left: (isSala1 ? s1.left : s2.left) - cont.left + 4,
          width: (isSala1 ? s1.width : s2.width) - 8
        });
      }
    }
  }, [selectedRoom]);

  useEffect(() => {
    if (semanalRef.current && mesRef.current) {
      const sem = semanalRef.current.getBoundingClientRect();
      const mes = mesRef.current.getBoundingClientRect();
      const cont = semanalRef.current.parentElement?.getBoundingClientRect();
      if (cont) {
        const isSem = calendarView === "semanal";
        setSliderPos({
          left: (isSem ? sem.left : mes.left) - cont.left + 4,
          width: (isSem ? sem.width : mes.width) - 8
        });
      }
    }
  }, [calendarView]);

  return (
    <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e0e0e0", borderRadius: 2, backgroundColor: "#fff" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
        {/* Grupo Sala */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: "bold", color: "#303030", fontSize: "0.7rem", textTransform: "uppercase" }}>Sala</Typography>
          <Box sx={{ display: "inline-flex", backgroundColor: "#f1f5f9", borderRadius: "10px", padding: "4px", position: "relative" }}>
            <Box sx={{ position: "absolute", top: "4px", left: salaSliderPos.left, width: salaSliderPos.width, height: "calc(100% - 8px)", backgroundColor: "#004680", borderRadius: "8px", transition: "all 0.25s ease" }} />
            {AVAILABLE_ROOMS.map((sala, idx) => (
              <Box key={sala} ref={idx === 0 ? sala1Ref : sala2Ref} onClick={() => setSelectedRoom(sala)}
                sx={{ px: 2, py: 0.5, fontSize: "0.85rem", color: selectedRoom === sala ? "#fff" : "#64748b", cursor: "pointer", position: "relative", zIndex: 1 }}>
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
            <Box ref={semanalRef} onClick={() => onViewChange?.("semanal")} sx={{ px: 2, py: 0.5, fontSize: "0.85rem", color: calendarView === "semanal" ? "#fff" : "#64748b", cursor: "pointer", position: "relative", zIndex: 1 }}>Semanal</Box>
            <Box ref={mesRef} onClick={() => onViewChange?.("mes")} sx={{ px: 2, py: 0.5, fontSize: "0.85rem", color: calendarView === "mes" ? "#fff" : "#64748b", cursor: "pointer", position: "relative", zIndex: 1 }}>Mes</Box>
          </Box>
        </Box>

        {/* Navegación */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#303030", fontSize: "0.7rem", textTransform: "uppercase" }}>Navegación</Typography>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <IconButton onClick={onPrevious} size="small" sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}><ChevronLeftIcon fontSize="small" /></IconButton>
            <IconButton onClick={onNext} size="small" sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}><ChevronRightIcon fontSize="small" /></IconButton>
            <Button variant="outlined" size="small" onClick={onToday} sx={{ textTransform: "none", borderColor: "#e0e0e0", color: "#374151", fontSize: "0.8rem" }}>Hoy</Button>
          </Box>
        </Box>

        {/* Selectores de Fecha */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#303030", fontSize: "0.7rem", textTransform: "uppercase" }}>Fecha</Typography>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select value={currentDate.getMonth()} onChange={(e) => onMonthChange(e.target.value as number)} sx={{ fontSize: "0.85rem" }}>
                {MESES.map((mes, index) => <MenuItem key={mes} value={index}>{mes}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select value={currentDate.getFullYear()} onChange={(e) => onYearChange(e.target.value as number)} sx={{ fontSize: "0.85rem" }}>
                {AÑOS.map(año => <MenuItem key={año} value={año}>{año}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Fines de Semana */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#303030", fontSize: "0.7rem", textTransform: "uppercase" }}>Fines de semana</Typography>
          <Box onClick={() => setShowWeekends(!showWeekends)} sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", px: 1.5, py: 0.5, backgroundColor: showWeekends ? "#004680" : "#f1f5f9", borderRadius: "10px", cursor: "pointer" }}>
            {showWeekends ? <VisibilityIcon sx={{ fontSize: 18, color: "#fff" }} /> : <VisibilityOffIcon sx={{ fontSize: 18, color: "#64748b" }} />}
          </Box>
        </Box>

        {/* Período Actual */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#303030", fontSize: "0.7rem", textTransform: "uppercase" }}>Período</Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#1a2a3a", backgroundColor: "#f3f4f6", px: 2, py: 0.75, borderRadius: 1 }}>{currentMonthLabel}</Typography>
        </Box>
      </Box>
    </Paper>
  );
};