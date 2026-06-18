import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Button, Box, Divider, Typography, FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { Motivo } from '../interfaces/horarios.interface';

const NOTA_MIN_OTRO = 15;

interface EditHourModalProps {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  eventName: string;
  initialTimeStr: string | null;
  initialObservation: string;
  reasons: Motivo[];
  initialReasonId: number | null;
  onConfirm: (timeFormatted: string, observation: string, reasonId: number) => Promise<void> | void;
}

export default function EditHourModal({
  open,
  onClose,
  employeeName,
  eventName,
  initialTimeStr,
  initialObservation,
  reasons,
  initialReasonId,
  onConfirm,
}: EditHourModalProps) {
  const [horaSeleccionada, setHoraSeleccionada] = useState<dayjs.Dayjs>(dayjs());
  const [horaInicial, setHoraInicial] = useState<dayjs.Dayjs | null>(null);
  const [horaObservacion, setHoraObservacion] = useState('');
  const [obsInicialHoraModal, setObsInicialHoraModal] = useState('');
  const [reasonId, setReasonId] = useState<number | ''>('');
  const [reasonInicial, setReasonInicial] = useState<number | ''>('');

  useEffect(() => {
    if (open) {
      let horaDayjs = dayjs();
      if (initialTimeStr) {
        let hours = 0;
        let minutes = 0;
        if (initialTimeStr.includes('AM') || initialTimeStr.includes('PM')) {
          const [timePart, ampm] = initialTimeStr.split(' ');
          const [h, m] = timePart.split(':').map(Number);
          hours = h;
          minutes = m;
          if (ampm === 'PM' && hours < 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;
        } else {
          const [h, m] = initialTimeStr.split(':').map(Number);
          hours = h;
          minutes = m;
        }
        horaDayjs = dayjs().hour(hours).minute(minutes).second(0).millisecond(0);
      }
      setHoraSeleccionada(horaDayjs);
      setHoraInicial(horaDayjs);
      setHoraObservacion(initialObservation || '');
      setObsInicialHoraModal(initialObservation || '');
      setReasonId(initialReasonId ?? '');
      setReasonInicial(initialReasonId ?? '');
    }
  }, [open, initialTimeStr, initialObservation, initialReasonId]);

  const motivoSeleccionado = reasonId === '' ? undefined : reasons.find((r) => Number(r.id) === Number(reasonId));
  const esOtro = (motivoSeleccionado?.name || '').trim().toLowerCase() === 'otro';

  const handleConfirmarHora = async () => {
    if (reasonId === '') return;
    if (esOtro && horaObservacion.trim().length < NOTA_MIN_OTRO) return;
    const horaFormateada = horaSeleccionada.format('hh:mm A');
    await onConfirm(horaFormateada, horaObservacion, reasonId as number);
    onClose();
  };

  const horaCambiada = !horaSeleccionada || !horaInicial || !horaSeleccionada.isSame(horaInicial, 'minute');
  const obsCambiada = horaObservacion !== obsInicialHoraModal;
  const reasonCambiado = reasonId !== reasonInicial;
  const hayCambios = horaCambiada || obsCambiada || reasonCambiado;
  const notaValida = !esOtro || horaObservacion.trim().length >= NOTA_MIN_OTRO;
  const puedeGuardar = hayCambios && reasonId !== '' && notaValida;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle component="div" sx={{ bgcolor: '#004680', color: '#fff', py: 2, px: 3 }}>
        <Typography component="span" variant="h6" sx={{ fontWeight: 600, display: 'block' }}>Editar Hora - {eventName}</Typography>
        <Typography component="span" variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>{employeeName}</Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2.5 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
            <TimePicker
              label="Hora"
              value={horaSeleccionada}
              onChange={(val: any) => { if (val) setHoraSeleccionada(val); }}
              ampm
              slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }}
            />
          </LocalizationProvider>

          <FormControl fullWidth>
            <InputLabel id="motivo-edit-label">Motivo</InputLabel>
            <Select
              labelId="motivo-edit-label"
              label="Motivo"
              value={reasonId === '' ? '' : reasonId}
              onChange={(e) => setReasonId(Number(e.target.value))}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="" disabled>Selecciona un motivo…</MenuItem>
              {reasons.map((r) => (
                <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {esOtro && (
            <Alert
              severity="warning"
              icon={<InfoOutlinedIcon fontSize="inherit" />}
              sx={{
                borderRadius: 2,
                bgcolor: '#fff8e1',
                color: '#7a5b00',
                border: '1px solid #ffe49c',
                '& .MuiAlert-icon': { color: '#c08a00' },
                fontSize: '0.82rem',
                alignItems: 'center',
              }}
            >
              Al seleccionar <b>"Otro"</b> debes agregar una nota (mínimo {NOTA_MIN_OTRO} caracteres) para especificar el motivo.
            </Alert>
          )}

          <TextField
            label={esOtro ? 'Especifica el motivo' : 'Nota / observación (opcional)'}
            multiline
            rows={4}
            fullWidth
            value={horaObservacion}
            onChange={(e) => setHoraObservacion(e.target.value)}
            placeholder={esOtro ? `Describe qué pasó (mínimo ${NOTA_MIN_OTRO} caracteres)...` : 'Escriba una nota (opcional)...'}
            helperText={esOtro ? `${horaObservacion.trim().length}/${NOTA_MIN_OTRO} caracteres` : 'Opcional'}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600, color: '#475569', borderColor: '#cbd5e1', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f1f5f9' } }}>Cancelar</Button>
        <Button onClick={handleConfirmarHora} variant="contained" disabled={!puedeGuardar} sx={{ bgcolor: '#004680', borderRadius: 2, fontWeight: 600 }}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
