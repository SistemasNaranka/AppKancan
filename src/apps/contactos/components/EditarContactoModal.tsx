import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl,
  RadioGroup, FormControlLabel, Radio,
  InputAdornment, IconButton, Box, Typography, Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import { Contactos, CreateContactoInput } from '../types/contact';
import { getDepartamentos } from '../api/directus/read';



interface Props {
  open: boolean;
  onClose: () => void;
  onGuardar: (data: CreateContactoInput) => Promise<boolean>;
  contacto: Contactos | null;
}

export const EditarContactoModal: React.FC<Props> = ({ open, onClose, onGuardar, contacto }) => {
  const [form, setForm] = useState<CreateContactoInput>({
    full_name: '',
    phone_number: '',
    email: '',
    department_id: '',
    visibility_type: 'Universal',
  });
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Partial<Record<keyof CreateContactoInput, string>>>({});
  const [departamentos, setDepartamentos] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    getDepartamentos().then(setDepartamentos);
    }, []);

  useEffect(() => {
    if (contacto) {
      setForm({
        full_name: contacto.full_name,
        phone_number: contacto.phone_number,
        email: contacto.email,
        department_id: contacto.department_id,
        visibility_type: contacto.visibility_type,
      });
    }
  }, [contacto]);
  const formatoCorreoValido = (correo: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
  };

  const handleChange = (field: keyof CreateContactoInput, value: string) => {
    if (field === 'phone_number') {
      const valorFiltrado = value.replace(/[^0-9+\s]/g, '');
      setForm((prev) => ({ ...prev, [field]: valorFiltrado }));
      setErrores((prev) => ({ ...prev, [field]: '' }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrores((prev) => ({ ...prev, [field]: '' }));
  };

  const validar = (): boolean => {
    const nuevosErrores: typeof errores = {};
    if (!form.full_name.trim()) {
      nuevosErrores.full_name = 'El nombre es obligatorio';
    } else if (form.full_name.trim().length <= 3) {
      nuevosErrores.full_name = 'El nombre debe tener más de 3 caracteres';
    }
    if (!form.email.trim()) {
      nuevosErrores.email = 'El correo es obligatorio';
    } else if (!formatoCorreoValido(form.email)) {
      nuevosErrores.email = 'Ingrese un correo válido (ej: usuario@empresa.com)';
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleGuardar = async () => {
    if (!validar()) return;
    setGuardando(true);
    const ok = await onGuardar(form);
    setGuardando(false);
    if (ok) onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>

      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" fontWeight={700} color="#0f172a">
          Editar Contacto
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: '#64748b' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box>
          <Typography variant="body2" fontWeight={600} mb={0.8} color="#374151">
            Nombre Completo <span style={{ color: '#ef4444' }}>*</span>
          </Typography>
          <TextField fullWidth size="small" placeholder="Ej. Ana García"
            value={form.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            error={!!errores.full_name} helperText={errores.full_name}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box flex={1}>
            <Typography variant="body2" fontWeight={600} mb={0.8} color="#374151">Teléfono</Typography>
            <TextField fullWidth size="small" placeholder="+57 300 000 0000"
              value={form.phone_number}
              onChange={(e) => handleChange('phone_number', e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" sx={{ color: '#94a3b8' }} /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Box>
          <Box flex={1}>
            <Typography variant="body2" fontWeight={600} mb={0.8} color="#374151">
              Correo Electrónico <span style={{ color: '#ef4444' }}>*</span>
            </Typography>
            <TextField fullWidth size="small" placeholder="ana@ejemplo.com"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={!!errores.email} helperText={errores.email}
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" sx={{ color: '#94a3b8' }} /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Box>
        </Box>

        <Box>
          <Typography variant="body2" fontWeight={600} mb={0.8} color="#374151">Área</Typography>
          <FormControl fullWidth size="small">
            <Select displayEmpty value={form.department_id}
              onChange={(e) => handleChange('department_id', e.target.value)}
              sx={{ borderRadius: '10px' }}>
              <MenuItem value="" disabled>Seleccione un departamento...</MenuItem>
              {departamentos.map((d) => <MenuItem key={d.id} value={String(d.id)}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        <Box>
          <Typography variant="body2" fontWeight={600} mb={0.8} color="#374151">Visibilidad</Typography>
          <RadioGroup row value={form.visibility_type}
            onChange={(e) => handleChange('visibility_type', e.target.value as any)}>
            <FormControlLabel value="Universal" control={<Radio size="small" sx={{ color: '#004a99', '&.Mui-checked': { color: '#004a99' } }} />} label="Universal" />
            <FormControlLabel value="Restringido" control={<Radio size="small" sx={{ color: '#004a99', '&.Mui-checked': { color: '#004a99' } }} />} label="Restringido" />
            <FormControlLabel value="Inactivo" control={<Radio size="small" sx={{ color: '#004a99', '&.Mui-checked': { color: '#004a99' } }} />} label="Inactivo" />
          </RadioGroup>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined"
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: '#e2e8f0', color: '#475569' }}>
          Cancelar
        </Button>
        <Button onClick={handleGuardar} variant="contained" disabled={guardando}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#004a99', px: 4 }}>
          {guardando ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};