import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  InputAdornment,
  CircularProgress,
  Avatar,
  IconButton,
} from "@mui/material";
import Search from '@mui/icons-material/Search';
import Refresh from '@mui/icons-material/Refresh';
import Person from '@mui/icons-material/Person';
import Warning from '@mui/icons-material/Warning';
import CheckCircle from '@mui/icons-material/CheckCircle';
import LockReset from '@mui/icons-material/LockReset';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { getAllUsers, resetUserPassword } from "@/services/directus/auth";
import { useSnackbar } from "@/auth/hooks/useSnackbar";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  codigo_ultra?: string;
  empresa?: string;
  role?: { name: string };
  requires_password_change?: boolean;
}

export const PasswordAdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const { showSnackbar } = useSnackbar();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data as User[]);
    } catch (error: any) {
      console.error("Error al cargar usuarios:", error);
      showSnackbar("Error al cargar usuarios", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter((user) => {
      const email = user.email?.toLowerCase() || "";
      const firstName = user.first_name?.toLowerCase() || "";
      const lastName = user.last_name?.toLowerCase() || "";
      return (
        email.includes(term) ||
        firstName.includes(term) ||
        lastName.includes(term)
      );
    });
  }, [users, searchTerm]);

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    if (!newPassword.trim()) {
      setPasswordError('La contraseña no puede estar vacía');
      return;
    }
    if (newPassword.trim().length < 4) {
      setPasswordError('Mínimo 4 caracteres');
      return;
    }

    try {
      setResetLoading(true);
      await resetUserPassword(selectedUser.id, newPassword.trim());
      showSnackbar(
        `Clave reestablecida para ${selectedUser.first_name} ${selectedUser.last_name}`,
        "success",
      );
      closeResetDialog();
      fetchUsers();
    } catch (error: any) {
      console.error("Error al reestablecer clave:", error);
      showSnackbar("Error al reestablecer clave", "error");
    } finally {
      setResetLoading(false);
    }
  };

  const openResetDialog = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPassword(false);
    setPasswordError('');
    setResetDialogOpen(true);
  };

  const closeResetDialog = () => {
    setResetDialogOpen(false);
    setSelectedUser(null);
    setNewPassword('');
    setPasswordError('');
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <LockReset color="primary" />
        <Typography variant="subtitle1" fontWeight="bold">
          Lista de Usuarios
        </Typography>
      </Box>

      <TextField
        fullWidth
        placeholder="Buscar usuario..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
        size="small"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          },
        }}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 420 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: "#f5f5f5", fontWeight: "bold" }}>
                  Usuario
                </TableCell>
                <TableCell sx={{ bgcolor: "#f5f5f5", fontWeight: "bold" }}>
                  Correo
                </TableCell>
                <TableCell sx={{ bgcolor: "#f5f5f5", fontWeight: "bold" }}>
                  Estado
                </TableCell>
                <TableCell sx={{ bgcolor: "#f5f5f5", fontWeight: "bold" }}>
                  Accion
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: "#1976d2",
                          fontSize: 12,
                        }}
                      >
                        {user.first_name?.[0]}
                        {user.last_name?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {user.first_name} {user.last_name}
                        </Typography>
                        {user.codigo_ultra && (
                          <Typography variant="caption" color="text.secondary">
                            {user.codigo_ultra}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={
                        user.requires_password_change ? (
                          <Warning />
                        ) : (
                          <CheckCircle />
                        )
                      }
                      label={
                        user.requires_password_change
                          ? "Debe cambiar"
                          : "Normal"
                      }
                      color={
                        user.requires_password_change ? "warning" : "success"
                      }
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={() => openResetDialog(user)}
                    >
                      Reestablecer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <Person sx={{ fontSize: 32, color: "text.secondary" }} />
                    <Typography color="text.secondary">
                      No hay usuarios
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={resetDialogOpen}
        onClose={closeResetDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reestablecer clave</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2.5 }}>
            <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>
            <br />
            <Typography variant="caption" color="text.secondary">
              El usuario deberá cambiar su clave al iniciar sesión.
            </Typography>
          </Alert>

          <TextField
            label="Nueva contraseña"
            fullWidth
            size="small"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
            error={!!passwordError}
            helperText={passwordError || ' '}
            autoComplete="new-password"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeResetDialog} disabled={resetLoading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleResetPassword}
            disabled={resetLoading || !newPassword.trim()}
            startIcon={<LockReset />}
          >
            {resetLoading ? "Guardando..." : "Reestablecer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
