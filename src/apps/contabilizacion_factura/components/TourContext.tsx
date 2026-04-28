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
  | "UPLOAD"
  | "IA_STATUS"
  | "INVOICE_DATA"
  | "CAUSE_BUTTON"
  | "AUTOMATICO_MODAL"
  | "COMPLETED";

interface TourContextType {
  tourPhase: TourPhase;
  isTourRunning: boolean;
  stepIndex: number;
  hasUploadedFile: boolean;
  startTour: () => void;
  nextPhase: () => void;
  setStepIndex: (index: number) => void;
  stopTour: () => void;
  completeTour: () => void;
  onFileSelected: () => void;
  setOnFileSelectedCallback: (callback: () => void) => void;
  onInvoiceCaused: () => void;
  setOnInvoiceCausedCallback: (callback: () => void) => void;
  setShowInvoiceDataCallback: (callback: () => void) => void;
  showInvoiceDataForTour: () => void;
  setShowCauseButtonCallback: (callback: () => void) => void;
  showCauseButtonForTour: () => void;
  setOnTourStartCallback: (callback: () => void) => void;
  setOpenAutomaticoModalCallback: (callback: () => void) => void;
  openAutomaticoModalForTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

interface TourProviderProps {
  children: ReactNode;
}

const PHASE_ORDER: TourPhase[] = [
  "UPLOAD",
  "INVOICE_DATA",
  "CAUSE_BUTTON",
  "AUTOMATICO_MODAL",
  "COMPLETED",
];

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [tourPhase, setTourPhase] = useState<TourPhase>("IDLE");
  const [stepIndex, setStepIndex] = useState(0);
  const [hasUploadedFile, setHasUploadedFile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Callbacks
  const [fileSelectedCallback, setFileSelectedCallback] = useState<(() => void) | null>(null);
  const [invoiceCausedCallback, setInvoiceCausedCallback] = useState<(() => void) | null>(null);
  const [showInvoiceDataCallback, setShowInvoiceDataCallbackState] = useState<(() => void) | null>(null);
  const [showCauseButtonCallback, setShowCauseButtonCallbackState] = useState<(() => void) | null>(null);
  const [onTourStartCallback, setOnTourStartCallbackState] = useState<(() => void) | null>(null);
  const [openAutomaticoModalCallback, setOpenAutomaticoModalCallbackState] = useState<(() => void) | null>(null);

  const isTourRunning = tourPhase !== "IDLE" && tourPhase !== "COMPLETED";

  // Iniciar el tour — limpiar estado previo y resetear Home
  const startTour = useCallback(() => {
    if (onTourStartCallback) {
      onTourStartCallback();
    }
    setHasUploadedFile(false);
    setStepIndex(0);
    setTourPhase("UPLOAD");
  }, [onTourStartCallback]);

  // Auto-iniciar tour si hay ?tour=start en la URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("tour") === "start" && !isTourRunning) {
      navigate(location.pathname, { replace: true });
      startTour();
    }
  }, [location.search, location.pathname, navigate, startTour, isTourRunning]);

  // Avanzar a la siguiente fase
  const nextPhase = useCallback(() => {
    const currentIndex = PHASE_ORDER.indexOf(tourPhase);
    if (currentIndex < 0 || currentIndex >= PHASE_ORDER.length - 1) return;

    const nextPhaseValue = PHASE_ORDER[currentIndex + 1];
    setStepIndex(0);

    if (nextPhaseValue === "INVOICE_DATA") {
      if (showInvoiceDataCallback) showInvoiceDataCallback();
      setTimeout(() => setTourPhase("INVOICE_DATA"), 400);
    } else if (nextPhaseValue === "CAUSE_BUTTON") {
      if (showCauseButtonCallback) showCauseButtonCallback();
      setTimeout(() => setTourPhase("CAUSE_BUTTON"), 400);
    } else if (nextPhaseValue === "AUTOMATICO_MODAL") {
      if (openAutomaticoModalCallback) openAutomaticoModalCallback();
      setTimeout(() => setTourPhase("AUTOMATICO_MODAL"), 600);
    } else if (nextPhaseValue === "COMPLETED") {
      setTourPhase("COMPLETED");
      setTimeout(() => {
        setTourPhase("IDLE");
        setHasUploadedFile(false);
      }, 500);
    } else {
      setTourPhase(nextPhaseValue);
    }
  }, [tourPhase, showInvoiceDataCallback, showCauseButtonCallback, openAutomaticoModalCallback]);

  // Detener el tour
  const stopTour = useCallback(() => {
    setTourPhase("IDLE");
    setStepIndex(0);
    setHasUploadedFile(false);
  }, []);

  // Completar el tour
  const completeTour = useCallback(() => {
    setTourPhase("COMPLETED");
    setTimeout(() => {
      setTourPhase("IDLE");
      setHasUploadedFile(false);
    }, 500);
  }, []);

  // Setters para callbacks
  const setOnFileSelectedCallback = useCallback((callback: () => void) => {
    setFileSelectedCallback(() => callback);
  }, []);

  const setOnInvoiceCausedCallback = useCallback((callback: () => void) => {
    setInvoiceCausedCallback(() => callback);
  }, []);

  const setShowInvoiceDataCallback = useCallback((callback: () => void) => {
    setShowInvoiceDataCallbackState(() => callback);
  }, []);

  const setShowCauseButtonCallback = useCallback((callback: () => void) => {
    setShowCauseButtonCallbackState(() => callback);
  }, []);

  const setOnTourStartCallback = useCallback((callback: () => void) => {
    setOnTourStartCallbackState(() => callback);
  }, []);

  const setOpenAutomaticoModalCallback = useCallback((callback: () => void) => {
    setOpenAutomaticoModalCallbackState(() => callback);
  }, []);

  const showInvoiceDataForTour = useCallback(() => {
    if (showInvoiceDataCallback) showInvoiceDataCallback();
  }, [showInvoiceDataCallback]);

  const showCauseButtonForTour = useCallback(() => {
    if (showCauseButtonCallback) showCauseButtonCallback();
  }, [showCauseButtonCallback]);

  const openAutomaticoModalForTour = useCallback(() => {
    if (openAutomaticoModalCallback) openAutomaticoModalCallback();
  }, [openAutomaticoModalCallback]);

  const onFileSelected = useCallback(() => {
    if (tourPhase === "UPLOAD") {
      setHasUploadedFile(true);
      setTimeout(() => {
        setStepIndex(0);
        setTourPhase("IA_STATUS");
      }, 100);
    }
  }, [tourPhase]);

  const onInvoiceCaused = useCallback(() => {
    if (tourPhase === "CAUSE_BUTTON") {
      setTimeout(() => {
        setStepIndex(0);
        setTourPhase("COMPLETED");
      }, 100);
      setTimeout(() => {
        setTourPhase("IDLE");
        setHasUploadedFile(false);
      }, 600);
    }
  }, [tourPhase]);

  return (
    <TourContext.Provider
      value={{
        tourPhase,
        isTourRunning,
        stepIndex,
        hasUploadedFile,
        startTour,
        nextPhase,
        setStepIndex,
        stopTour,
        completeTour,
        onFileSelected,
        setOnFileSelectedCallback,
        onInvoiceCaused,
        setOnInvoiceCausedCallback,
        setShowInvoiceDataCallback,
        showInvoiceDataForTour,
        setShowCauseButtonCallback,
        showCauseButtonForTour,
        setOnTourStartCallback,
        setOpenAutomaticoModalCallback,
        openAutomaticoModalForTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTourContext = (): TourContextType => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTourContext must be used within a TourProvider");
  }
  return context;
};

export default TourContext;
