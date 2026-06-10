import { useState } from 'react';
import {
  Card, Typography, Button, Box, IconButton, Stack, Chip, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, FormControl, InputLabel, Select,
  Divider, Alert, Snackbar, CircularProgress
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DiningIcon from '@mui/icons-material/Dining';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { EmpleadoAsistencia } from '../interfaces/horarios.interface';
import dayjs from 'dayjs';

interface EmployeeCardProps {
  empleado: EmpleadoAsistencia;
  tiposNovedad: { id: number; name: string }[];
  onRegistrarEvento: (idEmpleado: string, tipoEvento: string) => void;
  onEliminarEmpleado: (idEmpleado: string) => void;
  onGuardarObservacion: (idEmpleado: string, evento: string, texto: string) => void;
  onAgregarNovedad: (novedad: {
    empleadoId: string;
    empleadoNombre: string;
    tipo: string;
    fecha: string;
    observaciones: string;
    fechaRegistro: string;
  }) => void;
}

const getIcon = (etiqueta: string) => {
  switch (etiqueta) {
    case 'Comenzar Jornada': return <PlayArrowIcon fontSize="small" />;
    case 'Iniciar Almuerzo': return <RestaurantIcon fontSize="small" />;
    case 'Finalizar Almuerzo': return <DiningIcon fontSize="small" />;
    case 'Terminar Jornada': return <ExitToAppIcon fontSize="small" />;
    default: return null;
  }
};

export default function EmployeeCard({ empleado, tiposNovedad, onRegistrarEvento, onEliminarEmpleado, onGuardarObservacion, onAgregarNovedad }: EmployeeCardProps) {
  if (!empleado) {
    return (
      <Card sx={{ width: 380, borderRadius: 3, p: 4, textAlign: 'center' }}>
        <CircularProgress size={40} />
        <Typography sx={{ mt: 2 }}>Cargando empleado...</Typography>
      </Card>
    );
  }

  const { id, nombre, estadoActual, registros } = empleado;

  const [novedadModalOpen, setNovedadModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    novedad: '',
    fecha: dayjs().format('YYYY-MM-DD'), // Formato por defecto de input date nativo
    observaciones: ''
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [eventoActual, setEventoActual] = useState('');
  const [observacionTexto, setObservacionTexto] = useState('');

  const botones = [
    { etiqueta: 'Comenzar Jornada', activo: estadoActual === 'entrada_pendiente', hora: registros.inicioJornada },
    { etiqueta: 'Iniciar Almuerzo', activo: estadoActual === 'jornada_iniciada', hora: registros.inicioAlmuerzo },
    { etiqueta: 'Finalizar Almuerzo', activo: estadoActual === 'en_almuerzo', hora: registros.finAlmuerzo },
    { etiqueta: 'Terminar Jornada', activo: estadoActual === 'regreso_almuerzo', hora: registros.finJornada },
  ];

  const novedadActiva = estadoActual === 'entrada_pendiente';
  const finalizado = estadoActual === 'jornada_finalizada';

  const getObservacion = (evento: string) => {
    if (!registros.observaciones) return '';
    switch (evento) {
      case 'Comenzar Jornada': return registros.observaciones.inicioJornada || '';
      case 'Iniciar Almuerzo': return registros.observaciones.inicioAlmuerzo || '';
      case 'Finalizar Almuerzo': return registros.observaciones.finAlmuerzo || '';
      case 'Terminar Jornada': return registros.observaciones.finJornada || '';
      default: return '';
    }
  };

  const handleOpenNovedadModal = () => {
    setFormData({ novedad: '', fecha: dayjs().format('YYYY-MM-DD'), observaciones: '' });
    setNovedadModalOpen(true);
  };

  const handleCloseNovedadModal = () => setNovedadModalOpen(false);

  const handleGuardarNovedad = () => {
    if (!formData.novedad) {
      alert('Seleccione una novedad');
      return;
    }
    if (!formData.fecha) {
      alert('Seleccione una fecha');
      return;
    }

    const fechaRegistro = dayjs().format('DD/MM/YYYY HH:mm:ss');

    const nuevaNovedad = {
      empleadoId: id,
      empleadoNombre: nombre,
      tipo: formData.novedad,
      fecha: formData.fecha, // 🚀 CLAVE: Dejamos el string YYYY-MM-DD nativo para que Directus no falle con report_date
      observaciones: formData.observaciones,
      fechaRegistro: fechaRegistro,
    };

    onAgregarNovedad(nuevaNovedad);
    onEliminarEmpleado(id);

    setSnackbarMessage(`Novedad "${formData.novedad}" registrada`);
    setSnackbarOpen(true);
    handleCloseNovedadModal();
  };

  const handleOpenObsModal = (evento: string) => {
    setEventoActual(evento);
    setObservacionTexto(getObservacion(evento));
    setObsModalOpen(true);
  };

  const handleCloseObsModal = () => {
    setObsModalOpen(false);
    setObservacionTexto('');
    setEventoActual('');
  };

  const handleGuardarObservacion = () => {
    onGuardarObservacion(id, eventoActual, observacionTexto);
    setSnackbarMessage(`Observación guardada para "${eventoActual}"`);
    setSnackbarOpen(true);
    handleCloseObsModal();
  };

  const maxLength = 500;

  return (
    <>
      <Card sx={{ width: 380, borderRadius: 3, overflow: 'hidden', boxShadow: finalizado ? 'none' : '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <Box sx={{ bgcolor: '#004a99', color: 'white', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', textTransform: 'capitalize' }}>{nombre}</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title={novedadActiva ? 'Registrar novedad' : 'No disponible'}>
              <span>
                <IconButton size="small" disabled={!novedadActiva} onClick={handleOpenNovedadModal} sx={{ color: novedadActiva ? '#ffd966' : 'rgba(255,255,255,0.5)' }}>
                  <ReportProblemIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Chip label={estadoActual.replace(/_/g, ' ').toUpperCase()} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 'bold', fontSize: '0.65rem', height: 24 }} />
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            {botones.map((btn, idx) => {
              const yaHecho = !!btn.hora;
              const bloqueado = !btn.activo && !yaHecho;
              const observacionGuardada = getObservacion(btn.etiqueta);
              const obsEnabled = yaHecho || btn.activo;

              return (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    fullWidth
                    variant={btn.activo ? 'contained' : yaHecho ? 'outlined' : 'text'}
                    disabled={bloqueado || finalizado}
                    onClick={() => onRegistrarEvento(id, btn.etiqueta)}
                    endIcon={yaHecho ? <CheckCircleOutlineIcon color="success" /> : getIcon(btn.etiqueta)}
                    sx={{
                      justifyContent: 'space-between',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: btn.activo ? '#004a99' : yaHecho ? 'transparent' : 'transparent',
                      color: btn.activo ? '#fff' : yaHecho ? '#16a34a' : '#94a3b8',
                      borderColor: yaHecho ? '#cbd5e1' : 'transparent',
                      '&:hover': {
                        bgcolor: btn.activo ? '#003366' : yaHecho ? '#f0fdf4' : 'transparent',
                        transform: btn.activo ? 'translateY(-1px)' : 'none',
                      },
                    }}
                  >
                    <span>{btn.etiqueta}</span>
                    {btn.hora && <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{btn.hora}</span>}
                  </Button>

                  <Tooltip title={observacionGuardada ? `Observación: ${observacionGuardada.substring(0, 80)}...` : (obsEnabled ? 'Agregar observación' : 'No disponible')} arrow>
                    <span>
                      <IconButton
                        size="small"
                        disabled={!obsEnabled}
                        onClick={() => obsEnabled && handleOpenObsModal(btn.etiqueta)}
                        sx={{ border: '1px solid', borderColor: '#cbd5e1', borderRadius: 1.5, color: '#004a99', '&:hover': { bgcolor: '#f1f5f9' } }}
                      >
                        <AssignmentIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              );
            })}
          </Stack>
          {finalizado && (
            <Box sx={{ mt: 2, textAlign: 'center', bgcolor: '#f0fdf4', py: 1, borderRadius: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#16a34a' }}>✅ Jornada completada</Typography>
            </Box>
          )}
        </Box>
      </Card>

      {/* Modal de Novedad */}
      <Dialog open={novedadModalOpen} onClose={handleCloseNovedadModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ bgcolor: '#004a99', color: '#fff', py: 2, px: 3 }}>Registro de Novedad</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Novedad</InputLabel>
              <Select
                value={formData.novedad}
                label="Novedad"
                onChange={(e) => setFormData({ ...formData, novedad: e.target.value })}
              >
                {/* 🚀 Protegido con cortocircuito en array por seguridad */}
                {(tiposNovedad || []).map(tipo => (
                  <MenuItem key={tipo.id} value={tipo.name}>{tipo.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Hasta el día" type="date" fullWidth value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Observaciones" multiline rows={3} fullWidth value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} placeholder="Detalle adicional..." />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCloseNovedadModal} variant="outlined" color="error">Cancelar</Button>
          <Button onClick={handleGuardarNovedad} variant="contained" sx={{ bgcolor: '#004a99' }}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Observaciones */}
      <Dialog open={obsModalOpen} onClose={handleCloseObsModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, boxShadow: '0 20px 35px rgba(0,0,0,0.1)' } }}>
        <DialogTitle sx={{ bgcolor: '#004a99', color: '#fff', py: 2, px: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Observaciones del evento</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>{eventoActual} • {nombre}</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>Registre o edite la nota. Máximo {maxLength} caracteres.</Alert>
          <TextField
            fullWidth
            multiline
            rows={5}
            placeholder="Escriba aquí la observación..."
            value={observacionTexto}
            onChange={(e) => setObservacionTexto(e.target.value.slice(0, maxLength))}
            helperText={`${observacionTexto.length}/${maxLength} caracteres`}
            FormHelperTextProps={{ sx: { textAlign: 'right', mt: 1, fontWeight: 500 } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fafcff' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2, bgcolor: '#f8fafc' }}>
          <Button onClick={handleCloseObsModal} variant="outlined" color="error" sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleGuardarObservacion} variant="contained" sx={{ bgcolor: '#004a99', borderRadius: 2, px: 4, fontWeight: 600 }}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" sx={{ width: '100%' }}>{snackbarMessage}</Alert>
      </Snackbar>
    </>
  );
}