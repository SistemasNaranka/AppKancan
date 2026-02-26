import { useState, useEffect, useCallback } from "react";
import type { Proyecto, Proceso, Mejora, MetricasProyecto } from "../types";
import { getProyectos, getProyectoById } from "../api/directus/read";
import { calcularMetricasProyecto } from "../lib/calculos";

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
export function useProyectos(): UseProyectosReturn {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProyectos();
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
export function useProyectoById(id: string): UseProyectoByIdReturn {
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
          setMetricas(calcularMetricasProyecto(data.procesos));
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
    case "planning":
      return "Planning";
    case "en_progreso":
      return "En Progreso";
    case "completado":
      return "Completado";
    default:
      return estado;
  }
}

/**
 * Obtiene el color del badge según el estado
 */
export function getEstadoColor(estado: string): string {
  switch (estado) {
    case "planning":
      return "bg-yellow-100 text-yellow-800";
    case "en_progreso":
      return "bg-blue-100 text-blue-800";
    case "completado":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
