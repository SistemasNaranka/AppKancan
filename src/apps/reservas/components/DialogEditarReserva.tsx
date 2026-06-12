  // Diálogo de edición de una reserva existente con notificación opcional a los participantes.

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
  Switch,
  FormControlLabel,
} from "@mui/material";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SaveIcon from "@mui/icons-material/Save";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";

import type {
  Reservation,
  UpdateReservation,
  Room,
} from "../types/reservas.types";

import { EMAIL_REGEX } from "./dialogShared/constants";
import { generarOpcionesHora, calcularHoraMinima } from "./dialogShared/horaHelpers";
import { useHorarioConfig } from "./dialogShared/useHorarioConfig";
import { useHolidays } from "../hooks/useHolidays";
import { FestivoDay } from "./FestivoDay";
import { useParticipantesAutocomplete } from "./dialogShared/useParticipantesAutocomplete";
import { SalaSelector } from "./dialogShared/SalaSelector";
import { HorasFields } from "./dialogShared/HorasFields";
import { ParticipantesSection } from "./dialogShared/ParticipantesSection";
import { ObservacionesField } from "./dialogShared/ObservacionesField";

interface DialogEditarReservaProps {
  open: boolean;
  reserva: Reservation | null;
  onClose: () => void;
  onSubmit: (
    id: number,
    datos: UpdateReservation,
    skipWebhook?: boolean,
  ) => Promise<void>;
  verificarConflicto?: (
    sala: string,
    fecha: string,
    horaInicio: string,
    horaFinal: string,
    reservaIdExcluir: number,
  ) => Promise<boolean>;
}

