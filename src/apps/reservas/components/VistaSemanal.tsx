import React, { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Popover,
  Tooltip,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Close as CloseIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Room as RoomIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as AreaIcon,
  Notes as NotesIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  addDays,
  startOfWeek,
  addWeeks,
  subWeeks,
  isSameDay,
  setMonth,
  setYear,
} from "date-fns";
import { es } from "date-fns/locale";
import { getConfiguracionReserva } from "../services/reservas";
import type { Reserva, EstadoReserva } from "../types/reservas.types";
import {
  SALAS_DISPONIBLES,
  puedeModificarse,
  COLORES_ESTADO,
  COLORES_TEXTO_ESTADO,
  getReservaColor,
  capitalize,
  CONFIGURACION_POR_DEFECTO,
} from "../types/reservas.types";
import PulsatingMeetingIndicator from "./PulsatingMeetingIndicator";

// Nombres de los meses en español
const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// Años disponibles
const AÑOS = Array.from({ length: 7 }, (_, i) => 2024 + i);

// Días del mes para selector
const DIAS = Array.from({ length: 31 }, (_, i) => i + 1);

interface VistaSemanalProps {
  reservas: Reserva[];
  onNuevaReserva?: (fecha?: string, sala?: string, hora?: string) => void;
  onEditarReserva?: (reserva: Reserva) => void;
  onCancelarReserva?: (reserva: Reserva) => void;
  usuarioActualId?: string;
  vistaCalendario?: "semanal" | "mes";
  onCambiarVista?: (vista: "semanal" | "mes") => void;
  salaInicial?: string;
}

/**
 * Genera un array de horas en formato HH:mm desde la hora de inicio hasta la hora de fin
 * @param horaInicio - Hora de inicio en formato HH:mm (ej: "07:00")
 * @param horaFin - Hora de fin en formato HH:mm (ej: "18:00")
 * @returns Array de horas en formato HH:mm
 */
const generarHorasRango = (horaInicio: string, horaFin: string): string[] => {
  const horas: string[] = [];

  const [horaIni, minIni] = horaInicio.split(":").map(Number);
  const [horaFinNum, minFin] = horaFin.split(":").map(Number);

  // Usar hora de inicio como primer valor
  let horaActual = horaIni;

  while (horaActual <= horaFinNum) {
    // Agregar la hora actual al array
    horas.push(`${horaActual.toString().padStart(2, "0")}:00`);
    horaActual++;
  }

  return horas;
};

/**
 * Convierte hora de formato 24h a 12h con AM/PM
 * @param hora - Hora en formato HH:mm
 * @returns Hora en formato 12h con AM/PM (ej: "7:00 AM")
 */
