import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

export default function NotificationTelemetry() {
  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        p: '14px 24px',
        borderRadius: '16px',
        boxShadow: '0px 10px 30px rgba(15, 23, 42, 0.08)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        gap: 4,
        bgcolor: '#ffffff',
        zIndex: 1000
      }}
    >
      <Box>
        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.5px', display: 'block', mb: 0.2 }}>
          Salud del Sistema
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, bgcolor: '#f59e0b', borderRadius: '50%' }} />
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
            Degradado (CORS)
          </Typography>
        </Box>
      </Box>
      <Box sx={{ width: '1px', bgcolor: '#e2e8f0' }} />
      <Box>
        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.5px', display: 'block', mb: 0.2 }}>
          Latencia Global
        </Typography>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
          24ms
        </Typography>
      </Box>
    </Paper>
  );
}