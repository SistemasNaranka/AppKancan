import directus from "@/services/directus/directus";
import { hasStatusCode } from "@/shared/utils/hasStatus";
import {updateItem } from "@directus/sdk"; // o el helper que uses según tu setup


type Empresa = {
  id: string;
  nombre?: string;
  // otros campos opcionales que quieras actualizar
};

export async function updateEmpresas(id: string, datos: Partial<Empresa>) {
  try {
    const updated = await directus.request(
      updateItem("empresas", id, datos)
    ) as Empresa;

    return updated;
  } catch (error) {
    if (hasStatusCode(error) && error.response.status === 403) {
      console.warn(
        `⚠️ Usuario sin permisos para actualizar empresa con id ${id}. Continuando sin actualizar...`
      );
      return null; // o lanzar, según tu convención
    }

    console.error(`❌ Error actualizando empresa con id ${id}:`, error);
    throw error;
  }
}