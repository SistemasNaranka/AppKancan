// ================================
// src/apps/reservas/components/DialogEditarReserva.tsx
// REFACTORIZACIÓN PROFESIONAL SEGURA
// SIN CAMBIAR LÓGICA NI FUNCIONALIDAD
// ================================

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
  Select,
  FormControl,
  Autocomplete,
  IconButton,
  CircularProgress,
  Avatar,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Schedule as ScheduleIcon,
  Save as SaveIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";

import type {
  Reserva,
  ActualizarReserva,
  Sala,
} from "../types/reservas.types";

import {
  SALAS_DISPONIBLES,
  HORARIO_INICIO,
  HORARIO_FIN,
} from "../types/reservas.types";

import {
  getConfiguracionReserva,
  buscarUsuarios,
} from "../services/reservas";

import { notificarCorreoReserva } from "../services/correoReservas";


// ================================
// CONSTANTES
// ================================

const EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const INFO_SALAS: Record<string, string> = {
  "Sala Principal": "Grande",
  "Sala Secundaria": "Compacta",
};


// ================================
// TYPES
// ================================

interface DialogEditarReservaProps {
  open: boolean;
  reserva: Reserva | null;
  onClose: () => void;
  onSubmit: (
    id: number,
    datos: ActualizarReserva,
  ) => Promise<void>;
  verificarConflicto?: (
    sala: string,
    fecha: string,
    horaInicio: string,
    horaFinal: string,
    reservaIdExcluir: number,
  ) => Promise<boolean>;
}


// ================================
// HELPERS
// ================================

const generarOpcionesHora = (
  horaInicio: number = 7,
  horaFin: number = 17,
) => {
  const opciones: { value: string; label: string }[] = [];

  for (let h = horaInicio; h <= horaFin; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hora24 = `${h
        .toString()
        .padStart(2, "0")}:${m
        .toString()
        .padStart(2, "0")}`;

      const hora12 =
        h > 12 ? h - 12 : h === 0 ? 12 : h;

      const ampm = h >= 12 ? "PM" : "AM";

      const label = `${hora12
        .toString()
        .padStart(2, "0")}:${m
        .toString()
        .padStart(2, "0")} ${ampm}`;

      opciones.push({
        value: hora24,
        label,
      });
    }
  }

  return opciones;
};

const formatearHoraLegible = (
  hora24: string,
): string => {
  const [h, m] = hora24
    .split(":")
    .map(Number);

  const hora12 =
    h > 12 ? h - 12 : h === 0 ? 12 : h;

  const ampm = h >= 12 ? "PM" : "AM";

  return `${hora12}:${m
    .toString()
    .padStart(2, "0")} ${ampm}`;
};

const calcularHoraMinima = (
  horaInicio: string,
): string => {
  const [h, m] = horaInicio
    .split(":")
    .map(Number);

  let horaMinima = h + 1;

  if (horaMinima >= 24) horaMinima = 23;

  return `${horaMinima
    .toString()
    .padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}`;
};


// ================================
// COMPONENTE PRINCIPAL
// ================================

const DialogEditarReserva: React.FC<
  DialogEditarReservaProps
