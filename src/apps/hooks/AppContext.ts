import { createContext } from "react";

/**
 * Tipado de una App de la tabla de Directus
 */
export type App = {
  id: string;
  nombre: string;
  ruta: string;
  area?: string; // ✅ Área de la app (ej: "ventas", "contabilidad")
  categoria?: string; // ✅ Categoría ("principal" u otro valor)
  icono_app?: string;
};

/**
 * Estado del carreggemento de apps - permite saber por qué está en carga
 */
export type AppsLoadingStatus =
  | { status: "loading" } // Cargando datos de Directus
  | { status: "no_apps"; message: string } // Usuario sin apps asignadas
  | { status: "no_area"; message: string } // Usuario sin área definida en rol_usuario
  | { status: "loaded" }; // Datos cargados correctamente

/**
 * Interfaz de los valores que otorgará el Provider
 */
export interface AppContextType {
  apps: App[]; // Lista de apps cargadas
  area: string | null; // ✅ Área del home principal
  loading: boolean; // Estado de carga
  loadingStatus: AppsLoadingStatus; // ✅ Estado detallado de carga
  reloadApps: () => Promise<void>; // Función para recargar apps manualmente
}

/**
 * Contexto de las aplicaciones
 */
export const AppContext = createContext<AppContextType | undefined>(undefined);
