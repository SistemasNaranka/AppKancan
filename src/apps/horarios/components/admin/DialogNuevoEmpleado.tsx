import { useState, useEffect, ReactNode } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box,
  TextField, FormControl, InputLabel, Select, MenuItem, Autocomplete,
  Typography, Divider, FormHelperText, InputAdornment, CircularProgress,
} from '@mui/material';
import * as yup from 'yup';
import { sileo } from 'sileo';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WorkIcon from '@mui/icons-material/Work';
import { Tienda, Cargo, NuevoEmpleadoPayload } from '../../interfaces/horarios.interface';
import { useParseNombreIA } from '../../hooks/useParseNombreIA';
import { SILEO_STATE_FILL } from '@/shared/components/SnackbarsPosition/SnackbarContext';

interface Props {
  open: boolean;
  onClose: () => void;
  tiendas: Tienda[];
  cargos: Cargo[];
  tiposDocumento: string[];
  guardando: boolean;
  onGuardar: (data: NuevoEmpleadoPayload) => Promise<unknown>;
}

const AZUL = '#004680';

const schema = yup.object().shape({
  document_type: yup.string().required('Selecciona el tipo de documento'),
  document_number: yup.string().trim().required('El número de documento es obligatorio'),
  store_id: yup.number().moreThan(0, 'Selecciona una tienda').required('Selecciona una tienda'),
  position_id: yup.number().moreThan(0, 'Selecciona un cargo').required('Selecciona un cargo'),
});

const initialForm = (tipoDocDefault: string) => ({
  document_type: tipoDocDefault,
  document_number: '',
  store_id: 0,
  position_id: 0,
});

function splitNombreLocal(nombre: string) {
  const t = nombre.trim().split(/\s+/).filter(Boolean);
  const r = { first_name: '', middle_name: '', last_name: '', second_last_name: '' };
  if (t.length === 1) { r.first_name = t[0]; }
  else if (t.length === 2) { r.first_name = t[0]; r.last_name = t[1]; }
  else if (t.length === 3) { r.first_name = t[0]; r.last_name = t[1]; r.second_last_name = t[2]; }
  else {
    r.first_name = t[0];
    r.middle_name = t[1];
    r.second_last_name = t[t.length - 1];
    r.last_name = t.slice(2, t.length - 1).join(' ');
  }
  return r;
}

interface EmpleadoCreado {
  nombre: string;
  documento: string;
  tienda: string;
  cargo: string;
}

function EmpleadoCreadoCard({ emp }: { emp: EmpleadoCreado }) {
  const fila = (icon: ReactNode, label: string, value: string) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          width: 26,
          height: 26,
          borderRadius: 1.5,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255,255,255,0.18)',
          color: '#fff',
        }}
      >
        {icon}
      </Box>
      <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)', minWidth: 62 }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.8rem', color: '#fff', fontWeight: 400 }} noWrap>{value || '—'}</Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0.85,
        minWidth: 240,
      }}
    >
      {fila(<PersonIcon sx={{ fontSize: 16 }} />, 'Nombre', emp.nombre)}
      {fila(<BadgeIcon sx={{ fontSize: 16 }} />, 'Documento', emp.documento)}
      {fila(<StorefrontIcon sx={{ fontSize: 16 }} />, 'Tienda', emp.tienda)}
      {fila(<WorkIcon sx={{ fontSize: 16 }} />, 'Cargo', emp.cargo)}
    </Box>
  );
}

