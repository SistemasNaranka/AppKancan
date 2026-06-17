import React from "react";
import { Box, Button, useTheme } from "@mui/material";
import TrasladosHelpButton from "./TrasladosHelpButton";

type Props = {
  idsSeleccionadosLength: number;
  loading: boolean;
  onToggleSeleccionarTodos: (seleccionar: boolean) => void;
  onAbrirDialogoAprobacion: () => void;
  tienePoliticaTrasladosJefezona?: boolean;
  tienePoliticaTrasladosTiendas?: boolean;
};

export const ControlesSuperiores: React.FC<Props> = ({
  idsSeleccionadosLength,
  loading,
  onAbrirDialogoAprobacion,
  tienePoliticaTrasladosJefezona = false,
  tienePoliticaTrasladosTiendas = false,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        height: "100%",
        p: 2,
        gap: 9,

        [theme.breakpoints.down("sm")]: {
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 1.5,
          height: "auto",
        },
      }}
    >

      {!tienePoliticaTrasladosTiendas && (
        <Box
          sx={{
            alignSelf: "flex-end",
            [theme.breakpoints.down("sm")]: {
              alignSelf: "center",
            },
          }}
        >
          <TrasladosHelpButton compact />
        </Box>
      )}


      {!tienePoliticaTrasladosJefezona && !tienePoliticaTrasladosTiendas && (
        <Button
          variant="contained"
          color="success"
          size="large"
          data-tour="aprobar"
          onClick={onAbrirDialogoAprobacion}
          disabled={idsSeleccionadosLength === 0 || loading}
          sx={{
            fontWeight: 700,
            borderRadius: 3,
            px: 6,
            py: 1.4,
            fontSize: "1.1rem",
            opacity: idsSeleccionadosLength === 0 ? 0.5 : 1,
            cursor: idsSeleccionadosLength === 0 ? "not-allowed" : "pointer",
            transition: "transform 0.15s",
            "&:hover": {
              backgroundColor: theme.palette.success.dark,
              transform: idsSeleccionadosLength === 0 ? "none" : "scale(1.04)",
            },

            [theme.breakpoints.down("sm")]: {
              px: 3,
              py: 1,
              fontSize: "0.9rem",
              borderRadius: 2,
              flexShrink: 0,
            },
          }}
        >
          APROBAR
        </Button>
      )}
    </Box>
  );
};
