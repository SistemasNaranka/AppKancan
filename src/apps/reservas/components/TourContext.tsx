import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useMemo,
  useEffect,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { format, subDays } from "date-fns";
import type { Reserva } from "../types/reservas.types";

export type TabReservas = "Reserva" | "mis" | "calendario";

export type TourPhase =
  | "IDLE"
  | "RESERVA_CLICK_BUTTON"
  | "DIALOG_TOUR"
  | "RESERVA_CONTINUE"
  | "MIS_RESERVAS"
  | "CALENDARIO"
  | "COMPLETED"; 

interface TourContextType {
  tourPhase: TourPhase;
  isFullTourRunning: boolean;
  stepIndex: number;

  startFullTour: () => void;
  startFullTourWithNavigation: () => void;
  nextPhase: () => void;
  setStepIndex: (index: number) => void;
  stopTour: () => void;
  completeTour: () => void;

  userCreatedReservation: Reserva | null;
  setUserCreatedReservation: (reserva: Reserva | null) => void;

  mockReservasAdicionales: Reserva[];

  setTabChangeCallback: (callback: (tab: TabReservas) => void) => void;
  getCurrentTab: () => TabReservas;
  setCurrentTab: (tab: TabReservas) => void;

  setOpenDialogCallback: (callback: () => void) => void;
  openDialogForTour: () => void;

  setCloseDialogCallback: (callback: () => void) => void;
  closeDialogForTour: () => void;

  onDialogOpened: () => void;

  onFormSubmitted: (datos: any) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

interface TourProviderProps {
  children: ReactNode;
}

const generateMockReservasAdicionales = (): Reserva[] => {
  const hoy = new Date();
  const fechaAyer = format(subDays(hoy, 1), "yyyy-MM-dd");
  const fechaHoy = format(hoy, "yyyy-MM-dd");

  return [
    {
      id: 99902,
      room_name: "Sala Secundaria",
      date: fechaAyer,
      start_time: "14:00",
      end_time: "15:00",
      meeting_title: "Capacitación completada",
      observations: "Sesión de onboarding finalizada",
      departament: "recursos humanos",
      status: "Finalizado",
      estadoCalculado: "Finalizado",
      user_id: {
        id: "mock-user-id",
        first_name: "Usuario",
        last_name: "Demo",
        email: "demo@example.com",
      },
      date_created: fechaAyer,
    },
    {
      id: 99903,
      room_name: "Sala Principal",
      date: fechaHoy,
      start_time: "16:00",
      end_time: "17:00",
      meeting_title: "Reunión reprogramada",
      observations: "Se moverá para la próxima semana",
      departament: "gerencia",
      status: "Cancelado",
      estadoCalculado: "Cancelado",
      user_id: {
        id: "mock-user-id",
        first_name: "Usuario",
        last_name: "Demo",
        email: "demo@example.com",
      },
      date_created: fechaHoy,
    },
  ];
};

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
  const [currentTab, setCurrentTab] = useState<TabReservas>("Reserva");
  const location = useLocation();
  const navigate = useNavigate();

  const [tabChangeCallback, setTabChangeCallbackState] = useState<((tab: TabReservas) => void) | null>(null);
  const [openDialogCallback, setOpenDialogCallbackState] = useState<(() => void) | null>(null);
  const [closeDialogCallback, setCloseDialogCallbackState] = useState<(() => void) | null>(null);

  const mockReservasAdicionales = useMemo(() => generateMockReservasAdicionales(), []);

  const isFullTourRunning = tourPhase !== "IDLE" && tourPhase !== "COMPLETED";

  const startFullTour = useCallback(() => {
    setUserCreatedReservation(null);
    setStepIndex(0);
    setTourPhase("RESERVA_CLICK_BUTTON");
  }, []);

