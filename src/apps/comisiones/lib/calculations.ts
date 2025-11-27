/**
 * Lógica de cálculos para comisiones, cumplimiento y presupuestos
 */

import { BudgetRecord, StaffMember, VentasData, EmployeeCommission, TiendaResumen, MesResumen, Role } from '../types';

const DECIMAL_PLACES = 2;

export const round = (value: number): number => {
  return Math.round(value * 100) / 100;
};

/**
 * Calcula el presupuesto para el gerente basado en el porcentaje fijo mensual
 */
export const calculateManagerBudget = (
  presupuesto_total: number,
  porcentaje_gerente: number
): number => {
  return round((presupuesto_total * porcentaje_gerente) / 100);
};

/**
 * Calcula el presupuesto para cada asesor
 */
export const calculateAdvisorBudget = (
  presupuesto_total: number,
  porcentaje_gerente: number,
  cantidad_asesores: number
): number => {
  if (cantidad_asesores === 0) return 0;
  const presupuesto_asesores = presupuesto_total * ((100 - porcentaje_gerente) / 100);
  return round(presupuesto_asesores / cantidad_asesores);
};

/**
 * Calcula el porcentaje de cumplimiento
 */
export const calculateCompliance = (ventas: number, presupuesto: number): number => {
  if (presupuesto === 0) return 0;
  return round((ventas / presupuesto) * 100);
};

/**
 * Obtiene el porcentaje de comisión según el rol y cumplimiento
 */
export const getCommissionPercentage = (role: Role, compliance: number): number => {
  if (role === 'gerente' || role === 'asesor') {
    if (compliance >= 110) return 1.0;
    if (compliance >= 100) return 0.7;
    if (compliance >= 95) return 0.35;
    return 0;
  } else if (role === 'cajero') {
    if (compliance >= 110) return 0.15;
    if (compliance >= 100) return 0.12;
    if (compliance >= 95) return 0.1;
    return 0;
  }
  return 0;
};

/**
 * Calcula el monto de comisión
 */
export const calculateCommissionAmount = (ventas: number, comision_pct: number): number => {
  return round((ventas * comision_pct) / 100);
};

/**
 * Obtiene el mes y año de una fecha (formato "MMM YYYY")
 */
export const getMonthYear = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00Z');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${month} ${year}`;
};

/**
 * Obtiene el mes actual en formato "MMM YYYY"
 */
export const getCurrentMonth = (): string => {
  const today = new Date();
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const month = months[today.getMonth()];
  const year = today.getFullYear();
  return `${month} ${year}`;
};

/**
 * Convierte un mes en formato "MMM YYYY" a timestamp para comparar
 */
const monthToTimestamp = (monthStr: string): number => {
  const [monthName, yearStr] = monthStr.split(' ');
  const monthMap: Record<string, number> = {
    'Ene': 0, 'Feb': 1, 'Mar': 2, 'Abr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Ago': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dic': 11
  };
  const month = monthMap[monthName];
  const year = parseInt(yearStr);
  return year * 12 + month; // Convertir a número comparable
};

/**
 * Obtiene todos los meses únicos disponibles en los datos ordenados cronológicamente
 */
export const getAvailableMonths = (budgets: BudgetRecord[]): string[] => {
  const months = new Set<string>();
  budgets.forEach(b => {
    months.add(getMonthYear(b.fecha));
  });
  return Array.from(months).sort((a, b) => monthToTimestamp(a) - monthToTimestamp(b));
};

/**
 * Filtra presupuestos por mes
 */
export const filterBudgetsByMonth = (budgets: BudgetRecord[], mes: string): BudgetRecord[] => {
  return budgets.filter(b => getMonthYear(b.fecha) === mes);
};

/**
 * Filtra personal por mes y tienda
 */
export const filterStaffByMonthAndTienda = (
  staff: StaffMember[],
  mes: string,
  tienda: string
): StaffMember[] => {
  return staff.filter(s => getMonthYear(s.fecha) === mes && s.tienda === tienda);
};

/**
 * Obtiene ventas para un empleado específico
 */
export const getEmployeeVentas = (
  ventasData: VentasData[],
  tienda: string,
  fecha: string,
  empleadoId: string
): number => {
  const venta = ventasData.find(v => v.tienda === tienda && v.fecha === fecha);
  if (!venta) return 0;
  return venta.ventas_por_asesor[empleadoId] || 0;
};

/**
 * Obtiene ventas totales de una tienda
 */
