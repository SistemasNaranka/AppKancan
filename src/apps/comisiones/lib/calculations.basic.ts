/**
 * Funciones básicas de utilidad para cálculos de comisiones
 */

/**
 * Redondea un número a 2 decimales
 */
export const round = (value: number): number => {
  return Math.round(value * 100) / 100;
};

/**
 * Obtiene el mes y año de una fecha (formato "MMM YYYY")
 */
export const getMonthYear = (dateStr: string): string => {
  const date = new Date(dateStr + "T00:00:00Z");
  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${month} ${year}`;
};

/**
 * Convierte un mes en formato "MMM YYYY" a timestamp para comparar
 */
export const monthToTimestamp = (monthStr: string): number => {
  const [monthName, yearStr] = monthStr.split(" ");
  const monthMap: Record<string, number> = {
    Ene: 0,
    Feb: 1,
    Mar: 2,
    Abr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Ago: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dic: 11,
  };
  const month = monthMap[monthName];
  const year = parseInt(yearStr);
  return year * 12 + month; // Convertir a número comparable
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 */
export const getCurrentDate = (): string => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Verifica si un mes es el mes actual
 */
export const isCurrentMonth = (mes: string): boolean => {
  const [mesNombre, anioStr] = mes.split(" ");
  const mesesMap: { [key: string]: number } = {
    Ene: 0,
    Feb: 1,
    Mar: 2,
    Abr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Ago: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dic: 11,
  };

  const mesNumero = mesesMap[mesNombre];
  const anio = parseInt(anioStr);

  const ahora = new Date();
  return ahora.getUTCFullYear() === anio && ahora.getUTCMonth() === mesNumero;
};
