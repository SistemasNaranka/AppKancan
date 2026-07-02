import { useState, useEffect } from 'react';
import {
  Box, Paper, Button, TextField, InputAdornment, Stack, FormControl, InputLabel, Select, MenuItem,
  Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, IconButton
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';

import DateRangeFilter from '../components/DateRangeFilter';
import ExportHistorialDialog from '../components/ExportHistorialDialog';
import ExportNovedadesDialog from '../components/ExportNovedadesDialog';
import ExportEventosDialog from '../components/ExportEventosDialog';
import HistorialPage from './HistorialPage';
import NovedadesTab from '../components/NovedadesTab';
import { getStores, getStoreEventReports, getStoreNovedades } from '../api/directus/read';
import { Tienda } from '../interfaces/horarios.interface';

interface ReportePageProps {
  storeSel: number | null;
  onStoreChange: (id: number | null) => void;
  novedades: any[];
  esAdmin: boolean;
}

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

export default function ReportePage({ storeSel, onStoreChange, novedades, esAdmin }: ReportePageProps) {
  const [rangoInicio, setRangoInicio] = useState<Dayjs | null>(dayjs().subtract(29, 'day'));
  const [rangoFin, setRangoFin] = useState<Dayjs | null>(dayjs());
  const [searchNombre, setSearchNombre] = useState('');
  const [visualizarTab, setVisualizarTab] = useState<'registros' | 'novedades' | 'pausas'>('registros');

  const [exportHistorialOpen, setExportHistorialOpen] = useState(false);
  const [exportNovedadesOpen, setExportNovedadesOpen] = useState(false);
  const [exportEventosOpen, setExportEventosOpen] = useState(false);

  const [pagePausas, setPagePausas] = useState(0);
  const ROWS_PER_PAGE_PAUSAS = 5;

  const { data: tiendas = [] } = useQuery<Tienda[]>({
    queryKey: ['adminTiendas'],
    queryFn: getStores,
    staleTime: 30 * 60 * 1000,
  });

  const { data: eventReports = [] } = useQuery<any[]>({
    queryKey: ['storeEventReportsHistory', storeSel, rangoInicio?.format('YYYY-MM-DD'), rangoFin?.format('YYYY-MM-DD')],
    queryFn: () => getStoreEventReports(
      storeSel,
      rangoInicio ? rangoInicio.format('YYYY-MM-DD') : undefined,
      rangoFin ? rangoFin.format('YYYY-MM-DD') : undefined
    ),
  });

  useEffect(() => {
    setPagePausas(0);
  }, [storeSel, rangoInicio, rangoFin, searchNombre]);

  const { data: storeNovedades = [] } = useQuery<any[]>({
    queryKey: ['storeNovedadesHistory', storeSel],
    queryFn: () => getStoreNovedades(storeSel),
  });

  // Filtrar las novedades en pantalla según fechas y búsqueda por nombre de ReportePage
  const novedadesFiltradas = storeNovedades.filter((n) => {
    const matchNombre = (n.empleadoNombre || '').toLowerCase().includes(searchNombre.toLowerCase());
    let matchFecha = true;
    if (rangoInicio || rangoFin) {
      const fechaNov = dayjs(n.fecha);
      if (rangoInicio && fechaNov.isBefore(rangoInicio, 'day')) matchFecha = false;
      if (rangoFin && fechaNov.isAfter(rangoFin, 'day')) matchFecha = false;
    }
    return matchNombre && matchFecha;
  });

  // Filtrar las pausas activas según búsqueda por nombre de ReportePage
  const eventReportsFiltrados = eventReports.filter((r) => {
    const first = r.employee_id?.first_name || '';
    const middle = r.employee_id?.middle_name || '';
    const last = r.employee_id?.last_name || '';
    const second = r.employee_id?.second_last_name || '';
    const fullName = [first, middle, last, second].filter(Boolean).join(' ').trim();
    return fullName.toLowerCase().includes(searchNombre.toLowerCase());
  });

  // Paginación para Pausas Activas
  const paginatedPausas = eventReportsFiltrados.slice(
    pagePausas * ROWS_PER_PAGE_PAUSAS,
    pagePausas * ROWS_PER_PAGE_PAUSAS + ROWS_PER_PAGE_PAUSAS
  );
  const totalPagesPausas = Math.max(1, Math.ceil(eventReportsFiltrados.length / ROWS_PER_PAGE_PAUSAS));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Panel Unificado de Filtros y Exportaciones */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          border: '1px solid #f0e2e2ff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          bgcolor: '#fff',
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: 3 
          }}
        >
          {/* Lado Izquierdo: Filtros de Búsqueda */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 300, flexWrap: 'wrap' }}>
            {/* Filtro de Tienda */}
            <FormControl size="small" sx={{ width: { xs: '100%', sm: 220 } }}>
              <InputLabel id="tienda-reporte-label">Tienda</InputLabel>
              <Select
                labelId="tienda-reporte-label"
                value={storeSel || ''}
                label="Tienda"
                onChange={(e) => onStoreChange(Number(e.target.value) || null)}
                sx={{ 
                  borderRadius: 2, 
                  bgcolor: '#f1f7fe',
                  height: 40
                }}
              >
                <MenuItem value=""><em>Todas las tiendas</em></MenuItem>
                {tiendas.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ width: { xs: '100%', sm: 300 } }}>
              <DateRangeFilter
                fechaInicio={rangoInicio}
                fechaFin={rangoFin}
                onChange={(inicio, fin) => {
                  setRangoInicio(inicio);
                  setRangoFin(fin);
                }}
              />
            </Box>
            
            <TextField
              size="small"
              placeholder="Buscar por nombre..."
              value={searchNombre}
              onChange={(e) => setSearchNombre(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonSearchIcon sx={{ color: '#004680' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                width: { xs: '100%', sm: 220 },
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 2, 
                  bgcolor: '#f1f7fe',
                  height: 40
                } 
              }}
            />
          </Box>

          {/* Lado Derecho: Acciones de Exportación */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={1.5} 
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <Button
              variant="contained"
              disableElevation
              startIcon={<HistoryIcon />}
              onClick={() => setExportHistorialOpen(true)}
              sx={{
                bgcolor: '#004680',
                color: '#fff',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                height: 40,
                px: 2.5,
                '&:hover': { bgcolor: '#003366' },
              }}
            >
              Exportar Registros
            </Button>

            <Button
              variant="contained"
              disableElevation
              startIcon={<AssignmentIcon />}
              onClick={() => setExportNovedadesOpen(true)}
              sx={{
                bgcolor: '#b91c1c',
                color: '#fff',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                height: 40,
                px: 2.5,
                '&:hover': { bgcolor: '#991b1b' },
              }}
            >
              Exportar Novedades
            </Button>

            <Button
              variant="contained"
              disableElevation
              startIcon={<EventNoteIcon />}
              onClick={() => setExportEventosOpen(true)}
              sx={{
                bgcolor: '#0891b2',
                color: '#fff',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                height: 40,
                px: 2.5,
                '&:hover': { bgcolor: '#0e7490' },
              }}
            >
              Exportar Pausas Activas
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Visualización en pantalla */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 0, 
          borderRadius: 4, 
          overflow: 'hidden', 
          border: '1px solid #eef2f6',
          boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
        }}
      >
        {/* Selector de Visualización */}
        <Box sx={{ display: 'flex', borderBottom: '1px solid #eef2f6', px: 2, bgcolor: '#f8fafc', gap: 2 }}>
          <Button 
            onClick={() => setVisualizarTab('registros')}
            sx={{ 
              color: visualizarTab === 'registros' ? '#004680' : '#64748b', 
              borderBottom: visualizarTab === 'registros' ? '3px solid #004680' : '3px solid transparent',
              borderRadius: 0,
              py: 1.5,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.85rem',
              '&:hover': { bgcolor: 'transparent', color: '#004680' }
            }}
          >
            Visualizar Registros
          </Button>
          <Button 
            onClick={() => setVisualizarTab('novedades')}
            sx={{ 
              color: visualizarTab === 'novedades' ? '#004680' : '#64748b', 
              borderBottom: visualizarTab === 'novedades' ? '3px solid #004680' : '3px solid transparent',
              borderRadius: 0,
              py: 1.5,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.85rem',
              '&:hover': { bgcolor: 'transparent', color: '#004680' }
            }}
          >
            Visualizar Novedades
          </Button>
          <Button 
            onClick={() => setVisualizarTab('pausas')}
            sx={{ 
              color: visualizarTab === 'pausas' ? '#004680' : '#64748b', 
              borderBottom: visualizarTab === 'pausas' ? '3px solid #004680' : '3px solid transparent',
              borderRadius: 0,
              py: 1.5,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.85rem',
              '&:hover': { bgcolor: 'transparent', color: '#004680' }
            }}
          >
            Visualizar Pausas Activas
          </Button>
        </Box>

        {visualizarTab === 'registros' ? (
          <HistorialPage 
            storeIdAdmin={storeSel} 
            hideHeader={true}
            fechaInicioExternal={rangoInicio}
            fechaFinExternal={rangoFin}
            searchNombreExternal={searchNombre}
          />
        ) : visualizarTab === 'novedades' ? (
          <Box sx={{ p: 0 }}>
            <NovedadesTab 
              novedades={novedadesFiltradas} 
              esAdmin={esAdmin} 
              storeOverride={storeSel} 
            />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ overflow: 'auto' }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: '#f0f7ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Hora</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Empleado</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Tipo de Evento</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Observaciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedPausas.map((report: any, idx: number) => {
                    const first = report.employee_id?.first_name || '';
                    const middle = report.employee_id?.middle_name || '';
                    const last = report.employee_id?.last_name || '';
                    const second = report.employee_id?.second_last_name || '';
                    const nombreEmpleado = [first, middle, last, second].filter(Boolean).join(' ').trim() || `Empleado #${report.employee_id?.id || ''}`;
                    const inicial = nombreEmpleado.charAt(0).toUpperCase();
                    const fechaFormateada = report.date ? dayjs(report.date).format('DD [de] MMM [de] YYYY') : '—';
                    const horaFormateada = report.hour ? report.hour.substring(0, 5) : '—';
                    const observacion = report.observations || '—';

                    return (
                      <TableRow
                        key={report.id || idx}
                        hover
                        sx={{ bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafcff', transition: 'all 0.2s', '&:hover': { bgcolor: '#eef4ff' } }}
                      >
                        <TableCell sx={{ py: 1.5, fontWeight: 500, color: '#1e293b' }}>{fechaFormateada}</TableCell>
                        <TableCell sx={{ py: 1.5, fontWeight: 500, color: '#1e293b' }}>{horaFormateada}</TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: getAvatarColor(nombreEmpleado), fontSize: '1rem', fontWeight: 600 }}>
                              {inicial}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{nombreEmpleado}</Typography>
                              {report.employee_id?.document_number && (
                                <Typography variant="caption" sx={{ color: '#64748b' }}>Doc: {report.employee_id.document_number}</Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<PauseCircleIcon sx={{ fontSize: '1rem !important' }} />}
                            label={report.event_type}
                            size="medium"
                            sx={{
                              bgcolor: report.event_type.includes('Terminar') ? '#f0fdf4' : '#ecfeff',
                              color: report.event_type.includes('Terminar') ? '#16a34a' : '#0891b2',
                              fontWeight: 600,
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              '& .MuiChip-icon': {
                                color: report.event_type.includes('Terminar') ? '#16a34a' : '#0891b2',
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#475569', maxWidth: 300, wordBreak: 'break-word' }}>{observacion}</Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {eventReportsFiltrados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <PauseCircleIcon sx={{ fontSize: 48, color: '#cbd5e1' }} />
                          <Typography variant="body1" color="#94a3b8" sx={{ fontWeight: 500 }}>
                            No hay reportes de pausas activas para mostrar
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginador */}
            {eventReportsFiltrados.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fff', borderTop: '1px solid #eef2f6' }}>
                <Typography variant="caption" color="#64748b">
                  Mostrando {paginatedPausas.length} de {eventReportsFiltrados.length} pausas activas
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <IconButton size="small" disabled={pagePausas === 0} onClick={() => setPagePausas((p) => Math.max(p - 1, 0))} sx={{ border: '1px solid #dfe4ec', borderRadius: 1.5, width: 32, height: 32 }}>
                    <ChevronLeftIcon fontSize="small" />
                  </IconButton>
                  {[...Array(Math.min(totalPagesPausas, 7))].map((_, i) => {
                    let pageNum = i;
                    if (totalPagesPausas > 7) {
                      if (pagePausas < 3) pageNum = i;
                      else if (pagePausas > totalPagesPausas - 4) pageNum = totalPagesPausas - 7 + i;
                      else pageNum = pagePausas - 3 + i;
                    }
                    const isActive = pagePausas === pageNum;
                    return (
                      <Box
                        key={i}
                        onClick={() => setPagePausas(pageNum)}
                        sx={{
                          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1.5, cursor: 'pointer',
                          bgcolor: isActive ? '#004680' : '#fff', color: isActive ? '#fff' : '#5e6f8d',
                          border: isActive ? 'none' : '1px solid #dfe4ec', fontWeight: isActive ? 700 : 500, fontSize: '0.85rem', transition: 'all 0.2s',
                          '&:hover': { bgcolor: isActive ? '#004680' : '#f1f5f9' }
                        }}
                      >
                        {pageNum + 1}
                      </Box>
                    );
                  })}
                  <IconButton size="small" disabled={pagePausas === totalPagesPausas - 1} onClick={() => setPagePausas((p) => Math.min(p + 1, totalPagesPausas - 1))} sx={{ border: '1px solid #dfe4ec', borderRadius: 1.5, width: 32, height: 32 }}>
                    <ChevronRightIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Diálogos de exportación */}
      <ExportHistorialDialog 
        open={exportHistorialOpen} 
        onClose={() => setExportHistorialOpen(false)} 
        tiendaDefault={storeSel}
        fechaInicio={rangoInicio ? rangoInicio.format('YYYY-MM-DD') : undefined}
        fechaFin={rangoFin ? rangoFin.format('YYYY-MM-DD') : undefined}
        searchNombre={searchNombre}
      />
      <ExportNovedadesDialog 
        open={exportNovedadesOpen} 
        onClose={() => setExportNovedadesOpen(false)} 
        tiendaDefault={storeSel}
        fechaInicio={rangoInicio ? rangoInicio.format('YYYY-MM-DD') : undefined}
        fechaFin={rangoFin ? rangoFin.format('YYYY-MM-DD') : undefined}
        searchNombre={searchNombre}
      />
      <ExportEventosDialog 
        open={exportEventosOpen} 
        onClose={() => setExportEventosOpen(false)} 
        storeId={storeSel}
      />
    </Box>
  );
}
