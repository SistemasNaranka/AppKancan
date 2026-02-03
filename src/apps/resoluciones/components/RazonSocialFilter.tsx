import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

interface RazonSocialFilterProps {
  valor: string;
  opciones: string[];
  onChange: (valor: string) => void;
}

const RazonSocialFilter: React.FC<RazonSocialFilterProps> = ({
  valor,
  opciones,
  onChange,
}) => {
  return (
    <FormControl
      size="small"
      sx={{
        minWidth: { xs: 120, sm: 140, md: 160 },
        flex: { xs: "1 1 auto", sm: "none" },
      }}
    >
      <InputLabel sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
        Razón Social
      </InputLabel>
      <Select
        value={valor}
        label="Razón Social"
        onChange={(e) => onChange(e.target.value)}
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
        <MenuItem
          value="Todas"
          sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
        >
          Todas
        </MenuItem>
        {opciones.map((opcion) => (
          <MenuItem
            key={opcion}
            value={opcion}
            sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
          >
            {opcion}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default RazonSocialFilter;
