import directus from "@/services/directus/directus";
import { readItems } from "@directus/sdk";
import { Promotion, PromotionType } from "../../types/promotion";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
// ==================== INTERFACES ====================

export interface DirectusPromo {
  id: number;
  name: string;
  start_date: string;
  end_date: string | null;
  start_time: string;
  end_time: string | null;
  discount_value: number;
  type_id: number | DirectusPromoTipo;
  notes: string | null;
}

export interface DirectusPromoTipo {
  id: number;
  name: string;
  duration: "temporal" | "fija";
  color_code: string;
}

export interface DirectusPromoTienda {
  id: number;
  store_id: number | DirectusTienda;
  promotion_id: number | DirectusPromo;
  status: string;
}

export interface DirectusTienda {
  id: number;
  name: string;
  ultra_code: number;
  company: string;
}

function formatDisplayTime(hora: string | null | undefined): string | null {
  if (!hora) return null;

  // Si ya es HH:MM, retornar tal cual
  if (hora.length === 5 && hora.includes(":")) {
    return hora;
  }

  // Si es HH:MM:SS, quitar los segundos
  if (hora.length === 8 && hora.split(":").length === 3) {
    return hora.substring(0, 5);
  }

  // Caso inesperado
  console.warn(`⚠️ Formato de hora inesperado: ${hora}`);
  return hora;
}
// ==================== FUNCIONES DE LECTURA ====================

/**
 * Obtener todas las tiendas
 */
export async function getStores(): Promise<DirectusTienda[]> {
  try {
    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("core_stores", {
          fields: ["id", "name", "ultra_code", "company"],
          sort: ["name"],
        }),
      ),
    );

    return data as DirectusTienda[];
  } catch (error: any) {
    console.error("❌ Error al obtener tiendas:", error);
    if (error?.response) {
      console.error("Detalles del error (Response):", error.response);
    }
    if (error?.errors) {
      console.error("Errores específicos:", error.errors);
    }
    throw error;
  }
}

/**
 * Obtener todos los tipos de promoción
 */
export async function getPromotionTypes(): Promise<DirectusPromoTipo[]> {
  try {
    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("com_promotion_type", {
          fields: ["id", "name", "duration", "color_code"],
          sort: ["name"],
        }),
      ),
    );

    return data as DirectusPromoTipo[];
  } catch (error: any) {
    console.error("❌ Error al obtener tipos de promoción:", error);
    if (error?.response) {
      console.error("Detalles del error (Response):", error.response);
    }
    if (error?.errors) {
      console.error("Errores específicos:", error.errors);
    }
    throw error;
  }
}

/**
 * Obtener todas las promociones con sus relaciones
 */
export async function getPromotions(): Promise<Promotion[]> {
  try {
    // 1. Obtener todas las promociones con el tipo expandido
    const promos = await withAutoRefresh(() =>
      directus.request(
        readItems("com_promotion", {
          fields: [
            "id",
            "name",
            "start_date",
            "end_date",
            "start_time",
            "end_time",
            "discount_value",
            "notes",
            "type_id.id",
            "type_id.name",
            "type_id.duration",
            "type_id.color_code",
          ],
          sort: ["-start_date"],
        }),
      ),
    );

    // 2. Obtener todas las relaciones promo-tiendas
    const promoTiendas = await withAutoRefresh(() =>
      directus.request(
        readItems("com_promotion_stores", {
          fields: [
            "id",
            "promotion_id",
            "status",
            "store_id.id",
            "store_id.name",
          ],
          filter: {
            status: {
              _eq: "Activo",
            },
          },
          limit: -1, // Obtener todos los registros, no solo los primeros 100
        }),
      ),
    );

    // 3. Crear un mapa de promotion_id -> stores
    const tiendasPorPromo = new Map<number, string[]>();

    promoTiendas.forEach((pt: any) => {
      const promoId =
        typeof pt.promotion_id === "number"
          ? pt.promotion_id
          : pt.promotion_id?.id;
      const tiendaNombre = pt.store_id?.name || "Sin nombre";

      if (!tiendasPorPromo.has(promoId)) {
        tiendasPorPromo.set(promoId, []);
      }
      tiendasPorPromo.get(promoId)?.push(tiendaNombre);
    });

    // 4. Mapear a formato de Promotion
    const promociones: Promotion[] = promos.map((promo: any) => {
      const tipo = promo.type_id;
      const tiendas = tiendasPorPromo.get(promo.id) || [];

      return {
        id: promo.id,
        type: tipo?.name as string,
        name: promo.name,
        notes: promo.notes,
        stores: tiendas,
        start_date: promo.start_date,
        end_date: promo.end_date,
        start_time: formatDisplayTime(promo.start_time) || "",
        end_time: formatDisplayTime(promo.end_time),
        discount: promo.discount_value,
        duration: tipo?.duration || "temporal",
        color: tipo?.color_code || "#888",
      };
    });

    return promociones;
  } catch (error: any) {
    console.error("❌ Error al obtener promociones:", error);
    if (error?.response) {
      console.error("Detalles del error (Response):", error.response);
    }
    if (error?.errors) {
      console.error("Errores específicos:", error.errors);
    }
    throw error;
  }
}

