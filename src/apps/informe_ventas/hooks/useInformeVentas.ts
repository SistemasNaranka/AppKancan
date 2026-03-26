import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import queryClient from "@/services/tankstack/QueryClient";
import {
  VentaRegistro,
  VentaAsesor,
  VentaTienda,
  Zona,
  Ciudad,
  Tienda,
  FiltrosVentas,
  ResumenVentas,
  Agrupacion,
  TablaVentasFila,
  LineaVenta,
} from "../types";
import {
  obtenerZonas,
  obtenerCiudades,
  obtenerTiendas,
  obtenerVentas,
  obtenerAsesores,
  obtenerAgrupaciones,
  obtenerLineasVenta,
} from "../api/mysql/read";
import {
  obtenerPresupuestosEmpleados,
  distribuirPresupuesto,
  obtenerUmbralesComisiones,
  calculateLineCommission,
  CommissionThreshold,
} from "../api/directus/read";
interface UseInformeVentasReturn {
  // Estado
  loading: boolean;
  isFetching: boolean;
  hasLoadedAtLeastOnce: boolean;
  error: string | null;
  ventas: VentaRegistro[];
  zonas: Zona[];
  ciudades: Ciudad[];
  tiendas: Tienda[];
  asesores: string[];
  agrupaciones: Agrupacion[];
  lineasVenta: LineaVenta[];
  filtros: FiltrosVentas;
  resumen: ResumenVentas | null;

  ciudadesFiltradas: string[];
  tiendasFiltradas: { id: number; nombre: string }[];
  asesoresFiltrados: string[];

  // Datos procesados
  ventasPorAsesor: VentaAsesor[];
  ventasPorTienda: VentaTienda[];
  tablaVentas: TablaVentasFila[];

  // Acciones
  actualizarFiltros: (nuevosFiltros: Partial<FiltrosVentas>) => void;
  limpiarFiltros: () => void;
  recargarDatos: () => Promise<void>;
}

const filtrosIniciales: FiltrosVentas = {
  fecha_desde: new Date(new Date().setDate(1)).toISOString().split("T")[0],
  fecha_hasta: new Date().toISOString().split("T")[0], // Hoy
};

const resumenVacio: ResumenVentas = {
  total_unidades: 0,
  total_valor: 0,
  total_asesores: 0,
  total_tiendas: 0,
  total_unidades_indigo: 0,
  total_unidades_liviano: 0,
  total_valor_indigo: 0,
  total_valor_liviano: 0,
  promedio_unidades_asesor: 0,
  promedio_valor_asesor: 0,
  top_asesores_unidades: [],
  top_asesores_valor: [],
  top_tiendas_unidades: [],
  top_tiendas_valor: [],
};

