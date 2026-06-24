import { useState, useEffect, useRef } from 'react';
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
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import { EmpleadoAsistencia, Motivo } from '../interfaces/horarios.interface';
import EditHourModal from './EditHourModal';
import { getRecordReasonId } from '../api/directus/read';
import dayjs from 'dayjs';
import * as yup from 'yup';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import 'dayjs/locale/es';

interface EmployeeCardProps {
  empleado: EmpleadoAsistencia;
  tiposNovedad: { id: number; name?: string; nombre?: string }[];
  reasons: Motivo[];
  onRegistrarEvento: (idEmpleado: string, tipoEvento: string, horaOverride?: string, observacionOverride?: string, reasonId?: number | null) => Promise<void> | void;
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
  onReportarEvento: (idEmpleado: string, eventType: string, observaciones?: string) => Promise<boolean> | boolean | any;
}

// Opciones del reporte de eventos/pausas (definidas en código, no en la BD).
const EVENTOS_PAUSA = [
  'Iniciar Pausa Activa',
  'Terminar Pausa Activa',
  'Salir al baño',
  'Regresar del baño',
];

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


function NombreEmpleado({ nombre }: { nombre: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [truncado, setTruncado] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el) setTruncado(el.scrollWidth > el.clientWidth);
  }, [nombre]);

  const texto = (
    <Typography
      ref={ref}
      noWrap
      sx={{ fontWeight: 700, fontSize: '1rem', textTransform: 'capitalize', lineHeight: 1.2 }}
    >
      {nombre}
    </Typography>
  );

  return truncado ? (
    <Tooltip
      title={nombre}
      arrow
      placement="top"
      enterTouchDelay={0}
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: '#EAF2FB',
            color: '#0f2c4a',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.2px',
            textTransform: 'capitalize',
            px: 1.5,
            py: 0.875,
            borderRadius: 2,
            border: '1px solid #d6e6f7',
            boxShadow: '0 8px 24px rgba(0, 70, 128, 0.18)',
          },
        },
        arrow: { sx: { color: '#EAF2FB', '&::before': { border: '1px solid #d6e6f7' } } },
      }}
    >
      {texto}
    </Tooltip>
  ) : (
    texto
  );
}

