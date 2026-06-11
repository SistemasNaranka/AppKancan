// Select de color con círculo coloreado en el render del valor seleccionado.

import React from "react";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { COLOR_OPTIONS } from "./configurationPanel.constants";

interface ColorPickerSelectProps {
  value: string;
  onChange: (color: string) => void;
}

export const ColorPickerSelect: React.FC<ColorPickerSelectProps> = ({
  value,
  onChange,
}) => {
  return (
    <FormControl fullWidth size="small">
      <InputLabel>Color</InputLabel>
      <Select
        value={value || ""}
        label="Color"
        onChange={(e) => onChange(e.target.value)}
        sx={{ fontSize: "1rem" }}
        renderValue={(selected) => {
          if (!selected) return "Seleccionar...";
          const colorOption = COLOR_OPTIONS.find((c) => c.value === selected);
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: colorOption?.hex || "grey.400",
                  border: "1px solid #ccc",
                }}
              />
              {colorOption?.label || selected}
            </Box>
          );
        }}
      >
        <MenuItem value="">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: "grey.400",
                border: "1px solid #ccc",
              }}
            />
            Seleccionar...
          </Box>
        </MenuItem>
        {COLOR_OPTIONS.map((color) => (
          <MenuItem key={color.value} value={color.value}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: color.hex,
                  border: "1px solid #ccc",
                }}
              />
              {color.label}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
