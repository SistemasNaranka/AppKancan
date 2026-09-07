import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import {
  Casino as RuletaIcon,
  History as HistorialIcon,
  LocalOffer as PremiosIcon,
  Settings as ConfigIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';

import HistorialGiros from './HistorialGiros';




// ============================================================
// COMPONENTE PARA CADA PESTAÑA
// ============================================================
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

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const RuletaPanel: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [totalGiros, setTotalGiros] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        bgcolor: '#f5f7fa',
        px: { xs: 1.5, sm: 3, md: 4 },
        pt: { xs: 1, sm: 1.5 },
        pb: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* ==========================================================
          ENCABEZADO COMPACTO (Título + Subtítulo + Pestañas)
          ========================================================== */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid #e9edf4',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          mb: 2,
          bgcolor: '#ffffff',
          width: '100%',
          maxWidth: '950px',
        }}
      >
        {/* Título y subtítulo */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            borderBottom: '1px solid #eef2f6',
          }}
        >
          <Typography
            variant="h5"
            fontWeight={700}
            color="#004680"
            sx={{ fontSize: { xs: '1.1rem', sm: '1.4rem' } }}
          >
            🎡 Ruleta de Premios
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.2, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}
          >
            Gira y gana premios exclusivos de KANCAN
          </Typography>
        </Box>

        {/* Pestañas + Contador de giros */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            px: { xs: 1.5, sm: 2 },
            py: { xs: 0.5, sm: 0.8 },
            gap: { xs: 0.5, sm: 0 },
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
                fontSize: { xs: '0.65rem', sm: '0.8rem' },
                minHeight: { xs: 28, sm: 36 },
                borderRadius: '8px',
                px: { xs: 1.5, sm: 2.5 },
                py: { xs: 0.3, sm: 0.6 },
                color: '#64748b',
                '& .MuiTab-iconWrapper': {
                  mr: 0.3,
                  fontSize: { xs: 14, sm: 18 },
                },
                '&:hover': {
                  backgroundColor: '#eef4fb',
                  color: '#004680',
                },
                '&.Mui-selected': {
                  color: '#fff',
                  backgroundColor: '#004680',
                },
                '&.Mui-selected:hover': {
                  backgroundColor: '#003a6b',
                },
              },
              '& .MuiTabs-indicator': {
                display: 'none',
              },
            }}
          >
            <Tab value={0} icon={<RuletaIcon />} iconPosition="start" label="RULETA" />
            <Tab value={1} icon={<DashboardIcon />} iconPosition="start" label="MONITOREO" />
            <Tab value={2} icon={<HistorialIcon />} iconPosition="start" label="HISTORIAL" />
            <Tab value={3} icon={<PremiosIcon />} iconPosition="start" label="PREMIOS" />
            <Tab value={4} icon={<ConfigIcon />} iconPosition="start" label="CONFIGURACIÓN" />
          </Tabs>

          {/* Contador de giros (compacto) */}
          <Chip
            label={`Total Giros: ${totalGiros}`}
            sx={{
              bgcolor: '#eaf2fb',
              color: '#004680',
              fontWeight: 700,
              fontSize: '0.7rem',
              borderRadius: '6px',
              border: '1px solid #d6e6f7',
              height: 28,
              flexShrink: 0,
              ml: { xs: 0, sm: 1 },
            }}
          />
        </Box>
      </Paper>

      {/* ==========================================================
          CONTENIDO DE LAS PESTAÑAS
          ========================================================== */}
      <Box sx={{ width: '100%', maxWidth: '950px' }}>
        <TabPanel value={tabValue} index={0}>
          
        
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <HistorialGiros />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
   
        </TabPanel>
      </Box>
    </Box>
  );
};

export default RuletaPanel;