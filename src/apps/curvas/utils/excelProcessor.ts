import * as XLSX from 'xlsx';
import type {
  MatrizGeneralCurvas,
  DetalleProducto,
  Tienda,
  FilaMatrizGeneral,
  FilaDetalleProducto,
  CeldaCurva,
  CeldaTalla,
  MetadatosProducto,
} from '../types';

const generateUUID = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    // Fallback para contextos no seguros (HTTP) o navegadores antiguos
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
};

/**
 * Utilidades para procesar archivos Excel de curvas
 */

// ============================================
// FUNCIONES DE LECTURA DE EXCEL
// ============================================

export const leerWorkbook = async (file: File): Promise<XLSX.WorkBook> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsArrayBuffer(file);
  });
};

export const hojaAMatriz = (worksheet: XLSX.WorkSheet, sheetName: string): unknown[][] => {
  const data: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
    raw: true,
  });



  return data;
};

const parseNumericValue = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;

  const str = String(value).trim().replace(/[^\d.,-]/g, '');
  if (str === '') return 0;

  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
    } else {
      return parseFloat(str.replace(/,/g, '')) || 0;
    }
  }
  if (str.includes(',')) return parseFloat(str.replace(',', '.')) || 0;
  return parseFloat(str) || 0;
};

const encontrarFilaEncabezados = (matriz: unknown[][], keywords: string[]): number => {
  for (let i = 0; i < Math.min(25, matriz.length); i++) {
    const row = matriz[i];
    if (!row || !Array.isArray(row)) continue;

    const rowStr = row.map(c => String(c || '').toLowerCase()).join('|');

    // Verificamos si contiene TIENDA o NOMBRE Y tiene números de tallas/curvas
    const hasTienda = keywords.slice(0, 2).some(k => rowStr.includes(k.toLowerCase()));
    const hasNumbers = row.some(cell => {
      const s = String(cell || '').trim();
      return /^(3[4-9]|4[0-6])$/.test(s) || /^(0[1-9]|1[0-9])$/.test(s);
    });

    if (hasTienda && (hasNumbers || rowStr.includes('total'))) {
      return i;
    }
  }
  return -1; // Retornar -1 si no se encuentra
};

// ============================================
// PROCESAMIENTO POR HOJA
// ============================================

const procesarHojaMatrizGeneral = (worksheet: XLSX.WorkSheet, sheetName: string, fileName: string): MatrizGeneralCurvas | null => {
  const matriz = hojaAMatriz(worksheet, sheetName);
  const headerIdx = encontrarFilaEncabezados(matriz, ['tienda', 'nombre']);

  if (headerIdx === -1) return null;

  const headers = (matriz[headerIdx] as unknown[]).map(h => String(h || '').trim());
  let tiendaCol = headers.findIndex(h => h.toLowerCase().includes('tienda') || h.toLowerCase().includes('nombre'));
  if (tiendaCol === -1) tiendaCol = 0;

  const curvasIndices: { name: string, idx: number }[] = [];
  let totalCol = -1;

  headers.forEach((h, i) => {
    if (i === tiendaCol) return;
    if (h.toLowerCase() === 'total') totalCol = i;
    else if (h !== '' && !h.startsWith('Columna_')) curvasIndices.push({ name: h, idx: i });
  });

  if (curvasIndices.length === 0) return null;

  const filas: FilaMatrizGeneral[] = [];
  const totales: Record<string, number> = {};
  curvasIndices.forEach((c) => totales[c.name] = 0);

  for (let i = headerIdx + 1; i < matriz.length; i++) {
    const row = matriz[i] as unknown[];
    if (!row || row.length === 0) continue;

    const nombre = String(row[tiendaCol] || '').trim();
    if (!nombre || nombre.toUpperCase() === 'TOTAL' || nombre.toUpperCase().includes('RESUMEN')) continue;

    const tienda: Tienda = { id: `G-${sheetName}-${i}`, codigo: `T-${i}`, nombre };
    const curvesData: Record<string, CeldaCurva> = {};
    let sum = 0;

    curvasIndices.forEach((c) => {
      const val = parseNumericValue(row[c.idx]);
      curvesData[c.name] = { valor: val, esCero: val === 0, esMayorQueCero: val > 0 };
      totales[c.name] += val;
      sum += val;
    });

    filas.push({ id: `excel-${tienda.id}`, tienda, curvas: curvesData, total: totalCol !== -1 ? parseNumericValue(row[totalCol]) : sum });
  }

  if (filas.length === 0) return null;

  return {
    id: generateUUID(),
    nombreHoja: sheetName,
    referencia: fileName,
    filas,
    curvas: curvasIndices.map(c => c.name),
    totalesPorCurva: totales,
    totalGeneral: filas.reduce((acc, f) => acc + f.total, 0),
    fechaCarga: new Date(),
    estado: 'borrador'
  };
};

