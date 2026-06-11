import directus from "@/services/directus/directus";
import {
  createItem,
  createItems,
  updateItem,
  updateItems,
  deleteItems,
  readItems,
} from "@directus/sdk";
import {
  DirectusStaffDailyBudget,
  DirectusPorcentajeMensual,
  DirectusStoreDailyBudget,
  DirectusVentasDiariasEmpleado,
  DirectusVentasDiariasTienda,
  DirectusPosition,
} from "../../types";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
/**
 * Crear o actualizar porcentajes mensuales
 */
export async function guardarPorcentajesMensuales(
  porcentajes: Omit<DirectusPorcentajeMensual, "id">,
): Promise<DirectusPorcentajeMensual> {
  try {
    const existentes = await directus.request(
      readItems("com_monthly_budget_percentages", {
        filter: {
          month: { _eq: porcentajes.fecha.split("-")[1] },
          year: { _eq: porcentajes.fecha.split("-")[0] },
        },
        limit: 1,
      }),
    );

    if (existentes.length > 0) {
      const updated = await withAutoRefresh(() =>
        directus.request(
          updateItems("com_monthly_budget_percentages", existentes[0].id, {
            role_config: [
              {
                role: "gerente",
                calculation_type:
                  porcentajes.gerente_tipo === "fijo"
                    ? "Fixed"
                    : "Distributive",
                percentage: porcentajes.gerente_porcentaje,
              },
              {
                role: "asesor",
                calculation_type:
                  porcentajes.asesor_tipo === "fijo" ? "Fixed" : "Distributive",
                percentage: porcentajes.asesor_porcentaje,
              },
              {
                role: "cajero",
                calculation_type:
                  porcentajes.cajero_tipo === "fijo" ? "Fixed" : "Distributive",
                percentage: porcentajes.cajero_porcentaje,
              },
              {
                role: "logistico",
                calculation_type:
                  porcentajes.logistico_tipo === "fijo"
                    ? "Fixed"
                    : "Distributive",
                percentage: porcentajes.logistico_porcentaje,
              },
            ],
          }),
        ),
      );
      return updated[0] as any;
    } else {
      const payload = {
        month: porcentajes.fecha.split("-")[1],
        year: porcentajes.fecha.split("-")[0],
        role_config: [
          {
            role: "gerente",
            calculation_type:
              porcentajes.gerente_tipo === "fijo" ? "Fixed" : "Distributive",
            percentage: porcentajes.gerente_porcentaje,
          },
          {
            role: "asesor",
            calculation_type:
              porcentajes.asesor_tipo === "fijo" ? "Fixed" : "Distributive",
            percentage: porcentajes.asesor_porcentaje,
          },
          {
            role: "cajero",
            calculation_type:
              porcentajes.cajero_tipo === "fijo" ? "Fixed" : "Distributive",
            percentage: porcentajes.cajero_porcentaje,
          },
          {
            role: "logistico",
            calculation_type:
              porcentajes.logistico_tipo === "fijo" ? "Fixed" : "Distributive",
            percentage: porcentajes.logistico_porcentaje,
          },
        ],
      };
      const created = await withAutoRefresh(() =>
        directus.request(
          createItems("com_monthly_budget_percentages", [payload]),
        ),
      );
      return created[0] as any;
    }
  } catch (error) {
    console.error("❌ Error al guardar porcentajes mensuales:", error);
    throw error;
  }
}

/**
 * Crear presupuestos diarios para empleados
 */
export async function guardarPresupuestosEmpleados(
  presupuestos: Omit<DirectusStaffDailyBudget, "id">[],
): Promise<DirectusStaffDailyBudget[]> {
  try {
    const created = await withAutoRefresh(() =>
      directus.request(createItems("com_employee_daily_budgets", presupuestos)),
    );

    return created as DirectusStaffDailyBudget[];
  } catch (error) {
    console.error("❌ Error al guardar presupuestos empleados:", error);
    throw error;
  }
}

/**
 * Eliminar presupuestos diarios de empleados para una fecha y tienda
 */
export async function eliminarPresupuestosEmpleados(
  tiendaId: number,
  fecha: string,
): Promise<void> {
  try {
    await withAutoRefresh(() =>
      directus.request(
        deleteItems("com_employee_daily_budgets", {
          filter: {
            store_id: { _eq: tiendaId },
            date: { _eq: fecha },
          },
        }),
      ),
    );
  } catch (error) {
    console.error("❌ Error al eliminar presupuestos empleados:", error);
    throw error;
  }
}

