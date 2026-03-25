import { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Snackbar,
  Alert,
  Stack,
  Tooltip,
  TextField,
  InputAdornment,
  LinearProgress,
  useTheme,
  alpha,
  IconButton,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarDensitySelector,
} from '@mui/x-data-grid';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReplayIcon from '@mui/icons-material/Replay';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useCurvas } from '../contexts/CurvasContext';
import { getResumenFechasCurvas } from '../api/directus/read';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

dayjs.locale('es');

import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';
import '@fontsource/roboto-mono/400.css';
import '@fontsource/roboto-mono/700.css';
import CustomSelectionModal, { SelectionItem } from '../../../shared/components/selectionmodal/CustomSelectionModal';

// ─────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────
const MAIN_FONT = "'Inter', sans-serif";
const MONO_FONT = "'Roboto Mono', 'Consolas', monospace";
const BRAND = {
  primary: '#006ACC',
  dark: '#004680',
  light: '#B8DCFF',
  bg: '#E6F4FF',
  text: '#1e293b',
  textLight: '#64748b'
};

// ─────────────────────────────────────────────
// Helper: get today's date as YYYY-MM-DD
// ─────────────────────────────────────────────
const getTodayStr = () => new Date().toISOString().split('T')[0];

// ─────────────────────────────────────────────
// Custom Toolbar for DataGrid
// ─────────────────────────────────────────────
const CustomToolbar = ({
  searchText,
  onSearchChange,
}: {
  searchText: string;
  onSearchChange: (v: string) => void;
}) => (
  <GridToolbarContainer
    sx={{ px: 2, py: 1, gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}
  >
    <TextField
      size="small"
      placeholder="Buscar establecimiento…"
      value={searchText}
      onChange={(e) => onSearchChange(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
          </InputAdornment>
        ),
        endAdornment: searchText ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => onSearchChange('')}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
      sx={{
        width: 280,
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          fontSize: '0.85rem',
          bgcolor: 'white',
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: BRAND.primary }
        },
      }}
    />
    <Box sx={{ flexGrow: 1 }} />
    <Stack direction="row" spacing={0.5}>
      <GridToolbarFilterButton sx={{ fontWeight: 700, p: 1 }} />
      <GridToolbarDensitySelector sx={{ fontWeight: 700, p: 1 }} />
      <GridToolbarExport sx={{ fontWeight: 700, p: 1 }} />
    </Stack>
  </GridToolbarContainer>
);

