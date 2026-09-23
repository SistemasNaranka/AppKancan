// src/apps/ruleta/api/directus/write.ts
import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import {
  createItem,
  updateItem,
  deleteItem,
  readItems,
  readItem,
} from '@directus/sdk';
import { FacturaValida } from '../../page/RuletaHome';

// ============================================================
// 🎁 TIPOS
// ============================================================

export interface IPrizePayload {
  name: string;
  tier: 'G1' | 'G2' | 'G3';
  is_active?: boolean;
}

export interface IPrizeInventoryRow {
  id?: number;
  prize_id: number;
  store_code: string | number;
  total_assigned: number;
  available?: number | null;      // 🆕 campo nuevo
  inventory_key?: string;
}

// ============================================================
// 🔑 HELPER: Clave única del inventario
// ============================================================
const buildInventoryKey = (
  storeCode: string | number,
  prizeId: number
): string => `${String(storeCode).trim()}-${String(prizeId).trim()}`;

// ============================================================
// 🏷️ sal_prizes — CRUD
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
 * Trae premios + inventario (con el campo `available` incluido).
 * Ya NO trae las jugadas: el restante se lee directo de Directus.
 */
export async function getPrizesWithInventory() {
  const prizes = await withAutoRefresh(() =>
    directus.request(
      readItems('sal_prizes', {
        fields: ['id', 'name', 'tier', 'is_active', 'probability'],
        sort: ['tier', 'name'],
        limit: -1,
      })
    )
  );

  const inventory = await withAutoRefresh(() =>
    directus.request(
      readItems('sal_prize_inventory', {
        fields: [
          'id',
          'prize_id',
          'store_code',
          'total_assigned',
          'available',       // 🆕
        ],
        limit: -1,
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
    const inventoryKey =
      row.inventory_key ?? buildInventoryKey(row.store_code, row.prize_id);

    if (row.id) {
      // 🧠 Si el `total_assigned` cambió → resetear available al nuevo total.
      // Si NO cambió → conservar el available actual (no perder las jugadas).
      let current: { total_assigned: number; available: number | null } | null =
        null;
      try {
        current = (await withAutoRefresh(() =>
          directus.request(
            readItem('sal_prize_inventory', row.id as number, {
              fields: ['total_assigned', 'available'],
            })
          )
        )) as any;
      } catch (e) {
        console.warn('No se pudo leer inventario actual:', e);
      }

      const totalCambio =
        Number(current?.total_assigned ?? -1) !== Number(row.total_assigned);

      const nuevoAvailable = totalCambio
        ? row.total_assigned
        : (current?.available ?? row.total_assigned);

      await withAutoRefresh(() =>
        directus.request(
          updateItem('sal_prize_inventory', row.id as number, {
            total_assigned: row.total_assigned,
            available: nuevoAvailable,
            inventory_key: inventoryKey,
          })
        )
      );
    } else {
      // Crear: available arranca igual al total
      await withAutoRefresh(() =>
        directus.request(
          createItem('sal_prize_inventory', {
            prize_id: row.prize_id,
            store_code: row.store_code,
            total_assigned: row.total_assigned,
            available: row.total_assigned,   // 🆕
            inventory_key: inventoryKey,
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

// ============================================================
// 🎰 JUGADAS
// ============================================================

/**
 * Registra la jugada y decrementa el campo `available` del inventario.
 */
export async function createGiroRecord(factura: FacturaValida) {
  try {
    const invoiceKey = `${factura.bodega}-${factura.documentos}`;

    // 1. Registrar la jugada
    await withAutoRefresh(() =>
      directus.request(
        createItem('sal_roulette_plays', {
          invoice_key: invoiceKey,
          document_number: factura.documentos,
          store_code: factura.bodega,
          prize: factura.prize,
        })
      )
    );

    // 2. Decrementar el campo `available` en el inventario
    await decrementAvailable(factura.prize, factura.bodega);
  } catch (error) {
    throw error;
  }
}

/**
 * 🔻 Decrementa en 1 el campo `available` del inventario
 * para un premio + tienda.
 *
 * No lanza error si falla (para no romper el flujo del giro).
 */
async function decrementAvailable(
  prizeName: string,
  storeCode: string | number
): Promise<void> {
  try {
    // 1. Buscar el premio por nombre
    const premios = (await withAutoRefresh(() =>
      directus.request(
        readItems('sal_prizes', {
          filter: { name: { _eq: prizeName } },
          fields: ['id'],
          limit: 1,
        })
      )
    )) as Array<{ id: number }>;

    const premioId = premios?.[0]?.id;
    if (!premioId) {
      console.warn(`⚠️ No se encontró el premio "${prizeName}"`);
      return;
    }

    // 2. Buscar el inventario correspondiente
    const inventarios = (await withAutoRefresh(() =>
      directus.request(
        readItems('sal_prize_inventory', {
          filter: {
            prize_id: { _eq: premioId },
            store_code: { _eq: storeCode },
          },
          fields: ['id', 'available', 'total_assigned'],
          limit: 1,
        })
      )
    )) as Array<{
      id: number;
      available: number | null;
      total_assigned: number;
    }>;

    const inv = inventarios?.[0];
    if (!inv) {
      console.warn(
        `⚠️ No hay inventario para "${prizeName}" en tienda ${storeCode}`
      );
      return;
    }

    const actual = Number(inv.available ?? inv.total_assigned ?? 0);
    const nuevo = Math.max(0, actual - 1);

    await withAutoRefresh(() =>
      directus.request(
        updateItem('sal_prize_inventory', inv.id, { available: nuevo })
      )
    );

    console.log(
      `✅ available decrementado: ${actual} → ${nuevo} (${prizeName} @ ${storeCode})`
    );
  } catch (error) {
    console.error('⚠️ Error decrementando available:', error);
  }
}