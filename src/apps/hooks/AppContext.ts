import { createContext } from "react";
export type App = {
  id: string;
  nombre: string;
  ruta: string;
  area?: string;
  categoria?: string;
  icono_app?: string;
};

export type AppsLoadingStatus =
  | { status: "loading" }
  | { status: "no_apps"; message: string }
  | { status: "no_area"; message: string }
  | { status: "loaded" };

export interface AppContextType {
  apps: App[];
  area: string | null; 
  loading: boolean;
  loadingStatus: AppsLoadingStatus;
  reloadApps: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
