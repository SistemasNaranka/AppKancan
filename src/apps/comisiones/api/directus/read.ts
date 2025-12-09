import directus from "@/services/directus/directus";
import { readItems } from "@directus/sdk";
import {
  DirectusAsesor,
  DirectusCargo,
  DirectusTienda,
  DirectusPresupuestoDiarioTienda,
  DirectusPorcentajeMensual,
  DirectusPorcentajeMensualNuevo,
  DirectusPresupuestoDiarioEmpleado,
  DirectusVentasDiariasEmpleado,
  DirectusVentasDiariasTienda,
} from "../../types";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";

// ==================== FUNCIONES DE LECTURA CON DEBUG ====================

/**
 * Obtener todas las tiendas
 */
export async function obtenerTiendas(): Promise<DirectusTienda[]> {
  try {
    const tiendaIds = await obtenerTiendasIdsUsuarioActual();
    if (tiendaIds.length === 0) {
      console.log(
        "⚠️ [API] Usuario no tiene tiendas asociadas, devolviendo array vacío"
      );
      return [];
    }

    const filter: any = { id: { _in: tiendaIds } };

    console.log("🔄 [API] Llamando a obtenerTiendas con filtro:", filter);
    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("util_tiendas", {
          fields: ["id", "nombre", "codigo_ultra", "empresa"],
          filter,
          sort: ["id"],
          limit: -1,
        })
      )
    );
    console.log(`✅ [API] obtenerTiendas: ${data.length} tiendas obtenidas`);
    return data as DirectusTienda[];
  } catch (error) {
    console.error("❌ [API] Error en obtenerTiendas:", error);
    throw error;
  }
}

/**
 * Obtener todos los cargos
 */
export async function obtenerCargos(): Promise<DirectusCargo[]> {
  try {
    console.log("🔄 [API] Llamando a obtenerCargos...");
    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("util_cargo", {
          fields: ["id", "nombre"],
          sort: ["nombre"],
          limit: -1,
        })
      )
    );
    console.log(`✅ [API] obtenerCargos: ${data.length} cargos obtenidos`);
    return data as DirectusCargo[];
  } catch (error) {
    console.error("❌ [API] Error en obtenerCargos:", error);
    throw error;
  }
}

/**
 * Obtener todos los asesores con sus relaciones
 */
export async function obtenerAsesores(): Promise<DirectusAsesor[]> {
  try {
    console.log("🔄 [API] Llamando a obtenerAsesores...");
    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("asesores", {
          fields: [
            "id",
            "documento",
            "tienda_id.id",
            "tienda_id.nombre",
            "tienda_id.codigo_ultra",
            "cargo_id.id",
            "cargo_id.nombre",
            "nombre",
          ],
          sort: ["id"],
          limit: -1,
        })
      )
    );
    console.log(`✅ [API] obtenerAsesores: ${data.length} asesores obtenidos`);
    if (data.length > 0) {
      console.log("📋 [API] Ejemplo primer asesor:", data[0]);
    }
    return data as DirectusAsesor[];
  } catch (error) {
    console.error("❌ [API] Error en obtenerAsesores:", error);
    throw error;
  }
}

/**
 * Obtener presupuestos diarios por tienda
 */
export async function obtenerPresupuestosDiarios(
  tiendaId?: number,
  fechaInicio?: string,
  fechaFin?: string
): Promise<DirectusPresupuestoDiarioTienda[]> {
  try {
    const tiendaIds = await obtenerTiendasIdsUsuarioActual();
    const filter: any = {};

    if (tiendaId) {
      if (tiendaIds.includes(tiendaId)) {
        filter.tienda_id = { _eq: tiendaId };
      } else {
        console.warn(
          "⚠️ [API] Usuario no tiene permiso para tienda:",
          tiendaId
        );
        return [];
      }
    } else {
      if (tiendaIds.length > 0) {
        filter.tienda_id = { _in: tiendaIds };
      }
    }

    if (fechaInicio && fechaFin) {
      filter.fecha = { _between: [fechaInicio, fechaFin] };
    }

    console.log(
      "🔄 [API] Llamando a obtenerPresupuestosDiarios con filtro:",
      filter
    );

    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("presupuestos_diario_tienda", {
          fields: ["id", "tienda_id", "presupuesto", "fecha"],
          filter,
          sort: ["-fecha"],
          limit: -1,
        })
      )
    );

    console.log(
      `✅ [API] obtenerPresupuestosDiarios: ${data.length} presupuestos obtenidos`
    );
    if (data.length > 0) {
      console.log("📋 [API] Ejemplo primer presupuesto:", data[0]);
      console.log("📅 [API] Rango de fechas:", {
        primera: data[data.length - 1]?.fecha,
        ultima: data[0]?.fecha,
      });
    } else {
      console.warn(
        "⚠️ [API] No se encontraron presupuestos con el filtro:",
        filter
      );
    }

    return data as DirectusPresupuestoDiarioTienda[];
  } catch (error) {
    console.error("❌ [API] Error en obtenerPresupuestosDiarios:", error);
    throw error;
  }
}

