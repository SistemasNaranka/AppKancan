
// Simulation of the mapping logic to verify the fix
// Run with: node verify_naranka_logic.js

const normalizarParaComparacion = (str) => {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

const mapeosTienda = [
    { tiendaArchivo: "NARANKA SAS", terminal: "12345", tiendaId: 101, tiendaNormalizada: "NARANKA TIENDA A" },
    { tiendaArchivo: "NARANKA SAS", terminal: "67890", tiendaId: 102, tiendaNormalizada: "NARANKA TIENDA B" },
    // A "generic" mapping that causes the issue (optimistic match)
    // In the current buggy system, this might be catching everything, or the code logic itself is too loose.
    // If the code sees "NARANKA SAS" and matches it to a mapping without checking terminal, that's the bug.
    { tiendaArchivo: "NARANKA SAS", terminal: undefined, tiendaId: 999, tiendaNormalizada: "NARANKA GENERICA (ERROR)" },
    // A specific mapping that should NOT require terminal validation despite containing "Naranka"
    { tiendaArchivo: "Kan Can Jeans Colombia - Naranka", terminal: undefined, tiendaId: 105, tiendaNormalizada: "KAN CAN STORE" }
];

// Recreating the logic from fileNormalization.ts
function simulateMapping(row, mappings, useFix = false) {
    let tiendaIdEncontrado = null;
    let tiendaEncontrada = null;

    for (const columna of Object.keys(row)) {
        const valor = String(row[columna] || '').trim();
        if (!valor || valor.length < 2) continue;

        const valorNormalizado = normalizarParaComparacion(valor);

        for (const mapeo of mappings) {
            const tiendaNormalizada = normalizarParaComparacion(mapeo.tiendaArchivo);

            if (valorNormalizado === tiendaNormalizada) {
                // --- THE FIX LOGIC BLOCK ---
                if (useFix) {
                    // Logic Update: Only enforce strictness if it's the Generic Naranka Mapping
                    const isGenericNarankaMapping = tiendaNormalizada === "naranka sas" || tiendaNormalizada === "naranka";

                    if (isGenericNarankaMapping) {
                        if (mapeo.terminal) {
                            const tieneTerminal = Object.values(row).some(v => String(v).trim() === mapeo.terminal);
                            if (!tieneTerminal) continue;
                        } else {
                            continue; // Skip generic mapping
                        }
                    }
                    // If it's NOT generic (e.g. "Kan Can"), let it match normally (unless it has a terminal defined, then maybe still check?)
                    // For now, if "Kan Can" has no terminal, we allow the match.
                } else {
                    // --- OLD LOGIC (Simulated) ---
                    // Original code:
                    // if (valorNormalizado.includes("naranka") && mapeo.terminal) {
                    //   const tieneTerminal = Object.values(fila).some(v => String(v).trim() === mapeo.terminal);
                    //   if (!tieneTerminal) continue;
                    // }
                    // Note: If mapeo.terminal is UNDEFINED, the check above is skipped, and it matches! (Optimistic)
                    if (valorNormalizado.includes("naranka") && mapeo.terminal) {
                        const tieneTerminal = Object.values(row).some(v => String(v).trim() === mapeo.terminal);
                        if (!tieneTerminal) continue;
                    }
                }

                tiendaIdEncontrado = mapeo.tiendaId;
                tiendaEncontrada = mapeo.tiendaNormalizada;
                break;
            }
        }
        if (tiendaIdEncontrado) break;
    }
    return { tiendaIdEncontrado, tiendaEncontrada };
}

// Test Data
const testRows = [
    { id: 1, comercio: "NARANKA SAS", term: "12345", desc: "Valid Terminal A" },
    { id: 2, comercio: "NARANKA SAS", term: "67890", desc: "Valid Terminal B" },
    { id: 3, comercio: "NARANKA SAS", term: "00000", desc: "Unknown Terminal" },
    { id: 4, comercio: "NARANKA SAS", term: "", desc: "No Terminal" },
    { id: 5, comercio: "Kan Can Jeans Colombia - Naranka", term: "", desc: "Specific Name Match" }
];

console.log("--- TEST RUN: OLD LOGIC (Current Behavior) ---");
testRows.forEach(row => {
    const res = simulateMapping(row, mapeosTienda, false);
    console.log(`Row ${row.id} (${row.desc}): Mapped to -> ${res.tiendaEncontrada || "SIN TIENDA"}`);
});

console.log("\n--- TEST RUN: NEW LOGIC (Fixed Behavior) ---");
testRows.forEach(row => {
    const res = simulateMapping(row, mapeosTienda, true);
    console.log(`Row ${row.id} (${row.desc}): Mapped to -> ${res.tiendaEncontrada || "SIN TIENDA"}`);
});
