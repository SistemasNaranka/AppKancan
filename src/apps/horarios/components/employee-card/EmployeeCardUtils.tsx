import { useState, useEffect, useRef } from 'react';
import { Typography, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DiningIcon from '@mui/icons-material/Dining';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import dayjs from 'dayjs';
import * as yup from 'yup';

export const EVENTOS_PAUSA = [
  'Iniciar Pausa Activa',
];

export const getIcon = (etiqueta: string) => {
  switch (etiqueta) {
    case 'Comenzar Jornada': return <PlayArrowIcon fontSize="small" />;
    case 'Iniciar Almuerzo': return <RestaurantIcon fontSize="small" />;
    case 'Finalizar Almuerzo': return <DiningIcon fontSize="small" />;
    case 'Terminar Jornada': return <ExitToAppIcon fontSize="small" />;
    default: return null;
  }
};

export const formatTo12Hour = (timeStr: string | null): string => {
  if (!timeStr) return '';
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');
  return `${hoursStr}:${minutes} ${ampm}`;
};

export function NombreEmpleado({ nombre }: { nombre: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [truncado, setTruncado] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el) setTruncado(el.scrollWidth > el.clientWidth);
  }, [nombre]);

  const texto = (
    <Typography
      ref={ref}
      noWrap
      sx={{ fontWeight: 700, fontSize: '1rem', textTransform: 'capitalize', lineHeight: 1.2 }}
    >
      {nombre}
    </Typography>
  );

  return truncado ? (
    <Tooltip
      title={nombre}
      arrow
      placement="top"
      enterTouchDelay={0}
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: '#EAF2FB',
            color: '#0f2c4a',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.2px',
            textTransform: 'capitalize',
            px: 1.5,
            py: 0.875,
            borderRadius: 2,
            border: '1px solid #d6e6f7',
            boxShadow: '0 8px 24px rgba(0, 70, 128, 0.18)',
          },
        },
        arrow: { sx: { color: '#EAF2FB', '&::before': { border: '1px solid #d6e6f7' } } },
      }}
    >
      {texto}
    </Tooltip>
  ) : (
    texto
  );
}

export const novedadSchema = yup.object().shape({
  novedad: yup.string().required('El tipo de novedad es obligatorio'),
  fechaInicio: yup.string().required('La fecha de inicio es obligatoria'),
  fechaFin: yup.string().required('La fecha de fin es obligatoria')
    .test('is-after-or-equal', 'La fecha fin debe ser igual o posterior a la de inicio', function (value) {
      const { fechaInicio } = this.parent;
      if (!fechaInicio || !value) return true;
      return dayjs(value).isSame(dayjs(fechaInicio), 'day') || dayjs(value).isAfter(dayjs(fechaInicio), 'day');
    }),
  observaciones: yup.string().max(300, 'Máximo 300 caracteres')
});

export const getObservacion = (registros: any, evento: string): string => {
  if (!registros?.observaciones) return '';
  switch (evento) {
    case 'Comenzar Jornada': return registros.observaciones.inicioJornada || '';
    case 'Iniciar Almuerzo': return registros.observaciones.inicioAlmuerzo || '';
    case 'Finalizar Almuerzo': return registros.observaciones.finAlmuerzo || '';
    case 'Terminar Jornada': return registros.observaciones.finJornada || '';
    default: return '';
  }
};

export const getHoraEvento = (registros: any, evento: string): string | null => {
  if (!registros) return null;
  switch (evento) {
    case 'Comenzar Jornada': return registros.inicioJornada;
    case 'Iniciar Almuerzo': return registros.inicioAlmuerzo;
    case 'Finalizar Almuerzo': return registros.finAlmuerzo;
    case 'Terminar Jornada': return registros.finJornada;
    default: return null;
  }
};

export const getEditadoStatus = (registros: any, evento: string): boolean => {
  if (!registros?.horasOriginales) return false;
  let eventKey = '';
  switch (evento) {
    case 'Comenzar Jornada': eventKey = 'inicioJornada'; break;
    case 'Iniciar Almuerzo': eventKey = 'inicioAlmuerzo'; break;
    case 'Finalizar Almuerzo': eventKey = 'finAlmuerzo'; break;
    case 'Terminar Jornada': eventKey = 'finJornada'; break;
  }
  return !!registros.horasOriginales[eventKey];
};

