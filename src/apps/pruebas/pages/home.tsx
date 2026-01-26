import React from "react";
import { Box, Typography } from "@mui/material";

import NormalizarView from "../views/NormalizarView";

const Home: React.FC = () => {
  
  return (
    <Box sx={{ p: 3, minHeight: "100vh", backgroundColor: "transparent" }}>
      {/* Header con título */}
      <Box sx={{
        mb: 3
      }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1a2a3ae0" }}>
          Gestión de Archivos
        </Typography>
      </Box>

      {/* Contenido */}
      <Box>
        <NormalizarView />
      </Box>
    </Box>
  );
};

export default Home;