import React, { useEffect, useState, useCallback } from "react";
import Joyride, { CallBackProps, STATUS, Step, TooltipRenderProps } from "react-joyride";
import { Box, Button, Typography, Paper, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";

// ============================================================================
// CONSTANTES Y UTILIDADES
// ============================================================================

const TOUR_LOCALSTORAGE_KEY = "traslados-tour-completed";
const TOURanalytics_LOCALSTORAGE_KEY = "traslados-tour-analytics";

interface TourAnalytics {
  startedAt: string;
  completedAt?: string;
  stepsCompleted: number;
  totalSteps: number;
  abandoned: boolean;
  completed: boolean;
}

/**
 * Registra eventos de analytics del tour en localStorage
 */
const logTourAnalytics = (event: TourAnalytics): void => {
  try {
    const existingAnalytics = localStorage.getItem(TOURanalytics_LOCALSTORAGE_KEY);
    const analytics: TourAnalytics[] = existingAnalytics
      ? JSON.parse(existingAnalytics)
      : [];
    
    analytics.push(event);
    localStorage.setItem(TOURanalytics_LOCALSTORAGE_KEY, JSON.stringify(analytics));
    
    // Log para desarrollo
    if (import.meta.env.DEV) {
      console.log("[Tour Analytics]", event);
    }
  } catch (error) {
    console.error("[Tour Analytics Error]", error);
  }
};

/**
 * Verifica si el tour ya fue completado
 */
export const isTourCompleted = (): boolean => {
  try {
    return localStorage.getItem(TOUR_LOCALSTORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

/**
 * Marca el tour como completado
 */
export const markTourCompleted = (): void => {
  try {
    localStorage.setItem(TOUR_LOCALSTORAGE_KEY, "true");
  } catch (error) {
    console.error("[Tour] Error marking completed:", error);
  }
};

/**
 * Reinicia el estado del tour (para重新开始)
 */
export const resetTourState = (): void => {
  try {
    localStorage.removeItem(TOUR_LOCALSTORAGE_KEY);
  } catch (error) {
    console.error("[Tour] Error resetting state:", error);
  }
};

// ============================================================================
// COMPONENTES DE UI PERSONALIZADOS
// ============================================================================

/**
 * Componente tooltip personalizado para el tour
 * Usa estilos del módulo traslados (tonos cyan/teal)
 */
const TourTooltip = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
}: TooltipRenderProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Paper
      {...tooltipProps}
      elevation={8}
      sx={{
        maxWidth: 380,
        borderRadius: 3,
        bgcolor: isDark ? "background.paper" : "#ffffff",
        border: "2px solid",
        borderColor: "primary.main",
        boxShadow: `0 8px 32px ${theme.palette.primary.main}40`,
        overflow: "hidden",
      }}
    >
      {/* Header del tooltip */}
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
          sx={{ fontSize: { xs: "1rem", sm: "1.1rem" } }}
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

      {/* Contenido del tooltip */}
      <Box sx={{ p: 2.5 }}>
        <Typography
          variant="body1"
          color="text.primary"
          sx={{
            mb: 2.5,
            lineHeight: 1.6,
            fontSize: { xs: "0.9rem", sm: "0.95rem" },
          }}
        >
          {step.content}
        </Typography>

        {/* Footer con botones de navegación */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            {index > 0 && (
              <Button
                {...backProps}
                variant="outlined"
                size="small"
                sx={{
                  borderColor: "primary.main",
                  color: "primary.main",
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
              sx={{ mr: 1 }}
            >
              {index + 1} de 5
            </Typography>

            {continuous && (
              <Button
                {...primaryProps}
                variant="contained"
                size="small"
                endIcon={<KeyboardArrowRightIcon />}
                sx={{
                  bgcolor: "primary.main",
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 2.5,
                  "&:hover": {
                    bgcolor: "primary.dark",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s",
                }}
              >
                {index === 4 ? "Finalizar" : "Siguiente"}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

// ============================================================================
// PASOS DEL TOUR
// ============================================================================

const createTourSteps = (): Step[] => [
  {
    target: '[data-tour="filtro-bodega-destino"]',
    content:
      "Este selector te permite filtrar los traslados por bodega de destino. Selecciona 'Todas las bodegas' para ver todos los registros o elige una específica para reducir la lista.",
    title: "Filtrar por Bodega Destino",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="filtro-nombre"]',
    content:
      "Busca traslados específicos ingresando el número de traslado o nombres de origen/destino. La búsqueda es en tiempo real y filtra automáticamente.",
    title: "Búsqueda de Traslados",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="seleccionar-todo"]',
    content:
      "Marca esta opción para seleccionar todos los traslados que coincidan con los filtros actuales. Esto te ahorrará tiempo al aprobar múltiples registros.",
    title: "Selección Masiva",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="ayuda"]',
    content:
      "Aquí encontrarás información adicional sobre el proceso de aprobación. Haz clic aquí siempre que necesites un recordatorio rápido de cómo usar el sistema.",
    title: "Ayuda y Guía",
    placement: "left",
    disableBeacon: true,
  },
  {
    target: '[data-tour="aprobar"]',
    content:
      "Este botón aprueba los traslados seleccionados. Se activará solo cuando hayas seleccionado al menos un traslado. Al hacer clic, necesitarás confirmar con tu contraseña de Ultra.",
    title: "Aprobar Traslados",
    placement: "left",
    disableBeacon: true,
  },
];

// ============================================================================
// COMPONENTE PRINCIPAL DEL TOUR
// ============================================================================

interface ControlesTourProps {
  onTourComplete?: () => void;
}

export const ControlesTour: React.FC<ControlesTourProps> = ({ onTourComplete }) => {
  const theme = useTheme();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Verificar si el tour debe ejecutarse automáticamente
  useEffect(() => {
    const hasCompletedTour = isTourCompleted();
    if (!hasCompletedTour) {
      // Pequeño delay para asegurar que el DOM esté listo
      const timer = setTimeout(() => {
        setRun(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Manejar callbacks del tour
  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type, index, step } = data;

      // Registrar inicio del tour
      if (type === "tour:start" && status === "running") {
        logTourAnalytics({
          startedAt: new Date().toISOString(),
          stepsCompleted: 0,
          totalSteps: 5,
          abandoned: false,
          completed: false,
        });
      }

      // Registrar abandono o completación
      if (STATUS.FINISHED === status || STATUS.SKIPPED === status) {
        const completed = status === STATUS.FINISHED;
        const stepsCompleted = completed ? 5 : index;

        logTourAnalytics({
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          stepsCompleted,
          totalSteps: 5,
          abandoned: !completed,
          completed,
        });

        if (completed) {
          markTourCompleted();
          onTourComplete?.();
        }
        setRun(false);
      }

      // Actualizar índice de paso para analytics
      if (type === "step:after") {
        logTourAnalytics({
          startedAt: new Date().toISOString(),
          stepsCompleted: index + 1,
          totalSteps: 5,
          abandoned: false,
          completed: false,
        });
      }
    },
    [onTourComplete],
  );

  const steps = createTourSteps();

  return (
    <Joyride
      run={run}
      steps={steps}
      stepIndex={stepIndex}
      setStepIndex={setStepIndex}
      onCallback={handleCallback}
      continuous
      showSkipButton
      showProgress
      callback={(data) => handleCallback(data as CallBackProps)}
      tooltipComponent={TourTooltip}
      styles={{
        options: {
          primaryColor: theme.palette.primary.main,
          secondaryColor: theme.palette.secondary.main,
          zIndex: 9999,
          arrowColor: "#ffffff",
          backgroundColor: "#ffffff",
          textColor: theme.palette.text.primary,
          overlayColor: "rgba(0, 0, 0, 0.6)",
          beaconSize: 36,
          beaconInner: 12,
          marginTop: 8,
          padding: 16,
          borderRadius: 12,
        },
      }}
      locale={{
        last: "Finalizar",
        next: "Siguiente",
        skip: "Omitir",
        back: "Atrás",
        close: "Cerrar",
      }}
    />
  );
};

export default ControlesTour;
