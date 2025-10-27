import React from "react";
import { Box, Fade, Typography } from "@mui/material";
import { Traslado } from "../hooks/types";
import TrasladoListItem from "./TrasladoListItem";

type Props = {
  filtrados: Traslado[];
  idsSeleccionados: number[];
  onToggleSeleccion: (id: number) => void;
};

export const ListaTraslados: React.FC<Props> = ({
  filtrados,
  idsSeleccionados,
  onToggleSeleccion,
}) => {
  return (
    <Box
      sx={{
        overflowX: "hidden",
        pr: 1,
        pt: 1,
        pb: 1,
        display: "grid",
        gap: 2,
        boxSizing: "border-box",
        alignItems: "start",

        // 🪄 Diseño responsive y fluido
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", // se llena automáticamente según espacio disponible
        justifyItems: "center",
      }}
    >
      {filtrados.length === 0 ? (
        <Fade in timeout={500}>
          <Box sx={{ userSelect: "none" }}>
            <Typography color="text.secondary">
              No hay traslados pendientes.
            </Typography>
          </Box>
        </Fade>
      ) : (
        filtrados.map((t) => {
          const isSelected =
            t.traslado !== undefined && idsSeleccionados.includes(t.traslado);
          return (
            <TrasladoListItem
              key={t.traslado ?? `traslado-${Math.random()}`}
              traslado={t}
              isSelected={isSelected}
              onTrasladoClick={() =>
                t.traslado !== undefined && onToggleSeleccion(t.traslado)
              }
              compact
            />
          );
        })
      )}
    </Box>
  );
};
