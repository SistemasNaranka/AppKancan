import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogContentText,
  DialogActions,
  TextField,
  Box,
  Typography,
  IconButton,
  Chip,
} from "@mui/material";
import { Delete, Add } from "@mui/icons-material";

interface CodesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodesModal: React.FC<CodesModalProps> = ({ isOpen, onClose }) => {
  const [codes, setCodes] = useState<string[]>([]);
  const [newCode, setNewCode] = useState("");

  const handleAddCode = () => {
    const code = newCode.trim();
    if (code.length === 4 && /^\d{4}$/.test(code) && !codes.includes(code)) {
      setCodes([...codes, code]);
      setNewCode("");
    }
  };

  const handleRemoveCode = (index: number) => {
    setCodes(codes.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Aquí puedes agregar la lógica para guardar los códigos
    // Por ejemplo, guardarlos en localStorage, enviar a una API, etc.
    localStorage.setItem("commission_codes", JSON.stringify(codes));
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddCode();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Gestión de Códigos de Trabajadores</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          Administre los códigos de identificación de los trabajadores para el
          sistema de comisiones.
        </DialogContentText>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Input para agregar códigos */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Agregar Código
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                type="text"
                placeholder="Ingrese un código (4 dígitos)"
                value={newCode}
                onChange={(e) =>
                  setNewCode(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                onKeyPress={handleKeyPress}
                inputProps={{ maxLength: 4 }}
              />
              <Button
                onClick={handleAddCode}
                variant="outlined"
                disabled={newCode.length !== 4}
                sx={{ minWidth: "auto", px: 2 }}
              >
                <Add />
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Ingrese exactamente 4 dígitos numéricos
            </Typography>
          </Box>

          {/* Lista de códigos guardados */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Códigos Guardados
            </Typography>
            <Box
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 1,
                p: 2,
                maxHeight: 240,
                overflowY: "auto",
              }}
            >
              {codes.length === 0 ? (
                <Typography
                  color="text.secondary"
                  align="center"
                  sx={{ py: 2 }}
                >
                  No hay códigos guardados
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {codes.map((code, index) => (
                    <Box
                      key={`code-${index}-${code}`}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        bgcolor: "grey.50",
                        p: 1,
                        borderRadius: 1,
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace" }}
                      >
                        {code}
                      </Typography>
                      <IconButton
                        onClick={() => handleRemoveCode(index)}
                        size="small"
                        sx={{ color: "error.main" }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" sx={{ mr: 1 }}>
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
