import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import LocalShipping from '@mui/icons-material/LocalShipping';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import { formatDate } from "../types";

export interface GoodsReceipt {
  id: number;
  supplier_id: number;
  document_number: string;
  quantity?: number;
  total_cost?: number;
  date?: string;
  status: string;
}

interface GoodsReceiptModalProps {
  open: boolean;
  entradas: GoodsReceipt[];
  onClose: () => void;
  onConfirm: (documentNumber: string) => void;
}

export function GoodsReceiptModal({
  open,
  entradas,
  onClose,
  onConfirm,
}: GoodsReceiptModalProps) {
  const [selectedNumber, setSelectedNumber] = useState<string>("");

  const handleConfirm = () => {
    if (selectedNumber) {
      onConfirm(selectedNumber);
      onClose();
    }
  };

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
      <DialogTitle sx={{ pb: 1, fontWeight: 700, color: "#1a1a1a" }}>
        Seleccionar Entrada de Mercancía
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Este proveedor tiene múltiples entradas habilitadas. Selecciona la entrada de mercancía correspondiente para esta factura:
        </Typography>

        <List sx={{ pt: 0, display: "flex", flexDirection: "column", gap: 1 }}>
          {entradas.map((entrada) => {
            const isSelected = selectedNumber === entrada.document_number;
            return (
              <ListItemButton
                key={entrada.id}
                onClick={() => setSelectedNumber(entrada.document_number)}
                selected={isSelected}
                sx={{
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: isSelected ? "#004680" : "#e2e8f0",
                  backgroundColor: isSelected ? "#f0f7ff" : "#f8fafc",
                  transition: "all 0.2s ease-in-out",
                  p: 1.5,
                  "&:hover": {
                    backgroundColor: isSelected ? "#e0f0ff" : "#f1f5f9",
                    borderColor: isSelected ? "#004680" : "#cbd5e1",
                    transform: "translateY(-1px)",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "#f0f7ff",
                    "&:hover": {
                      backgroundColor: "#e0f0ff",
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: isSelected ? "#004680" : "#64748b", minWidth: 40 }}>
                  <LocalShipping />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isSelected ? "#004680" : "#1e293b" }}>
                      Entrada: {entrada.document_number}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: "flex", flexDirection: "column", mt: 0.25 }}>
                      {entrada.date && (
                        <Typography variant="caption" sx={{ color: "#64748b" }}>
                          Fecha: {formatDate(entrada.date)}
                        </Typography>
                      )}
                      {entrada.total_cost && entrada.total_cost > 0 && (
                        <Typography variant="caption" sx={{ color: "#64748b" }}>
                          Costo Total: ${Number(entrada.total_cost).toLocaleString("es-CO")} COP
                        </Typography>
                      )}
                    </Box>
                  }
                />
                {isSelected && (
                  <CheckCircle sx={{ color: "#004680", ml: 1 }} />
                )}
              </ListItemButton>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button
          onClick={onClose}
          startIcon={<Cancel />}
          sx={{ color: "text.secondary", textTransform: "none", fontWeight: 600 }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!selectedNumber}
          sx={{
            background: "linear-gradient(135deg, #004680 0%, #0066cc 100%)",
            color: "#fff",
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            boxShadow: "none",
            "&:hover": {
              background: "linear-gradient(135deg, #003d66 0%, #0052a3 100%)",
              boxShadow: "none",
            },
            "&:disabled": {
              background: "#cbd5e1",
              color: "#94a3b8",
            },
          }}
        >
          Seleccionar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
