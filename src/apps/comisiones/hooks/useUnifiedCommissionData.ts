import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useEffect, useRef } from "react";
import { useAuth } from "@/auth/hooks/useAuth";
import {
  obtenerTiendas,
  obtenerAsesores,
  obtenerCargos,
  obtenerPresupuestosDiarios,
  obtenerPorcentajesMensuales,
  obtenerPresupuestosEmpleados,
  obtenerVentasEmpleados,
  obtenerTodosPresupuestosMeses,
} from "../api/directus/read";

// Función auxiliar para convertir nombre de mes a número
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

/**
 * Función para validar presupuesto diario de empleados
 */
const validateBudgetData = async (user: any): Promise<{
  hasBudgetData: boolean;
  currentStore: any | null;
  todayBudgetCount: number;
  error: string | null;
}> => {
  try {
    // Obtener tiendas del usuario
    const tiendas = await obtenerTiendas();
    if (tiendas.length === 0) {
      return {
        hasBudgetData: true, // No mostrar error si no hay tiendas
        currentStore: null,
        todayBudgetCount: 0,
        error: "No tienes tiendas asignadas",
      };
    }

    // Si tiene múltiples tiendas, no validamos presupuesto
    if (tiendas.length > 1) {
      return {
        hasBudgetData: true,
        currentStore: null,
        todayBudgetCount: 0,
        error: null,
      };
    }

    // Obtener fecha actual
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const fechaActual = `${year}-${month}-${day}`;

    // Obtener mes actual
    const mesesNombres = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
    ];
    const mesActual = `${mesesNombres[now.getUTCMonth()]} ${now.getUTCFullYear()}`;

    // Consultar presupuestos de empleados para hoy
    const presupuestosEmpleados = await obtenerPresupuestosEmpleados(
      tiendas[0].id,
      fechaActual,
      mesActual
    );

    // Filtrar solo los registros del día actual para la tienda del usuario
    const presupuestosHoy = presupuestosEmpleados.filter((pe: any) => {
      return pe.tienda_id === tiendas[0].id && pe.fecha === fechaActual;
    });

    const budgetCount = presupuestosHoy.length;
    const hasBudget = budgetCount > 0;

    return {
      hasBudgetData: hasBudget,
      currentStore: hasBudget ? tiendas[0] : null,
      todayBudgetCount: budgetCount,
      error: hasBudget ? null : "No hay presupuesto diario asignado para ningún empleado en el día de hoy",
    };
  } catch (error) {
    console.error("Error validando presupuesto:", error);
    return {
      hasBudgetData: true, // En caso de error, no mostrar error de presupuesto
      currentStore: null,
      todayBudgetCount: 0,
      error: null,
    };
  }
};

/**
 * Función para procesar todos los datos de comisiones de forma unificada
 */
