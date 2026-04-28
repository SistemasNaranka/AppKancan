import React, { useState } from 'react';
import { useContactos } from '../hooks/useContactos';
import { Contactos } from '../types/types';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  MenuItem,
} from '@mui/material';
// Importamos Grid2 para que la prop "size" funcione correctamente
import Grid from '@mui/material/Grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';

// Utilizamos la interface definidia en src/apps/contactos/types/types.ts

const Home: React.FC = () => {
  const { contactos, isLoading, createContacto, updateContacto, deleteContacto } = useContactos();

  const [formData, setFormData] = useState<Omit<Contactos, 'id'>>({ nombre: '', correo: '', telefono: '', area: '', direccion: '', zona: '' });
  const [editingId, setEditingId] = useState<string | number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateContacto({ id: editingId, data: formData });
        setEditingId(null);
      } else {
        await createContacto(formData);
      }
      setFormData({ nombre: '', correo: '', telefono: '', area: '', direccion: '', zona: '' });
    } catch (error) {
      console.error("Error guardando el contacto", error);
    }
  };

  const handleEdit = (contact: Contactos) => {
    setFormData({ nombre: contact.nombre, correo: contact.correo, telefono: contact.telefono, area: contact.area, direccion: contact.direccion, zona: contact.zona });
    setEditingId(contact.id);
  };

  const handleDelete = async (id: string | number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este contacto?')) {
      try {
        await deleteContacto(id);
      } catch (error) {
        console.error("Error eliminando el contacto", error);
      }
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Gestión de Contactos
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4, mt: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                name="nombre"
                label="Nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                name="correo"
                label="Correo / Email"
                type="email"
                value={formData.correo}
                onChange={handleInputChange}
                required
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                name="Direccion"
                label="Direccion"
                value={formData.telefono}
                onChange={handleInputChange}
                required
                variant="outlined"
                size="small"
              />

            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                name="telefono"
                label="Teléfono"
                value={formData.telefono}
                onChange={handleInputChange}
                required
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                name="area"
                label="Área"
                value={formData.area}
                onChange={handleInputChange}
                required
                variant="outlined"
                size="small"
              >
                <MenuItem value="contabilidad">Contabilidad</MenuItem>
                <MenuItem value="recursos_humanos">Recursos Humanos</MenuItem>
                <MenuItem value="logistica">Logística</MenuItem>
                <MenuItem value="diseno">Diseño</MenuItem>
                <MenuItem value="sistemas">Sistemas</MenuItem>
                <MenuItem value="mercadeo">Mercadeo</MenuItem>
                <MenuItem value="comercial">Comercial</MenuItem>
                <MenuItem value="administrativa">Administrativa</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                name="zona"
                label="Zona"
                value={formData.zona}
                onChange={handleInputChange}
                required
                variant="outlined"
                size="small"
              >


                <MenuItem value="norte">Norte</MenuItem>
                <MenuItem value="sur">Sur</MenuItem>
                <MenuItem value="cafetero">eje cafetero</MenuItem>
                <MenuItem value="occidente">Occidente</MenuItem>
                <MenuItem value="tienda">tienda online</MenuItem>
              </TextField>

            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                {editingId ? (
                  <>
                    <Button
                      type="submit"
                      variant="contained"
                      color="success"
                      startIcon={<SaveIcon />}
                    >
                      Actualizar
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      color="inherit"
                      startIcon={<CancelIcon />}
                      onClick={() => {
                        setEditingId(null);
                        setFormData({ nombre: '', correo: '', telefono: '', area: '', direccion: '', zona: '' });
                      }}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                  >
                    Agregar Contacto
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #eee', pb: 1 }}>
          Lista de Contactos ({contactos.length})
        </Typography>

        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography color="text.secondary">Cargando...</Typography>
          </Box>
        ) : contactos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography color="text.secondary">
              No hay contactos registrados. ¡Comienza agregando uno!
            </Typography>
          </Box>
        ) : (
          <List>
            {contactos.map(contact => (
              <ListItem
                key={contact.id}
                divider
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleEdit(contact)}
                      sx={{ mr: 1, color: 'primary.main' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDelete(contact.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={<strong>{contact.nombre}</strong>}
                  secondary={
                    <>
                      {contact.correo} • {contact.telefono} <br />
                      Área: {contact.area} • Dirección: {contact.direccion} • Zona: {contact.zona}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default Home;