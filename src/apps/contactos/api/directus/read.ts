// src/apps/contactos/api/directus/read.ts
import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import { readItems } from '@directus/sdk';
import type { Contactos } from '../../types/contact';

const COLLECTION = 'adm_contacts';

// Ahora la función recibe cómo quieres ordenar los datos
export async function getContactos(sortBy: string = '-date_created'): Promise<Contactos[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems(COLLECTION, {
          fields: ['id', 'date_created', 'date_updated', 'full_name', 'phone_number', 'email', 'department_id.id', 'department_id.name', 'visibility_type'],
          sort: [sortBy], // Aplica el orden seleccionado (ej. '-date_created' para Recientes)
          limit: -1,
        }),
      ),
    );

    return items.map((item: any) => ({
      id: item.id,
      date_created: item.date_created,
      date_updated: item.date_updated,
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

const DEPARTAMENTOS_COLLECTION = 'core_departments';

export async function  getDepartamentos(): Promise<{ id: number; name: string} []> {
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
    console.error('❌ Error al cargar departamentos: ', error);
    return [];
  }
}