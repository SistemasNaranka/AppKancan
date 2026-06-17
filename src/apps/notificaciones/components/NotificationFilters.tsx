import React, { useState } from 'react';
import { FormControl, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

export default function DateRangeSelector() {
  const [rango, setRango] = useState('7');

  const handleChange = (event: SelectChangeEvent) => {
    setRango(event.target.value);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 170 }}>
      <Select
        value={rango}
        onChange={handleChange}
        displayEmpty
        startAdornment={
          <CalendarMonthIcon sx={{ color: '#64748b', fontSize: '1.1rem', ml: 1, mr: -0.5 }} />
        }
        sx={{
          borderRadius: '10px',
          bgcolor: '#ffffff',
          color: '#0f172a',
          fontWeight: 700,
          fontSize: '0.85rem',
          height: '38px',
          boxShadow: 'none',
          border: '1px solid #e2e8f0', 
          '&:hover': {
            borderColor: '#cbd5e1',
            bgcolor: '#f8fafc',
          },
          '.MuiOutlinedInput-notchedOutline': { border: 'none' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 0,
            pl: 1,
            pr: '32px !important',
          },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              bgcolor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0px 4px 20px rgba(15, 23, 42, 0.08)',
              border: '1px solid #e2e8f0',
              mt: 0.5,
            },
          },
        }}
      >
        <MenuItem value="hoy" sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', '&:hover': { bgcolor: '#f1f5f9' } }}>
          Hoy
        </MenuItem>
        <MenuItem value="ayer" sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', '&:hover': { bgcolor: '#f1f5f9' } }}>
          Ayer
        </MenuItem>
        <MenuItem value="7" sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', '&:hover': { bgcolor: '#f1f5f9' } }}>
          Últimos 7 días
        </MenuItem>
        <MenuItem value="30" sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', '&:hover': { bgcolor: '#f1f5f9' } }}>
          Últimos 30 días
        </MenuItem>
      </Select>
    </FormControl>
  );
}