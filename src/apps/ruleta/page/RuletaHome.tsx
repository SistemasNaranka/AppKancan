import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import Ruleta from '../components/Ruleta';

const RuletaHome: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#F1F5F9',
        px: 3,
        py: 5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
        <Box
          sx={{
            background: '#fff',
            border: '0.5px solid #E2E8F0',
            borderRadius: '12px',
            p: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '9px',
                background: '#E3F2FD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CardGiftcardIcon sx={{ fontSize: 19, color: '#1976D2' }} />
            </Box>
            <Box sx={{ lineHeight: 1.25 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1E293B', fontFamily: "'Poppins', sans-serif" }}>
                Ruleta de Premios
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>Punto de venta</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, flexWrap: 'wrap', alignItems: 'stretch' }}>
          <Box
            sx={{
              flex: '0 0 440px',
              minWidth: 380,
              background: '#fff',
              border: '0.5px solid #E2E8F0',
              borderRadius: '12px',
              p: 2.5,
            }}
          >
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#1E293B', fontFamily: "'Poppins', sans-serif" }}>
              Validar factura
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#94A3B8', mb: 2 }}>
              El cliente debe haber facturado para participar.
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#94A3B8', mb: 0.5 }}>N° de factura</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField size="small" defaultValue="00184213" fullWidth />
              <Button variant="contained" sx={{ background: '#1976D2', boxShadow: 'none' }}>
                Validar
              </Button>
            </Box>
            <Box sx={{ background: '#F8FAFC', border: '0.5px solid #E2E8F0', borderRadius: '10px', p: 1.75 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#15803D', fontSize: 12, fontWeight: 600, mb: 1.5 }}>
                <CheckCircleIcon sx={{ fontSize: 16 }} /> Factura válida
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, mb: 1 }}>
                <span style={{ color: '#94A3B8' }}>Cliente</span>
                <span style={{ color: '#1E293B', fontWeight: 500 }}>María G.</span>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#94A3B8' }}>Monto facturado</span>
                <span style={{ color: '#1E293B', fontWeight: 500 }}>$180.000</span>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              flex: '1 1 auto',
              minWidth: 420,
              maxWidth: 760,
              background: '#fff',
              border: '0.5px solid #E2E8F0',
              borderRadius: '12px',
              p: 3,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}
          >
            <Ruleta userEmail="usuario@ejemplo.com" />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default RuletaHome;