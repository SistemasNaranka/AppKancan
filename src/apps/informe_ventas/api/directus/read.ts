import directus from "@/services/directus/directus";
import { readItems } from "@directus/sdk";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";

/**
 * Interfaz para el presupuesto diario de empleado desde Directus
 */
export interface PresupuestoDiarioEmpleado {
  asesor: number; // Código del asesor
  fecha: string;
  presupuesto: number;
}

/**
 * Obtener presupuestos diarios de empleados por rango de fechas
 *
 * @param fechaInicio - Fecha de inicio (YYYY-MM-DD)
 * @param fechaFin - Fecha de fin (YYYY-MM-DD)
 * @returns Lista de presupuestos diarios de empleados
 */
export async function obtenerPresupuestosEmpleados(
  fechaInicio?: string,
  fechaFin?: string,
): Promise<PresupuestoDiarioEmpleado[]> {
  try {
    const filter: any = {};

    // Filtrar por rango de fechas si se proporciona
    if (fechaInicio && fechaFin) {
      filter.fecha = { _between: [fechaInicio, fechaFin] };
    }

    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("presupuesto_diario_empleados", {
          fields: ["asesor", "fecha", "presupuesto"],
          filter,
          limit: -1,
        }),
      ),
    );

    return data as PresupuestoDiarioEmpleado[];
  } catch (error) {
    console.error("Error al obtener presupuestos de empleados:", error);
    return [];
  }
}

/**
 * Obtener presupuestos de empleados para un mes específico
 *
 * @param mesSeleccionado - Mes en formato "MMM YYYY" (ej: "Ene 2024")
 * @returns Lista de presupuestos diarios de empleados
 */
export async function obtenerPresupuestosEmpleadosPorMes(
  mesSeleccionado: string,
): Promise<PresupuestoDiarioEmpleado[]> {
  try {
    // Convertir el mes a formato de fecha
    const [mesNombre, anio] = mesSeleccionado.split(" ");
    const mesMap: { [key: string]: string } = {
      Ene: "01",
      Feb: "02",
      Mar: "03",
      Abr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Ago: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dic: "12",
    };

    const mesNumero = mesMap[mesNombre];
    if (!mesNumero) {
      console.error("Mes inválido:", mesNombre);
      return [];
    }

    // Calcular el primer y último día del mes
    const fechaInicio = `${anio}-${mesNumero}-01`;
    const ultimoDia = new Date(
      parseInt(anio),
      parseInt(mesNumero),
      0,
    ).getDate();
    const fechaFin = `${anio}-${mesNumero}-${String(ultimoDia).padStart(2, "0")}`;

    return await obtenerPresupuestosEmpleados(fechaInicio, fechaFin);
  } catch (error) {
    console.error("Error al obtener presupuestos de empleados por mes:", error);
    return [];
  }
}

/**
 * Calcula el presupuesto distribuido por línea de venta para un empleado
 *
 * @param presupuestoTotal - Presupuesto total del empleado
 * @returns Objeto con los presupuestos por línea de venta
 */
export function distribuirPresupuesto(presupuestoTotal: number): {
  presupuesto_coleccion: number;
  presupuesto_basicos: number;
  presupuesto_promocion: number;
} {
  // Porcentajes de distribución
  const PORCENTAJE_COLECCION = 0.6; // 60%
  const PORCENTAJE_BASICOS = 0.2; // 20%
  const PORCENTAJE_PROMOCION = 0.2; // 20%

  return {
    presupuesto_coleccion: Math.round(presupuestoTotal * PORCENTAJE_COLECCION),
    presupuesto_basicos: Math.round(presupuestoTotal * PORCENTAJE_BASICOS),
    presupuesto_promocion: Math.round(presupuestoTotal * PORCENTAJE_PROMOCION),
  };
}

/**
 * Agrega los presupuestos de empleados por código de asesor
 *
 * @param presupuestos - Lista de presupuestos diarios
 * @returns Mapa de código de asesor -> presupuesto total
 */
export function agregarPresupuestosPorAsesor(
  presupuestos: PresupuestoDiarioEmpleado[],
): Map<number, number> {
  const presupuestosPorAsesor = new Map<number, number>();

  presupuestos.forEach((p) => {
    const presupuestoActual = presupuestosPorAsesor.get(p.asesor) || 0;
    presupuestosPorAsesor.set(p.asesor, presupuestoActual + p.presupuesto);
  });

  return presupuestosPorAsesor;
}

// ==================== UMBRALES DE COMISIONES ====================

/**
 * Interfaz para un umbral de comisión
 */
export interface CommissionThreshold {
  cumplimiento_min: number;
  comision_pct: number;
  nombre?: string;
}

/**
 * Interfaz para la configuración de umbrales de comisión
 */
export interface CommissionThresholdConfig {
  id: number;
  mes: string;
  anio: string;
  cumplimiento_valores: CommissionThreshold[];
}

/**
 * Valores por defecto para umbrales de comisión (hardcodeados)
 * Se usan cuando no hay configuración en la base de datos
 */
const DEFAULT_THRESHOLDS: CommissionThreshold[] = [
  {
    cumplimiento_min: 90,
    comision_pct: 0.0035,
    nombre: "Muy Regular",
  },
  {
    cumplimiento_min: 95,
    comision_pct: 0.005,
    nombre: "Regular",
  },
  {
    cumplimiento_min: 100,
    comision_pct: 0.007,
    nombre: "Buena",
  },
  {
    cumplimiento_min: 110,
    comision_pct: 0.01,
    nombre: "Excelente",
  },
];

