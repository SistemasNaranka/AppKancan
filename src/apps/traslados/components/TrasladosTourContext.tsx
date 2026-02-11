/**
 * TrasladosTourContext.tsx
 * Contexto para manejar el estado del tour guiado de traslados
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

// ============================================
// TIPOS Y FASES DEL TOUR
// ============================================

export type TourPhase =
  | "IDLE"           // No hay tour activo
  | "FILTROS"        // Tour de filtros (bodega, búsqueda)
  | "SELECCION"      // Tour de selección de traslados
  | "LISTA"          // Tour de la lista de traslados
  | "APROBACION"     // Tour del botón aprobar
  | "COMPLETED";     // Tour completado

interface TrasladosTourContextType {
  // Estado del tour
  tourPhase: TourPhase;
  isFullTourRunning: boolean;
  stepIndex: number;

  // Control del tour
  startFullTour: () => void;
  nextPhase: () => void;
  setStepIndex: (index: number) => void;
  stopTour: () => void;
  completeTour: () => void;

  // Utilidades de localStorage
  isTourCompleted: () => boolean;
  markTourCompleted: () => void;
  resetTourState: () => void;
}

const TrasladosTourContext = createContext<TrasladosTourContextType | undefined>(undefined);

// ============================================
// CONSTANTES
// ============================================

const TOUR_LOCALSTORAGE_KEY = "traslados-tour-completed-v2";

// Orden de fases
const PHASE_ORDER: TourPhase[] = [
  "FILTROS",
  "SELECCION",
  "LISTA",
  "APROBACION",
  "COMPLETED",
];

// ============================================
// PROVIDER
// ============================================

interface TrasladosTourProviderProps {
  children: ReactNode;
}

export const TrasladosTourProvider: React.FC<TrasladosTourProviderProps> = ({ children }) => {
  const [tourPhase, setTourPhase] = useState<TourPhase>("IDLE");
  const [stepIndex, setStepIndex] = useState(0);

  // El tour está corriendo si no está IDLE ni COMPLETED
  const isFullTourRunning = tourPhase !== "IDLE" && tourPhase !== "COMPLETED";

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

  // Iniciar el tour completo
  const startFullTour = useCallback(() => {
    setStepIndex(0);
    setTourPhase("FILTROS");
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
        // Limpiar después de un momento
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

// ============================================
// HOOK
// ============================================

export const useTrasladosTourContext = (): TrasladosTourContextType => {
  const context = useContext(TrasladosTourContext);
  if (!context) {
    throw new Error("useTrasladosTourContext must be used within a TrasladosTourProvider");
  }
  return context;
};

export default TrasladosTourContext;