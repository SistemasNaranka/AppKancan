// Header global de la página de carga: controles de matriz, estado y botones de guardar/enviar.

import React from "react";
import { Button, Chip, Divider, Stack, Tooltip } from "@mui/material";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type { DynamicLoadMatrixHandle } from "../../components/DynamicLoadMatrix";

type LoadType = "general" | "producto_a" | "producto_b";

interface UploadHeaderProps {
  matrixRef: React.RefObject<DynamicLoadMatrixHandle>;
  loadType: LoadType;
  isConfirmed: boolean;
  hasChanges: boolean;
  saving: boolean;
  canEnableButtons: boolean;
  onOpenSaveDialog: () => void;
  onOpenSendDialog: () => void;
}

export const UploadHeader: React.FC<UploadHeaderProps> = ({
  matrixRef,
  loadType,
  isConfirmed,
  hasChanges,
  saving,
  canEnableButtons,
  onOpenSaveDialog,
  onOpenSendDialog,
}) => {
  return (
    <Stack
      className="tour-curvas-actions"
      direction="row"
      spacing={0.75}
      alignItems="center"
      sx={{ height: "100%" }}
    >
      <Divider
        orientation="vertical"
        flexItem
        sx={{ bgcolor: "rgba(255,255,255,0.15)", my: 1 }}
      />

      <Button
        variant="text"
        size="small"
        startIcon={<PlaylistAddIcon sx={{ color: "#fbbf24" }} />}
        onClick={() => matrixRef.current?.addRow()}
        sx={{
          borderRadius: 2,
          fontWeight: 700,
          textTransform: "none",
          px: 1.75,
          color: "white",
          height: 32,
          fontSize: "0.75rem",
          bgcolor: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.15)",
          "&:hover": {
            bgcolor: "rgba(255,255,255,0.18)",
            borderColor: "rgba(255,255,255,0.3)",
          },
        }}
      >
        + Tienda
      </Button>

      <Button
        variant="text"
        size="small"
        startIcon={<AddCircleOutlineIcon sx={{ color: "#93c5fd" }} />}
        onClick={() => matrixRef.current?.addColumn()}
        sx={{
          borderRadius: 2,
          fontWeight: 700,
          textTransform: "none",
          px: 1.75,
          color: "white",
          height: 32,
          fontSize: "0.75rem",
          bgcolor: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.15)",
          "&:hover": {
            bgcolor: "rgba(255,255,255,0.18)",
            borderColor: "rgba(255,255,255,0.3)",
          },
        }}
      >
        + {loadType === "general" ? "Curva" : "Talla"}
      </Button>

      <Tooltip title="Vacía todos los valores numéricos">
        <Button
          variant="text"
          size="small"
          startIcon={<DeleteIcon sx={{ color: "#fca5a5" }} />}
          onClick={() => matrixRef.current?.clearMatrix()}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            textTransform: "none",
            px: 1.75,
            color: "rgba(255,255,255,0.8)",
            height: 32,
            fontSize: "0.75rem",
            bgcolor: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            "&:hover": {
              bgcolor: "rgba(239,68,68,0.2)",
              borderColor: "rgba(252,165,165,0.4)",
              color: "white",
            },
          }}
        >
          Vaciar
        </Button>
      </Tooltip>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ bgcolor: "rgba(255,255,255,0.15)", my: 1 }}
      />

      {(matrixRef.current?.grandTotal || 0) > 0 && (
        <Chip
          label={`${(matrixRef.current?.grandTotal || 0).toLocaleString()} uds`}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: "0.68rem",
            height: 24,
            bgcolor: "rgba(110,231,183,0.2)",
            color: "#6ee7b7",
            border: "1px solid rgba(110,231,183,0.35)",
          }}
        />
      )}

      {isConfirmed ? (
        <Chip
          label="CONFIRMADO"
          size="small"
          icon={<CheckCircleIcon />}
          sx={{
            height: 24,
            fontSize: "0.65rem",
            bgcolor: "rgba(74,222,128,0.15)",
            color: "#4ade80",
            fontWeight: 800,
            border: "1px solid rgba(74,222,128,0.3)",
            "& .MuiChip-icon": { color: "#4ade80", fontSize: "0.9rem" },
          }}
        />
      ) : (
        <Chip
          label={hasChanges ? "PENDIENTE" : "BORRADOR"}
          size="small"
          icon={hasChanges ? <WarningAmberIcon /> : undefined}
          sx={{
            height: 24,
            fontSize: "0.65rem",
            bgcolor: hasChanges
              ? "rgba(251,191,36,0.2)"
              : "rgba(255,255,255,0.08)",
            color: hasChanges ? "#fbbf24" : "rgba(255,255,255,0.6)",
            fontWeight: 800,
            border: `1px solid ${hasChanges ? "rgba(251,191,36,0.35)" : "rgba(255,255,255,0.15)"}`,
            "& .MuiChip-icon": { color: "#fbbf24", fontSize: "0.85rem" },
          }}
        />
      )}

      <Button
        variant="outlined"
        size="small"
        startIcon={
          saving ? (
            <HistoryIcon
              sx={{ animation: "spin 1s linear infinite", color: "#fbbf24" }}
            />
          ) : (
            <SaveIcon sx={{ color: "#4ade80" }} />
          )
        }
        onClick={onOpenSaveDialog}
        disabled={saving || !canEnableButtons || isConfirmed}
        sx={{
          fontWeight: 700,
          borderRadius: 2,
          textTransform: "none",
          px: 2,
          height: 32,
          fontSize: "0.75rem",
          color: "white",
          borderColor: "rgba(255,255,255,0.3)",
          bgcolor: "rgba(255,255,255,0.08)",
          "&:hover": {
            borderColor: "rgba(255,255,255,0.6)",
            bgcolor: "rgba(255,255,255,0.16)",
            color: "white",
          },
          "&.Mui-disabled": {
            color: "rgba(255,255,255,0.25)",
            borderColor: "rgba(255,255,255,0.12)",
            bgcolor: "transparent",
          },
        }}
      >
        Guardar
      </Button>

      <Button
        variant="contained"
        size="small"
        startIcon={
          saving ? (
            <HistoryIcon
              sx={{ animation: "spin 1s linear infinite", color: "#004680" }}
            />
          ) : (
            <SendIcon sx={{ color: "#004680" }} />
          )
        }
        onClick={onOpenSendDialog}
        disabled={saving || !canEnableButtons || isConfirmed}
        sx={{
          fontWeight: 800,
          borderRadius: 2,
          textTransform: "none",
          px: 2.5,
          height: 32,
          fontSize: "0.75rem",
          bgcolor: "white",
          color: "#004680",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          "&:hover": {
            bgcolor: "#e6f4ff",
            boxShadow: "0 4px 16px rgba(0,0,0,0.28)",
          },
          "&.Mui-disabled": {
            bgcolor: "rgba(255,255,255,0.18)",
            color: "rgba(255,255,255,0.35)",
          },
        }}
      >
        Enviar a Despacho
      </Button>
    </Stack>
  );
};
