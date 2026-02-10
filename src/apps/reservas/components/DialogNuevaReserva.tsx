// src/apps/reservas/components/DialogNuevaReserva.tsx

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
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
  Select,
  FormControl,
  Chip,
  Popper,
  Paper,
  Fade,
  ClickAwayListener,
} from "@mui/material";
import {
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Close as CloseIcon,
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
} from "../types/reservas.types";
import { getConfiguracionReserva } from "../services/reservas";
import { useTourContext } from "./TourContext";

// // ============================================
// // SPOTLIGHT ANIMATION KEYFRAMES
// // ============================================
// const styleSheet = document.createElement("style");
// styleSheet.textContent = `
//   // @keyframes pulse-spotlight {
//   //   // 0%, 100% {
//   //   //   box-shadow: 0 0 30px rgba(0, 70, 128, 0.16), inset 0 0 20px rgba(0, 70, 128, 0.2);
//   //   // }
//   //   // 50% {
//   //   //   box-shadow: 0 0 50px rgba(0, 70, 128, 0.18), inset 0 0 30px rgba(0, 70, 128, 0.3);
//   //   // }
//   // }
// `;
// document.head.appendChild(styleSheet);

interface DialogNuevaReservaProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (datos: NuevaReserva) => Promise<void>;
  verificarConflicto?: (
    sala: string,
    fecha: string,
    horaInicio: string,
    horaFinal: string,
  ) => Promise<boolean>;
  fechaInicial?: string;
  salaInicial?: Sala;
  horaInicial?: string;
}

// ============================================
// TOUR STEPS CONFIG
// ============================================
interface DialogTourStep {
  target: string;
  title: string;
  content: string;
  placement: "top" | "bottom" | "left" | "right";
  highlight?: boolean;
  isLast?: boolean;
  disableScrolling?: true;
  disableScrollParentFix?: true;
  spotlightClicks?: true;
  spotlightPadding?: number;
}

const DIALOG_TOUR_STEPS: DialogTourStep[] = [
  {
    target: "tour-dialog-titulo",
    title: "Título de la Reunión",
    content: 'Escribe un título descriptivo para tu reunión. Por ejemplo: "Sincronización semanal del equipo".',
    placement: "right",
    spotlightClicks: true,
    spotlightPadding: 9,
  },
  {
    target: "tour-dialog-sala",
    title: "Seleccionar Sala",
    content: "Elige entre Sala Principal (más grande) o Sala Secundaria (más compacta) según tus necesidades.",
    placement: "right",
    //spotlightPadding: 12,
  },
  {
    target: "tour-dialog-horas",
    title: "Horario de la Reunión",
    content: "Selecciona la hora de inicio y la hora de fin. La duración mínima es de 1 hora.",
    placement: "right",
    spotlightPadding: 10,
  },
  {
    target: "tour-dialog-fecha",
    title: "Fecha de la Reserva",
    content: "Selecciona la fecha en el calendario. No puedes seleccionar fechas pasadas.",
    placement: "left",
    spotlightPadding: 20,
  },
  {
    target: "tour-dialog-observaciones",
    title: "Observaciones (Opcional)",
    content: "Agrega detalles adicionales como participantes, materiales necesarios o la agenda de la reunión.",
    placement: "right",
    spotlightPadding: 16,
  },
  {
    target: "tour-dialog-submit",
    title: "¡Confirma tu Reserva!",
    content: 'Cuando hayas llenado los campos, haz clic en "Confirmar Reservación" para guardar tu reserva.',
    placement: "top",
    highlight: true,
    isLast: true,
    spotlightPadding: 24,
  },
];

// ============================================
// TOUR TOOLTIP COMPONENT
// ============================================
interface TourTooltipProps {
  anchorEl: HTMLElement | null;
  step: DialogTourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  open: boolean;
}

