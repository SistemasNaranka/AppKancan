// Barra de tipo de carga (General / Productos) + inputs REF y COLOR opcional.

import React from "react";
import {
  Box,
  Divider,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { LocalControlledInput } from "./LocalControlledInput";
import type { DynamicLoadMatrixHandle } from "../../components/DynamicLoadMatrix";

type LoadType = "general" | "producto_a" | "producto_b";

interface LoadTypeAndRefBarProps {
  loadType: LoadType;
  onLoadTypeChange: (
    _event: React.MouseEvent<HTMLElement>,
    nextType: LoadType | null,
  ) => void;
  matrixRef: React.RefObject<DynamicLoadMatrixHandle>;
}

const inputSx = {
  width: 180,
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "#ffffff",
    height: 38,
    transition: "all 0.2s ease",
    "& fieldset": { borderColor: "#94a3b8", borderWidth: 1.5 },
    "&:hover": { bgcolor: "#ffffff" },
    "&:hover fieldset": { borderColor: "#64748b", borderWidth: 1.5 },
    "&.Mui-focused fieldset": { borderColor: "#006ACC", borderWidth: 2 },
    "&.Mui-focused": {
      bgcolor: "#ffffff",
      boxShadow: "0 2px 8px rgba(0,106,204,0.15)",
    },
  },
  "& .MuiOutlinedInput-input": {
    fontSize: "0.85rem",
    fontWeight: 700,
    padding: "8px 14px",
    color: "#1e293b",
    "&::placeholder": { color: "#94a3b8", fontWeight: 500, opacity: 1 },
  },
};

const colorInputSx = { ...inputSx, width: 160 };

export const LoadTypeAndRefBar: React.FC<LoadTypeAndRefBarProps> = ({
  loadType,
  onLoadTypeChange,
  matrixRef,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        py: 1.5,
        px: 2.5,
        display: "flex",
        alignItems: "center",
        gap: 2.5,
        bgcolor: "white",
        border: "1px solid rgba(0,106,204,0.15)",
        borderRadius: 3,
        boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
        mb: 1,
      }}
    >
      <ToggleButtonGroup
        id="tour-load-type"
        value={loadType}
        exclusive
        onChange={onLoadTypeChange}
        size="small"
        sx={{
          bgcolor: "rgba(0,106,204,0.06)",
          p: 0.5,
          borderRadius: 2.5,
          "& .MuiToggleButton-root": {
            px: 3,
            py: 0.75,
            fontWeight: 800,
            fontSize: "0.75rem",
            border: "none",
            borderRadius: 2,
            color: "#006ACC",
            transition: "all 0.2s ease-in-out",
            "&.Mui-selected": {
              bgcolor: "white",
              color: "#006ACC",
              boxShadow: "0 2px 8px rgba(0,106,204,0.15)",
            },
            "&:hover:not(.Mui-selected)": {
              bgcolor: "rgba(0,106,204,0.1)",
            },
          },
        }}
      >
        <ToggleButton value="general">GENERAL</ToggleButton>
        <ToggleButton value="producto_a">PRODUCTOS</ToggleButton>
      </ToggleButtonGroup>

      <Divider
        orientation="vertical"
        flexItem
        sx={{
          bgcolor: "rgba(0,106,204,0.1)",
          mx: 0.5,
          height: 32,
          alignSelf: "center",
        }}
      />

      <Box
        id="tour-referencia"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <Typography
          variant="caption"
          fontWeight={900}
          sx={{
            color: "#006ACC",
            textTransform: "uppercase",
            fontSize: "0.75rem",
            letterSpacing: "0.05em",
          }}
        >
          REF:
        </Typography>
        <LocalControlledInput
          value={matrixRef.current?.referencia || ""}
          onChange={(val) =>
            matrixRef.current?.setReferencia(val.toUpperCase())
          }
          placeholder="EJ: REF-78124"
          sx={inputSx}
        />
      </Box>

      {loadType !== "general" ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="caption"
            fontWeight={900}
            sx={{
              color: "#006ACC",
              textTransform: "uppercase",
              fontSize: "0.75rem",
              letterSpacing: "0.05em",
            }}
          >
            COLOR:
          </Typography>
          <LocalControlledInput
            value={matrixRef.current?.color || ""}
            onChange={(val) => matrixRef.current?.setColor(val)}
            placeholder="EJ:78124"
            sx={colorInputSx}
          />
        </Box>
      ) : null}
    </Paper>
  );
};
