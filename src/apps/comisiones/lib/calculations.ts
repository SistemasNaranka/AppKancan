/**
 * Lógica de cálculos para comisiones, cumplimiento y presupuestos
 */

import {
  BudgetRecord,
  StaffMember,
  VentasData,
  EmployeeCommission,
  TiendaResumen,
  MesResumen,
  Role,
} from "../types";
import { calcularDiasLaboradosPorEmpleado } from "./utils";

export const round = (value: number): number => {
  return Math.round(value * 100) / 100;
};

/**
 * Calcula presupuestos diarios con sistema fijo/distributivo
 */
export const calculateBudgetsWithFixedDistributive = (
  presupuesto_total: number,
  porcentajes: {
    gerente_tipo: "fijo" | "distributivo";
    gerente_porcentaje: number;
    asesor_tipo: "fijo" | "distributivo";
    asesor_porcentaje: number;
    cajero_tipo: "fijo" | "distributivo";
    cajero_porcentaje: number;
    logistico_tipo: "fijo" | "distributivo";
    logistico_porcentaje: number;
  },
  empleadosPorRol: {
    gerente: number;
    asesor: number;
    cajero: number;
    logistico: number;
  }
): { [rol: string]: number } => {
  const presupuestos: { [rol: string]: number } = {
    gerente: 0,
    asesor: 0,
    cajero: 0,
    logistico: 0,
  };

  let presupuestoRestante = presupuesto_total;

  // 1. Calcular fijos primero
  if (porcentajes.gerente_tipo === "fijo" && empleadosPorRol.gerente > 0) {
    const presupuestoGerente = round(
      (presupuesto_total * porcentajes.gerente_porcentaje) / 100
    );
    presupuestos.gerente = presupuestoGerente;
    presupuestoRestante -= presupuestoGerente;
  }

  if (porcentajes.cajero_tipo === "fijo" && empleadosPorRol.cajero > 0) {
    const presupuestoCajero = round(
      (presupuesto_total * porcentajes.cajero_porcentaje) / 100
    );
    presupuestos.cajero = presupuestoCajero;
    presupuestoRestante -= presupuestoCajero;
  }

  // 2. Calcular distributivos con el presupuesto restante
  const distributivos: string[] = [];

  if (
    porcentajes.gerente_tipo === "distributivo" &&
    empleadosPorRol.gerente > 0
  ) {
    distributivos.push("gerente");
  }
  if (
    porcentajes.asesor_tipo === "distributivo" &&
    empleadosPorRol.asesor > 0
  ) {
    distributivos.push("asesor");
  }
  if (
    porcentajes.cajero_tipo === "distributivo" &&
    empleadosPorRol.cajero > 0
  ) {
    distributivos.push("cajero");
  }
  if (
    porcentajes.logistico_tipo === "distributivo" &&
    empleadosPorRol.logistico > 0
  ) {
    distributivos.push("logistico");
  }

  // Distribuir presupuesto restante entre todos los empleados de roles distributivos
  let totalEmpleadosDistributivos = 0;
  distributivos.forEach((rol) => {
    totalEmpleadosDistributivos +=
      empleadosPorRol[rol as keyof typeof empleadosPorRol];
  });

  if (totalEmpleadosDistributivos > 0) {
    const presupuestoPorEmpleado = round(
      presupuestoRestante / totalEmpleadosDistributivos
    );

    distributivos.forEach((rol) => {
      const cantidadEmpleados =
        empleadosPorRol[rol as keyof typeof empleadosPorRol];
      presupuestos[rol] = presupuestoPorEmpleado * cantidadEmpleados;
    });
  }

  return presupuestos;
};

/**
 * Calcula el presupuesto para el gerente basado en el porcentaje fijo mensual (LEGACY)
 */
export const calculateManagerBudget = (
  presupuesto_total: number,
  porcentaje_gerente: number
): number => {
  return round((presupuesto_total * porcentaje_gerente) / 100);
};

/**
 * Calcula el presupuesto para cada asesor (LEGACY)
 */
