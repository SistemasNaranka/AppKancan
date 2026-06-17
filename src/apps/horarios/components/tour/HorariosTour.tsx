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
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AssignmentIcon from "@mui/icons-material/Assignment";
import WarningIcon from "@mui/icons-material/Warning";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useHorariosTour, TourPhase } from "./HorariosTourContext";

const inlineIcon = { fontSize: 16, verticalAlign: "middle", color: "#004680", mx: 0.25 } as const;

const STEPS_REGISTROS: Step[] = [
  {
    target: ".tour-tabs",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          ¡Bienvenido al panel de asistencia!
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Desde estas pestañas puedes moverte entre{" "}
          <strong>Registros</strong>, <strong>Novedades</strong> e{" "}
          <strong>Historial</strong>. Te guiaremos por cada una.
        </Typography>
        <Chip
          label="Pestañas del módulo"
          size="small"
          sx={{ backgroundColor: "#E6F4FF", color: "#004680", fontWeight: 600 }}
        />
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".tour-employee-card",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Tarjeta del Empleado
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Cada empleado tiene su propia tarjeta donde se registran las
          marcaciones del día. El <strong>estado</strong> superior indica en qué
          punto de la jornada se encuentra.
        </Typography>
      </Box>
    ),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: ".tour-marcacion",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Marcaciones de Jornada
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Registra de forma secuencial: <strong>Comenzar Jornada</strong>,{" "}
          <strong>Iniciar</strong> y <strong>Finalizar Almuerzo</strong>, y{" "}
          <strong>Terminar Jornada</strong>. El botón
          <AccessTimeIcon sx={inlineIcon} /> (izquierda) permite corregir la
          hora y el botón <AssignmentIcon sx={inlineIcon} /> (derecha) agregar
          una observación.
        </Typography>
      </Box>
    ),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: ".tour-novedad-btn",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Registrar una Novedad
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Si el empleado no marcará asistencia (permiso, incapacidad,
          vacaciones, etc.), usa el botón
          <WarningIcon sx={{ ...inlineIcon, color: "#f59e0b" }} /> para registrar
          la novedad en un rango de fechas.
        </Typography>
      </Box>
    ),
    placement: "left",
  },
  {
    target: ".tour-refresh",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Refrescar Datos
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Con el botón <RefreshIcon sx={inlineIcon} /> vuelves a sincronizar la
          información con el servidor para ver los últimos registros.
        </Typography>
      </Box>
    ),
    placement: "left",
  },
];

const STEPS_NOVEDADES: Step[] = [
  {
    target: ".tour-nov-search",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Buscar Novedades
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Filtra las novedades registradas escribiendo el{" "}
          <strong>nombre del empleado</strong>.
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".tour-nov-fecha",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Filtrar por Fecha
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Selecciona una fecha específica para ver solo las novedades de ese
          día.
        </Typography>
      </Box>
    ),
    placement: "bottom",
  },
  {
    target: ".tour-nov-tabla",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Listado de Novedades
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Aquí se muestran todas las novedades con su fecha, empleado, tipo y
          observaciones. Usa el paginador inferior para navegar entre páginas.
        </Typography>
      </Box>
    ),
    placement: "bottom",
  },
];

const STEPS_HISTORIAL: Step[] = [
  {
    target: ".tour-hist-fechas",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Rango de Fechas
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Define un rango <strong>Desde</strong> – <strong>Hasta</strong> para
          consultar las jornadas registradas en ese período.
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".tour-hist-nombre",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Buscar por Empleado
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Filtra el historial por nombre. La búsqueda ignora mayúsculas y
          acentos.
        </Typography>
      </Box>
    ),
    placement: "bottom",
  },
  {
    target: ".tour-hist-tabla",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Historial de Jornadas
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Cada fila muestra las marcaciones de una jornada y el{" "}
          <strong>total de horas</strong> trabajadas (descontando el almuerzo).
          Los puntos azules indican observaciones: haz clic para verlas.
        </Typography>
      </Box>
    ),
    placement: "bottom",
  },
];

const STEPS_BY_PHASE: Record<TourPhase, Step[]> = {
  IDLE: [],
  REGISTROS: STEPS_REGISTROS,
  NOVEDADES: STEPS_NOVEDADES,
  HISTORIAL: STEPS_HISTORIAL,
  COMPLETED: [],
};

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
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#004680" }}>
          Paso {index + 1} de {size}
        </Typography>
        <Button
          {...closeProps}
          title=""
          size="small"
          disableElevation
          sx={{
            minWidth: "auto",
            p: 0.5,
            color: "text.secondary",
            boxShadow: "none",
            "&:hover": { backgroundColor: "transparent", color: "text.primary" },
          }}
        >
          <CloseIcon fontSize="small" />
        </Button>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2 }}>{step.content}</Box>

      {/* Footer */}
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
          title=""
          variant="text"
          size="small"
          disableElevation
          disabled={isFirstStep}
          sx={{
            textTransform: "none",
            boxShadow: "none",
            color: isFirstStep ? "text.disabled" : "text.secondary",
          }}
        >
          Atrás
        </Button>
        <Button
          {...primaryProps}
          title=""
          variant="contained"
          size="small"
          disableElevation
          sx={{
            backgroundColor: "#004680",
            textTransform: "none",
            borderRadius: 1,
            boxShadow: "none",
            "&:hover": { backgroundColor: "#003366", boxShadow: "none" },
          }}
        >
          {isLastStep ? "Continuar" : "Siguiente"}
        </Button>
      </Box>
    </Box>
  );
};

interface HorariosTourProps {
  children: ReactNode;
}

export const HorariosTour: React.FC<HorariosTourProps> = ({ children }) => {
  const { tourPhase, stepIndex, setStepIndex, nextPhase, stopTour } =
    useHorariosTour();

  const [runTour, setRunTour] = useState(false);
  const currentSteps = STEPS_BY_PHASE[tourPhase] || [];

  useEffect(() => {
    if (tourPhase !== "IDLE" && tourPhase !== "COMPLETED" && currentSteps.length > 0) {
      const timer = setTimeout(() => setRunTour(true), 250);
      return () => clearTimeout(timer);
    }
    setRunTour(false);
  }, [tourPhase, currentSteps.length]);

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action, type, index } = data;

      if (status === STATUS.FINISHED) {
        setRunTour(false);
        nextPhase();
        return;
      }

      if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
        setRunTour(false);
        stopTour();
        return;
      }

      if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
        setStepIndex(index + 1);
      }
      if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
        setStepIndex(index - 1);
      }
    },
    [nextPhase, stopTour, setStepIndex]
  );

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
        disableScrollParentFix
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
            boxShadow: "0 0 0 3px #004680, 0 0 25px rgba(0, 74, 153, 0.4)",
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
        floaterProps={{ disableAnimation: true }}
      />
    </>
  );
};

export default HorariosTour;
