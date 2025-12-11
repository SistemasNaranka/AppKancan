import { useState, useMemo, useCallback } from "react";
import { Role } from "../types";

export interface FilterState {
  filterTienda: string[];
  filterRol: Role[];
  expandedTiendas: Set<string>;
}

export interface FilterActions {
  setFilterTienda: (value: string | string[]) => void;
  setFilterRol: (rol: Role[]) => void;
  toggleFilterRol: (rol: Role) => void;
  clearFilterRol: () => void;
  setExpandedTiendas: (tiendas: Set<string>) => void;
  handleToggleAllStores: (tiendas: string[]) => void;
}

export const useFilters = () => {
  // Filter states
  const [filterTienda, setFilterTienda] = useState<string[]>([]);
  const [filterRol, setFilterRol] = useState<Role[]>([]);
  const [expandedTiendas, setExpandedTiendas] = useState<Set<string>>(
    new Set()
  );

  // Handler para cambios en filtro de tienda
  const handleFilterTiendaChange = useCallback((value: string | string[]) => {
    const tiendaArray = Array.isArray(value) ? value : [value].filter(Boolean);
    setFilterTienda(tiendaArray);
  }, []);

  // Handler para cambios en filtro de rol (array)
  const handleFilterRolChange = useCallback((roles: Role[]) => {
    setFilterRol(roles);
  }, []);

  // Handler para toggle de rol individual
  const toggleFilterRol = useCallback((rol: Role) => {
    setFilterRol((prev) => {
      if (prev.includes(rol)) {
        return prev.filter((r) => r !== rol);
      } else {
        return [...prev, rol];
      }
    });
  }, []);

  // Handler para limpiar filtro de rol
  const clearFilterRol = useCallback(() => {
    setFilterRol([]);
  }, []);

  // Handler para toggle de todas las tiendas
  const handleToggleAllStores = useCallback(
    (tiendas: string[]) => {
      if (expandedTiendas.size === 0) {
        // Si no hay tiendas expandidas, expandir todas
        setExpandedTiendas(new Set(tiendas));
      } else {
        // Si hay tiendas expandidas, contraer todas
        setExpandedTiendas(new Set());
      }
    },
    [expandedTiendas, setExpandedTiendas]
  );

  // Aplicar filtros al resumen mensual
  const applyFilters = useCallback(
    (mesResumen: any) => {
      if (!mesResumen) return null;

      let tiendasFiltradas = mesResumen.tiendas;

      // Filtrar por tienda
      if (filterTienda && filterTienda.length > 0) {
        tiendasFiltradas = tiendasFiltradas.filter((t: any) =>
          filterTienda.includes(t.tienda)
        );
      }

      // Filtrar por rol - remover tiendas que no tienen empleados de los roles seleccionados
      if (filterRol && filterRol.length > 0) {
        tiendasFiltradas = tiendasFiltradas.filter((tienda: any) =>
          tienda.empleados.some((empleado: any) =>
            filterRol.includes(empleado.rol)
          )
        );
      }

      // Recalcular totales
      const total_comisiones = tiendasFiltradas.reduce(
        (sum: number, t: any) => sum + t.total_comisiones,
        0
      );

      // Recalcular comisiones por rol
      const comisiones_por_rol: Record<string, number> = {
        gerente: 0,
        asesor: 0,
        cajero: 0,
        logistico: 0,
      };

      tiendasFiltradas.forEach((tienda: any) => {
        tienda.empleados.forEach((empleado: any) => {
          comisiones_por_rol[empleado.rol] += empleado.comision_monto;
        });
      });

      Object.keys(comisiones_por_rol).forEach((role) => {
        comisiones_por_rol[role as keyof typeof comisiones_por_rol] =
          Math.round(
            comisiones_por_rol[role as keyof typeof comisiones_por_rol] * 100
          ) / 100;
      });

      return {
        ...mesResumen,
        tiendas: tiendasFiltradas,
        total_comisiones: Math.round(total_comisiones * 100) / 100,
        comisiones_por_rol,
      };
    },
    [filterTienda, filterRol]
  );

  // Obtener tiendas únicas para filtros
  const getUniqueTiendas = useCallback((mesResumen: any): string[] => {
    if (!mesResumen) return [];
    const tiendas = mesResumen.tiendas.map((t: any): string => t.tienda);
    return Array.from(new Set(tiendas)).sort() as string[];
  }, []);

  // Función para obtener comisiones filtradas por rol para las cards
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

      let tiendasFiltradas = mesResumen.tiendas;

      // Filtrar por tienda
      if (filterTienda && filterTienda.length > 0) {
        tiendasFiltradas = tiendasFiltradas.filter((t: any) =>
          filterTienda.includes(t.tienda)
        );
      }

      // Recalcular comisiones por rol
      const comisiones_por_rol: Record<string, number> = {
        gerente: 0,
        asesor: 0,
        cajero: 0,
        logistico: 0,
      };

      tiendasFiltradas.forEach((tienda: any) => {
        tienda.empleados.forEach((empleado: any) => {
          // Si no hay filtro de rol o el rol del empleado está en los filtros seleccionados, incluirlo
          if (filterRol.length === 0 || filterRol.includes(empleado.rol)) {
            comisiones_por_rol[empleado.rol] += empleado.comision_monto;
          }
        });
      });

      // El total siempre debe ser el total completo (no filtrado por rol)
      const total_comisiones = tiendasFiltradas.reduce(
        (sum: number, t: any) => sum + t.total_comisiones,
        0
      );

      Object.keys(comisiones_por_rol).forEach((role) => {
        comisiones_por_rol[role as keyof typeof comisiones_por_rol] =
          Math.round(
            comisiones_por_rol[role as keyof typeof comisiones_por_rol] * 100
          ) / 100;
      });

      return {
        total_comisiones: Math.round(total_comisiones * 100) / 100,
        comisiones_por_rol,
      };
    },
    [filterTienda, filterRol]
  );

  return {
    // States
    filterTienda,
    filterRol,
    expandedTiendas,

    // Actions
    setFilterTienda: handleFilterTiendaChange,
    setFilterRol: handleFilterRolChange,
    toggleFilterRol,
    clearFilterRol,
    setExpandedTiendas,
    handleToggleAllStores,

    // Utilities
    applyFilters,
    getUniqueTiendas,
    getFilteredComissionsForCards,
  };
};
