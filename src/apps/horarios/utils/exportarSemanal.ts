import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Dayjs } from 'dayjs';
import { calcularMinutosSemanales, formatMinutes } from '../pages/reporte/ReporteUtils';
import { Tienda } from '../interfaces/horarios.interface';

export interface TramoSemana {
  start: string;
  end: string;
  label: string;
}

/**
 * Genera tramos quincenales/semanales óptimos según el rango seleccionado:
 * - Si es una quincena (hasta 16 días, ej: 11 al 25), divide en 2 Semanas Quincenales (Semana 1: 7 días, Semana 2: días restantes).
 * - Si es un rango más largo (un mes entero), divide en bloques de 7 días.
 */
export function getSemanasRango(inicio: Dayjs, fin: Dayjs): TramoSemana[] {
  const totalDias = fin.diff(inicio, 'day') + 1;
  const semanas: TramoSemana[] = [];

  // Si es un período quincenal típico (ej. 11 al 25, 15 o 16 días)
  if (totalDias >= 12 && totalDias <= 16) {
    const corteSemana1 = inicio.add(6, 'day'); // 7 días (ej. 11 al 17)
    
    semanas.push({
      start: inicio.format('YYYY-MM-DD'),
      end: corteSemana1.format('YYYY-MM-DD'),
      label: `${inicio.format('DD/MM')} - ${corteSemana1.format('DD/MM')}`
    });

    const inicioSemana2 = corteSemana1.add(1, 'day'); // (ej. 18 al 25)
    semanas.push({
      start: inicioSemana2.format('YYYY-MM-DD'),
      end: fin.format('YYYY-MM-DD'),
      label: `${inicioSemana2.format('DD/MM')} - ${fin.format('DD/MM')}`
    });

    return semanas;
  }

  // Si es un período regular (ej. mes completo), bloques estándar de 7 días
  let cursor = inicio.clone();
  while (cursor.isBefore(fin) || cursor.isSame(fin, 'day')) {
    const endSemana = cursor.add(6, 'day');
    const realEnd = endSemana.isAfter(fin, 'day') ? fin.clone() : endSemana;

    semanas.push({
      start: cursor.format('YYYY-MM-DD'),
      end: realEnd.format('YYYY-MM-DD'),
      label: `${cursor.format('DD/MM')} - ${realEnd.format('DD/MM')}`
    });

    cursor = realEnd.add(1, 'day');
  }

  return semanas;
}

interface ExportarSemanalParams {
  tiendaNombre: string;
  fechaInicio: Dayjs;
  fechaFin: Dayjs;
  empleados: any[];
  records: any[];
  tiendas?: Tienda[];
}

