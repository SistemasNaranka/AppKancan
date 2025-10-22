import React, { useState } from "react";
import { Box, Typography, TextField } from "@mui/material";
import { usePromotionsFilter } from "../hooks/usePromotionsFilter";

const DescuentoFilter: React.FC = () => {
  const { descuentoRange, setDescuentoRange } = usePromotionsFilter();
  const [inputValue, setInputValue] = useState(descuentoRange.max);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(100, Number(e.target.value))); // limitar 0-100
    setInputValue(value);
    setDescuentoRange({ ...descuentoRange, max: value });
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Filtrar por descuento máximo:
      </Typography>
      <TextField
        type="number"
        value={inputValue}
        onChange={handleChange}
        inputProps={{ min: 0, max: 100 }}
        size="small"
        sx={{ width: 100 }}
      />
    </Box>
  );
};

export default DescuentoFilter;
