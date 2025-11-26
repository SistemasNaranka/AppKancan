import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Divider,
} from "@mui/material";

interface ObservacionesModalProps {
  open: boolean;
  onClose: () => void;
  value: string;
  onSave: (observaciones: string) => void;
}

export const ObservacionesModal: React.FC<ObservacionesModalProps> = ({
  open,
  onClose,
  value,
  onSave,
}) => {
  const [observaciones, setObservaciones] = useState(value);
  const MAX_CHARS = 50;

  useEffect(() => {
    if (open) {
      setObservaciones(value);
    }
  }, [open, value]);

  const handleSave = () => {
    onSave(observaciones);
    onClose();
  };

  const handleCancel = () => {
    setObservaciones(value);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_CHARS) {
      setObservaciones(newValue);
    }
  };

  // Lógica para detectar el ENTER
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        },
      }}
    >
      {/* Título */}
      <DialogTitle sx={{ pt: 2, px: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "1.6rem" }}>
          Observaciones
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Ingrese las observaciones de los articulos (Máx 50 carac.)
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        <TextField
          fullWidth
          multiline
          autoFocus
          rows={2}
          value={observaciones}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Escriba aquí..."
          variant="outlined"
          slotProps={{
            input: {
              sx: {
                fontSize: "1.3rem",
                borderRadius: 2,
              },
            },
          }}
          sx={{
            mt: 1,
            "& .MuiOutlinedInput-root": {
              "&.Mui-focused fieldset": {
                borderWidth: "2px",
              },
            },
          }}
        />

        {/* Contador */}
        <Box
          sx={{
            mt: 1,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Typography
            variant="body2"
            color={observaciones.length === MAX_CHARS ? "error" : "primary"}
            fontWeight="bold"
          >
            {observaciones.length}/{MAX_CHARS}
          </Typography>
        </Box>
      </DialogContent>

      <Divider />

      {/* Botones ajustados: No tan anchos, alineados a la derecha */}
      <DialogActions sx={{ p: 1, backgroundColor: "#fdfdfd" }}>
        <Button
          onClick={handleCancel}
          variant="outlined"
          color="error"
          size="large"
          sx={{
            minWidth: "130px",
            borderRadius: 2,
            fontSize: "1rem",
            borderWidth: "2px",
            fontWeight: 600,
            textTransform: "none",
            "&:hover": { borderWidth: "2px" },
          }}
        >
          Cancelar
        </Button>

        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          size="large"
          sx={{
            minWidth: "130px",
            borderRadius: 2,
            fontSize: "1rem",
            fontWeight: 600,
            boxShadow: "none",
            textTransform: "none",
            ml: 2,
          }}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ObservacionesModal;
