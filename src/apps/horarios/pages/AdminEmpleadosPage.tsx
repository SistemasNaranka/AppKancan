import { useState } from 'react';
import {
  Box, Paper, Typography, TextField, InputAdornment, IconButton, Button,
  Chip, Avatar, CircularProgress, Alert, Autocomplete,
} from '@mui/material';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import ClearIcon from '@mui/icons-material/Clear';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import StorefrontIcon from '@mui/icons-material/Storefront';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import useAdminEmpleados from '../hooks/useAdminEmpleados';
import DialogNuevoEmpleado from '../components/admin/DialogNuevoEmpleado';
import DialogEditarEmpleado from '../components/admin/DialogEditarEmpleado';
import { EmpleadoAdmin } from '../interfaces/horarios.interface';

const AZUL = '#004680';

const AVATAR_COLORS = ['#0284c7', '#7c3aed', '#16a34a', '#ea580c', '#db2777', '#0891b2', '#4f46e5', '#ca8a04', '#dc2626', '#059669', '#2563eb', '#9333ea'];
const colorAvatar = (texto: string) => {
  let hash = 0;
  for (let i = 0; i < texto.length; i++) hash = texto.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const nombreDe = (e: EmpleadoAdmin) =>
  [e.first_name, e.middle_name, e.last_name, e.second_last_name].filter((p) => p && p.trim()).join(' ') || 'Empleado';

interface Props {
  storeSel: number | null;
  onStoreChange: (id: number | null) => void;
}

export default function AdminEmpleadosPage({ storeSel, onStoreChange }: Props) {
  const {
    tiendas, cargos, tiposDocumento,
    tiendaSel, setTiendaSel, empleadosTienda, loadingTienda,
    empleado, seleccionar,
    crearEmpleado, creando, actualizarEmpleado, actualizando,
  } = useAdminEmpleados(storeSel, onStoreChange);

  const [query, setQuery] = useState('');
  const [modalNuevo, setModalNuevo] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activo' | 'inactivo'>('todos');

  const tiendaNombre = (id: number | null) => tiendas.find((t) => t.id === id)?.name ?? '—';

  const cargandoLista = loadingTienda;
  const enBusqueda = query.trim().length > 0;

  const coincide = (e: EmpleadoAdmin) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const doc = String(e.document_number ?? '');
    if (/^\d+$/.test(q)) return doc.includes(q);
    const nombre = [e.first_name, e.middle_name, e.last_name, e.second_last_name]
      .filter((p) => p && p.trim()).join(' ').toLowerCase();
    return q.split(/\s+/).every((tok) => nombre.includes(tok));
  };

  const esActivo = (e: EmpleadoAdmin) => (e.status || '').toLowerCase() === 'activo';
  const base = empleadosTienda.filter(coincide);
  const nActivos = base.filter(esActivo).length;
  const nInactivos = base.length - nActivos;
  const visibles = filtroEstado === 'todos'
    ? base
    : base.filter((e) => (filtroEstado === 'activo' ? esActivo(e) : !esActivo(e)));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Encabezado */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, color: '#0f2c4a', fontSize: '1.05rem' }}>Gestión de empleados</Typography>
          <Typography sx={{ fontSize: '0.82rem', color: '#64748b' }}>
            Busca por nombre o documento para reactivar o cambiar de tienda, o crea un empleado nuevo.
          </Typography>
        </Box>
        <Button
          variant="contained" disableElevation startIcon={<PersonAddIcon />} onClick={() => setModalNuevo(true)}
          sx={{ bgcolor: AZUL, textTransform: 'none', fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: '#003a6b' } }}
        >
          Nuevo empleado
        </Button>
      </Paper>

      {/* Selector de tienda + buscador */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #eef2f6' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Box sx={{ minWidth: 240, flex: { xs: '1 1 100%', md: '0 0 280px' } }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.5px', color: '#6b7280', mb: 1 }}>
              TIENDA
            </Typography>
            <Autocomplete
              size="small"
              options={tiendas}
              getOptionLabel={(o) => o.name}
              value={tiendas.find((t) => t.id === tiendaSel) ?? null}
              onChange={(_, v) => { setTiendaSel(v ? v.id : null); setFiltroEstado('todos'); }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Selecciona una tienda…"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <InputAdornment position="start"><StorefrontIcon sx={{ fontSize: 18, color: AZUL }} /></InputAdornment>,
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f1f7fe' } }}
                />
              )}
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 260 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.5px', color: '#6b7280', mb: 1 }}>
              BUSCAR EMPLEADO EN LA TIENDA
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Nombre o número de documento…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ flex: 1, minWidth: 260, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f1f7fe' } }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {query && (
                    <IconButton size="small" onClick={() => setQuery('')}>
                      <ClearIcon sx={{ fontSize: 16, color: '#8a9bb5' }} />
                    </IconButton>
                  )}
                  <PersonSearchIcon sx={{ color: AZUL, fontSize: 20, ml: 0.5 }} />
                </InputAdornment>
              ),
            }}
          />
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Resultados */}
      {cargandoLista && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} sx={{ color: AZUL }} /></Box>
      )}

      {!cargandoLista && base.length === 0 && (
        enBusqueda ? (
          <Alert severity="info" sx={{ borderRadius: 2 }} action={<Button color="inherit" size="small" onClick={() => setModalNuevo(true)}>Crear nuevo</Button>}>
            No se encontraron empleados con esa búsqueda.
          </Alert>
        ) : tiendaSel != null ? (
          <Alert severity="info" sx={{ borderRadius: 2 }} action={<Button color="inherit" size="small" onClick={() => setModalNuevo(true)}>Crear nuevo</Button>}>
            Esta tienda no tiene empleados registrados.
          </Alert>
        ) : (
          <Alert severity="info" sx={{ borderRadius: 2 }}>Selecciona una tienda para ver sus empleados.</Alert>
        )
      )}

      {!cargandoLista && base.length > 0 && (
        <>
          {/* Encabezado de resultados */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, bgcolor: '#fff', border: '1px solid #eef2f6', borderRadius: 3, p: { xs: 1.5, md: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 2.5, bgcolor: '#eaf2fb', color: AZUL, border: '1px solid #d6e6f7', flexShrink: 0 }}>
                {enBusqueda ? <PersonSearchIcon sx={{ fontSize: 22 }} /> : <StorefrontIcon sx={{ fontSize: 22 }} />}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, color: '#0f2c4a', fontSize: '1.02rem', lineHeight: 1.2 }} noWrap>
                  {enBusqueda
                    ? 'Resultados de la búsqueda'
                    : <>Empleados de <Box component="span" sx={{ color: AZUL }}>{tiendaNombre(tiendaSel)}</Box></>}
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', mt: 0.2 }}>
                  {visibles.length} {visibles.length === 1 ? 'empleado' : 'empleados'}
                  {filtroEstado !== 'todos' ? ` · ${filtroEstado === 'activo' ? 'activos' : 'inactivos'}` : ''}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75, bgcolor: '#f4f8fd', p: 0.5, borderRadius: 2, border: '1px solid #e8eef5' }}>
              {([
                { key: 'todos', label: 'Todos', n: base.length },
                { key: 'activo', label: 'Activos', n: nActivos },
                { key: 'inactivo', label: 'Inactivos', n: nInactivos },
              ] as const).map((f) => {
                const activo = filtroEstado === f.key;
                return (
                  <Box
                    key={f.key}
                    onClick={() => setFiltroEstado(f.key)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      px: 1.25, py: 0.5, borderRadius: 1.5, cursor: 'pointer',
                      fontSize: '0.78rem', fontWeight: 700,
                      color: activo ? '#fff' : '#64748b',
                      bgcolor: activo ? AZUL : 'transparent',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: activo ? '#003a6b' : '#eaf2fb' },
                    }}
                  >
                    {f.label}
                    <Box component="span" sx={{
                      fontSize: '0.68rem', fontWeight: 700, px: 0.6, borderRadius: 1,
                      bgcolor: activo ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                      color: activo ? '#fff' : '#64748b',
                    }}>{f.n}</Box>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {visibles.length === 0 ? (
            <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', px: 0.5 }}>
              No hay empleados {filtroEstado === 'activo' ? 'activos' : 'inactivos'} en esta búsqueda.
            </Typography>
          ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
            {visibles.map((emp) => {
              const nombre = nombreDe(emp);
              const inactivo = (emp.status || '').toLowerCase() !== 'activo';
              return (
                <Paper
                  key={emp.id}
                  elevation={0}
                  onClick={() => seleccionar(emp)}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: '1px solid #e8eef5',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    opacity: inactivo ? 0.85 : 1,
                    '&:hover': { borderColor: '#b9d4f0', boxShadow: '0 6px 18px rgba(0,70,128,0.10)', transform: 'translateY(-2px)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: colorAvatar(nombre), width: 42, height: 42, fontWeight: 700 }}>
                      {nombre.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, color: '#0f2c4a', textTransform: 'capitalize', lineHeight: 1.2 }} noWrap>
                        {nombre}
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <BadgeIcon sx={{ fontSize: 13 }} /> {emp.document_number || '—'}
                      </Typography>
                    </Box>
                    <Chip
                      label={(emp.status || '—').toUpperCase()}
                      size="small"
                      sx={{
                        height: 22, fontWeight: 700, fontSize: '0.65rem',
                        bgcolor: inactivo ? '#fee2e2' : '#dcfce7',
                        color: inactivo ? '#dc2626' : '#16a34a',
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#475569' }}>
                    <WorkOutlineIcon sx={{ fontSize: 16, color: AZUL }} />
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }} noWrap>{emp.position_name || 'Sin cargo'}</Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>
          )}
        </>
      )}

      {/* Modales */}
      <DialogNuevoEmpleado
        open={modalNuevo}
        onClose={() => setModalNuevo(false)}
        tiendas={tiendas}
        cargos={cargos}
        tiposDocumento={tiposDocumento}
        guardando={creando}
        onGuardar={async (data) => { await crearEmpleado(data); }}
      />

      <DialogEditarEmpleado
        open={!!empleado}
        empleado={empleado}
        tiendas={tiendas}
        cargos={cargos}
        guardando={actualizando}
        onClose={() => seleccionar(null)}
        onGuardar={async (id, data) => { await actualizarEmpleado({ id, data }); }}
      />

    </Box>
  );
}
