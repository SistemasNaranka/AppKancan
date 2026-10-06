import React from 'react';
import { FormControl, Select, MenuItem, Chip } from '@mui/material';
import { ESTADOS, getEstadoMeta, EstadoContratacion } from '../api/directus/read';

interface Props {
  value: EstadoContratacion;
  onChange: (nuevo: EstadoContratacion) => void;
}

const EstadoSelect: React.FC<Props> = ({ value, onChange }) => {
  const meta = getEstadoMeta(value);

  const chip = (estado: EstadoContratacion) => {
    const m = getEstadoMeta(estado);
    return (
      <Chip label={estado} size="small"
        sx={{ bgcolor: m.bg, color: m.color, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
    );
  };

  return (
    <FormControl size="small" fullWidth sx={{ minWidth: 150 }}>
      <Select value={value} onChange={(e) => onChange(e.target.value as EstadoContratacion)}
        renderValue={(v) => chip(v as EstadoContratacion)}
        sx={{
          bgcolor: meta.bg, borderRadius: 2,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: meta.color + '40' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: meta.color },
        }}>
        {ESTADOS.map((e) => <MenuItem key={e} value={e}>{chip(e)}</MenuItem>)}
      </Select>
    </FormControl>

    
  );
};

export default EstadoSelect;