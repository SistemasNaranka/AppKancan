import type {
  Proceso,
  MetricasProceso,
  MetricasProyecto,
  FrecuenciaTipo,
} from "../types";

/**
 * Convierte segundos a formato legible
 */
export function formatTiempo(segundos: number): string {
  if (segundos < 60) {
    return `${segundos}s`;
  }

  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;

  if (horas > 0) {
    return `${horas}h ${minutos}m ${segs}s`;
  }

  return `${minutos}m ${segs}s`;
}

/**
 * Convierte segundos a horas
 */
export function segundosAHours(segundos: number): number {
  return Number((segundos / 3600).toFixed(2));
}

/**
 * Obtiene las veces por mes según el tipo de frecuencia
 */
function getVecesPorMes(frecuenciaTipo: FrecuenciaTipo): number {
  switch (frecuenciaTipo) {
    case "diaria":
      return 30; // 30 días
    case "semanal":
      return 4; // 4 semanas
    case "mensual":
      return 1;
    default:
      return 1;
  }
}

/**
 * Obtiene las veces por año según el tipo de frecuencia
 */
function getVecesPorAnio(frecuenciaTipo: FrecuenciaTipo): number {
  switch (frecuenciaTipo) {
    case "diaria":
      return 365;
    case "semanal":
      return 52;
    case "mensual":
      return 12;
    default:
      return 1;
  }
}

/**
 * Calcula las métricas de un solo proceso
 */
export function calcularMetricasProceso(proceso: Proceso): MetricasProceso {
  const ahorroPorEjecucion = proceso.tiempo_antes - proceso.tiempo_despues;

  if (ahorroPorEjecucion <= 0 || proceso.frecuencia_cantidad <= 0) {
    return {
      ahorro_por_ejecucion: 0,
      ahorro_diario: 0,
      ahorro_semanal: 0,
      ahorro_mensual: 0,
      ahorro_anual: 0,
    };
  }

  const vecesPorDia =
    proceso.frecuencia_tipo === "diaria"
      ? proceso.frecuencia_cantidad
      : proceso.frecuencia_tipo === "semanal"
        ? proceso.frecuencia_cantidad / 7
        : proceso.frecuencia_cantidad / 30;

  const vecesPorSemana =
    proceso.frecuencia_tipo === "semanal"
      ? proceso.frecuencia_cantidad
      : proceso.frecuencia_tipo === "diaria"
        ? proceso.frecuencia_cantidad * 7
        : proceso.frecuencia_cantidad / 4;

  const vecesPorMes =
    proceso.frecuencia_cantidad * getVecesPorMes(proceso.frecuencia_tipo);
  const vecesPorAnio =
    proceso.frecuencia_cantidad * getVecesPorAnio(proceso.frecuencia_tipo);

  return {
    ahorro_por_ejecucion: ahorroPorEjecucion,
    ahorro_diario: Math.round(ahorroPorEjecucion * vecesPorDia),
    ahorro_semanal: Math.round(ahorroPorEjecucion * vecesPorSemana),
    ahorro_mensual: Math.round(ahorroPorEjecucion * vecesPorMes),
    ahorro_anual: Math.round(ahorroPorEjecucion * vecesPorAnio),
  };
}

/**
 * Calcula las métricas totales de un proyecto
 */
export function calcularMetricasProyecto(
  procesos: Proceso[],
): MetricasProyecto {
  if (!procesos || procesos.length === 0) {
    return {
      total_procesos: 0,
      ahorro_total_mensual: 0,
      ahorro_total_anual: 0,
      procesos: [],
    };
  }

  const metricasProcesos = procesos.map(calcularMetricasProceso);

  const ahorroTotalMensual = metricasProcesos.reduce(
    (acc, m) => acc + m.ahorro_mensual,
    0,
  );

  const ahorroTotalAnual = metricasProcesos.reduce(
    (acc, m) => acc + m.ahorro_anual,
    0,
  );

  return {
    total_procesos: procesos.length,
    ahorro_total_mensual: ahorroTotalMensual,
    ahorro_total_anual: ahorroTotalAnual,
    procesos: metricasProcesos,
  };
}

/**
 * Obtiene el texto de la frecuencia
 */
export function getTextoFrecuencia(
  tipo: FrecuenciaTipo,
  cantidad: number,
): string {
  switch (tipo) {
    case "diaria":
      return `${cantidad} veces/día`;
    case "semanal":
      return `${cantidad} veces/semana`;
    case "mensual":
      return `${cantidad} veces/mes`;
    default:
      return `${cantidad} veces`;
  }
}

/**
 * Obtiene las opciones de frecuencia para select
 */
export const opcionesFrecuencia = [
  { value: "diaria", label: "Diaria" },
  { value: "semanal", label: "Semanal" },
  { value: "mensual", label: "Mensual" },
];

/**
 * Obtiene las opciones de estado para select
 */
export const opcionesEstadoProyecto = [
  { value: "en_proceso", label: "En Proceso", color: "blue" },
  { value: "entregado", label: "Entregado", color: "green" },
  { value: "en_seguimiento", label: "En Seguimiento", color: "orange" },
];

/**
 * Obtiene las opciones de tipo de proyecto
 */
export const opcionesTipoProyecto = [
  { value: "mejora", label: "Mejora" },
  { value: "nuevo", label: "Nuevo" },
];

/**
 * Obtiene las opciones de prioridad
 */
export const opcionesPrioridad = [
  { value: "alta", label: "Alta", color: "red" },
  { value: "media", label: "Media", color: "yellow" },
  { value: "baja", label: "Baja", color: "green" },
];

/**
 * Obtiene las opciones de estado de mejora
 */
export const opcionesEstadoMejora = [
  { value: "pendiente", label: "Pendiente", color: "gray" },
  { value: "en_progreso", label: "En Progreso", color: "blue" },
  { value: "implementada", label: "Implementada", color: "green" },
];

/**
 * Obtiene las opciones de tipo de mejora
 */
export const opcionesTipoMejora = [
  { value: "mejora_rendimiento", label: "Mejora de Rendimiento" },
  { value: "mejora_usabilidad", label: "Mejora de Usabilidad" },
  { value: "nueva_funcionalidad", label: "Nueva Funcionalidad" },
  { value: "correccion_error", label: "Corrección de Error" },
  { value: "optimizacion", label: "Optimización" },
  { value: "otro", label: "Otro" },
];
