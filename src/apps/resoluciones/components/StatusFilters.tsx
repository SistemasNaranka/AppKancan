import React from "react";
import { FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText } from "@mui/material";
import { StatusResolution } from "../types";

interface StatusFiltersProps {
  estadosSeleccionados: StatusResolution[];
  onFiltrar: (estados: StatusResolution[]) => void;
}

const StatusFilters: React.FC<StatusFiltersProps> = ({
  estadosSeleccionados,
  onFiltrar,
}) => {
  const estados: StatusResolution[] = ["Pendiente", "Por vencer", "Vigente", "Vencido"];

  const handleChange = (event: any) => {
    const value = event.target.value;
    if (value.includes("Todos")) {
      onFiltrar([]);
      return;
    }
    onFiltrar(typeof value === "string" ? (value.split(",") as StatusResolution[]) : value);
  };

  return (
    <FormControl
      size="small"
      sx={{
        minWidth: { xs: 120, sm: 140, md: 160 },
        flex: { xs: "1 1 auto", sm: "none" },
      }}
    >
      <InputLabel sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
        Estados
      </InputLabel>
      <Select
        multiple
        value={estadosSeleccionados}
        label="Estados"
        onChange={handleChange}
        renderValue={(selected) => {
          if (selected.length === 0 || selected.length === estados.length) {
            return "Todos";
          }
          return selected.join(", ");
        }}
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
          value="Todos"
          sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, fontWeight: "bold" }}
        >
          <Checkbox checked={estadosSeleccionados.length === 0} size="small" />
          <ListItemText primary="Todos" />
        </MenuItem>
        {estados.map((estado) => (
          <MenuItem
            key={estado}
            value={estado}
            sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
          >
            <Checkbox checked={estadosSeleccionados.indexOf(estado) > -1} size="small" />
            <ListItemText primary={estado} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default StatusFilters;
