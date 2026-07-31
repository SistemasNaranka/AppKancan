import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { calcularMinutosSemanales } from '../pages/reporte/ReporteUtils';
import { Tienda } from '../interfaces/horarios.interface';

const formatMinutesExport = (totalMin: number): string => {
  if (totalMin <= 0) return '00:00';
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  const hh = String(hours).padStart(2, '0');
  const mm = String(mins).padStart(2, '0');
  return `${hh}:${mm}`;
};

import { calcularMinutosDia } from '../components/ModalDetalleTiendaUtils';

export interface TramoSemana {
  start: string;
  end: string;
  label: string;
}

/**
 * Genera tramos quincenales/semanales óptimos según el rango seleccionado:
 * - Si es una quincena (hasta 16 días, ej: 11 al 25), divide en 2 Semanas Quincenales (Semana 1: 7 días, Semana 2: días restantes).
 * - Si es un período más largo (un mes entero), divide en bloques de 7 días.
 */
export function getSemanasRango(
  inicio: Dayjs, 
  fin: Dayjs, 
  diaInicio: number = 1, 
  diaFin: number = 0
): TramoSemana[] {
  const totalDias = fin.diff(inicio, 'day') + 1;

  if (totalDias >= 12 && totalDias <= 16) {
    const corteSemana1 = inicio.add(6, 'day');
    const semanas: TramoSemana[] = [
      {
        start: inicio.format('YYYY-MM-DD'),
        end: corteSemana1.format('YYYY-MM-DD'),
        label: `${inicio.format('DD-MM-YYYY')} - ${corteSemana1.format('DD-MM-YYYY')}`
      }
    ];

    const inicioSemana2 = corteSemana1.add(1, 'day');
    semanas.push({
      start: inicioSemana2.format('YYYY-MM-DD'),
      end: fin.format('YYYY-MM-DD'),
      label: `${inicioSemana2.format('DD-MM-YYYY')} - ${fin.format('DD-MM-YYYY')}`
    });

    return semanas;
  }

  let diff = inicio.day() - diaInicio;
  if (diff < 0) diff += 7;
  let currentStart = inicio.subtract(diff, 'day');

  let daysSpan = diaFin - diaInicio;
  if (diaInicio === diaFin) {
    daysSpan = 6;
  } else if (daysSpan < 0) {
    daysSpan += 7;
  }

  const semanas: TramoSemana[] = [];
  while (currentStart.isBefore(fin) || currentStart.isSame(fin, 'day')) {
    const currentEnd = currentStart.add(daysSpan, 'day');
    const realEnd = currentEnd.isAfter(fin, 'day') ? fin.clone() : currentEnd;

    semanas.push({
      start: currentStart.format('YYYY-MM-DD'),
      end: realEnd.format('YYYY-MM-DD'),
      label: `${currentStart.format('DD-MM-YYYY')} - ${realEnd.format('DD-MM-YYYY')}`
    });

    currentStart = currentStart.add(7, 'day');
  }

  return semanas;
}

interface ExportarSemanalParams {
  tiendaNombre: string;
  fechaInicio: Dayjs;
  fechaFin: Dayjs;
  empleados: any[];
  records: any[];
  novedades?: any[];
  storeClosedDays?: any[];
  tiendas?: Tienda[];
  diaInicioSemana?: number;
  diaFinSemana?: number;
  modoGranularidad?: 'semanal' | 'diario';
}

