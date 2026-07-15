import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

interface SortFilterProps {
  valor: "fecha" | "facturas";
  onChange: (valor: "fecha" | "facturas") => void;
}

const SortFilter: React.FC<SortFilterProps> = ({ valor, onChange }) => {
  return (
    <FormControl
      size="small"
      sx={{
        minWidth: { xs: 120, sm: 140, md: 160 },
        flex: { xs: "1 1 auto", sm: "none" },
      }}
    >
      <InputLabel sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
        Ordenar por
      </InputLabel>
      <Select
        value={valor}
        label="Ordenar por"
        onChange={(e) => onChange(e.target.value as "fecha" | "facturas")}
        sx={{
          fontSize: { xs: "0.875rem", sm: "1rem" },
          backgroundColor: "white",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#004680",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#004680",
          },
        }}
      >
        <MenuItem value="fecha" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
          Próximo Vencimiento
        </MenuItem>
        <MenuItem value="facturas" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
          Pocas Facturas
        </MenuItem>
      </Select>
    </FormControl>
  );
};

export default SortFilter;
