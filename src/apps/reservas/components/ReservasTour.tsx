/**
 * Reservas Tour Component
 * Interactive guided tour using React Joyride for the Reservas application
 * 
 * Installation: npm install react-joyride @types/react-joyride
 */
import React, { useState, useCallback, useEffect, ReactNode } from "react";
import Joyride, { CallBackProps, STATUS, Step, TooltipRenderProps, EVENTS } from "react-joyride";
import { Box, Button, Typography, Fade } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CloseIcon from "@mui/icons-material/Close";

// Tour steps configuration
export const TOUR_STEPS: Step[] = [
  {
    target: ".tour-nueva-reserva",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Nueva Reserva
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Haz clic aquí para crear una nueva reserva. Se abrirá un formulario donde
          podrás seleccionar la fecha, hora, sala y detalles de tu reunión.
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".tour-sala-selector",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Selección de Sala
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Elige entre "Sala principal" o "Sala secundaria" para filtrar las
          reservas según la sala que necesites.
        </Typography>
      </Box>
    ),
    placement: "bottom",
  },
  {
    target: ".tour-vista-selector",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Cambio de Vista
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Alterna entre vista "Semanal" y "Mensual" para ver las reservas en
          diferentes formatos de calendario.
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
          Navegación de Calendario
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Usa las flechas para moverte entre semanas/meses o haz clic en "Hoy"
          para volver a la fecha actual.
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
          Selector de Fecha
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Selecciona directamente el día, mes y año que deseas visualizar.
          Los cambios se aplicarán inmediatamente al calendario.
        </Typography>
      </Box>
    ),
    placement: "bottom",
  },
  {
    target: ".tour-calendario",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Calendario de Reservas
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Aquí puedes ver todas las reservas existentes. Haz clic en cualquier
          celda vacía para crear una nueva reserva, o en una reserva existente
          para ver sus detalles.
        </Typography>
      </Box>
    ),
    placement: "top",
  },
  {
    target: ".tour-periodo",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Período Actual
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Este bloque muestra el período actualmente visible en el calendario.
          Se actualiza automáticamente al navegar.
        </Typography>
      </Box>
    ),
    placement: "left",
  },
];

// Custom tooltip component
const CustomTooltip: React.FC<TooltipRenderProps> = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  size,
}) => {
  const isLastStep = index === size - 1;
  const isFirstStep = index === 0;

  return (
    <Box
      {...tooltipProps}
      sx={{
        maxWidth: 400,
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
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
          size="small"
          sx={{
            minWidth: "auto",
            p: 0.5,
            color: "text.secondary",
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
          variant="text"
          size="small"
          disabled={isFirstStep}
          sx={{
            textTransform: "none",
            color: isFirstStep ? "text.disabled" : "text.secondary",
            "&:hover": { backgroundColor: "transparent", color: "text.primary" },
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
          {isLastStep ? "Finalizar" : "Siguiente"}
        </Button>
      </Box>
    </Box>
  );
};

interface ReservasTourProps {
  children: ReactNode;
}

// Helper to check if localStorage is available
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = "__storage_test__";
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

// Main tour component
export const ReservasTour: React.FC<ReservasTourProps> = ({ children }) => {
  const [runTour, setRunTour] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(true); // Default to true to prevent flash
  const [showNotification, setShowNotification] = useState(false);

  // Check if tour has been completed before (only on client side)
useEffect(() => {
  // Forzar que siempre muestre el tour para pruebas
  localStorage.removeItem("reservas-tour-completed"); // <-- Agregar esta línea
  
  if (isLocalStorageAvailable()) {
    const completed = localStorage.getItem("reservas-tour-completed") === "true";
    setTourCompleted(completed);
    
    if (!completed) {
      const timer = setTimeout(() => setShowNotification(true), 1500);
      return () => clearTimeout(timer);
    }
  }
}, []);

  // Handle tour callbacks
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, action } = data;

    // Mark tour as completed when finished or skipped
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      if (isLocalStorageAvailable()) {
        localStorage.setItem("reservas-tour-completed", "true");
      }
      setTourCompleted(true);
      setRunTour(false);
      setShowNotification(false);
    }

    // Handle close button
    if (action === "close") {
      setRunTour(false);
    }
  }, []);

  // Start tour
  const startTour = () => {
    setShowNotification(false);
    setRunTour(true);
  };

  // Reset and start tour
  const resetTour = () => {
    if (isLocalStorageAvailable()) {
      localStorage.removeItem("reservas-tour-completed");
    }
    setTourCompleted(false);
    setShowNotification(false);
    setRunTour(true);
  };

  // Skip tour
  const skipTour = () => {
    if (isLocalStorageAvailable()) {
      localStorage.setItem("reservas-tour-completed", "true");
    }
    setTourCompleted(true);
    setShowNotification(false);
  };

  return (
    <Box sx={{ position: "relative" }}>
      {/* Tour trigger button - always visible */}
      <Button
        onClick={resetTour}
        sx={{
          position: "absolute",
          top: -50,
          right: 0,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          color: "text.secondary",
          fontSize: "0.75rem",
          textTransform: "none",
          "&:hover": {
            backgroundColor: "transparent",
            color: "primary.main",
          },
        }}
      >
        <HelpOutlineIcon fontSize="small" />
        Reiniciar tour
      </Button>

      {/* Main content */}
      {children}

      {/* Joyride Tour */}
      <Joyride
        run={runTour}
        steps={TOUR_STEPS}
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
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
          spotlight: {
            borderRadius: 8,
            boxShadow: "0 0 0 2px #004680, 0 0 20px rgba(0, 70, 128, 0.3)",
          },
        }}
        locale={{
          back: "Atrás",
          close: "Cerrar",
          last: "Finalizar",
          next: "Siguiente",
          skip: "Omitir tour",
        }}
        floaterProps={{
          disableAnimation: true,
        }}
      />

      {/* Tour notification for first-time visitors */}
      {showNotification && !tourCompleted && !runTour && (
        <Fade in>
          <Box
            sx={{
              position: "fixed",
              bottom: 24,
              right: 24,
              zIndex: 9999,
              backgroundColor: "#fff",
              borderRadius: 2,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              maxWidth: 400,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                ¡Bienvenido a Reservas!
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                ¿Deseas ver un tour guiado de la aplicación?
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                onClick={startTour}
                sx={{
                  backgroundColor: "#004680",
                  textTransform: "none",
                  whiteSpace: "nowrap",
                  "&:hover": { backgroundColor: "#005AA3" },
                }}
              >
                Iniciar tour
              </Button>
              <Button
                size="small"
                onClick={skipTour}
                sx={{
                  textTransform: "none",
                  color: "text.secondary",
                }}
              >
                No gracias
              </Button>
            </Box>
          </Box>
        </Fade>
      )}
    </Box>
  );
};

// Hook for managing tour state externally
export const useReservasTour = () => {
  const [isRunning, setIsRunning] = useState(false);

  const startTour = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stopTour = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resetTour = useCallback(() => {
    if (isLocalStorageAvailable()) {
      localStorage.removeItem("reservas-tour-completed");
    }
    setIsRunning(true);
  }, []);

  return {
    isRunning,
    startTour,
    stopTour,
    resetTour,
  };
};

export default ReservasTour;