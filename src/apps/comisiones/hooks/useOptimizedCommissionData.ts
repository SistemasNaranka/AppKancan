import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useAuth } from "@/auth/hooks/useAuth";
import {
  getStores,
  obtenerAsesores,
  obtenerCargos,
  obtenerPresupuestosDiarios,
  obtenerPorcentajesMensuales,
  obtenerPresupuestosEmpleados,
  obtenerVentasEmpleados,
  obtenerUmbralesComisiones,
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
  const [mesNombre, anio] = selectedMonth.split(" ");
  const mesNumero = getMonthNumber(mesNombre);

  // Obtener último día del mes
  const ultimoDia = new Date(parseInt(anio), parseInt(mesNumero), 0).getDate();
  const fechaInicio = `${anio}-${mesNumero}-01`;
  const fechaFin = `${anio}-${mesNumero}-${ultimoDia}`;

  // Cargar todos los datos en paralelo (incluyendo umbrales de comisiones)
  const [
    tiendas,
    asesores,
    cargos,
    presupuestosDiarios,
    porcentajesBD,
    presupuestosEmpleadosData,
    ventasEmpleados,
    umbralesData,
  ] = await Promise.all([
    getStores(),
    obtenerAsesores(),
    obtenerCargos(),
    obtenerPresupuestosDiarios(undefined, fechaInicio, fechaFin, selectedMonth),
    obtenerPorcentajesMensuales(undefined, selectedMonth),
    obtenerPresupuestosEmpleados(undefined, fechaFin, selectedMonth),
    obtenerVentasEmpleados(undefined, fechaFin, selectedMonth),
    obtenerUmbralesComisiones(selectedMonth),
  ]);

  // Convertir presupuestos diarios a BudgetRecord
  const budgets = presupuestosDiarios.map((p: any) => {
    const tienda = tiendas.find((t: any) => t.id === p.store_id);
    const presupuesto = parseFloat(p.budget) || 0;
    return {
      tienda: tienda?.name || `Tienda ID ${p.store_id}`,
      tienda_id: p.store_id,
      empresa: tienda?.company || "Empresa Desconocida",
      fecha: p.date,
      presupuesto_total: presupuesto,
    };
  });

  // Agregar tiendas sin presupuestos diarios con presupuesto 0
  const tiendasConPresupuestos = new Set(
    presupuestosDiarios.map((p: any) => p.store_id),
  );

  tiendas.forEach((tienda: any) => {
    if (!tiendasConPresupuestos.has(tienda.id)) {
      budgets.push({
        tienda: tienda.name,
        tienda_id: tienda.id,
        empresa: tienda.company || "Empresa Desconocida",
        fecha: fechaFin,
        presupuesto_total: 0,
      });
    }
  });

  // Crear staff basado en presupuestos asignados
  const staff: any[] = [];
  const presupuestosDelMes = presupuestosEmpleadosData.filter((pe: any) => {
    return pe.date >= fechaInicio && pe.date <= fechaFin;
  });

  // Crear staff basado en presupuestos asignados
  presupuestosDelMes.forEach((pe: any) => {
    const asesor = asesores.find((a: any) => a.id === pe.advisor_id);
    if (!asesor) return;

    const tienda = tiendas.find((t: any) => t.id === pe.store_id);

    // Obtener nombre del cargo
    let cargoNombre = "asesor";
    if (typeof pe.position_id === "string") {
      cargoNombre = pe.position_id.toLowerCase();
    } else if (typeof pe.position_id === "number") {
      const cargo = cargos.find((c: any) => c.id === pe.position_id);
      cargoNombre = cargo ? cargo.name.toLowerCase() : "asesor";
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
      nombre: asesor.name || `Empleado ${asesor.id}`,
      documento: asesor.document,
      tienda: tienda?.name || `Tienda ID ${pe.store_id}`,
      fecha: pe.date,
      rol: rol,
      cargo_id: pe.position_id,
    });
  });

  // Agregar empleados adicionales de todas las tiendas
  const empleadosConPresupuestos = new Set(
    presupuestosDelMes.map((pe: any) => pe.advisor_id.toString()),
  );

  asesores.forEach((asesor: any) => {
    if (!empleadosConPresupuestos.has(asesor.id.toString())) {
      const tiendaAsesor = tiendas.find((t: any) => t.id === asesor.store_id);
      if (tiendaAsesor) {
        let rol = "asesor";
        if (asesor.position_id) {
          const cargo = cargos.find((c: any) => c.id === asesor.position_id);
          if (cargo) {
            const cargoNombre = cargo.name.toLowerCase();
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
          nombre: asesor.name || `Empleado ${asesor.id}`,
          documento: asesor.document,
          tienda: tiendaAsesor.name,
          fecha: fechaFin,
          rol: rol,
          cargo_id:
            typeof asesor.position_id === "object"
              ? asesor.position_id.id
              : asesor.position_id,
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
      role_config: (p.role_config || []).map((rc: any) => ({
        role: rc.role,
        calculation_type: rc.calculation_type,
        percentage: rc.percentage,
      })),
    };
  });

  // Procesar ventas por empleado
  const ventasDelMes = ventasEmpleados.filter((ve: any) => {
    return ve.date >= fechaInicio && ve.date <= fechaFin;
  });

  const ventasMap = new Map<string, any>();

  ventasDelMes.forEach((ve: any) => {
    const storeId = ve.store_id?.id || ve.store_id;
    const tienda = tiendas.find((t: any) => String(t.id) === String(storeId));
    if (!tienda) return;

    const key = `${tienda.name}-${ve.date}`;

    if (!ventasMap.has(key)) {
      ventasMap.set(key, {
        tienda: tienda.name,
        fecha: ve.date,
        ventas_tienda: 0,
        ventas_por_asesor: {},
      });
    }

    const ventaData = ventasMap.get(key);
    const advisorId = ve.advisor_id?.id || ve.advisor_id;
    const saleValue = parseFloat(ve.sale) || 0;

    ventaData.ventas_por_asesor[advisorId.toString()] = saleValue;
    ventaData.ventas_tienda += saleValue;
  });

  const ventas = Array.from(ventasMap.values());

  // Procesar umbrales de comisiones (si existen en BD)
  const thresholdConfig = umbralesData
    ? {
        mes: umbralesData.mes,
        anio: umbralesData.anio,
        compliance_values: umbralesData.compliance_values,
      }
    : null;

  return {
    budgets,
    staff,
    monthConfigs,
    ventas,
    presupuestosEmpleados: presupuestosEmpleadosData,
    cargos,
    thresholdConfig, // ✅ Agregar umbrales de comisiones
    metadata: {
      selectedMonth,
      fechaInicio,
      fechaFin,
      totalTiendas: tiendas.length,
      totalAsesores: asesores.length,
    },
  };
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
    staleTime: 1000 * 60 * 5, // 5 minutos - datos frescos
    gcTime: 1000 * 60 * 30, // 30 minutos - tiempo en caché
    refetchOnWindowFocus: false, // NO recargar al volver a la ventana - usar caché
    refetchOnMount: false, // NO recargar al montar - usar caché
    refetchOnReconnect: false, // NO recargar al reconectar
    retry: 1, // Menos reintentos para evitar delays
    retryDelay: 1000, // Delay fijo más corto
    // ✅ CORRECCIÓN: Configuración para carga más rápida
    networkMode: "online", // Solo cargar cuando esté online
  });

  // ✅ FUNCIÓN OPTIMIZADA para limpieza completa después del guardado
  const refetch = useCallback(() => {
    // 🚀 NUEVO: Limpiar TODOS los caches antes de recargar
    queryClient.invalidateQueries({
      queryKey: ["commission-data"],
      exact: false,
    });

    // Limpiar completamente el cache
    queryClient.removeQueries({
      queryKey: ["commission-data"],
      exact: false,
    });

    // Forzar refetch inmediato
    return queryClient
      .refetchQueries({
        queryKey: ["commission-data", selectedMonth],
        type: "active",
      })
      .then(() => {});
  }, [queryClient, selectedMonth]);

  // Función para precargar datos de un mes
  const prefetchMonth = useCallback(
    (month: string) => {
      if (!user) return;

      queryClient.prefetchQuery({
        queryKey: ["commission-data", month, user.id],
        queryFn: () => processCommissionData(month),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
      });
    },
    [queryClient, user],
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
      thresholdConfig: query.data.thresholdConfig || null, // ✅ Agregar umbrales
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
