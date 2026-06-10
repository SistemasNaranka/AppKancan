import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmpleadoAsistencia, TipoNovedad, NovedadMapeada, RegistrosAsistencia } from '../interfaces/horarios.interface';
import { getEmpleados, getNovedades, getTiposNovedad, getTimeRecords } from '../api/directus/read';
import { createNovedades, createTimeRecord, updateTimeRecord } from '../api/directus/create';
import dayjs from 'dayjs';
import { useGlobalSnackbar } from '@/shared/components/SnackbarsPosition/SnackbarContext';

const STORE_ID = 90;

export const useHorarios = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { showSnackbar } = useGlobalSnackbar();
  const hoy = dayjs().format('YYYY-MM-DD');

  // ─── QUERIES DE REACT QUERY (DATOS EN TIEMPO REAL) ──────────────────
  const { data: empleadosDB = [], isLoading: loadingEmpleados, error: errorE } = useQuery<EmpleadoAsistencia[]>({
    queryKey: ['empleados', STORE_ID],
    queryFn: () => getEmpleados(STORE_ID),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: tiposNovedad = [], error: errorT } = useQuery<TipoNovedad[]>({
    queryKey: ['tiposNovedad'],
    queryFn: getTiposNovedad,
    staleTime: 10 * 60 * 1000,
  });

  const { data: novedadesDB = [], error: errorN } = useQuery<any[]>({
    queryKey: ['novedades'],
    queryFn: getNovedades,
  });

  // Consulta de registros de tiempo del día de hoy
  const { data: timeRecords = [], isLoading: loadingTimeRecords, error: errorTime } = useQuery<any[]>({
    queryKey: ['timeRecords', STORE_ID, hoy],
    queryFn: () => getTimeRecords(STORE_ID, hoy),
  });

  // ─── ADIÓS TODO LO LOCAL: FILTRADO DINÁMICO DESDE LA BD ──────────────
  // Identificamos qué empleados ya tienen una novedad registrada HOY usando "report_date"
  const idsConNovedadHoy = (novedadesDB || [])
    .map((nov: any) => {
      const empId = nov.employee_id?.id || nov.employee_id;
      // Priorizamos report_date de la base de datos mapeado a YYYY-MM-DD
      const fechaReporte = nov.report_date 
        ? dayjs(nov.report_date).format('YYYY-MM-DD')
        : (nov.date_created ? dayjs(nov.date_created).format('YYYY-MM-DD') : '');
      return fechaReporte === hoy ? String(empId) : null;
    })
    .filter(Boolean);

  // Mapeamos los empleados de la base de datos inyectando sus registros de asistencia reales de hoy
  const empleadosMapeados: EmpleadoAsistencia[] = empleadosDB.map((emp) => {
    // Filtrar los registros de tiempo de hoy para este empleado
    const records = timeRecords.filter(
      (r) => Number(r.employee_id?.id || r.employee_id) === Number(emp.id)
    );

    const registros: RegistrosAsistencia = {
      inicioJornada: null,
      inicioAlmuerzo: null,
      finAlmuerzo: null,
      finJornada: null,
      observaciones: {},
      ids: {}
    };

    records.forEach((r) => {
      const type = r.log_type;
      const time = r.record_time ? r.record_time.substring(0, 5) : ''; // "HH:mm"
      const obs = r.observations || '';
      
      if (type === 'Comenzar Jornada') {
        registros.inicioJornada = time;
        registros.observaciones.inicioJornada = obs;
        registros.ids!.inicioJornada = r.id;
      } else if (type === 'Iniciar Almuerzo') {
        registros.inicioAlmuerzo = time;
        registros.observaciones.inicioAlmuerzo = obs;
        registros.ids!.inicioAlmuerzo = r.id;
      } else if (type === 'Finalizar Almuerzo') {
        registros.finAlmuerzo = time;
        registros.observaciones.finAlmuerzo = obs;
        registros.ids!.finAlmuerzo = r.id;
      } else if (type === 'Terminar Jornada') {
        registros.finJornada = time;
        registros.observaciones.finJornada = obs;
        registros.ids!.finJornada = r.id;
      }
    });

    // Determinamos el estadoActual del empleado según qué registros ya tiene
    let estadoActual = 'entrada_pendiente';
    if (registros.finJornada) {
      estadoActual = 'jornada_finalizada';
    } else if (registros.finAlmuerzo) {
      estadoActual = 'regreso_almuerzo';
    } else if (registros.inicioAlmuerzo) {
      estadoActual = 'en_almuerzo';
    } else if (registros.inicioJornada) {
      estadoActual = 'jornada_iniciada';
    }

    return {
      ...emp,
      estadoActual,
      registros
    };
  });

  // Lista de empleados reactiva: Se ocultan automáticamente si ya tienen novedades hoy en Directus
  const empleados = empleadosMapeados.filter((emp) => !idsConNovedadHoy.includes(String(emp.id)));

  // ─── MUTACIONES PARA GUARDAR EN BD ────────────────────────────────────
  const noveltyMutation = useMutation({
    mutationFn: createNovedades,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novedades'] });
      queryClient.invalidateQueries({ queryKey: ['empleados', STORE_ID] });
      showSnackbar('Novedad registrada con éxito', 'success');
    },
    onError: (err: any) => {
      setError(err?.message || 'Error al guardar la novedad');
      showSnackbar(err?.message || 'Error al guardar la novedad', 'error');
    }
  });

  const createTimeRecordMutation = useMutation({
    mutationFn: createTimeRecord,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['timeRecords', STORE_ID, hoy] });
      showSnackbar(`Registro de "${data?.log_type || 'asistencia'}" guardado con éxito`, 'success');
    },
    onError: (err: any) => {
      setError(err?.message || 'Error al guardar el registro de asistencia');
      showSnackbar(err?.message || 'Error al guardar el registro de asistencia', 'error');
    }
  });

  const updateTimeRecordMutation = useMutation({
    mutationFn: ({ id, observations }: { id: number; observations: string }) =>
      updateTimeRecord(id, { observations }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeRecords', STORE_ID, hoy] });
      showSnackbar('Observación guardada con éxito', 'success');
    },
    onError: (err: any) => {
      setError(err?.message || 'Error al guardar la observación');
      showSnackbar(err?.message || 'Error al guardar la observación', 'error');
    }
  });

  // ─── FUNCIONES CONECTADAS A LA BD ────────────────────────────────────
  const getEventKey = (evento: string): string => {
    switch (evento) {
      case 'Comenzar Jornada': return 'inicioJornada';
      case 'Iniciar Almuerzo': return 'inicioAlmuerzo';
      case 'Finalizar Almuerzo': return 'finAlmuerzo';
      case 'Terminar Jornada': return 'finJornada';
      default: return '';
    }
  };

  const registrarEvento = async (idEmpleado: string, tipoEvento: string) => {
    setError(null);
    try {
      const ahora = dayjs();
      const recordDate = ahora.format('YYYY-MM-DD');
      const recordTime = ahora.format('HH:mm:ss');
      
      await createTimeRecordMutation.mutateAsync({
        employee_id: Number(idEmpleado),
        store_id: STORE_ID,
        log_type: tipoEvento,
        record_date: recordDate,
        record_time: recordTime,
        observations: ''
      });
    } catch (err: any) {
      console.error('Error al registrar evento:', err);
    }
  };

  const guardarObservacion = async (idEmpleado: string, tipoEvento: string, texto: string) => {
    setError(null);
    try {
      const emp = empleadosMapeados.find(e => String(e.id) === String(idEmpleado));
      if (!emp) return;
      
      const eventKey = getEventKey(tipoEvento);
      const recordId = emp.registros.ids?.[eventKey];
      
      if (recordId) {
        await updateTimeRecordMutation.mutateAsync({ id: recordId, observations: texto });
      } else {
        setError('No se encontró el registro de tiempo para actualizar la observación.');
      }
    } catch (err: any) {
      console.error('Error al guardar observación:', err);
    }
  };

  const eliminarEmpleado = (idEmpleado: string) => {
    console.log(`[UI] Eliminación local desactivada. Ahora se controla por novedades en la BD. ID: ${idEmpleado}`);
  };

  const resetHorarios = () => {
    setError(null);
    queryClient.invalidateQueries({ queryKey: ['empleados', STORE_ID] });
    queryClient.invalidateQueries({ queryKey: ['novedades'] });
    queryClient.invalidateQueries({ queryKey: ['timeRecords', STORE_ID, hoy] });
  };

  // ─── AGREGAR NOVEDAD CON RANGO DE FECHAS ────────────────────────
  const agregarNovedad = async (novedad: {
    empleadoId: string;
    empleadoNombre: string;
    tipo: string;
    fechaInicio: string;
    fechaFin: string;
    observaciones: string;
    fechaRegistro: string;
  }) => {
    setError(null);
    try {
      const tipoEncontrado = tiposNovedad.find((t) => t.name === novedad.tipo || t.nombre === novedad.tipo);
      if (!tipoEncontrado) {
        setError(`Tipo de novedad "${novedad.tipo}" no válido.`);
        return false;
      }

      const inicio = dayjs(novedad.fechaInicio);
      const fin = dayjs(novedad.fechaFin);

      if (!inicio.isValid() || !fin.isValid()) {
        setError("Las fechas seleccionadas no son válidas.");
        return false;
      }

      if (fin.isBefore(inicio, 'day')) {
        setError("La fecha fin debe ser igual o posterior a la de inicio.");
        return false;
      }

      const reportes: any[] = [];
      let current = inicio;
      while (current.isBefore(fin) || current.isSame(fin, 'day')) {
        reportes.push({
          employee_id: Number(novedad.empleadoId),
          newness_id: Number(tipoEncontrado.id),
          report_date: current.format('YYYY-MM-DD'),
          observations: novedad.observaciones || '',
          store_id: STORE_ID,
        });
        current = current.add(1, 'day');
      }

      await noveltyMutation.mutateAsync(reportes);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Error al guardar');
      return false;
    }
  };

  // ─── MAPEO SEGURO PARA LA TABLA USANDO REPORT_DATE ──────────────────
  const novedadesMapped: NovedadMapeada[] = (novedadesDB || []).map((nov: any) => {
    const empId = nov.employee_id?.id || nov.employee_id;
    const empLocal = empleadosDB.find((e) => String(e.id) === String(empId));
    
    let nombreEmpleado = `Empleado #${empId || ''}`;
    if (nov.employee_id?.first_name) {
      nombreEmpleado = `${nov.employee_id.first_name} ${nov.employee_id.last_name || ""}`.trim();
    } else if (empLocal) {
      nombreEmpleado = empLocal.nombre;
    }

    let tipoNovedadName = 'Novedad';
    if (nov.newness_id?.name) {
      tipoNovedadName = nov.newness_id.name;
    } else if (nov.newness_id?.nombre) {
      tipoNovedadName = nov.newness_id.nombre;
    } else {
      const tipoLocal = tiposNovedad.find((t) => String(t.id) === String(nov.newness_id));
      if (tipoLocal) tipoNovedadName = tipoLocal.nombre || tipoLocal.name;
    }

    return {
      id: nov.id,
      // 🚀 Priorizamos el report_date para pintar la fecha exacta elegida en la tabla
      fecha: nov.report_date || (nov.date_created ? dayjs(nov.date_created).format('YYYY-MM-DD') : new Date().toISOString()),
      empleadoNombre: nombreEmpleado,
      tipo: tipoNovedadName,
      observaciones: nov.observations || '',
    };
  });

  return {
    empleados, // 🚀 Ahora es una constante filtrada en tiempo real de la BD
    novedades: novedadesMapped,
    tiposNovedad,
    loading: loadingEmpleados || loadingTimeRecords,
    error: error || (errorE || errorT || errorN || errorTime ? 'Sincronizando...' : null),
    registrarEvento,
    resetHorarios,
    eliminarEmpleado,
    guardarObservacion,
    agregarNovedad,
  };
};