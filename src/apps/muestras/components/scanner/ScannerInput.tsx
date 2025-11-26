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
  ({ value, onChange, onKeyDown, onAgregarReferencia, inputRef }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      const numericValue = newValue.replace(/[^0-9]/g, "").slice(0, 13);

      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: numericValue },
      } as React.ChangeEvent<HTMLInputElement>;

      onChange(syntheticEvent);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData("text");
      const numericText = pastedText.replace(/[^0-9]/g, "").slice(0, 13);
      if (numericText) {
        const syntheticEvent = {
          target: { value: numericText },
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
                    color: "inherit",
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
            bgcolor: "#f8f9fa",
            transition: "background-color 0.2s ease, border-color 0.2s ease",
            color: "text.secondary",

            "& fieldset": {
              borderColor: "#C2C2C2",
              borderStyle: "solid",
              borderWidth: 1,
              transition: "border-color 0.2s ease",
            },

            "& .MuiSvgIcon-root": {
              color: "#bdbdbd",
              transition: "color 0.2s ease",
            },

            "&:hover": {
              bgcolor: "#f0f0f0",

              "& fieldset": {
                borderColor: "#000000",
              },
            },

            "&.Mui-focused": {
              bgcolor: "#ffffff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              color: "text.primary",

              "& fieldset": {
                borderColor: "primary.main",
                borderStyle: "solid",
                borderWidth: 2,
              },

              "& .MuiSvgIcon-root": {
                color: "primary.main",
              },
            },
          },
          "& .MuiInputLabel-root": {
            color: "text.secondary",
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
