import React from "react";
import { Paper, Box, Skeleton } from "@mui/material";

/**
 * Skeleton para mostrar mientras carga el DataGrid
 * Componente modularizado para reutilización
 */
export const DataTableSkeleton = React.memo(() => {
  return (
    <Paper
      sx={{
        width: "100%",
        p: 2,
        backgroundColor: "#fafafa",
        border: "1px solid #e0e0e0",
      }}
    >
      <Box sx={{ width: "100%" }}>
        {/* Skeleton para headers */}
        <Box sx={{ display: "flex", mb: 2 }}>
          {[...Array(7)].map((_, i) => (
            <Skeleton
              key={`header-${i}`}
              height={32}
              sx={{
                mr: 1,
                flex: i === 0 ? 1 : 0.8,
                backgroundColor: "rgba(0,0,0,0.1)",
              }}
            />
          ))}
        </Box>
        {/* Skeleton para rows */}
        {[...Array(5)].map((_, i) => (
          <Box key={i} sx={{ display: "flex", mb: 1 }}>
            {[...Array(7)].map((_, j) => (
              <Skeleton
                key={`row-${i}-${j}`}
                height={40}
                sx={{
                  mr: 1,
                  flex: j === 0 ? 1 : 0.8,
                  backgroundColor:
                    i % 2 === 0 ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.05)",
                }}
              />
            ))}
          </Box>
        ))}
      </Box>
    </Paper>
  );
});
