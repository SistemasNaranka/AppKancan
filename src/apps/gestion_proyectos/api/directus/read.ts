import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, readItem } from "@directus/sdk";
import type { Proyecto, Proceso, Beneficio } from "../../types";

/**
 * Obtiene todos los proyectos
 */
export async function getProyectos(): Promise<Proyecto[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("gp_proyectos", {
          fields: [
            "id",
            "nombre",
            "area_beneficiada",
            "descripcion",
            "encargados",
            "fecha_inicio",
            "fecha_estimada",
            "fecha_entrega",
            "estado",
            "tipo_proyecto",
          ],
          sort: ["-fecha_inicio"],
        }),
      ),
    );

    return items.map((item: any) => ({
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
    }));
  } catch (error) {
    console.error("❌ Error al cargar proyectos:", error);
    return [];
  }
}

/**
 * Obtiene un proyecto por ID con sus procesos y beneficios
 */
export async function getProyectoById(id: string): Promise<Proyecto | null> {
  try {
    const proyecto = await withAutoRefresh(() =>
      directus.request(readItem("gp_proyectos", id)),
    );

    if (!proyecto) return null;

    // Cargar procesos relacionados
    const procesos = await withAutoRefresh(() =>
      directus.request(
        readItems("gp_proceso", {
          filter: {
            proyecto_id: { _eq: id },
          },
          sort: ["orden"],
        }),
      ),
    );

    // Cargar beneficios relacionados
    const beneficios = await withAutoRefresh(() =>
      directus.request(
        readItems("gp_beneficios", {
          filter: {
            proyecto_id: { _eq: id },
          },
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
        tiempo_antes: p.tiempo_antes,
        tiempo_despues: p.tiempo_despues,
        frecuencia_tipo: p.frecuencia_tipo,
        frecuencia_cantidad: p.frecuencia_cantidad,
        dias_semana: p.dias_semana,
        orden: p.orden,
      })),
      beneficios: beneficios.map((b: any) => ({
        id: b.id,
        proyecto_id: b.proyecto_id,
        descripcion: b.descripcion,
      })),
      // Alias para compatibilidad con PostLanzamiento
      mejoras: beneficios.map((b: any) => ({
        id: b.id,
        proyecto_id: b.proyecto_id,
        titulo: b.descripcion.substring(0, 50), // Usar primeros 50 chars como título
        descripcion: b.descripcion,
        tipo: "mejora_rendimiento",
        prioridad: "media",
        estado: "completado",
      })),
    };
  } catch (error) {
    console.error("❌ Error al cargar proyecto:", error);
    return null;
  }
}

/**
 * Obtiene los procesos de un proyecto
 */
export async function getProcesosByProyecto(
  proyectoId: string,
): Promise<Proceso[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("gp_proceso", {
          filter: {
            proyecto_id: { _eq: proyectoId },
          },
          sort: ["orden"],
        }),
      ),
    );

    return items.map((item: any) => ({
      id: item.id,
      proyecto_id: item.proyecto_id,
      nombre: item.nombre,
      tiempo_antes: item.tiempo_antes,
      tiempo_despues: item.tiempo_despues,
      frecuencia_tipo: item.frecuencia_tipo,
      frecuencia_cantidad: item.frecuencia_cantidad,
      dias_semana: item.dias_semana,
      orden: item.orden,
    }));
  } catch (error) {
    console.error("❌ Error al cargar procesos:", error);
    return [];
  }
}

/**
 * Obtiene los beneficios de un proyecto
 */
export async function getBeneficiosByProyecto(
  proyectoId: string,
): Promise<Beneficio[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("gp_beneficios", {
          filter: {
            proyecto_id: { _eq: proyectoId },
          },
        }),
      ),
    );

    return items.map((item: any) => ({
      id: item.id,
      proyecto_id: item.proyecto_id,
      descripcion: item.descripcion,
    }));
  } catch (error) {
    console.error("❌ Error al cargar beneficios:", error);
    return [];
  }
}
