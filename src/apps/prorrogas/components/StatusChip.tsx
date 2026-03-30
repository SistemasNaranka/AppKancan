import React from "react";
import Chip, { ChipProps } from "@mui/material/Chip";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { ContractStatus } from "../types/types";
import { SvgIconComponent } from "@mui/icons-material";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG MAPS
// ─────────────────────────────────────────────────────────────────────────────

interface ChipConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  Icon: SvgIconComponent;
}

const contractStatusMap: Record<ContractStatus, ChipConfig> = {
  vigente: {
    label: "Vigente",
    color: "#1a7a4a",
    bg: "#e6f7ef",
    border: "#b7dfcc",
    Icon: CheckCircleOutlineIcon,
  },
  proximo: {
    label: "Próximo a vencer",
    color: "#e65100",
    bg: "#fff3e0",
    border: "#ffcc80",
    Icon: WarningAmberIcon,
  },
  vencido: {
    label: "Vencido",
    color: "#c62828",
    bg: "#fdecea",
    border: "#ef9a9a",
    Icon: ErrorOutlineIcon,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

interface ContractStatusChipProps extends Omit<ChipProps, "color"> {
  status: ContractStatus;
}

export const ContractStatusChip: React.FC<ContractStatusChipProps> = ({
  status,
  ...props
}) => {
  const cfg = contractStatusMap[status];
  const IconComponent = cfg.Icon;
  return (
    <Chip
      label={cfg.label}
      icon={
        <IconComponent
          sx={{
            fontSize: "0.85rem !important",
            color: `${cfg.color} !important`,
          }}
        />
      }
      size="small"
      {...props}
      sx={{
        backgroundColor: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        fontWeight: 700,
        fontSize: "0.7rem",
        "& .MuiChip-icon": { color: cfg.color },
        ...props.sx,
      }}
    />
  );
};
