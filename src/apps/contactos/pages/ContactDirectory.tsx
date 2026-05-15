// src/apps/contactos/pages/ContactDirectory.tsx
import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, InputAdornment,
  Paper, Stack, Menu, MenuItem, Pagination, CircularProgress, Alert,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SortIcon from '@mui/icons-material/Sort';
import GroupsIcon from '@mui/icons-material/Groups';
import SearchIcon from '@mui/icons-material/Search';
import { ContactTable } from '../components/ContactTable';
import { useContactos } from '../hooks/useContactos';

const POR_PAGINA = 10;

const ContactDirectory: React.FC = () => {
  const {
    contactos, busqueda, setBusqueda,
    total, handleSort, cargando, error, eliminar,
  } = useContactos();

  const [pagina, setPagina] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuAbierto = Boolean(anchorEl);

  const inicio = (pagina - 1) * POR_PAGINA;
  const paginados = contactos.slice(inicio, inicio + POR_PAGINA);
  const totalPaginas = Math.max(1, Math.ceil(contactos.length / POR_PAGINA));

  const abrirMenu = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget);
  const cerrarMenu = (criterio?: 'asc' | 'desc' | 'area') => {
    setAnchorEl(null);
    if (criterio) { handleSort(criterio); setPagina(1); }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Encabezado */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: 'white' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ bgcolor: '#004a99', p: 1, borderRadius: '12px', display: 'flex', color: 'white' }}>
            <GroupsIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} color="#0f172a">Directorio de Contactos</Typography>
            <Typography variant="body2" color="text.secondary">
              {total} contacto{total !== 1 ? 's' : ''} registrados
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Barra herramientas */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <TextField
            placeholder="Buscar por nombre, área o email..."
            size="small"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#64748b' }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: '100%', sm: 320 }, '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '12px' } }}
          />
          <Button variant="outlined" onClick={abrirMenu} startIcon={<SortIcon />}
            sx={{ textTransform: 'none', borderRadius: '12px', borderColor: '#e2e8f0', color: '#475569', bgcolor: 'white', fontWeight: 600, px: 2.5, '&:hover': { borderColor: '#004a99', color: '#004a99' } }}>
            Ordenar
          </Button>
          <Menu anchorEl={anchorEl} open={menuAbierto} onClose={() => cerrarMenu()}>
            <MenuItem onClick={() => cerrarMenu('asc')}>Nombre A → Z</MenuItem>
            <MenuItem onClick={() => cerrarMenu('desc')}>Nombre Z → A</MenuItem>
            <MenuItem onClick={() => cerrarMenu('area')}>Por Área</MenuItem>
          </Menu>
        </Stack>
        <Button variant="contained" startIcon={<PersonAddIcon />}
          sx={{ bgcolor: '#004a99', borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 4, py: 1.2, '&:hover': { bgcolor: '#003580' } }}>
          Agregar Contacto
        </Button>
      </Box>

      {/* Estados */}
      {cargando && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#004a99' }} /></Box>}
      {error && !cargando && <Alert severity="error">{error}</Alert>}

      {/* Tabla */}
      {!cargando && !error && (
        <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', bgcolor: 'white' }}>
          <ContactTable contactos={paginados} onEliminar={eliminar} />
          <Box sx={{ px: 3, py: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'rgba(248,250,252,0.5)', flexWrap: 'wrap', gap: 1 }}>
            <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
              Mostrando <strong>{paginados.length}</strong> de <strong>{contactos.length}</strong> resultados
            </Typography>
            <Pagination count={totalPaginas} page={pagina} onChange={(_, val) => setPagina(val)} shape="rounded"
              sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: '#004a99', color: 'white' } }} />
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default ContactDirectory;