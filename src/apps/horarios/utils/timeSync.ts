import dayjs from 'dayjs';
import { resolveNetworkUrl } from '@/shared/utils/network';

let timeOffsetMs = 0;

export const syncTimeWithServer = async () => {
  try {
    const start = Date.now();
    const rawUrl = import.meta.env.VITE_DIRECTUS_URL || window.location.origin;
    const url = resolveNetworkUrl(rawUrl);
    
    const response = await fetch(url, { method: 'HEAD' });
    const dateHeader = response.headers.get('Date');
    
    if (dateHeader) {
      const serverTime = new Date(dateHeader).getTime();
      const latency = (Date.now() - start) / 2;
      const actualServerTime = serverTime + latency;
      timeOffsetMs = actualServerTime - Date.now();
    }
  } catch (e) {
    console.warn("⚠️ No se pudo sincronizar la hora con el servidor, se usará la hora del dispositivo:", e);
  }
};

export const getRealColombiaTime = (): dayjs.Dayjs => {
  const syncedTime = Date.now() + timeOffsetMs;
  try {
    const date = new Date(syncedTime);
    const formatter = new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value ?? '00';
    
    const yyyy = getPart('year');
    const mm = getPart('month');
    const dd = getPart('day');
    const hh = getPart('hour');
    const min = getPart('minute');
    const ss = getPart('second');
    
    const cleanHour = hh === '24' ? '00' : hh;
    const isoStr = `${yyyy}-${mm}-${dd}T${cleanHour}:${min}:${ss}`;
    
    return dayjs(isoStr);
  } catch (error) {
    console.warn("⚠️ Error formateando hora local de Colombia, usando fallback local:", error);
    return dayjs(syncedTime);
  }
};