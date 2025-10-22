import React, { useRef, useState } from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";

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
  error = false,
  helperText = "",
}) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
          startAdornment: (
            <InputAdornment position="start">
              <IconButton
                onClick={() => inputRef.current?.focus()} 
                edge="start"
                size="small"
              >
                <Icon color={focused ? "primary" : "action"} />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      sx={{
        ".css-1ensfe1-MuiFormLabel-root-MuiInputLabel-root": {
          fontSize: "1.2rem",
        },
        ".css-1nowbqt-MuiInputAdornment-root": { marginRight: "0px" },
        "& .MuiInput-underline:hover:before": {
          borderBottomColor: "primary.main",
        },
      }}
    />
  );
};

export default InputWithIcon;
