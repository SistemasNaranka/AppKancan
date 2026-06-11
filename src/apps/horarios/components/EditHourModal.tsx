import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Button, Box, Divider, Typography
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

interface EditHourModalProps {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  eventName: string;
  initialTimeStr: string | null;
  initialObservation: string;
  onConfirm: (timeFormatted: string, observation: string) => Promise<void> | void;
}

export default function EditHourModal({
  open,
  onClose,
  employeeName,
  eventName,
  initialTimeStr,
  initialObservation,
  onConfirm,
}: EditHourModalProps) {
  const [horaSeleccionada, setHoraSeleccionada] = useState<dayjs.Dayjs>(dayjs());
  const [horaInicial, setHoraInicial] = useState<dayjs.Dayjs | null>(null);
  const [horaObservacion, setHoraObservacion] = useState('');
  const [obsInicialHoraModal, setObsInicialHoraModal] = useState('');
  const [horaObsError, setHoraObsError] = useState('');

  // Sincronizar estados locales cuando se abre el modal
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
      setHoraObsError('');
    }
  }, [open, initialTimeStr, initialObservation]);

  const handleConfirmarHora = async () => {
    if (horaObservacion.trim().length < 7) {
      setHoraObsError('La observación debe tener al menos 7 caracteres');
      return;
    }
    const horaFormateada = horaSeleccionada.format('hh:mm A');
    await onConfirm(horaFormateada, horaObservacion);
    onClose();
  };

  const horaCambiada = !horaSeleccionada || !horaInicial || !horaSeleccionada.isSame(horaInicial, 'minute');
  const obsCambiada = horaObservacion !== obsInicialHoraModal;
  const hayCambios = horaCambiada || obsCambiada;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle component="div" sx={{ bgcolor: '#004a99', color: '#fff', py: 2, px: 3 }}>
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
          <TextField
            label="Ingresa el motivo por el cual se modificó la hora"
            multiline
            rows={4}
            fullWidth
            value={horaObservacion}
            onChange={(e) => { setHoraObservacion(e.target.value); if (e.target.value.trim().length >= 7) setHoraObsError(''); }}
            placeholder="Escriba el motivo (mínimo 7 caracteres)..."
            helperText={horaObsError || `${horaObservacion.length} caracteres (mínimo 7)`}
            slotProps={{
              formHelperText: {
                sx: { color: horaObsError ? 'error.main' : 'inherit' }
              }
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="error" sx={{ borderRadius: 2, fontWeight: 600 }}>Cancelar</Button>
        <Button onClick={handleConfirmarHora} variant="contained" disabled={!hayCambios} sx={{ bgcolor: '#004a99', borderRadius: 2, fontWeight: 600 }}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
