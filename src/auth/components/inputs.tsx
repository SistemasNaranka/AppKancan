import React, { useRef, useState } from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";

interface InputWithIconProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  error?: boolean;
  helperText?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  Icon: React.ElementType;
  variant?: "outlined" | "standard" | "filled";
  placeholder?: string;
  autoComplete?: string;
}

const InputWithIcon: React.FC<InputWithIconProps> = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  Icon,
  variant = "outlined",
  placeholder = "",
  autoComplete,
  error = false,
  helperText = "",
}) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();

  return (
    <TextField
      fullWidth
      id={id}
      label={label}
      variant={variant}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      error={error}
      helperText={helperText}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      slotProps={{
        input: {
          inputRef,
          inputProps: { ...(autoComplete && { autoComplete }) },
          startAdornment: (
            <InputAdornment position="start">
              <IconButton
                onClick={() => inputRef.current?.focus()}
                edge="start"
                size="small"
              >
                <Icon
                  sx={{
                    color: focused
                      ? theme.palette.secondary.main // azul al enfocar
                      : theme.palette.primary.main, // gris neutro base
                    transition: "color 0.3s ease",
                  }}
                />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      sx={{
        "& .MuiInputLabel-root": {
          color: theme.palette.primary.main,
          fontSize: "1.2rem",
        },
        "& .MuiInputLabel-root.Mui-focused": {
          color: theme.palette.secondary.main,
        },
        "& .MuiInputBase-input": {
          color: theme.palette.text.primary,
        },
        "& .MuiInput-underline:before": {
          borderBottomColor: theme.palette.primary.light,
        },
        "& .MuiInput-underline:hover:before": {
          borderBottomColor: theme.palette.secondary.main,
        },
        "& .MuiInput-underline:after": {
          borderBottomColor: theme.palette.secondary.main,
        },
      }}
    />
  );
};

export default InputWithIcon;
