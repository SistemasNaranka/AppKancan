import React from "react";
import { DialogTitle, Alert, Typography } from "@mui/material";
import { Work, Warning } from "@mui/icons-material";
import { DirectusTienda } from "../../types";

interface CodesModalHeaderProps {
  tiendaUsuario: DirectusTienda | null;
  fechaActual: string;
}

export const CodesModalHeader: React.FC<CodesModalHeaderProps> = ({
  tiendaUsuario,
  fechaActual,
}) => (
  <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <Work />
    Asignar Asesores {tiendaUsuario?.name || "Tienda"} - {fechaActual}
  </DialogTitle>
);

interface MultipleStoresWarningProps {
  tiendasCount: number;
}

export const MultipleStoresWarning: React.FC<MultipleStoresWarningProps> = ({
  tiendasCount,
}) => (
  <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
    <Typography variant="subtitle2" sx={{ mb: 1 }}>
      Múltiples Tiendas Asignadas
    </Typography>
    <Typography variant="body2">
      Tienes {tiendasCount} tiendas asignadas. Para usar esta función, necesitas
      tener asignada únicamente una tienda. Por favor, contacta al soporte o
      sistemas para resolver esta situación.
    </Typography>
  </Alert>
);
