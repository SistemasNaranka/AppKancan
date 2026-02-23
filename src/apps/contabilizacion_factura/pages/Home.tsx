/**
 * Página principal para carga y visualización de facturas PDF
 * Módulo de Contabilización de Facturas
 * Integrado con Google Gemini y Ollama como fallback
 * La API key y modelo de IA se obtienen del usuario autenticado (campos key_gemini y modelo_ia en Directus)
 */

import { useState, useCallback, useEffect } from "react";
import { Box, Typography, Paper, Button, Chip, Alert } from "@mui/material";
import {
  CheckCircle,
  SmartToy,
  Description,
  Cancel,
  Update,
  CloudUpload,
} from "@mui/icons-material";

// Hooks
import { useHybridExtractor } from "../hooks/useHybridExtractor";
import { useAuth } from "@/auth/hooks/useAuth";

// Componentes modulares
import { FileUploadArea } from "../components/FileUploadArea";
import { InvoiceInfoCard } from "../components/InvoiceInfoCard";
import {
  ProcessingFeedback,
  ErrorDisplay,
} from "../components/FeedbackComponents";
import {
  IAStatusBadge,
  ProveedorProcesamiento,
} from "../components/IAStatusBadge";

// Utilidades y tipos
import { DatosFacturaPDF, EstadoProceso } from "../types";
import {
  ESTADO_CONFIG,
  ejecutarActualizarResolucion,
} from "../utils/resolucion";

