// src/apps/empresas/api/directus/deleteEmpresa.ts
import directus from "@/services/directus/directus";
import { deleteItem } from "@directus/sdk";

export async function deleteEmpresas(id: string) {
  try {
    await directus.request(deleteItem("empresas", id));
    console.log(`✅ Empresa con id ${id} eliminada`);
  } catch (error) {
    console.error(`❌ Error eliminando empresa con id ${id}:`, error);
    throw error;
  }
}