/**
 * Actualizar presupuesto diario de un empleado específico
 */
export async function actualizarPresupuestoEmpleado(
  id: number,
  presupuesto: number,
): Promise<DirectusStaffDailyBudget> {
  try {
    const updated = await withAutoRefresh(() =>
      directus.request(
        updateItems("com_employee_daily_budgets", [id], {
          budget: presupuesto,
        }),
      ),
    );

    return updated[0] as DirectusStaffDailyBudget;
  } catch (error) {
    console.error("❌ Error al actualizar presupuesto empleado:", error);
    throw error;
  }
}

/**
 * Eliminar presupuesto diario de un empleado específico
 */
export async function eliminarPresupuestoEmpleado(id: number): Promise<void> {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItems("com_employee_daily_budgets", [id])),
    );
  } catch (error) {
    console.error("❌ Error al eliminar presupuesto empleado:", error);
    throw error;
  }
}

/**
 * Crear o actualizar ventas diarias de empleados
 */
export async function guardarVentasEmpleados(
  ventas: Omit<DirectusVentasDiariasEmpleado, "id">[],
): Promise<DirectusVentasDiariasEmpleado[]> {
  try {
    const results: DirectusVentasDiariasEmpleado[] = [];

    for (const venta of ventas) {
      const existentes = await directus.request(
        readItems("com_employee_daily_sales", {
          filter: {
            advisor_id: { _eq: venta.advisor_id },
            date: { _eq: venta.date },
          },
          limit: 1,
        }),
      );

      if (existentes.length > 0) {
        const updated = await withAutoRefresh(() =>
          directus.request(
            updateItems("com_employee_daily_sales", existentes[0].id, {
              sale: venta.sale,
            }),
          ),
        );
        results.push(updated[0] as DirectusVentasDiariasEmpleado);
      } else {
        const created = await withAutoRefresh(() =>
          directus.request(createItems("com_employee_daily_sales", [venta])),
        );
        results.push(created[0] as DirectusVentasDiariasEmpleado);
      }
    }

    return results;
  } catch (error) {
    console.error("❌ Error al guardar ventas empleados:", error);
    throw error;
  }
}

/**
 * Crear o actualizar ventas diarias de tienda
 */
export async function guardarVentasTienda(
  venta: Omit<DirectusVentasDiariasTienda, "id">,
): Promise<DirectusVentasDiariasTienda> {
  try {
    const existentes = await directus.request(
      readItems("venta_diaria_tienda", {
        filter: {
          tienda_id: { _eq: venta.tienda_id },
          fecha: { _eq: venta.fecha },
        },
        limit: 1,
      }),
    );

    if (existentes.length > 0) {
      const updated = await withAutoRefresh(() =>
        directus.request(
          updateItems("venta_diaria_tienda", existentes[0].id, {
            ventas_totales: venta.ventas_totales,
          }),
        ),
      );
      return updated[0] as DirectusVentasDiariasTienda;
    } else {
      const created = await withAutoRefresh(() =>
        directus.request(createItems("venta_diaria_tienda", [venta])),
      );
      return created[0] as DirectusVentasDiariasTienda;
    }
  } catch (error) {
    console.error("❌ Error al guardar ventas tienda:", error);
    throw error;
  }
}

/**
 * Crear presupuestos diarios de tienda (desde CSV)
 */
export async function guardarPresupuestosTienda(
  presupuestos: Omit<DirectusStoreDailyBudget, "id">[],
): Promise<DirectusStoreDailyBudget[]> {
  try {
    const results: DirectusStoreDailyBudget[] = [];

    for (const presupuesto of presupuestos) {
      const existentes = await directus.request(
        readItems("com_store_daily_budgets", {
          filter: {
            store_id: { _eq: presupuesto.store_id },
            date: { _eq: presupuesto.date },
          },
          limit: 1,
        }),
      );

      if (existentes.length > 0) {
        const updated = await withAutoRefresh(() =>
          directus.request(
            updateItems("com_store_daily_budgets", existentes[0].id, {
              budget: presupuesto.budget,
            }),
          ),
        );
        results.push(updated[0] as DirectusStoreDailyBudget);
      } else {
        const created = await withAutoRefresh(() =>
          directus.request(
            createItems("com_store_daily_budgets", [presupuesto]),
          ),
        );
        results.push(created[0] as DirectusStoreDailyBudget);
      }
    }

    return results;
  } catch (error) {
    console.error("❌ Error al guardar presupuestos tienda:", error);
    throw error;
  }
}

