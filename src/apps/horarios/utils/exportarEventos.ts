import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { EventReportExport } from "../api/directus/read";
import { Tienda } from "../interfaces/horarios.interface";

const nombreEmpleado = (emp: EventReportExport["employee_id"]): string =>
  emp
    ? [emp.first_name, emp.middle_name, emp.last_name, emp.second_last_name]
        .filter((n) => n && String(n).trim())
        .join(" ")
    : "Sin nombre";

interface FilaExport {
  tienda: string;
  cc: string;
  empleado: string;
  fecha: string;
  fechaOrden: string;
  hora: string;
  evento: string;
  observacion: string;
}

interface ExportarParams {
  reports: EventReportExport[];
  stores: Tienda[];
}

export const exportarEventosExcel = async ({
  reports,
  stores,
}: ExportarParams): Promise<{ ok: boolean; mensaje?: string }> => {
  const storesMap = new Map<number, string>(stores.map((s) => [Number(s.id), s.name]));

  const filas: FilaExport[] = reports.map((ev) => {
    const fechaRaw = (ev.date ?? "").slice(0, 10);
    return {
      tienda: storesMap.get(Number(ev.store_id)) || String(ev.store_id ?? ""),
      cc: String(ev.employee_id?.document_number ?? ""),
      empleado: nombreEmpleado(ev.employee_id),
      fecha: fechaRaw ? dayjs(fechaRaw).format("DD-MM-YYYY") : "",
      fechaOrden: fechaRaw,
      hora: ev.hour ? String(ev.hour).slice(0, 5) : "",
      evento: ev.event_type || "",
      observacion: ev.observations || "",
    };
  });

  if (filas.length === 0) {
    return { ok: false, mensaje: "No hay datos para exportar con los filtros seleccionados" };
  }

  // Ordenar por tienda, luego por fecha y hora
  filas.sort(
    (a, b) =>
      a.tienda.localeCompare(b.tienda) ||
      a.fechaOrden.localeCompare(b.fechaOrden) ||
      a.hora.localeCompare(b.hora) ||
      a.empleado.localeCompare(b.empleado)
  );

  // Obtener tiendas únicas presentes en los datos
  const tiendasUnicas = Array.from(new Set(filas.map((f) => f.tienda)));

  // Inicializar libro Excel
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Pausas Activas");

  // Configurar anchos de columna por defecto
  worksheet.getColumn(1).width = 15; // Número CC
  worksheet.getColumn(2).width = 30; // Nombre empleado
  worksheet.getColumn(3).width = 12; // Fecha
  worksheet.getColumn(4).width = 10; // Hora
  worksheet.getColumn(5).width = 20; // Evento
  worksheet.getColumn(6).width = 45; // Observación

  // Generar la estructura agrupada por tienda
  tiendasUnicas.forEach((storeName) => {
    // 1. Agregar fila de encabezado de tienda (Combinada/Merged)
    const storeHeaderRow = worksheet.addRow([storeName]);
    worksheet.mergeCells(storeHeaderRow.number, 1, storeHeaderRow.number, 6);
    
    const storeCell = storeHeaderRow.getCell(1);
    storeCell.font = { bold: true, color: { argb: "FFFFFF" }, size: 12 };
    storeCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "004680" }, // Azul institucional
    };
    storeCell.alignment = { horizontal: "center", vertical: "middle" };
    storeHeaderRow.height = 26;

    // 2. Agregar fila de títulos de columna
    const columnHeaders = ["Número CC", "Nombre empleado", "Fecha", "Hora", "Evento", "Observación"];
    const headersRow = worksheet.addRow(columnHeaders);
    headersRow.height = 20;
    
    headersRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "333333" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "E2E8F0" }, // Gris claro
      };
      cell.border = {
        top: { style: "thin", color: { argb: "CBD5E1" } },
        left: { style: "thin", color: { argb: "CBD5E1" } },
        bottom: { style: "medium", color: { argb: "94A3B8" } },
        right: { style: "thin", color: { argb: "CBD5E1" } },
      };
      cell.alignment = { vertical: "middle" };
    });

    // 3. Agregar los registros de esta tienda
    const registrosTienda = filas.filter((f) => f.tienda === storeName);
    registrosTienda.forEach((reg) => {
      const dataRow = worksheet.addRow([
        reg.cc,
        reg.empleado,
        reg.fecha,
        reg.hora,
        reg.evento,
        reg.observacion,
      ]);
      dataRow.height = 18;
      dataRow.eachCell((cell) => {
        cell.border = {
          bottom: { style: "thin", color: { argb: "E2E8F0" } },
          left: { style: "thin", color: { argb: "F1F5F9" } },
          right: { style: "thin", color: { argb: "F1F5F9" } },
        };
        cell.alignment = { vertical: "middle" };
      });
    });

    // 4. Agregar espacio de separación (2 filas en blanco)
    worksheet.addRow([]);
    worksheet.addRow([]);
  });

  // Generar y descargar el buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const blob = new Blob([buffer], { type: fileType });
  saveAs(blob, `pausas_activas_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);

  return { ok: true };
};
