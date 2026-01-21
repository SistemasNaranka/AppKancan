import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchBarProps {
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  valor, 
  onChange, 
  placeholder = 'Buscar resolución...' 
}) => {
  return (
<TextField
  fullWidth
  value={valor}
  onChange={(e) => onChange(e.target.value)}
  placeholder={placeholder}
  sx={{
    '& .MuiOutlinedInput-root': {
      '&:hover fieldset': {
        borderColor: '#004680',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#004680',
      },
    },
  }}
    />
  );
};

export default SearchBar;