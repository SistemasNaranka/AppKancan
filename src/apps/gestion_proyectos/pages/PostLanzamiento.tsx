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
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useProyectoById } from "../hooks/useProyectos";
import {
  createBeneficio,
  updateBeneficio,
  deleteBeneficio,
} from "../api/directus/create";
import type { Beneficio, CreateBeneficioInput } from "../types";

interface BeneficioForm {
  id?: string;
  descripcion: string;
}

export default function PostLanzamiento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { proyecto, loading, error, recargar } = useProyectoById(id!);

  const [formData, setFormData] = useState<BeneficioForm>({
    descripcion: "",
  });
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{
    tipo: "success" | "error";
    texto: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !formData.descripcion.trim()) return;

    setGuardando(true);
    setMensaje(null);

    try {
      if (editandoId) {
        const ok = await updateBeneficio(editandoId, {
          descripcion: formData.descripcion,
        });
        if (!ok) throw new Error("No se pudo actualizar");
      } else {
        const data: CreateBeneficioInput = {
          proyecto_id: id,
          descripcion: formData.descripcion,
        };
        const result = await createBeneficio(data);
        if (!result) throw new Error("No se pudo crear");
      }

      setMensaje({ tipo: "success", texto: "¡Guardado exitosamente!" });
      setFormData({ descripcion: "" });
      setEditandoId(null);
      recargar();
    } catch (err) {
      console.error("Error:", err);
      setMensaje({ tipo: "error", texto: "Error al guardar" });
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (beneficio: Beneficio) => {
    setFormData({
      id: beneficio.id,
      descripcion: beneficio.descripcion,
    });
    setEditandoId(beneficio.id);
  };

  const handleEliminar = async (beneficioId: string) => {
    if (!confirm("¿Eliminar este beneficio?")) return;

    try {
      const ok = await deleteBeneficio(beneficioId);
      if (!ok) throw new Error("No se pudo eliminar");
      setMensaje({ tipo: "success", texto: "Eliminado exitosamente" });
      recargar();
    } catch (err) {
      console.error("Error:", err);
      setMensaje({ tipo: "error", texto: "Error al eliminar" });
    }
  };

  const handleCancelar = () => {
    setFormData({ descripcion: "" });
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
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton
          onClick={() => navigate(`/gestion_proyectos/${id}`)}
          sx={{ mr: 2 }}
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
      </Box>

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
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {editandoId
            ? "Editar Beneficio/Feedback"
            : "Agregar Beneficio/Feedback"}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Descripción del beneficio o feedback"
            multiline
            rows={3}
            value={formData.descripcion}
            onChange={(e) => setFormData({ descripcion: e.target.value })}
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
              disabled={guardando || !formData.descripcion.trim()}
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

      {/* Lista de beneficios - usando secondaryAction prop */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          💡 Beneficios y Feedback ({proyecto.beneficios?.length || 0})
        </Typography>
        {proyecto.beneficios && proyecto.beneficios.length > 0 ? (
          <List>
            {proyecto.beneficios.map((beneficio, index) => (
              <ListItem
                key={beneficio.id}
                divider
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      onClick={() => handleEditar(beneficio)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleEliminar(beneficio.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={beneficio.descripcion}
                  secondary={`Beneficio #${index + 1}`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            No hay beneficios registrados aún.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
