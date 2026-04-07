import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  IconButton,
  Divider,
  TextField,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SearchIcon from "@mui/icons-material/Search";
import { Traslado } from "../hooks/types";

interface Props {
  open: boolean;
  onClose: () => void;
  trasladoId: number | null;
  items: Traslado[];
}

const TrasladoDetalleModal: React.FC<Props> = ({ open, onClose, trasladoId, items }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.referencia?.toLowerCase().includes(term) ||
        item.nombre_referencia?.toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  const totalUnidades = filteredItems.reduce((sum, item) => sum + (item.unidades || 0), 0);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          backgroundColor: "#FFFFFF",
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <ReceiptLongIcon sx={{ color: "#2563EB", fontSize: 28 }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: "#1E293B" }}>
            Detalle del Traslado {trasladoId}
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />

      <Box sx={{ p: 2, backgroundColor: "#FFFFFF" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por referencia o nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#94A3B8" }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                backgroundColor: "#F8FAFC",
                "& fieldset": { borderColor: "#E2E8F0" },
                "&:hover fieldset": { borderColor: "#CBD5E1" },
              }
            }
          }}
        />
      </Box>

      <DialogContent sx={{ p: 0, backgroundColor: "#FFFFFF" }}>
        <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 400, borderRadius: 0 }}>
          <Table stickyHeader aria-label="customized table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, backgroundColor: "#F8FAFC", color: "#64748B", borderBottom: "2px solid #E2E8F0" }}>Referencia</TableCell>
                <TableCell sx={{ fontWeight: 700, backgroundColor: "#F8FAFC", color: "#64748B", borderBottom: "2px solid #E2E8F0" }}>Nombre Referencia</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: "#F8FAFC", color: "#64748B", borderBottom: "2px solid #E2E8F0" }}>Unidades</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <TableRow 
                    key={`${item.traslado}-${item.referencia}-${index}`}
                    sx={{ '&:hover': { backgroundColor: "#F8FAFC" }, '& td': { borderBottom: "1px solid #F1F5F9" } }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: "#334155" }}>{item.referencia || "N/A"}</TableCell>
                    <TableCell sx={{ color: "#475569" }}>{item.nombre_referencia || "Sin nombre"}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#2563EB" }}>{item.unidades}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4, color: "#94A3B8" }}>
                    No se encontraron referencias que coincidan con la búsqueda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, justifyContent: "space-between", backgroundColor: "#FFFFFF" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="subtitle2" sx={{ color: "#64748B", fontWeight: 600 }}>
            Total Unidades{searchTerm && " (filtradas)"}:
          </Typography>
          <Typography variant="h6" sx={{ color: "#1E293B", fontWeight: 800 }}>
            {totalUnidades}
          </Typography>
        </Box>
        <Button 
          onClick={onClose} 
          variant="contained" 
          sx={{ 
            borderRadius: 2, 
            textTransform: "none", 
            fontWeight: 700,
            px: 4,
            boxShadow: "none",
            "&:hover": { boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TrasladoDetalleModal;
