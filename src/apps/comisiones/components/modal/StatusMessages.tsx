import React from "react";
import { Alert, Box } from "@mui/material";
import { CheckCircle, Error } from "@mui/icons-material";

interface StatusMessagesProps {
  error: string | null;
  success: string | null;
}

export const StatusMessages: React.FC<StatusMessagesProps> = ({
  error,
  success,
}) => {
  return (
    <Box sx={{ position: "relative", minHeight: "60px" }}>
      {/* Mensaje de error - Posición absoluta para no afectar layout */}
      {error && (
        <Alert
          severity="error"
          icon={<Error />}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            animation: "slideDown 0.3s ease-out",
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
          }}
        >
          {error}
        </Alert>
      )}

      {/* Mensaje de éxito - Posición absoluta para no afectar layout */}
      {success && (
        <Alert
          severity="success"
          icon={<CheckCircle />}
          sx={{
            position: "absolute",
            top: error ? "60px" : 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            animation: "slideDown 0.3s ease-out",
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
          }}
        >
          {success}
        </Alert>
      )}
    </Box>
  );
};
