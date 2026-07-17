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
import CheckCircle from '@mui/icons-material/CheckCircle';
import Warning from '@mui/icons-material/Warning';
import CalendarMonth from '@mui/icons-material/CalendarMonth';

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
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, fontWeight: 700, color: "#004680", display: "flex", alignItems: "center", gap: 1.5, fontSize: "1.15rem" }}>
        <DesktopWindows sx={{ fontSize: 30, color: "#004680" }} />
        Verificación obligatoria antes de continuar
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 0.5 }}>
          {/* Descripción general */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
            Antes de iniciar la causación, asegúrate de que el programa <strong>Ultra</strong> esté correctamente configurado. Si Ultra no está en el módulo y mes correcto, <strong>el proceso fallará</strong>.
          </Typography>

          {/* Lista de verificación */}
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}>
            Verifica los siguientes puntos:
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <CheckCircle sx={{ fontSize: 18, color: "#16a34a", mt: "2px", flexShrink: 0 }} />
              <Typography variant="body2" sx={{ color: "#1e293b", lineHeight: 1.5 }}>
                Ultra está <strong>abierto</strong> en tu computadora.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <CheckCircle sx={{ fontSize: 18, color: "#16a34a", mt: "2px", flexShrink: 0 }} />
              <Typography variant="body2" sx={{ color: "#1e293b", lineHeight: 1.5 }}>
                Estás en el <strong>módulo correcto</strong> de causación / contabilización de facturas.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <CalendarMonth sx={{ fontSize: 18, color: "#d97706", mt: "2px", flexShrink: 0 }} />
              <Typography variant="body2" sx={{ color: "#1e293b", lineHeight: 1.5 }}>
                El <strong>mes activo en Ultra</strong> corresponde al mes en el que se van a contabilizar las facturas.
              </Typography>
            </Box>
          </Box>

          {/* Alerta de mes */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, backgroundColor: "#fffbeb", border: "1px solid #fcd34d", borderLeft: "4px solid #d97706", borderRadius: 2, p: 1.5 }}>
            <Warning sx={{ fontSize: 20, color: "#d97706", mt: "1px", flexShrink: 0 }} />
            <Typography variant="body2" sx={{ color: "#92400e", lineHeight: 1.6, fontWeight: 500 }}>
              <strong>¡Atención con el mes!</strong> Si Ultra está abierto en un mes diferente al de las facturas a contabilizar, el proceso registrará los movimientos en el mes incorrecto y deberá ser corregido manualmente.
            </Typography>
          </Box>
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
