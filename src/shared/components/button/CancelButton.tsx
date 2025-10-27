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
