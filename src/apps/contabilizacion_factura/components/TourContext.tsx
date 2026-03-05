/**
 * Contexto para gestionar el estado de los tours interactivos
 * Módulo de Contabilización de Facturas
 * Implementación basada en el patrón de la app de reservas
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

// Fases del tour
export type TourPhase =
  | "IDLE"              // No hay tour activo
  | "UPLOAD"            // Tour en el área de carga
  | "IA_STATUS"         // Tour en el estado de IA (sin steps, se auto-salta)
  | "INVOICE_DATA"      // Tour en los datos de factura
  | "CAUSE_BUTTON"      // Tour en el botón de causar
  | "AUTOMATICO_MODAL"  // Tour en el modal de número automático
  | "COMPLETED";        // Tour completado

interface TourContextType {
  // Estado del tour
  tourPhase: TourPhase;
  isTourRunning: boolean;
  stepIndex: number;

  /**
   * Indica si el usuario subió un archivo real durante el tour.
   * Si es false en la fase INVOICE_DATA, el componente de factura
   * debe mostrar datos de ejemplo en lugar de datos reales.
   */
  hasUploadedFile: boolean;

  // Control del tour
  startTour: () => void;
  nextPhase: () => void;
  setStepIndex: (index: number) => void;
  stopTour: () => void;
  completeTour: () => void;

  // Callback para cuando se selecciona un archivo
  onFileSelected: () => void;
  setOnFileSelectedCallback: (callback: () => void) => void;

  // Callback para cuando se causa la factura
  onInvoiceCaused: () => void;
  setOnInvoiceCausedCallback: (callback: () => void) => void;

  /**
   * Registrar el callback que hace visible la sección de datos de factura.
   * El componente de factura debe llamar a setShowInvoiceDataCallback
   * con una función que muestre el panel (con mock data si hasUploadedFile === false).
   *
   * Patrón idéntico a openDialogForTour / setOpenDialogCallback en ReservasTour.
   */
  setShowInvoiceDataCallback: (callback: () => void) => void;
  showInvoiceDataForTour: () => void;

  /**
   * Registrar el callback que hace visible el botón de causar factura.
   */
  setShowCauseButtonCallback: (callback: () => void) => void;
  showCauseButtonForTour: () => void;

  /**
   * Callback que Home registra para limpiar datosFactura al iniciar el tour.
   * Garantiza que la página vuelve al estado inicial independientemente
   * de si hay una factura cargada.
   */
  setOnTourStartCallback: (callback: () => void) => void;

  /**
   * Callback que abre el AutomaticoModal durante el tour.
   * Se invoca cuando el tour avanza de CAUSE_BUTTON → AUTOMATICO_MODAL.
   */
  setOpenAutomaticoModalCallback: (callback: () => void) => void;
  openAutomaticoModalForTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

interface TourProviderProps {
  children: ReactNode;
}

// Orden de fases — IA_STATUS se auto-salta porque no tiene steps
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

  // Callbacks
  const [fileSelectedCallback, setFileSelectedCallback] = useState<
    (() => void) | null
  >(null);
  const [invoiceCausedCallback, setInvoiceCausedCallback] = useState<
    (() => void) | null
  >(null);
  /**
   * Callback registrado por el componente de datos de factura.
   * Al invocarlo, ese componente se vuelve visible antes de que Joyride
   * intente buscar el target `.tour-factura-info` en el DOM.
   */
  const [showInvoiceDataCallback, setShowInvoiceDataCallbackState] = useState<
    (() => void) | null
  >(null);
  /**
   * Callback registrado para hacer visible el botón de causar factura.
   * Se invoca antes de que Joyride intente buscar el target `.tour-factura-cause`.
   */
  const [showCauseButtonCallback, setShowCauseButtonCallbackState] = useState<
    (() => void) | null
  >(null);

  // Callback para limpiar el estado de Home al iniciar el tour
  const [onTourStartCallback, setOnTourStartCallbackState] = useState<
    (() => void) | null
  >(null);

  // Callback para abrir el AutomaticoModal durante el tour
  const [openAutomaticoModalCallback, setOpenAutomaticoModalCallbackState] = useState<
    (() => void) | null
  >(null);

  const isTourRunning = tourPhase !== "IDLE" && tourPhase !== "COMPLETED";

  // Iniciar el tour — limpiar estado previo y resetear Home
  const startTour = useCallback(() => {
    // Limpiar cualquier factura cargada para empezar desde cero
    if (onTourStartCallback) {
      onTourStartCallback();
    }
    setHasUploadedFile(false);
    setStepIndex(0);
    setTourPhase("UPLOAD");
  }, [onTourStartCallback]);

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
      // Abrir el modal antes de cambiar la fase para que el target exista en el DOM
      // Esperar 600ms para que заверши la animación de apertura (Fade/Grow) del modal de MUI
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

  /**
   * Llamar desde el componente de upload cuando el usuario sube un archivo.
   * Marca hasUploadedFile = true y avanza a IA_STATUS.
   * Si el usuario NO sube archivo y avanza con "Siguiente", este callback
   * nunca se llama → hasUploadedFile permanece false → se usarán datos mock.
   */
  const onFileSelected = useCallback(() => {
    if (tourPhase === "UPLOAD") {
      setHasUploadedFile(true);
      setTimeout(() => {
        setStepIndex(0);
        setTourPhase("IA_STATUS");
      }, 100);
    }
  }, [tourPhase]);

  // Notificar que se causó la factura
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