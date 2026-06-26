import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { EventReportExport } from "../api/directus/read";
import { Tienda } from "../interfaces/horarios.interface";

const DELIM = ";";

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

const csvCampo = (valor: string): string => {
  const v = valor ?? "";
  if (v.includes(DELIM) || v.includes('"') || v.includes("\n") || v.includes("\r")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
};

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

  filas.sort(
    (a, b) =>
      a.tienda.localeCompare(b.tienda) ||
      a.fechaOrden.localeCompare(b.fechaOrden) ||
      a.hora.localeCompare(b.hora) ||
      a.empleado.localeCompare(b.empleado)
  );

  const columnas: { key: keyof FilaExport; header: string }[] = [
    { key: "tienda", header: "Tienda" },
    { key: "cc", header: "Número CC" },
    { key: "empleado", header: "Nombre empleado" },
    { key: "fecha", header: "Fecha" },
    { key: "hora", header: "Hora" },
    { key: "evento", header: "Evento" },
    { key: "observacion", header: "Observacion" },
  ];

  const lineas: string[] = [];
  lineas.push(columnas.map((c) => csvCampo(c.header)).join(DELIM));
  filas.forEach((fila) => {
    lineas.push(columnas.map((c) => csvCampo(String(fila[c.key] ?? ""))).join(DELIM));
  });

  const contenido = "﻿" + lineas.join("\r\n");
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `eventos ${dayjs().format("YYYYMMDD-HHmmss")}.csv`);

  return { ok: true };
};
