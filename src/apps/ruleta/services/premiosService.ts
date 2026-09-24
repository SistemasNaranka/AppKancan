import { TGrupo, Tienda } from '../interfaces/ruleta.interface';
import { createPrize, updatePrize, upsertInventory, deleteInventory } from '../api/directus/write';
import { normKey } from '../utils/premios';

interface GuardarPremioInput {
  prizeId: number | null;
  nombre: string;
  grupo: TGrupo;
  cantidadesPorTienda: Record<string, string>;
  tiendas: Tienda[];
  inventarioActual: any[];
}

export const guardarPremio = async ({
  prizeId,
  nombre,
  grupo,
  cantidadesPorTienda,
  tiendas,
  inventarioActual,
}: GuardarPremioInput): Promise<number> => {
  let id: number;

  if (prizeId != null) {
    id = prizeId;
    await updatePrize(id, { name: nombre.trim(), tier: grupo });
  } else {
    id = await createPrize({ name: nombre.trim(), tier: grupo });
  }

  const existingByStore = new Map(
    inventarioActual
      .filter((inv: any) => normKey(inv.prize_id) === normKey(id))
      .map((r: any) => [normKey(r.store_code), r])
  );

  // Cantidad > 0 → crea o actualiza; cantidad vacía o 0 con registro existente → lo borra
  await Promise.all(
    tiendas.map(async (t) => {
      const storeKey = normKey(t.ultra_code);
      const raw = cantidadesPorTienda[storeKey];
      const qty = raw ? parseInt(raw, 10) : 0;
      const existing = existingByStore.get(storeKey) as any;

      if (!isNaN(qty) && qty > 0) {
        await upsertInventory({
          id: existing?.id,
          prize_id: id,
          store_code: t.ultra_code,
          total_assigned: qty,
        });
      } else if (existing?.id) {
        await deleteInventory(existing.id);
      }
    })
  );

  return id;
};