export const extractRef = (sheet: any): string => {
  if (!sheet) return "SIN REF";

  // Lista de candidatos en orden de prioridad
  const candidates = [
    sheet.referenciaBase,
    sheet.referencia,
    sheet.nombreHoja,
    sheet.metadatos?.referencia,
    sheet.id,
    sheet.metadatos?.nombreHoja,
    sheet.filas?.[0]?.referencia,
    sheet.filas?.[0]?.metadatos?.referencia,
  ];

  // Función de limpieza profunda
  const clean = (val: any) => {
    if (!val || typeof val !== "string") return "";
    let result = val.trim();
    while (
      result.toLowerCase().startsWith("ref:") ||
      result.toLowerCase().startsWith("hoja:") ||
      result.toLowerCase().startsWith("ingreso manual -") ||
      result.toLowerCase().startsWith("manual -") ||
      result.toLowerCase().startsWith("sheet-")
    ) {
      result = result
        .replace(/^REF:\s*/i, "")
        .replace(/^Hoja:\s*/i, "")
        .replace(/^Ingreso\s*Manual\s*-\s*/i, "")
        .replace(/^Manual\s*-\s*/i, "")
        .replace(/^sheet-\s*/i, "")
        .trim();
    }
    return result;
  };

  const valid = candidates
    .map(clean)
    .find(
      (c) =>
        c !== "" &&
        c.toUpperCase() !== "SIN REF" &&
        c.toUpperCase() !== "NULL" &&
        c.toUpperCase() !== "NUEVA",
    );

  if (valid) return valid;

  if (sheet.id && typeof sheet.id === "string") {
    const fromId = clean(sheet.id);
    if (
      fromId &&
      fromId.toUpperCase() !== "NUEVA" &&
      fromId.toUpperCase() !== "SIN REF"
    ) {
      return fromId;
    }
  }

  const desperateFallback = candidates
    .map((c) => (typeof c === "string" ? c.trim() : ""))
    .find(
      (c) => c !== "" && !c.includes("Manual -") && !c.startsWith("sheet-"),
    );

  return desperateFallback || "SIN REF";
};