const processAllCommissionData = async (selectedMonth: string, user: any) => {
  console.log("🔄 [DEBUG] Procesando datos para mes:", selectedMonth);
  const [mesNombre, anio] = selectedMonth.split(" ");
  const mesNumero = getMonthNumber(mesNombre);

  // Obtener último día del mes
  const ultimoDia = new Date(parseInt(anio), parseInt(mesNumero), 0).getDate();
  const fechaInicio = `${anio}-${mesNumero}-01`;
  const fechaFin = `${anio}-${mesNumero}-${ultimoDia}`;

  console.log("📅 [DEBUG] Fechas calculadas:", { fechaInicio, fechaFin, ultimoDia });

  // Cargar todos los datos en paralelo
  const [
    tiendas,
    asesores,
    cargos,
    presupuestosDiarios,
    porcentajesBD,
    presupuestosEmpleadosData,
    ventasEmpleados,
    availableMonths,
  ] = await Promise.all([
    obtenerTiendas(),
    obtenerAsesores(),
    obtenerCargos(),
    obtenerPresupuestosDiarios(undefined, fechaInicio, fechaFin, selectedMonth),
    obtenerPorcentajesMensuales(undefined, selectedMonth),
    obtenerPresupuestosEmpleados(undefined, fechaFin, selectedMonth),
    obtenerVentasEmpleados(undefined, fechaFin, selectedMonth),
    obtenerTodosPresupuestosMeses(),
  ]);

  console.log("📊 [DEBUG] Datos cargados desde API:", {
    tiendas: tiendas.length,
    asesores: asesores.length,
    cargos: cargos.length,
    presupuestosDiarios: presupuestosDiarios.length,
    porcentajesBD: porcentajesBD.length,
    presupuestosEmpleadosData: presupuestosEmpleadosData.length,
    ventasEmpleados: ventasEmpleados.length,
    availableMonths: availableMonths.length,
  });

  // Convertir presupuestos diarios a BudgetRecord
  const budgets = presupuestosDiarios.map((p: any) => {
    const tienda = tiendas.find((t: any) => t.id === p.tienda_id);
    const presupuesto = parseFloat(p.presupuesto) || 0;
    return {
      tienda: tienda?.nombre || `Tienda ID ${p.tienda_id}`,
      tienda_id: p.tienda_id,
      empresa: tienda?.empresa || "Empresa Desconocida",
      fecha: p.fecha,
      presupuesto_total: presupuesto,
    };
  });

  // Agregar tiendas sin presupuestos diarios con presupuesto 0
  const tiendasConPresupuestos = new Set(
    presupuestosDiarios.map((p: any) => p.tienda_id)
  );

  tiendas.forEach((tienda: any) => {
    if (!tiendasConPresupuestos.has(tienda.id)) {
      budgets.push({
        tienda: tienda.nombre,
        tienda_id: tienda.id,
        empresa: tienda.empresa || "Empresa Desconocida",
        fecha: fechaFin,
        presupuesto_total: 0,
      });
    }
  });

  // Crear staff basado en presupuestos asignados
  const staff: any[] = [];
  let presupuestosDelMes = presupuestosEmpleadosData.filter((pe: any) => {
    return pe.fecha >= fechaInicio && pe.fecha <= fechaFin;
  });

  // Crear staff basado en presupuestos asignados
  presupuestosDelMes.forEach((pe: any) => {
    const asesor = asesores.find((a: any) => a.id === pe.asesor);
    if (!asesor) return;

    const tienda = tiendas.find((t: any) => t.id === pe.tienda_id);

    // Obtener nombre del cargo
    let cargoNombre = "asesor";
    if (typeof pe.cargo === "string") {
      cargoNombre = pe.cargo.toLowerCase();
    } else if (typeof pe.cargo === "number") {
      const cargo = cargos.find((c: any) => c.id === pe.cargo);
      cargoNombre = cargo ? cargo.nombre.toLowerCase() : "asesor";
    }

    // Mapear a roles estándar
    const rol =
      cargoNombre === "gerente"
        ? "gerente"
        : cargoNombre === "asesor"
        ? "asesor"
        : cargoNombre === "cajero"
        ? "cajero"
        : "logistico";

    staff.push({
      id: asesor.id.toString(),
      nombre: asesor.nombre || `Empleado ${asesor.id}`,
      tienda: tienda?.nombre || `Tienda ID ${pe.tienda_id}`,
      fecha: pe.fecha,
      rol: rol,
      cargo_id: pe.cargo,
    });
  });

  // Agregar empleados adicionales de todas las tiendas
  const empleadosConPresupuestos = new Set(
    presupuestosDelMes.map((pe: any) => pe.asesor.toString())
  );

  asesores.forEach((asesor: any) => {
    if (!empleadosConPresupuestos.has(asesor.id.toString())) {
      const tiendaAsesor = tiendas.find((t: any) => t.id === asesor.tienda_id);
      if (tiendaAsesor) {
        let rol = "asesor";
        if (asesor.cargo_id) {
          const cargo = cargos.find((c: any) => c.id === asesor.cargo_id);
          if (cargo) {
            const cargoNombre = cargo.nombre.toLowerCase();
            rol =
              cargoNombre === "gerente"
                ? "gerente"
                : cargoNombre === "asesor"
                ? "asesor"
                : cargoNombre === "cajero"
                ? "cajero"
                : "logistico";
          }
        }

        staff.push({
          id: asesor.id.toString(),
          nombre: asesor.nombre || `Empleado ${asesor.id}`,
          tienda: tiendaAsesor.nombre,
          fecha: fechaFin,
          rol: rol,
          cargo_id:
            typeof asesor.cargo_id === "object"
              ? asesor.cargo_id.id
              : asesor.cargo_id,
        });
      }
    }
  });

  // Convertir configuraciones de porcentajes
  const monthConfigs = porcentajesBD.map((p: any) => {
    const [year, month] = p.fecha.split("-");
    const monthNames = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
    ];
    const monthName = monthNames[parseInt(month) - 1];
    return {
      mes: `${monthName} ${year}`,
      porcentaje_gerente: p.gerente_porcentaje,
    };
  });

  // Procesar ventas por empleado
  let ventasDelMes = ventasEmpleados.filter((ve: any) => {
    return ve.fecha >= fechaInicio && ve.fecha <= fechaFin;
  });

  const ventasMap = new Map<string, any>();

  ventasDelMes.forEach((ve: any) => {
    const tienda = tiendas.find((t: any) => t.id === ve.tienda_id);
    if (!tienda) return;

    const key = `${tienda.nombre}-${ve.fecha}`;

    if (!ventasMap.has(key)) {
      ventasMap.set(key, {
        tienda: tienda.nombre,
        fecha: ve.fecha,
        ventas_tienda: 0,
        ventas_por_asesor: {},
      });
    }

    const ventaData = ventasMap.get(key);
    ventaData.ventas_por_asesor[ve.asesor_id.toString()] = ve.venta;
    ventaData.ventas_tienda += ve.venta;
  });

  const ventas = Array.from(ventasMap.values());

  // Validar presupuesto diario
  const budgetValidation = await validateBudgetData(user);

  // Determinar mes actual
  let currentMonth = selectedMonth;
  if (availableMonths && availableMonths.length > 0) {
    const ahora = new Date();
    const mesesNombres = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
    ];
    const mesActual = mesesNombres[ahora.getUTCMonth()];
    const anioActual = ahora.getUTCFullYear();
    const mesActualStr = `${mesActual} ${anioActual}`;

    const mesEncontrado = availableMonths.find((m) => m === mesActualStr);
    currentMonth = mesEncontrado || availableMonths[availableMonths.length - 1];
  }

  const result = {
    // Datos de comisiones
    budgets,
    staff,
    monthConfigs,
    ventas,
    presupuestosEmpleados: presupuestosEmpleadosData,
    cargos,

    // Datos de meses
    availableMonths: availableMonths.length > 0 ? availableMonths : [selectedMonth],
    currentMonth,

    // Validación de presupuesto
    budgetValidation,

    // Metadata
    metadata: {
      selectedMonth,
      fechaInicio,
      fechaFin,
      totalTiendas: tiendas.length,
      totalAsesores: asesores.length,
    },
  };

  console.log("✅ [DEBUG] Datos procesados:", {
    budgets: budgets.length,
    staff: staff.length,
    monthConfigs: monthConfigs.length,
    ventas: ventas.length,
    presupuestosEmpleados: presupuestosEmpleadosData.length,
    cargos: cargos.length,
    availableMonths: availableMonths.length,
    currentMonth,
  });

  return result;
};