export const calculateAdvisorBudget = (
  presupuesto_total: number,
  porcentaje_gerente: number,
  cantidad_asesores: number
): number => {
  if (cantidad_asesores === 0) return 0;
  const presupuesto_asesores =
    presupuesto_total * ((100 - porcentaje_gerente) / 100);
  return round(presupuesto_asesores / cantidad_asesores);
};

/**
 * Calcula el porcentaje de cumplimiento
 */
export const calculateCompliance = (
  ventas: number,
  presupuesto: number
): number => {
  if (presupuesto === 0) return 0;
  // Mantener más precisión para cálculos, redondear solo a 4 decimales para mostrar
  return Math.round((ventas / presupuesto) * 100 * 10000) / 10000;
};

/**
 * Calcula venta base sin IVA para comisión
 */
export const calculateBaseSale = (
  venta_total: number,
  iva_factor: number = 1.19
): number => {
  return round(venta_total / iva_factor);
};

/**
 * Obtiene el porcentaje de comisión según cumplimiento (corregida)
 * Los decimales son importantes para los cálculos
 */
export const getCommissionPercentage = (compliance: number): number => {
  if (compliance >= 110.0) return 0.01; // Excelente: 1.00%
  if (compliance >= 100.0) return 0.007; // Buena: 0.70%
  if (compliance >= 95.0) return 0.0035; // Regular: 0.35%
  return 0; // Sin comisión
};

/**
 * Calcula el monto de comisión basado en venta sin IVA
 * comision_pct ya viene en formato decimal (ej: 0.0035 para 0.35%)
 */
