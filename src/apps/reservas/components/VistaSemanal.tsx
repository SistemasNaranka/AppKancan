// src/apps/reservas/components/VistaSemanal.tsx

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
import type { Reserva, Sala, EstadoReserva } from "../types/reservas.types";
import { SALAS_DISPONIBLES, puedeModificarse, COLORES_ESTADO, COLORES_TEXTO_ESTADO } from "../types/reservas.types";

interface VistaSemanalProps {
  reservas: Reserva[];
  onNuevaReserva?: (fecha?: string, sala?: string, hora?: string) => void;
  onEditarReserva?: (reserva: Reserva) => void;
  onCancelarReserva?: (reserva: Reserva) => void;
  usuarioActualId?: string;
  vistaCalendario?: "semanal" | "mes";
  onCambiarVista?: (vista: "semanal" | "mes") => void;
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
}) => {
  const [fechaBase, setFechaBase] = useState(new Date());
  const [salaSeleccionada, setSalaSeleccionada] = useState<string>(SALAS_DISPONIBLES[0]);
  
  // Popover para detalle de reserva
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<Reserva | null>(null);

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
      if (estado === "cancelado" || estado === "cancelada" || estado === "finalizado" || estado === "finalizada") {
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

  // Obtener color según estado
  const getColorEstado = (reserva: Reserva) => {
    const estado = (reserva.estadoCalculado || reserva.estado) as EstadoReserva;
    return {
      bg: COLORES_ESTADO[estado] || "#F3F4F6",
      text: COLORES_TEXTO_ESTADO[estado] || "#374151",
    };
  };

  // Generar bloques por hora para una reserva
  const generarBloquesPorHora = (reserva: Reserva): { hora: string; esInicio: boolean; esFin: boolean }[] => {
    const [horaIni] = reserva.hora_inicio.split(":").map(Number);
    const [horaFin, minFin] = reserva.hora_final.split(":").map(Number);
    
    const bloques: { hora: string; esInicio: boolean; esFin: boolean }[] = [];
    const horaFinAjustada = minFin > 0 ? horaFin : horaFin;
    
    for (let h = horaIni; h < horaFinAjustada; h++) {
      bloques.push({
        hora: `${h.toString().padStart(2, "0")}:00`,
        esInicio: h === horaIni,
        esFin: h === horaFinAjustada - 1,
      });
    }
    
    return bloques;
  };

  // Obtener reservas para una celda específica
  const getReservasEnCelda = (dia: Date, hora: string): { reserva: Reserva; esInicio: boolean; esFin: boolean }[] => {
    const fechaStr = format(dia, "yyyy-MM-dd");
    const horaNum = parseInt(hora.split(":")[0]);
    
    const resultado: { reserva: Reserva; esInicio: boolean; esFin: boolean }[] = [];
    
    reservasSemana.forEach((r) => {
      if (r.fecha !== fechaStr) return;
      
      const bloques = generarBloquesPorHora(r);
      const bloque = bloques.find(b => parseInt(b.hora.split(":")[0]) === horaNum);
      
      if (bloque) {
        resultado.push({
          reserva: r,
          esInicio: bloque.esInicio,
          esFin: bloque.esFin,
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
  const handleClickReserva = (event: React.MouseEvent<HTMLElement>, reserva: Reserva) => {
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
      case "en curso": return "En curso";
      case "vigente": return "Vigente";
      default: return estado || "";
    }
  };

  const rangoFechas = `${format(diasSemana[0], "d MMM", { locale: es })} - ${format(diasSemana[4], "d MMM, yyyy", { locale: es })}`;
  const hoy = new Date();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a2a3a", mb: 0.5 }}>
            Horario Semanal
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Gestiona la disponibilidad y reservas de las salas de juntas.
          </Typography>
        </Box>

        {/* Controles: Toggle vista + Toggle salas + Botón reservar */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Toggle Semanal/Mes - solo si hay onCambiarVista */}
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
                    px: 2.5,
                    py: 0.75,
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
                  px: 2.5,
                  py: 0.75,
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

          {onNuevaReserva && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => onNuevaReserva()}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "#2196F3",
                boxShadow: "none",
                "&:hover": { backgroundColor: "#1386e4", boxShadow: "none" },
              }}
            >
              Reservar Ahora
            </Button>
          )}
        </Box>

        {/* Navegación con DatePicker */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={semanaAnterior} size="small" sx={{ border: "1px solid #e0e0e0" }}>
              <ChevronLeftIcon />
            </IconButton>
            <IconButton onClick={semanaSiguiente} size="small" sx={{ border: "1px solid #e0e0e0" }}>
              <ChevronRightIcon />
            </IconButton>
            <Button
              variant="outlined"
              size="small"
              onClick={irAHoy}
              sx={{ textTransform: "none", borderColor: "#e0e0e0", color: "#374151", ml: 1 }}
            >
              Esta semana
            </Button>
            
            <DatePicker
              value={fechaBase}
              onChange={handleDateChange}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { ml: 1, width: 160, "& .MuiOutlinedInput-root": { borderRadius: 1 } },
                },
              }}
              format="dd/MM/yyyy"
            />
          </Box>

          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#1a2a3a" }}>
            {rangoFechas}
          </Typography>
        </Box>

        {/* Calendario */}
        <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden" }}>
          {/* Header de días */}
          <Box sx={{ display: "grid", gridTemplateColumns: "80px repeat(5, 1fr)", borderBottom: "1px solid #e0e0e0" }}>
            <Box sx={{ p: 1.5, backgroundColor: "#f9fafb", borderRight: "1px solid #e0e0e0" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                Hora
              </Typography>
            </Box>
            {diasSemana.map((dia, idx) => {
              const esHoy = isSameDay(dia, hoy);
              return (
                <Box
                  key={dia.toISOString()}
                  sx={{
                    p: 1.5,
                    textAlign: "center",
                    backgroundColor: esHoy ? "#EFF6FF" : "#f9fafb",
                    borderRight: idx < 4 ? "1px solid #e0e0e0" : "none",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: esHoy ? "#2563EB" : "#1a2a3a", textTransform: "capitalize" }}
                  >
                    {format(dia, "EEEE", { locale: es })}
                  </Typography>
                  <Typography variant="caption" sx={{ color: esHoy ? "#3B82F6" : "#6b7280" }}>
                    {format(dia, "d MMM", { locale: es })}
                    {esHoy && " (Hoy)"}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Grid de horas */}
          <Box sx={{ maxHeight: 600, overflowY: "auto" }}>
            {HORAS.map((hora, horaIdx) => (
              <Box
                key={hora}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "80px repeat(5, 1fr)",
                  minHeight: 70,
                  borderBottom: horaIdx < HORAS.length - 1 ? "1px solid #e0e0e0" : "none",
                }}
              >
                <Box
                  sx={{
                    p: 1,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "flex-end",
                    pr: 1.5,
                    backgroundColor: "#fafafa",
                    borderRight: "1px solid #e0e0e0",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.75rem" }}>
                    {formatearHora12h(hora)}
                  </Typography>
                </Box>

                {diasSemana.map((dia, diaIdx) => {
                  const reservasEnCelda = getReservasEnCelda(dia, hora);
                  const esHoy = isSameDay(dia, hoy);

                  return (
                    <Box
                      key={`${dia.toISOString()}-${hora}`}
                      onClick={() => reservasEnCelda.length === 0 && handleClickCelda(dia, hora)}
                      sx={{
                        position: "relative",
                        borderRight: diaIdx < 4 ? "1px solid #e0e0e0" : "none",
                        backgroundColor: esHoy ? "#FAFBFF" : "transparent",
                        minHeight: 70,
                        cursor: reservasEnCelda.length === 0 ? "pointer" : "default",
                        "&:hover": reservasEnCelda.length === 0 ? { backgroundColor: "#f0f9ff" } : {},
                      }}
                    >
                      {reservasEnCelda.map(({ reserva, esInicio, esFin }) => {
                        const colores = getColorEstado(reserva);

                        return (
                          <Box
                            key={`${reserva.id}-${hora}`}
                            onClick={(e) => handleClickReserva(e, reserva)}
                            sx={{
                              position: "absolute",
                              top: 2,
                              left: 4,
                              right: 4,
                              bottom: 2,
                              backgroundColor: colores.bg,
                              borderLeft: `3px solid ${colores.text}`,
                              borderRadius: esInicio && esFin ? "4px" : esInicio ? "4px 4px 0 0" : esFin ? "0 0 4px 4px" : "0",
                              p: 0.75,
                              cursor: "pointer",
                              overflow: "hidden",
                              zIndex: 1,
                              "&:hover": { opacity: 0.9, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
                              transition: "all 0.15s ease",
                            }}
                          >
                            {esInicio && (
                              <>
                                <Typography
                                  sx={{
                                    fontSize: "0.7rem",
                                    fontWeight: 600,
                                    color: colores.text,
                                    lineHeight: 1.2,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {reserva.observaciones || "Sin título"}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: "0.6rem",
                                    color: colores.text,
                                    opacity: 0.85,
                                  }}
                                >
                                  {reserva.nombre_sala} • {getEstadoTexto(reserva)}
                                </Typography>
                              </>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Popover de detalle - Estilo igual a vista mensual */}
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleClosePopover}
          anchorOrigin={{ vertical: "center", horizontal: "right" }}
          transformOrigin={{ vertical: "center", horizontal: "left" }}
          PaperProps={{ sx: { width: 320, maxHeight: 400, borderRadius: 2, boxShadow: "0 10px 40px rgba(0,0,0,0.15)" } }}
        >
          {reservaSeleccionada && (() => {
            const colores = getColorEstado(reservaSeleccionada);
            const estado = reservaSeleccionada.estadoCalculado || reservaSeleccionada.estado;
            
            return (
              <Box>
                {/* Header con color de estado */}
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: estado.bg,
                    borderBottom: `3px solid ${colores.text}`,
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
                        color: colores.text,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {reservaSeleccionada.observaciones || "Sin título"}
                    </Typography>
                    <Chip
                      label={estado}
                      size="small"
                      sx={{
                        mt: 0.5,
                        backgroundColor: colores.text,
                        color: "white",
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
                              sx={{ color: colores.text }}
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
                              sx={{ color: "#EF4444" }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    )}
                    <IconButton size="small" onClick={handleClosePopover}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* Contenido */}
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                    <TimeIcon sx={{ color: "#6b7280", fontSize: 20 }} />
                    <Typography variant="body2">
                      {reservaSeleccionada.hora_inicio.substring(0, 5)} - {reservaSeleccionada.hora_final.substring(0, 5)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                    <RoomIcon sx={{ color: "#6b7280", fontSize: 20 }} />
                    <Typography variant="body2">
                      {reservaSeleccionada.nombre_sala}
                    </Typography>
                  </Box>
                  
                  {reservaSeleccionada.usuario_id && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                      <PersonIcon sx={{ color: "#6b7280", fontSize: 20 }} />
                      <Typography variant="body2">
                        {reservaSeleccionada.usuario_id.first_name} {reservaSeleccionada.usuario_id.last_name}
                      </Typography>
                    </Box>
                  )}
                  
                  {reservaSeleccionada.usuario_id?.rol_usuario?.area && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <AreaIcon sx={{ color: "#6b7280", fontSize: 20 }} />
                      <Typography variant="body2">
                        {reservaSeleccionada.usuario_id.rol_usuario.area}
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