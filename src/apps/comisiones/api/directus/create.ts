import directus from "@/services/directus/directus";
import {
  createItems,
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
    console.log("💾 Guardando presupuestos empleados:", presupuestos);
    const created = await withAutoRefresh(() =>
      directus.request(
        createItems("presupuesto_diario_empleados", presupuestos)
      )
    );
    console.log("✅ Presupuestos empleados guardados:", created);
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
              ventas: venta.ventas,
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
