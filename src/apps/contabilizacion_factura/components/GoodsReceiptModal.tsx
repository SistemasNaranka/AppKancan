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
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import LocalShipping from '@mui/icons-material/LocalShipping';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import Search from '@mui/icons-material/Search';
import Clear from '@mui/icons-material/Clear';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { formatDate } from "../types";

dayjs.locale("es");

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
  const [filtroNumero, setFiltroNumero] = useState<string>("");
  const [filtroFecha, setFiltroFecha] = useState<string | null>(null);

  const handleClose = () => {
    setFiltroNumero("");
    setFiltroFecha(null);
    onClose();
  };

  const handleConfirm = () => {
    if (selectedNumber) {
      onConfirm(selectedNumber);
      setFiltroNumero("");
      setFiltroFecha(null);
      onClose();
    }
  };

  // Filtrar entradas
  const entradasFiltradas = entradas.filter((entrada) => {
    // 1. Filtrar por número (convertido a String para evitar TypeError si document_number es un número)
    const documentNumberStr = entrada.document_number != null ? String(entrada.document_number) : "";
    const cumpleNumero = filtroNumero.trim()
      ? documentNumberStr.toLowerCase().includes(filtroNumero.toLowerCase())
      : true;

    // 2. Filtrar por fecha (comparando año-mes-día)
    let cumpleFecha = true;
    if (filtroFecha && entrada.date) {
      const entradaDateOnly = entrada.date.split("T")[0];
      cumpleFecha = entradaDateOnly === filtroFecha;
    }

    return cumpleNumero && cumpleFecha;
  });

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
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

        {/* Buscador y selector de fecha */}
        <Box sx={{ display: "flex", gap: 1.5, mb: 2, mt: 1, flexDirection: { xs: "column", sm: "row" }, alignItems: "center" }}>
          {/* Buscar por número */}
          <TextField
            label="Buscar por número"
            size="small"
            value={filtroNumero}
            onChange={(e) => setFiltroNumero(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "text.secondary", fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: filtroNumero && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setFiltroNumero("")}>
                      <Clear sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            fullWidth
            sx={{
              flex: { xs: "none", sm: 1.8 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: "#f8fafc",
                "& fieldset": { borderColor: "#e2e8f0" },
                "&:hover fieldset": { borderColor: "#004680" },
              },
            }}
          />

          {/* Filtrar por fecha */}
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
            <DatePicker
              label="Fecha"
              value={filtroFecha ? dayjs(filtroFecha) : null}
              onChange={(val: any) =>
                setFiltroFecha(
                  val && dayjs(val).isValid()
                    ? dayjs(val).format("YYYY-MM-DD")
                    : null
                )
              }
              slotProps={{
                textField: {
                  size: "small",
                  placeholder: "dd/mm/aaaa",
                  InputProps: {
                    endAdornment: filtroFecha ? (
                      <InputAdornment position="end" sx={{ mr: -1 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFiltroFecha(null);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <Clear sx={{ fontSize: 16 }} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                  sx: {
                    width: { xs: "100%", sm: "160px" },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "#f8fafc",
                      "& fieldset": { borderColor: "#e2e8f0" },
                      "&:hover fieldset": { borderColor: "#004680" },
                    },
                  },
                },
              }}
            />
          </LocalizationProvider>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, pt: 0 }}>
          {entradasFiltradas.length === 0 ? (
            <Box sx={{ py: 3, textAlign: "center", gridColumn: "1 / -1" }}>
              <Typography variant="body2" color="text.secondary">
                No se encontraron entradas que coincidan con los filtros.
              </Typography>
            </Box>
          ) : (
            entradasFiltradas.map((entrada) => {
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
                    primaryTypographyProps={{ component: 'div' }}
                    secondaryTypographyProps={{ component: 'div' }}
                    primary={
                      <Typography component="div" sx={{ fontSize: "1.05rem", fontWeight: 700, color: isSelected ? "#004680" : "#1e293b" }}>
                        Entrada: {entrada.document_number}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: "flex", flexDirection: "column", mt: 0.5, gap: 0.25 }}>
                        {entrada.date && (
                          <Typography component="div" sx={{ fontSize: "0.85rem", color: "#64748b" }}>
                            Fecha: {formatDate(entrada.date)}
                          </Typography>
                        )}
                        {entrada.total_cost && entrada.total_cost > 0 && (
                          <Typography component="div" sx={{ fontSize: "0.85rem", color: "#64748b" }}>
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
            })
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button
          variant="contained"
          onClick={handleClose}
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
          onClick={handleConfirm}
          disabled={!selectedNumber}
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
          Seleccionar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
