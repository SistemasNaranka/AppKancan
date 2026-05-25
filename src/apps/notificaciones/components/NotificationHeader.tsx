import React from 'react';
import { Box, Typography, Button, Paper, Stack } from '@mui/material';
import AddAlertIcon from '@mui/icons-material/AddAlert';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  total: number;
}

export default function NotificationHeader({ total }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: 'white', position: 'sticky', top: 0, zIndex: 100, mb: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>

        {/* Título */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ bgcolor: '#004a99', p: 1, borderRadius: '12px', display: 'flex', color: 'white' }}>
            <NotificationsIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} color="#0f172a" sx={{ fontFamily: 'Inter' }}>
              Historial de Notificaciones
            </Typography>
<Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Inter' }}>
               {total} notificación{total !== 1 ? 'es' : ''} registradas
             </Typography>
          </Box>
        </Stack>

        {/* Botón Crear */}
        <Button
          variant="contained"
          onClick={() => navigate('/notificaciones/crear')}
          startIcon={<AddAlertIcon />}
          sx={{
            bgcolor: '#004a99',
            '&:hover': { bgcolor: '#003366' },
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            fontFamily: 'Inter'
          }}
        >
          Crear Notificación
        </Button>

      </Stack>
    </Paper>
  );
}