import React from "react";
import { Box, Chip } from "@mui/material";
import { LibraryBooks, Inventory2 } from "@mui/icons-material";

interface Props {
  uniqueCount: number;
  totalItems: number;
}

export const ScannerStats: React.FC<Props> = ({ uniqueCount, totalItems }) => {
  return (
    <Box
      sx={{
        flexShrink: 0,
        display: "flex",
        justifyContent: "right",
        alignItems: "right",
        gap: 2,
        py: 1,
      }}
    >
      <Chip
        icon={<LibraryBooks />}
        label={`Referencias: ${uniqueCount}`}
        variant="outlined"
        color="primary"
        sx={{
          fontWeight: "bold",
          fontSize: "1rem",
          px: 1,
          py: 0.5,
          borderRadius: 3,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          height: "40px", // Custom height
          "& .MuiChip-label": {
            fontSize: "1.2rem", // Custom font size for the label
          },
        }}
      />
      <Chip
        icon={<Inventory2 />}
        label={`Total Unidades: ${totalItems}`}
        variant="outlined"
        color="success"
        sx={{
          fontWeight: "bold",
          fontSize: "1rem",
          px: 1,
          py: 0.5,
          borderRadius: 3,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          height: "40px", // Custom height
          "& .MuiChip-label": {
            fontSize: "1.2rem", // Custom font size for the label
          },
        }}
      />
    </Box>
  );
};
