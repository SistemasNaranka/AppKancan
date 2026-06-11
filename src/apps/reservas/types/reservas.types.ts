export interface ReservationUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_role?: {
    id: number;
    area?: string;
  };
}

export interface Participant {
  name: string;
  email: string;
}

export interface Reservation {
  id: number;
  date_created: string;
  user_id: ReservationUser | null;
  room_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  meeting_title: string;
  observations?: string;
  participants?: Participant[];
  departament?: string;
  calculatedStatus?: ReservationStatus;
}

export type ReservationStatus = "Vigente" | "En curso" | "Finalizado" | "Cancelado";

export const FILTER_STATUSES = [
  "Vigente",
  "En curso",
  "Finalizado",
  "Cancelado",
] as const;

export type Room = "Sala Principal" | "Sala Secundaria";

export const AVAILABLE_ROOMS: Room[] = ["Sala Principal", "Sala Secundaria"];

export interface NewReservation {
  room_name: Room;
  date: string;
  start_time: string;
  end_time: string;
  meeting_title: string;
  observations?: string;
  participants?: Participant[];
  departament?: string;
}

export interface UpdateReservation {
  room_name?: Room;
  date?: string;
  start_time?: string;
  end_time?: string;
  status?: ReservationStatus;
  meeting_title?: string;
  observations?: string;
  participants?: Participant[];
}

export interface ReservationFilters {
  date?: string;
  room_name?: Room | "";
  status?: ReservationStatus | "";
  user_id?: string;
}

export const STATUS_COLORS: Record<ReservationStatus, string> = {
  Vigente: "#004680",
  "En curso": "#0F9568",
  Finalizado: "#F3F4F6",
  Cancelado: "#FEE2E2",
};

export const STATUS_TEXT_COLORS: Record<ReservationStatus, string> = {
  Vigente: "#5CB6FF",
  "En curso": "#41ECB3",
  Finalizado: "#374151",
  Cancelado: "#DC2626",
};

export interface ScheduleConfig {
  id: number;
  opening_time: string;
  closing_time: string;
  status: "Activo" | "Inactivo";
}

export interface ReservationConfig {
  operation_start_time: string;
  operation_end_time: string;
  reservation_interval_minutes: number;
  working_days: number[];
}

export const DEFAULT_RESERVATION_CONFIG: ReservationConfig = {
  operation_start_time: "07:00",
  operation_end_time: "18:00",
  reservation_interval_minutes: 60,
  working_days: [1, 2, 3, 4, 5],
};

export const BUSINESS_HOURS = {
  start: "07:00",
  end: "16:30",
};

export const START_HOUR = BUSINESS_HOURS.start;
export const END_HOUR = BUSINESS_HOURS.end;

export const capitalize = (text: string): string => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const MIN_DURATION_MINUTES = 30;

export const calculateReservationStatus = (reservation: Reservation): ReservationStatus => {
  if (isCancelled(reservation.status)) {
    return reservation.status;
  }

  const now = new Date();
  const startTime = new Date(`${reservation.date}T${reservation.start_time}`);
  const endTime = new Date(`${reservation.date}T${reservation.end_time}`);

  if (now >= endTime) {
    return "Finalizado";
  }

  if (now >= startTime && now < endTime) {
    return "En curso";
  }

  return "Vigente";
};

export const isFinished = (status: string): boolean => {
  const statusLower = status?.toLowerCase() || "";
  return statusLower === "finalizada" || statusLower === "finalizado";
};

export const isCancelled = (status: string): boolean => {
  const statusLower = status?.toLowerCase() || "";
  return statusLower === "cancelada" || statusLower === "cancelado";
};

export const canBeModified = (status: string): boolean => {
  const statusLower = status?.toLowerCase() || "";
  return statusLower === "vigente";
};

export const RESERVATIONS_PALETTE = [
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

export const getReservationColor = (id: number): string => {
  if (!id) return "#9e9e9e";
  return RESERVATIONS_PALETTE[id % RESERVATIONS_PALETTE.length];
};

export const getRandomTextColor = (): string => {
  return "#ffffff";
};
