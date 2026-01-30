// src/apps/reservas/components/DialogEditarReserva.tsx

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { format, parse, isWeekend } from "date-fns";
import { es } from "date-fns/locale";
import type { Reserva, ActualizarReserva, Sala } from "../types/reservas.types";
import {
  SALAS_DISPONIBLES,
  HORARIO_INICIO,
  HORARIO_FIN,
  DURACION_MINIMA_MINUTOS,
} from "../types/reservas.types";

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
    reservaIdExcluir: number
  ) => Promise<boolean>;
}

// Festivos Colombia 2025-2026
const FESTIVOS = [
  "2025-01-01", "2025-01-06", "2025-03-24", "2025-04-17", "2025-04-18",
  "2025-05-01", "2025-06-02", "2025-06-23", "2025-06-30", "2025-07-20",
  "2025-08-07", "2025-08-18", "2025-10-13", "2025-11-03", "2025-11-17",
  "2025-12-08", "2025-12-25",
  "2026-01-01", "2026-01-12", "2026-03-23", "2026-04-02", "2026-04-03",
  "2026-05-01", "2026-05-18", "2026-06-08", "2026-06-15", "2026-06-29",
  "2026-07-20", "2026-08-07", "2026-08-17", "2026-10-12", "2026-11-02",
  "2026-11-16", "2026-12-08", "2026-12-25",
];

const esFestivo = (fecha: Date): boolean => {
  const fechaStr = format(fecha, "yyyy-MM-dd");
  return FESTIVOS.includes(fechaStr);
};

// Componente para días personalizados
const CustomDay = (props: PickersDayProps<Date>) => {
  const { day, ...other } = props;
  const esFinDeSemana = isWeekend(day);
  const esDiaFestivo = esFestivo(day);

  return (
    <PickersDay
      {...other}
      day={day}
      sx={{
        ...(esFinDeSemana && {
          color: "#ef4444 !important",
          fontWeight: 600,
        }),
        ...(esDiaFestivo && {
          backgroundColor: "#fef2f2 !important",
          color: "#dc2626 !important",
          fontWeight: 700,
          "&:hover": {
            backgroundColor: "#fee2e2 !important",
          },
        }),
      }}
    />
  );
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
    })
    .test("hora-no-pasada", "No puedes reservar en horas pasadas", function (value) {
      if (!value) return false;
      const { fecha } = this.parent;
      if (!fecha) return true;
      
      const ahora = new Date();
      const fechaReserva = new Date(fecha + "T00:00:00");
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaReserva > hoy) return true;
      
      const [hora, min] = value.split(":").map(Number);
      const horaReserva = new Date();
      horaReserva.setHours(hora, min, 0, 0);
      
      return horaReserva > ahora;
    }),
  hora_final: yup
    .string()
    .required("Selecciona hora de fin")
    .test("horario-minimo", `Debe ser después de las ${HORARIO_INICIO}`, (value) => {
      if (!value) return false;
      return value > HORARIO_INICIO;
    })
    .test("horario-maximo", `Debe ser máximo a las ${HORARIO_FIN}`, (value) => {
      if (!value) return false;
      return value <= HORARIO_FIN;
    })
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
  // OBSERVACIONES OBLIGATORIO - mínimo 5 caracteres
  observaciones: yup
    .string()
    .required("Las observaciones son obligatorias")
    .min(5, "Mínimo 5 caracteres")
    .max(500, "Máximo 500 caracteres"),
});

const DialogEditarReserva: React.FC<DialogEditarReservaProps> = ({
  open,
  reserva,
  onClose,
  onSubmit,
  verificarConflicto,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      hora_inicio: "",
      hora_final: "",
      observaciones: "",
    },
  });

  useEffect(() => {
    if (reserva && open) {
      reset({
        nombre_sala: reserva.nombre_sala as Sala,
        fecha: reserva.fecha,
        hora_inicio: reserva.hora_inicio.substring(0, 5),
        hora_final: reserva.hora_final.substring(0, 5),
        observaciones: reserva.observaciones || "",
      });
    }
  }, [reserva, open, reset]);

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
          reserva.id
        );

        if (hayConflicto) {
          setError("Ya existe una reserva en este horario para esta sala");
          setLoading(false);
          return;
        }
      }

      await onSubmit(reserva.id, data);
      handleClose();
    } catch (err: any) {
      setError(err.message || "Error al actualizar la reserva");
    } finally {
      setLoading(false);
    }
  };

  // Función para deshabilitar fechas pasadas
  const shouldDisableDate = (date: Date) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return date < hoy;
  };

  if (!reserva) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", color: "#1a2a3ae0" }}>
          Editar Reserva
        </DialogTitle>

        <form onSubmit={handleSubmit(onFormSubmit)}>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {/* Selector de Sala con Botones */}
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: "#374151" }}>
                  Sala *
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
                          fontWeight: 600,
                          fontSize: "0.95rem",
                          border: "2px solid #e0e0e0",
                          "&.Mui-selected": {
                            backgroundColor: "#1976d2",
                            color: "white",
                            borderColor: "#1976d2",
                            "&:hover": {
                              backgroundColor: "#1565c0",
                            },
                          },
                          "&:hover": {
                            backgroundColor: "#f5f5f5",
                          },
                        },
                      }}
                    >
                      {SALAS_DISPONIBLES.map((sala) => (
                        <ToggleButton key={sala} value={sala} disabled={loading}>
                          {sala}
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

              {/* DatePicker de MUI - Estilo calendario desplegable */}
              <Controller
                name="fecha"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Fecha *"
                    value={field.value ? parse(field.value, "yyyy-MM-dd", new Date()) : null}
                    onChange={handleDateChange}
                    shouldDisableDate={shouldDisableDate}
                    disabled={loading}
                    format="dd/MM/yyyy"
                    slots={{
                      day: CustomDay,
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.fecha,
                        helperText: errors.fecha?.message,
                      },
                    }}
                  />
                )}
              />

              {/* Leyenda de días especiales */}
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-start", mt: -1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#ef4444" }} />
                  <Typography variant="caption" color="text.secondary">Fin de semana</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#fef2f2", border: "1px solid #dc2626" }} />
                  <Typography variant="caption" color="text.secondary">Festivo</Typography>
                </Box>
              </Box>

              <Controller
                name="hora_inicio"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="time"
                    label="Hora de Inicio *"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      step: 300,
                      min: HORARIO_INICIO,
                      max: HORARIO_FIN,
                    }}
                    error={!!errors.hora_inicio}
                    helperText={errors.hora_inicio?.message}
                    disabled={loading}
                  />
                )}
              />

              <Controller
                name="hora_final"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="time"
                    label="Hora de Fin *"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      step: 300,
                      min: HORARIO_INICIO,
                      max: HORARIO_FIN,
                    }}
                    error={!!errors.hora_final}
                    helperText={errors.hora_final?.message}
                    disabled={loading}
                  />
                )}
              />

              {/* Observaciones - OBLIGATORIO */}
              <Controller
                name="observaciones"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Observaciones *"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.observaciones}
                    helperText={errors.observaciones?.message || "Mínimo 5 caracteres. Motivo de la reunión, participantes, etc."}
                    disabled={loading}
                    placeholder="Motivo de la reunión, participantes, etc."
                  />
                )}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading && <CircularProgress size={16} />}
              sx={{
                boxShadow: "none",
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor: "#005da9"
                }
              }}
            >
              Guardar Cambios
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default DialogEditarReserva;