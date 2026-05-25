// src/apps/contactos/api/directus/readDepartamentos.ts
import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import { readItems } from '@directus/sdk';

export interface Departamento {
  id: number;
  name: string;
}

const COLLECTION = 'core_departments';

export async function getDepartamentos(): Promise<Departamento[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems(COLLECTION, {
          fields: ['id', 'name'],
          sort: ['name'],
          limit: -1,
        }),
      ),
    );
    return items as Departamento[];
  } catch (error) {
    console.error('❌ Error al cargar departamentos:', error);
    return [];
  }
}