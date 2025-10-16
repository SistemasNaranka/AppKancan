import { AppContext, type AppContextType} from "@/apps/hooks/AppContext";
import { useContext} from "react";
/**
 *  Hook personalizado para acceder fácil al contexto.
 */
export const useApps = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApps debe usarse dentro de un AppProvider");
  return context;
};