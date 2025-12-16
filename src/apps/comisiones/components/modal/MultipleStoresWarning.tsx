import React from "react";
import { Alert, Typography } from "@mui/material";
import { Warning } from "@mui/icons-material";

interface MultipleStoresWarningProps {
  tiendasCount: number;
}

export const MultipleStoresWarning: React.FC<MultipleStoresWarningProps> = ({
  tiendasCount,
}) => {
  return (
    <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Múltiples Tiendas Asignadas
      </Typography>
      <Typography variant="body2">
        Tienes {tiendasCount} tiendas asignadas. Para usar esta función,
        necesitas tener asignada únicamente una tienda. Por favor, contacta al
        administrador para resolver esta situación.
      </Typography>
    </Alert>
  );
};
