import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Chip, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, InputAdornment, MenuItem, Select, FormControl, InputLabel,
  CircularProgress, Alert, Snackbar, Button,
} from '@mui/material';
import {
  Search as SearchIcon, Visibility as ViewIcon,
  PictureAsPdf as PictureAsPdfIcon, WorkOutline as WorkIcon,
  Clear as ClearIcon, FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import EstadoSelect from '../components/EstadoSelect';
import DetalleModal from '../components/DetalleModal';
import {
  getApplications, abrirCv, formatearFecha, getCargos,
  ESTADOS, ESTADO_COLOR, Postulacion, EstadoContratacion,
} from '../api/directus/read';
import { updateApplicationStatus } from '../api/directus/write';

// ============================================================
// ⚙️ CONSTANTES
// ============================================================
export const AZUL = '#004680';
export const AZUL_BG = '#E6EEF5';

const CIUDADES = [
  'Armenia', 'Bucaramanga', 'Buga', 'Cali', 'Cartago',
  'Ipiales', 'Jamundí', 'Manizales', 'Palmira', 'Pasto',
  'Pereira', 'Popayán', 'Tuluá', 'Yumbo',
];

const CARGOS = [
  'Administrador de tienda', 'Cajero vendedor',
  'Asesor comercial', 'Auxiliar de Bodega',
];

type FiltroEstado = EstadoContratacion | 'Todos';

// ============================================================
// 🆕 SELECT CON BOTÓN X
// ============================================================
interface ClearableSelectProps {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  label: string;
  defaultValue: string;
  options: string[];
  defaultLabel: string;
}

const ClearableSelect: React.FC<ClearableSelectProps> = ({
  value, onChange, onClear, label, defaultValue, options, defaultLabel,
}) => {
  const hasValue = value !== defaultValue;

  return (
    <FormControl size="small" sx={{ minWidth: 220 }}>
      <InputLabel>{label}</InputLabel>
      <Select
      
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
        sx={{ borderRadius: 2, bgcolor: '#fff', height: 44 }}
        renderValue={(s) => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 0.5 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s}</span>
            {hasValue && (
              <ClearIcon
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onClear(); }}
                sx={{ fontSize: 18, color: '#64748B', cursor: 'pointer', '&:hover': { color: AZUL } }}
              />
            )}
          </Box>
        )}
      >
        <MenuItem value={defaultValue}>{defaultLabel}</MenuItem>
        {options.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
      </Select>
    </FormControl>
  );
};

// ============================================================
// 🧩 COMPONENTE PRINCIPAL
// ============================================================
const VacantesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('Todos');
  const [filtroCiudad, setFiltroCiudad] = useState('Todas');
  const [filtroCargo, setFiltroCargo] = useState('Todos');
  const [detalle, setDetalle] = useState<Postulacion | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snack, setSnack] = useState({
    open: false, message: '', severity: 'success' as 'success' | 'error',
  });

  const {
    data: postulaciones = [],
    isLoading, isError, refetch,
  } = useQuery({
    queryKey: ['vacantes-postulaciones'],
    queryFn: getApplications,
    refetchInterval: 60000,
  });

  const contadores = useMemo(() => {
    const b: Record<FiltroEstado, number> = {
      Todos: postulaciones.length,
      'Recibido': 0, 'En revisión': 0, 'Preseleccionado': 0,
      'Entrevista': 0, 'Contratado': 0, 'Rechazado': 0,
    };
    postulaciones.forEach((p) => {
      if (b[p.status as FiltroEstado] !== undefined) b[p.status as FiltroEstado] += 1;
    });
    return b;
  }, [postulaciones]);

  const filtradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return postulaciones.filter((p) => {
      const cargos = getCargos(p);
      const mQ = !q || [
        p.document_number, p.full_name, p.email, p.phone, p.city,
        p.status, String(p.years_experience), ...cargos,
      ].map((v) => String(v).toLowerCase()).some((v) => v.includes(q));
      const mE = filtroEstado === 'Todos' || p.status === filtroEstado;
      const mC = filtroCiudad === 'Todas' || p.city === filtroCiudad;
      const mCa = filtroCargo === 'Todos' || cargos.includes(filtroCargo);
      return mQ && mE && mC && mCa;
    });
  }, [postulaciones, busqueda, filtroEstado, filtroCiudad, filtroCargo]);

  useEffect(() => setPage(0), [busqueda, filtroEstado, filtroCiudad, filtroCargo]);
  const paginadas = filtradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const cambiarEstado = async (id: number, nuevo: EstadoContratacion) => {
    try {
      queryClient.setQueryData<Postulacion[]>(['vacantes-postulaciones'], (old) =>
        (old ?? []).map((p) => (p.id === id ? { ...p, status: nuevo } : p))
      );
      await updateApplicationStatus(id, nuevo);
      setSnack({ open: true, message: 'Estado actualizado', severity: 'success' });
    } catch (e: any) {
      setSnack({ open: true, message: e.message || 'Error', severity: 'error' });
      queryClient.invalidateQueries({ queryKey: ['vacantes-postulaciones'] });
    }
  };

  // ============================================================
  // 📊 EXPORTAR A EXCEL
  // ============================================================
  const exportarExcel = () => {
    const datos = filtradas.map((p) => ({
      'Tipo': p.document_type || '',
      'Documento': p.document_number || '',
      'Nombre': p.full_name || '',
      'Ciudad': p.city || '',
      'Teléfono': p.phone || '',
      'Experiencia (años)': p.years_experience ?? 0,
      'Cargos': getCargos(p).join(', '),
      'Estado': p.status || '',
      'Fecha de postulación': formatearFecha(p.date_created),
      'Correo': p.email || '',
      'Nivel educativo': p.education_level || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(datos);
    worksheet['!cols'] = [
      { wch: 6 }, { wch: 15 }, { wch: 32 }, { wch: 15 }, { wch: 15 },
      { wch: 18 }, { wch: 35 }, { wch: 16 }, { wch: 20 }, { wch: 30 }, { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Postulaciones');

    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `postulaciones-${fecha}.xlsx`);

    setSnack({
      open: true,
      message: `✅ ${filtradas.length} postulaciones exportadas`,
      severity: 'success',
    });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1500, mx: 'auto' }}>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: AZUL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WorkIcon sx={{ color: '#fff' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={700} fontSize="1.4rem" color="#0F172A">Postulaciones</Typography>
            <Typography fontSize="0.85rem" color="#64748B">
              {filtradas.length} de {postulaciones.length} postulaciones
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={exportarExcel}
            disabled={filtradas.length === 0}
            sx={{
              bgcolor: AZUL,
              '&:hover': { bgcolor: '#003366' },
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              px: 3,
              height: 44,
            }}
          >
            Exportar a Excel
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          <TextField
            size="small"
            placeholder="Buscar todo: cédula, nombre, correo, teléfono, ciudad, estado, cargo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: AZUL }} />
                </InputAdornment>
              ),
              endAdornment: busqueda ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setBusqueda('')}>
                    <ClearIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
            sx={{ flex: 1, minWidth: 320, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff', height: 44 } }}
          />
          <ClearableSelect
            value={filtroCiudad} onChange={setFiltroCiudad}
            onClear={() => setFiltroCiudad('Todas')}
            label="Ciudad" defaultValue="Todas"
            options={CIUDADES} defaultLabel="Todas las ciudades"
          />
          <ClearableSelect
            value={filtroCargo} onChange={setFiltroCargo}
            onClear={() => setFiltroCargo('Todos')}
            label="Cargo" defaultValue="Todos"
            options={CARGOS} defaultLabel="Todos los cargos"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', pt: 1, pl: 2 }}>
          {(['Todos', ...ESTADOS] as FiltroEstado[]).map((e) => {
            const activo = filtroEstado === e;
            const meta = e === 'Todos' ? null : ESTADO_COLOR[e];
            return (
              <Chip
                key={e}
                label={`${e} (${contadores[e]})`}
                onClick={() => setFiltroEstado(e)}
                onDelete={activo && e !== 'Todos' ? () => setFiltroEstado('Todos') : undefined}
                sx={{
                  bgcolor: activo ? AZUL : AZUL_BG,
                  color: activo ? '#fff' : AZUL,
                  fontWeight: 700, height: 42, borderRadius: 2.5,
                  borderLeft: !activo && meta ? `5px solid ${meta.color}` : 'none',
                  '& .MuiChip-label': { px: 2 },
                  '& .MuiChip-deleteIcon': { color: '#fff' },
                }}
              />
            );
          })}
        </Box>
      </Paper>

      {isLoading ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
          <CircularProgress sx={{ color: AZUL }} />
          <Typography color="#64748B" mt={2}>Cargando desde Directus...</Typography>
        </Paper>
      ) : isError ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid #FECACA', bgcolor: '#FEF2F2' }}>
          <Alert severity="error" sx={{ mb: 2 }}>No se pudieron cargar las postulaciones</Alert>
          <Typography color="#B91C1C" fontSize="0.85rem" mb={2}>
            Verifica que Directus esté corriendo en 192.168.19.245:8055
          </Typography>
          <Chip label="Reintentar" onClick={() => refetch()}
            sx={{ bgcolor: AZUL, color: '#fff', fontWeight: 700, cursor: 'pointer' }} />
        </Paper>
      ) : filtradas.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '2px dashed #E2E8F0' }}>
          <Typography color="#94A3B8">
            {postulaciones.length === 0 ? 'Aún no hay postulaciones en Directus' : 'No hay postulaciones con esos filtros'}
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  {['Tipo', 'Documento', 'Nombre', 'Teléfono', 'Ciudad', 'Exp.', 'Cargos', 'Estado', 'Fecha de postulación'].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontWeight: 700,
                        py: 2,
                        pl: 2,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 700, py: 2 }}>Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginadas.map((p) => {
                  const cargos = getCargos(p);
                  return (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ fontSize: '0.75rem', color: '#64748B', pl: 2, py: 1.75, fontWeight: 600 }}>
                        {p.document_type}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#64748B', py: 1.75 }}>
                        {p.document_number}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 1.75 }}>{p.full_name}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#0F172A', py: 1.75, whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {p.phone || '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', py: 1.75 }}>{p.city}</TableCell>
                      <TableCell sx={{ py: 1.75, whiteSpace: 'nowrap' }}>{p.years_experience} años</TableCell>
                      <TableCell sx={{ py: 1.75 }}>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {cargos.map((c) => (
                            <Chip key={c} label={c} size="small"
                              sx={{ bgcolor: AZUL_BG, color: AZUL, fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.75 }}>
                        <EstadoSelect value={p.status as EstadoContratacion} onChange={(n) => cambiarEstado(p.id, n)} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#64748B', py: 1.75, whiteSpace: 'nowrap' }}>
                        {formatearFecha(p.date_created)}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.75 }}>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="Ver detalle" arrow>
                            <IconButton size="small" onClick={() => setDetalle(p)}
                              sx={{ width: 36, height: 36, color: AZUL, bgcolor: AZUL_BG, '&:hover': { bgcolor: '#CCDDEA' } }}>
                              <ViewIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Ver hoja de vida (PDF)" arrow>
                            <IconButton size="small"
                              onClick={() => abrirCv(p.cv).catch((err) => {
                                console.error('[vacantes] No se pudo abrir la hoja de vida:', err);
                                alert('No se pudo abrir la hoja de vida. Intenta de nuevo.');
                              })}
                              disabled={!p.cv}
                              sx={{ width: 36, height: 36, color: '#B91C1C', bgcolor: '#FEE2E2', '&:hover': { bgcolor: '#FECACA' } }}>
                              <PictureAsPdfIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filtradas.length}
            page={page}
            onPageChange={(_, n) => setPage(n)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            sx={{ borderTop: '1px solid #E2E8F0' }}
          />
        </Paper>
      )}

      <DetalleModal postulacion={detalle} onClose={() => setDetalle(null)} />

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VacantesPage;