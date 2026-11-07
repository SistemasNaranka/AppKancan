import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Chip, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, InputAdornment, MenuItem, Select, FormControl, InputLabel,
  CircularProgress, Alert, Button,
} from '@mui/material';
import {
  Search as SearchIcon, Visibility as ViewIcon,
  PictureAsPdf as PictureAsPdfIcon, WorkOutline as WorkIcon,
  Clear as ClearIcon, FileDownload as FileDownloadIcon,
  AutoAwesome as SparkIcon, AccessTimeRounded as RecientesIcon,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import EstadoSelect from '../components/EstadoSelect';
import DetalleModal from '../components/DetalleModal';
import AccionIA from '../components/AccionIA';
import AsistenteIA from '../api/ia/AsistenteIA';
import {
  getApplications, abrirCv, formatearFecha, getCargos,
  ESTADOS, ESTADO_COLOR, Postulacion, EstadoContratacion,
} from '../api/directus/read';
import { updateApplicationStatus } from '../api/directus/write';

export const AZUL = '#004680';
export const AZUL_BG = '#E6EEF5';

export const CIUDADES = [
  'Armenia', 'Bucaramanga', 'Buga', 'Cali', 'Candelaria', 'Cartago',
  'Ipiales', 'Jamundí', 'Manizales', 'Palmira', 'Pasto',
  'Pereira', 'Popayán', 'Tuluá', 'Yumbo',
];

export const CARGOS = [
  'Administrador de tienda', 'Cajero vendedor',
  'Asesor comercial', 'Auxiliar de Bodega',
];

type FiltroEstado = EstadoContratacion | 'Todos';

interface ClearableSelectProps {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  label: string;
  defaultValue: string;
  options: { label: string; value: string }[];
  defaultLabel: string;
}

const ClearableSelect: React.FC<ClearableSelectProps> = ({
  value, onChange, onClear, label, defaultValue, options, defaultLabel,
}) => {
  const hasValue = value !== defaultValue;

  return (
    <FormControl size="small" sx={{ minWidth: 180 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
        sx={{ borderRadius: 2, bgcolor: '#fff', height: 44 }}
        renderValue={(s) => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 0.5 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {options.find(o => o.value === s)?.label || s}
            </span>
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
        {options.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
      </Select>
    </FormControl>
  );
};

const VacantesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('Todos');
  const [filtroCiudad, setFiltroCiudad] = useState('Todas');
  const [filtroCargo, setFiltroCargo] = useState('Todos');
  const [ordenarPor, setOrdenarPor] = useState('mayor_puntaje');

  const [detalle, setDetalle] = useState<Postulacion | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [, setSnack] = useState({
    open: false, message: '', severity: 'success' as 'success' | 'error',
  });

  const [candidatoParaIA, setCandidatoParaIA] = useState<Postulacion | null>(null);

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

    let resultado = postulaciones.filter((p) => {
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

    if (ordenarPor === 'mayor_puntaje') {
      resultado.sort((a, b) => (b.ai_score ?? -1) - (a.ai_score ?? -1));
    } else if (ordenarPor === 'menor_puntaje') {
      resultado.sort((a, b) => (a.ai_score ?? 999) - (b.ai_score ?? 999));
    } else if (ordenarPor === 'recientes') {
      resultado.sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());
    }

    return resultado;
  }, [postulaciones, busqueda, filtroEstado, filtroCiudad, filtroCargo, ordenarPor]);

  useEffect(() => setPage(0), [busqueda, filtroEstado, filtroCiudad, filtroCargo, ordenarPor]);

  const paginadas = useMemo(() => {
    return filtradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filtradas, page, rowsPerPage]);

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

  const analizarCandidato = (p: Postulacion) => {
    setCandidatoParaIA(p);
  };

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
      'Puntaje IA': p.ai_score ?? '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Postulaciones');

    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `postulaciones-${fecha}.xlsx`);
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
            sx={{ bgcolor: AZUL, '&:hover': { bgcolor: '#003366' }, textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3, height: 44 }}
          >
            Exportar a Excel
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          <TextField
            size="small"
            placeholder="Buscar por cédula, nombre, correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            InputProps={{
              startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: AZUL }} /></InputAdornment>),
              endAdornment: busqueda ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setBusqueda('')}><ClearIcon sx={{ fontSize: 18 }} /></IconButton>
                </InputAdornment>
              ) : undefined,
            }}
            sx={{ flex: 1, minWidth: 250, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff', height: 44 } }}
          />

          <ClearableSelect
            value={filtroCiudad} onChange={setFiltroCiudad} onClear={() => setFiltroCiudad('Todas')}
            label="Ciudad" defaultValue="Todas"
            options={CIUDADES.map(c => ({ label: c, value: c }))}
            defaultLabel="Todas las ciudades"
          />

          <ClearableSelect
            value={filtroCargo} onChange={setFiltroCargo} onClear={() => setFiltroCargo('Todos')}
            label="Cargo" defaultValue="Todos"
            options={CARGOS.map(c => ({ label: c, value: c }))}
            defaultLabel="Todos los cargos"
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Ordenar por</InputLabel>
            <Select
              value={ordenarPor}
              label="Ordenar por"
              onChange={(e) => setOrdenarPor(e.target.value)}
              // Campo cerrado: solo texto, sin hueco ni reloj
              renderValue={(v) => ({
                mayor_puntaje: 'Mayor puntaje',
                menor_puntaje: 'Menor puntaje',
                recientes: 'Más recientes',
              } as Record<string, string>)[v]}
              sx={{ borderRadius: 2, bgcolor: '#fff', height: 44 }}
            >
              <MenuItem value="mayor_puntaje">
                <Box component="span" sx={{ display: 'inline-block', width: 20, mr: 1.25, flexShrink: 0 }} />
                Mayor puntaje
              </MenuItem>
              <MenuItem value="menor_puntaje">
                <Box component="span" sx={{ display: 'inline-block', width: 20, mr: 1.25, flexShrink: 0 }} />
                Menor puntaje
              </MenuItem>
              <MenuItem value="recientes">
                <RecientesIcon sx={{ fontSize: 20, mr: 1.25, color: '#64748B' }} />
                Más recientes
              </MenuItem>
            </Select>
          </FormControl>
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
          <Chip label="Reintentar" onClick={() => refetch()} sx={{ bgcolor: AZUL, color: '#fff', fontWeight: 700, cursor: 'pointer' }} />
        </Paper>
      ) : filtradas.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '2px dashed #E2E8F0' }}>
          <Typography color="#94A3B8">No hay postulaciones con esos filtros</Typography>
        </Paper>
      ) : (
        <Paper sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  {['Tipo', 'Documento', 'Nombre', 'Teléfono', 'Ciudad', 'Exp.', 'Cargos', 'Estado', 'Fecha'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, py: 1.5, px: 1 }}>{h}</TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Análisis IA</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginadas.map((p) => {
                  const cargos = getCargos(p);
                  return (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ fontSize: '0.75rem', px: 1, py: 1.25, fontWeight: 600 }}>{p.document_type}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', px: 1, py: 1.25 }}>{p.document_number}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', px: 1, py: 1.25 }}>{p.full_name}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', px: 1, py: 1.25 }}>{p.phone || '—'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', px: 1, py: 1.25 }}>{p.city}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', px: 1, py: 1.25 }}>{p.years_experience} años</TableCell>
                      <TableCell sx={{ py: 1.25, px: 1 }}>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {cargos.map((c) => <Chip key={c} label={c} size="small" sx={{ bgcolor: AZUL_BG, color: AZUL, fontSize: '0.6rem', height: 20 }} />)}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ px: 1, py: 1.25 }}>
                        <EstadoSelect value={p.status as EstadoContratacion} onChange={(n) => cambiarEstado(p.id, n)} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', px: 1, py: 1.25 }}>{formatearFecha(p.date_created)}</TableCell>

                      <TableCell align="center" sx={{ px: 1, py: 1.25 }}>
                        <AccionIA postulacion={p} />
                      </TableCell>

                      <TableCell align="center" sx={{ px: 1, py: 1.25 }}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Analizar con IA" arrow>
                            <IconButton size="small" onClick={() => analizarCandidato(p)} sx={{ width: 30, height: 30, color: AZUL, bgcolor: AZUL_BG }}>
                              <SparkIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Ver detalle" arrow>
                            <IconButton size="small" onClick={() => setDetalle(p)} sx={{ width: 30, height: 30, color: AZUL, bgcolor: AZUL_BG }}>
                              <ViewIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Ver PDF" arrow>
                            <IconButton size="small" onClick={() => abrirCv(p.cv)} disabled={!p.cv} sx={{ width: 30, height: 30, color: '#B91C1C', bgcolor: '#FEE2E2' }}>
                              <PictureAsPdfIcon sx={{ fontSize: 16 }} />
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
            component="div" count={filtradas.length} page={page} onPageChange={(_, n) => setPage(n)}
            rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25, 50]} labelRowsPerPage="Filas:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            sx={{ borderTop: '1px solid #E2E8F0' }}
          />
        </Paper>
      )}

      <DetalleModal postulacion={detalle} onClose={() => setDetalle(null)} />

      <AsistenteIA
        postulaciones={postulaciones}
        visibles={paginadas}
        cargoInicial={filtroCargo === 'Todos' ? '' : filtroCargo}
        onCambiarEstado={cambiarEstado}
        candidatoParaIA={candidatoParaIA}
        onLimpiarCandidatoParaIA={() => setCandidatoParaIA(null)}
      />
    </Box>
  );
};

export default VacantesPage;