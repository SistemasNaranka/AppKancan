import { StaffMember, EmployeeCommission, CommissionThreshold } from "../types";
import {
  round,
  getNextCommission,
  getNextBudget,
  getNextSale,
} from "./calculations.utils";

export const calculateCompliance = (
  ventas: number,
  presupuesto: number
): number => {
  if (presupuesto === 0) return 0;
  return Math.round((ventas / presupuesto) * 100 * 10000) / 10000;
};

export const calculateBaseSale = (
  venta_total: number,
  iva_factor: number = 1.19
): number => {
  return round(venta_total / iva_factor);
};

const DEFAULT_THRESHOLDS = [
  {
    id: "default-1",
    min_compliance: 90,
    pct_commission: 0.0035,
    name: "Muy Regular",
  },
  {
    id: "default-2",
    min_compliance: 95,
    pct_commission: 0.005,
    name: "Regular",
  },
  {
    id: "default-3",
    min_compliance: 100,
    pct_commission: 0.007,
    name: "Buena",
  },
  {
    id: "default-4",
    min_compliance: 110,
    pct_commission: 0.01,
    name: "Excelente",
  },
];

export const getCommissionPercentage = (
  compliance: number,
  thresholdConfig?: CommissionThreshold[]
): number => {
  const umbrales =
    thresholdConfig && thresholdConfig.length > 0
      ? thresholdConfig
      : DEFAULT_THRESHOLDS;

      const umbral = umbrales
    .sort((a, b) => b.min_compliance - a.min_compliance)
    .find((u) => compliance >= u.min_compliance);

  return umbral?.pct_commission || 0;
};

export const calculateCommissionAmount = (
  venta_sin_iva: number,
  comision_pct: number
): number => {
  return round(venta_sin_iva * comision_pct);
};

const calculateNextValues = (
  comision_pct: number,
  presupuesto: number,
  ventas: number,
  thresholdConfig?: CommissionThreshold[]
) => {
  const proxima_comision = getNextCommission(comision_pct, thresholdConfig);

  const proximo_presupuesto = getNextBudget(
    proxima_comision,
    presupuesto,
    thresholdConfig
  );

  let proxima_venta: number | null = null;
  if (proximo_presupuesto !== null) {
    proxima_venta = getNextSale(proximo_presupuesto, ventas);

    if (proxima_venta !== null && proxima_venta <= 0) {
      proxima_venta = null;
    }
  }
  let proximo_monto_comision: number | null = null;
  if (
    proximo_presupuesto !== null &&
    proxima_comision !== null &&
    typeof proxima_comision === "number"
  ) {
    proximo_monto_comision = round(
      (proximo_presupuesto * proxima_comision) / 1.19
    );
  }

  return {
    proxima_comision,
    proximo_presupuesto,
    proxima_venta,
    proximo_monto_comision,
  };
};

export const calculateEmployeeCommission = (
  empleado: StaffMember,
  presupuesto: number,
  ventas: number,
  thresholdConfig?: CommissionThreshold[]
): EmployeeCommission => {
  const cumplimiento = calculateCompliance(ventas, presupuesto);
  const venta_sin_iva = calculateBaseSale(ventas);
  const comision_pct = getCommissionPercentage(cumplimiento, thresholdConfig);
  const comision_monto = calculateCommissionAmount(venta_sin_iva, comision_pct);

  const {
    proxima_comision,
    proximo_presupuesto,
    proxima_venta,
    proximo_monto_comision,
  } = calculateNextValues(comision_pct, presupuesto, ventas, thresholdConfig);

  return {
    id: empleado.id,
    nombre: empleado.nombre,
    documento: empleado.documento,
    rol: empleado.rol,
    tienda: empleado.tienda,
    fecha: empleado.fecha,
    presupuesto: presupuesto,
    ventas: ventas,
    cumplimiento_pct: cumplimiento,
    comision_pct,
    comision_monto,
    proxima_comision,
    proximo_presupuesto: proximo_presupuesto || undefined,
    proxima_venta: proxima_venta || undefined,
    proximo_monto_comision: proximo_monto_comision || undefined,
    dias_laborados: 1,
  };
};

export const calculateGerenteCommission = (
  empleado: StaffMember,
  presupuestoGerente: number,
  ventasIndividualesGerente: number,
  ventasTiendaTotal: number,
  presupuestoTiendaTotal: number,
  thresholdConfig?: CommissionThreshold[]
): EmployeeCommission => {
  const cumplimientoTienda = calculateCompliance(
    ventasTiendaTotal,
    presupuestoTiendaTotal
  );

  const comision_pct = getCommissionPercentage(
    cumplimientoTienda,
    thresholdConfig
  );

  const ventaTiendaSinIVA = calculateBaseSale(ventasTiendaTotal);
  const comision_monto = calculateCommissionAmount(
    ventaTiendaSinIVA,
    comision_pct
  );

  const {
    proxima_comision,
    proximo_presupuesto,
    proxima_venta,
    proximo_monto_comision,
  } = calculateNextValues(
    comision_pct,
    presupuestoTiendaTotal,
    ventasTiendaTotal,
    thresholdConfig
  );

  return {
    id: empleado.id,
    nombre: empleado.nombre,
    documento: empleado.documento,
    rol: empleado.rol,
    tienda: empleado.tienda,
    fecha: empleado.fecha,
    presupuesto: presupuestoGerente,
    ventas: ventasIndividualesGerente,
    cumplimiento_pct: cumplimientoTienda || 0,
    comision_pct: comision_pct || 0,
    comision_monto,
    proxima_comision,
    proximo_presupuesto: proximo_presupuesto || undefined,
    proxima_venta: proxima_venta || undefined,
    proximo_monto_comision: proximo_monto_comision || undefined,
    dias_laborados: 1,
  };
};

