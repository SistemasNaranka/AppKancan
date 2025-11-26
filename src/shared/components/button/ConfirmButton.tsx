import React from "react";
import { Button, SxProps, Theme } from "@mui/material";

interface ConfirmButtonProps {
  text: string;
  onClick?: () => void;
  sx?: SxProps<Theme>;
  disabled?: boolean;
  autoFocus?: boolean;
  variant?: "outlined" | "contained" | "text";
  color?: "primary" | "secondary" | "error" | "success" | "warning" | "info";
  startIcon?: React.ReactNode;
}

const ConfirmButton: React.FC<ConfirmButtonProps> = ({
  text,
  onClick,
  sx,
  disabled = false,
  autoFocus = false,
  variant = "outlined",
  color = "primary",
  startIcon,
}) => {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      color={color}
      disabled={disabled}
      autoFocus={autoFocus}
      startIcon={startIcon}
      sx={{
        minWidth: 120,
        fontWeight: "bold",
        py: 1,
        px: 3,
        fontSize: "1rem",
        borderRadius: 3,
        borderWidth: variant === "outlined" ? 2 : undefined,
        boxShadow:
          variant === "contained" ? "0 4px 12px rgba(0,0,0,0.15)" : undefined,
        transition: "all 0.3s ease",
        "&:hover": {
          borderWidth: variant === "outlined" ? 2 : undefined,
          bgcolor: variant === "outlined" ? `${color}.50` : undefined,
          transform: variant === "contained" ? "translateY(-2px)" : undefined,
          boxShadow:
            variant === "contained" ? "0 6px 16px rgba(0,0,0,0.2)" : undefined,
        },
        "&:disabled": {
          bgcolor: variant === "contained" ? "grey.300" : undefined,
          color: variant === "contained" ? "grey.600" : undefined,
          transform: "none",
          boxShadow: "none",
        },
        ...sx,
      }}
    >
      {text}
    </Button>
  );
};

export default ConfirmButton;
