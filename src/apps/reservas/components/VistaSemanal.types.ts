import type { Reservation } from "../types/reservas.types";

export interface VistaSemanalProps {
  reservations: Reservation[];
  onNewReservation?: (fecha?: string, sala?: string, hora?: string) => void;
  onEditReservation?: (reserva: Reservation) => void;
  onCancelReservation?: (reserva: Reservation) => void;
  currentUserId?: string;
  calendarView?: "semanal" | "mes";
  onViewChange?: (vista: "semanal" | "mes") => void;
  initialRoom?: string;
}

export interface BloqueHora {
  hora: string;
  esInicio: boolean;
  esFin: boolean;
  posicion: { top: number; height: number };
}

export interface ReservaEnCelda {
  reserva: Reservation;
  esInicio: boolean;
  esFin: boolean;
  posicion: { top: number; height: number };
}