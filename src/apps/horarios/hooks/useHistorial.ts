import { useQuery } from '@tanstack/react-query';
import { fetchTimeRecords, TimeRecord } from '../api/directus/read';
import { HistorialRow } from '../interfaces/horarios.interface';

const agruparRegistros = (records: TimeRecord[]): HistorialRow[] => {
  const agrupado: Record<string, TimeRecord[]> = {};

  records.forEach((record) => {
    const clave = `${record.employee_id?.first_name ?? record.employee_id}-${record.record_date}`;
    if (!agrupado[clave]) agrupado[clave] = [];
    agrupado[clave].push(record);
  });

  return Object.values(agrupado).map((registros) => {
    const buscar = (tipo: string) =>
      registros.find((r) => r.log_type === tipo)?.record_time ?? null;

    const observaciones = registros
      .map((r) => r.observations)
      .filter(Boolean)
      .join(', ');

    return {
      fecha: registros[0].record_date,
      empleado: registros[0].employee_id
  ? `${registros[0].employee_id.first_name} ${registros[0].employee_id.last_name}`
  : 'Sin nombre',
      inicio_turno: buscar('Comenzar Jornada'),
      inicio_almuerzo: buscar('Iniciar Almuerzo'),
      fin_almuerzo: buscar('Finalizar Almuerzo'),
      fin_turno: buscar('Terminar Jornada'),
      observaciones: observaciones || null,
    };
  });
};

export const useHistorial = (fechaInicio?: string, fechaFin?: string) => {
  return useQuery({
    queryKey: ['historial', fechaInicio, fechaFin],
    queryFn: () => fetchTimeRecords(fechaInicio, fechaFin),
    select: (data) => agruparRegistros(data),
    staleTime: 1000 * 60 * 5,
  });
};