const calculateCollectiveRoleCommission = (
  empleado: StaffMember,
  ventasTiendaTotal: number,
  presupuestoTiendaTotal: number,
  cantidadEmpleadosRol: number,
  ventasIndividualesEmpleado: number = 0,
  presupuestoIndividualEmpleado: number = 0,
  rol: "cajero" | "logistico",
  thresholdConfig?: CommissionThreshold[]
): EmployeeCommission => {
  const cumplimientoTienda = calculateCompliance(
    ventasTiendaTotal,
    presupuestoTiendaTotal
  );

  const comision_pct = getCommissionPercentage(
    cumplimientoTienda,
    thresholdConfig
  );

  const ventaTiendaSinIVA = calculateBaseSale(ventasTiendaTotal);

  const ventaBasePorEmpleado =
    cantidadEmpleadosRol > 0 ? ventaTiendaSinIVA / cantidadEmpleadosRol : 0;

  const comision_monto = calculateCommissionAmount(
    ventaBasePorEmpleado,
    comision_pct
  );

  const {
    proxima_comision,
    proximo_presupuesto,
    proxima_venta,
    proximo_monto_comision,
  } = calculateNextValues(
    comision_pct,
    presupuestoIndividualEmpleado,
    ventasIndividualesEmpleado,
    thresholdConfig
  );

  return {
    id: empleado.id,
    nombre: empleado.nombre,
    documento: empleado.documento,
    rol: rol,
    tienda: empleado.tienda,
    fecha: empleado.fecha,
    presupuesto: presupuestoIndividualEmpleado,
    ventas: ventasIndividualesEmpleado,
    cumplimiento_pct: cumplimientoTienda || 0,
    comision_pct: comision_pct || 0,
    comision_monto,
    proxima_comision,
    proximo_presupuesto: proximo_presupuesto || undefined,
    proxima_venta: proxima_venta || undefined,
    proximo_monto_comision: proximo_monto_comision || undefined,
    dias_laborados: 1,
  };
};

export const calculateCajeroCommission = (
  empleado: StaffMember,
  ventasTiendaTotal: number,
  presupuestoTiendaTotal: number,
  cantidadEmpleadosRol: number,
  ventasIndividualesEmpleado: number = 0,
  presupuestoIndividualEmpleado: number = 0,
  thresholdConfig?: CommissionThreshold[]
): EmployeeCommission => {
  return calculateCollectiveRoleCommission(
    empleado,
    ventasTiendaTotal,
    presupuestoTiendaTotal,
    cantidadEmpleadosRol,
    ventasIndividualesEmpleado,
    presupuestoIndividualEmpleado,
    "cajero",
    thresholdConfig
  );
};

export const calculateLogisticoCommission = (
  empleado: StaffMember,
  ventasTiendaTotal: number,
  presupuestoTiendaTotal: number,
  cantidadEmpleadosRol: number,
  ventasIndividualesEmpleado: number = 0,
  presupuestoIndividualEmpleado: number = 0,
  thresholdConfig?: CommissionThreshold[]
): EmployeeCommission => {
  return calculateCollectiveRoleCommission(
    empleado,
    ventasTiendaTotal,
    presupuestoTiendaTotal,
    cantidadEmpleadosRol,
    ventasIndividualesEmpleado,
    presupuestoIndividualEmpleado,
    "logistico",
    thresholdConfig
  );
};

export const calculateGerenteOnlineCommission = (
  empleado: StaffMember,
  ventasIndividualesEmpleado: number,
  presupuestoIndividualEmpleado: number = 1
): EmployeeCommission => {
  const ventaSinIVA = calculateBaseSale(ventasIndividualesEmpleado);

  const comision_pct = 0.01;
  const comision_monto = calculateCommissionAmount(ventaSinIVA, comision_pct);

  const cumplimiento = calculateCompliance(
    ventasIndividualesEmpleado,
    presupuestoIndividualEmpleado
  );

  const {
    proxima_comision,
    proximo_presupuesto,
    proxima_venta,
    proximo_monto_comision,
  } = calculateNextValues(
    comision_pct,
    presupuestoIndividualEmpleado,
    ventasIndividualesEmpleado,
    undefined
  );

  return {
    id: empleado.id,
    nombre: empleado.nombre,
    documento: empleado.documento,
    rol: "gerente_online",
    tienda: empleado.tienda,
    fecha: empleado.fecha,
    presupuesto: presupuestoIndividualEmpleado,
    ventas: ventasIndividualesEmpleado,
    cumplimiento_pct: cumplimiento || 0,
    comision_pct: comision_pct || 0,
    comision_monto,
    proxima_comision,
    proximo_presupuesto: proximo_presupuesto || undefined,
    proxima_venta: proxima_venta || undefined,
    proximo_monto_comision: proximo_monto_comision || undefined,
    dias_laborados: 1,
  };
};
