/**
 * TrasladosTour.tsx
 * Componente principal del tour guiado para el módulo de traslados
 */
import React, { useCallback, useEffect, useState, ReactNode } from "react";
import Joyride, {
  CallBackProps,
  STATUS,
  Step,
  TooltipRenderProps,
  ACTIONS,
  EVENTS,
} from "react-joyride";
import { Box, Button, Typography, Paper, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import { useTrasladosTourContext } from "./TrasladosTourContext";

// ============================================
// PASOS DEL TOUR
// ============================================

const TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="contador-pendientes"]',
    content: (
      <Box>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Aquí puedes ver el <strong>total de traslados pendientes</strong> por aprobar 
          y cuántos tienes <strong>seleccionados</strong> actualmente.
        </Typography>
      </Box>
    ),
    title: "Contadores",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="filtro-bodega-destino"]',
    content: (
      <Box>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Filtra los traslados por <strong>bodega de destino</strong>. 
          Selecciona "Todas las bodegas" para ver todos los registros o elige una específica.
        </Typography>
      </Box>
    ),
    title: "Filtrar por Bodega",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="filtro-nombre"]',
    content: (
      <Box>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Busca traslados específicos ingresando el <strong>número de traslado</strong>. 
          La búsqueda filtra automáticamente mientras escribes.
        </Typography>
      </Box>
    ),
    title: "Búsqueda Rápida",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="seleccionar-todo"]',
    content: (
      <Box>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Usa esta opción para <strong>seleccionar todos</strong> los traslados visibles de una vez. 
          ¡Te ahorrará tiempo al aprobar múltiples registros!
        </Typography>
      </Box>
    ),
    title: "Selección Masiva",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="lista-traslados"]',
    content: (
      <Box>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Aquí aparecen todos los traslados pendientes. <strong>Haz clic en cualquier tarjeta</strong> para 
          seleccionarla o deseleccionarla individualmente.
        </Typography>
      </Box>
    ),
    title: "Lista de Traslados",
    placement: "top",
    disableBeacon: true,
  },
  {
    target: '[data-tour="btn-tutorial"]',
    content: (
      <Box>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Puedes <strong>volver a ver este tutorial</strong> en cualquier momento 
          haciendo clic en este botón.
        </Typography>
      </Box>
    ),
    title: "Repetir Tutorial",
    placement: "left",
    disableBeacon: true,
  },
  {
    target: '[data-tour="aprobar"]',
    content: (
      <Box>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Cuando tengas traslados seleccionados, haz clic aquí para <strong>aprobarlos</strong>. 
          Se te pedirá tu <strong>contraseña de Ultra</strong> para confirmar.
        </Typography>
      </Box>
    ),
    title: "¡Aprobar Traslados!",
    placement: "left",
    disableBeacon: true,
  },
];

// ============================================
// TOOLTIP PERSONALIZADO
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
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isFirstStep = index === 0;

  return (
    <Paper
      {...tooltipProps}
      elevation={8}
      sx={{
        maxWidth: 360,
        borderRadius: 3,
        bgcolor: isDark ? "background.paper" : "#ffffff",
        border: "2px solid",
        borderColor: "primary.main",
        boxShadow: `0 8px 32px ${theme.palette.primary.main}40`,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          px: 2.5,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ fontSize: { xs: "0.95rem", sm: "1.05rem" } }}
        >
          {step.title}
        </Typography>
        <Button
          {...closeProps}
          sx={{
            minWidth: "auto",
            p: 0.5,
            color: "inherit",
            "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
          }}
        >
          <CloseIcon fontSize="small" />
        </Button>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2.5 }}>
        {step.content}

        {/* Footer con navegación */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 2,
            pt: 2,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            {!isFirstStep && (
              <Button
                {...backProps}
                variant="outlined"
                size="small"
                startIcon={<KeyboardArrowLeftIcon />}
                sx={{
                  borderColor: "primary.main",
                  color: "primary.main",
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "primary.dark",
                    bgcolor: "primary.light",
                    color: "primary.contrastText",
                  },
                }}
              >
                Atrás
              </Button>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {/* Indicador de progreso */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mr: 1, fontWeight: 500 }}
            >
              {index + 1} de {size}
            </Typography>

            <Button
              {...primaryProps}
              variant="contained"
              size="small"
              endIcon={!isLastStep && <KeyboardArrowRightIcon />}
              sx={{
                bgcolor: "primary.main",
                fontWeight: 600,
                borderRadius: 2,
                px: 2.5,
                textTransform: "none",
                "&:hover": {
                  bgcolor: "primary.dark",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s",
              }}
            >
              {isLastStep ? "¡Entendido!" : "Siguiente"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

interface TrasladosTourProps {
  children: ReactNode;
}

export const TrasladosTour: React.FC<TrasladosTourProps> = ({ children }) => {
  const theme = useTheme();
  const {
    tourPhase,
    stepIndex,
    setStepIndex,
    completeTour,
    stopTour,
    isFullTourRunning,
  } = useTrasladosTourContext();

  const [runTour, setRunTour] = useState(false);

  // Controlar cuándo corre el tour
  useEffect(() => {
    if (isFullTourRunning && tourPhase !== "COMPLETED") {
      // Pequeño delay para asegurar que el DOM esté listo
      const timer = setTimeout(() => setRunTour(true), 300);
      return () => clearTimeout(timer);
    } else {
      setRunTour(false);
    }
  }, [isFullTourRunning, tourPhase]);

  // Handle tour callbacks
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action, type, index } = data;

      // Tour terminado
      if (status === STATUS.FINISHED) {
        setRunTour(false);
        completeTour();
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
    [completeTour, stopTour, setStepIndex]
  );

  return (
    <>
      {children}

      <Joyride
        run={runTour}
        steps={TOUR_STEPS}
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
            primaryColor: theme.palette.primary.main,
            zIndex: 10000,
            arrowColor: "#fff",
            overlayColor: "rgba(0, 0, 0, 0.5)",
          },
          spotlight: {
            borderRadius: 8,
            boxShadow: `0 0 0 3px ${theme.palette.primary.main}, 0 0 25px ${theme.palette.primary.main}40`,
          },
          buttonClose: { display: "none" },
          buttonBack: { display: "none" },
          buttonNext: { display: "none" },
          buttonSkip: { display: "none" },
        }}
        locale={{
          back: "Atrás",
          close: "Cerrar",
          last: "¡Entendido!",
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

export default TrasladosTour;