/**
 * Hook unificado para cargar todos los datos de comisiones de una vez
 * Elimina la fragmentación de múltiples hooks y mejora la experiencia de carga
 */
export const useUnifiedCommissionData = (selectedMonth: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMountedRef = useRef(true);
  
  // Limpiar el ref cuando el componente se desmonta
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const query = useQuery({
    queryKey: ["unified-commission-data", selectedMonth, user?.id],
    queryFn: () => processAllCommissionData(selectedMonth, user),
    enabled: !!user && !!selectedMonth,
    staleTime: 1000 * 60 * 5, // 5 minutos - aumentar staleTime para reducir fetches innecesarios
    gcTime: 1000 * 60 * 10, // 10 minutos - aumentar tiempo en caché
    refetchOnWindowFocus: false, // 🚀 CAMBIADO: No recargar al volver a la ventana
    refetchOnMount: false, // 🚀 CAMBIADO: No recargar al montar
    refetchOnReconnect: true, // 🚀 CAMBIADO: Recargar al reconectar
    retry: 2, // Menos reintentos para evitar delays
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  // ✅ MEJORAR función refetch para invalidación más agresiva
  const refetch = useCallback(() => {
    console.log("🔄 Forzando recarga completa de datos de comisiones...");

    // Verificar que el componente está montado antes de invalidar queries
    if (!queryClient.isMutating && isMountedRef.current) {
      // ✅ INVALIDACIÓN MÁS AGRESIVA - INVALIDAR TODO
      queryClient.invalidateQueries({
        queryKey: ["unified-commission-data"],
        exact: false,
      });

      // Invalidar consultas relacionadas específicas
      queryClient.invalidateQueries({
        queryKey: ["budgets"],
        exact: false,
      });

      queryClient.invalidateQueries({
        queryKey: ["staff"],
        exact: false,
      });

      queryClient.invalidateQueries({
        queryKey: ["ventas"],
        exact: false,
      });

      queryClient.invalidateQueries({
        queryKey: ["presupuestos-empleados"],
        exact: false,
      });

      queryClient.invalidateQueries({
        queryKey: ["tiendas"],
        exact: false,
      });

      queryClient.invalidateQueries({
        queryKey: ["asesores"],
        exact: false,
      });

      // ✅ LIMPIAR CACHÉ COMPLETO PARA ASEGURAR RECARGA
      queryClient.removeQueries({
        queryKey: ["unified-commission-data"],
        exact: false,
      });

      // 🚀 NUEVO: Forzar limpieza completa del caché de React Query
      queryClient.clear();

      // Forzar refetch inmediato del mes actual
      return queryClient
        .refetchQueries({
          queryKey: ["unified-commission-data", selectedMonth],
          type: "active",
        })
        .then(() => {
          console.log("✅ Recarga completa finalizada");
        });
    }
    
    // Si ya hay una mutación en curso o el componente se ha desmontado, simplemente resolver
    return Promise.resolve();
  }, [queryClient, selectedMonth]);

  // Función para precargar datos de un mes
  const prefetchMonth = useCallback(
    (month: string) => {
      if (!user) return;

      queryClient.prefetchQuery({
        queryKey: ["unified-commission-data", month, user.id],
        queryFn: () => processAllCommissionData(month, user),
        staleTime: 0, // Siempre stale para forzar fetch fresco
        gcTime: 1000 * 60 * 5,
      });
    },
    [queryClient, user]
  );

  // Memo para datos transformados
  const data = useMemo(() => {
    if (!query.data) return null;

    const {
      budgets = [],
      staff = [],
      monthConfigs = [],
      ventas = [],
      presupuestosEmpleados = [],
      cargos = [],
      availableMonths = [],
      currentMonth = selectedMonth,
      budgetValidation,
      metadata,
    } = query.data;

    return {
      budgets,
      staff,
      monthConfigs,
      ventas,
      presupuestosEmpleados,
      cargos,
      availableMonths,
      currentMonth,
      budgetValidation,
      metadata,
    };
  }, [query.data, selectedMonth]);

  // Memo para estados derivados
  const derivedStates = useMemo(() => {
    const hasData =
      data &&
      (data.budgets.length > 0 ||
        data.staff.length > 0 ||
        data.ventas.length > 0);

    return {
      hasData: !!hasData,
      isEmpty: hasData === false,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      dataLoadAttempted: query.isLoading === false,
      
      // Estados de presupuesto unificados
      hasBudgetData: data?.budgetValidation?.hasBudgetData ?? null,
      budgetValidationCompleted: true, // Siempre completado en el hook unificado
      budgetError: data?.budgetValidation?.error ?? null,
      
      // Estados de meses unificados
      isLoadingMonths: false, // Siempre cargado en el hook unificado
      availableMonths: data?.availableMonths ?? [],
      currentMonth: data?.currentMonth ?? selectedMonth,
    };
  }, [
    query.isLoading,
    query.isError,
    query.error,
    data,
    selectedMonth,
  ]);

  return {
    // Data
    data,

    // States
    ...derivedStates,

    // Query states
    isRefetching: query.isRefetching,

    // Actions
    refetch,
    prefetchMonth,
    
    // Unified actions
    revalidateBudgetData: refetch, // Reutilizar refetch para presupuesto
    changeMonth: (month: string) => {
      // Esta función se puede expandir si es necesario
      return month;
    },
  };
};