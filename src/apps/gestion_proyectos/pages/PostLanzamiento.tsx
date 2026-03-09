import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useProyectoById } from "../hooks/useProyectos";
import {
  createFeedback,
  updateFeedback,
  deleteFeedback,
} from "../api/directus/create";
import type { Feedback, CreateFeedbackInput } from "../types";

// Header container con margen y border-radius
const HeaderContainer = styled(Box)({
  margin: '24px 0',
  padding: '20px 24px',
  borderRadius: 12,
  backgroundColor: 'white',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
});

interface FeedbackForm {
  id?: string;
  autor: string;
  descripcion: string;
}

export default function PostLanzamiento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { proyecto, loading, error, recargar } = useProyectoById(id!);

  const [formData, setFormData] = useState<FeedbackForm>({
    autor: "",
    descripcion: "",
  });
  const [editandoId, setEditandoId] = useState<string | null>(null);

  // Función helper para actualizar el formData manteniendo los valores existentes
  const updateFormField = <K extends keyof FeedbackForm>(field: K, value: FeedbackForm[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{
    tipo: "success" | "error";
    texto: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [beneficioToDelete, setBeneficioToDelete] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !formData.descripcion.trim()) return;

    setGuardando(true);
    setMensaje(null);

    try {
      if (editandoId) {
        const ok = await updateFeedback(editandoId, {
          autor: formData.autor,
          descripcion: formData.descripcion,
        });
        if (!ok) throw new Error("No se pudo actualizar");
      } else {
        const data: CreateFeedbackInput = {
          proyecto_id: id,
          autor: formData.autor,
          descripcion: formData.descripcion,
        };
        const result = await createFeedback(data);
        if (!result) throw new Error("No se pudo crear");
      }

      setMensaje({ tipo: "success", texto: "¡Guardado exitosamente!" });
      setFormData({ autor: "", descripcion: "" });
      setEditandoId(null);
      recargar();
    } catch (err) {
      console.error("Error:", err);
      setMensaje({ tipo: "error", texto: "Error al guardar" });
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (feedback: Feedback) => {
    setFormData({
      id: feedback.id,
      autor: feedback.autor,
      descripcion: feedback.descripcion,
    });
    setEditandoId(feedback.id);
  };

  const handleEliminar = async () => {
    if (!beneficioToDelete) return;

    try {
      const ok = await deleteFeedback(beneficioToDelete);
      if (!ok) throw new Error("No se pudo eliminar");
      setMensaje({ tipo: "success", texto: "Eliminado exitosamente" });
      recargar();
    } catch (err) {
      console.error("Error:", err);
      setMensaje({ tipo: "error", texto: "Error al eliminar" });
    } finally {
      setModalOpen(false);
      setBeneficioToDelete(null);
    }
  };

  const handleOpenDeleteModal = (beneficioId: string) => {
    setBeneficioToDelete(beneficioId);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setBeneficioToDelete(null);
  };

  const handleCancelar = () => {
    setFormData({ autor: "", descripcion: "" });
    setEditandoId(null);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !proyecto) {
    return (
      <Box p={3}>
        <Alert severity="error">Error al cargar el proyecto</Alert>
      </Box>
    );
  }

  return (
    <Box p={3} maxWidth="900px" mx="auto">
      {/* Header */}
      <HeaderContainer
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <IconButton
          onClick={() => navigate(`/gestion_proyectos/${id}`)}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Post-Lanzamiento
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {proyecto.nombre}
          </Typography>
        </Box>
      </HeaderContainer>

      {/* Mensaje */}
      {mensaje && (
        <Alert
          severity={mensaje.tipo}
          sx={{ mb: 2 }}
          onClose={() => setMensaje(null)}
        >
          {mensaje.texto}
        </Alert>
      )}

      {/* Formulario */}
      <Paper sx={{ p: 3, mb: 3, }}>
        <Typography variant="h6" gutterBottom>
          {editandoId
            ? "Editar Feedback"
            : "Agregar Feedback"}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Autor"
            value={formData.autor}
            onChange={(e) => updateFormField('autor', e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Descripción del feedback"
            multiline
            rows={3}
            value={formData.descripcion}
            onChange={(e) => updateFormField('descripcion', e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <Box display="flex" gap={2}>
            <Button
              type="submit"
              variant="contained"
              startIcon={
                guardando ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <AddIcon />
                )
              }
              disabled={guardando || !formData.autor.trim() || !formData.descripcion.trim()}
            >
              {editandoId ? "Actualizar" : "Agregar"}
            </Button>
            {editandoId && (
              <Button variant="outlined" onClick={handleCancelar}>
                Cancelar
              </Button>
            )}
          </Box>
        </form>
      </Paper>

      {/* Lista de feedbacks */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
        Feedback ({proyecto.feedbacks?.length || 0})
        </Typography>
        {proyecto.feedbacks && proyecto.feedbacks.length > 0 ? (
          <List>
            {proyecto.feedbacks.map((feedback, index) => (
              <ListItem sx={{ backgroundColor: "#f3f4f6", boxShadow: "none", borderRadius: 2, }}
                key={feedback.id}
                divider
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      onClick={() => handleEditar(feedback)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleOpenDeleteModal(feedback.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={feedback.descripcion}
                  secondary={`Por: ${feedback.autor}`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            No hay feedback registrado aún.
          </Typography>
        )}
      </Paper>

      {/* Modal de confirmación de eliminación */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          ¿Eliminar feedback?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            ¿Estás seguro de que deseas eliminar este feedback? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleEliminar} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
