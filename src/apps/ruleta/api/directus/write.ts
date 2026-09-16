// src/apps/ruleta/api/directus/write.ts
import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import {
  createItem,
  updateItem,
  deleteItem,
  readItems,
} from '@directus/sdk';

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
  store_code: string;
  total_assigned: number;
}

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
 */
export async function getPrizesWithInventory() {
  const prizes = await withAutoRefresh(() =>
    directus.request(
      readItems('sal_prizes', {
        fields: ['id', 'name', 'tier', 'is_active', 'probability'],
        sort: ['tier', 'name'],
      })
    )
  );

  const inventory = await withAutoRefresh(() =>
    directus.request(
      readItems('sal_prize_inventory', {
        fields: ['id', 'prize_id', 'store_code', 'total_assigned'],
      })
    )
  );

  return { prizes, inventory } as {
    prizes: Array<{
      id: number;
      name: string;
      tier: 'G1' | 'G2' | 'G3';
      is_active: boolean;
      probability: number | null;
    }>;
    inventory: IPrizeInventoryRow[];
  };
}

// ============================================================
// 📦 sal_prize_inventory — cupo por premio + tienda
// ============================================================

export async function upsertInventory(
  row: IPrizeInventoryRow
): Promise<void> {
  try {
    if (row.id) {
      await withAutoRefresh(() =>
        directus.request(
          updateItem('sal_prize_inventory', row.id as number, {
            total_assigned: row.total_assigned,
          })
        )
      );
    } else {
      await withAutoRefresh(() =>
        directus.request(
          createItem('sal_prize_inventory', {
            prize_id: row.prize_id,
            store_code: row.store_code,
            total_assigned: row.total_assigned,
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