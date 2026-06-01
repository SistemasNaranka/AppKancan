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

interface NotificationsTourContextType {
  isRunning: boolean;
  startTour: () => void;
  stopTour: () => void;
}

const NotificationsTourContext = createContext<NotificationsTourContextType | undefined>(undefined);

const TOUR_KEY = "notificaciones-tour-completed-v1";

// ── Provider ────────────────────────────────────────────────────────────────

interface Props { children: ReactNode }

export const NotificationsTourProvider: React.FC<Props> = ({ children }) => {
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

  // Activación via PeekButton
  useEffect(() => {
    if (activeTutorial !== "notificaciones") return;
    endTutorial();
    startTour();
  }, [activeTutorial, endTutorial, startTour]);

  return (
    <NotificationsTourContext.Provider value={{ isRunning, startTour, stopTour }}>
      {children}
    </NotificationsTourContext.Provider>
  );
};

// ── Hook ────────────────────────────────────────────────────────────────────

export const useNotificationsTour = (): NotificationsTourContextType => {
  const ctx = useContext(NotificationsTourContext);
  if (!ctx) throw new Error("useNotificationsTour must be used within NotificationsTourProvider");
  return ctx;
};

export default NotificationsTourContext;
