export const formatearValor = (valor: any, columna?: string): string => {
    if (valor === null || valor === undefined || valor === "") return "";

    // Función auxiliar para normalizar strings (quitar acentos y a minúsculas)
    const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const colNorm = columna ? normalizar(columna) : "";

    // No formatear como moneda si la columna es de tipo documento, nombre o identificador
    const keywordsNoMoneda = [
        'documento', 'cc', 'nit', 'cedula', 'identificaci', 'idemisor', 'nro_', 'id_',
        'almacen', 'nombre', 'tienda', 'cliente', 'factura', 'pagare', 'referencia', 'codigo'
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

    const fechaNormalizada = normalizarFecha(valor);
    if (fechaNormalizada) return fechaNormalizada;

    if (typeof valor === "number") {
        if (esIdentidad) return String(valor);
        return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    }

    // Intentar convertir string a número si parece un número y no es una fecha
    const num = Number(String(valor).replace(/[^0-9.-]+/g, ""));
    if (!isNaN(num) && String(valor).match(/[0-9]/) && !String(valor).includes('-') && !String(valor).includes('/')) {
        if (esIdentidad) return String(valor).trim();
        return num.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    }

    return String(valor);
};
