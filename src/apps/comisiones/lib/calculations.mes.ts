import {
  BudgetRecord,
  StaffMember,
  VentasData,
  TiendaResumen,
  MesResumen,
  Role,
  EmployeeCommission,
  CommissionThresholdConfig,
} from "../types";
import {
  round,
  getMonthYear,
  isCurrentMonth,
  getCurrentDate,
  getNextCommission,
  getNextBudget,
  getNextSale,
  getNextCommissionAmount,
} from "./calculations.utils";
import { filterBudgetsByMonth } from "./calculations.budgets";
import {
  calculateGerenteCommission,
  calculateCajeroCommission,
  calculateLogisticoCommission,
  calculateGerenteOnlineCommission,
  calculateCompliance,
  calculateBaseSale,
  getCommissionPercentage,
} from "./calculations.commissions";

export const calculateMesResumenAgrupado = (
  mes: string,
  budgets: BudgetRecord[],
  staff: StaffMember[],
  ventasData: VentasData[],
  porcentaje_gerente: number,
  presupuestosEmpleados?: any[],
  thresholdConfig?: CommissionThresholdConfig | null
): MesResumen => {
  if (!Array.isArray(ventasData)) {
    ventasData = [];
  }

  const fechaLimite = isCurrentMonth(mes) ? getCurrentDate() : null;

  const mesBudgets = filterBudgetsByMonth(budgets, mes);

  const mesBudgetsFiltrados = fechaLimite
    ? mesBudgets.filter((b) => b.fecha <= fechaLimite)
    : mesBudgets;

  const empleadosMultitienda = new Map<string, Set<string>>();
  staff.forEach((empleado) => {
    if (getMonthYear(empleado.fecha) !== mes) return;
    if (!empleadosMultitienda.has(empleado.id)) {
      empleadosMultitienda.set(empleado.id, new Set());
    }
    empleadosMultitienda.get(empleado.id)!.add(empleado.tienda);
  });

  if (mesBudgetsFiltrados.length === 0) {
    return {
      mes,
      tiendas: [],
      total_comisiones: 0,
      comisiones_por_rol: {
        gerente: 0,
        asesor: 0,
        cajero: 0,
        logistico: 0,
        gerente_online: 0,
        coadministrador: 0,
      },
    };
  }

  const staffFiltrado = fechaLimite
    ? staff.filter(
        (s) => getMonthYear(s.fecha) === mes && s.fecha <= fechaLimite
      )
    : staff.filter((s) => getMonthYear(s.fecha) === mes);

  const ventasFiltradas = fechaLimite
    ? ventasData.filter(
        (v) => getMonthYear(v.fecha) === mes && v.fecha <= fechaLimite
      )
    : ventasData.filter((v) => getMonthYear(v.fecha) === mes);

  const todasTiendas = new Set<string>();
  mesBudgetsFiltrados.forEach((b) => todasTiendas.add(b.tienda));
  staffFiltrado.forEach((s) => todasTiendas.add(s.tienda));
  ventasFiltradas.forEach((v) => todasTiendas.add(v.tienda));

  const tiendasMap = new Map<
    string,
    {
      tienda: string;
      tienda_id: number;
      empresa: string;
      fechas: string[];
      presupuestoTotal: number;
      ventasTotal: number;
      empleadosPorDia: Map<string, StaffMember[]>;
      ventasPorDia: Map<string, VentasData>;
    }
  >();

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

  mesBudgets.forEach((budget) => {
    const tiendaData = tiendasMap.get(budget.tienda)!;

    if (!tiendaData.fechas.includes(budget.fecha)) {
      tiendaData.fechas.push(budget.fecha);
    }

    tiendaData.presupuestoTotal += budget.presupuesto_total || 0;
  });

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

  ventasData.forEach((venta) => {
    if (getMonthYear(venta.fecha) !== mes) return;

    const tiendaData = tiendasMap.get(venta.tienda);
    if (!tiendaData) {
      return;
    }

    tiendaData.ventasPorDia.set(venta.fecha, venta);
    tiendaData.ventasTotal += venta.ventas_tienda;
  });

  const tiendaResumenes: TiendaResumen[] = [];

  tiendasMap.forEach((tiendaData) => {
    const empleadosUnicos = new Map<
      string,
      {
        empleado: StaffMember;
        presupuestoMensual: number;
        ventasMensual: number;
        diasTrabajados: string[];
      }
    >();

    tiendaData.empleadosPorDia.forEach((empleadosDia, fecha) => {
      empleadosDia.forEach((empleado) => {
        const empleadoKey = `${empleado.id}_${tiendaData.tienda}`;

        if (!empleadosUnicos.has(empleadoKey)) {
          empleadosUnicos.set(empleadoKey, {
            empleado: { ...empleado, tienda: tiendaData.tienda },
            presupuestoMensual: 0,
            ventasMensual: 0,
            diasTrabajados: [],
          });
        }

        const empleadoData = empleadosUnicos.get(empleadoKey)!;
        empleadoData.diasTrabajados.push(fecha);

        if (empleadoData.presupuestoMensual === 0) {
          const presupuestosEmpleadoTienda =
            presupuestosEmpleados?.filter(
              (pe) =>
                pe.advisor_id.toString() === empleado.id.toString() &&
                pe.store_id === tiendaData.tienda_id &&
                getMonthYear(pe.date) === mes
            ) || [];

          if (presupuestosEmpleadoTienda.length > 0) {
            empleadoData.presupuestoMensual = presupuestosEmpleadoTienda.reduce(
              (sum, pe) => sum + (parseFloat(pe.budget) || 0),
              0
            );
          } else {
            const presupuestoTotalReal = tiendaData.presupuestoTotal || 0;

            const empleadosTiendaMes = staffFiltrado.filter(
              (s) =>
                s.tienda === tiendaData.tienda && getMonthYear(s.fecha) === mes
            );

            const empleadosGerente = empleadosTiendaMes.filter(
              (e) => e.rol === "gerente"
            ).length;
            const empleadosAsesor = empleadosTiendaMes.filter(
              (e) => e.rol === "asesor" || e.rol === "coadministrador"
            ).length;

            const presupuestoTotalCalculado = presupuestoTotalReal;

            if (empleado.rol === "gerente") {
              empleadoData.presupuestoMensual =
                empleadosGerente === 0
                  ? 0
                  : round(
                      (presupuestoTotalCalculado * porcentaje_gerente) / 100
                    );
            } else if (
              empleado.rol === "asesor" ||
              empleado.rol === "coadministrador"
            ) {
              const presupuesto_asesores =
                presupuestoTotalCalculado * ((100 - porcentaje_gerente) / 100);
              empleadoData.presupuestoMensual =
                empleadosAsesor === 0
                  ? 0
                  : round(presupuesto_asesores / empleadosAsesor);
            } else if (
              empleado.rol === "cajero" ||
              empleado.rol === "logistico" ||
              empleado.rol === "gerente_online"
            ) {
              if (empleado.rol === "gerente_online") {
                empleadoData.presupuestoMensual = 1;
              } else {
                empleadoData.presupuestoMensual = 0;
              }
            }
          }
        }

        if (empleadoData.ventasMensual === 0) {
          tiendaData.ventasPorDia.forEach((ventasDia) => {
            const ventasEmpleado =
              ventasDia.ventas_por_asesor[empleado.id] || 0;
            empleadoData.ventasMensual += ventasEmpleado;
          });
        }
      });
    });

    const empleadosComisiones: EmployeeCommission[] = [];

    const presupuestoTotalTienda = Array.from(empleadosUnicos.values()).reduce(
      (sum, e) => sum + (e.presupuestoMensual || 0),
      0
    );

    empleadosUnicos.forEach((empleadoData) => {
      const { empleado, presupuestoMensual, ventasMensual, diasTrabajados } =
        empleadoData;

      let empleadoComision: EmployeeCommission;

      if (empleado.rol === "cajero") {
        const totalEmpleadosTienda = empleadosUnicos.size;

        empleadoComision = calculateCajeroCommission(
          empleado,
          tiendaData.ventasTotal,
          presupuestoTotalTienda,
          totalEmpleadosTienda,
          empleadoData.ventasMensual,
          empleadoData.presupuestoMensual,
          thresholdConfig?.compliance_values || undefined
        );
        empleadoComision.fecha = diasTrabajados[0];
        empleadoComision.dias_laborados = diasTrabajados.length;
      } else if (empleado.rol === "logistico") {
        const totalEmpleadosTienda = empleadosUnicos.size;

        empleadoComision = calculateLogisticoCommission(
          empleado,
          tiendaData.ventasTotal,
          presupuestoTotalTienda,
          totalEmpleadosTienda,
          empleadoData.ventasMensual,
          empleadoData.presupuestoMensual,
          thresholdConfig?.compliance_values || undefined
        );
        empleadoComision.fecha = diasTrabajados[0];
        empleadoComision.dias_laborados = diasTrabajados.length;
      } else if (empleado.rol === "gerente_online") {
        empleadoComision = calculateGerenteOnlineCommission(
          empleado,
          empleadoData.ventasMensual,
          1
        );
        empleadoComision.fecha = diasTrabajados[0];
        empleadoComision.dias_laborados = diasTrabajados.length;
      } else if (empleado.rol === "gerente") {
        empleadoComision = calculateGerenteCommission(
          empleado,
          presupuestoMensual,
          ventasMensual,
          tiendaData.ventasTotal,
          presupuestoTotalTienda,
          thresholdConfig?.compliance_values || undefined
        );
        empleadoComision.fecha = diasTrabajados[0];
        empleadoComision.dias_laborados = diasTrabajados.length;
      } else {
        const cumplimientoIndividual = calculateCompliance(
          ventasMensual,
          presupuestoMensual
        );
        const comision_pct = getCommissionPercentage(
          cumplimientoIndividual,
          thresholdConfig?.compliance_values || undefined
        );
        const ventaBase = calculateBaseSale(ventasMensual);
        const comision_monto = round(ventaBase * comision_pct);

        empleadoComision = {
          id: empleado.id,
          nombre: empleado.nombre,
          documento: empleado.documento,
          rol: empleado.rol,
          tienda: empleado.tienda,
          fecha: diasTrabajados[0],
          presupuesto: presupuestoMensual,
          ventas: ventasMensual,
          cumplimiento_pct: cumplimientoIndividual,
          comision_pct,
          comision_monto,
          proxima_comision: getNextCommission(
            comision_pct,
            thresholdConfig?.compliance_values || undefined
          ),
          proximo_presupuesto:
            getNextBudget(
              getNextCommission(
                comision_pct,
                thresholdConfig?.compliance_values || undefined
              ),
              presupuestoMensual,
              thresholdConfig?.compliance_values || undefined
            ) || undefined,
          proxima_venta:
            getNextSale(
              getNextBudget(
                getNextCommission(
                  comision_pct,
                  thresholdConfig?.compliance_values || undefined
                ),
                presupuestoMensual,
                thresholdConfig?.compliance_values || undefined
              ),
              ventasMensual
            ) || undefined,
          proximo_monto_comision:
            getNextCommissionAmount(
              getNextBudget(
                getNextCommission(
                  comision_pct,
                  thresholdConfig?.compliance_values || undefined
                ),
                presupuestoMensual,
                thresholdConfig?.compliance_values || undefined
              ),
              getNextCommission(
                comision_pct,
                thresholdConfig?.compliance_values || undefined
              )
            ) || undefined,
          dias_laborados: diasTrabajados.length,
        };
        empleadoComision.fecha = diasTrabajados[0];
        empleadoComision.dias_laborados = diasTrabajados.length;
      }

      empleadosComisiones.push(empleadoComision);
    });

    const cumplimiento_tienda = calculateCompliance(
      tiendaData.ventasTotal,
      presupuestoTotalTienda
    );

    const total_comisiones = round(
      empleadosComisiones.reduce((sum, e) => sum + e.comision_monto, 0)
    );

    tiendaResumenes.push({
      tienda: tiendaData.tienda,
      tienda_id: tiendaData.tienda_id,
      empresa: tiendaData.empresa,
      fecha: tiendaData.fechas[0],
      presupuesto_tienda: round(presupuestoTotalTienda),
      ventas_tienda: round(tiendaData.ventasTotal),
      cumplimiento_tienda_pct: cumplimiento_tienda,
      empleados: empleadosComisiones,
      total_comisiones,
    });
  });

  const total_comisiones = round(
    tiendaResumenes.reduce((sum, t) => sum + t.total_comisiones, 0)
  );

  const comisiones_por_rol: Record<Role, number> = {
    gerente: 0,
    asesor: 0,
    cajero: 0,
    logistico: 0,
    gerente_online: 0,
    coadministrador: 0,
  };

  tiendaResumenes.forEach((tienda) => {
    tienda.empleados.forEach((empleado) => {
      comisiones_por_rol[empleado.rol] += empleado.comision_monto;
    });
  });

  Object.keys(comisiones_por_rol).forEach((role) => {
    comisiones_por_rol[role as Role] = round(comisiones_por_rol[role as Role]);
  });

  tiendaResumenes.sort((a, b) => a.tienda_id - b.tienda_id);

  return {
    mes,
    tiendas: tiendaResumenes,
    total_comisiones,
    comisiones_por_rol,
  };
};