import React, { useState, useMemo } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { format, isSameDay, isSameMonth, subMonths, addMonths, setMonth, setYear } from "date-fns";
import { getReservasMes } from "../services/reservas";
import type { Reserva } from "../types/reservas.types";
import { getReservaColor, puedeModificarse, SALAS_DISPONIBLES } from "../types/reservas.types";
import PulsatingMeetingIndicator from "./PulsatingMeetingIndicator";
import { MESES, generarDiasCalendario, formatearHora, truncarTexto } from "./CalendarUtils";
import { FilterBar } from "./FilterBar";
import { DayPopover, DetailPopover } from "./CalendarPopovers";

// INTERFAZ CORREGIDA
export interface VistaCalendarioProps {
  usuarioActualId: number | null;
  vistaCalendario?: "semanal" | "mes";
  onCambiarVista?: (vista: "semanal" | "mes") => void;
  salaInicial?: string;
  onNuevaReserva?: (fecha: string, sala: string) => void;
  onEditarReserva?: (reserva: Reserva) => void;
  onCancelarReserva?: (reserva: Reserva) => void;
}

const VistaCalendario: React.FC<VistaCalendarioProps> = (props) => {
  const { 
    onNuevaReserva, 
    onEditarReserva, 
    onCancelarReserva, 
    usuarioActualId, 
    vistaCalendario = "mes", 
    onCambiarVista, 
    salaInicial 
  } = props;

  const [fechaActual, setFechaActual] = useState(new Date());
  const [salaSeleccionada, setSalaSeleccionada] = useState<string>(salaInicial || SALAS_DISPONIBLES[0]);
  const [mostrarFinesSemana, setMostrarFinesSemana] = useState(false);
  const [anchorDia, setAnchorDia] = useState<HTMLElement | null>(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null);
  const [anchorReserva, setAnchorReserva] = useState<HTMLElement | null>(null);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<Reserva | null>(null);

  const { data: reservasRaw = [] } = useQuery({
    queryKey: ["reservas", "calendario", fechaActual.getFullYear(), fechaActual.getMonth() + 1],
    queryFn: () => getReservasMes(fechaActual.getFullYear(), fechaActual.getMonth() + 1),
  });

  const reservas = useMemo(() => reservasRaw.filter(r => {
    const estado = (r.estadoCalculado || r.estado)?.toLowerCase() || "";
    return (estado === "vigente" || estado === "en curso") && r.nombre_sala === salaSeleccionada;
  }), [reservasRaw, salaSeleccionada]);

  // ... dentro de VistaCalendario.tsx

  const getReservasDia = (fecha: Date) => reservas.filter(r => r.fecha === format(fecha, "yyyy-MM-dd"));
  
  const puedeModificar = (reserva: Reserva) => {
    // FIX: Convertimos a Number para asegurar que la comparación sea válida
    const idUsuarioReserva = reserva.usuario_id?.id ? Number(reserva.usuario_id.id) : null;
    const idUsuarioLogueado = usuarioActualId ? Number(usuarioActualId) : null;

    if (!idUsuarioLogueado || idUsuarioReserva !== idUsuarioLogueado) return false;
    if (!puedeModificarse(reserva.estadoCalculado || reserva.estado)) return false;
    
    return new Date(`${reserva.fecha}T${reserva.hora_inicio}`) > new Date();
  };

// ... resto del código

  const dias = generarDiasCalendario(fechaActual, mostrarFinesSemana);
  const numColumnas = mostrarFinesSemana ? 7 : 5;
  const diasSemanaLabels = mostrarFinesSemana ? ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"] : ["LUN", "MAR", "MIÉ", "JUE", "VIE"];

  return (
    <Box>
      <FilterBar 
        salaSeleccionada={salaSeleccionada}
        setSalaSeleccionada={setSalaSeleccionada}
        vistaCalendario={vistaCalendario}
        onCambiarVista={onCambiarVista}
        fechaActual={fechaActual}
        mostrarFinesSemana={mostrarFinesSemana}
        setMostrarFinesSemana={setMostrarFinesSemana}
        navegarAnterior={() => setFechaActual(subMonths(fechaActual, 1))}
        navegarSiguiente={() => setFechaActual(addMonths(fechaActual, 1))}
        irAHoy={() => setFechaActual(new Date())}
        handleCambiarMes={(m) => setFechaActual(setMonth(fechaActual, m))}
        handleCambiarAño={(a) => setFechaActual(setYear(fechaActual, a))}
        mesActual={`${MESES[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`}
      />

      <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${numColumnas}, 1fr)`, borderBottom: "1px solid #e0e0e0", backgroundColor: "#f9fafb" }}>
          {diasSemanaLabels.map(dia => (
            <Box key={dia} sx={{ p: 1.5, textAlign: "center", fontWeight: 600, color: "#6b7280", fontSize: "0.75rem" }}>{dia}</Box>
          ))}
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${numColumnas}, 1fr)` }}>
          {dias.map((dia, idx) => {
            const resDia = getReservasDia(dia);
            const esHoy = isSameDay(dia, new Date());
            return (
              <Box key={idx} onClick={(e) => { setDiaSeleccionado(dia); setAnchorDia(e.currentTarget); }}
                sx={{ minHeight: 110, p: 0.5, borderRight: idx % numColumnas !== numColumnas - 1 ? "1px solid #e0e0e0" : "none", borderBottom: "1px solid #e0e0e0", backgroundColor: isSameMonth(dia, fechaActual) ? "white" : "#f9fafb", cursor: "pointer", "&:hover": { backgroundColor: "#f3f4f6" } }}>
                <Box sx={{ display: "flex", justifyContent: "center", mb: 0.5, alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: esHoy ? "#004680" : "transparent", color: esHoy ? "white" : isSameMonth(dia, fechaActual) ? "#1a2a3a" : "#9ca3af", fontWeight: esHoy ? 600 : 400, fontSize: "0.875rem" }}>{format(dia, "d")}</Box>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {resDia.slice(0, 3).map(r => (
                    <Box key={r.id} onClick={(e) => { e.stopPropagation(); setReservaSeleccionada(r); setAnchorReserva(e.currentTarget); }}
                      sx={{ height: 18, backgroundColor: getReservaColor(r.id), borderRadius: "2px", px: 0.5, display: "flex", alignItems: "center" }}>
                      <Typography sx={{ fontSize: "0.6rem", fontWeight: 500, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{formatearHora(r.hora_inicio)} {truncarTexto(r.titulo_reunion || "Sin título", 15)}</Typography>
                    </Box>
                  ))}
                  {resDia.length > 3 && <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.6rem", textAlign: "center" }}>+{resDia.length - 3} más</Typography>}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>

      <DayPopover open={Boolean(anchorDia)} anchor={anchorDia} onClose={() => setAnchorDia(null)} fecha={diaSeleccionado} reservas={diaSeleccionado ? getReservasDia(diaSeleccionado) : []} sala={salaSeleccionada} onNueva={(d) => onNuevaReserva?.(format(d, "yyyy-MM-dd"), salaSeleccionada)} onSelectReserva={(e, r) => { setReservaSeleccionada(r); setAnchorReserva(e.currentTarget); }} />
      <DetailPopover open={Boolean(anchorReserva)} anchor={anchorReserva} onClose={() => setAnchorReserva(null)} reserva={reservaSeleccionada} puedeModificar={puedeModificar} onEdit={onEditarReserva} onCancel={onCancelarReserva} />
    </Box>
  );
};

export default VistaCalendario;