/**
 * Obtener una promoción por ID con sus relaciones
 */
export async function getPromotionById(id: number): Promise<Promotion | null> {
  try {
    // 1. Obtener la promoción con el tipo expandido
    const promo = await withAutoRefresh(() =>
      directus.request(
        readItems("com_promotion", {
          fields: [
            "id",
            "name",
            "start_date",
            "end_date",
            "start_time",
            "end_time",
            "discount_value",
            "notes",
            "type_id.id",
            "type_id.name",
            "type_id.duration",
            "type_id.color_code",
          ],
          filter: {
            id: {
              _eq: id,
            },
          },
          limit: 1,
        }),
      ),
    );

    if (!promo || promo.length === 0) {
      return null;
    }

    const promoData = promo[0] as any;

    // 2. Obtener las tiendas asociadas
    const promoTiendas = await withAutoRefresh(() =>
      directus.request(
        readItems("com_promotion_stores", {
          fields: ["store_id.id", "store_id.name"],
          filter: {
            promotion_id: {
              _eq: id,
            },
            status: {
              _eq: "Activo",
            },
          },
          limit: -1, // Obtener todos los registros
        }),
      ),
    );

    const tiendas = promoTiendas.map(
      (pt: any) => pt.store_id?.name || "Sin nombre",
    );

    const tipo = promoData.type_id;

    return {
      id: promoData.id,
      type: tipo?.name as string,
      name: promoData.name,
      notes: promoData.notes,
      stores: tiendas,
      start_date: promoData.start_date,
      end_date: promoData.end_date,
      start_time: formatDisplayTime(promoData.start_time) || "",
      end_time: formatDisplayTime(promoData.end_time),
      discount: promoData.discount_value,
      duration: tipo?.duration || "temporal",
      color: tipo?.color_code || "#888",
    };
  } catch (error) {
    console.error("❌ Error al obtener promoción por ID:", error);
    throw error;
  }
}

/**
 * Obtener tiendas asociadas a una promoción específica
 */
export async function getPromotionStores(
  promoId: number,
): Promise<DirectusTienda[]> {
  try {
    const promoTiendas = await withAutoRefresh(() =>
      directus.request(
        readItems("com_promotion_stores", {
          fields: [
            "store_id.id",
            "store_id.name",
            "store_id.ultra_code",
            "store_id.company",
          ],
          filter: {
            promotion_id: {
              _eq: promoId,
            },
            status: {
              _eq: "Activo",
            },
          },
        }),
      ),
    );

    return promoTiendas.map((pt: any) => pt.store_id) as DirectusTienda[];
  } catch (error: any) {
    console.error("❌ Error al obtener tiendas de la promoción:", error);
    if (error?.response) {
      console.error("Detalles del error (Response):", error.response);
    }
    if (error?.errors) {
      console.error("Errores específicos:", error.errors);
    }
    throw error;
  }
}
