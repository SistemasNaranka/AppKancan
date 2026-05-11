import { useState, useEffect, useCallback } from "react";
import type { Proyecto, Proceso, Mejora, MetricasProyecto } from "../types";
import { getProjects, getProyectoById } from "../api/directus/read";
import { calculateProjectMetrics } from "../lib/calculos";

interface UseProyectosReturn {
  proyectos: Proyecto[];
  loading: boolean;
  error: string | null;
  recargar: () => Promise<void>;
}

interface UseProyectoByIdReturn {
  proyecto: Proyecto | null;
  metricas: MetricasProyecto;
  loading: boolean;
  error: string | null;
  recargar: () => Promise<void>;
}

/**
 * Hook para obtener todos los proyectos
 */
export function useProjects(): UseProyectosReturn {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      setProyectos(data);
    } catch (err) {
      console.error("Error cargando proyectos:", err);
      setError("Error al cargar los proyectos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { proyectos, loading, error, recargar };
}

/**
 * Hook para obtener un proyecto por ID
 */
export function getProjectById(id: string): UseProyectoByIdReturn {
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [metricas, setMetricas] = useState<MetricasProyecto>({
    total_procesos: 0,
    ahorro_total_mensual: 0,
    ahorro_total_anual: 0,
    procesos: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getProyectoById(id);
      if (data) {
        setProyecto(data);
        // Calcular métricas
        if (data.procesos && data.procesos.length > 0) {
          setMetricas(calculateProjectMetrics(data.procesos));
        }
      } else {
        setError("Proyecto no encontrado");
      }
    } catch (err) {
      console.error("Error cargando proyecto:", err);
      setError("Error al cargar el proyecto");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { proyecto, metricas, loading, error, recargar };
}

/**
 * Obtiene el estado del proyecto en formato legible
 */
export function getEstadoLabel(estado: string): string {
  switch (estado) {
    case "en_proceso":
      return "En Proceso";
    case "entregado":
      return "Entregado";
    case "en_seguimiento":
      return "En Seguimiento";
    default:
      return estado;
  }
}

/**
 * Obtiene el color del badge según el estado
 * Retorna un objeto con backgroundColor y color para el Chip
 */
export function getEstadoColor(estado: string): { bg: string; text: string } {
  switch (estado) {
    case "en_proceso":
      return { bg: "#dbeafe", text: "#1d4ed8" };
    case "entregado":
      return { bg: "#d1fae5", text: "#34a853" };
    case "en_seguimiento":
      return { bg: "#fef3c7", text: "#d97706" };
    default:
      return { bg: "#f3f4f6", text: "#6b7280" };
  }
}
