import { createContext } from "react";

/**
 * Tipado de una App de la tabla de Directus
 */
export type App = {
  id: string;
  nombre: string;
  ruta: string;
  area?: string;           // ✅ Área de la app (ej: "ventas", "contabilidad")
  categoria?: string;      // ✅ Categoría ("principal" u otro valor)
};

/**
 * Interfaz de los valores que otorgará el Provider
 */
export interface AppContextType {
  apps: App[];                           // Lista de apps cargadas
  area: string | null;                   // ✅ Área del home principal
  loading: boolean;                      // Estado de carga
  reloadApps: () => Promise<void>;       // Función para recargar apps manualmente
}

/**
 * Contexto de las aplicaciones
 */
export const AppContext = createContext<AppContextType | undefined>(undefined);