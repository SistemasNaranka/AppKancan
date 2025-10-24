import directus from "@/services/directus/directus";
import { createItem, createItems } from "@directus/sdk";
import { withAutoRefresh, ensureValidToken } from "@/auth/services/directusInterceptor";
// Tipos para la creación de promociones
export interface CreatePromocionData {
  nombre: string;
  fecha_inicio: string;
  fecha_final?: string | null;
  hora_inicio: string;
  hora_fin?: string | null;
  descuento: number;
  tipo_id: number;
}

export interface PromoTienda {
  tiendas_id: number | string;
  promo_id: number;
  estado: string;
}

/**
 * Formatear hora al formato esperado por Directus (HH:MM:SS)
 * Si la hora viene en formato HH:MM, agregar :00
 */
function formatearHora(hora: string | null | undefined): string | null {
  if (!hora) return null;
  
  // Si ya tiene formato HH:MM:SS, retornar tal cual
  if (hora.split(':').length === 3) {
    return hora;
  }
  
  // Si tiene formato HH:MM, agregar :00
  if (hora.split(':').length === 2) {
    return `${hora}:00`;
  }
  
  return hora;
}

/**
 * Crear una nueva promoción en Directus
 */
export async function crearPromocion(data: CreatePromocionData) {
  try {
    // Formatear los datos antes de enviar
    const dataFormateada = {
      nombre: data.nombre.trim(),
      fecha_inicio: data.fecha_inicio,
      fecha_final: data.fecha_final || null,
      hora_inicio: formatearHora(data.hora_inicio),
      hora_fin: formatearHora(data.hora_fin),
      descuento: Number(data.descuento),
      tipo_id: Number(data.tipo_id),
    };

    console.log("📤 Enviando datos a Directus:", dataFormateada);

    const result = await withAutoRefresh(()=> directus.request(
      createItem("promo", dataFormateada)
    ))
    
    console.log("✅ Promoción creada exitosamente:", result);
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
export async function asociarTiendasPromocion(
  promoId: number,
  tiendasIds: (number | string)[]
) {

  await ensureValidToken()



  try {
    const promoTiendas: PromoTienda[] = tiendasIds.map((tiendaId) => ({
      tiendas_id: Number(tiendaId),
      promo_id: Number(promoId),
      estado: "Activo",
    }));

    console.log("📤 Asociando tiendas a la promoción:", {
      promoId,
      cantidadTiendas: promoTiendas.length,
      tiendas: promoTiendas
    });

    const result = await directus.request(
      createItems("promo_tiendas", promoTiendas)
    );
    
    console.log("✅ Tiendas asociadas exitosamente:", result);
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
 * Interfaz para los parámetros de crearPromocionCompleta
 */
export interface CrearPromocionCompletaParams {
  promocionData: CreatePromocionData;
  tiendasIds: (number | string)[];
}

/**
 * Crear promoción completa (promoción + asociaciones de tiendas)
 */
export async function crearPromocionCompleta(
  params: CrearPromocionCompletaParams
) {
  try {
    console.log("🚀 Iniciando creación de promoción completa");
    console.log("Datos de promoción:", params.promocionData);
    console.log("IDs de tiendas:", params.tiendasIds);

    // 1. Crear la promoción
    const promocion = await crearPromocion(params.promocionData);
    
    if (!promocion || !promocion.id) {
      throw new Error("No se pudo crear la promoción - ID no recibido");
    }

    // 2. Asociar tiendas si hay alguna seleccionada
    if (params.tiendasIds.length > 0) {
      await asociarTiendasPromocion(promocion.id, params.tiendasIds);
    }

    console.log("✅ Promoción completa creada con éxito");
    return promocion;
  } catch (error: any) {
    console.error("❌ Error al crear promoción completa:", error);
    
    // Proporcionar un mensaje de error más útil
    if (error?.message) {
      throw new Error(`Error al crear promoción: ${error.message}`);
    }
    
    throw error;
  }
}