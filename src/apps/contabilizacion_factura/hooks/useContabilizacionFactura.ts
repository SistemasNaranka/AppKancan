import { useState, useEffect, useCallback } from "react";
import { getFacturas } from "../api/directus/read";
import { Factura, FacturaFilters, ContabilizacionState } from "../types";

/**
 * Hook personalizado para manejar la lógica del módulo de Contabilización de Facturas
 */
export function useContabilizacionFactura() {
    const [state, setState] = useState<ContabilizacionState>({
        facturas: [],
        isLoading: false,
        error: null,
        filters: {},
    });

    // Cargar facturas
    const loadFacturas = useCallback(async () => {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        try {
            const facturas = await getFacturas();
            setState((prev) => ({
                ...prev,
                facturas,
                isLoading: false,
            }));
        } catch (error: any) {
            setState((prev) => ({
                ...prev,
                error: error.message || "Error al cargar facturas",
                isLoading: false,
            }));
        }
    }, []);

    // Aplicar filtros
    const applyFilters = useCallback((filters: FacturaFilters) => {
        setState((prev) => ({ ...prev, filters }));
    }, []);

    // Limpiar filtros
    const clearFilters = useCallback(() => {
        setState((prev) => ({ ...prev, filters: {} }));
    }, []);

    // Facturas filtradas
    const facturasFiltered = state.facturas.filter((factura) => {
        const { estado, fecha_desde, fecha_hasta, cliente } = state.filters;

        if (estado && factura.estado !== estado) return false;
        if (cliente && !factura.cliente.toLowerCase().includes(cliente.toLowerCase()))
            return false;
        if (fecha_desde && factura.fecha_emision < fecha_desde) return false;
        if (fecha_hasta && factura.fecha_emision > fecha_hasta) return false;

        return true;
    });

    // Cargar facturas al montar el componente
    useEffect(() => {
        loadFacturas();
    }, [loadFacturas]);

    return {
        facturas: facturasFiltered,
        isLoading: state.isLoading,
        error: state.error,
        filters: state.filters,
        loadFacturas,
        applyFilters,
        clearFilters,
    };
}
