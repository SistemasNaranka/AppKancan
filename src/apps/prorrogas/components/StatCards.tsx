import React from 'react';
import { Box, Card, CardContent, Grid, Typography, Stack } from '@mui/material';
import { useContracts } from '../hooks/useContracts';
import { useContractContext } from '../contexts/ContractContext';

// ─────────────────────────────────────────────────────────────────────────────
// StatCards
// ─────────────────────────────────────────────────────────────────────────────

const StatCards: React.FC = () => {

const { filteredContratos: contratos, setTab, filters } = useContractContext();

const activos       = contratos.filter((c) => c.contractStatus === 'vigente').length;
const porVencer     = contratos.filter((c) => c.daysLeft >= 0 && c.daysLeft <= 30).length;
const criticos      = contratos.filter((c) => c.daysLeft >= 0 && c.daysLeft <= 7).length;
const vencidos      = contratos.filter((c) => c.contractStatus === 'vencido').length;

  // Contratos creados este mes (usa date_created del contrato)
  const thisMonth = new Date();
  const nuevosEsteMes = contratos.filter((c) => {
    if (!c.date_created) return false;
    const d = new Date(c.date_created);
    return d.getFullYear() === thisMonth.getFullYear() && d.getMonth() === thisMonth.getMonth();
  }).length;

  const cards = [
    {
      tabValue: 'activos' as const,
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
      tabValue: 'por_vencer' as const,
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
      tabValue: 'criticos' as const,
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
      tabValue: 'vencidos' as const,
      label: "Vencidos",
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
    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
      <Box sx={{ flex: 1, display: 'flex', gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
        {cards.slice(0, 3).map((card) => (
          <Box key={card.label} sx={{ flex: 1, minWidth: { xs: '100%', sm: 0 } }}>
            <Card 
              onClick={() => setTab(card.tabValue as any)}
              sx={{ 
                height: '100%', 
                borderRadius: 2.5, 
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                ...(filters.tab === card.tabValue ? { 
                  boxShadow: `0 0 0 2px ${card.accent} inset, 0 4px 14px rgba(0,0,0,0.1)` 
                } : {
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)', 
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                  }
                })
              }}
            >
              <CardContent sx={{ p: 2.5, pb: '20px !important' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                  <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {card.icon}
                  </Box>
                  {card.badge && (
                    <Typography variant="caption" sx={{ px: 1, py: 0.3, borderRadius: 10, bgcolor: card.badgeBg, color: card.badgeColor, fontWeight: 700, fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                      {card.badge}
                    </Typography>
                  )}
                </Stack>
                <Typography sx={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.1, color: 'text.primary', mb: 0.3 }}>
                  {card.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                  {card.label}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
      <Box sx={{ width: { xs: '100%', md: 270 }, flexShrink: 0 }}>
        {(() => {
          const card = cards[3];
          return (
            <Card 
              onClick={() => setTab(card.tabValue as any)}
              sx={{ 
                height: '100%', 
                borderRadius: 2.5, 
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                ...(filters.tab === card.tabValue ? { 
                  boxShadow: `0 0 0 2px ${card.accent} inset, 0 4px 14px rgba(0,0,0,0.1)` 
                } : {
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                  }
                })
              }}
            >
              <CardContent sx={{ p: 2.5, pb: '20px !important' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                  <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {card.icon}
                  </Box>
                  {card.badge && (
                    <Typography variant="caption" sx={{ px: 1, py: 0.3, borderRadius: 10, bgcolor: card.badgeBg, color: card.badgeColor, fontWeight: 700, fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                      {card.badge}
                    </Typography>
                  )}
                </Stack>
                <Typography sx={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.1, color: 'text.primary', mb: 0.3 }}>
                  {card.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                  {card.label}
                </Typography>
              </CardContent>
            </Card>
          );
        })()}
      </Box>
    </Box>
  );
};

export default StatCards;
