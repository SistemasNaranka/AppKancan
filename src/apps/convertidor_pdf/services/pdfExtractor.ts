import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface ParsedTransaction {
  dia: string;
  transaccion: string;
  ident: string;
  debitos: number;
  creditos: number;
  saldo: number;
}

export interface PageText {
  pageNumber: number;
  text: string;
  lines: string[];
  transactions: ParsedTransaction[];
}

export interface ExtractOptions {
  buffer: ArrayBuffer;
  password: string;
  startPage: number;
  endPage: number;
  onPasswordRequired?: (isIncorrect: boolean) => void;
}

export interface ExtractResult {
  pages: PageText[];
  numPagesTotal: number;
}

const parseNumber = (valStr: string): number => {
  if (!valStr) return 0;
  const clean = valStr.replace(/,/g, "");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

/**
 * Verifica si un PDF requiere contraseña y devuelve el número total de páginas.
 * Se usa al cargar el archivo, antes de procesarlo.
 */
export const checkPdfPassword = async (
  buffer: ArrayBuffer,
  password: string,
  onPasswordRequired?: (isIncorrect: boolean) => void
): Promise<{ numPages: number } | null> => {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: buffer.slice(0),
      password,
    });

    loadingTask.onPassword = (_updatePassword: (p: string) => void, reason: number) => {
      const isIncorrect = reason === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD;
      onPasswordRequired?.(isIncorrect);
    };

    const pdf = await loadingTask.promise;
    return { numPages: pdf.numPages };
  } catch (err: any) {
    if (err.name === "PasswordException") {
      onPasswordRequired?.(false);
    }
    return null;
  }
};

/**
 * Extrae las transacciones de un extracto bancario en PDF.
 */
export const extractTransactionsFromPdf = async (
  options: ExtractOptions
): Promise<ExtractResult> => {
  const { buffer, password, startPage, endPage: requestedEndPage, onPasswordRequired } = options;

  const loadingTask = pdfjsLib.getDocument({
    data: buffer.slice(0),
    password,
  });

  loadingTask.onPassword = (_updatePassword: (p: string) => void, reason: number) => {
    const isIncorrect = reason === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD;
    onPasswordRequired?.(isIncorrect);
  };

  const pdf = await loadingTask.promise;
  const numPagesTotal = pdf.numPages;

  const targetEndPage = requestedEndPage || numPagesTotal;
  const endPage = Math.min(Math.max(startPage, targetEndPage), numPagesTotal);
  const results: PageText[] = [];

  for (let i = startPage; i <= endPage; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    const lineMap: { [y: number]: any[] } = {};
    for (const item of textContent.items as any[]) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      if (!lineMap[y]) lineMap[y] = [];
      lineMap[y].push({
        x: item.transform[4],
        str: item.str.trim(),
      });
    }

    const sortedY = Object.keys(lineMap)
      .map(Number)
      .sort((a, b) => b - a);

    const pageLines: string[] = [];
    const pageTransactions: ParsedTransaction[] = [];
    let stopProcessing = false;

    for (const y of sortedY) {
      const itemsInLine = lineMap[y].sort((a, b) => a.x - b.x);
      const fullLineText = itemsInLine.map((it) => it.str).join(" ");

      // DETECTOR DE FIN DE TABLA PRINCIPAL
      if (
        fullLineText.includes("Nota Débito/Crédito") ||
        (fullLineText.includes("Hemos Debitado a su cuenta") && !fullLineText.includes("VENTA POS")) ||
        fullLineText.includes("CODIGO ESTABLECIMIENTO :")
      ) {
        stopProcessing = true;
        break;
      }

      // Filtrar pies de página e info legal
      if (
        fullLineText.includes("En caso de mora") ||
        fullLineText.includes("permanencia del reporte negativo") ||
        fullLineText.includes("ESTE PRODUCTO CUENTA CON SEGURO DE DEPÓSITOS") ||
        fullLineText.includes("Revisoría Fiscal KPMG") ||
        fullLineText.includes("Consultas y trámite de requerimientos") ||
        fullLineText.includes("Defensor del Consumidor Financiero") ||
        fullLineText.startsWith("Hoja ") ||
        fullLineText.includes("Extracto - CUENTA CORRIENTE") ||
        fullLineText.includes("FECHA DE CORTE:") ||
        fullLineText.includes("DIA TRANSACCIÓN") ||
        fullLineText.includes("IDENT. DEBITOS") ||
        fullLineText.includes("TASA SOBREGIRO") ||
        fullLineText.includes("Tasa de Interés")
      ) {
        continue;
      }

      pageLines.push(fullLineText);

      const tokens = itemsInLine.map((it) => it.str);
      if (tokens.length >= 4) {
        const firstToken = tokens[0];
        if (/^\d{2}$/.test(firstToken)) {
          const dia = firstToken;
          const lastToken = tokens[tokens.length - 1];
          const secondLastToken = tokens[tokens.length - 2];
          const thirdLastToken = tokens[tokens.length - 3];
          const fourthLastToken = tokens[tokens.length - 4];

          if (
            /^[\d,]+\.\d{2}$/.test(lastToken) &&
            /^[\d,]+\.\d{2}$/.test(secondLastToken) &&
            /^[\d,]+\.\d{2}$/.test(thirdLastToken)
          ) {
            const ident = /^[A-Z0-9]+$/i.test(fourthLastToken) ? fourthLastToken : "";
            const descTokens = tokens.slice(1, ident ? tokens.length - 4 : tokens.length - 3);
            const transaccion = descTokens.join(" ");

            pageTransactions.push({
              dia,
              transaccion,
              ident,
              debitos: parseNumber(thirdLastToken),
              creditos: parseNumber(secondLastToken),
              saldo: parseNumber(lastToken),
            });
          }
        }
      }
    }

    if (pageTransactions.length > 0 || pageLines.length > 0) {
      results.push({
        pageNumber: i,
        text: pageLines.join("\n"),
        lines: pageLines,
        transactions: pageTransactions,
      });
    }

    if (stopProcessing) {
      console.log(`Fin de la tabla de transacciones detectado en la página ${i}. Deteniendo lectura.`);
      break;
    }
  }

  return { pages: results, numPagesTotal };
};