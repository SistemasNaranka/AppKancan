import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Resolucion } from "../types";

export const exportarAExcel = async (
  dataExportar: Resolucion[],
  onError?: (mensaje: string, tipo: "success" | "error") => void,
): Promise<void> => {
  if (dataExportar.length === 0) {
    if (onError) {
      onError("No hay datos para exportar", "error");
    }
    return;
  }

  // Crear libro y hoja
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Resoluciones");

  // Definir columnas
  const columnas = [
    { key: "numero_formulario", header: "Resolución" },
    { key: "razon_social", header: "Razón Social" },
    { key: "prefijo", header: "Prefijo" },
    { key: "tienda_nombre", header: "Tienda" },
    { key: "desde_numero", header: "Desde" },
    { key: "hasta_numero", header: "Hasta" },
    { key: "vigencia", header: "Vigencia" },
    { key: "fecha_creacion", header: "Fecha" },
    { key: "fecha_vencimiento", header: "Fecha Vencimiento" },
    { key: "estado", header: "Estado" },
  ];

  // Configurar columnas en la hoja
  worksheet.columns = columnas.map((col) => ({
    header: col.header,
    key: col.key,
    width: 20,
  }));

  // Estilo del encabezado
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4F81BD" },
    };
    cell.font = {
      bold: true,
      color: { argb: "FFFFFF" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Agregar datos
  dataExportar.forEach((resolucion) => {
    const row = worksheet.addRow({
      numero_formulario: resolucion.numero_formulario,
      razon_social: resolucion.razon_social,
      prefijo: resolucion.prefijo,
      tienda_nombre: resolucion.tienda_nombre,
      desde_numero: resolucion.desde_numero,
      hasta_numero: resolucion.hasta_numero,
      vigencia: resolucion.vigencia,
      fecha_creacion: resolucion.fecha_creacion,
      fecha_vencimiento: resolucion.fecha_vencimiento,
      estado: resolucion.estado,
    });

    // Estilo de las celdas de datos
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = {
        vertical: "top",
      };
    });
  });

  // Auto-ajustar ancho de columnas
  worksheet.columns.forEach((column) => {
    if (column.values) {
      let maxLength = 10;
      column.values.forEach((value) => {
        if (value) {
          const length = String(value).length;
          if (length > maxLength) {
            maxLength = length;
          }
        }
      });
      column.width = maxLength + 2;
    }
  });

  // Agregar filtros
  worksheet.autoFilter = {
    from: "A1",
    to: `J${dataExportar.length + 1}`,
  };

  // Congelar encabezado
  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  // Generar archivo y descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `resoluciones_${new Date().toISOString().split("T")[0]}.xlsx`);
};
