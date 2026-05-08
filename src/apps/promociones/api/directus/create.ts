import directus from "@/services/directus/directus";
import { createItem, createItems } from "@directus/sdk";
import {
  withAutoRefresh,
  ensureValidToken,
} from "@/auth/services/directusInterceptor";
// Tipos para la creación de promociones
export interface CreatePromocionData {
  name: string;
  start_date: string;
  end_date?: string | null;
  start_time: string;
  end_time?: string | null;
  discount_value: number;
  type_id: number;
  notes?: string | null;
}

export interface PromoTienda {
  store_id: number | string;
  promotion_id: number;
  status: string;
}


/**
 * Formatear hora al formato esperado por Directus (HH:MM:SS)
 * Si la hora viene en formato HH:MM, agregar :00
 */
function format_time(hora: string | null | undefined): string | null {
  if (!hora) return null;

  // Si ya tiene formato HH:MM:SS, retornar tal cual
  if (hora.split(":").length === 3) {
    return hora;
  }

  // Si tiene formato HH:MM, agregar :00
  if (hora.split(":").length === 2) {
    return `${hora}:00`;
  }

  return hora;
}

/**
 * Crear una nueva promoción en Directus
 */
export async function createPromotion(data: CreatePromocionData) {
  try {
    // Formatear los datos antes de enviar
    const dataFormateada = {
      name: data.name.trim(),
      start_date: data.start_date,
      end_date: data.end_date || null,
      start_time: format_time(data.start_time),
      end_time: format_time(data.end_time),
      discount_value: Number(data.discount_value),
      type_id: Number(data.type_id),
      notes: data.notes || null,
    };

    const result = await withAutoRefresh(() =>
      directus.request(createItem("com_promotion", dataFormateada))
    );

    return result;

  } catch (error: any) {
    console.error("❌ Error al crear promoción:", error);

    // Mostrar detalles del error si están disponibles
    if (error?.errors) {
      console.error("Detalles del error:", error.errors);
    }

    throw error;
  }
}

/**
 * Asociar tiendas a una promoción
 */
export async function associateStoresPromotion(
  promoId: number,
  tiendasIds: (number | string)[]
) {
  await ensureValidToken();

  try {
    const promoTiendas: PromoTienda[] = tiendasIds.map((tiendaId) => ({
      store_id: Number(tiendaId),
      promotion_id: Number(promoId),
      status: "Activo",
    }));

    const result = await withAutoRefresh(() =>
      directus.request(createItems("com_promotion_stores", promoTiendas))
    );

    return result;

  } catch (error: any) {
    console.error("❌ Error al asociar tiendas:", error);

    if (error?.errors) {
      console.error("Detalles del error:", error.errors);
    }

    throw error;
  }
}

/**
 * Interfaz para los parámetros de createCompletePromotion
 */
export interface CrearPromocionCompletaParams {
  promocionData: CreatePromocionData;
  tiendasIds: (number | string)[];
}

/**
 * Crear promoción completa (promoción + asociaciones de tiendas)
 */
// En create.ts
export async function createCompletePromotion(
  params: CrearPromocionCompletaParams
) {
  let promocionCreada: any = null;

  try {
    // 1. Crear la promoción
    promocionCreada = await createPromotion(params.promocionData);

    if (!promocionCreada || !promocionCreada.id) {
      throw new Error("No se pudo crear la promoción - ID no recibido");
    }

    // 2. Asociar tiendas si hay alguna seleccionada
    if (params.tiendasIds.length > 0) {
      try {
        await associateStoresPromotion(promocionCreada.id, params.tiendasIds);
      } catch (tiendaError) {
        // Si falla la asociación, intentar eliminar la promoción creada
        console.error("❌ Error al asociar tiendas, revertiendo creación...");
        // TODO: Implementar eliminación de promoción
        throw new Error(
          "Error al asociar tiendas a la promoción. Por favor, intente nuevamente."
        );
      }
    }

    return promocionCreada;
  } catch (error: any) {
    console.error("❌ Error al crear promoción completa:", error);
    throw error;
  }
}
