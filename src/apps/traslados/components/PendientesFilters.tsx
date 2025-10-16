import React from 'react';
import { Box, FormControl, Select, MenuItem, InputLabel, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WarehouseIcon from '@mui/icons-material/Warehouse';

type Props = {
  filtroBodega: string;
  setFiltroBodega: (v: string) => void;
  filtroNombre: string;
  setFiltroNombre: (v: string) => void;
  bodegas: string[];
};

const PendientesFilters: React.FC<Props> = ({ filtroBodega, setFiltroBodega, filtroNombre, setFiltroNombre, bodegas }) => (
  <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
    <FormControl size="small" sx={{ minWidth: 210, background: '#fff', borderRadius: 2, boxShadow: 1 }}>
      <InputLabel id="bodega-select-label">Bodega</InputLabel>
      <Select
  labelId="bodega-select-label"
  value={filtroBodega}
  label="Bodega"
  onChange={e => setFiltroBodega(e.target.value)}
  sx={{ fontWeight: 600 }}
  MenuProps={{ PaperProps: { sx: { borderRadius: 2, boxShadow: 3 } } }}
>
  <MenuItem value=""><em style={{ color: '#888' }}>Todas las bodegas</em></MenuItem>
  {bodegas.map(b => (
    <MenuItem key={b} value={b} sx={{ display: 'flex', alignItems: 'center' }}>
      <WarehouseIcon sx={{ mr: 1, fontSize: 18, color: 'primary.light' }} />{b}
    </MenuItem>
  ))}
</Select>
    </FormControl>

    <TextField
      label="Filtrar por Nombre Bodega"
      size="small"
      value={filtroNombre}
      onChange={(e) => setFiltroNombre(e.target.value)}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
      sx={{ background: '#fff', borderRadius: 2, boxShadow: 1, minWidth: 220 }}
    />
  </Box>
);

export default PendientesFilters;