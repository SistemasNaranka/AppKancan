import { directus } from "@/lib/directus";

/**
 * Funciones de lectura para el módulo de Contabilización de Facturas
 */

// Ejemplo: Leer facturas desde Directus
export async function getFacturas() {
    try {
        const response = await directus.items("facturas").readByQuery({
            fields: ["*"],
            sort: ["-fecha_creacion"],
        });
        return response.data || [];
    } catch (error) {
        console.error("Error al obtener facturas:", error);
        throw error;
    }
}

// Ejemplo: Leer una factura específica
export async function getFacturaById(id: string) {
    try {
        const response = await directus.items("facturas").readOne(id, {
            fields: ["*"],
        });
        return response;
    } catch (error) {
        console.error(`Error al obtener factura ${id}:`, error);
        throw error;
    }
}
