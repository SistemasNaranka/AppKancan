// src/components/scanner/ScannerInput.tsx
import { TextField, InputAdornment, Box, IconButton } from "@mui/material";
import { QrCodeScanner, Add } from "@mui/icons-material";
import { forwardRef } from "react";

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onAgregarReferencia: (ref: string) => void;
  isScanning: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const ScannerInput = forwardRef<HTMLInputElement, Props>(
  (
    { value, onChange, onKeyDown, onAgregarReferencia, isScanning, inputRef },
    ref
  ) => {
    // Función para filtrar solo números y limitar a 13 caracteres
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      // Solo permite números, elimina cualquier caracter no numérico y limita a 13
      const numericValue = newValue.replace(/[^0-9]/g, "").slice(0, 13);

      // Crear un nuevo evento sintético con el valor filtrado
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: numericValue,
        },
      } as React.ChangeEvent<HTMLInputElement>;

      onChange(syntheticEvent);
    };

    // Manejar pegado de texto
    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData("text");
      const numericText = pastedText.replace(/[^0-9]/g, "").slice(0, 13);
      if (numericText) {
        const syntheticEvent = {
          target: {
            value: numericText,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <TextField
        inputRef={inputRef || ref}
        label="Escanear Referencia"
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        onPaste={handlePaste}
        fullWidth
        placeholder="Escanea o ingresa la referencia"
        autoFocus
        variant="outlined"
        type="tel"
        inputMode="numeric"
        slotProps={{
          input: {
            maxLength: 13,
            style: {
              fontSize: "1.2rem",
              fontWeight: "600",
              letterSpacing: "1px",
            },
            startAdornment: (
              <InputAdornment position="start">
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    color: isScanning ? "primary.main" : "text.secondary",
                    transition: "color 0.3s ease",
                  }}
                >
                  <QrCodeScanner />
                </Box>
              </InputAdornment>
            ),
            endAdornment: value.trim() && (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => onAgregarReferencia(value)}
                  color="primary"
                  size="small"
                  disabled={!/^\d+$/.test(value)}
                >
                  <Add />
                </IconButton>
              </InputAdornment>
            ),
          } as any,
        }}
        sx={{
          maxWidth: 500,
          width: 400,
          "& .MuiOutlinedInput-root": {
            bgcolor: "#ffffff",
            borderRadius: 2,
            transition: "border-color 0.3s ease",
            "& fieldset": {
              borderColor: "#e0e0e0",
              borderWidth: 2,
              transition: "border-color 0.3s ease",
            },
            "&:hover fieldset": {
              borderColor: "#bdbdbd",
            },
            "&.Mui-focused fieldset": {
              borderColor: "primary.main",
              borderWidth: 2,
            },
          },
          "& .MuiInputLabel-root": {
            color: "text.secondary",
            fontWeight: 500,
            "&.Mui-focused": {
              color: "primary.main",
              fontWeight: 600,
            },
          },
        }}
      />
    );
  }
);

ScannerInput.displayName = "ScannerInput";
