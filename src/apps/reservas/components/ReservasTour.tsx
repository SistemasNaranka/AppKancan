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

import { useTourContext, TabReservas } from "./TourContext";

// Tour steps for "Reserva" tab
const RESERVA_TAB_STEPS: Step[] = [
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
    target: ".tour-estado-salas",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Estado de Salas
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Aquí puedes ver el estado actual de cada sala. Cada tarjeta muestra:
          <br />• Nombre de la sala
          <br />• Estado actual (disponible, ocupada, próxima reunión)
          <br />• Información de la próxima reunión programada
        </Typography>
      </Box>
    ),
    placement: "right",
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
          Esta sección muestra las próximas reuniones programadas en ambas salas.
          Puedes ver detalles como: fecha, hora, sala y nombre del responsable.
        </Typography>
      </Box>
    ),
    placement: "top",
    disableBeacon: true,
  },
];

// Tour steps for "mis reservas" tab
const MIS_RESERVAS_TAB_STEPS: Step[] = [
  {
    target: ".tour-tabla-reservas",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Tabla de Reservas
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Aquí puedes ver todas tus reservas organizadas en tarjetas. Cada tarjeta muestra:
          <br />• Fecha y hora de la reserva
          <br />• Sala asignada
          <br />• Estado de la reserva (vigente, en curso, finalizada, cancelada)
          <br />• Notas u observaciones
          <br />• Acciones disponibles (editar, cancelar)
        </Typography>
      </Box>
    ),
    placement: "top",
    disableBeacon: true,
  },
  {
    target: ".tour-mis-reservas-tabs",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Filtros de Reservas
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Usa estas pestañas para filtrar tus reservas por estado:
          <br />• Vigentes: Reservas próximas y actuales
          <br />• Finalizadas: Reservas completadas
          <br />• Canceladas: Reservas canceladas
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
];

// Tour steps for "calendario" tab (existing steps)
const CALENDARIO_TAB_STEPS: Step[] = [
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
          Usa las flechas para moverte entre semanas/meses o haz clic en "Hoy/Esta semana"
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
      target: ".tour-fines-semana",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Mostrar y ocultar fines de semana
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Activa o desactiva esta opción para ocultar o mostrar los sábados y domingos en el calendario.
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
];

// Function to get steps based on active tab
export const getTourSteps = (activeTab: TabReservas): Step[] => {
  switch (activeTab) {
    case "Reserva":
      return RESERVA_TAB_STEPS;
    case "mis":
      return MIS_RESERVAS_TAB_STEPS;
    case "calendario":
      return CALENDARIO_TAB_STEPS;
    default:
      return RESERVA_TAB_STEPS;
  }
};

// Function to get localStorage key for a specific tab
const getTourCompletedKey = (tab: TabReservas): string => {
  return `reservas-tour-${tab}-completed`;
};

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
  activeTab: TabReservas;
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
export const ReservasTour: React.FC<ReservasTourProps> = ({ children, activeTab }) => {
  const { requestedTourTab, clearRequestedTour } = useTourContext();
  const [runTour, setRunTour] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(true); // Default to true to prevent flash
  const [showNotification, setShowNotification] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabReservas>(activeTab);

  // Get the steps for the current active tab
  const tourSteps = getTourSteps(currentTab);

  // Handle requested tour from context
  useEffect(() => {
    if (requestedTourTab && requestedTourTab === currentTab) {
      // Switch to the requested tab if different
      if (activeTab !== requestedTourTab) {
        setCurrentTab(requestedTourTab);
      }
      // Start the tour
      setRunTour(true);
      setShowNotification(false);
      // Clear the request
      clearRequestedTour();
    }
  }, [requestedTourTab, currentTab, activeTab, clearRequestedTour]);

  // Check if tour has been completed for the current tab
  useEffect(() => {
    // Forzar que siempre muestre el tour para pruebas
    // localStorage.removeItem(getTourCompletedKey(currentTab));
    
    if (isLocalStorageAvailable()) {
      const completed = localStorage.getItem(getTourCompletedKey(currentTab)) === "true";
      setTourCompleted(completed);
      
      if (!completed && !requestedTourTab) {
        const timer = setTimeout(() => setShowNotification(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentTab, requestedTourTab]);

  // Update current tab when prop changes
  useEffect(() => {
    if (activeTab !== currentTab) {
      setCurrentTab(activeTab);
      // Reset tour state when tab changes
      setRunTour(false);
      setShowNotification(false);
    }
  }, [activeTab, currentTab]);

  // Handle tour callbacks
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, action } = data;

    // Mark tour as completed when finished or skipped
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      if (isLocalStorageAvailable()) {
        localStorage.setItem(getTourCompletedKey(currentTab), "true");
      }
      setTourCompleted(true);
      setRunTour(false);
      setShowNotification(false);
    }

    // Handle close button
    if (action === "close") {
      setRunTour(false);
    }
  }, [currentTab]);

  // Start tour
  const startTour = () => {
    setShowNotification(false);
    setRunTour(true);
  };

  // Reset and start tour for current tab
  const resetTour = () => {
    if (isLocalStorageAvailable()) {
      localStorage.removeItem(getTourCompletedKey(currentTab));
    }
    setTourCompleted(false);
    setShowNotification(false);
    setRunTour(true);
  };

  // Skip tour
  const skipTour = () => {
    if (isLocalStorageAvailable()) {
      localStorage.setItem(getTourCompletedKey(currentTab), "true");
    }
    setTourCompleted(true);
    setShowNotification(false);
  };

  // Get tab-specific notification title
  const getNotificationTitle = (): string => {
    switch (currentTab) {
      case "Reserva":
        return "¡Bienvenido a Reservar Sala!";
      case "mis":
        return "¡Bienvenido a Mis Reservas!";
      case "calendario":
        return "¡Bienvenido al Calendario!";
      default:
        return "¡Bienvenido a Reservas!";
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "visible",
        height: "auto",
      }}
    >
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
        steps={tourSteps}
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
                {getNotificationTitle()}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                ¿Deseas ver un tour guiado de esta sección?
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
export const useReservasTour = (activeTab: TabReservas) => {
  const [isRunning, setIsRunning] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(true);

  const getCompletedKey = (): string => {
    return getTourCompletedKey(activeTab);
  };

  useEffect(() => {
    if (isLocalStorageAvailable()) {
      const completed = localStorage.getItem(getCompletedKey()) === "true";
      setTourCompleted(completed);
    }
  }, [activeTab]);

  const startTour = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stopTour = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resetTour = useCallback(() => {
    if (isLocalStorageAvailable()) {
      localStorage.removeItem(getCompletedKey());
    }
    setTourCompleted(false);
    setIsRunning(true);
  }, [activeTab]);

  return {
    isRunning,
    tourCompleted,
    startTour,
    stopTour,
    resetTour,
  };
};

export default ReservasTour;
