import React from "react";
import { Box, Chip } from "@mui/material";
import { LibraryBooks, Inventory2, Notes } from "@mui/icons-material";

interface Props {
  uniqueCount: number;
  totalItems: number;
  observaciones: string;
  onObservaciones: () => void;
}

/**
 * Muestra un resumen de la información recopilada en el scanner.
 *
 * @param {number} uniqueCount - Número de referencias únicas.
 * @param {number} totalItems - Número total de unidades.
 * @param {string} observaciones - Observaciones de la recopilación.
 * @param {function} onObservaciones - Función para abrir el modal de observaciones.
 * @returns {JSX.Element} - Un JSX que contiene la información resumida.
 */
export const ScannerStats: React.FC<Props> = ({
  uniqueCount,
  totalItems,
  observaciones,
  onObservaciones,
}) => {
  return (
    <Box
      sx={{
        flexShrink: 0,
        display: "flex",
        // RESPONSIVE 1: Columna en móvil, Fila en escritorio
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
        px: { xs: 0, sm: 10, md: 11 },
        py: 1,
        width: "100%",
      }}
    >
      {/* 1. IZQUIERDA (Arriba en móvil): Botón de Observaciones */}
      <Chip
        icon={<Notes />}
        label={observaciones ? "Observaciones" : "Sin Observaciones"}
        variant="outlined"
        color={observaciones ? "secondary" : "default"}
        onClick={onObservaciones}
        clickable
        sx={{
          fontWeight: "bold",
          fontSize: "0.9rem",
          px: 1.5,
          py: 0.5,
          borderRadius: 3,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          height: "40px",
          cursor: "pointer",
          // RESPONSIVE 2: Ancho completo en móvil, automático en escritorio
          width: { xs: "100%", sm: "auto" },
          "& .MuiChip-label": {
            fontSize: "1rem",
          },
          "&:hover": {
            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
            transform: "translateY(-1px)",
          },
        }}
      />

      {/* 2. DERECHA (Abajo en móvil): Contadores */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          // RESPONSIVE 3: En móvil ocupa el 100% del ancho
          width: { xs: "100%", sm: "auto" },
        }}
      >
        <Chip
          icon={<LibraryBooks />}
          label={`Referencias: ${uniqueCount}`}
          variant="outlined"
          color="primary"
          sx={{
            fontWeight: "bold",
            fontSize: "1rem",
            px: 1,
            py: 0.5,
            borderRadius: 3,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            height: "40px",
            // RESPONSIVE 4: En móvil, cada chip ocupa el 50% (flex: 1)
            flex: { xs: 1, sm: "none" },
            "& .MuiChip-label": {
              fontSize: { xs: "1rem", sm: "1.2rem" },
              paddingLeft: 1,
              paddingRight: 1,
            },
          }}
        />
        <Chip
          icon={<Inventory2 />}
          label={`Total Unidades: ${totalItems}`}
          variant="outlined"
          color="success"
          sx={{
            fontWeight: "bold",
            fontSize: "1rem",
            px: 1,
            py: 0.5,
            borderRadius: 3,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            height: "40px",
            // RESPONSIVE 4: En móvil, cada chip ocupa el 50% (flex: 1)
            flex: { xs: 1, sm: "none" },
            "& .MuiChip-label": {
              fontSize: { xs: "1rem", sm: "1.2rem" },
              paddingLeft: 1,
              paddingRight: 1,
            },
          }}
        />
      </Box>
    </Box>
  );
};
