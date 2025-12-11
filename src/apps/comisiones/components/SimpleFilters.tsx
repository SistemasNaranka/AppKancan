import React from "react";
import { FormControl, InputLabel, Select, MenuItem, Box } from "@mui/material";
import { StoreFilterModal } from "./StoreFilterModal";

interface SimpleFiltersProps {
  selectedMonth: string;
  availableMonths: string[];
  selectedTiendas: string[];
  availableTiendas: string[];
  onMonthChange: (month: string) => void;
  onTiendaChange: (tiendas: string[]) => void;
  showStoreFilter?: boolean;
}

export const SimpleFilters: React.FC<SimpleFiltersProps> = ({
  selectedMonth,
  availableMonths,
  selectedTiendas,
  availableTiendas,
  onMonthChange,
  onTiendaChange,
  showStoreFilter = true,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        flexWrap: "wrap",
        alignItems: "center",
        width: "100%",
        mt: 2,
      }}
    >
      {/* Filtro de Mes */}
      <FormControl sx={{ minWidth: 140 }}>
        <InputLabel id="month-filter-label">Mes</InputLabel>
        <Select
          labelId="month-filter-label"
          value={selectedMonth}
          label="Mes"
          onChange={(e) => onMonthChange(e.target.value)}
          size="small"
        >
          {availableMonths.map((month) => (
            <MenuItem key={month} value={month}>
              {month}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Filtro de Tienda - Solo si showStoreFilter es true */}
      {showStoreFilter && (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <StoreFilterModal
            availableStores={availableTiendas}
            selectedStores={selectedTiendas}
            onStoresSelected={onTiendaChange}
          />
        </Box>
      )}
    </Box>
  );
};
