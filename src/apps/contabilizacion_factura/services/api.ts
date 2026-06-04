import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, createItem, updateItem } from "@directus/sdk";

/**
 * Interface for accounting vendor record (acc_accounting_vendors)
 */
interface ProveedorContabilidad {
    id?: number;
    nit: string;
    automatic: string;
    name?: string;
    // ── Orphans (no existen en acc_accounting_vendors, conservados en TS) ──
    numero_factura?: string;
    valor_factura?: number;
}

/**
 * Verifica si un NIT existe en la tabla acc_accounting_vendors
 * @param nit El NIT a verificar
 * @returns true si existe, false si no
 */
export async function checkNitExists(nit: string): Promise<boolean> {
    if (!nit) return false;

    try {
        const items = await withAutoRefresh(() =>
            directus.request(
                readItems("acc_accounting_vendors", {
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
export async function getAutomaticByNit(nit: string): Promise<ProveedorContabilidad | null> {
    if (!nit) return null;

    try {
        const items = await withAutoRefresh(() =>
            directus.request(
                readItems("acc_accounting_vendors", {
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
export async function getProviderByNameAndNit(
    nit: string,
    nombre: string
): Promise<ProveedorContabilidad | null> {
    if (!nit || !nombre) return null;

    try {
        const nitString = String(nit).trim();
        const nombreString = String(nombre).trim();

        const items = await withAutoRefresh(() =>
            directus.request(
                readItems("acc_accounting_vendors", {
                    filter: {
                        _and: [
                            {
                                nit: {
                                    _eq: nitString,
                                },
                            },
                            {
                                name: {
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
 * @param numeroFactura (no se persiste — no existe en acc_accounting_vendors)
 * @param valorFactura  (no se persiste — no existe en acc_accounting_vendors)
 * @returns El item creado
 */
export async function saveNitAutomatic(
    nit: string,
    automatico: string,
    nombreProveedor?: string,
    _numeroFactura?: string,
    _valorFactura?: number
) {
    try {
        const dataToSend = {
            nit:       String(nit).trim(),
            automatic: String(automatico).trim(),
            name:      nombreProveedor ? String(nombreProveedor).trim() : undefined,
        };

        const item = await withAutoRefresh(() =>
            directus.request(
                createItem("acc_accounting_vendors", dataToSend)
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
 * @param data Los datos a actualizar (claves de acc_accounting_vendors)
 * @returns El item actualizado
 */
export async function updateAccountingProvider(id: number, data: Partial<ProveedorContabilidad>) {
    try {
        const item = await withAutoRefresh(() =>
            directus.request(
                updateItem("acc_accounting_vendors", id, data),
            ),
        );

        return item;
    } catch (error) {
        console.error("Error al actualizar proveedor:", error);
        throw error;
    }
}

/**
 * Interface para proveedor de la tabla acc_suppliers
 */
export interface AccSupplier {
    id: number;
    date_created?: string;
    nit: string;
    name?: string;
    internal_code?: string;
}

/**
 * Interface para entrada de mercancía de la tabla acc_goods_receipts
 */
export interface AccGoodsReceipt {
    id: number;
    date_created?: string;
    supplier_id: number;
    document_number: string;
    quantity?: number;
    total_cost?: number;
    date?: string;
    status: string;
}

/**
 * Obtiene un proveedor de la tabla acc_suppliers por su NIT (sin dv)
 * @param nit El NIT limpio (sin dv)
 * @returns El proveedor o null si no se encuentra
 */
export async function getSupplierByNit(nit: string): Promise<AccSupplier | null> {
    if (!nit) return null;

    try {
        const items = await withAutoRefresh(() =>
            directus.request(
                readItems("acc_suppliers", {
                    filter: {
                        nit: {
                            _eq: String(nit).trim(),
                        },
                    },
                    limit: 1,
                })
            )
        );

        if (items && items.length > 0) {
            return items[0] as unknown as AccSupplier;
        }
        return null;
    } catch (error) {
        console.error("Error al obtener supplier por NIT:", error);
        return null;
    }
}

/**
 * Obtiene todas las entradas de mercancía de un proveedor con status 'Habilitado'
 * @param supplierId El ID del proveedor en acc_suppliers
 * @returns Listado de entradas de mercancía habilitadas
 */
export async function getGoodsReceiptsBySupplierId(
    supplierId: number | string
): Promise<AccGoodsReceipt[]> {
    if (!supplierId) return [];

    try {
        const items = await withAutoRefresh(() =>
            directus.request(
                readItems("acc_goods_receipts", {
                    filter: {
                        _and: [
                            {
                                supplier_id: {
                                    _eq: Number(supplierId),
                                },
                            },
                            {
                                status: {
                                    _eq: "Habilitado",
                                },
                            },
                        ],
                    },
                })
            )
        );

        return (items || []) as unknown as AccGoodsReceipt[];
    } catch (error) {
        console.error("Error al obtener entradas de mercancía por supplierId:", error);
        return [];
    }
}

