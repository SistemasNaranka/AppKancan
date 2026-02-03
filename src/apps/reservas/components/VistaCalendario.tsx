// src/apps/reservas/components/VistaCalendario.tsx

import React, { useState, useMemo } from "react";
import {
  Box,
  IconButton,
  Typography,
  Paper,
  Button,
  Chip,
  Popover,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  AccessTime as TimeIcon,
  Room as RoomIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as AreaIcon,
  Add as AddIcon,
  Notes as NotesIcon,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  setMonth,
  setYear,
} from "date-fns";
import { es } from "date-fns/locale";
import { getReservasMes } from "../services/reservas";
import type { Reserva, EstadoReserva } from "../types/reservas.types";
import { 
  COLORES_ESTADO, 
  COLORES_TEXTO_ESTADO, 
  getReservaColor, 
  puedeModificarse, 
  SALAS_DISPONIBLES,
} from "../types/reservas.types";

interface VistaCalendarioProps {
  onNuevaReserva?: (fecha?: string, sala?: string) => void;
  onEditarReserva?: (reserva: Reserva) => void;
  onCancelarReserva?: (reserva: Reserva) => void;
  usuarioActualId?: string;
  vistaCalendario?: "semanal" | "mes";
  onCambiarVista?: (vista: "semanal" | "mes") => void;
}

// Nombres de los meses en español
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Años disponibles
const AÑOS = Array.from({ length: 7 }, (_, i) => 2024 + i);