export async function exportarSemanalExcel({
  tiendaNombre: _tiendaNombre,
  fechaInicio,
  fechaFin,
  empleados,
  records,
  novedades = [],
  storeClosedDays = [],
  tiendas = [],
  diaInicioSemana = 1,
  diaFinSemana = 0,
  modoGranularidad = 'semanal',
}: ExportarSemanalParams) {
  const workbook = new ExcelJS.Workbook();
  const tiendasMap = new Map<number, string>(tiendas.map(t => [Number(t.id), t.name]));

  // Preparar listado de empleados agrupando sus tiendas trabajadas
  const empleadosProcesados = empleados.map((emp) => {
    const recordsEmp = records.filter(r => Number(r.employee_id?.id || r.employee_id) === Number(emp.id));
    const storeIdsLaboradas = new Set<number>();

    if (emp.storeId) storeIdsLaboradas.add(Number(emp.storeId));

    recordsEmp.forEach(r => {
      const stId = Number(r.store_id?.id || r.store_id);
      if (Number.isFinite(stId) && stId > 0) storeIdsLaboradas.add(stId);
    });

    const nombresTiendas = Array.from(storeIdsLaboradas)
      .map(id => tiendasMap.get(id) || `Tienda #${id}`)
      .filter(Boolean);

    const tiendasTexto = nombresTiendas.length > 0 ? nombresTiendas.join(' / ') : 'Sin tienda';

    return {
      ...emp,
      storeIdsLaboradas,
      tiendasTexto,
      tiendaPrincipal: nombresTiendas[0] || 'Sin tienda',
    };
  });

  // Ordenar empleados primero por la primera tienda y luego por Nombre
  const empleadosOrdenados = [...empleadosProcesados].sort((a, b) => {
    const compTienda = a.tiendaPrincipal.localeCompare(b.tiendaPrincipal, 'es', { sensitivity: 'base' });
    if (compTienda !== 0) return compTienda;

    const nombreA = a.nombre || '';
    const nombreB = b.nombre || '';
    return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
  });

  // --- MODO DÍA A DÍA ---
  if (modoGranularidad === 'diario') {
    const worksheet = workbook.addWorksheet(`Reporte Diario`);

    // Días del rango
    const dias: Dayjs[] = [];
    let curr = fechaInicio.clone();
    while (curr.isBefore(fechaFin) || curr.isSame(fechaFin, 'day')) {
      dias.push(curr.clone());
      curr = curr.add(1, 'day');
    }

    // Mapa de novedades: clave `empId_YYYY-MM-DD` y `doc_DOCUMENTO_YYYY-MM-DD`
    const novedadesMap = new Map<string, string>();
    if (novedades && novedades.length > 0) {
      novedades.forEach((n: any) => {
        const rawDate = n.report_date || n.date_created || n.date || '';
        const f = rawDate ? dayjs(rawDate).format('YYYY-MM-DD') : '';
        const empObj = typeof n.employee_id === 'object' ? n.employee_id : null;
        const empId = Number(empObj?.id || empObj?.employee_id || (typeof n.employee_id !== 'object' ? n.employee_id : 0));
        const docNum = empObj?.document_number || empObj?.documento || n.document_number || n.documento;
        const nombreNov = n.newness_id?.name || n.tipo || n.newness || 'Novedad';

        if (Number.isFinite(empId) && empId > 0 && f) {
          novedadesMap.set(`${empId}_${f}`, nombreNov);
        }
        if (docNum && f) {
          novedadesMap.set(`doc_${String(docNum).trim()}_${f}`, nombreNov);
        }
      });
    }

    // Mapa de días cerrados por tienda: Set de `${storeId}_YYYY-MM-DD`
    const closedDaysSet = new Set<string>();
    if (storeClosedDays && storeClosedDays.length > 0) {
      storeClosedDays.forEach((cd: any) => {
        const stId = Number(typeof cd.store_id === 'object' ? cd.store_id?.id : cd.store_id);
        const rawDate = cd.date || cd.report_date || '';
        const dateStr = rawDate ? dayjs(rawDate).format('YYYY-MM-DD') : '';
        const isActive = cd.status !== false;
        if (stId && dateStr && isActive) {
          closedDaysSet.add(`${stId}_${dateStr}`);
        }
      });
    }

    // Cabeceras
    const headers = ['Tiendas', 'Empleado', 'Documento', 'Cargo'];
    dias.forEach((d) => {
      headers.push(`${d.format('DD-MM-YYYY')}\n(${d.locale('es').format('dddd')})`);
    });
    headers.push('Total Horas', 'Días Trab.', 'Novedades');

    const headerRow = worksheet.addRow(headers);
    headerRow.height = 32;

    headerRow.eachCell((cell, colNumber) => {
      const isMeta = colNumber > headers.length - 3;
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: isMeta ? '137333' : 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isMeta ? 'E6F4EA' : '004680' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'CCCCCC' } },
        bottom: { style: 'medium', color: { argb: '004680' } },
        left: { style: 'thin', color: { argb: 'CCCCCC' } },
        right: { style: 'thin', color: { argb: 'CCCCCC' } },
      };
    });

    // Filas de empleados
    empleadosOrdenados.forEach((emp, index) => {
      const nombreEmpleado = emp.nombre || `Empleado #${emp.id}`;
      const documento = emp.documento || '--';
      const cargo = emp.cargo || 'Sin cargo';
      const tiendasTexto = emp.tiendasTexto || 'Sin tienda';

      const recordsEmp = records.filter((r: any) => Number(r.employee_id?.id || r.employee_id) === Number(emp.id));

      let totalMinutesPeriod = 0;
      let diasTrabajados = 0;
      let totalNovedadesEmp = 0;

      const rowValues: (string | number)[] = [tiendasTexto, nombreEmpleado, documento, cargo];
      const cellStyles: { styleType: 'cerrado_con_marcacion' | 'cerrado_con_novedad' | 'cerrado_sin_marcacion' | 'novedad' | 'horas' | 'vacio' }[] = [];

      dias.forEach((d) => {
        const dateStr = d.format('YYYY-MM-DD');
        const recordsDia = recordsEmp.filter((r: any) => r.record_date === dateStr);
        const minDia = calcularMinutosDia(recordsDia, emp.id);
        const docKey = emp.documento ? String(emp.documento).trim() : '';
        const novedadNombre = novedadesMap.get(`${emp.id}_${dateStr}`) || (docKey ? novedadesMap.get(`doc_${docKey}_${dateStr}`) : undefined);

        const storeIdsCheck: number[] = (emp.storeIdsLaboradas
          ? Array.from(emp.storeIdsLaboradas)
          : emp.storeId
            ? [Number(emp.storeId)]
            : []).filter(Boolean) as number[];
        const isTiendaCerrada = storeIdsCheck.some((stId: number) => closedDaysSet.has(`${stId}_${dateStr}`));

        let cellText = '-';
        let styleType: 'cerrado_con_marcacion' | 'cerrado_con_novedad' | 'cerrado_sin_marcacion' | 'novedad' | 'horas' | 'vacio' = 'vacio';

        if (isTiendaCerrada) {
          if (minDia > 0) {
            totalMinutesPeriod += minDia;
            diasTrabajados++;
            cellText = novedadNombre 
              ? `${formatMinutesExport(minDia)} (${novedadNombre} - Tienda Cerrada)` 
              : `${formatMinutesExport(minDia)} (Tienda Cerrada)`;
            styleType = 'cerrado_con_marcacion';
          } else if (novedadNombre) {
            totalNovedadesEmp++;
            cellText = `${novedadNombre} (Tienda Cerrada)`;
            styleType = 'cerrado_con_novedad';
          } else {
            cellText = 'Tienda Cerrada';
            styleType = 'cerrado_sin_marcacion';
          }
        } else {
          if (minDia > 0) {
            totalMinutesPeriod += minDia;
            diasTrabajados++;
            if (novedadNombre) {
              totalNovedadesEmp++;
              cellText = `${formatMinutesExport(minDia)} (${novedadNombre})`;
              styleType = 'novedad';
            } else {
              cellText = formatMinutesExport(minDia);
              styleType = 'horas';
            }
          } else if (novedadNombre) {
            totalNovedadesEmp++;
            cellText = novedadNombre;
            styleType = 'novedad';
          } else {
            cellText = '-';
            styleType = 'vacio';
          }
        }

        rowValues.push(cellText);
        cellStyles.push({ styleType });
      });

      rowValues.push(formatMinutesExport(totalMinutesPeriod), diasTrabajados, totalNovedadesEmp);

      const row = worksheet.addRow(rowValues);
      row.height = 22;
      const isEven = index % 2 === 0;

      row.eachCell((cell, colNumber) => {
        const isHeaderCol = colNumber <= 4;
        const isMetaCol = colNumber > 4 + dias.length;
        const dayIdx = colNumber - 5;

        cell.font = { name: 'Calibri', size: 10, bold: isMetaCol };
        cell.alignment = {
          horizontal: isHeaderCol ? 'left' : 'center',
          vertical: 'middle',
        };

        if (isMetaCol) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F4FBF7' } };
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '137333' } };
        } else if (!isHeaderCol && dayIdx >= 0 && dayIdx < cellStyles.length) {
          const styleType = cellStyles[dayIdx].styleType;
          if (styleType === 'cerrado_con_marcacion' || styleType === 'cerrado_con_novedad') {
            // Tienda cerrada con marcación o novedad -> Fondo Rojo Suave (#FFEBEE), Texto Rojo Oscuro (#B71C1C)
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBEE' } };
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'B71C1C' } };
          } else if (styleType === 'cerrado_sin_marcacion') {
            // Tienda cerrada sin marcaciones -> Fondo Gris Suave (#F3F4F6), Texto Gris Oscuro (#475569)
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } };
            cell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '475569' } };
          } else if (styleType === 'novedad') {
            // Novedad normal -> Fondo Verde Suave (#E8F5E9), Texto Verde Oscuro (#1B5E20)
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } };
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '1B5E20' } };
          } else if (styleType === 'horas') {
            // Día trabajado normal
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFFFFF' : 'FAFCFF' } };
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '0F2C4A' } };
          } else {
            // Día vacío / sin marcación
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFFFFF' : 'FAFCFF' } };
            cell.font = { name: 'Calibri', size: 10, color: { argb: '94A3B8' } };
          }
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFFFFF' : 'FAFCFF' } };
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
    worksheet.getColumn(1).width = 30; // Tiendas
    worksheet.getColumn(2).width = 28; // Empleado
    worksheet.getColumn(3).width = 16; // Documento
    worksheet.getColumn(4).width = 20; // Cargo
    for (let i = 5; i <= 4 + dias.length; i++) {
      worksheet.getColumn(i).width = 16; // Día
    }
    worksheet.getColumn(5 + dias.length).width = 18; // Total Horas
    worksheet.getColumn(6 + dias.length).width = 16; // Días Trab.
    worksheet.getColumn(7 + dias.length).width = 16; // Novedades

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const timestamp = dayjs().format('YYYYMMDD-HHmmss');
    const fileName = `Reporte_Diario_Horarios_${timestamp}.xlsx`;
    saveAs(blob, fileName);
    return;
  }

  // --- MODO ACUMULADO POR SEMANAS (DEFAULT) ---
  const worksheet = workbook.addWorksheet(`Reporte Semanal`);
  const semanas = getSemanasRango(fechaInicio, fechaFin, diaInicioSemana, diaFinSemana);

  // 1. Cabeceras de tabla directamente en la fila 1
  const headers = ['Tiendas', 'Empleado', 'Documento', 'Cargo'];
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

  // 2. Filas de empleados
  empleadosOrdenados.forEach((emp, index) => {
    const nombreEmpleado = emp.nombre || `Empleado #${emp.id}`;
    const documento = emp.documento || '--';
    const cargo = emp.cargo || 'Sin cargo';
    const tiendasTexto = emp.tiendasTexto || 'Sin tienda';

    let totalMinutesPeriod = 0;
    const rowValues: (string | number)[] = [tiendasTexto, nombreEmpleado, documento, cargo];

    semanas.forEach((sem) => {
      const minSemana = calcularMinutosSemanales(emp.id, sem.start, sem.end, records);
      totalMinutesPeriod += minSemana;
      rowValues.push(formatMinutesExport(minSemana));
    });

    rowValues.push(formatMinutesExport(totalMinutesPeriod));

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
  worksheet.getColumn(1).width = 32; // Tienda(s) Laborada(s)
  worksheet.getColumn(2).width = 30; // Empleado
  worksheet.getColumn(3).width = 16; // Documento
  worksheet.getColumn(4).width = 20; // Cargo
  for (let i = 5; i <= 4 + semanas.length; i++) {
    worksheet.getColumn(i).width = 22;
  }
  worksheet.getColumn(5 + semanas.length).width = 20; // Total

  // 5. Descargar archivo con nombre estandarizado y timestamp (YYYYMMDD-HHmmss)
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const timestamp = dayjs().format('YYYYMMDD-HHmmss');
  const fileName = `Reporte_Semanal_Horarios_${timestamp}.xlsx`;
  saveAs(blob, fileName);
}
