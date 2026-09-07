import React from 'react';
import { Box } from '@mui/material';
import RuletaPanel from '../components/RuletaPanel';

const RuletaHome: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        background: '#f5f7fa',
        pt: 2,
      }}
    >
      <RuletaPanel />
    </Box>
  );
};

export default RuletaHome;