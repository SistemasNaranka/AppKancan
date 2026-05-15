// src/apps/contactos/api/directus/read.ts
import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import { readItems, readItem } from '@directus/sdk';
import type { Contactos } from '../../types/contact';

const COLLECTION = 'adm_contacts';

export async function getContactos(): Promise<Contactos[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems(COLLECTION, {
          fields: ['id', 'date_created', 'full_name', 'phone_number', 'email', 'visibility_type', 'department_id.name'],
          sort: ['full_name'],
          limit: -1,
        }),
      ),
    );
    return items.map((item: any) => ({
      id: item.id,
      date_created: item.date_created || undefined,
      full_name: item.full_name,
      phone_number: item.phone_number || '',
      email: item.email || '',
      department: item.department_id?.name || '',
      visibility_type: item.visibility_type || 'Universal',
    }));
  } catch (error) {
    console.error('❌ Error al cargar contactos:', error);
    return [];
  }
}

export async function getContactoById(id: number): Promise<Contactos | null> {
  try {
    const item = await withAutoRefresh(() =>
      directus.request(readItem(COLLECTION, id, {
        fields: ['id', 'date_created', 'full_name', 'phone_number', 'email', 'visibility_type', 'department_id.name'],
      } as any)),
    );
    if (!item) return null;
    return {
      id: item.id,
      date_created: (item as any).date_created || undefined,
      full_name: item.full_name,
      phone_number: item.phone_number || '',
      email: item.email || '',
      department: (item as any).department_id?.name || '',
      visibility_type: item.visibility_type || 'Universal',
    };
  } catch (error) {
    console.error('❌ Error al cargar contacto:', error);
    return null;
  }
}