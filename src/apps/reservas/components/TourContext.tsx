import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { format, subDays } from "date-fns";
import type { Reserva } from "../types/reservas.types";

export type TabReservas = "Reserva" | "mis" | "calendario";

// Fases del tour
export type TourPhase =
  | "IDLE" // No hay tour activo
  | "RESERVA_CLICK_BUTTON" // Esperando click en "Nueva Reserva"
  | "DIALOG_TOUR" // Tour dentro del diálogo (manejado por DialogNuevaReserva)
  | "RESERVA_CONTINUE" // Continuar tour en pestaña Reserva
  | "MIS_RESERVAS" // Tour en Mis Reservas
  | "CALENDARIO" // Tour en Calendario
  | "COMPLETED"; // Tour completado

interface TourContextType {
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

  // Reserva creada por el usuario durante el tour
  userCreatedReservation: Reserva | null;
  setUserCreatedReservation: (reserva: Reserva | null) => void;

  // Mock data adicional para Mis Reservas
  mockReservasAdicionales: Reserva[];

  // Callback para cambiar de pestaña
  setTabChangeCallback: (callback: (tab: TabReservas) => void) => void;
  
  // Callback para abrir el diálogo de nueva reserva
  setOpenDialogCallback: (callback: () => void) => void;
  openDialogForTour: () => void;
  
  // Callback para cerrar el diálogo
  setCloseDialogCallback: (callback: () => void) => void;
  closeDialogForTour: () => void;

  // Notificar que el diálogo se abrió
  onDialogOpened: () => void;
  
  // Notificar que el formulario se envió (reserva creada)
  onFormSubmitted: (datos: any) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

interface TourProviderProps {
  children: ReactNode;
}

// Generar reservas mock adicionales para "Mis Reservas"
const generateMockReservasAdicionales = (): Reserva[] => {
  const hoy = new Date();
  const fechaAyer = format(subDays(hoy, 1), "yyyy-MM-dd");
  const fechaHoy = format(hoy, "yyyy-MM-dd");

  return [
    // Reserva Finalizada (ayer)
    {
      id: 99902,
      nombre_sala: "Sala Secundaria",
      fecha: fechaAyer,
      hora_inicio: "14:00",
      hora_final: "15:00",
      titulo_reunion: "Capacitación completada",
      observaciones: "Sesión de onboarding finalizada",
      area: "recursos humanos",
      estado: "Finalizado",
      estadoCalculado: "Finalizado",
      usuario_id: {
        id: "mock-user-id",
        first_name: "Usuario",
        last_name: "Demo",
        email: "demo@example.com",
      },
      date_created: fechaAyer,
      date_updated: fechaAyer,
    },
    // Reserva Cancelada
    {
      id: 99903,
      nombre_sala: "Sala Principal",
      fecha: fechaHoy,
      hora_inicio: "16:00",
      hora_final: "17:00",
      titulo_reunion: "Reunión reprogramada",
      observaciones: "Se moverá para la próxima semana",
      area: "gerencia",
      estado: "Cancelado",
      estadoCalculado: "Cancelado",
      usuario_id: {
        id: "mock-user-id",
        first_name: "Usuario",
        last_name: "Demo",
        email: "demo@example.com",
      },
      date_created: fechaHoy,
      date_updated: fechaHoy,
    },
  ];
};

// Orden de fases
const PHASE_ORDER: TourPhase[] = [
  "RESERVA_CLICK_BUTTON",
  "DIALOG_TOUR",
  "RESERVA_CONTINUE",
  "MIS_RESERVAS",
  "CALENDARIO",
  "COMPLETED",
];

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [tourPhase, setTourPhase] = useState<TourPhase>("IDLE");
  const [stepIndex, setStepIndex] = useState(0);
  const [userCreatedReservation, setUserCreatedReservation] = useState<Reserva | null>(null);
  
  // Callbacks
  const [tabChangeCallback, setTabChangeCallbackState] = useState<
    ((tab: TabReservas) => void) | null
  >(null);
  const [openDialogCallback, setOpenDialogCallbackState] = useState<
    (() => void) | null
  >(null);
  const [closeDialogCallback, setCloseDialogCallbackState] = useState<
    (() => void) | null
  >(null);

  // Mock data adicional
  const mockReservasAdicionales = useMemo(() => generateMockReservasAdicionales(), []);

  // El tour está corriendo si no está IDLE ni COMPLETED
  const isFullTourRunning = tourPhase !== "IDLE" && tourPhase !== "COMPLETED";

  // Iniciar el tour completo
  const startFullTour = useCallback(() => {
    setUserCreatedReservation(null);
    setStepIndex(0);
    setTourPhase("RESERVA_CLICK_BUTTON");
  }, []);