export const getRecordIdEvento = (registros: any, evento: string): number | undefined => {
  if (!registros?.ids) return undefined;
  let eventKey = '';
  switch (evento) {
    case 'Comenzar Jornada': eventKey = 'inicioJornada'; break;
    case 'Iniciar Almuerzo': eventKey = 'inicioAlmuerzo'; break;
    case 'Finalizar Almuerzo': eventKey = 'finAlmuerzo'; break;
    case 'Terminar Jornada': eventKey = 'finJornada'; break;
  }
  return registros.ids[eventKey];
};

export function useActiveBreak(id: string, onReportarEvento: (idEmpleado: string, eventType: string) => void) {
  const [tiempoRestante, setTiempoRestante] = useState<number | null>(null);

  useEffect(() => {
    const checkActiveBreak = () => {
      let expirationStr;
      if (String(id) === '99999') {
        expirationStr = (window as any).__demoActiveBreakExpires;
      } else {
        expirationStr = localStorage.getItem(`activeBreakExpires_${id}`);
      }

      if (expirationStr) {
        const expirationTime = parseInt(expirationStr, 10);
        const now = Date.now();
        const diff = Math.ceil((expirationTime - now) / 1000);
        if (diff > 0) {
          setTiempoRestante(diff);
        } else {
          if (String(id) === '99999') delete (window as any).__demoActiveBreakExpires;
          else localStorage.removeItem(`activeBreakExpires_${id}`);
          setTiempoRestante(null);
          onReportarEvento(id, 'Terminar Pausa Activa');
        }
      }
    };

    checkActiveBreak();
    window.addEventListener('storage', checkActiveBreak);
    return () => window.removeEventListener('storage', checkActiveBreak);
  }, [id, onReportarEvento]);

  useEffect(() => {
    if (tiempoRestante === null) return;

    if (tiempoRestante <= 0) {
      if (String(id) === '99999') delete (window as any).__demoActiveBreakExpires;
      else localStorage.removeItem(`activeBreakExpires_${id}`);
      setTiempoRestante(null);
      onReportarEvento(id, 'Terminar Pausa Activa');
      return;
    }

    const interval = setInterval(() => {
      let expirationStr;
      if (String(id) === '99999') {
        expirationStr = (window as any).__demoActiveBreakExpires;
      } else {
        expirationStr = localStorage.getItem(`activeBreakExpires_${id}`);
      }

      if (expirationStr) {
        const expirationTime = parseInt(expirationStr, 10);
        const now = Date.now();
        const diff = Math.ceil((expirationTime - now) / 1000);
        if (diff > 0) {
          setTiempoRestante(diff);
        } else {
          clearInterval(interval);
          if (String(id) === '99999') delete (window as any).__demoActiveBreakExpires;
          else localStorage.removeItem(`activeBreakExpires_${id}`);
          setTiempoRestante(null);
          onReportarEvento(id, 'Terminar Pausa Activa');
        }
      } else {
        clearInterval(interval);
        setTiempoRestante(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tiempoRestante, id, onReportarEvento]);

  const handleTerminarDemoPausa = () => {
    if (String(id) === '99999') {
      delete (window as any).__demoActiveBreakExpires;
    } else {
      localStorage.removeItem(`activeBreakExpires_${id}`);
    }
    setTiempoRestante(null);
    onReportarEvento(id, 'Terminar Pausa Activa');
  };

  const handleIniciarDemoPausa = () => {
    const expirationTime = Date.now() + 5 * 60 * 1000;
    if (String(id) === '99999') {
      (window as any).__demoActiveBreakExpires = String(expirationTime);
    } else {
      localStorage.setItem(`activeBreakExpires_${id}`, String(expirationTime));
    }
    setTiempoRestante(300);
  };

  return {
    tiempoRestante,
    setTiempoRestante,
    handleTerminarDemoPausa,
    handleIniciarDemoPausa,
  };
}
