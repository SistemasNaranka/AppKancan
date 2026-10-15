// Columna "Análisis IA" para la tabla de vacantes.
// Muestra el puntaje guardado (si existe) y un botón para analizar ese candidato con IA.
import React from 'react';
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import { AutoAwesome as SparkIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { Postulacion } from '../api/directus/read';

interface Props {
  postulacion: Postulacion;
  onClick: (p: Postulacion) => void;
  cargando?: boolean;
}

const AccionIA: React.FC<Props> = ({ postulacion, onClick, cargando = false }) => {
  const score = (postulacion as any).ia_score as number | null | undefined;
  const tieneScore = score != null && score > 0;

  const colorMeta = !tieneScore
    ? { bg: '#F1F5F9', color: '#64748B' }
    : score >= 75
      ? { bg: '#DCFCE7', color: '#15803D' }
      : score >= 50
        ? { bg: '#FEF3C7', color: '#B45309' }
        : { bg: '#FEE2E2', color: '#B91C1C' };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
        minWidth: 60,
      }}
    >
      {tieneScore ? (
        <Chip
          label={score}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: '0.75rem',
            height: 22,
            minWidth: 42,
            bgcolor: colorMeta.bg,
            color: colorMeta.color,
          }}
        />
      ) : (
        <Typography
          sx={{
            fontSize: '0.7rem',
            color: '#94A3B8',
            fontStyle: 'italic',
            height: 22,
            lineHeight: '22px',
          }}
        >
          Sin analizar
        </Typography>
      )}

      <Tooltip title={tieneScore ? 'Reanalizar con IA' : 'Analizar con IA'} arrow>
        <span>
          <IconButton
            size="small"
            disabled={cargando}
            onClick={() => onClick(postulacion)}
            sx={{
              width: 32,
              height: 32,
              color: '#7C3AED',
              bgcolor: '#F3E8FF',
              '&:hover': { bgcolor: '#E9D5FF' },
              '&.Mui-disabled': {
                color: '#94A3B8',
                bgcolor: '#F1F5F9',
              },
            }}
          >
            {cargando ? (
              <RefreshIcon sx={{ fontSize: 16 }} />
            ) : (
              <SparkIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};

export default AccionIA;