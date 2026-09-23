// src/apps/ruleta/api/directus/write.ts
import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import {
  createItem,
  updateItem,
  deleteItem,
  readItems,
} from '@directus/sdk';
import { FacturaValida } from '../../page/RuletaHome';

// ============================================================
// 🎁 TIPOS
// ============================================================

export interface IPrizePayload {
  name: string;
  tier: 'G1' | 'G2' | 'G3';
  is_active?: boolean;
  // probability se maneja aparte (nullable en Directus, lo llena el backend)
  // color eliminado: no se persiste, se calcula por tier en el frontend
}

export interface IPrizeInventoryRow {
  id?: number;
  prize_id: number;
  store_code: string | number;
  total_assigned: number;
  // 🔑 Clave única compuesta (store_code-prize_id) — la genera el frontend
  inventory_key?: string;
}

// ============================================================
// 🔑 HELPER: Genera la clave única del inventario
// Formato: "{store_code}-{prize_id}" — evita duplicados en Directus
// ============================================================
const buildInventoryKey = (
  storeCode: string | number,
  prizeId: number
): string => `${String(storeCode).trim()}-${String(prizeId).trim()}`;

// ============================================================
// 🏷️ sal_prizes — CRUD del catálogo de premios
// ============================================================

export async function createPrize(data: IPrizePayload): Promise<number> {
  try {
    const created = await withAutoRefresh(() =>
      directus.request(
        createItem('sal_prizes', {
          name: data.name,
          tier: data.tier,
          is_active: data.is_active ?? true,
        })
      )
    );
    return (created as { id: number }).id;
  } catch (error) {
    console.error('❌ Error al crear premio:', error);
    throw error;
  }
}

export async function updatePrize(
  id: number,
  data: Partial<Pick<IPrizePayload, 'name' | 'tier'>>
): Promise<void> {
  try {
    await withAutoRefresh(() =>
      directus.request(updateItem('sal_prizes', id, data))
    );
  } catch (error) {
    console.error(`❌ Error al actualizar premio ${id}:`, error);
    throw error;
  }
}

/**
 * Soft delete: marca is_active = false.
 * NUNCA usar hard delete — sal_roulette_plays referencia el nombre del premio
 * en jugadas históricas.
 */
export async function deactivatePrize(id: number): Promise<void> {
  try {
    await withAutoRefresh(() =>
      directus.request(updateItem('sal_prizes', id, { is_active: false }))
    );
  } catch (error) {
    console.error(`❌ Error al desactivar premio ${id}:`, error);
    throw error;
  }
}

/**
 * Trae todos los premios (activos e inactivos) con su inventario relacionado.
 * El error se re-lanza para que el componente pueda mostrar estado de error
 * en vez de una lista vacía silenciosa.
 *
 * ⚠️ IMPORTANTE: se usa `limit: -1` en ambas consultas porque Directus
 * devuelve por defecto solo 100 registros. Sin esto, los registros que
 * caigan más allá del #100 (ej: 112 filas) son invisibles para el frontend,
 * causando que las últimas tiendas configuradas aparezcan siempre en 0.
 */
export async function getPrizesWithInventory() {
  const prizes = await withAutoRefresh(() =>
    directus.request(
      readItems('sal_prizes', {
        fields: ['id', 'name', 'tier', 'is_active', 'probability'],
        sort: ['tier', 'name'],
        limit: -1, // 👈 Trae TODOS los premios (sin límite de 100)
      })
    )
  );

  const inventory = await withAutoRefresh(() =>
    directus.request(
      readItems('sal_prize_inventory', {
        fields: ['id', 'prize_id', 'store_code', 'total_assigned'],
        limit: -1, // 👈 Trae TODOS los registros de inventario (sin límite de 100)
      })
    )
  );

  // Jugadas = entregas. Cada fila es un premio entregado; contarlas da el "entregado".
  // Con el SDK (autenticado) para que no llegue vacío como con el fetch anónimo.
  const plays = await withAutoRefresh(() =>
    directus.request(
      readItems('sal_roulette_plays', {
        fields: ['store_code', 'prize'],
        limit: -1,
      })
    )
  );

  return { prizes, inventory, plays } as {
    prizes: Array<{
      id: number;
      name: string;
      tier: 'G1' | 'G2' | 'G3';
      is_active: boolean;
      probability: number | null;
    }>;
    inventory: IPrizeInventoryRow[];
    plays: Array<{ store_code: string | number; prize: string }>;
  };
}

// ============================================================
// 📦 sal_prize_inventory — cupo por premio + tienda
// ============================================================

export async function upsertInventory(
  row: IPrizeInventoryRow
): Promise<void> {
  try {
    // 🔑 Siempre generamos el inventory_key
    const inventoryKey =
      row.inventory_key ?? buildInventoryKey(row.store_code, row.prize_id);

    if (row.id) {
      // Update — enviamos inventory_key por si acaso cambió
      // (en la práctica no cambia porque store_code y prize_id son inmutables)
      await withAutoRefresh(() =>
        directus.request(
          updateItem('sal_prize_inventory', row.id as number, {
            total_assigned: row.total_assigned,
            inventory_key: inventoryKey,
          })
        )
      );
    } else {
      // Create — inventory_key es obligatorio en Directus
      await withAutoRefresh(() =>
        directus.request(
          createItem('sal_prize_inventory', {
            prize_id: row.prize_id,
            store_code: row.store_code,
            total_assigned: row.total_assigned,
            inventory_key: inventoryKey, // 👈 ESTE CAMPO ES OBLIGATORIO
          })
        )
      );
    }
  } catch (error) {
    console.error('❌ Error en upsert de inventario:', error);
    throw error;
  }
}

export async function deleteInventory(id: number): Promise<void> {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItem('sal_prize_inventory', id))
    );
  } catch (error) {
    console.error(`❌ Error al eliminar fila de inventario ${id}:`, error);
    throw error;
  }
}

export async function createGiroRecord(factura: FacturaValida){
try {
  const invoiceKey = `${factura.bodega}-${factura.documentos}`;

  await withAutoRefresh(() => directus.request(createItem('sal_roulette_plays', {
        invoice_key: invoiceKey,
      document_number: factura.documentos,
      store_code: factura.bodega,
      prize: factura.prize  ,
  }

  )))
} catch (error) {
  throw error;

}
}