export const getTiendaVentas = (ventasData: VentasData[], tienda: string, fecha: string): number => {
  const venta = ventasData.find(v => v.tienda === tienda && v.fecha === fecha);
  return venta?.ventas_tienda || 0;
};

/**
 * Calcula las comisiones para un empleado
 */
export const calculateEmployeeCommission = (
  empleado: StaffMember,
  presupuesto: number,
  ventas: number
): EmployeeCommission => {
  const cumplimiento = calculateCompliance(ventas, presupuesto);
  const comision_pct = getCommissionPercentage(empleado.rol, cumplimiento);
  const comision_monto = calculateCommissionAmount(ventas, comision_pct);

  return {
    id: empleado.id,
    nombre: empleado.nombre,
    rol: empleado.rol,
    tienda: empleado.tienda,
    fecha: empleado.fecha,
    presupuesto: round(presupuesto),
    ventas: round(ventas),
    cumplimiento_pct: cumplimiento,
    comision_pct,
    comision_monto,
  };
};

/**
 * Calcula el resumen de comisiones para una tienda en una fecha específica
 */
export const calculateTiendaResumen = (
  tienda: string,
  fecha: string,
  budgets: BudgetRecord[],
  staff: StaffMember[],
  ventasData: VentasData[],
  porcentaje_gerente: number
): TiendaResumen => {
  const budget = budgets.find(b => b.tienda === tienda && b.fecha === fecha);
  if (!budget) {
    return {
      tienda,
      fecha,
      presupuesto_tienda: 0,
      ventas_tienda: 0,
      cumplimiento_tienda_pct: 0,
      empleados: [],
      total_comisiones: 0,
    };
  }

  const tiendaStaff = staff.filter(s => s.tienda === tienda && s.fecha === fecha);
  const tiendaVentas = getTiendaVentas(ventasData, tienda, fecha);

  // Contar asesores
  const cantidad_asesores = tiendaStaff.filter(s => s.rol === 'asesor').length;

  // Calcular comisiones por empleado
  const empleados: EmployeeCommission[] = tiendaStaff.map(empleado => {
    let presupuesto = 0;
    let ventas = 0;

    if (empleado.rol === 'gerente') {
      presupuesto = calculateManagerBudget(budget.presupuesto_total, porcentaje_gerente);
      ventas = tiendaVentas;
    } else if (empleado.rol === 'asesor') {
      presupuesto = calculateAdvisorBudget(budget.presupuesto_total, porcentaje_gerente, cantidad_asesores);
      ventas = getEmployeeVentas(ventasData, tienda, fecha, empleado.id);
    } else if (empleado.rol === 'cajero') {
      presupuesto = 0; // Cajero no tiene presupuesto asignado
      ventas = tiendaVentas;
    }

    return calculateEmployeeCommission(empleado, presupuesto, ventas);
  });

  const cumplimiento_tienda = calculateCompliance(tiendaVentas, budget.presupuesto_total);
  const total_comisiones = round(empleados.reduce((sum, e) => sum + e.comision_monto, 0));

  return {
    tienda,
    fecha,
    presupuesto_tienda: round(budget.presupuesto_total),
    ventas_tienda: round(tiendaVentas),
    cumplimiento_tienda_pct: cumplimiento_tienda,
    empleados,
    total_comisiones,
  };
};

/**
 * Calcula el resumen mensual de comisiones
 */
export const calculateMesResumen = (
  mes: string,
  budgets: BudgetRecord[],
  staff: StaffMember[],
  ventasData: VentasData[],
  porcentaje_gerente: number
): MesResumen => {
  const mesBudgets = filterBudgetsByMonth(budgets, mes);
  const tiendas = new Set<string>();
  mesBudgets.forEach(b => tiendas.add(b.tienda));

  const tiendaResumenes: TiendaResumen[] = [];
  tiendas.forEach(tienda => {
    // Cada tienda solo tiene una fecha por mes
    const tiendaBudget = mesBudgets.find(b => b.tienda === tienda);
    if (tiendaBudget) {
      const resumen = calculateTiendaResumen(
        tienda,
        tiendaBudget.fecha,
        budgets,
        staff,
        ventasData,
        porcentaje_gerente
      );
      tiendaResumenes.push(resumen);
    }
  });

  const total_comisiones = round(tiendaResumenes.reduce((sum, t) => sum + t.total_comisiones, 0));

  // Calcular comisiones por rol
  const comisiones_por_rol: Record<Role, number> = {
    gerente: 0,
    asesor: 0,
    cajero: 0,
  };

  tiendaResumenes.forEach(tienda => {
    tienda.empleados.forEach(empleado => {
      comisiones_por_rol[empleado.rol] += empleado.comision_monto;
    });
  });

  Object.keys(comisiones_por_rol).forEach(role => {
    comisiones_por_rol[role as Role] = round(comisiones_por_rol[role as Role]);
  });

  return {
    mes,
    tiendas: tiendaResumenes,
    total_comisiones,
    comisiones_por_rol,
  };
};

