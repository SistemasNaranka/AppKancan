// ============================================
// CONSTANTES, TIPOS Y UTILIDADES PARA ENVIOSPAGE
// ============================================

import type { FilaMatrizGeneral, FilaDetalleProducto } from '../types';

// ─────────────────────────────────────────────
// Brand & Design Tokens
// ─────────────────────────────────────────────
export const BRAND = {
  primary: '#006ACC',
  dark: '#004680',
  light: '#B8DCFF',
  bg: '#E6F4FF',
};

export const MAIN_FONT = "'Inter', sans-serif";
export const MONO_FONT = "'Roboto Mono', 'Consolas', monospace";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type SheetCategory = 'general' | 'producto_a' | 'producto_b';

export interface SheetData {
  id?: string;
  nombreHoja: string;
  referencia?: string;
  metadatos?: {
    referencia?: string;
    color?: string;
    imagen?: string;
    proveedor?: string;
    precio?: number;
    linea?: string;
    [key: string]: unknown;
  };
  filas: (FilaMatrizGeneral | FilaDetalleProducto)[];
  curvas?: string[];
  totalesPorCurva?: Record<string, number>;
  tallas?: string[];
  totalesPorTalla?: Record<string, number>;
  totalGeneral: number;
  estado?: 'borrador' | 'confirmado';
  fechaCarga?: Date;
}

export interface ConfirmedEntry {
  category: SheetCategory;
  label: string;
  icon: React.ReactElement;
  accent: string;
  sheet: SheetData;
  columns: string[];
  getRowColumns: (fila: any) => Record<string, number>;
  columnTotals: Record<string, number>;
}

// ─────────────────────────────────────────────
// Category config
// ─────────────────────────────────────────────
export const CATEGORY_CONFIG: Record<SheetCategory, { label: string; icon: React.ReactNode; accent: string; chipColor: string }> = {
  general: { label: 'Matriz General', icon: null as any, accent: BRAND.primary, chipColor: BRAND.bg },
  producto_a: { label: 'Plantilla de Producto', icon: null as any, accent: '#0891b2', chipColor: '#e0f7fa' },
  producto_b: { label: 'Plantilla de Producto', icon: null as any, accent: BRAND.dark, chipColor: BRAND.bg },
};

// ─────────────────────────────────────────────
// Audio feedback (Web Audio API)
// ─────────────────────────────────────────────
export const playBeep = (type: 'success' | 'error') => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.08;
    if (type === 'success') {
      osc.frequency.value = 880;
      osc.type = 'sine';
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else {
      osc.frequency.value = 220;
      osc.type = 'square';
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch { /* AudioContext not supported */ }
};

// ─────────────────────────────────────────────
// Validation styles helper
// ─────────────────────────────────────────────
export const getValidationStyles = (valRef: number, valInput: number) => {
  if (valInput === 0 && valRef === 0) return { bgcolor: 'transparent', color: '#94a3b8', borderColor: 'transparent', indicator: 'none' as const };
  if (valInput === 0 && valRef !== 0) return { bgcolor: '#ffffff', color: '#64748b', borderColor: 'transparent', indicator: 'pending' as const };
  if (valInput === valRef) return { bgcolor: '#f0fdf4', color: '#15803d', borderColor: '#86efac', indicator: 'exact' as const };
  if (valInput < valRef) return { bgcolor: '#fffbeb', color: '#92400e', borderColor: '#fbbf24', indicator: 'below' as const };
  return { bgcolor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5', indicator: 'over' as const };
};

// ─────────────────────────────────────────────
// Reference cleaning utility
// ─────────────────────────────────────────────
export const cleanRefStr = (raw: string): string => {
  return raw
    .split('|')[0]
    .replace(/^REFS?[.:\s]*/i, '')
    .replace(/^0+/, '')
    .trim();
};

// ─────────────────────────────────────────────
// Stats calculation
// ─────────────────────────────────────────────
export const calculateStats = (
  filas: any[],
  validationData: Record<string, any>,
  sheetId: string | undefined
): { percent: number; matched: number; total: number } => {
  if (!sheetId || !filas?.length) {
    return { percent: 0, matched: 0, total: 0 };
  }

  const currentSheetValidation = validationData[sheetId] || {};
  let matched = 0;

  filas.forEach((fila: any) => {
    const rowTotal = Object.values(currentSheetValidation[fila.id] || {}).reduce(
      (a: number, b: any) => a + Number(b), 0
    );
    if (rowTotal === fila.total) matched++;
  });

  return {
    percent: filas.length ? Math.round((matched / filas.length) * 100) : 0,
    matched,
    total: filas.length,
  };
};

// ─────────────────────────────────────────────
// Mirror column totals calculation
// ─────────────────────────────────────────────
export const calculateMirrorColumnTotals = (
  columns: string[],
  filas: any[],
  validationData: Record<string, any>,
  sheetId: string | undefined
): Record<string, number> => {
  const totals: Record<string, number> = {};
  
  if (!sheetId || !columns?.length) return totals;

  const currentSheetValidation = validationData[sheetId] || {};
  
  columns.forEach((col) => {
    totals[col] = 0;
    filas.forEach((fila: any) => {
      const val = currentSheetValidation[fila.id]?.[col] || 0;
      totals[col] += val;
    });
  });

  return totals;
};

// ─────────────────────────────────────────────
// Lock checking utilities (pure functions)
// ─────────────────────────────────────────────
export const checkIsLockedByOther = (
  filaId: string,
  filas: any[],
  bloqueosActivos: any[],
  currentRef: string,
  user: any
): boolean => {
  const fila = filas.find((f: any) => String(f.id) === String(filaId));
  if (!fila) return false;
  
  const rowLock = bloqueosActivos?.find(
    (b: any) => String(b.tienda_id) === String(fila.tienda?.id) && String(b.referencia) === currentRef
  );
  const lockUserId = rowLock ? String(rowLock.usuario_id) : null;
  return !!(rowLock && String(lockUserId) !== String(user?.id));
};

export const checkIsLockedByMe = (
  filaId: string,
  filas: any[],
  bloqueosActivos: any[],
  currentRef: string,
  user: any
): boolean => {
  const fila = filas.find((f: any) => String(f.id) === String(filaId));
  if (!fila) return false;
  
  const rowLock = bloqueosActivos?.find(
    (b: any) => String(b.tienda_id) === String(fila.tienda?.id) && String(b.referencia) === currentRef
  );
  const lockUserId = rowLock ? String(rowLock.usuario_id) : null;
  return !!(rowLock && String(lockUserId) === String(user?.id));
};

// ─────────────────────────────────────────────
// Get lock info for a row
// ─────────────────────────────────────────────
export const getRowLockInfo = (
  fila: any,
  currentRef: string,
  bloqueosActivos: any[],
  user: any
) => {
  const rowLock = bloqueosActivos?.find(
    (b: any) => String(b.tienda_id) === String(fila.tienda?.id) && String(b.referencia) === currentRef
  );
  
  if (!rowLock) {
    return { isLocked: false, isLockedByMe: false, isLockedByOther: false, lockUserName: 'Otro' };
  }

  const lockUserId = String(rowLock.usuario_id);
  const isLockedByMe = String(lockUserId) === String(user?.id);
  const isLockedByOther = !isLockedByMe;

  return {
    isLocked: true,
    isLockedByMe,
    isLockedByOther,
    lockUserName: 'Alguien',
  };
};