export default function EmployeeCard({
  empleado, tiposNovedad, reasons, onRegistrarEvento,
  onEliminarEmpleado, onGuardarObservacion, onAgregarNovedad, onReportarEvento
}: EmployeeCardProps) {
  if (!empleado) {
    return (
      <Card sx={{ width: '100%', borderRadius: 3, p: 4, textAlign: 'center' }}>
        <CircularProgress size={40} />
        <Typography sx={{ mt: 2 }}>Cargando empleado...</Typography>
      </Card>
    );
  }

  const { id, nombre, estadoActual, registros } = empleado;

  const [novedadModalOpen, setNovedadModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    novedad: '',
    fechaInicio: dayjs().format('YYYY-MM-DD'),
    fechaFin: dayjs().format('YYYY-MM-DD'),
    observaciones: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [eventoActualObs, setEventoActualObs] = useState('');
  const [observacionTexto, setObservacionTexto] = useState('');
  const [obsInicialModal, setObsInicialModal] = useState('');

  const [horaModalOpen, setHoraModalOpen] = useState(false);
  const [eventoActualHora, setEventoActualHora] = useState('');
  const [initialReasonId, setInitialReasonId] = useState<number | null>(null);

  const [eventoModalOpen, setEventoModalOpen] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState('');
  const [eventoObservaciones, setEventoObservaciones] = useState('');
  const [eventoError, setEventoError] = useState('');
  const [guardandoEvento, setGuardandoEvento] = useState(false);

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
  // El reporte de evento/pausa aplica durante la jornada (iniciada y no terminada).
  const reporteActivo = estadoActual !== 'entrada_pendiente' && !finalizado;

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

  const getHoraEvento = (evento: string): string | null => {
    switch (evento) {
      case 'Comenzar Jornada': return registros.inicioJornada;
      case 'Iniciar Almuerzo': return registros.inicioAlmuerzo;
      case 'Finalizar Almuerzo': return registros.finAlmuerzo;
      case 'Terminar Jornada': return registros.finJornada;
      default: return null;
    }
  };

  const getEditadoStatus = (evento: string): boolean => {
    if (!registros.horasOriginales) return false;
    let eventKey = '';
    switch (evento) {
      case 'Comenzar Jornada': eventKey = 'inicioJornada'; break;
      case 'Iniciar Almuerzo': eventKey = 'inicioAlmuerzo'; break;
      case 'Finalizar Almuerzo': eventKey = 'finAlmuerzo'; break;
      case 'Terminar Jornada': eventKey = 'finJornada'; break;
    }
    return !!registros.horasOriginales[eventKey];
  };

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

  const handleOpenEventoModal = () => {
    setEventoSeleccionado('');
    setEventoObservaciones('');
    setEventoError('');
    setEventoModalOpen(true);
  };
  const handleCloseEventoModal = () => {
    if (guardandoEvento) return;
    setEventoModalOpen(false);
  };
  const handleGuardarEvento = async () => {
    if (!eventoSeleccionado) {
      setEventoError('Selecciona un evento');
      return;
    }
    setGuardandoEvento(true);
    try {
      const ok = await onReportarEvento(id, eventoSeleccionado, eventoObservaciones);
      if (ok) setEventoModalOpen(false);
    } finally {
      setGuardandoEvento(false);
    }
  };

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
    setObsInicialModal('');
  };
  const handleGuardarObservacion = async () => {
    await onGuardarObservacion(id, eventoActualObs, observacionTexto);
    handleCloseObsModal();
  };

  const getRecordIdEvento = (evento: string): number | undefined => {
    let eventKey = '';
    switch (evento) {
      case 'Comenzar Jornada': eventKey = 'inicioJornada'; break;
      case 'Iniciar Almuerzo': eventKey = 'inicioAlmuerzo'; break;
      case 'Finalizar Almuerzo': eventKey = 'finAlmuerzo'; break;
      case 'Terminar Jornada': eventKey = 'finJornada'; break;
    }
    return registros.ids?.[eventKey];
  };

  const handleOpenHoraModal = (evento: string) => {
    setEventoActualHora(evento);
    setInitialReasonId(null);
    setHoraModalOpen(true);
    const recordId = getRecordIdEvento(evento);
    if (recordId != null) {
      getRecordReasonId(recordId).then(setInitialReasonId).catch(() => setInitialReasonId(null));
    }
  };

  const maxLength = 500;

  return (
    <>
      <Card className="tour-employee-card" sx={{ width: '100%', borderRadius: 3, overflow: 'hidden', boxShadow: finalizado ? 'none' : '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <Box sx={{ bgcolor: '#004680', color: 'white', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, pr: 1 }}>
            <NombreEmpleado nombre={nombre} />
            {empleado.cargo && (
              <Typography sx={{ fontWeight: 500, fontSize: '0.7rem', opacity: 0.85, textTransform: 'uppercase', mt: 0.3, letterSpacing: '0.5px' }}>
                {empleado.cargo}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title={novedadActiva ? 'Registrar novedad' : 'No disponible'}>
              <span className="tour-novedad-btn">
                <IconButton
                  size="medium"
                  disabled={!novedadActiva}
                  onClick={handleOpenNovedadModal}
                  sx={{
                    color: novedadActiva ? '#ffffff' : 'rgba(255,255,255,0.3)',
                    '&:hover': {
                      bgcolor: novedadActiva ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
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
            <Tooltip title={reporteActivo ? 'Reportar evento' : 'No disponible'}>
              <span>
                <IconButton
                  size="medium"
                  disabled={!reporteActivo}
                  onClick={handleOpenEventoModal}
                  sx={{
                    color: reporteActivo ? '#fbbf24' : 'rgba(255,255,255,0.3)',
                    '&:hover': {
                      bgcolor: reporteActivo ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                    },
                    '&.Mui-disabled': {
                      color: 'rgba(255,255,255,0.3)',
                    }
                  }}
                >
                  <PauseCircleOutlineIcon fontSize="medium" />
                </IconButton>
              </span>
            </Tooltip>
            <Chip label={estadoActual.replace(/_/g, ' ').toUpperCase()} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 'bold', fontSize: '0.65rem', height: 24 }} />
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Stack className="tour-marcacion" spacing={1.5}>
            {botones.map((btn, idx) => {
              const yaHecho = !!btn.hora;
              const bloqueado = !btn.activo && !yaHecho;
              const observacionGuardada = getObservacion(btn.etiqueta);
              const obsEnabled = yaHecho;
              const editado = getEditadoStatus(btn.etiqueta);
              const relojEnabled = yaHecho && !editado;
              const tooltipTitle = relojEnabled 
                ? 'Editar hora' 
                : (yaHecho && editado 
                    ? 'Esta hora ya fue editada y no se puede volver a editar. En caso de ser necesario, llamar a soporte.' 
                    : 'No disponible');

              return (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tooltip title={tooltipTitle}>
                    <span>
                      <IconButton
                        size="small"
                        disabled={!relojEnabled}
                        onClick={() => handleOpenHoraModal(btn.etiqueta)}
                        sx={{
                          border: '1px solid',
                          borderColor: relojEnabled ? '#cbd5e1' : '#e2e8f0',
                          borderRadius: 1.5,
                          color: relojEnabled ? '#004680' : '#cbd5e1',
                          '&:hover': { bgcolor: relojEnabled ? '#f1f5f9' : 'transparent' }
                        }}
                      >
                        <AccessTimeIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>

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
                      bgcolor: btn.activo ? '#004680' : 'transparent',
                      color: btn.activo ? '#fff' : yaHecho ? '#16a34a' : '#94a3b8',
                      borderColor: yaHecho ? '#cbd5e1' : 'transparent',
                      cursor: yaHecho ? 'default' : 'pointer',
                      boxShadow: 'none',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        bgcolor: btn.activo ? '#003366' : 'transparent',
                        transform: btn.activo ? 'translateY(-1px)' : 'none',
                        boxShadow: 'none',
                      },
                      '&:active': {
                        boxShadow: 'none',
                      },
                      '&:focus': {
                        boxShadow: 'none',
                      },
                    }}
                  >
                    <span>{btn.etiqueta}</span>
                    {btn.hora && <span style={{ fontSize: '12px', fontWeight: 600 }}>{formatTo12Hour(btn.hora)}</span>}
                  </Button>

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
                          color: obsEnabled ? '#004680' : '#cbd5e1',
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
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#16a34a' }}>Jornada completada</Typography>
            </Box>
          )}
        </Box>
      </Card>

      <EditHourModal
        open={horaModalOpen}
        onClose={() => setHoraModalOpen(false)}
        employeeName={nombre}
        eventName={eventoActualHora}
        initialTimeStr={getHoraEvento(eventoActualHora)}
        initialObservation={getObservacion(eventoActualHora)}
        reasons={reasons}
        initialReasonId={initialReasonId}
        onConfirm={async (horaFormateada, observacion, reasonId) => {
          await onRegistrarEvento(id, eventoActualHora, horaFormateada, observacion, reasonId);
        }}
      />

      {/* Modal observación */}
      <Dialog open={obsModalOpen} onClose={handleCloseObsModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle component="div" sx={{ bgcolor: '#004680', color: '#fff', py: 2, px: 3 }}>
          <Typography component="span" variant="h6" sx={{ fontWeight: 600, display: 'block' }}>Observaciones del evento</Typography>
          <Typography component="span" variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>{eventoActualObs} • {nombre}</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>Registre o edite la nota. Máximo {maxLength} caracteres.</Alert>
          <TextField fullWidth multiline rows={5} placeholder="Escriba aquí la observación..." value={observacionTexto} onChange={(e) => setObservacionTexto(e.target.value.slice(0, maxLength))} helperText={`${observacionTexto.length}/${maxLength} caracteres`} slotProps={{ formHelperText: { sx: { textAlign: 'right', mt: 1, fontWeight: 500 } } }} />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2, bgcolor: '#f8fafc' }}>
          <Button onClick={handleCloseObsModal} variant="outlined" sx={{ borderRadius: 2, px: 3, fontWeight: 600, color: '#475569', borderColor: '#cbd5e1', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f1f5f9' } }}>Cancelar</Button>
          <Button onClick={handleGuardarObservacion} variant="contained" disabled={observacionTexto === obsInicialModal} sx={{ bgcolor: '#004680', borderRadius: 2, px: 4, fontWeight: 600 }}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal novedad */}
      <Dialog open={novedadModalOpen} onClose={handleCloseNovedadModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ bgcolor: '#004680', color: '#fff', py: 2, px: 3 }}>Registro de Novedad</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <FormControl fullWidth error={!!formErrors.novedad}>
              <InputLabel id="novedad-select-label">Novedad</InputLabel>
              <Select labelId="novedad-select-label" value={formData.novedad} label="Novedad" onChange={(e) => setFormData({ ...formData, novedad: e.target.value })}>
                {(tiposNovedad || []).map(tipo => (
                  <MenuItem key={tipo.id} value={tipo.name || tipo.nombre}>
                    {tipo.name || tipo.nombre}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.novedad && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{formErrors.novedad}</Typography>}
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
              <Box sx={{ display: 'flex', gap: 2 }}>
                <DatePicker
                  label="Desde el día"
                  value={formData.fechaInicio ? dayjs(formData.fechaInicio) : null}
                  onChange={(newValue: any) => {
                    if (newValue === null) {
                      setFormData({ ...formData, fechaInicio: '' });
                    } else if (dayjs.isDayjs(newValue)) {
                      setFormData({ ...formData, fechaInicio: newValue.format('YYYY-MM-DD') });
                    }
                  }}
                  format="DD/MM/YYYY"
                  slotProps={{ textField: { fullWidth: true, error: !!formErrors.fechaInicio, helperText: formErrors.fechaInicio } }}
                />
                <DatePicker
                  label="Hasta el día"
                  value={formData.fechaFin ? dayjs(formData.fechaFin) : null}
                  onChange={(newValue: any) => {
                    if (newValue === null) {
                      setFormData({ ...formData, fechaFin: '' });
                    } else if (dayjs.isDayjs(newValue)) {
                      setFormData({ ...formData, fechaFin: newValue.format('YYYY-MM-DD') });
                    }
                  }}
                  format="DD/MM/YYYY"
                  slotProps={{ textField: { fullWidth: true, error: !!formErrors.fechaFin, helperText: formErrors.fechaFin } }}
                />
              </Box>
            </LocalizationProvider>
            <TextField label="Observaciones" multiline rows={3} fullWidth value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} placeholder="Detalle adicional..." error={!!formErrors.observaciones} helperText={formErrors.observaciones} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCloseNovedadModal} variant="outlined" sx={{ color: '#475569', borderColor: '#cbd5e1', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f1f5f9' } }}>Cancelar</Button>
          <Button onClick={handleGuardarNovedad} variant="contained" sx={{ bgcolor: '#004680' }}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal reporte de evento / pausa */}
      <Dialog open={eventoModalOpen} onClose={handleCloseEventoModal} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ bgcolor: '#004680', color: '#fff', py: 2, px: 3, fontWeight: 700 }}>Reporta un evento</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Typography sx={{ fontSize: '0.85rem', color: '#475569', mb: 2 }}>
            Escoja la novedad presentada para {nombre}:
          </Typography>
          <FormControl fullWidth error={!!eventoError}>
            <InputLabel id="evento-select-label">Evento</InputLabel>
            <Select
              labelId="evento-select-label"
              value={eventoSeleccionado}
              label="Evento"
              onChange={(e) => { setEventoSeleccionado(e.target.value); setEventoError(''); }}
            >
              {EVENTOS_PAUSA.map((ev) => (
                <MenuItem key={ev} value={ev}>{ev}</MenuItem>
              ))}
            </Select>
            {eventoError && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{eventoError}</Typography>}
          </FormControl>
          <TextField
            label="Observaciones"
            multiline
            rows={3}
            fullWidth
            value={eventoObservaciones}
            onChange={(e) => setEventoObservaciones(e.target.value.slice(0, 500))}
            placeholder="Detalle adicional (opcional)..."
            helperText={`${eventoObservaciones.length}/500 caracteres`}
            slotProps={{ formHelperText: { sx: { textAlign: 'right' } } }}
            sx={{ mt: 2.5 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCloseEventoModal} disabled={guardandoEvento} variant="outlined" sx={{ color: '#475569', borderColor: '#cbd5e1', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f1f5f9' } }}>Cancelar</Button>
          <Button
            onClick={handleGuardarEvento}
            variant="contained"
            disabled={guardandoEvento}
            startIcon={guardandoEvento ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
            sx={{ bgcolor: '#004680' }}
          >
            {guardandoEvento ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}