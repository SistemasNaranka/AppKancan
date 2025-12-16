import React, { useEffect, useState } from "react";
import { Box, Typography, Alert } from "@mui/material";
import { CheckCircle, Error, Warning, Info } from "@mui/icons-material";

interface InlineMessageProps {
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  onHide?: () => void;
}

export const InlineMessage: React.FC<InlineMessageProps> = ({
  message,
  type,
  duration = 5000,
  onHide,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onHide) {
          setTimeout(onHide, 300);
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, duration, onHide]);

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

  const getSeverity = () => {
    switch (type) {
      case "success":
        return "success";
      case "error":
        return "error";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "info";
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
      }}
    >
      <Alert
        severity={getSeverity()}
        icon={false}
        sx={{
          pointerEvents: "auto",
          maxWidth: "600px",
          width: "90%",
          alignItems: "center",
          boxShadow: 3,
          "& .MuiAlert-message": {
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: "100%",
          },
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}
        >
          {getIcon()}
          <Typography variant="body2" sx={{ flex: 1 }}>
            {message}
          </Typography>
        </Box>
      </Alert>
    </Box>
  );
};
