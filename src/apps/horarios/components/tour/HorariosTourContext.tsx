import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type HorariosTab = 0 | 1 | 2 | 3;

export type TourPhase =
  | "IDLE"
  | "REGISTROS"
  | "NOVEDADES"
  | "HISTORIAL"
  | "COMPLETED";

interface TourContextType {
  tourPhase: TourPhase;
  isFullTourRunning: boolean;
  stepIndex: number;

  startTour: (phase?: TourPhase) => void;
  nextPhase: () => void;
  setStepIndex: (index: number) => void;
  stopTour: () => void;

  setTabChangeCallback: (callback: (tab: HorariosTab) => void) => void;
}

const HorariosTourContext = createContext<TourContextType | undefined>(undefined);

const PHASE_ORDER: TourPhase[] = [
  "REGISTROS",
  "NOVEDADES",
  "HISTORIAL",
  "COMPLETED",
];

const PHASE_TAB: Partial<Record<TourPhase, HorariosTab>> = {
  REGISTROS: 0,
  NOVEDADES: 1,
  HISTORIAL: 2,
};

interface TourProviderProps {
  children: ReactNode;
}

export const HorariosTourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [tourPhase, setTourPhase] = useState<TourPhase>("IDLE");
  const [stepIndex, setStepIndex] = useState(0);
  const [tabChangeCallback, setTabChangeCallbackState] =
    useState<((tab: HorariosTab) => void) | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const isFullTourRunning = tourPhase !== "IDLE" && tourPhase !== "COMPLETED";

  const startTour = useCallback(
    (phase: TourPhase = "REGISTROS") => {
      setStepIndex(0);
      const tab = PHASE_TAB[phase];
      if (tab !== undefined && tabChangeCallback) tabChangeCallback(tab);
      setTimeout(() => setTourPhase(phase), 100);
    },
    [tabChangeCallback]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("tour") === "start" && !isFullTourRunning) {
      navigate(location.pathname, { replace: true });
      startTour();
    }
  }, [location.search, location.pathname, navigate, startTour, isFullTourRunning]);

  const nextPhase = useCallback(() => {
    const currentIndex = PHASE_ORDER.indexOf(tourPhase);
    if (currentIndex < 0 || currentIndex >= PHASE_ORDER.length - 1) return;

    const nextPhaseValue = PHASE_ORDER[currentIndex + 1];
    setStepIndex(0);

    if (nextPhaseValue === "COMPLETED") {
      setTourPhase("COMPLETED");
      setTimeout(() => setTourPhase("IDLE"), 400);
      return;
    }

    const tab = PHASE_TAB[nextPhaseValue];
    if (tab !== undefined && tabChangeCallback) {
      tabChangeCallback(tab);
    }
    setTimeout(() => setTourPhase(nextPhaseValue), 400);
  }, [tourPhase, tabChangeCallback]);

  const stopTour = useCallback(() => {
    setTourPhase("IDLE");
    setStepIndex(0);
  }, []);

  const setTabChangeCallback = useCallback(
    (callback: (tab: HorariosTab) => void) => {
      setTabChangeCallbackState(() => callback);
    },
    []
  );

  return (
    <HorariosTourContext.Provider
      value={{
        tourPhase,
        isFullTourRunning,
        stepIndex,
        startTour,
        nextPhase,
        setStepIndex,
        stopTour,
        setTabChangeCallback,
      }}
    >
      {children}
    </HorariosTourContext.Provider>
  );
};

export const useHorariosTour = (): TourContextType => {
  const context = useContext(HorariosTourContext);
  if (!context) {
    throw new Error("useHorariosTour debe usarse dentro de HorariosTourProvider");
  }
  return context;
};

export default HorariosTourContext;