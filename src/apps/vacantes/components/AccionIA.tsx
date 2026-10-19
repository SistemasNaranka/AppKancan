import React from 'react';
import { Chip, CircularProgress, Tooltip } from '@mui/material';
import { AutoAwesome as SparkIcon } from '@mui/icons-material';
import { Postulacion } from '../api/directus/read';
import { NIVELES_AJUSTE } from '../api/ia';

interface Props {
  postulacion: Postulacion;
  onClick: (p: Postulacion) => void;
  cargando?: boolean;
}

// Mismos umbrales que el IA asistente: alto ≥75, medio 50–74, bajo <50
const nivelPorPuntaje = (score: number): 'alto' | 'medio' | 'bajo' =>
  score >= 75 ? 'alto' : score >= 50 ? 'medio' : 'bajo';

const AccionIA: React.FC<Props> = ({ postulacion, onClick, cargando = false }) => {
  const score = (postulacion as any).ia_score as number | null | undefined;
  // != null (no > 0): un 0 real es un análisis hecho, no "sin analizar"
  const analizado = typeof score === 'number';

  const icono = cargando
    ? <CircularProgress size={12} sx={{ color: 'inherit' }} />
    : <SparkIcon sx={{ fontSize: 14 }} />;

  if (!analizado) {
    return (
      <Tooltip title="Analizar con IA" arrow>
        <Chip
          icon={icono}
          label={cargando ? 'Analizando…' : 'Sin analizar'}
          variant="outlined"
          size="small"
          disabled={cargando}
          onClick={() => onClick(postulacion)}
          sx={{
            fontWeight: 600,
            fontSize: '0.72rem',
            color: '#64748B',
            borderStyle: 'dashed',
            borderColor: '#CBD5E1',
            bgcolor: 'transparent',
            '& .MuiChip-icon': { color: 'inherit' },
            '&:hover': { color: '#7C3AED', borderColor: '#7C3AED', bgcolor: 'transparent' },
          }}
        />
      </Tooltip>
    );
  }

  const cfg = NIVELES_AJUSTE[nivelPorPuntaje(score)];

  return (
    <Tooltip title="Ver análisis IA" arrow>
      <Chip
        icon={icono}
        label={cfg.nombre}
        size="small"
        disabled={cargando}
        onClick={() => onClick(postulacion)}
        sx={{
          fontWeight: 700,
          fontSize: '0.72rem',
          minWidth: 76,
          bgcolor: cfg.fondo,
          color: cfg.texto,
          '& .MuiChip-icon': { color: 'inherit' },
          '&:hover': { bgcolor: cfg.fondo, filter: 'brightness(0.95)' },
        }}
      />
    </Tooltip>
  );
};

export default AccionIA;