const TourTooltip: React.FC<TourTooltipProps> = ({
  anchorEl,
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onClose,
  open,
}) => {
  if (!anchorEl || !open) return null;

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement={step.placement}
      transition
      modifiers={[
        {
          name: "offset",
          options: {
            offset: [0, 16],
          },
        },
        {
          name: "preventOverflow",
          options: {
            padding: 20,
          },
        },
        {
          name: "flip",
          options: {
            boundary: "viewport",
          },
        },
      ]}
      sx={{ zIndex: 9999 }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={350}>
          <Paper
            elevation={8}
            sx={{
              maxWidth: 280,
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            {/* Header */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                px: 2,
                py: 1.5,
                borderBottom: "1px solid #e0e0e0",
                backgroundColor: "#f9fafb",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: "#004680" }}
              >
                Paso {stepIndex + 1} de {totalSteps}
              </Typography>
              <Button
                size="small"
                onClick={onClose}
                sx={{
                  minWidth: "auto",
                  p: 0.5,
                  color: "text.secondary",
                  "&:hover": {
                    backgroundColor: "transparent",
                    color: "text.primary",
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </Button>
            </Box>

            {/* Content */}
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: "1rem" }}>
                {step.title}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {step.content}
              </Typography>
              {step.highlight && (
                <Chip
                  label="Llena el formulario y haz clic"
                  size="small"
                  sx={{
                    mt: 1.5,
                    backgroundColor: "#D1FAE5",
                    color: "#065F46",
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>

            {/* Footer */}
            {!step.isLast && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 2,
                  py: 1.5,
                  borderTop: "1px solid #e0e0e0",
                  backgroundColor: "#f9fafb",
                }}
              >
                <Button
                  variant="text"
                  size="small"
                  disabled={stepIndex === 0}
                  onClick={onPrev}
                  sx={{
                    textTransform: "none",
                    color: stepIndex === 0 ? "text.disabled" : "text.secondary",
                  }}
                >
                  Atrás
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={onNext}
                  sx={{
                    backgroundColor: "#004680",
                    textTransform: "none",
                    borderRadius: 1,
                    "&:hover": { backgroundColor: "#005AA3" },
                  }}
                >
                  Siguiente
                </Button>
              </Box>
            )}
          </Paper>
        </Fade>
      )}
    </Popper>
  );
};

// ============================================
// SPOTLIGHT OVERLAY
// ============================================
interface SpotlightOverlayProps {
  targetEl: HTMLElement | null;
  open: boolean;
  padding?: number;
}

const SpotlightOverlay: React.FC<SpotlightOverlayProps> = ({ targetEl, open }) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (targetEl && open) {
      const updateRect = () => {
        setRect(targetEl.getBoundingClientRect());
      };
      updateRect();
      
      // Actualizar si la ventana cambia
      window.addEventListener("resize", updateRect);
      window.addEventListener("scroll", updateRect);
      
      return () => {
        window.removeEventListener("resize", updateRect);
        window.removeEventListener("scroll", updateRect);
      };
    }
  }, [targetEl, open]);

  if (!open || !rect) return null;

  const padding = 8;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9998,
        pointerEvents: "none",
      }}
    >
      {/* Overlay con hueco */}
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={rect.left - padding}
              y={rect.top - padding}
              width={rect.width + padding * 2}
              height={rect.height + padding * 2}
              rx="12"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Borde del spotlight */}
      <Box
        sx={{
          position: "fixed",
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          borderRadius: 3,
          //border: "4px solid #004680",
          //boxShadow: "0 0 30px rgba(0, 70, 128, 0.6), inset 0 0 20px rgba(0, 70, 128, 0.2)",
          pointerEvents: "none",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          //animation: "pulse-spotlight 2s ease-in-out infinite",
        }}
      />
    </Box>
  );
};

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
  const [configCargando, setConfigCargando] = useState(true);

  // Tour context
  const { tourPhase, onDialogOpened, onFormSubmitted, stopTour } = useTourContext();
  const isTourMode = tourPhase === "DIALOG_TOUR";

  // Tour interno del dialog
  const [dialogTourStep, setDialogTourStep] = useState(0);
  const [dialogTourActive, setDialogTourActive] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  // Referencias a los elementos del formulario
  const tituloRef = useRef<HTMLDivElement>(null);
  const salaRef = useRef<HTMLDivElement>(null);
  const horasRef = useRef<HTMLDivElement>(null);
  const fechaRef = useRef<HTMLDivElement>(null);
  const observacionesRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const refMap: Record<string, React.RefObject<HTMLElement>> = {
    "tour-dialog-titulo": tituloRef,
    "tour-dialog-sala": salaRef,
    "tour-dialog-horas": horasRef,
    "tour-dialog-fecha": fechaRef,
    "tour-dialog-observaciones": observacionesRef,
    "tour-dialog-submit": submitRef,
  };

  // Actualizar anchor cuando cambia el paso
  useEffect(() => {
    if (dialogTourActive && DIALOG_TOUR_STEPS[dialogTourStep]) {
      const step = DIALOG_TOUR_STEPS[dialogTourStep];
      const ref = refMap[step.target];
      if (ref?.current) {
        setAnchorEl(ref.current);
      }
    }
  }, [dialogTourStep, dialogTourActive]);

  // ============================================
  // AUTO-SCROLL TO TOUR TARGET
  // ============================================
  useEffect(() => {
    if (dialogTourActive && DIALOG_TOUR_STEPS[dialogTourStep]) {
      const step = DIALOG_TOUR_STEPS[dialogTourStep];
      const ref = refMap[step.target];
      if (ref?.current) {
        // Scroll suave al elemento objetivo dentro del dialog
        ref.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [dialogTourStep, dialogTourActive]);

  // ============================================
  // TOUR SCROLL PREVENTION
  // ============================================
  useEffect(() => {
    if (dialogTourActive) {
      // Prevenir scroll en el body cuando el tour está activo
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [dialogTourActive]);

  // Obtener estilo original del overflow del body para restaurar
  const originalBodyOverflow = useRef<string>("");
  
  // Prevenir scroll en el dialog cuando el tour está activo
  useEffect(() => {
    if (dialogTourActive) {
      // Guardar estilo original
      originalBodyOverflow.current = document.body.style.overflow;
      // Bloquear scroll en body
      document.body.style.overflow = "hidden";
      
      // Bloquear scroll en el elemento con clase MuiDialogContent-root
      const dialogContent = document.querySelector(".MuiDialogContent-root");
      if (dialogContent) {
        (dialogContent as HTMLElement).style.overflow = "hidden";
      }
      
      return () => {
        document.body.style.overflow = originalBodyOverflow.current;
        // Restaurar scroll en dialogContent
        const dialogContent = document.querySelector(".MuiDialogContent-root");
        if (dialogContent) {
          (dialogContent as HTMLElement).style.overflow = "auto";
        }
      };
    }
  }, [dialogTourActive]);

  // Iniciar tour del dialog cuando se abre en modo tour
  useEffect(() => {
    if (open && isTourMode) {
      // Delay para que el dialog se renderice completamente
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

  // Notificar al tour que el diálogo se abrió
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

  // Estado para rastrear la hora de inicio seleccionada
  const [horaInicioSeleccionada, setHoraInicioSeleccionada] = useState<string>("");

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

  // Filtrar opciones de hora_final para mostrar solo horas >= hora_inicio + 1 hora
  const opcionesHoraFinal = useMemo(() => {
    if (!horaInicioSeleccionada) return opcionesHora;
    
    const [h, m] = horaInicioSeleccionada.split(":").map(Number);
    let horaMinima = h + 1;
    if (horaMinima >= 24) horaMinima = 23;
    const horaMinimaStr = `${horaMinima.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    
    return opcionesHora.filter((opcion) => opcion.value >= horaMinimaStr);
  }, [opcionesHora, horaInicioSeleccionada]);

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

  // Schema de validación
  const schema = useMemo(
    () =>
      yup.object({
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
          .test(
            "horario-minimo",
            `Debe ser desde las ${formatearHoraLegible(horarioConfig.horaApertura)}`,
            (value) => {
              if (!value) return false;
              return value >= horarioConfig.horaApertura;
            }
          )
          .test(
            "horario-maximo",
            `Debe ser antes de las ${formatearHoraLegible(horarioConfig.horaCierre)}`,
            (value) => {
              if (!value) return false;
              return value < horarioConfig.horaCierre;
            }
          ),
        hora_final: yup
          .string()
          .required("Selecciona hora de fin")
          .test(
            "hora-mayor",
            "La hora de fin debe ser al menos 1 hora después de la hora de inicio",
            function (value) {
              const { hora_inicio } = this.parent;
              if (!value || !hora_inicio) return false;
              const [h, m] = hora_inicio.split(":").map(Number);
              let horaMinima = h + 1;
              if (horaMinima >= 24) horaMinima = 23;
              const horaMinimaStr = `${horaMinima.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
              return value >= horaMinimaStr;
            }
          )
          .test(
            "horario-maximo-cierre",
            `Debe ser hasta las ${formatearHoraLegible(horarioConfig.horaCierre)}`,
            (value) => {
              if (!value) return false;
              return value <= horarioConfig.horaCierre;
            }
          ),
        titulo: yup
          .string()
          .required("El título es obligatorio")
          .min(3, "Mínimo 3 caracteres")
          .max(100, "Máximo 100 caracteres"),
        observaciones: yup.string().max(500, "Máximo 500 caracteres"),
      }),
    [horarioConfig]
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
      nombre_sala: "" as Sala,
      fecha: format(new Date(), "yyyy-MM-dd"),
      hora_inicio: horarioConfig.horaApertura,
      hora_final: "",
      titulo: "",
      observaciones: "",
    },
  });

  // Actualizar valores cuando cambia la configuración
  useEffect(() => {
    if (!configCargando && opcionesHora.length > 0) {
      const horaInicioDefault = horarioConfig.horaApertura;
      const [h] = horaInicioDefault.split(":").map(Number);
      const horaFinDefault = `${(h + 1).toString().padStart(2, "0")}:00`;
      setValue("hora_inicio", horaInicioDefault);
      setValue("hora_final", horaFinDefault);
    }
  }, [configCargando, opcionesHora, horarioConfig, setValue]);

  useEffect(() => {
    if (open && !configCargando) {
      if (fechaInicial) {
        setValue("fecha", fechaInicial);
      } else {
        setValue("fecha", format(new Date(), "yyyy-MM-dd"));
      }
      if (salaInicial) {
        setValue("nombre_sala", salaInicial);
      }
      if (horaInicial) {
        if (
          horaInicial >= horarioConfig.horaApertura &&
          horaInicial < horarioConfig.horaCierre
        ) {
          setValue("hora_inicio", horaInicial);
          const [h] = horaInicial.split(":").map(Number);
          const horaFin = `${(h + 1).toString().padStart(2, "0")}:00`;
          if (horaFin <= horarioConfig.horaCierre) {
            setValue("hora_final", horaFin);
          } else {
            setValue("hora_final", horarioConfig.horaCierre);
          }
        }
      }
    }
  }, [open, configCargando, fechaInicial, salaInicial, horaInicial, horarioConfig, setValue]);

  const horaInicioWatch = watch("hora_inicio");
  const horaFinalWatch = watch("hora_final");
  const observacionesWatch = watch("observaciones");

  const caracteresObservaciones = observacionesWatch?.length || 0;
  const caracteresRestantes = 500 - caracteresObservaciones;
  const aproximandoLimite = caracteresObservaciones >= 450;

  useEffect(() => {
    if (horaInicioWatch) {
      setHoraInicioSeleccionada(horaInicioWatch);
      const [h, m] = horaInicioWatch.split(":").map(Number);
      let horaMinima = h + 1;
      if (horaMinima >= 24) horaMinima = 23;
      const horaMinimaStr = `${horaMinima.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      if (horaFinalWatch && horaFinalWatch < horaMinimaStr) {
        setValue("hora_final", horaMinimaStr);
      }
    }
  }, [horaInicioWatch, horaFinalWatch, setValue]);

  const handleClose = () => {
    reset();
    setError(null);
    setDialogTourActive(false);
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

  const onFormSubmit = async (data: any) => {
    // Si estamos en modo tour, enviar datos al tour context
    if (isTourMode) {
      setDialogTourActive(false);
      onFormSubmitted({
        nombre_sala: data.nombre_sala,
        fecha: data.fecha,
        hora_inicio: data.hora_inicio,
        hora_final: data.hora_final,
        titulo: data.titulo,
        observaciones: data.observaciones?.trim() || "",
      });
      return;
    }

    // Modo normal
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

      await onSubmit({
        nombre_sala: data.nombre_sala,
        fecha: data.fecha,
        hora_inicio: data.hora_inicio,
        hora_final: data.hora_final,
        titulo_reunion: data.titulo,
        observaciones: data.observaciones?.trim() || "",
      });
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
                {/* Columna izquierda */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {/* Título */}
                  <Box ref={tituloRef}>
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
                  <Box ref={salaRef}>
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
                  <Box ref={horasRef}>
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

                  {/* Observaciones */}
                  <Box ref={observacionesRef}>
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
                          placeholder="Detalles adicionales, participantes, materiales necesarios..."
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

                {/* Columna derecha - Calendario */}
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
                      name="fecha"
                      control={control}
                      render={({ field }) => (
                        <StaticDatePicker
                          value={field.value ? parse(field.value, "yyyy-MM-dd", new Date()) : null}
                          onChange={(value: any) => {
                            if (value) {
                              setValue("fecha", format(new Date(value.toString()), "yyyy-MM-dd"));
                            }
                          }}
                          disabled={loading}
                          shouldDisableDate={shouldDisableDate as any}
                          displayStaticWrapperAs="desktop"
                          slotProps={{ actionBar: { actions: [] } }}
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
                  {errors.fecha && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                      {errors.fecha.message}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Botones */}
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
                <Button
                  onClick={handleClose}
                  disabled={loading || isTourMode}
                  sx={{ textTransform: "none", fontWeight: 500, color: "#374151" }}
                >
                  Cancelar
                </Button>
                <Button
                  ref={submitRef}
                  type="submit"
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
          </form>
        </DialogContent>

        {/* Spotlight overlay */}
        <SpotlightOverlay 
          targetEl={anchorEl} 
          open={dialogTourActive}
          padding={currentStep?.spotlightPadding}
        />

        {/* Tour tooltip */}
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