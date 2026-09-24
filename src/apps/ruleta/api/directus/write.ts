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
// 🔧 HELPER: Normalizar strings para comparaciones
// ============================================================
const normalize = (s: any): string =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

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
          'available',
        ],
        limit: -1,
      })
    )
  );

  // Jugadas = entregas
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
            available: row.total_assigned,
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
 * Búsqueda robusta:
 *   - El nombre del premio se compara case-insensitive y sin espacios sobrantes
 *   - El store_code se compara como string (por si en Directus es "7" vs 7)
 *
 * Logs verbosos para debug en consola del navegador.
 */
async function decrementAvailable(
  prizeName: string,
  storeCode: string | number
): Promise<void> {
  const TAG = '[decrementAvailable]';
  try {
    console.log(`${TAG} ▶ Inicio. premio="${prizeName}" tienda="${storeCode}"`);

    // 1. Traer TODOS los premios (son pocos) y buscar por nombre normalizado
    const premios = (await withAutoRefresh(() =>
      directus.request(
        readItems('sal_prizes', {
          fields: ['id', 'name'],
          limit: -1,
        })
      )
    )) as Array<{ id: number; name: string }>;

    const targetName = normalize(prizeName);
    const premio = premios.find((p) => normalize(p.name) === targetName);

    if (!premio) {
      console.warn(
        `${TAG} ⚠️ No se encontró premio con nombre "${prizeName}".`,
        `Nombres disponibles:`,
        premios.map((p) => `"${p.name}"`)
      );
      return;
    }

    console.log(
      `${TAG} ✅ Premio encontrado: id=${premio.id} name="${premio.name}"`
    );

    // 2. Traer TODO el inventario de ese premio y buscar por store_code normalizado
    const inventarios = (await withAutoRefresh(() =>
      directus.request(
        readItems('sal_prize_inventory', {
          filter: { prize_id: { _eq: premio.id } },
          fields: ['id', 'available', 'total_assigned', 'store_code'],
          limit: -1,
        })
      )
    )) as Array<{
      id: number;
      available: number | null;
      total_assigned: number;
      store_code: string | number;
    }>;

    const targetStore = normalize(storeCode);
    const inv = inventarios.find(
      (i) => normalize(i.store_code) === targetStore
    );

    if (!inv) {
      console.warn(
        `${TAG} ⚠️ No hay inventario para premio "${premio.name}" en tienda "${storeCode}".`,
        `Tiendas con inventario:`,
        inventarios.map((i) => `"${i.store_code}"`)
      );
      return;
    }

    console.log(
      `${TAG} ✅ Inventario encontrado: id=${inv.id} available=${inv.available} total=${inv.total_assigned}`
    );

    // 3. Calcular el nuevo valor
    const actual = Number(inv.available ?? inv.total_assigned ?? 0);
    const nuevo = Math.max(0, actual - 1);

    // 4. PATCH
    await withAutoRefresh(() =>
      directus.request(
        updateItem('sal_prize_inventory', inv.id, { available: nuevo })
      )
    );

    console.log(
      `${TAG} 🎉 DECREMENTADO: ${actual} → ${nuevo} (premio="${premio.name}" tienda="${storeCode}")`
    );
  } catch (error: any) {
    console.error(
      `${TAG} ❌ ERROR REAL (no silencioso):`,
      error?.errors?.[0]?.message || error?.message || error
    );
  }
}