export default function DialogNuevoEmpleado({
  open, onClose, tiendas, cargos, tiposDocumento, guardando, onGuardar,
}: Props) {
  const [form, setForm] = useState(initialForm(tiposDocumento[0] ?? ''));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [nombreCompleto, setNombreCompleto] = useState('');

  const { separarNombre, procesando } = useParseNombreIA();

  useEffect(() => {
    if (open) {
      setForm(initialForm(tiposDocumento[0] ?? ''));
      setErrors({});
      setNombreCompleto('');
    }
  }, [open, tiposDocumento]);

  const setCampo = (campo: string, valor: any) => setForm((f) => ({ ...f, [campo]: valor }));

  const handleGuardar = async () => {
    setErrors({});

    const nuevosErrores: Record<string, string> = {};
    try {
      await schema.validate(form, { abortEarly: false });
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        err.inner.forEach((i) => { if (i.path) nuevosErrores[i.path] = i.message; });
      }
    }
    const nombre = nombreCompleto.trim().replace(/\s+/g, ' ');
    if (!nombre) nuevosErrores.nombreCompleto = 'El nombre completo es obligatorio';
    else if (nombre.split(' ').length < 2) nuevosErrores.nombreCompleto = 'Ingresa al menos un nombre y un apellido';

    if (Object.keys(nuevosErrores).length > 0) {
      setErrors(nuevosErrores);
      return;
    }

    // Datos para la tarjeta del toast (se capturan antes de cerrar el modal).
    const empleadoInfo: EmpleadoCreado = {
      nombre,
      documento: form.document_number,
      tienda: tiendas.find((t) => t.id === form.store_id)?.name ?? '',
      cargo: cargos.find((c) => c.id === form.position_id)?.name ?? '',
    };
    const datosForm = { ...form };

    // Cierra el modal de inmediato; el progreso se muestra en el toast de Sileo.
    onClose();

    sileo.promise(
      (async () => {
        let partes;
        try {
          partes = await separarNombre(nombre);
          if (!partes.first_name || !partes.last_name) partes = splitNombreLocal(nombre);
        } catch {
          partes = splitNombreLocal(nombre);
        }
        await onGuardar({
          document_type: datosForm.document_type,
          document_number: datosForm.document_number,
          first_name: partes.first_name,
          middle_name: partes.middle_name || undefined,
          last_name: partes.last_name,
          second_last_name: partes.second_last_name || undefined,
          store_id: datosForm.store_id,
          position_id: datosForm.position_id,
        });
      })(),
      {
        loading: { title: 'Creando empleado…', fill: SILEO_STATE_FILL.loading },
        success: () => ({
          title: 'Empleado creado',
          description: <EmpleadoCreadoCard emp={empleadoInfo} />,
          duration: 6000,
          fill: SILEO_STATE_FILL.success,
        }),
        error: { title: 'Error al crear el empleado', fill: SILEO_STATE_FILL.error, duration: 6000 },
      }
    );
  };
 
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ bgcolor: AZUL, color: '#fff', py: 2, px: 3, fontWeight: 700 }}>
        Nuevo empleado
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth error={!!errors.document_type}>
              <InputLabel id="tipo-doc-label">Tipo de documento</InputLabel>
              <Select
                labelId="tipo-doc-label"
                label="Tipo de documento"
                value={form.document_type}
                onChange={(e) => setCampo('document_type', e.target.value)}
              >
                {tiposDocumento.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
              {errors.document_type && <FormHelperText>{errors.document_type}</FormHelperText>}
            </FormControl>
            <TextField
              fullWidth
              label="Número de documento"
              value={form.document_number}
              onChange={(e) => setCampo('document_number', e.target.value.replace(/[^0-9]/g, ''))}
              error={!!errors.document_number}
              helperText={errors.document_number}
            />
          </Box>

          <Divider textAlign="left">
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>NOMBRE</Typography>
          </Divider>

          <TextField
            fullWidth
            label="Nombre completo *"
            placeholder="Ej: Juan Camilo Ortiz Grisales"
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            error={!!errors.nombreCompleto}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                </InputAdornment>
              ),
            }}
          />

          <Divider textAlign="left">
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>ASIGNACIÓN</Typography>
          </Divider>

          <Autocomplete
            options={tiendas}
            getOptionLabel={(o) => o.name}
            value={tiendas.find((t) => t.id === form.store_id) ?? null}
            onChange={(_, v) => setCampo('store_id', v ? v.id : 0)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tienda *"
                placeholder="Buscar tienda..."
                error={!!errors.store_id}
                helperText={errors.store_id}
              />
            )}
          />

          <FormControl fullWidth error={!!errors.position_id}>
            <InputLabel id="cargo-label">Cargo</InputLabel>
            <Select
              labelId="cargo-label"
              label="Cargo"
              value={form.position_id === 0 ? '' : form.position_id}
              onChange={(e) => setCampo('position_id', Number(e.target.value))}
            >
              <MenuItem value="" disabled>Selecciona un cargo…</MenuItem>
              {cargos.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
            {errors.position_id && <FormHelperText>{errors.position_id}</FormHelperText>}
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={guardando || procesando} sx={{ color: '#475569', borderColor: '#cbd5e1', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f1f5f9' } }}>Cancelar</Button>
        <Button
          onClick={handleGuardar}
          variant="contained"
          disableElevation
          disabled={guardando || procesando}
          startIcon={(guardando || procesando) ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
          sx={{ bgcolor: AZUL, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#003a6b' } }}
        >
          {procesando ? 'Procesando nombre…' : guardando ? 'Guardando…' : 'Crear empleado'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
