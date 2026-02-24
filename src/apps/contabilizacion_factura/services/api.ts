import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, createItem, updateItem } from "@directus/sdk";

/**
 * Interface for proveedor contabilidad record
 */
interface ProveedorContabilidad {
  id?: number;
  nit: string;
  automatico: string;
  nombre?: string;
  numero_factura?: string;
  valor_factura?: number;
}

/**
 * Verifica si un NIT existe en la tabla proveedores_contabilidad
 * @param nit El NIT a verificar
 * @returns true si existe, false si no
 */
export async function checkNitExists(nit: string): Promise<boolean> {
    if (!nit) return false;

    try {
        const items = await withAutoRefresh(() =>
            directus.request(
                readItems("proveedores_contabilidad", {
                    filter: {
                        nit: {
                            _eq: nit,
                        },
                    },
                    limit: 1,
                })
            )
        );

        return items && items.length > 0;
    } catch (error) {
        console.error("Error al verificar existencia de NIT:", error);
        return false;
    }
}

/**
 * Obtiene el automático asignado a un NIT específico
 * @param nit El NIT del proveedor
 * @returns El registro del proveedor si existe, null si no
 */
export async function getAutomaticoByNit(nit: string): Promise<ProveedorContabilidad | null> {
    if (!nit) return null;

    try {
        const items = await withAutoRefresh(() =>
            directus.request(
                readItems("proveedores_contabilidad", {
                    filter: {
                        nit: {
                            _eq: nit,
                        },
                    },
                    limit: 1,
                })
            )
        );

        if (items && items.length > 0) {
            return items[0] as ProveedorContabilidad;
        }
        return null;
    } catch (error) {
        console.error("Error al obtener automático por NIT:", error);
        return null;
    }
}

/**
 * Verifica si existe un proveedor que coincida tanto con el nombre como con el NIT
 * Utiliza comparación textual (string) para el NIT ya que puede contener guiones
 * @param nit El NIT del proveedor (ej: "12345678-9")
 * @param nombre El nombre del proveedor
 * @returns El registro del proveedor si existe coincidencia en ambos campos, null si no
 */
export async function getProveedorByNombreAndNit(
    nit: string, 
    nombre: string
): Promise<ProveedorContabilidad | null> {
    if (!nit || !nombre) return null;

    try {
        // Convertir a string explícitamente para comparación textual
        const nitString = String(nit).trim();
        const nombreString = String(nombre).trim();

        const items = await withAutoRefresh(() =>
            directus.request(
                readItems("proveedores_contabilidad", {
                    filter: {
                        _and: [
                            {
                                nit: {
                                    _eq: nitString,
                                },
                            },
                            {
                                nombre: {
                                    _icase: nombreString,
                                },
                            },
                        ],
                    },
                    limit: 1,
                })
            )
        );

        if (items && items.length > 0) {
            return items[0] as ProveedorContabilidad;
        }
        return null;
    } catch (error) {
        console.error("Error al verificar proveedor por nombre y NIT:", error);
        return null;
    }
}

/**
 * Guarda un nuevo proveedor con su NIT y el número automático
 * @param nit El NIT del proveedor
 * @param automatico El número automático asignado
 * @param nombreProveedor El nombre del proveedor (opcional)
 * @param numeroFactura El número de factura (opcional)
 * @param valorFactura El valor de la factura (opcional)
 * @returns El item creado
 */
export async function saveNitAutomatico(
    nit: string, 
    automatico: string,
    nombreProveedor?: string,
    numeroFactura?: string,
    valorFactura?: number
) {
    try {
        // Debug: Mostrar datos que se envían al servidor
        const dataToSend = {
            nit: String(nit).trim(),
            automatico: String(automatico).trim(),
            nombre: nombreProveedor ? String(nombreProveedor).trim() : undefined,
            numero_factura: numeroFactura,
            valor_factura: valorFactura,
        };
        console.log("Enviando a Directus:", dataToSend);

        const item = await withAutoRefresh(() =>
            directus.request(
                createItem("proveedores_contabilidad", dataToSend)
            )
        );

        return item;
    } catch (error) {
        console.error("Error al guardar NIT y automático:", error);
        throw error;
    }
}

/**
 * Actualiza el registro de un proveedor existente
 * @param id El ID del registro
 * @param data Los datos a actualizar
 * @returns El item actualizado
 */
export async function updateProveedorContabilidad(id: number, data: Partial<ProveedorContabilidad>) {
    try {
        const item = await withAutoRefresh(() =>
            directus.request(
                updateItem("proveedores_contabilidad", id, data),
            ),
        );

        return item;
    } catch (error) {
        console.error("Error al actualizar proveedor:", error);
        throw error;
    }
}
