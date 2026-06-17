import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import WarningAmber from '@mui/icons-material/WarningAmber';

interface NoEntradasModalProps {
  open: boolean;
  onClose: () => void;
  nit: string | null;
  proveedorNombre?: string;
}

export function NoEntradasModal({
  open,
  onClose,
  nit,
  proveedorNombre,
}: NoEntradasModalProps) {
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
      <DialogTitle sx={{ pb: 1, fontWeight: 700, color: "error.main", display: "flex", alignItems: "center", gap: 1 }}>
        <WarningAmber sx={{ fontSize: 28, color: "error.main" }} />
        Sin Entradas de Mercancía
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
            No se encontraron entradas de mercancía habilitadas.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            El proveedor <strong>{proveedorNombre || "Proveedor"}</strong> con NIT <strong>{nit}</strong> no tiene registros activos en la tabla de entradas de mercancía.
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "error.main", mt: 1 }}>
            Se debe actualizar la base de datos con las entradas correspondientes.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          onClick={onClose}
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
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
}
