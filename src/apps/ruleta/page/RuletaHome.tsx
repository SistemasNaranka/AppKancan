import React, { useState } from 'react';
import { Box, Typography, TextField, Button, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import Ruleta from '../components/Ruleta';

interface FacturaValida {
  cliente: string;
  total: number;
}

const RuletaHome: React.FC = () => {
  const [numFactura, setNumFactura] = useState('');
  const [cargando, setCargando] = useState(false);
  const [factura, setFactura] = useState<FacturaValida | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validar = async () => {
    if (!numFactura.trim()) return;
    setCargando(true);
    setError(null);
    setFactura(null);
    try {
      const res = await fetch('/api/ruleta/validar-factura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentos: numFactura.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'No se pudo validar la factura');
      }
      const data = await res.json();
      setFactura({ cliente: data.cliente, total: data.total });
    } catch (e: any) {
      setError(e.message || 'Error al validar');
    } finally {
      setCargando(false);
    }
  };

  const formatoPesos = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

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
              <TextField
                size="small"
                fullWidth
                value={numFactura}
                onChange={(e) => setNumFactura(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && validar()}
                placeholder="Ej: KE030000004249"
              />
              <Button
                variant="contained"
                onClick={validar}
                disabled={cargando}
                sx={{ background: '#1976D2', boxShadow: 'none', minWidth: 96 }}
              >
                {cargando ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Validar'}
              </Button>
            </Box>

            {factura && (
              <Box sx={{ background: '#F8FAFC', border: '0.5px solid #E2E8F0', borderRadius: '10px', p: 1.75 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#15803D', fontSize: 12, fontWeight: 600, mb: 1.5 }}>
                  <CheckCircleIcon sx={{ fontSize: 16 }} /> Factura válida
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, mb: 1 }}>
                  <span style={{ color: '#94A3B8' }}>Cliente</span>
                  <span style={{ color: '#1E293B', fontWeight: 500 }}>{factura.cliente}</span>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#94A3B8' }}>Monto facturado</span>
                  <span style={{ color: '#1E293B', fontWeight: 500 }}>{formatoPesos(factura.total)}</span>
                </Box>
              </Box>
            )}

            {error && (
              <Box sx={{ background: '#FEF2F2', border: '0.5px solid #FECACA', borderRadius: '10px', p: 1.75, display: 'flex', alignItems: 'center', gap: 0.75, color: '#B91C1C', fontSize: 13, fontWeight: 500 }}>
                <ErrorOutlineIcon sx={{ fontSize: 16 }} /> {error}
              </Box>
            )}
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
            <Ruleta userEmail="usuario@ejemplo.com" facturaValida={!!factura} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default RuletaHome;