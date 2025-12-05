import React, { useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import { CircularProgressProps } from "@mui/material/CircularProgress";

interface Option {
  value: string;
  label: string;
}

interface AutocompleteSelectProps {
  value?: string | string[];
  onValueChange: (value: string | string[]) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  helperText?: string;
  size?: "small" | "medium";
  fullWidth?: boolean;
  sx?: any;
  multiple?: boolean;
}

/**
 * Componente Select con funcionalidad de autocompletado usando Material UI
 * Especialmente útil para listas largas como tiendas
 */
export const AutocompleteSelect: React.FC<AutocompleteSelectProps> = ({
  value = "",
  onValueChange,
  options,
  placeholder = "Seleccionar...",
  label,
  className,
  disabled = false,
  loading = false,
  error = false,
  helperText,
  size = "medium",
  fullWidth = true,
  sx,
  multiple = false,
}) => {
  // Encontrar la opción seleccionada actual
  const selectedOption = multiple
    ? options.filter(
        (option) => Array.isArray(value) && value.includes(option.value)
      )
    : options.find((option) => option.value === value);

  // Manejar cambio de valor
  const handleChange = (_: any, newValue: Option | Option[] | null) => {
    if (multiple) {
      const values = Array.isArray(newValue)
        ? newValue.map((opt) => opt.value)
        : [];
      onValueChange(values);
    } else {
      onValueChange((newValue as Option)?.value || "");
    }
  };

  return (
    <Autocomplete
      multiple={multiple}
      value={selectedOption || (multiple ? [] : null)}
      onChange={handleChange}
      options={options}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, selectedOption) =>
        option.value === selectedOption?.value
      }
      disabled={disabled}
      loading={loading}
      sx={sx}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          size={size}
          className={className}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      fullWidth={fullWidth}
      clearOnBlur
      handleHomeEndKeys
    />
  );
};

export default AutocompleteSelect;
