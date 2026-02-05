export const formatearMoneda = (valor: number): string => {
    // Formatear con es-CO y luego reemplazar puntos por comas
    const formateado = valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    return formateado.replace(/\./g, ',');
};

export const formatearValor = (valor: any, columna?: string): string => {
    if (valor === null || valor === undefined || valor === "") return "";

    // Función auxiliar para normalizar strings (quitar acentos y a minúsculas)
    const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const colNorm = columna ? normalizar(columna) : "";

    // No formatear como moneda si la columna es de tipo documento, nombre o identificador
    const keywordsNoMoneda = [
        'documento', 'cc', 'nit', 'cedula', 'identificaci', 'idemisor', 'nro_', 'id_',
        'almacen', 'nombre', 'tienda', 'cliente', 'factura', 'pagare', 'referencia', 'codigo', 'comercio'
    ];

    const esIdentidad = keywordsNoMoneda.some(key => colNorm.includes(key));

    // Función para intentar parsear y normalizar fechas a YYYY-MM-DD (Formato TRANSFERENCIAS)
    const normalizarFecha = (v: any): string | null => {
        if (v instanceof Date) {
            if (isNaN(v.getTime())) return null;
            return v.toISOString().split('T')[0];
        }
        if (typeof v !== 'string') return null;

        const s = v.trim();
        if (s.length < 8) return null;

        // Caso ISO: 2025-12-21T...
        if (s.match(/^\d{4}-\d{2}-\d{2}T/)) {
            const d = new Date(s);
            return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : null;
        }

        // Caso DD/MM/YYYY: 21/12/2025
        const matchDMY = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (matchDMY) {
            const [_, d, m, y] = matchDMY;
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }

        // Caso YYYY/MM/DD o YYYY-MM-DD sin T
        const matchYMD = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
        if (matchYMD) {
            const [_, y, m, d] = matchYMD;
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }

        // Intentar con Date nativo para otros formatos (como el de ADDI si es parseable)
        const d = new Date(s);
        if (!isNaN(d.getTime()) && (s.includes('/') || s.includes('-') || s.match(/[a-z]{3}/i))) {
            try {
                return d.toISOString().split('T')[0];
            } catch { return null; }
        }

        return null;
    };

    // Función para normalizar HORA a HH:mm:ss (Formato TRANSFERENCIAS)
    const normalizarHora = (v: any, col: string): string | null => {
        const c = col.toLowerCase();
        // Solo aplicar si la columna parece ser de hora o si el valor tiene formato de hora
        if (!c.includes('hora') && !c.includes('time') && !c.includes('creacion') && !c.includes('cancelacion')) return null;

        let s = String(v).trim();
        if (!s) return null;

        // Caso AM/PM: "12:10 p. m." o "12:10 PM"
        const matchAMPM = s.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*([ap]\.?\s*m\.?|am|pm)/i);
        if (matchAMPM) {
            let [_, h, m, sec, meridiem] = matchAMPM;
            let hours = parseInt(h);
            const minutes = m.padStart(2, '0');
            const seconds = (sec || '00').padStart(2, '0');
            const isPM = meridiem.toLowerCase().includes('p');

            if (isPM && hours < 12) hours += 12;
            if (!isPM && hours === 12) hours = 0;

            return `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
        }

        // Caso ISO o Date: extraer solo la hora
        if (v instanceof Date && !isNaN(v.getTime())) {
            return v.toTimeString().split(' ')[0];
        }

        // Caso ya en HH:mm:ss.SSS (como TRANSFERENCIAS)
        const matchHHMMSS = s.match(/^(\d{2}):(\d{2}):(\d{2})(\.\d+)?/);
        if (matchHHMMSS) return s;

        return null;
    };

    const horaNormalizada = normalizarHora(valor, columna || "");
    if (horaNormalizada) return horaNormalizada;

    const fechaNormalizada = normalizarFecha(valor);
    if (fechaNormalizada) return fechaNormalizada;

    if (typeof valor === "number") {
        if (esIdentidad) return String(valor);
        return formatearMoneda(valor);
    }

    // Si el valor contiene letras, devolverlo tal cual (evita formatear "ARMENIA 14" como dinero)
    if (/[a-zA-Z]/.test(String(valor))) return String(valor).trim();

    // Intentar convertir string a número si parece un número y no es una fecha
    const num = Number(String(valor).replace(/[^0-9.-]+/g, ""));
    if (!isNaN(num) && String(valor).match(/[0-9]/) && !String(valor).includes('-') && !String(valor).includes('/')) {
        if (esIdentidad) return String(valor).trim();
        return formatearMoneda(num);
    }

    return String(valor);
};

export const parsearNumeroLatam = (valor: any): number => {
    if (typeof valor === 'number') return valor;
    if (valor === null || valor === undefined || valor === "") return 0;

    let s = String(valor).trim();
    // Remover símbolos de moneda y espacios
    s = s.replace(/[$\s]/g, '');

    // Si tiene tanto puntos como comas
    if (s.includes('.') && s.includes(',')) {
        // Formato COL/EUR: 1.234,56 -> eliminar puntos, coma a punto
        if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
            s = s.replace(/\./g, '').replace(',', '.');
        } else {
            // Formato USA: 1,234.56 -> eliminar comas
            s = s.replace(/,/g, '');
        }
    } else {
        // Solo puntos
        if (s.includes('.')) {
            // Si hay mas de un punto (1.200.300), son miles
            if ((s.match(/\./g) || []).length > 1) {
                s = s.replace(/\./g, '');
            } else {
                // Un solo punto. Ambiguedad.
                // Si son 3 decimales exactos (1.234) podría ser mil, pero JS lo toma como 1.234
                // ANÁLISIS DE CONTEXTO COLOMBIA:
                // La mayoría de archivos financieros usan punto para miles si no tienen decimales.
                // PERO si es un Excel normal, 1.5 es 1.5.
                // ESTRATEGIA: Si el punto está seguido de 3 dígitos y NO hay más decimales, es probable mil.
                // PERO esto es arriesgado.
                // Lo más seguro para reportes Kancan (moneda): ENTEROS.
                // Si el usuario sube "1.234", ¿quiere decir 1234 pesos o 1.2 pesos?
                // En pesos colombianos 1.2 pesos no existe. Así que 1.234 es 1234.
                // Si es "195.900", es 195900.

                // Si parece formato de miles (punto seguido de 3 digitos al final)
                if (/\.\d{3}$/.test(s)) {
                    s = s.replace(/\./g, '');
                }
                // Si no, dejar el punto (decimal)
            }
        }
        // Solo comas -> decimal
        else if (s.includes(',')) {
            s = s.replace(',', '.');
        }
    }

    const num = Number(s);
    return isNaN(num) ? 0 : num;
};
