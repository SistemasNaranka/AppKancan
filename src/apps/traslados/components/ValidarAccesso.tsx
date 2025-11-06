// src/apps/traslados/components/AccessValidationModal.tsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  Fade,
} from "@mui/material";
import { Lock } from "@mui/icons-material";

interface AccessValidationModalProps {
  open: boolean;
  errorType: "no-access" | "incomplete" | null;
  onHome?: () => void;
}

/**
 * Modal de validación de acceso — usa la paleta del tema actual (claro/oscuro).
 */
export const AccessValidationModal: React.FC<AccessValidationModalProps> = ({
  open,
  errorType,
  onHome = () => {},
}) => {
  const isNoAccess = errorType === "no-access";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // 🎨 Usa colores del tema
  const bgColor = isNoAccess
    ? theme.palette.background.paper // fondo si es "sin acceso"
    : theme.palette.background.paper; // fondo si es "incompleto"

  const titleColor = isNoAccess
    ? theme.palette.error.main
    : theme.palette.warning.main;

  const iconColor = titleColor;
  const borderColor = isNoAccess
    ? theme.palette.error.main
    : theme.palette.warning.main;

  const textColor =
    theme.palette.mode === "dark" ? theme.palette.text.secondary : "#444";

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="xs"
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
      }}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 2 : 3,
          boxShadow: "0 8px 28px rgba(0,0,0,0.15)",
          overflow: "hidden",
          border: `1px solid ${borderColor}`,
          backgroundColor: theme.palette.background.paper,
          animation: "fadeIn 0.3s ease-out",
          "@keyframes fadeIn": {
            from: { opacity: 0, transform: "scale(0.95)" },
            to: { opacity: 1, transform: "scale(1)" },
          },
        },
      }}
      TransitionComponent={Fade}
      transitionDuration={300}
    >
      {/* Encabezado */}
      <Box
        sx={{
          backgroundColor: bgColor,
          textAlign: "center",
          py: isMobile ? 2.5 : 3.5,
          px: isMobile ? 2 : 3,
          borderBottom: `2px solid ${borderColor}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Lock
          sx={{
            fontSize: isMobile ? 38 : 46,
            color: iconColor,
            mb: 0.5,
            opacity: 0.9,
          }}
        />
        <DialogTitle
          sx={{
            textAlign: "center",
            p: 0,
            m: 0,
            color: titleColor,
            fontWeight: 700,
            fontSize: isMobile ? "1.15rem" : "1.4rem",
            letterSpacing: "0.3px",
          }}
        >
          Acceso No Disponible
        </DialogTitle>
      </Box>

      {/* Contenido */}
      <DialogContent
        sx={{
          p: isMobile ? 2.5 : 4,
          textAlign: "center",
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: textColor,
            lineHeight: 1.7,
            fontSize: isMobile ? "0.95rem" : "1.05rem",
            fontWeight: 400,
            maxWidth: 420,
            mx: "auto",
          }}
        >
          Tu usuario aún no está configurado para usar este apartado o tiene
          información incompleta. <br />
          Por favor comunícate con el área de{" "}
          <strong style={{ color: titleColor }}>sistemas</strong> o
          <strong style={{ color: titleColor }}> Soporte</strong> para que
          puedan ayudarte a habilitar el acceso.
        </Typography>
      </DialogContent>

      {/* Botón */}
      <DialogActions
        sx={{
          justifyContent: "center",
          p: isMobile ? 1 : 3,
          pt: 0,
          pb: isMobile ? 2.5 : 3.5,
          background: theme.palette.bgAlt,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={onHome}
          fullWidth={isMobile}
          sx={{
            py: 1,
            mt: 3,
            fontWeight: 600,
            borderRadius: 2.5,
            textTransform: "none",
            fontSize: isMobile ? "1rem" : "1.05rem",
            minWidth: 160,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            "&:hover": {
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              transform: "translateY(-1px)",
              backgroundColor: theme.palette.primary.dark,
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          Volver al Inicio
        </Button>
      </DialogActions>
    </Dialog>
  );
};
