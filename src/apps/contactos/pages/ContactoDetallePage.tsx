import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Avatar, Chip, Stack,
  Paper, CircularProgress, Alert, Divider, InputAdornment,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import { getContactoById } from '../api/directus/read';
import { updateContacto } from '../api/directus/create';
import { Contactos } from '../types/contact';
import { useGlobalSnackbar } from '@/shared/components/SnackbarsPosition/SnackbarContext';

const COLORS = ['#004a99', '#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#f97316', '#06b6d4'];

const getIniciales = (name: string) =>
  name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

const getColor = (id: number) => COLORS[id % COLORS.length];

const chipColor = (tipo: string): 'success' | 'warning' | 'default' => {
  if (tipo === 'Universal') return 'success';
  if (tipo === 'Restringido') return 'warning';
  return 'default';
};

export default function ContactoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSnackbar } = useGlobalSnackbar();

  const [contacto, setContacto] = useState<Contactos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone_number: '' });
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setCargando(true);
      const data = await getContactoById(Number(id));
      if (data) {
        setContacto(data);
        setForm({ full_name: data.full_name, email: data.email, phone_number: data.phone_number });
      } else {
        setErrorMsg('No se encontró el contacto');
      }
      setCargando(false);
    };
    load();
  }, [id]);

  const validar = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'El nombre es obligatorio';
    else if (form.full_name.trim().length <= 3) e.full_name = 'Debe tener más de 3 caracteres';
    if (!form.email.trim()) e.email = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Correo inválido';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validar() || !contacto) return;
    setGuardando(true);
    const ok = await updateContacto(contacto.id, {
      full_name: form.full_name,
      email: form.email,
      phone_number: form.phone_number,
    });
    setGuardando(false);
    if (ok) {
      setContacto((prev) => (prev ? { ...prev, ...form } : prev));
      setEditMode(false);
      showSnackbar('Contacto actualizado exitosamente', 'success');
    } else {
      showSnackbar('Error al actualizar el contacto', 'error');
    }
  };

  const handleCancel = () => {
    if (contacto) {
      setForm({ full_name: contacto.full_name, email: contacto.email, phone_number: contacto.phone_number });
    }
    setErrores({});
    setEditMode(false);
  };

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#004a99' }} />
      </Box>
    );
  }

  if (errorMsg || !contacto) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{errorMsg || 'Contacto no encontrado'}</Alert>
      </Box>
    );
  }

  const displayName = editMode ? form.full_name || contacto.full_name : contacto.full_name;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: 'white' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/contactos')}
              sx={{ textTransform: 'none', color: '#64748b', pl: 0, '&:hover': { color: '#004a99', bgcolor: 'transparent' } }}
            >
              Volver al directorio
            </Button>
            <Typography variant="h5" fontWeight={800} color="#0f172a" sx={{ mt: 0.5 }}>
              Detalle del Contacto
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Revisa y gestiona la información del contacto.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            {!editMode ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
                sx={{ bgcolor: '#004a99', borderRadius: '12px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#003580' } }}
              >
                Edit Contact
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, borderColor: '#e2e8f0', color: '#475569' }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={guardando}
                  sx={{ bgcolor: '#004a99', borderRadius: '12px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#003580' } }}
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Body */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Left: Profile card */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: 'white', width: 240, flexShrink: 0 }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: getColor(contacto.id), width: 72, height: 72, fontSize: '1.5rem', mx: 'auto', mb: 1.5 }}>
              {getIniciales(displayName)}
            </Avatar>
            <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ wordBreak: 'break-word' }}>
              {displayName}
            </Typography>
            <Chip
              label={contacto.department_id || 'Sin área'}
              size="small"
              variant="outlined"
              sx={{ mt: 1, borderColor: '#004a99', color: '#004a99', fontWeight: 600 }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Datos del Sistema
          </Typography>
          <Stack spacing={1.5} mt={1.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">Vis. Preference</Typography>
              <Chip
                label={contacto.visibility_type}
                size="small"
                color={chipColor(contacto.visibility_type)}
                variant="outlined"
              />
            </Box>
            {contacto.date_created && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">Creado</Typography>
                <Typography variant="caption" fontWeight={600}>
                  {new Date(contacto.date_created).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">System ID</Typography>
              <Typography variant="caption" fontWeight={700} color="#004a99">
                USR-{String(contacto.id).padStart(4, '0')}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Right: Editable info */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: 'white', flex: 1, minWidth: 0 }}>
          <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Información de Contacto
          </Typography>

          <Stack spacing={2.5} mt={2}>
            {/* Full name */}
            <Box>
              <Typography variant="body2" fontWeight={600} color="#374151" mb={0.8}>
                Nombre Completo <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={form.full_name}
                onChange={(e) => {
                  setForm((p) => ({ ...p, full_name: e.target.value.replace(/[0-9]/g, '') }));
                  setErrores((p) => ({ ...p, full_name: '' }));
                }}
                disabled={!editMode}
                error={!!errores.full_name}
                helperText={errores.full_name}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {/* Email */}
              <Box flex={1} sx={{ minWidth: 200 }}>
                <Typography variant="body2" fontWeight={600} color="#374151" mb={0.8}>
                  Correo Electrónico <span style={{ color: '#ef4444' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={form.email}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, email: e.target.value }));
                    setErrores((p) => ({ ...p, email: '' }));
                  }}
                  disabled={!editMode}
                  error={!!errores.email}
                  helperText={errores.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
              </Box>

              {/* Phone */}
              <Box flex={1} sx={{ minWidth: 200 }}>
                <Typography variant="body2" fontWeight={600} color="#374151" mb={0.8}>
                  Teléfono Principal
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={form.phone_number}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, phone_number: e.target.value.replace(/[^0-9+\s]/g, '') }));
                  }}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
              </Box>
            </Box>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Asignación Organizacional
          </Typography>
          <Box mt={2}>
            <Typography variant="body2" fontWeight={600} color="#374151" mb={0.8}>
              Departamento
            </Typography>
            <Chip
              label={contacto.department_id || 'Sin área'}
              variant="outlined"
              sx={{ borderColor: '#004a99', color: '#004a99', fontWeight: 600 }}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
