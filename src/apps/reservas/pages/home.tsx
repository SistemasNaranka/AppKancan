// src/apps/reservas/pages/home.tsx

import React from "react";
import { Box, Typography } from "@mui/material";
import { CalendarMonth as CalendarIcon } from "@mui/icons-material";
import ReservasView from "../views/ReservasView";

const Home: React.FC = () => {
  return (
    <Box sx={{ paddingX: 3, paddingY: 0, minHeight: "100vh", backgroundColor: "transparent" }}>
      {/* Header con título e ícono */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        {/* <Box
          sx={{
            backgroundColor: "#2196f3",
            borderRadius: 2,
            p: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CalendarIcon sx={{ fontSize: 32, color: "white" }} />
        </Box> */}
        {/* <Box>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1a2a3ae0", fontSize: 20,}}>
            Reserva de salas
          </Typography>
        </Box> */}
      </Box>

      {/* Contenido */}
      <Box>
        <ReservasView />
      </Box>
    </Box>
  );
};

export default Home;