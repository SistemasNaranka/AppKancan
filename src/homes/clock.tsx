// src/components/Clock.tsx
import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";

const Clock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = currentTime.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formatTime = currentTime.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Box sx={{ textAlign: "right" }}>
      <Typography
        variant="h3"
        sx={{ fontWeight: 800, color: "#1e293b", fontFamily: "monospace" }}
      >
        {formatTime}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: "#64748b", mt: 1, textTransform: "capitalize" }}
      >
        {formatDate}
      </Typography>
    </Box>
  );
};

export default Clock;
