/**
 * StoreTrasladosTour.tsx
 * Tour guiado para usuarios con política store_transfers (vista de tienda).
 * Muestra cómo navegar y filtrar traslados en tránsito sin capacidad de aprobación.
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
// PASOS DEL TOUR (vista tienda)
// ============================================

const STORE_TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="store-header"]',
    content: (
      <Box>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Bienvenido a tu panel de <strong>Traslados en Tránsito</strong>.
          Aquí puedes ver todos los traslados que tu tienda ha{" "}
          <strong>enviado</strong> o que están <strong>por recibir</strong>.
        </Typography>
      </Box>
    ),
    title: "Panel de Traslados",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="store-filtro-tipo"]',
    content: (
      <Box>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Usa estos botones para cambiar la vista entre{" "}
          <strong>Todos</strong> los traslados,{" "}
          <strong>Enviados</strong> (que tu tienda despachó) o{" "}
          <strong>Por Recibir</strong> (que vienen hacia ti).
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Los contadores entre paréntesis te muestran cuántos hay en cada categoría.
        </Typography>
      </Box>
    ),
    title: "Filtrar por Estado",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="store-filtro-bodega"]',
    content: (
      <Box>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Filtra los traslados por <strong>bodega de origen o destino</strong>.
          Útil cuando quieres ver únicamente los traslados relacionados con
          una tienda específica.
        </Typography>
      </Box>
    ),
    title: "Filtrar por Bodega",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="store-filtro-fecha"]',
    content: (
      <Box>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Selecciona una <strong>fecha específica</strong> para ver solo
          los traslados de ese día. Haz clic en la <strong>X</strong> para
          limpiar el filtro y volver a ver todos.
        </Typography>
      </Box>
    ),
    title: "Filtrar por Fecha",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="store-filtro-nombre"]',
    content: (
      <Box>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Escribe el <strong>número de traslado</strong> para encontrarlo
          rápidamente. La búsqueda aplica al instante mientras escribes.
        </Typography>
      </Box>
    ),
    title: "Búsqueda Rápida",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="store-leyenda"]',
    content: (
      <Box>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Los traslados están marcados con colores:{" "}
          <strong style={{ color: "#2563EB" }}>Azul</strong> para los que
          tu tienda <strong>envió</strong>, y{" "}
          <strong style={{ color: "#F59E0B" }}>Amarillo</strong> para los
          que están <strong>por recibir</strong>.
        </Typography>
      </Box>
    ),
    title: "Leyenda de Colores",
    placement: "left",
    disableBeacon: true,
  },
  {
    target: '[data-tour="lista-traslados"]',
    content: (
      <Box>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Aquí aparecen todos tus traslados. Haz clic en cualquier tarjeta
          para ver el <strong>detalle completo</strong>: productos, cantidades,
          bodega de origen y destino.
        </Typography>
      </Box>
    ),
    title: "Lista de Traslados",
    placement: "top",
    disableBeacon: true,
  },
  {
    target: '[data-tour="store-btn-tutorial"]',
    content: (
      <Box>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Puedes <strong>repetir este tutorial</strong> en cualquier momento
          haciendo clic en este botón. ¡Ya estás listo para usar el módulo!
        </Typography>
      </Box>
    ),
    title: "Repetir Tutorial",
    placement: "bottom",
    disableBeacon: true,
  },
];

// ============================================
// TOOLTIP PERSONALIZADO (mismo estilo que TrasladosTour)
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

interface StoreTrasladosTourProps {
  children: ReactNode;
}

export const StoreTrasladosTour: React.FC<StoreTrasladosTourProps> = ({
  children,
}) => {
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

      if (status === STATUS.FINISHED) {
        setRunTour(false);
        completeTour();
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
    [completeTour, stopTour, setStepIndex],
  );

  return (
    <>
      {children}

      <Joyride
        run={runTour}
        steps={STORE_TOUR_STEPS}
        stepIndex={stepIndex}
        callback={handleJoyrideCallback}
        continuous
        showSkipButton
        showProgress
        disableOverlayClose
        disableScrolling={false}
        disableScrollParentFix
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

export default StoreTrasladosTour;
