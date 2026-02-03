import { useState, useEffect } from "react";
import { obtenerResoluciones } from "../api/read";
import { aplanarResolucion } from "../utils/calculos";
import { Resolucion } from "../types";

export const useResoluciones = () => {
  const [resoluciones, setResoluciones] = useState<Resolucion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResoluciones = async () => {
      try {
        const data = await obtenerResoluciones();
        const resolucionesAplanadas = data.map(aplanarResolucion);
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
