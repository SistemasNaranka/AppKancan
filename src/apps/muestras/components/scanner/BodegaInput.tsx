// src/components/scanner/BodegaInput.tsx
import { Autocomplete, TextField } from "@mui/material";
import { forwardRef } from "react";

interface BodegaOption {
  codigo: string;
  nombre: string;
}

interface Props {
  value: string;
  options: BodegaOption[];
  onChange: (value: string) => void;
  onBlur: () => void;
  onFocus: () => void;
}

export const BodegaInput = forwardRef<HTMLInputElement, Props>(
  ({ value, options, onChange, onBlur, onFocus }, ref) => {
    const selectedOption = options.find((opt) => opt.codigo === value) || null;

    return (
      <Autocomplete
        value={selectedOption}
        onChange={(_, newValue) => {
          onChange(newValue?.codigo || "");
        }}
        options={options}
        getOptionLabel={(option) => `${option.nombre}`}
        size="medium"
        sx={{
          maxWidth: 600,
          width: 200,

          "& .MuiAutocomplete-popupIndicator": {
            color: "primary.main",
          },
          "& .MuiAutocomplete-clearIndicator": {
            color: "primary.main",
          },
          "& .MuiAutocomplete-paper": {
            borderRadius: 2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          },
          "& .MuiAutocomplete-listbox": {
            "& .MuiAutocomplete-option": {
              fontFamily: "monospace",
              fontSize: "1.2rem",
              fontWeight: "bold",
              padding: "12px 16px",
              "&:hover": {
                backgroundColor: "primary.light",
                color: "primary.contrastText",
              },
              "&[aria-selected='true']": {
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
              },
            },
          },
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={ref}
            label="Seleccione una bodega"
            onBlur={onBlur}
            onFocus={onFocus}
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                fontWeight: "bold",
                fontSize: "1.4rem",
                fontFamily: "monospace",
                borderRadius: 3,
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "primary.main",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
                },
                "&.Mui-focused": {
                  borderColor: "primary.main",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                },
              },
              "& .MuiInputLabel-root": {
                fontWeight: "bold",
                color: "primary.main",
                "&.Mui-focused": {
                  color: "primary.main",
                },
              },
              "& .MuiFormHelperText-root": {
                fontWeight: 900,
                color: "text.secondary",
              },
            }}
          />
        )}
        renderOption={(props, option) => {
          const { key, ...rest } = props;
          return (
            <li key={key} {...rest}>
              {option.nombre}
            </li>
          );
        }}
        isOptionEqualToValue={(option, value) =>
          option.codigo === value?.codigo
        }
        autoHighlight
        clearOnEscape
      />
    );
  }
);

BodegaInput.displayName = "BodegaInput";
