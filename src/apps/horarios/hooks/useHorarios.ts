import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmpleadoAsistencia, TipoNovedad, NovedadMapeada } from '../interfaces/horarios.interface';
import { getEmpleados, getNovedades, getTiposNovedad } from '../api/directus/read';
import { createNovedad } from '../api/directus/create';
import dayjs from 'dayjs';

const STORE_ID = 90;

export const useHorarios = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

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

  // ─── ADIÓS TODO LO LOCAL: FILTRADO DINÁMICO DESDE LA BD ──────────────
  // Identificamos qué empleados ya tienen una novedad registrada HOY usando "report_date"
  const hoy = dayjs().format('YYYY-MM-DD');
  
  const idsConNovedadHoy = (novedadesDB || [])
    .map((nov: any) => {
      const empId = nov.employee_id?.id || nov.employee_id;
      // Priorizamos report_date de la base de datos
      const fechaReporte = nov.report_date || (nov.date_created ? dayjs(nov.date_created).format('YYYY-MM-DD') : '');
      return fechaReporte === hoy ? String(empId) : null;
    })
    .filter(Boolean);

  // Lista de empleados reactiva: Se ocultan automáticamente si ya tienen novedades hoy en Directus
  const empleados = empleadosDB.filter((emp) => !idsConNovedadHoy.includes(String(emp.id)));

  // ─── MUTACIÓN PARA GUARDAR EN BD ────────────────────────────────────
  const mutation = useMutation({
    mutationFn: createNovedad,
    onSuccess: () => {
      // Al ser reactivo, esto refresca la lista de inmediato sin estados locales
      queryClient.invalidateQueries({ queryKey: ['novedades'] });
      queryClient.invalidateQueries({ queryKey: ['empleados', STORE_ID] });
    },
    onError: (err: any) => {
      setError(err?.message || 'Error al guardar la novedad');
    }
  });

  // ─── FUNCIONES LIMPIAS (EVITAN ERRORES DE COMPILACIÓN EN LA UI) ───
  const registrarEvento = (id: string, evento: string) => {
    console.log(`[Asistencia] Evento: ${evento} para empleado ID: ${id}`);
  };

  const guardarObservacion = (id: string, evento: string, texto: string) => {
    console.log(`[Observación] Nota para ${evento}: ${texto} (Empleado: ${id})`);
  };

  const eliminarEmpleado = (idEmpleado: string) => {
    console.log(`[UI] Eliminación local desactivada. Ahora se controla por novedades en la BD. ID: ${idEmpleado}`);
  };

  const resetHorarios = () => {
    setError(null);
    queryClient.invalidateQueries({ queryKey: ['empleados', STORE_ID] });
    queryClient.invalidateQueries({ queryKey: ['novedades'] });
  };

  // ─── AGREGAR NOVEDAD LLAMANDO AL REPORT_DATE ────────────────────────
  const agregarNovedad = async (novedad: {
    empleadoId: string;
    empleadoNombre: string;
    tipo: string;
    fecha: string;
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

      // Aseguramos formato limpio YYYY-MM-DD para la BD
      const fechaLimpia = dayjs(novedad.fecha).isValid() 
        ? dayjs(novedad.fecha).format('YYYY-MM-DD') 
        : dayjs().format('YYYY-MM-DD');

      await mutation.mutateAsync({
        employee_id: Number(novedad.empleadoId),
        newness_id: Number(tipoEncontrado.id),
        report_date: fechaLimpia, // 🚀 Enviamos report_date correctamente a Directus
        observations: novedad.observaciones || '',
        store_id: STORE_ID,
      });
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
    loading: loadingEmpleados,
    error: error || (errorE || errorT || errorN ? 'Sincronizando...' : null),
    registrarEvento,
    resetHorarios,
    eliminarEmpleado,
    guardarObservacion,
    agregarNovedad,
  };
};