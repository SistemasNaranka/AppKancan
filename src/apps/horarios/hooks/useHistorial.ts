import { useQuery } from '@tanstack/react-query';
import { fetchTimeRecords, getStoreIdUsuarioActual, TimeRecord } from '../api/directus/read';
import { HistorialRow } from '../interfaces/horarios.interface';

const agruparRegistros = (records: TimeRecord[]): HistorialRow[] => {
  const agrupado: Record<string, TimeRecord[]> = {};

  records.forEach((record) => {
    const clave = `${record.employee_id?.first_name ?? record.employee_id}-${record.record_date}`;
    if (!agrupado[clave]) agrupado[clave] = [];
    agrupado[clave].push(record);
  });

  return Object.values(agrupado).map((registros) => {
    const buscar = (tipo: string) => {
      const match = registros.find((r) => r.log_type === tipo);
      if (!match) return null;
      return match.updated_record_time || match.record_time || null;
    };

    const observaciones_evento = registros
      .filter((r) => r.observations && r.observations.trim())
      .map((r) => ({
        evento: r.log_type,
        hora: r.record_time,
        observacion: r.observations!,
      }));

    return {
      fecha: registros[0].record_date,
      empleado: registros[0].employee_id
        ? [
            registros[0].employee_id.first_name,
            registros[0].employee_id.middle_name,
            registros[0].employee_id.last_name,
            registros[0].employee_id.second_last_name,
          ].filter(n => n && n.trim()).join(' ')
        : 'Sin nombre',
      inicio_turno: buscar('Comenzar Jornada'),
      inicio_almuerzo: buscar('Iniciar Almuerzo'),
      fin_almuerzo: buscar('Finalizar Almuerzo'),
      fin_turno: buscar('Terminar Jornada'),
      observaciones_evento,
    };
  });
};

export const useHistorial = (fechaInicio?: string, fechaFin?: string) => {
  const { data: storeId = null } = useQuery<number | null>({
    queryKey: ['horariosStoreId'],
    queryFn: getStoreIdUsuarioActual,
    staleTime: 30 * 60 * 1000,
  });

  return useQuery({
    queryKey: ['historial', storeId, fechaInicio, fechaFin],
    queryFn: () => fetchTimeRecords(fechaInicio, fechaFin, storeId ?? undefined),
    select: (data) => agruparRegistros(data),
    enabled: storeId != null,
    staleTime: 1000 * 60 * 5,
  });
};