import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, createItem, updateItem, readItem } from "@directus/sdk";

interface ProveedorContabilidad {
    id?: number;
    nit: string;
    automatic: string;
    name?: string;
    numero_factura?: string;
    valor_factura?: number;
}

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

export interface AccSupplier {
    id: number;
    date_created?: string;
    nit: string;
    name?: string;
    internal_code?: string;
}

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

                        ],
                    },
                    limit: -1,
                })
            )
        );

        return (items || []) as unknown as AccGoodsReceipt[];
    } catch (error) {
        console.error("Error al obtener entradas de mercancía por supplierId:", error);
        return [];
    }
}

export async function updateGoodsReceiptStatus(id: number, status: string) {
    try {
        const item = await withAutoRefresh(() =>
            directus.request(
                updateItem("acc_goods_receipts", id, { status }),
            ),
        );

        return item;
    } catch (error) {
        console.error("Error al actualizar estado de entrada de mercancía:", error);
        throw error;
    }
}

export async function getGoodsReceiptById(id: number): Promise<AccGoodsReceipt | null> {
    try {
        const item = await withAutoRefresh(() =>
            directus.request(
                readItem("acc_goods_receipts", id),
            ),
        );
        return item as unknown as AccGoodsReceipt;
    } catch (error) {
        console.error("Error al obtener entrada de mercancía por ID:", error);
        return null;
    }
}



