import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Typography, Alert,
  Button, CircularProgress
} from '@mui/material';
import {
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

interface ConfirmCierreMasivoDialogProps {
  open: boolean;
  onClose: () => void;
  guardando: boolean;
  isCerrar: boolean;
  diasCount: number;
  tiendasCount: number;
  totalOperaciones: number;
  mainColor: string;
  mainColorHover: string;
  onConfirm: () => void;
}

export const ConfirmCierreMasivoDialog: React.FC<ConfirmCierreMasivoDialogProps> = React.memo(({
  open,
  onClose,
  guardando,
  isCerrar,
  diasCount,
  tiendasCount,
  totalOperaciones,
  mainColor,
  mainColorHover,
  onConfirm,
}) => {
  return (
    <Dialog
      open={open}
      onClose={() => !guardando && onClose()}
      slotProps={{ paper: { sx: { borderRadius: 3, p: 1, maxWidth: 450 } } }}
    >
      <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
        {isCerrar
          ? <BlockIcon sx={{ fontSize: 26, color: '#d97706' }} />
          : <CheckCircleIcon sx={{ fontSize: 26, color: '#2e7d32' }} />}
        <Typography variant="h6" fontWeight={700} color={isCerrar ? '#d97706' : '#2e7d32'}>
          {isCerrar ? 'Confirmar cierre masivo' : 'Confirmar reapertura masiva'}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ py: 1 }}>
        <Typography variant="body2" color="#0a1929" fontWeight={500} sx={{ mb: 1.5 }}>
          {isCerrar ? (
            <>Se marcarán <strong>{diasCount} día(s)</strong> como <strong>Tienda Cerrada</strong> para <strong>{tiendasCount} tienda(s)</strong>.</>
          ) : (
            <>Se reabrirán <strong>{diasCount} día(s)</strong> (quitar cierre) para <strong>{tiendasCount} tienda(s)</strong>.</>
          )}
        </Typography>
        <Alert
          severity={isCerrar ? 'warning' : 'info'}
          sx={{
            borderRadius: 2,
            bgcolor: isCerrar ? '#fffbe6' : '#e8f5e9',
            color: '#0a1929',
            '& .MuiAlert-icon': { color: isCerrar ? '#d97706' : '#2e7d32' }
          }}
        >
          {isCerrar ? (
            <>Se ejecutarán <strong>{totalOperaciones} operaciones</strong>. Si algún día ya estaba marcado, únicamente se actualizará su estado.</>
          ) : (
            <>Únicamente se modificarán las tiendas que tengan registros de cierre en esas fechas (no se crearán registros innecesarios si la tienda ya estaba abierta).</>
          )}
        </Alert>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button
          onClick={onClose}
          disabled={guardando}
          variant="outlined"
          sx={{ color: '#64748b', borderColor: '#cbd5e1', borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={guardando}
          sx={{ bgcolor: mainColor, '&:hover': { bgcolor: mainColorHover }, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
        >
          {guardando
            ? <><CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} />Guardando...</>
            : (isCerrar ? `Confirmar Cierre` : `Confirmar Reapertura`)}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
