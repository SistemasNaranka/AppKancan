import { useState, useEffect } from "react";
import { getResoluciones } from "../api/read";
import { Resolucion } from "../types";

export const useResoluciones = () => {
  const [resoluciones, setResoluciones] = useState<Resolucion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResoluciones = async () => {
      try {
        const data = await getResoluciones();
        setResoluciones(data);
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
