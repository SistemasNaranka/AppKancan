import React, { useEffect, useState } from "react";
import { Box, Typography, Alert, alpha } from "@mui/material";
import { CheckCircle, Error, Warning, Info } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

interface InlineMessageProps {
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  onHide?: () => void;
}

export const InlineMessage: React.FC<InlineMessageProps> = ({
  message,
  type,
  duration,
  onHide,
}) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  // Duración por defecto según el tipo de mensaje
  const getDefaultDuration = () => {
    switch (type) {
      case "success":
        return 1500; // 1.5 segundos para mensajes de éxito
      case "error":
        return 3000; // 3 segundos para errores
      case "warning":
        return 2500; // 2.5 segundos para advertencias
      case "info":
        return 2000; // 2 segundos para información
      default:
        return 2000;
    }
  };

  const finalDuration = duration || getDefaultDuration();

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onHide) {
          setTimeout(onHide, 300);
        }
      }, finalDuration);

      return () => clearTimeout(timer);
    }
  }, [message, finalDuration, onHide]);

  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle fontSize="small" />;
      case "error":
        return <Error fontSize="small" />;
      case "warning":
        return <Warning fontSize="small" />;
      case "info":
        return <Info fontSize="small" />;
      default:
        return <Info fontSize="small" />;
    }
  };

  const getCustomStyles = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: "#e8f5e8",
          border: "2px solid #4caf50",
          color: "#2e7d32",
          "& .MuiAlert-icon": {
            color: "#4caf50",
          },
        };
      case "error":
        return {
          backgroundColor: "#ffebee",
          border: "2px solid #f44336",
          color: "#c62828",
          "& .MuiAlert-icon": {
            color: "#f44336",
          },
        };
      case "warning":
        return {
          backgroundColor: "#fff3e0",
          border: "2px solid #ff9800",
          color: "#ef6c00",
          "& .MuiAlert-icon": {
            color: "#ff9800",
          },
        };
      case "info":
        return {
          backgroundColor: "#e3f2fd",
          border: "2px solid #2196f3",
          color: "#1565c0",
          "& .MuiAlert-icon": {
            color: "#2196f3",
          },
        };
      default:
        return {};
    }
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        pointerEvents: "none",
        display: "flex",
        justifyContent: "center",
        mt: 2,
        animation: visible
          ? "slideDown 0.3s ease-out"
          : "slideUp 0.3s ease-in",
        "@keyframes slideDown": {
          from: {
            opacity: 0,
            transform: "translateY(-100%)",
          },
          to: {
            opacity: 1,
            transform: "translateY(0)",
          },
        },
        "@keyframes slideUp": {
          from: {
            opacity: 1,
            transform: "translateY(0)",
          },
          to: {
            opacity: 0,
            transform: "translateY(-100%)",
          },
        },
      }}
    >
      <Alert
        severity={type}
        icon={false}
        sx={{
          pointerEvents: "auto",
          maxWidth: "600px",
          width: "90%",
          alignItems: "center",
          boxShadow: 6,
          borderRadius: 2,
          backdropFilter: "blur(8px)",
          ...getCustomStyles(),
          "& .MuiAlert-message": {
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            width: "100%",
            fontWeight: 500,
          },
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: 8,
            transform: "translateY(-2px)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            width: "100%"
          }}
        >
          {getIcon()}
          <Typography
            variant="body2"
            sx={{
              flex: 1,
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            {message}
          </Typography>
        </Box>
      </Alert>
    </Box>
  );
};
