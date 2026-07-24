import React, { useState, useCallback, createContext, useContext } from "react";
import Joyride, { CallBackProps, STATUS, ACTIONS, EVENTS } from "react-joyride";
import { Button } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { CustomTooltip } from "./TourTooltip";
import { STEPS_CONTROL_HORAS } from "./monitoreoTourSteps";
import { FakeHistorialModal } from "./FakeHistorialModal";

const AZUL = "#004680";

// ============================================================
// CONTEXT
// ============================================================
interface MonitoreoTourContextType {
  run: boolean;
  stepIndex: number;
  startTour: () => void;
  stopTour: () => void;
  setStepIndex: (index: number) => void;
}

const MonitoreoTourContext = createContext<MonitoreoTourContextType | undefined>(undefined);

export const useMonitoreoTour = () => {
  const context = useContext(MonitoreoTourContext);
  if (!context) {
    throw new Error("useMonitoreoTour must be used within MonitoreoTourProvider");
  }
  return context;
};

// ============================================================
// PROVIDER (monta Joyride siempre, controlado por run)
// ============================================================
export const MonitoreoTourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const startTour = useCallback(() => {
    window.scrollTo(0, 0);
    setStepIndex(0);
    setRun(true);
  }, []);

  const stopTour = useCallback(() => {
    setRun(false);
    setStepIndex(0);
  }, []);

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action, type, index } = data;

      if (status === STATUS.FINISHED || status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
        stopTour();
        return;
      }

      if (type === EVENTS.STEP_AFTER && (action === ACTIONS.NEXT || action === ACTIONS.PREV)) {
        setStepIndex(action === ACTIONS.NEXT ? index + 1 : index - 1);
      }
    },
    [stopTour]
  );

  return (
    <MonitoreoTourContext.Provider value={{ run, stepIndex, startTour, stopTour, setStepIndex }}>
      {children}
      <FakeHistorialModal open={run && stepIndex >= 7} />
      <Joyride
        run={run}
        steps={STEPS_CONTROL_HORAS}
        stepIndex={stepIndex}
        callback={handleCallback}
        continuous
        showSkipButton
        showProgress
        disableOverlayClose
        disableScrolling
        disableScrollParentFix
        spotlightClicks={false}
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
        }}
        locale={{
          back: "Atras",
          close: "Cerrar",
          last: "Continuar",
          next: "Siguiente",
          skip: "Salir del tour",
        }}
        floaterProps={{ disableAnimation: true }}
      />
    </MonitoreoTourContext.Provider>
  );
};

// ============================================================
// BOTÓN para iniciar el tour (usa el contexto)
// ============================================================
export const TutorialMonitoreoButton: React.FC = () => {
  const { startTour } = useMonitoreoTour();

  return (
    <Button
      variant="contained"
      disableElevation
      startIcon={<HelpOutlineIcon sx={{ fontSize: 18 }} />}
      onClick={startTour}
      sx={{
        bgcolor: AZUL,
        color: "#fff",
        textTransform: "none",
        fontWeight: 700,
        borderRadius: 1.5,
        px: 2,
        py: 0.75,
        boxShadow: "none",
        "&:hover": { bgcolor: "#003366", boxShadow: "none" },
      }}
    >
      Tutorial
    </Button>
  );
};

// ============================================================
// COMPONENTE WRAPPER (para usar como <MonitoreoTour>)
// ============================================================
export const MonitoreoTour: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <MonitoreoTourProvider>{children}</MonitoreoTourProvider>;
};

export default MonitoreoTour;