  const startFullTourWithNavigation = useCallback(() => {
    setUserCreatedReservation(null);
    setStepIndex(0);

    if (tabChangeCallback && currentTab !== "Reserva") {
      tabChangeCallback("Reserva");
    }

    setTimeout(() => {
      setTourPhase("RESERVA_CLICK_BUTTON");
    }, 100);
  }, [tabChangeCallback, currentTab]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("tour") === "start" && !isFullTourRunning) {
      navigate(location.pathname, { replace: true });
      startFullTourWithNavigation();
    }
  }, [location.search, location.pathname, navigate, startFullTourWithNavigation, isFullTourRunning]);

  const getCurrentTab = useCallback(() => {
    return currentTab;
  }, [currentTab]);

  const nextPhase = useCallback(() => {
    const currentIndex = PHASE_ORDER.indexOf(tourPhase);
    if (currentIndex >= 0 && currentIndex < PHASE_ORDER.length - 1) {
      const nextPhaseValue = PHASE_ORDER[currentIndex + 1];
      setStepIndex(0);

      if (nextPhaseValue === "MIS_RESERVAS" && tabChangeCallback) {
        tabChangeCallback("mis");
        setTimeout(() => setTourPhase(nextPhaseValue), 400);
      } else if (nextPhaseValue === "CALENDARIO" && tabChangeCallback) {
        tabChangeCallback("calendario");
        setTimeout(() => setTourPhase(nextPhaseValue), 400);
      } else if (nextPhaseValue === "COMPLETED") {
        setTourPhase("COMPLETED");
        setTimeout(() => {
          setTourPhase("IDLE");
          setUserCreatedReservation(null);
        }, 500);
      } else {
        setTourPhase(nextPhaseValue);
      }
    }
  }, [tourPhase, tabChangeCallback]);

  const stopTour = useCallback(() => {
    setTourPhase("IDLE");
    setStepIndex(0);
    setUserCreatedReservation(null);
  }, []);

  const completeTour = useCallback(() => {
    setTourPhase("COMPLETED");
    setTimeout(() => {
      setTourPhase("IDLE");
      setUserCreatedReservation(null);
    }, 500);
  }, []);

  const setTabChangeCallback = useCallback((callback: (tab: TabReservas) => void) => {
    setTabChangeCallbackState(() => callback);
  }, []);

  const setOpenDialogCallback = useCallback((callback: () => void) => {
    setOpenDialogCallbackState(() => callback);
  }, []);

  const setCloseDialogCallback = useCallback((callback: () => void) => {
    setCloseDialogCallbackState(() => callback);
  }, []);

  const openDialogForTour = useCallback(() => {
    if (openDialogCallback) {
      openDialogCallback();
    }
  }, [openDialogCallback]);

  const closeDialogForTour = useCallback(() => {
    if (closeDialogCallback) {
      closeDialogCallback();
    }
  }, [closeDialogCallback]);

  const onDialogOpened = useCallback(() => {
    if (tourPhase === "RESERVA_CLICK_BUTTON") {
      setTimeout(() => {
        setStepIndex(0);
        setTourPhase("DIALOG_TOUR");
      }, 100);
    }
  }, [tourPhase]);

  const onFormSubmitted = useCallback(
    (datos: any) => {
      if (tourPhase === "DIALOG_TOUR") {
        const fechaHoy = format(new Date(), "yyyy-MM-dd");
        const nuevaReserva: Reserva = {
          id: 99901,
          room_name: datos.room_name || "Sala Principal",
          date: datos.date || fechaHoy,
          start_time: datos.start_time || "09:00",
          end_time: datos.end_time || "10:00",
          meeting_title: datos.meeting_title || "Reunión de Ejemplo",
          observations: datos.observations || "",
          departament: "mi área",
          status: "Vigente",
          estadoCalculado: "Vigente",
          user_id: {
            id: "mock-user-id",
            first_name: "Usuario",
            last_name: "Demo",
            email: "demo@example.com",
          },
          date_created: fechaHoy,
        };

        setUserCreatedReservation(nuevaReserva);

        if (closeDialogCallback) {
          closeDialogCallback();
        }

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
        startFullTourWithNavigation,
        nextPhase,
        setStepIndex,
        stopTour,
        completeTour,
        userCreatedReservation,
        setUserCreatedReservation,
        mockReservasAdicionales,
        setTabChangeCallback,
        getCurrentTab,
        setCurrentTab,
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
