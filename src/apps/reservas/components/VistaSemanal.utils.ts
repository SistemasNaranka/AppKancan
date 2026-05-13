import type { Reserva, EstadoReserva } from "../types/reservas.types";
import { COLORES_ESTADO, COLORES_TEXTO_ESTADO, puedeModificarse } from "../types/reservas.types";
import type { BloqueHora, ReservaEnCelda } from "./VistaSemanal.types";

export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
export const AÑOS = Array.from({ length: 7 }, (_, i) => 2024 + i);
export const DIAS = Array.from({ length: 31 }, (_, i) => i + 1);
export const ESTADOS_EXCLUIDOS = ["cancelado", "cancelada", "finalizado", "finalizada"];

// ─── Estilos ──────────────────────────────────────────────────────────────────

export const LABEL_GRUPO_SX = {
  fontWeight: 700, color: "#303030", fontSize: "0.7rem",
  textTransform: "uppercase" as const, letterSpacing: "0.5px",
};

export const SELECT_SX = {
  fontSize: "0.85rem",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
};

export const SEGMENTED_CONTAINER_SX = {
  display: "flex", backgroundColor: "#f1f5f9",
  borderRadius: "10px", padding: "4px", position: "relative" as const,
};

export const SEGMENTED_ITEM_BASE_SX = {
  px: 2, py: 0.5, fontSize: "0.85rem", fontWeight: 400,
  cursor: "pointer", borderRadius: "8px", position: "relative" as const,
  zIndex: 1, transition: "color 0.2s ease", userSelect: "none" as const,
};

export const HOVER_ZONE_SX = {
  position: "absolute" as const, left: 0, right: 0, height: 30,
  cursor: "pointer", zIndex: 0, display: "flex", alignItems: "center",
  justifyContent: "center", gap: 0.5, transition: "all 0.15s ease",
  "&:hover": {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    "& .hover-indicator": { opacity: 1 },
  },
};

export const HOVER_INDICATOR_SX = {
  display: "flex", alignItems: "center", gap: 0.5, opacity: 0,
  transition: "opacity 0.15s ease", backgroundColor: "rgba(16, 185, 129, 0.9)",
  color: "#fff", borderRadius: "4px", px: 0.75, py: 0.25,
};

// ─── Utilidades ───────────────────────────────────────────────────────────────

export const generarHorasRango = (horaInicio: string, horaFin: string): string[] => {
  const [horaIni] = horaInicio.split(":").map(Number);
  const [horaFinNum] = horaFin.split(":").map(Number);
  const horas: string[] = [];
  for (let h = horaIni; h <= horaFinNum; h++) {
    horas.push(`${h.toString().padStart(2, "0")}:00`);
  }
  return horas;
};

export const formatearHora12h = (hora: string): string => {
  const [h, m] = hora.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${(m ?? 0).toString().padStart(2, "0")} ${ampm}`;
};

export const getColorEstado = (reserva: Reserva) => {
  const estado = (reserva.estadoCalculado || reserva.status) as EstadoReserva;
  return {
    bg: COLORES_ESTADO[estado] || "#F3F4F6",
    text: COLORES_TEXTO_ESTADO[estado] || "#374151",
  };
};

export const puedeModificar = (reserva: Reserva, usuarioActualId?: string): boolean => {
  if (!usuarioActualId || !reserva.user_id) return false;
  if (reserva.user_id.id !== usuarioActualId) return false;
  return puedeModificarse(reserva.estadoCalculado || reserva.status);
};

export const generarBloquesPorHora = (reserva: Reserva): BloqueHora[] => {
  const [horaIni, minIni] = reserva.start_time.split(":").map(Number);
  const [horaFin, minFin] = reserva.end_time.split(":").map(Number);
  const ALT = 60;
  const bloques: BloqueHora[] = [];
  const horaFinAjustada = minFin > 0 ? horaFin + 1 : horaFin;

  for (let h = horaIni; h < horaFinAjustada; h++) {
    let top = 0;
    let height = ALT;
    if (h === horaIni) {
      top = (minIni / 60) * ALT;
      height = horaIni === horaFin
        ? ((minFin - minIni) / 60) * ALT
        : ((60 - minIni) / 60) * ALT;
    } else if (h === horaFin) {
      height = (minFin / 60) * ALT;
    }
    bloques.push({
      hora: `${h.toString().padStart(2, "0")}:00`,
      esInicio: h === horaIni,
      esFin: h === horaFin,
      posicion: { top, height },
    });
  }
  return bloques;
};

export const getReservasEnCelda = (
  reservasSemana: Reserva[],
  dia: Date,
  hora: string,
  formatFn: (d: Date, fmt: string) => string,
): ReservaEnCelda[] => {
  const fechaStr = formatFn(dia, "yyyy-MM-dd");
  const horaNum = parseInt(hora.split(":")[0]);
  const resultado: ReservaEnCelda[] = [];
  reservasSemana.forEach((r) => {
    if (r.date !== fechaStr) return;
    const bloque = generarBloquesPorHora(r).find(
      (b) => parseInt(b.hora.split(":")[0]) === horaNum,
    );
    if (bloque) resultado.push({ reserva: r, ...bloque });
  });
  return resultado;
};