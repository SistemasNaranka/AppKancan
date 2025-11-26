import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Divider,
  IconButton,
} from "@mui/material";
import { RestartAlt, Delete, Print, Check, Close } from "@mui/icons-material";
import CancelButton from "@/shared/components/button/CancelButton";
import ConfirmButton from "@/shared/components/button/ConfirmButton";

interface GeneralConfirmModalProps {
  open: boolean;
  type: "cancel" | "delete" | "print";
  item?: string;
  count?: number;
  onConfirm: () => void;
  onCancel: () => void;
  onClose?: () => void;
}

const modalConfig = {
  cancel: {
    icon: RestartAlt,
    title: "Confirmar reinicio",
    iconBgColor: "#FFF3CD",
    iconColor: "warning.main",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
  },
  delete: {
    icon: Delete,
    title: "Confirmar eliminación",
    iconBgColor: "#FDECEA",
    iconColor: "error.main",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
  },
  print: {
    icon: Print,
    title: "Imprimir Ajuste",
    iconBgColor: "#E3F2FD",
    iconColor: "primary.main",
    confirmText: "Sí",
    cancelText: "No",
  },
};

export const GeneralConfirmModal: React.FC<GeneralConfirmModalProps> = ({
  open,
  type,
  item,
  count,
  onConfirm,
  onCancel,
  onClose,
}) => {
  const config = modalConfig[type];
  const IconComponent = config.icon;
  const isPrint = type === "print";

  const getMessage = () => {
    switch (type) {
      case "cancel":
        return (
          <>
            ¿Está seguro de reiniciar la lista? Se eliminarán{" "}
            <Box
              component="span"
              sx={{
                color: "primary.main",
                fontWeight: 600,
              }}
            >
              {count}
            </Box>{" "}
            referencias.
          </>
        );
      case "delete":
        return (
          <>
            ¿Está seguro de eliminar la referencia{" "}
            <Box
              component="span"
              sx={{
                color: "primary.main",
                fontWeight: 600,
              }}
            >
              {item}
            </Box>
            ?
          </>
        );
      case "print":
        return "¿Desea imprimir el ajuste?";
      default:
        return "";
    }
  };

  const handleClose = (
    _event: object,
    reason: "backdropClick" | "escapeKeyDown"
  ) => {
    // Si es print, no permitir cerrar con backdrop o escape
    if (isPrint && (reason === "backdropClick" || reason === "escapeKeyDown")) {
      return;
    }
    (onClose || onCancel)();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      disableEscapeKeyDown={isPrint}
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          overflow: "visible",
          minWidth: 340,
          maxWidth: 420,
          m: 2,
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(0,0,0,0.35)",
          },
        },
      }}
    >
      {/* Botón X para cerrar (solo en print) */}
      {isPrint && (
        <IconButton
          onClick={onClose || onCancel}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "text.secondary",
            "&:hover": {
              color: "text.primary",
              backgroundColor: "action.hover",
            },
          }}
          size="small"
        >
          <Close fontSize="small" />
        </IconButton>
      )}

      {/* Icono flotante superior */}
      <Box
        sx={{
          position: "absolute",
          top: -28,
          left: "50%",
          transform: "translateX(-50%)",
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: config.iconBgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        }}
      >
        <IconComponent
          sx={{
            fontSize: 28,
            color: config.iconColor,
          }}
        />
      </Box>

      {/* Contenido del modal */}
      <Box sx={{ pt: 4.5 }}>
        <DialogTitle
          id="alert-dialog-title"
          sx={{
            fontWeight: 600,
            fontSize: "1.4rem",
            color: "text.primary",
            textAlign: "center",
            py: 1,
            px: 3,
          }}
        >
          {config.title}
        </DialogTitle>

        <Divider />

        <DialogContent
          sx={{
            py: 2.5,
            px: 3,
          }}
        >
          <Typography
            id="alert-dialog-description"
            sx={{
              color: "text.secondary",
              fontSize: "1.1rem",
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            {getMessage()}
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
            pt: 0.5,
            justifyContent: "center",
            gap: 1.5,
          }}
        >
          <CancelButton
            text={config.cancelText}
            onClick={onCancel}
            startIcon={<Close />}
          />
          <ConfirmButton
            text={config.confirmText}
            onClick={onConfirm}
            autoFocus
            startIcon={<Check />}
          />
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default GeneralConfirmModal;
