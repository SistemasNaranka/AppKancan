import React, { useCallback, useEffect, useState, ReactNode } from "react";
import Joyride, {
  CallBackProps,
  STATUS,
  Step,
  TooltipRenderProps,
  ACTIONS,
  EVENTS,
} from "react-joyride";
import { Box, Button, Typography, Chip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTourContext, TourPhase } from "./TourContext";

// ============================================
// PASOS POR FASE (Solo fuera del Dialog)
// ============================================

// Fase 1: Click en Nueva Reserva
const STEPS_RESERVA_CLICK: Step[] = [
  {
    target: ".tour-nueva-reserva",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1}}>
          ¡Comencemos!
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Haz <strong>clic en "Nueva reserva"</strong> para crear tu primera
          reservación de sala.
        </Typography>
        <Chip
          label="Haz clic en el botón"
          size="small"
          sx={{
            backgroundColor: "#E6F4FF",
            color: "#004680",
            fontWeight: 600,
          }}
        />
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
    spotlightClicks: true,
    hideFooter: true,
    disableScrolling: true,
  },
];

// Fase 3: Continuar en Pestaña Reserva (después del Dialog)
const STEPS_RESERVA_CONTINUE: Step[] = [
  {
    target: ".tour-estado-salas",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Estado de las Salas
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Aquí puedes ver en tiempo real si las salas están{" "}
          <strong>disponibles</strong> u <strong>ocupadas</strong>. También
          puedes reservar directamente o ver el cronograma de cada sala.
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".tour-proximas-reuniones",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Próximas Reuniones
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Lista de todas las reuniones programadas para hoy. Puedes ver el
          calendario completo haciendo clic en el enlace.
        </Typography>
      </Box>
    ),
    placement: "top",
  },
];

// Fase 4: Tour en Mis Reservas
const STEPS_MIS_RESERVAS: Step[] = [
  {
    target: ".tour-mis-reservas-tabs",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Filtrar por Estado
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Usa estas pestañas para filtrar tus reservas por estado:{" "}
          <strong>Vigentes</strong>, <strong>Finalizadas</strong> o{" "}
          <strong>Canceladas</strong>.
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".tour-reserva-card",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          ¡Tu Reserva!
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Esta es la reserva que acabas de crear. Cada tarjeta muestra: sala,
          fecha, hora y estado. Puedes <strong>editarla</strong> o{" "}
          <strong>cancelarla</strong> con los botones en la esquina.
        </Typography>
      </Box>
    ),
    placement: "right",
  },
];

// Fase 5: Tour en Calendario
const STEPS_CALENDARIO: Step[] = [
  {
    target: ".tour-sala-selector",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Filtro de Sala
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Selecciona qué sala quieres ver en el calendario. Puedes alternar
          entre "Sala Principal" y "Sala Secundaria".
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".tour-vista-selector",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Tipo de Vista
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Cambia entre vista <strong>Semanal</strong> (más detallada) y vista{" "}
          <strong>Mensual</strong> (panorama general).
        </Typography>
      </Box>
    ),
    placement: "bottom",
  },
  {
    target: ".tour-navegacion",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Navegación
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Usa las flechas para moverte entre semanas/meses. El botón "Hoy" te
          lleva rápidamente a la fecha actual.
        </Typography>
      </Box>
    ),
    placement: "bottom",
  },
  {
    target: ".tour-selector-fecha",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Selector Rápido
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Selecciona directamente el día, mes y año para saltar a cualquier
          fecha específica.
        </Typography>
      </Box>
    ),
    placement: "bottom",
  },
  {
    target: ".tour-periodo",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Período Visible
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Muestra el rango de fechas actualmente visible en el calendario.
        </Typography>
      </Box>
    ),
    placement: "left",
  },
  {
    target: ".tour-calendario",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          ¡Tu Reserva en el Calendario!
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Aquí puedes ver tu reserva en el calendario. Haz clic en cualquier
          celda vacía para crear nuevas reservas, o en una existente para ver
          sus detalles.
        </Typography>
      </Box>
    ),
    placement: "bottom",
  },
];

// Mapeo de fases a pasos (DIALOG_TOUR no tiene pasos aquí)
const STEPS_BY_PHASE: Record<TourPhase, Step[]> = {
  IDLE: [],
  RESERVA_CLICK_BUTTON: STEPS_RESERVA_CLICK,
  DIALOG_TOUR: [], // El Dialog maneja su propio tour internamente
  RESERVA_CONTINUE: STEPS_RESERVA_CONTINUE,
  MIS_RESERVAS: STEPS_MIS_RESERVAS,
  CALENDARIO: STEPS_CALENDARIO,
  COMPLETED: [],
};

