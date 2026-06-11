import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import { createItem, updateItem, deleteItem, deleteItems, readItems } from '@directus/sdk';
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
    if (data.department_id)   payload.department_id   = Number(data.department_id);
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

export async function linkUserToContact(contactId: number, userId: string): Promise<boolean> {
  try {
    const records = await withAutoRefresh(() =>
      directus.request(
        readItems('adm_user_contacts', {
          filter: {
            contact_id: { _eq: contactId },
            user_id: { _eq: userId },
          },
          fields: ['id'],
          limit: 1,
        } as any),
      ),
    ) as any[];

    if (records && records.length > 0) {
      await withAutoRefresh(() =>
        directus.request(updateItem('adm_user_contacts', records[0].id, { status: 'Activo' })),
      );
    } else {
      const payload = {
        contact_id: contactId,
        user_id: userId,
        status: 'Activo',
      };
      await withAutoRefresh(() =>
        directus.request(createItem('adm_user_contacts', payload)),
      );
    }
    return true;
  } catch (error) {
    console.error('❌ Error al vincular usuario al contacto:', error);
    return false;
  }
}

export async function unlinkUserFromContact(contactId: number, userId: string): Promise<boolean> {
  try {
    const records = await withAutoRefresh(() =>
      directus.request(
        readItems('adm_user_contacts', {
          filter: {
            contact_id: { _eq: contactId },
            user_id: { _eq: userId },
          },
          fields: ['id'],
          limit: 1,
        } as any),
      ),
    ) as any[];

    if (records && records.length > 0) {
      const recordId = records[0].id;
      await withAutoRefresh(() =>
        directus.request(
          updateItem('adm_user_contacts', recordId, {
            status: 'Inactivo',
          }),
        ),
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error al desvincular (inactivar) usuario del contacto:', error);
    return false;
  }
}