> = ({
  open,
  reserva,
  onClose,
  onSubmit,
  verificarConflicto,
}) => {

  // ================================
  // STATES
  // ================================

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [configCargando, setConfigCargando] =
    useState(true);

  const [horaInicioSeleccionada,
    setHoraInicioSeleccionada] =
    useState("");

  const [horarioConfig, setHorarioConfig] =
    useState({
      horaApertura: HORARIO_INICIO,
      horaCierre: HORARIO_FIN,
    });

  const [usuariosSugeridos,
    setUsuariosSugeridos] =
    useState<any[]>([]);

  const [buscandoUsuarios,
    setBuscandoUsuarios] =
    useState(false);

  const [tempNombre,
    setTempNombre] =
    useState("");

  const [tempCorreo,
    setTempCorreo] =
    useState("");

  const searchTimeout =
    useRef<NodeJS.Timeout | null>(null);

  // Toggle: enviar correo de actualización al editar reserva (default ON).
  const [enviarCorreo, setEnviarCorreo] = useState<boolean>(true);


  // ================================
  // MEMOS
  // ================================

  const opcionesHora = useMemo(() => {
    const inicio = parseInt(
      horarioConfig.horaApertura.split(":")[0],
    );

    const fin = parseInt(
      horarioConfig.horaCierre.split(":")[0],
    );

    return generarOpcionesHora(
      inicio,
      fin,
    );
  }, [horarioConfig]);

  const opcionesHoraFinal =
    useMemo(() => {
      if (!horaInicioSeleccionada)
        return opcionesHora;

      const horaMinima =
        calcularHoraMinima(
          horaInicioSeleccionada,
        );

      return opcionesHora.filter(
        (opcion) =>
          opcion.value >= horaMinima,
      );
    }, [
      opcionesHora,
      horaInicioSeleccionada,
    ]);


  // ================================
  // VALIDACIÓN
  // ================================

  const schema = useMemo(
    () =>
      yup.object({
        nombre_sala: yup
          .string()
          .required(
            "Selecciona una sala",
          ),

        fecha: yup
          .string()
          .required(
            "Selecciona una fecha",
          ),

        hora_inicio: yup
          .string()
          .required(
            "Selecciona hora de inicio",
          ),

        hora_final: yup
          .string()
          .required(
            "Selecciona hora de fin",
          ),

        titulo: yup
          .string()
          .required(
            "El título es obligatorio",
          )
          .min(
            3,
            "Mínimo 3 caracteres",
          )
          .max(
            100,
            "Máximo 100 caracteres",
          ),

        observaciones: yup
          .string()
          .max(
            500,
            "Máximo 500 caracteres",
          ),

        participantes: yup.array().of(
          yup.object({
            nombre: yup
              .string()
              .required(
                "El nombre es obligatorio",
              ),

            correo: yup
              .string()
              .matches(
                EMAIL_REGEX,
                "Correo no válido",
              )
              .required(
                "El correo es obligatorio",
              ),
          }),
        ),
      }),
    [horarioConfig],
  );


  // ================================
  // FORM
  // ================================

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver:
      yupResolver(schema),
    defaultValues: {
      nombre_sala: "" as Sala,
      fecha: "",
      hora_inicio:
        horarioConfig.horaApertura,
      hora_final: "",
      titulo: "",
      observaciones: "",
      participantes: [],
    },
  });

  const {
    fields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "participantes",
  });


  // ================================
  // WATCHERS
  // ================================

  const horaInicioWatch =
    watch("hora_inicio");

  const horaFinalWatch =
    watch("hora_final");

  const observacionesWatch =
    watch("observaciones");

  const caracteresObservaciones = observacionesWatch?.length || 0;
  const caracteresRestantes = 500 - caracteresObservaciones;
  const aproximandoLimite = caracteresObservaciones >= 450;

  const shouldDisableDate = (date: Date) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return date < hoy;
  };


  // ================================
  // EFFECTS
  // ================================

  useEffect(() => {
    const cargarConfiguracion =
      async () => {
        setConfigCargando(true);

        try {
          const config =
            await getConfiguracionReserva();

          if (config) {
            setHorarioConfig({
              horaApertura:
                config.hora_apertura?.substring(
                  0,
                  5,
                ) ||
                HORARIO_INICIO,

              horaCierre:
                config.hora_cierre?.substring(
                  0,
                  5,
                ) ||
                HORARIO_FIN,
            });
          }
        } catch (err) {
          console.error(
            "Error cargando configuración:",
            err,
          );
        } finally {
          setConfigCargando(
            false,
          );
        }
      };

    if (open) {
      cargarConfiguracion();
    }
  }, [open]);

  // FIX: cargar los datos de la reserva en el formulario al abrir el modal.
  // Sin este effect, el form quedaba con los defaultValues (vacíos) y el modal
  // parecía no funcionar.
  useEffect(() => {
    if (!open || !reserva) return;

    // Normalizar participantes: aceptar tanto {nombre, correo} como {nombre, email}
    const participantesNormalizados = Array.isArray(reserva.participantes)
      ? reserva.participantes.map((p: any) => ({
          nombre: p?.nombre ?? "",
          correo: p?.correo ?? p?.email ?? "",
        }))
      : [];

    reset({
      nombre_sala: reserva.nombre_sala as Sala,
      fecha: reserva.fecha,
      hora_inicio: (reserva.hora_inicio || "").substring(0, 5),
      hora_final: (reserva.hora_final || "").substring(0, 5),
      titulo: reserva.titulo_reunion ?? "",
      observaciones: reserva.observaciones ?? "",
      participantes: participantesNormalizados,
    });
    setHoraInicioSeleccionada((reserva.hora_inicio || "").substring(0, 5));
    setError(null);
  }, [open, reserva, reset]);


  // ================================
  // HANDLERS
  // ================================

  const handleAddParticipante =
    () => {
      if (
        tempNombre.trim() &&
        tempCorreo.trim()
      ) {
        if (
          !fields.some(
            (f) =>
              f.correo ===
              tempCorreo,
          )
        ) {
          append({
            nombre: tempNombre,
            correo: tempCorreo,
          });

          setTempNombre("");
          setTempCorreo("");
        }
      }
    };

  const handleBuscarUsuarios =
    (valor: string) => {
      if (
        searchTimeout.current
      ) {
        clearTimeout(
          searchTimeout.current,
        );
      }

      if (valor.length < 3) {
        setUsuariosSugeridos(
          [],
        );
        return;
      }

      searchTimeout.current =
        setTimeout(
          async () => {
            setBuscandoUsuarios(
              true,
            );

            const resultados =
              await buscarUsuarios(
                valor,
              );

            setUsuariosSugeridos(
              resultados as any[],
            );

            setBuscandoUsuarios(
              false,
            );
          },
          500,
        );
    };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  const handleSalaChange = (
    _event:
      React.MouseEvent<HTMLElement>,
    newSala: Sala | null,
  ) => {
    if (newSala) {
      setValue(
        "nombre_sala",
        newSala,
      );
    }
  };

  const handleDateChange = (
    date: Date | null,
  ) => {
    if (date) {
      setValue(
        "fecha",
        format(
          date,
          "yyyy-MM-dd",
        ),
      );
    }
  };


  // ================================
  // SUBMIT
  // ================================

  const onFormSubmit =
    async (data: any) => {
      if (!reserva) return;

      setLoading(true);
      setError(null);

      try {
        if (
          verificarConflicto
        ) {
          const hayConflicto =
            await verificarConflicto(
              data.nombre_sala,
              data.fecha,
              data.hora_inicio,
              data.hora_final,
              reserva.id,
            );

          if (
            hayConflicto
          ) {
            setError(
              "Ya existe una reserva en este horario para esta sala",
            );

            setLoading(
              false,
            );

            return;
          }
        }

        const payloadActualizacion = {
          nombre_sala: data.nombre_sala,
          fecha: data.fecha,
          hora_inicio: data.hora_inicio,
          hora_final: data.hora_final,
          titulo_reunion: data.titulo,
          observaciones: data.observaciones?.trim() || "",
          participantes: data.participantes,
        };

        await onSubmit(reserva.id, payloadActualizacion);

        // Notificación n8n post-edición. Solo si el toggle está activo.
        // No bloquea: si falla, solo logea (la edición ya quedó en BD).
        if (enviarCorreo) {
          // Detectar qué cambió respecto a la reserva original.
          const cambios = {
            sala: reserva.nombre_sala !== data.nombre_sala,
            fecha: reserva.fecha !== data.fecha,
            hora_inicio: (reserva.hora_inicio || "").substring(0, 5) !== data.hora_inicio,
            hora_final: (reserva.hora_final || "").substring(0, 5) !== data.hora_final,
            titulo: (reserva.titulo_reunion || "") !== data.titulo,
          };
          try {
            const result = await notificarCorreoReserva({
              evento: "reserva_actualizada",
              reserva: payloadActualizacion,
              // Campos extra fuera del type para que n8n los reciba
              ...({
                reserva_anterior: {
                  nombre_sala: reserva.nombre_sala,
                  fecha: reserva.fecha,
                  hora_inicio: (reserva.hora_inicio || "").substring(0, 5),
                  hora_final: (reserva.hora_final || "").substring(0, 5),
                  titulo_reunion: reserva.titulo_reunion,
                },
                cambios,
                reserva_id: reserva.id,
              } as any),
            });
            console.info("[n8n] correo edición enviado OK:", result);
          } catch (err) {
            console.warn("[n8n] correo edición NO enviado:", err);
          }
        } else {
          console.info("[n8n] envío de correo de edición desactivado");
        }

        handleClose();
      } catch (err: any) {
        setError(
          err.message ||
            "Error al actualizar la reserva",
        );
      } finally {
        setLoading(false);
      }
    };


  // ================================
  // RENDER
  // ================================

  if (!reserva) return null;

  return (
    <LocalizationProvider
      dateAdapter={
        AdapterDateFns
      }
      adapterLocale={es}
    >
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxWidth: 900 } }}
      >
        <DialogContent sx={{ p: 0 }}>
          {/* Header */}
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
                {/* Columna izquierda */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {/* Título */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "#374151" }}>
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
                          sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "white" } }}
                        />
                      )}
                    />
                  </Box>

                  {/* Sala */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "#374151" }}>
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
                                "&:hover": { backgroundColor: "#DBEAFE" },
                              },
                              "&:hover": { backgroundColor: "#f9fafb" },
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

                  {/* Horas */}
                  <Box>
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
                        <strong>{formatearHoraLegible(horarioConfig.horaApertura)}</strong> a{" "}
                        <strong>{formatearHoraLegible(horarioConfig.horaCierre)}</strong>
                      </Typography>
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "#374151" }}>
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
                                {opcionesHoraFinal.map((opcion) => (
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
                  </Box>

                  {/* Participantes */}
                  <Box>
                    <Box sx={{ p: 1.8, bgcolor: "#F9FAFB", borderRadius: 2, border: "1px solid #E5E7EB", mb: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#374151", mb: 1.2, fontSize: "0.85rem" }}>
                        Editar Participantes
                      </Typography>

                      <Box sx={{ display: "flex", gap: 2, mb: 0.5, alignItems: "flex-end" }}>
                        <TextField
                          placeholder="Nombre"
                          variant="standard"
                          size="small"
                          fullWidth
                          value={tempNombre}
                          onChange={(e) => setTempNombre(e.target.value)}
                          sx={{ flex: 1 }}
                        />
                        <Autocomplete
                          freeSolo
                          options={usuariosSugeridos}
                          getOptionLabel={(option) =>
                            typeof option === "string" ? option : option.email
                          }
                          loading={buscandoUsuarios}
                          onInputChange={(_, valor) => {
                            setTempCorreo(valor);
                            handleBuscarUsuarios(valor);
                          }}
                          onChange={(_, data) => {
                            if (data && typeof data !== "string") {
                              // Sobreescribir nombre + correo siempre que se elija
                              // un usuario del dropdown (corrige bug de nombre stale).
                              setTempCorreo(data.email);
                              setTempNombre(`${data.first_name} ${data.last_name || ""}`.trim());
                            } else if (typeof data === "string") {
                              setTempCorreo(data);
                            } else if (data === null) {
                              setTempCorreo("");
                              setTempNombre("");
                            }
                          }}
                          value={tempCorreo}
                          sx={{ flex: 2 }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Correo"
                              variant="standard"
                              size="small"
                              fullWidth
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <React.Fragment>
                                    {buscandoUsuarios ? <CircularProgress color="inherit" size={16} /> : null}
                                    {params.InputProps.endAdornment}
                                  </React.Fragment>
                                ),
                              }}
                            />
                          )}
                        />
                        <Button
                          variant="contained"
                          size="small"
                          onClick={handleAddParticipante}
                          disabled={!tempNombre || !tempCorreo}
                          sx={{
                            minWidth: "auto",
                            px: 3,
                            textTransform: "none",
                            bgcolor: "#3B82F6",
                            "&:hover": { bgcolor: "#2563EB" },
                            boxShadow: "none",
                            borderRadius: 1.5,
                            height: 32,
                          }}
                        >
                          Agregar
                        </Button>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        maxHeight: 200,
                        overflowY: "auto",
                        pr: 1,
                        "::-webkit-scrollbar": { width: "6px" },
                        "::-webkit-scrollbar-thumb": {
                          backgroundColor: "#e5e7eb",
                          borderRadius: "10px",
                        },
                      }}
                    >
                      {fields.map((field, index) => (
                        <Box
                          key={field.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            py: 0.8,
                            borderBottom: "1px solid #f3f4f6",
                            "&:last-child": { borderBottom: "none" },
                          }}
                        >
                          <Avatar sx={{ width: 30, height: 30, bgcolor: "#EFF6FF", color: "#3B82F6" }}>
                            <PersonIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "#1f2937", fontSize: "0.85rem", lineHeight: 1.2 }} noWrap>
                              {(field as any).nombre}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.75rem", display: "block" }} noWrap>
                              {(field as any).correo}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => remove(index)}
                            sx={{ color: "#9ca3af", p: 0.5, "&:hover": { color: "#ef4444" } }}
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      ))}
                      {fields.length === 0 && (
                        <Box sx={{ py: 3, textAlign: "center", bgcolor: "#f9fafb", borderRadius: 2, border: "1px dashed #d1d5db" }}>
                          <Typography variant="body2" sx={{ color: "#9ca3af", fontStyle: "italic", fontSize: "0.8rem" }}>
                            No hay invitados en la lista
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Columna derecha - Calendario */}
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
                      name="fecha"
                      control={control}
                      render={({ field }) => (
                        <StaticDatePicker
                          value={
                            field.value
                              ? parse(field.value, "yyyy-MM-dd", new Date())
                              : null
                          }
                          onChange={(date) => {
                            if (date) {
                              field.onChange(format(date, "yyyy-MM-dd"));
                            }
                          }}
                          shouldDisableDate={shouldDisableDate}
                          disabled={loading}
                          displayStaticWrapperAs="desktop"
                          slotProps={{ actionBar: { actions: [] } }}
                          sx={{
                            "& .MuiPickersCalendarHeader-root": { paddingLeft: 2, paddingRight: 2 },
                            "& .MuiDayCalendar-root": { width: "100%" },
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

                  {/* Observaciones (debajo del calendario) */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "#374151" }}>
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
                          placeholder="Detalles adicionales..."
                          error={!!errors.observaciones}
                          helperText={
                            errors.observaciones?.message || (
                              <Typography
                                component="span"
                                sx={{
                                  color: aproximandoLimite
                                    ? caracteresObservaciones >= 500
                                      ? "#ef4444"
                                      : "#f59e0b"
                                    : "#6b7280",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {caracteresObservaciones >= 500
                                  ? "Límite alcanzado"
                                  : `Opcional - ${caracteresRestantes} caracteres restantes`}
                              </Typography>
                            )
                          }
                          disabled={loading}
                          sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "white" } }}
                        />
                      )}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Botones */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mt: 3, flexWrap: "wrap" }}>
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