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
  DirectusPresupuestoDiarioEmpleado,
  DirectusPorcentajeMensual,
  DirectusPresupuestoDiarioTienda,
  DirectusVentasDiariasEmpleado,
  DirectusVentasDiariasTienda,
  DirectusCargo,
} from "../../types";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";

// ==================== FUNCIONES DE CREACIÓN ====================

/**
 * Crear o actualizar porcentajes mensuales
 */
export async function guardarPorcentajesMensuales(
  porcentajes: Omit<DirectusPorcentajeMensual, "id">
): Promise<DirectusPorcentajeMensual> {
  try {
    // Verificar si ya existe para este mes
    const existentes = await directus.request(
      readItems("porcentaje_mensual_presupuesto", {
        filter: {
          fecha: { _eq: porcentajes.fecha },
        },
        limit: 1,
      })
    );

    if (existentes.length > 0) {
      // Actualizar
      const updated = await withAutoRefresh(() =>
        directus.request(
          updateItems("porcentaje_mensual_presupuesto", existentes[0].id, {
            gerente_tipo: porcentajes.gerente_tipo,
            gerente_porcentaje: porcentajes.gerente_porcentaje,
            asesor_tipo: porcentajes.asesor_tipo,
            asesor_porcentaje: porcentajes.asesor_porcentaje,
            cajero_tipo: porcentajes.cajero_tipo,
            cajero_porcentaje: porcentajes.cajero_porcentaje,
            logistico_tipo: porcentajes.logistico_tipo,
            logistico_porcentaje: porcentajes.logistico_porcentaje,
          })
        )
      );
      return updated[0] as DirectusPorcentajeMensual;
    } else {
      // Crear
      const created = await withAutoRefresh(() =>
        directus.request(
          createItems("porcentaje_mensual_presupuesto", [porcentajes])
        )
      );
      return created[0] as DirectusPorcentajeMensual;
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
  presupuestos: Omit<DirectusPresupuestoDiarioEmpleado, "id">[]
): Promise<DirectusPresupuestoDiarioEmpleado[]> {
  try {
    const created = await withAutoRefresh(() =>
      directus.request(
        createItems("presupuesto_diario_empleados", presupuestos)
      )
    );

    return created as DirectusPresupuestoDiarioEmpleado[];
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
  fecha: string
): Promise<void> {
  try {
    await withAutoRefresh(() =>
      directus.request(
        deleteItems("presupuesto_diario_empleados", {
          filter: {
            tienda_id: { _eq: tiendaId },
            fecha: { _eq: fecha },
          },
        })
      )
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
  presupuesto: number
): Promise<DirectusPresupuestoDiarioEmpleado> {
  try {
    const updated = await withAutoRefresh(() =>
      directus.request(
        updateItems("presupuesto_diario_empleados", [id], {
          presupuesto: presupuesto,
        })
      )
    );

    return updated[0] as DirectusPresupuestoDiarioEmpleado;
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
      directus.request(deleteItems("presupuesto_diario_empleados", [id]))
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
  ventas: Omit<DirectusVentasDiariasEmpleado, "id">[]
): Promise<DirectusVentasDiariasEmpleado[]> {
  try {
    // Para cada venta, verificar si existe y actualizar o crear
    const results: DirectusVentasDiariasEmpleado[] = [];

    for (const venta of ventas) {
      const existentes = await directus.request(
        readItems("ventas_diarias_empleado", {
          filter: {
            asesor_id: { _eq: venta.asesor_id },
            fecha: { _eq: venta.fecha },
          },
          limit: 1,
        })
      );

      if (existentes.length > 0) {
        // Actualizar
        const updated = await withAutoRefresh(() =>
          directus.request(
            updateItems("ventas_diarias_empleado", existentes[0].id, {
              venta: venta.venta,
            })
          )
        );
        results.push(updated[0] as DirectusVentasDiariasEmpleado);
      } else {
        // Crear
        const created = await withAutoRefresh(() =>
          directus.request(createItems("ventas_diarias_empleado", [venta]))
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
  venta: Omit<DirectusVentasDiariasTienda, "id">
): Promise<DirectusVentasDiariasTienda> {
  try {
    const existentes = await directus.request(
      readItems("ventas_diarias_tienda", {
        filter: {
          tienda_id: { _eq: venta.tienda_id },
          fecha: { _eq: venta.fecha },
        },
        limit: 1,
      })
    );

    if (existentes.length > 0) {
      // Actualizar
      const updated = await withAutoRefresh(() =>
        directus.request(
          updateItems("ventas_diarias_tienda", existentes[0].id, {
            ventas_totales: venta.ventas_totales,
          })
        )
      );
      return updated[0] as DirectusVentasDiariasTienda;
    } else {
      // Crear
      const created = await withAutoRefresh(() =>
        directus.request(createItems("ventas_diarias_tienda", [venta]))
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
  presupuestos: Omit<DirectusPresupuestoDiarioTienda, "id">[]
): Promise<DirectusPresupuestoDiarioTienda[]> {
  try {
    const results: DirectusPresupuestoDiarioTienda[] = [];

    for (const presupuesto of presupuestos) {
      const existentes = await directus.request(
        readItems("presupuestos_diario_tienda", {
          filter: {
            tienda_id: { _eq: presupuesto.tienda_id },
            fecha: { _eq: presupuesto.fecha },
          },
          limit: 1,
        })
      );

      if (existentes.length > 0) {
        // Actualizar
        const updated = await withAutoRefresh(() =>
          directus.request(
            updateItems("presupuestos_diario_tienda", existentes[0].id, {
              presupuesto: presupuesto.presupuesto,
            })
          )
        );
        results.push(updated[0] as DirectusPresupuestoDiarioTienda);
      } else {
        // Crear
        const created = await withAutoRefresh(() =>
          directus.request(
            createItems("presupuestos_diario_tienda", [presupuesto])
          )
        );
        results.push(created[0] as DirectusPresupuestoDiarioTienda);
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
  cargo: Omit<DirectusCargo, "id">
): Promise<DirectusCargo> {
  try {
    const created = await withAutoRefresh(() =>
      directus.request(createItems("util_cargo", [cargo]))
    );
    return created[0] as DirectusCargo;
  } catch (error) {
    console.error("❌ Error al crear cargo:", error);
    throw error;
  }
}

/**
 * Guardar configuración de presupuesto mensual por rol (Formato Simplificado)
 */
export async function saveRoleBudgetConfiguration(data: {
  id?: number | string; // ID opcional para actualización directa
  mes: string; // "YYYY-MM"
  roleConfigs: {
    rol: string;
    tipo_calculo: "Fijo" | "Distributivo";
    porcentaje: number;
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

    // Si no tenemos ID, buscamos por mes/año (fallback legacy)
    if (!recordId) {
      // 1. Buscar configuración existente usando STRINGs para asegurar coincidencia exacta
      // Ya que guardamos mes como "01", "12" etc. y anio como string
      const existingFilter = {
        _and: [
          { mes: { _eq: mesStr } },
          { anio: { _eq: anioStr } }
        ]
      };

      console.log("[saveRoleBudgetConfiguration] Buscando existente con:", JSON.stringify(existingFilter));

      const existentes = await withAutoRefresh(() =>
        directus.request(
          readItems("porcentaje_mensual_presupuesto", {
            filter: existingFilter,
            limit: 1,
          })
        )
      );

      if (existentes && existentes.length > 0) {
        recordId = existentes[0].id;
      }
    }

    // 2. Preparar las configuraciones enviadas
    const finalConfigs = data.roleConfigs.map(c => ({
      rol: c.rol,
      tipo_calculo: c.tipo_calculo,
      porcentaje: c.tipo_calculo === "Distributivo" ? 0 : c.porcentaje
    }));

    // 3. Guardar cambios
    if (recordId) {
      console.log(`[saveRoleBudgetConfiguration] Actualizando ID ${recordId} con ${finalConfigs.length} roles.`);
      return await withAutoRefresh(() =>
        directus.request(
          updateItem("porcentaje_mensual_presupuesto", recordId, {
            configuracion_roles: finalConfigs,
          })
        )
      );
    } else {
      const payload = {
        mes: mes.toString().padStart(2, '0'),
        anio: anio.toString(),
        configuracion_roles: finalConfigs,
      };

      console.log("[saveRoleBudgetConfiguration] Creando nuevo registro:", JSON.stringify(payload));

      return await withAutoRefresh(() =>
        directus.request(
          createItem("porcentaje_mensual_presupuesto", payload)
        )
      );
    }
  } catch (error: any) {
    console.error("❌ Error en saveRoleBudgetConfiguration:", error);
    const directusError = error.errors?.[0]?.message || error.message;
    throw new Error(directusError || "Error desconocido al procesar la configuración.");
  }
}
