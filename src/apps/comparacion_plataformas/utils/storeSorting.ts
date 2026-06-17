import { TiendaMapeo } from '../types/mapeo.types';

export const ordenarTiendasPorCodigo = (
    grupos: Record<string, Record<string, any[]>>,
    tiendaMapeos: TiendaMapeo[]
): Record<string, Record<string, any[]>> => {
    const tiendaIdMap = new Map<string, number>();

    tiendaMapeos.forEach(mapeo => {
        if (mapeo.tiendaNormalizada) {
            tiendaIdMap.set(mapeo.tiendaNormalizada.toUpperCase(), mapeo.store_id);
        }
    });

    const tiendasOrdenadas = Object.keys(grupos).sort((a, b) => {
        const idA = tiendaIdMap.get(a.toUpperCase()) ?? Number.MAX_SAFE_INTEGER;
        const idB = tiendaIdMap.get(b.toUpperCase()) ?? Number.MAX_SAFE_INTEGER;

        return idA - idB;
    });

    const gruposOrdenados: Record<string, Record<string, any[]>> = {};
    tiendasOrdenadas.forEach(tienda => {
        gruposOrdenados[tienda] = grupos[tienda];
    });

    return gruposOrdenados;
};
