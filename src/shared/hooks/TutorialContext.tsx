import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface TutorialContextType {
  /** Slug/id del tutorial que debe estar corriendo, o null */
  activeTutorial: string | null;
  /** Inicia el tutorial de una app (llamar ANTES de navegar) */
  startTutorial: (appKey: string) => void;
  /** Limpia el tutorial activo (llamar en el callback 'finished'/'skipped' de Joyride) */
  endTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export const TutorialProvider = ({ children }: { children: ReactNode }) => {
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);

  const startTutorial = useCallback((appKey: string) => {
    setActiveTutorial(appKey.toLowerCase());
  }, []);

  const endTutorial = useCallback(() => {
    setActiveTutorial(null);
  }, []);

  return (
    <TutorialContext.Provider value={{ activeTutorial, startTutorial, endTutorial }}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = (): TutorialContextType => {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial debe usarse dentro de un TutorialProvider");
  return ctx;
};
