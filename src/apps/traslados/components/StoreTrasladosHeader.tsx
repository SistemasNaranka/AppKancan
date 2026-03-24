import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

interface StoreTrasladosHeaderProps {
  totalPendientes: number;
}

export const StoreTrasladosHeader: React.FC<StoreTrasladosHeaderProps> = ({
  totalPendientes,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        width: "100%",
        mb: 0,
      }}
    >
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#1E293B",
            letterSpacing: "-0.02em",
            mb: 0.5,
          }}
        >
          Traslados en Tránsito
        </Typography>
      </Box>

      <Chip
        icon={
          <AccessTimeIcon
            sx={{
              fontSize: "20px !important",
              color: "primary.main !important",
            }}
          />
        }
        label={`En Tránsito: ${totalPendientes}`}
        sx={{
          backgroundColor: "#EFF6FF",
          color: "primary.main",
          fontWeight: 700,
          borderRadius: "10px",
          border: "1px solid #DBEAFE",
          height: "40px",
          fontSize: "1rem",
          "& .MuiChip-label": {
            px: 2,
          },
        }}
      />
    </Box>
  );
};

export default StoreTrasladosHeader;
