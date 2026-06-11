import React, { useState, useMemo } from "react";
import { Box, Paper, Alert } from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, startOfWeek, addWeeks, subWeeks, setMonth, setYear } from "date-fns";
import { es } from "date-fns/locale";
import { getReservationConfig } from "../services/reservas";
import { AVAILABLE_ROOMS, DEFAULT_RESERVATION_CONFIG } from "../types/reservas.types";
import type { Reservation } from "../types/reservas.types";
import type { VistaSemanalProps } from "./VistaSemanal.types";
import { generateHoursRange, getReservationsInCell, formatHour12h, ESTADOS_EXCLUIDOS } from "./VistaSemanal.utils";
import { useHolidays } from "../hooks/useHolidays";
import {
  SelectorSala, SelectorVista, NavegacionSemanal, SelectorFecha, PeriodoActual,
  CargandoHorarios, EncabezadoDia, CeldaHora, PopoverDetalleReserva,
} from "./VistaSemanal.components";


const useHoursConfig = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["configuracion_reservas"],
    queryFn: getReservationConfig,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const horas = useMemo(() => {
    if (isLoading || isError || !data) {
      if (isError) console.warn("⚠️ Usando configuración por defecto de horarios");
      return generateHoursRange(DEFAULT_RESERVATION_CONFIG.operation_start_time, DEFAULT_RESERVATION_CONFIG.operation_end_time);
    }
    const horaInicio = data.opening_time?.split(":").slice(0, 2).join(":") || DEFAULT_RESERVATION_CONFIG.operation_start_time;
    const horaFin = data.closing_time?.split(":").slice(0, 2).join(":") || DEFAULT_RESERVATION_CONFIG.operation_end_time;
    return generateHoursRange(horaInicio, horaFin);
  }, [data, isLoading, isError]);

  return { horas, isLoading, isError };
};


