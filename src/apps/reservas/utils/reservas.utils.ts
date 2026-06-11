import { format, parse, addMinutes, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";

export function formatearFecha(fecha: string | Date): string {
  try {
    const fechaObj = typeof fecha === "string" ? new Date(fecha) : fecha;
    return format(fechaObj, "d 'de' MMMM yyyy", { locale: es });
  } catch {
    return String(fecha);
  }
}

export function formatearFechaCorta(fecha: string | Date): string {
  try {
    const fechaObj = typeof fecha === "string" ? new Date(fecha) : fecha;
    return format(fechaObj, "dd/MM/yyyy");
  } catch {
    return String(fecha);
  }
}

export function formatearHora(hora: string): string {
  return hora.substring(0, 5);
}

export function horaAMinutos(hora: string): number {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

export function minutosAHora(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return `${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function calcularDuracion(horaInicio: string, horaFinal: string): number {
  const minutosInicio = horaAMinutos(horaInicio);
  const minutosFinal = horaAMinutos(horaFinal);
  return minutosFinal - minutosInicio;
}

export function validarHorario(
  hora: string,
  horarioInicio: string,
  horarioFin: string
): boolean {
  const minutos = horaAMinutos(hora);
  const minutosInicio = horaAMinutos(horarioInicio);
  const minutosFin = horaAMinutos(horarioFin);
  return minutos >= minutosInicio && minutos <= minutosFin;
}

export function esFechaHoy(fecha: string | Date): boolean {
  const fechaObj = typeof fecha === "string" ? new Date(fecha) : fecha;
  const hoy = new Date();
  return (
    fechaObj.getDate() === hoy.getDate() &&
    fechaObj.getMonth() === hoy.getMonth() &&
    fechaObj.getFullYear() === hoy.getFullYear()
  );
}

export function esFechaFutura(fecha: string | Date): boolean {
  const fechaObj = typeof fecha === "string" ? new Date(fecha) : fecha;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fechaObj.setHours(0, 0, 0, 0);
  return fechaObj > hoy;
}

export function reunionHaIniciado(fecha: string, horaInicio: string): boolean {
  const ahora = new Date();
  const fechaReunion = new Date(`${fecha}T${horaInicio}`);
  return fechaReunion <= ahora;
}

export function reunionHaFinalizado(fecha: string, horaFinal: string): boolean {
  const ahora = new Date();
  const fechaReunion = new Date(`${fecha}T${horaFinal}`);
  return fechaReunion <= ahora;
}

export function obtenerFechaActual(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function obtenerHoraActual(): string {
  return format(new Date(), "HH:mm");
}

export function generarRangoHoras(
  inicio: string,
  fin: string,
  intervaloMinutos: number = 30
): string[] {
  const horas: string[] = [];
  let horaActual = horaAMinutos(inicio);
  const horaFinal = horaAMinutos(fin);

  while (horaActual <= horaFinal) {
    horas.push(minutosAHora(horaActual));
    horaActual += intervaloMinutos;
  }

  return horas;
}

export function rangosSeSolapan(
  inicio1: string,
  fin1: string,
  inicio2: string,
  fin2: string
): boolean {
  const min1Inicio = horaAMinutos(inicio1);
  const min1Fin = horaAMinutos(fin1);
  const min2Inicio = horaAMinutos(inicio2);
  const min2Fin = horaAMinutos(fin2);

  if (min2Inicio >= min1Inicio && min2Inicio < min1Fin) return true;

  if (min2Fin > min1Inicio && min2Fin <= min1Fin) return true;

  if (min2Inicio <= min1Inicio && min2Fin >= min1Fin) return true;

  return false;
}

export function formatearDuracion(minutos: number): string {
  if (minutos < 60) {
    return `${minutos} minutos`;
  }

  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;

  if (mins === 0) {
    return `${horas} ${horas === 1 ? "hora" : "horas"}`;
  }

  return `${horas} ${horas === 1 ? "hora" : "horas"} ${mins} minutos`;
}

export function obtenerDiaSemana(fecha: string | Date): string {
  const fechaObj = typeof fecha === "string" ? new Date(fecha) : fecha;
  return format(fechaObj, "EEEE", { locale: es });
}

export function esFinDeSemana(fecha: string | Date): boolean {
  const fechaObj = typeof fecha === "string" ? new Date(fecha) : fecha;
  const dia = fechaObj.getDay();
  return dia === 0 || dia === 6;
}