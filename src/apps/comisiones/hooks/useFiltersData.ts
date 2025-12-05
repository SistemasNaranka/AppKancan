import { useState, useEffect } from "react";
import { obtenerTiendas, obtenerCargos } from "../api/directus/read";
import { DirectusTienda, DirectusCargo } from "../types";

interface FilterOption {
  value: string;
  label: string;
}

interface UseFiltersDataReturn {
  tiendas: DirectusTienda[];
  cargos: DirectusCargo[];
  tiendasOptions: FilterOption[];
  cargosOptions: FilterOption[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook personalizado para cargar datos de filtros desde la base de datos
 * - Tiendas con autocompletado
 * - Cargos para filtros
 * - Manejo de estados de carga y error
 */
export const useFiltersData = (): UseFiltersDataReturn => {
  const [tiendas, setTiendas] = useState<DirectusTienda[]>([]);
  const [cargos, setCargos] = useState<DirectusCargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar tiendas y cargos en paralelo
        const [tiendasData, cargosData] = await Promise.all([
          obtenerTiendas(),
          obtenerCargos(),
        ]);

        setTiendas(tiendasData);
        setCargos(cargosData);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Error cargando datos de filtros";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadFiltersData();
  }, []);

  // Convertir tiendas a opciones para AutocompleteSelect
  const tiendasOptions: FilterOption[] = tiendas.map((tienda) => ({
    value: tienda.nombre,
    label: tienda.nombre,
  }));

  // Convertir cargos a opciones para filtros
  const cargosOptions: FilterOption[] = cargos.map((cargo) => ({
    value: cargo.id.toString(),
    label: cargo.nombre,
  }));

  return {
    tiendas,
    cargos,
    tiendasOptions,
    cargosOptions,
    loading,
    error,
  };
};

export default useFiltersData;
