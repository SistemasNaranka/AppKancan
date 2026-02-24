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
} from "@mui/material";
import {
  Search,
  Refresh,
  Person,
  Warning,
  CheckCircle,
  LockReset,
} from "@mui/icons-material";
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

  const { showSnackbar } = useSnackbar();

  const currentYear = new Date().getFullYear();
  const defaultPassword = `${currentYear}`;

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

    try {
      setResetLoading(true);
      await resetUserPassword(selectedUser.id, defaultPassword);
      showSnackbar(
        `clave reestablecida para ${selectedUser.first_name} ${selectedUser.last_name}`,
        "success",
      );
      setResetDialogOpen(false);
      setSelectedUser(null);
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
    setResetDialogOpen(true);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <LockReset color="primary" />
        <Typography variant="subtitle1" fontWeight="bold">
          Lista de Usuarios
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        clave generica: <strong>{defaultPassword}</strong>
      </Typography>

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
        onClose={() => setResetDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reestablecer clave</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>
              {selectedUser?.first_name} {selectedUser?.last_name}
            </strong>
            <br />
            Nueva clave: <strong>{defaultPassword}</strong>
          </Alert>
          <Typography variant="body2">
            El usuario debera cambiar su clave al iniciar sesion.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setResetDialogOpen(false)}
            disabled={resetLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleResetPassword}
            disabled={resetLoading}
            startIcon={<Refresh />}
          >
            {resetLoading ? "..." : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