const procesarHojaDetalleProducto = (worksheet: XLSX.WorkSheet, sheetName: string, tipo: 'detalle_producto_a' | 'detalle_producto_b'): DetalleProducto | null => {
  const matriz = hojaAMatriz(worksheet, sheetName);
  const metadatos: MetadatosProducto = { referencia: '', imagen: '', color: '', material: '', marca: '', proveedor: '', precio: 0, linea: '' };

  const extraerValorValido = (r: unknown[], startIdx: number): string => {
    for (let k = startIdx; k < Math.min(r.length, startIdx + 5); k++) {
      const v = String(r[k] || '').trim();
      if (v && !v.includes(':') && !v.includes('.')) return v;
    }
    return '';
  };

  for (let i = 0; i < Math.min(20, matriz.length); i++) {
    const row = matriz[i] as unknown[];
    if (!row) continue;
    row.forEach((cell, j) => {
      const s = String(cell || '').toUpperCase();
      if (s.includes('REF')) {
        const parts = s.split(/REF[.: ]+/i);
        if (parts.length > 1 && parts[1].trim()) metadatos.referencia = parts[1].trim();
        else metadatos.referencia = extraerValorValido(row, j + 1);
      }
      if (s.includes('COLOR')) {
        const parts = s.split(/COLOR[.: ]+/i);
        if (parts.length > 1 && parts[1].trim()) metadatos.color = parts[1].trim();
        else metadatos.color = extraerValorValido(row, j + 1);
      }
      if (s.includes('MATERIAL')) {
        const parts = s.split(/MATERIAL[.: ]+/i);
        if (parts.length > 1 && parts[1].trim()) metadatos.material = parts[1].trim();
        else metadatos.material = extraerValorValido(row, j + 1);
      }
      if (s.includes('MARCA')) {
        const parts = s.split(/MARCA[.: ]+/i);
        if (parts.length > 1 && parts[1].trim()) metadatos.marca = parts[1].trim();
        else metadatos.marca = extraerValorValido(row, j + 1);
      }
      if (s.includes('PROVEEDOR')) {
        const parts = s.split(/PROVEEDOR[.: ]+/i);
        if (parts.length > 1 && parts[1].trim()) metadatos.proveedor = parts[1].trim();
        else metadatos.proveedor = extraerValorValido(row, j + 1);
      }
      if (s.includes('LINEA') || s.includes('LÍNEA')) {
        const parts = s.split(/L[ÍI]NEA[.: ]+/i);
        if (parts.length > 1 && parts[1].trim()) metadatos.linea = parts[1].trim();
        else metadatos.linea = extraerValorValido(row, j + 1);
      }
      if (s.includes('$') || (typeof cell === 'number' && cell > 1000 && i < 10)) {
        if (typeof cell === 'number' && cell > 1000) metadatos.precio = cell;
        else {
          const valorExt = s.replace(/[^0-9]/g, '');
          if (valorExt.length > 3) metadatos.precio = parseInt(valorExt, 10);
          else {
            const nextVal = parseNumericValue(row[j + 1]);
            if (nextVal > 1000) metadatos.precio = nextVal;
          }
        }
      }
    });
  }

  const headerIdx = encontrarFilaEncabezados(matriz, ['tienda', 'nombre']);
  if (headerIdx === -1) return null;

  const headers = (matriz[headerIdx] as unknown[]).map(h => String(h || '').trim());
  let tiendaCol = headers.findIndex(h => h.toLowerCase().includes('tienda') || h.toLowerCase().includes('nombre'));
  if (tiendaCol === -1) tiendaCol = 0;

  const tallasIndices: { name: string, idx: number }[] = [];
  let totalCol = -1;

  headers.forEach((h, i) => {
    if (i === tiendaCol) return;
    if (h.toLowerCase() === 'total') totalCol = i;
    else if (h !== '' && (/^(3[4-9]|4[0-6])$/.test(h) || /^(0[1-9]|1[0-9])$/.test(h))) tallasIndices.push({ name: h, idx: i });
  });

  if (tallasIndices.length === 0) return null;

  const filas: FilaDetalleProducto[] = [];
  const totales: Record<string, number> = {};
  tallasIndices.forEach(t => totales[t.name] = 0);

  for (let i = headerIdx + 1; i < matriz.length; i++) {
    const row = matriz[i] as unknown[];
    if (!row || row.length === 0) continue;
    const nombre = String(row[tiendaCol] || '').trim();
    if (!nombre || nombre.toUpperCase() === 'TOTAL') continue;

    const tienda: Tienda = { id: `${tipo}-${sheetName}-${i}`, codigo: `T-${i}`, nombre };
    const tallasData: Record<string, CeldaTalla> = {};
    let sum = 0;
    tallasIndices.forEach(t => {
      const val = parseNumericValue(row[t.idx]);
      tallasData[t.name] = { valor: val, esCero: val === 0, esMayorQueCero: val > 0 };
      totales[t.name] += val;
      sum += val;
    });
    filas.push({ id: `excel-${tienda.id}`, tienda, tallas: tallasData, total: totalCol !== -1 ? parseNumericValue(row[totalCol]) : sum });
  }

  if (filas.length === 0) return null;

  metadatos.imagen = `https://placehold.co/400x400/f3f4f6/1f2937?text=${metadatos.referencia || 'PRODUCTO'}`;

  return {
    id: generateUUID(),
    nombreHoja: sheetName,
    metadatos,
    filas,
    tallas: tallasIndices.map(t => t.name),
    totalesPorTalla: totales,
    totalGeneral: filas.reduce((acc, f) => acc + f.total, 0),
    fechaCarga: new Date(),
    estado: 'borrador'
  };
};

