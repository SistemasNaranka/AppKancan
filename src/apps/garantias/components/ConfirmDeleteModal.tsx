import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import WarningIcon from '@mui/icons-material/Warning';
import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';

interface ConfirmDeleteModalProps {
  open: boolean;
  garantia: { id: number; cliente_nombre: string; producto_nombre: string } | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  open,
  garantia,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!garantia) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <WarningIcon color="error" fontSize="large" />
        <Typography variant="h6" fontWeight={600}>
          Confirmar Eliminación
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ textAlign: "center", py: 2 }}>
          <Typography variant="body1" gutterBottom>
            ¿Está seguro de que desea eliminar esta garantía?
          </Typography>
          
          <Box
            sx={{
              bgcolor: "error.light",
              color: "error.contrastText",
              p: 2,
              borderRadius: 2,
              mt: 2,
            }}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              Garantía #{garantia.id}
            </Typography>
            <Typography variant="body2">
              Cliente: {garantia.cliente_nombre}
            </Typography>
            <Typography variant="body2">
              Producto: {garantia.producto_nombre}
            </Typography>
          </Box>

          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          startIcon={<CancelIcon />}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          startIcon={<DeleteIcon />}
          disabled={isLoading}
        >
          {isLoading ? "Eliminando..." : "Eliminar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
