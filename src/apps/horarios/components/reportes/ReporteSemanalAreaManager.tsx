import { useMemo, useState, useEffect } from 'react';
import {
  Box, Typography, Paper, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Tooltip, Avatar, FormControl, Select, MenuItem,
  TextField, InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WarningIcon from '@mui/icons-material/Warning';
import HistoryIcon from '@mui/icons-material/History';
import IconButton from '@mui/material/IconButton';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
dayjs.locale('es');

import { getEmpleadosBulk, getTimeRecordsBulkRange, getPrimerPeriodoRegistro, getNovedades } from '../../api/directus/read';
import HistorialHorasModal from '../HistorialHorasModal';
import { ObservationModal } from '../ObservationModal';
import { useHolidays } from '../../../reservas/hooks/useHolidays';
import EventIcon from '@mui/icons-material/Event';
import FestivosDetalleModal, { FestivosChip, obtenerFestivosTrabajadosEmp } from './FestivosDetalleModal';

// ─── Constantes ──────────────────────────────────────────────────────────────

const LIMITE_HORAS_SEMANALES = 42; // Colombia: 42h/semana desde 2026

const AVATAR_COLORS = [
  '#0284c7', '#7c3aed', '#16a34a', '#ea580c', '#db2777',
  '#0891b2', '#4f46e5', '#ca8a04', '#dc2626', '#059669',
];

const getAvatarColor = (texto: string) => {
  let hash = 0;
  for (let i = 0; i < texto.length; i++) hash = texto.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// ─── Utilidades ──────────────────────────────────────────────────────────────

function getSemanasDelMes(anio: number, mes: number) {
  const startOfMonth = dayjs().year(anio).month(mes).startOf('month');
  const endOfMonth = startOfMonth.endOf('month');
  const semanas: { start: string; end: string; label: string }[] = [];
  let currentMonday = startOfMonth.subtract((startOfMonth.day() + 6) % 7, 'day');
  while (currentMonday.isBefore(endOfMonth) || currentMonday.isSame(endOfMonth, 'day')) {
    const sunday = currentMonday.add(6, 'day');
    semanas.push({
      start: currentMonday.format('YYYY-MM-DD'),
      end: sunday.format('YYYY-MM-DD'),
      label: `${currentMonday.format('DD/MM')} – ${sunday.format('DD/MM')}`,
    });
    currentMonday = currentMonday.add(7, 'day');
  }
  return semanas;
}

const calcularMinutosSemanales = (
  empId: unknown,
  startStr: string,
  endStr: string,
  records: any[],
): number => {
  const start = dayjs(startStr);
  const end = dayjs(endStr);
  const empRecords = records.filter(r => {
    const id = Number(r.employee_id?.id || r.employee_id);
    if (id !== Number(empId)) return false;
    const date = dayjs(r.record_date);
    return (
      (date.isSame(start, 'day') || date.isAfter(start, 'day')) &&
      (date.isSame(end, 'day') || date.isBefore(end, 'day'))
    );
  });
  if (empRecords.length === 0) return 0;

  const byDay: Record<string, any[]> = {};
  empRecords.forEach(r => { (byDay[r.record_date] ||= []).push(r); });

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
          const iniAlm = recs.find(r => r.log_type === 'Iniciar Almuerzo');
          const finAlm = recs.find(r => r.log_type === 'Finalizar Almuerzo');
          if (iniAlm && finAlm) {
            const ha1 = iniAlm.record_time || iniAlm.time;
            const ha2 = finAlm.record_time || finAlm.time;
            if (ha1 && ha2) {
              const [al1, al2] = ha1.split(':').map(Number);
              const [al3, al4] = ha2.split(':').map(Number);
              if (!isNaN(al1) && !isNaN(al2) && !isNaN(al3) && !isNaN(al4)) {
                const almMin = (al3 * 60 + al4) - (al1 * 60 + al2);
                if (almMin > 0) totalDia -= almMin;
              }
            }
          }
          if (totalDia > 0) totalMinutes += totalDia;
        }
      }
    }
  }
  return totalMinutes;
};

