import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  useTheme,
} from "@mui/material";

interface AlertDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      maxWidth="sm"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 4,
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          p: 1,
        },
      }}
    >
      <DialogTitle
        id="alert-dialog-title"
        sx={{
          fontWeight: 700,
          fontSize: "1.5rem",
          color: theme.palette.primary.main,
          textAlign: "center",
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography
          id="alert-dialog-description"
          sx={{
            color: "text.primary",
            fontSize: "1.1rem",
            lineHeight: 1.5,
            textAlign: "center",
          }}
        >
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 3, justifyContent: "center", gap: 2 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          color="error"
          sx={{
            minWidth: 120,
            fontWeight: "bold",
            py: 1.5,
            px: 3,
            fontSize: "1rem",
            borderRadius: 3,
            borderWidth: 2,
            "&:hover": {
              borderWidth: 2,
              bgcolor: "error.50",
            },
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="outlined"
          color="primary"
          autoFocus
          sx={{
            minWidth: 120,
            fontWeight: "bold",
            py: 1.5,
            px: 3,
            fontSize: "1rem",
            borderRadius: 3,
            borderWidth: 2,
            "&:hover": {
              borderWidth: 2,
              bgcolor: "primary.50",
            },
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
