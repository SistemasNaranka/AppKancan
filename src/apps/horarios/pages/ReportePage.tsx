import { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Button, TextField, InputAdornment, Stack, FormControl, InputLabel, Select, MenuItem,
  Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, IconButton,
  Alert, CircularProgress, Autocomplete
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

import DateRangeFilter from '../components/reportes/DateRangeFilter';
import ExportHistorialDialog from '../components/reportes/ExportHistorialDialog';
import ExportNovedadesDialog from '../components/reportes/ExportNovedadesDialog';
import ExportEventosDialog from '../components/reportes/ExportEventosDialog';
import HistorialPage from './HistorialPage';
import NovedadesTab from '../components/NovedadesTab';
import { getStores, getStoreEventReports, getStoreNovedades, getEmpleadosBulk, getTimeRecordsBulkRange, getPrimerPeriodoRegistro } from '../api/directus/read';
import { Tienda } from '../interfaces/horarios.interface';
import { formatDocumentNumber } from '../utils/format';

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


function getSemanasDelMes(anio: number, mes: number) {
  const startOfMonth = dayjs().year(anio).month(mes).startOf('month');
  const endOfMonth = startOfMonth.endOf('month');

  const semanas = [];
  let currentMonday = startOfMonth.subtract((startOfMonth.day() + 6) % 7, 'day');

  while (currentMonday.isBefore(endOfMonth) || currentMonday.isSame(endOfMonth, 'day')) {
    const sunday = currentMonday.add(6, 'day');
    semanas.push({
      start: currentMonday.format('YYYY-MM-DD'),
      end: sunday.format('YYYY-MM-DD'),
      label: `${currentMonday.format('DD/MM')} - ${sunday.format('DD/MM')}`
    });
    currentMonday = currentMonday.add(7, 'day');
  }
  return semanas;
}

const calcularMinutosSemanales = (empId: any, startStr: string, endStr: string, records: any[]): number => {
    const start = dayjs(startStr);
    const end = dayjs(endStr);
    
    const empRecords = records.filter(r => {
        const id = Number(r.employee_id?.id || r.employee_id);
        if (id !== Number(empId)) return false;
        const date = dayjs(r.record_date);
        return (date.isSame(start, 'day') || date.isAfter(start, 'day')) && 
               (date.isSame(end, 'day') || date.isBefore(end, 'day'));
    });

    if (empRecords.length === 0) return 0;

    const byDay: Record<string, any[]> = {};
    empRecords.forEach(r => {
        (byDay[r.record_date] ||= []).push(r);
    });

    let totalMinutes = 0;
    for (const date in byDay) {
        const recs = byDay[date];
        const entrada = recs.find(r => r.log_type === 'Comenzar Jornada');
        const salida = recs.find(r => r.log_type === 'Terminar Jornada');
        if (entrada && salida) {
            const h1 = entrada.record_time || entrada.time;
            const h2 = salida.record_time || salida.time;
            if (h1 && h2) {
                const [a, b] = h1.split(':').map(Number);
                const [c, d] = h2.split(':').map(Number);
                if (!isNaN(a) && !isNaN(b) && !isNaN(c) && !isNaN(d)) {
                    let totalDia = (c * 60 + d) - (a * 60 + b);
                    if (totalDia < 0) totalDia = 0;

                    const iniAlmuerzo = recs.find(r => r.log_type === 'Iniciar Almuerzo');
                    const finAlmuerzo = recs.find(r => r.log_type === 'Finalizar Almuerzo');
                    if (iniAlmuerzo && finAlmuerzo) {
                        const ha1 = iniAlmuerzo.record_time || iniAlmuerzo.time;
                        const ha2 = finAlmuerzo.record_time || finAlmuerzo.time;
                        if (ha1 && ha2) {
                            const [al1, al2] = ha1.split(':').map(Number);
                            const [al3, al4] = ha2.split(':').map(Number);
                            if (!isNaN(al1) && !isNaN(al2) && !isNaN(al3) && !isNaN(al4)) {
                                const almuerzoMinutos = (al3 * 60 + al4) - (al1 * 60 + al2);
                                if (almuerzoMinutos > 0) {
                                    totalDia -= almuerzoMinutos;
                                }
                            }
                        }
                    }
                    if (totalDia > 0) {
                        totalMinutes += totalDia;
                    }
                }
            }
        }
    }
    return totalMinutes;
};

const formatMinutes = (totalMin: number): string => {
    if (totalMin === 0) return '0h';
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export default function ReportePage({ storeSel, onStoreChange, novedades: _, esAdmin }: ReportePageProps) {
  const [rangoInicio, setRangoInicio] = useState<Dayjs | null>(dayjs().subtract(6, 'day'));
  const [rangoFin, setRangoFin] = useState<Dayjs | null>(dayjs());
  const [searchNombre, setSearchNombre] = useState('');
  const [visualizarTab, setVisualizarTab] = useState<'registros' | 'novedades' | 'pausas' | 'semanal'>('registros');

  // Estados para reporte semanal
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month()); // 0-indexed
  const [pageSemanal, setPageSemanal] = useState(0);
  const ROWS_PER_PAGE_SEMANAL = 10;
  const [reporteSemanalModo, setReporteSemanalModo] = useState<'tienda' | 'empleado'>('tienda');
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<number | null>(null);

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

  // Consultas y datos para el Reporte Semanal
  const semanasDelMes = useMemo(() => {
    return getSemanasDelMes(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const startRange = semanasDelMes[0]?.start;
  const endRange = semanasDelMes[semanasDelMes.length - 1]?.end;

  const { data: recordsMensuales = [], isLoading: cargandoRecords } = useQuery({
    queryKey: ['recordsMensuales', storeSel, startRange, endRange],
    queryFn: () => {
      if (!storeSel || !startRange || !endRange) return Promise.resolve([]);
      return getTimeRecordsBulkRange([storeSel], startRange, endRange);
    },
    enabled: visualizarTab === 'semanal' && reporteSemanalModo === 'tienda' && !!storeSel && !!startRange && !!endRange,
    staleTime: 5 * 60 * 1000,
  });

  const { data: empleadosStore = [], isLoading: cargandoEmpleados } = useQuery({
    queryKey: ['empleadosStore', storeSel],
    queryFn: () => {
      if (!storeSel) return Promise.resolve([]);
      return getEmpleadosBulk([storeSel]);
    },
    enabled: visualizarTab === 'semanal' && reporteSemanalModo === 'tienda' && !!storeSel,
    staleTime: 5 * 60 * 1000,
  });

  const { data: todosEmpleados = [], isLoading: cargandoTodosEmpleados } = useQuery({
    queryKey: ['todosEmpleadosAutocomplete'],
    queryFn: () => getEmpleadosBulk([]),
    enabled: visualizarTab === 'semanal',
    staleTime: 30 * 60 * 1000,
  });

  const allStoreIds = useMemo(() => tiendas.map(t => Number(t.id)), [tiendas]);

  const { data: recordsMensualesGlobal = [], isLoading: cargandoRecordsGlobal } = useQuery({
    queryKey: ['recordsMensualesGlobal', allStoreIds, startRange, endRange],
    queryFn: () => {
      if (allStoreIds.length === 0 || !startRange || !endRange) return Promise.resolve([]);
      return getTimeRecordsBulkRange(allStoreIds, startRange, endRange);
    },
    enabled: visualizarTab === 'semanal' && reporteSemanalModo === 'empleado' && allStoreIds.length > 0 && !!startRange && !!endRange,
    staleTime: 5 * 60 * 1000,
  });

  const recordsSelectedEmp = useMemo(() => {
    if (!selectedEmpleadoId) return [];
    return recordsMensualesGlobal.filter(r => Number(r.employee_id?.id || r.employee_id) === Number(selectedEmpleadoId));
  }, [recordsMensualesGlobal, selectedEmpleadoId]);

  const storesTrabajadas = useMemo(() => {
    if (recordsSelectedEmp.length === 0) return [];
    const storesMap = new Map<number, string>(tiendas.map(t => [Number(t.id), t.name]));
    const uniqueIds = Array.from(new Set(recordsSelectedEmp.map(r => Number(r.store_id))));
    return uniqueIds.map(id => ({
      id,
      name: storesMap.get(id) || `Tienda #${id}`
    }));
  }, [recordsSelectedEmp, tiendas]);

  const empleadosFiltradosSemanales = useMemo(() => {
    return empleadosStore.filter((emp: any) => {
      const fullName = emp.nombre || '';
      return fullName.toLowerCase().includes(searchNombre.toLowerCase());
    });
  }, [empleadosStore, searchNombre]);

  const paginatedEmpleadosSemanal = useMemo(() => {
    const start = pageSemanal * ROWS_PER_PAGE_SEMANAL;
    return empleadosFiltradosSemanales.slice(start, start + ROWS_PER_PAGE_SEMANAL);
  }, [empleadosFiltradosSemanales, pageSemanal]);

  const totalPagesSemanal = Math.max(1, Math.ceil(empleadosFiltradosSemanales.length / ROWS_PER_PAGE_SEMANAL));

  const { data: primerPeriodo = { year: dayjs().year(), month: 0 } } = useQuery({
    queryKey: ['primerPeriodoRegistro'],
    queryFn: getPrimerPeriodoRegistro,
    staleTime: Infinity,
  });

  const listadoAnios = useMemo(() => {
    const currentYear = dayjs().year();
    const years = [];
    const startY = primerPeriodo.year;
    for (let y = startY; y <= currentYear; y++) {
      years.push(y);
    }
    if (years.length === 0) {
      years.push(currentYear);
    }
    return years;
  }, [primerPeriodo.year]);

  const NOMBRES_MESES = useMemo(() => [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ], []);

  const listadoMeses = useMemo(() => {
    const startM = selectedYear === primerPeriodo.year ? primerPeriodo.month : 0;
    const endM = selectedYear === dayjs().year() ? dayjs().month() : 11;
    const months = [];
    for (let m = startM; m <= endM; m++) {
      months.push({ value: m, label: NOMBRES_MESES[m] });
    }
    return months;
  }, [selectedYear, primerPeriodo, NOMBRES_MESES]);

  // Asegurar que el mes seleccionado esté dentro de los límites válidos al cambiar el año
  useEffect(() => {
    const minM = selectedYear === primerPeriodo.year ? primerPeriodo.month : 0;
    const maxM = selectedYear === dayjs().year() ? dayjs().month() : 11;
    if (selectedMonth < minM) {
      setSelectedMonth(minM);
    } else if (selectedMonth > maxM) {
      setSelectedMonth(maxM);
    }
  }, [selectedYear, primerPeriodo, selectedMonth]);

  useEffect(() => {
    setPageSemanal(0);
  }, [storeSel, selectedMonth, selectedYear, searchNombre]);

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
            <Autocomplete
              size="small"
              options={tiendas}
              getOptionLabel={(option) => option.name}
              value={tiendas.find((t) => Number(t.id) === Number(storeSel)) || null}
              onChange={(_, newValue) => {
                onStoreChange(newValue ? Number(newValue.id) : null);
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Tienda" 
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#f1f7fe',
                      height: 40
                    }
                  }}
                />
              )}
              sx={{ width: { xs: '100%', sm: 220 } }}
            />

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
          <Button 
            onClick={() => setVisualizarTab('semanal')}
            sx={{ 
              color: visualizarTab === 'semanal' ? '#004680' : '#64748b', 
              borderBottom: visualizarTab === 'semanal' ? '3px solid #004680' : '3px solid transparent',
              borderRadius: 0,
              py: 1.5,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.85rem',
              '&:hover': { bgcolor: 'transparent', color: '#004680' }
            }}
          >
            Reporte Horas Semanal
          </Button>
        </Box>

        {visualizarTab === 'registros' ? (
          <HistorialPage 
            storeIdAdmin={storeSel} 
            hideHeader={true}
            fechaInicioExternal={rangoInicio}
            fechaFinExternal={rangoFin}
            searchNombreExternal={searchNombre}
            esReporte={true}
          />
        ) : visualizarTab === 'novedades' ? (
          <Box sx={{ p: 0 }}>
            <NovedadesTab 
              novedades={novedadesFiltradas} 
              esAdmin={esAdmin} 
              storeOverride={storeSel} 
              esReporte={true}
            />
          </Box>
        ) : visualizarTab === 'semanal' ? (
          <Box>
            {/* Control de Modo: Por Tienda / Por Empleado */}
            <Box sx={{ p: 2, display: 'flex', gap: 2, borderBottom: '1px solid #eef2f6', bgcolor: '#f8fafc', flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>Tipo de Reporte:</Typography>
              <Button
                variant={reporteSemanalModo === 'tienda' ? 'contained' : 'outlined'}
                onClick={() => setReporteSemanalModo('tienda')}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  fontWeight: 700,
                  bgcolor: reporteSemanalModo === 'tienda' ? '#004680' : 'transparent',
                  color: reporteSemanalModo === 'tienda' ? '#fff' : '#004680',
                  borderColor: '#004680',
                  '&:hover': {
                    bgcolor: reporteSemanalModo === 'tienda' ? '#003366' : 'rgba(0, 70, 128, 0.04)',
                    borderColor: '#004680'
                  }
                }}
              >
                Ver por Tienda
              </Button>
              <Button
                variant={reporteSemanalModo === 'empleado' ? 'contained' : 'outlined'}
                onClick={() => setReporteSemanalModo('empleado')}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  fontWeight: 700,
                  bgcolor: reporteSemanalModo === 'empleado' ? '#004680' : 'transparent',
                  color: reporteSemanalModo === 'empleado' ? '#fff' : '#004680',
                  borderColor: '#004680',
                  '&:hover': {
                    bgcolor: reporteSemanalModo === 'empleado' ? '#003366' : 'rgba(0, 70, 128, 0.04)',
                    borderColor: '#004680'
                  }
                }}
              >
                Ver por Empleado
              </Button>
            </Box>

            {reporteSemanalModo === 'tienda' ? (
              // MODO TIENDA
              !storeSel ? (
                <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                  <Alert severity="warning" sx={{ width: '100%', borderRadius: 2 }}>
                    Por favor, selecciona una tienda en el buscador superior para visualizar el reporte semanal de horas.
                  </Alert>
                </Box>
              ) : (
                <>
                  {/* Selector de Mes/Año */}
                  <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#f8fafc', borderBottom: '1px solid #eef2f6', flexWrap: 'wrap' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>Período Laboral:</Typography>
                    <FormControl size="small" sx={{ width: 160 }}>
                      <InputLabel id="select-mes-label">Mes</InputLabel>
                      <Select
                        labelId="select-mes-label"
                        value={selectedMonth}
                        label="Mes"
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        sx={{ borderRadius: 2 }}
                      >
                        {listadoMeses.map((m) => (
                          <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ width: 120 }}>
                      <InputLabel id="select-anio-label">Año</InputLabel>
                      <Select
                        labelId="select-anio-label"
                        value={selectedYear}
                        label="Año"
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        sx={{ borderRadius: 2 }}
                      >
                        {listadoAnios.map((y) => (
                          <MenuItem key={y} value={y}>{y}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {cargandoRecords || cargandoEmpleados ? (
                      <CircularProgress size={20} sx={{ color: '#004680', ml: 1 }} />
                    ) : null}
                  </Box>

                  {/* Tabla de reporte semanal */}
                  <TableContainer sx={{ overflow: 'auto' }}>
                    <Table sx={{ minWidth: 800 }}>
                      <TableHead sx={{ bgcolor: '#f0f7ff' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Empleado</TableCell>
                          <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Cargo</TableCell>
                          {semanasDelMes.map((sem, idx) => (
                            <TableCell key={idx} align="center" sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                              Semana {idx + 1}
                              <Typography variant="caption" display="block" sx={{ color: '#64748b', fontWeight: 500 }}>
                                {sem.label}
                              </Typography>
                            </TableCell>
                          ))}
                          <TableCell align="center" sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0', bgcolor: '#e6f4ea', color: '#137333' }}>
                            Total Mes
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedEmpleadosSemanal.map((emp: any, idx: number) => {
                          const nombreEmpleado = emp.nombre || `Empleado #${emp.id}`;
                          const inicial = nombreEmpleado.charAt(0).toUpperCase();
                          const positionName = emp.cargo || 'Sin cargo';

                          let totalMinutesMonth = 0;

                          return (
                            <TableRow
                              key={emp.id || idx}
                              hover
                              sx={{ bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafcff', transition: 'all 0.2s', '&:hover': { bgcolor: '#eef4ff' } }}
                            >
                              <TableCell sx={{ py: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Avatar sx={{ width: 36, height: 36, bgcolor: getAvatarColor(nombreEmpleado), fontSize: '1rem', fontWeight: 600 }}>
                                    {inicial}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{nombreEmpleado}</Typography>
                                    {emp.documento && (
                                      <Typography variant="caption" sx={{ color: '#64748b' }}>Doc: {emp.documento}</Typography>
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ py: 1.5, fontWeight: 500, color: '#1e293b' }}>
                                {positionName}
                              </TableCell>
                              {semanasDelMes.map((sem, sIdx) => {
                                const minSemana = calcularMinutosSemanales(emp.id, sem.start, sem.end, recordsMensuales);
                                totalMinutesMonth += minSemana;
                                return (
                                  <TableCell key={sIdx} align="center" sx={{ py: 1.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: minSemana > 0 ? 600 : 400, color: minSemana > 0 ? '#1e293b' : '#94a3b8' }}>
                                      {formatMinutes(minSemana)}
                                    </Typography>
                                  </TableCell>
                                );
                              })}
                              <TableCell align="center" sx={{ py: 1.5, bgcolor: '#f4fbf7', fontWeight: 700, color: '#137333' }}>
                                {formatMinutes(totalMinutesMonth)}
                              </TableCell>
                            </TableRow>
                          );
                        })}

                        {empleadosFiltradosSemanales.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3 + semanasDelMes.length} align="center" sx={{ py: 8 }}>
                              <Typography variant="body1" color="#94a3b8" sx={{ fontWeight: 500 }}>
                                No se encontraron empleados para esta tienda
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Paginador Semanal */}
                  {empleadosFiltradosSemanales.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fff', borderTop: '1px solid #eef2f6' }}>
                      <Typography variant="caption" color="#64748b">
                        Mostrando {paginatedEmpleadosSemanal.length} de {empleadosFiltradosSemanales.length} empleados
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <IconButton size="small" disabled={pageSemanal === 0} onClick={() => setPageSemanal((p) => Math.max(p - 1, 0))} sx={{ border: '1px solid #dfe4ec', borderRadius: 1.5, width: 32, height: 32 }}>
                          <ChevronLeftIcon fontSize="small" />
                        </IconButton>
                        {[...Array(totalPagesSemanal)].map((_, i) => (
                          <Box
                            key={i}
                            onClick={() => setPageSemanal(i)}
                            sx={{
                              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1.5, cursor: 'pointer',
                              bgcolor: pageSemanal === i ? '#004680' : '#fff', color: pageSemanal === i ? '#fff' : '#5e6f8d',
                              border: pageSemanal === i ? 'none' : '1px solid #dfe4ec', fontWeight: pageSemanal === i ? 700 : 500, fontSize: '0.85rem', transition: 'all 0.2s',
                              '&:hover': { bgcolor: pageSemanal === i ? '#004680' : '#f1f5f9' }
                            }}
                          >
                            {i + 1}
                          </Box>
                        ))}
                        <IconButton size="small" disabled={pageSemanal === totalPagesSemanal - 1} onClick={() => setPageSemanal((p) => Math.min(p + 1, totalPagesSemanal - 1))} sx={{ border: '1px solid #dfe4ec', borderRadius: 1.5, width: 32, height: 32 }}>
                          <ChevronRightIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  )}
                </>
              )
            ) : (
              // MODO EMPLEADO
              <>
                {/* Selector de Mes/Año + Buscador Empleado */}
                <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#f8fafc', borderBottom: '1px solid #eef2f6', flexWrap: 'wrap' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>Filtros:</Typography>
                  
                  <Autocomplete
                    size="small"
                    options={todosEmpleados}
                    getOptionLabel={(option) => option.nombre}
                    filterOptions={(options, { inputValue }) => {
                      const cleanInput = inputValue.toLowerCase().trim();
                      return options.filter(option => 
                        option.nombre.toLowerCase().includes(cleanInput) || 
                        (option.documento || '').toLowerCase().includes(cleanInput) ||
                        String(option.id).includes(cleanInput)
                      );
                    }}
                    value={todosEmpleados.find(e => Number(e.id) === Number(selectedEmpleadoId)) || null}
                    onChange={(_, newValue) => {
                      setSelectedEmpleadoId(newValue ? Number(newValue.id) : null);
                    }}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Empleado" 
                        placeholder="Buscar por nombre o CC..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            bgcolor: '#f1f7fe',
                            height: 40
                          }
                        }}
                      />
                    )}
                    sx={{ width: 320 }}
                  />

                  <FormControl size="small" sx={{ width: 160 }}>
                    <InputLabel id="select-mes-emp-label">Mes</InputLabel>
                    <Select
                      labelId="select-mes-emp-label"
                      value={selectedMonth}
                      label="Mes"
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      sx={{ borderRadius: 2 }}
                    >
                      {listadoMeses.map((m) => (
                        <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ width: 120 }}>
                    <InputLabel id="select-anio-emp-label">Año</InputLabel>
                    <Select
                      labelId="select-anio-emp-label"
                      value={selectedYear}
                      label="Año"
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      sx={{ borderRadius: 2 }}
                    >
                      {listadoAnios.map((y) => (
                        <MenuItem key={y} value={y}>{y}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {cargandoRecordsGlobal || cargandoTodosEmpleados ? (
                    <CircularProgress size={20} sx={{ color: '#004680', ml: 1 }} />
                  ) : null}
                </Box>

                {!selectedEmpleadoId ? (
                  <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                    <Alert severity="info" sx={{ width: '100%', borderRadius: 2 }}>
                      Por favor, selecciona un empleado en el selector de arriba para visualizar sus horas semanales en cada tienda.
                    </Alert>
                  </Box>
                ) : (
                  <>
                    {/* Fila de detalles del empleado seleccionado */}
                    {(() => {
                      const emp = todosEmpleados.find(e => Number(e.id) === Number(selectedEmpleadoId));
                      if (!emp) return null;
                      return (
                        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', borderBottom: '1px solid #eef2f6', bgcolor: '#fafcfd' }}>
                          <Avatar sx={{ width: 40, height: 40, bgcolor: getAvatarColor(emp.nombre), fontWeight: 700 }}>
                            {emp.nombre.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={700} color="#1e293b">{emp.nombre}</Typography>
                            <Typography variant="caption" color="#64748b">Cargo: {emp.cargo || 'Sin Cargo'} | CC: {formatDocumentNumber(emp.documento || emp.id)}</Typography>
                          </Box>
                        </Box>
                      );
                    })()}

                    {/* Tabla de desglose por tienda del empleado */}
                    <TableContainer sx={{ overflow: 'auto' }}>
                      <Table sx={{ minWidth: 800 }}>
                        <TableHead sx={{ bgcolor: '#f0f7ff' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Tienda</TableCell>
                            {semanasDelMes.map((sem, idx) => (
                              <TableCell key={idx} align="center" sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                                Semana {idx + 1}
                                <Typography variant="caption" display="block" sx={{ color: '#64748b', fontWeight: 500 }}>
                                  {sem.label}
                                </Typography>
                              </TableCell>
                            ))}
                            <TableCell align="center" sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0', bgcolor: '#e6f4ea', color: '#137333' }}>
                              Total Mes
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {storesTrabajadas.map((store, idx) => {
                            const storeRecords = recordsSelectedEmp.filter(r => Number(r.store_id) === Number(store.id));
                            let totalMinutesStore = 0;

                            return (
                              <TableRow
                                key={store.id || idx}
                                hover
                                sx={{ bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafcff', transition: 'all 0.2s', '&:hover': { bgcolor: '#eef4ff' } }}
                              >
                                <TableCell sx={{ py: 1.5, fontWeight: 600, color: '#1e293b' }}>
                                  {store.name}
                                </TableCell>
                                {semanasDelMes.map((sem, sIdx) => {
                                  const minSemana = calcularMinutosSemanales(selectedEmpleadoId, sem.start, sem.end, storeRecords);
                                  totalMinutesStore += minSemana;
                                  return (
                                    <TableCell key={sIdx} align="center" sx={{ py: 1.5 }}>
                                      <Typography variant="body2" sx={{ fontWeight: minSemana > 0 ? 600 : 400, color: minSemana > 0 ? '#1e293b' : '#94a3b8' }}>
                                        {formatMinutes(minSemana)}
                                      </Typography>
                                    </TableCell>
                                  );
                                })}
                                <TableCell align="center" sx={{ py: 1.5, bgcolor: '#f4fbf7', fontWeight: 700, color: '#137333' }}>
                                  {formatMinutes(totalMinutesStore)}
                                </TableCell>
                              </TableRow>
                            );
                          })}

                          {/* Fila del Total Global */}
                          {storesTrabajadas.length > 0 && (
                            <TableRow sx={{ bgcolor: '#f0fdf4' }}>
                              <TableCell sx={{ fontWeight: 700, py: 1.5, color: '#137333' }}>Total Global</TableCell>
                              {semanasDelMes.map((sem, sIdx) => {
                                let sumMinutesWeek = 0;
                                storesTrabajadas.forEach(store => {
                                  const storeRecords = recordsSelectedEmp.filter(r => Number(r.store_id) === Number(store.id));
                                  sumMinutesWeek += calcularMinutosSemanales(selectedEmpleadoId, sem.start, sem.end, storeRecords);
                                });
                                return (
                                  <TableCell key={sIdx} align="center" sx={{ fontWeight: 700, py: 1.5, color: '#137333' }}>
                                    {formatMinutes(sumMinutesWeek)}
                                  </TableCell>
                                );
                              })}
                              <TableCell align="center" sx={{ py: 1.5, bgcolor: '#e6f4ea', fontWeight: 700, color: '#137333' }}>
                                {formatMinutes(
                                  semanasDelMes.reduce((acc, sem) => {
                                    let sumM = 0;
                                    storesTrabajadas.forEach(store => {
                                      const storeRecords = recordsSelectedEmp.filter(r => Number(r.store_id) === Number(store.id));
                                      sumM += calcularMinutosSemanales(selectedEmpleadoId, sem.start, sem.end, storeRecords);
                                    });
                                    return acc + sumM;
                                  }, 0)
                                )}
                              </TableCell>
                            </TableRow>
                          )}

                          {storesTrabajadas.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={2 + semanasDelMes.length} align="center" sx={{ py: 8 }}>
                                <Typography variant="body1" color="#94a3b8" sx={{ fontWeight: 500 }}>
                                  No se encontraron registros de tiempo para este empleado en el período seleccionado.
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </>
            )}
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
                    <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Tienda</TableCell>
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
                                <Typography variant="caption" sx={{ color: '#64748b' }}>Doc: {formatDocumentNumber(report.employee_id.document_number)}</Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 1.5, fontWeight: 500, color: '#475569' }}>
                          {report.store_id?.name || '—'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<PauseCircleIcon sx={{ fontSize: '1rem !important' }} />}
                            label={report.event_type}
                            size="medium"
                            sx={{
                              bgcolor: report.event_type.includes('Terminar') ? 'rgba(22, 163, 74, 0.06)' : 'rgba(8, 145, 178, 0.06)',
                              color: report.event_type.includes('Terminar') ? 'rgba(22, 163, 74, 0.8)' : 'rgba(8, 145, 178, 0.8)',
                              fontWeight: 600,
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              '& .MuiChip-icon': {
                                color: report.event_type.includes('Terminar') ? 'rgba(22, 163, 74, 0.8)' : 'rgba(8, 145, 178, 0.8)',
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
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
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
        fechaInicio={rangoInicio ? rangoInicio.format('YYYY-MM-DD') : undefined}
        fechaFin={rangoFin ? rangoFin.format('YYYY-MM-DD') : undefined}
      />
    </Box>
  );
}
