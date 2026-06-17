// Diálogo de creación de una nueva reserva con su tour interno opcional y notificación por correo.

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CheckIcon from "@mui/icons-material/CheckCircle";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";

import type { NewReservation, Room } from "../types/reservas.types";
import { sendReservationEmailNotification } from "../services/correoReservas";
import { useTourContext } from "./TourContext";
import { useHolidays } from "../hooks/useHolidays";
import { FestivoDay } from "./FestivoDay";

import { EMAIL_REGEX } from "./dialogShared/constants";
import {
  generarOpcionesHora,
  formatearHoraLegible,
  calcularHoraMinima,
} from "./dialogShared/horaHelpers";
import { useHorarioConfig } from "./dialogShared/useHorarioConfig";
import { useParticipantesAutocomplete } from "./dialogShared/useParticipantesAutocomplete";
import { SalaSelector } from "./dialogShared/SalaSelector";
import { HorasFields } from "./dialogShared/HorasFields";
import { ParticipantesSection } from "./dialogShared/ParticipantesSection";
import { ObservacionesField } from "./dialogShared/ObservacionesField";

import {
  DIALOG_TOUR_STEPS,
  DATOS_EJEMPLO_TOUR,
} from "./dialogTour/DialogTourSteps";
import { TourTooltip } from "./dialogTour/TourTooltip";
import { SpotlightOverlay } from "./dialogTour/SpotlightOverlay";

