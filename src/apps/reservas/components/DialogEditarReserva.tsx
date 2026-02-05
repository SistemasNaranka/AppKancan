// src/apps/reservas/components/DialogEditarReserva.tsx

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
  Select,
  FormControl,
} from "@mui/material";
import {
  Schedule as ScheduleIcon,
  Save as SaveIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import type { Reserva, ActualizarReserva, Sala } from "../types/reservas.types";
import {
  SALAS_DISPONIBLES,
  HORARIO_INICIO,
  HORARIO_FIN,
  DURACION_MINIMA_MINUTOS,
} from "../types/reservas.types";
import { getConfiguracionReserva } from "../services/reservas";

interface DialogEditarReservaProps {
  open: boolean;
  reserva: Reserva | null;
  onClose: () => void;
  onSubmit: (id: number, datos: ActualizarReserva) => Promise<void>;
  verificarConflicto?: (
    sala: string,
    fecha: string,
    horaInicio: string,
    horaFinal: string,
    reservaIdExcluir: number,
  ) => Promise<boolean>;
}

// Generar opciones de hora dinámicamente según configuración
const generarOpcionesHora = (horaInicio: number = 7, horaFin: number = 17) => {
  const opciones: { value: string; label: string }[] = [];
  for (let h = horaInicio; h <= horaFin; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hora24 = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      const hora12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h >= 12 ? "PM" : "AM";
      const label = `${hora12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
      opciones.push({ value: hora24, label });
    }
  }
  return opciones;
};

// Función para formatear hora a formato legible (12h)
const formatearHoraLegible = (hora24: string): string => {
  const [h, m] = hora24.split(":").map(Number);
  const hora12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${hora12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

// Info de salas
const INFO_SALAS: Record<string, string> = {
  "Sala Principal": "Grande",
  "Sala Secundaria": "Compacta",
};

const DialogEditarReserva: React.FC<DialogEditarReservaProps> = ({
  open,
  reserva,
  onClose,
  onSubmit,
  verificarConflicto,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configCargando, setConfigCargando] = useState(true);

  // Estado para la configuración de horarios
  const [horarioConfig, setHorarioConfig] = useState({
    horaApertura: HORARIO_INICIO,
    horaCierre: HORARIO_FIN,
  });

  // Generar opciones de hora dinámicamente
  const opcionesHora = useMemo(() => {
    const horaInicioNum = parseInt(horarioConfig.horaApertura.split(":")[0]);
    const horaFinNum = parseInt(horarioConfig.horaCierre.split(":")[0]);
    return generarOpcionesHora(horaInicioNum, horaFinNum);
  }, [horarioConfig]);

  // Cargar configuración de horarios al abrir el diálogo
  useEffect(() => {
    const cargarConfiguracion = async () => {
      setConfigCargando(true);
      try {
        const config = await getConfiguracionReserva();
        if (config) {
          const horaApertura =
            config.hora_apertura?.substring(0, 5) || HORARIO_INICIO;
          const horaCierre = config.hora_cierre?.substring(0, 5) || HORARIO_FIN;
          setHorarioConfig({ horaApertura, horaCierre });
        }
      } catch (err) {
        console.error("Error cargando configuración:", err);
      } finally {
        setConfigCargando(false);
      }
    };

    if (open) {
      cargarConfiguracion();
    }
  }, [open]);

  // Schema de validación dinámico basado en la configuración
  const schema = useMemo(
    () =>
      yup.object({
        nombre_sala: yup.string().required("Selecciona una sala"),
        fecha: yup
          .string()
          .required("Selecciona una fecha")
          .test(
            "fecha-valida",
            "No puedes reservar fechas pasadas",
            (value) => {
              if (!value) return false;
              const fechaSeleccionada = new Date(value + "T00:00:00");
              const hoy = new Date();
              hoy.setHours(0, 0, 0, 0);
              return fechaSeleccionada >= hoy;
            },
          ),
        hora_inicio: yup
          .string()
          .required("Selecciona hora de inicio")
          .test(
            "horario-minimo",
            `Debe ser desde las ${formatearHoraLegible(horarioConfig.horaApertura)}`,
            (value) => {
              if (!value) return false;
              return value >= horarioConfig.horaApertura;
            },
          )
          .test(
            "horario-maximo",
            `Debe ser antes de las ${formatearHoraLegible(horarioConfig.horaCierre)}`,
            (value) => {
              if (!value) return false;
              return value < horarioConfig.horaCierre;
            },
          ),
        hora_final: yup
          .string()
          .required("Selecciona hora de fin")
          .test(
            "duracion-minima",
            `La reunión debe durar mínimo ${DURACION_MINIMA_MINUTOS} minutos`,
            function (value) {
              const { hora_inicio } = this.parent;
              if (!value || !hora_inicio) return false;
              const [horaIni, minIni] = hora_inicio.split(":").map(Number);
              const [horaFin, minFin] = value.split(":").map(Number);
              const minutosInicio = horaIni * 60 + minIni;
              const minutosFin = horaFin * 60 + minFin;
              return minutosFin - minutosInicio >= DURACION_MINIMA_MINUTOS;
            },
          )
          .test(
            "hora-mayor",
            "La hora de fin debe ser mayor a la hora de inicio",
            function (value) {
              const { hora_inicio } = this.parent;
              if (!value || !hora_inicio) return false;
              return value > hora_inicio;
            },
          )
          .test(
            "horario-maximo-cierre",
            `Debe ser hasta las ${formatearHoraLegible(horarioConfig.horaCierre)}`,
            (value) => {
              if (!value) return false;
              return value <= horarioConfig.horaCierre;
            },
          ),
        titulo: yup
          .string()
          .required("El título es obligatorio")
          .min(3, "Mínimo 3 caracteres")
          .max(100, "Máximo 100 caracteres"),
        observaciones: yup.string().max(500, "Máximo 500 caracteres"),
      }),
    [horarioConfig],
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nombre_sala: "" as Sala,
      fecha: "",
      hora_inicio: horarioConfig.horaApertura,
      hora_final: "",
      titulo: "",
      observaciones: "",
    },
  });

  // Cargar datos de la reserva cuando se abre el diálogo
  useEffect(() => {
    if (reserva && open && !configCargando) {
      reset({
        nombre_sala: reserva.nombre_sala as Sala,
        fecha: reserva.fecha,
        hora_inicio: reserva.hora_inicio.substring(0, 5),
        hora_final: reserva.hora_final.substring(0, 5),
        titulo: reserva.titulo_reunion || "",
        observaciones: reserva.observaciones || "",
      });
    }
  }, [reserva, open, configCargando, reset]);

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  const handleSalaChange = (
    _event: React.MouseEvent<HTMLElement>,
    newSala: Sala | null,
  ) => {
    if (newSala) {
      setValue("nombre_sala", newSala);
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setValue("fecha", format(date, "yyyy-MM-dd"));
    }
  };

  const onFormSubmit = async (data: any) => {
    if (!reserva) return;

    setLoading(true);
    setError(null);

    try {
      if (verificarConflicto) {
        const hayConflicto = await verificarConflicto(
          data.nombre_sala,
          data.fecha,
          data.hora_inicio,
          data.hora_final,
          reserva.id,
        );

        if (hayConflicto) {
          setError("Ya existe una reserva en este horario para esta sala");
          setLoading(false);
          return;
        }
      }

      // Guardar en campos separados de la BD
      await onSubmit(reserva.id, {
        nombre_sala: data.nombre_sala,
        fecha: data.fecha,
        hora_inicio: data.hora_inicio,
        hora_final: data.hora_final,
        titulo_reunion: data.titulo,
        observaciones: data.observaciones?.trim() || "",
      });
      handleClose();
    } catch (err: any) {
      setError(err.message || "Error al actualizar la reserva");
    } finally {
      setLoading(false);
    }
  };

  const shouldDisableDate = (date: Date) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return date < hoy;
  };

  if (!reserva) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, maxWidth: 900 },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {/* Header */}
          <Box sx={{ p: 3, pb: 2 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "#1a2a3a", mb: 0.5 }}
            >
              Editar Reservación
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "#6b7280",
              }}
            >
              <ScheduleIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2">
                Modifique los detalles de su reservación. Horario comercial: 7
                AM - 5 PM.
              </Typography>
            </Box>
          </Box>

          <form onSubmit={handleSubmit(onFormSubmit)}>
            <Box sx={{ px: 3, pb: 3 }}>
              {error && (
                <Alert
                  severity="error"
                  onClose={() => setError(null)}
                  sx={{ mb: 2 }}
                >
                  {error}
                </Alert>
              )}

              {/* Contenido principal en dos columnas */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" },
                  gap: 3,
                  p: 3,
                  backgroundColor: "#f9fafb",
                  borderRadius: 2,
                  border: "1px solid #e5e7eb",
                }}
              >
                {/* Columna izquierda */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {/* Título de la Reunión */}
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, fontWeight: 600, color: "#374151" }}
                    >
                      Título de la Reunión *
                    </Typography>
                    <Controller
                      name="titulo"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          placeholder="ej. Sincronización Semanal"
                          error={!!errors.titulo}
                          helperText={errors.titulo?.message}
                          disabled={loading}
                          size="small"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "white",
                            },
                          }}
                        />
                      )}
                    />
                  </Box>

                  {/* Seleccionar Sala */}
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, fontWeight: 600, color: "#374151" }}
                    >
                      Seleccionar Sala *
                    </Typography>
                    <Controller
                      name="nombre_sala"
                      control={control}
                      render={({ field }) => (
                        <ToggleButtonGroup
                          value={field.value}
                          exclusive
                          onChange={handleSalaChange}
                          fullWidth
                          sx={{
                            "& .MuiToggleButton-root": {
                              flex: 1,
                              py: 1,
                              textTransform: "none",
                              fontWeight: 500,
                              fontSize: "0.875rem",
                              border: "1px solid #d1d5db",
                              backgroundColor: "white",
                              "&.Mui-selected": {
                                backgroundColor: "#EFF6FF",
                                borderColor: "#3B82F6",
                                color: "#1D4ED8",
                                "&:hover": {
                                  backgroundColor: "#DBEAFE",
                                },
                              },
                              "&:hover": {
                                backgroundColor: "#f9fafb",
                              },
                            },
                          }}
                        >
                          {SALAS_DISPONIBLES.map((sala) => (
                            <ToggleButton
                              key={sala}
                              value={sala}
                              disabled={loading}
                            >
                              {sala} ({INFO_SALAS[sala]})
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                      )}
                    />
                    {errors.nombre_sala && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ mt: 0.5, display: "block" }}
                      >
                        {errors.nombre_sala.message}
                      </Typography>
                    )}
                  </Box>

                  {/* Hora de Inicio y Hora de Fin */}
                  <Box>
                    {/* Indicador visual del rango válido */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                        p: 1.5,
                        backgroundColor: "#EFF6FF",
                        borderRadius: 1,
                        border: "1px solid #BFDBFE",
                      }}
                    >
                      <InfoIcon sx={{ color: "#3B82F6", fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: "#1E40AF" }}>
                        Horario disponible:{" "}
                        <strong>
                          {formatearHoraLegible(horarioConfig.horaApertura)}
                        </strong>{" "}
                        a{" "}
                        <strong>
                          {formatearHoraLegible(horarioConfig.horaCierre)}
                        </strong>
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ mb: 1, fontWeight: 600, color: "#374151" }}
                        >
                          Hora de Inicio *
                        </Typography>
                        <Controller
                          name="hora_inicio"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth error={!!errors.hora_inicio}>
                              <Select
                                {...field}
                                disabled={loading || configCargando}
                                size="small"
                                sx={{ backgroundColor: "white" }}
                              >
                                {opcionesHora.map((opcion) => (
                                  <MenuItem
                                    key={opcion.value}
                                    value={opcion.value}
                                  >
                                    {opcion.label}
                                  </MenuItem>
                                ))}
                              </Select>
                              {errors.hora_inicio && (
                                <Typography
                                  variant="caption"
                                  color="error"
                                  sx={{ mt: 0.5 }}
                                >
                                  {errors.hora_inicio.message}
                                </Typography>
                              )}
                            </FormControl>
                          )}
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ mb: 1, fontWeight: 600, color: "#374151" }}
                        >
                          Hora de Fin *
                        </Typography>
                        <Controller
                          name="hora_final"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth error={!!errors.hora_final}>
                              <Select
                                {...field}
                                disabled={loading || configCargando}
                                size="small"
                                sx={{ backgroundColor: "white" }}
                              >
                                {opcionesHora.map((opcion) => (
                                  <MenuItem
                                    key={opcion.value}
                                    value={opcion.value}
                                  >
                                    {opcion.label}
                                  </MenuItem>
                                ))}
                              </Select>
                              {errors.hora_final && (
                                <Typography
                                  variant="caption"
                                  color="error"
                                  sx={{ mt: 0.5 }}
                                >
                                  {errors.hora_final.message}
                                </Typography>
                              )}
                            </FormControl>
                          )}
                        />
                      </Box>
                    </Box>
                  </Box>

                  {/* Observaciones */}
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, fontWeight: 600, color: "#374151" }}
                    >
                      Observaciones
                    </Typography>
                    <Controller
                      name="observaciones"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          multiline
                          rows={3}
                          placeholder="Detalles adicionales, participantes, materiales necesarios, agenda de la reunión..."
                          error={!!errors.observaciones}
                          helperText={
                            errors.observaciones?.message ||
                            "Opcional - máximo 500 caracteres"
                          }
                          disabled={loading}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "white",
                            },
                          }}
                        />
                      )}
                    />
                  </Box>
                </Box>

                {/* Columna derecha - Calendario */}
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, fontWeight: 600, color: "#374151" }}
                  >
                    Fecha *
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: "white",
                      borderRadius: 2,
                      border: "1px solid #d1d5db",
                      overflow: "hidden",
                    }}
                  >
                    <Controller
                      name="fecha"
                      control={control}
                      render={({ field }) => (
                        <StaticDatePicker
                          value={
                            field.value
                              ? parse(field.value, "yyyy-MM-dd", new Date())
                              : null
                          }
                          disabled={loading}
                          displayStaticWrapperAs="desktop"
                          slotProps={{
                            actionBar: { actions: [] },
                          }}
                          sx={{
                            "& .MuiPickersCalendarHeader-root": {
                              paddingLeft: 2,
                              paddingRight: 2,
                            },
                            "& .MuiDayCalendar-root": {
                              width: "100%",
                            },
                          }}
                        />
                      )}
                    />
                  </Box>
                  {errors.fecha && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5, display: "block" }}
                    >
                      {errors.fecha.message}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Botones de acción */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                  mt: 3,
                }}
              >
                <Button
                  onClick={handleClose}
                  disabled={loading}
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    backgroundColor: "#3B82F6",
                    borderRadius: 2,
                    px: 3,
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: "#2563EB",
                      boxShadow: "none",
                    },
                  }}
                >
                  Guardar Cambios
                </Button>
              </Box>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    </LocalizationProvider>
  );
};

export default DialogEditarReserva;
