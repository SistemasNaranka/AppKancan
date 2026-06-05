import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import DesktopWindows from '@mui/icons-material/DesktopWindows';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Cancel from '@mui/icons-material/Cancel';

interface ConfirmUltraModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmUltraModal({
  open,
  onClose,
  onConfirm,
}: ConfirmUltraModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, fontWeight: 700, color: "#004680", display: "flex", alignItems: "center", gap: 1.5 }}>
        <DesktopWindows sx={{ fontSize: 28, color: "#004680" }} />
        ¿Ultra está listo?
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, color: "#1e293b" }}>
            Aviso de preparación obligatorio
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5 }}>
            Para proceder con la causación, es indispensable que tengas el programa local de <strong>Ultra</strong> abierto en tu computadora y ubicado en la sección correcta.
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#0284c7", backgroundColor: "#f0f9ff", p: 1.5, borderRadius: 2, borderLeft: "4px solid #0284c7" }}>
            💡 Si no lo has abierto, tómate un momento para iniciarlo ahora mismo antes de presionar continuar.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button
          variant="contained"
          onClick={onClose}
          startIcon={<Cancel />}
          sx={{
            backgroundColor: "#EF5350",
            color: "#FFFFFF",
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#C62828",
              boxShadow: "none",
            },
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          startIcon={<PlayArrow />}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
            },
          }}
        >
          Ejecutar y Continuar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
