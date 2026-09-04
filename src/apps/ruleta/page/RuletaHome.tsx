import React from 'react';
import { Box } from '@mui/material';
import Ruleta from '../components/Ruleta'; // ✅ Ruta correcta a components

const RuletaHome: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#0a0a0f',
        p: 2,
      }}
    >
      <Ruleta userEmail="usuario@ejemplo.com" />
    </Box>
  );
};

export default RuletaHome;