// ============================================
// EXPORTADOS (MULTIPLE HOJAS)
// ============================================

export const procesarMatrizGeneral = async (file: File): Promise<MatrizGeneralCurvas[]> => {
  const workbook = await leerWorkbook(file);
  const resultados: MatrizGeneralCurvas[] = [];

  workbook.SheetNames.forEach(name => {
    const res = procesarHojaMatrizGeneral(workbook.Sheets[name], name, file.name);
    if (res) resultados.push(res);
  });

  return resultados;
};

export const procesarDetalleProducto = async (file: File, tipo: 'detalle_producto_a' | 'detalle_producto_b'): Promise<DetalleProducto[]> => {
  const workbook = await leerWorkbook(file);
  const resultados: DetalleProducto[] = [];

  workbook.SheetNames.forEach(name => {
    const res = procesarHojaDetalleProducto(workbook.Sheets[name], name, tipo);
    if (res) resultados.push(res);
  });

  return resultados;
};

export const validarEstructuraExcel = async (file: File): Promise<{ valido: boolean; errores: string[]; advertencias: string[] }> => {
  try {
    const workbook = await leerWorkbook(file);
    return { valido: !!workbook.SheetNames.length, errores: [], advertencias: [] };
  } catch (e) {
    return { valido: false, errores: ['Archivo no procesable'], advertencias: [] };
  }
};

export default { leerWorkbook, hojaAMatriz, procesarMatrizGeneral, procesarDetalleProducto, validarEstructuraExcel };