const VistaCalendario: React.FC<VistaCalendarioProps> = ({
  onNuevaReserva,
  onEditarReserva,
  onCancelarReserva,
  usuarioActualId,
  vistaCalendario = "mes",
  onCambiarVista,
}) => {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [salaSeleccionada, setSalaSeleccionada] = useState<string>(SALAS_DISPONIBLES[0]);
  const [mostrarFinesSemana, setMostrarFinesSemana] = useState(false);

  // Estado para Popover de día
  const [anchorDia, setAnchorDia] = useState<HTMLElement | null>(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null);

  // Estado para Popover de reserva
  const [anchorReserva, setAnchorReserva] = useState<HTMLElement | null>(null);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<Reserva | null>(null);

  // Obtener reservas del mes
  const { data: reservasRaw = [] } = useQuery({
    queryKey: ["reservas", "calendario", fechaActual.getFullYear(), fechaActual.getMonth() + 1],
    queryFn: () => getReservasMes(fechaActual.getFullYear(), fechaActual.getMonth() + 1),
  });

  // Filtrar reservas: solo vigentes y en curso, y por sala seleccionada
  const reservas = useMemo(() => {
    return reservasRaw.filter((r) => {
      const estado = (r.estadoCalculado || r.estado)?.toLowerCase() || "";
      const esEstadoValido = estado === "vigente" || estado === "en curso";
      const esSalaCorrecta = r.nombre_sala === salaSeleccionada;
      return esEstadoValido && esSalaCorrecta;
    });
  }, [reservasRaw, salaSeleccionada]);

  // Navegación
  const navegarAnterior = () => setFechaActual(subMonths(fechaActual, 1));
  const navegarSiguiente = () => setFechaActual(addMonths(fechaActual, 1));
  const irAHoy = () => setFechaActual(new Date());

  // Cambiar mes
  const handleCambiarMes = (mes: number) => {
    setFechaActual(setMonth(fechaActual, mes));
  };

  // Cambiar año
  const handleCambiarAño = (año: number) => {
    setFechaActual(setYear(fechaActual, año));
  };

  // Obtener reservas de un día específico
  const getReservasDia = (fecha: Date): Reserva[] => {
    const fechaStr = format(fecha, "yyyy-MM-dd");
    return reservas.filter((r) => r.fecha === fechaStr);
  };

  // Verificar si puede modificar
  const puedeModificar = (reserva: Reserva): boolean => {
    if (!usuarioActualId) return false;
    if (!reserva.usuario_id) return false;
    if (reserva.usuario_id.id !== usuarioActualId) return false;

    const estadoActual = reserva.estadoCalculado || reserva.estado;
    if (!puedeModificarse(estadoActual)) return false;

    const ahora = new Date();
    const fechaReserva = new Date(`${reserva.fecha}T${reserva.hora_inicio}`);
    return fechaReserva > ahora;
  };

  // Generar días del calendario mensual (con opción de excluir fines de semana)
  const generarDiasCalendario = () => {
    const inicioMes = startOfMonth(fechaActual);
    const finMes = endOfMonth(fechaActual);
    // Si mostramos fines de semana, empezamos en domingo (0), si no, en lunes (1)
    const inicioCalendario = startOfWeek(inicioMes, { weekStartsOn: mostrarFinesSemana ? 0 : 1 });
    const finCalendario = endOfWeek(finMes, { weekStartsOn: mostrarFinesSemana ? 0 : 1 });

    const dias: Date[] = [];
    let diaActual = inicioCalendario;

    while (diaActual <= finCalendario) {
      const diaSemana = diaActual.getDay(); // 0 = domingo, 6 = sábado
      
      // Si no mostramos fines de semana, excluir sábado (6) y domingo (0)
      if (mostrarFinesSemana || (diaSemana !== 0 && diaSemana !== 6)) {
        dias.push(diaActual);
      }
      diaActual = addDays(diaActual, 1);
    }

    return dias;
  };

  // Días de la semana según configuración
  const diasSemanaLabels = mostrarFinesSemana 
    ? ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"]
    : ["LUN", "MAR", "MIÉ", "JUE", "VIE"];

  // Handlers para Popover de día
  const handleClickDia = (event: React.MouseEvent<HTMLElement>, fecha: Date) => {
    setDiaSeleccionado(fecha);
    setAnchorDia(event.currentTarget);
  };

  const handleCloseDia = () => {
    setAnchorDia(null);
    setDiaSeleccionado(null);
  };

  // Handlers para Popover de reserva
  const handleClickReserva = (event: React.MouseEvent<HTMLElement>, reserva: Reserva) => {
    event.stopPropagation();
    setReservaSeleccionada(reserva);
    setAnchorReserva(event.currentTarget);
  };

  const handleCloseReserva = () => {
    setAnchorReserva(null);
    setReservaSeleccionada(null);
  };

  // Handler para crear reserva con fecha
  const handleNuevaReservaConFecha = (fecha: Date) => {
    handleCloseDia();
    const fechaStr = format(fecha, "yyyy-MM-dd");
    if (onNuevaReserva) {
      onNuevaReserva(fechaStr, salaSeleccionada);
    }
  };

  // Obtener color según estado (para chip de estado)
  const getColorEstado = (reserva: Reserva) => {
    const estado = (reserva.estadoCalculado || reserva.estado) as EstadoReserva;
    return {
      bg: COLORES_ESTADO[estado] || "#E5E7EB",
      text: COLORES_TEXTO_ESTADO[estado] || "#374151",
    };
  };

  // Formatear hora
  const formatearHora = (hora: string) => hora.substring(0, 5);

  // Truncar texto
  const truncarTexto = (texto: string, limite: number) => {
    if (!texto) return "";
    return texto.length > limite ? texto.slice(0, limite) + "..." : texto;
  };

  // Número de columnas del grid
  const numColumnas = mostrarFinesSemana ? 7 : 5;

  const dias = generarDiasCalendario();
  const hoy = new Date();

  const openDia = Boolean(anchorDia);
  const openReserva = Boolean(anchorReserva);

  const mesActual = `${MESES[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`;

  return (
    <Box>
      {/* Header: Título + Botón Reservar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a2a3a" }}>
          Calendario Mensual
        </Typography>
        
        {onNuevaReserva && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => onNuevaReserva()}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "#10B981",
              boxShadow: "none",
              borderRadius: 1.5,
              px: 2.5,
              "&:hover": { backgroundColor: "#059669", boxShadow: "none" },
            }}
          >
            Reservar Ahora
          </Button>
        )}
      </Box>

      {/* Fila de controles: Toggles | Navegación | Mes actual */}
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

          {/* Toggle Fines de Semana */}
          <Button
            variant={mostrarFinesSemana ? "contained" : "outlined"}
            size="small"
            onClick={() => setMostrarFinesSemana(!mostrarFinesSemana)}
            sx={{
              textTransform: "none",
              fontSize: "0.85rem",
              fontWeight: 500,
              px: 1.5,
              borderColor: "#e0e0e0",
              color: mostrarFinesSemana ? "white" : "#374151",
              backgroundColor: mostrarFinesSemana ? "#3B82F6" : "transparent",
              "&:hover": {
                backgroundColor: mostrarFinesSemana ? "#2563EB" : "#f3f4f6",
                borderColor: "#e0e0e0",
              },
            }}
          >
            {mostrarFinesSemana ? "Ocultar Fines Semana" : "Mostrar Fines Semana"}
          </Button>
        </Box>

        {/* Navegación al centro-derecha */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={navegarAnterior} size="small" sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={navegarSiguiente} size="small" sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}>
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
            Hoy
          </Button>

          {/* Selectores de mes y año */}
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={fechaActual.getMonth()}
              onChange={(e) => handleCambiarMes(e.target.value as number)}
              sx={{
                fontSize: "0.85rem",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
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
              value={fechaActual.getFullYear()}
              onChange={(e) => handleCambiarAño(e.target.value as number)}
              sx={{
                fontSize: "0.85rem",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
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

        {/* Mes actual a la derecha */}
        <Typography variant="body2" sx={{ fontWeight: 600, color: "#1a2a3a", minWidth: 150, textAlign: "right" }}>
          {mesActual}
        </Typography>
      </Paper>

      {/* Vista Mensual */}
      <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden" }}>
        {/* Días de la semana */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${numColumnas}, 1fr)`,
            borderBottom: "1px solid #e0e0e0",
            backgroundColor: "#f9fafb",
          }}
        >
          {diasSemanaLabels.map((dia) => (
            <Box
              key={dia}
              sx={{
                p: 1.5,
                textAlign: "center",
                fontWeight: 600,
                color: "#6b7280",
                fontSize: "0.75rem",
              }}
            >
              {dia}
            </Box>
          ))}
        </Box>

        {/* Días del mes */}
        <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${numColumnas}, 1fr)` }}>
          {dias.map((dia, index) => {
            const reservasDia = getReservasDia(dia);
            const esHoy = isSameDay(dia, hoy);
            const esMesActual = isSameMonth(dia, fechaActual);

            return (
              <Box
                key={index}
                onClick={(e) => handleClickDia(e, dia)}
                sx={{
                  minHeight: 100,
                  p: 0.5,
                  borderRight: index % numColumnas !== numColumnas - 1 ? "1px solid #e0e0e0" : "none",
                  borderBottom: "1px solid #e0e0e0",
                  backgroundColor: esMesActual ? "white" : "#f9fafb",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  "&:hover": { backgroundColor: "#f3f4f6" },
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "center", mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: esHoy ? "#1976d2" : "transparent",
                      color: esHoy ? "white" : esMesActual ? "#1a2a3a" : "#9ca3af",
                      fontWeight: esHoy ? 600 : 400,
                      fontSize: "0.875rem",
                    }}
                  >
                    {format(dia, "d")}
                  </Box>
                </Box>

                {/* Reservas HORIZONTALES con color por ID */}
                {reservasDia.length > 0 && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: "2px", px: 0.25 }}>
                    {reservasDia.slice(0, 3).map((reserva) => {
                      const colorReserva = getReservaColor(reserva.id);
                      return (
                        <Box
                          key={reserva.id}
                          onClick={(e) => handleClickReserva(e, reserva)}
                          sx={{
                            height: 18,
                            backgroundColor: colorReserva,
                            borderRadius: "2px",
                            px: 0.5,
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            overflow: "hidden",
                            "&:hover": {
                              opacity: 0.85,
                            },
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: "0.6rem",
                              fontWeight: 500,
                              color: "#ffffff",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {formatearHora(reserva.hora_inicio)} {truncarTexto(reserva.titulo_reunion || "Sin título", 10)}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}

                {reservasDia.length > 3 && (
                  <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.6rem", display: "block", textAlign: "center", mt: 0.25 }}>
                    +{reservasDia.length - 3} más
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* Popover de día */}
      <Popover
        open={openDia}
        anchorEl={anchorDia}
        onClose={handleCloseDia}
        anchorOrigin={{ vertical: "center", horizontal: "right" }}
        transformOrigin={{ vertical: "center", horizontal: "left" }}
        PaperProps={{
          sx: { width: 300, borderRadius: 2, boxShadow: "0 10px 40px rgba(0,0,0,0.15)" },
        }}
      >
        {diaSeleccionado && (
          <Box>
            <Box
              sx={{
                p: 2,
                borderBottom: "1px solid #e0e0e0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, textTransform: "capitalize" }}>
                {format(diaSeleccionado, "EEEE, d MMM", { locale: es })}
              </Typography>
              <IconButton size="small" onClick={handleCloseDia}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ p: 2, maxHeight: 280, overflowY: "auto" }}>
              {getReservasDia(diaSeleccionado).length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                  No hay reservas para {salaSeleccionada}
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {getReservasDia(diaSeleccionado).map((reserva) => {
                    const colorReserva = getReservaColor(reserva.id);
                    return (
                      <Box
                        key={reserva.id}
                        onClick={(e) => {
                          handleCloseDia();
                          handleClickReserva(e, reserva);
                        }}
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          border: "1px solid #e0e0e0",
                          borderLeft: `4px solid ${colorReserva}`,
                          cursor: "pointer",
                          "&:hover": { backgroundColor: "#f9fafb" },
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {reserva.titulo_reunion || "Sin título"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatearHora(reserva.hora_inicio)} - {formatearHora(reserva.hora_final)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            <Box sx={{ p: 2, borderTop: "1px solid #e0e0e0", display: "flex", gap: 1 }}>
              {onNuevaReserva && (
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  onClick={() => handleNuevaReservaConFecha(diaSeleccionado)}
                  sx={{ textTransform: "none", boxShadow: "none" }}
                >
                  Nueva reserva
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Popover>

      {/* Popover Detalle de Reserva con color por ID */}
      <Popover
        open={openReserva}
        anchorEl={anchorReserva}
        onClose={handleCloseReserva}
        anchorOrigin={{ vertical: "center", horizontal: "right" }}
        transformOrigin={{ vertical: "center", horizontal: "left" }}
        PaperProps={{
          sx: { width: 340, maxHeight: 450, borderRadius: 2, boxShadow: "0 10px 40px rgba(0,0,0,0.15)" },
        }}
      >
        {reservaSeleccionada && (() => {
          const colorReserva = getReservaColor(reservaSeleccionada.id);
          const estado = reservaSeleccionada.estadoCalculado || reservaSeleccionada.estado;
          
          // Título: solo titulo_reunion, si no existe "Sin título"
          const tituloMostrar = reservaSeleccionada.titulo_reunion || "Sin título";

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
                      wordBreak: "break-word",
                      lineHeight: 1.3,
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
                              handleCloseReserva();
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
                              handleCloseReserva();
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
                  <IconButton size="small" onClick={handleCloseReserva} sx={{ color: "#ffffff" }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Contenido */}
              <Box sx={{ p: 2 }}>
                {/* Horario */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                  <TimeIcon sx={{ color: "#6b7280", fontSize: 20 }} />
                  <Typography variant="body2">
                    {formatearHora(reservaSeleccionada.hora_inicio)} - {formatearHora(reservaSeleccionada.hora_final)}
                  </Typography>
                </Box>

                {/* Sala */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                  <RoomIcon sx={{ color: "#6b7280", fontSize: 20 }} />
                  <Typography variant="body2">{reservaSeleccionada.nombre_sala}</Typography>
                </Box>

                {/* Usuario */}
                {reservaSeleccionada.usuario_id && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                    <PersonIcon sx={{ color: "#6b7280", fontSize: 20 }} />
                    <Typography variant="body2">
                      {reservaSeleccionada.usuario_id.first_name} {reservaSeleccionada.usuario_id.last_name}
                    </Typography>
                  </Box>
                )}

                {/* Área */}
                {reservaSeleccionada.usuario_id?.rol_usuario?.area && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                    <AreaIcon sx={{ color: "#6b7280", fontSize: 20 }} />
                    <Typography variant="body2">
                      {reservaSeleccionada.usuario_id.rol_usuario.area}
                    </Typography>
                  </Box>
                )}

                {/* Observaciones (si existen) */}
                {reservaSeleccionada.observaciones && (
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mt: 2, pt: 2, borderTop: "1px solid #e0e0e0" }}>
                    <NotesIcon sx={{ color: "#6b7280", fontSize: 20, mt: 0.25 }} />
                    <Typography variant="body2" sx={{ color: "#374151", whiteSpace: "pre-wrap" }}>
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
  );
};

export default VistaCalendario;