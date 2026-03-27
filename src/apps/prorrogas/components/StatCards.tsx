import React from 'react';
import { Box, Card, CardContent, Grid, Typography, Stack } from '@mui/material';
import { useContracts } from '../hooks/useContracts';

// ─────────────────────────────────────────────────────────────────────────────
// StatCards
// ─────────────────────────────────────────────────────────────────────────────

const StatCards: React.FC = () => {
  const { allEnriched, counts } = useContracts();

  const activos  = allEnriched.filter((c) => c.contractStatus === 'vigente').length;
  const porVencer = allEnriched.filter((c) => c.daysLeft >= 0 && c.daysLeft <= 30).length;
  const criticos  = allEnriched.filter((c) => c.daysLeft >= 0 && c.daysLeft <= 7).length;
  const vencidos  = allEnriched.filter((c) => c.contractStatus === 'vencido').length;

  // Contratos creados este mes (usa date_created del contrato)
  const thisMonth = new Date();
  const nuevosEsteMes = allEnriched.filter((c) => {
    if (!c.date_created) return false;
    const d = new Date(c.date_created);
    return d.getFullYear() === thisMonth.getFullYear() && d.getMonth() === thisMonth.getMonth();
  }).length;

  const cards = [
    {
      label: 'Contratos Activos',
      value: activos,
      badge: nuevosEsteMes > 0 ? `+${nuevosEsteMes} este mes` : null,
      badgeColor: '#16a34a',
      badgeBg: '#dcfce7',
      accent: '#16a34a',
      iconBg: '#dcfce7',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label: 'Por Vencer',
      value: porVencer,
      badge: 'Próx. 30 días',
      badgeColor: '#d97706',
      badgeBg: '#fef3c7',
      accent: '#d97706',
      iconBg: '#fef3c7',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label: 'Críticos',
      value: criticos,
      badge: 'Próx. 7 días',
      badgeColor: '#dc2626',
      badgeBg: '#fee2e2',
      accent: '#dc2626',
      iconBg: '#fee2e2',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label: 'Vencidos',
      value: vencidos,
      badge: 'Requieren acción',
      badgeColor: '#6b7280',
      badgeBg: '#f3f4f6',
      accent: '#6b7280',
      iconBg: '#f3f4f6',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {cards.map((card) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.label}>
          <Card sx={{ height: '100%', borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    bgcolor: card.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {card.icon}
                </Box>
                {card.badge && (
                  <Typography
                    variant="caption"
                    sx={{
                      px: 1,
                      py: 0.3,
                      borderRadius: 10,
                      bgcolor: card.badgeBg,
                      color: card.badgeColor,
                      fontWeight: 700,
                      fontSize: '0.68rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {card.badge}
                  </Typography>
                )}
              </Stack>

              <Typography
                sx={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.1, color: 'text.primary', mb: 0.3 }}
              >
                {card.value}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                {card.label}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatCards;