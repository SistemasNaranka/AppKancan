import React from "react";
import { DialogTitle } from "@mui/material";
import { Work } from "@mui/icons-material";
import { DirectusTienda } from "../../types";

interface CodesModalHeaderProps {
  tiendaUsuario: DirectusTienda | null;
  fechaActual: string;
}

export const CodesModalHeader: React.FC<CodesModalHeaderProps> = ({
  tiendaUsuario,
  fechaActual,
}) => {
  return (
    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Work />
      Asignar Asesores {tiendaUsuario?.nombre || "Tienda"} - {fechaActual}
    </DialogTitle>
  );
};
