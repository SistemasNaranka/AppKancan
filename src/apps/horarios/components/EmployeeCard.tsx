import { useState, useEffect } from 'react';
import {
  Card, Typography, Button, Box, IconButton, Stack, Chip, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem,
  Divider, Alert, CircularProgress
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningIcon from '@mui/icons-material/Warning';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DiningIcon from '@mui/icons-material/Dining';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { EmpleadoAsistencia } from '../interfaces/horarios.interface';
import EditHourModal from './EditHourModal';
import dayjs from 'dayjs';
import * as yup from 'yup';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import 'dayjs/locale/es';

interface EmployeeCardProps {
  empleado: EmpleadoAsistencia;
  tiposNovedad: { id: number; name: string }[];
  onRegistrarEvento: (idEmpleado: string, tipoEvento: string, horaOverride?: string, observacionOverride?: string) => Promise<void> | void;
  onEliminarEmpleado: (idEmpleado: string) => void;
  onGuardarObservacion: (idEmpleado: string, evento: string, texto: string) => void;
  onAgregarNovedad: (novedad: {
    empleadoId: string;
    empleadoNombre: string;
    tipo: string;
    fechaInicio: string;
    fechaFin: string;
    observaciones: string;
    fechaRegistro: string;
  }) => Promise<boolean> | boolean | any;
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

const formatTo12Hour = (timeStr: string | null): string => {
  if (!timeStr) return '';
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');
  return `${hoursStr}:${minutes} ${ampm}`;
};

const getEventKey = (evento: string): string => {
  switch (evento) {
    case 'Comenzar Jornada': return 'inicioJornada';
    case 'Iniciar Almuerzo': return 'inicioAlmuerzo';
    case 'Finalizar Almuerzo': return 'finAlmuerzo';
    case 'Terminar Jornada': return 'finJornada';
    default: return '';
  }
};

export default function EmployeeCard({
  empleado, tiposNovedad, onRegistrarEvento,
  onEliminarEmpleado, onGuardarObservacion, onAgregarNovedad
}: EmployeeCardProps) {
  if (!empleado) {
    return (
      <Card sx={{ width: 380, borderRadius: 3, p: 4, textAlign: 'center' }}>
        <CircularProgress size={40} />
        <Typography sx={{ mt: 2 }}>Cargando empleado...</Typography>
      </Card>
    );
  }

  const { id, nombre, estadoActual, registros } = empleado;

  // Estados para modales
  const [novedadModalOpen, setNovedadModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    novedad: '',
    fechaInicio: dayjs().format('YYYY-MM-DD'),
    fechaFin: dayjs().format('YYYY-MM-DD'),
    observaciones: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Modales reutilizables para observaciones y hora
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [eventoActualObs, setEventoActualObs] = useState('');
  const [observacionTexto, setObservacionTexto] = useState('');

  const [horaModalOpen, setHoraModalOpen] = useState(false);
  const [eventoActualHora, setEventoActualHora] = useState('');

  // Estados para comparar si hubo cambios reales
  const [obsInicialModal, setObsInicialModal] = useState('');

  // Esquema de validación para novedades
  const novedadSchema = yup.object().shape({
    novedad: yup.string().required('El tipo de novedad es obligatorio'),
    fechaInicio: yup.string().required('La fecha de inicio es obligatoria'),
    fechaFin: yup.string().required('La fecha de fin es obligatoria')
      .test('is-after-or-equal', 'La fecha fin debe ser igual o posterior a la de inicio', function (value) {
        const { fechaInicio } = this.parent;
        if (!fechaInicio || !value) return true;
        return dayjs(value).isSame(dayjs(fechaInicio), 'day') || dayjs(value).isAfter(dayjs(fechaInicio), 'day');
      }),
    observaciones: yup.string().max(500, 'Máximo 500 caracteres')
  });

  const botones = [
    { etiqueta: 'Comenzar Jornada', activo: estadoActual === 'entrada_pendiente', hora: registros.inicioJornada },
    { etiqueta: 'Iniciar Almuerzo', activo: estadoActual === 'jornada_iniciada', hora: registros.inicioAlmuerzo },
    { etiqueta: 'Finalizar Almuerzo', activo: estadoActual === 'en_almuerzo', hora: registros.finAlmuerzo },
    { etiqueta: 'Terminar Jornada', activo: estadoActual === 'regreso_almuerzo', hora: registros.finJornada },
  ];

  const novedadActiva = estadoActual === 'entrada_pendiente';
  const finalizado = estadoActual === 'jornada_finalizada';

  // Obtener observación para un evento específico
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

  // Obtener hora actual para un evento específico (si existe)
  const getHoraEvento = (evento: string): string | null => {
    switch (evento) {
      case 'Comenzar Jornada': return registros.inicioJornada;
      case 'Iniciar Almuerzo': return registros.inicioAlmuerzo;
      case 'Finalizar Almuerzo': return registros.finAlmuerzo;
      case 'Terminar Jornada': return registros.finJornada;
      default: return null;
    }
  };

  // ─── Modal de novedad ─────────────────────────────────────
  const handleOpenNovedadModal = () => {
    setFormData({ novedad: '', fechaInicio: dayjs().format('YYYY-MM-DD'), fechaFin: dayjs().format('YYYY-MM-DD'), observaciones: '' });
    setFormErrors({});
    setNovedadModalOpen(true);
  };
  const handleCloseNovedadModal = () => setNovedadModalOpen(false);

  const handleGuardarNovedad = async () => {
    try {
      setFormErrors({});
      await novedadSchema.validate(formData, { abortEarly: false });
      const success = await onAgregarNovedad({
        empleadoId: id, empleadoNombre: nombre, tipo: formData.novedad,
        fechaInicio: formData.fechaInicio, fechaFin: formData.fechaFin,
        observaciones: formData.observaciones, fechaRegistro: dayjs().format('DD/MM/YYYY HH:mm:ss'),
      });
      if (success) { onEliminarEmpleado(id); handleCloseNovedadModal(); }
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        err.inner.forEach((e) => { if (e.path) errors[e.path] = e.message; });
        setFormErrors(errors);
      }
    }
  };

  // ─── Modal de observación (libreta) para cualquier evento ─────
  const handleOpenObsModal = (evento: string) => {
    setEventoActualObs(evento);
    const obs = getObservacion(evento);
    setObservacionTexto(obs);
    setObsInicialModal(obs);
    setObsModalOpen(true);
  };
  const handleCloseObsModal = () => {
    setObsModalOpen(false);
    setObservacionTexto('');
    setEventoActualObs('');
  };
  const handleGuardarObservacion = async () => {
    await onGuardarObservacion(id, eventoActualObs, observacionTexto);
    handleCloseObsModal();
  };

  // ─── Modal de edición de hora (reloj) para cualquier evento ───
  const handleOpenHoraModal = (evento: string) => {
    setEventoActualHora(evento);
    setHoraModalOpen(true);
  };

  // Un botón tiene reloj solo si ya existe la hora asociada (o si el evento permite edición)
  // Para simplificar, mostramos el reloj siempre que el botón esté activo o ya haya hora
  const maxLength = 500;



  return (
    <>
      <Card sx={{ width: 380, borderRadius: 3, overflow: 'hidden', boxShadow: finalizado ? 'none' : '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <Box sx={{ bgcolor: '#004a99', color: 'white', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', textTransform: 'capitalize', lineHeight: 1.2 }}>{nombre}</Typography>
            {empleado.cargo && (
              <Typography sx={{ fontWeight: 500, fontSize: '0.7rem', opacity: 0.85, textTransform: 'uppercase', mt: 0.3, letterSpacing: '0.5px' }}>
                {empleado.cargo}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title={novedadActiva ? 'Registrar novedad' : 'No disponible'}>
              <span>
                <IconButton
                  size="medium"
                  disabled={!novedadActiva}
                  onClick={handleOpenNovedadModal}
                  sx={{
                    color: novedadActiva ? '#ffd966' : 'rgba(255,255,255,0.3)',
                    '&:hover': {
                      bgcolor: novedadActiva ? 'rgba(255, 217, 102, 0.08)' : 'transparent',
                    },
                    '&.Mui-disabled': {
                      color: 'rgba(255,255,255,0.3)',
                    }
                  }}
                >
                  <WarningIcon fontSize="medium" />
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
              const obsEnabled = yaHecho; // solo se puede agregar observación si ya hay hora registrada
              const relojEnabled = yaHecho; // reloj editable solo si ya existe hora

              return (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

                  {/* Ícono de reloj (editar hora) - para todos los eventos */}
                  <Tooltip title={relojEnabled ? 'Editar hora' : 'No disponible'}>
                    <span>
                      <IconButton
                        size="small"
                        disabled={!relojEnabled}
                        onClick={() => handleOpenHoraModal(btn.etiqueta)}
                        sx={{
                          border: '1px solid',
                          borderColor: relojEnabled ? '#cbd5e1' : '#e2e8f0',
                          borderRadius: 1.5,
                          color: relojEnabled ? '#004a99' : '#cbd5e1',
                          '&:hover': { bgcolor: relojEnabled ? '#f1f5f9' : 'transparent' }
                        }}
                      >
                        <AccessTimeIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>

                  {/* Botón principal */}
                  <Button
                    fullWidth
                    variant={btn.activo ? 'contained' : yaHecho ? 'outlined' : 'text'}
                    disabled={bloqueado || finalizado}
                    onClick={yaHecho ? undefined : () => onRegistrarEvento(id, btn.etiqueta)}
                    endIcon={yaHecho ? <CheckCircleOutlineIcon color="success" /> : getIcon(btn.etiqueta)}
                    sx={{
                      justifyContent: 'space-between',
                      textTransform: 'uppercase',
                      fontSize: '12px',
                      fontWeight: 700,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: btn.activo ? '#004a99' : 'transparent',
                      color: btn.activo ? '#fff' : yaHecho ? '#16a34a' : '#94a3b8',
                      borderColor: yaHecho ? '#cbd5e1' : 'transparent',
                      cursor: yaHecho ? 'default' : 'pointer',
                      '&:hover': {
                        bgcolor: btn.activo ? '#003366' : 'transparent',
                        transform: btn.activo ? 'translateY(-1px)' : 'none',
                      },
                    }}
                  >
                    <span>{btn.etiqueta}</span>
                    {btn.hora && <span style={{ fontSize: '12px', fontWeight: 600 }}>{formatTo12Hour(btn.hora)}</span>}
                  </Button>

                  {/* Ícono de libreta (observación) - para todos los eventos */}
                  <Tooltip title={observacionGuardada ? `Observación: ${observacionGuardada.substring(0, 80)}...` : (obsEnabled ? 'Agregar observación' : 'No disponible')} arrow>
                    <span>
                      <IconButton
                        size="small"
                        disabled={!obsEnabled}
                        onClick={() => obsEnabled && handleOpenObsModal(btn.etiqueta)}
                        sx={{
                          border: '1px solid',
                          borderColor: obsEnabled ? '#cbd5e1' : '#e2e8f0',
                          borderRadius: 1.5,
                          color: obsEnabled ? '#004a99' : '#cbd5e1',
                          '&:hover': { bgcolor: obsEnabled ? '#f1f5f9' : 'transparent' }
                        }}
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

      {/* Modal de edición de hora (reutilizable para cualquier evento) */}
      <EditHourModal
        open={horaModalOpen}
        onClose={() => setHoraModalOpen(false)}
        employeeName={nombre}
        eventName={eventoActualHora}
        initialTimeStr={getHoraEvento(eventoActualHora)}
        initialObservation={getObservacion(eventoActualHora)}
        onConfirm={async (horaFormateada, observacion) => {
          await onRegistrarEvento(id, eventoActualHora, horaFormateada, observacion);
        }}
      />

      {/* Modal de observación (libreta) reutilizable */}
      <Dialog open={obsModalOpen} onClose={handleCloseObsModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle component="div" sx={{ bgcolor: '#004a99', color: '#fff', py: 2, px: 3 }}>
          <Typography component="span" variant="h6" sx={{ fontWeight: 600, display: 'block' }}>Observaciones del evento</Typography>
          <Typography component="span" variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>{eventoActualObs} • {nombre}</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>Registre o edite la nota. Máximo {maxLength} caracteres.</Alert>
          <TextField fullWidth multiline rows={5} placeholder="Escriba aquí la observación..." value={observacionTexto} onChange={(e) => setObservacionTexto(e.target.value.slice(0, maxLength))} helperText={`${observacionTexto.length}/${maxLength} caracteres`} slotProps={{ formHelperText: { sx: { textAlign: 'right', mt: 1, fontWeight: 500 } } }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fafcff' } }} />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2, bgcolor: '#f8fafc' }}>
          <Button onClick={handleCloseObsModal} variant="outlined" color="error" sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleGuardarObservacion} variant="contained" disabled={observacionTexto === obsInicialModal} sx={{ bgcolor: '#004a99', borderRadius: 2, px: 4, fontWeight: 600 }}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de novedad */}
      <Dialog open={novedadModalOpen} onClose={handleCloseNovedadModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ bgcolor: '#004a99', color: '#fff', py: 2, px: 3 }}>Registro de Novedad</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <FormControl fullWidth error={!!formErrors.novedad}>
              <InputLabel id="novedad-select-label">Novedad</InputLabel>
              <Select labelId="novedad-select-label" value={formData.novedad} label="Novedad" onChange={(e) => setFormData({ ...formData, novedad: e.target.value })}>
                {(tiposNovedad || []).map(tipo => <MenuItem key={tipo.id} value={tipo.name}>{tipo.name}</MenuItem>)}
              </Select>
              {formErrors.novedad && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{formErrors.novedad}</Typography>}
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
              <Box sx={{ display: 'flex', gap: 2 }}>
                <DatePicker label="Desde el día" format="DD/MM/YYYY" value={dayjs(formData.fechaInicio)} onChange={(v: any) => setFormData({ ...formData, fechaInicio: v ? v.format('YYYY-MM-DD') : '' })} slotProps={{ textField: { fullWidth: true, error: !!formErrors.fechaInicio, helperText: formErrors.fechaInicio } }} />
                <DatePicker label="Hasta el día" format="DD/MM/YYYY" value={dayjs(formData.fechaFin)} onChange={(v: any) => setFormData({ ...formData, fechaFin: v ? v.format('YYYY-MM-DD') : '' })} slotProps={{ textField: { fullWidth: true, error: !!formErrors.fechaFin, helperText: formErrors.fechaFin } }} />
              </Box>
            </LocalizationProvider>
            <TextField label="Observaciones" multiline rows={3} fullWidth value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} placeholder="Detalle adicional..." error={!!formErrors.observaciones} helperText={formErrors.observaciones} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCloseNovedadModal} variant="outlined" color="error">Cancelar</Button>
          <Button onClick={handleGuardarNovedad} variant="contained" sx={{ bgcolor: '#004a99' }}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}