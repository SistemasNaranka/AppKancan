import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { PageText, AuditSummary } from "./pdfExtractor";

export interface ExportOptions {
  pages: PageText[];
  fileName: string;
  audit?: AuditSummary | null;
}

/**
 * Exporta las páginas extraídas a un archivo Excel (.xlsx) con formato:
 * - Pestaña 'Extracto Bancario' con filtros y encabezado en azul primario
 * - Pestaña opcional 'Conciliación Auditoría' con el resumen contable comprobado
 */
export const exportPagesToExcel = async (options: ExportOptions): Promise<void> => {
  const { pages, fileName, audit } = options;

  if (pages.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Extracto Bancario");

  const allTransactions = pages.flatMap((p) =>
    p.transactions.map((tx) => ({
      paginaPdf: p.pageNumber,
      dia: tx.dia,
      transaccion: tx.transaccion,
      ident: tx.ident,
      debitos: tx.debitos,
      creditos: tx.creditos,
      saldo: tx.saldo,
    }))
  );

  const hayTransacciones = allTransactions.length > 0;

  if (hayTransacciones) {
    worksheet.columns = [
      { header: "Página PDF", key: "paginaPdf", width: 12 },
      { header: "DÍA", key: "dia", width: 8 },
      { header: "TRANSACCIÓN", key: "transaccion", width: 45 },
      { header: "IDENT.", key: "ident", width: 12 },
      { header: "DEBITOS", key: "debitos", width: 15 },
      { header: "CREDITOS", key: "creditos", width: 15 },
      { header: "SALDO", key: "saldo", width: 18 },
    ];

    worksheet.addRows(allTransactions);
  } else {
    // Fallback: solo líneas crudas si no hubo transacciones parseadas
    worksheet.columns = [
      { header: "Página", key: "pagina", width: 10 },
      { header: "N° Línea", key: "linea", width: 10 },
      { header: "Contenido", key: "contenido", width: 100 },
    ];

    const filas = pages.flatMap((p) =>
      p.lines.map((line, idx) => ({
        pagina: p.pageNumber,
        linea: idx + 1,
        contenido: line,
      }))
    );

    worksheet.addRows(filas);
  }

  // Estilo del encabezado: azul con texto blanco en negrita
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF004680" },
    };
    cell.font = {
      color: { argb: "FFFFFFFF" },
      bold: true,
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  headerRow.height = 22;

  // Filtro automático sobre todas las columnas con datos
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columnCount },
  };

  // Si existe resumen de auditoría, creamos la pestaña de Verificación
  if (audit) {
    const auditSheet = workbook.addWorksheet("Verificación Auditoría");
    auditSheet.columns = [
      { header: "Métrica de Auditoría", key: "metrica", width: 35 },
      { header: "Valor", key: "valor", width: 30 },
    ];

    auditSheet.addRows([
      {
        metrica: "Estado de Verificación",
        valor: `${audit.porcentajeContinuidad}% Verificado`,
      },
      { metrica: "Total Movimientos Leídos", valor: audit.totalRegistros },
      { metrica: "Suma Total de Débitos", valor: audit.totalDebitos },
      { metrica: "Suma Total de Créditos", valor: audit.totalCreditos },
      { metrica: "Saldo Inicial (Primer Registro)", valor: audit.saldoInicial },
      { metrica: "Saldo Final (Último Registro)", valor: audit.saldoFinal },
    ]);

    const auditHeader = auditSheet.getRow(1);
    auditHeader.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF004680" },
      };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
    });
  }

  // Generar el archivo y disparar la descarga
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, fileName);
};