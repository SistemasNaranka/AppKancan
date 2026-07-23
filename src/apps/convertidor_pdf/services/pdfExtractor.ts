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
  knownSuggestedEndPage?: number;
  onPasswordRequired?: (isIncorrect: boolean) => void;
}

export interface AuditSummary {
  totalDebitos: number;
  totalCreditos: number;
  saldoInicial: number;
  saldoFinal: number;
  esConciliado: boolean;
  totalRegistros: number;
  porcentajeContinuidad: number;
}

export interface ExtractResult {
  pages: PageText[];
  numPagesTotal: number;
  audit: AuditSummary;
}

export interface PdfCheckResult {
  numPages: number;
  suggestedEndPage: number;
}

// Regexes precompiladas fuera de loops para máximo rendimiento
const REGEX_DAY = /^\d{2}$/;
const REGEX_AMOUNT = /^[\d,]+\.\d{2}$/;
const REGEX_IDENT = /^[A-Z0-9]+$/i;

const parseNumber = (valStr: string): number => {
  if (!valStr) return 0;
  const clean = valStr.replace(/,/g, "");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

/**
 * Detecta en qué página termina la tabla de transacciones buscando marcas conocidas.
 * Si no encuentra marcas de fin, retorna el total de páginas.
 */
export const detectTableEndPage = async (
  pdf: pdfjsLib.PDFDocumentProxy,
  startPage: number = 2
): Promise<number> => {
  for (let i = Math.max(1, startPage); i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    try {
      const textContent = await page.getTextContent();
      const items = textContent.items as any[];

      const lineMap: { [y: number]: any[] } = {};
      for (const item of items) {
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

      for (const y of sortedY) {
        const itemsInLine = lineMap[y].sort((a, b) => a.x - b.x);
        const fullLineText = itemsInLine.map((it) => it.str).join(" ");
        if (
          fullLineText.includes("Nota Débito/Crédito") ||
          (fullLineText.includes("Hemos Debitado a su cuenta") && !fullLineText.includes("VENTA POS")) ||
          fullLineText.includes("CODIGO ESTABLECIMIENTO :")
        ) {
          return i;
        }
      }
    } finally {
      page.cleanup();
    }
  }
  return pdf.numPages;
};

/**
 * Verifica si un PDF requiere contraseña y devuelve el número total de páginas
 * junto con la página sugerida donde finaliza la tabla.
 */
export const checkPdfPassword = async (
  buffer: ArrayBuffer,
  password: string
): Promise<PdfCheckResult> => {
  let pdf: pdfjsLib.PDFDocumentProxy | null = null;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: buffer.slice(0),
      password,
    });

    pdf = await loadingTask.promise;
    const suggestedEndPage = await detectTableEndPage(pdf, 2);
    return { numPages: pdf.numPages, suggestedEndPage };
  } finally {
    if (pdf) {
      pdf.destroy();
    }
  }
};

/**
 * Extrae las transacciones de un extracto bancario en PDF con máximo rendimiento y cero fugas de memoria.
 */
export const extractTransactionsFromPdf = async (
  options: ExtractOptions
): Promise<ExtractResult> => {
  const {
    buffer,
    password,
    startPage,
    endPage: requestedEndPage,
    knownSuggestedEndPage,
  } = options;

  let pdf: pdfjsLib.PDFDocumentProxy | null = null;

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: buffer.slice(0),
      password,
    });

    pdf = await loadingTask.promise;
    const numPagesTotal = pdf.numPages;

    // Si ya conocemos la página sugerida (obtenida durante el checkPdfPassword), la reutilizamos para no hacer un escaneo doble de 500 páginas
    const suggestedEndPage =
      knownSuggestedEndPage && knownSuggestedEndPage > 0
        ? knownSuggestedEndPage
        : await detectTableEndPage(pdf, startPage);

    const targetEndPage = requestedEndPage || suggestedEndPage || numPagesTotal;
    const endPage = Math.min(Math.max(startPage, targetEndPage), numPagesTotal);

    // Si el usuario solicita explícitamente un número mayor al límite sugerido de la tabla,
    // permitimos continuar extrayendo después de la marca de fin de tabla.
    const allowPastTableEnd = requestedEndPage > suggestedEndPage;
    const results: PageText[] = [];

    for (let i = startPage; i <= endPage; i++) {
      const page = await pdf.getPage(i);
      try {
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
            if (REGEX_DAY.test(firstToken)) {
              const dia = firstToken;
              const lastToken = tokens[tokens.length - 1];
              const secondLastToken = tokens[tokens.length - 2];
              const thirdLastToken = tokens[tokens.length - 3];
              const fourthLastToken = tokens[tokens.length - 4];

              if (
                REGEX_AMOUNT.test(lastToken) &&
                REGEX_AMOUNT.test(secondLastToken) &&
                REGEX_AMOUNT.test(thirdLastToken)
              ) {
                const ident = REGEX_IDENT.test(fourthLastToken) ? fourthLastToken : "";
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

        if (stopProcessing && !allowPastTableEnd) {
          console.log(`Fin de la tabla de transacciones detectado en la página ${i}. Deteniendo lectura.`);
          break;
        }
      } finally {
        page.cleanup();
      }
    }

    const allTx = results.flatMap((p) => p.transactions);
    let totalDebitos = 0;
    let totalCreditos = 0;

    for (let j = 0; j < allTx.length; j++) {
      totalDebitos += allTx[j].debitos;
      totalCreditos += allTx[j].creditos;
    }

    let filasContinuasValidas = 0;
    const totalComparaciones = Math.max(1, allTx.length - 1);

    for (let k = 0; k < allTx.length - 1; k++) {
      const actual = allTx[k];
      const siguiente = allTx[k + 1];

      // Verificación 1: Cronológico (Anterior -> Siguiente)
      const diffCronologico = Math.abs((actual.saldo + siguiente.creditos - siguiente.debitos) - siguiente.saldo);

      // Verificación 2: Inverso / Descendente (Reciente -> Antiguo)
      const diffInverso = Math.abs((siguiente.saldo + actual.creditos - actual.debitos) - actual.saldo);

      if (diffCronologico < 0.05 || diffInverso < 0.05) {
        filasContinuasValidas++;
      }
    }

    const porcentajeContinuidad = allTx.length > 1
      ? Math.round((filasContinuasValidas / totalComparaciones) * 1000) / 10
      : 100;

    const esConciliado = allTx.length > 0 && porcentajeContinuidad >= 85;

    const saldoInicial = allTx[0]?.saldo || 0;
    const saldoFinal = allTx[allTx.length - 1]?.saldo || 0;

    return {
      pages: results,
      numPagesTotal,
      audit: {
        totalDebitos,
        totalCreditos,
        saldoInicial,
        saldoFinal,
        esConciliado,
        totalRegistros: allTx.length,
        porcentajeContinuidad,
      },
    };
  } finally {
    if (pdf) {
      pdf.destroy();
    }
  }
};