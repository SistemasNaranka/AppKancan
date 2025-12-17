/**
 * Funciones de cálculos de resúmenes para comisiones
 */

import {
  BudgetRecord,
  StaffMember,
  VentasData,
  TiendaResumen,
  MesResumen,
  Role,
  EmployeeCommission,
} from "../types";
import {
  round,
  getMonthYear,
  isCurrentMonth,
  getCurrentDate,
} from "./calculations.basic";
import { filterBudgetsByMonth } from "./calculations.budgets";
import { getEmployeeVentas, getTiendaVentas } from "./calculations.data";
import {
  calculateEmployeeCommission,
  calculateGerenteCommission,
  calculateCajeroCommission,
  calculateLogisticoCommission,
  calculateCompliance,
  calculateBaseSale,
  getCommissionPercentage,
} from "./calculations.commissions";

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
    } else if (empleado.rol === "gerente") {
      // Gerentes: LÓGICA ESPECIAL PARA GERENTES
      // Los 3 cálculos principales basados en la TIENDA COMPLETA:
      // - Monto de comisión: basado en ventas de la tienda
      // - Cumplimiento: basado en rendimiento de la tienda
      // - Porcentaje de comisión: basado en cumplimiento de la tienda

      let presupuestoGerente = 0;
      let ventasIndividualesGerente = 0;

      // Obtener presupuesto del gerente (individual para mostrar)
      const presupuestoDiario = presupuestosEmpleados?.find(
        (pe) =>
          pe.asesor.toString() === empleado.id.toString() && pe.fecha === fecha
      );

      if (presupuestoDiario) {
        presupuestoGerente = presupuestoDiario.presupuesto;
      } else {
        // Calcular presupuesto usando lógica tradicional
        presupuestoGerente = round(
          (budget.presupuesto_total * porcentaje_gerente) / 100
        );
      }

      // Obtener ventas individuales del gerente (solo para mostrar en tabla)
      ventasIndividualesGerente = getEmployeeVentas(
        ventasData,
        tienda,
        fecha,
        empleado.id
      );

      return calculateGerenteCommission(
        empleado,
        presupuestoGerente,
        ventasIndividualesGerente,
        tiendaVentas, // Ventas de la tienda para cálculos
        budget.presupuesto_total // Presupuesto de la tienda para cálculos
      );
    } else {
      // Asesores: lógica tradicional individual
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
        const presupuesto_asesores =
          budget.presupuesto_total * ((100 - porcentaje_gerente) / 100);
        presupuesto =
          cantidad_asesores === 0
            ? 0
            : round(presupuesto_asesores / cantidad_asesores);
      }

      // Obtener ventas del empleado
      ventas = getEmployeeVentas(ventasData, tienda, fecha, empleado.id);

      return calculateEmployeeCommission(empleado, presupuesto, ventas);
    }
  });

  // ✅ CORRECCIÓN CRÍTICA: Presupuesto total = Suma de presupuestos de empleados
  const presupuestoTotalTienda = empleados.reduce(
    (sum, e) => sum + (e.presupuesto || 0),
    0
  );

  console.log(
    `💰 [CÁLCULO TIENDA] ${tienda} ${fecha}: Presupuesto total = Suma empleados = $${presupuestoTotalTienda.toLocaleString()} (era: $${
      budget.presupuesto_total?.toLocaleString() || 0
    })`
  );

  const cumplimiento_tienda = calculateCompliance(
    tiendaVentas,
    presupuestoTotalTienda
  );
  const total_comisiones = round(
    empleados.reduce((sum, e) => sum + e.comision_monto, 0)
  );

  return {
    tienda,
    tienda_id: budget.tienda_id,
    empresa: budget.empresa,
    fecha,
    presupuesto_tienda: round(presupuestoTotalTienda), // ✅ Era: budget.presupuesto_total
    ventas_tienda: round(tiendaVentas),
    cumplimiento_tienda_pct: cumplimiento_tienda,
    empleados,
    total_comisiones,
  };
};

/**
 * Calcula las comisiones para gerentes y asesores con lógica tradicional
 */
