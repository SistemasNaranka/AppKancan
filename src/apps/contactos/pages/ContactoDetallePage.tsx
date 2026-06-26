import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Avatar, Chip, Stack,
  Paper, CircularProgress, Alert, Divider, InputAdornment,
  RadioGroup, FormControlLabel, Radio, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Autocomplete,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { getContactoById, getContactUsers, getDirectusUsers } from '../api/directus/read';
import { updateContacto, linkUserToContact, unlinkUserFromContact } from '../api/directus/create';
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
  const [form, setForm] = useState({ full_name: '', email: '', phone_number: '', visibility_type: 'Universal' as Contactos['visibility_type'] });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [usuariosVinculados, setUsuariosVinculados] = useState<{ id: string; first_name: string; last_name: string; status?: string }[]>([]);
  const [openVinculacionModal, setOpenVinculacionModal] = useState(false);
  const [todosLosUsuarios, setTodosLosUsuarios] = useState<{ id: string; first_name: string; last_name: string; email?: string }[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [guardandoVinculacion, setGuardandoVinculacion] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setCargando(true);
      const [data, users] = await Promise.all([
        getContactoById(Number(id)),
        getContactUsers(Number(id)),
      ]);
      if (data) {
        setContacto(data);
        setForm({ full_name: data.full_name, email: data.email, phone_number: data.phone_number, visibility_type: data.visibility_type });
        setUsuariosVinculados(users);
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
    const cleanPhone = form.phone_number.replace(/\s+/g, '');
    try {
      const ok = await updateContacto(contacto.id, {
        full_name: form.full_name,
        email: form.email,
        phone_number: cleanPhone,
        visibility_type: form.visibility_type,
      });
      setGuardando(false);
      if (ok) {
        setContacto((prev) => (prev ? { ...prev, full_name: form.full_name, email: form.email, phone_number: cleanPhone, visibility_type: form.visibility_type } : prev));
        setEditMode(false);
        showSnackbar('Contacto actualizado exitosamente', 'success');
      } else {
        showSnackbar('Error al actualizar el contacto', 'error');
      }
    } catch (err: any) {
      setGuardando(false);
      if (err.message === 'phone_number_not_unique') {
        setErrores((prev) => ({ ...prev, phone_number: 'Este número de teléfono ya existe' }));
        showSnackbar('El número de teléfono ya está registrado en otro contacto', 'error');
      } else {
        showSnackbar('Error al actualizar el contacto', 'error');
      }
    }
  };

  const handleCancel = () => {
    if (contacto) {
      setForm({ full_name: contacto.full_name, email: contacto.email, phone_number: contacto.phone_number, visibility_type: contacto.visibility_type });
    }
    setErrores({});
    setEditMode(false);
  };

  const handleOpenVinculacionModal = async () => {
    setOpenVinculacionModal(true);
    setCargandoUsuarios(true);
    const users = await getDirectusUsers();
    setTodosLosUsuarios(users);
    setCargandoUsuarios(false);
  };

  const handleLinkUser = async () => {
    if (!usuarioSeleccionado || !contacto) return;
    setGuardandoVinculacion(true);
    const ok = await linkUserToContact(contacto.id, usuarioSeleccionado);
    setGuardandoVinculacion(false);
    if (ok) {
      const userObj = todosLosUsuarios.find((u) => u.id === usuarioSeleccionado);
      if (userObj) {
        setUsuariosVinculados((prev) => {
          const index = prev.findIndex((u) => u.id === usuarioSeleccionado);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = { ...updated[index], status: 'Activo' };
            return updated;
          } else {
            return [...prev, { ...userObj, status: 'Activo' }];
          }
        });
      }
      setUsuarioSeleccionado('');
      setOpenVinculacionModal(false);
      showSnackbar('Usuario vinculado exitosamente', 'success');
    } else {
      showSnackbar('Error al vincular el usuario', 'error');
    }
  };

  const handleUnlinkUser = async (userId: string) => {
    if (!contacto) return;
    const ok = await unlinkUserFromContact(contacto.id, userId);
    if (ok) {
      setUsuariosVinculados((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'Inactivo' } : u))
      );
      showSnackbar('Usuario desvinculado exitosamente', 'success');
    } else {
      showSnackbar('Error al desvincular el usuario', 'error');
    }
  };

  const handleRelinkUser = async (userId: string) => {
    if (!contacto) return;
    const ok = await linkUserToContact(contacto.id, userId);
    if (ok) {
      setUsuariosVinculados((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'Activo' } : u))
      );
      showSnackbar('Usuario vinculado exitosamente', 'success');
    } else {
      showSnackbar('Error al vincular el usuario', 'error');
    }
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

  const usuariosDisponibles = todosLosUsuarios.filter(
    (u) => !usuariosVinculados.some((uv) => uv.id === u.id && uv.status === 'Activo')
  );

  const hasChanges = contacto ? (
    (form.full_name || '').trim() !== (contacto.full_name || '').trim() ||
    (form.email || '').trim() !== (contacto.email || '').trim() ||
    (form.phone_number || '').trim() !== (contacto.phone_number || '').trim() ||
    form.visibility_type !== contacto.visibility_type
  ) : false;

  const displayName = editMode ? form.full_name || contacto.full_name : contacto.full_name;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 3, px: { xs: 2, md: 4 }, pb: { xs: 2, md: 4 } }}>
      {/* Header sticky */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: 'white', position: 'sticky', top: 0, zIndex: 100, mt: { xs: 2, md: 4 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              onClick={() => navigate('/contactos')}
              sx={{ bgcolor: '#004a99', color: 'white', borderRadius: '10px', width: 40, height: 40, '&:hover': { bgcolor: '#003580' } }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Box>
              <Typography variant="h5" fontWeight={800} color="#0f172a">
                Detalle del Contacto
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Revisa y gestiona la información del contacto.
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={2}>
            {!editMode ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
                sx={{ bgcolor: '#004a99', borderRadius: '12px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#003580' } }}
              >
                Editar contacto
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, borderColor: '#e2e8f0', color: '#475569', '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' } }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={guardando || !hasChanges}
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
        {/* Left column */}
        <Box sx={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Profile card */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: 'white' }}>
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
                <Typography variant="caption" color="text.secondary">Visibilidad</Typography>
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
                  ID-{String(contacto.id)}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Usuarios Vinculados card */}
          {(contacto.visibility_type === 'Restringido' || usuariosVinculados.length > 0) && (
            <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: 'white' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                  Usuarios Vinculados
                </Typography>
                {contacto.visibility_type === 'Restringido' && (
                  <IconButton
                    size="small"
                    onClick={handleOpenVinculacionModal}
                    sx={{
                      bgcolor: '#f1f5f9',
                      color: '#004a99',
                      '&:hover': { bgcolor: '#e2e8f0' },
                      width: 28,
                      height: 28
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
              {usuariosVinculados.length === 0 ? (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  Ningún usuario vinculado
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {usuariosVinculados.map((u) => (
                    <Box key={u.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: '#004a99' }}>
                          {`${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} color="#0f172a">
                            {u.first_name} {u.last_name}
                          </Typography>
                          {u.status === 'Inactivo' && (
                            <Typography variant="caption" color="error" sx={{ fontWeight: 600, display: 'block' }}>
                              Inactivo / Desvinculado
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      {contacto.visibility_type === 'Restringido' && u.status !== 'Inactivo' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleUnlinkUser(u.id)}
                          title="Desvincular usuario"
                          sx={{ '&:hover': { bgcolor: '#fee2e2' } }}
                        >
                          <LinkOffIcon fontSize="small" />
                        </IconButton>
                      )}
                      {contacto.visibility_type === 'Restringido' && u.status === 'Inactivo' && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleRelinkUser(u.id)}
                          title="Vincular nuevamente"
                          sx={{ '&:hover': { bgcolor: '#e0f2fe' } }}
                        >
                          <LinkIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          )}
        </Box>

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
                  Teléfono
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={form.phone_number}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, phone_number: e.target.value.replace(/[^0-9+\s]/g, '') }));
                    setErrores((prev) => ({ ...prev, phone_number: '' }));
                  }}
                  disabled={!editMode}
                  error={!!errores.phone_number}
                  helperText={errores.phone_number}
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

            {editMode && (
              <Box>
                <Typography variant="body2" fontWeight={600} color="#374151" mb={0.8}>
                  Tipo de Visibilidad
                </Typography>
                <RadioGroup
                  row
                  value={form.visibility_type}
                  onChange={(e) => setForm((p) => ({ ...p, visibility_type: e.target.value as Contactos['visibility_type'] }))}
                >
                  <FormControlLabel value="Universal" control={<Radio size="small" sx={{ color: '#004a99', '&.Mui-checked': { color: '#004a99' } }} />} label="Universal" />
                  <FormControlLabel value="Restringido" control={<Radio size="small" sx={{ color: '#004a99', '&.Mui-checked': { color: '#004a99' } }} />} label="Restringido" />
                  <FormControlLabel value="Inactivo" control={<Radio size="small" sx={{ color: '#004a99', '&.Mui-checked': { color: '#004a99' } }} />} label="Inactivo" />
                </RadioGroup>
              </Box>
            )}
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Asignación Organizacional
          </Typography>
          <Box mt={2}>
            <Typography variant="body2" fontWeight={600} color="#374151" mb={0.8}>
              Área
            </Typography>
            <Chip
              label={contacto.department_id || 'Sin área'}
              variant="outlined"
              sx={{ borderColor: '#004a99', color: '#004a99', fontWeight: 600 }}
            />
          </Box>
        </Paper>
      </Box>

      {/* Modal para Vincular Usuario */}
      <Dialog
        open={openVinculacionModal}
        onClose={() => setOpenVinculacionModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
          Vincular Usuario
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Selecciona un usuario de Directus para vincular a este contacto restringido.
          </Typography>
          {cargandoUsuarios ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} sx={{ color: '#004a99' }} />
            </Box>
          ) : usuariosDisponibles.length === 0 ? (
            <Typography variant="body2" color="error" fontStyle="italic">
              No hay usuarios disponibles para vincular.
            </Typography>
          ) : (
            <Autocomplete
              fullWidth
              size="small"
              sx={{ mt: 1 }}
              options={usuariosDisponibles}
              getOptionLabel={(option) => option.email ? `${option.first_name} ${option.last_name} (${option.email})` : `${option.first_name} ${option.last_name}`}
              value={usuariosDisponibles.find((u) => u.id === usuarioSeleccionado) || null}
              onChange={(event, newValue) => {
                setUsuarioSeleccionado(newValue ? newValue.id : '');
              }}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {option.first_name} {option.last_name}
                    </Typography>
                    {option.email && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {option.email}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Usuario"
                  placeholder="Escribe para buscar..."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
              )}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenVinculacionModal(false)}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              color: '#475569'
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleLinkUser}
            disabled={!usuarioSeleccionado || guardandoVinculacion}
            sx={{
              bgcolor: '#004a99',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { bgcolor: '#003580' }
            }}
          >
            {guardandoVinculacion ? 'Vinculando...' : 'Vincular'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
