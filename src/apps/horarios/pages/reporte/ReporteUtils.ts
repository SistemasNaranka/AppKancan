import dayjs from 'dayjs';

export const AVATAR_COLORS = [
  '#0284c7', '#7c3aed', '#16a34a', '#ea580c', '#db2777',
  '#0891b2', '#4f46e5', '#ca8a04', '#dc2626', '#059669',
  '#2563eb', '#9333ea',
];

export const getAvatarColor = (texto: string) => {
  const str = String(texto || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export function getSemanasDelMes(anio: number, mes: number) {
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

export const calcularMinutosSemanales = (empId: any, startStr: string, endStr: string, records: any[]): number => {
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

export const formatMinutes = (totalMin: number): string => {
    if (totalMin === 0) return '0h';
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