// ─────────────────────────────────────────────
// Main Dashboard Component
// ─────────────────────────────────────────────
const DashboardPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    datosCurvas,
    permissions,
    editarCelda,
    guardarCambios,
    confirmarLote,
    reutilizarLote,
    cargarDatosPorFecha,
    hasChanges,
    celdasEditadas,
    userRole,
    extractRef,
  } = useCurvas();

  const [sheetIndex, setSheetIndex] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // Date filter — defaults to today
  const [filtroFecha, setFiltroFecha] = useState<string>(getTodayStr());
  const [filtroReferencia, setFiltroReferencia] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [loadingDate, setLoadingDate] = useState(false);

  // Portal for global header
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [focusedCell, setFocusedCell] = useState<{ rowId: string; field: string } | null>(null);
  
  const initDateChecked = useRef(false);

  useEffect(() => {
    const checkDefaultDate = async () => {
      if (!initDateChecked.current) {
        initDateChecked.current = true;
        try {
          const resumen = await getResumenFechasCurvas();
          // Si hoy no tiene registros cargados, cambiamos al día más reciente que sí tenga
          if (!resumen[getTodayStr()]) {
            const fechasOrd = Object.keys(resumen).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
            if (fechasOrd.length > 0) {
              setFiltroFecha(fechasOrd[0]);
            }
          }
        } catch (error) {
           console.error('Error fetching resumen:', error);
        }
      }
    };
    checkDefaultDate();
  }, []);

  useLayoutEffect(() => {
    const el = document.getElementById('dashboard-page-header-portal');
    if (el) setPortalTarget(el);
  }, []);

  // ── Determine if selected date is today ──────────────────
  const isToday = useMemo(() => filtroFecha === getTodayStr(), [filtroFecha]);
  const isPastDate = useMemo(() => filtroFecha < getTodayStr(), [filtroFecha]);

  // ── Load data from DB when date changes ──────────────────
  useEffect(() => {
    if (!filtroFecha) return;
    setLoadingDate(true);
    setSheetIndex(0);
    cargarDatosPorFecha(filtroFecha).finally(() => setLoadingDate(false));
  }, [filtroFecha, cargarDatosPorFecha]);

  // ── Unified Data Selector ────────────────────────────────
  const allSheets = useMemo(() => {
    if (!datosCurvas) return [];
    const combined = [
      ...(datosCurvas.matrizGeneral || []).map(s => ({ ...s, _tipo: 'matriz_general' })),
      ...(datosCurvas.productos || []).map(s => ({ ...s, _tipo: 'productos' }))
    ];
    return combined.filter(s => {
      let refFull = '';
      try { refFull = extractRef(s).toUpperCase(); } catch { return false; }
      if (filtroReferencia && !refFull.includes(filtroReferencia.toUpperCase())) return false;
      return true;
    });
  }, [datosCurvas, extractRef, filtroReferencia]);

  const datosActuales = useMemo(() => allSheets[sheetIndex] || null, [allSheets, sheetIndex]);
  const totalSheets = allSheets.length;
  const sheetNames = useMemo(() => allSheets.map(s => extractRef(s)), [allSheets, extractRef]);

  const selectionItems = useMemo((): SelectionItem[] =>
    allSheets.map((s, idx) => ({
      id: idx,
      label: extractRef(s),
      description: `${s.filas.length} Establecimientos · ${'curvas' in s ? (s as any).curvas.length : (s as any).tallas.length} Tallas`,
      category: 'curvas' in s ? 'Matriz' : 'Producto',
    })),
    [allSheets, extractRef]);

  useEffect(() => { setSearchText(''); }, []);

  // ── Column definitions ───────────────────────────────────
  const columnas = useMemo((): GridColDef[] => {
    if (!datosActuales) return [];
    const isMatriz = 'curvas' in datosActuales;
    const items: string[] = isMatriz ? (datosActuales as any).curvas : (datosActuales as any).tallas;

    const cols: GridColDef[] = [
      {
        field: 'tienda',
        headerName: 'ESTABLECIMIENTO',
        minWidth: 250,
        flex: 2,
        editable: false,
        renderCell: (params: GridRenderCellParams) => {
          const isTotalRow = params.row.id === 'row-total-final';
          return (
            <Box sx={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center',
              bgcolor: isTotalRow ? '#0f172a' : 'transparent',
              color: isTotalRow ? 'white' : BRAND.text,
              px: 2,
              fontWeight: isTotalRow ? 800 : 600,
              gap: 1.5,
            }}>
              <StorefrontIcon sx={{ fontSize: 18, opacity: 0.6, color: isTotalRow ? 'white' : BRAND.primary }} />
              <Typography noWrap sx={{ fontWeight: 'inherit', fontSize: '0.85rem', letterSpacing: -0.2 }}>
                {params.row.tienda?.nombre || ''}
              </Typography>
            </Box>
          );
        },
        valueGetter: (_val: any, row: any) => row.tienda?.nombre || '',
      },
    ];

    items.forEach((item) => {
      cols.push({
        field: `val_${item}`,
        renderHeader: () => (
          <Box sx={{ textAlign: 'center', lineHeight: 1 }}>
            <Typography sx={{ fontFamily: MONO_FONT, fontWeight: 900, fontSize: '0.9rem', color: BRAND.text }}>
              {item.length === 1 && !isNaN(Number(item)) ? `0${item}` : item}
            </Typography>
          </Box>
        ),
        minWidth: 70,
        flex: 1,
        align: 'center',
        headerAlign: 'center',
        editable: permissions.canEdit && isToday, // Only editable on today's date
        renderCell: (params: GridRenderCellParams) => {
          const valor = Number(params.value || 0);
          const isTotalRow = params.row.id === 'row-total-final';

          if (isTotalRow) {
            return (
              <Box sx={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900,
                color: BRAND.primary,
                fontSize: '1.2rem',
                fontFamily: MONO_FONT,
                bgcolor: alpha(BRAND.primary, 0.05)
              }}>
                {valor || '—'}
              </Box>
            );
          }

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography sx={{
                fontFamily: MONO_FONT,
                fontSize: '0.95rem',
                fontWeight: valor > 0 ? 600 : 400,
                color: valor > 0 ? BRAND.text : '#cbd5e1'
              }}>
                {valor}
              </Typography>
            </Box>
          );
        },
      });
    });

    cols.push({
      field: 'total',
      headerName: 'TOTAL',
      minWidth: 100,
      flex: 1.2,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const isTotalRow = params.row.id === 'row-total-final';
        return (
          <Box sx={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: isTotalRow ? alpha(BRAND.primary, 0.1) : alpha(BRAND.textLight, 0.05),
            borderLeft: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography sx={{
              fontWeight: 900,
              fontFamily: MONO_FONT,
              fontSize: isTotalRow ? '1.2rem' : '1rem',
              color: isTotalRow ? BRAND.primary : BRAND.text
            }}>
              {Number(params.value || 0).toLocaleString()}
            </Typography>
          </Box>
        );
      },
    });

    return cols;
  }, [datosActuales, permissions.canEdit, isToday, theme]);

  // ── Row data ─────────────────────────────────────────────
  const filas = useMemo(() => {
    if (!datosActuales) return [];
    const isMatriz = 'curvas' in datosActuales;
    const itemsKey = isMatriz ? 'curvas' : 'tallas';

    const baseRows = datosActuales.filas.map((fila: any) => {
      const row: any = { id: fila.id, tienda: fila.tienda, total: fila.total };
      const items = fila[itemsKey] || {};
      Object.entries(items).forEach(([k, v]: any) => { row[`val_${k}`] = v.valor; });
      return row;
    });

    const totalRow: any = {
      id: 'row-total-final',
      tienda: { nombre: 'TOTAL GENERAL' },
      total: baseRows.reduce((sum, r) => sum + (r.total || 0), 0)
    };

    const columns = isMatriz ? (datosActuales as any).curvas : (datosActuales as any).tallas;
    columns.forEach((c: string) => {
      totalRow[`val_${c}`] = baseRows.reduce((sum, r) => sum + (r[`val_${c}`] || 0), 0);
    });

    return [...baseRows, totalRow];
  }, [datosActuales]);

  const filasFiltradas = useMemo(() => {
    if (!searchText) return filas;
    return filas.filter(f =>
      f.id === 'row-total-final' ||
      (f.tienda?.nombre || '').toLowerCase().includes(searchText.toLowerCase())
    );
  }, [filas, searchText]);

  // ── Handlers ─────────────────────────────────────────────
  const handleCellEdit = useCallback((rowId: string, field: string, newValue: any) => {
    if (!permissions.canEdit || rowId === 'row-total-final' || !datosActuales?.id || !isToday) return;
    const itemKey = field.replace('val_', '');
    editarCelda(datosActuales.id, rowId, itemKey, Number(newValue) || 0);
  }, [permissions.canEdit, editarCelda, datosActuales, isToday]);

  const handlePaste = useCallback((event: React.ClipboardEvent) => {
    // Only if today, editable, focused on a non-total cell
    if (!isToday || !permissions.canEdit || !focusedCell || !datosActuales) return;
    
    const text = event.clipboardData.getData('text');
    if (!text) return;

    // Parse clipboard text (TSV format from Excel)
    const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
    if (rows.length === 0) return;
    const data = rows.map(r => r.split('\t'));

    const startRowId = focusedCell.rowId;
    const startField = focusedCell.id === 'row-total-final' ? '' : focusedCell.field;
    if (!startField.startsWith('val_')) return;

    // Get ordered column fields that are editable
    const editColumns = columnas.filter(c => c.field.startsWith('val_')).map(c => c.field);
    const startColIdx = editColumns.indexOf(startField);
    if (startColIdx === -1) return;

    // Get current grid rows (except the total row)
    const gridRows = filasFiltradas.filter(r => r.id !== 'row-total-final');
    const startRowIdx = gridRows.findIndex(r => String(r.id) === String(startRowId));
    if (startRowIdx === -1) return;

    // Iterate through pasted data and update cells
    data.forEach((pastedRow, rOffset) => {
      const targetRow = gridRows[startRowIdx + rOffset];
      if (!targetRow) return;

      pastedRow.forEach((value, cOffset) => {
        const targetField = editColumns[startColIdx + cOffset];
        if (!targetField) return;

        const val = Number(value.trim().replace(/[^0-9.-]+/g, '')) || 0;
        const itemKey = targetField.replace('val_', '');
        editarCelda(datosActuales.id!, String(targetRow.id), itemKey, val);
      });
    });

    setSnackbar({ open: true, message: '📋 Datos pegados desde Excel correctamente', severity: 'success' });
  }, [isToday, permissions.canEdit, focusedCell, datosActuales, columnas, filasFiltradas, editarCelda]);

  const handleSave = async () => {
    setSaving(true);
    const ok = await guardarCambios();
    setSnackbar({ open: true, message: ok ? 'Cambios guardados exitosamente' : 'Error al guardar cambios', severity: ok ? 'success' : 'error' });
    setSaving(false);
  };

  const handleSend = async () => {
    if (!datosActuales?.id) return;
    setSaving(true);
    const isMatriz = 'curvas' in datosActuales;
    const ok = await confirmarLote(isMatriz ? 'general' : 'producto_a', datosActuales.id);
    if (ok) {
      setSnackbar({ open: true, message: 'Lote confirmado y enviado a despacho', severity: 'success' });
      navigate('/curvas/envios');
    } else {
      setSnackbar({ open: true, message: 'Error al confirmar lote', severity: 'error' });
    }
    setSaving(false);
  };

  const handleReutilizar = async () => {
    if (!datosActuales?.id) return;
    setSaving(true);
    const refANavegar = extractRef(datosActuales);
    const ok = await reutilizarLote(datosActuales.id);
    if (ok) {
      setSnackbar({ open: true, message: 'Lote reutilizado con fecha de hoy. Listo para editar y enviar.', severity: 'success' });
      setFiltroFecha(getTodayStr());
      // Forzar la selección del lote reulizado si aparece
      setTimeout(() => {
        setSheetIndex(0); // Por defecto el primero, pero intentaremos buscarlo por ref en un effect si fuera necesario
      }, 500);
    } else {
      setSnackbar({ open: true, message: 'Error al reutilizar el lote', severity: 'error' });
    }
    setSaving(false);
  };

  const isConfirmed = (datosActuales as any)?.estado === 'confirmado';

  // ── Header portal content ────────────────────────────────
  const headerFiltersContent = (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      flexWrap="wrap"
      sx={{
        py: { xs: 0.5, md: 0 },
        justifyContent: { xs: 'center', sm: 'flex-end' },
        width: '100%'
      }}
    >
      {/* Date badge — shows context */}
      {isPastDate ? (
        <Chip
          icon={<CalendarTodayIcon sx={{ fontSize: 12 }} />}
          label="Fecha anterior — solo lectura"
          size="small"
          sx={{
            bgcolor: '#fef3c7', color: '#92400e',
            fontWeight: 700, fontSize: '0.68rem', borderRadius: 1.5,
            border: '1px solid #fcd34d',
          }}
        />
      ) : null}

      {/* current ref label */}
      {datosActuales ? (
        <Box sx={{
          display: 'flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.15)',
          px: 1.2, py: 0.4, borderRadius: 2, border: '1px solid rgba(255,255,255,0.3)',
        }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 800, mr: 1, fontSize: '0.65rem' }}>
            REF:
          </Typography>
          <Button
            onClick={() => setShowSelector(true)}
            variant="text"
            sx={{
              color: 'white', fontWeight: 900, fontFamily: MONO_FONT, fontSize: '0.8rem',
              p: 0, minWidth: 0, textTransform: 'none',
            }}
          >
            {extractRef(datosActuales).toUpperCase()}
          </Button>
        </Box>
      ) : null}

      <Stack direction="row" spacing={1} alignItems="center">
        {/* Date filter */}
        <DatePicker
          value={dayjs(filtroFecha)}
          onChange={(v) => { if (v) setFiltroFecha(v.format('YYYY-MM-DD')); }}
          maxDate={dayjs()}
          slotProps={{
            textField: {
              size: 'small',
              sx: {
                width: { xs: 130, sm: 145 },
                '& .MuiOutlinedInput-root': { height: 30, fontSize: '0.75rem', bgcolor: 'white' },
              }
            }
          }}
        />
        {/* Reference filter */}
        <TextField
          size="small"
          placeholder="Filtrar ref…"
          value={filtroReferencia}
          onChange={(e) => setFiltroReferencia(e.target.value)}
          sx={{
            width: { xs: 100, sm: 130 },
            '& .MuiOutlinedInput-root': { height: 30, fontSize: '0.75rem', bgcolor: 'white' },
          }}
        />
      </Stack>

      <Stack direction="row" spacing={1}>
        {/* Guardar — only shown on today's date when there are changes */}
        {(isToday && hasChanges) ? (
          <Button
            variant="contained"
            size="small"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              fontWeight: 800, borderRadius: 1.5, textTransform: 'none', height: 30, fontSize: '0.75rem',
              bgcolor: '#f59e0b', color: '#1c1917', px: 1.5,
              '&:hover': { bgcolor: '#d97706' },
              '&.Mui-disabled': { bgcolor: 'rgba(245,158,11,0.3)', color: 'rgba(255,255,255,0.3)' }
            }}
          >
            Guardar
          </Button>
        ) : null}

        {/* Enviar — only on today; not shown when confirmed */}
        {(isToday && !isConfirmed) ? (
          <Button
            variant="contained"
            size="small"
            startIcon={<SendIcon />}
            onClick={handleSend}
            disabled={saving || hasChanges}
            sx={{
              fontWeight: 800, borderRadius: 1.5, textTransform: 'none', height: 30, fontSize: '0.75rem',
              bgcolor: 'white', color: '#006ACC', px: 1.5,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
              '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.3)', color: 'rgba(0,106,204,0.4)' }
            }}
          >
            Enviar
          </Button>
        ) : null}

        {/* Reutilizar — only on past dates */}
        {(isPastDate && datosActuales) ? (
          <Tooltip title="Crea un nuevo despacho con estos datos usando la fecha de hoy">
            <Button
              variant="contained"
              size="small"
              startIcon={<ReplayIcon />}
              onClick={handleReutilizar}
              disabled={saving}
              sx={{
                fontWeight: 800, borderRadius: 1.5, textTransform: 'none', height: 30, fontSize: '0.75rem',
                bgcolor: '#8b5cf6', color: 'white', px: 1.5,
                '&:hover': { bgcolor: '#7c3aed' },
                '&.Mui-disabled': { bgcolor: 'rgba(139,92,246,0.3)', color: 'rgba(255,255,255,0.3)' }
              }}
            >
              Reutilizar
            </Button>
          </Tooltip>
        ) : null}
      </Stack>
    </Stack>
  );

  // ── Render ────────────────────────────────────────────────
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box sx={{ pb: 4, fontFamily: MAIN_FONT }}>
        {portalTarget ? createPortal(headerFiltersContent, portalTarget) : null}

      {/* Loading bar while fetching by date */}
      {loadingDate ? <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000 }} /> : null}

      <Container maxWidth="xl" sx={{ mt: 3 }}>
        {!datosCurvas ? (
          <Paper elevation={0} sx={{ p: 10, textAlign: 'center', borderRadius: 4, border: '2px dashed', borderColor: 'divider' }}>
            <InventoryIcon sx={{ fontSize: 72, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.secondary' }}>
              Cargando datos maestros...
            </Typography>
          </Paper>
        ) : totalSheets === 0 ? (
          // ── No data for selected date ────────────────────────
          <Paper elevation={0} sx={{ p: 10, textAlign: 'center', borderRadius: 4, border: '2px dashed #e2e8f0', bgcolor: '#f8fafc' }}>
            <CalendarTodayIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#475569', fontFamily: MAIN_FONT }}>
              Sin referencias para esta fecha
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
              {filtroFecha === getTodayStr()
                ? 'No se han guardado referencias hoy. Sube un archivo o usa las plantillas para comenzar.'
                : `No hay registros guardados el ${new Date(filtroFecha + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}.`}
            </Typography>
          </Paper>
        ) : (
          <Paper
            elevation={4}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 8px 32px rgba(0,0,0,0.06)'
            }}
          >
            {totalSheets > 1 && (
              <Tabs
                value={sheetIndex}
                onChange={(_, v) => setSheetIndex(v)}
                variant="scrollable"
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                  '& .MuiTab-root': {
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    minHeight: 48,
                    color: BRAND.textLight
                  },
                  '& .Mui-selected': { color: BRAND.primary }
                }}
              >
                {sheetNames.map((name, i) => <Tab key={i} label={name} />)}
              </Tabs>
            )}

            {/* Past-date read-only banner */}
            {isPastDate && (
              <Box sx={{
                px: 2, py: 1,
                bgcolor: '#fffbeb',
                borderBottom: '1px solid #fcd34d',
                display: 'flex', alignItems: 'center', gap: 1,
              }}>
                <CalendarTodayIcon sx={{ fontSize: 15, color: '#92400e' }} />
                <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 700, fontSize: '0.72rem' }}>
                  Estás viendo datos del {new Date(filtroFecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}. La tabla está en modo lectura. Usa <strong>"Reutilizar"</strong> para enviar estos datos a despacho con la fecha de hoy.
                </Typography>
              </Box>
            )}

            <Box sx={{ height: 750, width: '100%', position: 'relative' }} onPaste={handlePaste}>
              <DataGrid
                rows={filasFiltradas}
                columns={columnas}
                rowHeight={56}
                columnHeaderHeight={60}
                hideFooter
                disableColumnMenu
                disableColumnSorting
                disableColumnFilter
                disableRowSelectionOnClick
                slots={{ toolbar: CustomToolbar }}
                slotProps={{ toolbar: { searchText, onSearchChange: setSearchText } as any }}
                onCellFocusIn={(params) => setFocusedCell({ rowId: String(params.id), field: params.field })}
                processRowUpdate={(newRow) => {
                  if (!isToday) return newRow; // Block edits on past dates
                  const oldRow = filas.find(r => r.id === newRow.id);
                  if (oldRow) {
                    Object.keys(newRow).forEach(key => {
                      if (key.startsWith('val_') && newRow[key] !== oldRow[key]) {
                        handleCellEdit(String(newRow.id), key, newRow[key]);
                      }
                    });
                  }
                  return newRow;
                }}
                sx={{
                  width: '100%',
                  border: 'none',
                  fontFamily: MAIN_FONT,
                  '& .MuiDataGrid-columnHeaders': {
                    bgcolor: '#f1f5f9',
                    borderBottom: '2px solid',
                    borderColor: 'divider'
                  },
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 900,
                    fontSize: '0.8rem',
                    color: BRAND.text,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  },
                  '& .MuiDataGrid-cell': {
                    borderColor: alpha(theme.palette.divider, 0.5),
                  },
                  '& .MuiDataGrid-row:hover': {
                    bgcolor: alpha(BRAND.primary, 0.02)
                  },
                  '& .MuiDataGrid-row:last-child': {
                    bgcolor: '#f8fafc',
                    fontWeight: 900,
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 2,
                    borderTop: '2px solid',
                    borderColor: 'divider',
                    '&:hover': { bgcolor: '#f1f5f9' }
                  },
                }}
              />
            </Box>
          </Paper>
        )}
      </Container>

      <CustomSelectionModal
        open={showSelector}
        onClose={() => setShowSelector(false)}
        onConfirm={(selected) => {
          if (selected.length > 0) {
            setSheetIndex(Number(selected[0]));
            setShowSelector(false);
          }
        }}
        items={selectionItems}
        title="Seleccionar Lote"
        initialSelected={[sheetIndex]}
        labelKey="label"
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default DashboardPage;