const calculateTraditionalEmployeeCommission = (
  empleado: StaffMember,
  presupuesto: number,
  ventas: number,
  tiendaVentas: number,
  presupuestoTienda: number
): EmployeeCommission => {
  // Calcular cumplimiento individual
  const cumplimientoIndividual = calculateCompliance(ventas, presupuesto);

  // Para GERENTE: usar cumplimiento de la tienda para calcular comisión
  // pero mostrar sus ventas individuales
  let cumplimientoParaComision = cumplimientoIndividual;
  const ventaBaseParaComision = calculateBaseSale(ventas);

  if (empleado.rol === "gerente") {
    // Gerente usa cumplimiento de la tienda para calcular comisión
    // pero muestra sus ventas individuales (no las de la tienda)
    const cumplimientoTienda = calculateCompliance(
      tiendaVentas,
      presupuestoTienda
    );
    cumplimientoParaComision = cumplimientoTienda;
  }

  const comision_pct = getCommissionPercentage(cumplimientoParaComision);
  const comision_monto = round(ventaBaseParaComision * comision_pct);

  return {
    id: empleado.id,
    nombre: empleado.nombre,
    rol: empleado.rol,
    tienda: empleado.tienda,
    fecha: empleado.fecha,
    presupuesto: presupuesto, // Mantener precisión para cálculos
    ventas: ventas, // Todos los empleados muestran sus ventas individuales (incluyendo gerentes)
    cumplimiento_pct:
      empleado.rol === "gerente"
        ? calculateCompliance(tiendaVentas, presupuestoTienda)
        : cumplimientoIndividual,
    comision_pct,
    comision_monto,
    dias_laborados: 1, // Por defecto 1 día para funciones individuales
  };
};

