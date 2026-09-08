// src/apps/ruleta/api/directus/read.ts
import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import { readItems } from '@directus/sdk';
import { Tienda } from '../../interfaces/ruleta.interface';

// ============================================================
// 🏪 OBTENER TIENDAS DESDE DIRECTUS (core_stores)
// ============================================================
export async function getStores(): Promise<Tienda[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems('core_stores', {  // 👈 NOMBRE CORRECTO DE LA COLECCIÓN
          fields: ['id', 'name'],
          sort: ['name'],
        })
      )
    );
    return items as Tienda[];
  } catch (error) {
    console.error('❌ Error al obtener tiendas:', error);
    return [];
  }
}