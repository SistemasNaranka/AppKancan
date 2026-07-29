import { useState, useMemo } from 'react';
import {
  Box, Container, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar, Chip,
  CircularProgress, Pagination, IconButton, Tooltip, Button,
  ToggleButtonGroup, ToggleButton, TextField
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Storefront as StorefrontIcon,
  Edit as EditIcon,
  ArrowBackIos as ArrowBackIosIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  Today as TodayIcon,
  Warning as WarningIcon,
  AddCircle as AddCircleIcon,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
dayjs.locale('es');

// Hooks y APIs
import { useHorariosPolicies } from '../hooks/useHorariosPolicies';
import { useHorarios } from '../hooks/useHorarios';
import { getStores, getEmpleadosBulk, getTimeRecordsBulkRange, getNovedades, getRecordReasonId } from '../api/directus/read';
import { updateTimeRecord, upsertRecordReason, createTimeRecord } from '../api/directus/create';
import { Tienda } from '../interfaces/horarios.interface';
import { obtenerTiendasIdsUsuarioActual } from '@/services/directus/userStores';
import EditHourModal from '../components/EditHourModal';
import { calcularMinutosDia, formatearHoras } from './planilla/DetallePlanillaUtils';

const calcularHorasSemana = (empleadoId: string | number, weekRecords: any[]): string => {
  const empRecords = weekRecords.filter(r => Number(r.employee_id?.id || r.employee_id) === Number(empleadoId));
  const days = new Map<string, any[]>();
  empRecords.forEach(r => {
    const fecha = r.record_date;
    if (!days.has(fecha)) days.set(fecha, []);
    days.get(fecha)!.push(r);
  });
  let totalMinutos = 0;
  days.forEach((dayRecs) => {
    const entrada = dayRecs.find(r => r.log_type === 'Comenzar Jornada');
    const salida = dayRecs.find(r => r.log_type === 'Terminar Jornada');
    if (entrada && salida) {
      const inicio = dayjs(`2000-01-01 ${entrada.record_time.substring(0,5)}`);
      const fin = dayjs(`2000-01-01 ${salida.record_time.substring(0,5)}`);
      totalMinutos += fin.diff(inicio, 'minute');
    }
  });
  return formatearHoras(totalMinutos);
};

// -------- INTERFAZ --------
interface EmpleadoFila {
  id: string;
  nombre: string;
  cargo: string;
  tienda: string;
  tiendaId: number;
  inicioJornada: string | null;
  inicioAlmuerzo: string | null;
  finAlmuerzo: string | null;
  finJornada: string | null;
  recordIdInicioJornada: number | null;
  recordIdInicioAlmuerzo: number | null;
  recordIdFinAlmuerzo: number | null;
  recordIdFinJornada: number | null;
  tieneNovedad: boolean;
  novedadTipo?: string;
  horasDia: string;
  horasSemana: string;
}

// -------- COMPONENTE PRINCIPAL --------
interface DetallePlanillaPageProps {
  storeId?: number | null;
}

export default function DetallePlanillaPage({ storeId: propStoreId }: DetallePlanillaPageProps) {
  const { esAdmin, esAreaManager } = useHorariosPolicies();
  const isAreaMgr = esAreaManager() && !esAdmin();
  const queryClient = useQueryClient();

  // Búsqueda y Rangos Rápidos
  const [searchTerm, setSearchTerm] = useState('');
  const [rapidoSeleccionado, setRapidoSeleccionado] = useState<string | null>(null);

  const [fechaSeleccionada, setFechaSeleccionada] = useState<Dayjs>(dayjs());
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  // Estados para Modal de Edición (Edit)
  const [editHourModalOpen, setEditHourModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  // Obtener tiendas disponibles
  const { data: todasLasTiendas = [] } = useQuery<Tienda[]>({
    queryKey: ['adminTiendas'],
    queryFn: getStores,
    enabled: esAdmin() || isAreaMgr,
    staleTime: 30 * 60 * 1000,
  });

  const { data: tiendasAcceso = [] } = useQuery<number[]>({
    queryKey: ['tiendasAccesoUsuario'],
    queryFn: obtenerTiendasIdsUsuarioActual,
    enabled: isAreaMgr,
    staleTime: 30 * 60 * 1000,
  });

  const tiendasFiltradas = useMemo(() => {
    if (isAreaMgr) {
      const idsPermitidos = tiendasAcceso.map(id => Number(id && typeof id === 'object' ? (id as any).id ?? (id as any).store_id : id)).filter(Boolean);
      return todasLasTiendas.filter(t => idsPermitidos.includes(Number(t.id)) && Number(t.id) !== 5);
    }
    return todasLasTiendas;
  }, [todasLasTiendas, tiendasAcceso, isAreaMgr]);

  const tiendasAConsultar = useMemo(() => {
    if (propStoreId) return tiendasFiltradas.filter(t => t.id === propStoreId);
    return tiendasFiltradas;
  }, [tiendasFiltradas, propStoreId]);

  const fechaStr = fechaSeleccionada.format('YYYY-MM-DD');

  // Multi-Queries
  const { data: empleadosPorTienda = {}, isLoading: loadingEmpleados } = useQuery({
    queryKey: ['empleadosBulkMulti', tiendasAConsultar.map(t => t.id).join(',')],
    queryFn: async () => {
      const result: Record<number, any[]> = {};
      for (const tienda of tiendasAConsultar) {
        const emps = await getEmpleadosBulk([tienda.id]);
        result[tienda.id] = emps;
      }
      return result;
    },
    enabled: tiendasAConsultar.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const { data: recordsPorTienda = {}, isLoading: loadingRecords } = useQuery({
    queryKey: ['recordsDiaMulti', tiendasAConsultar.map(t => t.id).join(','), fechaStr],
    queryFn: async () => {
      const result: Record<number, any[]> = {};
      for (const tienda of tiendasAConsultar) {
        const recs = await getTimeRecordsBulkRange([tienda.id], fechaStr, fechaStr);
        result[tienda.id] = recs;
      }
      return result;
    },
    enabled: tiendasAConsultar.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const { data: novedadesPorTienda = {} } = useQuery({
    queryKey: ['novedadesMulti', tiendasAConsultar.map(t => t.id).join(',')],
    queryFn: async () => {
      const result: Record<number, any[]> = {};
      for (const tienda of tiendasAConsultar) {
        const novs = await getNovedades(tienda.id);
        result[tienda.id] = novs;
      }
      return result;
    },
    enabled: tiendasAConsultar.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const diaSemana = fechaSeleccionada.day();
  const lunes = fechaSeleccionada.subtract((diaSemana + 6) % 7, 'day');
  const domingo = lunes.add(6, 'day');
  
  const { data: weekRecordsPorTienda = {} } = useQuery({
    queryKey: ['weekRecordsMulti', tiendasAConsultar.map(t => t.id).join(','), lunes.format('YYYY-MM-DD')],
    queryFn: async () => {
      const result: Record<number, any[]> = {};
      for (const tienda of tiendasAConsultar) {
        const recs = await getTimeRecordsBulkRange(
          [tienda.id],
          lunes.format('YYYY-MM-DD'),
          domingo.format('YYYY-MM-DD')
        );
        result[tienda.id] = recs;
      }
      return result;
    },
    enabled: tiendasAConsultar.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // 🔥 OBTENER MOTIVOS (USANDO LA PRIMERA TIENDA DISPONIBLE)
  const firstStoreId = tiendasAConsultar.length > 0 ? tiendasAConsultar[0].id : undefined;
  const { reasons } = useHorarios(firstStoreId);

  // Construir filas base
  const filasEmpleadosBase: EmpleadoFila[] = useMemo(() => {
    const rows: EmpleadoFila[] = [];

    tiendasAConsultar.forEach((tienda) => {
      const empleados = empleadosPorTienda[tienda.id] || [];
      const recordsDia = recordsPorTienda[tienda.id] || [];
      const novedadesDia = (novedadesPorTienda[tienda.id] || []).filter((n: any) => n.report_date === fechaStr);
      const weekRecords = weekRecordsPorTienda[tienda.id] || [];

      const empMap = new Map<string, { id: string; nombre: string; cargo: string }>();
      
      empleados.forEach((e: any) => {
        empMap.set(String(e.id), {
          id: String(e.id),
          nombre: e.nombre,
          cargo: e.cargo || 'Sin cargo',
        });
      });

      recordsDia.forEach((r: any) => {
        const empId = r.employee_id?.id;
        if (empId && !empMap.has(String(empId))) {
          const parts = [
            r.employee_id.first_name,
            r.employee_id.middle_name,
            r.employee_id.last_name,
            r.employee_id.second_last_name
          ].filter(p => p && p.trim());
          const fullName = parts.join(' ').trim() || 'Empleado Sin Nombre';
          empMap.set(String(empId), {
            id: String(empId),
            nombre: fullName,
            cargo: 'Sin cargo',
          });
        }
      });

      const getHora = (empId: string | number, logType: string) => {
        const record = recordsDia.find(r => Number(r.employee_id?.id || r.employee_id) === Number(empId) && r.log_type === logType);
        return record ? (record.record_time || '').substring(0, 5) : null;
      };

      const getRecordId = (empId: string | number, logType: string) => {
        const record = recordsDia.find(r => Number(r.employee_id?.id || r.employee_id) === Number(empId) && r.log_type === logType);
        return record ? record.id : null;
      };

      const getNovedadEmpleado = (empId: string | number) => {
        const novedad = novedadesDia.find(n => Number(n.employee_id?.id || n.employee_id) === Number(empId));
        return novedad ? { tiene: true, tipo: novedad.newness_id?.name || 'Novedad' } : null;
      };

      empMap.forEach((emp) => {
        const empId = emp.id;
        const inicioJornada = getHora(empId, 'Comenzar Jornada');
        const inicioAlmuerzo = getHora(empId, 'Iniciar Almuerzo');
        const finAlmuerzo = getHora(empId, 'Finalizar Almuerzo');
        const finJornada = getHora(empId, 'Terminar Jornada');
        
        const recordIdInicioJornada = getRecordId(empId, 'Comenzar Jornada');
        const recordIdInicioAlmuerzo = getRecordId(empId, 'Iniciar Almuerzo');
        const recordIdFinAlmuerzo = getRecordId(empId, 'Finalizar Almuerzo');
        const recordIdFinJornada = getRecordId(empId, 'Terminar Jornada');

        const novedad = getNovedadEmpleado(empId);
        const minutosDia = calcularMinutosDia(recordsDia, empId);
        const horasDia = formatearHoras(minutosDia);
        const horasSemana = calcularHorasSemana(empId, weekRecords);

        rows.push({
          id: `${tienda.id}_${empId}`,
          nombre: emp.nombre,
          cargo: emp.cargo,
          tienda: tienda.name,
          tiendaId: tienda.id,
          inicioJornada,
          inicioAlmuerzo,
          finAlmuerzo,
          finJornada,
          recordIdInicioJornada,
          recordIdInicioAlmuerzo,
          recordIdFinAlmuerzo,
          recordIdFinJornada,
          tieneNovedad: !!novedad,
          novedadTipo: novedad?.tipo,
          horasDia,
          horasSemana,
        });
      });
    });

    rows.sort((a, b) => {
      if (a.tienda !== b.tienda) return a.tienda.localeCompare(b.tienda);
      return a.nombre.localeCompare(b.nombre);
    });

    return rows;
  }, [tiendasAConsultar, empleadosPorTienda, recordsPorTienda, novedadesPorTienda, weekRecordsPorTienda, fechaStr]);

  // FILTRADO POR BÚSQUEDA
  const filasEmpleados = useMemo(() => {
    if (!searchTerm.trim()) return filasEmpleadosBase;
    return filasEmpleadosBase.filter(fila =>
      fila.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filasEmpleadosBase, searchTerm]);

  const totalFilas = filasEmpleados.length;
  const filasPagina = useMemo(() => {
    const start = page * rowsPerPage;
    return filasEmpleados.slice(start, start + rowsPerPage);
  }, [filasEmpleados, page]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage - 1);
  
  // Handlers de fecha
  const handleDateSelect = (day: number) => {
    setFechaSeleccionada(fechaSeleccionada.date(day));
    setRapidoSeleccionado(null);
    setPage(0);
  };
  
  const handlePrevMonth = () => {
    setFechaSeleccionada(fechaSeleccionada.subtract(1, 'month'));
    setRapidoSeleccionado(null);
    setPage(0);
  };

  const handleNextMonth = () => {
    setFechaSeleccionada(fechaSeleccionada.add(1, 'month'));
    setRapidoSeleccionado(null);
    setPage(0);
  };

  const handleToday = () => {
    setFechaSeleccionada(dayjs());
    setRapidoSeleccionado(null);
    setPage(0);
  };

  // Handler para rangos rápidos
  const handleRapido = (tipo: string) => {
    let nuevaFecha = dayjs();
    switch (tipo) {
      case 'hoy': nuevaFecha = dayjs(); break;
      case '7dias': nuevaFecha = dayjs().subtract(7, 'day'); break;
      case 'mes': nuevaFecha = dayjs().startOf('month'); break;
      case 'mesPasado': nuevaFecha = dayjs().subtract(1, 'month').startOf('month'); break;
      case '30dias': nuevaFecha = dayjs().subtract(30, 'day'); break;
      case 'anio': nuevaFecha = dayjs().startOf('year'); break;
      case 'todo': nuevaFecha = dayjs('2020-01-01'); break;
      default: return;
    }
    setFechaSeleccionada(nuevaFecha);
    setPage(0);
  };

  // ============================================================
  //  LÓGICA DE EDICIÓN
  // ============================================================

  // Abrir modal de edición (edit)
  const handleOpenEditHour = async (fila: EmpleadoFila, evento: string, recordId: number, horaActual: string | null) => {
    if (!esAdmin() && !isAreaMgr) return; 

    const tiendaId = fila.tiendaId;
    const recordsStore = recordsPorTienda[tiendaId] || [];
    const observacionActual = recordsStore.find(r => r.id === recordId)?.observations || '';

    let reasonId: number | null = null;
    if (recordId) {
      try {
        reasonId = await getRecordReasonId(recordId);
      } catch (e) {
        console.error('Error al obtener motivo:', e);
      }
    }

    const registros = {
      inicioJornada: fila.inicioJornada,
      inicioAlmuerzo: fila.inicioAlmuerzo,
      finAlmuerzo: fila.finAlmuerzo,
      finJornada: fila.finJornada,
      observaciones: {},
      ids: {
        inicioJornada: fila.recordIdInicioJornada,
        inicioAlmuerzo: fila.recordIdInicioAlmuerzo,
        finAlmuerzo: fila.recordIdFinAlmuerzo,
        finJornada: fila.recordIdFinJornada,
      },
      horasOriginales: {},
      horasEditadas: {},
    };

    setEditData({
      employeeName: fila.nombre,
      eventName: evento,
      initialTimeStr: horaActual, 
      initialObservation: observacionActual,
      reasons: reasons || [], // 🔥 Los motivos globales
      initialReasonId: reasonId,
      recordId: recordId,
      registros: registros,
    });
    setEditHourModalOpen(true);
  };

  const handleCloseEditHour = () => {
    setEditHourModalOpen(false);
    setEditData(null);
  };

  // Confirmar edición
  const handleConfirmEdit = async (horaFormateada: string, observacion: string, reasonId: number | null) => {
    if (!editData || !editData.recordId) return;
    try {
      const parsed = dayjs(horaFormateada, 'hh:mm A');
      const recordTime = parsed.format('HH:mm:ss');

      await updateTimeRecord(editData.recordId, {
        record_time: recordTime,
        observations: observacion,
      });

      if (reasonId) {
        await upsertRecordReason(editData.recordId, reasonId);
      }

      queryClient.invalidateQueries({ queryKey: ['recordsDiaMulti'] });
      queryClient.invalidateQueries({ queryKey: ['weekRecordsMulti'] });
      handleCloseEditHour();
    } catch (error) {
      console.error('Error al editar hora:', error);
      throw error;
    }
  };

  const isLoading = loadingEmpleados || loadingRecords;

  if (tiendasAConsultar.length === 0) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No tienes tiendas asignadas para ver el detalle de planilla.
        </Typography>
      </Container>
    );
  }

  // ----- CALENDARIO CON RANGOS RÁPIDOS Y SELECCIÓN AZUL -----
  const renderCalendar = () => {
    const startOfMonth = fechaSeleccionada.startOf('month');
    const endOfMonth = fechaSeleccionada.endOf('month');
    const startDayOfWeek = startOfMonth.day();
    const daysInMonth = endOfMonth.date();
    const offset = (startDayOfWeek + 6) % 7;

    const isToday = (day: number) => {
      const today = dayjs();
      return day === today.date() && fechaSeleccionada.month() === today.month() && fechaSeleccionada.year() === today.year();
    };

    const isSelected = (day: number) => day === fechaSeleccionada.date();

    const daysArray = [];
    for (let i = 0; i < offset; i++) daysArray.push(null);
    for (let d = 1; d <= daysInMonth; d++) daysArray.push(d);

    return (
      <Paper elevation={2} sx={{ p: 2, borderRadius: 4, bgcolor: '#ffffff', border: '1px solid #e0e0e0', mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TodayIcon sx={{ color: '#004680', fontSize: 22 }} />
            <Typography variant="h6" fontWeight={700} color="#0a1929" sx={{ textTransform: 'capitalize' }}>
              {fechaSeleccionada.format('MMMM YYYY')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" startIcon={<TodayIcon />} onClick={handleToday} sx={{ textTransform: 'none', borderRadius: 2, borderColor: '#004680', color: '#004680', fontSize: '0.75rem', py: 0.5 }} variant="outlined">Hoy</Button>
            <IconButton size="small" onClick={handlePrevMonth} sx={{ color: '#004680' }}><ArrowBackIosIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={handleNextMonth} sx={{ color: '#004680' }}><ArrowForwardIosIcon fontSize="small" /></IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mb: 1.5 }}>
          <ToggleButtonGroup
            size="small"
            value={rapidoSeleccionado}
            exclusive
            onChange={(_, value) => {
              setRapidoSeleccionado(value);
              if (value) handleRapido(value);
            }}
            sx={{ flexWrap: 'wrap', gap: 0.5 }}
          >
            {[
              { value: 'hoy', label: 'Hoy' },
              { value: '7dias', label: 'Últimos 7 días' },
              { value: 'mes', label: 'Este mes' },
              { value: 'mesPasado', label: 'Mes pasado' },
              { value: '30dias', label: 'Últimos 30 días' },
              { value: 'anio', label: 'Este año' },
              { value: 'todo', label: 'Todo' },
            ].map((item) => (
              <ToggleButton
                key={item.value}
                value={item.value}
                sx={{
                  borderRadius: 1.5,
                  px: 1,
                  py: 0.3,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  border: '1px solid #d0d7de',
                  '&.Mui-selected': {
                    bgcolor: '#004680',
                    color: '#fff',
                    borderColor: '#004680',
                  },
                  '&.Mui-selected:hover': {
                    bgcolor: '#003366',
                  },
                }}
              >
                {item.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', mb: 1 }}>
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
            <Typography key={d} align="center" variant="caption" fontWeight={700} color="primary.main" sx={{ py: 0.5 }}>
              {d}
            </Typography>
          ))}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {Array.from({ length: offset }, (_, i) => <Box key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const selected = isSelected(day);
            const today = isToday(day);

            return (
              <Paper
                key={day}
                elevation={0}
                onClick={() => handleDateSelect(day)}
                sx={{
                  p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 2,
                  bgcolor: selected ? '#004680' : 'transparent',
                  color: selected ? '#ffffff' : '#0a1929',
                  border: today && !selected ? '2px solid #004680' : '1px solid #e0e0e0',
                  cursor: 'pointer', minHeight: 48, transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: selected ? '#003366' : '#f0f4f8',
                  }
                }}
              >
                <Typography variant="body2" fontWeight={selected || today ? 700 : 400} sx={{ fontSize: '0.9rem' }}>
                  {day}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      </Paper>
    );
  };

  // ----- RENDER -----
  return (
    <Box sx={{ backgroundColor: '#f5f7fa', minHeight: '100vh', pt: 1, pb: 4 }}>
      <Container maxWidth="xl">
        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e0e0e0', bgcolor: '#ffffff' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="h5" fontWeight={700} color="#0a1929" sx={{ textTransform: 'uppercase' }}>
              DETALLE DE PLANILLA
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['recordsDiaMulti'] });
                  queryClient.invalidateQueries({ queryKey: ['weekRecordsMulti'] });
                  queryClient.invalidateQueries({ queryKey: ['novedadesMulti'] });
                }}
                sx={{ color: '#004680', bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' } }}
              >
                <RefreshIcon />
              </IconButton>
              <Typography variant="caption" fontWeight={600} color="#64748b">
                {fechaSeleccionada.format('dddd, D [de] MMMM [de] YYYY')}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 2 }}>
            {renderCalendar()}
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid #e0e0e0', bgcolor: '#ffffff', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <Chip label={`Empleados: ${filasEmpleados.length}`} sx={{ bgcolor: '#e3f2fd', color: '#004680', fontWeight: 700 }} />
            <TextField
              size="small"
              placeholder="Buscar empleado..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              sx={{ width: 220 }}
            />
          </Box>
        </Paper>

        {/* Tabla modificada según los requerimientos exactos */}
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
          <Table size="medium">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#546e7a' }}>TIENDA</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#546e7a' }}>EMPLEADO</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#546e7a' }}>CARGO</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#004680', bgcolor: '#e3f2fd' }}>INICIO JORNADA</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#004680', bgcolor: '#e3f2fd' }}>INICIO ALMUERZO</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#004680', bgcolor: '#e3f2fd' }}>FIN ALMUERZO</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#004680', bgcolor: '#e3f2fd' }}>FIN JORNADA</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#546e7a' }}>HORAS DÍA</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#546e7a' }}>HORAS SEMANA</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#546e7a' }}>NOVEDADES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4 }}><CircularProgress sx={{ color: '#004680' }} /></TableCell></TableRow>
              ) : filasPagina.length === 0 ? (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>{searchTerm ? 'No hay empleados con ese nombre.' : 'No hay registros para este día.'}</TableCell></TableRow>
              ) : (
                filasPagina.map((fila, idx) => {
                  const eventosHoras = [
                    { key: 'inicioJornada', label: 'Comenzar Jornada', hora: fila.inicioJornada, recordId: fila.recordIdInicioJornada },
                    { key: 'inicioAlmuerzo', label: 'Iniciar Almuerzo', hora: fila.inicioAlmuerzo, recordId: fila.recordIdInicioAlmuerzo },
                    { key: 'finAlmuerzo', label: 'Finalizar Almuerzo', hora: fila.finAlmuerzo, recordId: fila.recordIdFinAlmuerzo },
                    { key: 'finJornada', label: 'Terminar Jornada', hora: fila.finJornada, recordId: fila.recordIdFinJornada },
                  ];

                  return (
                    <TableRow key={fila.id} hover sx={{ bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <StorefrontIcon sx={{ color: '#004680', fontSize: 18 }} />
                          <Typography variant="body2" fontWeight={600}>{fila.tienda}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#004680' }}>{fila.nombre.charAt(0)}</Avatar>
                          <Typography variant="body2" fontWeight={600}>{fila.nombre}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{fila.cargo}</TableCell>

                      {/* 🔥 Solo aparece el botón de EDICIÓN (con icono +) en horas registradas */}
                      {eventosHoras.map((evento) => (
                        <TableCell key={evento.key} align="center">
                          {evento.hora ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                              <Chip
                                size="small"
                                icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                                label={evento.hora}
                                sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600 }}
                              />
                              {(esAdmin() || isAreaMgr) && (
                                <Tooltip title="Editar hora">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      if (evento.recordId) {
                                        handleOpenEditHour(fila, evento.label, evento.recordId, evento.hora);
                                      }
                                    }}
                                    sx={{ p: 0.5, color: '#004680' }}
                                  >
                                    <AddCircleIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          ) : (
                            <Chip
                              size="small"
                              icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
                              label="Pendiente"
                              sx={{ bgcolor: '#f5f5f5', color: '#757575', fontWeight: 600 }}
                            />
                          )}
                        </TableCell>
                      ))}

                      <TableCell align="center"><Typography variant="body2" fontWeight={600}>{fila.horasDia}</Typography></TableCell>
                      <TableCell align="center"><Typography variant="body2" fontWeight={700} color="#004680">{fila.horasSemana}</Typography></TableCell>
                      
                      {/* COLUMNA NOVEDADES CON ICONOS */}
                      <TableCell align="center">
                        {fila.tieneNovedad ? (
                          <Chip size="small" icon={<WarningIcon sx={{ fontSize: 14 }} />} label={fila.novedadTipo || 'Novedad'} sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 600 }} />
                        ) : (
                          <Chip size="small" icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} label="Sin novedad" sx={{ bgcolor: '#f5f5f5', color: '#757575' }} />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.5, borderTop: '1px solid #e0e0e0', bgcolor: '#fafbfc' }}>
            <Typography variant="caption" color="text.secondary">
              Mostrando {Math.min((page + 1) * rowsPerPage, totalFilas)} de {totalFilas} empleados
            </Typography>
            {totalFilas > rowsPerPage && (
              <Pagination
                count={Math.ceil(totalFilas / rowsPerPage)}
                page={page + 1}
                onChange={handleChangePage}
                color="primary"
                shape="rounded"
                size="small"
              />
            )}
          </Box>
        </TableContainer>
      </Container>

      {/* MODAL DE EDICIÓN (YA CON MOTIVOS CARGADOS) */}
      {editData && (
        <EditHourModal
          open={editHourModalOpen}
          onClose={handleCloseEditHour}
          employeeName={editData.employeeName}
          eventName={editData.eventName}
          initialTimeStr={editData.initialTimeStr}
          initialObservation={editData.initialObservation}
          reasons={editData.reasons}
          initialReasonId={editData.initialReasonId}
          registros={editData.registros || {}}
          onConfirm={handleConfirmEdit}
          motivoRequerido={false}
        />
      )}
    </Box>
  );
}