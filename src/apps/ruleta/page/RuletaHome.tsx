import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Tabs, Tab, Paper, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { Casino as RuletaIcon, LocalOffer as PremiosIcon } from '@mui/icons-material';
import Ruleta from '../components/Ruleta';
import AdministrarPremios from '../components/AdministrarPremios';
import { ISegment } from '../interfaces/ruleta.interface';

const STORAGE_KEY = 'ruleta_premios';

const getPremiosFromStorage = (): ISegment[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch {}
  }
  return [
    { label: 'Jean de línea', color: '#F97316' },
    { label: 'Jean básico', color: '#3B82F6' },
    { label: 'Bonos $100k', color: '#10B981' },
    { label: 'Bonos $50k', color: '#8B5CF6' },
    { label: 'Bonos $30k', color: '#F59E0B' },
    { label: 'Blusas básicas', color: '#EC4899' },
    { label: 'Tote bag denim', color: '#06B6D4' },
    { label: 'Tops', color: '#EF4444' },
    { label: 'Pañoletas', color: '#84CC16' },
    { label: 'Bambas', color: '#A855F7' },
  ];
};

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 1.5 }}>{children}</Box>}
    </div>
  );
}

const RuletaHome: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [premios, setPremios] = useState<ISegment[]>(() => getPremiosFromStorage());

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setPremios(getPremiosFromStorage());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePremiosChange = (nuevosPremios: ISegment[]) => {
    setPremios(nuevosPremios);
  };

  // ============================================================
  // TÍTULOS DINÁMICOS SEGÚN LA PESTAÑA
  // ============================================================
  const titulo = tabValue === 0 ? 'Ruleta de Premios' : 'Administrar Premios';
  const subtitulo = tabValue === 0 ? 'Punto de venta' : 'Cambio de premios';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'transparent',
        px: { xs: 2, sm: 3 },
        py: { xs: 1.5, sm: 2 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
      }}
    >
      <Box sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
        {/* ===== ENCABEZADO ===== */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #E2E8F0',
            bgcolor: '#ffffff',
            mb: 2,
          }}
        >
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              py: { xs: 1.5, sm: 2 },
              borderBottom: '1px solid #E2E8F0',
              bgcolor: '#F8FAFC',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
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
                {/* ✅ TÍTULO DINÁMICO */}
                <Typography
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.2rem' },
                    fontWeight: 700,
                    color: '#1E293B',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {titulo}
                </Typography>
                {/* ✅ SUBTÍTULO DINÁMICO */}
                <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>
                  {subtitulo}
                </Typography>
              </Box>
            </Box>

            {/* ✅ CHIP: solo visible en la pestaña RULETA */}
            {tabValue === 0 && (
              <Chip
                label={`Total Premios: ${premios.length}`}
                sx={{
                  bgcolor: '#E3F2FD',
                  color: '#004680',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #BBDEFB',
                  height: 32,
                }}
              />
            )}
          </Box>

          {/* Pestañas */}
          <Box
            sx={{
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.5, sm: 0.8 },
            }}
          >
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons={false}
              sx={{
                minHeight: 'auto',
                '& .MuiTabs-flexContainer': { gap: { xs: 0.3, sm: 0.8 } },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.7rem', sm: '0.85rem' },
                  minHeight: { xs: 32, sm: 40 },
                  borderRadius: '8px',
                  px: { xs: 1.5, sm: 2.5 },
                  py: { xs: 0.3, sm: 0.6 },
                  color: '#64748b',
                  '& .MuiTab-iconWrapper': {
                    mr: 0.5,
                    fontSize: { xs: 16, sm: 20 },
                  },
                  '&:hover': {
                    backgroundColor: '#EEF2F6',
                    color: '#004680',
                  },
                  '&.Mui-selected': {
                    color: '#ffffff',
                    backgroundColor: '#004680',
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: '#003366',
                  },
                },
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
              }}
            >
              <Tab value={0} icon={<RuletaIcon />} iconPosition="start" label="RULETA" />
              <Tab value={1} icon={<PremiosIcon />} iconPosition="start" label="PREMIOS" />
            </Tabs>
          </Box>
        </Paper>

        {/* ===== CONTENIDO ===== */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'stretch' }}>
            {/* Validar factura */}
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
                <Button variant="contained" sx={{ background: '#1976D2', boxShadow: 'none', textTransform: 'none' }}>
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

            {/* Ruleta */}
            <Box
              sx={{
                flex: '1 1 auto',
                minWidth: 420,
                maxWidth: 760,
                minHeight: 500,
                background: '#fff',
                border: '0.5px solid #E2E8F0',
                borderRadius: '12px',
                p: 3,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}
            >
              <Ruleta userEmail="usuario@ejemplo.com" segments={premios} />
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <AdministrarPremios onPremiosChange={handlePremiosChange} />
        </TabPanel>
      </Box>
    </Box>
  );
};

export default RuletaHome;