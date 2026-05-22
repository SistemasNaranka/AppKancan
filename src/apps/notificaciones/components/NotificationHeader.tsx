import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

interface HeaderProps {
  onOpenDrawer: () => void;
}

export default function NotificationHeader({ onOpenDrawer }: HeaderProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.75rem', letterSpacing: '-0.5px' }}>
          Historial de Entregas
        </Typography>
      </Box>

      <Button 
  variant="contained" 
  onClick={onOpenDrawer} // o la función que tengas
  sx={{ 
    bgcolor: '#004a99', 
    '&:hover': { bgcolor: '#003366' },
    borderRadius: '10px',
    textTransform: 'none',
    fontWeight: 700
  }}
>
  Nueva Notificación
</Button>
    </Box>
  );
}