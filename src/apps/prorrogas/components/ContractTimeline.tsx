import React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { Prorroga } from '../types/types';
import { formatDate, daysUntil, getProrrogaDuration, getProrrogaProgress } from '../lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// ContractTimeline
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  prorrogas: Prorroga[];
}

const ContractTimeline: React.FC<Props> = ({ prorrogas }) => {
  // Validar que existan prorrogas
  if (!prorrogas || prorrogas.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No hay prórrogas registradas.
        </Typography>
      </Box>
    );
  }

  const lastIdx = prorrogas.length - 1;
  const nextNum = prorrogas[lastIdx].numero + 1;
  const nextDuration = getProrrogaDuration(nextNum);

  return (
    <Box sx={{ position: 'relative', pl: 4 }}>
      {/* Vertical line */}
      <Box
        sx={{
          position: 'absolute',
          left: 15,
          top: 16,
          width: 2,
          bottom: 0,
          background: '#004680',
          borderRadius: 1,
        }}
      />

      {/* Prorroga entries */}
      {prorrogas.map((p, idx) => {
        const isActive    = idx === lastIdx;
        const isFinalizado = !isActive && daysUntil(p.fecha_final) < 0;
        const progress    = isActive ? getProrrogaProgress(p) : 0;

        return (
          <Box key={p.id} sx={{ position: 'relative', mb: 2.5 }}>
            {/* Dot */}
            <Box
              sx={{
                position: 'absolute',
                left: -26,
                top: 10,
                zIndex: 1,
                color: isActive ? 'primary.main' : isFinalizado ? 'primary.light' : 'divider',
              }}
            >
              {isActive ? (
                <FiberManualRecordIcon sx={{ fontSize: 22, filter: 'drop-shadow(0 0 4px rgba(0,70,128,0.4))' }} />
              ) : isFinalizado ? (
                <CheckCircleIcon sx={{ fontSize: 18, color: 'primary.light' }} />
              ) : (
                <RadioButtonUncheckedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
              )}
            </Box>

            {/* Card */}
            <Box
              sx={{
                border: '1.5px solid',
                borderColor: isActive ? 'primary.main' : 'divider',
                borderRadius: 3,
                p: 2,
                bgcolor: isActive ? 'rgba(0,70,128,0.04)' : 'background.paper',
                transition: 'all 0.2s',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                <Typography variant="subtitle2" sx={{ color: isActive ? 'primary.main' : 'text.primary', fontWeight: 700 }}>
                  {p.label}
                </Typography>
                <Stack direction="row" spacing={0.8} alignItems="center">
                  {isActive && (
                    <Chip
                      label="En Curso"
                      size="small"
                      sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                    />
                  )}
                  {isFinalizado && (
                    <Chip
                      label="Finalizado"
                      size="small"
                      sx={{ bgcolor: '#eceff1', color: '#546e7a', fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                    />
                  )}
                  <Chip
                    label={`${p.duracion} meses`}
                    size="small"
                    sx={{
                      bgcolor: isActive ? 'primary.main' : '#f0f4f8',
                      color: isActive ? '#fff' : 'text.secondary',
                      fontWeight: 700,
                      fontSize: '0.68rem',
                      height: 20,
                    }}
                  />
                </Stack>
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {p.descripcion}
              </Typography>

              <Stack direction="row" spacing={3}>
                <Box>
                  <Typography variant="overline" sx={{ display: 'block', lineHeight: 1.2 }}>Inicio</Typography>
                  <Typography variant="caption" fontWeight={600} color="text.primary">
                    {formatDate(p.fecha_ingreso)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="overline" sx={{ display: 'block', lineHeight: 1.2 }}>Fin</Typography>
                  <Typography variant="caption" fontWeight={600} color="text.primary">
                    {formatDate(p.fecha_final)}
                  </Typography>
                </Box>
                {isActive && (
                  <Box>
                    <Typography variant="overline" sx={{ display: 'block', lineHeight: 1.2 }}>Días restantes</Typography>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{ color: daysUntil(p.fecha_final) <= 50 ? 'warning.main' : 'success.main' }}
                    >
                      {daysUntil(p.fecha_final)} días
                    </Typography>
                  </Box>
                )}
              </Stack>

              {isActive && (
                <Box sx={{ mt: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary">Avance del tramo</Typography>
                    <Typography variant="caption" fontWeight={700} color="primary.main">{progress}%</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 5,
                      borderRadius: 3,
                      bgcolor: '#dde8f5',
                      '& .MuiLinearProgress-bar': {
                        background: '#004680',
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        );
      })}

      {/* Next prorroga hint */}
      <Box
        sx={{
          position: 'relative',
          border: '1.5px dashed',
          borderColor: 'divider',
          borderRadius: 3,
          p: 1.8,
          bgcolor: '#fafbfd',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box sx={{ position: 'absolute', left: -26, top: 10 }}>
          <RadioButtonUncheckedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
        </Box>
        <AutorenewIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
        <Typography variant="caption" color="text.secondary">
          {nextNum >= 4
            ? `Prórroga ${nextNum} — Renovación anual (${nextDuration} meses) · Condiciones de planta`
            : `Prórroga ${nextNum} — ${nextDuration} meses`}
        </Typography>
      </Box>
    </Box>
  );
};

export default ContractTimeline;