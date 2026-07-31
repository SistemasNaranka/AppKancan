import {
  Typography, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Alert, CircularProgress, List, ListItem, ListItemText
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import dayjs from 'dayjs';

interface ConfirmClosedDayDialogsProps {
  // Modal Individual
  confirmClosedModalOpen: boolean;
  setConfirmClosedModalOpen: (open: boolean) => void;
  fechaDisplay: string;
  recordsDiaCount: number;
  guardandoDiaCerrado: boolean;
  executeToggleDiaCerrado: (actualmenteCerrado: boolean) => Promise<void>;

  // Modal Masivo
  confirmMasivoOpen: boolean;
  setConfirmMasivoOpen: (open: boolean) => void;
  diasSeleccionadosSet: Set<string>;
  tiendaNombre: string;
  registrosPorFechaSeleccionada: Record<string, number>;
  guardandoMasivo: boolean;
  handleGuardarMasivo: () => Promise<void>;
}

export default function ConfirmClosedDayDialogs({
  confirmClosedModalOpen,
  setConfirmClosedModalOpen,
  fechaDisplay,
  recordsDiaCount,
  guardandoDiaCerrado,
  executeToggleDiaCerrado,
  confirmMasivoOpen,
  setConfirmMasivoOpen,
  diasSeleccionadosSet,
  tiendaNombre,
  registrosPorFechaSeleccionada,
  guardandoMasivo,
  handleGuardarMasivo
}: ConfirmClosedDayDialogsProps) {
  return (
    <>
      {/* MODAL DE CONFIRMACIÓN DE DÍA NO LABORAL (INDIVIDUAL) */}
      <Dialog
        open={confirmClosedModalOpen}
        onClose={() => setConfirmClosedModalOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1, maxWidth: 480 } } }}
      >
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
          <WarningAmberIcon sx={{ fontSize: 28, color: '#d97706' }} />
          <Typography variant="h6" fontWeight={700} sx={{ color: '#d97706' }}>
            Confirmar Tienda Cerrada
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <Typography variant="body1" sx={{ color: '#0a1929', fontWeight: 500, mb: 1.5 }}>
            La fecha <strong>{fechaDisplay}</strong> tiene actualmente <strong style={{ color: '#d97706' }}>{recordsDiaCount} registro(s)</strong> reportados por los empleados.
          </Typography>
          <Alert severity="warning" sx={{ borderRadius: 2, bgcolor: '#fffbe6', borderColor: '#ffe58f', color: '#0a1929', '& .MuiAlert-icon': { color: '#d97706' } }}>
            ¿Estás seguro de marcar este día como <strong>Tienda Cerrada</strong>? Esta fecha se mostrará como deshabilitada y no contabilizará en los días pendientes de la tienda.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
          <Button
            onClick={() => setConfirmClosedModalOpen(false)}
            variant="outlined"
            sx={{ color: '#004680', borderColor: '#004680', borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => executeToggleDiaCerrado(false)}
            variant="contained"
            disabled={guardandoDiaCerrado}
            sx={{ bgcolor: '#004680', '&:hover': { bgcolor: '#003366' }, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            {guardandoDiaCerrado ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Sí, marcar como cerrada'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL DE CONFIRMACIÓN MASIVA (MULTISELECCION) */}
      <Dialog
        open={confirmMasivoOpen}
        onClose={() => !guardandoMasivo && setConfirmMasivoOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1, maxWidth: 520 } } }}
      >
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
          <WarningAmberIcon sx={{ fontSize: 28, color: '#d97706' }} />
          <Typography variant="h6" fontWeight={700} sx={{ color: '#d97706' }}>
            Confirmar cierre de {diasSeleccionadosSet.size} día(s)
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <Typography variant="body2" sx={{ color: '#0a1929', fontWeight: 500, mb: 1.5 }}>
            Se marcarán los siguientes días como <strong>Tienda Cerrada</strong> para <strong>{tiendaNombre}</strong>:
          </Typography>

          <List dense disablePadding sx={{ mb: 1.5, maxHeight: 220, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 2 }}>
            {Array.from(diasSeleccionadosSet).sort().map(fecha => {
              const count = registrosPorFechaSeleccionada[fecha] ?? 0;
              const label = dayjs(fecha).locale('es').format('dddd, D [de] MMMM');
              return (
                <ListItem key={fecha} sx={{ py: 0.5, borderBottom: '1px solid #f0f0f0' }}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={600} color="#0a1929">
                        {label}
                      </Typography>
                    }
                    secondary={
                      count > 0
                        ? <Typography variant="caption" color="#d97706" fontWeight={600}>{count} registro(s) de empleados</Typography>
                        : <Typography variant="caption" color="#94a3b8">Sin registros</Typography>
                    }
                  />
                  {count > 0 && <WarningAmberIcon sx={{ fontSize: 18, color: '#d97706', flexShrink: 0 }} />}
                </ListItem>
              );
            })}
          </List>

          {Object.values(registrosPorFechaSeleccionada).some(c => c > 0) && (
            <Alert severity="warning" sx={{ borderRadius: 2, bgcolor: '#fffbe6', color: '#0a1929', '& .MuiAlert-icon': { color: '#d97706' } }}>
              Algunos días tienen registros de empleados. De todas formas se marcarán como <strong>Tienda Cerrada</strong>.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
          <Button
            onClick={() => setConfirmMasivoOpen(false)}
            disabled={guardandoMasivo}
            variant="outlined"
            sx={{ color: '#004680', borderColor: '#004680', borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGuardarMasivo}
            variant="contained"
            disabled={guardandoMasivo}
            sx={{ bgcolor: '#004680', '&:hover': { bgcolor: '#003366' }, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            {guardandoMasivo
              ? <><CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} />Guardando...</>
              : `Confirmar ${diasSeleccionadosSet.size} día(s)`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