export async function exportarSemanalExcel({
  tiendaNombre,
  fechaInicio,
  fechaFin,
  empleados,
  records,
  tiendas = [],
}: ExportarSemanalParams) {
  const workbook = new ExcelJS.Workbook();
  const inicioStr = fechaInicio.format('DD/MM/YYYY');
  const finStr = fechaFin.format('DD/MM/YYYY');

  const worksheet = workbook.addWorksheet(`Reporte Quincenal-Semanal`);
  const semanas = getSemanasRango(fechaInicio, fechaFin);

  const tiendasMap = new Map<number, string>(tiendas.map(t => [Number(t.id), t.name]));

  // Ordenar empleados primero por Tienda (alfabéticamente) y luego por Nombre
  const empleadosOrdenados = [...empleados].sort((a, b) => {
    const tiendaA = a.storeId ? (tiendasMap.get(Number(a.storeId)) || `Tienda #${a.storeId}`) : 'Sin tienda';
    const tiendaB = b.storeId ? (tiendasMap.get(Number(b.storeId)) || `Tienda #${b.storeId}`) : 'Sin tienda';
    
    const compTienda = tiendaA.localeCompare(tiendaB, 'es', { sensitivity: 'base' });
    if (compTienda !== 0) return compTienda;

    const nombreA = a.nombre || '';
    const nombreB = b.nombre || '';
    return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
  });

  // 1. Encabezado principal
  worksheet.mergeCells('A1', `${String.fromCharCode(69 + semanas.length)}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `REPORTE DE HORAS TRABAJADAS - ${tiendaNombre.toUpperCase()}`;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '004680' },
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 35;

  // Subtítulo
  worksheet.mergeCells('A2', `${String.fromCharCode(69 + semanas.length)}2`);
  const subCell = worksheet.getCell('A2');
  subCell.value = `Período Quincenal del ${inicioStr} al ${finStr} | Generado: ${new Date().toLocaleDateString('es-CO')}`;
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '555555' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 20;

  worksheet.addRow([]); // Fila vacía

  // 2. Cabeceras de tabla
  const headers = ['Tienda', 'Empleado', 'Documento', 'Cargo'];
  semanas.forEach((sem, idx) => {
    headers.push(`Semana ${idx + 1}\n(${sem.label})`);
  });
  headers.push('Total');

  const headerRow = worksheet.addRow(headers);
  headerRow.height = 28;

  headerRow.eachCell((cell, colNumber) => {
    const isTotal = colNumber === headers.length;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: isTotal ? '137333' : 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isTotal ? 'E6F4EA' : '004680' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'CCCCCC' } },
      bottom: { style: 'medium', color: { argb: '004680' } },
      left: { style: 'thin', color: { argb: 'CCCCCC' } },
      right: { style: 'thin', color: { argb: 'CCCCCC' } },
    };
  });

  // 3. Filas de empleados ordenados por Tienda
  empleadosOrdenados.forEach((emp, index) => {
    const nombreEmpleado = emp.nombre || `Empleado #${emp.id}`;
    const documento = emp.documento || '--';
    const cargo = emp.cargo || 'Sin cargo';
    const tiendaEmp = emp.storeId ? (tiendasMap.get(Number(emp.storeId)) || `Tienda #${emp.storeId}`) : 'Sin tienda';

    let totalMinutesPeriod = 0;
    const rowValues: (string | number)[] = [tiendaEmp, nombreEmpleado, documento, cargo];

    semanas.forEach((sem) => {
      const minSemana = calcularMinutosSemanales(emp.id, sem.start, sem.end, records);
      totalMinutesPeriod += minSemana;
      rowValues.push(formatMinutes(minSemana));
    });

    rowValues.push(formatMinutes(totalMinutesPeriod));

    const row = worksheet.addRow(rowValues);
    row.height = 22;

    const isEven = index % 2 === 0;

    row.eachCell((cell, colNumber) => {
      const isTotal = colNumber === rowValues.length;
      cell.font = { name: 'Calibri', size: 10, bold: isTotal };
      cell.alignment = {
        horizontal: colNumber <= 4 ? 'left' : 'center',
        vertical: 'middle',
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isTotal ? 'F4FBF7' : isEven ? 'FFFFFF' : 'FAFCFF' },
      };
      if (isTotal) {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '137333' } };
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } },
      };
    });
  });

  // Ajustar anchos de columnas
  worksheet.getColumn(1).width = 24; // Tienda
  worksheet.getColumn(2).width = 30; // Empleado
  worksheet.getColumn(3).width = 16; // Documento
  worksheet.getColumn(4).width = 20; // Cargo
  for (let i = 5; i <= 4 + semanas.length; i++) {
    worksheet.getColumn(i).width = 22;
  }
  worksheet.getColumn(5 + semanas.length).width = 18; // Total

  // 4. Descargar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `Reporte_Quincenal_${tiendaNombre.replace(/\s+/g, '_')}_${fechaInicio.format('DDMMYYYY')}_a_${fechaFin.format('DDMMYYYY')}.xlsx`;
  saveAs(blob, fileName);
}
