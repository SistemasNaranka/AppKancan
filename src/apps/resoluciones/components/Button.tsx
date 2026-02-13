import React from "react";
import { Button as MuiButton } from "@mui/material";

interface ButtonProps {
  texto: string;
  onClick?: () => void | Promise<void>;
  variante?: "primario" | "secundario" | "peligro";
  disabled?: boolean;
  icono?: React.ReactNode;
  href?: string;
}

const Button: React.FC<ButtonProps> = ({
  texto,
  onClick,
  variante = "primario",
  disabled = false,
  icono,
  href,
}) => {
  const obtenerEstilo = () => {
    switch (variante) {
      case "primario":
        return {
          backgroundColor: "#1976d2",
          color: "white",
          transition: "all 0.3s ease",
          "&:hover": { backgroundColor: "#1565c0" },
        };
      case "secundario":
        return {
          backgroundColor: "#ffffff3b",
          color: "#004680",
          border: "1px solid #004680",
          borderRadius: "4px",
          boxShadow: "none",
          transition: "all 0.3s ease",
          "&:hover": {
            backgroundColor: "#00468010",
            boxShadow: "none",
          },
        };
      case "peligro":
        return {
          backgroundColor: "#d32f2f",
          color: "#ffebee",
          boxShadow: "none",
          transition: "all 0.3s ease",
          "&:hover": {
            backgroundColor: "#cc1d1dff",
            border: "2px solid #transparent",
            boxShadow: "none",
          },
        };
      default:
        return {};
    }
  };

  return (
    <MuiButton
      variant="contained"
      onClick={onClick}
      disabled={disabled}
      startIcon={icono}
      href={href}
      size="small"
      sx={{
        ...obtenerEstilo(),
        fontSize: { xs: "0.75rem", sm: "0.875rem" },
        px: { xs: 1.5, sm: 2 },
        py: { xs: 0.5, sm: 0.75 },
        minWidth: { xs: "auto", sm: "64px" },
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </MuiButton>
  );
};

export default Button;
