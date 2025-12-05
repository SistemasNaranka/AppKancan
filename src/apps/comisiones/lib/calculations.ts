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

const DECIMAL_PLACES = 2;

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
 * Obtiene el mes actual en formato "MMM YYYY"
 */
export const getCurrentMonth = (): string => {
  const today = new Date();
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
  const month = months[today.getMonth()];
  const year = today.getFullYear();
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
 * Filtra personal por mes y tienda
 */
export const filterStaffByMonthAndTienda = (
  staff: StaffMember[],
  mes: string,
  tienda: string
): StaffMember[] => {
  return staff.filter(
    (s) => getMonthYear(s.fecha) === mes && s.tienda === tienda
  );
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
  };
};
/**
 * Calcula las comisiones para cajeros y logísticos
 * Lógica especial: comisión basada en el rendimiento general de la tienda,
 * dividida entre TODOS los empleados que trabajaron en la tienda.
 * Muestra ventas individuales registradas en venta_diaria_empleado (o 0 si no tienen)
 * y presupuesto individual asignado (o 0 si no tienen) en la vista, pero calcula comisión colectiva.
 */
export const calculateCajeroLogisticoCommission = (
  empleado: StaffMember,
  ventasTiendaTotal: number,
  presupuestoTiendaTotal: number,
  cantidadEmpleadosRol: number,
  ventasIndividualesEmpleado: number = 0,
  presupuestoIndividualEmpleado: number = 0
): EmployeeCommission => {
  console.log(
    `🔄 [CALC] Calculando comisión para ${empleado.rol}: ${empleado.nombre}`
  );
  console.log(
    `📊 [CALC] Datos: ventasTienda=${ventasTiendaTotal}, presupuestoTienda=${presupuestoTiendaTotal}, totalEmpleadosTienda=${cantidadEmpleadosRol}`
  );
  console.log(
    `👤 [CALC] Ventas individuales empleado: ${ventasIndividualesEmpleado} (registradas para cajeros/logísticos), presupuesto individual: ${presupuestoIndividualEmpleado} (asignado para cajeros/logísticos)`
  );

  // Calcular cumplimiento de la tienda
  const cumplimientoTienda = calculateCompliance(
    ventasTiendaTotal,
    presupuestoTiendaTotal
  );
  console.log(`📈 [CALC] Cumplimiento tienda: ${cumplimientoTienda}%`);

  // Obtener porcentaje de comisión basado en cumplimiento de la tienda
  const comision_pct = getCommissionPercentage(cumplimientoTienda);
  console.log(`💰 [CALC] Porcentaje comisión: ${comision_pct * 100}%`);

  // Calcular venta base sin IVA de la tienda
  const ventaTiendaSinIVA = calculateBaseSale(ventasTiendaTotal);
  console.log(`🛒 [CALC] Venta tienda sin IVA: ${ventaTiendaSinIVA}`);

  // Dividir la venta sin IVA entre TODOS los empleados de la tienda
  const ventaBasePorEmpleado =
    cantidadEmpleadosRol > 0 ? ventaTiendaSinIVA / cantidadEmpleadosRol : 0;
  console.log(
    `👥 [CALC] Venta base por empleado (todos los empleados de tienda): ${ventaBasePorEmpleado}`
  );

  // Calcular comisión: (venta_sin_iva / cantidad_empleados) * porcentaje_comision
  const comision_monto = calculateCommissionAmount(
    ventaBasePorEmpleado,
    comision_pct
  );
  console.log(`💵 [CALC] Comisión calculada: ${comision_monto}`);
  console.log(
    `📋 [CALC] Vista mostrará: ventas=${ventasIndividualesEmpleado} (registradas para cajeros/logísticos), presupuesto=${presupuestoIndividualEmpleado} (asignado para cajeros/logísticos), cumplimiento=${cumplimientoTienda}%`
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
  };
};

/**
 * Consolida empleados multitarea: suma presupuestos globales y asigna a tienda principal
 * Solo aplica a empleados con presupuestos en múltiples tiendas que tienen presupuesto diario
 */
const consolidateMultiStoreEmployees = (
  presupuestosEmpleados: any[],
  tiendasConPresupuesto: Set<string>,
  empleadosMultitienda: Map<string, Set<string>>
): Map<
  string,
  {
    tiendaAsignada: string;
    presupuestoTotal: number;
    tiendasTrabajadas: string[];
  }
