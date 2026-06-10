import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import { readItems } from '@directus/sdk';

export interface TimeRecord {
  id: number;
  record_date: string;
  record_time: string;
  log_type: string;
  employee_id: { first_name: string; last_name: string };
  store_id: string;
  observations: string | null;
}

export const fetchTimeRecords = async (
  fechaInicio?: string,
  fechaFin?: string
): Promise<TimeRecord[]> => {
  const filter: any = {};

  if (fechaInicio) {
    filter.record_date = { ...filter.record_date, _gte: fechaInicio };
  }
  if (fechaFin) {
    filter.record_date = { ...filter.record_date, _lte: fechaFin };
  }

  return await withAutoRefresh(() =>
    directus.request(
      readItems('com_time_records', {
        fields: ['id', 'record_date', 'record_time', 'log_type', 'employee_id.first_name', 'employee_id.last_name', 'store_id', 'observations'],
        filter,
        sort: ['-record_date'],
        limit: -1,
      })
    )
  ) as TimeRecord[];
};