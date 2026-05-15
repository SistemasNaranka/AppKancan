// src/apps/contactos/api/directus/create.ts
import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import { createItem, updateItem, deleteItem } from '@directus/sdk';
import type { CreateContactoInput } from '../../types/contact';

const COLLECTION = 'adm_contacts';

/**
 * Crea un nuevo contacto.
 * Al usar Directus, el campo 'date_created' se llena solo, 
 * lo que permite que el filtro "Reciente" lo ponga de primero.
 */
export async function createContacto(data: CreateContactoInput): Promise<number | null> {
  try {
    const payload = {
      full_name: data.full_name,
      phone_number: data.phone_number || null,
      email: data.email || null,
      department: data.department || null,
      // Aquí usamos tus nuevos nombres: Universal, Restringido o Inactivo
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

/**
 * Actualiza un contacto existente.
 */
export async function updateContacto(id: number, data: Partial<CreateContactoInput>): Promise<boolean> {
  try {
    const payload: any = {};
    if (data.full_name)       payload.full_name       = data.full_name;
    if (data.phone_number)    payload.phone_number    = data.phone_number;
    if (data.email)           payload.email           = data.email;
    if (data.department)      payload.department      = data.department;
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

/**
 * NOTA: Aunque borramos el botón de la basura de la tabla, 
 * mantenemos la función aquí por si la necesitas en el futuro 
 * o para pruebas internas.
 */
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