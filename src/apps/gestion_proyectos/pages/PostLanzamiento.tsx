// src/apps/gestion_proyectos/pages/PostLanzamiento.tsx
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
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useProjectById } from "../hooks/useProjects";
import {
  createFeedback,
  updateFeedback,
  deleteFeedback,
} from "../api/directus/create";
import type { Feedback, CreateFeedbackInput } from "../types";
import { useGlobalSnackbar } from "../../../shared/components/SnackbarsPosition/SnackbarContext";

// Header container with margin and border-radius
const HeaderContainer = styled(Box)({
  margin: '24px 0',
  padding: '20px 24px',
  borderRadius: 12,
  backgroundColor: 'white',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
});

interface FeedbackForm {
  id?: string;
  author: string;
  description: string;
}

export default function PostLaunch() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { project, loading, error, reload } = useProjectById(id!);
  const { showSnackbar } = useGlobalSnackbar();

  const [formData, setFormData] = useState<FeedbackForm>({
    author: "",
    description: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const updateFormField = <K extends keyof FeedbackForm>(field: K, value: FeedbackForm[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const [isSaving, setIsSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !formData.description.trim()) return;

    setIsSaving(true);

    try {
      if (editingId) {
        const ok = await updateFeedback(editingId, {
          author: formData.author,
          description: formData.description,
        });
        if (!ok) throw new Error("No se pudo actualizar");
        showSnackbar("¡Feedback actualizado exitosamente!", "success");
      } else {
        const inputData: CreateFeedbackInput = {
          project_id: id,
          author: formData.author,
          description: formData.description,
        };
        const result = await createFeedback(inputData);
        if (!result) throw new Error("No se pudo crear");
        showSnackbar("¡Feedback agregado exitosamente!", "success");
      }

      setFormData({ author: "", description: "" });
      setEditingId(null);
      reload();
    } catch (err) {
      console.error("Error:", err);
      showSnackbar("Error al guardar el feedback", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (feedback: Feedback) => {
    setFormData({
      id: feedback.id,
      author: feedback.author,
      description: feedback.description,
    });
    setEditingId(feedback.id);
  };

  const handleRemove = async () => {
    if (!feedbackToDelete) return;

    try {
      const ok = await deleteFeedback(feedbackToDelete);
      if (!ok) throw new Error("No se pudo eliminar");
      showSnackbar("Feedback eliminado exitosamente", "success");
      reload();
    } catch (err) {
      console.error("Error:", err);
      showSnackbar("Error al eliminar el feedback", "error");
    } finally {
      setModalOpen(false);
      setFeedbackToDelete(null);
    }
  };

  const handleOpenDeleteModal = (feedbackId: string) => {
    setFeedbackToDelete(feedbackId);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFeedbackToDelete(null);
  };

  const handleCancel = () => {
    setFormData({ author: "", description: "" });
    setEditingId(null);
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

  if (error || !project) {
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
            {project.name}
          </Typography>
        </Box>
      </HeaderContainer>

      {/* Form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {editingId
            ? "Editar Feedback"
            : "Agregar Feedback"}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Autor"
            value={formData.author}
            onChange={(e) => updateFormField('author', e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Descripción del feedback"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => updateFormField('description', e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <Box display="flex" gap={2}>
            <Button
              type="submit"
              variant="contained"
              startIcon={
                isSaving ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <AddIcon />
                )
              }
              disabled={isSaving || !formData.author.trim() || !formData.description.trim()}
            >
              {editingId ? "Actualizar" : "Agregar"}
            </Button>
            {editingId && (
              <Button variant="outlined" onClick={handleCancel}>
                Cancelar
              </Button>
            )}
          </Box>
        </form>
      </Paper>

      {/* Feedback list */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
        Feedback ({project.feedbacks?.length || 0})
        </Typography>
        {project.feedbacks && project.feedbacks.length > 0 ? (
          <List>
            {project.feedbacks.map((f) => (
              <ListItem sx={{ backgroundColor: "#f3f4f6", boxShadow: "none", borderRadius: 2, mb: 1 }}
                key={f.id}
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      onClick={() => handleEdit(f)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleOpenDeleteModal(f.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={f.description}
                  secondary={`Por: ${f.author}`}
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

      {/* Delete confirmation modal */}
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
          <Button onClick={handleRemove} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
