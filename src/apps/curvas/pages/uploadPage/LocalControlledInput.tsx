// Input controlado localmente que sincroniza con su prop value en cada cambio externo.

import React, { useEffect, useState } from "react";
import TextField from "@mui/material/TextField";

interface LocalControlledInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  sx?: any;
}

export const LocalControlledInput: React.FC<LocalControlledInputProps> = ({
  value,
  onChange,
  placeholder,
  sx,
}) => {
  const [localValue, setLocalValue] = useState(value || "");

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    onChange(val);
  };

  return (
    <TextField
      variant="outlined"
      size="small"
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      sx={sx}
    />
  );
};