/**
 * Obtener configuración de umbrales de comisión para un mes específico
 * @param mesAnio - Formato "MMM YYYY" (ej: "Ene 2026")
 * @returns CommissionThresholdConfig o null si no existe
 */
export async function obtenerUmbralesComisiones(
  mesAnio?: string,
): Promise<CommissionThresholdConfig | null> {
  try {
    const filter: any = {};

    if (mesAnio) {
      const [mesNombre, anio] = mesAnio.split(" ");
      const mesMap: { [key: string]: string } = {
        Ene: "01",
        Feb: "02",
        Mar: "03",
        Abr: "04",
        May: "05",
        Jun: "06",
        Jul: "07",
        Ago: "08",
        Sep: "09",
        Oct: "10",
        Nov: "11",
        Dic: "12",
      };
      const mesNumero = mesMap[mesNombre];
      if (mesNumero) {
        filter.mes = { _eq: mesNumero };
        filter.anio = { _eq: anio };
      }
    }

    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("cumplimiento_mensual_comisiones", {
          fields: ["id", "mes", "anio", "cumplimiento_valores"],
          filter,
          sort: ["-anio", "-mes"],
          limit: 1,
        }),
      ),
    );

    if (!data || data.length === 0) {
      return null;
    }

    const item = data[0] as any;

    // Convertir a formato de configuración
    const mesesLabels: { [key: string]: string } = {
      "01": "Ene",
      "02": "Feb",
      "03": "Mar",
      "04": "Abr",
      "05": "May",
      "06": "Jun",
      "07": "Jul",
      "08": "Ago",
      "09": "Sep",
      "10": "Oct",
      "11": "Nov",
      "12": "Dic",
    };

    return {
      id: item.id,
      mes: `${mesesLabels[item.mes]} ${item.anio}`,
      anio: item.anio,
      cumplimiento_valores: item.cumplimiento_valores || [],
    };
  } catch (error: any) {
    // Si la colección no existe o hay error, retornar null para usar valores por defecto
    if (error.response?.status === 404) {
      return null;
    }
    console.error("Error al obtener umbrales de comisiones:", error);
    return null;
  }
}

/**
 * Calcula la venta base sin IVA para comisión
 * @param venta_total - Venta total con IVA
 * @returns Venta sin IVA
 */
export const calculateBaseSale = (venta_total: number): number => {
  return Math.round(venta_total / 1.19);
};

/**
 * Calcula el porcentaje de cumplimiento
 * @param ventas - Venta sin IVA
 * @param presupuesto - Presupuesto
 * @returns Porcentaje de cumplimiento
 */
export const calculateCompliance = (
  ventas: number,
  presupuesto: number,
): number => {
  if (presupuesto === 0) return 0;
  return Math.round((ventas / presupuesto) * 100 * 100) / 100;
};

/**
 * Obtiene el porcentaje de comisión según cumplimiento
 * @param compliance - Porcentaje de cumplimiento (ej: 92.5)
 * @param thresholdConfig - Configuración de umbrales (opcional)
 * @returns Porcentaje de comisión en formato decimal
 */
export const getCommissionPercentage = (
  compliance: number,
  thresholdConfig?: CommissionThreshold[],
): number => {
  // Usar configuración proporcionada o valores por defecto
  const umbrales =
    thresholdConfig && thresholdConfig.length > 0
      ? thresholdConfig
      : DEFAULT_THRESHOLDS;

  // Ordenar por cumplimiento_min descendente para encontrar el umbral correcto
  const umbral = umbrales
    .sort((a, b) => b.cumplimiento_min - a.cumplimiento_min)
    .find((u) => compliance >= u.cumplimiento_min);

  return umbral?.comision_pct || 0;
};

/**
 * Calcula el monto de comisión basado en venta sin IVA
 * @param venta_sin_iva - Venta sin IVA
 * @param comision_pct - Porcentaje de comisión en formato decimal (ej: 0.0035)
 * @returns Monto de comisión
 */
export const calculateCommissionAmount = (
  venta_sin_iva: number,
  comision_pct: number,
): number => {
  return Math.round(venta_sin_iva * comision_pct);
};

/**
 * Calcula la comisión para una línea de venta específica
 * @param venta - Venta total de la línea
 * @param presupuesto - Presupuesto de la línea
 * @param thresholdConfig - Configuración de umbrales (opcional)
 * @returns Objeto con cumplimiento y monto de comisión
 */
export const calculateLineCommission = (
  venta: number,
  presupuesto: number,
  thresholdConfig?: CommissionThreshold[],
): { cumplimiento: number; comision: number } => {
  // 1. Calcular venta sin IVA
  const venta_sin_iva = calculateBaseSale(venta);

  // 2. Calcular cumplimiento
  const cumplimiento = calculateCompliance(venta_sin_iva, presupuesto);

  // 3. Obtener porcentaje de comisión
  const comision_pct = getCommissionPercentage(cumplimiento, thresholdConfig);

  // 4. Calcular monto de comisión
  const comision = calculateCommissionAmount(venta_sin_iva, comision_pct);

  return { cumplimiento, comision };
};
