import React from 'react';
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import { AutoAwesome as SparkIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { Postulacion } from '../api/directus/read';

interface Props {
  postulacion: Postulacion;
  onClick: (p: Postulacion) => void;
  cargando?: boolean;
}

const AZUL = '#004680';
const AZUL_BG = '#E6EEF5';
const AZUL_BG_HOVER = '#CCDDEA';

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
        justifyContent: 'center',
        gap: 1, // Un poco más de espacio entre el puntaje y el botón
        minWidth: 100,
        py: 0.5,
      }}
    >
      {tieneScore ? (
        <Tooltip
          title={
            score >= 75 ? 'Nivel Alto' :
            score >= 50 ? 'Nivel Medio' :
            'Nivel Bajo'
          }
          arrow
        >
          <Chip
            label={`${score}/100`}
            sx={{
              fontWeight: 900,          // Letra más gruesa
              fontSize: '1rem',         // Texto más grande (aprox 16px)
              height: 32,               // Etiqueta más alta
              minWidth: 75,             // Etiqueta más ancha
              bgcolor: colorMeta.bg,
              color: colorMeta.color,
              letterSpacing: '0.5px',
              border: `1px solid ${colorMeta.color}22`, // Un borde sutil para resaltar
            }}
          />
        </Tooltip>
      ) : (
        <Box sx={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography
            sx={{
              fontSize: '0.8rem',       // Un poco más grande que antes (era 0.7rem)
              color: '#94A3B8',
              fontStyle: 'italic',
              whiteSpace: 'nowrap',
              lineHeight: 1,
              fontWeight: 600,          // Un poco más de peso visual
            }}
          >
            Sin analizar
          </Typography>
        </Box>
      )}

      {/* Botón para analizar */}
      <Tooltip title={tieneScore ? 'Reanalizar con IA' : 'Analizar con IA'} arrow>
        <span>
          <IconButton
            size="small"
            disabled={cargando}
            onClick={() => onClick(postulacion)}
            sx={{
              width: 36,                // Ligeramente más grande (era 32)
              height: 36,
              color: AZUL,
              bgcolor: AZUL_BG,
              '&:hover': { bgcolor: AZUL_BG_HOVER },
              '&.Mui-disabled': {
                color: '#94A3B8',
                bgcolor: '#F1F5F9',
              },
            }}
          >
            {cargando ? (
              <RefreshIcon sx={{ fontSize: 20 }} /> // Ícono un poco más grande
            ) : (
              <SparkIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};

export default AccionIA;