const formatMinutes = (min: number): string => {
  if (min === 0) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const contarDomingosEmp = (empId: unknown, records: any[]): number => {
  const dias = new Set<string>();
  records.forEach(r => {
    const id = Number(r.employee_id?.id || r.employee_id);
    if (id !== Number(empId)) return;
    if (dayjs(r.record_date).day() === 0) dias.add(r.record_date);
  });
  return dias.size;
};

// ─── Chip de domingos ────────────────────────────────────────────────────────

function DomingosChip({ count, total }: { count: number; total: number }) {
  const config =
    count === 1
      ? { bg: '#FEF9C3', color: '#854D0E', border: '#FDE68A', icon: <WbSunnyIcon sx={{ fontSize: '0.75rem !important', color: '#854D0E !important' }} /> }
      : count === 2
        ? { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', icon: <WbSunnyIcon sx={{ fontSize: '0.75rem !important', color: '#92400E !important' }} /> }
        : count >= 3
          ? { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', icon: <WarningIcon sx={{ fontSize: '0.75rem !important', color: '#991B1B !important' }} /> }
          : { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0', icon: <WbSunnyIcon sx={{ fontSize: '0.75rem !important', color: '#94A3B8 !important' }} /> };

  return (
    <Tooltip title={`Trabajados: ${count} de ${total} domingos del mes`} arrow placement="top">
      <Chip
        icon={config.icon}
        label={`${count}/${total}`}
        size="small"
        sx={{
          backgroundColor: config.bg,
          color: config.color,
          border: `1px solid ${config.border}`,
          fontWeight: 700,
          fontSize: '0.72rem',
          height: 22,
          '& .MuiChip-label': { px: 0.8 },
        }}
      />
    </Tooltip>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

interface ReporteSemanalAreaManagerProps {
  storeId: number | null;
  storeName?: string;
}

export default function ReporteSemanalAreaManager({
  storeId,
  storeName,
}: ReporteSemanalAreaManagerProps) {
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
  const [buscar, setBuscar] = useState('');
  const [historialOpen, setHistorialOpen] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<any>(null);
  const [diaDetalleData, setDiaDetalleData] = useState<{
    open: boolean;
    empleado: string;
    fecha: string;
    observaciones: any[];
    vieneDeFestivos?: boolean;
  }>({ open: false, empleado: '', fecha: '', observaciones: [] });
  const [festivosModalData, setFestivosModalData] = useState<{
    open: boolean;
    empleado: string;
    festivos: any[];
  }>({ open: false, empleado: '', festivos: [] });

  const { data: holidayMap = {} } = useHolidays(selectedYear);

  const { data: primerPeriodo = { year: dayjs().year(), month: 0 } } = useQuery({
    queryKey: ['primerPeriodoRegistro'],
    queryFn: getPrimerPeriodoRegistro,
    staleTime: Infinity,
  });

  const listadoAnios = useMemo(() => {
    const años: number[] = [];
    for (let y = primerPeriodo.year; y <= dayjs().year(); y++) años.push(y);
    if (años.length === 0) años.push(dayjs().year());
    return años;
  }, [primerPeriodo.year]);

  const listadoMeses = useMemo(() => {
    const startM = selectedYear === primerPeriodo.year ? primerPeriodo.month : 0;
    const endM = selectedYear === dayjs().year() ? dayjs().month() : 11;
    const meses: { value: number; label: string }[] = [];
    for (let m = startM; m <= endM; m++) meses.push({ value: m, label: NOMBRES_MESES[m] });
    return meses;
  }, [selectedYear, primerPeriodo]);

  useEffect(() => {
    const minM = selectedYear === primerPeriodo.year ? primerPeriodo.month : 0;
    const maxM = selectedYear === dayjs().year() ? dayjs().month() : 11;
    if (selectedMonth < minM) setSelectedMonth(minM);
    else if (selectedMonth > maxM) setSelectedMonth(maxM);
  }, [selectedYear, primerPeriodo, selectedMonth]);

  const semanas = useMemo(
    () => getSemanasDelMes(selectedYear, selectedMonth),
    [selectedYear, selectedMonth],
  );
  const startRange = semanas[0]?.start;
  const endRange = semanas[semanas.length - 1]?.end;

  // Calcular el total de domingos que caen en este mes
  const totalDomingosMes = useMemo(() => {
    let count = 0;
    const startOfMonth = dayjs().year(selectedYear).month(selectedMonth).startOf('month');
    const endOfMonth = startOfMonth.endOf('month');
    let cursor = startOfMonth;
    while (cursor.isBefore(endOfMonth) || cursor.isSame(endOfMonth, 'day')) {
      if (cursor.day() === 0) {
        count++;
      }
      cursor = cursor.add(1, 'day');
    }
    return count;
  }, [selectedYear, selectedMonth]);

  // Calcular el total de festivos que caen en este mes
  const totalFestivosMes = useMemo(() => {
    let count = 0;
    const startOfMonth = dayjs().year(selectedYear).month(selectedMonth).startOf('month');
    const endOfMonth = startOfMonth.endOf('month');
    let cursor = startOfMonth;
    while (cursor.isBefore(endOfMonth) || cursor.isSame(endOfMonth, 'day')) {
      const dateStr = cursor.format('YYYY-MM-DD');
      if (holidayMap[dateStr]) {
        count++;
      }
      cursor = cursor.add(1, 'day');
    }
    return count;
  }, [selectedYear, selectedMonth, holidayMap]);

  const { data: empleados = [], isLoading: cargandoEmp } = useQuery({
    queryKey: ['empleadosSemanalArea', storeId],
    queryFn: () => getEmpleadosBulk([storeId!]),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: records = [], isLoading: cargandoRec } = useQuery({
    queryKey: ['recordsSemanalArea', storeId, startRange, endRange],
    queryFn: () => getTimeRecordsBulkRange([storeId!], startRange, endRange),
    enabled: !!storeId && !!startRange && !!endRange,
    staleTime: 5 * 60 * 1000,
  });

  const { data: todasNovedades = [] } = useQuery({
    queryKey: ['todasNovedadesTiendaArea', storeId],
    queryFn: () => getNovedades(storeId!),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
  });

  const cargando = cargandoEmp || cargandoRec;

  const empleadosFiltrados = useMemo(() => {
    const q = buscar.toLowerCase().trim();
    return (empleados as any[]).filter(
      e => !q || (e.nombre || '').toLowerCase().includes(q),
    );
  }, [empleados, buscar]);

  // ── Sin tienda seleccionada ────────────────────────────────────────────
  if (!storeId) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, gap: 2 }}>
        <StorefrontIcon sx={{ fontSize: 56, color: '#CBD5E1' }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#475569' }}>
          Selecciona una tienda
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, textAlign: 'center' }}>
          Usa el filtro de tienda del encabezado para ver el control de horas semanales por empleado.
        </Typography>
      </Box>
    );
  }

  // ── Cargando ───────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
        <CircularProgress size={36} sx={{ color: '#004680' }} />
        <Typography color="text.secondary" fontWeight={600}>
          Calculando horas semanales...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Encabezado ─────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f2c4a' }}>
            Control de Horas Semanales
          </Typography>
          {storeName && (
            <Typography variant="body2" sx={{ color: '#64748B', mt: 0.25 }}>
              {storeName} · {NOMBRES_MESES[selectedMonth]} {selectedYear}
            </Typography>
          )}
        </Box>

        {/* Controles: año, mes, búsqueda */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small">
            <Select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              sx={{ minWidth: 90, bgcolor: '#f8fafc', borderRadius: 2, fontSize: '0.85rem' }}
            >
              {listadoAnios.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <Select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              sx={{ minWidth: 120, bgcolor: '#f8fafc', borderRadius: 2, fontSize: '0.85rem' }}
            >
              {listadoMeses.map(m => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            placeholder="Buscar empleado..."
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 200,
              '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8fafc', fontSize: '0.85rem' },
            }}
          />
        </Box>
      </Box>

      {/* ── Leyenda ────────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2, borderRadius: 3, border: '1px solid #E2E8F0',
          display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center',
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Indicadores:
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: '#FEE2E2', border: '1px solid #FCA5A5' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B' }}>
            Horas Extra (&gt;{LIMITE_HORAS_SEMANALES}h/sem)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <WbSunnyIcon sx={{ fontSize: 12, color: '#854D0E' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B' }}>1 Domingo</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <WbSunnyIcon sx={{ fontSize: 12, color: '#92400E' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B' }}>2 Domingos</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <WbSunnyIcon sx={{ fontSize: 12, color: '#991B1B' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B' }}>3+ Domingos</Typography>
        </Box>
      </Paper>

      {/* ── Tabla ──────────────────────────────────────────────────────── */}
      {empleadosFiltrados.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          {(empleados as any[]).length === 0
            ? 'No hay empleados registrados en esta tienda para el período seleccionado.'
            : 'No se encontraron empleados con ese nombre.'}
        </Alert>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflowX: 'auto' }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow
                sx={{
                  '& th': {
                    bgcolor: '#F8FAFC', fontWeight: 700, fontSize: '0.72rem',
                    color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em',
                    py: 1.5, whiteSpace: 'nowrap',
                  },
                }}
              >
                <TableCell sx={{ minWidth: 210 }}>Empleado</TableCell>
                {semanas.map((s, i) => (
                  <TableCell key={i} align="center" sx={{ minWidth: 110 }}>
                    Sem. {i + 1}
                    <br />
                    <Typography
                      component="span"
                      sx={{ fontSize: '0.64rem', fontWeight: 500, color: '#94A3B8' }}
                    >
                      {s.label}
                    </Typography>
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ minWidth: 110 }}>Total Mes</TableCell>
                <TableCell align="center" sx={{ minWidth: 130 }}>Domingos</TableCell>
                <TableCell align="center" sx={{ minWidth: 130 }}>Festivos</TableCell>
                <TableCell align="center" sx={{ minWidth: 90 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {empleadosFiltrados.map((emp: any) => {
                const minutosSemanales = semanas.map(s =>
                  calcularMinutosSemanales(emp.id, s.start, s.end, records),
                );
                const totalMinMes = minutosSemanales.reduce((a, b) => a + b, 0);
                const domingos = contarDomingosEmp(emp.id, records);
                const festivosTrabajados = obtenerFestivosTrabajadosEmp(
                  emp.id,
                  records,
                  holidayMap,
                  selectedYear,
                  selectedMonth
                );
                const festivosCount = festivosTrabajados.length;

                const iniciales = (emp.nombre || 'XX')
                  .split(' ')
                  .slice(0, 2)
                  .map((p: string) => p[0] || '')
                  .join('')
                  .toUpperCase();

                return (
                  <TableRow
                    key={emp.id}
                    sx={{
                      '&:hover': { bgcolor: '#F8FAFC' },
                      '& td': { py: 1.25, borderColor: '#F1F5F9' },
                    }}
                  >
                    {/* Empleado */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Avatar
                          sx={{
                            width: 32, height: 32, fontSize: '0.72rem', fontWeight: 700,
                            bgcolor: getAvatarColor(emp.nombre || ''),
                            flexShrink: 0,
                          }}
                        >
                          {iniciales}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', lineHeight: 1.2, fontSize: '0.82rem' }}>
                            {emp.nombre}
                          </Typography>
                          {emp.cargo && (
                            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem' }}>
                              {emp.cargo}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Horas por semana */}
                    {minutosSemanales.map((min, i) => {
                      const horas = min / 60;
                      const esExtra = horas > LIMITE_HORAS_SEMANALES;
                      const horasExtra = Math.ceil(horas - LIMITE_HORAS_SEMANALES);

                      return (
                        <TableCell key={i} align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: esExtra ? 800 : 500,
                                fontSize: '0.82rem',
                                color: esExtra ? '#DC2626' : min === 0 ? '#CBD5E1' : '#1E293B',
                              }}
                            >
                              {formatMinutes(min)}
                            </Typography>
                            {esExtra && (
                              <Tooltip
                                title={`${horasExtra}h por encima del límite de ${LIMITE_HORAS_SEMANALES}h semanales`}
                                arrow
                              >
                                <Chip
                                  icon={
                                    <WarningAmberIcon
                                      sx={{ fontSize: '0.7rem !important', color: '#DC2626 !important' }}
                                    />
                                  }
                                  label={`+${horasExtra}h extra`}
                                  size="small"
                                  sx={{
                                    bgcolor: '#FEE2E2',
                                    color: '#DC2626',
                                    border: '1px solid #FCA5A5',
                                    fontWeight: 700,
                                    fontSize: '0.65rem',
                                    height: 20,
                                    cursor: 'help',
                                    '& .MuiChip-label': { px: 0.6 },
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      );
                    })}

                    {/* Total del mes */}
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          color: totalMinMes === 0 ? '#CBD5E1' : '#004680',
                        }}
                      >
                        {formatMinutes(totalMinMes)}
                      </Typography>
                    </TableCell>

                    {/* Domingos trabajados */}
                    <TableCell align="center">
                      <DomingosChip count={domingos} total={totalDomingosMes} />
                    </TableCell>

                    {/* Festivos trabajados */}
                    <TableCell align="center">
                      <FestivosChip 
                        count={festivosCount} 
                        total={totalFestivosMes} 
                        onClick={() => {
                          setFestivosModalData({
                            open: true,
                            empleado: emp.nombre,
                            festivos: festivosTrabajados,
                          });
                        }} 
                      />
                    </TableCell>

                    {/* Acciones para ver historial detallado */}
                    <TableCell align="center">
                      <Tooltip title="Ver detalle de horas diarias" arrow>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            const mapFila = {
                              id: String(emp.id),
                              nombre: emp.nombre,
                              documento: emp.documento || '--',
                              cargo: emp.cargo || '',
                              inicioJornada: null,
                              inicioAlmuerzo: null,
                              finAlmuerzo: null,
                              finJornada: null,
                              estado: '',
                              tieneNovedad: false,
                              horasDia: '',
                              horasSemana: '',
                            };
                            setEmpleadoSeleccionado(mapFila);
                            setHistorialOpen(true);
                          }}
                          sx={{ bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}
                        >
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal de Historial Reutilizado */}
      {historialOpen && empleadoSeleccionado && (
        <HistorialHorasModal
          open={historialOpen}
          onClose={() => {
            setHistorialOpen(false);
            setEmpleadoSeleccionado(null);
          }}
          empleado={empleadoSeleccionado}
          tiendaId={storeId!}
          todasNovedades={todasNovedades}
          onDayClick={(fechaStr, empNombre) => {
            // Filtrar y mapear marcas del día seleccionado
            const empRecords = records.filter(
              r =>
                Number(r.employee_id?.id || r.employee_id) === Number(empleadoSeleccionado.id) &&
                r.record_date === fechaStr
            );
            const obsMapeadas = empRecords.map((r: any) => ({
              evento: r.log_type,
              hora: r.record_time || r.time || null,
              observacion: r.observations || '',
            }));
            setDiaDetalleData({
              open: true,
              empleado: empNombre,
              fecha: dayjs(fechaStr).locale('es').format('dddd, D [de] MMMM [de] YYYY'),
              observaciones: obsMapeadas,
            });
          }}
        />
      )}

      {/* Modal Detallado de Observaciones y Marcaciones */}
      {diaDetalleData.open && (
        <ObservationModal
          open={diaDetalleData.open}
          onClose={() => {
            const vieneDeFestivos = diaDetalleData.vieneDeFestivos;
            setDiaDetalleData({ open: false, empleado: '', fecha: '', observaciones: [] });
            if (vieneDeFestivos) {
              setFestivosModalData(prev => ({ ...prev, open: true }));
            }
          }}
          empleado={diaDetalleData.empleado}
          fecha={diaDetalleData.fecha}
          observaciones={diaDetalleData.observaciones}
        />
      )}

      {/* Modal Detallado de Festivos Trabajados Modular */}
      <FestivosDetalleModal
        open={festivosModalData.open}
        onClose={() => setFestivosModalData({ open: false, empleado: '', festivos: [] })}
        empleadoNombre={festivosModalData.empleado}
        festivos={festivosModalData.festivos}
        onVerMarcas={(fechaStr, recordsFestivo) => {
          // Ocultar modal de festivos sin borrar la data del empleado
          setFestivosModalData(prev => ({ ...prev, open: false }));
          const obsMapeadas = recordsFestivo.map((r: any) => ({
            evento: r.log_type,
            hora: r.record_time || r.time || null,
            observacion: r.observations || '',
          }));
          setDiaDetalleData({
            open: true,
            empleado: festivosModalData.empleado,
            fecha: dayjs(fechaStr).locale('es').format('dddd, D [de] MMMM [de] YYYY'),
            observaciones: obsMapeadas,
            vieneDeFestivos: true,
          });
        }}
      />
    </Box>
  );
}
