// Diálogo de confirmación para Guardar o Enviar a Despacho con resumen de estadísticas.

import React from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  Zoom,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

interface ConfirmActionDialogProps {
  open: boolean;
  action: string;
  saving: boolean;
  celdasEditadas: any[];
  summaryStats: { tiendas: number; totalUnidades: number; columnas: number };
  onClose: () => void;
  onConfirmSave: () => void;
  onConfirmSend: () => void;
}

export const ConfirmActionDialog: React.FC<ConfirmActionDialogProps> = ({
  open,
  action,
  saving,
  celdasEditadas,
  summaryStats,
  onClose,
  onConfirmSave,
  onConfirmSend,
}) => {
  const isDispatch = action === "confirm_dispatch";

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Zoom}
      PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}
    >
      <Box
        sx={{
          p: 3,
          background: isDispatch
            ? "linear-gradient(135deg, #065f46, #059669)"
            : "linear-gradient(135deg, #1e3a8a, #2563eb)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          {isDispatch ? (
            <LocalShippingIcon sx={{ fontSize: 28 }} />
          ) : (
            <SaveIcon sx={{ fontSize: 28 }} />
          )}
          <Typography variant="h6" fontWeight={900}>
            {isDispatch ? "CONFIRMAR ENVÍO A DESPACHO" : "APLICAR CAMBIOS"}
          </Typography>
        </Stack>
        {!saving ? (
          <IconButton onClick={onClose} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        ) : null}
      </Box>

      <DialogContent sx={{ py: 3 }}>
        {isDispatch ? (
          <Stack spacing={3}>
            <Typography
              variant="body2"
              color="text.secondary"
              fontWeight={600}
            >
              Estás a punto de enviar estos datos al Sistema de Despacho.
              Verifica el resumen:
            </Typography>
            <Stack direction="row" spacing={2}>
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  textAlign: "center",
                }}
              >
                <Typography variant="h4" fontWeight={900} color="#15803d">
                  {summaryStats.tiendas}
                </Typography>
                <Typography variant="caption" color="#166534" fontWeight={800}>
                  TIENDAS
                </Typography>
              </Paper>
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  textAlign: "center",
                }}
              >
                <Typography variant="h4" fontWeight={900} color="#1d4ed8">
                  {summaryStats.totalUnidades.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="#1e40af" fontWeight={800}>
                  UNIDADES
                </Typography>
              </Paper>
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "#faf5ff",
                  border: "1px solid #e9d5ff",
                  textAlign: "center",
                }}
              >
                <Typography variant="h4" fontWeight={900} color="#7c3aed">
                  {summaryStats.columnas}
                </Typography>
                <Typography variant="caption" color="#6d28d9" fontWeight={800}>
                  TALLAS
                </Typography>
              </Paper>
            </Stack>
            <Alert
              severity="warning"
              icon={<WarningAmberIcon />}
              sx={{ borderRadius: 2 }}
            >
              Esta acción informará al equipo de despacho y no se puede
              deshacer.
            </Alert>
          </Stack>
        ) : (
          <Typography
            variant="body1"
            fontWeight={600}
            sx={{ textAlign: "center" }}
          >
            {celdasEditadas.length > 0
              ? `¿Deseas guardar los ${celdasEditadas.length} cambios realizados en la matriz?`
              : "¿Deseas confirmar y guardar la información ingresada en la matriz?"}
          </Typography>
        )}
      </DialogContent>

      {saving && <LinearProgress />}

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} disabled={saving} sx={{ fontWeight: 800 }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={isDispatch ? onConfirmSend : onConfirmSave}
          disabled={saving}
          startIcon={
            saving ? (
              <HistoryIcon sx={{ animation: "spin 1s linear infinite" }} />
            ) : isDispatch ? (
              <SendIcon />
            ) : (
              <CheckCircleIcon />
            )
          }
          sx={{
            borderRadius: 1.5,
            px: 4,
            fontWeight: 900,
            textTransform: "none",
            bgcolor: isDispatch ? "#059669" : "#2563eb",
          }}
        >
          {saving ? "PROCESANDO..." : "CONFIRMAR"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
