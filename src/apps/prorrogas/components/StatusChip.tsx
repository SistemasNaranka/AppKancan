import React from "react";
import Chip, { ChipProps } from "@mui/material/Chip";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { ContractStatus, RequestStatus, requestStatusMap } from "../types/types";
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

interface RequestStatusChipProps extends Omit<ChipProps, 'color'> {
  status: RequestStatus;
}

export const RequestStatusChip: React.FC<RequestStatusChipProps> = ({ status, ...props }) => {
  const cfg = requestStatusMap[status];
  if (!cfg) {
    return (
      <Chip
        label="Desconocido"
        size="small"
        {...props}
        sx={{
          backgroundColor: '#eceff1',
          color: '#37474f',
          border: '1px solid #b0bec5',
          fontWeight: 700,
          fontSize: '0.7rem',
          ...props.sx,
        }}
      />
    );
  }
  return (
    <Chip
      label={cfg.label}
      icon={<cfg.Icon sx={{ fontSize: '0.85rem !important', color: `${cfg.color} !important` }} />}
      size="small"
      {...props}
      sx={{
        backgroundColor: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        fontWeight: 700,
        fontSize: '0.7rem',
        '& .MuiChip-icon': { color: cfg.color },
        ...props.sx,
      }}
    />
  );
};

/** Badge de alerta de días */
export const AlertChip: React.FC<{ daysLeft: number }> = ({ daysLeft }) => {
  if (daysLeft < 0 || daysLeft > 50) return null;
  const urgent = daysLeft <= 20;
  return (
    <Chip
      label={urgent ? `Alerta urgente · ${daysLeft}d` : `Alerta 50 días · ${daysLeft}d`}
      size="small"
      icon={<WarningAmberIcon sx={{ fontSize: '0.8rem !important', color: urgent ? '#c62828 !important' : '#e65100 !important' }} />}
      sx={{
        mt: 0.5,
        backgroundColor: urgent ? '#fdecea' : '#fff3e0',
        color: urgent ? '#c62828' : '#e65100',
        border: `1px solid ${urgent ? '#ef9a9a' : '#ffcc80'}`,
        fontWeight: 700,
        fontSize: '0.68rem',
      }}
    />
  );
};
