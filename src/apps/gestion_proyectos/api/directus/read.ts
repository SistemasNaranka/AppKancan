import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, readItem } from "@directus/sdk";
import type { Proyecto, Proceso, Beneficio } from "../../types";

export async function getProjects(): Promise<Proyecto[]> {
  try {
    // Primero obtenemos todos los proyectos (sin procesos relacionados para evitar problemas de relación)
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("Sys_Projects", {
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
          ],
          sort: ["-start_date"],
        }),
      ),
    );
    // Si no hay proyectos, retornar array vacío
    if (!items || items.length === 0) {
      return [];
    }

    // Obtener TODOS los procesos de una vez
    const todosProcesos = await withAutoRefresh(() =>
      directus.request(
        readItems("Sys_Processes", {
          fields: [
            "id",
            "project_id",
            "name",
            "time_before",
            "time_after",
            "frequency_type",
            "frequency_quantity",
            "weekdays",
            "order",
          ],
          sort: ["order"],
        }),
      ),
    );

    // Obtener TODOS los beneficios de una vez
    const todosBeneficios = await withAutoRefresh(() =>
      directus.request(
        readItems("gp_beneficios", {
          fields: ["id", "proyecto_id", "descripcion"],
        }),
      ),
    );

    // Crear mapas para asociar procesos y beneficios a proyectos
    const procesosPorProyecto = new Map<number | string, any[]>();
    const beneficiosPorProyecto = new Map<number | string, any[]>();

    // Agrupar procesos por proyecto
    todosProcesos.forEach((p: any) => {
      const proyectoId = p.proyecto_id;
      if (!procesosPorProyecto.has(proyectoId)) {
        procesosPorProyecto.set(proyectoId, []);
      }
      procesosPorProyecto.get(proyectoId)!.push(p);
    });

    // Agrupar beneficios por proyecto
    todosBeneficios.forEach((b: any) => {
      const proyectoId = b.proyecto_id;
      if (!beneficiosPorProyecto.has(proyectoId)) {
        beneficiosPorProyecto.set(proyectoId, []);
      }
      beneficiosPorProyecto.get(proyectoId)!.push(b);
    });

    // Ahora mapear cada proyecto con sus procesos y beneficios
    return items.map((item: any) => {
      const proyectoId = item.id;
      const procesos = procesosPorProyecto.get(proyectoId) || [];
      const beneficios = beneficiosPorProyecto.get(proyectoId) || [];

      return {
        id: item.id,
        nombre: item.nombre,
        area_beneficiada: item.area_beneficiada,
        descripcion: item.descripcion || "",
        encargados: item.encargados || [],
        fecha_inicio: item.fecha_inicio,
        fecha_estimada: item.fecha_estimada,
        fecha_entrega: item.fecha_entrega,
        estado: item.estado,
        tipo_proyecto: item.tipo_proyecto,
        procesos: procesos.map((p: any) => ({
          id: p.id,
          proyecto_id: p.proyecto_id,
          nombre: p.nombre,
          tiempo_antes: Number(p.tiempo_antes) || 0,
          tiempo_despues: Number(p.tiempo_despues) || 0,
          frecuencia_tipo: p.frecuencia_tipo,
          frecuencia_cantidad: Number(p.frecuencia_cantidad) || 1,
          dias_semana: Number(p.dias_semana) || 5,
          orden: p.orden,
        })),
        beneficios: beneficios.map((b: any) => ({
          id: b.id,
          proyecto_id: b.proyecto_id,
          descripcion: b.descripcion,
        })),
      };
    });
  } catch (error) {
    console.error("Error al cargar proyectos:", error);
    return [];
  }
}

export async function getProyectoById(id: string): Promise<Proyecto | null> {
  try {
    const proyecto = await withAutoRefresh(() =>
      directus.request(readItem("gp_proyectos", id)),
    );

    if (!proyecto) return null;

    const procesos = await withAutoRefresh(() =>
      directus.request(
        readItems("Sys_Processes", {
          fields: [
             "id",
            "project_id",
            "name",
            "time_before",
            "time_after",
            "frequency_type",
            "frequency_quantity",
            "weekdays",
            "order",
          ],
          filter: { proyecto_id: { _eq: id } },
          sort: ["order"],
        }),
      ),
    );

    const beneficios = await withAutoRefresh(() =>
      directus.request(
        readItems("Sys_Benefits", {
          fields: ["id", "project_id", "description"],
          filter: { proyecto_id: { _eq: id } },
        }),
      ),
    );

    return {
      id: proyecto.id,
      nombre: proyecto.nombre,
      area_beneficiada: proyecto.area_beneficiada,
      descripcion: proyecto.descripcion || "",
      encargados: proyecto.encargados || [],
      fecha_inicio: proyecto.fecha_inicio,
      fecha_estimada: proyecto.fecha_estimada,
      fecha_entrega: proyecto.fecha_entrega,
      estado: proyecto.estado,
      tipo_proyecto: proyecto.tipo_proyecto,
      creado_por: proyecto.creado_por,
      fecha_creacion: proyecto.fecha_creacion,
      procesos: procesos.map((p: any) => ({
        id: p.id,
        proyecto_id: p.proyecto_id,
        nombre: p.nombre,
        tiempo_antes: Number(p.tiempo_antes) || 0,
        tiempo_despues: Number(p.tiempo_despues) || 0,
        frecuencia_tipo: p.frecuencia_tipo,
        frecuencia_cantidad: Number(p.frecuencia_cantidad) || 1,
        dias_semana: Number(p.dias_semana) || 5,
        orden: p.orden,
      })),
      beneficios: beneficios.map((b: any) => ({
        id: b.id,
        proyecto_id: b.proyecto_id,
        descripcion: b.descripcion,
      })),
      mejoras: beneficios.map((b: any) => ({
        id: b.id,
        proyecto_id: b.proyecto_id,
        titulo: b.descripcion.substring(0, 50),
        descripcion: b.descripcion,
        tipo: "mejora_rendimiento",
        prioridad: "media",
        estado: "completado",
      })),
    };
  } catch (error) {
    console.error("Error al cargar proyecto:", error);
    return null;
  }
}

export async function getProjectById(
  proyectoId: string,
): Promise<Proceso[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("Sys_Processes", {
          fields: [
            "id",
            "project_id",
            "name",
            "time_before",
            "time_after",
            "frequency_type",
            "frequency_quantity",
            "weekdays",
            "order",
          ],
          filter: { proyecto_id: { _eq: proyectoId } },
          sort: ["order"],
        }),
      ),
    );

    return items.map((item: any) => ({
      id: item.id,
      proyecto_id: item.proyecto_id,
      nombre: item.nombre,
      tiempo_antes: Number(item.tiempo_antes) || 0,
      tiempo_despues: Number(item.tiempo_despues) || 0,
      frecuencia_tipo: item.frecuencia_tipo,
      frecuencia_cantidad: Number(item.frecuencia_cantidad) || 1,
      dias_semana: Number(item.dias_semana) || 5,
      orden: item.orden,
    }));
  } catch (error) {
    console.error("Error al cargar procesos:", error);
    return [];
  }
}

export async function getBenefitsByProject(
  proyectoId: string,
): Promise<Beneficio[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("Sys_Benefits", {
          fields: ["id", "id_project", "description"],
          filter: { proyecto_id: { _eq: proyectoId } },
        }),
      ),
    );

    return items.map((item: any) => ({
      id: item.id,
      proyecto_id: item.proyecto_id,
      descripcion: item.descripcion,
    }));
  } catch (error) {
    console.error("Error al cargar beneficios:", error);
    return [];
  }
}
