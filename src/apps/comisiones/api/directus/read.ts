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
} from "../../types";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Función auxiliar para convertir nombre de mes a número
 */
const getMonthNumber = (monthName: string): string => {
  const months: { [key: string]: string } = {
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
  return months[monthName] || "01";
};

// ==================== FUNCIONES DE LECTURA ====================

/**
 * Obtener todas las tiendas
 */
export async function obtenerTiendas(): Promise<DirectusTienda[]> {
  try {
    const tiendaIds = await obtenerTiendasIdsUsuarioActual();
    if (tiendaIds.length === 0) {
      return [];
    }

    const filter: any = { id: { _in: tiendaIds } };

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
    return data as DirectusTienda[];
  } catch (error) {
    throw error;
  }
}

/**
 * Obtener todos los cargos
 */
export async function obtenerCargos(): Promise<DirectusCargo[]> {
  try {
    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("util_cargo", {
          fields: ["id", "nombre"],
          sort: ["nombre"],
          limit: -1,
        })
      )
    );
    return data as DirectusCargo[];
  } catch (error) {
    throw error;
  }
}

/**
 * Obtener todos los asesores con sus relaciones
 */
export async function obtenerAsesores(): Promise<DirectusAsesor[]> {
  try {
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
    return data as DirectusAsesor[];
  } catch (error) {
    throw error;
  }
}

/**
 * Obtener la fecha actual en formato YYYY-MM-DD
 */
const getCurrentDate = (): string => {
  const now = new Date();

  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Verifica si un mes es el mes actual
 */
const isCurrentMonth = (mes: string): boolean => {
  const [mesNombre, anioStr] = mes.split(" ");
  const mesesMap: { [key: string]: number } = {
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

  const mesNumero = mesesMap[mesNombre];
  const anio = parseInt(anioStr);

  const ahora = new Date();
  return ahora.getUTCFullYear() === anio && ahora.getUTCMonth() === mesNumero;
};

/**
 * Obtener presupuestos diarios por tienda
 */
export async function obtenerPresupuestosDiarios(
  tiendaId?: number,
  fechaInicio?: string,
  fechaFin?: string,
  mesSeleccionado?: string
): Promise<DirectusPresupuestoDiarioTienda[]> {
  try {
    const tiendaIds = await obtenerTiendasIdsUsuarioActual();
    const filter: any = {};

    if (tiendaId) {
      if (tiendaIds.includes(tiendaId)) {
        filter.tienda_id = { _eq: tiendaId };
      } else {
        return [];
      }
    } else {
      if (tiendaIds.length > 0) {
        filter.tienda_id = { _in: tiendaIds };
      }
    }

    // 🚀 NUEVO: Si es el mes actual, filtrar hasta la fecha actual
    if (mesSeleccionado && isCurrentMonth(mesSeleccionado)) {
      const fechaActual = getCurrentDate();
      const [mesNombre, anio] = mesSeleccionado.split(" ");
      const mesInicio = `${anio}-${getMonthNumber(mesNombre)}-01`;

      filter.fecha = { _between: [mesInicio, fechaActual] };
    } else if (fechaInicio && fechaFin) {
      filter.fecha = { _between: [fechaInicio, fechaFin] };
    }

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

    return data as DirectusPresupuestoDiarioTienda[];
  } catch (error) {
    throw error;
  }
}

/**
 * Obtener TODOS los presupuestos diarios disponibles para obtener todos los meses
 * Esta función NO filtra por fechas para poder obtener todos los meses disponibles
 */
export async function obtenerTodosPresupuestosMeses(): Promise<string[]> {
  try {
    const tiendaIds = await obtenerTiendasIdsUsuarioActual();
    const filter: any = {};

    if (tiendaIds.length > 0) {
      filter.tienda_id = { _in: tiendaIds };
    }

    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("presupuestos_diario_tienda", {
          fields: ["fecha"],
          filter,
          sort: ["-fecha"],
          limit: -1,
        })
      )
    );

    // Extraer todos los meses únicos de las fechas
    const mesesSet = new Set<string>();
    data.forEach((item: any) => {
      const fecha = new Date(item.fecha + "T00:00:00Z");
      const meses = [
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
      const mesNombre = meses[fecha.getUTCMonth()];
      const anio = fecha.getUTCFullYear();
      mesesSet.add(`${mesNombre} ${anio}`);
    });

    const todosLosMeses = Array.from(mesesSet).sort((a, b) => {
      const [mesA, anioA] = a.split(" ");
      const [mesB, anioB] = b.split(" ");
      const mesMap: { [key: string]: number } = {
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
      const timeA = parseInt(anioA) * 12 + mesMap[mesA];
      const timeB = parseInt(anioB) * 12 + mesMap[mesB];
      return timeA - timeB;
    });

    return todosLosMeses;
  } catch (error) {
    // En caso de error, devolver array vacío para que no rompa la aplicación
    return [];
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
    throw error;
  }
}

/**
 * Obtener presupuestos diarios de empleados
 */
export async function obtenerPresupuestosEmpleados(
  tiendaId?: number,
  fecha?: string,
  mesSeleccionado?: string
): Promise<DirectusPresupuestoDiarioEmpleado[]> {
  try {
    const tiendaIds = await obtenerTiendasIdsUsuarioActual();
    const filter: any = {};

    if (tiendaId) {
      if (tiendaIds.includes(tiendaId)) {
        filter.tienda_id = { _eq: tiendaId };
      } else {
        return [];
      }
    } else {
      if (tiendaIds.length > 0) {
        filter.tienda_id = { _in: tiendaIds };
      }
    }

    // 🚀 NUEVO: Si es el mes actual, filtrar hasta la fecha actual
    if (mesSeleccionado && isCurrentMonth(mesSeleccionado)) {
      const fechaActual = getCurrentDate();
      filter.fecha = { _lte: fechaActual };
    } else if (fecha) {
      filter.fecha = { _lte: fecha }; // Cambiar a <= para incluir todas las fechas hasta fecha
    }

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

    return data as DirectusPresupuestoDiarioEmpleado[];
  } catch (error) {
    throw error;
  }
}

/**
 * Obtener ventas diarias de empleados
 */
export async function obtenerVentasEmpleados(
  tiendaId?: number,
  fecha?: string,
  mesSeleccionado?: string
): Promise<DirectusVentasDiariasEmpleado[]> {
  try {
    const tiendaIds = await obtenerTiendasIdsUsuarioActual();
    const filter: any = {};

    if (tiendaId) {
      if (tiendaIds.includes(tiendaId)) {
        filter.tienda_id = { _eq: tiendaId };
      } else {
        return [];
      }
    } else {
      if (tiendaIds.length > 0) {
        filter.tienda_id = { _in: tiendaIds };
      }
    }

    // 🚀 NUEVO: Si es el mes actual, filtrar hasta la fecha actual
    if (mesSeleccionado && isCurrentMonth(mesSeleccionado)) {
      const fechaActual = getCurrentDate();
      filter.fecha = { _lte: fechaActual };
    } else if (fecha) {
      filter.fecha = { _lte: fecha }; // Cambiar a <= para incluir todas las fechas
    }

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

    return data as DirectusVentasDiariasEmpleado[];
  } catch (error) {
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

    return data as { tienda_id: number; estado: string }[];
  } catch (error: any) {
    // Si es error 404 (colección no existe), devolver array vacío
    if (error.response?.status === 404) {
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
    return tiendaIds;
  } catch (error: any) {
    // Si es error 404 (colección no existe), devolver array vacío
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}
