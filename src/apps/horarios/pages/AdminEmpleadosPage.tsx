import { useState } from 'react';
import {
  Box, Paper, Typography, TextField, InputAdornment, IconButton, Button,
  Autocomplete, FormControl, InputLabel, Select, MenuItem, Chip, Divider,
  CircularProgress, Alert,
} from '@mui/material';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import ClearIcon from '@mui/icons-material/Clear';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BadgeIcon from '@mui/icons-material/Badge';
import useAdminEmpleados from '../hooks/useAdminEmpleados';
import DialogNuevoEmpleado from '../components/admin/DialogNuevoEmpleado';

const AZUL = '#004680';

export default function AdminEmpleadosPage() {
  const {
    tiendas, cargos, tiposDocumento, loadingCatalogos,
    empleado, buscando, sinResultado, buscarEmpleado, limpiarBusqueda,
    crearEmpleado, creando, actualizarEmpleado, actualizando,
  } = useAdminEmpleados();

  const [documento, setDocumento] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  // Estado editable de la tarjeta de resultado
  const [storeEdit, setStoreEdit] = useState<number>(0);
  const [cargoEdit, setCargoEdit] = useState<number>(0);
  const [statusEdit, setStatusEdit] = useState<string>('Activo');

  // Sincroniza los campos editables cuando llega un empleado
  const empId = empleado?.id ?? null;
  const [empIdSync, setEmpIdSync] = useState<number | null>(null);
  if (empId !== empIdSync) {
    setEmpIdSync(empId);
    setStoreEdit(empleado?.store_id ?? 0);
    setCargoEdit(empleado?.position_id ?? 0);
    setStatusEdit(empleado?.status ?? 'Activo');
  }

  const onBuscar = () => buscarEmpleado(documento);

  const nombreCompleto = empleado
    ? [empleado.first_name, empleado.middle_name, empleado.last_name, empleado.second_last_name]
        .filter((p) => p && p.trim()).join(' ')
    : '';

  const hayCambios = !!empleado && (
    storeEdit !== (empleado.store_id ?? 0) ||
    cargoEdit !== (empleado.position_id ?? 0) ||
    statusEdit !== (empleado.status ?? '')
  );

  const guardarCambios = async () => {
    if (!empleado) return;
    await actualizarEmpleado({
      id: empleado.id,
      data: { store_id: storeEdit, position_id: cargoEdit, status: statusEdit },
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Encabezado del panel */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, color: '#0f2c4a', fontSize: '1.05rem' }}>
            Gestión de empleados
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: '#64748b' }}>
            Crea, reactiva o cambia de tienda a un empleado por su número de documento.
          </Typography>
        </Box>
        <Button
          variant="contained"
          disableElevation
          startIcon={<PersonAddIcon />}
          onClick={() => setModalAbierto(true)}
          sx={{ bgcolor: AZUL, textTransform: 'none', fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: '#003a6b' } }}
        >
          Nuevo empleado
        </Button>
      </Paper>

      {/* Buscador por documento */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #eef2f6' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.5px', color: '#6b7280', mb: 1 }}>
          BUSCAR POR DOCUMENTO
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Número de cédula…"
            value={documento}
            onChange={(e) => setDocumento(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={(e) => { if (e.key === 'Enter') onBuscar(); }}
            sx={{ flex: 1, minWidth: 240, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f1f7fe' } }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {documento && (
                    <IconButton size="small" onClick={() => { setDocumento(''); limpiarBusqueda(); }}>
                      <ClearIcon sx={{ fontSize: 16, color: '#8a9bb5' }} />
                    </IconButton>
                  )}
                  <PersonSearchIcon sx={{ color: AZUL, fontSize: 20, ml: 0.5 }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            disableElevation
            onClick={onBuscar}
            disabled={buscando || !documento.trim()}
            sx={{ bgcolor: AZUL, textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3, height: 40, '&:hover': { bgcolor: '#003a6b' } }}
          >
            {buscando ? 'Buscando…' : 'Buscar'}
          </Button>
        </Box>

        {sinResultado && (
          <Alert
            severity="info"
            sx={{ mt: 2, borderRadius: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => setModalAbierto(true)}>
                Crear nuevo
              </Button>
            }
          >
            No se encontró ningún empleado con ese documento.
          </Alert>
        )}
      </Paper>

      {/* Resultado / edición */}
      {empleado && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #eef2f6', overflow: 'hidden' }}>
          <Box sx={{ bgcolor: AZUL, color: '#fff', p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <BadgeIcon />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', textTransform: 'capitalize', lineHeight: 1.2 }} noWrap>
                {nombreCompleto || 'Empleado'}
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', opacity: 0.85 }}>
                {empleado.document_type || 'Documento'}: {empleado.document_number}
              </Typography>
            </Box>
            <Chip
              label={(empleado.status || '—').toUpperCase()}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: '0.7rem' }}
            />
          </Box>

          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Autocomplete
              options={tiendas}
              loading={loadingCatalogos}
              getOptionLabel={(o) => o.name}
              value={tiendas.find((t) => t.id === storeEdit) ?? null}
              onChange={(_, v) => setStoreEdit(v ? v.id : 0)}
              renderInput={(params) => <TextField {...params} label="Tienda" placeholder="Buscar tienda..." />}
            />

            <FormControl fullWidth>
              <InputLabel id="cargo-edit-label">Cargo</InputLabel>
              <Select
                labelId="cargo-edit-label"
                label="Cargo"
                value={cargoEdit === 0 ? '' : cargoEdit}
                onChange={(e) => setCargoEdit(Number(e.target.value))}
              >
                <MenuItem value="" disabled>Selecciona un cargo…</MenuItem>
                {cargos.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.5px', color: '#6b7280', mb: 1 }}>
                ESTADO
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {['Activo', 'Inactivo'].map((s) => {
                  const activo = statusEdit === s;
                  return (
                    <Chip
                      key={s}
                      label={s}
                      onClick={() => setStatusEdit(s)}
                      sx={{
                        fontWeight: 600,
                        cursor: 'pointer',
                        bgcolor: activo ? (s === 'Activo' ? '#dcfce7' : '#fee2e2') : '#f1f5f9',
                        color: activo ? (s === 'Activo' ? '#16a34a' : '#dc2626') : '#64748b',
                        border: '1px solid',
                        borderColor: activo ? (s === 'Activo' ? '#16a34a' : '#dc2626') : 'transparent',
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                disableElevation
                disabled={!hayCambios || actualizando}
                onClick={guardarCambios}
                sx={{ bgcolor: AZUL, textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 4, '&:hover': { bgcolor: '#003a6b' } }}
              >
                {actualizando ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {loadingCatalogos && !empleado && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={28} sx={{ color: AZUL }} />
        </Box>
      )}

      <DialogNuevoEmpleado
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        tiendas={tiendas}
        cargos={cargos}
        tiposDocumento={tiposDocumento}
        guardando={creando}
        onGuardar={async (data) => { await crearEmpleado(data); }}
      />
    </Box>
  );
}