/**
 * Crear un nuevo cargo
 */
export async function createCargo(
  cargo: Omit<DirectusPosition, "id">,
): Promise<DirectusPosition> {
  try {
    const created = await withAutoRefresh(() =>
      directus.request(createItems("core_positions", [cargo])),
    );
    return created[0] as DirectusPosition;
  } catch (error) {
    console.error("❌ Error al crear cargo:", error);
    throw error;
  }
}

/**
 * Guardar configuración de presupuesto mensual por rol (Formato Simplificado)
 */
export async function saveRoleBudgetConfiguration(data: {
  id?: number | string;
  mes: string;
  roleConfigs: {
    role: string;
    calculation_type: "Fijo" | "Distributivo";
    percentage: number;
  }[];
}): Promise<any> {
  try {
    let anio: number = 0;
    let mes: number = 0;

    const [anioStr, mesStr] = data.mes.split("-");
    anio = parseInt(anioStr);
    mes = parseInt(mesStr);

    if (isNaN(anio) || isNaN(mes)) {
      throw new Error(`Fecha inválida recibida: "${data.mes}"`);
    }

    let recordId = data.id;
    if (!recordId) {
      const existingFilter = {
        _and: [{ month: { _eq: mesStr } }, { year: { _eq: anioStr } }],
      };

      const existentes = await withAutoRefresh(() =>
        directus.request(
          readItems("com_monthly_budget_percentages", {
            filter: existingFilter,
            limit: 1,
          }),
        ),
      );

      if (existentes && existentes.length > 0) {
        recordId = existentes[0].id;
      }
    }

    const finalConfigs = data.roleConfigs.map((c) => ({
      role: c.role,
      calculation_type:
        c.calculation_type === "Distributivo" ? "Distributive" : "Fixed",
      percentage: c.calculation_type === "Distributivo" ? 0 : c.percentage,
    }));

    if (recordId) {
      const idToUpdate = recordId;
      return await withAutoRefresh(() =>
        directus.request(
          updateItem("com_monthly_budget_percentages", idToUpdate, {
            role_config: finalConfigs,
          }),
        ),
      );
    } else {
      const payload = {
        month: mes.toString().padStart(2, "0"),
        year: anio.toString(),
        role_config: finalConfigs,
      };

      return await withAutoRefresh(() =>
        directus.request(createItem("com_monthly_budget_percentages", payload)),
      );
    }
  } catch (error: any) {
    console.error("❌ Error en saveRoleBudgetConfiguration:", error);
    const directusError = error.errors?.[0]?.message || error.message;
    throw new Error(
      directusError || "Error desconocido al procesar la configuración.",
    );
  }
}

/**
 * Guardar configuración de umbrales de comisión mensual
 * Tabla: com_monthly_commission_compliance
 * Campo JSON: compliance_values
 */
export async function guardarUmbralesComisiones(data: {
  id?: number | string;
  mes: string;
  compliance_values: Array<{
    min_compliance: number;
    pct_commission: number;
    name: string;
    color?: string;
  }>;
}): Promise<any> {
  try {
    const [anioStr, mesStr] = data.mes.split("-");
    const anio = anioStr;
    const mes = mesStr;

    let recordId = data.id;

    if (!recordId) {
      const existingFilter = {
        _and: [{ month: { _eq: mes } }, { year: { _eq: anio } }],
      };

      const existentes = await withAutoRefresh(() =>
        directus.request(
          readItems("com_monthly_commission_compliance", {
            filter: existingFilter,
            limit: 1,
          }),
        ),
      );

      if (existentes && existentes.length > 0) {
        recordId = existentes[0].id;
      }
    }

    const valoresOrdenados = [...data.compliance_values].sort(
      (a, b) => a.min_compliance - b.min_compliance,
    );

    if (recordId) {
      const idToUpdate = recordId;
      return await withAutoRefresh(() =>
        directus.request(
          updateItem("com_monthly_commission_compliance", idToUpdate, {
            compliance_values: valoresOrdenados,
          }),
        ),
      );
    } else {
      const payload = {
        month: mes,
        year: anio,
        compliance_values: valoresOrdenados,
      };

      return await withAutoRefresh(() =>
        directus.request(
          createItem("com_monthly_commission_compliance", payload),
        ),
      );
    }
  } catch (error: any) {
    console.error("❌ Error al guardar umbrales de comisiones:", error);
    const directusError = error.errors?.[0]?.message || error.message;
    throw new Error(directusError || "Error desconocido al guardar umbrales.");
  }
}
