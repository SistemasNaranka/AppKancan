/**
 * Hook principal para el Informe de Ventas
 *
 * Maneja toda la lógica de:
 * - Carga de datos
 * - Filtros (se aplican en el servidor)
 * - Cálculos y agregaciones
 * - Estado de la aplicación
 */

import { useState, useEffect, useMemo, useCallback } from "react";
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

// ==================== INTERFAZ DEL HOOK ====================

interface UseInformeVentasReturn {
  // Estado
  loading: boolean;
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

  // Datos procesados
  ventasPorAsesor: VentaAsesor[];
  ventasPorTienda: VentaTienda[];
  tablaVentas: TablaVentasFila[];

  // Acciones
  actualizarFiltros: (nuevosFiltros: Partial<FiltrosVentas>) => void;
  limpiarFiltros: () => void;
  recargarDatos: () => Promise<void>;
}

// ==================== VALORES POR DEFECTO ====================

const filtrosIniciales: FiltrosVentas = {
  fecha_desde: new Date(new Date().setDate(1)).toISOString().split("T")[0], // Primer día del mes actual
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

// ==================== HOOK PRINCIPAL ====================

export function useInformeVentas(): UseInformeVentasReturn {
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ventas, setVentas] = useState<VentaRegistro[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [asesores, setAsesores] = useState<string[]>([]);
  const [agrupaciones, setAgrupaciones] = useState<Agrupacion[]>([]);
  const [lineasVenta, setLineasVenta] = useState<LineaVenta[]>([]);
  const [filtros, setFiltros] = useState<FiltrosVentas>(filtrosIniciales);

  // ==================== CARGA DE DATOS ====================

  const cargarDatosIniciales = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Cargar datos maestros en paralelo (sin filtros de fecha inicialmente)
      const [asesoresData, agrupacionesData, lineasVentaData] =
        await Promise.all([
          obtenerAsesores(),
          obtenerAgrupaciones(),
          obtenerLineasVenta(),
        ]);

      setAsesores(asesoresData);
      setAgrupaciones(agrupacionesData);
      setLineasVenta(lineasVentaData);
    } catch (err) {
      console.error("Error al cargar datos iniciales:", err);
      setError("Error al cargar los datos. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar filtros contextuales (zonas, ciudades, tiendas) basados en el rango de fechas
  const cargarFiltrosContextuales = useCallback(
    async (fechaDesde: string, fechaHasta: string) => {
      try {
        const [zonasData, ciudadesData, tiendasData] = await Promise.all([
          obtenerZonas(fechaDesde, fechaHasta),
          obtenerCiudades(fechaDesde, fechaHasta),
          obtenerTiendas(fechaDesde, fechaHasta),
        ]);

        setZonas(zonasData);
        setCiudades(ciudadesData);
        setTiendas(tiendasData);
      } catch (err) {
        console.error("Error al cargar filtros contextuales:", err);
      }
    },
    [],
  );

  const cargarVentas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const ventasData = await obtenerVentas(filtros);
      setVentas(ventasData);
    } catch (err) {
      console.error("Error al cargar ventas:", err);
      setError("Error al cargar las ventas. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    cargarDatosIniciales();
  }, [cargarDatosIniciales]);

  // Cargar ventas y filtros contextuales cuando cambien las fechas
  useEffect(() => {
    if (filtros.fecha_desde && filtros.fecha_hasta) {
      // Cargar filtros contextuales basados en el rango de fechas
      cargarFiltrosContextuales(filtros.fecha_desde, filtros.fecha_hasta);
      // Cargar ventas
      cargarVentas();
    }
  }, [
    filtros.fecha_desde,
    filtros.fecha_hasta,
    cargarFiltrosContextuales,
    cargarVentas,
  ]);

  // ==================== PROCESAMIENTO DE DATOS ====================

  // Mapa de tiendas para búsqueda rápida
  const tiendasMap = useMemo(() => {
    const map = new Map<string, Tienda>();
    tiendas.forEach((t) => {
      map.set(t.nombre, t);
    });
    return map;
  }, [tiendas]);

  // Ventas agregadas por asesor
  const ventasPorAsesor = useMemo<VentaAsesor[]>(() => {
    const agrupado = new Map<string, VentaAsesor>();

    ventas.forEach((venta) => {
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
  }, [ventas, tiendasMap]);

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
  }, [ventasPorAsesor]);

  // Datos para la tabla
  const tablaVentas = useMemo<TablaVentasFila[]>(() => {
    return ventasPorAsesor.map((v, index) => ({
      id: `${index}`,
      asesor: v.asesor,
      bodega: v.bodega,
      ciudad: v.ciudad,
      zona: v.zona,
      unidades: v.total_unidades,
      valor: v.total_valor,
      // Líneas de venta - unidades (columnas fijas)
      unidades_coleccion: v.unidades_coleccion,
      unidades_basicos: v.unidades_basicos,
      unidades_promocion: v.unidades_promocion,
      // Líneas de venta - valores (columnas fijas)
      valor_coleccion: v.valor_coleccion,
      valor_basicos: v.valor_basicos,
      valor_promocion: v.valor_promocion,
      // Agrupaciones (columnas seleccionables)
      unidades_indigo: v.unidades_indigo,
      unidades_tela_liviana: v.unidades_tela_liviana,
      unidades_calzado: v.unidades_calzado,
      unidades_complemento: v.unidades_complemento,
    }));
  }, [ventasPorAsesor]);

  // Resumen general
  const resumen = useMemo<ResumenVentas>(() => {
    if (ventas.length === 0) {
      return resumenVacio;
    }

    const totalUnidades = ventas.reduce((sum, v) => sum + v.venta, 0);
    const totalValor = ventas.reduce((sum, v) => sum + v.valor, 0);
    const totalAsesores = new Set(ventas.map((v) => v.asesor)).size;
    const totalTiendas = new Set(ventas.map((v) => v.bodega)).size;

    // Totales por agrupación (mapeadas: Indigo, Tela Liviana, Calzado, Complemento)
    const totalUnidadesIndigo = ventas
      .filter((v) => v.agrupacion === "Indigo")
      .reduce((sum, v) => sum + v.venta, 0);
    const totalUnidadesLiviano = ventas
      .filter((v) => v.agrupacion === "Tela Liviana")
      .reduce((sum, v) => sum + v.venta, 0);
    const totalValorIndigo = ventas
      .filter((v) => v.agrupacion === "Indigo")
      .reduce((sum, v) => sum + v.valor, 0);
    const totalValorLiviano = ventas
      .filter((v) => v.agrupacion === "Tela Liviana")
      .reduce((sum, v) => sum + v.valor, 0);

    // Top 5 asesores por unidades
    const topAsesoresUnidades = [...ventasPorAsesor]
      .sort((a, b) => b.total_unidades - a.total_unidades)
      .slice(0, 5);

    // Top 5 asesores por valor
    const topAsesoresValor = [...ventasPorAsesor]
      .sort((a, b) => b.total_valor - a.total_valor)
      .slice(0, 5);

    // Top 5 tiendas por unidades
    const topTiendasUnidades = [...ventasPorTienda]
      .sort((a, b) => b.total_unidades - a.total_unidades)
      .slice(0, 5);

    // Top 5 tiendas por valor
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
  }, [ventas, ventasPorAsesor, ventasPorTienda]);

  // ==================== ACCIONES ====================

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
    await cargarDatosIniciales();
    await cargarVentas();
  }, [cargarDatosIniciales, cargarVentas]);

  // ==================== RETORNO ====================

  return {
    // Estado
    loading,
    error,
    ventas,
    zonas,
    ciudades,
    tiendas,
    asesores,
    agrupaciones,
    lineasVenta,
    filtros,
    resumen,

    // Datos procesados
    ventasPorAsesor,
    ventasPorTienda,
    tablaVentas,

    // Acciones
    actualizarFiltros,
    limpiarFiltros,
    recargarDatos,
  };
}

export default useInformeVentas;
