import * as XLSX from "xlsx";
import { DirectusTienda } from "../types";

export interface ParsedBudgetRow {
  originalSheet: string;
  originalFecha: string;
  originalValor: string;
  date: string;
  budget: number;
  store_id: number;
  store_name: string;
  ultra_code: string;
  matched: boolean;
  warning?: string;
}

export interface ExcelParseResult {
  totalSheets: number;
  matchedStoresCount: number;
  unmatchedSheets: string[];
  totalRowsParsed: number;
  rows: ParsedBudgetRow[];
}

const MONTH_NAMES_MAP: Record<string, string> = {
  ene: "01", enero: "01",
  feb: "02", febrero: "02",
  mar: "03", marzo: "03",
  abr: "04", abril: "04",
  may: "05", mayo: "05",
  jun: "06", junio: "06",
  jul: "07", julio: "07",
  ago: "08", agosto: "08",
  sep: "09", septiembre: "09", sept: "09",
  oct: "10", octubre: "10",
  nov: "11", noviembre: "11",
  dic: "12", diciembre: "12",
};

/**
 * Limpia un string numérico quitando puntos, comas, símbolos $ y espacios
 */
export function cleanNumericValue(val: any): number {
  if (typeof val === "number") return Math.round(val);
  if (!val) return 0;
  const str = String(val).replace(/[^0-9]/g, "");
  return parseInt(str, 10) || 0;
}

/**
 * Normaliza y empareja el nombre/código de una pestaña Excel con las tiendas de Directus.
 * Resuelve ambigüedades cuando dos tiendas comparten el mismo Ultra Code (ej: ID 17 CALI CENTRO vs ID 1017 UNICENTRO PALMIRA).
 */
export function findMatchingStore(
  sheetName: string,
  cellB1: string | undefined,
  stores: DirectusTienda[]
): DirectusTienda | null {
  const targets = [sheetName, cellB1].filter(Boolean) as string[];

  for (const text of targets) {
    const cleanText = text.trim();

    // Extraer código (ej: "0017" o "17" de "0017-CALI CENTRO")
    const codeMatch = cleanText.match(/^(\d+)/);
    const codeNum = codeMatch ? parseInt(codeMatch[1], 10) : null;

    // Extraer nombre removiendo el código inicial (ej: "CALI CENTRO" de "0017-CALI CENTRO")
    const namePart = cleanText.replace(/^\d+[\s\-_]*/, "").trim().toLowerCase();

    // 1. PRIORIDAD MÁXIMA: Coincidencia por NOMBRE de la tienda
    if (namePart && namePart.length >= 3) {
      const matchesByName = stores.filter((s) => {
        const storeNameLower = (s.name || "").trim().toLowerCase();
        return storeNameLower && (namePart.includes(storeNameLower) || storeNameLower.includes(namePart));
      });

      if (matchesByName.length === 1) {
        return matchesByName[0];
      }

      if (matchesByName.length > 1 && codeNum !== null) {
        // Si hay varias tiendas con nombres similares, desempatar usando el Ultra Code / ID
        const exactMatch = matchesByName.find((s) => {
          const uNum = parseInt(String(s.ultra_code || ""), 10);
          return s.id === codeNum || uNum === codeNum;
        });
        if (exactMatch) return exactMatch;
        return matchesByName[0];
      }
    }

    // 2. Coincidencia por ID Exacto en Directus (ej: ID = 17)
    if (codeNum !== null) {
      const storeById = stores.find((s) => s.id === codeNum);
      if (storeById) return storeById;

      // 3. Coincidencia por Ultra Code único
      const storesByUltraCode = stores.filter((s) => {
        const uNum = parseInt(String(s.ultra_code || ""), 10);
        return uNum === codeNum;
      });

      if (storesByUltraCode.length === 1) {
        return storesByUltraCode[0];
      }
    }
  }

  return null;
}