/**
 * Memoized version of calculateMesResumen to prevent unnecessary recalculations
 */
export const calculateMesResumenMemoized = (
  mes: string,
 budgets: BudgetRecord[],
  staff: StaffMember[],
  ventasData: VentasData[],
  porcentaje_gerente: number,
  deps: [string, BudgetRecord[], StaffMember[], VentasData[], number]
): MesResumen => {
  // Create a simple cache key based on dependencies
  const cacheKey = JSON.stringify({
    mes,
    budgets: budgets.map(b => `${b.tienda}-${b.fecha}-${b.presupuesto_total}`),
    staff: staff.map(s => `${s.id}-${s.nombre}-${s.tienda}-${s.fecha}-${s.rol}`),
    ventas: ventasData.map(v => `${v.tienda}-${v.fecha}-${v.ventas_tienda}`),
    porcentaje_gerente
  });

  // Use a simple cache for memoization
  if (!calculateMesResumenMemoized.cache) {
    calculateMesResumenMemoized.cache = new Map();
  }

  if (calculateMesResumenMemoized.cache.has(cacheKey)) {
    return calculateMesResumenMemoized.cache.get(cacheKey);
  }

 const result = calculateMesResumen(mes, budgets, staff, ventasData, porcentaje_gerente);
  calculateMesResumenMemoized.cache.set(cacheKey, result);
  return result;
};

// Initialize cache for the memoized function
calculateMesResumenMemoized.cache = new Map();

/**
 * Calcula el resumen mensual agrupado para una tienda
 */
export const calculateTiendaResumenMensual = (
  tienda: string,
  fechas: string[],
  presupuesto_mensual: number,
  ventas_mensuales: number,
  tiendaStaff: StaffMember[],
  ventasData: VentasData[],
  porcentaje_gerente: number
): TiendaResumen => {
  // Calcular presupuesto mensual para gerente
  const presupuesto_gerente_mensual = calculateManagerBudget(presupuesto_mensual, porcentaje_gerente);

  // Obtener empleados únicos (sin duplicados por fecha)
  const empleadosUnicos = new Map<string, StaffMember>();
  tiendaStaff.forEach(staff => {
    if (!empleadosUnicos.has(staff.id)) {
      empleadosUnicos.set(staff.id, staff);
    }
  });

  // Calcular ventas mensuales por empleado
  const empleados: EmployeeCommission[] = Array.from(empleadosUnicos.values()).map(empleado => {
    let presupuesto = 0;
    let ventas = 0;

    if (empleado.rol === 'gerente') {
      presupuesto = presupuesto_gerente_mensual;
      ventas = ventas_mensuales;
    } else if (empleado.rol === 'asesor') {
      // Calcular presupuesto mensual para asesores
      const cantidad_asesores = Array.from(empleadosUnicos.values()).filter(e => e.rol === 'asesor').length;
      presupuesto = calculateAdvisorBudget(presupuesto_mensual, porcentaje_gerente, cantidad_asesores);

      // Sumar ventas mensuales del asesor
      ventas = round(fechas.reduce((sum, fecha) =>
        sum + getEmployeeVentas(ventasData, tienda, fecha, empleado.id), 0));
    } else if (empleado.rol === 'cajero') {
      presupuesto = 0; // Cajero no tiene presupuesto asignado
      ventas = ventas_mensuales;
    }

    return calculateEmployeeCommission(empleado, presupuesto, ventas);
  });

  const cumplimiento_tienda = calculateCompliance(ventas_mensuales, presupuesto_mensual);
  const total_comisiones = round(empleados.reduce((sum, e) => sum + e.comision_monto, 0));

  return {
    tienda,
    fecha: fechas[0], // Usar la primera fecha como referencia
    presupuesto_tienda: presupuesto_mensual,
    ventas_tienda: ventas_mensuales,
    cumplimiento_tienda_pct: cumplimiento_tienda,
    empleados,
    total_comisiones,
  };
};