const VistaSemanal: React.FC<VistaSemanalProps> = ({
  reservations, onNewReservation, onEditReservation, onCancelReservation,
  currentUserId, calendarView = "semanal", onViewChange, initialRoom,
}) => {
  const [baseDate, setBaseDate] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState<string>(initialRoom || AVAILABLE_ROOMS[0]);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const { horas, isLoading: isLoadingConfig, isError: isErrorConfig } = useHoursConfig();

  const { data: festivos = {} } = useHolidays(baseDate.getFullYear());

  const diasSemana = useMemo(() => {
    const inicio = startOfWeek(baseDate, { weekStartsOn: 1 });
    return Array.from({ length: 5 }, (_, i) => addDays(inicio, i));
  }, [baseDate]);

  const reservasSemana = useMemo(() => {
    const fechaInicio = format(diasSemana[0], "yyyy-MM-dd");
    const fechaFin = format(diasSemana[4], "yyyy-MM-dd");
    return reservations.filter((r) => {
      const estado = (r.calculatedStatus || r.status)?.toLowerCase();
      if (ESTADOS_EXCLUIDOS.includes(estado)) return false;
      if (r.room_name !== selectedRoom) return false;
      return r.date >= fechaInicio && r.date <= fechaFin;
    });
  }, [reservations, diasSemana, selectedRoom]);

  const previousWeek  = () => setBaseDate(subWeeks(baseDate, 1));
  const nextWeek = () => setBaseDate(addWeeks(baseDate, 1));
  const goToToday          = () => setBaseDate(new Date());
  const handleCambiarDia = (dia: number) => { const f = new Date(baseDate); f.setDate(dia); setBaseDate(f); };
  const handleCambiarMes = (mes: number) => setBaseDate(setMonth(baseDate, mes));
  const handleCambiarAño = (año: number) => setBaseDate(setYear(baseDate, año));

  const handleClickReserva = (e: React.MouseEvent<HTMLElement>, reserva: Reservation) => {
    e.stopPropagation();
    setSelectedReservation(reserva);
    setAnchorEl(e.currentTarget);
  };
  const handleClosePopover = () => { setAnchorEl(null); setSelectedReservation(null); };

  const rangoFechas = `${format(diasSemana[0], "d MMM", { locale: es })} - ${format(diasSemana[4], "d MMM yyyy", { locale: es })}`;
  const hoy = new Date();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} />

        <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #e0e0e0", borderRadius: 2, backgroundColor: "#fff" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <SelectorSala selectedRoom={selectedRoom} onChange={setSelectedRoom} />
            {onViewChange && <SelectorVista calendarView={calendarView} onViewChange={onViewChange} />}
            <NavegacionSemanal onPrevious={previousWeek} onNext={nextWeek} onToday={goToToday} />
            <SelectorFecha baseDate={baseDate} onDayChange={handleCambiarDia} onMonthChange={handleCambiarMes} onYearChange={handleCambiarAño} />
            <PeriodoActual rangoFechas={rangoFechas} />
          </Box>
        </Paper>

        {isErrorConfig && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2, borderRadius: 2 }}>
            No se pudo cargar la configuración de horarios. Mostrando horarios por defecto.
          </Alert>
        )}

        {isLoadingConfig ? <CargandoHorarios /> : (
          <Paper className="tour-calendario" elevation={0} sx={{
            border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden",
            width: "100%", flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
          }}>
            {/* Encabezado de días */}
            <Box sx={{ display: "grid", gridTemplateColumns: "80px repeat(5, 1fr)", borderBottom: "1px solid #e0e0e0", width: "100%", flexShrink: 0, minWidth: 700 }}>
              <Box sx={{ p: 1, backgroundColor: "#f9fafb", borderRight: "1px solid #e0e0e0", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", height: 60, boxSizing: "border-box" }}>
                <Box component="span" sx={{ fontWeight: 600, color: "#6b7280", textTransform: "uppercase", fontSize: "0.7rem" }}>Hora</Box>
              </Box>
              {diasSemana.map((dia, idx) => (
                <EncabezadoDia key={dia.toISOString()} day={dia} idx={idx} today={hoy} weeklyReservations={reservasSemana} holidayName={festivos[format(dia, "yyyy-MM-dd")]} />
              ))}
            </Box>

            {/* Grid de horas */}
            <Box sx={{ flex: 1, overflowY: "auto", overflowX: "auto", width: "100%", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none", width: 0, height: 0 }, "&::-webkit-scrollbar-thumb": { display: "none" }, "&::-webkit-scrollbar-track": { display: "none" }, msOverflowStyle: "none" }}>
              {horas.map((hora, horaIdx) => (
                <Box key={hora} sx={{ display: "grid", gridTemplateColumns: "80px repeat(5, 1fr)", height: 60, borderBottom: horaIdx < horas.length - 1 ? "1px solid #e0e0e0" : "none", width: "100%", boxSizing: "border-box", minWidth: 700 }}>
                  <Box sx={{ p: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", pr: 1.5, backgroundColor: "#fafafa", borderRight: "1px solid #e0e0e0", height: 60, boxSizing: "border-box" }}>
                    <Box component="span" sx={{ color: "#6b7280", fontSize: "0.7rem" }}>{formatHour12h(hora)}</Box>
                  </Box>
                  {diasSemana.map((dia, diaIdx) => (
                    <CeldaHora
                      key={`${dia.toISOString()}-${hora}`}
                      dia={dia} hora={hora} diaIdx={diaIdx} hoy={hoy}
                      reservasEnCelda={getReservationsInCell(reservasSemana, dia, hora, format)}
                      selectedRoom={selectedRoom}
                      onNewReservation={onNewReservation}
                      onClickReserva={handleClickReserva}
                    />
                  ))}
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        <PopoverDetalleReserva
          anchorEl={anchorEl} selectedReservation={selectedReservation}
          currentUserId={currentUserId} onClose={handleClosePopover}
          onEditar={onEditReservation} onCancelar={onCancelReservation}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default VistaSemanal;