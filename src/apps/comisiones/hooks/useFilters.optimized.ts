import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Role } from "../types";

export interface FilterState {
  filterTienda: string[];
  filterRol: Role[];
  debouncedFilterRol: Role[];
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
 * 🚀 HOOK OPTIMIZADO - ELIMINA CONGELAMIENTO MANTENIENDO COMPATIBILIDAD
 * - Elimina efectos en cascada problemáticos
 * - Mejor sistema de cache con LRU
 * - Filtrado O(1) optimizado
 * - Batching de actualizaciones
 */
export const useFiltersOptimized = (
  debounceDelay: number = 200
): FilterState &
  FilterActions & {
    applyFilters: (mesResumen: any) => any;
    getUniqueTiendas: (mesResumen: any) => string[];
    getFilteredComissionsForCards: (mesResumen: any) => {
      total_comisiones: number;
      comisiones_por_rol: Record<string, number>;
    };
  } => {
  // Estados de filtros
  const [filterTienda, setFilterTienda] = useState<string[]>([]);
  const [filterRol, setFilterRol] = useState<Role[]>([]);
  const [debouncedFilterRol, setDebouncedFilterRol] = useState<Role[]>([]);
  const [expandedTiendas, setExpandedTiendas] = useState<Set<string>>(
    new Set()
  );
  const [isFiltering, setIsFiltering] = useState(false);

  // Refs para optimización
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const calculationCacheRef = useRef<Map<string, any>>(new Map());
  const indexCacheRef = useRef<Map<string, DataIndexes>>(new Map());
  const pendingUpdatesRef = useRef<Set<string>>(new Set());

  // ========================================================================
  // DEBOUNCING OPTIMIZADO CON BATCHING
  // ========================================================================
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Marcar que hay cambios pendientes para evitar actualizaciones redundantes
    const hasChanges =
      filterRol.length !== debouncedFilterRol.length ||
      !filterRol.every((r) => debouncedFilterRol.includes(r));

    if (hasChanges) {
      setIsFiltering(true);
      pendingUpdatesRef.current.add("filterRol");
    }

    // Debounce con batching para evitar múltiples actualizaciones
    debounceTimeoutRef.current = setTimeout(() => {
      if (pendingUpdatesRef.current.has("filterRol")) {
        setDebouncedFilterRol(filterRol);
        setIsFiltering(false);
        pendingUpdatesRef.current.delete("filterRol");
      }
    }, debounceDelay);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [filterRol, debounceDelay, debouncedFilterRol.length]);

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
      rolIndices: { gerente: [], asesor: [], cajero: [], logistico: [] },
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
  // FILTRADO O(1) OPTIMIZADO SIN EFECTOS EN CASCADA
  // ========================================================================
  const applyFilters = useCallback(
    (mesResumen: any) => {
      if (!mesResumen) return null;

      // Early return si no hay filtros activos
      if (
        (!filterTienda || filterTienda.length === 0) &&
        (!debouncedFilterRol || debouncedFilterRol.length === 0)
      ) {
        return mesResumen;
      }

      // Crear clave para cache
      const cacheKey = `filters_${filterTienda.join(
        ","
      )}_${debouncedFilterRol.join(",")}_${mesResumen.tiendas.length}`;

      // Verificar cache
      if (calculationCacheRef.current.has(cacheKey)) {
        return calculationCacheRef.current.get(cacheKey);
      }

      // Obtener índices
      const indexes = buildIndexes(mesResumen);
      if (!indexes) return mesResumen;

      const startTime = performance.now();

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
      if (debouncedFilterRol && debouncedFilterRol.length > 0) {
        const rolIndicesSet = new Set<number>();
        for (const rol of debouncedFilterRol) {
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
          if (debouncedFilterRol.length > 0) {
            const roleSet = new Set(debouncedFilterRol);
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
      };

      // Calcular comisiones por rol usando Set para velocidad
      const roleSet = new Set(debouncedFilterRol);
      for (const tienda of tiendasFiltradas) {
        for (const empleado of tienda.empleados) {
          if (roleSet.has(empleado.rol) || debouncedFilterRol.length === 0) {
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
    [filterTienda, debouncedFilterRol, buildIndexes]
  );

  // ========================================================================
  // HANDLERS OPTIMIZADOS CON BATCHING
  // ========================================================================
  const handleFilterTiendaChange = useCallback((value: string | string[]) => {
    const tiendaArray = Array.isArray(value) ? value : [value].filter(Boolean);
    setFilterTienda(tiendaArray);
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

  // 🎯 EXPANSIÓN MASIVA CON REQUEST ANIMATION FRAME
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
          },
        };
      }

      const cacheKey = `cards_${filterTienda.join(
        ","
      )}_${debouncedFilterRol.join(",")}_${mesResumen.tiendas?.length || 0}`;

      if (calculationCacheRef.current.has(cacheKey)) {
        return calculationCacheRef.current.get(cacheKey);
      }

      // Usar applyFilters para consistencia
      const filteredData = applyFilters(mesResumen);

      if (!filteredData) {
        return {
          total_comisiones: 0,
          comisiones_por_rol: {
            gerente: 0,
            asesor: 0,
            cajero: 0,
            logistico: 0,
          },
        };
      }

      const result = {
        total_comisiones: filteredData.total_comisiones || 0,
        comisiones_por_rol: filteredData.comisiones_por_rol || {
          gerente: 0,
          asesor: 0,
          cajero: 0,
          logistico: 0,
        },
      };

      calculationCacheRef.current.set(cacheKey, result);
      return result;
    },
    [filterTienda, debouncedFilterRol, applyFilters]
  );

  return {
    // Estados
    filterTienda,
    filterRol,
    debouncedFilterRol,
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
  };
};
