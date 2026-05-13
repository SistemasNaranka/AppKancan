import directus from "@/services/directus/directus";
import { readItems } from "@directus/sdk";
import {
  DirectusStaff,
  DirectusPosition,
  DirectusTienda,
  DirectusStoreDailyBudget,
  DirectusPorcentajeMensual,
  DirectusPorcentajeMensualNuevo,
  DirectusStaffDailyBudget,
  DirectusVentasDiariasEmpleado,
  DirectusCommissionCompliance,
  CommissionThreshold,
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
export async function getStores(): Promise<DirectusTienda[]> {
  try {
    const tiendaIds = await obtenerTiendasIdsUsuarioActual();
    if (tiendaIds.length === 0) {
      return [];
    }

    // Robustecer el filtro para manejar IDs como string o number
    const filter: any = {
      _or: [{ id: { _in: tiendaIds } }, { id: { _in: tiendaIds.map(String) } }],
    };

    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("core_stores", {
          fields: ["id", "name", "ultra_code", "company"],
          filter,
          sort: ["id"],
          limit: -1,
        }),
      ),
    );
    return data as DirectusTienda[];
  } catch (error) {
    throw error;
  }
}

/**
 * Obtener todos los cargos
 */
export async function obtenerCargos(): Promise<DirectusPosition[]> {
  try {
    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("core_positions", {
          fields: ["id", "name"],
          sort: ["name"],
          limit: -1,
        }),
      ),
    );
    return (data as any[]).map(item => ({
      ...item,
      name: item.name || "Cargo sin nombre"
    })) as DirectusPosition[];
  } catch (error) {
    throw error;
  }
}

/**
 * Obtener todos los asesores con sus relaciones
 */
export async function obtenerAsesores(): Promise<DirectusStaff[]> {
  try {
    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("com_advisors", {
          fields: [
            "id",
            "document",
            "store_id.id",
            "store_id.name",
            "store_id.ultra_code",
            "position_id.id",
            "position_id.name",
            "name",
          ],
          sort: ["id"],
          limit: -1,
        }),
      ),
    );

    return data as DirectusStaff[];
  } catch (error) {
    throw error;
  }
}

/**
 * Obtener la fecha actual en formato YYYY-MM-DD
 */
const getCurrentDate = (): string => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

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
  return ahora.getFullYear() === anio && ahora.getMonth() === mesNumero; // Usar hora local
};

/**
 * Obtener presupuestos diarios por tienda
 */
