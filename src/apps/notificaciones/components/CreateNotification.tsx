import { useState } from 'react';
import {
  Box, Typography, TextField, Chip, Button, Switch,
  ToggleButton, ToggleButtonGroup,
  Divider, Paper, Collapse
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import TuneIcon from '@mui/icons-material/Tune';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// Componentes del Calendario oficial de la App
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import "dayjs/locale/es";

import { ICreateNotification } from '../interfaces/notification.interface';
import { servicioNotificaciones } from '../services/notification.service';

// Forzar idioma español para el calendario
dayjs.locale("es");

const tiposAlerta = [
  { value: 'info', label: 'Informativa', icon: <InfoOutlinedIcon fontSize="small" />, color: '#0058be' },
  { value: 'success', label: 'Éxito', icon: <CheckCircleOutlineIcon fontSize="small" />, color: '#2e7d32' },
  { value: 'warning', label: 'Advertencia', icon: <WarningAmberIcon fontSize="small" />, color: '#944600' },
  { value: 'error', label: 'Error Crítico', icon: <ErrorOutlineIcon fontSize="small" />, color: '#ba1a1a' },
];

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    fontFamily: 'Inter',
    backgroundColor: '#ffffff',
    cursor: 'text',
    '&:hover': { backgroundColor: '#ffffff' },
    '&.Mui-focused': { backgroundColor: '#ffffff' },
    '&.Mui-disabled': { backgroundColor: '#f9f9ff' },
  },
  '& .MuiOutlinedInput-input': {
    padding: '12px 14px',
    cursor: 'text',
    color: '#191b23'
  }
};

// Ajuste para el recuadro de hora nativo (evita que se corte el AM/PM)
const inputHoraStyle = {
  ...inputStyle,
  width: 175, 
  '& .MuiOutlinedInput-input': {
    padding: '12px 6px', 
    color: '#191b23',
    fontFamily: 'Inter',
  }
};

