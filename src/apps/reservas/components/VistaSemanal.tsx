import React, { useState, useMemo } from "react";
import { Box, Paper, Alert } from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, startOfWeek, addWeeks, subWeeks, setMonth, setYear } from "date-fns";
import { es } from "date-fns/locale";
import { getConfiguracionReserva } from "../services/reservas";
import { SALAS_DISPONIBLES, CONFIGURACION_POR_DEFECTO } from "../types/reservas.types";
import type { Reserva } from "../types/reservas.types";
import type { VistaSemanalProps } from "./VistaSemanal.types";
import { generarHorasRango, getReservasEnCelda, formatearHora12h, ESTADOS_EXCLUIDOS } from "./VistaSemanal.utils";
import {
  SelectorSala, SelectorVista, NavegacionSemanal, SelectorFecha, PeriodoActual,
  CargandoHorarios, EncabezadoDia, CeldaHora, PopoverDetalleReserva,
} from "./VistaSemanal.components";

// ─── Hook de configuración ────────────────────────────────────────────────────

const useConfiguracionHoras = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["configuracion_reservas"],
    queryFn: getConfiguracionReserva,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const horas = useMemo(() => {
    if (isLoading || isError || !data) {
      if (isError) console.warn("⚠️ Usando configuración por defecto de horarios");
      return generarHorasRango(CONFIGURACION_POR_DEFECTO.hora_inicio_operacion, CONFIGURACION_POR_DEFECTO.hora_fin_operacion);
    }
    const horaInicio = data.hora_apertura?.split(":").slice(0, 2).join(":") || CONFIGURACION_POR_DEFECTO.hora_inicio_operacion;
    const horaFin = data.hora_cierre?.split(":").slice(0, 2).join(":") || CONFIGURACION_POR_DEFECTO.hora_fin_operacion;
    return generarHorasRango(horaInicio, horaFin);
  }, [data, isLoading, isError]);

  return { horas, isLoading, isError };
};

// ─── Componente principal ─────────────────────────────────────────────────────

const VistaSemanal: React.FC<VistaSemanalProps> = ({
  reservas, onNuevaReserva, onEditarReserva, onCancelarReserva,
  usuarioActualId, vistaCalendario = "semanal", onCambiarVista, salaInicial,
}) => {
  const [fechaBase, setFechaBase] = useState(new Date());
  const [salaSeleccionada, setSalaSeleccionada] = useState<string>(salaInicial || SALAS_DISPONIBLES[0]);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<Reserva | null>(null);

  const { horas, isLoading: isLoadingConfig, isError: isErrorConfig } = useConfiguracionHoras();

  const diasSemana = useMemo(() => {
    const inicio = startOfWeek(fechaBase, { weekStartsOn: 1 });
    return Array.from({ length: 5 }, (_, i) => addDays(inicio, i));
  }, [fechaBase]);

  const reservasSemana = useMemo(() => {
    const fechaInicio = format(diasSemana[0], "yyyy-MM-dd");
    const fechaFin = format(diasSemana[4], "yyyy-MM-dd");
    return reservas.filter((r) => {
      const estado = (r.estadoCalculado || r.estado)?.toLowerCase();
      if (ESTADOS_EXCLUIDOS.includes(estado)) return false;
      if (r.nombre_sala !== salaSeleccionada) return false;
      return r.fecha >= fechaInicio && r.fecha <= fechaFin;
    });
  }, [reservas, diasSemana, salaSeleccionada]);

  // Navegación
  const semanaAnterior  = () => setFechaBase(subWeeks(fechaBase, 1));
  const semanaSiguiente = () => setFechaBase(addWeeks(fechaBase, 1));
  const irAHoy          = () => setFechaBase(new Date());
  const handleCambiarDia = (dia: number) => { const f = new Date(fechaBase); f.setDate(dia); setFechaBase(f); };
  const handleCambiarMes = (mes: number) => setFechaBase(setMonth(fechaBase, mes));
  const handleCambiarAño = (año: number) => setFechaBase(setYear(fechaBase, año));

  // Popover
  const handleClickReserva = (e: React.MouseEvent<HTMLElement>, reserva: Reserva) => {
    e.stopPropagation();
    setReservaSeleccionada(reserva);
    setAnchorEl(e.currentTarget);
  };
  const handleClosePopover = () => { setAnchorEl(null); setReservaSeleccionada(null); };

  const rangoFechas = `${format(diasSemana[0], "d MMM", { locale: es })} - ${format(diasSemana[4], "d MMM yyyy", { locale: es })}`;
  const hoy = new Date();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} />

        <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #e0e0e0", borderRadius: 2, backgroundColor: "#fff" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <SelectorSala salaSeleccionada={salaSeleccionada} onCambiar={setSalaSeleccionada} />
            {onCambiarVista && <SelectorVista vistaCalendario={vistaCalendario} onCambiarVista={onCambiarVista} />}
            <NavegacionSemanal onAnterior={semanaAnterior} onSiguiente={semanaSiguiente} onHoy={irAHoy} />
            <SelectorFecha fechaBase={fechaBase} onCambiarDia={handleCambiarDia} onCambiarMes={handleCambiarMes} onCambiarAño={handleCambiarAño} />
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
                <EncabezadoDia key={dia.toISOString()} dia={dia} idx={idx} hoy={hoy} reservasSemana={reservasSemana} />
              ))}
            </Box>

            {/* Grid de horas */}
            <Box sx={{ flex: 1, overflowY: "auto", overflowX: "auto", width: "100%", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none", width: 0, height: 0 }, "&::-webkit-scrollbar-thumb": { display: "none" }, "&::-webkit-scrollbar-track": { display: "none" }, msOverflowStyle: "none" }}>
              {horas.map((hora, horaIdx) => (
                <Box key={hora} sx={{ display: "grid", gridTemplateColumns: "80px repeat(5, 1fr)", height: 60, borderBottom: horaIdx < horas.length - 1 ? "1px solid #e0e0e0" : "none", width: "100%", boxSizing: "border-box", minWidth: 700 }}>
                  <Box sx={{ p: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", pr: 1.5, backgroundColor: "#fafafa", borderRight: "1px solid #e0e0e0", height: 60, boxSizing: "border-box" }}>
                    <Box component="span" sx={{ color: "#6b7280", fontSize: "0.7rem" }}>{formatearHora12h(hora)}</Box>
                  </Box>
                  {diasSemana.map((dia, diaIdx) => (
                    <CeldaHora
                      key={`${dia.toISOString()}-${hora}`}
                      dia={dia} hora={hora} diaIdx={diaIdx} hoy={hoy}
                      reservasEnCelda={getReservasEnCelda(reservasSemana, dia, hora, format)}
                      salaSeleccionada={salaSeleccionada}
                      onNuevaReserva={onNuevaReserva}
                      onClickReserva={handleClickReserva}
                    />
                  ))}
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        <PopoverDetalleReserva
          anchorEl={anchorEl} reservaSeleccionada={reservaSeleccionada}
          usuarioActualId={usuarioActualId} onClose={handleClosePopover}
          onEditar={onEditarReserva} onCancelar={onCancelarReserva}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default VistaSemanal;