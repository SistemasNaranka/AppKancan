import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays 
} from "date-fns";
import { Reserva } from "../types/reservas.types";

export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export const AÑOS = Array.from({ length: 7 }, (_, i) => 2024 + i);

export const formatearHora = (hora: string) => hora.substring(0, 5);

export const truncarTexto = (texto: string, limite: number) => {
  if (!texto) return "";
  return texto.length > limite ? texto.slice(0, limite) + "..." : texto;
};

export const generarDiasCalendario = (fechaActual: Date, mostrarFinesSemana: boolean) => {
  const inicioMes = startOfMonth(fechaActual);
  const finMes = endOfMonth(fechaActual);
  const inicioCalendario = startOfWeek(inicioMes, { weekStartsOn: mostrarFinesSemana ? 0 : 1 });
  const finCalendario = endOfWeek(finMes, { weekStartsOn: mostrarFinesSemana ? 0 : 1 });

  const dias: Date[] = [];
  let diaActual = inicioCalendario;

  while (diaActual <= finCalendario) {
    const diaSemana = diaActual.getDay();
    if (mostrarFinesSemana || (diaSemana !== 0 && diaSemana !== 6)) {
      dias.push(diaActual);
    }
    diaActual = addDays(diaActual, 1);
  }
  return dias;
};