export function useInformeVentas(): UseInformeVentasReturn {
  // Estados principales
  const [error] = useState<string | null>(null);
  const [ventas, setVentas] = useState<VentaRegistro[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [asesores, setAsesores] = useState<string[]>([]);
  const [agrupaciones, setAgrupaciones] = useState<Agrupacion[]>([]);
  const [lineasVenta, setLineasVenta] = useState<LineaVenta[]>([]);
  const [filtros, setFiltros] = useState<FiltrosVentas>(filtrosIniciales);

  const [presupuestosEmpleados, setPresupuestosEmpleados] = useState<
    Map<number, number>
  >(new Map());

  // Estado para umbrales de comisión
  const [umbralesComision, setUmbralesComision] = useState<
    CommissionThreshold[]
  >([]);
  const CACHE_TIME = 5 * 60 * 1000; // 5 minutos - datos más frescos

  const { data: zonasData } = useQuery({
    queryKey: ["zonas"],
    queryFn: () => obtenerZonas("", ""),
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
  });

  const { data: ciudadesData } = useQuery({
    queryKey: ["ciudades"],
    queryFn: () => obtenerCiudades("", ""),
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
  });

  const { data: tiendasData } = useQuery({
    queryKey: ["tiendas"],
    queryFn: () => obtenerTiendas("", ""),
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
  });

  const { data: asesoresData } = useQuery({
    queryKey: ["asesores"],
    queryFn: () => obtenerAsesores(),
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
  });

  const { data: agrupacionesData } = useQuery({
    queryKey: ["agrupaciones"],
    queryFn: () => obtenerAgrupaciones(),
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
  });

  const { data: lineasVentaData } = useQuery({
    queryKey: ["lineasVenta"],
    queryFn: () => obtenerLineasVenta(),
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
  });

  const { data: umbralesComisionData } = useQuery({
    queryKey: ["umbralesComision"],
    queryFn: async () => {
      const fecha = new Date();
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
      const mesActual = `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
      const umbralesData = await obtenerUmbralesComisiones(mesActual);
      return umbralesData?.cumplimiento_valores || [];
    },
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
  });

  const dataReady = true;

  const {
    data: ventasData,
    isLoading: loadingVentas,
    isFetching: fetchingVentas,
  } = useQuery({
    queryKey: ["ventas", filtros.fecha_desde, filtros.fecha_hasta],
    queryFn: () =>
      obtenerVentas({
        fecha_desde: filtros.fecha_desde,
        fecha_hasta: filtros.fecha_hasta,
      }),
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
    enabled: dataReady,
  });

  const { data: presupuestosData } = useQuery({
    queryKey: ["presupuestos", filtros.fecha_desde, filtros.fecha_hasta],
    queryFn: () =>
      obtenerPresupuestosEmpleados(filtros.fecha_desde, filtros.fecha_hasta),
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
    enabled: dataReady,
  });
  useEffect(() => {
    if (zonasData) setZonas(zonasData);
  }, [zonasData]);

  useEffect(() => {
    if (ciudadesData) setCiudades(ciudadesData);
  }, [ciudadesData]);

  useEffect(() => {
    if (tiendasData) setTiendas(tiendasData);
  }, [tiendasData]);

  useEffect(() => {
    if (ventasData) setVentas(ventasData);
  }, [ventasData]);

  useEffect(() => {
    if (asesoresData) setAsesores(asesoresData);
  }, [asesoresData]);

  useEffect(() => {
    if (agrupacionesData) setAgrupaciones(agrupacionesData);
  }, [agrupacionesData]);

  useEffect(() => {
    if (lineasVentaData) setLineasVenta(lineasVentaData);
  }, [lineasVentaData]);

  // Procesar presupuestos cuando cambian los datos
  useEffect(() => {
    if (presupuestosData && presupuestosData.length > 0) {
      const presupuestosMap = new Map<number, number>();
      presupuestosData.forEach((p) => {
        const codigoAsesor = Number(p.asesor);
        const presupuesto = Number(p.presupuesto);
        const presupuestoActual = presupuestosMap.get(codigoAsesor) || 0;
        presupuestosMap.set(codigoAsesor, presupuestoActual + presupuesto);
      });
      setPresupuestosEmpleados(presupuestosMap);
    }
  }, [presupuestosData]);
  useEffect(() => {
    if (umbralesComisionData) {
      setUmbralesComision(umbralesComisionData);
    }
  }, [umbralesComisionData]);
  const hasLoadedAtLeastOnce =
    ventasData !== undefined &&
    Array.isArray(ventasData) &&
    ventasData.length > 0;

  // Loading permanece activo hasta que haya datos
  const loading = loadingVentas || fetchingVentas || !hasLoadedAtLeastOnce;

  useEffect(() => {}, []);

  const extraerCodigoAsesor = (asesorCompleto: string): number | null => {
    const primeraParte = asesorCompleto.trim().split(/\s+/)[0];
    const codigo = parseInt(primeraParte, 10);
    return isNaN(codigo) ? null : codigo;
  };

  // Mapa de tiendas para búsqueda rápida
  const tiendasMap = useMemo(() => {
    const map = new Map<string, Tienda>();
    tiendas.forEach((t) => {
      map.set(t.nombre, t);
    });
    return map;
  }, [tiendas]);

  const ventasFiltradas = useMemo(() => {
    let resultado = ventas;

    // Filtrar por fecha
    if (filtros.fecha_desde) {
      resultado = resultado.filter(
        (v) => v.fecha_factura >= filtros.fecha_desde,
      );
    }
    if (filtros.fecha_hasta) {
      resultado = resultado.filter(
        (v) => v.fecha_factura <= filtros.fecha_hasta,
      );
    }

    if (filtros.zona) {
      resultado = resultado.filter((v) => v.zona === filtros.zona);
    }

    if (filtros.ciudad) {
      resultado = resultado.filter((v) => v.ciudad === filtros.ciudad);
    }

    if (filtros.bodega) {
      resultado = resultado.filter((v) => v.bodega === filtros.bodega);
    }

    if (filtros.asesor) {
      resultado = resultado.filter((v) => v.asesor === filtros.asesor);
    }

    if (filtros.linea_venta) {
      resultado = resultado.filter(
        (v) => v.linea_venta === filtros.linea_venta,
      );
    }

    if (filtros.agrupacion) {
      resultado = resultado.filter((v) => v.agrupacion === filtros.agrupacion);
    }

    return resultado;
  }, [ventas, filtros]);

  const ventasPorAsesor = useMemo<VentaAsesor[]>(() => {
    const agrupado = new Map<string, VentaAsesor>();

    ventasFiltradas.forEach((venta) => {
      const key = `${venta.asesor}|${venta.bodega}`;

      if (!agrupado.has(key)) {
        agrupado.set(key, {
          asesor: venta.asesor,
          bodega: venta.bodega,
          ciudad: venta.ciudad || "",
          zona: venta.zona || "",
          total_unidades: 0,
          total_valor: 0,
          // Agrupaciones
          unidades_indigo: 0,
          unidades_tela_liviana: 0,
          unidades_calzado: 0,
          unidades_complemento: 0,
          // Líneas de venta - unidades
          unidades_coleccion: 0,
          unidades_basicos: 0,
          unidades_promocion: 0,
          // Líneas de venta - valores
          valor_coleccion: 0,
          valor_basicos: 0,
          valor_promocion: 0,
        });
      }

      const actual = agrupado.get(key)!;
      actual.total_unidades += venta.venta;
      actual.total_valor += venta.valor;

      // Desglose por agrupación (mapeada desde el servidor)
      if (venta.agrupacion === "Indigo") {
        actual.unidades_indigo += venta.venta;
      } else if (venta.agrupacion === "Tela Liviana") {
        actual.unidades_tela_liviana += venta.venta;
      } else if (venta.agrupacion === "Calzado") {
        actual.unidades_calzado += venta.venta;
      } else if (venta.agrupacion === "Complemento") {
        actual.unidades_complemento += venta.venta;
      }

      // Desglose por línea de venta (mapeada desde el servidor)
      if (venta.linea_venta === "Colección") {
        actual.unidades_coleccion += venta.venta;
        actual.valor_coleccion += venta.valor;
      } else if (venta.linea_venta === "Básicos") {
        actual.unidades_basicos += venta.venta;
        actual.valor_basicos += venta.valor;
      } else if (venta.linea_venta === "Promoción") {
        actual.unidades_promocion += venta.venta;
        actual.valor_promocion += venta.valor;
      }
    });

    // Convertir a array y ordenar por total de unidades
    return Array.from(agrupado.values()).sort(
      (a, b) => b.total_unidades - a.total_unidades,
    );
  }, [ventasFiltradas, tiendasMap]);

  // Ventas agregadas por tienda
  const ventasPorTienda = useMemo<VentaTienda[]>(() => {
    const agrupado = new Map<string, VentaTienda>();

    ventasPorAsesor.forEach((ventaAsesor) => {
      const key = ventaAsesor.bodega;

      if (!agrupado.has(key)) {
        agrupado.set(key, {
          bodega: ventaAsesor.bodega,
          ciudad: ventaAsesor.ciudad,
          zona: ventaAsesor.zona,
          total_unidades: 0,
          total_valor: 0,
          asesores: [],
        });
      }

      const actual = agrupado.get(key)!;
      actual.total_unidades += ventaAsesor.total_unidades;
      actual.total_valor += ventaAsesor.total_valor;
      actual.asesores.push(ventaAsesor);
    });

    // Ordenar por total de unidades
    return Array.from(agrupado.values()).sort(
      (a, b) => b.total_unidades - a.total_unidades,
    );
  }, [ventasFiltradas, tiendasMap]);

  // Datos para la tabla
  const tablaVentas = useMemo<TablaVentasFila[]>(() => {
    return ventasPorAsesor.map((v, index) => {
      const codigoAsesor = extraerCodigoAsesor(v.asesor);

      const presupuestoTotal = codigoAsesor
        ? presupuestosEmpleados.get(codigoAsesor) || 0
        : 0;
      const presupuestoDistribuido = distribuirPresupuesto(presupuestoTotal);
      const comisionColeccion = calculateLineCommission(
        v.valor_coleccion,
        presupuestoDistribuido.presupuesto_coleccion,
        umbralesComision,
      );
      const comisionBasicos = calculateLineCommission(
        v.valor_basicos,
        presupuestoDistribuido.presupuesto_basicos,
        umbralesComision,
      );
      const comisionPromocion = calculateLineCommission(
        v.valor_promocion,
        presupuestoDistribuido.presupuesto_promocion,
        umbralesComision,
      );

      return {
        id: `${index}`,
        asesor: v.asesor,
        bodega: v.bodega,
        ciudad: v.ciudad,
        zona: v.zona,
        unidades: v.total_unidades,
        valor: v.total_valor,
        unidades_coleccion: v.unidades_coleccion,
        unidades_basicos: v.unidades_basicos,
        unidades_promocion: v.unidades_promocion,
        valor_coleccion: v.valor_coleccion,
        valor_basicos: v.valor_basicos,
        valor_promocion: v.valor_promocion,
        unidades_indigo: v.unidades_indigo,
        unidades_tela_liviana: v.unidades_tela_liviana,
        unidades_calzado: v.unidades_calzado,
        unidades_complemento: v.unidades_complemento,
        // Presupuestos distribuidos por línea de venta
        presupuesto_coleccion: presupuestoDistribuido.presupuesto_coleccion,
        cumplimiento_coleccion: comisionColeccion.cumplimiento,
        comision_coleccion: comisionColeccion.comision,
        presupuesto_basicos: presupuestoDistribuido.presupuesto_basicos,
        cumplimiento_basicos: comisionBasicos.cumplimiento,
        comision_basicos: comisionBasicos.comision,
        presupuesto_promocion: presupuestoDistribuido.presupuesto_promocion,
        cumplimiento_promocion: comisionPromocion.cumplimiento,
        comision_promocion: comisionPromocion.comision,
      };
    });
  }, [ventasPorAsesor, presupuestosEmpleados, umbralesComision]);

  const resumen = useMemo<ResumenVentas>(() => {
    if (ventasFiltradas.length === 0) {
      return resumenVacio;
    }

    const totalUnidades = ventasFiltradas.reduce((sum, v) => sum + v.venta, 0);
    const totalValor = ventasFiltradas.reduce((sum, v) => sum + v.valor, 0);
    const totalAsesores = new Set(ventasFiltradas.map((v) => v.asesor)).size;
    const totalTiendas = new Set(ventasFiltradas.map((v) => v.bodega)).size;

    const totalUnidadesIndigo = ventasFiltradas
      .filter((v) => v.agrupacion === "Indigo")
      .reduce((sum, v) => sum + v.venta, 0);
    const totalUnidadesLiviano = ventasFiltradas
      .filter((v) => v.agrupacion === "Tela Liviana")
      .reduce((sum, v) => sum + v.venta, 0);
    const totalValorIndigo = ventasFiltradas
      .filter((v) => v.agrupacion === "Indigo")
      .reduce((sum, v) => sum + v.valor, 0);
    const totalValorLiviano = ventasFiltradas
      .filter((v) => v.agrupacion === "Tela Liviana")
      .reduce((sum, v) => sum + v.valor, 0);
    const topAsesoresUnidades = [...ventasPorAsesor]
      .sort((a, b) => b.total_unidades - a.total_unidades)
      .slice(0, 5);
    const topAsesoresValor = [...ventasPorAsesor]
      .sort((a, b) => b.total_valor - a.total_valor)
      .slice(0, 5);
    const topTiendasUnidades = [...ventasPorTienda]
      .sort((a, b) => b.total_unidades - a.total_unidades)
      .slice(0, 5);
    const topTiendasValor = [...ventasPorTienda]
      .sort((a, b) => b.total_valor - a.total_valor)
      .slice(0, 5);

    return {
      total_unidades: totalUnidades,
      total_valor: totalValor,
      total_asesores: totalAsesores,
      total_tiendas: totalTiendas,
      total_unidades_indigo: totalUnidadesIndigo,
      total_unidades_liviano: totalUnidadesLiviano,
      total_valor_indigo: totalValorIndigo,
      total_valor_liviano: totalValorLiviano,
      promedio_unidades_asesor:
        totalAsesores > 0 ? Math.round(totalUnidades / totalAsesores) : 0,
      promedio_valor_asesor:
        totalAsesores > 0 ? Math.round(totalValor / totalAsesores) : 0,
      top_asesores_unidades: topAsesoresUnidades,
      top_asesores_valor: topAsesoresValor,
      top_tiendas_unidades: topTiendasUnidades,
      top_tiendas_valor: topTiendasValor,
    };
  }, [ventasFiltradas, ventasPorAsesor, ventasPorTienda]);

  const actualizarFiltros = useCallback(
    (nuevosFiltros: Partial<FiltrosVentas>) => {
      setFiltros((prev) => ({
        ...prev,
        ...nuevosFiltros,
      }));
    },
    [],
  );

  const limpiarFiltros = useCallback(() => {
    setFiltros(filtrosIniciales);
  }, []);
  const recargarDatos = useCallback(async () => {
    await queryClient.invalidateQueries();
  }, []);
  const ciudadesFiltradas = useMemo(() => {
    if (!filtros.zona) return ciudades.map((c) => c.nombre);
    const tiendasDeZona = tiendas.filter((t) => t.zona === filtros.zona);
    const ciudadesDeZona = new Set(tiendasDeZona.map((t) => t.ciudad));
    return ciudades
      .filter((c) => ciudadesDeZona.has(c.nombre))
      .map((c) => c.nombre);
  }, [ciudades, tiendas, filtros.zona]);

  const tiendasFiltradas = useMemo(() => {
    let resultado = tiendas;
    if (filtros.zona) {
      resultado = resultado.filter((t) => t.zona === filtros.zona);
    }
    if (filtros.ciudad) {
      resultado = resultado.filter((t) => t.ciudad === filtros.ciudad);
    }
    return resultado.map((t) => ({ id: t.id, nombre: t.nombre }));
  }, [tiendas, filtros.zona, filtros.ciudad]);
  const asesoresFiltrados = useMemo(() => {
    if (!ventasFiltradas.length) return asesores;

    let asesoresDisponibles = new Set<string>();

    ventasFiltradas.forEach((v) => {
      let incluir = true;
      if (filtros.zona && v.zona !== filtros.zona) {
        incluir = false;
      }
      if (filtros.ciudad && v.ciudad !== filtros.ciudad) {
        incluir = false;
      }
      if (filtros.bodega && v.bodega !== filtros.bodega) {
        incluir = false;
      }

      if (incluir) {
        asesoresDisponibles.add(v.asesor);
      }
    });
    if (filtros.zona || filtros.ciudad || filtros.bodega) {
      return Array.from(asesoresDisponibles).sort();
    }
    return asesores;
  }, [ventasFiltradas, asesores, filtros.zona, filtros.ciudad, filtros.bodega]);

  return {
    loading,
    isFetching: fetchingVentas,
    error,
    ventas: ventasFiltradas,
    hasLoadedAtLeastOnce,
    zonas,
    ciudades,
    tiendas,
    asesores,
    agrupaciones,
    lineasVenta,
    filtros,
    resumen,
    ciudadesFiltradas,
    tiendasFiltradas,
    asesoresFiltrados,
    ventasPorAsesor,
    ventasPorTienda,
    tablaVentas,
    actualizarFiltros,
    limpiarFiltros,
    recargarDatos,
  };
}

export default useInformeVentas;