interface DialogNuevaReservaProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (datos: NewReservation) => Promise<void>;
  verificarConflicto?: (
    sala: string,
    fecha: string,
    horaInicio: string,
    horaFinal: string,
  ) => Promise<boolean>;
  fechaInicial?: string;
  salaInicial?: Room;
  horaInicial?: string;
}

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
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const { data: festivos = {} } = useHolidays(calendarYear);

  const [enviarCorreo, setEnviarCorreo] = useState<boolean>(false);

  const { tourPhase, onDialogOpened, onFormSubmitted, stopTour } = useTourContext();
  const isTourMode = tourPhase === "DIALOG_TOUR";

  const [dialogTourStep, setDialogTourStep] = useState(0);
  const [dialogTourActive, setDialogTourActive] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const tituloRef = useRef<HTMLDivElement>(null);
  const salaRef = useRef<HTMLDivElement>(null);
  const horasRef = useRef<HTMLDivElement>(null);
  const fechaRef = useRef<HTMLDivElement>(null);
  const observacionesRef = useRef<HTMLDivElement>(null);
  const participantesRef = useRef<HTMLDivElement>(null);
  const correoRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const refMap: Record<string, React.RefObject<HTMLElement>> = {
    "tour-dialog-titulo": tituloRef,
    "tour-dialog-sala": salaRef,
    "tour-dialog-horas": horasRef,
    "tour-dialog-fecha": fechaRef,
    "tour-dialog-observaciones": observacionesRef,
    "tour-dialog-participantes": participantesRef,
    "tour-dialog-correo": correoRef,
    "tour-dialog-submit": submitRef,
  };

  useEffect(() => {
    if (dialogTourActive && DIALOG_TOUR_STEPS[dialogTourStep]) {
      const step = DIALOG_TOUR_STEPS[dialogTourStep];
      const ref = refMap[step.target];
      if (ref?.current) {
        setAnchorEl(ref.current);
      }
    }
  }, [dialogTourStep, dialogTourActive]);

  useEffect(() => {
    if (dialogTourActive && DIALOG_TOUR_STEPS[dialogTourStep]) {
      const step = DIALOG_TOUR_STEPS[dialogTourStep];
      const ref = refMap[step.target];
      if (ref?.current) {
        ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [dialogTourStep, dialogTourActive]);

  useEffect(() => {
    if (!dialogTourActive) return;
    const prevBodyOverflow = document.body.style.overflow;
    const dialogContent = document.querySelector(".MuiDialogContent-root") as HTMLElement | null;
    const prevDialogOverflow = dialogContent?.style.overflow ?? "";
    document.body.style.overflow = "hidden";
    if (dialogContent) dialogContent.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      if (dialogContent) dialogContent.style.overflow = prevDialogOverflow || "auto";
    };
  }, [dialogTourActive]);

  useEffect(() => {
    if (open && isTourMode) {
      const timer = setTimeout(() => {
        setDialogTourStep(0);
        setDialogTourActive(true);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setDialogTourActive(false);
      setDialogTourStep(0);
    }
  }, [open, isTourMode]);

  useEffect(() => {
    if (open) {
      onDialogOpened();
    }
  }, [open, onDialogOpened]);

  const handleTourNext = () => {
    if (dialogTourStep < DIALOG_TOUR_STEPS.length - 1) {
      setDialogTourStep(dialogTourStep + 1);
    }
  };

  const handleTourPrev = () => {
    if (dialogTourStep > 0) {
      setDialogTourStep(dialogTourStep - 1);
    }
  };

  const handleTourClose = () => {
    setDialogTourActive(false);
    stopTour();
  };

  const handleTourSubmit = () => {
    const currentTitulo = watch("meeting_title");
    const currentSala = watch("room_name");
    const currentFecha = watch("date");
    const currentHoraInicio = watch("start_time");
    const currentHoraFinal = watch("end_time");
    const currentObservaciones = watch("observations");

    const formularioLleno = currentTitulo && currentTitulo.trim().length >= 3 && currentSala;

    if (formularioLleno) {
      setDialogTourActive(false);
      onFormSubmitted({
        room_name: currentSala,
        date: currentFecha || format(new Date(), "yyyy-MM-dd"),
        start_time: currentHoraInicio || horarioConfig.horaApertura,
        end_time:
          currentHoraFinal ||
          `${(parseInt(horarioConfig.horaApertura.split(":")[0]) + 1).toString().padStart(2, "0")}:00`,
        meeting_title: currentTitulo,
        observations: currentObservaciones?.trim() || "",
      });
    } else {
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      const fechaEjemplo = format(manana, "yyyy-MM-dd");

      const [h] = horarioConfig.horaApertura.split(":").map(Number);
      const horaInicioEjemplo = `${(h + 1).toString().padStart(2, "0")}:00`;
      const horaFinEjemplo = `${(h + 1).toString().padStart(2, "0")}:30`;

      setValue("meeting_title", DATOS_EJEMPLO_TOUR.meeting_title);
      setValue("room_name", DATOS_EJEMPLO_TOUR.room_name);
      setValue("date", fechaEjemplo);
      setValue("start_time", horaInicioEjemplo);
      setValue("end_time", horaFinEjemplo);
      setValue("observations", DATOS_EJEMPLO_TOUR.observations);

      setTimeout(() => {
        setDialogTourActive(false);
        onFormSubmitted({
          room_name: DATOS_EJEMPLO_TOUR.room_name,
          date: fechaEjemplo,
          start_time: horaInicioEjemplo,
          end_time: horaFinEjemplo,
          meeting_title: DATOS_EJEMPLO_TOUR.meeting_title,
          observations: DATOS_EJEMPLO_TOUR.observations,
        });
      }, 100);
    }
  };

  const [horaInicioSeleccionada, setHoraInicioSeleccionada] = useState<string>("");

  const { horarioConfig, configCargando } = useHorarioConfig(open);

  const opcionesHora = useMemo(() => {
    const horaInicioNum = parseInt(horarioConfig.horaApertura.split(":")[0]);
    const horaFinNum = parseInt(horarioConfig.horaCierre.split(":")[0]);
    return generarOpcionesHora(horaInicioNum, horaFinNum);
  }, [horarioConfig]);

  const opcionesHoraFinal = useMemo(() => {
    if (!horaInicioSeleccionada) return opcionesHora;
    const horaMinimaStr = calcularHoraMinima(horaInicioSeleccionada);
    return opcionesHora.filter((opcion) => opcion.value >= horaMinimaStr);
  }, [opcionesHora, horaInicioSeleccionada]);

  const schema = useMemo(
    () =>
      yup.object({
        room_name: yup.string().required("Selecciona una sala"),
        date: yup
          .string()
          .required("Selecciona una fecha")
          .test("fecha-valida", "No puedes reservar fechas pasadas", (value) => {
            if (!value) return false;
            const fechaSeleccionada = new Date(value + "T00:00:00");
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            return fechaSeleccionada >= hoy;
          }),
        start_time: yup
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
        end_time: yup
          .string()
          .required("Selecciona hora de fin")
          .test(
            "hora-mayor",
            "La hora de fin debe ser al menos 30 minutos después de la hora de inicio",
            function (value) {
              const { start_time } = this.parent;
              if (!value || !start_time) return false;
              const horaMinimaStr = calcularHoraMinima(start_time);
              return value >= horaMinimaStr;
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
      date: format(new Date(), "yyyy-MM-dd"),
      start_time: horarioConfig.horaApertura,
      end_time: "",
      meeting_title: "",
      observations: "",
      participants: [] as { name: string; email: string }[],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants",
  });

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

  useEffect(() => {
    if (!configCargando && opcionesHora.length > 0) {
      const ahora = new Date();
      let horaActual = ahora.getHours();
      let minutoActual = ahora.getMinutes();

      if (minutoActual > 0 && minutoActual <= 30) {
        minutoActual = 30;
      } else if (minutoActual > 30) {
        minutoActual = 0;
        horaActual += 1;
      }

      let horaInicioDefault = `${horaActual.toString().padStart(2, "0")}:${minutoActual.toString().padStart(2, "0")}`;

      if (horaInicioDefault < horarioConfig.horaApertura) {
        horaInicioDefault = horarioConfig.horaApertura;
      } else if (horaInicioDefault >= horarioConfig.horaCierre) {
        horaInicioDefault = horarioConfig.horaApertura;
      }

      const horaFinDefault = calcularHoraMinima(horaInicioDefault);

      setValue("start_time", horaInicioDefault);
      if (horaFinDefault <= horarioConfig.horaCierre) {
        setValue("end_time", horaFinDefault);
      } else {
        setValue("end_time", horarioConfig.horaCierre);
      }
    }
  }, [configCargando, opcionesHora, horarioConfig, setValue]);

  useEffect(() => {
    if (open && !configCargando) {
      if (fechaInicial) {
        setValue("date", fechaInicial);
      } else {
        setValue("date", format(new Date(), "yyyy-MM-dd"));
      }
      if (salaInicial) {
        setValue("room_name", salaInicial);
      }
      if (horaInicial) {
        if (
          horaInicial >= horarioConfig.horaApertura &&
          horaInicial < horarioConfig.horaCierre
        ) {
          setValue("start_time", horaInicial);
          const horaFinStr = calcularHoraMinima(horaInicial);
          if (horaFinStr <= horarioConfig.horaCierre) {
            setValue("end_time", horaFinStr);
          } else {
            setValue("end_time", horarioConfig.horaCierre);
          }
        }
      }
    }
  }, [open, configCargando, fechaInicial, salaInicial, horaInicial, horarioConfig, setValue]);

  const horaInicioWatch = watch("start_time");
  const horaFinalWatch = watch("end_time");

  useEffect(() => {
    if (horaInicioWatch) {
      setHoraInicioSeleccionada(horaInicioWatch);
      const horaMinimaStr = calcularHoraMinima(horaInicioWatch);
      if (horaFinalWatch && horaFinalWatch < horaMinimaStr) {
        setValue("end_time", horaMinimaStr);
      }
    }
  }, [horaInicioWatch, horaFinalWatch, setValue]);

  const handleClose = () => {
    reset();
    setError(null);
    setEnviarCorreo(false);
    setDialogTourActive(false);
    onClose();
  };

  const onFormSubmit = async (data: any) => {
    if (isTourMode) {
      setDialogTourActive(false);
      onFormSubmitted({
        room_name: data.room_name,
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
        meeting_title: data.meeting_title,
        observations: data.observations?.trim() || "",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (verificarConflicto) {
        const hayConflicto = await verificarConflicto(
          data.room_name,
          data.date,
          data.start_time,
          data.end_time,
        );
        if (hayConflicto) {
          setError("Ya existe una reserva en este horario para esta sala");
          setLoading(false);
          return;
        }
      }

      const payload = {
        room_name: data.room_name,
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
        meeting_title: data.meeting_title,
        observations: data.observations?.trim() || "",
        participants: data.participants,
        departament: data.departament,
      };
      await onSubmit(payload);

      if (enviarCorreo && data.participants && data.participants.length > 0) {
        try {
          const result = await sendReservationEmailNotification({
            evento: "reserva_creada",
            reserva: payload,
          });
          console.info("[n8n] correo enviado OK:", result);
        } catch (err) {
          console.warn("[n8n] correo NO enviado:", err);
        }
      } else {
        console.info("[n8n] envío de correo desactivado por el usuario");
      }

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

  const currentStep = DIALOG_TOUR_STEPS[dialogTourStep];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog
        open={open}
        onClose={isTourMode ? undefined : handleClose}
        maxWidth="lg"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, maxWidth: 1100 } } }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a2a3a", mb: 0.5 }}>
              Nueva Reservación
              {isTourMode && (
                <Chip
                  label="Tutorial"
                  size="small"
                  sx={{
                    ml: 1,
                    backgroundColor: "#FEF3C7",
                    color: "#92400E",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                  }}
                />
              )}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#6b7280" }}>
              <ScheduleIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2">
                Reserve una sala de conferencias para su próxima reunión.
                Horario comercial: 7 AM - 4:30 PM.
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
                  <Box ref={tituloRef}>
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
                        errorMessage={errors.room_name?.message}
                        containerRef={salaRef}
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
                            errorEnd={errors.end_time?.message}
                            containerRef={horasRef}
                          />
                        )}
                      />
                    )}
                  />

                  <ParticipantesSection
                    titulo="Añadir Participantes"
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
                    containerRef={participantesRef}
                  />
                </Box>

                <Box ref={fechaRef}>
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
                          onChange={(value: any) => {
                            if (value) {
                              setValue("date", format(new Date(value.toString()), "yyyy-MM-dd"));
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
                          disabled={loading}
                          shouldDisableDate={shouldDisableDate as any}
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
                          placeholder="Detalles adicionales, participantes, materiales necesarios..."
                          containerRef={observacionesRef}
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
                  ref={correoRef}
                  control={
                    <Switch
                      checked={fields.length > 0 && enviarCorreo}
                      onChange={(e) => setEnviarCorreo(e.target.checked)}
                      disabled={loading || fields.length === 0}
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
                      Enviar correo de notificación
                    </Typography>
                  }
                  sx={{ ml: 0 }}
                />
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    onClick={handleClose}
                    disabled={loading || isTourMode}
                    sx={{ textTransform: "none", fontWeight: 500, color: "#374151" }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    ref={submitRef}
                    type={isTourMode ? "button" : "submit"}
                    onClick={isTourMode ? handleTourSubmit : undefined}
                    variant="contained"
                    disabled={loading}
                    startIcon={
                      loading ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />
                    }
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      backgroundColor: "#004680",
                      borderRadius: 2,
                      boxShadow: "none",
                      px: 3,
                      "&:hover": { backgroundColor: "#005AA3", boxShadow: "none" },
                    }}
                  >
                    Confirmar Reservación
                  </Button>
                </Box>
              </Box>
            </Box>
          </form>
        </DialogContent>

        <SpotlightOverlay
          targetEl={anchorEl}
          open={dialogTourActive}
          padding={currentStep?.spotlightPadding}
        />

        {currentStep && (
          <TourTooltip
            anchorEl={anchorEl}
            step={currentStep}
            stepIndex={dialogTourStep}
            totalSteps={DIALOG_TOUR_STEPS.length}
            onNext={handleTourNext}
            onPrev={handleTourPrev}
            onClose={handleTourClose}
            open={dialogTourActive}
          />
        )}
      </Dialog>
    </LocalizationProvider>
  );
};

export default DialogNuevaReserva;
