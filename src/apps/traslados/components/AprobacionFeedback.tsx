import React from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

type Props = {
  estado: 'idle' | 'loading' | 'success';
};

const AprobacionFeedback: React.FC<Props> = ({ estado }) => {
  if (estado === 'idle') return null;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        my: 2,
        minHeight: 60,
      }}
    >
      {estado === 'loading' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Aprobando traslados....
          </Typography>
        </Box>
      )}

      {estado === 'success' && (
        <Alert
          icon={<CheckCircleIcon fontSize="inherit" />}
          severity="success"
          sx={{
            fontWeight: 'bold',
            bgcolor: '#e8f5e8',
            color: '#2e7d32',
            border: '1px solid #a5d6a7',
            borderRadius: 2,
            px: 2,
            py: 1,
          }}
        >
          Traslados aprobados correctamente
        </Alert>
      )}
    </Box>
  );
};

export default AprobacionFeedback;