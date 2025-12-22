import { useState, useCallback, useMemo, useRef } from "react";
import { Role } from "../types";

export interface FilterState {
  filterTienda: string[];
  filterRol: Role[];
  expandedTiendas: Set<string>;
  isFiltering: boolean;
}

export interface FilterActions {
  setFilterTienda: (value: string | string[]) => void;
  setFilterRol: (rol: Role[]) => void;
  toggleFilterRol: (rol: Role) => void;
  clearFilterRol: () => void;
  setExpandedTiendas: (tiendas: Set<string>) => void;
  handleToggleAllStores: (
    tiendas: string[],
    forceExpand?: boolean,
    shouldContract?: boolean
  ) => void;
  toggleSingleStore: (tiendaKey: string) => void;
  // Función para limpiar todos los caches
  clearFilterCache: () => void;
}

// Tipos para el sistema de indexación optimizado
interface EmployeeIndex {
  tiendaIndex: number;
  empleadoIndex: number;
  rol: Role;
}

interface DataIndexes {
  tiendaIndices: Record<string, number[]>;
  rolIndices: Record<Role, number[]>;
  empleadoIndex: Record<string, EmployeeIndex>;
}

/**
 * HOOK OPTIMIZADO SIMPLIFICADO - SIN DEBOUNCING
 * - Elimina problemas de sincronización
 * - Cálculos directos y consistentes
 * - Cache optimizado
 * - Actualizaciones inmediatas
 */
