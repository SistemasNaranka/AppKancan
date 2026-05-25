import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Divider, IconButton,
  CircularProgress, Alert,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { getContactoConfig, updateContactoConfig } from '../api/directus/config';
import { useGlobalSnackbar } from '@/shared/components/SnackbarsPosition/SnackbarContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ContactoConfigModal: React.FC<Props> = ({ open, onClose }) => {
  const { showSnackbar } = useGlobalSnackbar();
  const [configId, setConfigId] = useState<number | null>(null);
  const [hora, setHora] = useState<Dayjs | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');

  useEffect(() => {
    if (!open) return;
    setCargando(true);
    setErrorCarga('');
    getContactoConfig().then((cfg) => {
      if (cfg) {
        setConfigId(cfg.id);
        if (cfg.daily_sync_time) {
          // "HH:MM:SS" → dayjs object usando fecha base de hoy
          const [h, m] = cfg.daily_sync_time.split(':');
          setHora(dayjs().hour(Number(h)).minute(Number(m)).second(0));
        } else {
          setHora(null);
        }
      } else {
        setErrorCarga('No se encontró la configuración');
      }
      setCargando(false);
    });
  }, [open]);

  const handleGuardar = async () => {
    if (!configId || !hora) return;
    setGuardando(true);
    const timeStr = hora.format('HH:mm:ss');
    const ok = await updateContactoConfig(configId, timeStr);
    setGuardando(false);
    if (ok) {
      showSnackbar('Hora de sincronización actualizada', 'success');
      onClose();
    } else {
      showSnackbar('Error al guardar la configuración', 'error');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>

        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ bgcolor: '#004a99', p: 0.7, borderRadius: '8px', display: 'flex', color: 'white' }}>
              <ScheduleIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography variant="h6" fontWeight={700} color="#0f172a">
              Configuración de Contactos
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: '#64748b' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 3 }}>
          {cargando ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#004a99' }} size={32} />
            </Box>
          ) : errorCarga ? (
            <Alert severity="error">{errorCarga}</Alert>
          ) : (
            <Box>
              <Typography variant="body2" fontWeight={600} color="#374151" mb={0.8}>
                Hora de sincronización diaria
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Los contactos se sincronizarán automáticamente a esta hora cada día.
              </Typography>
              <TimePicker
                value={hora}
                onChange={(val) => setHora(val)}
                ampm
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    sx: { '& .MuiOutlinedInput-root': { borderRadius: '10px' } },
                  },
                }}
              />
            </Box>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={onClose} variant="outlined"
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: '#e2e8f0', color: '#475569' }}>
            Cancelar
          </Button>
          <Button
            onClick={handleGuardar}
            variant="contained"
            disabled={guardando || cargando || !hora}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#004a99', px: 3, '&:hover': { bgcolor: '#003580' } }}
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};
