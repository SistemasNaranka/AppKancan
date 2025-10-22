// StoresModalContext.tsx
import React, { createContext, useState, useContext } from "react";

interface StoresModalContextProps {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
  selectedStores: string[];
  setSelectedStores: (stores: string[]) => void;
}

const StoresModalContext = createContext<StoresModalContextProps | undefined>(undefined);

export const StoresModalProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);

  return (
    <StoresModalContext.Provider value={{
      open,
      openModal: () => setOpen(true),
      closeModal: () => setOpen(false),
      selectedStores,
      setSelectedStores
    }}>
      {children}
    </StoresModalContext.Provider>
  );
};

export const useStoresModal = () => {
  const context = useContext(StoresModalContext);
  if (!context) throw new Error("useStoresModal must be used within StoresModalProvider");
  return context;
};
