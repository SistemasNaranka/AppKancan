import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// ─────────────────────────────────────────────────────────────────────────────
// ContractTimeline - Componente simplificado (próximamente con datos reales)
// ─────────────────────────────────────────────────────────────────────────────

const ContractTimeline: React.FC = () => {
  return (
    <Box sx={{ p: 3, textAlign: "center" }}>
      <Typography variant="body2" color="text.secondary">
        Timeline de prórrogas - Próximamente
      </Typography>
    </Box>
  );
};

export default ContractTimeline;
