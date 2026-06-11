export const identificarCampoCodigo = (datos: any[]): string | null => {
    if (!datos || datos.length === 0) return null;

    const primeraFila = datos[0];
    const columnas = Object.keys(primeraFila);

    const patronesBusqueda = [
        /^codigo\s*ultra$/i,
        /^codigo$/i,
        /codigo.*ultra/i,
        /ultra.*codigo/i,
        /^cod$/i,
        /codigo/i,
        /^terminal$/i,
        /^idterminal$/i,
        /^referencia$/i,
        /^factura$/i,
        /^transacci[oó]n$/i,
        /^id.*transacci/i,
        /^documento$/i
    ];

    for (const patron of patronesBusqueda) {
        const columnaEncontrada = columnas.find(col => patron.test(col));
        if (columnaEncontrada) {
            return columnaEncontrada;
        }
    }

    return null;
};

const compararValores = (a: any, b: any): number => {
    const aEsNulo = a === null || a === undefined || a === '';
    const bEsNulo = b === null || b === undefined || b === '';

    if (aEsNulo && bEsNulo) return 0;
    if (aEsNulo) return 1;
    if (bEsNulo) return -1;

    const aStr = String(a).trim();
    const bStr = String(b).trim();

    const aNum = Number(aStr);
    const bNum = Number(bStr);

    if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
    }

    return aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
};

export const ordenarPorCodigoUltra = (datos: any[]): any[] => {
    if (!datos || datos.length === 0) return datos;

    const campoCodigo = identificarCampoCodigo(datos);

    if (!campoCodigo) {
        return [...datos];
    }

    const datosOrdenados = [...datos].sort((a, b) => {
        const valorA = a[campoCodigo];
        const valorB = b[campoCodigo];
        return compararValores(valorA, valorB);
    });

    return datosOrdenados;
};

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
