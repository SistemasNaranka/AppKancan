import React from 'react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import { Postulacion } from '../api/directus/read';

interface Props {
  postulacion: Postulacion;
}

const AccionIA: React.FC<Props> = ({ postulacion }) => {
  const score = (postulacion as any).ai_score as number | null | undefined;
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
        alignItems: 'center',
        justifyContent: 'center',
        // ✅ Redujimos el minWidth de 100 a 60 para que ocupe menos espacio en la tabla
        minWidth: 60, 
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
              fontWeight: 800,
              fontSize: '0.85rem',       // ✅ Letra un poco más pequeb ña
              height: 26,                // ✅ Etiqueta más delgada (antes32)
              // ✅ Quitamos el minWidth: 75 para que se ajuste al texto
              bgcolor: colorMeta.bg,
              color: colorMeta.color,
              border: `1px solid ${colorMeta.color}33`, // Borde sutil
              // ✅ Quitamos el letterSpacing para que las letras estén junta s
              '& .MuiChip-label': {
                px: 1.5,                 // Padding interno justo a los lados
              }
            }}
          />
        </Tooltip>
      ) : (
        <Box sx={{ height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: '#94A3B8',
              fontStyle: 'italic',
              whiteSpace: 'nowrap',
              lineHeight: 1,
              fontWeight: 500,
            }}
          >
            Sin analizar
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AccionIA;