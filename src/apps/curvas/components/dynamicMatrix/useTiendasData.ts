// Hook que carga la lista de tiendas disponibles desde Directus al montar.

import { useEffect, useState } from "react";
import { getTiendas } from "../../api/directus/read";
import type { Tienda } from "../../types";

export function useTiendasData() {
  const [tiendasLista, setTiendasLista] = useState<Tienda[]>([]);
  const [loadingTiendas, setLoadingTiendas] = useState(false);

  useEffect(() => {
    const fetchTiendas = async () => {
      setLoadingTiendas(true);
      try {
        const data = await getTiendas();
        setTiendasLista(data);
      } catch (error) {
        console.error("Error fetching tiendas:", error);
      } finally {
        setLoadingTiendas(false);
      }
    };
    fetchTiendas();
  }, []);

  return { tiendasLista, loadingTiendas };
}
