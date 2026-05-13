import type {
  Process,
  ProcessMetrics,
  ProjectMetrics,
  FrequencyType,
} from "../types";

/**
 * Converts seconds to readable format
 */
export function formatTime(seconds: number): string {
  if (seconds === undefined || seconds === null || isNaN(seconds)) {
    return "0s";
  }

  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);

  if (absSeconds < 60) {
    return `${isNegative ? "-" : ""}${absSeconds}s`;
  }

  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const segs = absSeconds % 60;

  if (hours > 0) {
    return `${isNegative ? "-" : ""}${hours}h ${minutes}m ${segs}s`;
  }

  return `${isNegative ? "-" : ""}${minutes}m ${segs}s`;
}

/**
 * Converts seconds to hours
 */
export function secondsToHours(seconds: number): number {
  return Number((seconds / 3600).toFixed(2));
}

/**
 * Calculates metrics for a single process.
 */
export function calculateProcessMetrics(process: Process): ProcessMetrics {
  const timeBefore = Number(process.time_before) || 0;
  const timeAfter = Number(process.time_after) || 0;
  const frequencyQuantity = Number(process.frequency_quantity) || 1;
  const weekdays = Number(process.weekdays) > 0 ? Number(process.weekdays) : 5;

  const savingsPerExecution = timeBefore - timeAfter;

  let timesPerDay: number;
  let timesPerWeek: number;
  let timesPerMonth: number;
  let timesPerYear: number;

  switch (process.frequency_type) {
    case "diaria":
      timesPerDay = frequencyQuantity;
      timesPerWeek = frequencyQuantity * weekdays;
      timesPerMonth = frequencyQuantity * weekdays * 4.33;
      timesPerYear = frequencyQuantity * weekdays * 52;
      break;

    case "semanal":
      timesPerDay = frequencyQuantity / weekdays;
      timesPerWeek = frequencyQuantity;
      timesPerMonth = frequencyQuantity * 4.33;
      timesPerYear = frequencyQuantity * 52;
      break;

    case "mensual":
    default:
      timesPerDay = frequencyQuantity / (weekdays * 4.33);
      timesPerWeek = frequencyQuantity / 4.33;
      timesPerMonth = frequencyQuantity;
      timesPerYear = frequencyQuantity * 12;
      break;
  }

  return {
    savings_per_execution: savingsPerExecution,
    daily_savings: Math.round(savingsPerExecution * timesPerDay),
    weekly_savings: Math.round(savingsPerExecution * timesPerWeek),
    monthly_savings: Math.round(savingsPerExecution * timesPerMonth),
    yearly_savings: Math.round(savingsPerExecution * timesPerYear),
  };
}

/**
 * Calculates total metrics for a project
 */
export function calculateProjectMetrics(
  processes: Process[],
): ProjectMetrics {
  if (!processes || processes.length === 0) {
    return {
      total_processes: 0,
      total_monthly_savings: 0,
      total_yearly_savings: 0,
      processes_metrics: [],
    };
  }

  const processMetrics = processes.map(calculateProcessMetrics);

  const totalMonthlySavings = processMetrics.reduce(
    (acc, m) => acc + m.monthly_savings,
    0,
  );

  const totalYearlySavings = processMetrics.reduce(
    (acc, m) => acc + m.yearly_savings,
    0,
  );

  return {
    total_processes: processes.length,
    total_monthly_savings: totalMonthlySavings,
    total_yearly_savings: totalYearlySavings,
    processes_metrics: processMetrics,
  };
}

/**
 * Gets frequency text
 */
export function getFrequencyText(
  type: FrequencyType,
  quantity: number,
): string {
  switch (type) {
    case "diaria":
      return `${quantity} veces/día`;
    case "semanal":
      return `${quantity} veces/semana`;
    case "mensual":
      return `${quantity} veces/mes`;
    default:
      return `${quantity} veces`;
  }
}

/**
 * Options for frequency select
 */
export const frequencyOptions = [
  { value: "diaria", label: "Diaria" },
  { value: "semanal", label: "Semanal" },
  { value: "mensual", label: "Mensual" },
];

/**
 * Options for project status select
 */
export const projectStatusOptions = [
  { value: "en_proceso", label: "En Proceso", color: "blue" },
  { value: "entregado", label: "Entregado", color: "green" },
  { value: "en_seguimiento", label: "En Seguimiento", color: "orange" },
];

/**
 * Options for project type
 */
export const projectTypeOptions = [
  { value: "mejora", label: "Mejora" },
  { value: "nuevo", label: "Nuevo" },
];