const DialogEditarReserva: React.FC<DialogEditarReservaProps> = ({
  open,
  reserva,
  onClose,
  onSubmit,
  verificarConflicto,
}) => {
  const [loading, setLoading] = useState(false);
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const { data: festivos = {} } = useHolidays(calendarYear);
  const [error, setError] = useState<string | null>(null);
  const [horaInicioSeleccionada, setHoraInicioSeleccionada] = useState("");
  const [enviarCorreo, setEnviarCorreo] = useState<boolean>(false);

  const { horarioConfig, configCargando } = useHorarioConfig(open);

  const schema = useMemo(
    () =>
      yup.object({
        room_name: yup.string().required("Selecciona una sala"),
        date: yup.string().required("Selecciona una fecha"),
        start_time: yup.string().required("Selecciona hora de inicio"),
        end_time: yup.string().required("Selecciona hora de fin"),
        meeting_title: yup
          .string()
          .required("El título es obligatorio")
          .min(3, "Mínimo 3 caracteres")
          .max(100, "Máximo 100 caracteres"),
        observations: yup.string().max(500, "Máximo 500 caracteres"),
        participants: yup.array().of(
          yup.object({
            name: yup.string().required("El nombre es obligatorio"),
            email: yup
              .string()
              .matches(EMAIL_REGEX, "Correo no válido")
              .required("El correo es obligatorio"),
          }),
        ),
      }),
    [horarioConfig],
  );

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      room_name: "" as Room,
      date: "",
      start_time: horarioConfig.horaApertura,
      end_time: "",
      meeting_title: "",
      observations: "",
      participants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants",
  });

  const horaInicioWatch = watch("start_time");
  const horaFinalWatch = watch("end_time");

  const opcionesHora = useMemo(() => {
    const inicio = parseInt(horarioConfig.horaApertura.split(":")[0]);
    const fin = parseInt(horarioConfig.horaCierre.split(":")[0]);
    return generarOpcionesHora(inicio, fin);
  }, [horarioConfig]);

  const opcionesHoraFinal = useMemo(() => {
    const base = horaInicioWatch || horaInicioSeleccionada;
    if (!base) return opcionesHora;
    const horaMinima = calcularHoraMinima(base);
    return opcionesHora.filter((opcion) => opcion.value >= horaMinima);
  }, [opcionesHora, horaInicioWatch, horaInicioSeleccionada]);

  const shouldDisableDate = (day: Date | any) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const date = day instanceof Date ? day : (day?.toDate?.() ?? new Date(day));
    return date < hoy;
  };

  useEffect(() => {
    if (!horaInicioWatch) return;
    setHoraInicioSeleccionada(horaInicioWatch);
    const horaMinimaStr = calcularHoraMinima(horaInicioWatch);
    if (horaFinalWatch && horaFinalWatch < horaMinimaStr) {
      setValue("end_time", horaMinimaStr);
    }
  }, [horaInicioWatch, horaFinalWatch, setValue]);

  useEffect(() => {
    if (!open || !reserva) return;

    const participantesNormalizados = Array.isArray(reserva.participants)
      ? reserva.participants.map((p: any) => ({
          name: p?.name ?? "",
          email: p?.email ?? p?.email ?? "",
        }))
      : [];

    reset({
      room_name: (reserva.room_name as Room) ?? ("" as Room),
      date: reserva.date,
      start_time: (reserva.start_time || "").substring(0, 5),
      end_time: (reserva.end_time || "").substring(0, 5),
      meeting_title: reserva.meeting_title ?? "",
      observations: reserva.observations ?? "",
      participants: participantesNormalizados,
    });
    setHoraInicioSeleccionada((reserva.start_time || "").substring(0, 5));
    setError(null);
  }, [open, reserva, reset]);

  const {
    usuariosSugeridos,
    buscandoUsuarios,
    tempNombre,
    setTempNombre,
    tempCorreo,
    setTempCorreo,
    handleBuscarUsuarios,
  } = useParticipantesAutocomplete();

  const handleAddParticipante = () => {
    if (tempNombre.trim() && tempCorreo.trim()) {
      if (!fields.some((f) => (f as any).email === tempCorreo)) {
        append({ name: tempNombre, email: tempCorreo });
        setTempNombre("");
        setTempCorreo("");
      }
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  const onFormSubmit = async (data: any) => {
    if (!reserva) return;

    setLoading(true);
    setError(null);

    try {
      if (verificarConflicto) {
        const hayConflicto = await verificarConflicto(
          data.room_name,
          data.date,
          data.start_time,
          data.end_time,
          reserva.id,
        );

        if (hayConflicto) {
          setError("Ya existe una reserva en este horario para esta sala");
          setLoading(false);
          return;
        }
      }

      const payloadActualizacion = {
        room_name: data.room_name,
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
        meeting_title: data.meeting_title,
        observations: data.observations?.trim() || "",
        participants: data.participants,
      };

      await onSubmit(reserva.id, payloadActualizacion, !enviarCorreo);

      handleClose();
    } catch (err: any) {
      setError(err.message || "Error al actualizar la reserva");
    } finally {
      setLoading(false);
    }
  };

  if (!reserva) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxWidth: 900 } }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a2a3a", mb: 0.5 }}>
              Editar Reservación
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#6b7280" }}>
              <ScheduleIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2">
                Modifique los detalles de su reservación.
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
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "#374151" }}>
                      Título de la Reunión *
                    </Typography>
                    <Controller
                      name="meeting_title"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          placeholder="ej. Sincronización Semanal"
                          error={!!errors.meeting_title}
                          helperText={errors.meeting_title?.message}
                          disabled={loading}
                          size="small"
                          sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "white" } }}
                        />
                      )}
                    />
                  </Box>

                  <Controller
                    name="room_name"
                    control={control}
                    render={({ field }) => (
                      <SalaSelector
                        value={field.value as Room | ""}
                        onChange={(sala) => field.onChange(sala)}
                        disabled={loading}
                        errorMessage={errors.meeting_title?.message}
                      />
                    )}
                  />

                  <Controller
                    name="start_time"
                    control={control}
                    render={({ field: startField }) => (
                      <Controller
                        name="end_time"
                        control={control}
                        render={({ field: endField }) => (
                          <HorasFields
                            horaApertura={horarioConfig.horaApertura}
                            horaCierre={horarioConfig.horaCierre}
                            opcionesInicio={opcionesHora}
                            opcionesFin={opcionesHoraFinal}
                            startTime={startField.value}
                            endTime={endField.value}
                            onStartChange={(v) => startField.onChange(v)}
                            onEndChange={(v) => endField.onChange(v)}
                            disabled={loading || configCargando}
                            errorStart={errors.start_time?.message}
                            errorEnd={errors.start_time?.message}
                          />
                        )}
                      />
                    )}
                  />

                  <ParticipantesSection
                    titulo="Editar Participantes"
                    fields={fields as any}
                    onRemove={remove}
                    onAdd={handleAddParticipante}
                    tempNombre={tempNombre}
                    tempCorreo={tempCorreo}
                    setTempNombre={setTempNombre}
                    setTempCorreo={setTempCorreo}
                    usuariosSugeridos={usuariosSugeridos}
                    buscandoUsuarios={buscandoUsuarios}
                    onBuscarUsuarios={handleBuscarUsuarios}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "#374151" }}>
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
                      name="date"
                      control={control}
                      render={({ field }) => (
                        <StaticDatePicker
                          value={field.value ? parse(field.value, "yyyy-MM-dd", new Date()) : null}
                          onChange={(date: any) => {
                            if (date) {
                              const d =
                                date instanceof Date
                                  ? date
                                  : (date?.toDate?.() ?? new Date(date));
                              field.onChange(format(d, "yyyy-MM-dd"));
                            }
                          }}
                          onMonthChange={(date: any) => {
                            const y = (date instanceof Date ? date : new Date(date as any)).getFullYear();
                            if (!isNaN(y)) setCalendarYear(y);
                          }}
                          onYearChange={(date: any) => {
                            const y = (date instanceof Date ? date : new Date(date as any)).getFullYear();
                            if (!isNaN(y)) setCalendarYear(y);
                          }}
                          shouldDisableDate={shouldDisableDate}
                          disabled={loading}
                          displayStaticWrapperAs="desktop"
                          slots={{ day: FestivoDay as any }}
                          slotProps={{
                            actionBar: { actions: [] },
                            day: { holidays: festivos } as any,
                          }}
                          sx={{
                            "& .MuiPickersCalendarHeader-root": { paddingLeft: 2, paddingRight: 2 },
                            "& .MuiDayCalendar-root": { width: "100%" },
                            "& .MuiPickersDay-root.Mui-disabled": {
                              color: "#ccc",
                              backgroundColor: "#f5f5f5",
                            },
                          }}
                        />
                      )}
                    />
                  </Box>
                  {errors.date && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                      {errors.date.message}
                    </Typography>
                  )}

                  <Box sx={{ mt: 2 }}>
                    <Controller
                      name="observations"
                      control={control}
                      render={({ field }) => (
                        <ObservacionesField
                          value={field.value || ""}
                          onChange={(v) => field.onChange(v)}
                          disabled={loading}
                          errorMessage={errors.observations?.message}
                          placeholder="Detalles adicionales..."
                        />
                      )}
                    />
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  mt: 3,
                  flexWrap: "wrap",
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={enviarCorreo}
                      onChange={(e) => setEnviarCorreo(e.target.checked)}
                      disabled={loading}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": { color: "#004680" },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                          backgroundColor: "#004680",
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: "#374151" }}>
                      Notificar cambios a los participantes
                    </Typography>
                  }
                  sx={{ ml: 0 }}
                />
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    onClick={handleClose}
                    disabled={loading}
                    sx={{ textTransform: "none", fontWeight: 500, color: "#374151" }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={
                      loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />
                    }
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      backgroundColor: "#004680",
                      borderRadius: 2,
                      px: 3,
                      boxShadow: "none",
                      "&:hover": { backgroundColor: "#005AA3", boxShadow: "none" },
                    }}
                  >
                    Guardar Cambios
                  </Button>
                </Box>
              </Box>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    </LocalizationProvider>
  );
};

export default DialogEditarReserva;