export default function Home() {
  const [datosFactura, setDatosFactura] = useState<DatosFacturaPDF | null>(
    null,
  );
  const [modelosDisponibles, setModelosDisponibles] = useState<string[]>([]);
  const [cargandoModelos, setCargandoModelos] = useState(true);
  const [conexionErrorOllama, setConexionErrorOllama] = useState(false);

  // Obtener usuario autenticado para acceder a su API key de Gemini y modelo de IA
  const { user } = useAuth();
  const geminiApiKey = user?.key_gemini;
  const modeloIA = user?.modelo_ia;

  // Hook de extracción híbrido (Gemini + Ollama fallback)
  const hybridExtractor = useHybridExtractor(geminiApiKey, modeloIA);

  // Verificar configuración de API keys y cargar modelos Ollama al montar
  useEffect(() => {
    const inicializar = async () => {
      setCargandoModelos(true);
      setConexionErrorOllama(false);
      try {
        const modelos = await hybridExtractor.getModelosDisponibles();
        setModelosDisponibles(modelos);
        if (modelos.length > 0 && !hybridExtractor.modeloActual) {
          hybridExtractor.setModelo(modelos[0]);
        }
      } catch {
        console.log(
          "No se pudieron cargar los modelos de Ollama - Fallback no disponible",
        );
        setConexionErrorOllama(true);
      } finally {
        setCargandoModelos(false);
      }
    };
    inicializar();
  }, []);

  const {
    extractData,
    isProcessing,
    error,
    progress,
    clearError,
    estadoHibrido,
  } = hybridExtractor;

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!geminiApiKey && conexionErrorOllama) {
        return;
      }
      try {
        const datos = await extractData(file);
        setDatosFactura(datos);
      } catch (err) {
        console.error("Error procesando archivo:", err);
      }
    },
    [extractData, geminiApiKey, conexionErrorOllama],
  );

  const handleRetry = useCallback(() => {
    clearError();
  }, [clearError]);

  const handleClear = useCallback(() => {
    clearError();
    setDatosFactura(null);
  }, [clearError]);

  const handleNewFile = useCallback(() => {
    setDatosFactura(null);
    clearError();
  }, [clearError]);

  // Determinar estado basado en el hook
  const getEstado = (): EstadoProceso => {
    if (isProcessing) {
      if (progress < 30) return "cargando";
      if (progress < 70) return "procesando";
      if (progress < 90) return "validando";
      return "procesando";
    }
    if (error) return "error";
    if (datosFactura) return "completado";
    return "idle";
  };

  const estado = getEstado();

  // Mensajes de procesamiento dinámicos según el proveedor y progreso
  const getMensajeProcesamiento = () => {
    if (estadoHibrido.errorGemini && estadoHibrido.intentoOllama) {
      if (progress < 40) return "Gemini no disponible, cambiando a Ollama...";
      if (progress < 50) return "Conectando con Ollama...";
      if (progress < 60) return "Analizando factura con Ollama...";
      if (progress < 80) return "Procesando respuesta...";
      return "Finalizando extracción...";
    }

    if (progress < 15) return "Validando archivo PDF...";
    if (progress < 25) return "Preparando documento...";
    if (progress < 35) return "Conectando con Google Gemini...";
    if (progress < 50) return "Enviando documento a la IA...";
    if (progress < 65) return "Analizando factura con IA...";
    if (progress < 80) return "Procesando respuesta JSON...";
    if (progress < 95) return "Validando datos extraídos...";
    return "¡Extracción completada!";
  };

  return (
    <Box sx={{ p: 2, width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
      {/* Header compacto */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Description sx={{ fontSize: 28, color: "primary.main" }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            Contabilización de Facturas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sube tus facturas PDF para extraer datos con IA
          </Typography>
        </Box>

        {/* Indicador de estado */}
        {estado !== "idle" && (
          <Chip
            icon={estado === "completado" ? <CheckCircle /> : <SmartToy />}
            label={ESTADO_CONFIG[estado].label}
            color={ESTADO_CONFIG[estado].color}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>

      {/* Estado de IA discreto */}
      {estado === "idle" && (
        <IAStatusBadge
          geminiApiKeyConfigured={!!geminiApiKey}
          conexionErrorOllama={conexionErrorOllama}
          modelosDisponibles={modelosDisponibles}
          modeloIA={modeloIA}
        />
      )}

      {/* Contenido principal */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Vista de carga/selección */}
        {estado === "idle" && (
          <FileUploadArea
            onFileSelected={handleFileSelected}
            isProcessing={isProcessing}
            progress={progress}
          />
        )}

        {/* Vista de procesamiento */}
        {isProcessing && (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid #eee",
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
              p: 2,
            }}
          >
            <ProcessingFeedback
              message={getMensajeProcesamiento()}
              progress={progress}
              isProcessing={isProcessing}
            />
            {estadoHibrido.errorGemini && (
              <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                <Typography variant="caption">
                  <strong>Gemini no disponible:</strong>{" "}
                  {estadoHibrido.errorGemini}
                  <br />
                  Usando Ollama como fallback...
                </Typography>
              </Alert>
            )}
          </Paper>
        )}

        {/* Vista de error */}
        {error && !isProcessing && (
          <ErrorDisplay
            error={error}
            onRetry={handleRetry}
            onClear={handleClear}
          />
        )}

        {/* Vista de éxito */}
        {datosFactura && !isProcessing && !error && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <InvoiceInfoCard datosFactura={datosFactura} />

            {estadoHibrido.proveedorUsado && (
              <ProveedorProcesamiento
                proveedor={estadoHibrido.proveedorUsado}
                modelo={estadoHibrido.modeloUsado}
              />
            )}

            {/* Botones de acción */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "flex-end",
                pt: 2.5,
                pb: 0.5,
              }}
            >
              <Button
                variant="contained"
                onClick={handleNewFile}
                startIcon={<Cancel />}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  color: "#fff",
                  px: 3,
                  py: 1.2,
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                    boxShadow: "0 6px 20px rgba(239, 68, 68, 0.45)",
                    transform: "translateY(-1px)",
                  },
                  "&:active": {
                    transform: "translateY(0)",
                  },
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={() => ejecutarActualizarResolucion(datosFactura)}
                startIcon={<Update />}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  px: 3.5,
                  py: 1.2,
                  background:
                    "linear-gradient(135deg, #004680 0%, #0066cc 100%)",
                  boxShadow: "0 4px 14px rgba(0, 70, 128, 0.35)",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #003d66 0%, #0052a3 100%)",
                    boxShadow: "0 6px 20px rgba(0, 70, 128, 0.45)",
                    transform: "translateY(-1px)",
                  },
                  "&:active": {
                    transform: "translateY(0)",
                  },
                }}
              >
                Actualizar Resolución
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
