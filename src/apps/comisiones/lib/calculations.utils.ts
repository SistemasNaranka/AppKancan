import { BudgetRecord, VentasData, CommissionThreshold } from "../types";

export const round = (value: number): number => {
  return Math.round(value * 100) / 100;
};

export const getMonthYear = (dateStr: string): string => {
  const date = new Date(dateStr + "T00:00:00");
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
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}`;
};

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
  return year * 12 + month;
};


export const getCurrentDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};


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
  return ahora.getFullYear() === anio && ahora.getMonth() === mesNumero;
};

export const getEmployeeVentas = (
  ventasData: VentasData[],
  tienda: string,
  fecha: string,
  empleadoId: string
): number => {
  if (!Array.isArray(ventasData)) {
    return 0;
  }
  const venta = ventasData.find(
    (v) => v.tienda === tienda && v.fecha === fecha
  );
  if (!venta) return 0;
  return venta.ventas_por_asesor[empleadoId] || 0;
};


export const getTiendaVentas = (
  ventasData: VentasData[],
  tienda: string,
  fecha: string
): number => {
  if (!Array.isArray(ventasData)) {
    return 0;
  }
  const venta = ventasData.find(
    (v) => v.tienda === tienda && v.fecha === fecha
  );
  return venta?.ventas_tienda || 0;
};

export const getAvailableMonths = (budgets: BudgetRecord[]): string[] => {
  const months = new Set<string>();
  budgets.forEach((b) => {
    months.add(getMonthYear(b.fecha));
  });
  return Array.from(months).sort(
    (a, b) => monthToTimestamp(a) - monthToTimestamp(b)
  );
};

export const getNextCommission = (
  comisionActual: number,
  thresholdConfig?: CommissionThreshold[]
): number | string => {
  const DEFAULT_THRESHOLDS = [
    { min_compliance: 90, pct_commission: 0.0035, name: "Muy Regular" },
    { min_compliance: 95, pct_commission: 0.005, name: "Regular" },
    { min_compliance: 100, pct_commission: 0.007, name: "Buena" },
    { min_compliance: 110, pct_commission: 0.01, name: "Excelente" },
  ];

  const umbrales =
    thresholdConfig && thresholdConfig.length > 0
      ? thresholdConfig
      : DEFAULT_THRESHOLDS;

  const umbralesOrdenados = [...umbrales].sort(
    (a, b) => a.pct_commission - b.pct_commission
  );

  const currentIndex = umbralesOrdenados.findIndex(
    (u) => Math.abs(u.pct_commission - comisionActual) < 0.0001
  );

  if (currentIndex === -1) {
    const closestIndex = umbralesOrdenados.findIndex(
      (u) => u.pct_commission > comisionActual
    );
    if (closestIndex > 0) {
      return umbralesOrdenados[closestIndex - 1].pct_commission;
    }
    return umbralesOrdenados[0]?.pct_commission ?? "NN";
  }

  if (currentIndex >= umbralesOrdenados.length - 1) {
    return "NN";
  }

  return umbralesOrdenados[currentIndex + 1].pct_commission;
};


export const formatProximaComision = (
  proximaComision: number | string
): string => {
  if (proximaComision === "NN") {
    return "-";
  }

  if (typeof proximaComision === "number") {
    return `${(proximaComision * 100).toFixed(2)}%`;
  }

  return "-";
};


export const getNextBudget = (
  proximaComision: number | string,
  presupuestoActual: number,
  thresholdConfig?: CommissionThreshold[]
): number | null => {
  if (proximaComision === "NN" || typeof proximaComision !== "number") {
    return null;
  }

  const DEFAULT_THRESHOLDS = [
    { min_compliance: 90, pct_commission: 0.0035, name: "Muy Regular" },
    { min_compliance: 95, pct_commission: 0.005, name: "Regular" },
    { min_compliance: 100, pct_commission: 0.007, name: "Buena" },
    { min_compliance: 110, pct_commission: 0.01, name: "Excelente" },
  ];

  const umbrales =
    thresholdConfig && thresholdConfig.length > 0
      ? thresholdConfig
      : DEFAULT_THRESHOLDS;

  const umbralesOrdenados = [...umbrales].sort(
    (a, b) => a.pct_commission - b.pct_commission
  );

  const nextIndex = umbralesOrdenados.findIndex(
    (u) => Math.abs(u.pct_commission - proximaComision) < 0.0001
  );

  if (nextIndex === -1) {
    return null;
  }

  const factor = umbralesOrdenados[nextIndex].min_compliance / 100;

  return Math.round(presupuestoActual * factor * 100) / 100;
};


export const getNextSale = (
  proximoPresupuesto: number | null,
  ventaActual: number
): number | null => {
  if (proximoPresupuesto === null) {
    return null;
  }

  const proximaVenta = proximoPresupuesto - ventaActual;
  return Math.max(0, Math.round(proximaVenta * 100) / 100);
};


export const getNextCommissionAmount = (
  proximoPresupuesto: number | null,
  proximaComision: number | string
): number | null => {
  if (
    proximoPresupuesto === null ||
    proximaComision === "NN" ||
    typeof proximaComision !== "number"
  ) {
    return null;
  }

  const proximoMontoComision =
    (proximoPresupuesto * (proximaComision as number)) / 1.19;
  return Math.round(proximoMontoComision * 100) / 100;
};
