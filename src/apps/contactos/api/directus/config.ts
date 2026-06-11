import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import { readItems, updateItem } from '@directus/sdk';

const COLLECTION = 'adm_contacts_config';

export interface ContactoConfig {
  id: number;
  daily_sync_time: string | null;
}

export async function getContactoConfig(): Promise<ContactoConfig | null> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(readItems(COLLECTION, { fields: ['id', 'daily_sync_time'], limit: 1 })),
    );
    if (!items || items.length === 0) return null;
    return { id: (items[0] as any).id, daily_sync_time: (items[0] as any).daily_sync_time };
  } catch (error) {
    console.error('❌ Error al cargar config de contactos:', error);
    return null;
  }
}

export async function updateContactoConfig(id: number, daily_sync_time: string): Promise<boolean> {
  try {
    await withAutoRefresh(() =>
      directus.request(updateItem(COLLECTION, id, { daily_sync_time })),
    );
    return true;
  } catch (error) {
    console.error('❌ Error al actualizar config:', error);
    return false;
  }
}
