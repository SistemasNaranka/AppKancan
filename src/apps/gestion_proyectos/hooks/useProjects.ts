import { useState, useEffect, useCallback } from "react";
import type { Project, Process, ProjectMetrics } from "../types";
import { getProjects, getProjectById } from "../api/directus/read";
import { calculateProjectMetrics } from "../lib/calculos";

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

interface UseProjectByIdReturn {
  project: Project | null;
  metrics: ProjectMetrics;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Hook to get all projects
 */
export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error("Error loading projects:", err);
      setError("Error al cargar los proyectos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { projects, loading, error, reload };
}

/**
 * Hook to get a project by ID
 */
export function useProjectById(id: string): UseProjectByIdReturn {
  const [project, setProject] = useState<Project | null>(null);
  const [metrics, setMetrics] = useState<ProjectMetrics>({
    total_processes: 0,
    total_monthly_savings: 0,
    total_yearly_savings: 0,
    processes_metrics: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getProjectById(id);
      if (data) {
        setProject(data);
        // Calculate metrics
        if (data.processes && data.processes.length > 0) {
          setMetrics(calculateProjectMetrics(data.processes));
        }
      } else {
        setError("Proyecto no encontrado");
      }
    } catch (err) {
      console.error("Error loading project:", err);
      setError("Error al cargar el proyecto");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { project, metrics, loading, error, reload };
}

/**
 * Gets the project status in a readable format
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case "en_proceso":
      return "En Proceso";
    case "entregado":
      return "Entregado";
    case "en_seguimiento":
      return "En Seguimiento";
    default:
      return status;
  }
}

/**
 * Gets the badge color according to the status
 */
export function getStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
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
