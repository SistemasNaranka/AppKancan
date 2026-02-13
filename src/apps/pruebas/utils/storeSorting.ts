// src/apps/pruebas/utils/storeSorting.ts

import { TiendaMapeo } from '../types/mapeo.types';

/**
 * Ordena las tiendas agrupadas por su código (ID) de la base de datos
 * @param grupos Objeto con tiendas agrupadas { nombreTienda: { fuente: datos[] } }
 * @param tiendaMapeos Array con los mapeos de tiendas que incluyen los IDs
 * @returns Objeto ordenado por ID de tienda (menor a mayor)
 */
export const ordenarTiendasPorCodigo = (
    grupos: Record<string, Record<string, any[]>>,
    tiendaMapeos: TiendaMapeo[]
): Record<string, Record<string, any[]>> => {
    // Crear un mapa de nombre de tienda -> ID de tienda
    const tiendaIdMap = new Map<string, number>();

    tiendaMapeos.forEach(mapeo => {
        // Usar el nombre normalizado como clave
        tiendaIdMap.set(mapeo.tiendaNormalizada, mapeo.tiendaId);
    });


    // Obtener las tiendas y ordenarlas por ID
    const tiendasOrdenadas = Object.keys(grupos).sort((a, b) => {
        const idA = tiendaIdMap.get(a) ?? Number.MAX_SAFE_INTEGER; // Si no tiene ID, va al final
        const idB = tiendaIdMap.get(b) ?? Number.MAX_SAFE_INTEGER;

        return idA - idB; // Orden ascendente
    });

    tiendasOrdenadas.forEach(tienda => {
        const id = tiendaIdMap.get(tienda);
        console.log(`  ${id ? `[${id}]` : '[SIN ID]'} ${tienda}`);
    });

    // Crear nuevo objeto con las tiendas ordenadas
    const gruposOrdenados: Record<string, Record<string, any[]>> = {};
    tiendasOrdenadas.forEach(tienda => {
        gruposOrdenados[tienda] = grupos[tienda];
    });

    return gruposOrdenados;
};
