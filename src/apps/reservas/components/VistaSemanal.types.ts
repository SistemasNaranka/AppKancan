import type { Reserva } from "../types/reservas.types";

export interface VistaSemanalProps {
  reservas: Reserva[];
  onNuevaReserva?: (fecha?: string, sala?: string, hora?: string) => void;
  onEditarReserva?: (reserva: Reserva) => void;
  onCancelarReserva?: (reserva: Reserva) => void;
  usuarioActualId?: string;
  vistaCalendario?: "semanal" | "mes";
  onCambiarVista?: (vista: "semanal" | "mes") => void;
  salaInicial?: string;
}

export interface BloqueHora {
  hora: string;
  esInicio: boolean;
  esFin: boolean;
  posicion: { top: number; height: number };
}

export interface ReservaEnCelda {
  reserva: Reserva;
  esInicio: boolean;
  esFin: boolean;
  posicion: { top: number; height: number };
}