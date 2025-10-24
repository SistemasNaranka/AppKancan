// src/data/mockStores.ts
// Este archivo ahora solo exporta tipos
// Los datos reales vienen de Directus

export interface Store {
  id: string | number;
  nombre: string;
  codigo_ultra?: number;
  empresa?: string;
}

// Ya no se necesitan datos mock, todo viene de Directus
// Si necesitas datos de respaldo, se pueden agregar aquí
export const mockStores: Store[] = [];