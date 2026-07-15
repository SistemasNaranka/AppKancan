import directus from "@/services/directus/directus";
import { createItem, createItems } from "@directus/sdk";
import {
  withAutoRefresh,
  ensureValidToken,
} from "@/auth/services/directusInterceptor";

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

function format_time(hora: string | null | undefined): string | null {
  if (!hora) return null;

  if (hora.split(":").length === 3) {
    return hora;
  }

  if (hora.split(":").length === 2) {
    return `${hora}:00`;
  }

  return hora;
}

export async function createPromotion(data: CreatePromocionData) {
  try {
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

    if (error?.errors) {
      console.error("Detalles del error:", error.errors);
    }

    throw error;
  }
}

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

export interface CrearPromocionCompletaParams {
  promocionData: CreatePromocionData;
  tiendasIds: (number | string)[];
}

export async function createCompletePromotion(
  params: CrearPromocionCompletaParams
) {
  let promocionCreada: any = null;

  try {
    promocionCreada = await createPromotion(params.promocionData);

    if (!promocionCreada || !promocionCreada.id) {
      throw new Error("No se pudo crear la promoción - ID no recibido");
    }

    if (params.tiendasIds.length > 0) {
      try {
        await associateStoresPromotion(promocionCreada.id, params.tiendasIds);
      } catch (tiendaError) {
        console.error("❌ Error al asociar tiendas, revertiendo creación...");
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

