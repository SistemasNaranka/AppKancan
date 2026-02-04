
// Mock of formatearValor logic from utils/formatters.ts with my fix applied

const formatearValor = (valor, columna) => {
    if (valor === null || valor === undefined || valor === "") return "";

    // Función auxiliar para normalizar strings (quitar acentos y a minúsculas)
    const normalizar = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const colNorm = columna ? normalizar(columna) : "";

    // No formatear como moneda si la columna es de tipo documento, nombre o identificador
    const keywordsNoMoneda = [
        'documento', 'cc', 'nit', 'cedula', 'identificaci', 'idemisor', 'nro_', 'id_',
        'almacen', 'nombre', 'tienda', 'cliente', 'factura', 'pagare', 'referencia', 'codigo', 'comercio'
    ];

    const esIdentidad = keywordsNoMoneda.some(key => colNorm.includes(key));

    // NOTE: Skipped date/time logic for this test as it's not relevant to the fix
    // but the critical part is below

    if (typeof valor === "number") {
        if (esIdentidad) return String(valor);
        return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    }

    // --- FIX START ---
    // Si el valor contiene letras, devolverlo tal cual (evita formatear "ARMENIA 14" como dinero)
    if (/[a-zA-Z]/.test(String(valor))) return String(valor).trim();
    // --- FIX END ---

    // Intentar convertir string a número si parece un número y no es una fecha
    const num = Number(String(valor).replace(/[^0-9.-]+/g, ""));
    if (!isNaN(num) && String(valor).match(/[0-9]/) && !String(valor).includes('-') && !String(valor).includes('/')) {
        if (esIdentidad) return String(valor).trim();
        return num.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    }

    return String(valor);
};

// TEST RUNNER
const testCases = [
    { input: "ARMENIA 14", expected: "ARMENIA 14" },
    { input: "1000", expected: "$ 1.000" },
    { input: 1000, expected: "$ 1.000" },
    { input: "Note 5", expected: "Note 5" },
    { input: "12345", expected: "$ 12.345" },
];

console.log("Running Standalone Tests...");
testCases.forEach(({ input, expected }) => {
    const result = formatearValor(input);
    const normalizedResult = result.replace(/\s/g, ' ');
    const normalizedExpected = expected.replace(/\s/g, ' ');

    if (normalizedResult === normalizedExpected) {
        console.log(`[PASS] Input: "${input}" -> Output: "${result}"`);
    } else {
        // Fallback for different locales/currency symbols in test environment
        if (typeof input === 'string' && /[a-zA-Z]/.test(input) && result === input) {
            console.log(`[PASS] Input: "${input}" -> Output: "${result}"`);
        } else {
            console.log(`[FAIL] Input: "${input}"`);
            console.log(`       Expected: "${expected}"`);
            console.log(`       Actual:   "${result}"`);
        }
    }
});