// ============================================
// CUSTOM TOOLTIP
// ============================================

const CustomTooltip: React.FC<TooltipRenderProps> = ({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  size,
  isLastStep,
}) => {
  const isFirstStep = index === 0;
  const hideFooter = (step as any).hideFooter === true;

  return (
    <Box
      {...tooltipProps}
      sx={{
        maxWidth: 380,
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        overflow: "hidden",
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
          Paso {index + 1} de {size}
        </Typography>
        <Button
          {...closeProps}
          size="small"
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
      <Box sx={{ p: 2 }}>{step.content}</Box>

      {/* Footer */}
      {!hideFooter && (
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
            {...backProps}
            variant="text"
            size="small"
            disabled={isFirstStep}
            sx={{
              textTransform: "none",
              color: isFirstStep ? "text.disabled" : "text.secondary",
            }}
          >
            Atrás
          </Button>
          <Button
            {...primaryProps}
            variant="contained"
            size="small"
            sx={{
              backgroundColor: "#004680",
              textTransform: "none",
              borderRadius: 1,
              "&:hover": { backgroundColor: "#005AA3" },
            }}
          >
            {isLastStep ? "Continuar" : "Siguiente"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

interface ReservasTourProps {
  children: ReactNode;
}

export const ReservasTour: React.FC<ReservasTourProps> = ({ children }) => {
  const {
    tourPhase,
    stepIndex,
    setStepIndex,
    nextPhase,
    stopTour,
    openDialogForTour,
  } = useTourContext();

  const [runTour, setRunTour] = useState(false);
  const currentSteps = STEPS_BY_PHASE[tourPhase] || [];

  // Controlar cuándo corre el tour
  useEffect(() => {
    // Solo correr Joyride si hay pasos para esta fase
    if (
      tourPhase !== "IDLE" &&
      tourPhase !== "COMPLETED" &&
      tourPhase !== "DIALOG_TOUR" && // El Dialog maneja su propio tour
      currentSteps.length > 0
    ) {
      const timer = setTimeout(() => setRunTour(true), 200);
      return () => clearTimeout(timer);
    } else {
      setRunTour(false);
    }
  }, [tourPhase, currentSteps.length]);

  // Handle tour callbacks
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action, type, index } = data;

      // Tour terminado
      if (status === STATUS.FINISHED) {
        setRunTour(false);
        nextPhase();
        return;
      }

      // Tour saltado o cerrado
      if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
        setRunTour(false);
        stopTour();
        return;
      }

      // Actualizar índice del paso
      if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
        setStepIndex(index + 1);
      }
      if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
        setStepIndex(index - 1);
      }
    },
    [nextPhase, stopTour, setStepIndex]
  );

  // Manejar click en el botón "Nueva reserva" durante el tour
  useEffect(() => {
    if (tourPhase === "RESERVA_CLICK_BUTTON" && runTour) {
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest(".tour-nueva-reserva")) {
          setRunTour(false);
          // Pequeño delay antes de abrir el dialog
          setTimeout(() => {
            openDialogForTour();
          }, 100);
        }
      };

      document.addEventListener("click", handleClick, true);
      return () => document.removeEventListener("click", handleClick, true);
    }
  }, [tourPhase, runTour, openDialogForTour]);

  return (
    <>
      {children}

      <Joyride
        run={runTour}
        steps={currentSteps}
        stepIndex={stepIndex}
        callback={handleJoyrideCallback}
        continuous
        showSkipButton
        showProgress
        disableOverlayClose
        disableScrolling={false}
        scrollToFirstStep
        spotlightClicks
        tooltipComponent={CustomTooltip}
        styles={{
          options: {
            zIndex: 10000,
            arrowColor: "#fff",
            overlayColor: "rgba(0, 0, 0, 0.5)",
          },
          spotlight: {
            borderRadius: 8,
            boxShadow: "0 0 0 3px #004680, 0 0 25px rgba(0, 70, 128, 0.4)",
          },
          buttonClose: { display: "none" },
          buttonBack: { display: "none" },
          buttonNext: { display: "none" },
          buttonSkip: { display: "none" },
        }}
        locale={{
          back: "Atrás",
          close: "Cerrar",
          last: "Continuar",
          next: "Siguiente",
          skip: "Salir del tour",
        }}
        floaterProps={{
          disableAnimation: true,
        }}
      />
    </>
  );
};

export default ReservasTour;