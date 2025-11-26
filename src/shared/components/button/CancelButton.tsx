import { Button } from "@mui/material";
import { SxProps, Theme } from "@mui/system";

interface CustomButtonProps {
  text: string; // texto del botón
  color?: "primary" | "secondary" | "error" | "success" | "warning" | "info";
  variant?: "outlined" | "contained" | "text";
  onClick?: () => void;
  sx?: SxProps<Theme>; // permite sobrescribir estilos si lo deseas
}

export const CustomButton = ({
  text,
  color = "primary",
  variant = "outlined",
  onClick,
  sx,
}: CustomButtonProps) => {
  return (
    <Button
      onClick={onClick}
      color={color}
      variant={variant}
      sx={{
        fontWeight: "bold",
        borderRadius: 2,
        textTransform: "none",
        transition: "all 0.2s ease-in-out",
        color: (theme) =>
          variant === "outlined"
            ? theme.palette[color].main
            : theme.palette.getContrastText(theme.palette[color].main),
        borderColor: (theme) =>
          variant === "outlined" ? theme.palette[color].main : "transparent",

        "&:hover": {
          backgroundColor: (theme) => theme.palette[color].main,
          color: (theme) => theme.palette.background.paper,
          borderColor: (theme) => theme.palette[color].main,
          transform: "translateY(-1px)",
        },
        "&:active": {
          transform: "translateY(0)",
          boxShadow: "none",
        },
        ...sx,
      }}
    >
      {text}
    </Button>
  );
};

import React from "react";

interface CancelButtonProps {
  text: string;
  onClick?: () => void;
  sx?: SxProps<Theme>;
  disabled?: boolean;
  variant?: "outlined" | "contained" | "text";
  startIcon?: React.ReactNode;
}

const CancelButton: React.FC<CancelButtonProps> = ({
  text,
  onClick,
  sx,
  disabled = false,
  variant = "outlined",
  startIcon,
}) => {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      color="error"
      disabled={disabled}
      startIcon={startIcon}
      sx={{
        minWidth: 120,
        fontWeight: "bold",
        py: 1,
        px: 3,
        fontSize: "1rem",
        borderRadius: 3,
        borderWidth: variant === "outlined" ? 2 : undefined,
        transition: "all 0.3s ease",
        "&:hover": {
          borderWidth: variant === "outlined" ? 2 : undefined,
          bgcolor: variant === "outlined" ? "error.50" : undefined,
          transform: variant === "contained" ? "translateY(-2px)" : undefined,
        },
        ...sx,
      }}
    >
      {text}
    </Button>
  );
};

export default CancelButton;