export async function obtenerPresupuestosDiarios(
  tiendaId?: number,
  fechaInicio?: string,
  fechaFin?: string,
  mesSeleccionado?: string,
): Promise<DirectusStoreDailyBudget[]> {
  try {
    const tiendaIds = await obtenerTiendasIdsUsuarioActual();
    const filter: any = {};

    if (tiendaId) {
      const match = tiendaIds.find((id) => String(id) === String(tiendaId));
      if (match !== undefined) {
        // Filtro agnóstico al tipo
        filter.store_id = { _in: [String(match), Number(match)] };
      } else {
        return [];
      }
    } else {
      if (tiendaIds.length > 0) {
        filter.store_id = { _in: tiendaIds };
      }
    }

    // 🚀 NUEVO: Si es el mes actual, filtrar hasta la fecha actual
    if (mesSeleccionado && isCurrentMonth(mesSeleccionado)) {
      const fechaActual = getCurrentDate();
      const [mesNombre, anio] = mesSeleccionado.split(" ");
      const mesInicio = `${anio}-${getMonthNumber(mesNombre)}-01`;

      filter.date = { _between: [mesInicio, fechaActual] };
    } else if (fechaInicio && fechaFin) {
      filter.date = { _between: [fechaInicio, fechaFin] };
    }

    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("com_store_daily_budgets", {
          fields: ["id", "store_id", "budget", "date"],
          filter,
          sort: ["-date"],
          limit: -1,
        }),
      ),
    );

    return data as DirectusStoreDailyBudget[];
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
      filter.store_id = { _in: tiendaIds };
    }

    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("com_store_daily_budgets", {
          fields: ["date"],
          filter,
          sort: ["-date"],
          limit: -1,
        }),
      ),
    );

    // Extraer todos los meses únicos de las fechas
    const mesesSet = new Set<string>();
    data.forEach((item: any) => {
      // Usar fecha local en lugar de UTC
      const fecha = new Date(item.date + "T00:00:00");
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
      const mesNombre = meses[fecha.getMonth()]; // Usar hora local
      const anio = fecha.getFullYear(); // Usar hora local
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
  _tiendaId?: number,
  mesAnio?: string,
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
        filter.month = { _eq: mesNumero };
        filter.year = { _eq: anio };
      }
    }
    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("com_monthly_budget_percentages", {
          fields: ["id", "month", "year", "role_config"],
          filter,
          sort: ["-year", "-month"],
          limit: 1,
        }),
      ),
    );

    // Convertir el formato nuevo al formato esperado
    const porcentajesConvertidos: DirectusPorcentajeMensual[] = (
      data as DirectusPorcentajeMensualNuevo[]
    ).map((item) => {
      const configMap: { [key: string]: any } = {};
      if (item.role_config && Array.isArray(item.role_config)) {
        item.role_config.forEach((config) => {
          const roleLower = config.role.toLowerCase();
          const tipo =
            config.calculation_type === "Fixed" ? "fijo" : "distributivo";
          configMap[`${roleLower}_tipo`] = tipo;
          configMap[`${roleLower}_porcentaje`] = config.percentage;
        });
      }

      return {
        id: item.id,
        fecha: `${item.year}-${item.month}`,
        role_config: item.role_config, // Mantener el array original
        gerente_tipo: configMap.gerente_tipo,
        gerente_porcentaje: configMap.gerente_porcentaje,
        asesor_tipo: configMap.asesor_tipo,
        asesor_porcentaje: configMap.asesor_porcentaje,
        coadministrador_tipo: configMap.coadministrador_tipo,
        coadministrador_porcentaje: configMap.coadministrador_porcentaje,
        cajero_tipo: configMap.cajero_tipo,
        cajero_porcentaje: configMap.cajero_porcentaje,
        logistico_tipo: configMap.logistico_tipo,
        logistico_porcentaje: configMap.logistico_porcentaje,
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
  mesSeleccionado?: string,
): Promise<DirectusStaffDailyBudget[]> {
  try {
    const tiendaIds = await obtenerTiendasIdsUsuarioActual();
    const filter: any = {};

    if (tiendaId) {
      const match = tiendaIds.find((id) => String(id) === String(tiendaId));
      if (match !== undefined) {
        // Filtro agnóstico al tipo
        filter.store_id = { _in: [String(match), Number(match)] };
      } else {
        return [];
      }
    } else {
      if (tiendaIds.length > 0) {
        filter.store_id = { _in: tiendaIds };
      }
    }

    // 🚀 REVERTIDO: Restaurar funcionalidad original para no dañar toda la app
    if (mesSeleccionado && isCurrentMonth(mesSeleccionado)) {
      const fechaActual = getCurrentDate();
      filter.date = { _lte: fechaActual };
    } else if (fecha) {
      filter.date = { _lte: fecha }; // Restaurar funcionalidad original
    }

    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("com_employee_daily_budgets", {
          fields: [
            "id",
            "advisor_id",
            "store_id",
            "position_id",
            "date",
            "budget",
          ],
          filter,
          sort: ["date", "advisor_id"],
          limit: -1,
        }),
      ),
    );

    return data as DirectusStaffDailyBudget[];
  } catch (error) {
    throw error;
  }
}

/**
 * Obtener empleados asignados en una fecha EXACTA para una tienda específica
 * Esta función es específica para el modal de edición
 */
export async function obtenerEmpleadosPorFechaExacta(
  tiendaIds: number[],
  fechaExacta: string,
): Promise<DirectusStaffDailyBudget[]> {
  try {
    const tiendaIdsPermitidos = await obtenerTiendasIdsUsuarioActual();

    // Filtrar solo las tiendas que el usuario tiene permiso de ver
    const tiendasFiltradas = tiendaIds.filter((id) =>
      tiendaIdsPermitidos.some((pId: any) => String(pId?.id || pId) === String(id)),
    );

    if (tiendasFiltradas.length === 0) {
      return [];
    }

    const filter: any = {
      store_id: { _in: tiendasFiltradas },
      date: { _eq: fechaExacta },
    };

    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("com_employee_daily_budgets", {
          fields: [
            "id",
            "advisor_id",
            "store_id",
            "position_id",
            "date",
            "budget",
          ],
          filter,
          sort: ["advisor_id"],
          limit: -1,
        }),
      ),
    );

    return data as DirectusStaffDailyBudget[];
  } catch (error) {
    console.error("Error al obtener empleados por fecha exacta:", error);
    return [];
  }
}

