import { useState } from 'react';
import {
  Box, Typography, IconButton, Paper, Avatar, Chip, TextField, InputAdornment, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import ClearIcon from '@mui/icons-material/Clear';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useHolidays } from '../../reservas/hooks/useHolidays';
import { FestivoDay } from './FestivoDay';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { getIconForTipo, getChipColor } from '../utils/novedadVisual';
import ExportNovedadesDialog from './reportes/ExportNovedadesDialog';
import { formatDocumentNumber } from '../utils/format';

const AVATAR_COLORS = [
  '#0284c7', '#7c3aed', '#16a34a', '#ea580c', '#db2777',
  '#0891b2', '#4f46e5', '#ca8a04', '#dc2626', '#059669',
  '#2563eb', '#9333ea',
];

const getAvatarColor = (texto: string) => {
  const str = String(texto || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

interface Props {
  novedades: any[];
  esAdmin: boolean;
  storeOverride?: number;
  rowsPerPage?: number;
  esReporte?: boolean;
}

export default function NovedadesTab({ novedades, esAdmin, storeOverride, rowsPerPage = 5, esReporte = false }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState<Dayjs | null>(null);
  const [calendarYear, setCalendarYear] = useState(() => dayjs().year());
  const { data: festivosMap = {} } = useHolidays(calendarYear);
  const [soloActivos, setSoloActivos] = useState(false);
  const [page, setPage] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(rowsPerPage || 5);
  const [exportOpen, setExportOpen] = useState(false);

  const novedadesFiltradas = esReporte
    ? novedades
    : novedades.filter((n: any) => {
        const matchNombre = (n.empleadoNombre || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchFecha = fechaFiltro ? dayjs(n.fecha).isSame(fechaFiltro, 'day') : true;
        const matchActivo = !soloActivos || n.empleadoActivo;
        return matchNombre && matchFecha && matchActivo;
      });

  const paginated = filasPorPagina === 0
    ? novedadesFiltradas
    : novedadesFiltradas.slice(page * filasPorPagina, page * filasPorPagina + filasPorPagina);
  const totalPages = filasPorPagina === 0
    ? 1
    : Math.max(1, Math.ceil(novedadesFiltradas.length / filasPorPagina));

  return (
    <>
      <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #eef2f6', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        {/* Cabecera con filtros */}
        <Box sx={{ p: 2, bgcolor: '#ffffff', borderBottom: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 2, flexShrink: 0, color: '#004680', bgcolor: '#eaf2fb', border: '1px solid #d6e6f7' }}>
              <AssignmentIcon sx={{ fontSize: 19 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, color: '#0f2c4a', fontSize: '1rem', lineHeight: 1.2 }}>
              Novedades registradas
            </Typography>
            {!esReporte && (
              <Chip
                label={novedadesFiltradas.length}
                size="small"
                sx={{ height: 22, fontWeight: 700, fontSize: '0.72rem', bgcolor: '#eaf2fb', color: '#004680' }}
              />
            )}
          </Box>
          {!esReporte && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
              <Box
                className="tour-nov-search"
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: { xs: '100%', sm: 280, md: 350 }, height: 38 }}
              >
                <TextField
                  size="small"
                  placeholder="Nombre del empleado..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end" sx={{ gap: 0.5 }}>
                          {searchQuery && (
                            <IconButton size="small" onClick={() => { setSearchQuery(''); setPage(0); }}>
                              <ClearIcon sx={{ fontSize: 16, color: '#8a9bb5' }} />
                            </IconButton>
                          )}
                          <PersonSearchIcon sx={{ color: '#004680', fontSize: 20, mr: 0.5 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2, bgcolor: '#f1f7fe', height: 38,
                      '& fieldset': { borderColor: '#cbd5e1' },
                      '&:hover fieldset': { borderColor: '#94a3b8' },
                      '&.Mui-focused fieldset': { borderColor: '#004680' },
                    },
                    '& .MuiOutlinedInput-input': { fontSize: '0.85rem', color: '#475569', '&::placeholder': { color: '#8a9bb5', opacity: 1 } }
                  }}
                />
              </Box>

              {/* DATE PICKER */}
              <Box className="tour-nov-fecha">
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                  <DatePicker
                    label=""
                    value={fechaFiltro}
                    onChange={(newVal) => { setFechaFiltro(newVal as Dayjs | null); setPage(0); }}
                    onMonthChange={(m: any) => setCalendarYear(dayjs(m).year())}
                    onYearChange={(y: any) => setCalendarYear(dayjs(y).year())}
                    slots={{ day: FestivoDay }}
                    format="DD/MM/YYYY"
                    slotProps={{
                      day: { holidays: festivosMap } as any,
                      shortcuts: {
                        items: [
                          { label: 'Hoy', getValue: () => dayjs() },
                          { label: 'Ayer', getValue: () => dayjs().subtract(1, 'day') },
                        ],
                      },
                      textField: {
                        size: 'small',
                        placeholder: 'DD/MM/YYYY',
                        sx: {
                          width: 195,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2, bgcolor: '#f9fafc', height: 38,
                            '& fieldset': { borderColor: '#cbd5e1' },
                            '&:hover fieldset': { borderColor: '#94a3b8' },
                            '&.Mui-focused fieldset': { borderColor: '#004680' },
                          },
                          '& .MuiOutlinedInput-input': { fontSize: '0.85rem', color: '#475569' }
                        }
                      },
                      field: { clearable: true, onClear: () => { setFechaFiltro(null); setPage(0); } },
                    }}
                  />
                </LocalizationProvider>
              </Box>

              <Chip
                label="Solo activos"
                clickable
                onClick={() => { setSoloActivos((v) => !v); setPage(0); }}
                variant={soloActivos ? 'filled' : 'outlined'}
                sx={{
                  height: 38, borderRadius: 2, fontWeight: 700, fontSize: '0.78rem',
                  bgcolor: soloActivos ? '#004680' : 'transparent',
                  color: soloActivos ? '#fff' : '#475569',
                  borderColor: '#cbd5e1',
                  '&:hover': { bgcolor: soloActivos ? '#003a6b' : '#eef4fb' },
                }}
              />

              <Button
                className="tour-nov-export"
                onClick={() => setExportOpen(true)}
                variant="contained"
                disableElevation
                startIcon={<FileDownloadIcon />}
                sx={{ bgcolor: '#004680', textTransform: 'none', fontWeight: 700, borderRadius: 2, height: 38, '&:hover': { bgcolor: '#003a6b' } }}
              >
                Exportar
              </Button>
            </Box>
          )}
        </Box>

        {/* Tabla */}
        <TableContainer className="tour-nov-tabla" sx={{ overflow: 'auto' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#f0f7ff' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Empleado</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Tienda</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Tipo de Novedad</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Observaciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((novedad: any, idx: number) => {
                const chipColors = getChipColor(novedad.tipo, esReporte);
                const nombreEmpleado = novedad.empleadoNombre || 'Empleado';
                const inicial = nombreEmpleado.charAt(0).toUpperCase();
                const fechaFormateada = novedad.fecha ? dayjs(novedad.fecha).format('DD [de] MMM [de] YYYY') : '—';
                const observacionCorta = novedad.observaciones?.length > 60
                  ? novedad.observaciones.substring(0, 60) + '…'
                  : novedad.observaciones || '—';

                return (
                  <TableRow
                    key={novedad.id || idx}
                    hover
                    sx={{ bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafcff', transition: 'all 0.2s', '&:hover': { bgcolor: '#eef4ff' } }}
                  >
                    <TableCell sx={{ py: 1.5, fontWeight: 500, color: '#1e293b' }}>{fechaFormateada}</TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: getAvatarColor(nombreEmpleado), fontSize: '1rem', fontWeight: 600 }}>
                          {inicial}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{nombreEmpleado}</Typography>
                          {esReporte && novedad.empleadoDocumento && (
                            <Typography variant="caption" sx={{ color: '#64748b' }}>Doc: {formatDocumentNumber(novedad.empleadoDocumento)}</Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, fontWeight: 500, color: '#475569' }}>
                      {novedad.tiendaNombre || '—'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getIconForTipo(novedad.tipo)}
                        label={novedad.tipo || 'Sin tipo'}
                        size="medium"
                        sx={{
                          bgcolor: chipColors.bg, color: chipColors.text, fontWeight: 600, borderRadius: '20px', fontSize: '0.75rem',
                          '& .MuiChip-icon': { color: chipColors.text, ml: 0.5, fontSize: '1rem' }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#475569', maxWidth: 300, wordBreak: 'break-word' }}>{observacionCorta}</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}

              {novedadesFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <AssignmentIcon sx={{ fontSize: 48, color: '#cbd5e1' }} />
                      <Typography variant="body1" color="#94a3b8" sx={{ fontWeight: 500 }}>
                        {searchQuery && fechaFiltro
                          ? 'No hay novedades registradas con este nombre en esta fecha'
                          : searchQuery
                          ? 'No hay novedades registradas con este nombre'
                          : fechaFiltro
                          ? 'No hay novedades registradas con esta fecha'
                          : 'No hay novedades registradas'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginador */}
        {filasPorPagina !== 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fff', borderTop: '1px solid #eef2f6' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="caption" color="#64748b">
                Mostrando {paginated.length} de {novedadesFiltradas.length} novedades
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="#64748b">
                  Registros por página:
                </Typography>
                <Select
                  value={filasPorPagina}
                  onChange={(e) => {
                    setFilasPorPagina(Number(e.target.value));
                    setPage(0);
                  }}
                  size="small"
                  sx={{
                    bgcolor: '#f1f7fe',
                    borderRadius: 2,
                    fontSize: '0.75rem',
                    minWidth: 70,
                    height: 30,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94a3b8' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#004680' }
                  }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <IconButton size="small" disabled={page === 0} onClick={() => setPage((p) => Math.max(p - 1, 0))} sx={{ border: '1px solid #dfe4ec', borderRadius: 1.5, width: 32, height: 32 }}>
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              {(() => {
                const paginas: (number | string)[] = [];
                if (totalPages <= 7) {
                  for (let i = 0; i < totalPages; i++) paginas.push(i);
                } else {
                  paginas.push(0);
                  if (page > 2) paginas.push('dots-1');
                  const start = Math.max(1, page - 1);
                  const end = Math.min(totalPages - 2, page + 1);
                  for (let i = start; i <= end; i++) paginas.push(i);
                  if (page < totalPages - 3) paginas.push('dots-2');
                  paginas.push(totalPages - 1);
                }
                return paginas.map((item, idx) =>
                  typeof item === 'string' ? (
                    <Typography key={`${item}-${idx}`} variant="caption" sx={{ color: '#94a3b8', px: 0.5 }}>...</Typography>
                  ) : (
                    <Box
                      key={item}
                      onClick={() => setPage(item)}
                      sx={{
                        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1.5, cursor: 'pointer',
                        bgcolor: page === item ? '#004680' : '#fff', color: page === item ? '#fff' : '#5e6f8d',
                        border: page === item ? 'none' : '1px solid #dfe4ec', fontWeight: page === item ? 700 : 500, fontSize: '0.85rem', transition: 'all 0.2s',
                        '&:hover': { bgcolor: page === item ? '#004680' : '#f1f5f9' }
                      }}
                    >
                      {item + 1}
                    </Box>
                  )
                );
              })()}
              <IconButton size="small" disabled={page === totalPages - 1} onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))} sx={{ border: '1px solid #dfe4ec', borderRadius: 1.5, width: 32, height: 32 }}>
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}
      </Paper>

      <ExportNovedadesDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        fechaInicio={fechaFiltro ? fechaFiltro.format('YYYY-MM-DD') : undefined}
        fechaFin={fechaFiltro ? fechaFiltro.format('YYYY-MM-DD') : undefined}
        tiendaDefault={storeOverride}
        searchNombre={searchQuery}
      />
    </>
  );
}
