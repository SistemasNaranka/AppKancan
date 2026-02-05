import React, { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Popover,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
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
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  format,
  addDays,
  startOfWeek,
  addWeeks,
  subWeeks,
  isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";
import type { Reserva, EstadoReserva } from "../types/reservas.types";
import {
  SALAS_DISPONIBLES,
  puedeModificarse,
  COLORES_ESTADO,
  COLORES_TEXTO_ESTADO,
  getReservaColor,
  capitalize,
} from "../types/reservas.types";

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

// Horas del día (7:00 AM - 4:00 PM)
const HORAS = Array.from({ length: 10 }, (_, i) => {
  const hora = 7 + i;
  return `${hora.toString().padStart(2, "0")}:00`;
});

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

  // Formatear hora 12h
  const formatearHora12h = (hora: string): string => {
    const [h] = hora.split(":");
    const hour = parseInt(h);
    if (hour === 12) return "12:00 PM";
    if (hour > 12) return `${hour - 12}:00 PM`;
    return `${hour}:00 AM`;
  };

  // Obtener color según estado (para chip de estado)
  const getColorEstado = (reserva: Reserva) => {
    const estado = (reserva.estadoCalculado || reserva.estado) as EstadoReserva;
    return {
      bg: COLORES_ESTADO[estado] || "#F3F4F6",
      text: COLORES_TEXTO_ESTADO[estado] || "#374151",
    };
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

  // Handler para DatePicker
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFechaBase(date);
    }
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

  const rangoFechas = `${format(diasSemana[0], "d MMM", { locale: es })} - ${format(diasSemana[4], "d MMM, yyyy", { locale: es })}`;
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
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a2a3a" }}>
            Horario Semanal
          </Typography>

          {onNuevaReserva && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => onNuevaReserva()}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "primary.main",
                boxShadow: "none",
                borderRadius: 1.5,
                px: 2.5,
                "&:hover": {
                  backgroundColor: "primary.dark",
                  boxShadow: "none",
                },
              }}
            >
              Reservar Ahora
            </Button>
          )}
        </Box>

        {/* Fila de controles: Toggles | Navegación | Rango fechas */}
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 1.5,
            mb: 2,
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            backgroundColor: "#fff",
          }}
        >
          {/* Toggles a la izquierda */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {/* Toggle Semanal/Mes */}
            {onCambiarVista && (
              <ToggleButtonGroup
                value={vistaCalendario}
                exclusive
                onChange={(_, valor) => {
                  if (valor) onCambiarVista(valor);
                }}
                size="small"
                sx={{
                  "& .MuiToggleButton-root": {
                    textTransform: "none",
                    px: 2,
                    py: 0.5,
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    borderColor: "#e0e0e0",
                    "&.Mui-selected": {
                      backgroundColor: "#3B82F6",
                      color: "white",
                      "&:hover": { backgroundColor: "#2563EB" },
                    },
                  },
                }}
              >
                <ToggleButton value="semanal">Semanal</ToggleButton>
                <ToggleButton value="mes">Mes</ToggleButton>
              </ToggleButtonGroup>
            )}

            {/* Toggle Salas */}
            <ToggleButtonGroup
              value={salaSeleccionada}
              exclusive
              onChange={(_, valor) => {
                if (valor) setSalaSeleccionada(valor);
              }}
              size="small"
              sx={{
                "& .MuiToggleButton-root": {
                  textTransform: "none",
                  px: 2,
                  py: 0.5,
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  borderColor: "#e0e0e0",
                  "&.Mui-selected": {
                    backgroundColor: "#3B82F6",
                    color: "white",
                    "&:hover": { backgroundColor: "#2563EB" },
                  },
                },
              }}
            >
              {SALAS_DISPONIBLES.map((sala) => (
                <ToggleButton key={sala} value={sala}>
                  {sala}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Navegación al centro-derecha */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                fontSize: "0.85rem",
                px: 1.5,
                minWidth: "auto",
              }}
            >
              Esta semana
            </Button>

            <DatePicker
              value={fechaBase}
              onChange={(newValue) => handleDateChange(newValue as Date | null)}
              slotProps={{
                textField: {
                  size: "small",
                  sx: {
                    width: 150,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1,
                      fontSize: "0.85rem",
                    },
                  },
                },
              }}
              format="dd/MM/yyyy"
            />
          </Box>

          {/* Rango de fechas a la derecha */}
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: "#1a2a3a",
              minWidth: 150,
              textAlign: "right",
            }}
          >
            {rangoFechas}
          </Typography>
        </Paper>

        {/* Calendario */}
        <Paper
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
              minWidth: 700, // Ancho mínimo para alinear con scroll horizontal
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
            }}
          >
            {HORAS.map((hora, horaIdx) => (
              <Box
                key={hora}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "80px repeat(5, 1fr)",
                  height: 60,
                  borderBottom:
                    horaIdx < HORAS.length - 1 ? "1px solid #e0e0e0" : "none",
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

                  return (
                    <Box
                      key={`${dia.toISOString()}-${hora}`}
                      onClick={() =>
                        reservasEnCelda.length === 0 &&
                        handleClickCelda(dia, hora)
                      }
                      sx={{
                        position: "relative",
                        borderRight: diaIdx < 4 ? "1px solid #e0e0e0" : "none",
                        borderBottom: "1px solid #e0e0e0",
                        backgroundColor: esHoy ? "#FAFBFF" : "transparent",
                        height: 60,
                        boxSizing: "border-box",
                        cursor:
                          reservasEnCelda.length === 0 ? "pointer" : "default",
                        "&:hover":
                          reservasEnCelda.length === 0
                            ? { backgroundColor: "#f0f9ff" }
                            : {},
                      }}
                    >
                      {reservasEnCelda.map(
                        ({ reserva, esInicio, esFin, posicion }) => {
                          const colorReserva = getReservaColor(reserva.id);
                          const estadoActual = (
                            reserva.estadoCalculado || reserva.estado
                          )?.toLowerCase();
                          const esEnCurso = estadoActual === "en curso";

                          // Determinar borderRadius
                          // Si ocupa toda la hora (60px) o es inicio y fin en misma hora → borderRadius completo
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
                                p: 1,
                                cursor: "pointer",
                                overflow: "hidden",
                                zIndex: 1,
                                "&:hover": {
                                  opacity: 0.9,
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                },
                                transition: "all 0.15s ease",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "flex-start",
                              }}
                            >
                              {esInicio && (
                                <>
                                  {/* Título */}
                                  <Typography
                                    sx={{
                                      fontSize: "0.75rem",
                                      fontWeight: 700,
                                      color: "#ffffff",
                                      lineHeight: 1.2,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      mb: 0.25,
                                    }}
                                  >
                                    {reserva.titulo_reunion || "Sin título"}
                                  </Typography>
                                  {/* Título de la reunión */}
                                  <Typography
                                    sx={{
                                      fontWeight: "bold",
                                      fontSize: "0.65rem",
                                      color: "#ffffff",
                                      opacity: 0.9,
                                      mb: 0.5,
                                    }}
                                  >
                                    {reserva.titulo_reunion || "Sin título"}
                                  </Typography>
                                  {/* Chip de estado */}
                                  <Box
                                    sx={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      backgroundColor: "rgba(255,255,255,0.2)",
                                      borderRadius: "12px",
                                      px: 0.75,
                                      py: 0.25,
                                      width: "fit-content",
                                    }}
                                  >
                                    {esEnCurso ? (
                                      <TimeIcon
                                        sx={{ fontSize: 10, color: "#ffffff" }}
                                      />
                                    ) : (
                                      <Box
                                        component="span"
                                        sx={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: "50%",
                                          border: "1.5px solid #ffffff",
                                          display: "inline-block",
                                        }}
                                      />
                                    )}
                                    <Typography
                                      sx={{
                                        fontSize: "0.55rem",
                                        fontWeight: 600,
                                        color: "#ffffff",
                                      }}
                                    >
                                      {esEnCurso ? "En curso" : "Vigente"}
                                    </Typography>
                                  </Box>
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

        {/* Popover de detalle */}
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleClosePopover}
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
