import { useCallback } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { MatrixDataTransformada } from "../utils/analisis.types";

export const useAnalisisExport = (matrixData: MatrixDataTransformada | null, selectedRef: string | null) => {
  const handleExportar = useCallback(async () => {
    if (!matrixData || !selectedRef) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Análisis Curvas");

      const isGlobal = selectedRef === "ALL_HISTORICAL";
      const headers = [
        "Establecimiento", "Usuario",
        ...(isGlobal ? ["Fecha", "Referencia"] : []),
        ...matrixData.tallas, "TOTAL",
      ];
      const headerRow = worksheet.addRow(headers);

      headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF006ACC" } };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      });

      matrixData.filas.forEach((f, idx) => {
        const rowData = [
          f.tiendaNombre, f.usuarioNombre,
          ...(isGlobal ? [f.fecha, f.referencia] : []),
          ...matrixData.tallas.map((t) => f.tallas[t] || 0), f.total,
        ];
        const row = worksheet.addRow(rowData);

        if (idx % 2 === 1) {
          row.eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }; });
        }

        row.eachCell((cell, colIndex) => {
          cell.alignment = { vertical: "middle", horizontal: colIndex > 2 ? "center" : "left" };
          cell.border = { top: { style: "thin", color: { argb: "FFE2E8F0" } }, left: { style: "thin", color: { argb: "FFE2E8F0" } }, bottom: { style: "thin", color: { argb: "FFE2E8F0" } }, right: { style: "thin", color: { argb: "FFE2E8F0" } } };
        });
      });

      worksheet.columns = headers.map((h, i) => ({ header: h, key: h, width: i === 0 ? 30 : i === 1 ? 25 : 8 }));

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `analisis_${selectedRef.replace(/\s+/g, "_")}_${dayjs().format("YYYYMMDD")}.xlsx`);
    } catch (error) {
      console.error("Error generating Excel:", error);
    }
  }, [matrixData, selectedRef]);

  return { handleExportar };
};