/**
 * Convierte un texto de fecha tipo "1-jul", "1-julio", "2026-07-01", etc. a formato ISO YYYY-MM-DD
 * usando el Año y Mes seleccionados por el usuario como destino principal.
 */
export function parseDateToISO(
  fechaStr: string,
  defaultYear: string = "2026",
  defaultMonth: string = "07"
): string {
  if (!fechaStr) return `${defaultYear}-${defaultMonth}-01`;

  const clean = fechaStr.trim().toLowerCase();

  // Si ya viene en formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // Extraer el día numérico (ej: "1" o "01" de "1-Jun" o "01-Jul")
  const matchDay = clean.match(/^(\d{1,2})/);
  if (matchDay) {
    const day = matchDay[1].padStart(2, "0");
    return `${defaultYear}-${defaultMonth}-${day}`;
  }

  return `${defaultYear}-${defaultMonth}-01`;
}

/**
 * Procesa un archivo Excel completo (.xlsx, .xls) con múltiples pestañas de tiendas
 */
export async function parseExcelBudgetFile(
  file: File,
  selectedYearMonth: string, // Formato "YYYY-MM" ej: "2026-07"
  storesList: DirectusTienda[]
): Promise<ExcelParseResult> {
  const [yearStr, monthStr] = selectedYearMonth.split("-");
  const year = yearStr || "2026";
  const month = monthStr || "07";

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const resultRows: ParsedBudgetRow[] = [];
  const unmatchedSheets: string[] = [];
  const matchedStoresSet = new Set<number>();

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // Convertir hoja a matriz de celdas
    const matrix: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: "",
    });

    if (matrix.length === 0) continue;

    // Buscar título en B1 (Fila 0, Columna 1) o A1
    const cellB1 = String(matrix[0]?.[1] || matrix[0]?.[0] || "").trim();

    // Emparejar tienda
    const matchedStore = findMatchingStore(sheetName, cellB1, storesList);

    if (!matchedStore) {
      unmatchedSheets.push(sheetName);
    } else {
      matchedStoresSet.add(matchedStore.id);
    }

    // Buscar la fila de encabezados que contenga "Fecha" y "Valor"
    let headerRowIndex = -1;
    for (let r = 0; r < Math.min(10, matrix.length); r++) {
      const rowText = matrix[r].map((c) => String(c).toLowerCase()).join(" ");
      if (rowText.includes("fecha") || rowText.includes("valor")) {
        headerRowIndex = r;
        break;
      }
    }

    const startRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 2;

    for (let r = startRow; r < matrix.length; r++) {
      const row = matrix[r];
      if (!row || row.length === 0) continue;

      const rawFecha = String(row[0] || "").trim();
      const rawValor = String(row[2] !== undefined && row[2] !== "" ? row[2] : (row[1] || "")).trim();

      // Si la fecha está vacía o es una fila de Total (ej: "54,700,000" o "Total"), la omitimos
      if (!rawFecha || rawFecha.toLowerCase().includes("total") || !/\d/.test(rawFecha)) {
        continue;
      }

      const numericBudget = cleanNumericValue(rawValor);
      const isoDate = parseDateToISO(rawFecha, year, month);

      resultRows.push({
        originalSheet: sheetName,
        originalFecha: rawFecha,
        originalValor: rawValor || "0",
        date: isoDate,
        budget: numericBudget,
        store_id: matchedStore ? matchedStore.id : 0,
        store_name: matchedStore ? matchedStore.name : `Pestaña sin emparejar: ${sheetName}`,
        ultra_code: matchedStore ? String(matchedStore.ultra_code || "") : "",
        matched: !!matchedStore,
        warning: matchedStore ? undefined : `No se encontró coincidencia en core_stores para "${sheetName}"`,
      });
    }
  }

  return {
    totalSheets: workbook.SheetNames.length,
    matchedStoresCount: matchedStoresSet.size,
    unmatchedSheets,
    totalRowsParsed: resultRows.length,
    rows: resultRows,
  };
}
