import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Typography,
  Box,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Lock,
  LockReset,
  Visibility,
  VisibilityOff,
  CheckCircle,
} from "@mui/icons-material";
import { usePasswordReset } from "@/auth/hooks/usePasswordReset";

interface ForcePasswordChangeModalProps {
  open: boolean;
  onClose: () => void;
}

export const ForcePasswordChangeModal = ({
  open,
  onClose,
}: ForcePasswordChangeModalProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { loading, error, success, changePassword, forceLogout, clearError } =
    usePasswordReset();

  const handleSubmit = async () => {
    clearError();
    const result = await changePassword(newPassword, confirmPassword);
    if (result) {
      setTimeout(() => {
        forceLogout();
      }, 1500);
    }
  };

  const handleClose = () => {
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    clearError();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <LockReset color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Cambio de clave Requerido
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Por seguridad, debes cambiar tu clave antes de continuar.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <CheckCircle />
              clave actualizada exitosamente. Seras redirigido al login...
            </Box>
          </Alert>
        )}

        <TextField
          label="Nueva clave"
          type={showPassword ? "text" : "password"}
          fullWidth
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={loading || success}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Confirmar clave"
          type={showPassword ? "text" : "password"}
          fullWidth
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading || success}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock />
              </InputAdornment>
            ),
          }}
        />

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          La clave debe tener al menos 4 caracteres.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading || success}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || success || !newPassword || !confirmPassword}
          startIcon={<LockReset />}
        >
          {loading ? "Cambiando..." : "Cambiar clave"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
