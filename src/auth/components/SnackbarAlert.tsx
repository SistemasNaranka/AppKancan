import React from "react";

import MuiAlert, { AlertColor } from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

interface SnackbarAlertProps {
  open: boolean;
  message: string;
  severity?: AlertColor;
  autoHideDuration?: number;
  anchorOrigin?: {
    vertical: "top" | "bottom";
    horizontal: "left" | "center" | "right";
  };
  onClose: () => void;
  sx?: any;
}

const SnackbarAlert: React.FC<SnackbarAlertProps> = ({
  open,
  message,
  severity = "info",
  autoHideDuration = 6000,
  anchorOrigin = { vertical: "top", horizontal: "center" },
  onClose,
  sx,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
    >
      <MuiAlert
        elevation={6}
        variant="outlined"
        onClose={onClose}
        severity={severity}
        sx={{
          width: "100%",
          backgroundColor: severity === "success" ? "#4caf50" : "#fff",
          color: severity === "success" ? "#fff" : "#88112F",
          fontSize: "1.1rem",
          fontWeight: "bold",
          minWidth: "400px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          "& .MuiAlert-icon": {
            color: severity === "success" ? "#fff" : "#88112F",
            fontSize: "1.5rem",
          },
          ...sx,
        }}
      >
        {message}
      </MuiAlert>
    </Snackbar>
  );
};

export default SnackbarAlert;