/**
 * Obtener ventas diarias de empleados
 */
export async function obtenerVentasEmpleados(
  tiendaId?: number,
  fecha?: string,
  mesSeleccionado?: string,
): Promise<DirectusVentasDiariasEmpleado[]> {
  try {
    const tiendaIds = await obtenerTiendasIdsUsuarioActual();
    const filter: any = {};

    if (tiendaId) {
      const match = tiendaIds.find((id) => String(id) === String(tiendaId));
      if (match !== undefined) {
        // Filtro agnóstico al tipo
        filter.store_id = { _in: [String(match), Number(match)] };
      } else {
        return [];
      }
    } else {
      if (tiendaIds.length > 0) {
        filter.store_id = { _in: tiendaIds };
      }
    }

    // 🚀 NUEVO: Si es el mes actual, filtrar hasta la fecha actual
    if (mesSeleccionado && isCurrentMonth(mesSeleccionado)) {
      const fechaActual = getCurrentDate();
      filter.date = { _lte: fechaActual };
    } else if (fecha) {
      filter.date = { _lte: fecha }; // Cambiar a <= para incluir todas las fechas
    }

    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("com_employee_daily_sales", {
          fields: ["id", "date", "advisor_id", "store_id", "sale"],
          filter,
          sort: ["date", "advisor_id"],
          limit: -1,
        }),
      ),
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
  usuarioId: number,
): Promise<{ store_id: number; status: string }[]> {
  try {
    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("core_user_stores", {
          fields: ["store_id", "status"],
          filter: {
            user_id: { _eq: usuarioId },
            status: { _eq: "Activo" },
          },
          limit: -1,
        }),
      ),
    );

    return data as { store_id: number; status: string }[];
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
        readItems("core_user_stores", {
          fields: ["store_id"],
          filter: {
            status: { _eq: "Activo" },
          },
          limit: -1,
        }),
      ),
    );

    const tiendaIds = data.map((item: any) => item.store_id);
    return tiendaIds;
  } catch (error: any) {
    // Si es error 404 (colección no existe), devolver array vacío
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}

// ==================== CONFIGURACIÓN DE UMBRALES DE COMISIONES ====================

/**
 * Tipo de retorno para obtenerUmbralesComisiones que incluye el ID
 */
export interface CommissionThresholdConfigWithId {
  id: number;
  mes: string; // "MMM YYYY"
  anio: string; // "YYYY"
  compliance_values: CommissionThreshold[];
}

/**
 * Obtener configuración de umbrales de comisión para un mes específico
 * @param mesAnio - Formato "MMM YYYY" (ej: "Ene 2025")
 * @returns CommissionThresholdConfigWithId o null si no existe
 */
export async function obtenerUmbralesComisiones(
  mesAnio?: string,
): Promise<CommissionThresholdConfigWithId | null> {
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
        filter.month = { _eq: mesNumero };
        filter.year = { _eq: anio };
      }
    }

    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("com_monthly_commission_compliance", {
          fields: ["id", "month", "year", "compliance_values"],
          filter,
          sort: ["-year", "-month"],
          limit: 1,
        }),
      ),
    );

    if (!data || data.length === 0) {
      return null;
    }

    const item = data[0] as DirectusCommissionCompliance;

    // Convertir a formato de configuración
    const mesesLabels: { [key: string]: string } = {
      "01": "Ene",
      "02": "Feb",
      "03": "Mar",
      "04": "Abr",
      "05": "May",
      "06": "Jun",
      "07": "Jul",
      "08": "Ago",
      "09": "Sep",
      "10": "Oct",
      "11": "Nov",
      "12": "Dic",
    };

    return {
      id: item.id,
      mes: `${mesesLabels[item.month]} ${item.year}`,
      anio: item.year,
      compliance_values: item.compliance_values || [],
    };
  } catch (error: any) {
    // Si la colección no existe o hay error, retornar null para usar valores por defecto
    if (error.response?.status === 404) {
      return null;
    }
    console.error("Error al obtener umbrales de comisiones:", error);
    return null;
  }
}
