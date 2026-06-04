// components/CreateNotification.tsx
import { useState, useEffect, ReactNode } from 'react';
import {
  Box, Typography, TextField, Chip, Button, Switch,
  ToggleButton, ToggleButtonGroup, Paper, Collapse, Autocomplete, Container,
  Grid, Tabs, Tab, Divider, IconButton,
  Dialog, DialogTitle, DialogContent,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import TuneIcon from '@mui/icons-material/Tune';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useGlobalSnackbar } from "@/shared/components/SnackbarsPosition/SnackbarContext";
import { CreateNotificationTourProvider } from './CreateNotificationTourContext';
import CreateNotificationTour from './CreateNotificationTour';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { ICreateNotification, INotificationGroup } from '../interfaces/notification.interface';
import { servicioNotificaciones } from '../services/notification.service';

dayjs.locale("es");

// ── Tipos ────────────────────────────────────────────────────────────────────

interface CreateNotificationProps {
  onSuccess?: () => void;
  currentTerminalCode?: string;
}

// ── Constantes ───────────────────────────────────────────────────────────────

const tiposAlerta = [
  { value: 'info',    label: 'Informativa',  icon: <InfoOutlinedIcon fontSize="small" />,       color: '#0058be' },
  { value: 'success', label: 'Éxito',         icon: <CheckCircleOutlineIcon fontSize="small" />, color: '#2e7d32' },
  { value: 'warning', label: 'Advertencia',   icon: <WarningAmberIcon fontSize="small" />,       color: '#944600' },
  { value: 'error',   label: 'Error Crítico', icon: <ErrorOutlineIcon fontSize="small" />,       color: '#ba1a1a' },
];

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px', fontFamily: 'Inter', backgroundColor: '#ffffff',
    '&:hover': { backgroundColor: '#ffffff' },
    '&.Mui-focused': { backgroundColor: '#ffffff' },
    '&.Mui-disabled': { backgroundColor: '#f9f9ff' },
  },
  '& .MuiOutlinedInput-input': { padding: '12px 14px', color: '#191b23' },
};

const inputHoraStyle = { ...inputStyle, width: 175, '& .MuiOutlinedInput-input': { padding: '12px 6px' } };

// ── Sub-componentes de layout ────────────────────────────────────────────────

// Bloque interno sin borde (todo va dentro de un único Paper que envuelve el formulario)
function SectionCard({ id, children, title, icon }: { id?: string; children: ReactNode; title?: string; icon?: ReactNode }) {
  return (
    <Box id={id} sx={{ width: '100%', height: '100%' }}>
      {title && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box sx={{ color: '#004a99' }}>{icon}</Box>
          <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', fontFamily: 'Inter', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {title}
          </Typography>
        </Box>
      )}
      {children}
    </Box>
  );
}

