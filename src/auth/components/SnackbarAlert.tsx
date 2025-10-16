import React from "react";

import MuiAlert, { AlertColor } from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

interface SnackbarAlertProps {
  open: boolean;
  message: string;
  severity?: AlertColor;
  autoHideDuration?: number;
  onClose: () => void;
}

const SnackbarAlert: React.FC<SnackbarAlertProps> = ({
  open,
  message,
  severity = "info",
  autoHideDuration = 6000,
  onClose,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <MuiAlert
        elevation={6}
        variant="outlined"
        onClose={onClose}
        severity={severity}
        sx={{   width: "100%",
    backgroundColor: "#fff",
    color: "#88112F", }}
      >
        {message}
      </MuiAlert>
    </Snackbar>
  );
};

export default SnackbarAlert;
