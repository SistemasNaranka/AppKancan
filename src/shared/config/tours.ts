/**
 * Configuración centralizada de tutoriales disponibles en la aplicación.
 * Cada entrada debe coincidir con un módulo que tenga un TourProvider implementado.
 */

export interface TourInfo {
  id: string; // identificador único del tour
  nombre: string; // nombre mostrado en el menú
  ruta: string; // ruta base de la app (ej: /apps/traslados)
  storageKey: string; // clave en localStorage para saber si fue completado
  icono?: string; // emoji o nombre de icono
  descripcion?: string;
}

/**
 * Lista de tours disponibles.
 * NOTA: El `id` debe coincidir con algún identificador que permita relacionar
 * con las apps obtenidas de Directus. Normalmente la ruta de la app incluye
 * el módulo (ej: "/apps/traslados").
 */
export const TOURS_DISPONIBLES: TourInfo[] = [
  {
    id: "traslados",
    nombre: "Traslados",
    ruta: "/apps/traslados",
    storageKey: "traslados-tour-completed-v2",
    icono: "🚚",
    descripcion: "Aprende a filtrar, seleccionar y aprobar traslados",
  },
  {
    id: "reservas",
    nombre: "Reservas",
    ruta: "/apps/reservas",
    storageKey: "reservas-tour-completed", // Ajustar si la clave real es diferente
    icono: "📅",
    descripcion: "Aprende a crear y gestionar reservas de salas",
  },
  {
    id: "contabilizacion_factura",
    nombre: "Contabilización de Facturas",
    ruta: "/apps/contabilizacion_factura",
    storageKey: "contabilizacion-tour-completed",
    icono: "📄",
    descripcion: "Aprende a cargar, procesar y causar facturas",
  },
];

/**
 * Verifica si un tour fue completado por el usuario.
 */
export function isTourCompleted(storageKey: string): boolean {
  try {
    return localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}

/**
 * Obtiene la información de un tour por su id.
 */
export function getTourInfo(id: string): TourInfo | undefined {
  return TOURS_DISPONIBLES.find((t) => t.id === id);
}
