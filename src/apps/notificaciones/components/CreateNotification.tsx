// components/CreateNotification.tsx
import { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Chip, Button, Switch,
  ToggleButton, ToggleButtonGroup, Divider, Paper, Collapse, Autocomplete,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import TuneIcon from '@mui/icons-material/Tune';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { ICreateNotification, INotificationGroup } from '../interfaces/notification.interface';
import { servicioNotificaciones } from '../services/notification.service';

dayjs.locale("es");

interface CreateNotificationProps {
  onSuccess?: () => void;
  currentTerminalCode?: string;
}

const tiposAlerta = [
  { value: 'info', label: 'Informativa', icon: <InfoOutlinedIcon fontSize="small" />, color: '#0058be' },
  { value: 'success', label: 'Éxito', icon: <CheckCircleOutlineIcon fontSize="small" />, color: '#2e7d32' },
  { value: 'warning', label: 'Advertencia', icon: <WarningAmberIcon fontSize="small" />, color: '#944600' },
  { value: 'error', label: 'Error Crítico', icon: <ErrorOutlineIcon fontSize="small" />, color: '#ba1a1a' },
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

const CreateNotification = ({ onSuccess, currentTerminalCode }: CreateNotificationProps) => {
  const [clientesDisponibles, setClientesDisponibles] = useState<{ id: string | number; code: string; name: string }[]>([]);
  const [cargandoClientes, setCargandoClientes] = useState(false);
  const [destinatariosSeleccionados, setDestinatariosSeleccionados] = useState<typeof clientesDisponibles>([]);

  const [enviarATodos, setEnviarATodos] = useState(false);
  const [grupos, setGrupos] = useState<INotificationGroup[]>([]);
  const [cargandoGrupos, setCargandoGrupos] = useState(false);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<INotificationGroup | null>(null);
  const [usarGrupoArea, setUsarGrupoArea] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [tipo, setTipo] = useState<ICreateNotification['tipo']>('info');
  const [programar, setProgramar] = useState(false);
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [horaProgramada, setHoraProgramada] = useState('');
  const [recordatorio, setRecordatorio] = useState(false);
  const [fechaRecordatorio, setFechaRecordatorio] = useState('');
  const [horaRecordatorio, setHoraRecordatorio] = useState('');
  const [persistente, setPersistente] = useState(false);
  const [clickeable, setClickeable] = useState(false);
  const [rutaAccion, setRutaAccion] = useState('');
  const [excluir, setExcluir] = useState<string[]>([]);
  const [inputExcluir, setInputExcluir] = useState('');
  const [duracionSeg, setDuracionSeg] = useState(15);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

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
      const data =await servicioNotificaciones.obtenerGrupos();
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
    setError(null);
    setExito(false);

    if (recordatorio) {
      if (!currentTerminalCode) {
        setError('No se pudo identificar tu terminal para el recordatorio. Contacta al administrador.');
        return;
      }
      if (!fechaRecordatorio || !horaRecordatorio) {
        setError('Debes definir fecha y hora para el recordatorio.');
        return;
      }
    } else {
      if (!enviarATodos && !usarGrupoArea && destinatariosSeleccionados.length === 0) {
        setError('Debes seleccionar al menos un destinatario, usar "Todos" o un grupo/área.');
        return;
      }
      if (usarGrupoArea && !grupoSeleccionado) {
        setError('Debes escribir el grupo o área (ej: grupo:Tiendas Centro)');
        return;
      }
    }
    if (!mensaje.trim()) {
      setError('El mensaje no puede estar vacío.');
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
      excluir: excluir,
      ruta_accion: rutaAccion || null,
      fecha_programada,
    };

    try {
      setEnviando(true);
      await servicioNotificaciones.enviarNotificacion(payload);
      setExito(true);
      resetForm();
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Error desconocido al enviar.');
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

  return (
    <>
      <style>{`.no-spin::-webkit-outer-spin-button, .no-spin::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }`}</style>
      <Box sx={{ width: '100%', maxWidth: 1060, mx: 'auto', bgcolor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1px solid #e1e2ec', overflow: 'hidden' }}>
        <Box sx={{ px: 4, py: 3, borderBottom: '1px solid #e1e2ec', bgcolor: '#f9f9ff' }}>
          <Typography sx={{ fontSize: '24px', fontWeight: 600, color: '#0058be', fontFamily: 'Inter' }}>Envío de Notificaciones</Typography>
          <Typography sx={{ fontSize: '14px', color: '#424754', fontFamily: 'Inter', mt: 0.5 }}>Configura y emite alertas a través de AppKancan</Typography>
        </Box>

        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Tarjetas Programar / Recordatorio */}
          <Box sx={{ display: 'flex', gap: 3, width: '100%', alignItems: 'flex-start' }}>
            <Paper elevation={0} sx={{ p: '12px 16px', bgcolor: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: '14px', flex: 1, opacity: recordatorio ? 0.4 : 1, pointerEvents: recordatorio ? 'none' : 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography sx={{ fontWeight: 600 }}>Programar para más tarde</Typography><Typography sx={{ fontSize: '12px', color: '#4b5563' }}>Selecciona fecha y hora de envío</Typography></Box>
                <Switch checked={programar} onChange={(e) => setProgramar(e.target.checked)} disabled={recordatorio} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#0058be' } }} />
              </Box>
              <Collapse in={programar}>
                <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                    <DatePicker value={fechaProgramada ? dayjs(fechaProgramada) : null} onChange={(v) => setFechaProgramada(v ? dayjs(v).format("YYYY-MM-DD") : "")} slotProps={{ textField: { size: "small", fullWidth: true, sx: inputStyle } }} />
                  </LocalizationProvider>
                  <TextField type="time" size="small" sx={inputHoraStyle} value={horaProgramada} onChange={(e) => setHoraProgramada(e.target.value)} />
                </Box>
              </Collapse>
            </Paper>

            <Paper elevation={0} sx={{ p: '12px 16px', bgcolor: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: '14px', flex: 1, opacity: programar ? 0.4 : 1, pointerEvents: programar ? 'none' : 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography sx={{ fontWeight: 600 }}>Recordatorio personal</Typography><Typography sx={{ fontSize: '12px', color: '#4b5563' }}>Envíate un recordatorio </Typography></Box>
                <Switch checked={recordatorio} onChange={(e) => { setRecordatorio(e.target.checked); if (e.target.checked) { setProgramar(false); setEnviarATodos(false); setUsarGrupoArea(false); } }} disabled={programar} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#0058be' } }} />
              </Box>
              <Collapse in={recordatorio}>
                <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                    <DatePicker value={fechaRecordatorio ? dayjs(fechaRecordatorio) : null} onChange={(v) => setFechaRecordatorio(v ? dayjs(v).format("YYYY-MM-DD") : "")} slotProps={{ textField: { size: "small", fullWidth: true, sx: inputStyle } }} />
                  </LocalizationProvider>
                  <TextField type="time" size="small" sx={inputHoraStyle} value={horaRecordatorio} onChange={(e) => setHoraRecordatorio(e.target.value)} />
                </Box>
              </Collapse>
            </Paper>
          </Box>

          {/* Opciones de destinatario */}
          <Box sx={{ opacity: recordatorio ? 0.5 : 1, pointerEvents: recordatorio ? 'none' : 'auto' }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>Destinatarios</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Chip label="Todos" variant={enviarATodos ? "filled" : "outlined"} onClick={() => { setEnviarATodos(true); setUsarGrupoArea(false); setDestinatariosSeleccionados([]); }} color={enviarATodos ? "primary" : "default"} />
              <Chip label="Grupo / Área" variant={usarGrupoArea ? "filled" : "outlined"} onClick={() => { setUsarGrupoArea(true); setEnviarATodos(false); setDestinatariosSeleccionados([]); }} color={usarGrupoArea ? "primary" : "default"} />
              <Chip label="Seleccionar manualmente" variant={(!enviarATodos && !usarGrupoArea) ? "filled" : "outlined"} onClick={() => { setEnviarATodos(false); setUsarGrupoArea(false); }} color={(!enviarATodos && !usarGrupoArea) ? "primary" : "default"} />
            </Box>

            {usarGrupoArea && (
              <Autocomplete
              options={grupos}
              loading={cargandoGrupos}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={grupoSeleccionado}
              onChange={(_, newValue) => setGrupoSeleccionado(newValue)}
              noOptionsText="No hay grupos disponibles"
              renderInput={(params) => ( 
                <TextField
                {...params}
                placeholder="Selecciona un grupo o área"
                variant="outlined"
                size="small"
                sx={{ mb: 2, ...inputStyle }}
                />
              )}
            />
          )}

            {!enviarATodos && !usarGrupoArea && (
              <Autocomplete
                multiple
                options={clientesDisponibles}
                loading={cargandoClientes}
                getOptionLabel={(option) => `${option.name} (${option.code})`}
                isOptionEqualToValue={(option, value) => option.code === value.code}
                value={destinatariosSeleccionados}
                onChange={(_, newValue) => setDestinatariosSeleccionados(newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const tagProps = getTagProps({ index });
                    const { key, ...restTagProps } = tagProps; // Extraemos la key
                    return (
                      <Chip
                        key={key} // Key asignada directamente
                        label={`${option.name} (${option.code})`}
                        {...restTagProps} // Resto de props (onDelete, etc.)
                        size="small"
                        sx={{ bgcolor: '#d8e2ff', color: '#004395', fontFamily: 'Inter', fontSize: '11px' }}
                      />
                    );
                  })
                }
                renderInput={(params) => <TextField {...params} placeholder="Selecciona uno o más destinatarios" variant="outlined" size="small" sx={inputStyle} />}
              />
            )}
            <Typography sx={{ fontSize: '11px', color: '#6b7280', mt: 1 }}>
              {enviarATodos && "Se enviará a todas las terminales activas."}
              {usarGrupoArea && "Escribe grupo:Nombre o area:Nombre según la guía."}
              {!enviarATodos && !usarGrupoArea && "Puedes seleccionar múltiples terminales."}
            </Typography>
          </Box>

          {/* Título */}
          <TextField fullWidth size="small" placeholder="Título (opcional)" value={titulo} onChange={(e) => setTitulo(e.target.value)} inputProps={{ maxLength: 100 }} sx={inputStyle} />

          {/* Mensaje */}
          <Box sx={{ position: 'relative' }}>
            <TextField fullWidth multiline rows={4} placeholder="Mensaje (obligatorio)" value={mensaje} onChange={(e) => setMensaje(e.target.value)} inputProps={{ maxLength: 600 }} sx={inputStyle} />
            <Typography sx={{ position: 'absolute', bottom: 10, right: 12, fontSize: '11px', color: mensaje.length >= 600 ? '#ba1a1a' : '#6b7280' }}>{mensaje.length}/600</Typography>
          </Box>

          {/* Tipo de alerta */}
          <Box>
            <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#0058be', mb: 1.5 }}>Tipo de Alerta</Typography>
            <ToggleButtonGroup value={tipo} exclusive onChange={(_, val) => val && setTipo(val)} sx={{ flexWrap: 'wrap', gap: 2 }}>
              {tiposAlerta.map((t) => (
                <ToggleButton key={t.value} value={t.value} sx={{ borderRadius: '999px !important', border: '1px solid #c2c6d6 !important', px: 2.5, py: 0.8, textTransform: 'none', '&.Mui-selected': { bgcolor: `${t.color}24`, borderColor: `${t.color} !important`, color: t.color } }}>
                  <Box sx={{ mr: 0.5 }}>{t.icon}</Box>{t.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Opciones avanzadas */}
          <Divider />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}><TuneIcon sx={{ color: '#424754' }} /><Typography sx={{ fontSize: '16px', fontWeight: 600 }}>Opciones Avanzadas</Typography></Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              <Box sx={{ opacity: persistente ? 0.5 : 1, pointerEvents: persistente ? 'none' : 'auto' }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 500, mb: 1.5 }}>Duración en pantalla</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #c2c6d6', borderRadius: '999px', overflow: 'hidden', bgcolor: '#f9f9ff' }}>
                    <Button onClick={() => setDuracionSeg(Math.max(5, duracionSeg - 5))} disabled={persistente} sx={{ minWidth: 38, height: 38 }}>−</Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1 }}>
                      <input type="number" className="no-spin" value={duracionSeg} onChange={(e) => setDuracionSeg(Math.min(360, Math.max(5, Number(e.target.value))))} disabled={persistente} style={{ width: 48, border: 'none', outline: 'none', background: 'transparent', textAlign: 'center' }} />
                      <Typography sx={{ fontSize: '12px' }}>seg</Typography>
                    </Box>
                    <Button onClick={() => setDuracionSeg(Math.min(360, duracionSeg + 5))} disabled={persistente} sx={{ minWidth: 38, height: 38 }}>+</Button>
                  </Box>
                  {duracionSeg === 15 && <Typography sx={{ fontSize: '11px', color: '#0058be', fontWeight: 500 }}>Recomendado</Typography>}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography sx={{ fontWeight: 500 }}>Persistente</Typography><Typography sx={{ fontSize: '11.5px', color: '#6b7280' }}>El usuario debe cerrar manualmente</Typography></Box>
                <Switch checked={persistente} onChange={(e) => setPersistente(e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#0058be' } }} />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography sx={{ fontWeight: 500 }}>Clickeable</Typography><Typography sx={{ fontSize: '11.5px', color: '#6b7280' }}>Permite hacer clic sobre la alerta</Typography></Box>
                <Switch checked={clickeable} onChange={(e) => setClickeable(e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#0058be' } }} />
              </Box>

              <Box sx={{ opacity: clickeable ? 1 : 0.5, pointerEvents: clickeable ? 'auto' : 'none' }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 500, mb: 1 }}>Ruta de acción</Typography>
                <TextField fullWidth size="small" placeholder="Ej: /modulo/detalles" value={rutaAccion} onChange={(e) => setRutaAccion(e.target.value)} disabled={!clickeable} sx={inputStyle} />
              </Box>

              <Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 500, mb: 1 }}>Excluir terminales</Typography>
                <Box sx={{ minHeight: 44, border: '1px solid #c2c6d6', borderRadius: '10px', p: 1, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', bgcolor: '#ffffff' }}>
                  {excluir.map((e, i) => (<Chip key={i} label={e} size="small" onDelete={() => setExcluir(excluir.filter((_, j) => j !== i))} sx={{ bgcolor: '#ffdad6', color: '#93000a' }} />))}
                  <input style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'Inter', fontSize: '14px', minWidth: 150, background: 'transparent' }} placeholder="Código y Enter (Ej: 31:CF)" value={inputExcluir} onChange={(e) => setInputExcluir(e.target.value)} onKeyDown={handleKeyDownExcluir} />
                </Box>
              </Box>
            </Box>
          </Box>

          {error && <Box sx={{ bgcolor: '#ffdad6', border: '1px solid #ba1a1a', borderRadius: '8px', p: 2 }}><Typography sx={{ color: '#93000a' }}>{error}</Typography></Box>}
          {exito && <Box sx={{ bgcolor: '#e6f4ea', border: '1px solid #2e7d32', borderRadius: '8px', p: 2 }}><Typography sx={{ color: '#2e7d32' }}>✓ Notificación enviada correctamente.</Typography></Box>}
        </Box>

        <Box sx={{ px: 4, py: 3, borderTop: '1px solid #e1e2ec', bgcolor: '#f9f9ff', display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleSubmit} disabled={enviando} startIcon={<SendIcon />} sx={{ bgcolor: '#0058be', '&:hover': { bgcolor: '#004395' }, borderRadius: '999px', textTransform: 'none', px: 4, py: 1.5 }}>{enviando ? 'Enviando...' : 'Enviar Notificación'}</Button>
        </Box>
      </Box>_
    </>
  );
};

export default CreateNotification;