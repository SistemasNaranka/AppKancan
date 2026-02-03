// src/apps/reservas/types/reservas.types.ts

/**
 * Datos del usuario en una reserva
 */
export interface UsuarioReserva {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  rol_usuario?: {
    id: number;
    area?: string;
  };
}

/**
 * Estructura tal cual viene de Directus (tabla Reuniones_Reservas)
 */
export interface Reserva {
  id: number;
  date_created: string;
  usuario_id: UsuarioReserva | null;
  nombre_sala: string;
  fecha: string;
  hora_inicio: string;
  hora_final: string;
  estado: EstadoReserva;
  observaciones: string;
  area?: string; // ✅ Área de la reserva (guardado en BD)
  // Campo calculado en frontend
  estadoCalculado?: EstadoReserva;
}

/**
 * Estados posibles de una reserva
 * "En curso" se calcula dinámicamente, no se guarda en BD
 */
export type EstadoReserva =
  | "Vigente"
  | "En curso"
  | "Finalizada"
  | "Finalizado"
  | "Cancelada"
  | "Cancelado";

/**
 * Estados para mostrar en filtros (sin duplicados)
 */
export const ESTADOS_FILTRO = [
  "Vigente",
  "En curso",
  "Finalizado",
  "Cancelado",
] as const;

/**
 * Opciones de salas disponibles
 */
export type Sala = "Sala A" | "Sala B";

/**
 * Lista de salas disponibles
 */
export const SALAS_DISPONIBLES: Sala[] = ["Sala A", "Sala B"];

/**
 * Información de configuración de las salas
 */
export const INFO_SALAS: Record<string, { tipo: string; capacidad: number }> = {
  "Sala A": { tipo: "", capacidad: 12 },
  "Sala B": { tipo: "", capacidad: 6 },
};

/**
 * Datos para crear una nueva reserva
 */
export interface NuevaReserva {
  nombre_sala: Sala;
  fecha: string;
  hora_inicio: string;
  hora_final: string;
  observaciones: string;
  area?: string | null; // ✅ Área de la reserva (puede ser null)
}

/**
 * Datos para actualizar una reserva existente
 */
export interface ActualizarReserva {
  nombre_sala?: Sala;
  fecha?: string;
  hora_inicio?: string;
  hora_final?: string;
  estado?: EstadoReserva;
  observaciones?: string;
}

/**
 * Filtros para consultar reservas
 */
export interface FiltrosReserva {
  fecha?: string;
  nombre_sala?: Sala | "";
  estado?: EstadoReserva | "";
  usuario_id?: string;
}

/**
 * Configuración de colores de FONDO por estado
 */
export const COLORES_ESTADO: Record<EstadoReserva, string> = {
  Vigente: "#DCFCE7",
  "En curso": "#DBEAFE",
  Finalizada: "#F3F4F6",
  Finalizado: "#F3F4F6",
  Cancelada: "#FEE2E2",
  Cancelado: "#FEE2E2",
};

/**
 * Configuración de colores de TEXTO por estado
 */
export const COLORES_TEXTO_ESTADO: Record<EstadoReserva, string> = {
  Vigente: "#166534",
  "En curso": "#1D4ED8",
  Finalizada: "#374151",
  Finalizado: "#374151",
  Cancelada: "#DC2626",
  Cancelado: "#DC2626",
};

/**
 * Horario comercial (configurable - futuro: vendrá de BD)
 */
export const HORARIO_COMERCIAL = {
  inicio: "07:00",
  fin: "16:30", // 4:30 PM
};

export const HORARIO_INICIO = HORARIO_COMERCIAL.inicio;
export const HORARIO_FIN = HORARIO_COMERCIAL.fin;

/**
 * Duración mínima de reunión en minutos
 */
export const DURACION_MINIMA_MINUTOS = 30;

/**
 * Calcula el estado real de una reserva basado en la fecha/hora actual
 */
export const calcularEstadoReserva = (reserva: Reserva): EstadoReserva => {
  // Si está cancelado, mantener ese estado
  if (estaCancelado(reserva.estado)) {
    return reserva.estado;
  }

  const ahora = new Date();
  const fechaInicio = new Date(`${reserva.fecha}T${reserva.hora_inicio}`);
  const fechaFin = new Date(`${reserva.fecha}T${reserva.hora_final}`);

  // Si ya pasó la hora final → Finalizado
  if (ahora >= fechaFin) {
    return "Finalizado";
  }

  // Si está entre hora inicio y hora final → En curso
  if (ahora >= fechaInicio && ahora < fechaFin) {
    return "En curso";
  }

  // Si aún no ha comenzado → Vigente
  return "Vigente";
};

/**
 * Verifica si un estado es "finalizado" (cualquier variante)
 */
export const estaFinalizado = (estado: string): boolean => {
  const estadoLower = estado?.toLowerCase() || "";
  return estadoLower === "finalizada" || estadoLower === "finalizado";
};

/**
 * Verifica si un estado es "cancelado" (cualquier variante)
 */
export const estaCancelado = (estado: string): boolean => {
  const estadoLower = estado?.toLowerCase() || "";
  return estadoLower === "cancelada" || estadoLower === "cancelado";
};

/**
 * Verifica si una reserva puede ser modificada
 */
export const puedeModificarse = (estado: string): boolean => {
  const estadoLower = estado?.toLowerCase() || "";
  return estadoLower === "vigente";
};
