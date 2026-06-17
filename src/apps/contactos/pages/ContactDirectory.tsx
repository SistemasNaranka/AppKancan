import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box, Typography, Button, TextField,
  Paper, Stack, Pagination, CircularProgress, Alert,
  IconButton, Collapse, Tooltip, Chip,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupsIcon from '@mui/icons-material/Groups';
import SearchIcon from '@mui/icons-material/Search';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import SettingsIcon from '@mui/icons-material/Settings';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useNavigate } from 'react-router-dom';
import { ContactTable } from '../components/ContactTable';
import { useContactos } from '../hooks/useContactos';
import { AddContactModal } from '../components/AddContactModal';
import { EditarContactoModal } from '../components/EditarContactoModal';
import { ContactoConfigModal } from '../components/ContactoConfigModal';
import { createContacto } from '../api/directus/create';
import { Contactos, CreateContactoInput } from '../types/contact';
import { exportarContactosExcel } from '../utils/exportarContactos';

const POR_PAGINA = 10;

export type SortCol = 'name' | 'area' | 'email' | 'phone' | 'visibility' | '';
export type SortDir = 'asc' | 'desc';

const ContactDirectory: React.FC = () => {
  const {
    contactos, busqueda, setBusqueda,
    total, cargando, error, recargar, actualizar,
  } = useContactos();

  const navigate = useNavigate();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [configAbierto, setConfigAbierto] = useState(false);
  const [contactoEditando, setContactoEditando] = useState<Contactos | null>(null);
  const [pagina, setPagina] = useState(1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortCol, setSortCol] = useState<SortCol>('');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const searchRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    if (searchOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen]);

  const handleGuardarNuevo = async (data: CreateContactoInput) => {
    const ok = await createContacto(data);
    if (ok) { if (recargar) await recargar(); return true; }
    return false;
  };

  const handleGuardarEdicion = async (data: CreateContactoInput): Promise<boolean> => {
    if (!contactoEditando) return false;
    return actualizar(contactoEditando.id, data);
  };

  const handleColumnSort = (col: SortCol) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('asc'); }
    setPagina(1);
  };

  const sorted = useMemo(() => {
    if (!sortCol) return contactos;
    return [...contactos].sort((a, b) => {
      let va = '', vb = '';
      if (sortCol === 'name')       { va = a.full_name;           vb = b.full_name; }
      if (sortCol === 'area')       { va = a.department_name || ''; vb = b.department_name || ''; }
      if (sortCol === 'email')      { va = a.email;               vb = b.email; }
      if (sortCol === 'phone')      { va = a.phone_number;        vb = b.phone_number; }
      if (sortCol === 'visibility') { va = a.visibility_type;     vb = b.visibility_type; }
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [contactos, sortCol, sortDir]);

  const inicio = (pagina - 1) * POR_PAGINA;
  const paginados = sorted.slice(inicio, inicio + POR_PAGINA);
  const totalPaginas = Math.max(1, Math.ceil(sorted.length / POR_PAGINA));

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchRef.current?.focus(), 80);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 3, px: { xs: 2, md: 4 }, pb: { xs: 2, md: 4 } }}>


      {/* ── Header sticky ─────────────────────────────────────────── */}
      <Paper
        elevation={2}
        sx={{
          p: 3, borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: 'none', bgcolor: 'white',
          position: 'sticky', top: 0, zIndex: 100,
          mt: { xs: 2, md: 4 },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
          {/* Título */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ bgcolor: '#004a99', p: 1, borderRadius: '12px', display: 'flex', color: 'white' }}>
              <GroupsIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" fontWeight={800} color="#0f172a">Directorio de Contactos</Typography>
                  <IconButton
                    size="small"
                    onClick={() => setConfigAbierto(true)}
                    sx={{ color: '#94a3b8', '&:hover': { color: '#004a99', bgcolor: '#eff6ff' }, borderRadius: '8px' }}
                  >
                    <SettingsIcon fontSize="small" />
                  </IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {total} contacto{total !== 1 ? 's' : ''} registrados
              </Typography>
            </Box>
          </Stack>

          {/* Acciones */}
          <Stack direction="row" alignItems="center" spacing={1.5}>

            {/* Chip reset orden — visible solo cuando hay sort activo */}
            {sortCol && (
              <Chip
                icon={<FilterListOffIcon sx={{ fontSize: '16px !important' }} />}
                label="Restablecer orden"
                size="small"
                onClick={() => { setSortCol(''); setSortDir('asc'); setPagina(1); }}
                onDelete={() => { setSortCol(''); setSortDir('asc'); setPagina(1); }}
                sx={{
                  bgcolor: '#eff6ff', color: '#004a99', borderColor: '#bfdbfe',
                  fontWeight: 600, fontSize: '0.75rem',
                  border: '1px solid', cursor: 'pointer',
                  '& .MuiChip-deleteIcon': { color: '#004a99' },
                  '&:hover': { bgcolor: '#dbeafe' },
                }}
              />
            )}

            {/* Búsqueda: icono + expansión hacia la izquierda */}
            <Box
              ref={searchBoxRef}
              onMouseEnter={openSearch}
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <Collapse in={searchOpen} orientation="horizontal" unmountOnExit>
                <TextField
                  inputRef={searchRef}
                  placeholder="Buscar nombre, área o correo..."
                  size="small"
                  value={busqueda}
                  onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                  sx={{
                    width: 260,
                    '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#f8fafc' },
                  }}
                />
              </Collapse>
              <IconButton
                onClick={openSearch}
                sx={{
                  ml: searchOpen ? 1 : 0,
                  color: searchOpen ? '#004a99' : '#004a99',
                  bgcolor: searchOpen ? '#eff6ff' : 'transparent',
                  borderRadius: '10px',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: '#eff6ff', color: '#004a99' },
                }}
              >
                <SearchIcon />
              </IconButton>
            </Box>

            {/* Exportar */}
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={() => exportarContactosExcel(contactos)}
              sx={{
                textTransform: 'none', borderRadius: '12px',
                borderColor: '#157347', color: '#157347', bgcolor: 'white',
                fontWeight: 600, height: '40px', px: 2.5,
                '&:hover': { bgcolor: '#157347', color: 'white', borderColor: '#157347' },
              }}
            >
              Exportar
            </Button>

            {/* Agregar contacto */}
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setModalAbierto(true)}
              sx={{
                bgcolor: '#004a99', borderRadius: '12px',
                textTransform: 'none', fontWeight: 700,
                px: 3, height: '40px',
                '&:hover': { bgcolor: '#003580' },
              }}
            >
              Agregar Contacto
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* ── Estados ───────────────────────────────────────────────── */}
      {cargando && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#004a99' }} />
        </Box>
      )}
      {error && !cargando && <Alert severity="error">{error}</Alert>}

      {/* ── Tabla ─────────────────────────────────────────────────── */}
      {!cargando && !error && (
        <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', bgcolor: 'white' }}>
          <ContactTable
            contactos={paginados}
            onVer={(c) => navigate(`/contactos/${c.id}`)}
            onEditar={(c) => setContactoEditando(c)}
            sortCol={sortCol}
            sortDir={sortDir}
            onSort={handleColumnSort}
          />
          <Box sx={{
            px: 3, py: 2, borderTop: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            bgcolor: 'rgba(248,250,252,0.5)', flexWrap: 'wrap', gap: 1,
          }}>
            <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
              Mostrando <strong>{paginados.length}</strong> de <strong>{sorted.length}</strong> resultados
            </Typography>
            <Pagination
              count={totalPaginas}
              page={pagina}
              onChange={(_, val) => setPagina(val)}
              shape="rounded"
              sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: '#004a99', color: 'white' } }}
            />
          </Box>
        </Paper>
      )}

      <AddContactModal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onGuardar={handleGuardarNuevo}
      />

      <EditarContactoModal
        open={Boolean(contactoEditando)}
        onClose={() => setContactoEditando(null)}
        onGuardar={handleGuardarEdicion}
        contacto={contactoEditando}
      />

      <ContactoConfigModal
        open={configAbierto}
        onClose={() => setConfigAbierto(false)}
      />
    </Box>
  );
};

export default ContactDirectory;
