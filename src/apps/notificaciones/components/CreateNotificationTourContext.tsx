import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTutorial } from "@/shared/hooks/TutorialContext";

// ── Tipos ──────────────────────────────────────────────────────────────────

interface CreateNotificationTourContextType {
  isRunning: boolean;
  startTour: () => void;
  stopTour: () => void;
}

const CreateNotificationTourContext = createContext<CreateNotificationTourContextType | undefined>(undefined);

const TOUR_KEY = "notificaciones-crear-tour-completed-v1";

// ── Provider ────────────────────────────────────────────────────────────────

interface Props { children: ReactNode }

export const CreateNotificationTourProvider: React.FC<Props> = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { activeTutorial, endTutorial } = useTutorial();

  const startTour = useCallback(() => {
    // Apaga primero para forzar reset interno de Joyride, luego enciende
    setIsRunning(false);
    setTimeout(() => setIsRunning(true), 50);
  }, []);

  const stopTour = useCallback(() => {
    setIsRunning(false);
    try { localStorage.setItem(TOUR_KEY, "true"); } catch { /* noop */ }
  }, []);

  // Activación via URL ?tour=start
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("tour") === "start" && !isRunning) {
      navigate(location.pathname, { replace: true });
      startTour();
    }
  }, [location.search, location.pathname, navigate, startTour, isRunning]);

  // Activación via PeekButton (clave dedicada "notificaciones-crear")
  useEffect(() => {
    if (activeTutorial !== "notificaciones-crear") return;
    endTutorial();
    startTour();
  }, [activeTutorial, endTutorial, startTour]);

  // Auto-arranque la primera vez que el usuario abre la vista
  useEffect(() => {
    let completed = false;
    try { completed = localStorage.getItem(TOUR_KEY) === "true"; } catch { /* noop */ }
    if (!completed) {
      const t = setTimeout(() => startTour(), 400);
      return () => clearTimeout(t);
    }
  }, [startTour]);

  return (
    <CreateNotificationTourContext.Provider value={{ isRunning, startTour, stopTour }}>
      {children}
    </CreateNotificationTourContext.Provider>
  );
};

// ── Hook ────────────────────────────────────────────────────────────────────

export const useCreateNotificationTour = (): CreateNotificationTourContextType => {
  const ctx = useContext(CreateNotificationTourContext);
  if (!ctx) throw new Error("useCreateNotificationTour must be used within CreateNotificationTourProvider");
  return ctx;
};

export default CreateNotificationTourContext;