/**
 * Obtener porcentajes mensuales desde la nueva colección
 */
export async function obtenerPorcentajesMensuales(
  tiendaId?: number,
  mesAnio?: string
): Promise<DirectusPorcentajeMensual[]> {
  try {
    const filter: any = {};
    if (mesAnio) {
      const [mesNombre, anio] = mesAnio.split(" ");
      const mesMap: { [key: string]: string } = {
        Ene: "01",
        Feb: "02",
        Mar: "03",
        Abr: "04",
        May: "05",
        Jun: "06",
        Jul: "07",
        Ago: "08",
        Sep: "09",
        Oct: "10",
        Nov: "11",
        Dic: "12",
      };
      const mesNumero = mesMap[mesNombre];
      if (mesNumero) {
        filter.mes = { _eq: mesNumero };
        filter.anio = { _eq: anio };
      }
    }

    console.log(
      "🔄 [API] Llamando a obtenerPorcentajesMensuales con filtro:",
      filter
    );

    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("porcentaje_mensual_presupuesto", {
          fields: ["id", "mes", "anio", "configuracion_roles"],
          filter,
          sort: ["-anio", "-mes"],
          limit: 1,
        })
      )
    );

    console.log(
      `✅ [API] obtenerPorcentajesMensuales: ${data.length} configuraciones obtenidas`
    );
    if (data.length > 0) {
      console.log("📋 [API] Configuración encontrada:", data[0]);
    }

    // Convertir el formato nuevo al formato esperado
    const porcentajesConvertidos: DirectusPorcentajeMensual[] = (
      data as DirectusPorcentajeMensualNuevo[]
    ).map((item) => {
      const configMap: { [key: string]: any } = {};
      item.configuracion_roles.forEach((config) => {
        const rolLower = config.rol.toLowerCase();
        configMap[`${rolLower}_tipo`] = config.tipo_calculo.toLowerCase() as
          | "fijo"
          | "distributivo";
        configMap[`${rolLower}_porcentaje`] = config.porcentaje;
      });

      return {
        id: item.id,
        fecha: `${item.anio}-${item.mes}`,
        gerente_tipo: configMap.gerente_tipo || "fijo",
        gerente_porcentaje: configMap.gerente_porcentaje || 10,
        asesor_tipo: configMap.asesor_tipo || "distributivo",
        asesor_porcentaje: configMap.asesor_porcentaje || 90,
        cajero_tipo: configMap.cajero_tipo || "distributivo",
        cajero_porcentaje: configMap.cajero_porcentaje || 0,
        logistico_tipo: configMap.logistico_tipo || "distributivo",
        logistico_porcentaje: configMap.logistico_porcentaje || 0,
      };
    });

    return porcentajesConvertidos;
  } catch (error) {
    console.error("❌ [API] Error en obtenerPorcentajesMensuales:", error);
    throw error;
  }
}

/**
 * Obtener presupuestos diarios de empleados
 */
export async function obtenerPresupuestosEmpleados(
  tiendaId?: number,
  fecha?: string
): Promise<DirectusPresupuestoDiarioEmpleado[]> {
  try {
    const tiendaIds = await obtenerTiendasIdsUsuarioActual();
    const filter: any = {};

    if (tiendaId) {
      if (tiendaIds.includes(tiendaId)) {
        filter.tienda_id = { _eq: tiendaId };
      } else {
        console.warn(
          "⚠️ [API] Usuario no tiene permiso para tienda:",
          tiendaId
        );
        return [];
      }
    } else {
      if (tiendaIds.length > 0) {
        filter.tienda_id = { _in: tiendaIds };
      }
    }

    if (fecha) filter.fecha = { _lte: fecha }; // Cambiar a <= para incluir todas las fechas hasta fecha

    console.log(
      "🔄 [API] Llamando a obtenerPresupuestosEmpleados con filtro:",
      filter
    );

    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("presupuesto_diario_empleados", {
          fields: [
            "id",
            "asesor",
            "tienda_id",
            "cargo",
            "fecha",
            "presupuesto",
          ],
          filter,
          sort: ["fecha", "asesor"],
          limit: -1,
        })
      )
    );

    console.log(
      `✅ [API] obtenerPresupuestosEmpleados que viene de la base ded datos: ${data.length} registros obtenidos`
    );
    if (data.length > 0) {
      console.log("📋 [API] Ejemplo primer registro:", data);
    } else {
      console.warn("⚠️ [API] No se encontraron presupuestos de empleados");
    }

    return data as DirectusPresupuestoDiarioEmpleado[];
  } catch (error) {
    console.error("❌ [API] Error en obtenerPresupuestosEmpleados:", error);
    throw error;
  }
}

