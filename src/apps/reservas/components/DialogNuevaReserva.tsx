// src/apps/reservas/components/DialogNuevaReserva.tsx

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
  InputLabel,
} from "@mui/material";
import {
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import type { NuevaReserva, Sala } from "../types/reservas.types";
import {
  SALAS_DISPONIBLES,
  HORARIO_INICIO,
  HORARIO_FIN,
  DURACION_MINIMA_MINUTOS,
} from "../types/reservas.types";

interface DialogNuevaReservaProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (datos: NuevaReserva) => Promise<void>;
  verificarConflicto?: (
    sala: string,
    fecha: string,
    horaInicio: string,
    horaFinal: string
  ) => Promise<boolean>;
  fechaInicial?: string;
  salaInicial?: Sala;
  horaInicial?: string;
}

// Generar opciones de hora en formato AM/PM
const generarOpcionesHora = () => {
  const opciones: { value: string; label: string }[] = [];
  for (let h = 7; h <= 17; h++) {
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

const OPCIONES_HORA = generarOpcionesHora();

// Info de salas
const INFO_SALAS: Record<string, string> = {
  "Sala A": "Grande",
  "Sala B": "Compacta",
};

const schema = yup.object({
  nombre_sala: yup.string().required("Selecciona una sala"),
  fecha: yup
    .string()
    .required("Selecciona una fecha")
    .test("fecha-valida", "No puedes reservar fechas pasadas", (value) => {
      if (!value) return false;
      const fechaSeleccionada = new Date(value + "T00:00:00");
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      return fechaSeleccionada >= hoy;
    }),
  hora_inicio: yup
    .string()
    .required("Selecciona hora de inicio")
    .test("horario-minimo", `Debe ser desde las ${HORARIO_INICIO}`, (value) => {
      if (!value) return false;
      return value >= HORARIO_INICIO;
    })
    .test("horario-maximo", `Debe ser antes de las ${HORARIO_FIN}`, (value) => {
      if (!value) return false;
      return value < HORARIO_FIN;
    }),
  hora_final: yup
    .string()
    .required("Selecciona hora de fin")
    .test("duracion-minima", `La reunión debe durar mínimo ${DURACION_MINIMA_MINUTOS} minutos`, function (value) {
      const { hora_inicio } = this.parent;
      if (!value || !hora_inicio) return false;

      const [horaIni, minIni] = hora_inicio.split(":").map(Number);
      const [horaFin, minFin] = value.split(":").map(Number);

      const minutosInicio = horaIni * 60 + minIni;
      const minutosFin = horaFin * 60 + minFin;

      return minutosFin - minutosInicio >= DURACION_MINIMA_MINUTOS;
    })
    .test("hora-mayor", "La hora de fin debe ser mayor a la hora de inicio", function (value) {
      const { hora_inicio } = this.parent;
      if (!value || !hora_inicio) return false;
      return value > hora_inicio;
    }),
  observaciones: yup
    .string()
    .required("El título es obligatorio")
    .min(3, "Mínimo 3 caracteres")
    .max(100, "Máximo 100 caracteres"),
});

const DialogNuevaReserva: React.FC<DialogNuevaReservaProps> = ({
  open,
  onClose,
  onSubmit,
  verificarConflicto,
  fechaInicial,
  salaInicial,
  horaInicial,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nombre_sala: "" as Sala,
      fecha: format(new Date(), "yyyy-MM-dd"),
      hora_inicio: "09:00",
      hora_final: "10:00",
      observaciones: "",
    },
  });

  const fechaActual = watch("fecha");

  useEffect(() => {
    if (open) {
      if (fechaInicial) {
        setValue("fecha", fechaInicial);
      } else {
        setValue("fecha", format(new Date(), "yyyy-MM-dd"));
      }
      
      if (salaInicial) {
        setValue("nombre_sala", salaInicial);
      }
      
      if (horaInicial) {
        setValue("hora_inicio", horaInicial);
        const [h] = horaInicial.split(":").map(Number);
        const horaFin = `${(h + 1).toString().padStart(2, "0")}:00`;
        setValue("hora_final", horaFin);
      }
    }
  }, [open, fechaInicial, salaInicial, horaInicial, setValue]);

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  const handleSalaChange = (
    _event: React.MouseEvent<HTMLElement>,
    newSala: Sala | null
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
    setLoading(true);
    setError(null);

    try {
      if (verificarConflicto) {
        const hayConflicto = await verificarConflicto(
          data.nombre_sala,
          data.fecha,
          data.hora_inicio,
          data.hora_final
        );

        if (hayConflicto) {
          setError("Ya existe una reserva en este horario para esta sala");
          setLoading(false);
          return;
        }
      }

      await onSubmit(data);
      handleClose();
    } catch (err: any) {
      setError(err.message || "Error al crear la reserva");
    } finally {
      setLoading(false);
    }
  };

  const shouldDisableDate = (date: Date) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return date < hoy;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, maxWidth: 800 }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {/* Header */}
          <Box sx={{ p: 3, pb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a2a3a", mb: 0.5 }}>
              Nueva Reservación
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#6b7280" }}>
              <ScheduleIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2">
                Reserve una sala de conferencias para su próxima reunión. Horario comercial: 7 AM - 5 PM.
              </Typography>
            </Box>
          </Box>

          <form onSubmit={handleSubmit(onFormSubmit)}>
            <Box sx={{ px: 3, pb: 3 }}>
              {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {/* Contenido principal en dos columnas */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 3,
                  p: 3,
                  backgroundColor: "#f9fafb",
                  borderRadius: 2,
                  border: "1px solid #e5e7eb",
                }}
              >
                {/* Columna izquierda */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  {/* Título de la Reunión */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "#374151" }}>
                      Título de la Reunión
                    </Typography>
                    <Controller
                      name="observaciones"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          placeholder="ej. Sincronización Semanal"
                          error={!!errors.observaciones}
                          helperText={errors.observaciones?.message}
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

                  {/* Seleccionar Sala */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "#374151" }}>
                      Seleccionar Sala
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
                              py: 1.5,
                              textTransform: "none",
                              fontWeight: 500,
                              fontSize: "0.9rem",
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
                            <ToggleButton key={sala} value={sala} disabled={loading}>
                              {sala} ({INFO_SALAS[sala]})
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                      )}
                    />
                    {errors.nombre_sala && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                        {errors.nombre_sala.message}
                      </Typography>
                    )}
                  </Box>

                  {/* Hora de Inicio y Hora de Fin */}
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "#374151" }}>
                        Hora de Inicio
                      </Typography>
                      <Controller
                        name="hora_inicio"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!errors.hora_inicio}>
                            <Select
                              {...field}
                              disabled={loading}
                              sx={{ backgroundColor: "white" }}
                            >
                              {OPCIONES_HORA.map((opcion) => (
                                <MenuItem key={opcion.value} value={opcion.value}>
                                  {opcion.label}
                                </MenuItem>
                              ))}
                            </Select>
                            {errors.hora_inicio && (
                              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                {errors.hora_inicio.message}
                              </Typography>
                            )}
                          </FormControl>
                        )}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "#374151" }}>
                        Hora de Fin
                      </Typography>
                      <Controller
                        name="hora_final"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!errors.hora_final}>
                            <Select
                              {...field}
                              disabled={loading}
                              sx={{ backgroundColor: "white" }}
                            >
                              {OPCIONES_HORA.map((opcion) => (
                                <MenuItem key={opcion.value} value={opcion.value}>
                                  {opcion.label}
                                </MenuItem>
                              ))}
                            </Select>
                            {errors.hora_final && (
                              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                {errors.hora_final.message}
                              </Typography>
                            )}
                          </FormControl>
                        )}
                      />
                    </Box>
                  </Box>

                  {/* Nota sobre horario */}
                  {/* <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      p: 2,
                      backgroundColor: "#FEF3C7",
                      borderRadius: 2,
                      border: "1px solid #F59E0B",
                    }}
                  >
                    <InfoIcon sx={{ color: "#D97706", fontSize: 20, mt: 0.25 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#92400E" }}>
                        NOTA
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#92400E" }}>
                        Las reservaciones están estrictamente limitadas al horario comercial (07:00 AM - 05:00 PM).
                      </Typography>
                    </Box>
                  </Box> */}
                </Box>

                {/* Columna derecha - Calendario */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "#374151" }}>
                    Fecha
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
                          value={field.value ? parse(field.value, "yyyy-MM-dd", new Date()) : null}
                          onChange={handleDateChange}
                          shouldDisableDate={shouldDisableDate}
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
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                      {errors.fecha.message}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Botones de acción */}
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
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
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    backgroundColor: "#2196F3",
                    borderRadius: 2,
                    boxShadow: "none",
                    px: 3,
                    "&:hover": {
                      backgroundColor: "#067dde",
                      boxShadow: "none",
                    },
                  }}
                >
                  Confirmar Reservación
                </Button>
              </Box>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    </LocalizationProvider>
  );
};

export default DialogNuevaReserva;