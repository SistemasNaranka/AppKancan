import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { Postulacion } from '../api/directus/read';

type Nivel = 'alto' | 'medio' | 'bajo';

// Mismos umbrales que el IA asistente
export const nivelDe = (score: number): Nivel =>
  score >= 75 ? 'alto' : score >= 50 ? 'medio' : 'bajo';

const ESTILOS: Record<Nivel | 'analizar', { label: string; bg: string; color: string }> = {
  alto:     { label: 'Alto',     bg: '#E6F4EA', color: '#1E7A3C' },
  medio:    { label: 'Medio',    bg: '#FFF4D6', color: '#8A6100' },
  bajo:     { label: 'Bajo',     bg: '#FDE8E8', color: '#B42318' },
  analizar: { label: 'Sin analizar', bg: 'transparent', color: '#64748B' },
};

interface Props {
  postulacion: Postulacion;
  onClick: (p: Postulacion) => void;
}

const AccionIA: React.FC<Props> = ({ postulacion, onClick }) => {
  const score = (postulacion as any).ia_score;
  const tieneScore = typeof score === 'number';
  const estilo = ESTILOS[tieneScore ? nivelDe(score) : 'analizar'];

  return (
    <Tooltip title={tieneScore ? 'Ver análisis IA' : 'Analizar con IA'} arrow>
      <Chip
        size="small"
        label={estilo.label}
        icon={<AutoAwesome sx={{ fontSize: 14 }} />}
        onClick={() => onClick(postulacion)}
        sx={
          tieneScore
            ? {
                bgcolor: estilo.bg,
                color: estilo.color,
                fontWeight: 700,
                px: 0.5,
                '& .MuiChip-icon': { color: estilo.color },
                '&:hover': { bgcolor: estilo.bg, filter: 'brightness(0.95)' },
              }
            : {
                // Sin análisis: borde punteado y sin relleno para no confundirse con los niveles
                bgcolor: 'transparent',
                color: estilo.color,
                fontWeight: 600,
                px: 0.5,
                border: '1px dashed #CBD5E1',
                '& .MuiChip-icon': { color: '#94A3B8' },
                '&:hover': {
                  bgcolor: '#F1ECFB',
                  color: '#6B4FBB',
                  borderColor: '#C9BDF0',
                  '& .MuiChip-icon': { color: '#6B4FBB' },
                },
              }
        }
      />
    </Tooltip>
  );
};

export default AccionIA;