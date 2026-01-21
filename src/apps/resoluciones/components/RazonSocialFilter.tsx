import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

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
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel>Razón Social</InputLabel>
      <Select
        value={valor}
        label="Razón Social"
        onChange={(e) => onChange(e.target.value)}
        sx={{
            '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#004680',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#004680',
            },
        }}
    >
        <MenuItem value="Todas">Todas</MenuItem>
        {opciones.map((opcion) => (
          <MenuItem key={opcion} value={opcion}>
            {opcion}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default RazonSocialFilter;