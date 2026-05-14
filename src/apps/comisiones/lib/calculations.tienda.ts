import {
  BudgetRecord,
  StaffMember,
  VentasData,
  TiendaResumen,
  EmployeeCommission,
  CommissionThresholdConfig,
} from "../types";
import {
  round,
  getEmployeeVentas,
  getTiendaVentas,
} from "./calculations.utils";
import {
  calculateEmployeeCommission,
  calculateGerenteCommission,
  calculateCajeroCommission,
  calculateLogisticoCommission,
  calculateGerenteOnlineCommission,
  calculateCompliance,
} from "./calculations.commissions";

export const calculateTiendaResumen = (
  tienda: string,
  fecha: string,
  budgets: BudgetRecord[],
  staff: StaffMember[],
  ventasData: VentasData[],
  porcentaje_gerente: number,
  presupuestosEmpleados?: any[],
  thresholdConfig?: CommissionThresholdConfig | null
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

  const cantidad_asesores = tiendaStaff.filter(
    (s) => s.rol === "asesor"
  ).length;

  const cantidad_coadministradores = tiendaStaff.filter(
    (s) => s.rol === "coadministrador"
  ).length;

  const empleados: EmployeeCommission[] = tiendaStaff.map((empleado) => {
    if (empleado.rol === "cajero") {
      const totalEmpleadosDia = tiendaStaff.length;

      const ventasIndividuales = getEmployeeVentas(
        ventasData,
        tienda,
        fecha,
        empleado.id
      );

      const presupuestoDiario = presupuestosEmpleados?.find(
        (pe) =>
          pe.advisor_id.toString() === empleado.id.toString() && pe.date === fecha
      );
      const presupuestoIndividual = presupuestoDiario?.budget || 0;

      return calculateCajeroCommission(
        empleado,
        tiendaVentas,
        budget.presupuesto_total,
        totalEmpleadosDia,
        ventasIndividuales,
        presupuestoIndividual,
        thresholdConfig?.compliance_values
      );
    } else if (empleado.rol === "logistico") {
      const totalEmpleadosDia = tiendaStaff.length;

      const ventasIndividuales = getEmployeeVentas(
        ventasData,
        tienda,
        fecha,
        empleado.id
      );

      const presupuestoDiario = presupuestosEmpleados?.find(
        (pe) =>
          pe.advisor_id.toString() === empleado.id.toString() && pe.date === fecha
      );
      const presupuestoIndividual = presupuestoDiario?.budget || 0;

      return calculateLogisticoCommission(
        empleado,
        tiendaVentas,
        budget.presupuesto_total,
        totalEmpleadosDia,
        ventasIndividuales,
        presupuestoIndividual,
        thresholdConfig?.compliance_values
      );
    } else if (empleado.rol === "gerente_online") {
      const ventasIndividuales = getEmployeeVentas(
        ventasData,
        tienda,
        fecha,
        empleado.id
      );

      const presupuestoIndividual = 1;

      return calculateGerenteOnlineCommission(
        empleado,
        ventasIndividuales,
        presupuestoIndividual
      );
    } else if (empleado.rol === "gerente") {
      let presupuestoGerente = 0;
      let ventasIndividualesGerente = 0;

      const presupuestoDiario = presupuestosEmpleados?.find(
        (pe) =>
          pe.advisor_id.toString() === empleado.id.toString() && pe.date === fecha
      );

      if (presupuestoDiario) {
        presupuestoGerente = presupuestoDiario.budget;
      } else {
        presupuestoGerente = round(
          (budget.presupuesto_total * porcentaje_gerente) / 100
        );
      }

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
        tiendaVentas,
        budget.presupuesto_total,
        thresholdConfig?.compliance_values
      );
    } else {
      let presupuesto = 0;
      let ventas = 0;

      const presupuestoDiario = presupuestosEmpleados?.find(
        (pe) =>
          pe.advisor_id.toString() === empleado.id.toString() && pe.date === fecha
      );

      if (presupuestoDiario) {
        presupuesto = presupuestoDiario.budget;
      } else {
        const presupuesto_asesores =
          budget.presupuesto_total * ((100 - porcentaje_gerente) / 100);
        const cantidad_total_asesores =
          cantidad_asesores + cantidad_coadministradores;
        presupuesto =
          cantidad_total_asesores === 0
            ? 0
            : round(presupuesto_asesores / cantidad_total_asesores);
      }

      ventas = getEmployeeVentas(ventasData, tienda, fecha, empleado.id);

      return calculateEmployeeCommission(
        empleado,
        presupuesto,
        ventas,
        thresholdConfig?.compliance_values
      );
    }
  });

  const empleadosFiltrados = empleados.filter(
    (emp) => !(emp.ventas === 0 && emp.presupuesto === 0)
  );

  const presupuestoTotalTienda = empleadosFiltrados.reduce(
    (sum, e) => sum + (e.presupuesto || 0),
    0
  );

  const cumplimiento_tienda = calculateCompliance(
    tiendaVentas,
    presupuestoTotalTienda
  );
  const total_comisiones = round(
    empleadosFiltrados.reduce((sum, e) => sum + e.comision_monto, 0)
  );

  return {
    tienda,
    tienda_id: budget.tienda_id,
    empresa: budget.empresa,
    fecha,
    presupuesto_tienda: round(presupuestoTotalTienda),
    ventas_tienda: round(tiendaVentas),
    cumplimiento_tienda_pct: cumplimiento_tienda,
    empleados: empleadosFiltrados,
    total_comisiones,
  };
};