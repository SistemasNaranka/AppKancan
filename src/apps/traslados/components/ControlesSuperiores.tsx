import React from "react";
import { Box, Button, useTheme } from "@mui/material";

type Props = {
  idsSeleccionadosLength: number;
  loading: boolean;
  onToggleSeleccionarTodos: (seleccionar: boolean) => void;
  onAbrirDialogoAprobacion: () => void;
};

export const ControlesSuperiores: React.FC<Props> = ({
  idsSeleccionadosLength,
  loading,
  onAbrirDialogoAprobacion,
}) => {
  // ✅ useTheme debe ir *dentro* del componente
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        flexWrap: "wrap",
        gap: 1.5,
      }}
    >
      <Button
        variant="contained"
        color="success"
        size="large"
        onClick={onAbrirDialogoAprobacion}
        disabled={idsSeleccionadosLength === 0 || loading}
        sx={{
          fontWeight: 700,
          borderRadius: 3,
          px: 4,
          py: 1.2,
          fontSize: "1rem",
          opacity: idsSeleccionadosLength === 0 ? 0.5 : 1,
          cursor: idsSeleccionadosLength === 0 ? "not-allowed" : "pointer",
          transition: "transform 0.15s",
          "&:hover": {
            backgroundColor: isDark
              ? theme.palette.success.dark
              : theme.palette.success.dark,
            transform: idsSeleccionadosLength === 0 ? "none" : "scale(1.03)",
          },
        }}
      >
        APROBAR
      </Button>
    </Box>
  );
};
