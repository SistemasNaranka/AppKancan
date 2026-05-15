// src/apps/contactos/api/directus/create.ts
import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import { createItem, updateItem, deleteItem } from '@directus/sdk';
import type { CreateContactoInput } from '../../types/contact';

const COLLECTION = 'adm_contacts';

export async function createContacto(data: CreateContactoInput): Promise<number | null> {
  try {
    const payload = {
      full_name: data.full_name,
      phone_number: data.phone_number || null,
      email: data.email || null,
      department_id: data.department_id || null,
      visibility_type: data.visibility_type,
    };
    const result = await withAutoRefresh(() =>
      directus.request(createItem(COLLECTION, payload)),
    );
    return result.id;
  } catch (error) {
    console.error('❌ Error al crear contacto:', error);
    return null;
  }
}

export async function updateContacto(id: number, data: Partial<CreateContactoInput>): Promise<boolean> {
  try {
    const payload: any = {};
    if (data.full_name)       payload.full_name       = data.full_name;
    if (data.phone_number)    payload.phone_number    = data.phone_number;
    if (data.email)           payload.email           = data.email;
    if (data.department_id)   payload.department_id   = data.department_id;
    if (data.visibility_type) payload.visibility_type = data.visibility_type;
    await withAutoRefresh(() =>
      directus.request(updateItem(COLLECTION, id, payload)),
    );
    return true;
  } catch (error) {
    console.error('❌ Error al actualizar contacto:', error);
    return false;
  }
}

export async function deleteContacto(id: number): Promise<boolean> {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItem(COLLECTION, id)),
    );
    return true;
  } catch (error) {
    console.error('❌ Error al eliminar contacto:', error);
    return false;
  }
}