> => {
  const employeeConsolidation = new Map<
    string,
    {
      presupuestosPorTienda: Map<string, number>;
      total: number;
      tiendas: Set<string>;
    }
  >();

  // Agrupar presupuestos por empleado
  presupuestosEmpleados.forEach((pe) => {
    const empleadoId = pe.asesor.toString();
    if (!employeeConsolidation.has(empleadoId)) {
      employeeConsolidation.set(empleadoId, {
        presupuestosPorTienda: new Map(),
        total: 0,
        tiendas: new Set(),
      });
    }
    const data = employeeConsolidation.get(empleadoId)!;
    const presupuestoNum = parseFloat(pe.presupuesto) || 0;
    data.presupuestosPorTienda.set(
      pe.tienda,
      (data.presupuestosPorTienda.get(pe.tienda) || 0) + presupuestoNum
    );
    data.total += presupuestoNum;
    data.tiendas.add(pe.tienda);
  });

  // Asignar a tienda con mayor presupuesto, solo si tiene múltiples tiendas
  const consolidationResult = new Map<
    string,
    {
      tiendaAsignada: string;
      presupuestoTotal: number;
      tiendasTrabajadas: string[];
    }
  >();
  employeeConsolidation.forEach((data, empleadoId) => {
    const tiendasTrabajadas = empleadosMultitienda.get(empleadoId);
    if (!tiendasTrabajadas || tiendasTrabajadas.size <= 1) return; // Solo consolidar si trabajó en múltiples tiendas

    let maxPresupuesto = 0;
    let tiendaAsignada = "";
    data.presupuestosPorTienda.forEach((presupuesto, tienda) => {
      if (tiendasConPresupuesto.has(tienda) && presupuesto > maxPresupuesto) {
        maxPresupuesto = presupuesto;
        tiendaAsignada = tienda;
      }
    });
    // Si no hay tienda con presupuesto diario, asignar a la primera tienda con presupuesto
    if (!tiendaAsignada) {
      for (const tienda of tiendasTrabajadas) {
        if (tiendasConPresupuesto.has(tienda)) {
          tiendaAsignada = tienda;
          break;
        }
      }
      // Si ninguna tiene presupuesto diario, asignar a la primera tienda trabajada
      if (!tiendaAsignada) {
        tiendaAsignada = Array.from(tiendasTrabajadas)[0];
      }
    }
    consolidationResult.set(empleadoId, {
      tiendaAsignada,
      presupuestoTotal: data.total,
      tiendasTrabajadas: Array.from(tiendasTrabajadas),
    });
  });

  return consolidationResult;
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

  // Filtrar presupuestos del mes
  const mesBudgets = filterBudgetsByMonth(budgets, mes);

  // Tiendas con presupuesto diario
  const tiendasConPresupuesto = new Set(mesBudgets.map((b) => b.tienda));

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

  if (mesBudgets.length === 0) {
    console.warn(`⚠️ [CALC] No hay presupuestos para ${mes}`);
    return {
      mes,
      tiendas: [],
      total_comisiones: 0,
      comisiones_por_rol: { gerente: 0, asesor: 0, cajero: 0, logistico: 0 },
    };
  }

  // Obtener todas las tiendas únicas de budgets, staff y ventas
  const todasTiendas = new Set<string>();
  mesBudgets.forEach((b) => todasTiendas.add(b.tienda));
  staff.forEach((s) => todasTiendas.add(s.tienda));
  ventasData.forEach((v) => todasTiendas.add(v.tienda));

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
      } else {
        console.error(
          `❌ [CALC] Presupuesto inválido para ${budget.tienda} - ${budget.fecha}: ${budget.presupuesto_total}`
        );
      }
    } else {
      console.warn(
        `⚠️ [CALC] Fecha duplicada para ${budget.tienda}: ${budget.fecha}`
      );
    }
  });

  // Paso 2: Agrupar staff por tienda y fecha
  staff.forEach((empleado) => {
    if (getMonthYear(empleado.fecha) !== mes) return;

    const tiendaData = tiendasMap.get(empleado.tienda);
    if (!tiendaData) {
      console.warn(
        `⚠️ [CALC] Tienda no encontrada para empleado: ${empleado.tienda}`
      );
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
      console.warn(
        `⚠️ [CALC] Tienda no encontrada para ventas: ${venta.tienda}`
      );
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
            console.log(
              `💰 [CALC] ${empleado.nombre} (${empleado.rol}) en ${tiendaData.tienda}: ${presupuestosEmpleadoTienda.length} presupuestos diarios sumados = ${empleadoData.presupuestoMensual}`
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
            console.log(
              `💰 [CALC] ${empleado.nombre} (${empleado.rol}) en ${tiendaData.tienda}: presupuesto calculado = ${empleadoData.presupuestoMensual}`
            );
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
          console.log(
            `💵 [REAL] ${empleado.nombre} (${empleado.rol}) en ${tiendaData.tienda}: ventas reales = ${empleadoData.ventasMensual}`
          );
        }
      });
    });

    // Calcular comisiones para cada empleado
    const empleadosComisiones: EmployeeCommission[] = [];

    empleadosUnicos.forEach((empleadoData) => {
      const { empleado, presupuestoMensual, ventasMensual, diasTrabajados } =
        empleadoData;

      let empleadoComision: EmployeeCommission;

      if (empleado.rol === "cajero" || empleado.rol === "logistico") {
        // Cajeros y logísticos: comisión basada en rendimiento de la tienda
        // Contar TODOS los empleados que trabajaron en la tienda durante el mes
        const totalEmpleadosTienda = empleadosUnicos.size;

        empleadoComision = calculateCajeroLogisticoCommission(
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
        let cumplimientoParaComision = cumplimientoIndividual;
        let ventaBaseParaComision = calculateBaseSale(ventasMensual);

        if (empleado.rol === "gerente") {
          // Gerente usa cumplimiento de la tienda y ventas de la tienda
          const cumplimientoTienda = calculateCompliance(
            tiendaData.ventasTotal,
            tiendaData.presupuestoTotal
          );
          cumplimientoParaComision = cumplimientoTienda;
          ventaBaseParaComision = calculateBaseSale(tiendaData.ventasTotal);
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
          ventas: ventasMensual, // Mantener precisión para cálculos
          cumplimiento_pct: cumplimientoIndividual,
          comision_pct,
          comision_monto,
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
    if (empleado.rol === "cajero" || empleado.rol === "logistico") {
      // Cajeros y logísticos: comisión basada en rendimiento de la tienda
      // Contar TODOS los empleados que trabajaron en la tienda ese día
      const totalEmpleadosDia = tiendaStaff.length;

      // Obtener ventas individuales del empleado (o 0 si no tiene)
      // Cajeros y logísticos muestran sus ventas individuales registradas (o 0 si no tienen)
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

      return calculateCajeroLogisticoCommission(
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

      // Obtener ventas del empleado
      if (empleado.rol === "gerente") {
        ventas = tiendaVentas;
      } else {
        ventas = getEmployeeVentas(ventasData, tienda, fecha, empleado.id);
      }

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

/**
 * Calcula el resumen mensual de comisiones
 */
export const calculateMesResumen = (
  mes: string,
  budgets: BudgetRecord[],
  staff: StaffMember[],
  ventasData: VentasData[],
  porcentaje_gerente: number,
  presupuestosEmpleados?: any[]
): MesResumen => {
  // Handle case where ventasData might not be an array during state updates
  if (!Array.isArray(ventasData)) {
    console.warn(
      "ventasData is not an array in calculateMesResumen, using empty array"
    );
    ventasData = [];
  }

  const mesBudgets = filterBudgetsByMonth(budgets, mes);
  const tiendas = new Set<string>();
  mesBudgets.forEach((b) => tiendas.add(b.tienda));

  const tiendaResumenes: TiendaResumen[] = [];
  tiendas.forEach((tienda) => {
    // Cada tienda solo tiene una fecha por mes
    const tiendaBudget = mesBudgets.find((b) => b.tienda === tienda);
    if (tiendaBudget) {
      const resumen = calculateTiendaResumen(
        tienda,
        tiendaBudget.fecha,
        budgets,
        staff,
        ventasData,
        porcentaje_gerente,
        presupuestosEmpleados
      );
      tiendaResumenes.push(resumen);
    }
  });

  const total_comisiones = round(
    tiendaResumenes.reduce((sum, t) => sum + t.total_comisiones, 0)
  );

  // Calcular comisiones por rol
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
  presupuestosEmpleados?: any[],
  deps?: [string, BudgetRecord[], StaffMember[], VentasData[], number, any[]]
): MesResumen => {
  // Create a simple cache key based on dependencies
  const cacheKey = JSON.stringify({
    mes,
    budgets: budgets.map(
      (b) => `${b.tienda}-${b.fecha}-${b.presupuesto_total}`
    ),
    staff: staff.map(
      (s) => `${s.id}-${s.nombre}-${s.tienda}-${s.fecha}-${s.rol}`
    ),
    ventas: Array.isArray(ventasData)
      ? ventasData.map((v) => `${v.tienda}-${v.fecha}-${v.ventas_tienda}`)
      : [],
    porcentaje_gerente,
  });

  // Use a simple cache for memoization
  if (!calculateMesResumenMemoized.cache) {
    calculateMesResumenMemoized.cache = new Map();
  }

  // Handle case where ventasData might not be an array during state updates
  if (!Array.isArray(ventasData)) {
    console.warn("ventasData is not an array, skipping memoization");
    return calculateMesResumen(
      mes,
      budgets,
      staff,
      ventasData,
      porcentaje_gerente,
      presupuestosEmpleados
    );
  }

  if (calculateMesResumenMemoized.cache.has(cacheKey)) {
    return calculateMesResumenMemoized.cache.get(cacheKey);
  }

  const result = calculateMesResumen(
    mes,
    budgets,
    staff,
    ventasData,
    porcentaje_gerente,
    presupuestosEmpleados
  );
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
  const presupuesto_gerente_mensual = calculateManagerBudget(
    presupuesto_mensual,
    porcentaje_gerente
  );

  // Obtener empleados únicos (sin duplicados por fecha)
  const empleadosUnicos = new Map<string, StaffMember>();
  tiendaStaff.forEach((staff) => {
    if (!empleadosUnicos.has(staff.id)) {
      empleadosUnicos.set(staff.id, staff);
    }
  });

  // Calcular ventas mensuales por empleado
  const empleados: EmployeeCommission[] = Array.from(
    empleadosUnicos.values()
  ).map((empleado) => {
    if (empleado.rol === "cajero" || empleado.rol === "logistico") {
      // Cajeros y logísticos: comisión basada en rendimiento de la tienda
      // Contar TODOS los empleados únicos que trabajaron en la tienda durante el mes
      const totalEmpleadosUnicos = empleadosUnicos.size;

      // Cajeros y logísticos muestran sus ventas individuales registradas (o 0 si no tienen)
      // Buscar ventas individuales registradas en venta_diaria_empleado
      let ventasIndividualesMensuales = 0;
      fechas.forEach((fecha) => {
        const ventasDia = getEmployeeVentas(
          ventasData,
          tienda,
          fecha,
          empleado.id
        );
        ventasIndividualesMensuales += ventasDia;
      });
      ventasIndividualesMensuales = round(ventasIndividualesMensuales);

      return calculateCajeroLogisticoCommission(
        empleado,
        ventas_mensuales,
        presupuesto_mensual,
        totalEmpleadosUnicos,
        ventasIndividualesMensuales,
        0 // Presupuesto individual = 0 para mensual
      );
    } else {
      // Gerentes y asesores: lógica tradicional
      let presupuesto = 0;
      let ventas = 0;

      if (empleado.rol === "gerente") {
        presupuesto = presupuesto_gerente_mensual;
        ventas = ventas_mensuales;
      } else if (empleado.rol === "asesor") {
        // Calcular presupuesto mensual para asesores
        const cantidad_asesores = Array.from(empleadosUnicos.values()).filter(
          (e) => e.rol === "asesor"
        ).length;
        presupuesto = calculateAdvisorBudget(
          presupuesto_mensual,
          porcentaje_gerente,
          cantidad_asesores
        );

        // Sumar ventas mensuales del asesor
        ventas = round(
          fechas.reduce(
            (sum, fecha) =>
              sum + getEmployeeVentas(ventasData, tienda, fecha, empleado.id),
            0
          )
        );
      }

      return calculateEmployeeCommission(empleado, presupuesto, ventas);
    }
  });

  const cumplimiento_tienda = calculateCompliance(
    ventas_mensuales,
    presupuesto_mensual
  );
  const total_comisiones = round(
    empleados.reduce((sum, e) => sum + e.comision_monto, 0)
  );

  return {
    tienda,
    tienda_id: 0, // TODO: Add tienda_id parameter if needed
    empresa: "", // TODO: Add empresa parameter if needed
    fecha: fechas[0], // Usar la primera fecha como referencia
    presupuesto_tienda: presupuesto_mensual,
    ventas_tienda: ventas_mensuales,
    cumplimiento_tienda_pct: cumplimiento_tienda,
    empleados,
    total_comisiones,
  };
};
