import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { getProrrogaProgress, formatDate, getProrrogaDuration } from "../lib/utils";
import { daysUntil } from "../hooks/useContracts";
import { FiberManualRecord, RadioButtonUnchecked, Autorenew, CheckCircle } from "@mui/icons-material";
import { Stack } from "@mui/material";
import { Chip, LinearProgress } from "@mui/material";
import { Prorroga } from "../types/types";

// ─────────────────────────────────────────────────────────────────────────────
// ContractTimeline
// ─────────────────────────────────────────────────────────────────────────────

interface ContractTimelineProps {
  prorrogas: Prorroga[];
}

const ContractTimeline: React.FC<ContractTimelineProps> = ({ prorrogas }) => {
  const lastIdx      = prorrogas.length - 1;
  const nextNum      = prorrogas.length;           // la siguiente prórroga que se crearía
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
        const isActive     = idx === lastIdx;
        const isFinalizado = !isActive && daysUntil(p.fecha_final?.toString() ?? null) < 0;
        const progress     = isActive ? getProrrogaProgress(p) : 0;
        const diasRestantes = daysUntil(p.fecha_final?.toString() ?? null);

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
                <FiberManualRecord sx={{ fontSize: 22, filter: 'drop-shadow(0 0 4px rgba(0,70,128,0.4))' }} />
              ) : isFinalizado ? (
                <CheckCircle sx={{ fontSize: 18, color: 'primary.light' }} />
              ) : (
                <RadioButtonUnchecked sx={{ fontSize: 18, color: 'text.disabled' }} />
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
                  {p.numero === 0 ? 'Contrato original' : `Prórroga #${p.numero}`}
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
                    label={`${p.duracion ?? getProrrogaDuration(p.numero ?? idx)} meses`}
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

              {p.descripcion && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {p.descripcion}
                </Typography>
              )}

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
                      sx={{ color: isFinite(diasRestantes) && diasRestantes <= 50 ? 'warning.main' : 'success.main' }}
                    >
                      {isFinite(diasRestantes) ? `${diasRestantes} días` : '—'}
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
          <RadioButtonUnchecked sx={{ fontSize: 18, color: 'text.disabled' }} />
        </Box>
        <Autorenew sx={{ fontSize: 18, color: 'text.disabled' }} />
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