export const useFiltersOptimized = (): FilterState &
  FilterActions & {
    applyFilters: (mesResumen: any) => any;
    getUniqueTiendas: (mesResumen: any) => string[];
    getFilteredComissionsForCards: (mesResumen: any) => {
      total_comisiones: number;
      comisiones_por_rol: Record<string, number>;
    };
  } => {
  // Estados de filtros - SIN DEBOUNCING
  const [filterTienda, setFilterTienda] = useState<string[]>([]);
  const [filterRol, setFilterRol] = useState<Role[]>([]);
  const [expandedTiendas, setExpandedTiendas] = useState<Set<string>>(
    new Set()
  );
  const [isFiltering, setIsFiltering] = useState(false);

  // Refs para optimización
  const calculationCacheRef = useRef<Map<string, any>>(new Map());
  const indexCacheRef = useRef<Map<string, DataIndexes>>(new Map());

  // ========================================================================
  // SISTEMA DE INDEXACIÓN O(1) OPTIMIZADO CON LRU CACHE
  // ========================================================================
  const buildIndexes = useCallback((mesResumen: any): DataIndexes | null => {
    if (!mesResumen || !mesResumen.tiendas) return null;

    const cacheKey = `indexes_${mesResumen.tiendas.length}`;

    // Verificar cache de índices
    if (indexCacheRef.current.has(cacheKey)) {
      return indexCacheRef.current.get(cacheKey)!;
    }

    const indexes: DataIndexes = {
      tiendaIndices: {},
      rolIndices: {
        gerente: [],
        asesor: [],
        cajero: [],
        logistico: [],
        coadministrador: [],
        gerente_online: [],
      },
      empleadoIndex: {},
    };

    mesResumen.tiendas.forEach((tienda: any, tiendaIndex: number) => {
      // Index por tienda
      if (!indexes.tiendaIndices[tienda.tienda]) {
        indexes.tiendaIndices[tienda.tienda] = [];
      }
      indexes.tiendaIndices[tienda.tienda].push(tiendaIndex);

      // Index por empleado
      tienda.empleados.forEach((empleado: any, empleadoIndex: number) => {
        const empleadoKey = `${tienda.tienda}-${tienda.fecha}-${empleado.id}`;
        indexes.empleadoIndex[empleadoKey] = {
          tiendaIndex,
          empleadoIndex,
          rol: empleado.rol,
        };

        // Index por rol usando Set para O(1)
        const rol = empleado.rol as Role;
        if (indexes.rolIndices[rol]) {
          indexes.rolIndices[rol].push(tiendaIndex);
        }
      });
    });

    // LRU Cache: mantener solo los últimos 3 índices
    if (indexCacheRef.current.size >= 3) {
      const firstKey = indexCacheRef.current.keys().next().value;
      if (firstKey) {
        indexCacheRef.current.delete(firstKey);
      }
    }
    indexCacheRef.current.set(cacheKey, indexes);

    return indexes;
  }, []);

  // ========================================================================
  // FILTRADO O(1) OPTIMIZADO - SIN DEBOUNCING
  // ========================================================================
  const applyFilters = useCallback(
    (mesResumen: any) => {
      if (!mesResumen) return null;

      // Early return si no hay filtros activos
      if (
        (!filterTienda || filterTienda.length === 0) &&
        (!filterRol || filterRol.length === 0)
      ) {
        return mesResumen;
      }

      // Crear clave para cache
      const cacheKey = `filters_${filterTienda.join(",")}_${filterRol.join(
        ","
      )}_${mesResumen.tiendas.length}`;

      // Verificar cache
      if (calculationCacheRef.current.has(cacheKey)) {
        return calculationCacheRef.current.get(cacheKey);
      }

      // Obtener índices
      const indexes = buildIndexes(mesResumen);
      if (!indexes) return mesResumen;

      // Aplicar filtros O(1) usando índices
      let tiendaIndices = Array.from(
        { length: mesResumen.tiendas.length },
        (_, i) => i
      );

      // Filtrar por tienda usando índices O(1)
      if (filterTienda && filterTienda.length > 0) {
        const indicesFiltrados: number[] = [];
        for (const tienda of filterTienda) {
          const tiendaIndexList = indexes.tiendaIndices[tienda] || [];
          indicesFiltrados.push(...tiendaIndexList);
        }
        tiendaIndices = Array.from(new Set(indicesFiltrados));
      }

      // Filtrar por rol usando índices O(1) con Sets
      if (filterRol && filterRol.length > 0) {
        const rolIndicesSet = new Set<number>();
        for (const rol of filterRol) {
          const rolIndexList = indexes.rolIndices[rol] || [];
          rolIndexList.forEach((i: number) => rolIndicesSet.add(i));
        }
        tiendaIndices = tiendaIndices.filter((i) => rolIndicesSet.has(i));
      }

      // Construir resultado filtrado con totales recalculados
      const tiendasFiltradas = tiendaIndices
        .map((tiendaIndex) => {
          const tienda = mesResumen.tiendas[tiendaIndex];
          let empleados = tienda.empleados;

          // Filtrar empleados por rol usando Set para O(1)
          if (filterRol.length > 0) {
            const roleSet = new Set(filterRol);
            empleados = empleados.filter((empleado: any) =>
              roleSet.has(empleado.rol)
            );
          }

          // Recalcular total de comisiones para esta tienda basado en empleados filtrados
          const totalComisionesTienda = empleados.reduce(
            (sum: number, empleado: any) =>
              sum + (empleado.comision_monto || 0),
            0
          );

          return {
            ...tienda,
            empleados,
            total_comisiones: Math.round(totalComisionesTienda * 100) / 100,
          };
        })
        .filter((tienda) => tienda.empleados.length > 0);

      // Recalcular totales optimizado usando los totales recalculados de cada tienda
      const total_comisiones = tiendasFiltradas.reduce(
        (sum: number, t: any) => sum + (t.total_comisiones || 0),
        0
      );

      const comisiones_por_rol: Record<string, number> = {
        gerente: 0,
        asesor: 0,
        cajero: 0,
        logistico: 0,
        coadministrador: 0,
        gerente_online: 0,
      };

      // Calcular comisiones por rol usando Set para velocidad
      const roleSet = new Set(filterRol);
      for (const tienda of tiendasFiltradas) {
        for (const empleado of tienda.empleados) {
          if (roleSet.has(empleado.rol) || filterRol.length === 0) {
            comisiones_por_rol[empleado.rol] += empleado.comision_monto || 0;
          }
        }
      }

      const result = {
        ...mesResumen,
        tiendas: tiendasFiltradas,
        total_comisiones: Math.round(total_comisiones * 100) / 100,
        comisiones_por_rol,
      };

      // Cache LRU: mantener solo los últimos 20 resultados
      if (calculationCacheRef.current.size > 20) {
        const firstKey = calculationCacheRef.current.keys().next().value;
        if (firstKey) {
          calculationCacheRef.current.delete(firstKey);
        }
      }
      calculationCacheRef.current.set(cacheKey, result);

      return result;
    },
    [filterTienda, filterRol, buildIndexes]
  );

  // ========================================================================
  // HANDLERS OPTIMIZADOS CON ACTUALIZACIÓN INMEDIATA
  // ========================================================================
  const handleFilterTiendaChange = useCallback((value: string | string[]) => {
    const tiendaArray = Array.isArray(value) ? value : [value].filter(Boolean);
    setFilterTienda(tiendaArray);
    // Limpiar cache cuando cambian los datos base
    calculationCacheRef.current.clear();
  }, []);

  const handleFilterRolChange = useCallback((roles: Role[]) => {
    setFilterRol(roles);
    calculationCacheRef.current.clear();
  }, []);

  const toggleFilterRol = useCallback((rol: Role) => {
    setFilterRol((prev) => {
      const newFilter = prev.includes(rol)
        ? prev.filter((r) => r !== rol)
        : [...prev, rol];
      return newFilter;
    });
    calculationCacheRef.current.clear();
  }, []);

  const clearFilterRol = useCallback(() => {
    setFilterRol([]);
    calculationCacheRef.current.clear();
  }, []);

  // Expansión masiva con request animation frame
  const handleToggleAllStores = useCallback(
    (tiendas: string[], forceExpand?: boolean, shouldContract?: boolean) => {
      requestAnimationFrame(() => {
        setExpandedTiendas((currentExpanded) => {
          if (shouldContract || (!forceExpand && currentExpanded.size > 0)) {
            return new Set();
          } else {
            return new Set(tiendas);
          }
        });
      });
    },
    []
  );

  const toggleSingleStore = useCallback((tiendaKey: string) => {
    setExpandedTiendas((currentExpanded) => {
      const newExpandedTiendas = new Set(currentExpanded);
      if (newExpandedTiendas.has(tiendaKey)) {
        newExpandedTiendas.delete(tiendaKey);
      } else {
        newExpandedTiendas.add(tiendaKey);
      }
      return newExpandedTiendas;
    });
  }, []);

  // ========================================================================
  // UTILIDADES CON CACHE OPTIMIZADO
  // ========================================================================
  const getUniqueTiendas = useCallback((mesResumen: any): string[] => {
    if (!mesResumen) return [];
    const cacheKey = `uniqueTiendas_${mesResumen.tiendas?.length || 0}`;

    if (calculationCacheRef.current.has(cacheKey)) {
      return calculationCacheRef.current.get(cacheKey);
    }

    const tiendas = mesResumen.tiendas?.map((t: any): string => t.tienda) || [];
    const uniqueTiendas = Array.from(new Set(tiendas)).sort() as string[];

    calculationCacheRef.current.set(cacheKey, uniqueTiendas);
    return uniqueTiendas;
  }, []);

  const getFilteredComissionsForCards = useCallback(
    (mesResumen: any) => {
      if (!mesResumen) {
        return {
          total_comisiones: 0,
          comisiones_por_rol: {
            gerente: 0,
            asesor: 0,
            cajero: 0,
            logistico: 0,
            coadministrador: 0,
            gerente_online: 0,
          },
        };
      }

      // ✅ CORRECCIÓN: Usar datos directos del mesResumen SIN CACHE
      // Igual que funcionan los gráficos que SÍ muestran valores correctos
      let totalComisiones = 0;
      const comisionesPorRol = {
        gerente: 0,
        asesor: 0,
        cajero: 0,
        logistico: 0,
        coadministrador: 0,
        gerente_online: 0,
      };

      // Usar datos directos sin cache (como los gráficos)
      const tiendasParaCalcular =
        filterTienda.length > 0
          ? mesResumen.tiendas.filter((tienda: any) =>
              filterTienda.includes(tienda.tienda)
            )
          : mesResumen.tiendas;

      tiendasParaCalcular.forEach((tienda: any) => {
        // Aplicar filtros de rol si están activos
        const empleadosParaCalcular =
          filterRol.length > 0
            ? tienda.empleados.filter((empleado: any) =>
                filterRol.includes(empleado.rol)
              )
            : tienda.empleados;

        empleadosParaCalcular.forEach((empleado: any) => {
          const comision = empleado.comision_monto || 0;
          totalComisiones += comision;

          // Sumar por rol
          if (comisionesPorRol.hasOwnProperty(empleado.rol)) {
            comisionesPorRol[empleado.rol as keyof typeof comisionesPorRol] +=
              comision;
          }
        });
      });

      // Redondear resultados
      totalComisiones = Math.round(totalComisiones * 100) / 100;
      Object.keys(comisionesPorRol).forEach((rol) => {
        comisionesPorRol[rol as keyof typeof comisionesPorRol] =
          Math.round(
            comisionesPorRol[rol as keyof typeof comisionesPorRol] * 100
          ) / 100;
      });

      // ✅ SIN CACHE: Devolver valores calculados directamente
      return {
        total_comisiones: totalComisiones,
        comisiones_por_rol: comisionesPorRol,
      };
    },
    [filterTienda, filterRol]
  );

  return {
    // Estados
    filterTienda,
    filterRol,
    expandedTiendas,
    isFiltering,

    // Acciones
    setFilterTienda: handleFilterTiendaChange,
    setFilterRol: handleFilterRolChange,
    toggleFilterRol,
    clearFilterRol,
    setExpandedTiendas,
    handleToggleAllStores,
    toggleSingleStore,

    // Utilidades
    applyFilters,
    getUniqueTiendas,
    getFilteredComissionsForCards,
    // Función para limpiar todos los caches
    clearFilterCache: () => {
      calculationCacheRef.current.clear();
      indexCacheRef.current.clear();
    },
  };
};
