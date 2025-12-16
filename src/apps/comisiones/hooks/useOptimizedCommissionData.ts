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
  const [mesNombre, anio] = selectedMonth.split(" ");
  const mesNumero = getMonthNumber(mesNombre);

  // Obtener último día del mes
  const ultimoDia = new Date(parseInt(anio), parseInt(mesNumero), 0).getDate();
  const fechaInicio = `${anio}-${mesNumero}-01`;
  const fechaFin = `${anio}-${mesNumero}-${ultimoDia}`;

  // Cargar todos los datos en paralelo
  const [
    tiendas,
    asesores,
    cargos,
    presupuestosDiarios,
    porcentajesBD,
    presupuestosEmpleadosData,
    ventasEmpleados,
  ] = await Promise.all([
    obtenerTiendas(),
    obtenerAsesores(),
    obtenerCargos(),
    obtenerPresupuestosDiarios(undefined, fechaInicio, fechaFin, selectedMonth),
    obtenerPorcentajesMensuales(undefined, selectedMonth),
    obtenerPresupuestosEmpleados(undefined, fechaFin, selectedMonth),
    obtenerVentasEmpleados(undefined, fechaFin, selectedMonth),
  ]);

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

  return {
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
    retry: 2, // Menos reintentos para evitar delays
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  // Función para invalidar y recargar datos
  const refetch = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["commission-data", selectedMonth],
    });
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