/**
 * Obtener ventas diarias de empleados
 */
export async function obtenerVentasEmpleados(
  tiendaId?: number,
  fecha?: string
): Promise<DirectusVentasDiariasEmpleado[]> {
  try {
    const tiendaIds = await obtenerTiendasIdsUsuarioActual();
    const filter: any = {};

    if (tiendaId) {
      if (tiendaIds.includes(tiendaId)) {
        filter.tienda_id = { _eq: tiendaId };
      } else {
        console.warn(
          "⚠️ [API] Usuario no tiene permiso para tienda:",
          tiendaId
        );
        return [];
      }
    } else {
      if (tiendaIds.length > 0) {
        filter.tienda_id = { _in: tiendaIds };
      }
    }

    if (fecha) filter.fecha = { _lte: fecha }; // Cambiar a <= para incluir todas las fechas

    console.log(
      "🔄 [API] Llamando a obtenerVentasEmpleados con filtro:",
      filter
    );

    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("venta_diaria_empleado", {
          fields: ["id", "fecha", "asesor_id", "tienda_id", "venta"],
          filter,
          sort: ["fecha", "asesor_id"],
          limit: -1,
        })
      )
    );

    console.log(
      `✅ [API] obtenerVentasEmpleados: ${data.length} ventas obtenidas`
    );
    if (data.length > 0) {
      console.log("📋 [API] Ejemplo primera venta:", data[0]);
    } else {
      console.warn("⚠️ [API] No se encontraron ventas de empleados");
    }

    return data as DirectusVentasDiariasEmpleado[];
  } catch (error) {
    console.error("❌ [API] Error en obtenerVentasEmpleados:", error);
    throw error;
  }
}

/**
 * Obtener tiendas asignadas a un usuario específico
 */
export async function obtenerTiendasUsuario(
  usuarioId: number
): Promise<{ tienda_id: number; estado: string }[]> {
  try {
    console.log(
      "🔄 [API] Llamando a obtenerTiendasUsuario para usuario:",
      usuarioId
    );

    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("tiendas_usuarios", {
          fields: ["tienda_id", "estado"],
          filter: {
            usuario_id: { _eq: usuarioId },
            estado: { _eq: "Activo" },
          },
          limit: -1,
        })
      )
    );

    console.log(
      `✅ [API] obtenerTiendasUsuario: ${data.length} tiendas asignadas`
    );
    if (data.length > 0) {
      console.log("📋 [API] Tiendas asignadas:", data);
    }

    return data as { tienda_id: number; estado: string }[];
  } catch (error: any) {
    console.error("❌ [API] Error en obtenerTiendasUsuario:", error);

    // Si es error 404 (colección no existe), devolver array vacío
    if (error.response?.status === 404) {
      console.warn(
        "⚠️ [API] Colección 'tiendas_usuarios' no existe, devolviendo array vacío"
      );
      return [];
    }

    throw error;
  }
}

/**
 * Obtener IDs de tiendas asignadas al usuario actual
 */
export async function obtenerTiendasIdsUsuarioActual(): Promise<number[]> {
  try {
    console.log("🔄 [API] Llamando a obtenerTiendasIdsUsuarioActual...");

    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("usuarios_tiendas", {
          fields: ["tienda_id"],
          filter: {
            estado: { _eq: "Activo" },
          },
          limit: -1,
        })
      )
    );

    const tiendaIds = data.map((item: any) => item.tienda_id);
    console.log(
      `✅ [API] obtenerTiendasIdsUsuarioActual: ${tiendaIds.length} tiendaIds obtenidas:`,
      tiendaIds
    );
    return tiendaIds;
  } catch (error: any) {
    console.error("❌ [API] Error en obtenerTiendasIdsUsuarioActual:", error);

    // Si es error 404 (colección no existe), devolver array vacío
    if (error.response?.status === 404) {
      console.warn(
        "⚠️ [API] Colección 'tiendas_usuarios' no existe, devolviendo array vacío"
      );
      return [];
    }

    throw error;
  }
}

/**
 * Obtener ventas diarias de tienda (ya no se usa)
 */
export async function obtenerVentasTienda(): Promise<
  DirectusVentasDiariasTienda[]
> {
  return [];
}
