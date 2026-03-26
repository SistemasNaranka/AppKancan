/** @jsxImportSource react */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Container, Paper, Stack, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, Chip, Divider, Tooltip, LinearProgress, Alert, Snackbar, Badge,
} from '@mui/material';

import {
  LocalShipping as LocalShippingIcon,
  Sync as SyncIcon,
  Verified as VerifiedIcon,
  WarningAmber as WarningAmberIcon,
  History as HistoryIcon,
  ShoppingBag as ShoppingBagIcon,
  DoNotStep as DoNotStepIcon,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useCurvas } from '../contexts/CurvasContext';
import { useAuth } from '@/auth/hooks/useAuth';
import { getLogCurvas, getResumenFechasCurvas } from '../api/directus/read';
import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';
import '@fontsource/roboto-mono/400.css';
import '@fontsource/roboto-mono/700.css';

import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

dayjs.locale('es');

// ─────────────────────────────────────────────
// Brand & Design Tokens
// ─────────────────────────────────────────────
const BRAND = { primary: '#006ACC', dark: '#004680', light: '#B8DCFF', bg: '#E6F4FF' };
const MAIN_FONT = "'Inter', sans-serif";
const MONO_FONT = "'Roboto Mono', 'Consolas', monospace";

// ─────────────────────────────────────────────
// Audio feedback (Web Audio API)
// ─────────────────────────────────────────────
const playBeep = (type: 'success' | 'error') => {
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
import type { MatrizGeneralCurvas, DetalleProducto } from '../types';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type SheetCategory = 'general' | 'producto_a' | 'producto_b';

interface ConfirmedEntry {
  category: SheetCategory;
  label: string;
  icon: React.ReactElement;
  accent: string;
  sheet: MatrizGeneralCurvas | DetalleProducto;
  // normalised field names so the rest of the UI is generic
  columns: string[];       // curvas[] or tallas[]
  getRowColumns: (fila: any) => Record<string, number>; // curvas/tallas value map
  columnTotals: Record<string, number>;
}

// ─────────────────────────────────────────────
// Validation colour helper (mirror table cells)
// ─────────────────────────────────────────────
const getValidationStyles = (valRef: number, valInput: number) => {
  if (valInput === 0 && valRef === 0) return { bgcolor: 'transparent', color: '#94a3b8', borderColor: 'transparent', indicator: 'none' as const };
  if (valInput === 0 && valRef !== 0) return { bgcolor: '#ffffff', color: '#64748b', borderColor: 'transparent', indicator: 'pending' as const };
  if (valInput === valRef) return { bgcolor: '#f0fdf4', color: '#15803d', borderColor: '#86efac', indicator: 'exact' as const };
  if (valInput < valRef) return { bgcolor: '#fffbeb', color: '#92400e', borderColor: '#fbbf24', indicator: 'below' as const };
  return { bgcolor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5', indicator: 'over' as const };
};

// ─────────────────────────────────────────────
// Stat chip for the header
// ─────────────────────────────────────────────
const KpiBadge = ({ label, value, icon, accent = BRAND.primary }: { label: string; value: number | string; icon?: React.ReactNode; accent?: string }) => (
  <Box sx={{
    display: 'flex', alignItems: 'center', gap: 0.75,
    px: 1.5, py: 0.6, borderRadius: 2,
    bgcolor: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(8px)',
  }}>
    {icon && <Box sx={{ color: accent, display: 'flex', fontSize: 16 }}>{icon}</Box>}
    <Typography variant="caption" fontWeight={900} sx={{ color: accent, fontSize: '0.85rem', lineHeight: 1 }}>
      {typeof value === 'number' ? value.toLocaleString('es-CO') : value}
    </Typography>
    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
      {label}
    </Typography>
  </Box>
);

// ─────────────────────────────────────────────
// Category badge helper
// ─────────────────────────────────────────────
const CATEGORY_CONFIG: Record<SheetCategory, { label: string; icon: React.ReactNode; accent: string; chipColor: string }> = {
  general: { label: 'Matriz General', icon: <AnalyticsIcon sx={{ fontSize: 15 }} />, accent: BRAND.primary, chipColor: BRAND.bg },
  producto_a: { label: 'Plantilla de Producto', icon: <ShoppingBagIcon sx={{ fontSize: 15 }} />, accent: '#0891b2', chipColor: '#e0f7fa' },
  producto_b: { label: 'Plantilla de Producto', icon: <DoNotStepIcon sx={{ fontSize: 15 }} />, accent: BRAND.dark, chipColor: BRAND.bg },
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const EnviosPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    datosCurvas,
    actualizarValorValidacion,
    limpiarValidacion,
    userRole,
    lastLogsUpdate,
    tiendasDict,
    extractRef,
    guardarEnvioDespacho,
    notificacionCambios,
    setNotificacionCambios,
    bloqueosActivos,
    intentarBloquear,
    desmarcarTienda,
    validationData,
  } = useCurvas();

  const [selectedEntry, setSelectedEntry] = useState(0); // index into confirmedEntries
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'warning' | 'info' | 'error' }>({
    open: false, message: '', severity: 'info',
  });

  // Estado para el portal del header global
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.getElementById('envios-page-header-portal');
    if (el) {
      setPortalTarget(el);
    }
  }, []);

  // Filtros para log_curvas
  const [filtroFecha, setFiltroFecha] = useState<Dayjs | null>(dayjs());
  const [filtroReferencia, setFiltroReferencia] = useState<string>('');
  const [logCurvasData, setLogCurvasData] = useState<any[]>([]);
  const [loadingLogCurvas, setLoadingLogCurvas] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Historial de fechas con datos
  const [fechasConDatos, setFechasConDatos] = useState<Record<string, 'pendiente' | 'enviado'>>({});
  const initDateChecked = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const fetchFechas = async () => {
      const resumen = await getResumenFechasCurvas();
      if (!isMounted) return;
      setFechasConDatos(resumen);

      if (!initDateChecked.current) {
        initDateChecked.current = true;
        const todayStr = dayjs().format('YYYY-MM-DD');
        // Si hoy no tiene registros cargados, cambiamos al día más reciente que sí tenga
        if (!resumen[todayStr]) {
          const fechasOrd = Object.keys(resumen).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          if (fechasOrd.length > 0) {
            setFiltroFecha(dayjs(fechasOrd[0]));
          }
        }
      }
    };
    
    fetchFechas();
    // Actualizar cada cierto tiempo por si hay cargas nuevas
    const interval = setInterval(fetchFechas, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []); // Sin dependencias de estado para evitar re-renders infinitos

  const CustomDay = useCallback((props: any) => {
    const { day, outsideCurrentMonth, ...other } = props;
    const dateStr = day.format('YYYY-MM-DD');
    const estado = fechasConDatos[dateStr];
    
    let content = <PickersDay {...other} day={day} outsideCurrentMonth={outsideCurrentMonth} />;
    
    if (estado && !outsideCurrentMonth) {
      if (estado === 'enviado') {
        content = (
          <Badge
            overlap="circular"
            badgeContent={<CheckCircleIcon sx={{ fontSize: 12, color: '#22c55e', bgcolor: 'white', borderRadius: '50%' }} />}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            {content}
          </Badge>
        );
      } else {
        content = (
          <Badge
            color="warning"
            variant="dot"
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            sx={{ '& .MuiBadge-badge': { width: 6, height: 6, minWidth: 6, right: 2, bottom: 2 } }}
          >
            {content}
          </Badge>
        );
      }
    }
    
    return content;
  }, [fechasConDatos]);

  // Cargar datos de log_curvas y tiendas desde la base de datos
  useEffect(() => {
    let interval: any;

    const fetchLogCurvasYTiendas = async () => {
      setLoadingLogCurvas(true);
      try {
        console.log('--- REFRESHING LOGS (Auto/Manual) ---');
        // Solo cargar logCurvas, tiendasDict viene de CurvasContext
        const data = await getLogCurvas(filtroFecha ? filtroFecha.format('YYYY-MM-DD') : undefined, filtroReferencia || undefined);
        setLogCurvasData(data || []);
      } catch (error) {
        console.error('Error fetching logs in EnviosPage:', error);
      } finally {
        setLoadingLogCurvas(false);
      }
    };

    fetchLogCurvasYTiendas();

    // Sincronización automática cada 15 segundos para roles operativos
    interval = setInterval(fetchLogCurvasYTiendas, 15000);

    return () => clearInterval(interval);
  }, [filtroFecha, filtroReferencia, userRole, lastLogsUpdate]);

  // Cell focus tracking for scanner auto-increment
  const [activeCell, setActiveCell] = useState<{ filaId: string; col: string; sheetId: string } | null>(null);

  // Table scroll container ref
  const refTableRef = useRef<HTMLDivElement>(null);

  // ── Collect ALL confirmed sheets from ALL types ────
  const confirmedEntries = useMemo<any[]>(() => {
    const entries: ConfirmedEntry[] = [];
    const seenRefs = new Set<string>();

    // 1. PRIMERO: Registros Guardados (Base de Datos) - TIENEN PRIORIDAD porque son los más actualizados
    if (logCurvasData && logCurvasData.length > 0) {
      // Mostrar TODOS los registros (confirmados y borrador) para ver cambios recientes
      const allLogs = logCurvasData; // Sin filtrar por estado
      const groupedLogs: Record<string, any[]> = {};

      allLogs.forEach((log: any) => {
        let rawRef = log.referencia || 'SIN REF';
        let colorParsed = '';

        // Limpieza básica de la referencia del log
        let ref = rawRef.replace(/^REF:\s*/i, '').trim();

        // Manejar color si está incluido en el string
        if (ref.includes(' | ')) {
          const parts = ref.split(' | ');
          ref = parts[0].trim();
          colorParsed = parts[1].trim();
        }

        const groupKey = `${log.plantilla}|${ref}`;
        if (!groupedLogs[groupKey]) groupedLogs[groupKey] = [];
        log._color_extraido = colorParsed;
        groupedLogs[groupKey].push(log);
      });

      // Construir entradas para cada grupo de la BD
      Object.entries(groupedLogs).forEach(([key, logs]) => {
        const [plantilla, refKey] = key.split('|');
        const sortedLogs = [...logs].sort((a, b) => {
          const timeA = new Date(a.fecha).getTime();
          const timeB = new Date(b.fecha).getTime();
          if (timeA !== timeB) return timeA - timeB;
          return Number(a.id) - Number(b.id);
        });
        const lastLog = sortedLogs[sortedLogs.length - 1];
        const colorFinal = lastLog._color_extraido || '—';
        const refBase = refKey.split(' | ')[0].trim();

        console.log(`=== PROCESANDO LOTE ===`);
        console.log('Referencia:', refBase);
        console.log('Total logs:', logs.length);
        console.log('Estados:', logs.map((l: any) => l.estado || 'sin_estado').join(', '));
        console.log('Último log fecha:', lastLog?.fecha);
        console.log('Último log estado:', lastLog?.estado);

        const entryKey = `${plantilla === 'matriz_general' ? 'general' : 'producto_a'}|${refBase}`;
        if (refBase !== 'SIN REF') seenRefs.add(entryKey);

        const filasMap = new Map<string, any>();
        const allColumnsSet = new Set<string>();

        // FILTRAR: Priorizar siempre el registro más reciente por tienda_id (borrador o confirmado)
        const logsAUsarMap = new Map<string, any>();
        sortedLogs.forEach((log: any) => {
          logsAUsarMap.set(String(log.tienda_id), log);
        });
        const logsAUsar = Array.from(logsAUsarMap.values());

        console.log(`[${refBase}] Total logs: ${sortedLogs.length}, Registros únicos (tiendas): ${logsAUsar.length}`);

        logsAUsar.forEach((log: any) => {
          let parsedTallas: any[] = [];
          try {
            parsedTallas = typeof log.cantidad_talla === 'string' ? JSON.parse(log.cantidad_talla) : log.cantidad_talla;
          } catch (e) { }

          const columnsData: Record<string, any> = {};
          let rowTotal = 0;

          if (Array.isArray(parsedTallas)) {
            parsedTallas.forEach((item: any) => {
              const colStr = plantilla === 'matriz_general' ? String(item.talla).padStart(2, '0') : String(item.talla);
              columnsData[colStr] = { valor: item.cantidad || 0, esCero: (item.cantidad || 0) === 0, esMayorQueCero: (item.cantidad || 0) > 0 };
              rowTotal += (item.cantidad || 0);
              allColumnsSet.add(colStr);
            });
          }

          const storeIdStr = String(log.tienda_id);
          filasMap.set(storeIdStr, {
            id: storeIdStr, // Use raw store ID
            tienda: {
              id: log.tienda_id,
              codigo: log.tienda_codigo || '',
              nombre: tiendasDict[log.tienda_id] || log.tienda_nombre || `Tienda ${log.tienda_id}`
            },
            total: rowTotal,
            ...(plantilla === 'matriz_general' ? { curvas: columnsData } : { tallas: columnsData })
          });
        });

        const filas = Array.from(filasMap.values()).sort((a, b) => (a.tienda.nombre || '').localeCompare(b.tienda.nombre || ''));
        const sortedColumns = Array.from(allColumnsSet).sort((a, b) => Number(a) - Number(b));
        
        // Fix: Ensure columnTotals is declared before use
        const columnTotals: Record<string, number> = {};
        sortedColumns.forEach(c => {
          columnTotals[c] = filas.reduce((sum, f) => sum + (f.curvas?.[c]?.valor || f.tallas?.[c]?.valor || 0), 0);
        });

        const category = plantilla === 'matriz_general' ? 'general' : 'producto_a';

        entries.push({
          category: category,
          label: `REF: ${refBase}`,
          icon: category === 'general' ? <AnalyticsIcon sx={{ fontSize: 16 }} /> : <ShoppingBagIcon sx={{ fontSize: 16 }} />,
          accent: category === 'general' ? '#4f46e5' : '#0891b2',
          sheet: {
            id: refBase,
            nombreHoja: refBase,
            estado: 'confirmado',
            filas,
            totalGeneral: filas.reduce((sum, f) => sum + f.total, 0),
            ...(plantilla === 'matriz_general'
              ? { curvas: sortedColumns, totalesPorCurva: columnTotals, referencia: refBase, metadatos: { color: colorFinal } }
              : { tallas: sortedColumns, metadatos: { referencia: refBase, color: colorFinal }, totalesPorTalla: columnTotals })
          } as any,
          columns: sortedColumns,
          getRowColumns: (fila) =>
            Object.fromEntries(sortedColumns.map(c => [c, (fila.curvas || fila.tallas || {})[c]?.valor || 0])),
          columnTotals,
        });
      });
    }

    // 2. SEGUNDO: Matriz en memoria
    if (datosCurvas) {
      (datosCurvas.matrizGeneral || [])
        .filter(s => s.estado === 'confirmado')
        .forEach(sheet => {
          const ref = extractRef(sheet);
          const entryKey = `general|${ref}`;
          if (seenRefs.has(entryKey)) return;
          if (ref !== 'SIN REF') seenRefs.add(entryKey);

          const color = (sheet as any).metadatos?.color || '—';
          entries.push({
            category: 'general',
            label: `REF: ${ref}`,
            icon: <AnalyticsIcon sx={{ fontSize: 16 }} />,
            accent: '#4f46e5',
            sheet: { ...sheet, referencia: ref, metadatos: { ...(sheet as any).metadatos, color } } as any,
            columns: sheet.curvas || [],
            getRowColumns: (fila) =>
              Object.fromEntries((sheet.curvas || []).map(c => [c, (fila.curvas || {})[c]?.valor || 0])),
            columnTotals: sheet.totalesPorCurva || {},
          });
        });

      (datosCurvas.productos || [])
        .filter(s => s.estado === 'confirmado')
        .forEach(sheet => {
          const ref = extractRef(sheet);
          const category = (sheet as any).tipo === 'detalle_producto_b' ? 'producto_b' : 'producto_a';
          const entryKey = `${category}|${ref}`;
          if (seenRefs.has(entryKey)) return;
          if (ref !== 'SIN REF') seenRefs.add(entryKey);

          const color = sheet.metadatos?.color || '—';
          entries.push({
            category: category,
            label: `REF: ${ref}`,
            icon: category === 'producto_a' ? <ShoppingBagIcon sx={{ fontSize: 16 }} /> : <DoNotStepIcon sx={{ fontSize: 16 }} />,
            accent: category === 'producto_a' ? '#0891b2' : '#7c3aed',
            sheet: { ...sheet, metadatos: { ...sheet.metadatos, referencia: ref, color } } as any,
            columns: sheet.tallas || [],
            getRowColumns: (fila) =>
              Object.fromEntries((sheet.tallas || []).map(t => [t, (fila.tallas || {})[t]?.valor || 0])),
            columnTotals: sheet.totalesPorTalla || {},
          });
        });
    }

    return entries;
  }, [datosCurvas, logCurvasData, tiendasDict, extractRef]);

  const safeIndex = Math.min(selectedEntry, Math.max(0, confirmedEntries.length - 1));
  const current = confirmedEntries[safeIndex] as any;



  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const autoCursorRef = useRef<{ filaId: string; col: string } | null>(null);
  
  const activeCellRef = useRef<typeof activeCell>(activeCell);
  useEffect(() => {
    activeCellRef.current = activeCell;
    if (activeCell) {
      const cellId = `cell-${activeCell.filaId}-${activeCell.col}`;
      const element = document.getElementById(cellId);
      if (element && document.activeElement !== element) {
        element.focus();
      }
    }
  }, [activeCell]);

  useEffect(() => {
    if (current && current.sheet.id && current.sheet.filas.length > 0) {
      const currentActive = activeCellRef.current;
      const hasValidSelection = currentActive && 
                               String(currentActive.sheetId) === String(current.sheet.id) && 
                               current.sheet.filas.some(f => String(f.id) === String(currentActive.filaId));

      if (!hasValidSelection) {
        let targetFilaId = null;
        let targetCol = current.columns[0];
        
        const currentRef = extractRef(current.sheet);
        
        // Find first unlocked row
        for (const fila of current.sheet.filas) {
          const rowLock = bloqueosActivos?.find((b: any) => String(b.tienda_id) === String(fila.tienda?.id) && String(b.referencia) === currentRef);
          const lockUserId = rowLock ? (typeof rowLock.usuario_id === 'object' ? rowLock.usuario_id.id : rowLock.usuario_id) : null;
          const isLockedByOther = rowLock && user && String(lockUserId) !== String(user.id);
          
          if (isLockedByOther) continue;

          const rowCols = current.getRowColumns(fila);
          const foundCol = current.columns.find((c: string) => rowCols[c] > 0);
          if (foundCol) {
            targetFilaId = fila.id;
            targetCol = foundCol;
            break;
          }
        }
        
        if (!targetFilaId && current.sheet.filas.length > 0) {
          targetFilaId = current.sheet.filas[0]?.id;
          targetCol = current.columns[0];
        }
        
        if (targetFilaId) {
          const newActive = { filaId: String(targetFilaId), col: targetCol, sheetId: String(current.sheet.id!) };
          autoCursorRef.current = { filaId: String(targetFilaId), col: targetCol };
          setActiveCell(newActive);
          activeCellRef.current = newActive;
        }
      }
    }

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const currentActiveCell = activeCellRef.current;
      if (!current || !currentActiveCell || !user) return;
      
      const currentRef = extractRef(current.sheet);
      
      const checkIsLockedByOther = (filaId: string) => {
        const fila = current.sheet.filas.find((f: any) => String(f.id) === String(filaId));
        if (!fila) return false;
        const rowLock = bloqueosActivos?.find((b: any) => String(b.tienda_id) === String(fila.tienda?.id) && String(b.referencia) === currentRef);
        const lockUserId = rowLock ? (typeof rowLock.usuario_id === 'object' && rowLock.usuario_id !== null ? rowLock.usuario_id.id : rowLock.usuario_id) : null;
        return rowLock && String(lockUserId) !== String(user.id);
      };

      const checkIsLockedByMe = (filaId: string) => {
        const fila = current.sheet.filas.find((f: any) => String(f.id) === String(filaId));
        if (!fila) return false;
        const rowLock = bloqueosActivos?.find((b: any) => String(b.tienda_id) === String(fila.tienda?.id) && String(b.referencia) === currentRef);
        const lockUserId = rowLock ? (typeof rowLock.usuario_id === 'object' && rowLock.usuario_id !== null ? rowLock.usuario_id.id : rowLock.usuario_id) : null;
        return rowLock && String(lockUserId) === String(user.id);
      };

      // Relaxed: allow scanning even when sheetId in activeCellRef differs (e.g. DB-loaded records)
      const sheetIdMatch = !currentActiveCell.sheetId || String(currentActiveCell.sheetId) === String(current.sheet.id);
      if (!sheetIdMatch) {
        // Re-sync the active cell to the current sheet so next scan works correctly
        activeCellRef.current = { ...currentActiveCell, sheetId: String(current.sheet.id) };
      }

      const now = Date.now();
      const cols = current.columns;
      const filas = current.sheet.filas;

      // Restored: Decrement quantity with Backspace
      if (e.key === 'Backspace') {
        const activeElement = document.activeElement;
        const isFocusingTable = activeElement && (activeElement.id?.startsWith('cell-') || activeElement.tagName === 'BODY');
        
        if (isFocusingTable) {
          e.preventDefault();
          const targetFilaId = String(currentActiveCell.filaId);
          
          if (!checkIsLockedByMe(targetFilaId)) {
            setSnackbar({ open: true, message: 'Debes habilitar la fila (Clic en "SEL") para editarla', severity: 'warning' });
            return;
          }
          
          const targetCol = String(currentActiveCell.col);
          const currentSheetValidation = validationData[String(current.sheet.id!)] || {};
          const currentValidation = currentSheetValidation[targetFilaId] || {};
          const currentValue = currentValidation[targetCol] || 0;
          
          if (currentValue > 0) {
            const newValue = currentValue - 1;
            playBeep('success');
            actualizarValorValidacion(String(current.sheet.id!), targetFilaId, targetCol, newValue);
            setSnackbar({ open: true, message: `Restado: ${targetCol} (${newValue})`, severity: 'info' });
          }
        }
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        const shiftPressed = e.shiftKey;
        const currentRowIndex = filas.findIndex(f => String(f.id) === String(currentActiveCell.filaId));
        const currentColIndex = cols.indexOf(currentActiveCell.col);
        let nextFilaId = currentActiveCell.filaId;
        let nextCol = currentActiveCell.col;
        let foundNext = false;
        
        if (shiftPressed) {
          if (currentColIndex > 0) {
            nextCol = cols[currentColIndex - 1];
            foundNext = true;
          } else if (currentRowIndex > 0) {
            nextFilaId = filas[currentRowIndex - 1].id;
            nextCol = cols[cols.length - 1];
            foundNext = true;
          }
        } else {
          if (currentColIndex < cols.length - 1) {
            nextCol = cols[currentColIndex + 1];
            foundNext = true;
          } else if (currentRowIndex < filas.length - 1) {
            nextFilaId = filas[currentRowIndex + 1].id;
            nextCol = cols[0];
            foundNext = true;
          }
        }
        
        if (foundNext) {
          let nextFilaObj = filas.find((f: any) => String(f.id) === String(nextFilaId));
          // Skip if locked
          while (nextFilaObj && checkIsLockedByOther(String(nextFilaId))) {
            const nextRowIndex = filas.indexOf(nextFilaObj);
            if (shiftPressed) {
               if (nextRowIndex > 0) nextFilaId = filas[nextRowIndex - 1].id;
               else break;
            } else {
               if (nextRowIndex < filas.length - 1) nextFilaId = filas[nextRowIndex + 1].id;
               else break;
            }
            nextFilaObj = filas.find((f: any) => String(f.id) === String(nextFilaId));
          }
          
          const newActive = { filaId: String(nextFilaId), col: String(nextCol), sheetId: String(current.sheet.id!) };
          autoCursorRef.current = { filaId: String(nextFilaId), col: String(nextCol) };
          setActiveCell(newActive);
          activeCellRef.current = newActive;
        }
        bufferRef.current = '';
        lastKeyTimeRef.current = now;
        return;
      }

      if (e.key === 'Enter') {
        const scannedCode = bufferRef.current.trim();
        if (scannedCode.length > 2) {
          e.preventDefault();
          
          const cleanRefStr = (raw: string) => raw.split('|')[0].replace(/^REFS?[.:\s]*/i, '').replace(/^0+/, '').trim();
          
          const codeWithoutLeadingZeros = scannedCode.replace(/^0+/, '');
          const extractedRef = codeWithoutLeadingZeros.substring(0, 5);
          
          const sheetRef = (current.sheet as any).referencia || current.sheet.nombreHoja || '';
          const currentRef = cleanRefStr(sheetRef);
          
          let targetEntryIndex = -1;
          for (let i = 0; i < confirmedEntries.length; i++) {
            const entry = confirmedEntries[i];
            const entrySheetRef = (entry.sheet as any).referencia || entry.sheet.nombreHoja || '';
            const eRef = cleanRefStr(entrySheetRef);
            if (extractedRef === eRef || codeWithoutLeadingZeros.includes(eRef) || scannedCode.includes(eRef)) {
              targetEntryIndex = i;
              break;
            }
          }

          if (targetEntryIndex !== -1) {
            if (targetEntryIndex !== safeIndex) {
              setSelectedEntry(targetEntryIndex);
              playBeep('success');
              setSnackbar({ open: true, message: `Cambiando a lote: ${confirmedEntries[targetEntryIndex].label}`, severity: 'info' });
              bufferRef.current = '';
              lastKeyTimeRef.current = now;
              return;
            }

            const targetFilaId = String(currentActiveCell.filaId);
            
            if (!checkIsLockedByMe(targetFilaId)) {
              playBeep('error');
              setSnackbar({ open: true, message: 'Debes seleccionar la tienda (Clic en "SEL") para escanear', severity: 'warning' });
              bufferRef.current = '';
              lastKeyTimeRef.current = now;
              return;
            }

             const targetCol = String(currentActiveCell.col);
             const currentSheetValidation = validationData[String(current.sheet.id!)] || {};
             const currentValidation = currentSheetValidation[targetFilaId] || {};
             const currentValue = currentValidation[targetCol] || 0;
            const row = current.sheet.filas.find(f => String(f.id) === targetFilaId);
            const rowCols = row ? current.getRowColumns(row) : {};
            const refValue = rowCols[targetCol] || 0;
            const newValue = currentValue + 1;
            
            if (refValue > 0 && newValue > refValue) {
              playBeep('error');
              setSnackbar({ open: true, message: `Excedido: ${targetCol} (${newValue}/${refValue})`, severity: 'warning' });
            } else {
              playBeep('success');
              setSnackbar({ open: true, message: `${targetCol}: ${newValue}${refValue > 0 ? `/${refValue}` : ''}`, severity: 'success' });
            }
            actualizarValorValidacion(String(current.sheet.id!), targetFilaId, targetCol, newValue);
            
            const fila = current.sheet.filas.find((f: any) => String(f.id) === String(targetFilaId));
            if (fila) intentarBloquear(String(fila.tienda?.id), currentRef);
            
          } else {
            playBeep('error');
            setSnackbar({ open: true, message: `Referencia ${extractedRef} no corresponde a este lote (${currentRef})`, severity: 'error' });
          }
        }
        bufferRef.current = '';
        lastKeyTimeRef.current = now;
        return;
      }

      if (now - lastKeyTimeRef.current > 500) bufferRef.current = '';
      lastKeyTimeRef.current = now;
      if (e.key.length === 1) bufferRef.current += e.key;
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [current, validationData, actualizarValorValidacion, bloqueosActivos, user, intentarBloquear, extractRef, confirmedEntries, safeIndex, setSnackbar, playBeep, setSelectedEntry]);


  // ── Validation helpers ───────────────────────────────────
  const mirrorColumnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    if (!current || !current.sheet?.id) return totals;
    
    const currentSheetValidation = validationData[String(current.sheet.id)] || {};

    current.columns.forEach(col => {
      totals[col] = 0;
      current.sheet.filas.forEach(fila => {
        const val = currentSheetValidation[fila.id]?.[col] || 0;
        totals[col] += val;
      });
    });
    return totals;
  }, [current, validationData]);

  const mirrorGrandTotal = Object.values(mirrorColumnTotals).reduce((a, b) => a + b, 0);

  const stats = useMemo(() => {
    if (!current || !current.sheet?.id) return { percent: 0, matched: 0, total: current?.sheet.filas.length || 0 };
    let matched = 0;
    
    const currentSheetValidation = validationData[String(current.sheet.id)] || {};

    current.sheet.filas.forEach(fila => {
      const rowTotal = Object.values(currentSheetValidation[fila.id] || {}).reduce((a: number, b: any) => a + Number(b), 0);
      if (rowTotal === fila.total) matched++;
    });
    return {
      percent: current.sheet.filas.length ? Math.round((matched / current.sheet.filas.length) * 100) : 0,
      matched,
      total: current.sheet.filas.length,
    };
  }, [current, validationData]);

  const isEverythingValid = stats.percent === 100;

  // Real-time alert stats for header badges
  const alertStats = useMemo(() => {
    let faltantes = 0;
    let excesos = 0;
    if (!current || !current.sheet?.id) return { faltantes, excesos };
    
    const currentSheetValidation = validationData[current.sheet.id] || {};

    current.sheet.filas.forEach((fila: any) => {
      const rowCols = current.getRowColumns(fila);
      const rowInput = currentSheetValidation[fila.id] || {};
      current.columns.forEach(col => {
        const valRef = rowCols[col] || 0;
        const valInput = rowInput[col] || 0;
        if (valInput > 0 && valInput < valRef) faltantes++;
        if (valInput > valRef && valRef > 0) excesos++;
      });
    });
    return { faltantes, excesos };
  }, [current, validationData]);

  const cfg = current ? CATEGORY_CONFIG[current.category] : null;
  const accent = current?.accent || '#6366f1';

  const handleEnviarADespacho = async () => {
    if (!current?.sheet?.id) return;
    
    setIsSending(true);
    try {
      const ok = await guardarEnvioDespacho(
        current.sheet.id, 
        undefined, 
        current.category === 'general' ? 'matriz_general' : 'productos',
        current.sheet.referencia
      );
      if (ok) {
        setSnackbar({ 
          open: true, 
          message: '🚀 Despacho enviado correctamente a la base de datos', 
          severity: 'success' 
        });
        playBeep('success');
      } else {
        setSnackbar({
          open: true,
          message: 'Error al enviar el despacho. Intente de nuevo.',
          severity: 'error'
        });
        playBeep('error');
      }
    } catch (error) {
      console.error('🔴 Error crítico en handleEnviarADespacho:', error);
      setSnackbar({
        open: true,
        message: 'Error crítico en el sistema de envío. Revisa la consola.',
        severity: 'error'
      });
      playBeep('error');
    } finally {
      setIsSending(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  const hayDatosEnBD = (logCurvasData?.length ?? 0) > 0;
  const hayLotesConfirmados = confirmedEntries.length > 0;

  console.log('Debug - datosCurvas:', datosCurvas, 'hayDatosEnBD:', hayDatosEnBD, 'hayLotesConfirmados:', hayLotesConfirmados, 'logCurvasData length:', logCurvasData?.length);

  if (!datosCurvas && !hayDatosEnBD) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Paper elevation={0} sx={{ p: 6, borderRadius: 4, bgcolor: '#f8fafc', border: '2px dashed #cbd5e1' }}>
          <LocalShippingIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
          <Typography variant="h5" fontWeight={900} color="#475569" gutterBottom>
            Sin lotes confirmados
          </Typography>
          <Typography variant="body1" color="#64748b" sx={{ mb: 4 }}>
            No hay lotes confirmados disponibles para enviar. Por favor, confirme un lote en el Dashboard.
          </Typography>
          <Button
            variant="contained"
            startIcon={<DashboardIcon />}
            onClick={() => navigate('/curvas/dashboard')}
            sx={{ px: 5, py: 1.5, borderRadius: 3, fontWeight: 800 }}>
            IR AL DASHBOARD
          </Button>
        </Paper>
      </Container>
    );
  }

  // Si no hay lotes confirmados pero hay datos en la BD, mostrar tabla de log_curvas (PARA TODOS LOS USUARIOS)
  const isAdminView = userRole?.toLowerCase().includes('admin') || userRole?.toLowerCase().includes('gerente');

  if (!hayLotesConfirmados && hayDatosEnBD) {
    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" mb={3}>
            <LocalShippingIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={900}>
              Datos guardados en Base de Datos
            </Typography>
          </Stack>

          {/* Filtros */}
          <Stack direction="row" spacing={2} mb={3}>
            <DatePicker
              label="Fecha"
              value={filtroFecha}
              onChange={v => setFiltroFecha(v)}
              slots={{ day: CustomDay }}
              slotProps={{ textField: { size: 'small', sx: { width: 180 } } }}
            />
            <TextField
              label="Referencia"
              size="small"
              value={filtroReferencia}
              onChange={(e) => setFiltroReferencia(e.target.value)}
              placeholder="Buscar referencia..."
              sx={{ width: 250 }}
            />
          </Stack>

          {loadingLogCurvas ? (
            <LinearProgress />
          ) : (
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900, bgcolor: 'primary.main', color: 'white' }}>Tienda</TableCell>
                    <TableCell sx={{ fontWeight: 900, bgcolor: 'primary.main', color: 'white' }}>Plantilla</TableCell>
                    <TableCell sx={{ fontWeight: 900, bgcolor: 'primary.main', color: 'white' }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 900, bgcolor: 'primary.main', color: 'white' }}>Referencia</TableCell>
                    <TableCell sx={{ fontWeight: 900, bgcolor: 'primary.main', color: 'white' }}>Cantidad/Talla</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logCurvasData.filter(item => item.referencia && item.referencia.trim() !== '' && item.referencia.toUpperCase() !== 'SIN REF').map((item: any, index: number) => (
                    <TableRow key={index} hover>
                      <TableCell>{item.tienda_nombre}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.plantilla === 'matriz_general' ? 'Matriz General' : 'Productos'}
                          size="small"
                          color={item.plantilla === 'matriz_general' ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                      <TableCell>{new Date(item.fecha).toLocaleString()}</TableCell>
                      <TableCell>{item.referencia || '-'}</TableCell>
                      <TableCell>
                        <Tooltip title={
                          <pre style={{ margin: 0, padding: '4px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                            {typeof item.cantidad_talla === 'object'
                              ? JSON.stringify(item.cantidad_talla, null, 2)
                              : String(item.cantidad_talla)}
                          </pre>
                        }>
                          <Chip label="Ver JSON" size="small" variant="outlined" />
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {logCurvasData.length === 0 && !loadingLogCurvas && (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No hay registros en la base de datos.
            </Typography>
          )}
        </Paper>
      </Container>
    );
  }
  // ── Main view: confirmed entries exist ─────────────────────────
  const totalRefUnits = current ? Object.values(current.columnTotals).reduce((a, b) => a + b, 0) : 0;

  // Contenido para el header global (portal)
  const headerContent = (
    <Stack 
      direction="row" 
      spacing={1} 
      alignItems="center" 
      flexWrap="wrap"
      sx={{ 
        py: { xs: 0.5, md: 0 },
        justifyContent: { xs: 'center', sm: 'flex-end' },
        width: '100%',
        gap: { xs: 1, md: 1.5 }
      }}
    >
      {/* Título - Ocultar en móviles muy pequeños */}
      <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 0.75 }}>
        <LocalShippingIcon sx={{ fontSize: 18, color: 'white' }} />
        <Typography sx={{ fontWeight: 900, fontSize: '0.75rem', letterSpacing: 0.8, color: 'white', textTransform: 'uppercase' }}>
          DESPACHO
        </Typography>
      </Box>

      <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 0.5, my: 1, display: { xs: 'none', lg: 'block' } }} />

      {/* Date picker in Spanish */}
      <DatePicker
        value={filtroFecha}
        onChange={v => { setFiltroFecha(v); }}
        slots={{ day: CustomDay }}
        slotProps={{
          textField: {
            size: 'small',
            sx: {
              width: { xs: 120, sm: 140 },
              bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1.5,
              '& .MuiOutlinedInput-root': {
                color: 'white', fontSize: '0.78rem', height: 32, borderRadius: 1.5,
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                '& .MuiInputAdornment-root svg': { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
              },
              '& .MuiInputLabel-root': { display: 'none' },
            },
          },
        }}
      />

      <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 0.5, my: 1, display: { xs: 'none', sm: 'block' } }} />

      {/* KPIs compactos */}
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Box sx={{ textAlign: 'center', px: 0.8 }}>
          <Typography sx={{ fontFamily: MONO_FONT, fontWeight: 900, fontSize: '0.85rem', lineHeight: 1, color: '#93c5fd' }}>
            {current?.sheet.filas.length || 0}
          </Typography>
          <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            ESTABLEC.
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', px: 0.8 }}>
          <Typography sx={{ fontFamily: MONO_FONT, fontWeight: 900, fontSize: '0.85rem', lineHeight: 1, color: '#c4b5fd' }}>
            {totalRefUnits.toLocaleString('es-CO')}
          </Typography>
          <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            REF.
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', px: 0.8 }}>
          <Typography sx={{ fontFamily: MONO_FONT, fontWeight: 900, fontSize: '0.85rem', lineHeight: 1, color: isEverythingValid ? '#86efac' : '#fde68a' }}>
            {stats.percent}%
          </Typography>
          <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            VALID.
          </Typography>
        </Box>
      </Stack>

      <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 0.5, my: 1, display: { xs: 'none', sm: 'block' } }} />

      {/* Estado */}
      <Chip
        icon={isEverythingValid ? <VerifiedIcon sx={{ fontSize: 13 }} /> : <WarningAmberIcon sx={{ fontSize: 13 }} />}
        label={isEverythingValid ? 'VALIDADO' : 'PENDIENTE'}
        size="small"
        sx={{
          fontWeight: 800, fontSize: '0.6rem', letterSpacing: 0.4, height: 24,
          bgcolor: isEverythingValid ? 'rgba(74,222,128,0.18)' : 'rgba(251,191,36,0.18)',
          color: isEverythingValid ? '#86efac' : '#fde68a',
          border: `1px solid ${isEverythingValid ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)'}`,
        }}
      />

      <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 0.5, my: 1, display: { xs: 'none', md: 'block' } }} />

      {/* Barra de progreso compacta */}
      <Box sx={{ width: { xs: 80, md: 120 }, display: { xs: 'none', md: 'block' } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.2 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: 0.6 }}>
            PROGRESO
          </Typography>
          <Typography sx={{ fontFamily: MONO_FONT, color: isEverythingValid ? '#86efac' : '#fde68a', fontWeight: 900, fontSize: '0.6rem' }}>
            {stats.matched}/{stats.total}
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={stats.percent}
          sx={{
            height: 6, borderRadius: 3,
            bgcolor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              background: isEverythingValid
                ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              transition: 'width 0.6s ease',
            },
          }}
        />
      </Box>

      <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 0.5, my: 1, display: { xs: 'none', sm: 'block' } }} />

      {/* Botones */}
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Button
          variant="outlined"
          size="small"
          startIcon={<HistoryIcon sx={{ fontSize: 13 }} />}
          onClick={() => { limpiarValidacion(); setSnackbar({ open: true, message: 'Validación limpiada', severity: 'info' }); }}
          sx={{
            display: (mirrorGrandTotal > 0 && !isEverythingValid) ? 'inline-flex' : 'none',
            color: '#334155', bgcolor: 'white', borderColor: '#cbd5e1', fontWeight: 700,
            fontSize: '0.75rem', textTransform: 'none', borderRadius: 1.5, px: 2, minWidth: 'auto',
            height: 30,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
          }}
        >
          Limpiar
        </Button>

        <Button
          variant="contained"
          size="small"
          disabled={mirrorGrandTotal === 0 || isSending}
          onClick={handleEnviarADespacho}
          startIcon={isSending ? <SyncIcon className="animate-spin" sx={{ fontSize: 13 }} /> : <LocalShippingIcon sx={{ fontSize: 13 }} />}
          sx={{
            fontWeight: 800, fontSize: '0.75rem', textTransform: 'none', borderRadius: 1.5,
            height: 30,
            bgcolor: isEverythingValid 
              ? '#22c55e' 
              : (mirrorGrandTotal > 0 ? 'white' : 'rgba(255,255,255,0.08)'),
            color: isEverythingValid ? '#fff' : (mirrorGrandTotal > 0 ? '#006ACC' : 'rgba(255,255,255,0.35)'),
            px: 1.5,
            boxShadow: isEverythingValid 
              ? '0 2px 8px rgba(34,197,94,0.35)' 
              : (mirrorGrandTotal > 0 ? '0 2px 8px rgba(255,255,255,0.1)' : 'none'),
            '&:hover': { 
              bgcolor: isEverythingValid ? '#16a34a' : (mirrorGrandTotal > 0 ? 'rgba(255,255,255,0.9)' : undefined) 
            },
            '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)', bgcolor: 'rgba(255,255,255,0.04)' },
          }}
        >
          {isSending ? '...' : (mirrorGrandTotal > 0 ? `ENVIAR (${mirrorGrandTotal})` : 'ENVIAR')}
        </Button>
      </Stack>
    </Stack>
  );

  // Build proper tab label with reference
  const getTabLabel = (entry: ConfirmedEntry, index: number) => {
    let ref = (entry.label || '').replace('REF: ', '').replace('Plantilla de Producto\nREF: ', '').trim();

    if (!ref || ref.toUpperCase() === 'SIN REF') {
      // Fallback a nombre de hoja o cualquier campo de referencia en el objeto sheet
      const s = entry.sheet as any;
      const fallback = s.nombreHoja || s.referencia || s.referenciaBase || s.metadatos?.referencia || '';
      const cleanFallback = fallback.replace('Ingreso Manual - ', '').replace('Manual - ', '').trim();

      if (cleanFallback && cleanFallback.toUpperCase() !== 'SIN REF') {
        return `${cleanFallback} - ${CATEGORY_CONFIG[entry.category]?.label || 'General'}`;
      }
      return `Lote ${index + 1} (${entry.category === 'general' ? 'Gral' : 'Prod'})`;
    }

    const catName = CATEGORY_CONFIG[entry.category]?.label || 'General';
    return `${ref} - ${catName}`;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box sx={{ fontFamily: MAIN_FONT }}>
        {/* Renderiza los controles en el layout global si existe el portal */}
        {portalTarget ? createPortal(headerContent, portalTarget) : null}

        <Container maxWidth="xl" sx={{ py: 2 }}>

      {/* ── CONTENT SECTION (Using Stack to manage spacing) ── */}
      <Stack spacing={2} sx={{ mt: 2.5 }}>
        {/* ═══════════════════ CONSOLIDATED BAR (Lote + Resumen + Leyenda) ═══════════════════ */}
        <Box sx={{
          px: 2, py: 0.8,
          borderRadius: '10px', border: '1px solid #e2e8f0', bgcolor: '#ffffff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 0.5,
        }}>
          {/* Left: Lote badge + Resumen */}
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            {/* Lote tabs (if multiple) */}
            {confirmedEntries.length > 1 ? (
              <Tabs
                value={safeIndex}
                onChange={(_, v) => setSelectedEntry(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 32,
                  '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minHeight: 32, fontSize: '0.72rem', py: 0, px: 1.2 },
                  '& .Mui-selected': { color: '#4338ca' },
                  '& .MuiTabs-indicator': { bgcolor: '#4338ca', height: 2.5, borderRadius: 2 },
                }}
              >
                {confirmedEntries.map((entry, i) => (
                  <Tab key={i} icon={entry.icon} iconPosition="start" label={getTabLabel(entry, i)} />
                ))}
              </Tabs>
            ) : (
              <Chip
                icon={current?.icon}
                label={current ? getTabLabel(current, confirmedEntries.indexOf(current)) : ''}
                size="small"
                sx={{ fontWeight: 800, fontSize: '0.72rem', bgcolor: '#eef2ff', color: '#4338ca', height: 26 }}
              />
            )}

            {current && (
              <>
                <Divider orientation="vertical" flexItem sx={{ height: 18, alignSelf: 'center' }} />
                <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {current.sheet.filas.length} Establecimientos · {current.columns.length} {current.category === 'general' ? 'Curvas' : 'Tallas'}
                </Typography>
              </>
            )}
          </Stack>

          {/* Right: Visual legend (compact) */}
          <Stack direction="row" spacing={1.2} alignItems="center">
            {[
              { label: 'Exacto', bg: '#f0fdf4', border: '#86efac', color: '#15803d' },
              { label: 'Menor', bg: '#fffbeb', border: '#fcd34d', color: '#92400e' },
              { label: 'Excede', bg: '#fef2f2', border: '#fca5a5', color: '#991b1b' },
            ].map(l => (
              <Stack key={l.label} direction="row" spacing={0.3} alignItems="center">
                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: l.bg, border: `1px solid ${l.border}` }} />
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: l.color }}>{l.label}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        {current && (
          /* ═══════════════════ TABLA UNIFICADA — VERTICAL CELLS ═══════════════════ */
          <Paper elevation={0} sx={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            {/* Mini title bar */}
            <Box sx={{
              px: 2, py: 0.6, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <Stack direction="row" spacing={0.8} alignItems="center">
                <SyncIcon sx={{ color: '#6366f1', fontSize: 15 }} />
                <Typography sx={{ fontWeight: 900, fontSize: '0.75rem', color: '#334155' }}>
                  TABLA UNIFICADA — REF & INGRESO
                </Typography>
                <Chip label="EDITABLE" size="small" sx={{ fontWeight: 800, fontSize: '0.5rem', height: 16, bgcolor: '#ede9fe', color: '#7c3aed', letterSpacing: 0.3 }} />
              </Stack>
              {isEverythingValid && (
                <Chip icon={<VerifiedIcon sx={{ fontSize: 13 }} />} label="VERIFICADO" size="small" color="success" sx={{ fontWeight: 800, fontSize: '0.6rem', height: 22 }} />
              )}
            </Box>

            {/* TABLE — vertical cell layout */}
            <TableContainer ref={refTableRef} sx={{ height: 650, maxHeight: 650 }}>
              <Table stickyHeader size="small" sx={{ tableLayout: 'auto' }}>
                <TableHead>
                  <TableRow>
                    {/* Action column */}
                    <TableCell sx={{
                      fontWeight: 800, bgcolor: '#f8fafc', width: 44,
                      position: 'sticky', left: 0, zIndex: 5,
                      borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0', p: 0,
                    }}></TableCell>
                    {/* Establishment column */}
                    <TableCell sx={{
                      fontWeight: 800, bgcolor: '#f8fafc', width: 180,
                      position: 'sticky', left: 44, zIndex: 4,
                      borderRight: '2px solid #e2e8f0', borderBottom: '2px solid #e2e8f0',
                      fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5,
                      py: 0.8,
                    }}>
                      ESTABLECIMIENTO
                    </TableCell>
                    {/* One column per curve/size */}
                    {current.columns.map(col => (
                      <TableCell
                        key={col}
                        align="center"
                        sx={{
                          fontFamily: MONO_FONT, fontWeight: 900, bgcolor: '#f8fafc',
                          fontSize: '0.85rem', color: '#1e293b', py: 0.5, px: 2,
                          borderBottom: '2px solid #e2e8f0',
                          borderLeft: '1px solid #f1f5f9',
                          minWidth: 85, /* Increased width for better spacing */
                        }}
                      >
                        {col}
                        <Typography sx={{ fontSize: '0.48rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1, mt: 0.1 }}>
                          REF / ING
                        </Typography>
                      </TableCell>
                    ))}
                    {/* Total column */}
                    <TableCell align="center" sx={{
                      fontWeight: 800, bgcolor: '#f8fafc', width: 60,
                      borderLeft: '2px solid #e2e8f0', borderBottom: '2px solid #e2e8f0',
                      fontSize: '0.65rem', color: '#64748b',
                    }}>
                      TOTAL
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {current.sheet.filas.map((fila: any) => {
                    const currentSheetValidation = validationData[String(current.sheet.id)] || {};
                    const rowCols = current.getRowColumns(fila);
                    const rowValidation = currentSheetValidation[fila.id] || {};
                    const mirrorRowTotal = Object.values(rowValidation).reduce((a: number, b: any) => a + Number(b), 0);
                    const rowComplete = mirrorRowTotal === fila.total && fila.total > 0;
                    const isActiveRow = activeCell && String(activeCell.filaId) === String(fila.id) && String(activeCell.sheetId) === String(current.sheet.id);

                    // Concurrencia
                    const currentRef = current ? extractRef(current.sheet) : '';
                    const rowLock = bloqueosActivos?.find((b: any) => String(b.tienda_id) === String(fila.tienda?.id) && String(b.referencia) === currentRef);
                    const lockUserId = rowLock ? (typeof rowLock.usuario_id === 'object' && rowLock.usuario_id !== null ? rowLock.usuario_id.id : rowLock.usuario_id) : null;
                    const lockUserName = rowLock && typeof rowLock.usuario_id === 'object' && rowLock.usuario_id !== null ? (rowLock.usuario_id.first_name || 'Alguien') : 'Otro';
                    const isLockedByOther = rowLock && user && String(lockUserId) !== String(user.id);
                    const isLockedByMe = rowLock && user && String(lockUserId) === String(user.id);

                    if (isLockedByOther) {
                      console.log('--- DIAGNOSTICO CANDADO ROJO ---');
                      console.log('User ID mio:', user?.id);
                      console.log('Row Lock de BD (entero):', rowLock);
                      console.log('LockUserId extraido:', lockUserId);
                    }

                    const handleToggleLock = async (e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (isLockedByOther) {
                        setSnackbar({ open: true, message: `Esta tienda está siendo usada por ${lockUserName}`, severity: 'warning' });
                        return;
                      }
                      if (isLockedByMe) {
                        await desmarcarTienda(String(fila.tienda?.id), currentRef);
                      } else {
                        const success = await intentarBloquear(String(fila.tienda?.id), currentRef);
                        if (!success) setSnackbar({ open: true, message: 'La tienda acaba de ser ocupada por alguien más', severity: 'error' });
                      }
                    };

                    return (
                      <TableRow
                        key={fila.id}
                        sx={{
                          cursor: isLockedByOther ? 'not-allowed' : 'pointer',
                          opacity: isLockedByOther ? 0.6 : 1,
                          '&:hover': {
                            bgcolor: isLockedByOther ? 'transparent !important' : '#f0f4ff !important',
                            '& td': { bgcolor: 'inherit !important' },
                            '& td:nth-of-type(2)': { // Col 1 is SEL button, Col 2 is store name
                              borderLeft: isLockedByOther ? '3px solid transparent' : '3px solid #6366f1',
                            },
                          },
                          bgcolor: isLockedByMe ? 'rgba(56, 189, 248, 0.08)' : (rowComplete && !isLockedByOther ? 'rgba(209,250,229,0.12)' : 'transparent'),
                          transition: 'background-color 0.12s',
                        }}
                      >
                        {/* Selector (Lock Button) */}
                        <TableCell sx={{
                          position: 'sticky', left: 0, zIndex: 2, bgcolor: isLockedByMe ? '#e0f2fe' : (isLockedByOther ? '#f8fafc' : '#ffffff'),
                          borderRight: '1px solid #e2e8f0', p: 0, width: 44, textAlign: 'center',
                          borderLeft: 'none'
                        }}>
                          <Tooltip title={isLockedByMe ? "Soltar tienda" : isLockedByOther ? `Bloqueada por ${lockUserName}` : "Trabajar esta tienda"}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                              <Button 
                                onClick={handleToggleLock} 
                                disabled={isLockedByOther}
                                sx={{
                                  minWidth: 0, width: 28, height: 28, borderRadius: '6px', p: 0,
                                  bgcolor: isLockedByMe ? '#38bdf8' : 'transparent',
                                  color: isLockedByMe ? 'white' : '#cbd5e1',
                                  border: isLockedByMe ? 'none' : '2px dashed #cbd5e1',
                                  '&:hover': { bgcolor: isLockedByMe ? '#0284c7' : '#f1f5f9', borderColor: '#94a3b8', color: '#64748b' }
                                }}
                              >
                                {isLockedByMe ? <CheckCircleIcon sx={{ fontSize: 18 }} /> : (isLockedByOther ? <LockIcon sx={{ fontSize: 16, color: '#ef4444' }} /> : <Typography sx={{ fontSize: '0.65rem', fontWeight: 900 }}>SEL</Typography>)}
                              </Button>
                            </Box>
                          </Tooltip>
                        </TableCell>

                        {/* Store name — sticky */}
                        <TableCell sx={{
                          fontWeight: 600, fontSize: '0.74rem',
                          position: 'sticky', left: 44, bgcolor: isLockedByMe ? '#e0f2fe' : (rowComplete && !isLockedByOther ? '#f0fdf4' : (isLockedByOther ? '#f8fafc' : '#ffffff')), zIndex: 1,
                          borderRight: '2px solid #e2e8f0', whiteSpace: 'nowrap',
                          color: isLockedByOther ? '#94a3b8' : '#334155', py: 0.5,
                          borderLeft: isLockedByMe ? '3px solid #38bdf8' : '3px solid transparent',
                          transition: 'border-left-color 0.12s',
                        }}>
                          <Stack direction="row" spacing={0.4} alignItems="center">
                            {rowComplete && !isLockedByOther && <CheckCircleIcon sx={{ fontSize: 11, color: '#22c55e', flexShrink: 0 }} />}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: isLockedByOther ? 'line-through' : 'none' }}>{fila.tienda?.nombre || fila.tienda?.codigo || '—'}</span>
                          </Stack>
                        </TableCell>

                        {/* Vertical cells: REF (top small) + ING (bottom large) */}
                        {current.columns.map(col => {
                          const valRef = rowCols[col] || 0;
                          const valInput = rowValidation[col] || 0;
                          const vs = getValidationStyles(valRef, valInput);
                          const isActive = activeCell && String(activeCell.filaId) === String(fila.id) && String(activeCell.col) === String(col) && String(activeCell.sheetId) === String(current.sheet.id);

                          return (
                            <TableCell
                              key={col}
                              id={`cell-${fila.id}-${col}`}
                              align="center"
                              tabIndex={isLockedByOther ? -1 : 0}
                              onClick={() => {
                                if (!isLockedByMe) {
                                  setSnackbar({ open: true, message: 'Debes seleccionar la tienda (Clic en "SEL") para editar', severity: 'warning' });
                                  if (!isLockedByOther) setActiveCell({ filaId: String(fila.id), col: String(col), sheetId: String(current.sheet.id!) });
                                  return;
                                }
                                setActiveCell({ filaId: String(fila.id), col: String(col), sheetId: String(current.sheet.id!) });
                              }}
                              onFocus={() => {
                                if (isLockedByOther) return;
                                setActiveCell({ filaId: String(fila.id), col: String(col), sheetId: String(current.sheet.id!) });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  if (!isLockedByMe) {
                                    setSnackbar({ open: true, message: 'Debes seleccionar la tienda (Clic en "SEL") para editar', severity: 'warning' });
                                    return;
                                  }
                                  setActiveCell({ filaId: String(fila.id), col: String(col), sheetId: String(current.sheet.id!) });
                                }
                              }}
                              sx={{
                                py: 0.3, px: 0.5, cursor: 'pointer',
                                borderLeft: '1px solid #f1f5f9',
                                bgcolor: isActive ? '#e0f2fe' : (valInput > 0 ? vs.bgcolor : 'transparent'),
                                border: isActive ? '4px solid #2563eb' : '1px solid transparent',
                                outline: 'none',
                                borderRadius: '6px',
                                transition: 'all 0.05s ease',
                                '&:hover': { bgcolor: isActive ? '#dbeafe' : (valInput > 0 ? vs.bgcolor : '#f8fafc'), filter: 'brightness(0.98)' },
                                '&:focus': { outline: 'none' },
                                position: 'relative',
                                zIndex: isActive ? 10 : 1,
                              }}
                            >
                              {/* REF — small, gray, top */}
                              <Typography sx={{
                                fontFamily: MONO_FONT, fontSize: '15px', lineHeight: 1.2,
                                color: valRef > 0 ? '#64748b' : '#cbd5e1',
                                fontWeight: 600,
                              }}>
                                {valRef}
                              </Typography>
                              {/* ING — large, bold, bottom */}
                              <Typography sx={{
                                fontFamily: MONO_FONT, fontSize: '24px', lineHeight: 1.2,
                                fontWeight: valInput > 0 ? 900 : 500,
                                color: valInput > 0 ? vs.color : '#94a3b8',
                                mt: -0.1,
                              }}>
                                {valInput || (valRef > 0 ? '—' : '')}
                              </Typography>
                              {/* Exact indicator */}
                              {vs.indicator === 'exact' && valInput > 0 && (
                                <CheckCircleIcon sx={{ fontSize: 7, color: '#22c55e', position: 'absolute', top: 1, right: 1 }} />
                              )}
                            </TableCell>
                          );
                        })}

                        {/* TOTAL — stacked */}
                        <TableCell align="center" sx={{ borderLeft: '2px solid #e2e8f0', py: 0.2 }}>
                          <Typography sx={{
                            fontFamily: MONO_FONT, fontSize: '15px', lineHeight: 1.2,
                            color: '#64748b', fontWeight: 600,
                          }}>
                            {fila.total}
                          </Typography>
                          <Typography sx={{
                            fontFamily: MONO_FONT, fontSize: '24px', lineHeight: 1.2,
                            fontWeight: 900, mt: -0.1,
                            color: mirrorRowTotal === 0 ? '#94a3b8'
                              : mirrorRowTotal === fila.total ? '#15803d'
                                : mirrorRowTotal > fila.total ? '#dc2626' : '#d97706',
                          }}>
                            {mirrorRowTotal > 0 ? mirrorRowTotal : '—'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* ── TOTALS ── */}
                  <TableRow sx={{ '& td': { borderTop: '2px solid #e2e8f0' } }}>
                    <TableCell sx={{
                      fontWeight: 900, fontSize: '0.72rem', position: 'sticky', left: 0,
                      bgcolor: '#f1f5f9', zIndex: 1, borderRight: '2px solid #e2e8f0',
                      color: '#475569', textTransform: 'uppercase', py: 0.4,
                    }}>
                      TOTALES
                    </TableCell>
                    {current.columns.map(col => {
                      const refTotal = current.columnTotals[col] || 0;
                      const mirrorTotal = mirrorColumnTotals[col] || 0;
                      const vs = getValidationStyles(refTotal, mirrorTotal);
                      return (
                        <TableCell key={`t-${col}`} align="center" sx={{
                          bgcolor: mirrorTotal > 0 ? vs.bgcolor : '#f8fafc',
                          borderLeft: '1px solid #f1f5f9', py: 0.4, px: 0.5,
                        }}>
                          <Typography sx={{ fontFamily: MONO_FONT, fontSize: '16px', color: '#6366f1', fontWeight: 700, lineHeight: 1.2 }}>
                            {refTotal}
                          </Typography>
                          <Typography sx={{
                            fontFamily: MONO_FONT, fontSize: '24px', fontWeight: 900, lineHeight: 1.2, mt: -0.1,
                            color: mirrorTotal > 0 ? vs.color : '#94a3b8',
                          }}>
                            {mirrorTotal || '—'}
                          </Typography>
                        </TableCell>
                      );
                    })}
                    <TableCell align="center" sx={{ borderLeft: '2px solid #e2e8f0', bgcolor: '#f1f5f9', py: 0.4 }}>
                      <Typography sx={{ fontFamily: MONO_FONT, fontSize: '16px', color: '#6366f1', fontWeight: 700, lineHeight: 1.2 }}>
                        {current.sheet.totalGeneral}
                      </Typography>
                      <Typography sx={{
                        fontFamily: MONO_FONT, fontSize: '24px', fontWeight: 900, lineHeight: 1.2, mt: -0.1,
                        color: mirrorGrandTotal === 0 ? '#94a3b8'
                          : mirrorGrandTotal === current.sheet.totalGeneral ? '#15803d' : '#dc2626',
                      }}>
                        {mirrorGrandTotal > 0 ? mirrorGrandTotal : '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Stack>

      {/* ── Snackbar Principal ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            minWidth: '400px',
          },
        }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ fontWeight: 700, borderRadius: '10px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* ── Notificación de Cambios del Admin ── */}
      <Snackbar
        open={notificacionCambios?.open || false}
        autoHideDuration={5000}
        onClose={() => setNotificacionCambios(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            minWidth: '500px',
            bgcolor: '#1e3a8a',
            color: 'white',
          },
        }}
      >
        <Alert
          onClose={() => setNotificacionCambios(null)}
          severity="info"
          variant="filled"
          sx={{ 
            fontWeight: 700, 
            borderRadius: '10px',
            bgcolor: '#1e3a8a',
            color: 'white',
            '& .MuiAlert-icon': { color: '#93c5fd' },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="subtitle2" fontWeight={900}>
              {notificacionCambios?.mensaje || ''}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {notificacionCambios?.ubicacion || ''}
            </Typography>
          </Box>
        </Alert>
      </Snackbar>
      </Container>
      </Box>
    </LocalizationProvider>
  );
}

export default EnviosPage;
