import { useState, useMemo, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar, Chip,
  CircularProgress, Pagination, IconButton, Tooltip, Button,
  TextField
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Storefront as StorefrontIcon,
  Warning as WarningIcon,
  AddCircle as AddCircleIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
// MUI X Date Pickers
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useHolidays } from '../../reservas/hooks/useHolidays';
import { FestivoDay } from '../components/FestivoDay';

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
import CreateHourModal from '../components/detalle-tienda/CreateHourModal';
import { useGlobalSnackbar } from '@/shared/components/SnackbarsPosition/SnackbarContext';

// ============================================================
//  INTERFACES
// ============================================================
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
}

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================
interface DetallePlanillaPageProps {
  storeId?: number | null;
}

export default function DetallePlanillaPage({ storeId: propStoreId }: DetallePlanillaPageProps) {
  const { esAdmin, esAreaManager } = useHorariosPolicies();
  const isAreaMgr = esAreaManager() && !esAdmin();
  const queryClient = useQueryClient();
  const { showSnackbar } = useGlobalSnackbar();

  const [searchTerm, setSearchTerm] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Dayjs>(dayjs());
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const [calendarYear, setCalendarYear] = useState(() => dayjs().year());
  const { data: festivosMap = {} } = useHolidays(calendarYear);

  const [editHourModalOpen, setEditHourModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [createHourOpen, setCreateHourOpen] = useState(false);
  const [createData, setCreateData] = useState<{
    employeeId: string;
    employeeName: string;
    eventName: string;
    tiendaId: number;
  } | null>(null);

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

  // La fecha "debounced" es la que realmente dispara las consultas a la API.
  // Se actualiza 400ms después del último cambio, así varios clics seguidos
  // en "Ayer" / "Día Anterior" no generan una llamada por cada clic.
  const [fechaDebounced, setFechaDebounced] = useState<Dayjs>(fechaSeleccionada);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFechaDebounced(fechaSeleccionada);
    }, 400);
    return () => clearTimeout(timer);
  }, [fechaSeleccionada]);

  const fechaStr = fechaDebounced.format('YYYY-MM-DD');

  const handleFechaChange = (newDate: Dayjs | null) => {
    if (newDate) {
      setFechaSeleccionada(newDate);
      setPage(0);
      // Ya no invalidamos manualmente: al cambiar fechaStr (debounced),
      // React Query detecta el nuevo queryKey y refetch solo una vez.
    }
  };

  // ================ CUSTOM ACTION BAR (lateral izquierdo) =================
  const CustomActionBar = (props: any) => {
    const { setOpen } = props;

    const handleAyer = () => {
      handleFechaChange(dayjs().subtract(1, 'day'));
      setOpen(false);
    };

    const handleAnteayer = () => {
      // Resta un día sobre la fecha YA seleccionada (no sobre hoy),
      // así cada clic retrocede un día más de forma sucesiva.
      // dayjs ya maneja el cambio de mes/año automáticamente.
      handleFechaChange(fechaSeleccionada.subtract(1, 'day'));
      // No cerramos el popup: así puedes seguir dando clic para retroceder
      // día por día sin tener que volver a abrir el calendario.
    };

    const handleHoy = () => {
      handleFechaChange(dayjs());
      setOpen(false);
    };

    return (
      <Box sx={{
        p: 2,
        bgcolor: '#fafbfc',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        minWidth: 140,
      }}>
        <Typography variant="caption" fontWeight={700} color="#004680" sx={{
          fontSize: '0.75rem',
          letterSpacing: '0.5px',
          textAlign: 'center'
        }}>
          RANGOS RÁPIDOS
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
          <Button
            size="small"
            variant="contained"
            fullWidth
            sx={{
              bgcolor: '#004680',
              '&:hover': { bgcolor: '#003366' },
              fontWeight: 600,
              py: 1,
            }}
            onClick={handleHoy}
          >
            Hoy
          </Button>
          <Button
            size="small"
            variant="contained"
            fullWidth
            sx={{
              bgcolor: '#004680',
              '&:hover': { bgcolor: '#003366' },
              fontWeight: 600,
              py: 1,
            }}
            onClick={handleAyer}
          >
            Ayer
          </Button>
          <Button
            size="small"
            variant="contained"
            fullWidth
            sx={{
              bgcolor: '#004680',
              '&:hover': { bgcolor: '#003366' },
              fontWeight: 600,
              py: 1,
            }}
            onClick={handleAnteayer}
          >
            Día Anterior
          </Button>
        </Box>
      </Box>
    );
  };
  // =======================================================================

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

  const firstStoreId = tiendasAConsultar.length > 0 ? tiendasAConsultar[0].id : undefined;
  const { reasons } = useHorarios(firstStoreId);

  const filasEmpleadosBase: EmpleadoFila[] = useMemo(() => {
    const rows: EmpleadoFila[] = [];

    tiendasAConsultar.forEach((tienda) => {
      const empleados = empleadosPorTienda[tienda.id] || [];
      const recordsDia = recordsPorTienda[tienda.id] || [];
      const novedadesDia = (novedadesPorTienda[tienda.id] || []).filter((n: any) => n.report_date === fechaStr);

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
        });
      });
    });

    rows.sort((a, b) => {
      if (a.tienda !== b.tienda) return a.tienda.localeCompare(b.tienda);
      return a.nombre.localeCompare(b.nombre);
    });

    return rows;
  }, [tiendasAConsultar, empleadosPorTienda, recordsPorTienda, novedadesPorTienda, fechaStr]);

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

  // ============================================================
  //  LÓGICA DE EDICIÓN
  // ============================================================

  const handleOpenEditHour = async (fila: EmpleadoFila, evento: string, recordId: number, horaActual: string | null) => {
    if (!esAdmin() && !isAreaMgr) return;

    const numericRecordId = Number(recordId);
    if (isNaN(numericRecordId) || numericRecordId <= 0) {
      console.error('RecordId inválido:', recordId);
      return;
    }

    const tiendaId = fila.tiendaId;
    const recordsStore = recordsPorTienda[tiendaId] || [];
    const observacionActual = recordsStore.find(r => r.id === numericRecordId)?.observations || '';

    let reasonId: number | null = null;
    try {
      reasonId = await getRecordReasonId(numericRecordId);
    } catch (e) {
      console.error('Error al obtener motivo:', e);
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
      reasons: reasons || [],
      initialReasonId: reasonId,
      recordId: numericRecordId,
      registros: registros,
    });
    setEditHourModalOpen(true);
  };

  const handleCloseEditHour = () => {
    setEditHourModalOpen(false);
    setEditData(null);
  };

  const handleConfirmEdit = async (horaFormateada: string, observacion: string, reasonId: number | null) => {
    if (!editData || !editData.recordId) {
      console.error('No hay datos de edición o recordId ausente');
      return;
    }

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
      queryClient.invalidateQueries({ queryKey: ['timeRecords'] });

      showSnackbar('Hora actualizada correctamente', 'success');
      handleCloseEditHour();
    } catch (error) {
      console.error('Error al editar hora:', error);
      showSnackbar('Error al editar la hora', 'error');
      throw error;
    }
  };

  // ============================================================
  //  LÓGICA DE CREACIÓN
  // ============================================================

  const handleOpenCreateHour = (empleadoId: string, empleadoNombre: string, evento: string, tiendaId: number) => {
    if (!esAdmin() && !isAreaMgr) return;
    setCreateData({
      employeeId: empleadoId,
      employeeName: empleadoNombre,
      eventName: evento,
      tiendaId: tiendaId,
    });
    setCreateHourOpen(true);
  };

  const handleCloseCreateHour = () => {
    setCreateHourOpen(false);
    setCreateData(null);
  };

  const handleConfirmCreate = async (horaFormateada: string, observacion: string) => {
    if (!createData) return;
    try {
      const parsed = dayjs(horaFormateada, 'hh:mm A');
      const recordTime = parsed.format('HH:mm:ss');
      const recordDate = fechaStr;

      await createTimeRecord({
        employee_id: Number(createData.employeeId),
        store_id: createData.tiendaId,
        log_type: createData.eventName,
        record_date: recordDate,
        record_time: recordTime,
        observations: observacion,
      });

      queryClient.invalidateQueries({ queryKey: ['recordsDiaMulti'] });
      queryClient.invalidateQueries({ queryKey: ['timeRecords'] });

      showSnackbar('Hora registrada correctamente', 'success');
      handleCloseCreateHour();
    } catch (error) {
      console.error('Error al crear hora:', error);
      showSnackbar('Error al crear la hora', 'error');
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

  return (
    <Box sx={{ backgroundColor: '#f5f7fa', pt: 0.5, pb: 1.5 }}>
      <Container maxWidth="xl">
        {/* ==================== ENCABEZADO (sin fecha) ==================== */}
        <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 }, mb: 1.5, borderRadius: 3, border: '1px solid #e0e0e0', bgcolor: 'transparent' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography variant="h5" fontWeight={700} color="#0a1929" sx={{ textTransform: 'uppercase', fontSize: { xs: '1rem', sm: '1.3rem' } }}>
              EDITAR REGISTROS
            </Typography>
            {/* ❌ Eliminado: el Typography de la fecha */}
          </Box>
        </Paper>

        {/* ==================== FILTROS ==================== */}
        <Paper elevation={0} sx={{ p: 1.5, mb: 1.5, borderRadius: 3, border: '1px solid #e0e0e0', bgcolor: 'transparent' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
              <DatePicker
                label="Seleccionar día"
                value={fechaSeleccionada}
                onChange={(value) => handleFechaChange(value as Dayjs | null)}
                onMonthChange={(m: any) => setCalendarYear(dayjs(m).year())}
                onYearChange={(y: any) => setCalendarYear(dayjs(y).year())}
                slotProps={{
                  day: { holidays: festivosMap } as any,
                  textField: {
                    size: 'small',
                    sx: { width: { xs: '100%', sm: 300 } },
                  },
                  actionBar: {
                    actions: [],
                  },
                  layout: {
                    sx: {
                      display: 'flex',
                      flexDirection: 'row-reverse',
                    }
                  }
                }}
                slots={{
                  day: FestivoDay,
                  actionBar: CustomActionBar,
                }}
              />
            </LocalizationProvider>

            <TextField
              size="small"
              placeholder="Buscar empleado..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              sx={{ width: 520 }}
            />

            {/* 🔥 NUEVO: Fecha al lado del buscador */}
            <Typography variant="body2" fontWeight={600} color="#64748b" sx={{ fontSize: '0.9rem' }}>
              {fechaSeleccionada.format('dddd, D [de] MMMM [de] YYYY')}
            </Typography>
          </Box>
        </Paper>

        {/* ==================== TABLA ==================== */}
        <TableContainer 
          component={Paper} 
          elevation={0} 
          sx={{ 
            borderRadius: 3, 
            border: '1px solid #e0e0e0', 
            overflowX: 'auto',
            bgcolor: 'transparent',
          }}
        >
          <Table size="medium" sx={{ minWidth: { xs: 700, md: '80%' } }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#546e7a', whiteSpace: 'nowrap' }}>TIENDA</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#546e7a', whiteSpace: 'nowrap' }}>EMPLEADO</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#546e7a', whiteSpace: 'nowrap' }}>CARGO</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#004680', bgcolor: '#e3f2fd', whiteSpace: 'nowrap' }}>INICIO JORNADA</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#004680', bgcolor: '#e3f2fd', whiteSpace: 'nowrap' }}>INICIO ALMUERZO</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#004680', bgcolor: '#e3f2fd', whiteSpace: 'nowrap' }}>FIN ALMUERZO</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#004680', bgcolor: '#e3f2fd', whiteSpace: 'nowrap' }}>FIN JORNADA</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#546e7a', whiteSpace: 'nowrap' }}>TOTAL HORAS</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#546e7a', whiteSpace: 'nowrap' }}>NOVEDADES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><CircularProgress sx={{ color: '#004680' }} /></TableCell></TableRow>
              ) : filasPagina.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>{searchTerm ? 'No hay empleados con ese nombre.' : 'No hay registros para este día.'}</TableCell></TableRow>
              ) : (
                filasPagina.map((fila, idx) => {
                  const eventosHoras = [
                    { key: 'inicioJornada', label: 'Comenzar Jornada', hora: fila.inicioJornada, recordId: fila.recordIdInicioJornada },
                    { key: 'inicioAlmuerzo', label: 'Iniciar Almuerzo', hora: fila.inicioAlmuerzo, recordId: fila.recordIdInicioAlmuerzo },
                    { key: 'finAlmuerzo', label: 'Finalizar Almuerzo', hora: fila.finAlmuerzo, recordId: fila.recordIdFinAlmuerzo },
                    { key: 'finJornada', label: 'Terminar Jornada', hora: fila.finJornada, recordId: fila.recordIdFinJornada },
                  ];

                  const employeeId = fila.id.includes('_') ? fila.id.split('_')[1] : fila.id;
                  const recordsTienda = recordsPorTienda[fila.tiendaId] || [];

                  return (
                    <TableRow key={fila.id} hover sx={{ bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <StorefrontIcon sx={{ color: '#004680', fontSize: 16 }} />
                          <Typography variant="body2" fontWeight={600} noWrap>{fila.tienda}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: '#004680', fontSize: '0.7rem' }}>{fila.nombre.charAt(0)}</Avatar>
                          <Typography variant="body2" fontWeight={600} noWrap>{fila.nombre}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2" noWrap>{fila.cargo}</Typography></TableCell>

                      {eventosHoras.map((evento) => {
                        const esHoraExistente = !!evento.hora;
                        const esNoAplica = !esHoraExistente && fila.tieneNovedad;
                        const puedeEditar = esAdmin() || isAreaMgr;
                        
                        const record = recordsTienda.find(r => r.id === evento.recordId);
                        const observacion = record?.observations || '';

                        const tooltipTitle = esHoraExistente
                          ? (observacion ? `Observación: ${observacion}` : 'Sin observación')
                          : esNoAplica
                          ? `No aplica (${fila.novedadTipo || 'Novedad'})`
                          : 'Sin observación registrada';

                        return (
                          <TableCell key={evento.key} align="center">
                            <Tooltip title={tooltipTitle} arrow>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.3 }}>
                                {esHoraExistente ? (
                                  <Chip
                                    size="small"
                                    icon={<CheckCircleIcon sx={{ fontSize: 12 }} />}
                                    label={evento.hora}
                                    sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, height: 24, fontSize: '0.7rem' }}
                                  />
                                ) : esNoAplica ? (
                                  <Chip
                                    size="small"
                                    label="No Aplica"
                                    sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600, height: 24, fontSize: '0.7rem' }}
                                  />
                                ) : (
                                  <Chip
                                    size="small"
                                    icon={<AccessTimeIcon sx={{ fontSize: 12 }} />}
                                    label="Pendiente"
                                    sx={{ bgcolor: '#f5f5f5', color: '#757575', fontWeight: 600, height: 24, fontSize: '0.7rem' }}
                                  />
                                )}
                                {puedeEditar && !esNoAplica && (
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      if (esHoraExistente && evento.recordId) {
                                        handleOpenEditHour(fila, evento.label, evento.recordId, evento.hora);
                                      } else {
                                        handleOpenCreateHour(
                                          employeeId,
                                          fila.nombre,
                                          evento.label,
                                          fila.tiendaId
                                        );
                                      }
                                    }}
                                    sx={{ p: 0.2, color: '#004680' }}
                                  >
                                    {esHoraExistente ? <EditIcon fontSize="small" /> : <AddCircleIcon fontSize="small" />}
                                  </IconButton>
                                )}
                              </Box>
                            </Tooltip>
                          </TableCell>
                        );
                      })}

                      <TableCell align="center"><Typography variant="body2" fontWeight={600}>{fila.horasDia}</Typography></TableCell>
                      
                      <TableCell align="center">
                        {fila.tieneNovedad ? (
                          <Chip size="small" icon={<WarningIcon sx={{ fontSize: 12 }} />} label={fila.novedadTipo || 'Novedad'} sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 600, height: 24, fontSize: '0.7rem' }} />
                        ) : (
                          <Chip size="small" icon={<CheckCircleIcon sx={{ fontSize: 12 }} />} label="Sin novedad" sx={{ bgcolor: '#f5f5f5', color: '#757575', height: 24, fontSize: '0.7rem' }} />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1, borderTop: '1px solid #e0e0e0', bgcolor: '#fafbfc' }}>
            <Typography variant="caption" color="text.secondary">
              Mostrando {Math.min((page + 1) * rowsPerPage, totalFilas)} de {totalFilas} registros
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

      {/* MODALES */}
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
          motivoRequerido={!esAdmin()}
        />
      )}

      {createData && (
        <CreateHourModal
          open={createHourOpen}
          onClose={handleCloseCreateHour}
          employeeName={createData.employeeName}
          eventName={createData.eventName}
          onConfirm={handleConfirmCreate}
        />
      )}
    </Box>
  );
}