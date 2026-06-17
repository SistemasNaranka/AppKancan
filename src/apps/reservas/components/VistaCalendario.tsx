import React, { useState, useMemo } from "react";
import { Box, Paper, Tooltip, Typography } from "@mui/material";
import { useHolidays } from "../hooks/useHolidays";
import { useQuery } from "@tanstack/react-query";
import { format, isSameDay, isSameMonth, subMonths, addMonths, setMonth, setYear } from "date-fns";
import { getMonthlyReservations } from "../services/reservas";
import type { Reservation } from "../types/reservas.types";
import { getReservationColor, canBeModified, AVAILABLE_ROOMS } from "../types/reservas.types";
import { MESES, generateCalendarDays, formatTime, truncateText } from "./CalendarUtils";
import { FilterBar } from "./FilterBar";
import { DayPopover, DetailPopover } from "./CalendarPopovers";

export interface VistaCalendarioProps {
  currentUserId: string | null | undefined;
  calendarView?: "semanal" | "mes";
  onViewChange?: (vista: "semanal" | "mes") => void;
  initialRoom?: string;
  onNewReservation?: (fecha: string, sala: string) => void;
  onEditReservation?: (reserva: Reservation) => void;
  onCancelReservation?: (reserva: Reservation) => void;
}

const VistaCalendario: React.FC<VistaCalendarioProps> = (props) => {
  const { 
    onNewReservation, 
    onEditReservation, 
    onCancelReservation, 
    currentUserId, 
    calendarView = "mes", 
    onViewChange, 
    initialRoom 
  } = props;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState<string>(initialRoom || AVAILABLE_ROOMS[0]);
  const [showWeekends, setShowWeekends] = useState(false);
  const [anchorDay, setAnchorDay] = useState<HTMLElement | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [anchorReservation, setAnchorReservation] = useState<HTMLElement | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const { data: reservasRaw = [] } = useQuery({
    queryKey: ["reservas", "calendario", currentDate.getFullYear(), currentDate.getMonth() + 1],
    queryFn: () => getMonthlyReservations(currentDate.getFullYear(), currentDate.getMonth() + 1),
  });

  const { data: festivos = {} } = useHolidays(currentDate.getFullYear());

  const reservas = useMemo(() => reservasRaw.filter(r => {
    const estado = (r.calculatedStatus || r.status)?.toLowerCase() || "";
    return (estado === "vigente" || estado === "en curso") && r.room_name === selectedRoom;
  }), [reservasRaw, selectedRoom]);

  const getReservationsForDay = (fecha: Date) => reservas.filter(r => r.date === format(fecha, "yyyy-MM-dd"));
  
  const canModify = (reserva: Reservation) => {
    const idUsuarioReserva = reserva.user_id?.id;
    const idUsuarioLogueado = currentUserId;

    if (!idUsuarioLogueado || idUsuarioReserva !== idUsuarioLogueado) return false;
    if (!canBeModified(reserva.calculatedStatus || reserva.status)) return false;
    
    return new Date(`${reserva.date}T${reserva.start_time}`) > new Date();
  };

  const dias = generateCalendarDays(currentDate, showWeekends);
  const numColumnas = showWeekends ? 7 : 5;
  const diasSemanaLabels = showWeekends ? ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"] : ["LUN", "MAR", "MIÉ", "JUE", "VIE"];

  return (
    <Box>
      <FilterBar 
        selectedRoom={selectedRoom}
        setSelectedRoom={setSelectedRoom}
        calendarView={calendarView}
        onViewChange={onViewChange}
        currentDate={currentDate}
        showWeekends={showWeekends}
        setShowWeekends={setShowWeekends}
        onPrevious={() => setCurrentDate(subMonths(currentDate, 1))}
        onNext={() => setCurrentDate(addMonths(currentDate, 1))}
        onToday={() => setCurrentDate(new Date())}
        onMonthChange={(m) => setCurrentDate(setMonth(currentDate, m))}
        onYearChange={(a) => setCurrentDate(setYear(currentDate, a))}
        currentMonthLabel={`${MESES[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
      />

      <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${numColumnas}, 1fr)`, borderBottom: "1px solid #e0e0e0", backgroundColor: "#f9fafb" }}>
          {diasSemanaLabels.map(dia => (
            <Box key={dia} sx={{ p: 1.5, textAlign: "center", fontWeight: 600, color: "#6b7280", fontSize: "0.75rem" }}>{dia}</Box>
          ))}
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${numColumnas}, 1fr)` }}>
          {dias.map((dia, idx) => {
            const resDia = getReservationsForDay(dia);
            const esHoy = isSameDay(dia, new Date());
            const fechaStrDia = format(dia, "yyyy-MM-dd");
            const nombreFestivo = festivos[fechaStrDia];
            const esFestivo = Boolean(nombreFestivo) && isSameMonth(dia, currentDate);
            const cellBg = !isSameMonth(dia, currentDate)
              ? "#f9fafb"
              : esFestivo
                ? "#fef2f2"
                : "white";
            const dayNumberInner = (
              <Box sx={{ position: "relative", display: "inline-flex" }}>
                <Box sx={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: esHoy ? "#004680" : "transparent", color: esHoy ? "white" : isSameMonth(dia, currentDate) ? (esFestivo ? "#dc2626" : "#1a2a3a") : "#9ca3af", fontWeight: esHoy || esFestivo ? 600 : 400, fontSize: "0.875rem" }}>{format(dia, "d")}</Box>
                {esFestivo && (
                  <Box sx={{ position: "absolute", top: 2, right: 2, width: 5, height: 5, borderRadius: "50%", backgroundColor: "#dc2626", pointerEvents: "none" }} />
                )}
              </Box>
            );
            return (
              <Box key={idx} onClick={(e) => { setSelectedDay(dia); setAnchorDay(e.currentTarget); }}
                sx={{ minHeight: 110, p: 0.5, borderRight: idx % numColumnas !== numColumnas - 1 ? "1px solid #e0e0e0" : "none", borderBottom: "1px solid #e0e0e0", backgroundColor: cellBg, cursor: "pointer", "&:hover": { backgroundColor: esFestivo ? "#fee2e2" : "#f3f4f6" } }}>
                <Box sx={{ display: "flex", justifyContent: "center", mb: 0.5, alignItems: "center", gap: 0.5 }}>
                  {esFestivo ? (
                    <Tooltip title={nombreFestivo} arrow placement="top">
                      {dayNumberInner}
                    </Tooltip>
                  ) : (
                    dayNumberInner
                  )}
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {resDia.slice(0, 3).map(r => (
                    <Box key={r.id} onClick={(e) => { e.stopPropagation(); setSelectedReservation(r); setAnchorReservation(e.currentTarget); }}
                      sx={{ height: 18, backgroundColor: getReservationColor(r.id), borderRadius: "2px", px: 0.5, display: "flex", alignItems: "center" }}>
                      <Typography sx={{ fontSize: "0.6rem", fontWeight: 500, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{formatTime(r.start_time)} {truncateText(r.meeting_title || "Sin título", 15)}</Typography>
                    </Box>
                  ))}
                  {resDia.length > 3 && <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.6rem", textAlign: "center" }}>+{resDia.length - 3} más</Typography>}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>

      <DayPopover open={Boolean(anchorDay)} anchor={anchorDay} onClose={() => setAnchorDay(null)} fecha={selectedDay} reservas={selectedDay ? getReservationsForDay(selectedDay) : []} sala={selectedRoom} onNueva={(d) => onNewReservation?.(format(d, "yyyy-MM-dd"), selectedRoom)} onSelectReserva={(e, r) => { setSelectedReservation(r); setAnchorReservation(e.currentTarget); }} />
      <DetailPopover open={Boolean(anchorReservation)} anchor={anchorReservation} onClose={() => setAnchorReservation(null)} reserva={selectedReservation} puedeModificar={canModify} onEdit={onEditReservation} onCancel={onCancelReservation} />
    </Box>
  );
};

export default VistaCalendario;