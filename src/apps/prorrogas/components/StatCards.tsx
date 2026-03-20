import React from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import { useContracts } from '../hooks/useContracts';

// ─────────────────────────────────────────────────────────────────────────────
// StatCards
// ─────────────────────────────────────────────────────────────────────────────

interface StatCard {
  label: string;
  value: number;
  Icon: React.ElementType;
  iconColor: string;
  valueColor: string;
  description: string;
}

const StatCards: React.FC = () => {
  const { allEnriched, counts } = useContracts();

  const vigentes = allEnriched.filter((c) => c.contractStatus === 'vigente').length;
  const proximos = allEnriched.filter((c) => c.contractStatus === 'proximo').length;
  const vencidos = allEnriched.filter((c) => c.contractStatus === 'vencido').length;

  const cards: StatCard[] = [
    {
      label: 'Total Contratos',
      value: counts.total,
      Icon: AssignmentOutlinedIcon,
      iconColor: '#004680',
      valueColor: '#004680',
      description: 'Registros activos en el sistema',
    },
    {
      label: 'Vigentes',
      value: vigentes,
      Icon: CheckCircleOutlineIcon,
      iconColor: '#1a7a4a',
      valueColor: '#1a7a4a',
      description: 'Contratos sin alerta de vencimiento',
    },
    {
      label: 'En Riesgo',
      value: proximos,
      Icon: WarningAmberIcon,
      iconColor: '#e65100',
      valueColor: '#e65100',
      description: '50 días o menos para vencer',
    },
    {
      label: 'Vencidos',
      value: vencidos,
      Icon: ErrorOutlineIcon,
      iconColor: '#c62828',
      valueColor: '#c62828',
      description: 'Requieren atención inmediata',
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {cards.map((card) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.label}>
          <Card sx={{ height: '100%', overflow: 'hidden' }}>
            <CardContent sx={{ p: 2.5, position: 'relative' }}>

              {/* Ícono grande de fondo */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -5,
                  right: -40,
                  opacity: 0.1,
                  pointerEvents: 'none',
                }}
              >
                <card.Icon sx={{ fontSize: 110, color: card.iconColor }} />
              </Box>

              {/* Contenido */}
              <Box sx={{ position: 'relative' }}>
                <Typography variant="overline" sx={{ display: 'block', mb: 0.5 }}>
                  {card.label}
                </Typography>
                <Typography
                  sx={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.1, color: card.valueColor }}
                >
                  {card.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {card.description}
                </Typography>
              </Box>

            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatCards;