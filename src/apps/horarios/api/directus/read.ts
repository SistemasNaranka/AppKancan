import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems } from "@directus/sdk";
import { EmpleadoAsistencia, TipoNovedad } from "../../interfaces/horarios.interface";



export async function getEmpleados(storeId: number): Promise<EmpleadoAsistencia[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_employees", {
        
          fields: ["id", "first_name", "last_name", "store_id"],
        })
      )
    );

    return (items || []).map((emp: any) => ({
      id: String(emp.id),
      documento: String(emp.id), 
      nombre: `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "Empleado Sin Nombre",
      estadoActual: "entrada_pendiente",
      registros: {
        inicioJornada: null,
        inicioAlmuerzo: null,
        finAlmuerzo: null,
        finJornada: null,
        observaciones: {},
      },
    }));
  } catch (error) {
    console.error("❌ Error cargando la tabla adm_employees:", error);
    return [];
  }
}

export async function getTiposNovedad(): Promise<TipoNovedad[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("com_newness", {
          fields: ["id", "name"],
       
        })
      )
    );
    return (items || []).map((t: any) => ({
      id: t.id, 
      nombre: t.name,
      name: t.name,
    }));
  } catch (error) {
    console.error("❌ Error cargando com_newness:", error);
    return [];
  }
}

export async function getNovedades(): Promise<any[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("com_newness_reports", {
          fields: [
            "id",
            "date_created",
            "observations", 
            "newness_id.id",
            "newness_id.name",
            "employee_id.id",
            "employee_id.first_name",
            "employee_id.last_name"
          ],
          sort: ["-id"], 
        })
      )
    );
    return items || [];
  } catch (error) {
    console.error("❌ Error cargando la tabla com_newness_reports:", error);
    return [];
  }
}