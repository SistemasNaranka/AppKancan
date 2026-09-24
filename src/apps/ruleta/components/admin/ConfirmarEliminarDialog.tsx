import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon, Warning as WarningIcon } from '@mui/icons-material';
import { AZUL } from '../../utils/constantes';

interface ConfirmarEliminarDialogProps {
  open: boolean;
  premioLabel: string;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmarEliminarDialog: React.FC<ConfirmarEliminarDialogProps> = ({
  open,
  premioLabel,
  saving,
  onClose,
  onConfirm,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="xs"
    fullWidth
    PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}
  >
    <DialogTitle sx={{
      m: 0, p: 2.5,
      background: `linear-gradient(135deg, ${AZUL}, #003366)`,
      color: '#ffffff', fontWeight: 700,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <WarningIcon sx={{ fontSize: 28 }} />
        <Typography variant="h6" fontWeight={700}>Eliminar premio</Typography>
      </Box>
      <IconButton onClick={onClose} sx={{ color: '#ffffff' }} disabled={saving}>
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent sx={{ p: 3, bgcolor: '#fafbfc' }}>
      <DialogContentText sx={{ fontSize: '1rem', color: '#1E293B', fontWeight: 500 }}>
        ¿Estás seguro de que deseas eliminar el premio{' '}
        <strong>"{premioLabel}"</strong>?
      </DialogContentText>
      <Typography variant="body2" color="#94A3B8" sx={{ mt: 1 }}>
        El premio se desactiva (no se borra el historial de jugadas donde ya se entregó).
      </Typography>
    </DialogContent>
    <DialogActions sx={{ p: 2.5, px: 3, borderTop: '1px solid #E2E8F0', bgcolor: '#ffffff', gap: 1 }}>
      <Button
        onClick={onClose}
        disabled={saving}
        sx={{
          textTransform: 'none', borderRadius: '10px', fontWeight: 600,
          px: 3, color: '#64748B', '&:hover': { bgcolor: '#F1F5F9' },
        }}
      >
        Cancelar
      </Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        disableElevation
        disabled={saving}
        startIcon={saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
        sx={{
          bgcolor: AZUL, textTransform: 'none', fontWeight: 700,
          borderRadius: '10px', px: 4, '&:hover': { bgcolor: '#003366' },
        }}
      >
        {saving ? 'Eliminando...' : 'Eliminar'}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmarEliminarDialog;