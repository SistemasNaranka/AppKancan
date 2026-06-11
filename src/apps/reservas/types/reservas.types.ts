export interface UsuarioReserva {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_role?: {
    id: number;
    area?: string;
  };
}

export interface Participante {
  name: string;
  email: string;
}

export interface Reserva {
  id: number;
  date_created: string;
  user_id: UsuarioReserva | null;
  room_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: EstadoReserva;
  meeting_title: string;
  observations?: string;
  participants?: Participante[];
  departament?: string;
  estadoCalculado?: EstadoReserva;
}

export type EstadoReserva = "Vigente" | "En curso" | "Finalizado" | "Cancelado";

export const ESTADOS_FILTRO = [
  "Vigente",
  "En curso",
  "Finalizado",
  "Cancelado",
] as const;


export type Sala = "Sala Principal" | "Sala Secundaria";


export const SALAS_DISPONIBLES: Sala[] = ["Sala Principal", "Sala Secundaria"];


export interface NuevaReserva {
  room_name: Sala;
  date: string;
  start_time: string;
  end_time: string;
  meeting_title: string;
  observations?: string;
  participants?: Participante[];
  departament?: string;
}


export interface ActualizarReserva {
  room_name?: Sala;
  date?: string;
  start_time?: string;
  end_time?: string;
  status?: EstadoReserva;
  meeting_title?: string;
  observations?: string;
  participants?: Participante[];
}


export interface FiltrosReserva {
  date?: string;
  room_name?: Sala | "";
  status?: EstadoReserva | "";
  user_id?: string;
}

export const COLORES_ESTADO: Record<EstadoReserva, string> = {
  Vigente: "#004680",
  "En curso": "#0F9568",
  Finalizado: "#F3F4F6",
  Cancelado: "#FEE2E2",
};


export const COLORES_TEXTO_ESTADO: Record<EstadoReserva, string> = {
  Vigente: "#5CB6FF",
  "En curso": "#41ECB3",
  Finalizado: "#374151",
  Cancelado: "#DC2626",
};

export interface ConfiguracionHorario {
  id: number;
  opening_time: string;
  closing_time: string;
  status: "Activo" | "Inactivo";
}


export interface ConfiguracionReservas {
  hora_inicio_operacion: string;
  hora_fin_operacion: string;
  intervalo_reserva_minutos: number;
  dias_laborales: number[];
}

export const CONFIGURACION_POR_DEFECTO: ConfiguracionReservas = {
  hora_inicio_operacion: "07:00",
  hora_fin_operacion: "18:00",
  intervalo_reserva_minutos: 60,
  dias_laborales: [1, 2, 3, 4, 5],
};


export const HORARIO_COMERCIAL = {
  inicio: "07:00",
  fin: "16:30",
};

export const HORARIO_INICIO = HORARIO_COMERCIAL.inicio;
export const HORARIO_FIN = HORARIO_COMERCIAL.fin;

export const capitalize = (text: string): string => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const DURACION_MINIMA_MINUTOS = 30;

export const calcularEstadoReserva = (reserva: Reserva): EstadoReserva => {
  if (estaCancelado(reserva.status)) {
    return reserva.status;
  }

  const ahora = new Date();
  const fechaInicio = new Date(`${reserva.date}T${reserva.start_time}`);
  const fechaFin = new Date(`${reserva.date}T${reserva.end_time}`);

  if (ahora >= fechaFin) {
    return "Finalizado";
  }

  if (ahora >= fechaInicio && ahora < fechaFin) {
    return "En curso";
  }

  return "Vigente";
};

export const estaFinalizado = (estado: string): boolean => {
  const estadoLower = estado?.toLowerCase() || "";
  return estadoLower === "finalizada" || estadoLower === "finalizado";
};

export const estaCancelado = (estado: string): boolean => {
  const estadoLower = estado?.toLowerCase() || "";
  return estadoLower === "cancelada" || estadoLower === "cancelado";
};

export const puedeModificarse = (estado: string): boolean => {
  const estadoLower = estado?.toLowerCase() || "";
  return estadoLower === "vigente";
};

export const PALETA_RESERVAS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#6366f1",
  "#0ea5e9",
  "#f43f5e",
  "#14b8a6",
  "#d946ef",
  "#f97316",
  "#84cc16",
  "#06b6d4",
  "#a855f7",
];

export const getReservaColor = (id: number): string => {
  if (!id) return "#9e9e9e";
  return PALETA_RESERVAS[id % PALETA_RESERVAS.length];
};

export const getRandomTextColor = (): string => {
  return "#ffffff";
};
