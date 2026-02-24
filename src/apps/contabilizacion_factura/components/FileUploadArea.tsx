/**
 * Componente de área de carga de archivos con drag-and-drop
 * Módulo de Contabilización de Facturas
 */

import { useState, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Alert,
  Fade,
} from "@mui/material";
import { CloudUpload, PictureAsPdf, Refresh } from "@mui/icons-material";

// ============ CONSTANTES ============

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES = ["application/pdf", "application/x-pdf"];

// ============ COMPONENTE ============

interface FileUploadAreaProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
  progress: number;
}

export function FileUploadArea({
  onFileSelected,
  isProcessing,
  progress,
}: FileUploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isProcessing) {
        setIsDragOver(true);
      }
    },
    [isProcessing],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    if (
      !ACCEPTED_TYPES.includes(file.type) &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return "El archivo debe ser un PDF válido";
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `El archivo no puede superar los ${MAX_FILE_SIZE_MB}MB`;
    }
    return null;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (isProcessing) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        const error = validateFile(file);
        if (error) {
          setDragError(error);
          return;
        }
        setDragError(null);
        onFileSelected(file);
      }
    },
    [isProcessing, validateFile, onFileSelected],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        const error = validateFile(file);
        if (error) {
          setDragError(error);
          return;
        }
        setDragError(null);
        onFileSelected(file);
      }
    },
    [validateFile, onFileSelected],
  );

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle click on the entire container area
  const handleContainerClick = useCallback(() => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  }, [isProcessing]);

  return (
    <Box sx={{ backgroundColor: "transparent" }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf,application/x-pdf"
        onChange={handleFileSelect}
        style={{ display: "none" }}
        disabled={isProcessing}
      />

      <Paper
        elevation={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleContainerClick}
        sx={{
          border: "2px dashed",
          borderColor: isDragOver ? "#004680" : "#e0e0e0",
          backgroundColor: isDragOver ? "#f0f7ff" : "#fafafa",
          borderRadius: 2,
          p: { xs: 4, sm: 6, md: 8 },
          textAlign: "center",
          cursor: isProcessing ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          position: "relative",
          overflow: "hidden",
          "&:hover": {
            borderColor: isProcessing ? "#e0e0e0" : "#004680",
            backgroundColor: isProcessing ? "#fafafa" : "#f5f9ff",
          },
        }}
      >
        {/* Indicador de progreso */}
        {isProcessing && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1,
            }}
          >
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 3,
                borderRadius: 0,
                backgroundColor: "transparent",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 0,
                  backgroundColor: "#004680",
                  transition: "width 0.2s ease-out",
                },
              }}
            />
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2.5,
            opacity: isProcessing ? 0.6 : 1,
          }}
        >
          {/* Icono principal - Modern circular design */}
          <Box
            sx={{
              width: 88,
              height: 88,
              borderRadius: "16px",
              background: isDragOver
                ? "linear-gradient(135deg, #004680 0%, #0066b3 100%)"
                : "linear-gradient(135deg, #f0f4f8 0%, #e3e8ed 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              transform: isDragOver ? "scale(1.05)" : "scale(1)",
              boxShadow: isDragOver
                ? "0 8px 24px rgba(0, 70, 128, 0.25)"
                : "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
          >
            {isProcessing ? (
              <Refresh
                sx={{
                  fontSize: 40,
                  color: "#004680",
                  animation: "spin 1s linear infinite",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
            ) : (
              <CloudUpload
                sx={{
                  fontSize: 40,
                  color: "#004680",
                }}
              />
            )}
          </Box>

          {/* Texto principal */}
          <Box>
            <Typography
              variant="h5"
              component="h2"
              sx={{
                fontWeight: 600,
                color: "#1a1a1a",
                mb: 1,
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
              }}
            >
              {isProcessing
                ? "Procesando documento..."
                : "Sube tu factura en PDF"}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                mb: 2,
                fontSize: { xs: "0.9rem", sm: "1rem" },
                color: "#666",
              }}
            >
              Arrastra y suelta el archivo aquí o haz clic para seleccionar
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: "inline-block",
                backgroundColor: "#f0f0f0",
                px: 2,
                py: 0.75,
                borderRadius: 1,
                fontSize: "0.75rem",
                color: "#666",
              }}
            >
              Formato: PDF • Máximo: {MAX_FILE_SIZE_MB}MB
            </Typography>
          </Box>

          {/* Botón manual */}
          {!isProcessing && (
            <Button
              variant="contained"
              size="large"
              onClick={(e) => {
                e.stopPropagation();
                handleContainerClick();
              }}
              startIcon={<PictureAsPdf />}
              sx={{
                mt: 1,
                px: 5,
                py: 1.5,
                borderRadius: 1.5,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
                backgroundColor: "#004680",
                boxShadow: "0 4px 12px rgba(0, 70, 128, 0.25)",
                "&:hover": {
                  backgroundColor: "#003d66",
                  boxShadow: "0 6px 16px rgba(0, 70, 128, 0.35)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease",
              }}
            >
              Seleccionar Archivo
            </Button>
          )}
        </Box>
      </Paper>

      {/* Error de drag */}
      {dragError && (
        <Fade in={!!dragError}>
          <Alert
            severity="error"
            sx={{ mt: 2, borderRadius: 1.5 }}
            onClose={() => setDragError(null)}
          >
            {dragError}
          </Alert>
        </Fade>
      )}
    </Box>
  );
}
