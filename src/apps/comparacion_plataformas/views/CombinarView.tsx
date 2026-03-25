import React from "react";
import { Box, Typography, Card, CardContent } from "@mui/material";
import MergeIcon from "@mui/icons-material/MergeType";

interface CombinarViewProps {
  tabsElement?: React.ReactNode;
}

const CombinarView: React.FC<CombinarViewProps> = ({ tabsElement }) => {
  return (
    <Box>
      {/* Mantenemos la alineación a la derecha de las pestañas */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        {tabsElement}
      </Box>

      <Card sx={{ borderRadius: 2, textAlign: "center", py: 8 }}>
        <CardContent>
          <MergeIcon sx={{ fontSize: 64, color: "#9e9e9e", mb: 2 }} />
          <Typography variant="h5" sx={{ color: "#666", mb: 1 }}>
            Combinar Archivos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Esta funcionalidad estará disponible próximamente
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CombinarView;