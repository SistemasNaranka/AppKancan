import { directus } from "@/lib/directus";

/**
 * Funciones de creación para el módulo de Contabilización de Facturas
 */

// Ejemplo: Crear una nueva factura
export async function createFactura(data: any) {
    try {
        const response = await directus.items("facturas").createOne(data);
        return response;
    } catch (error) {
        console.error("Error al crear factura:", error);
        throw error;
    }
}

// Ejemplo: Actualizar una factura existente
export async function updateFactura(id: string, data: any) {
    try {
        const response = await directus.items("facturas").updateOne(id, data);
        return response;
    } catch (error) {
        console.error(`Error al actualizar factura ${id}:`, error);
        throw error;
    }
}

// Ejemplo: Eliminar una factura
export async function deleteFactura(id: string) {
    try {
        await directus.items("facturas").deleteOne(id);
        return true;
    } catch (error) {
        console.error(`Error al eliminar factura ${id}:`, error);
        throw error;
    }
}
