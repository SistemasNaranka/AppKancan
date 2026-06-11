import { useState, useCallback, useRef } from "react";
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
    shouldContract?: boolean,
  ) => void;
  toggleSingleStore: (tiendaKey: string) => void;
  clearFilterCache: () => void;
}

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

export const useFiltersOptimized = (): FilterState &
  FilterActions & {
    applyFilters: (mesResumen: any) => any;
    getUniqueTiendas: (mesResumen: any) => string[];
    getFilteredComissionsForCards: (mesResumen: any) => {
      total_comisiones: number;
      comisiones_por_rol: Record<string, number>;
    };
  } => {

    const [filterTienda, setFilterTienda] = useState<string[]>([]);
  const [filterRol, setFilterRol] = useState<Role[]>([]);
  const [expandedTiendas, setExpandedTiendas] = useState<Set<string>>(
    new Set(),
  );
  const [isFiltering] = useState(false);

  const calculationCacheRef = useRef<Map<string, any>>(new Map());
  const indexCacheRef = useRef<Map<string, DataIndexes>>(new Map());
  const buildIndexes = useCallback((mesResumen: any): DataIndexes | null => {
    if (!mesResumen || !mesResumen.tiendas) return null;

    const cacheKey = `indexes_${mesResumen.tiendas.length}`;

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
      if (!indexes.tiendaIndices[tienda.tienda]) {
        indexes.tiendaIndices[tienda.tienda] = [];
      }
      indexes.tiendaIndices[tienda.tienda].push(tiendaIndex);

      tienda.empleados.forEach((empleado: any, empleadoIndex: number) => {
        const empleadoKey = `${tienda.tienda}-${tienda.fecha}-${empleado.id}`;
        indexes.empleadoIndex[empleadoKey] = {
          tiendaIndex,
          empleadoIndex,
          rol: empleado.rol,
        };

        const rol = empleado.rol as Role;
        if (indexes.rolIndices[rol]) {
          indexes.rolIndices[rol].push(tiendaIndex);
        }
      });
    });

    if (indexCacheRef.current.size >= 3) {
      const firstKey = indexCacheRef.current.keys().next().value;
      if (firstKey) {
        indexCacheRef.current.delete(firstKey);
      }
    }
    indexCacheRef.current.set(cacheKey, indexes);

    return indexes;
  }, []);


  const applyFilters = useCallback(
    (mesResumen: any) => {
      if (!mesResumen) return null;

      if (
        (!filterTienda || filterTienda.length === 0) &&
        (!filterRol || filterRol.length === 0)
      ) {
        return mesResumen;
      }

      const cacheKey = `filters_${filterTienda.join(",")}_${filterRol.join(
        ",",
      )}_${mesResumen.tiendas.length}`;

      if (calculationCacheRef.current.has(cacheKey)) {
        return calculationCacheRef.current.get(cacheKey);
      }

      const indexes = buildIndexes(mesResumen);
      if (!indexes) return mesResumen;

      let tiendaIndices = Array.from(
        { length: mesResumen.tiendas.length },
        (_, i) => i,
      );

      if (filterTienda && filterTienda.length > 0) {
        const indicesFiltrados: number[] = [];
        for (const tienda of filterTienda) {
          const tiendaIndexList = indexes.tiendaIndices[tienda] || [];
          indicesFiltrados.push(...tiendaIndexList);
        }
        tiendaIndices = Array.from(new Set(indicesFiltrados));
      }

      if (filterRol && filterRol.length > 0) {
        const rolIndicesSet = new Set<number>();
        for (const rol of filterRol) {
          const rolIndexList = indexes.rolIndices[rol] || [];
          rolIndexList.forEach((i: number) => rolIndicesSet.add(i));
        }
        tiendaIndices = tiendaIndices.filter((i) => rolIndicesSet.has(i));
      }

      const tiendasFiltradas = tiendaIndices
        .map((tiendaIndex) => {
          const tienda = mesResumen.tiendas[tiendaIndex];
          let empleados = tienda.empleados;

          if (filterRol.length > 0) {
            const roleSet = new Set(filterRol);
            empleados = empleados.filter((empleado: any) =>
              roleSet.has(empleado.rol),
            );
          }

          const totalComisionesTienda = empleados.reduce(
            (sum: number, empleado: any) =>
              sum + (empleado.comision_monto || 0),
            0,
          );

          return {
            ...tienda,
            empleados,
            total_comisiones: Math.round(totalComisionesTienda * 100) / 100,
          };
        })
        .filter((tienda) => tienda.empleados.length > 0);

      const total_comisiones = tiendasFiltradas.reduce(
        (sum: number, t: any) => sum + (t.total_comisiones || 0),
        0,
      );

      const comisiones_por_rol: Record<string, number> = {
        gerente: 0,
        asesor: 0,
        cajero: 0,
        logistico: 0,
        coadministrador: 0,
        gerente_online: 0,
      };

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

      if (calculationCacheRef.current.size > 20) {
        const firstKey = calculationCacheRef.current.keys().next().value;
        if (firstKey) {
          calculationCacheRef.current.delete(firstKey);
        }
      }
      calculationCacheRef.current.set(cacheKey, result);

      return result;
    },
    [filterTienda, filterRol, buildIndexes],
  );

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
    [],
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
      if (!mesResumen || !mesResumen.tiendas) {
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

      let totalComisiones = 0;
      const comisionesPorRol = {
        gerente: 0,
        asesor: 0,
        cajero: 0,
        logistico: 0,
        coadministrador: 0,
        gerente_online: 0,
      };

      const tiendasParaCalcular =
        filterTienda.length > 0
          ? mesResumen.tiendas.filter((tienda: any) =>
              filterTienda.includes(tienda.tienda),
            )
          : mesResumen.tiendas;

      tiendasParaCalcular.forEach((tienda: any) => {
        const empleadosParaCalcular =
          filterRol.length > 0
            ? tienda.empleados.filter((empleado: any) =>
                filterRol.includes(empleado.rol),
              )
            : tienda.empleados;

        empleadosParaCalcular.forEach((empleado: any) => {
          const comision = empleado.comision_monto || 0;
          totalComisiones += comision;

          if (comisionesPorRol.hasOwnProperty(empleado.rol)) {
            comisionesPorRol[empleado.rol as keyof typeof comisionesPorRol] +=
              comision;
          }
        });
      });

      totalComisiones = Math.round(totalComisiones * 100) / 100;
      Object.keys(comisionesPorRol).forEach((rol) => {
        comisionesPorRol[rol as keyof typeof comisionesPorRol] =
          Math.round(
            comisionesPorRol[rol as keyof typeof comisionesPorRol] * 100,
          ) / 100;
      });

      return {
        total_comisiones: totalComisiones,
        comisiones_por_rol: comisionesPorRol,
      };
    },
    [filterTienda, filterRol],
  );

  return {
    filterTienda,
    filterRol,
    expandedTiendas,
    isFiltering,
    setFilterTienda: handleFilterTiendaChange,
    setFilterRol: handleFilterRolChange,
    toggleFilterRol,
    clearFilterRol,
    setExpandedTiendas,
    handleToggleAllStores,
    toggleSingleStore,
    applyFilters,
    getUniqueTiendas,
    getFilteredComissionsForCards,
    clearFilterCache: () => {
      calculationCacheRef.current.clear();
      indexCacheRef.current.clear();
    },
  };
};
