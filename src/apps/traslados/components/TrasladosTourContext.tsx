import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type TourPhase =
  | "IDLE"
  | "FILTROS"
  | "SELECCION"
  | "LISTA"
  | "APROBACION"
  | "COMPLETED";

interface TrasladosTourContextType {
  tourPhase: TourPhase;
  isFullTourRunning: boolean;
  stepIndex: number;
  startFullTour: () => void;
  nextPhase: () => void;
  setStepIndex: (index: number) => void;
  stopTour: () => void;
  completeTour: () => void;
  isTourCompleted: () => boolean;
  markTourCompleted: () => void;
  resetTourState: () => void;
}

const TrasladosTourContext = createContext<TrasladosTourContextType | undefined>(undefined);

const TOUR_LOCALSTORAGE_KEY = "traslados-tour-completed-v2";

const PHASE_ORDER: TourPhase[] = [
  "FILTROS",
  "SELECCION",
  "LISTA",
  "APROBACION",
  "COMPLETED",
];

interface TrasladosTourProviderProps {
  children: ReactNode;
}

export const TrasladosTourProvider: React.FC<TrasladosTourProviderProps> = ({ children }) => {
  const [tourPhase, setTourPhase] = useState<TourPhase>("IDLE");
  const [stepIndex, setStepIndex] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const isFullTourRunning = tourPhase !== "IDLE" && tourPhase !== "COMPLETED";

  // Iniciar el tour completo
  const startFullTour = useCallback(() => {
    setStepIndex(0);
    setTourPhase("FILTROS");
  }, []);

  // Auto-iniciar tour si hay ?tour=start en la URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("tour") === "start" && !isFullTourRunning) {
      navigate(location.pathname, { replace: true });
      startFullTour();
    }
  }, [location.search, location.pathname, navigate, startFullTour, isFullTourRunning]);

  // Verificar si el tour ya fue completado
  const isTourCompleted = useCallback((): boolean => {
    try {
      return localStorage.getItem(TOUR_LOCALSTORAGE_KEY) === "true";
    } catch {
      return false;
    }
  }, []);

  // Marcar el tour como completado
  const markTourCompleted = useCallback((): void => {
    try {
      localStorage.setItem(TOUR_LOCALSTORAGE_KEY, "true");
    } catch (error) {
      console.error("[Tour] Error marking completed:", error);
    }
  }, []);

  // Reiniciar el estado del tour
  const resetTourState = useCallback((): void => {
    try {
      localStorage.removeItem(TOUR_LOCALSTORAGE_KEY);
    } catch (error) {
      console.error("[Tour] Error resetting state:", error);
    }
  }, []);

  // Avanzar a la siguiente fase
  const nextPhase = useCallback(() => {
    const currentIndex = PHASE_ORDER.indexOf(tourPhase);
    if (currentIndex >= 0 && currentIndex < PHASE_ORDER.length - 1) {
      const nextPhaseValue = PHASE_ORDER[currentIndex + 1];
      setStepIndex(0);

      if (nextPhaseValue === "COMPLETED") {
        setTourPhase("COMPLETED");
        markTourCompleted();
        setTimeout(() => {
          setTourPhase("IDLE");
        }, 500);
      } else {
        setTourPhase(nextPhaseValue);
      }
    }
  }, [tourPhase, markTourCompleted]);

  // Detener el tour
  const stopTour = useCallback(() => {
    setTourPhase("IDLE");
    setStepIndex(0);
  }, []);

  // Completar el tour
  const completeTour = useCallback(() => {
    markTourCompleted();
    setTourPhase("COMPLETED");
    setTimeout(() => {
      setTourPhase("IDLE");
    }, 500);
  }, [markTourCompleted]);

  return (
    <TrasladosTourContext.Provider
      value={{
        tourPhase,
        isFullTourRunning,
        stepIndex,
        startFullTour,
        nextPhase,
        setStepIndex,
        stopTour,
        completeTour,
        isTourCompleted,
        markTourCompleted,
        resetTourState,
      }}
    >
      {children}
    </TrasladosTourContext.Provider>
  );
};

export const useTrasladosTourContext = (): TrasladosTourContextType => {
  const context = useContext(TrasladosTourContext);
  if (!context) {
    throw new Error("useTrasladosTourContext must be used within a TrasladosTourProvider");
  }
  return context;
};

export default TrasladosTourContext;