/**
 * Calcula el resumen agrupado de comisiones para un mes
 */
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

  // Determinar fecha límite según si es mes actual o no
  const fechaLimite = isCurrentMonth(mes) ? getCurrentDate() : null;

  // console.log(
  //   `📅 [CÁLCULO] Mes: ${mes}, Es actual: ${isCurrentMonth(
  //     mes
  //   )}, Fecha límite: ${fechaLimite || "Todo el mes"}`
  // );

  // Filtrar presupuestos del mes
  const mesBudgets = filterBudgetsByMonth(budgets, mes);

  // Si es mes actual, filtrar solo hasta la fecha actual
  const mesBudgetsFiltrados = fechaLimite
    ? mesBudgets.filter((b) => b.fecha <= fechaLimite)
    : mesBudgets;

  // console.log(
  //   `📊 [CÁLCULO] Presupuestos originales: ${mesBudgets.length}, Filtrados: ${mesBudgetsFiltrados.length}`
  // );

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

  // Filtrar staff también por fecha límite si es mes actual
  const staffFiltrado = fechaLimite
    ? staff.filter(
        (s) => getMonthYear(s.fecha) === mes && s.fecha <= fechaLimite
      )
    : staff.filter((s) => getMonthYear(s.fecha) === mes);

  // Filtrar ventas también por fecha límite si es mes actual
  const ventasFiltradas = fechaLimite
    ? ventasData.filter(
        (v) => getMonthYear(v.fecha) === mes && v.fecha <= fechaLimite
      )
    : ventasData.filter((v) => getMonthYear(v.fecha) === mes);

  // console.log(
  //   `👥 [CÁLCULO] Staff original: ${
  //     staff.filter((s) => getMonthYear(s.fecha) === mes).length
  //   }, Filtrado: ${staffFiltrado.length}`
  // );
  // console.log(
  //   `💰 [CÁLCULO] Ventas original: ${
  //     ventasData.filter((v) => getMonthYear(v.fecha) === mes).length
  //   }, Filtradas: ${ventasFiltradas.length}`
  // );

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

  // ✅ CORRECCIÓN CRÍTICA: Eliminar acumulación de budget.presupuesto_total
  // Ahora el presupuestoTotal se calculará como suma de empleados
  mesBudgets.forEach((budget) => {
    const tiendaData = tiendasMap.get(budget.tienda)!;

    // Solo agregar fecha si no existe ya (evitar duplicados)
    if (!tiendaData.fechas.includes(budget.fecha)) {
      tiendaData.fechas.push(budget.fecha);
      // ✅ Ya no acumulamos budget.presupuesto_total
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
            // ✅ CORRECCIÓN CRÍTICA: Calcular presupuestos basado en empleados existentes
            // Contar empleados por rol para el cálculo
            const empleadosGerente = Array.from(
              empleadosUnicos.values()
            ).filter((e) => e.empleado.rol === "gerente").length;
            const empleadosAsesor = Array.from(empleadosUnicos.values()).filter(
              (e) => e.empleado.rol === "asesor"
            ).length;

            // Calcular presupuesto total disponible basado en empleados existentes
            let presupuestoTotalCalculado = 0;
            if (empleadosGerente > 0) {
              presupuestoTotalCalculado += empleadosGerente * 100000; // Estimación para gerente
            }
            if (empleadosAsesor > 0) {
              presupuestoTotalCalculado += empleadosAsesor * 80000; // Estimación para asesores
            }

            if (empleado.rol === "gerente") {
              empleadoData.presupuestoMensual =
                empleadosGerente === 0
                  ? 0
                  : round(
                      (presupuestoTotalCalculado * porcentaje_gerente) / 100
                    );
            } else if (empleado.rol === "asesor") {
              const presupuesto_asesores =
                presupuestoTotalCalculado * ((100 - porcentaje_gerente) / 100);
              empleadoData.presupuestoMensual =
                empleadosAsesor === 0
                  ? 0
                  : round(presupuesto_asesores / empleadosAsesor);
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
            // Cajero/Logístico: buscar ventas individuales registradas en venta_diaria_empleado
            // Si no tienen ventas registradas, ventasEmpleado será 0
            const ventasEmpleado =
              ventasDia.ventas_por_asesor[empleado.id] || 0;
            empleadoData.ventasMensual += ventasEmpleado;
          });
        }
      });
    });

    // Calcular comisiones para cada empleado (sin usar presupuestoTotal todavía)
    const empleadosComisiones: EmployeeCommission[] = [];

    // ✅ CORRECCIÓN CRÍTICA: Primero calcular presupuesto total de la tienda
    // para poder pasarlo correctamente a calculateGerenteCommission
    const presupuestoTotalTienda = Array.from(empleadosUnicos.values()).reduce(
      (sum, e) => sum + (e.presupuestoMensual || 0),
      0
    );

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
          presupuestoTotalTienda, // ✅ Ahora usa el presupuesto correcto
          totalEmpleadosTienda,
          empleadoData.ventasMensual,
          empleadoData.presupuestoMensual
        );
      } else if (empleado.rol === "logistico") {
        // Logísticos: comisión basada en rendimiento de la tienda
        const totalEmpleadosTienda = empleadosUnicos.size;

        empleadoComision = calculateLogisticoCommission(
          empleado,
          tiendaData.ventasTotal,
          presupuestoTotalTienda, // ✅ Ahora usa el presupuesto correcto
          totalEmpleadosTienda,
          empleadoData.ventasMensual,
          empleadoData.presupuestoMensual
        );
      } else if (empleado.rol === "gerente") {
        // Gerentes: LÓGICA ESPECIAL PARA GERENTES
        empleadoComision = calculateGerenteCommission(
          empleado,
          presupuestoMensual,
          ventasMensual,
          tiendaData.ventasTotal,
          presupuestoTotalTienda // ✅ CORREGIDO: Ahora pasa el presupuesto real de la tienda
        );
        empleadoComision.fecha = diasTrabajados[0];
        empleadoComision.dias_laborados = diasTrabajados.length;
      } else {
        // Asesores: lógica tradicional individual
        empleadoComision = calculateTraditionalEmployeeCommission(
          empleado,
          presupuestoMensual,
          ventasMensual,
          tiendaData.ventasTotal,
          presupuestoTotalTienda // ✅ Ahora usa el presupuesto correcto
        );
        empleadoComision.fecha = diasTrabajados[0];
        empleadoComision.dias_laborados = diasTrabajados.length;
      }

      empleadosComisiones.push(empleadoComision);
    });

    // ✅ CORRECCIÓN CRÍTICA: Presupuesto total = Suma de presupuestos de empleados
    // (Ya calculado arriba: presupuestoTotalTienda)

    // Crear resumen de la tienda
    const cumplimiento_tienda = calculateCompliance(
      tiendaData.ventasTotal,
      presupuestoTotalTienda // ✅ CORREGIDO: Ahora usa el presupuesto correcto
    );

    const total_comisiones = round(
      empleadosComisiones.reduce((sum, e) => sum + e.comision_monto, 0)
    );

    tiendaResumenes.push({
      tienda: tiendaData.tienda,
      tienda_id: tiendaData.tienda_id,
      empresa: tiendaData.empresa,
      fecha: tiendaData.fechas[0], // Primera fecha del mes
      presupuesto_tienda: round(presupuestoTotalTienda),
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