export const calculateCommissionAmount = (
  venta_sin_iva: number,
  comision_pct: number
): number => {
  return round(venta_sin_iva * comision_pct);
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
const monthToTimestamp = (monthStr: string): number => {
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
 * Obtiene todos los meses únicos disponibles en los datos ordenados cronológicamente
 */
export const getAvailableMonths = (budgets: BudgetRecord[]): string[] => {
  const months = new Set<string>();
  budgets.forEach((b) => {
    months.add(getMonthYear(b.fecha));
  });
  return Array.from(months).sort(
    (a, b) => monthToTimestamp(a) - monthToTimestamp(b)
  );
};

/**
 * Filtra presupuestos por mes
 */
export const filterBudgetsByMonth = (
  budgets: BudgetRecord[],
  mes: string
): BudgetRecord[] => {
  return budgets.filter((b) => getMonthYear(b.fecha) === mes);
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
  if (!Array.isArray(ventasData)) {
    return 0;
  }
  const venta = ventasData.find(
    (v) => v.tienda === tienda && v.fecha === fecha
  );
  if (!venta) return 0;
  return venta.ventas_por_asesor[empleadoId] || 0;
};

/**
 * Obtiene ventas totales de una tienda
 */
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

/**
 * Calcula las comisiones para un empleado
 */
export const calculateEmployeeCommission = (
  empleado: StaffMember,
  presupuesto: number,
  ventas: number
): EmployeeCommission => {
  const cumplimiento = calculateCompliance(ventas, presupuesto);
  const venta_sin_iva = calculateBaseSale(ventas);
  const comision_pct = getCommissionPercentage(cumplimiento);
  const comision_monto = calculateCommissionAmount(venta_sin_iva, comision_pct);

  return {
    id: empleado.id,
    nombre: empleado.nombre,
    rol: empleado.rol,
    tienda: empleado.tienda,
    fecha: empleado.fecha,
    presupuesto: presupuesto, // Mantener precisión para cálculos
    ventas: ventas, // Mantener precisión para cálculos
    cumplimiento_pct: cumplimiento,
    comision_pct,
    comision_monto,
    dias_laborados: 1, // Por defecto 1 día para funciones individuales
  };
};

/**
 * Calcula las comisiones para cajeros
 * Lógica especial: comisión basada en el rendimiento general de la tienda,
 * dividida entre TODOS los empleados que trabajaron en la tienda.
 * Muestra ventas individuales registradas en venta_diaria_empleado (o 0 si no tienen)
 * y presupuesto individual asignado (o 0 si no tienen) en la vista, pero calcula comisión colectiva.
 */
export const calculateCajeroCommission = (
  empleado: StaffMember,
  ventasTiendaTotal: number,
  presupuestoTiendaTotal: number,
  cantidadEmpleadosRol: number,
  ventasIndividualesEmpleado: number = 0,
  presupuestoIndividualEmpleado: number = 0
): EmployeeCommission => {
  // Calcular cumplimiento de la tienda
  const cumplimientoTienda = calculateCompliance(
    ventasTiendaTotal,
    presupuestoTiendaTotal
  );

  // Obtener porcentaje de comisión basado en cumplimiento de la tienda
  const comision_pct = getCommissionPercentage(cumplimientoTienda);

  // Calcular venta base sin IVA de la tienda
  const ventaTiendaSinIVA = calculateBaseSale(ventasTiendaTotal);

  // Dividir la venta sin IVA entre TODOS los empleados de la tienda
  const ventaBasePorEmpleado =
    cantidadEmpleadosRol > 0 ? ventaTiendaSinIVA / cantidadEmpleadosRol : 0;

  // Calcular comisión: (venta_sin_iva / cantidad_empleados) * porcentaje_comision
  const comision_monto = calculateCommissionAmount(
    ventaBasePorEmpleado,
    comision_pct
  );

  return {
    id: empleado.id,
    nombre: empleado.nombre,
    rol: empleado.rol,
    tienda: empleado.tienda,
    fecha: empleado.fecha,
    presupuesto: presupuestoIndividualEmpleado, // Muestran presupuesto individual (o 0)
    ventas: ventasIndividualesEmpleado, // Muestran ventas individuales (o 0)
    cumplimiento_pct: cumplimientoTienda, // Muestran cumplimiento de la tienda para cálculo
    comision_pct,
    comision_monto,
    dias_laborados: 1, // Por defecto 1 día para funciones individuales
  };
};

/**
 * Calcula las comisiones para logísticos
 * Lógica especial: comisión basada en el rendimiento general de la tienda,
 * dividida entre TODOS los empleados que trabajaron en la tienda.
 * Muestra ventas individuales registradas en venta_diaria_empleado (o 0 si no tienen)
 * y presupuesto individual asignado (o 0 si no tienen) en la vista, pero calcula comisión colectiva.
 */
export const calculateLogisticoCommission = (
  empleado: StaffMember,
  ventasTiendaTotal: number,
  presupuestoTiendaTotal: number,
  cantidadEmpleadosRol: number,
  ventasIndividualesEmpleado: number = 0,
  presupuestoIndividualEmpleado: number = 0
): EmployeeCommission => {
  // Calcular cumplimiento de la tienda
  const cumplimientoTienda = calculateCompliance(
    ventasTiendaTotal,
    presupuestoTiendaTotal
  );

  // Obtener porcentaje de comisión basado en cumplimiento de la tienda
  const comision_pct = getCommissionPercentage(cumplimientoTienda);

  // Calcular venta base sin IVA de la tienda
  const ventaTiendaSinIVA = calculateBaseSale(ventasTiendaTotal);

  // Dividir la venta sin IVA entre TODOS los empleados de la tienda
  const ventaBasePorEmpleado =
    cantidadEmpleadosRol > 0 ? ventaTiendaSinIVA / cantidadEmpleadosRol : 0;

  // Calcular comisión: (venta_sin_iva / cantidad_empleados) * porcentaje_comision
  const comision_monto = calculateCommissionAmount(
    ventaBasePorEmpleado,
    comision_pct
  );

  return {
    id: empleado.id,
    nombre: empleado.nombre,
    rol: empleado.rol,
    tienda: empleado.tienda,
    fecha: empleado.fecha,
    presupuesto: presupuestoIndividualEmpleado, // Muestran presupuesto individual (o 0)
    ventas: ventasIndividualesEmpleado, // Muestran ventas individuales (o 0)
    cumplimiento_pct: cumplimientoTienda, // Muestran cumplimiento de la tienda para cálculo
    comision_pct,
    comision_monto,
    dias_laborados: 1, // Por defecto 1 día para funciones individuales
  };
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 */
const getCurrentDate = (): string => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Verifica si un mes es el mes actual
 */
const isCurrentMonth = (mes: string): boolean => {
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

export const calculateMesResumenAgrupado = (
  mes: string,
  budgets: BudgetRecord[],
  staff: StaffMember[],
  ventasData: VentasData[],
  porcentaje_gerente: number,
  presupuestosEmpleados?: any[]
): MesResumen => {
  // Validar datos
  if (!Array.isArray(ventasData)) {
    ventasData = [];
  }

  // 🚀 NUEVO: Determinar fecha límite según si es mes actual o no
  const fechaLimite = isCurrentMonth(mes) ? getCurrentDate() : null;

  console.log(
    `📅 [CÁLCULO] Mes: ${mes}, Es actual: ${isCurrentMonth(
      mes
    )}, Fecha límite: ${fechaLimite || "Todo el mes"}`
  );

  // Filtrar presupuestos del mes
  const mesBudgets = filterBudgetsByMonth(budgets, mes);

  // 🚀 NUEVO: Si es mes actual, filtrar solo hasta la fecha actual
  const mesBudgetsFiltrados = fechaLimite
    ? mesBudgets.filter((b) => b.fecha <= fechaLimite)
    : mesBudgets;

  console.log(
    `📊 [CÁLCULO] Presupuestos originales: ${mesBudgets.length}, Filtrados: ${mesBudgetsFiltrados.length}`
  );

  // Identificar empleados multitarea basados en staff
  const empleadosMultitienda = new Map<string, Set<string>>();
  staff.forEach((empleado) => {
    if (getMonthYear(empleado.fecha) !== mes) return;
    if (!empleadosMultitienda.has(empleado.id)) {
      empleadosMultitienda.set(empleado.id, new Set());
    }
    empleadosMultitienda.get(empleado.id)!.add(empleado.tienda);
  });

  // NO consolidar empleados - cada empleado aparece en cada tienda donde trabajó
  // con los valores específicos que generó en esa tienda

  if (mesBudgetsFiltrados.length === 0) {
    return {
      mes,
      tiendas: [],
      total_comisiones: 0,
      comisiones_por_rol: { gerente: 0, asesor: 0, cajero: 0, logistico: 0 },
    };
  }

  // 🚀 NUEVO: Filtrar staff también por fecha límite si es mes actual
  const staffFiltrado = fechaLimite
    ? staff.filter(
        (s) => getMonthYear(s.fecha) === mes && s.fecha <= fechaLimite
      )
    : staff.filter((s) => getMonthYear(s.fecha) === mes);

  // 🚀 NUEVO: Filtrar ventas también por fecha límite si es mes actual
  const ventasFiltradas = fechaLimite
    ? ventasData.filter(
        (v) => getMonthYear(v.fecha) === mes && v.fecha <= fechaLimite
      )
    : ventasData.filter((v) => getMonthYear(v.fecha) === mes);

  console.log(
    `👥 [CÁLCULO] Staff original: ${
      staff.filter((s) => getMonthYear(s.fecha) === mes).length
    }, Filtrado: ${staffFiltrado.length}`
  );
  console.log(
    `💰 [CÁLCULO] Ventas original: ${
      ventasData.filter((v) => getMonthYear(v.fecha) === mes).length
    }, Filtradas: ${ventasFiltradas.length}`
  );

  // Obtener todas las tiendas únicas de budgets, staff y ventas
  const todasTiendas = new Set<string>();
  mesBudgetsFiltrados.forEach((b) => todasTiendas.add(b.tienda));
  staffFiltrado.forEach((s) => todasTiendas.add(s.tienda));
  ventasFiltradas.forEach((v) => todasTiendas.add(v.tienda));

  // Agrupar por TIENDA
  const tiendasMap = new Map<
    string,
    {
      tienda: string;
      tienda_id: number;
      empresa: string;
      fechas: string[];
      presupuestoTotal: number;
      ventasTotal: number;
      empleadosPorDia: Map<string, StaffMember[]>; // fecha -> empleados
      ventasPorDia: Map<string, VentasData>; // fecha -> ventas
    }
  >();

  // Paso 1: Inicializar tiendas
  todasTiendas.forEach((tienda) => {
    const budgetTienda = mesBudgets.find((b) => b.tienda === tienda);
    tiendasMap.set(tienda, {
      tienda,
      tienda_id: budgetTienda?.tienda_id || 0,
      empresa: budgetTienda?.empresa || "",
      fechas: [],
      presupuestoTotal: 0,
      ventasTotal: 0,
      empleadosPorDia: new Map(),
      ventasPorDia: new Map(),
    });
  });

  // Paso 2: Agrupar presupuestos por tienda
  mesBudgets.forEach((budget) => {
    const tiendaData = tiendasMap.get(budget.tienda)!;

    // Solo agregar fecha si no existe ya (evitar duplicados)
    if (!tiendaData.fechas.includes(budget.fecha)) {
      tiendaData.fechas.push(budget.fecha);

      // Validar que el presupuesto sea un número válido
      const presupuestoValido =
        typeof budget.presupuesto_total === "number" &&
        !isNaN(budget.presupuesto_total) &&
        budget.presupuesto_total >= 0;

      if (presupuestoValido) {
        tiendaData.presupuestoTotal += budget.presupuesto_total;
      }
    }
  });

  // Paso 2: Agrupar staff por tienda y fecha
  staff.forEach((empleado) => {
    if (getMonthYear(empleado.fecha) !== mes) return;

    const tiendaData = tiendasMap.get(empleado.tienda);
    if (!tiendaData) {
      return;
    }

    if (!tiendaData.empleadosPorDia.has(empleado.fecha)) {
      tiendaData.empleadosPorDia.set(empleado.fecha, []);
    }
    tiendaData.empleadosPorDia.get(empleado.fecha)!.push(empleado);
  });

  // Paso 3: Agrupar ventas por tienda y fecha
  ventasData.forEach((venta) => {
    if (getMonthYear(venta.fecha) !== mes) return;

    const tiendaData = tiendasMap.get(venta.tienda);
    if (!tiendaData) {
      return;
    }

    tiendaData.ventasPorDia.set(venta.fecha, venta);
    tiendaData.ventasTotal += venta.ventas_tienda;
  });

  // Paso 4: Calcular comisiones para cada tienda
  const tiendaResumenes: TiendaResumen[] = [];

  tiendasMap.forEach((tiendaData) => {
    // Obtener empleados únicos del mes (un empleado puede aparecer en múltiples días)
    const empleadosUnicos = new Map<
      string,
      {
        empleado: StaffMember;
        presupuestoMensual: number;
        ventasMensual: number;
        diasTrabajados: string[];
      }
    >();

    // Recorrer cada día de la tienda
    tiendaData.empleadosPorDia.forEach((empleadosDia, fecha) => {
      empleadosDia.forEach((empleado) => {
        // Cada empleado aparece en cada tienda donde trabajó
        // Creamos una entrada única por empleado en esta tienda
        const empleadoKey = `${empleado.id}_${tiendaData.tienda}`;

        if (!empleadosUnicos.has(empleadoKey)) {
          empleadosUnicos.set(empleadoKey, {
            empleado: { ...empleado, tienda: tiendaData.tienda }, // Asegurar que tenga la tienda correcta
            presupuestoMensual: 0,
            ventasMensual: 0,
            diasTrabajados: [],
          });
        }

        const empleadoData = empleadosUnicos.get(empleadoKey)!;
        empleadoData.diasTrabajados.push(fecha);

        // Calcular presupuesto usando lógica tradicional (como estaba antes)
        if (empleadoData.presupuestoMensual === 0) {
          // Buscar TODOS los presupuestos diarios asignados para este empleado en esta tienda específica durante el mes
          const presupuestosEmpleadoTienda =
            presupuestosEmpleados?.filter(
              (pe) =>
                pe.asesor.toString() === empleado.id.toString() &&
                pe.tienda_id === tiendaData.tienda_id &&
                getMonthYear(pe.fecha) === mes
            ) || [];

          if (presupuestosEmpleadoTienda.length > 0) {
            // Sumar TODOS los presupuestos diarios de este empleado en esta tienda durante el mes
            empleadoData.presupuestoMensual = presupuestosEmpleadoTienda.reduce(
              (sum, pe) => sum + (parseFloat(pe.presupuesto) || 0),
              0
            );
          } else {
            // Calcular presupuesto usando lógica tradicional
            if (empleado.rol === "gerente") {
              empleadoData.presupuestoMensual = calculateManagerBudget(
                tiendaData.presupuestoTotal,
                porcentaje_gerente
              );
            } else if (empleado.rol === "asesor") {
              // Contar asesores únicos en esta tienda
              const cantidadAsesoresTienda = empleadosUnicos.size;
              empleadoData.presupuestoMensual = calculateAdvisorBudget(
                tiendaData.presupuestoTotal,
                porcentaje_gerente,
                cantidadAsesoresTienda
              );
            } else if (
              empleado.rol === "cajero" ||
              empleado.rol === "logistico"
            ) {
              empleadoData.presupuestoMensual = 0; // Cajeros y logísticos no tienen presupuesto asignado
            }
          }
        }

        // Sumar ventas del empleado SOLO en la tienda actual
        // Datos reales de venta_diaria_empleado filtrados por tienda_id
        if (empleadoData.ventasMensual === 0) {
          // Solo calcular si no se ha hecho ya
          tiendaData.ventasPorDia.forEach((ventasDia, fechaDia) => {
            if (empleado.rol === "cajero" || empleado.rol === "logistico") {
              // Cajero/Logístico: buscar ventas individuales registradas en venta_diaria_empleado
              // Si no tienen ventas registradas, ventasEmpleado será 0
              const ventasEmpleado =
                ventasDia.ventas_por_asesor[empleado.id] || 0;
              empleadoData.ventasMensual += ventasEmpleado;
            } else {
              // Gerente, asesor: sus ventas individuales por día
              const ventasEmpleado =
                ventasDia.ventas_por_asesor[empleado.id] || 0;
              empleadoData.ventasMensual += ventasEmpleado;
            }
          });
        }
      });
    });

    // Calcular comisiones para cada empleado
    const empleadosComisiones: EmployeeCommission[] = [];

    empleadosUnicos.forEach((empleadoData) => {
      const { empleado, presupuestoMensual, ventasMensual, diasTrabajados } =
        empleadoData;

      let empleadoComision: EmployeeCommission;

      if (empleado.rol === "cajero") {
        // Cajeros: comisión basada en rendimiento de la tienda
        // Contar TODOS los empleados que trabajaron en la tienda durante el mes
        const totalEmpleadosTienda = empleadosUnicos.size;

        empleadoComision = calculateCajeroCommission(
          empleado,
          tiendaData.ventasTotal,
          tiendaData.presupuestoTotal,
          totalEmpleadosTienda,
          empleadoData.ventasMensual, // Ventas individuales registradas (o 0 si no tienen)
          empleadoData.presupuestoMensual // Presupuesto individual del empleado
        );
      } else if (empleado.rol === "logistico") {
        // Logísticos: comisión basada en rendimiento de la tienda
        // Contar TODOS los empleados que trabajaron en la tienda durante el mes
        const totalEmpleadosTienda = empleadosUnicos.size;

        empleadoComision = calculateLogisticoCommission(
          empleado,
          tiendaData.ventasTotal,
          tiendaData.presupuestoTotal,
          totalEmpleadosTienda,
          empleadoData.ventasMensual, // Ventas individuales registradas (o 0 si no tienen)
          empleadoData.presupuestoMensual // Presupuesto individual del empleado
        );
      } else {
        // Gerentes y asesores: lógica tradicional
        // Calcular cumplimiento individual
        const cumplimientoIndividual = calculateCompliance(
          ventasMensual,
          presupuestoMensual
        );

        // Para GERENTE: usar cumplimiento de la tienda para calcular comisión
        // pero mostrar sus ventas individuales
        let cumplimientoParaComision = cumplimientoIndividual;
        let ventaBaseParaComision = calculateBaseSale(ventasMensual);

        if (empleado.rol === "gerente") {
          // Gerente usa cumplimiento de la tienda para calcular comisión
          // pero muestra sus ventas individuales (no las de la tienda)
          const cumplimientoTienda = calculateCompliance(
            tiendaData.ventasTotal,
            tiendaData.presupuestoTotal
          );
          cumplimientoParaComision = cumplimientoTienda;
          // Nota: ventaBaseParaComision se mantiene como ventasMensual para gerentes
          // Los cálculos de comisión usan el cumplimiento de la tienda
        }

        const comision_pct = getCommissionPercentage(cumplimientoParaComision);
        const comision_monto = calculateCommissionAmount(
          ventaBaseParaComision,
          comision_pct
        );

        empleadoComision = {
          id: empleado.id,
          nombre: empleado.nombre,
          rol: empleado.rol,
          tienda: empleado.tienda,
          fecha: diasTrabajados[0], // Primera fecha trabajada
          presupuesto: presupuestoMensual, // Mantener precisión para cálculos
          ventas: ventasMensual, // Todos los empleados muestran sus ventas individuales (incluyendo gerentes)
          cumplimiento_pct:
            empleado.rol === "gerente"
              ? calculateCompliance(
                  tiendaData.ventasTotal,
                  tiendaData.presupuestoTotal
                )
              : cumplimientoIndividual,
          comision_pct,
          comision_monto,
          dias_laborados: diasTrabajados.length, // Días únicos trabajados
        };
      }

      empleadosComisiones.push(empleadoComision);
    });

    // Crear resumen de la tienda
    const cumplimiento_tienda = calculateCompliance(
      tiendaData.ventasTotal,
      tiendaData.presupuestoTotal
    );

    const total_comisiones = round(
      empleadosComisiones.reduce((sum, e) => sum + e.comision_monto, 0)
    );

    tiendaResumenes.push({
      tienda: tiendaData.tienda,
      tienda_id: tiendaData.tienda_id,
      empresa: tiendaData.empresa,
      fecha: tiendaData.fechas[0], // Primera fecha del mes
      presupuesto_tienda: round(tiendaData.presupuestoTotal),
      ventas_tienda: round(tiendaData.ventasTotal),
      cumplimiento_tienda_pct: cumplimiento_tienda,
      empleados: empleadosComisiones,
      total_comisiones,
    });
  });

  // Calcular totales
  const total_comisiones = round(
    tiendaResumenes.reduce((sum, t) => sum + t.total_comisiones, 0)
  );

  const comisiones_por_rol: Record<Role, number> = {
    gerente: 0,
    asesor: 0,
    cajero: 0,
    logistico: 0,
  };

  tiendaResumenes.forEach((tienda) => {
    tienda.empleados.forEach((empleado) => {
      comisiones_por_rol[empleado.rol] += empleado.comision_monto;
    });
  });

  Object.keys(comisiones_por_rol).forEach((role) => {
    comisiones_por_rol[role as Role] = round(comisiones_por_rol[role as Role]);
  });

  // Ordenar tiendas por ID
  tiendaResumenes.sort((a, b) => a.tienda_id - b.tienda_id);

  return {
    mes,
    tiendas: tiendaResumenes,
    total_comisiones,
    comisiones_por_rol,
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
  porcentaje_gerente: number,
  presupuestosEmpleados?: any[]
): TiendaResumen => {
  const budget = budgets.find((b) => b.tienda === tienda && b.fecha === fecha);
  if (!budget) {
    return {
      tienda,
      tienda_id: 0,
      empresa: "",
      fecha,
      presupuesto_tienda: 0,
      ventas_tienda: 0,
      cumplimiento_tienda_pct: 0,
      empleados: [],
      total_comisiones: 0,
    };
  }

  const tiendaStaff = staff.filter(
    (s) => s.tienda === tienda && s.fecha === fecha
  );
  const tiendaVentas = getTiendaVentas(ventasData, tienda, fecha);

  // Contar asesores
  const cantidad_asesores = tiendaStaff.filter(
    (s) => s.rol === "asesor"
  ).length;

  // Calcular comisiones por empleado
  const empleados: EmployeeCommission[] = tiendaStaff.map((empleado) => {
    if (empleado.rol === "cajero") {
      // Cajeros: comisión basada en rendimiento de la tienda
      // Contar TODOS los empleados que trabajaron en la tienda ese día
      const totalEmpleadosDia = tiendaStaff.length;

      // Obtener ventas individuales del empleado (o 0 si no tiene)
      // Cajeros muestran sus ventas individuales registradas (o 0 si no tienen)
      const ventasIndividuales = getEmployeeVentas(
        ventasData,
        tienda,
        fecha,
        empleado.id
      );

      // Obtener presupuesto individual del empleado (o 0 si no tiene)
      const presupuestoDiario = presupuestosEmpleados?.find(
        (pe) =>
          pe.asesor.toString() === empleado.id.toString() && pe.fecha === fecha
      );
      const presupuestoIndividual = presupuestoDiario?.presupuesto || 0;

      return calculateCajeroCommission(
        empleado,
        tiendaVentas,
        budget.presupuesto_total,
        totalEmpleadosDia,
        ventasIndividuales,
        presupuestoIndividual
      );
    } else if (empleado.rol === "logistico") {
      // Logísticos: comisión basada en rendimiento de la tienda
      // Contar TODOS los empleados que trabajaron en la tienda ese día
      const totalEmpleadosDia = tiendaStaff.length;

      // Obtener ventas individuales del empleado (o 0 si no tiene)
      // Logísticos muestran sus ventas individuales registradas (o 0 si no tienen)
      const ventasIndividuales = getEmployeeVentas(
        ventasData,
        tienda,
        fecha,
        empleado.id
      );

      // Obtener presupuesto individual del empleado (o 0 si no tiene)
      const presupuestoDiario = presupuestosEmpleados?.find(
        (pe) =>
          pe.asesor.toString() === empleado.id.toString() && pe.fecha === fecha
      );
      const presupuestoIndividual = presupuestoDiario?.presupuesto || 0;

      return calculateLogisticoCommission(
        empleado,
        tiendaVentas,
        budget.presupuesto_total,
        totalEmpleadosDia,
        ventasIndividuales,
        presupuestoIndividual
      );
    } else {
      // Gerentes y asesores: lógica tradicional
      let presupuesto = 0;
      let ventas = 0;

      // Primero buscar presupuesto diario asignado
      const presupuestoDiario = presupuestosEmpleados?.find(
        (pe) =>
          pe.asesor.toString() === empleado.id.toString() && pe.fecha === fecha
      );

      if (presupuestoDiario) {
        // Usar presupuesto diario asignado
        presupuesto = presupuestoDiario.presupuesto;
      } else {
        // Calcular presupuesto usando lógica tradicional
        if (empleado.rol === "gerente") {
          presupuesto = calculateManagerBudget(
            budget.presupuesto_total,
            porcentaje_gerente
          );
        } else if (empleado.rol === "asesor") {
          presupuesto = calculateAdvisorBudget(
            budget.presupuesto_total,
            porcentaje_gerente,
            cantidad_asesores
          );
        } else if (empleado.rol === "cajero") {
          presupuesto = 0; // Cajero no tiene presupuesto asignado
        }
      }

      // Obtener ventas del empleado - todos los empleados (incluyendo gerentes) usan ventas individuales
      ventas = getEmployeeVentas(ventasData, tienda, fecha, empleado.id);

      return calculateEmployeeCommission(empleado, presupuesto, ventas);
    }
  });

  const cumplimiento_tienda = calculateCompliance(
    tiendaVentas,
    budget.presupuesto_total
  );
  const total_comisiones = round(
    empleados.reduce((sum, e) => sum + e.comision_monto, 0)
  );

  return {
    tienda,
    tienda_id: budget.tienda_id,
    empresa: budget.empresa,
    fecha,
    presupuesto_tienda: round(budget.presupuesto_total),
    ventas_tienda: round(tiendaVentas),
    cumplimiento_tienda_pct: cumplimiento_tienda,
    empleados,
    total_comisiones,
  };
};
