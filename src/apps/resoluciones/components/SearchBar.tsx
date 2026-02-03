import React from "react";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

interface SearchBarProps {
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  valor,
  onChange,
  placeholder = "Buscar resolución...",
}) => {
  const handleClear = () => {
    onChange("");
  };

  return (
    <TextField
      fullWidth
      size="small"
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: "#004680", fontSize: "1.4rem" }} />
          </InputAdornment>
        ),
        endAdornment: valor && (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={handleClear}
              sx={{
                color: "#004680",
                padding: "4px",
                "&:hover": {
                  backgroundColor: "#e3f2fd",
                },
              }}
            >
              <ClearIcon sx={{ fontSize: "1.2rem" }} />
            </IconButton>
          </InputAdornment>
        ),
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          fontSize: "1rem",
          backgroundColor: "#ffffff",
          borderRadius: 1,
          "& fieldset": {
            borderColor: "#004680",
            borderWidth: "1px",
          },
          "&:hover fieldset": {
            borderColor: "#004680",
            borderWidth: "2px",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#004680",
            borderWidth: "2px",
          },
        },
      }}
    />
  );
};

export default SearchBar;
