import React from "react";
import {
  Box,
  Paper,
  Typography,
  Skeleton,
  CircularProgress,
  Fade,
} from "@mui/material";
import { DataTableSkeleton } from "./DataTableSkeleton";

interface LoadingStateProps {
  isLoading: boolean;
  isRefetching?: boolean;
  error?: Error | null;
  hasDataAttempted?: boolean;
  children?: React.ReactNode;
}

/**
 * Componente para manejar todos los estados de carga
 * - Loading inicial
 * - Refetching (actualización)
 * - Error states
 * - Empty states
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  isRefetching = false,
  error,
  hasDataAttempted = false,
  children,
}) => {
  // Estado de carga inicial
  if (isLoading && !hasDataAttempted) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: "center",
          backgroundColor: "#fafafa",
          border: "1px solid #e0e0e0",
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          <CircularProgress size={48} thickness={4} />
          <Box>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              Cargando datos de comisiones...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Obteniendo información de tiendas, empleados y presupuestos
            </Typography>
          </Box>
          <Box sx={{ width: "100%", maxWidth: 600 }}>
            <Skeleton variant="text" height={32} sx={{ mb: 2 }} />
            <Skeleton variant="text" height={24} width="80%" sx={{ mb: 1 }} />
            <Skeleton variant="text" height={24} width="60%" />
          </Box>
        </Box>
      </Paper>
    );
  }

  // Estado de refetching (actualización en segundo plano)
  if (isRefetching && children) {
    return (
      <Box sx={{ position: "relative" }}>
        {/* Overlay de refetching */}
        <Fade in={true}>
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              borderRadius: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                backgroundColor: "white",
                p: 3,
                borderRadius: 2,
                boxShadow: 3,
                border: "1px solid #e0e0e0",
              }}
            >
              <CircularProgress size={32} thickness={4} />
              <Typography variant="body2" color="text.secondary">
                Actualizando datos...
              </Typography>
            </Box>
          </Box>
        </Fade>
        {children}
      </Box>
    );
  }

  // Estado de error
  if (error) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: "center",
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="h6" color="error" sx={{ fontWeight: 600 }}>
            Error al cargar los datos
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 400 }}
          >
            {error.message ||
              "Ocurrió un error inesperado. Por favor, intenta de nuevo."}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Si el problema persiste, contacta al administrador del sistema
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  }

  // Si hay datos cargados pero vacíos después de intento
  if (hasDataAttempted && !isLoading && !error && !children) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: "center",
          backgroundColor: "#fafafa",
          border: "1px solid #e0e0e0",
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          No hay datos disponibles
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No se encontraron datos para el período seleccionado.
        </Typography>
      </Paper>
    );
  }

  // Contenido normal
  return <>{children}</>;
};

/**
 * Componente específico para loading de DataTable
 */
export const DataTableLoadingState: React.FC<{
  isLoading: boolean;
  isRefetching?: boolean;
  tiendas: any[];
  children: React.ReactNode;
}> = ({ isLoading, isRefetching = false, tiendas, children }) => {
  if (isLoading && tiendas.length === 0) {
    return <DataTableSkeleton />;
  }

  if (isRefetching && children) {
    return (
      <Box sx={{ position: "relative" }}>
        <Fade in={true}>
          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1,
              borderRadius: 2,
              boxShadow: 2,
              zIndex: 5,
            }}
          >
            <CircularProgress size={16} thickness={4} />
            <Typography variant="caption" color="text.secondary">
              Actualizando...
            </Typography>
          </Box>
        </Fade>
        {children}
      </Box>
    );
  }

  return <>{children}</>;
};

export default LoadingState;
