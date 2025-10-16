import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Toolbar,
  Typography,
  Box,
  CircularProgress,
  Button,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { getEmpresas } from "@/apps/empresas/api/directus/getEmpresas"; // tu función
import { updateEmpresas } from "@/apps/empresas/api/directus/updateEmpresas"; // tu función
import { deleteEmpresas } from "@/apps/empresas/api/directus/deleteEmpresas";
import {client} from "@/services/tankstack/QueryClient"

// Tipado base de persona
type Persona = {
  id: string;
  nombre: string;
};

// Componente principal
const EmpresasHome: React.FC = () => {
  const {
    data: empresas,
    isLoading,
    isError,
  } = useQuery<Persona[]>({
    queryKey: ["empresas"],
    queryFn: getEmpresas,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const handleActualizar = async (id: string) => {
    const nuevoNombre = prompt("Nuevo nombre de la empresa:");
    if (!nuevoNombre) return;

    try {
      await updateEmpresas(id, { nombre: nuevoNombre });
      alert("✅ Empresa actualizada correctamente");

      // Opcional: refetch para que se actualice la lista
      // Puedes usar useQueryClient para eso:
       client.invalidateQueries({ queryKey: ["empresas"] });
    } catch (error) {
      alert("❌ Error al actualizar empresa");
      console.error(error);
    }
  };


  const handleEliminar = async (id: string, nombre: string) => {
    const confirmar = confirm(`¿Estás seguro de eliminar la empresa "${nombre}"?`);
    if (!confirmar) return;

    try {
      await deleteEmpresas(id);
      alert("✅ Empresa eliminada correctamente");
      client.invalidateQueries({ queryKey: ["empresas"] }); // Refrescar lista
    } catch (error) {
      alert("❌ Error al eliminar empresa");
      console.error(error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Toolbar disableGutters sx={{ justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Lista de Empresas
        </Typography>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => alert("Crear persona (pendiente)")}
        >
          Agregar
        </Button>
      </Toolbar>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Typography color="error">Error al cargar empresas</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell align="right"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {empresas && empresas.length > 0 ? (
                empresas.map((persona) => (
                  <TableRow key={persona.id} hover>
                    <TableCell>{persona.nombre}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleActualizar(persona.id)}
                      >
                        <Edit />
                      </IconButton>

                      <IconButton
                        color="error"
                        onClick={() => handleEliminar(persona.id, persona.nombre)}
                      >
                        <Delete />
                    </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} align="center">
                    No hay empresas disponibles
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default EmpresasHome;