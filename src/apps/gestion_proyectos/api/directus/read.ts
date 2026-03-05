import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, readItem } from "@directus/sdk";
import type { Proyecto, Proceso, Beneficio } from "../../types";

export async function getProyectos(): Promise<Proyecto[]> {
  try {
    // Primero obtenemos todos los proyectos
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

    // Ahora obtenemos todos los procesos
    const todosProcesos = await withAutoRefresh(() =>
      directus.request(
        readItems("gp_proceso", {
          fields: [
            "id",
            "proyecto_id",
            "nombre",
            "tiempo_antes",
            "tiempo_despues",
            "frecuencia_tipo",
            "frecuencia_cantidad",
            "dias_semana",
            "orden",
          ],
          sort: ["orden"],
        }),
      ),
    );

    // Mapeamos los proyectos y relacionamos los procesos
    return items.map((item: any) => {
      const procesosDelProyecto = (todosProcesos as any[])
        .filter((p: any) => p.proyecto_id === item.id)
        .map((p: any) => ({
          id: p.id,
          proyecto_id: p.proyecto_id,
          nombre: p.nombre,
          tiempo_antes: Number(p.tiempo_antes) || 0,
          tiempo_despues: Number(p.tiempo_despues) || 0,
          frecuencia_tipo: p.frecuencia_tipo,
          frecuencia_cantidad: Number(p.frecuencia_cantidad) || 1,
          dias_semana: Number(p.dias_semana) || 5,
          orden: p.orden,
        }));

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
        procesos: procesosDelProyecto,
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
        readItems("gp_proceso", {
          fields: [
            "id",
            "proyecto_id",
            "nombre",
            "tiempo_antes",
            "tiempo_despues",
            "frecuencia_tipo",
            "frecuencia_cantidad",
            "dias_semana",
            "orden",
          ],
          filter: { proyecto_id: { _eq: id } },
          sort: ["orden"],
        }),
      ),
    );

    const todosProcesos = await withAutoRefresh(() =>
      directus.request(
        readItems("gp_proceso", {
          fields: ["id", "proyecto_id"],
          limit: 5,
        }),
      ),
    );

    const beneficios = await withAutoRefresh(() =>
      directus.request(
        readItems("gp_beneficios", {
          fields: ["id", "proyecto_id", "descripcion"],
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

export async function getProcesosByProyecto(
  proyectoId: string,
): Promise<Proceso[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("gp_proceso", {
          fields: [
            "id",
            "proyecto_id",
            "nombre",
            "tiempo_antes",
            "tiempo_despues",
            "frecuencia_tipo",
            "frecuencia_cantidad",
            "dias_semana",
            "orden",
          ],
          filter: { proyecto_id: { _eq: proyectoId } },
          sort: ["orden"],
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

export async function getBeneficiosByProyecto(
  proyectoId: string,
): Promise<Beneficio[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("gp_beneficios", {
          fields: ["id", "proyecto_id", "descripcion"],
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
