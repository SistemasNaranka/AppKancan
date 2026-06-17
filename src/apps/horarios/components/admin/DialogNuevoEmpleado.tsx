import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box,
  TextField, FormControl, InputLabel, Select, MenuItem, Autocomplete,
  Typography, Divider, FormHelperText, InputAdornment, Tooltip, CircularProgress,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import * as yup from 'yup';
import { Tienda, Cargo, NuevoEmpleadoPayload } from '../../interfaces/horarios.interface';
import { useParseNombreIA } from '../../hooks/useParseNombreIA';
import { useGlobalSnackbar } from '@/shared/components/SnackbarsPosition/SnackbarContext';

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
  first_name: yup.string().trim().required('El primer nombre es obligatorio'),
  last_name: yup.string().trim().required('El primer apellido es obligatorio'),
  store_id: yup.number().moreThan(0, 'Selecciona una tienda').required('Selecciona una tienda'),
  position_id: yup.number().moreThan(0, 'Selecciona un cargo').required('Selecciona un cargo'),
});

const initialForm = (tipoDocDefault: string) => ({
  document_type: tipoDocDefault,
  document_number: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  second_last_name: '',
  store_id: 0,
  position_id: 0,
});

export default function DialogNuevoEmpleado({
  open, onClose, tiendas, cargos, tiposDocumento, guardando, onGuardar,
}: Props) {
  const [form, setForm] = useState(initialForm(tiposDocumento[0] ?? ''));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [nombreCompleto, setNombreCompleto] = useState('');

  const { separarNombre, procesando, disponible } = useParseNombreIA();
  const { showSnackbar } = useGlobalSnackbar();

  useEffect(() => {
    if (open) {
      setForm(initialForm(tiposDocumento[0] ?? ''));
      setErrors({});
      setNombreCompleto('');
    }
  }, [open, tiposDocumento]);

  const setCampo = (campo: string, valor: any) => setForm((f) => ({ ...f, [campo]: valor }));

  const handleSepararIA = async () => {
    try {
      const r = await separarNombre(nombreCompleto);
      setForm((f) => ({
        ...f,
        first_name: r.first_name,
        middle_name: r.middle_name,
        last_name: r.last_name,
        second_last_name: r.second_last_name,
      }));
      setErrors((e) => ({ ...e, first_name: '', last_name: '' }));
    } catch (err: any) {
      showSnackbar(err?.message || 'No se pudo separar el nombre con IA', 'error');
    }
  };

  const handleGuardar = async () => {
    try {
      setErrors({});
      const data = await schema.validate(form, { abortEarly: false });
      await onGuardar({
        document_type: data.document_type,
        document_number: data.document_number,
        first_name: data.first_name,
        middle_name: form.middle_name || undefined,
        last_name: data.last_name,
        second_last_name: form.second_last_name || undefined,
        store_id: data.store_id,
        position_id: data.position_id,
      });
      onClose();
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const e: Record<string, string> = {};
        err.inner.forEach((i) => { if (i.path) e[i.path] = i.message; });
        setErrors(e);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ bgcolor: AZUL, color: '#fff', py: 2, px: 3, fontWeight: 700 }}>
        Nuevo empleado
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {/* Documento */}
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

          {/* Nombre completo + separación con IA */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              label="Nombre completo"
              placeholder="Ej: Maria Camila Mendes Rey"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && disponible && nombreCompleto.trim() && !procesando) { e.preventDefault(); handleSepararIA(); } }}
              InputProps={{
                endAdornment: procesando ? (
                  <InputAdornment position="end"><CircularProgress size={18} /></InputAdornment>
                ) : undefined,
              }}
              helperText="Escribe el nombre completo y sepáralo con IA, o llena los campos manualmente."
            />
            <Tooltip title={disponible ? 'Separar nombres y apellidos con IA' : 'Configura tu clave de IA en tu perfil para usar esto'}>
              <span>
                <Button
                  onClick={handleSepararIA}
                  disabled={!disponible || procesando || !nombreCompleto.trim()}
                  variant="contained"
                  disableElevation
                  startIcon={<AutoAwesomeIcon sx={{ fontSize: 18 }} />}
                  sx={{ bgcolor: AZUL, textTransform: 'none', fontWeight: 700, borderRadius: 2, whiteSpace: 'nowrap', height: 56, '&:hover': { bgcolor: '#003a6b' } }}
                >
                  {procesando ? 'Separando…' : 'Separar con IA'}
                </Button>
              </span>
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth label="Primer nombre *"
              value={form.first_name}
              onChange={(e) => setCampo('first_name', e.target.value)}
              error={!!errors.first_name}
              helperText={errors.first_name}
            />
            <TextField
              fullWidth label="Segundo nombre"
              value={form.middle_name}
              onChange={(e) => setCampo('middle_name', e.target.value)}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth label="Primer apellido *"
              value={form.last_name}
              onChange={(e) => setCampo('last_name', e.target.value)}
              error={!!errors.last_name}
              helperText={errors.last_name}
            />
            <TextField
              fullWidth label="Segundo apellido"
              value={form.second_last_name}
              onChange={(e) => setCampo('second_last_name', e.target.value)}
            />
          </Box>

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
        <Button onClick={onClose} variant="outlined" color="error" disabled={guardando}>Cancelar</Button>
        <Button onClick={handleGuardar} variant="contained" disableElevation disabled={guardando} sx={{ bgcolor: AZUL, '&:hover': { bgcolor: '#003a6b' } }}>
          {guardando ? 'Guardando…' : 'Crear empleado'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
