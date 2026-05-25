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
          fields: ['id', 'date_created', 'date_updated', 'full_name', 'phone_number', 'email', 'department_id.id', 'department_id.name', 'visibility_type'],
          sort: ['-date_created'],
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
      department_id: String(item.department_id?.id) || '',
      department_name: item.department_id?.name || '',
      visibility_type: item.visibility_type,
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
      department_id: (item as any).department_id?.name || '',
      visibility_type: item.visibility_type || 'Universal',
    };
  } catch (error) {
    console.error('❌ Error al cargar contacto:', error);
    return null;
  }
}

export async function getContactUsers(contactId: number): Promise<{ id: string; first_name: string; last_name: string }[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems('adm_user_contacts', {
          filter: { contact_id: { _eq: contactId } },
          fields: ['user_id.id', 'user_id.first_name', 'user_id.last_name'],
          limit: -1,
        } as any),
      ),
    );
    return (items as any[])
      .map((r) => r?.user_id)
      .filter(Boolean)
      .map((u) => ({
        id: u.id,
        first_name: u.first_name || '',
        last_name: u.last_name || '',
      }));
  } catch {
    return [];
  }
}

const DEPARTAMENTOS_COLLECTION = 'core_departments';

export async function getDepartamentos(): Promise<{ id: number; name: string }[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems(DEPARTAMENTOS_COLLECTION, {
          fields: ['id', 'name'],
          limit: -1,
        }),
      ),
    );
    return items.map((item: any) => ({ id: item.id, name: item.name }));
  } catch (error) {
    console.error('❌ Error al cargar departamentos:', error);
    return [];
  }
}

