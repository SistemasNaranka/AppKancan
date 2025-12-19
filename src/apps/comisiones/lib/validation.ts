/**
 * Validaciones para datos de presupuestos y configuración
 */

import { BudgetRecord, StaffMember, MonthConfig } from "../types";

export interface ValidationError {
  row?: number;
  field: string;
  message: string;
}

/**
 * Valida un registro de presupuesto
 */
export const validateBudgetRecord = (
  record: any,
  rowIndex: number
): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!record.tienda || record.tienda.trim() === "") {
    errors.push({
      row: rowIndex,
      field: "tienda",
      message: "La tienda es requerida",
    });
  }

  if (!record.fecha || record.fecha.trim() === "") {
    errors.push({
      row: rowIndex,
      field: "fecha",
      message: "La fecha es requerida",
    });
  } else {
    // Validar formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(record.fecha)) {
      errors.push({
        row: rowIndex,
        field: "fecha",
        message: "La fecha debe estar en formato YYYY-MM-DD",
      });
    } else {
      const date = new Date(record.fecha + "T00:00:00Z");
      if (isNaN(date.getTime())) {
        errors.push({
          row: rowIndex,
          field: "fecha",
          message: "La fecha no es válida",
        });
      }
    }
  }

  if (!record.presupuesto_total || record.presupuesto_total === "") {
    errors.push({
      row: rowIndex,
      field: "presupuesto_total",
      message: "El presupuesto total es requerido",
    });
  } else {
    const presupuesto = parseFloat(record.presupuesto_total);
    if (isNaN(presupuesto)) {
      errors.push({
        row: rowIndex,
        field: "presupuesto_total",
        message: "El presupuesto debe ser un número",
      });
    } else if (presupuesto <= 0) {
      errors.push({
        row: rowIndex,
        field: "presupuesto_total",
        message: "El presupuesto debe ser mayor a 0",
      });
    }
  }

  return errors;
};

/**
 * Valida la configuración de porcentaje de gerente
 */
export const validateManagerPercentage = (
  percentage: number
): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (isNaN(percentage)) {
    errors.push({
      field: "porcentaje_gerente",
      message: "El porcentaje debe ser un número",
    });
  } else if (percentage < 0 || percentage > 10) {
    errors.push({
      field: "porcentaje_gerente",
      message: "El porcentaje debe estar entre 0 y 10%",
    });
  }

  return errors;
};

/**
 * Valida un miembro del personal
 */
export const validateStaffMember = (
  member: any,
  rowIndex: number
): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!member.nombre || member.nombre.trim() === "") {
    errors.push({
      row: rowIndex,
      field: "nombre",
      message: "El nombre es requerido",
    });
  }

  if (!member.tienda || member.tienda.trim() === "") {
    errors.push({
      row: rowIndex,
      field: "tienda",
      message: "La tienda es requerida",
    });
  }

  if (!member.fecha || member.fecha.trim() === "") {
    errors.push({
      row: rowIndex,
      field: "fecha",
      message: "La fecha es requerida",
    });
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(member.fecha)) {
      errors.push({
        row: rowIndex,
        field: "fecha",
        message: "La fecha debe estar en formato YYYY-MM-DD",
      });
    }
  }

  if (
    !member.rol ||
    !["gerente", "asesor", "coadministrador", "logistico", "cajero"].includes(
      member.rol
    )
  ) {
    errors.push({
      row: rowIndex,
      field: "rol",
      message:
        "El rol debe ser gerente, asesor, coadministrador, logístico o cajero",
    });
  }

  return errors;
};

/**
 * Valida que haya al menos un asesor por tienda/fecha
 */
export const validateStaffAssignment = (
  staff: StaffMember[]
): ValidationError[] => {
  const errors: ValidationError[] = [];
  const tiendaFechaMap = new Map<string, number>();

  staff.forEach((member) => {
    if (member.rol === "asesor") {
      const key = `${member.tienda}|${member.fecha}`;
      tiendaFechaMap.set(key, (tiendaFechaMap.get(key) || 0) + 1);
    }
  });

  // Verificar que cada tienda/fecha tenga al menos un asesor
  const tiendaFechas = new Set<string>();
  staff.forEach((member) => {
    tiendaFechas.add(`${member.tienda}|${member.fecha}`);
  });

  tiendaFechas.forEach((key) => {
    if (!tiendaFechaMap.has(key)) {
      const [tienda, fecha] = key.split("|");
      errors.push({
        field: "staff",
        message: `No hay asesores asignados a la tienda ${tienda} para la fecha ${fecha}`,
      });
    }
  });

  return errors;
};
