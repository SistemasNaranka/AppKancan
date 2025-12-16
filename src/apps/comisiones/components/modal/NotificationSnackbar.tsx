import React, { useEffect, useState } from "react";
import { Snackbar, Alert, AlertColor } from "@mui/material";

interface Notification {
  id: string;
  message: string;
  severity: AlertColor;
  duration?: number;
}

interface NotificationSnackbarProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export const NotificationSnackbar: React.FC<NotificationSnackbarProps> = ({
  notifications,
  onRemove,
}) => {
  const [currentNotification, setCurrentNotification] =
    useState<Notification | null>(null);

  useEffect(() => {
    if (notifications.length > 0 && !currentNotification) {
      const nextNotification = notifications[0];
      setCurrentNotification(nextNotification);

      // Auto-remove after duration
      const timer = setTimeout(() => {
        handleClose(nextNotification.id);
      }, nextNotification.duration || 4000);

      return () => clearTimeout(timer);
    }
  }, [notifications, currentNotification]);

  const handleClose = (id: string) => {
    setCurrentNotification(null);
    setTimeout(() => onRemove(id), 300); // Wait for animation
  };

  if (!currentNotification) return null;

  return (
    <Snackbar
      open={true}
      autoHideDuration={currentNotification.duration || 4000}
      onClose={() => handleClose(currentNotification.id)}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      sx={{
        position: "fixed",
        top: "24px",
        right: "24px",
        zIndex: 9999,
      }}
    >
      <Alert
        onClose={() => handleClose(currentNotification.id)}
        severity={currentNotification.severity}
        variant="filled"
        sx={{
          minWidth: "300px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        {currentNotification.message}
      </Alert>
    </Snackbar>
  );
};

// Hook para gestionar notificaciones
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    message: string,
    severity: AlertColor = "info",
    duration?: number
  ) => {
    const id = Date.now().toString();
    const newNotification: Notification = {
      id,
      message,
      severity,
      duration,
    };

    setNotifications((prev) => [...prev, newNotification]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const success = (message: string, duration?: number) =>
    addNotification(message, "success", duration);
  const error = (message: string, duration?: number) =>
    addNotification(message, "error", duration);
  const warning = (message: string, duration?: number) =>
    addNotification(message, "warning", duration);
  const info = (message: string, duration?: number) =>
    addNotification(message, "info", duration);

  return {
    notifications,
    removeNotification,
    success,
    error,
    warning,
    info,
  };
};