const CreateNotification = () => {
  const [destinatarios, setDestinatarios] = useState<string[]>([]);
  const [inputDestinatario, setInputDestinatario] = useState('');
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

  const agregarDestinatario = (valor: string) => {
    const v = valor.trim();
    if (v && !destinatarios.includes(v)) {
      setDestinatarios([...destinatarios, v]);
    }
    setInputDestinatario('');
  };

  const handleKeyDownDestinatario = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      agregarDestinatario(inputDestinatario);
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

  const handleSubmit = async () => {
    setError(null);
    setExito(false);

    if (recordatorio) {
      if (!fechaRecordatorio || !horaRecordatorio) {
        setError('Debes definir fecha y hora para el recordatorio.');
        return;
      }
    } else if (destinatarios.length === 0) {
      setError('Debes agregar al menos un destinatario.');
      return;
    }

    if (!mensaje.trim()) {
      setError('El mensaje no puede estar vacío.');
      return;
    }

    let fecha_programada: string | null = null;
    if (recordatorio && fechaRecordatorio && horaRecordatorio) {
      fecha_programada = `${fechaRecordatorio} ${horaRecordatorio}`;
    } else if (programar && fechaProgramada && horaProgramada) {
      fecha_programada = `${fechaProgramada} ${horaProgramada}`;
    }

    const payload: ICreateNotification = {
      destinatarios: recordatorio ? ['yo'] : destinatarios,
      titulo: titulo || 'Notificación',
      mensaje,
      tipo,
      duracion_seg: duracionSeg,
      persistente,
      clickeable,
      mostrar_boton_cerrar: true,
      pausar_al_hover: true,
      excluir: recordatorio ? [] : excluir,
      ruta_accion: rutaAccion || null,
      fecha_programada,
    };

    try {
      setEnviando(true);
      await servicioNotificaciones.enviarNotificacion(payload);
      setExito(true);
      setDestinatarios([]);
      setTitulo('');
      setMensaje('');
      setProgramar(false);
      setFechaProgramada('');
      setHoraProgramada('');
      setRecordatorio(false);
      setFechaRecordatorio('');
      setHoraRecordatorio('');
      setExcluir([]);
      setRutaAccion('');
      setDuracionSeg(15);
    } catch (err: any) {
      setError(err.message || 'Error desconocido.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <style>{`
        .no-spin::-webkit-outer-spin-button,
        .no-spin::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>

      <Box sx={{ width: '100%', maxWidth: 1060, mx: 'auto', bgcolor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1px solid #e1e2ec', overflow: 'hidden' }}>

        {/* Header */}
        <Box sx={{ px: 4, py: 3, borderBottom: '1px solid #e1e2ec', bgcolor: '#f9f9ff' }}>
          <Typography sx={{ fontSize: '24px', fontWeight: 600, color: '#0058be', fontFamily: 'Inter' }}>
            Envío de Notificaciones
          </Typography>
          <Typography sx={{ fontSize: '14px', color: '#424754', fontFamily: 'Inter', mt: 0.5 }}>
            Configura y emite alertas a través de AppKancan.
          </Typography>
        </Box>

        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>

          {/* Fila de Tarjetas Superiores */}
          <Box sx={{ display: 'flex', gap: 3, width: '100%', alignItems: 'flex-start' }}>

            {/* Tarjeta 1: Programar para más tarde */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: '12px 16px', 
                bgcolor: '#f8f9fa', 
                border: '1px solid #e5e7eb', 
                borderRadius: '14px', 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                opacity: recordatorio ? 0.4 : 1, 
                pointerEvents: recordatorio ? 'none' : 'auto' 
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Box sx={{ pr: 2 }}>
                  <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#191b23', fontFamily: 'Inter' }}>
                    Programar para más tarde
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: '#4b5563', fontFamily: 'Inter', mt: 0.5, lineHeight: 1.4 }}>
                    Selecciona la fecha y hora en la que deseas programar el envío
                  </Typography>
                </Box>
                <Switch
                  checked={programar}
                  onChange={(e) => setProgramar(e.target.checked)}
                  disabled={recordatorio}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#0058be' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#0058be' } }}
                />
              </Box>
              
              <Collapse in={programar}>
                <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                    <DatePicker
                      value={fechaProgramada ? dayjs(fechaProgramada) : null}
                      onChange={(newValue) => {
                        setFechaProgramada(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "");
                      }}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          sx: inputStyle
                        }
                      }}
                    />
                  </LocalizationProvider>
                  <TextField type="time" size="small" sx={inputHoraStyle} value={horaProgramada} onChange={(e) => setHoraProgramada(e.target.value)} />
                </Box>
              </Collapse>
            </Paper>

            {/* Tarjeta 2: Recordatorio Personal */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: '12px 16px', 
                bgcolor: '#f8f9fa', 
                border: '1px solid #e5e7eb', 
                borderRadius: '14px', 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                opacity: programar ? 0.4 : 1,
                pointerEvents: programar ? 'none' : 'auto'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Box sx={{ pr: 2 }}>
                  <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#191b23', fontFamily: 'Inter' }}>
                    Recordatorio personal
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: '#4b5563', fontFamily: 'Inter', mt: 0.5, lineHeight: 1.4 }}>
                    Envíate un recordatorio en una fecha y hora.
                  </Typography>
                </Box>
                <Switch
                  checked={recordatorio}
                  onChange={(e) => {
                    setRecordatorio(e.target.checked);
                    if (e.target.checked) setProgramar(false);
                  }}
                  disabled={programar}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#0058be' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#0058be' } }}
                />
              </Box>

              <Collapse in={recordatorio}>
                <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                    <DatePicker
                      value={fechaRecordatorio ? dayjs(fechaRecordatorio) : null}
                      onChange={(newValue) => {
                        setFechaRecordatorio(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "");
                      }}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          sx: inputStyle
                        }
                      }}
                    />
                  </LocalizationProvider>
                  <TextField type="time" size="small" sx={inputHoraStyle} value={horaRecordatorio} onChange={(e) => setHoraRecordatorio(e.target.value)} />
                </Box>
              </Collapse>
            </Paper>

          </Box>

          {/* Destinatarios */}
          <Box sx={{ opacity: recordatorio ? 0.5 : 1, transition: 'opacity 0.3s', pointerEvents: recordatorio ? 'none' : 'auto' }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#374151', fontFamily: 'Inter', mb: 1 }}>
              Destinatarios
            </Typography>
            <Box sx={{ minHeight: 48, border: '1px solid #c2c6d6', borderRadius: '10px', p: 1, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', bgcolor: '#ffffff', '&:focus-within': { borderColor: '#0058be', borderWidth: 2 } }}>
              {destinatarios.map((d, i) => (
                <Chip key={i} label={d} size="small" onDelete={() => setDestinatarios(destinatarios.filter((_, j) => j !== i))}
                  sx={{ bgcolor: '#d8e2ff', color: '#004395', fontFamily: 'Inter', fontSize: '11px' }} />
              ))}
              <input
                style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'Inter', fontSize: '14px', minWidth: 150, background: 'transparent', padding: '4px 0' }}
                placeholder="Añadir destinatario y presionar Enter..."
                value={inputDestinatario}
                onChange={(e) => setInputDestinatario(e.target.value)}
                onKeyDown={handleKeyDownDestinatario}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
              {['todos', 'grupo:', 'area:'].map((atajo) => (
                <Chip key={atajo} label={`+ ${atajo}`} size="small" onClick={() => agregarDestinatario(atajo)} variant="outlined"
                  sx={{ fontSize: '11px', fontFamily: 'Inter', cursor: 'pointer', borderColor: '#c2c6d6', color: '#424754', '&:hover': { bgcolor: '#ecedf8', borderColor: '#0058be', color: '#0058be' } }} />
              ))}
            </Box>
            <Typography sx={{ fontSize: '11px', color: '#6b7280', fontFamily: 'Inter', mt: 1 }}>
              Formatos: <strong>todos</strong>, <strong>grupo:Nombre</strong>, <strong>area:Nombre</strong> o código directo (Ej: 31:ST)
            </Typography>
          </Box>

          {/* Título */}
          <Box>
            <TextField fullWidth size="small" placeholder="Escribe el título del recordatorio..." value={titulo}
              onChange={(e) => setTitulo(e.target.value)} inputProps={{ maxLength: 100 }} sx={inputStyle} />
          </Box>

          {/* Mensaje */}
          <Box>
            <Box sx={{ position: 'relative' }}>
              <TextField fullWidth multiline rows={4} placeholder="Escribe el mensaje o descripción..." value={mensaje}
                onChange={(e) => setMensaje(e.target.value)} inputProps={{ maxLength: 600 }} 
                sx={{
                  ...inputStyle,
                  '& .MuiOutlinedInput-input': { padding: '4px 2px' }
                }} 
              />
              <Typography sx={{ position: 'absolute', bottom: 10, right: 12, fontSize: '11px', color: mensaje.length >= 600 ? '#ba1a1a' : '#6b7280', fontFamily: 'Inter' }}>
                {mensaje.length}/600
              </Typography>
            </Box>
          </Box>

          {/* Tipo de Alerta */}
          <Box>
            <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#0058be', fontFamily: 'Inter', mb: 1.5 }}>Tipo de Alerta</Typography>
            <ToggleButtonGroup value={tipo} exclusive onChange={(_, val) => val && setTipo(val)} sx={{ flexWrap: 'wrap', gap: 2 }}>
              {tiposAlerta.map((t) => (
                <ToggleButton key={t.value} value={t.value}
                  sx={{
                    borderRadius: '999px !important', border: '1px solid #c2c6d6 !important', px: 2.5, py: 0.8,
                    display: 'flex', gap: 0.75, textTransform: 'none', fontFamily: 'Inter', fontSize: '13.5px', fontWeight: 500,
                    color: '#424754',
                    transition: 'all 0.2s ease',
                    '&.Mui-selected': { 
                      bgcolor: `${t.color}24`, 
                      borderColor: `${t.color} !important`, 
                      color: t.color,
                      boxShadow: `0 3px 10px ${t.color}30`, 
                      '&:hover': {
                        bgcolor: `${t.color}35`, 
                      }
                    },
                    '&:hover': { bgcolor: '#ecedf8' }
                  }}>
                  <Box sx={{ color: tipo === t.value ? t.color : '#424754', display: 'flex', alignItems: 'center' }}>{t.icon}</Box>
                  {t.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Opciones Avanzadas */}
          <Divider sx={{ borderColor: '#e1e2ec', my: 1 }} />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <TuneIcon sx={{ color: '#424754', fontSize: 20 }} />
              <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#191b23', fontFamily: 'Inter' }}>Opciones Avanzadas</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>

              {/* Duración */}
              <Box sx={{ opacity: persistente ? 0.5 : 1, transition: 'opacity 0.3s', pointerEvents: persistente ? 'none' : 'auto' }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#424754', fontFamily: 'Inter', mb: 1.5 }}>
                  Duración en pantalla
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #c2c6d6', borderRadius: '999px', overflow: 'hidden', bgcolor: '#f9f9ff' }}>
                    <Button onClick={() => setDuracionSeg(Math.max(5, duracionSeg - 5))} disabled={persistente}
                      sx={{ minWidth: 38, height: 38, borderRadius: 0, color: '#424754', fontSize: '18px', fontWeight: 300, '&:hover': { bgcolor: '#ecedf8' } }}>−
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1 }}>
                      <input
                        type="number"
                        className="no-spin"
                        value={duracionSeg}
                        onChange={(e) => {
                          // Tope mínimo de 5s y máximo de 360s
                          const val = Math.min(360, Math.max(5, Number(e.target.value)));
                          setDuracionSeg(val);
                        }}
                        disabled={persistente}
                        style={{ width: 48, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, color: '#191b23', textAlign: 'center', MozAppearance: 'textfield' }}
                      />
                      <Typography sx={{ fontSize: '12px', color: '#424754', fontFamily: 'Inter' }}>seg</Typography>
                    </Box>
                    <Button onClick={() => setDuracionSeg(Math.min(360, duracionSeg + 5))} disabled={persistente}
                      sx={{ minWidth: 38, height: 38, borderRadius: 0, color: '#424754', fontSize: '18px', fontWeight: 300, '&:hover': { bgcolor: '#ecedf8' } }}>+
                    </Button>
                  </Box>
                  {duracionSeg === 15 && (
                    <Typography sx={{ fontSize: '11px', color: '#0058be', fontFamily: 'Inter', fontWeight: 500 }}>
                      Recomendado
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Persistente */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#191b23', fontFamily: 'Inter' }}>Persistente</Typography>
                  <Typography sx={{ fontSize: '11.5px', color: '#6b7280', fontFamily: 'Inter', mt: 0.5 }}>El usuario debe cerrar la alerta manualmente.</Typography>
                </Box>
                <Switch checked={persistente} onChange={(e) => setPersistente(e.target.checked)}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#0058be' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#0058be' } }} />
              </Box>

              {/* Clickeable */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#191b23', fontFamily: 'Inter' }}>Clickeable</Typography>
                  <Typography sx={{ fontSize: '11.5px', color: '#6b7280', fontFamily: 'Inter', mt: 0.5 }}>Permite que el usuario haga clic sobre la alerta.</Typography>
                </Box>
                <Switch checked={clickeable} onChange={(e) => setClickeable(e.target.checked)}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#0058be' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#0058be' } }} />
              </Box>

              {/* Ruta de acción */}
              <Box sx={{ opacity: clickeable ? 1 : 0.5, transition: 'opacity 0.3s', pointerEvents: clickeable ? 'auto' : 'none' }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#424754', fontFamily: 'Inter', mb: 1 }}>Ruta de acción</Typography>
                <TextField fullWidth size="small" placeholder="Ej: /modulo/detalles" value={rutaAccion}
                  onChange={(e) => setRutaAccion(e.target.value)} disabled={!clickeable} sx={inputStyle} />
              </Box>

              {/* Excluir terminales */}
              <Box sx={{ opacity: recordatorio ? 0.5 : 1, transition: 'opacity 0.3s', pointerEvents: recordatorio ? 'none' : 'auto' }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#424754', fontFamily: 'Inter', mb: 1 }}>Excluir terminales</Typography>
                <Box sx={{ minHeight: 44, border: '1px solid #c2c6d6', borderRadius: '10px', p: 1, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', bgcolor: '#ffffff', '&:focus-within': { borderColor: '#0058be', borderWidth: 2 } }}>
                  {excluir.map((e, i) => (
                    <Chip key={i} label={e} size="small" onDelete={() => setExcluir(excluir.filter((_, j) => j !== i))}
                      sx={{ bgcolor: '#ffdad6', color: '#93000a', fontFamily: 'Inter', fontSize: '11px' }} />
                  ))}
                  <input
                    style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'Inter', fontSize: '14px', minWidth: 150, background: 'transparent' }}
                    placeholder="Código de terminal y Enter (Ej: 31:CF)"
                    value={inputExcluir}
                    onChange={(e) => setInputExcluir(e.target.value)}
                    onKeyDown={handleKeyDownExcluir}
                  />
                </Box>
              </Box>

            </Box>
          </Box>

          {/* Mensajes de estado */}
          {error && (
            <Box sx={{ bgcolor: '#ffdad6', border: '1px solid #ba1a1a', borderRadius: '8px', p: 2 }}>
              <Typography sx={{ fontSize: '14px', color: '#93000a', fontFamily: 'Inter' }}>{error}</Typography>
            </Box>
          )}
          {exito && (
            <Box sx={{ bgcolor: '#e6f4ea', border: '1px solid #2e7d32', borderRadius: '8px', p: 2 }}>
              <Typography sx={{ fontSize: '14px', color: '#2e7d32', fontFamily: 'Inter' }}>✓ Notificación enviada correctamente.</Typography>
            </Box>
          )}

        </Box>

        {/* Footer */}
        <Box sx={{ px: 4, py: 3, borderTop: '1px solid #e1e2ec', bgcolor: '#f9f9ff', display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleSubmit} disabled={enviando} startIcon={<SendIcon />}
            sx={{ bgcolor: '#0058be', '&:hover': { bgcolor: '#004395' }, borderRadius: '999px', textTransform: 'none', fontFamily: 'Inter', fontWeight: 600, px: 4, py: 1.5 }}>
            {enviando ? 'Enviando...' : 'Enviar Notificación'}
          </Button>
        </Box>

      </Box>
    </>
  );
};

export default CreateNotification;