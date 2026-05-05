import React from "react";
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Typography, Button, Zoom 
} from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

interface PasteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  newColumnsCount: number;
}

export const PasteConfirmDialog: React.FC<PasteConfirmDialogProps> = ({ 
  open, onClose, onConfirm, newColumnsCount 
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    TransitionComponent={Zoom}
    PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
  >
    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "#4f46e5", fontWeight: 900 }}>
      <ErrorOutlineIcon color="primary" />
      PASTE INTELLIGENCE
    </DialogTitle>
    <DialogContent>
      <Typography variant="body1" sx={{ color: "#334155", mt: 1 }}>
        Los datos superan las columnas actuales. ¿Deseas crear las {newColumnsCount} columnas adicionales automáticamente?
      </Typography>
    </DialogContent>
    <DialogActions sx={{ p: 2.5, pt: 0 }}>
      <Button onClick={onClose} sx={{ fontWeight: 700, px: 3 }}>Cancelar</Button>
      <Button onClick={onConfirm} variant="contained" sx={{ borderRadius: 2, fontWeight: 900, px: 3, backgroundColor: "#4f46e5" }}>
        Confirmar
      </Button>
    </DialogActions>
  </Dialog>
);