const formatearHora12h = (hora: string): string => {
  const [h, m] = hora.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hora12 = h % 12 || 12;
  return `${hora12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const VistaSemanal: React.FC<VistaSemanalProps> = ({
  reservas,
  onNuevaReserva,
  onEditarReserva,
  onCancelarReserva,
  usuarioActualId,
  vistaCalendario = "semanal",
  onCambiarVista,
  salaInicial,
}) => {
  const [fechaBase, setFechaBase] = useState(new Date());
  const [salaSeleccionada, setSalaSeleccionada] = useState<string>(
    salaInicial || SALAS_DISPONIBLES[0],
  );

  // Popover para detalle de reserva
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [reservaSeleccionada, setReservaSeleccionada] =
    useState<Reserva | null>(null);

  // Obtener configuración de horarios desde la base de datos
  const {
    data: configuracion,
    isLoading: isLoadingConfig,
    isError: isErrorConfig,
  } = useQuery({
    queryKey: ["configuracion_reservas"],
    queryFn: getConfiguracionReserva,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    retry: 1,
  });

  // Generar horas dinámicas basadas en la configuración
  const horas = useMemo(() => {
    if (isLoadingConfig) {
      // Usar configuración por defecto mientras carga
      return generarHorasRango(
        CONFIGURACION_POR_DEFECTO.hora_inicio_operacion,
        CONFIGURACION_POR_DEFECTO.hora_fin_operacion,
      );
    }

    if (isErrorConfig || !configuracion) {
      // Usar configuración por defecto en caso de error
      console.warn("⚠️ Usando configuración por defecto de horarios");
      return generarHorasRango(
        CONFIGURACION_POR_DEFECTO.hora_inicio_operacion,
        CONFIGURACION_POR_DEFECTO.hora_fin_operacion,
      );
    }

    // Extraer horas de la configuración (quitar segundos si los hay)
    const horaInicio =
      configuracion.hora_apertura?.split(":").slice(0, 2).join(":") ||
      CONFIGURACION_POR_DEFECTO.hora_inicio_operacion;
    const horaFin =
      configuracion.hora_cierre?.split(":").slice(0, 2).join(":") ||
      CONFIGURACION_POR_DEFECTO.hora_fin_operacion;

    console.log("✅ Generando horas desde", horaInicio, "hasta", horaFin);
    return generarHorasRango(horaInicio, horaFin);
  }, [configuracion, isLoadingConfig, isErrorConfig]);

  // Calcular días de la semana (Lunes a Viernes)
  const diasSemana = useMemo(() => {
    const inicio = startOfWeek(fechaBase, { weekStartsOn: 1 });
    return Array.from({ length: 5 }, (_, i) => addDays(inicio, i));
  }, [fechaBase]);

  // Filtrar reservas de la semana para la sala seleccionada
  const reservasSemana = useMemo(() => {
    const fechaInicio = format(diasSemana[0], "yyyy-MM-dd");
    const fechaFin = format(diasSemana[4], "yyyy-MM-dd");

    return reservas.filter((r) => {
      const estado = (r.estadoCalculado || r.estado)?.toLowerCase();
      if (
        estado === "cancelado" ||
        estado === "cancelada" ||
        estado === "finalizado" ||
        estado === "finalizada"
      ) {
        return false;
      }
      if (r.nombre_sala !== salaSeleccionada) {
        return false;
      }
      return r.fecha >= fechaInicio && r.fecha <= fechaFin;
    });
  }, [reservas, diasSemana, salaSeleccionada]);

  // Navegación
  const semanaAnterior = () => setFechaBase(subWeeks(fechaBase, 1));
  const semanaSiguiente = () => setFechaBase(addWeeks(fechaBase, 1));
  const irAHoy = () => setFechaBase(new Date());

  // Cambiar día
  const handleCambiarDia = (dia: number) => {
    const nuevaFecha = new Date(fechaBase);
    nuevaFecha.setDate(dia);
    setFechaBase(nuevaFecha);
  };

  // Cambiar mes
  const handleCambiarMes = (mes: number) => {
    setFechaBase(setMonth(fechaBase, mes));
  };

  // Cambiar año
  const handleCambiarAño = (año: number) => {
    setFechaBase(setYear(fechaBase, año));
  };

  // Formatear hora 12h (maneja minutos correctamente)
  const formatearHora12h = (hora: string): string => {
    const [h, m] = hora.split(":");
    const hour = parseInt(h);
    const min = m || "00";
    const ampm = hour >= 12 ? "PM" : "AM";
    const hora12 = hour % 12 || 12;
    return `${hora12}:${min} ${ampm}`;
  };

  // Obtener color según estado (para chip de estado)
  const getColorEstado = (reserva: Reserva) => {
    const estado = (reserva.estadoCalculado || reserva.estado) as EstadoReserva;
    return {
      bg: COLORES_ESTADO[estado] || "#F3F4F6",
      text: COLORES_TEXTO_ESTADO[estado] || "#374151",
    };
  };

  //truncar texto

  const truncarTexto = (texto: string, limite: number) => {
    if (!texto) return "";
    return texto.length > limite ? texto.slice(0, limite) + "..." : texto;
  };

  // Generar bloques por hora para una reserva (con soporte para media hora)
  const generarBloquesPorHora = (
    reserva: Reserva,
  ): {
    hora: string;
    esInicio: boolean;
    esFin: boolean;
    posicion: { top: number; height: number };
  }[] => {
    const [horaIni, minIni] = reserva.hora_inicio.split(":").map(Number);
    const [horaFin, minFin] = reserva.hora_final.split(":").map(Number);
    const alturaHora = 60;

    const bloques: {
      hora: string;
      esInicio: boolean;
      esFin: boolean;
      posicion: { top: number; height: number };
    }[] = [];

    // Determinar horas afectadas
    const horaFinAjustada = minFin > 0 ? horaFin + 1 : horaFin;

    for (let h = horaIni; h < horaFinAjustada; h++) {
      let top = 0;
      let height = alturaHora;

      if (h === horaIni) {
        // Primera hora: empieza en los minutos de inicio
        top = (minIni / 60) * alturaHora;
        height = ((60 - minIni) / 60) * alturaHora;

        // Si la reserva termina en esta hora (horaIni === horaFin)
        if (horaIni === horaFin) {
          height = ((minFin - minIni) / 60) * alturaHora;
        } else if (horaIni + 1 === horaFin && minFin > 0) {
          // Termina en la siguiente hora pero con minutos
          height = ((60 - minIni) / 60) * alturaHora;
        }
      } else if (h === horaFin) {
        // Última hora: termina en los minutos de fin
        height = (minFin / 60) * alturaHora;
      }

      bloques.push({
        hora: `${h.toString().padStart(2, "0")}:00`,
        esInicio: h === horaIni,
        esFin: h === horaFin,
        posicion: { top, height },
      });
    }

    return bloques;
  };

  // Obtener reservas para una celda específica con posición exacta
  const getReservasEnCelda = (
    dia: Date,
    hora: string,
  ): {
    reserva: Reserva;
    esInicio: boolean;
    esFin: boolean;
    posicion: { top: number; height: number };
  }[] => {
    const fechaStr = format(dia, "yyyy-MM-dd");
    const horaNum = parseInt(hora.split(":")[0]);

    const resultado: {
      reserva: Reserva;
      esInicio: boolean;
      esFin: boolean;
      posicion: { top: number; height: number };
    }[] = [];

    reservasSemana.forEach((r) => {
      if (r.fecha !== fechaStr) return;

      const bloques = generarBloquesPorHora(r);
      const bloque = bloques.find(
        (b) => parseInt(b.hora.split(":")[0]) === horaNum,
      );

      if (bloque) {
        resultado.push({
          reserva: r,
          esInicio: bloque.esInicio,
          esFin: bloque.esFin,
          posicion: bloque.posicion,
        });
      }
    });

    return resultado;
  };

  // Verificar si puede modificar
  const puedeModificar = (reserva: Reserva): boolean => {
    if (!usuarioActualId) return false;
    if (!reserva.usuario_id) return false;
    if (reserva.usuario_id.id !== usuarioActualId) return false;
    const estadoActual = reserva.estadoCalculado || reserva.estado;
    return puedeModificarse(estadoActual);
  };

  // Handler para click en celda vacía
  const handleClickCelda = (dia: Date, hora: string) => {
    if (onNuevaReserva) {
      const fechaStr = format(dia, "yyyy-MM-dd");
      onNuevaReserva(fechaStr, salaSeleccionada, hora);
    }
  };

  // Handlers del popover
  const handleClickReserva = (
    event: React.MouseEvent<HTMLElement>,
    reserva: Reserva,
  ) => {
    event.stopPropagation();
    setReservaSeleccionada(reserva);
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setReservaSeleccionada(null);
  };

  // Obtener texto de estado
  const getEstadoTexto = (reserva: Reserva): string => {
    const estado = (reserva.estadoCalculado || reserva.estado)?.toLowerCase();
    switch (estado) {
      case "en curso":
        return "En curso";
      case "vigente":
        return "Vigente";
      default:
        return estado || "";
    }
  };

  const rangoFechas = `${format(diasSemana[0], "d MMM", { locale: es })} - ${format(diasSemana[4], "d MMM yyyy", { locale: es })}`;
  const hoy = new Date();

  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box
        sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}
      >
        {/* Header: Título + Botón Reservar */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
        </Box>

        {/* Barra de filtros reorganizada */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            backgroundColor: "#fff",
          }}
        >
          {/* Fila de controles principales */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {/* GRUPO 1: SALA */}
            <Box className="tour-sala-selector" sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "bold",
                  color: "#303030",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Sala
              </Typography>
              {/* Segmented Control - Sala */}
              <Box
                sx={{
                  display: "flex",
                  backgroundColor: "#f1f5f9",
                  borderRadius: "10px",
                  padding: "4px",
                  position: "relative",
                }}
              >
                {/* Slider animado */}
                <Box
                  sx={{
                    position: "absolute",
                    top: "4px",
                    left: salaSeleccionada === SALAS_DISPONIBLES[0] ? "4px" : "calc(49.5% + 1px)",
                    width: "calc(50% - 10px)",
                    height: "calc(100% - 8px)",
                    backgroundColor: "#004680",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    transition: "left 0.2s ease",
                  }}
                />
                {SALAS_DISPONIBLES.map((sala) => (
                  <Box
                    key={sala}
                    onClick={() => setSalaSeleccionada(sala)}
                    sx={{
                      px: 2,
                      py: 0.5,
                      fontSize: "0.85rem",
                      fontWeight: 400,
                      color: salaSeleccionada === sala ? "#ffffff" : "#64748b",
                      cursor: "pointer",
                      borderRadius: "8px",
                      position: "relative",
                      zIndex: 1,
                      transition: "color 0.2s ease",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sala}
                  </Box>
                ))}
              </Box>
            </Box>

            {/* GRUPO 2: VISTA */}
            <Box className="tour-vista-selector" sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "bold",
                  color: "#303030",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Vista
              </Typography>
              {onCambiarVista && (
                /* Segmented Control - Vista */
                <Box
                  sx={{
                    display: "flex",
                    backgroundColor: "#f1f5f9",
                    borderRadius: "10px",
                    padding: "4px",
                    position: "relative",
                  }}
                >
                  {/* Slider animado */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: "4px",
                      left: vistaCalendario === "semanal" ? "4px" : "calc(50% + 2px)",
                      width: "calc(50% - -10px)",
                      height: "calc(100% - 8px)",
                      backgroundColor: "#004680",
                      borderRadius: "8px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      transition: "left 0.2s ease",
                    }}
                  />
                  <Box
                    onClick={() => onCambiarVista("semanal")}
                    sx={{
                      px: 2,
                      py: 0.5,
                      fontSize: "0.85rem",
                      fontWeight: 400,
                      color: vistaCalendario === "semanal" ? "#ffffff" : "#64748b",
                      cursor: "pointer",
                      borderRadius: "8px",
                      position: "relative",
                      zIndex: 1,
                      transition: "color 0.2s ease",
                      userSelect: "none",
                    }}
                  >
                    Semanal
                  </Box>
                  <Box
                    onClick={() => onCambiarVista("mes")}
                    sx={{
                      px: 2,
                      py: 0.5,
                      fontSize: "0.85rem",
                      fontWeight: 400,
                      color: vistaCalendario === "mes" ? "#1e293b" : "#64748b",
                      cursor: "pointer",
                      borderRadius: "8px",
                      position: "relative",
                      zIndex: 1,
                      transition: "color 0.2s ease",
                      userSelect: "none",
                    }}
                  >
                    Mes
                  </Box>
                </Box>
              )}
            </Box>

            {/* GRUPO 3: NAVEGACIÓN */}
            <Box className="tour-navegacion" sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: "#303030",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Navegación
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <IconButton
                  onClick={semanaAnterior}
                  size="small"
                  sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={semanaSiguiente}
                  size="small"
                  sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}
                >
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={irAHoy}
                  sx={{
                    textTransform: "none",
                    borderColor: "#e0e0e0",
                    color: "#374151",
                    fontSize: "0.8rem",
                    px: 1.5,
                    minWidth: "auto",
                  }}
                >
                  Esta semana
                </Button>
              </Box>
            </Box>

            {/* GRUPO 4: FECHA */}
            <Box className="tour-selector-fecha" sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: "#303030",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Fecha
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <FormControl size="small" sx={{ minWidth: 60 }}>
                  <Select
                    value={fechaBase.getDate()}
                    onChange={(e) => handleCambiarDia(e.target.value as number)}
                    sx={{
                      fontSize: "0.85rem",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#e0e0e0",
                      },
                    }}
                  >
                    {DIAS.map((dia) => (
                      <MenuItem key={dia} value={dia}>
                        {dia}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={fechaBase.getMonth()}
                    onChange={(e) => handleCambiarMes(e.target.value as number)}
                    sx={{
                      fontSize: "0.85rem",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#e0e0e0",
                      },
                    }}
                  >
                    {MESES.map((mes, index) => (
                      <MenuItem key={mes} value={index}>
                        {mes}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <Select
                    value={fechaBase.getFullYear()}
                    onChange={(e) => handleCambiarAño(e.target.value as number)}
                    sx={{
                      fontSize: "0.85rem",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#e0e0e0",
                      },
                    }}
                  >
                    {AÑOS.map((año) => (
                      <MenuItem key={año} value={año}>
                        {año}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* GRUPO 5: PERÍODO ACTUAL (derecha) */}
            <Box className="tour-periodo"
              sx={{
                ml: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: "#303030",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Período
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: "#1a2a3a",
                  fontSize: "0.95rem",
                  backgroundColor: "#f3f4f6",
                  px: 2,
                  py: 0.75,
                  borderRadius: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {rangoFechas}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Error al cargar configuración */}
        {isErrorConfig && (
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            sx={{ mb: 2, borderRadius: 2 }}
          >
            No se pudo cargar la configuración de horarios. Mostrando horarios
            por defecto.
          </Alert>
        )}

        {/* Calendario */}
        {isLoadingConfig ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 400,
              gap: 2,
            }}
          >
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              Cargando horarios...
            </Typography>
          </Box>
        ) : (
          <Paper
            className="tour-calendario"
            elevation={0}
            sx={{
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              overflow: "hidden",
              width: "100%",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            {/* Header de días */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "80px repeat(5, 1fr)",
                borderBottom: "1px solid #e0e0e0",
                width: "100%",
                flexShrink: 0,
                minWidth: 700,
              }}
            >
              <Box
                sx={{
                  p: 1,
                  backgroundColor: "#f9fafb",
                  borderRight: "1px solid #e0e0e0",
                  borderBottom: "1px solid #e0e0e0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 60,
                  boxSizing: "border-box",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    fontSize: "0.7rem",
                  }}
                >
                  Hora
                </Typography>
              </Box>
              {diasSemana.map((dia, idx) => {
                const esHoy = isSameDay(dia, hoy);
                const fechaStr = format(dia, "yyyy-MM-dd");
                const reservaEnCurso = reservasSemana.find(
                  (r) =>
                    r.fecha === fechaStr &&
                    r.estadoCalculado?.toLowerCase() === "en curso",
                );
                return (
                  <Box
                    key={dia.toISOString()}
                    sx={{
                      p: 1,
                      textAlign: "center",
                      backgroundColor: esHoy ? "#EFF6FF" : "#f9fafb",
                      borderRight: idx < 4 ? "1px solid #e0e0e0" : "none",
                      borderBottom: "1px solid #e0e0e0",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 60,
                      boxSizing: "border-box",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          color: esHoy ? "#004680" : "#1a2a3a",
                          textTransform: "capitalize",
                          fontSize: "0.85rem",
                        }}
                      >
                        {format(dia, "EEEE", { locale: es })}
                      </Typography>
                      {/* Indicador pulsante si hay reunión en curso hoy */}
                      {reservaEnCurso && (
                        <PulsatingMeetingIndicator
                          meetingDate={fechaStr}
                          startTime={reservaEnCurso.hora_inicio}
                          endTime={reservaEnCurso.hora_final}
                          size={6}
                          color="success"
                        />
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: esHoy ? "#005AA3" : "#6b7280",
                        fontSize: "0.75rem",
                      }}
                    >
                      {format(dia, "d MMM", { locale: es })}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {/* Grid de horas - con scroll */}
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                overflowX: "auto",
                width: "100%",
                // Scrollbar hide - Cross-browser compatible
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": {
                  display: "none",
                  width: 0,
                  height: 0,
                },
                "&::-webkit-scrollbar-thumb": {
                  display: "none",
                },
                "&::-webkit-scrollbar-track": {
                  display: "none",
                },
                msOverflowStyle: "none",
              }}
            >
              {horas.map((hora, horaIdx) => (
                <Box
                  key={hora}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "80px repeat(5, 1fr)",
                    height: 60,
                    borderBottom:
                      horaIdx < horas.length - 1 ? "1px solid #e0e0e0" : "none",
                    width: "100%",
                    boxSizing: "border-box",
                    minWidth: 700,
                  }}
                >
                  <Box
                    sx={{
                      p: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      pr: 1.5,
                      backgroundColor: "#fafafa",
                      borderRight: "1px solid #e0e0e0",
                      height: 60,
                      boxSizing: "border-box",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: "#6b7280", fontSize: "0.7rem" }}
                    >
                      {formatearHora12h(hora)}
                    </Typography>
                  </Box>

                  {diasSemana.map((dia, diaIdx) => {
                    const reservasEnCelda = getReservasEnCelda(dia, hora);
                    const esHoy = isSameDay(dia, hoy);

                    // Calcular zonas libres para permitir clics
                    // Zona superior libre: 0-30px, Zona inferior libre: 30-60px
                    const zonaSuperiorOcupada = reservasEnCelda.some(({ posicion }) => 
                      posicion.top < 30 && (posicion.top + posicion.height) > 0
                    );
                    const zonaInferiorOcupada = reservasEnCelda.some(({ posicion }) => 
                      posicion.top < 60 && (posicion.top + posicion.height) > 30
                    );

                    // Formatear horas para mostrar en hover
                    const [h] = hora.split(":");
                    const horaCompleta = formatearHora12h(hora);
                    const horaMedia = formatearHora12h(`${h}:30`);

                    return (
                      <Box
                        key={`${dia.toISOString()}-${hora}`}
                        sx={{
                          position: "relative",
                          borderRight:
                            diaIdx < 4 ? "1px solid #e0e0e0" : "none",
                          borderBottom: "1px solid #e0e0e0",
                          backgroundColor: esHoy ? "#FAFBFF" : "transparent",
                          height: 60,
                          boxSizing: "border-box",
                        }}
                      >
                        {/* Línea punteada de media hora */}
                        <Box
                          sx={{
                            position: "absolute",
                            top: "50%",
                            left: 0,
                            right: 0,
                            height: "1px",
                            borderTop: "1px dashed #d0d0d0",
                            pointerEvents: "none",
                            zIndex: 0,
                          }}
                        />

                        {/* Zona clickeable superior (primera media hora) */}
                        {!zonaSuperiorOcupada && (
                          <Box
                            onClick={() => handleClickCelda(dia, hora)}
                            sx={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              height: 30,
                              cursor: "pointer",
                              zIndex: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 0.5,
                              transition: "all 0.15s ease",
                              "&:hover": {
                                backgroundColor: "rgba(16, 185, 129, 0.12)",
                                "& .hover-indicator": {
                                  opacity: 1,
                                },
                              },
                            }}
                          >
                            <Box
                              className="hover-indicator"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                opacity: 0,
                                transition: "opacity 0.15s ease",
                                backgroundColor: "rgba(16, 185, 129, 0.9)",
                                color: "#fff",
                                borderRadius: "4px",
                                px: 0.75,
                                py: 0.25,
                              }}
                            >
                              <AddIcon sx={{ fontSize: 12 }} />
                              <Typography sx={{ fontSize: "0.65rem", fontWeight: 600 }}>
                                {horaCompleta}
                              </Typography>
                            </Box>
                          </Box>
                        )}

                        {/* Zona clickeable inferior (segunda media hora) */}
                        {!zonaInferiorOcupada && (
                          <Box
                            onClick={() => {
                              // Crear reserva a las :30
                              if (onNuevaReserva) {
                                const fechaStr = format(dia, "yyyy-MM-dd");
                                const horaMedia30 = `${h}:30`;
                                onNuevaReserva(fechaStr, salaSeleccionada, horaMedia30);
                              }
                            }}
                            sx={{
                              position: "absolute",
                              top: 30,
                              left: 0,
                              right: 0,
                              height: 30,
                              cursor: "pointer",
                              zIndex: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 0.5,
                              transition: "all 0.15s ease",
                              "&:hover": {
                                backgroundColor: "rgba(16, 185, 129, 0.12)",
                                "& .hover-indicator": {
                                  opacity: 1,
                                },
                              },
                            }}
                          >
                            <Box
                              className="hover-indicator"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                opacity: 0,
                                transition: "opacity 0.15s ease",
                                backgroundColor: "rgba(16, 185, 129, 0.9)",
                                color: "#fff",
                                borderRadius: "4px",
                                px: 0.75,
                                py: 0.25,
                              }}
                            >
                              <AddIcon sx={{ fontSize: 12 }} />
                              <Typography sx={{ fontSize: "0.65rem", fontWeight: 600 }}>
                                {horaMedia}
                              </Typography>
                            </Box>
                          </Box>
                        )}

                        {reservasEnCelda.map(
                          ({ reserva, esInicio, esFin, posicion }) => {
                            const colorReserva = getReservaColor(reserva.id);
                            const estadoActual = (
                              reserva.estadoCalculado || reserva.estado
                            )?.toLowerCase();
                            const esVigente = estadoActual === "vigente";

                            // Detectar si tiene horas medias
                            const [, minIni] = reserva.hora_inicio.split(":").map(Number);
                            const [, minFin] = reserva.hora_final.split(":").map(Number);
                            const tieneHoraMediaInicio = minIni > 0;
                            const tieneHoraMediaFin = minFin > 0;
                            const tieneHorasMedias = tieneHoraMediaInicio || tieneHoraMediaFin;

                            // Determinar borderRadius
                            const alturaCompleta =
                              Math.abs(posicion.height - 60) < 1;
                            const borderRadius =
                              alturaCompleta || (esInicio && esFin)
                                ? "8px"
                                : esInicio
                                  ? "8px 8px 0 0"
                                  : esFin
                                    ? "0 0 8px 8px"
                                    : "0";

                            return (
                              <Box
                                key={`${reserva.id}-${hora}`}
                                onClick={(e) => handleClickReserva(e, reserva)}
                                sx={{
                                  position: "absolute",
                                  top: posicion.top + 2,
                                  left: 4,
                                  right: 4,
                                  height: posicion.height - 4,
                                  backgroundColor: colorReserva,
                                  borderRadius: borderRadius,
                                  px: 1,
                                  py: 0.5,
                                  cursor: "pointer",
                                  overflow: "hidden",
                                  zIndex: 1,
                                  "&:hover": {
                                    opacity: 0.9,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                  },
                                  transition: "all 0.15s ease",
                                  display: "flex",
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 0.5,
                                  // Borde especial para horas medias
                                  ...(tieneHorasMedias && esInicio && {
                                    borderLeft: "3px solid rgba(255,255,255,0.6)",
                                  }),
                                }}
                              >
                                {esInicio && (
                                  <>
                                    {/* Título a la izquierda */}
                                    <Typography
                                      sx={{
                                        fontSize: "0.75rem",
                                        fontWeight: 700,
                                        color: "#ffffff",
                                        lineHeight: 1.2,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        flex: 1,
                                        minWidth: 0,
                                      }}
                                    >
                                      {reserva.titulo_reunion || "Sin título"}
                                    </Typography>
                                    
                                    {/* Estado Vigente a la derecha - SOLO si es vigente */}
                                    {esVigente && (
                                      <Box
                                        sx={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 0.5,
                                          backgroundColor: "rgba(255,255,255,0.25)",
                                          borderRadius: "12px",
                                          px: 0.75,
                                          py: 0.25,
                                          flexShrink: 0,
                                        }}
                                      >
                                        <Box
                                          component="span"
                                          sx={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: "50%",
                                            border: "1.5px solid #ffffff",
                                            display: "inline-block",
                                          }}
                                        />
                                        <Typography
                                          sx={{
                                            fontSize: "0.55rem",
                                            fontWeight: 600,
                                            color: "#ffffff",
                                          }}
                                        >
                                          Vigente
                                        </Typography>
                                      </Box>
                                    )}
                                  </>
                                )}
                              </Box>
                            );
                          },
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Paper>
        )}
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleClosePopover}
          disableScrollLock={true}
          anchorOrigin={{ vertical: "center", horizontal: "right" }}
          transformOrigin={{ vertical: "center", horizontal: "left" }}
          PaperProps={{
            sx: {
              width: 340,
              maxHeight: 450,
              borderRadius: 2,
              boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            },
          }}
        >
          {reservaSeleccionada &&
            (() => {
              const colorReserva = getReservaColor(reservaSeleccionada.id);
              const coloresEstado = getColorEstado(reservaSeleccionada);
              const estado =
                reservaSeleccionada.estadoCalculado ||
                reservaSeleccionada.estado;

              // Título: primero titulo_reunion, si no existe "Sin título"
              const tituloMostrar =
                reservaSeleccionada.titulo_reunion || "Sin título";

              return (
                <Box>
                  {/* Header con color - TÍTULO DE LA REUNIÓN */}
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: colorReserva,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Box sx={{ flex: 1, pr: 1 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          color: "#ffffff",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {tituloMostrar}
                      </Typography>
                      <Chip
                        label={estado}
                        size="small"
                        sx={{
                          mt: 0.5,
                          backgroundColor: "rgba(255,255,255,0.25)",
                          color: "#ffffff",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          height: 20,
                        }}
                      />
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {puedeModificar(reservaSeleccionada) && (
                        <>
                          {onEditarReserva && (
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  handleClosePopover();
                                  onEditarReserva(reservaSeleccionada);
                                }}
                                sx={{ color: "#ffffff" }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {onCancelarReserva && (
                            <Tooltip title="Cancelar">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  handleClosePopover();
                                  onCancelarReserva(reservaSeleccionada);
                                }}
                                sx={{ color: "#ffffff" }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </>
                      )}
                      <IconButton
                        size="small"
                        onClick={handleClosePopover}
                        sx={{ color: "#ffffff" }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Contenido */}
                  <Box sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 1.5,
                      }}
                    >
                      <TimeIcon sx={{ color: "#6b7280", fontSize: 20 }} />
                      <Typography variant="body2">
                        {reservaSeleccionada.hora_inicio.substring(0, 5)} -{" "}
                        {reservaSeleccionada.hora_final.substring(0, 5)}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 1.5,
                      }}
                    >
                      <RoomIcon sx={{ color: "#6b7280", fontSize: 20 }} />
                      <Typography variant="body2">
                        {reservaSeleccionada.nombre_sala}
                      </Typography>
                    </Box>

                    {reservaSeleccionada.usuario_id && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          mb: 1.5,
                        }}
                      >
                        <PersonIcon sx={{ color: "#6b7280", fontSize: 20 }} />
                        <Typography variant="body2">
                          {reservaSeleccionada.usuario_id.first_name}{" "}
                          {reservaSeleccionada.usuario_id.last_name}
                        </Typography>
                      </Box>
                    )}

                    {reservaSeleccionada.area && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          mb: 1.5,
                        }}
                      >
                        <AreaIcon sx={{ color: "#6b7280", fontSize: 20 }} />
                        <Typography variant="body2">
                          {capitalize(reservaSeleccionada.area)}
                        </Typography>
                      </Box>
                    )}

                    {/* Observaciones */}
                    {reservaSeleccionada.observaciones && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1.5,
                          mt: 2,
                          pt: 2,
                          borderTop: "1px solid #e0e0e0",
                        }}
                      >
                        <NotesIcon
                          sx={{ color: "#6b7280", fontSize: 20, mt: 0.25 }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ color: "#374151", whiteSpace: "pre-wrap" }}
                        >
                          {reservaSeleccionada.observaciones}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })()}
        </Popover>
      </Box>
    </LocalizationProvider>
  );
};

export default VistaSemanal;