import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, readItem } from "@directus/sdk";
import type { Project, Process, Benefit, Feedback } from "../../types";

export async function getProjects(): Promise<Project[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("sys_projects", {
          fields: [
            "id",
            "name",
            "benefited_area",
            "description",
            "assignees",
            "start_date",
            "estimated_date",
            "delivery_date",
            "status",
            "project_type",
            "date_created",
          ],
          sort: ["-start_date"],
        }),
      ),
    );

    if (!items || items.length === 0) {
      return [];
    }

    const todosProcesos = await withAutoRefresh(() =>
      directus.request(
        readItems("sys_processes", {
          fields: ["*"],
          sort: ["order"],
        }),
      ),
    );

    const todosBeneficios = await withAutoRefresh(() =>
      directus.request(
        readItems("sys_benefits", {
          fields: ["id", "project_id", "description"],
        }),
      ),
    );

    const procesosPorProyecto = new Map<number | string, any[]>();
    const beneficiosPorProyecto = new Map<number | string, any[]>();

    todosProcesos.forEach((p: any) => {
      const proyectoId = p.project_id;
      if (!procesosPorProyecto.has(proyectoId)) {
        procesosPorProyecto.set(proyectoId, []);
      }
      procesosPorProyecto.get(proyectoId)!.push(p);
    });

    todosBeneficios.forEach((b: any) => {
      const proyectoId = b.project_id;
      if (!beneficiosPorProyecto.has(proyectoId)) {
        beneficiosPorProyecto.set(proyectoId, []);
      }
      beneficiosPorProyecto.get(proyectoId)!.push(b);
    });

    return items.map((item: any) => {
      const proyectoId = item.id;
      const procesos = procesosPorProyecto.get(proyectoId) || [];
      const beneficios = beneficiosPorProyecto.get(proyectoId) || [];

      return {
        id: item.id,
        name: item.name,
        benefited_area: item.benefited_area,
        description: item.description || "",
        assignees: item.assignees || [],
        start_date: item.start_date,
        estimated_date: item.estimated_date,
        delivery_date: item.delivery_date,
        status: item.status,
        project_type: item.project_type,
        processes: procesos.map((p: any) => ({
          id: p.id,
          project_id: p.project_id ?? p.proyecto_id,
          name: p.name ?? p.nombre,
          time_before: Number(p.time_before ?? p.tiempo_antes) || 0,
          time_after: Number(p.time_after ?? p.tiempo_despues) || 0,
          frequency_type: p.frequency_type ?? p.frecuencia_tipo,
          frequency_quantity:
            Number(p.frequency_quantity ?? p.frecuencia_cantidad) || 1,
          weekdays: Number(p.weekdays ?? p.dias_semana) || 5,
          order: p.order ?? p.orden,
        })),
        benefits: beneficios.map((b: any) => ({
          id: b.id,
          project_id: b.project_id,
          description: b.description,
        })),
      };
    });
  } catch (error) {
    console.error("Error al cargar proyectos:", error);
    return [];
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const proyecto = await withAutoRefresh(() =>
      directus.request(readItem("sys_projects", id)),
    );

    if (!proyecto) return null;

    const procesos = await withAutoRefresh(() =>
      directus.request(
        readItems("sys_processes", {
          fields: ["*"],
          filter: { project_id: { _eq: id } },
          sort: ["order"],
        }),
      ),
    );

    const beneficios = await withAutoRefresh(() =>
      directus.request(
        readItems("sys_benefits", {
          fields: ["id", "project_id", "description"],
          filter: { project_id: { _eq: id } },
        }),
      ),
    );

    const feedbacks = await withAutoRefresh(() =>
      directus.request(
        readItems("sys_feedback", {
          fields: ["id", "project_id", "author", "description", "date_created"],
          filter: { project_id: { _eq: id } },
        }),
      ),
    );

    return {
      id: proyecto.id,
      name: proyecto.name,
      benefited_area: proyecto.benefited_area,
      description: proyecto.description || "",
      assignees: proyecto.assignees || [],
      start_date: proyecto.start_date,
      estimated_date: proyecto.estimated_date,
      delivery_date: proyecto.delivery_date,
      status: proyecto.status,
      project_type: proyecto.project_type,
      created_by: proyecto.created_by,
      date_created: proyecto.date_created,
      processes: procesos.map((p: any) => ({
        id: p.id,
        project_id: p.project_id ?? p.proyecto_id,
        name: p.name ?? p.nombre,
        time_before: Number(p.time_before ?? p.tiempo_antes) || 0,
        time_after: Number(p.time_after ?? p.tiempo_despues) || 0,
        frequency_type: p.frequency_type ?? p.frecuencia_tipo,
        frequency_quantity:
          Number(p.frequency_quantity ?? p.frecuencia_cantidad) || 1,
        weekdays: Number(p.weekdays ?? p.dias_semana) || 5,
        order: p.order ?? p.orden,
      })),
      benefits: beneficios.map((b: any) => ({
        id: b.id,
        project_id: b.project_id,
        description: b.description,
      })),
      feedbacks: feedbacks.map((f: any) => ({
        id: f.id,
        project_id: f.project_id,
        author: f.author,
        description: f.description,
        date_created: f.date_created,
      })),
    };
  } catch (error) {
    console.error("Error al cargar proyecto:", error);
    return null;
  }
}

export async function getProcessesByProject(
  proyectoId: string,
): Promise<Process[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("sys_processes", {
          fields: ["*"],
          filter: { project_id: { _eq: proyectoId } },
          sort: ["order"],
        }),
      ),
    );

    return items.map((item: any) => ({
      id: item.id,
      project_id: item.project_id ?? item.proyecto_id,
      name: item.name ?? item.nombre,
      time_before: Number(item.time_before ?? item.tiempo_antes) || 0,
      time_after: Number(item.time_after ?? item.tiempo_despues) || 0,
      frequency_type: item.frequency_type ?? item.frecuencia_tipo,
      frequency_quantity:
        Number(item.frequency_quantity ?? item.frecuencia_cantidad) || 1,
      weekdays: Number(item.weekdays ?? item.dias_semana) || 5,
      order: item.order ?? item.orden,
    }));
  } catch (error) {
    console.error("Error al cargar procesos:", error);
    return [];
  }
}

export async function getBenefitsByProject(
  proyectoId: string,
): Promise<Benefit[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("sys_benefits", {
          fields: ["id", "project_id", "description"],
          filter: { project_id: { _eq: proyectoId } },
        }),
      ),
    );

    return items.map((item: any) => ({
      id: item.id,
      project_id: item.project_id,
      description: item.description,
    }));
  } catch (error) {
    console.error("Error al cargar beneficios:", error);
    return [];
  }
}
