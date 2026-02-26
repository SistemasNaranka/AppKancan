// src/apps/pruebas/utils/sortingUtils.ts

/**
 * Identifica el campo de código en un registro de datos
 * Busca variaciones comunes del campo "codigo Ultra"
 */
export const identificarCampoCodigo = (datos: any[]): string | null => {
    if (!datos || datos.length === 0) return null;

    const primeraFila = datos[0];
    const columnas = Object.keys(primeraFila);

    // Prioridad de búsqueda (case-insensitive)
    const patronesBusqueda = [
        /^codigo\s*ultra$/i,
        /^codigo$/i,
        /codigo.*ultra/i,
        /ultra.*codigo/i,
        /^cod$/i,
        /codigo/i,
        // Campos alternativos comunes para ordenar
        /^terminal$/i,
        /^idterminal$/i,
        /^referencia$/i,
        /^factura$/i,
        /^transacci[oó]n$/i,
        /^id.*transacci/i,
        /^documento$/i  // Para archivos ADDI
    ];

    for (const patron of patronesBusqueda) {
        const columnaEncontrada = columnas.find(col => patron.test(col));
        if (columnaEncontrada) {
            return columnaEncontrada;
        }
    }

    return null;
};

/**
 * Función de comparación para ordenar valores de forma ascendente
 * Maneja valores nulos, numéricos y alfanuméricos
 */
const compararValores = (a: any, b: any): number => {
    // Manejar valores nulos/undefined - siempre al final
    const aEsNulo = a === null || a === undefined || a === '';
    const bEsNulo = b === null || b === undefined || b === '';

    if (aEsNulo && bEsNulo) return 0;
    if (aEsNulo) return 1;  // a va después
    if (bEsNulo) return -1; // b va después

    // Convertir a string para comparación
    const aStr = String(a).trim();
    const bStr = String(b).trim();

    // Intentar conversión numérica
    const aNum = Number(aStr);
    const bNum = Number(bStr);

    // Si ambos son números válidos, comparar numéricamente
    if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
    }

    // Comparación alfanumérica (case-insensitive)
    return aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
};

/**
 * Ordena un array de registros por el campo codigo Ultra de forma ascendente
 * @param datos Array de registros a ordenar
 * @returns Array ordenado (copia, no modifica el original)
 */
export const ordenarPorCodigoUltra = (datos: any[]): any[] => {
    if (!datos || datos.length === 0) return datos;

    // Identificar el campo de código
    const campoCodigo = identificarCampoCodigo(datos);

    // Si no se encuentra el campo, retornar datos sin ordenar
    if (!campoCodigo) {
        return [...datos];
    }

    // Crear copia y ordenar de forma estable
    const datosOrdenados = [...datos].sort((a, b) => {
        const valorA = a[campoCodigo];
        const valorB = b[campoCodigo];
        return compararValores(valorA, valorB);
    });

    return datosOrdenados;
};

/**
 * Ordena registros agrupados por tienda y fuente
 * @param grupos Objeto con estructura: { tienda: { fuente: datos[] } }
 * @returns Objeto con la misma estructura pero datos ordenados
 */
export const ordenarGruposPorCodigo = (
    grupos: Record<string, Record<string, any[]>>
): Record<string, Record<string, any[]>> => {
    const gruposOrdenados: Record<string, Record<string, any[]>> = {};

    Object.entries(grupos).forEach(([tienda, fuentes]) => {
        gruposOrdenados[tienda] = {};

        Object.entries(fuentes).forEach(([fuente, datos]) => {
            gruposOrdenados[tienda][fuente] = ordenarPorCodigoUltra(datos);
        });
    });

    return gruposOrdenados;
};
