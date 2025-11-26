import React from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  CircularProgress,
} from "@mui/material";

interface EnvioLoadingModalProps {
  open: boolean;
  title?: string;
  message?: string;
}

const EnvioLoadingModal: React.FC<EnvioLoadingModalProps> = ({
  open,
  title = "Enviando muestras...",
  message = "Por favor espera unos segundos mientras procesamos tu solicitud.",
}) => {
  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: { xs: 2, sm: 4 },
          p: 0,
          background: "rgba(255,255,255,0.98)",
          boxShadow: "0 10px 40px 0 rgba(0,0,0,0.18)",
          minWidth: { xs: 260, sm: 320, md: 340 },
          mx: { xs: 2, sm: 0 },
        },
      }}
    >
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: { xs: 160, sm: 200 },
          py: { xs: 2.5, sm: 4 },
          px: { xs: 2, sm: 3 },
          gap: { xs: 1, sm: 2 },
        }}
      >
        <CircularProgress
          size={54}
          sx={{
            color: "primary.main",
            mb: { xs: 1, sm: 2 },
          }}
        />
        <Typography
          variant="h6"
          sx={{
            mt: { xs: 0, sm: 1 },
            fontWeight: 700,
            color: "primary.main",
            letterSpacing: 0.5,
            fontSize: { xs: "1rem", sm: "1.25rem" },
            textAlign: "center",
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: { xs: 0, sm: 0.5 },
            textAlign: "center",
            fontSize: { xs: "0.8rem", sm: "0.875rem" },
            px: { xs: 1, sm: 0 },
          }}
        >
          {message}
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default EnvioLoadingModal;
