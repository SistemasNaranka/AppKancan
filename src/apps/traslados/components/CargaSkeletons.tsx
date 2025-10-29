import React from "react";
import { Box, Skeleton, Card, CardContent } from "@mui/material";

type SkeletonCardProps = {
  count?: number;
  height?: string | number;
};

/**
 * Skeleton similar visualmente a la tarjeta de traslados real.
 * Mantiene tus props originales y simula el layout exacto.
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  count = 6,
  height = 180,
}) => {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        justifyItems: "center",
        pr: 1,
        pt: 1,
        pb: 1,
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          sx={{
            width: "100%",
            maxWidth: 320,
            height: height,
            borderRadius: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.2,
              height: "100%",
              p: 2,
            }}
          >
            {/* 🔹 Encabezado: "Traslado: XXXX" + Chip */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.5,
              }}
            >
              <Skeleton variant="text" height={24} width="50%" />
              <Skeleton variant="rounded" height={26} width={80} />
            </Box>

            {/* 🔹 Fecha y unidades */}
            <Skeleton variant="text" height={18} width="60%" />
            <Skeleton variant="text" height={18} width="50%" />

            {/* 🔹 Espacio visual */}
            <Box sx={{ flexGrow: 1 }} />

            {/* 🔹 Línea inferior: Origen → Destino */}
            <Skeleton variant="text" height={20} width="90%" />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default SkeletonCard;
