import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useAuth } from "@/auth/hooks/useAuth";
import {
  obtenerTiendas,
  obtenerAsesores,
  obtenerCargos,
  obtenerPresupuestosDiarios,
  obtenerPorcentajesMensuales,
  obtenerPresupuestosEmpleados,
  obtenerVentasEmpleados,
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

// Función para procesar todos los datos de comisiones
const processCommissionData = async (selectedMonth: string) => {
  console.log("🔄 [DEBUG] Procesando datos para mes:", selectedMonth);
  
  const [mesNombre, anio] = selectedMonth.split(" ");
  const mesNumero = getMonthNumber(mesNombre);

  // Obtener último día del mes
  const ultimoDia = new Date(parseInt(anio), parseInt(mesNumero), 0).getDate();
  const fechaInicio = `${anio}-${mesNumero}-01`;
  const fechaFin = `${anio}-${mesNumero}-${ultimoDia}`;

  console.log("📅 [DEBUG] Fechas calculadas:", { fechaInicio, fechaFin, ultimoDia });

  // 🚀 OPTIMIZACIÓN: Cargar datos en paralelo con timeout
  const dataPromises = Promise.all([
    obtenerTiendas(),
    obtenerAsesores(),
    obtenerCargos(),
    obtenerPresupuestosDiarios(undefined, fechaInicio, fechaFin, selectedMonth),
    obtenerPorcentajesMensuales(undefined, selectedMonth),
    obtenerPresupuestosEmpleados(undefined, fechaFin, selectedMonth),
    obtenerVentasEmpleados(undefined, fechaFin, selectedMonth),
  ]);

  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout loading data')), 25000)
  );

  const [
    tiendas,
    asesores,
    cargos,
    presupuestosDiarios,
    porcentajesBD,
    presupuestosEmpleadosData,
    ventasEmpleados,
  ] = await Promise.race([dataPromises, timeoutPromise]) as any[];

  console.log("📊 [DEBUG] Datos cargados desde API:", {
    tiendas: tiendas.length,
    asesores: asesores.length,
    cargos: cargos.length,
    presupuestosDiarios: presupuestosDiarios.length,
    porcentajesBD: porcentajesBD.length,
    presupuestosEmpleadosData: presupuestosEmpleadosData.length,
    ventasEmpleados: ventasEmpleados.length,
  });

  // 🚀 OPTIMIZACIÓN: Crear índices para búsquedas O(1)
  const tiendasMap = new Map(tiendas.map((t: any) => [t.id, t]));
  const cargosMap = new Map(cargos.map((c: any) => [c.id, c]));
  const asesoresMap = new Map(asesores.map((a: any) => [a.id, a]));

  // Convertir presupuestos diarios a BudgetRecord - Optimizado
  const budgets = presupuestosDiarios.map((p: any) => {
    const tienda = tiendasMap.get(p.tienda_id);
    const presupuesto = parseFloat(p.presupuesto) || 0;
    return {
      tienda: tienda?.nombre || `Tienda ID ${p.tienda_id}`,
      tienda_id: p.tienda_id,
      empresa: tienda?.empresa || "Empresa Desconocida",
      fecha: p.fecha,
      presupuesto_total: presupuesto,
    };
  });

  // Agregar tiendas sin presupuestos diarios con presupuesto 0 - Optimizado
  const tiendasConPresupuestos = new Set(
    presupuestosDiarios.map((p: any) => p.tienda_id)
  );

  for (const [tiendaId, tienda] of tiendasMap) {
    if (!tiendasConPresupuestos.has(tiendaId)) {
      budgets.push({
        tienda: (tienda as any)?.nombre || `Tienda ID ${tiendaId}`,
        tienda_id: tiendaId,
        empresa: (tienda as any)?.empresa || "Empresa Desconocida",
        fecha: fechaFin,
        presupuesto_total: 0,
      });
    }
  }

  // 🚀 OPTIMIZACIÓN: Crear staff con una sola pasada y búsquedas O(1)
  const staff: any[] = [];
  const presupuestosDelMes = presupuestosEmpleadosData.filter((pe: any) => {
    return pe.fecha >= fechaInicio && pe.fecha <= fechaFin;
  });

  console.log("👥 [DEBUG] Presupuestos del mes filtrados:", presupuestosDelMes.length);

  // Procesar presupuestos del mes - Optimizado
  for (const pe of presupuestosDelMes) {
    const asesor = asesoresMap.get(pe.asesor);
    if (!asesor) continue;

    const tienda = tiendasMap.get(pe.tienda_id);

    // Obtener nombre del cargo - Optimizado
    let cargoNombre = "asesor";
    if (typeof pe.cargo === "string") {
      cargoNombre = pe.cargo.toLowerCase();
    } else if (typeof pe.cargo === "number") {
      const cargo = cargosMap.get(pe.cargo);
      cargoNombre = cargo ? (cargo as any).nombre.toLowerCase() : "asesor";
    }

    // Mapear a roles estándar
    const rol =
      cargoNombre === "gerente"
        ? "gerente"
        : cargoNombre === "asesor"
        ? "asesor"
        : cargoNombre === "cajero"
        ? "cajero"
        : cargoNombre === "coadministrador"
        ? "coadministrador"
        : cargoNombre === "gerente online"
        ? "gerente_online"
        : "logistico";

    staff.push({
      id: asesor.id.toString(),
      nombre: asesor.nombre || `Empleado ${asesor.id}`,
      tienda: tienda?.nombre || `Tienda ID ${pe.tienda_id}`,
      fecha: pe.fecha,
      rol: rol,
      cargo_id: pe.cargo,
    });
  }

  // 🚀 OPTIMIZACIÓN: Agregar empleados adicionales - Optimizado
  const empleadosConPresupuestos = new Set(
    presupuestosDelMes.map((pe: any) => pe.asesor.toString())
  );

  // 🚀 OPTIMIZACIÓN: Agregar empleados adicionales - Optimizado
  asesores.forEach((asesor: any) => {
    if (!empleadosConPresupuestos.has(asesor.id.toString())) {
      const tiendaAsesor = tiendasMap.get(asesor.tienda_id);
      if (tiendaAsesor) {
        let rol = "asesor";
        if (asesor.cargo_id) {
          const cargo = cargosMap.get(asesor.cargo_id);
          if (cargo) {
            const cargoNombre = (cargo as any).nombre.toLowerCase();
            rol =
              cargoNombre === "gerente"
                ? "gerente"
                : cargoNombre === "asesor"
                ? "asesor"
                : cargoNombre === "cajero"
                ? "cajero"
                : cargoNombre === "coadministrador"
                ? "coadministrador"
                : cargoNombre === "gerente online"
                ? "gerente_online"
                : "logistico";
          }
        }

        staff.push({
          id: asesor.id.toString(),
          nombre: asesor.nombre || `Empleado ${asesor.id}`,
          tienda: (tiendaAsesor as any).nombre,
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

  // 🚀 OPTIMIZACIÓN: Procesar ventas - Optimizado
  ventasDelMes.forEach((ve: any) => {
    const tienda = tiendasMap.get(ve.tienda_id);
    if (!tienda) return;

    const key = `${(tienda as any).nombre}-${ve.fecha}`;

    if (!ventasMap.has(key)) {
      ventasMap.set(key, {
        tienda: (tienda as any).nombre,
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

  const result = {
    budgets,
    staff,
    monthConfigs,
    ventas,
    presupuestosEmpleados: presupuestosEmpleadosData,
    cargos,
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
  });

  return result;
};

/**
 * Hook optimizado para cargar datos de comisiones con TanStack Query
 * - Cache automático
 * - Estados de carga optimizados
 * - Invalidación inteligente
 * - Evita recargas innecesarias
 */
export const useOptimizedCommissionData = (selectedMonth: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["commission-data", selectedMonth, user?.id],
    queryFn: () => processCommissionData(selectedMonth),
    enabled: !!user && !!selectedMonth,
    staleTime: 1000 * 60 * 5, // 5 minutos - cache más permisivo para velocidad
    gcTime: 1000 * 60 * 15, // 15 minutos - mantener caché más tiempo
    refetchOnWindowFocus: false, // Evitar recargas innecesarias
    refetchOnMount: false, // NO recargar si hay cache disponible
    refetchOnReconnect: true, // Recargar al reconectar
    retry: 1, // Solo 1 reintento para mayor velocidad
    retryDelay: 300, // Delay más corto entre reintentos
  });

  // ✅ Función refetch optimizada para mayor velocidad
  const refetch = useCallback(() => {
    // ✅ INVALIDACIÓN MÁS AGRESIVA - INVALIDAR TODO
    queryClient.invalidateQueries({
      queryKey: ["commission-data", selectedMonth],
      exact: true,
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
      queryKey: ["commission-data"],
      exact: false,
    });

    // Forzar refetch inmediato del mes actual
    return queryClient
      .refetchQueries({
        queryKey: ["commission-data", selectedMonth],
        type: "active",
      })
      .then(() => {});
  }, [queryClient, selectedMonth]);

  // Función para precargar datos de un mes - Optimizada
  const prefetchMonth = useCallback(
    (month: string) => {
      if (!user) return;

      queryClient.prefetchQuery({
        queryKey: ["commission-data", month, user.id],
        queryFn: () => processCommissionData(month),
        staleTime: 1000 * 60 * 2, // 2 minutos de stale time
        gcTime: 1000 * 60 * 10, // 10 minutos de garbage collection
      });
    },
    [queryClient, user]
  );

  // Memo para datos transformados
  const data = useMemo(() => {
    if (!query.data) return null;

    return {
      budgets: query.data.budgets || [],
      staff: query.data.staff || [],
      monthConfigs: query.data.monthConfigs || [],
      ventas: query.data.ventas || [],
      presupuestosEmpleados: query.data.presupuestosEmpleados || [],
      cargos: query.data.cargos || [],
      metadata: query.data.metadata,
    };
  }, [query.data]);

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
      dataLoadAttempted: query.isLoading === false, // true cuando termina de cargar (éxito o error)
    };
  }, [query.isLoading, query.isError, query.error, data]);

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
  };
};