function ToggleRow({ label, description, checked, onChange, disabled }: {
  label: string; description?: string;
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
      <Box>
        <Typography sx={{ fontWeight: 600, fontSize: '13px', color: '#0f172a', fontFamily: 'Inter' }}>{label}</Typography>
        {description && <Typography sx={{ fontSize: '12px', color: '#64748b', fontFamily: 'Inter' }}>{description}</Typography>}
      </Box>
      <Switch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#004a99' } }}
      />
    </Box>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

const CreateNotification = ({ onSuccess, currentTerminalCode }: CreateNotificationProps) => {
  const navigate = useNavigate();
  const { showSnackbar } = useGlobalSnackbar();
  const [clientesDisponibles, setClientesDisponibles] = useState<{ id: string | number; code: string; name: string }[]>([]);
  const [cargandoClientes,    setCargandoClientes]    = useState(false);
  const [destinatariosSeleccionados, setDestinatariosSeleccionados] = useState<typeof clientesDisponibles>([]);

  const [enviarATodos,      setEnviarATodos]      = useState(false);
  const [grupos,            setGrupos]            = useState<INotificationGroup[]>([]);
  const [cargandoGrupos,    setCargandoGrupos]    = useState(false);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<INotificationGroup | null>(null);
  const [usarGrupoArea,     setUsarGrupoArea]     = useState(false);
  const [titulo,           setTitulo]           = useState('');
  const [mensaje,          setMensaje]          = useState('');
  const [tipo,             setTipo]             = useState<ICreateNotification['tipo']>('info');
  const [programar,        setProgramar]        = useState(false);
  const [fechaProgramada,  setFechaProgramada]  = useState('');
  const [horaProgramada,   setHoraProgramada]   = useState('');
  const [recordatorio,     setRecordatorio]     = useState(false);
  const [fechaRecordatorio,setFechaRecordatorio]= useState('');
  const [horaRecordatorio, setHoraRecordatorio] = useState('');
  const [persistente,      setPersistente]      = useState(false);
  const [clickeable,       setClickeable]       = useState(false);
  const [rutaAccion,       setRutaAccion]       = useState('');
  const [excluir,          setExcluir]          = useState<string[]>([]);
  const [inputExcluir,     setInputExcluir]     = useState('');
  const [duracionSeg,      setDuracionSeg]      = useState(15);
  const [enviando,         setEnviando]         = useState(false);
  const [destinatariosModalOpen, setDestinatariosModalOpen] = useState(false);
  const MAX_CHIPS_VISIBLES = 3;

  useEffect(() => {
    const cargarClientes = async () => {
      setCargandoClientes(true);
      const data = await servicioNotificaciones.obtenerClientesNotificadores();
      setClientesDisponibles(data);
      setCargandoClientes(false);
    };
    cargarClientes();

    const cargarGrupos = async () => {
      setCargandoGrupos(true);
      const data = await servicioNotificaciones.obtenerGrupos();
      setGrupos(data);
      setCargandoGrupos(false);
    };
    cargarGrupos();
  }, []);

  const resetForm = () => {
    setDestinatariosSeleccionados([]);
    setEnviarATodos(false);
    setUsarGrupoArea(false);
    setGrupoSeleccionado(null);
    setTitulo('');
    setMensaje('');
    setProgramar(false);
    setFechaProgramada('');
    setHoraProgramada('');
    setRecordatorio(false);
    setFechaRecordatorio('');
    setHoraRecordatorio('');
    setPersistente(false);
    setClickeable(false);
    setRutaAccion('');
    setExcluir([]);
    setDuracionSeg(15);
  };

  const handleSubmit = async () => {
    if (recordatorio) {
      if (!currentTerminalCode) {
        showSnackbar('No se pudo identificar tu terminal para el recordatorio. Contacta al administrador.', 'error');
        return;
      }
      if (!fechaRecordatorio || !horaRecordatorio) {
        showSnackbar('Debes definir fecha y hora para el recordatorio.', 'error');
        return;
      }
    } else {
      if (!enviarATodos && !usarGrupoArea && destinatariosSeleccionados.length === 0) {
        showSnackbar('Debes seleccionar al menos un destinatario, usar "Todos" o un grupo/área.', 'error');
        return;
      }
      if (usarGrupoArea && !grupoSeleccionado) {
        showSnackbar('Debes seleccionar el grupo o área.', 'error');
        return;
      }
    }
    if (!mensaje.trim()) {
      showSnackbar('El mensaje no puede estar vacío.', 'error');
      return;
    }

    let destinatarios: string[] = [];
    if (recordatorio) {
      destinatarios = [currentTerminalCode!];
    } else {
      if (enviarATodos) {
        destinatarios = ["todos"];
      } else if (usarGrupoArea) {
        destinatarios = grupoSeleccionado ? [`grupo:${grupoSeleccionado.name}`] : [];
      } else {
        destinatarios = destinatariosSeleccionados.map(c => String(c.code));
      }
    }

    let fecha_programada: string | null = null;
    if (recordatorio && fechaRecordatorio && horaRecordatorio)
      fecha_programada = `${fechaRecordatorio} ${horaRecordatorio}`;
    else if (programar && fechaProgramada && horaProgramada)
      fecha_programada = `${fechaProgramada} ${horaProgramada}`;

    const payload: ICreateNotification = {
      destinatarios,
      titulo: titulo || 'Notificación',
      mensaje,
      tipo,
      duracion_seg: duracionSeg,
      persistente,
      clickeable,
      mostrar_boton_cerrar: true,
      pausar_al_hover: true,
      excluir,
      ruta_accion: rutaAccion || null,
      fecha_programada,
    };

    try {
      setEnviando(true);
      await servicioNotificaciones.enviarNotificacion(payload);
      showSnackbar('Notificación enviada correctamente.', 'success');
      resetForm();
      onSuccess?.();
    } catch (err: any) {
      showSnackbar(err.message || 'Error desconocido al enviar.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyDownExcluir = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const v = inputExcluir.trim();
      if (v && !excluir.includes(v)) setExcluir([...excluir, v]);
      setInputExcluir('');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`.no-spin::-webkit-outer-spin-button,.no-spin::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}`}</style>

      {/* Tour Joyride — auto-arranca la primera vez, o via PeekButton / ?tour=start */}
      <CreateNotificationTour />

      <Box sx={{ bgcolor: 'transparent', minHeight: '100vh', py: 3 }}>
        <Container maxWidth="xl">

          {/* ── Header tipo card con botón de volver ── */}
          <Paper
            elevation={0}
            sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: 'white', mb: 2.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                {/* Botón Volver */}
                <IconButton
                  onClick={() => navigate('/notificaciones')}
                  aria-label="Volver"
                  sx={{
                    color: '#004a99',
                    bgcolor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    flexShrink: 0,
                    '&:hover': { bgcolor: '#e2e8f0' },
                  }}
                >
                  <ArrowBackIcon sx={{ fontSize: 22 }} />
                </IconButton>

                {/* Título */}
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', fontFamily: 'Inter', lineHeight: 1.15 }}>
                    Envío de Notificaciones
                  </Typography>
                  <Typography sx={{ fontSize: '13px', color: '#64748b', fontFamily: 'Inter' }}>
                    Configura y emite alertas a través de AppKancan.
                  </Typography>
                </Box>
              </Box>

              {/* Botón Enviar */}
              <Button
                id="notif-crear-enviar"
                variant="contained"
                onClick={handleSubmit}
                disabled={enviando}
                startIcon={<SendIcon />}
                sx={{ bgcolor: '#004a99', boxShadow: 'none', '&:hover': { bgcolor: '#003366', boxShadow: 'none' }, '&:active': { boxShadow: 'none' }, '&:focus': { boxShadow: 'none' }, borderRadius: '12px', textTransform: 'none', fontWeight: 700, fontFamily: 'Inter', px: 2.5, py: 1.2, flexShrink: 0 }}
              >
                {enviando ? 'Enviando...' : 'Enviar Notificación'}
              </Button>
            </Box>
          </Paper>

          {/* ── Cuerpo: formulario centrado ── */}
          <Box sx={{ width: '100%' }}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  bgcolor: '#ffffff',
                  p: { xs: 2.5, md: 3.5 },
                }}
              >
              <Grid container columnSpacing={4} rowSpacing={3}>

              {/* Row 1, col 1 — Destinatarios (con borde derecho como separador vertical en md+) */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', borderRight: { md: '1px solid #e2e8f0' }, pr: { md: 2 } }}>
              <SectionCard id="notif-crear-destinatarios" title="Destinatarios" icon={<PeopleAltOutlinedIcon sx={{ fontSize: 18 }} />}>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
                  {[
                    { label: 'Todos', active: enviarATodos, onClick: () => { setEnviarATodos(true); setUsarGrupoArea(false); setDestinatariosSeleccionados([]); } },
                    { label: 'Grupo / Área', active: usarGrupoArea, onClick: () => { setUsarGrupoArea(true); setEnviarATodos(false); setDestinatariosSeleccionados([]); } },
                    { label: 'Selección manual', active: !enviarATodos && !usarGrupoArea, onClick: () => { setEnviarATodos(false); setUsarGrupoArea(false); } },
                  ].map(({ label, active, onClick }) => (
                    <Chip
                      key={label}
                      label={label}
                      onClick={onClick}
                      disabled={recordatorio}
                      sx={{
                        fontFamily: 'Inter', fontWeight: 600, cursor: 'pointer',
                        bgcolor: active ? '#004a99' : '#f1f5f9',
                        color:   active ? '#fff'     : '#64748b',
                        '&:hover': { bgcolor: active ? '#003366' : '#e2e8f0' },
                      }}
                    />
                  ))}
                </Box>

                {usarGrupoArea && (
                  <Autocomplete
                    options={grupos} loading={cargandoGrupos}
                    getOptionLabel={(o) => o.name}
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                    value={grupoSeleccionado}
                    onChange={(_, v) => setGrupoSeleccionado(v)}
                    noOptionsText="No hay grupos disponibles"
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Selecciona un grupo o área" variant="outlined" size="small" sx={{ mb: 1, ...inputStyle }} />
                    )}
                  />
                )}

                {!enviarATodos && !usarGrupoArea && (
                  <Autocomplete
                    multiple
                    disabled={recordatorio}
                    options={clientesDisponibles} loading={cargandoClientes}
                    getOptionLabel={(o) => `${o.name} (${o.code})`}
                    isOptionEqualToValue={(o, v) => o.code === v.code}
                    value={destinatariosSeleccionados}
                    onChange={(_, v) => setDestinatariosSeleccionados(v)}
                    renderTags={(value, getTagProps) => {
                      const visibles = value.slice(0, MAX_CHIPS_VISIBLES);
                      const restantes = value.length - visibles.length;
                      const chips = visibles.map((option, index) => {
                        const { key, ...rest } = getTagProps({ index });
                        return <Chip key={key} label={`${option.name} (${option.code})`} {...rest} size="small" sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontFamily: 'Inter', fontSize: '11px' }} />;
                      });
                      if (restantes > 0) {
                        chips.push(
                          <Chip
                            key="__resto__"
                            label={`+${restantes}`}
                            size="small"
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onClick={(e) => { e.stopPropagation(); setDestinatariosModalOpen(true); }}
                            sx={{ bgcolor: '#004a99', color: '#ffffff', fontFamily: 'Inter', fontSize: '11px', fontWeight: 700, cursor: 'pointer', '&:hover': { bgcolor: '#003366' } }}
                          />
                        );
                      }
                      return chips;
                    }}
                    renderInput={(params) => {
                      const hayChips = destinatariosSeleccionados.length > 0;
                      return (
                        <TextField
                          {...params}
                          placeholder={hayChips ? "" : "Selecciona uno o más destinatarios"}
                          variant="outlined"
                          size="small"
                          sx={{
                            ...inputStyle,
                            ...(hayChips && {
                              '& .MuiAutocomplete-input': {
                                display: 'none !important',
                              },
                              // Cuando el usuario hace foco en el contenedor mostramos el input para
                              // permitir seguir buscando/añadiendo.
                              '& .MuiOutlinedInput-root.Mui-focused .MuiAutocomplete-input': {
                                display: 'inline-block !important',
                                flex: '1 1 60px',
                                minWidth: '60px',
                              },
                            }),
                          }}
                        />
                      );
                    }}
                  />
                )}

                <Typography sx={{ fontSize: '11px', color: '#94a3b8', mt: 1, fontFamily: 'Inter' }}>
                  {enviarATodos && 'Se enviará a todas las terminales activas.'}
                  {usarGrupoArea && 'Selecciona el grupo o área de destino.'}
                  {!enviarATodos && !usarGrupoArea && 'Puedes seleccionar múltiples terminales.'}
                </Typography>

                {/* Aviso cuando el modo Recordatorio personal está activo y hay
                    destinatarios seleccionados: se ignoran al enviar. */}
                {recordatorio && destinatariosSeleccionados.length > 0 && (
                  <Box sx={{
                    mt: 1.5, p: 1.2,
                    bgcolor: '#fff7ed',
                    border: '1px solid #fed7aa',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'flex-start', gap: 1,
                  }}>
                    <WarningAmberIcon sx={{ fontSize: 16, color: '#c2410c', mt: '1px', flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '11.5px', color: '#9a3412', fontFamily: 'Inter', lineHeight: 1.5 }}>
                      <b>Modo Recordatorio personal activo.</b> Los {destinatariosSeleccionados.length} destinatario(s) seleccionado(s) <b>no recibirán</b> esta notificación. Solo se enviará a tu terminal.
                    </Typography>
                  </Box>
                )}
              </SectionCard>
              </Grid>

              {/* Row 1, col 2 — Programación */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
              <SectionCard id="notif-crear-programacion" title="Programación" icon={<ScheduleIcon sx={{ fontSize: 18 }} />}>
                <Tabs
                  value={recordatorio ? 1 : 0}
                  onChange={(_, v) => {
                    if (v === 0) {
                      setRecordatorio(false);
                    } else {
                      setRecordatorio(true);
                      setProgramar(false);
                      setEnviarATodos(false);
                      setUsarGrupoArea(false);
                    }
                  }}
                  sx={{
                    minHeight: 36, mb: 2,
                    '& .MuiTab-root': { textTransform: 'none', fontFamily: 'Inter', fontWeight: 600, fontSize: '13px', minHeight: 36, py: 0.5 },
                    '& .Mui-selected': { color: '#004a99 !important' },
                    '& .MuiTabs-indicator': { backgroundColor: '#004a99' },
                  }}
                >
                  <Tab label="Programar envío" />
                  <Tab label="Recordatorio personal" />
                </Tabs>

                {!recordatorio ? (
                  <Box>
                    <ToggleRow
                      label="Programar para más tarde"
                      description="Selecciona fecha y hora de envío"
                      checked={programar}
                      onChange={setProgramar}
                    />
                    <Collapse in={programar}>
                      <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5 }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                          <DatePicker value={fechaProgramada ? dayjs(fechaProgramada) : null} onChange={(v) => setFechaProgramada(v ? dayjs(v).format("YYYY-MM-DD") : "")} slotProps={{ textField: { size: "small", fullWidth: true, sx: inputStyle } }} />
                          <TimePicker
                            value={horaProgramada ? dayjs(`2000-01-01T${horaProgramada}`) : null}
                            onChange={(v) => setHoraProgramada(v ? dayjs(v).format("HH:mm") : "")}
                            slotProps={{ textField: { size: "small", sx: inputHoraStyle }, actionBar: { actions: ["accept"], sx: { justifyContent: "center" } } }}
                          />
                        </LocalizationProvider>
                      </Box>
                    </Collapse>
                    {!programar && (
                      <Typography sx={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'Inter', mt: 1 }}>
                        La notificación se enviará inmediatamente.
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Box>
                    <Typography sx={{ fontSize: '12px', color: '#64748b', fontFamily: 'Inter', mb: 1.5 }}>
                      Se enviará solo a tu terminal en la fecha indicada.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                        <DatePicker value={fechaRecordatorio ? dayjs(fechaRecordatorio) : null} onChange={(v) => setFechaRecordatorio(v ? dayjs(v).format("YYYY-MM-DD") : "")} slotProps={{ textField: { size: "small", fullWidth: true, sx: inputStyle } }} />
                        <TimePicker
                          value={horaRecordatorio ? dayjs(`2000-01-01T${horaRecordatorio}`) : null}
                          onChange={(v) => setHoraRecordatorio(v ? dayjs(v).format("HH:mm") : "")}
                          slotProps={{ textField: { size: "small", sx: inputHoraStyle }, actionBar: { actions: ["accept"], sx: { justifyContent: "center" } } }}
                        />
                      </LocalizationProvider>
                    </Box>
                  </Box>
                )}
              </SectionCard>
              </Grid>

              {/* Divider horizontal entre Row 1 y Row 2 */}
              <Grid size={12}>
                <Divider sx={{ borderColor: '#e2e8f0' }} />
              </Grid>

              
              <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', borderRight: { md: '1px solid #e2e8f0' }, pr: { md: 2 } }}>
              <SectionCard id="notif-crear-contenido" title="Contenido" icon={<EditNoteOutlinedIcon sx={{ fontSize: 18 }} />}>
                <TextField
                  fullWidth size="small"
                  placeholder="Título (opcional)"
                  value={titulo} onChange={(e) => setTitulo(e.target.value)}
                  inputProps={{ maxLength: 100 }}
                  sx={{ mb: 2, ...inputStyle }}
                />

                <Box sx={{ position: 'relative', mb: 2.5 }}>
                  <TextField
                    fullWidth multiline rows={4}
                    placeholder="Mensaje (obligatorio)"
                    value={mensaje} onChange={(e) => setMensaje(e.target.value)}
                    inputProps={{ maxLength: 600 }}
                    sx={{ ...inputStyle, '& .MuiOutlinedInput-root': { ...(inputStyle as any)['& .MuiOutlinedInput-root'], padding: '12px 14px' }, '& .MuiOutlinedInput-input': { padding: 0, color: '#191b23' } }}
                  />
                  <Typography sx={{ position: 'absolute', bottom: 10, right: 12, fontSize: '11px', color: mensaje.length >= 600 ? '#dc2626' : '#94a3b8' }}>
                    {mensaje.length}/600
                  </Typography>
                </Box>

                {/* Tipo de alerta */}
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', mb: 1.5, fontFamily: 'Inter' }}>
                  Tipo de Alerta
                </Typography>
                <ToggleButtonGroup value={tipo} exclusive onChange={(_, val) => val && setTipo(val)} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
                  {tiposAlerta.map((t) => (
                    <ToggleButton
                      key={t.value} value={t.value}
                      sx={{
                        borderRadius: '999px !important',
                        border: '1px solid #e2e8f0 !important',
                        px: 2.5, py: 0.8,
                        textTransform: 'none',
                        fontFamily: 'Inter', fontWeight: 600, fontSize: '13px',
                        color: '#64748b',
                        // Hover uniforme para todos los tipos
                        '&:hover': { bgcolor: '#f1f5f9' },
                        '&.Mui-selected': {
                          bgcolor: `${t.color}18`,
                          borderColor: `${t.color} !important`,
                          color: t.color,
                          '&:hover': { bgcolor: `${t.color}28` },
                        },
                      }}
                    >
                      <Box sx={{ mr: 0.8, display: 'flex' }}>{t.icon}</Box>
                      {t.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </SectionCard>
              </Grid>

              {/* Row 2, col 2 — Opciones Avanzadas */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
              <SectionCard id="notif-crear-avanzadas" title="Opciones Avanzadas" icon={<TuneIcon sx={{ fontSize: 18 }} />}>
                {/* Duración */}
                <Box sx={{ mb: 2, opacity: persistente ? 0.45 : 1, pointerEvents: persistente ? 'none' : 'auto' }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', mb: 1, fontFamily: 'Inter' }}>
                    Duración en pantalla
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '999px', overflow: 'hidden', bgcolor: '#f8fafc' }}>
                      <Button onClick={() => setDuracionSeg(Math.max(5, duracionSeg - 5))} disabled={persistente} sx={{ minWidth: 36, height: 36 }}>−</Button>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.5 }}>
                        <input type="number" className="no-spin" value={duracionSeg === 0 ? '' : duracionSeg} onChange={(e) => { const v = e.target.value; if (v === '') { setDuracionSeg(0); return; } setDuracionSeg(Math.min(360, Number(v))); }} onBlur={(e) => { const n = Number(e.target.value); if (!n || n < 5) { setDuracionSeg(5); showSnackbar("El tiempo mínimo es de 5 segundos", "warning"); } }} disabled={persistente} style={{ width: 44, border: 'none', outline: 'none', background: 'transparent', textAlign: 'center', fontFamily: 'Inter' }} />
                        <Typography sx={{ fontSize: '12px', color: '#64748b', fontFamily: 'Inter' }}>seg</Typography>
                      </Box>
                      <Button onClick={() => setDuracionSeg(Math.min(360, duracionSeg + 5))} disabled={persistente} sx={{ minWidth: 36, height: 36 }}>+</Button>
                    </Box>
                    {duracionSeg === 15 && (
                      <Chip label="Recomendado" size="small" sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontFamily: 'Inter', fontWeight: 600, fontSize: '11px' }} />
                    )}
                  </Box>
                </Box>

                <ToggleRow label="Persistente" description="El usuario debe cerrar manualmente." checked={persistente} onChange={setPersistente} />
                <ToggleRow label="Clickeable" description="Permite hacer clic sobre la alerta." checked={clickeable} onChange={setClickeable} />

                <Collapse in={clickeable}>
                  <Box sx={{ mt: 1.5 }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', mb: 1, fontFamily: 'Inter' }}>Ruta de acción</Typography>
                    <TextField fullWidth size="small" placeholder="Ej: /modulo/detalles" value={rutaAccion} onChange={(e) => setRutaAccion(e.target.value)} disabled={!clickeable} sx={inputStyle} />
                  </Box>
                </Collapse>

                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', mb: 1, fontFamily: 'Inter' }}>Excluir terminales</Typography>
                  <Box sx={{ minHeight: 44, border: '1px solid #e2e8f0', borderRadius: '10px', p: 1, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', bgcolor: '#ffffff' }}>
                    {excluir.map((e, i) => (
                      <Chip key={i} label={e} size="small" onDelete={() => setExcluir(excluir.filter((_, j) => j !== i))} sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontFamily: 'Inter' }} />
                    ))}
                    <input
                      style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'Inter', fontSize: '14px', minWidth: 150, background: 'transparent' }}
                      placeholder="Código y Enter (Ej: 31:CF)"
                      value={inputExcluir}
                      onChange={(e) => setInputExcluir(e.target.value)}
                      onKeyDown={handleKeyDownExcluir}
                    />
                  </Box>
                </Box>
              </SectionCard>
              </Grid>

              {/* Cierre del sub-grid del formulario */}
              </Grid>
              </Paper>
          </Box>
        </Container>

        {/* Modal con la lista completa de destinatarios */}
        <Dialog
          open={destinatariosModalOpen}
          onClose={() => setDestinatariosModalOpen(false)}
          maxWidth="sm"
          fullWidth
          slotProps={{ paper: { sx: { borderRadius: '16px' } } }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Inter', fontWeight: 800, color: '#0f172a' }}>
            <Box component="span" sx={{ fontSize: '16px' }}>
              Destinatarios seleccionados ({destinatariosSeleccionados.length})
            </Box>
            <IconButton size="small" onClick={() => setDestinatariosModalOpen(false)} sx={{ color: '#64748b' }}>
              <Box component="span" sx={{ fontSize: 20, lineHeight: 1 }}>×</Box>
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 2 }}>
            {destinatariosSeleccionados.length === 0 ? (
              <Typography sx={{ color: '#94a3b8', fontFamily: 'Inter', fontSize: '13px', textAlign: 'center', py: 2 }}>
                No hay destinatarios seleccionados.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {destinatariosSeleccionados.map((d) => (
                  <Chip
                    key={d.code}
                    label={`${d.name} (${d.code})`}
                    size="small"
                    onDelete={() => setDestinatariosSeleccionados(prev => prev.filter(x => x.code !== d.code))}
                    sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontFamily: 'Inter', fontSize: '12px' }}
                  />
                ))}
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </>
  );
};

export default function CreateNotificationPage(props: CreateNotificationProps) {
  return (
    <CreateNotificationTourProvider>
      <CreateNotification {...props} />
    </CreateNotificationTourProvider>
  );
}
