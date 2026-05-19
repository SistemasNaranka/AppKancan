// src/apps/contactos/utils/exportarContactos.ts
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Contactos } from "../types/contact";

export const exportarContactosExcel = async (
  data: Contactos[],
  onError?: (mensaje: string, tipo: "success" | "error") => void,
): Promise<void> => {
  if (data.length === 0) {
    if (onError) onError("No hay datos para exportar", "error");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Directorio de Contactos");

  // Definir columnas basadas en tu interfaz Contactos
  worksheet.columns = [
    { header: "Nombre Completo", key: "full_name", width: 30 },
    { header: "Correo Electrónico", key: "email", width: 25 },
    { header: "Teléfono", key: "phone_number", width: 15 },
    { header: "Departamento", key: "department", width: 20 },
    { header: "Visibilidad", key: "visibility_type", width: 15 },
    { header: "Fecha de Creación", key: "date_created", width: 20 },
  ];

  // Estilo del encabezado
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "004a99" }, // Tu azul institucional
  };

  // Agregar los datos
  data.forEach((item) => {
    worksheet.addRow({
      full_name: item.full_name,
      email: item.email,
      phone_number: item.phone_number,
      department: item.department,
      visibility_type: item.visibility_type,
      date_created: item.date_created ? new Date(item.date_created).toLocaleDateString() : "N/A",
    });
  });

  // Generar y descargar el archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const blob = new Blob([buffer], { type: fileType });
  saveAs(blob, `Directorio_Contactos_${new Date().getTime()}.xlsx`);
};