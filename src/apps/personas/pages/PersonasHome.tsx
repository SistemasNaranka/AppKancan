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
import { getPersonas } from "@/apps/personas/api/directus/getPersonas"; // tu función

// Tipado base de persona
type Persona = {
  id: string;
  nombre: string;
};

// Componente principal
const PersonasHome: React.FC = () => {
  const {
    data: personas,
    isLoading,
    isError,
  } = useQuery<Persona[]>({
    queryKey: ["personas"],
    queryFn: getPersonas,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return (
    <Box sx={{ p: 3 }}>
      <Toolbar disableGutters sx={{ justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Lista de Personas
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
        <Typography color="error">Error al cargar personas</Typography>
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
              {personas && personas.length > 0 ? (
                personas.map((persona) => (
                  <TableRow key={persona.id} hover>
                    <TableCell>{persona.nombre}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => alert(`Editar ${persona.nombre}`)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => alert(`Eliminar ${persona.nombre}`)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} align="center">
                    No hay personas disponibles
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

export default PersonasHome;