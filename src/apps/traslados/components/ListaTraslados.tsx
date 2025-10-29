import React from "react";
import {
  Box,
  Fade,
  Typography,
  Card,
  CardContent,
  Button,
} from "@mui/material";
import { Traslado } from "../hooks/types";
import TrasladoListItem from "./TrasladoListItem";
import { SkeletonCard } from "./CargaSkeletons";
import RefreshIcon from "@mui/icons-material/Refresh";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SearchOffIcon from "@mui/icons-material/SearchOff";

type Props = {
  filtrados: Traslado[];
  idsSeleccionados: number[];
  onToggleSeleccion: (id: number) => void;
  loading?: boolean;
  isError?: boolean;
  totalPendientes?: number;
  onRetry?: () => void;
};

/**
 * Componente mejorado para listar traslados con:
 * - Skeleton loaders durante la carga
 * - Mensaje cuando no hay datos
 * - Mensaje cuando no hay coincidencias con filtro
 * - Manejo de errores
 */
export const ListaTraslados: React.FC<Props> = ({
  filtrados,
  idsSeleccionados,
  onToggleSeleccion,
  loading = false,
  isError = false,
  totalPendientes = 0,
  onRetry,
}) => {
  // Estado 1: CARGANDO - Mostrar skeletons
  if (loading) {
    return <SkeletonCard count={20} height={180} />;
  }

  // Estado 2: ERROR - Mostrar mensaje de error con opción de reintentar
  if (isError) {
    return (
      <Fade in timeout={500}>
        <Card
          sx={{
            background: "linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%)",
            border: "1px solid #ffcdd2",
            borderRadius: 2,
          }}
        >
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              py: 6,
              px: 3,
              textAlign: "center",
            }}
          >
            <RefreshIcon
              sx={{ fontSize: 48, color: "#d32f2f", opacity: 0.7 }}
            />
            <Typography variant="h6" color="error">
              Error al cargar los traslados
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Ocurrió un problema al obtener los datos. Por favor, intenta de
              nuevo.
            </Typography>
            {onRetry && (
              <Button
                variant="contained"
                color="error"
                startIcon={<RefreshIcon />}
                onClick={onRetry}
                sx={{ mt: 1 }}
              >
                Reintentar
              </Button>
            )}
          </CardContent>
        </Card>
      </Fade>
    );
  }

  // Estado 3: SIN DATOS (nunca ha habido traslados)
  if (totalPendientes === 0 && filtrados.length === 0) {
    return (
      <Fade in timeout={500}>
        <Card
          sx={{
            background: "linear-gradient(135deg, #f3e5f5 0%, #ede7f6 100%)",
            border: "1px solid #e1bee7",
            borderRadius: 2,
          }}
        >
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              py: 8,
              px: 3,
              textAlign: "center",
            }}
          >
            <FolderOpenIcon
              sx={{ fontSize: 56, color: "#9c27b0", opacity: 0.6 }}
            />
            <Typography variant="h6" color="textPrimary">
              No hay traslados pendientes
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Todos los traslados han sido procesados. Aquí aparecerán nuevos
              traslados cuando estén disponibles.
            </Typography>
          </CardContent>
        </Card>
      </Fade>
    );
  }

  // Estado 4: CON FILTROS pero sin coincidencias (el usuario filtró y no encontró nada)
  if (filtrados.length === 0 && totalPendientes > 0) {
    return (
      <Fade in timeout={500}>
        <Card
          sx={{
            background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
            border: "1px solid #90caf9",
            borderRadius: 2,
          }}
        >
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              py: 8,
              px: 3,
              textAlign: "center",
            }}
          >
            <SearchOffIcon
              sx={{ fontSize: 56, color: "#1976d2", opacity: 0.6 }}
            />
            <Typography variant="h6" color="textPrimary">
              No hay coincidencias
            </Typography>
            <Typography color="text.secondary" variant="body2">
              No encontramos traslados que coincidan con tus filtros.
              <br />
              Intenta ajustar tus criterios de búsqueda.
            </Typography>
            <Typography variant="caption" sx={{ mt: 2, fontStyle: "italic" }}>
              Traslados disponibles: {totalPendientes}
            </Typography>
          </CardContent>
        </Card>
      </Fade>
    );
  }

  // Estado 5: DATOS DISPONIBLES - Mostrar lista normal
  return (
    <Fade in timeout={500}>
      <Box
        sx={{
          overflowX: "hidden",
          pr: 1,
          pt: 1,
          pb: 1,
          display: "grid",
          gap: 2,
          boxSizing: "border-box",
          alignItems: "start",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          justifyItems: "center",
        }}
      >
        {filtrados.map((t) => {
          const isSelected =
            t.traslado !== undefined && idsSeleccionados.includes(t.traslado);
          return (
            <TrasladoListItem
              key={t.traslado ?? `traslado-${Math.random()}`}
              traslado={t}
              isSelected={isSelected}
              onTrasladoClick={() =>
                t.traslado !== undefined && onToggleSeleccion(t.traslado)
              }
              compact
            />
          );
        })}
      </Box>
    </Fade>
  );
};

export default ListaTraslados;
