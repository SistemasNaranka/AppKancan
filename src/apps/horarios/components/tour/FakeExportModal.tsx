import React from 'react';
import {
  Box, Typography, Chip, Checkbox, FormControlLabel, TextField,
  FormControl, InputLabel, Select, MenuItem, Button, IconButton, Tabs, Tab
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DateRangeIcon from '@mui/icons-material/DateRange';
import HistoryIcon from '@mui/icons-material/History';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';

export default function FakeExportModal() {
  return (
    <Box sx={{
      position: 'absolute', top: -140, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 750, bgcolor: '#fff', borderRadius: 3,
      overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.2)', zIndex: 1300,
    }}>
      <Box sx={{ bgcolor: '#004680', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FileDownloadIcon sx={{ fontSize: 26 }} />
          <Typography variant="h6" fontWeight={700}>Exportar Reportes a Excel</Typography>
        </Box>
        <IconButton sx={{ color: '#fff' }}><CloseIcon /></IconButton>
      </Box>

      <Tabs
        value={0} onChange={() => {}} variant="scrollable" scrollButtons={false}
        sx={{
          borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc', px: 1,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.85rem', minHeight: 48 },
          '& .Mui-selected': { color: '#004680' },
          '& .MuiTabs-indicator': { bgcolor: '#004680', height: 3 }
        }}
      >
        <Tab data-tour="fake-export-tab-historial" label="Historial de Registros" icon={<HistoryIcon fontSize="small" />} iconPosition="start" />
        <Tab data-tour="fake-export-tab-novedades" label="Novedades" icon={<AssignmentIcon fontSize="small" />} iconPosition="start" />
        <Tab data-tour="fake-export-tab-pausas" label="Pausas Activas" icon={<PauseCircleIcon fontSize="small" />} iconPosition="start" />
        <Tab data-tour="fake-export-tab-semanal" label="Horas Semanales" icon={<DateRangeIcon fontSize="small" />} iconPosition="start" />
      </Tabs>

      <Box sx={{ pt: 1.5, px: 3, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <Box data-tour="fake-export-tiendas">
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 1, display: 'block' }}>TIENDAS A EXPORTAR:</Typography>
          <TextField
            fullWidth placeholder="Buscar y seleccionar tiendas..."
            InputProps={{
              readOnly: true,
              startAdornment: (<><StorefrontIcon sx={{ color: '#004680', mr: 1, ml: 0.5 }} /><Chip label="Oficina" size="small" onDelete={() => {}} sx={{ mr: 1 }} /></>),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f1f7fe' } }}
          />
          <FormControlLabel
            control={<Checkbox sx={{ color: '#004680', '&.Mui-checked': { color: '#004680' } }} />}
            label={<Typography variant="caption" sx={{ fontWeight: 600, color: '#334155' }}>Todas las tiendas</Typography>}
            sx={{ mt: 0.5 }}
          />
        </Box>

        <Box data-tour="fake-export-periodo">
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 1, display: 'block' }}>PERÍODO A EXPORTAR:</Typography>
          <TextField
            fullWidth defaultValue="24/07/2026 – 30/07/2026"
            InputProps={{ readOnly: true, startAdornment: <DateRangeIcon sx={{ color: '#004680', mr: 1 }} /> }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f1f7fe' } }}
          />
        </Box>

        <Box data-tour="fake-export-estructura">
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 1, display: 'block' }}>ESTRUCTURA DE SEMANA:</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Inicio Semana</InputLabel>
              <Select defaultValue={1} label="Inicio Semana" readOnly sx={{ borderRadius: 2 }}>
                <MenuItem value={1}>Lunes</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Fin Semana</InputLabel>
              <Select defaultValue={0} label="Fin Semana" readOnly sx={{ borderRadius: 2 }}>
                <MenuItem value={0}>Domingo</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Chip
            icon={<InfoOutlinedIcon sx={{ fontSize: '1rem !important', color: '#0284c7 !important' }} />}
            label="Estructura: Lunes a Domingo (7 días por columna)" size="small"
            sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600, borderRadius: 2, height: 32, mt: 1.5, fontSize: '0.78rem', border: '1px solid #bae6fd' }}
          />
        </Box>
      </Box>

      <Box sx={{ px: 3, pb: 2.5, pt: 2, mt: 1, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eef2f6' }}>
        <Box data-tour="fake-export-cancelar" sx={{ display: 'inline-flex' }}>
          <Button variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Cancelar</Button>
        </Box>
        <Box data-tour="fake-export-exportar" sx={{ display: 'inline-flex' }}>
          <Button variant="contained" startIcon={<FileDownloadIcon />} sx={{ bgcolor: '#004680', color: '#fff', borderRadius: 2, textTransform: 'none', fontWeight: 'bold', px: 3, '&:hover': { bgcolor: '#003366' } }}>Exportar Excel</Button>
        </Box>
      </Box>
    </Box>
  );
}