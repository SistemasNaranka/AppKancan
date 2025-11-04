import directus from "@/services/directus/directus";
import { readItems } from "@directus/sdk";
import { Promotion, PromotionType } from "../../types/promotion";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
// ==================== INTERFACES ====================

export interface DirectusPromo {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_final: string | null;
  hora_inicio: string;
  hora_fin: string | null;
  descuento: number;
  tipo_id: number | DirectusPromoTipo;
}

export interface DirectusPromoTipo {
  id: number;
  nombre: string;
  duracion: "temporal" | "fija";
  color: string;
}

export interface DirectusPromoTienda {
  id: number;
  tiendas_id: number | DirectusTienda;
  promo_id: number | DirectusPromo;
  estado: string;
}

export interface DirectusTienda {
  id: number;
  nombre: string;
  codigo_ultra: number;
  empresa: string;
}
function formatearHoraDisplay(hora: string | null | undefined): string | null {
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
export async function obtenerTiendas(): Promise<DirectusTienda[]> {
  try {
    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("util_tiendas", {
          fields: ["id", "nombre", "codigo_ultra", "empresa"],
          sort: ["nombre"],
        })
      )
    );

    return data as DirectusTienda[];
  } catch (error) {
    console.error("❌ Error al obtener tiendas:", error);
    throw error;
  }
}

/**
 * Obtener todos los tipos de promoción
 */
export async function obtenerTiposPromocion(): Promise<DirectusPromoTipo[]> {
  try {
    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("promo_tipo", {
          fields: ["id", "nombre", "duracion", "color"],
          sort: ["nombre"],
        })
      )
    );

    return data as DirectusPromoTipo[];
  } catch (error) {
    console.error("❌ Error al obtener tipos de promoción:", error);
    throw error;
  }
}

/**
 * Obtener todas las promociones con sus relaciones
 */
export async function obtenerPromociones(): Promise<Promotion[]> {
  try {
    // 1. Obtener todas las promociones con el tipo expandido
    const promos = await withAutoRefresh(() =>
      directus.request(
        readItems("promo", {
          fields: [
            "id",
            "nombre",
            "fecha_inicio",
            "fecha_final",
            "hora_inicio",
            "hora_fin",
            "descuento",
            "tipo_id.id",
            "tipo_id.nombre",
            "tipo_id.duracion",
            "tipo_id.color",
          ],
          sort: ["-fecha_inicio"],
        })
      )
    );

    // 2. Obtener todas las relaciones promo-tiendas
    const promoTiendas = await directus.request(
      readItems("promo_tiendas", {
        fields: [
          "id",
          "promo_id",
          "estado",
          "tiendas_id.id",
          "tiendas_id.nombre",
        ],
        filter: {
          estado: {
            _eq: "Activo",
          },
        },
      })
    );

    // 3. Crear un mapa de promo_id -> tiendas
    const tiendasPorPromo = new Map<number, string[]>();

    promoTiendas.forEach((pt: any) => {
      const promoId =
        typeof pt.promo_id === "number" ? pt.promo_id : pt.promo_id?.id;
      const tiendaNombre = pt.tiendas_id?.nombre || "Sin nombre";

      if (!tiendasPorPromo.has(promoId)) {
        tiendasPorPromo.set(promoId, []);
      }
      tiendasPorPromo.get(promoId)?.push(tiendaNombre);
    });

    // 4. Mapear a formato de Promotion
    const promociones: Promotion[] = promos.map((promo: any) => {
      const tipo = promo.tipo_id;
      const tiendas = tiendasPorPromo.get(promo.id) || [];

      return {
        id: promo.id,
        tipo: tipo?.nombre as PromotionType,
        descripcion: promo.nombre,
        tiendas: tiendas,
        fecha_inicio: promo.fecha_inicio,
        fecha_final: promo.fecha_final,
        hora_inicio: formatearHoraDisplay(promo.hora_inicio) || "",
        hora_fin: formatearHoraDisplay(promo.hora_fin),
        descuento: promo.descuento,
        duracion: tipo?.duracion || "temporal",
        color: tipo?.color || "#888", // 👈 nuevo campo
      };
    });

    return promociones;
  } catch (error) {
    console.error("❌ Error al obtener promociones:", error);
    throw error;
  }
}

/**
 * Obtener una promoción por ID con sus relaciones
 */
export async function obtenerPromocionPorId(
  id: number
): Promise<Promotion | null> {
  try {
    // 1. Obtener la promoción con el tipo expandido
    const promo = await withAutoRefresh(() =>
      directus.request(
        readItems("promo", {
          fields: [
            "id",
            "nombre",
            "fecha_inicio",
            "fecha_final",
            "hora_inicio",
            "hora_fin",
            "descuento",
            "tipo_id.id",
            "tipo_id.nombre",
            "tipo_id.duracion",
            "tipo_id.color",
          ],
          filter: {
            id: {
              _eq: id,
            },
          },
          limit: 1,
        })
      )
    );

    if (!promo || promo.length === 0) {
      return null;
    }

    const promoData = promo[0] as any;

    // 2. Obtener las tiendas asociadas
    const promoTiendas = await withAutoRefresh(() =>
      directus.request(
        readItems("promo_tiendas", {
          fields: ["tiendas_id.id", "tiendas_id.nombre"],
          filter: {
            promo_id: {
              _eq: id,
            },
            estado: {
              _eq: "Activo",
            },
          },
        })
      )
    );

    const tiendas = promoTiendas.map(
      (pt: any) => pt.tiendas_id?.nombre || "Sin nombre"
    );
    const tipo = promoData.tipo_id;

    return {
      id: promoData.id,
      tipo: tipo?.nombre as PromotionType,
      descripcion: promoData.nombre,
      tiendas: tiendas,
      fecha_inicio: promoData.fecha_inicio,
      fecha_final: promoData.fecha_final,
      hora_inicio: formatearHoraDisplay(promoData.hora_inicio) || "",
      hora_fin: formatearHoraDisplay(promoData.hora_fin),
      descuento: promoData.descuento,
      duracion: tipo?.duracion || "temporal",
      color: tipo?.color || "#888",
    };
  } catch (error) {
    console.error("❌ Error al obtener promoción por ID:", error);
    throw error;
  }
}

/**
 * Obtener tiendas asociadas a una promoción específica
 */
export async function obtenerTiendasDePromocion(
  promoId: number
): Promise<DirectusTienda[]> {
  try {
    const promoTiendas = await directus.request(
      readItems("promo_tiendas", {
        fields: [
          "tiendas_id.id",
          "tiendas_id.nombre",
          "tiendas_id.codigo_ultra",
          "tiendas_id.empresa",
        ],
        filter: {
          promo_id: {
            _eq: promoId,
          },
          estado: {
            _eq: "Activo",
          },
        },
      })
    );

    return promoTiendas.map((pt: any) => pt.tiendas_id) as DirectusTienda[];
  } catch (error) {
    console.error("❌ Error al obtener tiendas de la promoción:", error);
    throw error;
  }
}
