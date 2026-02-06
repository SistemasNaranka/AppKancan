/**
 * Tour Context
 * Global state management for the tour functionality
 */
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type TabReservas = "Reserva" | "mis" | "calendario";

interface TourContextType {
  activeTab: TabReservas;
  setActiveTab: (tab: TabReservas) => void;
  requestedTourTab: TabReservas | null;
  requestTourForTab: (tab: TabReservas) => void;
  clearRequestedTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

interface TourProviderProps {
  children: ReactNode;
  initialTab?: TabReservas;
}

export const TourProvider: React.FC<TourProviderProps> = ({
  children,
  initialTab = "Reserva",
}) => {
  const [activeTab, setActiveTabState] = useState<TabReservas>(initialTab);
  const [requestedTourTab, setRequestedTourTab] = useState<TabReservas | null>(null);

  const setActiveTab = useCallback((tab: TabReservas) => {
    setActiveTabState(tab);
  }, []);

  const requestTourForTab = useCallback((tab: TabReservas) => {
    setRequestedTourTab(tab);
  }, []);

  const clearRequestedTour = useCallback(() => {
    setRequestedTourTab(null);
  }, []);

  return (
    <TourContext.Provider
      value={{
        activeTab,
        setActiveTab,
        requestedTourTab,
        requestTourForTab,
        clearRequestedTour,
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
