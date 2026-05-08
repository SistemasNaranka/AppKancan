import { useState, useEffect } from "react";
import { getResolutions } from "../api/read";
import { flattenResolution } from "../utils/calculos";
import { Resolucion } from "../types";

export const useResolution = () => {
  const [resoluciones, setResoluciones] = useState<Resolucion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResoluciones = async () => {
      try {
        const data = await getResolutions();
        const resolucionesAplanadas = data.map(flattenResolution);
        setResoluciones(resolucionesAplanadas);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchResoluciones();
  }, []);

  return { resoluciones, loading, error };
};