  // Avanzar a la siguiente fase
  const nextPhase = useCallback(() => {
    const currentIndex = PHASE_ORDER.indexOf(tourPhase);
    if (currentIndex >= 0 && currentIndex < PHASE_ORDER.length - 1) {
      const nextPhaseValue = PHASE_ORDER[currentIndex + 1];
      setStepIndex(0);
      
      // Cambiar pestaña según la fase
      if (nextPhaseValue === "MIS_RESERVAS" && tabChangeCallback) {
        tabChangeCallback("mis");
        setTimeout(() => setTourPhase(nextPhaseValue), 400);
      } else if (nextPhaseValue === "CALENDARIO" && tabChangeCallback) {
        tabChangeCallback("calendario");
        setTimeout(() => setTourPhase(nextPhaseValue), 400);
      } else if (nextPhaseValue === "COMPLETED") {
        setTourPhase("COMPLETED");
        // Limpiar después de un momento
        setTimeout(() => {
          setTourPhase("IDLE");
          setUserCreatedReservation(null);
        }, 500);
      } else {
        setTourPhase(nextPhaseValue);
      }
    }
  }, [tourPhase, tabChangeCallback]);

  // Detener el tour
  const stopTour = useCallback(() => {
    setTourPhase("IDLE");
    setStepIndex(0);
    setUserCreatedReservation(null);
  }, []);

  // Completar el tour
  const completeTour = useCallback(() => {
    setTourPhase("COMPLETED");
    setTimeout(() => {
      setTourPhase("IDLE");
      setUserCreatedReservation(null);
    }, 500);
  }, []);

  // Setters para callbacks
  const setTabChangeCallback = useCallback(
    (callback: (tab: TabReservas) => void) => {
      setTabChangeCallbackState(() => callback);
    },
    []
  );

  const setOpenDialogCallback = useCallback((callback: () => void) => {
    setOpenDialogCallbackState(() => callback);
  }, []);

  const setCloseDialogCallback = useCallback((callback: () => void) => {
    setCloseDialogCallbackState(() => callback);
  }, []);

  // Abrir el diálogo para el tour
  const openDialogForTour = useCallback(() => {
    if (openDialogCallback) {
      openDialogCallback();
    }
  }, [openDialogCallback]);

  // Cerrar el diálogo para el tour
  const closeDialogForTour = useCallback(() => {
    if (closeDialogCallback) {
      closeDialogCallback();
    }
  }, [closeDialogCallback]);

  // Cuando el diálogo se abre
  const onDialogOpened = useCallback(() => {
    if (tourPhase === "RESERVA_CLICK_BUTTON") {
      // Cambiar a fase DIALOG_TOUR (el Dialog manejará su propio tour)
      setTimeout(() => {
        setStepIndex(0);
        setTourPhase("DIALOG_TOUR");
      }, 100);
    }
  }, [tourPhase]);

  // Cuando el formulario se envía (durante el tour)
  const onFormSubmitted = useCallback(
    (datos: any) => {
      if (tourPhase === "DIALOG_TOUR") {
        // Crear la reserva mock con los datos del usuario
        const fechaHoy = format(new Date(), "yyyy-MM-dd");
        const nuevaReserva: Reserva = {
          id: 99901,
          nombre_sala: datos.nombre_sala,
          fecha: datos.fecha,
          hora_inicio: datos.hora_inicio,
          hora_final: datos.hora_final,
          titulo_reunion: datos.titulo || "Mi primera reserva",
          observaciones: datos.observaciones || "",
          area: "mi área",
          estado: "Vigente",
          estadoCalculado: "Vigente",
          usuario_id: {
            id: "mock-user-id",
            first_name: "Usuario",
            last_name: "Demo",
            email: "demo@example.com",
          },
          date_created: fechaHoy,
          date_updated: fechaHoy,
        };
        
        setUserCreatedReservation(nuevaReserva);
        
        // Cerrar diálogo y continuar tour
        if (closeDialogCallback) {
          closeDialogCallback();
        }
        
        // Avanzar a la siguiente fase
        setTimeout(() => {
          setStepIndex(0);
          setTourPhase("RESERVA_CONTINUE");
        }, 500);
      }
    },
    [tourPhase, closeDialogCallback]
  );

  return (
    <TourContext.Provider
      value={{
        tourPhase,
        isFullTourRunning,
        stepIndex,
        startFullTour,
        nextPhase,
        setStepIndex,
        stopTour,
        completeTour,
        userCreatedReservation,
        setUserCreatedReservation,
        mockReservasAdicionales,
        setTabChangeCallback,
        setOpenDialogCallback,
        openDialogForTour,
        setCloseDialogCallback,
        closeDialogForTour,
        onDialogOpened,
        onFormSubmitted,
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