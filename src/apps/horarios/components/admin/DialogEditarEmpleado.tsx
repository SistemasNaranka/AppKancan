import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Autocomplete, TextField, FormControl, InputLabel, Select, MenuItem, Chip, Divider,
  CircularProgress,
} from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import { Tienda, Cargo, EmpleadoAdmin } from '../../interfaces/horarios.interface';

const AZUL = '#004680';

interface Props {
  open: boolean;
  empleado: EmpleadoAdmin | null;
  tiendas: Tienda[];
  cargos: Cargo[];
  guardando: boolean;
  onClose: () => void;
  onGuardar: (id: number, data: { store_id?: number; position_id?: number; status?: string }) => Promise<unknown>;
}

export default function DialogEditarEmpleado({
  open, empleado, tiendas, cargos, guardando, onClose, onGuardar,
}: Props) {
  const [storeEdit, setStoreEdit] = useState(0);
  const [cargoEdit, setCargoEdit] = useState(0);
  const [statusEdit, setStatusEdit] = useState('Activo');

  useEffect(() => {
    if (open && empleado) {
      setStoreEdit(empleado.store_id ?? 0);
      setCargoEdit(empleado.position_id ?? 0);
      setStatusEdit(empleado.status ?? 'Activo');
    }
  }, [open, empleado]);

  if (!empleado) return null;

  const nombreCompleto = [empleado.first_name, empleado.middle_name, empleado.last_name, empleado.second_last_name]
    .filter((p) => p && p.trim()).join(' ');

  const hayCambios =
    storeEdit !== (empleado.store_id ?? 0) ||
    cargoEdit !== (empleado.position_id ?? 0) ||
    statusEdit !== (empleado.status ?? '');

  const guardar = async () => {
    // Solo se envían los campos que realmente cambiaron (no se reenvían los
    // valores ya establecidos, que además podrían venir en 0 y causar error).
    const data: { store_id?: number; position_id?: number; status?: string } = {};
    if (storeEdit !== (empleado.store_id ?? 0)) data.store_id = storeEdit;
    if (cargoEdit !== (empleado.position_id ?? 0)) data.position_id = cargoEdit;
    if (statusEdit !== (empleado.status ?? '')) data.status = statusEdit;

    if (Object.keys(data).length === 0) { onClose(); return; }

    await onGuardar(empleado.id, data);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ bgcolor: AZUL, color: '#fff', p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BadgeIcon />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', textTransform: 'capitalize', lineHeight: 1.2 }} noWrap>
            {nombreCompleto || 'Empleado'}
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', opacity: 0.85 }}>
            {empleado.document_type || 'Documento'}: {empleado.document_number}
          </Typography>
        </Box>
        <Chip label={(empleado.status || '—').toUpperCase()} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px' }} />
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Autocomplete
          options={tiendas}
          getOptionLabel={(o) => o.name}
          value={tiendas.find((t) => t.id === storeEdit) ?? null}
          onChange={(_, v) => setStoreEdit(v ? v.id : 0)}
          renderInput={(params) => <TextField {...params} label="Tienda" placeholder="Buscar tienda..." />}
        />

        <FormControl fullWidth>
          <InputLabel id="cargo-edit-label">Cargo</InputLabel>
          <Select labelId="cargo-edit-label" label="Cargo" value={cargoEdit === 0 ? '' : cargoEdit} onChange={(e) => setCargoEdit(Number(e.target.value))}>
            <MenuItem value="" disabled>Selecciona un cargo…</MenuItem>
            {cargos.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>

        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.5px', color: '#6b7280', mb: 1 }}>ESTADO</Typography>
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
                    borderRadius: '8px',
                    px: 0.5,
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
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={guardando} sx={{ color: '#475569', borderColor: '#cbd5e1', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f1f5f9' } }}>Cerrar</Button>
        <Button
          onClick={guardar}
          variant="contained"
          disableElevation
          disabled={!hayCambios || guardando}
          startIcon={guardando ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
          sx={{ bgcolor: AZUL, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#003a6b' } }}
        >
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
