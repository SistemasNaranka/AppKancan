import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";

export type ModalTipo = "exito" | "advertencia" | "error" | "info" | "confirmacion";

export interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar?: () => void;
  tipo: ModalTipo;
  titulo: string;
  mensaje: string | string[];
  textoConfirmar?: string;
  textoCancelar?: string;
}

const iconosPorTipo = {
  exito: <CheckCircleIcon sx={{ fontSize: 48, color: "#28a745" }} />,
  advertencia: <WarningIcon sx={{ fontSize: 48, color: "#1976d2" }} />,
  error: <ErrorIcon sx={{ fontSize: 48, color: "#dc3545" }} />,
  info: <InfoIcon sx={{ fontSize: 48, color: "#17a2b8" }} />,
  confirmacion: <WarningIcon sx={{ fontSize: 48, color: "#1976d2" }} />,
};

const coloresPorTipo = {
  exito: "#28a745",
  advertencia: "#1976d2",
  error: "#dc3545",
  info: "#17a2b8",
  confirmacion: "#1976d2",
};

const ModalConfirmacion: React.FC<ModalProps> = ({
  abierto,
  onCerrar,
  onConfirmar,
  tipo,
  titulo,
  mensaje,
  textoConfirmar = "Aceptar",
  textoCancelar = "Cancelar",
}) => {
  const esConfirmacion = tipo === "confirmacion";
  const mensajesArray = Array.isArray(mensaje) ? mensaje : [mensaje];

  return (
    <Dialog
      open={abierto}
      onClose={onCerrar}
      PaperProps={{
        sx: {
          borderRadius: 3,
          minWidth: 350,
          maxWidth: 450,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, pt: 2 }}>
          {iconosPorTipo[tipo]}
          <Typography variant="h6" sx={{ fontWeight: "bold", textAlign: "center" }}>
            {titulo}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ textAlign: "center" }}>
          {mensajesArray.map((linea, index) => (
            <DialogContentText key={index} sx={{ color: "#333", mb: 0.5 }}>
              {linea}
            </DialogContentText>
          ))}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: "center", pb: 3, gap: 1 }}>
        {esConfirmacion && (
          <Button
            onClick={onCerrar}
            variant="outlined"
            sx={{
              borderColor: "#6c757d",
              color: "#6c757d",
              "&:hover": {
                borderColor: "#5a6268",
                backgroundColor: "#eee6e6",
              },
            }}
          >
            {textoCancelar}
          </Button>
        )}
        <Button
          onClick={esConfirmacion ? onConfirmar : onCerrar}
          variant="contained"
          sx={{
            backgroundColor: coloresPorTipo[tipo],
            "&:hover": {
              backgroundColor: coloresPorTipo[tipo],
              filter: "brightness(0.9)",
            },
          }}
        >
          {textoConfirmar}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalConfirmacion;