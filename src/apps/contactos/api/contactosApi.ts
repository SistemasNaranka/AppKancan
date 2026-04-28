import directus from '../../../services/directus/directus';
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk';
import { Contactos } from '../types/types';

const COLLECTION = 'contactos';

export const contactosApi = {
  getContactos: async (): Promise<Contactos[]> => {
    // Limitamos la cantidad o usamos -1 para traer todos
    const response = await directus.request(readItems(COLLECTION, { limit: -1 }));
    return response as Contactos[];
  },

  createContacto: async (data: Omit<Contactos, 'id'>): Promise<Contactos> => {
    const response = await directus.request(createItem(COLLECTION, data as any));
    return response as Contactos;
  },

  updateContacto: async (payload: { id: string | number; data: Partial<Contactos> }): Promise<Contactos> => {
    const response = await directus.request(updateItem(COLLECTION, payload.id, payload.data as any));
    return response as Contactos;
  },

  deleteContacto: async (id: string | number): Promise<void> => {
    await directus.request(deleteItem(COLLECTION, id));
  }
};
