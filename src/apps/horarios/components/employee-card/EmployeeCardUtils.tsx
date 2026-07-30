import { useState, useEffect, useRef } from 'react';
import { Typography, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DiningIcon from '@mui/icons-material/Dining';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

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
