/**
 * Componentes de feedback para el procesamiento de facturas
 * Incluye: ProcessingFeedback, ErrorDisplay, SuccessDisplay
 * Módulo de Contabilización de Facturas
 */

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Alert,
  AlertTitle,
  Button,
  LinearProgress,
  Tooltip,
  IconButton,
  Fade,
} from "@mui/material";
import {
  CheckCircle,
  Error as ErrorIcon,
  Close,
  Refresh,
  CloudUpload,
  AutoAwesome,
  Description,
  Search,
  CloudSync,
} from "@mui/icons-material";
import { ErrorProcesamientoPDF, TipoErrorPDF } from "../types";

// ============ PROCESSING FEEDBACK ============

interface ProcessingFeedbackProps {
  message: string;
  progress: number;
  isProcessing: boolean;
}

/**
 * Pasos del procesamiento con iconos y colores
 */
const PASOS_PROCESAMIENTO = [
  { id: "cargando", icon: Description, label: "Cargando", color: "#2196f3" },
  {
    id: "convirtiendo",
    icon: CloudSync,
    label: "Preparando",
    color: "#9c27b0",
  },
  { id: "analizando", icon: Search, label: "Analizando", color: "#ff9800" },
  {
    id: "extrayendo",
    icon: AutoAwesome,
    label: "Extrayendo",
    color: "#4caf50",
  },
];

export function ProcessingFeedback({
  message,
  progress,
  isProcessing,
}: ProcessingFeedbackProps) {
  // Estado para el paso actual animado
  const [pasoAnimado, setPasoAnimado] = useState(0);
  const [progresoAnimado, setProgresoAnimado] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pasoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Animación continua del paso mientras está procesando
  useEffect(() => {
    if (isProcessing) {
      // Cambiar paso cada 2 segundos para dar sensación de progreso
      pasoIntervalRef.current = setInterval(() => {
        setPasoAnimado((prev) => {
          // Avanzar al siguiente paso, pero no más allá del paso 3
          // a menos que el progreso real esté cerca de completar
          if (prev < 3) {
            return prev + 1;
          }
          return prev;
        });
      }, 2000);

      // Progreso animado continuo - solo avanza, nunca retrocede
      intervalRef.current = setInterval(() => {
        setProgresoAnimado((prev) => {
          // Incrementar gradualmente, pero mantenerse detrás del progreso real
          const targetProgress = Math.min(pasoAnimado * 25 + 20, 95);
          if (prev < targetProgress) {
            return Math.min(prev + 2, targetProgress);
          }
          // Mantener el progreso en el target sin oscilar
          return targetProgress;
        });
      }, 100);
    } else {
      // Cuando termina, mostrar progreso completo
      setProgresoAnimado(100);
      setPasoAnimado(3);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (pasoIntervalRef.current) clearInterval(pasoIntervalRef.current);
    };
  }, [isProcessing, pasoAnimado]);

  // Sincronizar con el progreso real cuando avanza significativamente
  useEffect(() => {
    if (progress > progresoAnimado && progress < 100) {
      setProgresoAnimado(progress);
      // Actualizar paso basado en progreso real
      if (progress >= 80) setPasoAnimado(3);
      else if (progress >= 50) setPasoAnimado(2);
      else if (progress >= 25) setPasoAnimado(1);
    }
  }, [progress, progresoAnimado]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        py: 4,
      }}
    >
      {/* Indicador de pasos */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 2,
        }}
      >
        {PASOS_PROCESAMIENTO.map((paso, index) => {
          const Icon = paso.icon;
          const isActive = index === pasoAnimado;
          const isCompleted = index < pasoAnimado;

          return (
            <Box
              key={paso.id}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <Fade in={true} timeout={300 + index * 100}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      backgroundColor: isCompleted
                        ? paso.color
                        : isActive
                          ? paso.color + "20"
                          : "#f5f5f5",
                      border: `2px solid ${isActive ? paso.color : isCompleted ? paso.color : "#e0e0e0"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s ease",
                      transform: isActive ? "scale(1.15)" : "scale(1)",
                      boxShadow: isActive ? `0 0 20px ${paso.color}50` : "none",
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle sx={{ fontSize: 22, color: "white" }} />
                    ) : (
                      <Icon
                        sx={{
                          fontSize: 22,
                          color: isActive ? paso.color : "#bbb",
                          animation: isActive
                            ? "pulse 1.5s ease-in-out infinite"
                            : "none",
                          "@keyframes pulse": {
                            "0%": { opacity: 0.5, transform: "scale(0.9)" },
                            "50%": { opacity: 1, transform: "scale(1)" },
                            "100%": { opacity: 0.5, transform: "scale(0.9)" },
                          },
                        }}
                      />
                    )}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isActive
                        ? paso.color
                        : isCompleted
                          ? paso.color
                          : "#999",
                      fontWeight: isActive || isCompleted ? 600 : 400,
                      fontSize: "0.7rem",
                      textAlign: "center",
                    }}
                  >
                    {paso.label}
                  </Typography>
                </Box>
              </Fade>
              {index < PASOS_PROCESAMIENTO.length - 1 && (
                <Box
                  sx={{
                    width: 24,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor:
                      index < pasoAnimado
                        ? PASOS_PROCESAMIENTO[index].color
                        : "#e8e8e8",
                    transition: "background-color 0.5s ease",
                    mt: -2,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>

      {/* Mensaje principal con animación */}
      <Box sx={{ textAlign: "center", minHeight: 60 }}>
        <Typography
          variant="h6"
          sx={{
            color: "#1a1a1a",
            fontWeight: 600,
            mb: 0.5,
          }}
        >
          {message}
        </Typography>
        <Typography variant="body2" sx={{ color: "#666" }}>
          Por favor espera mientras procesamos tu documento
        </Typography>
      </Box>

      {/* Barra de progreso mejorada */}
      <Box sx={{ width: "100%", maxWidth: 400 }}>
        <LinearProgress
          variant="determinate"
          value={progresoAnimado}
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor: "#f0f0f0",
            "& .MuiLinearProgress-bar": {
              borderRadius: 5,
              background: `linear-gradient(90deg, #004680 0%, #0066b3 50%, #004680 100%)`,
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s linear infinite",
              transition: "width 0.2s ease-out",
              "@keyframes shimmer": {
                "0%": { backgroundPosition: "200% 0" },
                "100%": { backgroundPosition: "-200% 0" },
              },
            },
          }}
        />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#4caf50",
                animation: "blink 1s ease-in-out infinite",
                "@keyframes blink": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.4 },
                },
              }}
            />
            <Typography variant="caption" sx={{ color: "#666" }}>
              Procesando...
            </Typography>
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: "#004680",
              fontWeight: 700,
              fontSize: "0.85rem",
            }}
          >
            {Math.round(progresoAnimado)}%
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ============ ERROR DISPLAY ============

interface ErrorDisplayProps {
  error: ErrorProcesamientoPDF;
  onRetry: () => void;
  onClear: () => void;
}

export function ErrorDisplay({ error, onRetry, onClear }: ErrorDisplayProps) {
  const errorMessages: Record<
    TipoErrorPDF,
    { title: string; message: string; suggestion: string }
  > = {
    archivo_invalido: {
      title: "Archivo inválido",
      message: error.mensaje,
      suggestion:
        "Verifica que el archivo sea un PDF válido y no esté corrupto.",
    },
    pdf_protegido: {
      title: "PDF protegido",
      message: error.mensaje,
      suggestion:
        "El documento está protegido con contraseña. Desprotégelo antes de subirlo.",
    },
    extraccion_fallida: {
      title: "Error de extracción",
      message: error.mensaje,
      suggestion:
        "El PDF puede tener un formato no estándar. Intenta guardarlo nuevamente.",
    },
    formato_no_reconocido: {
      title: "Formato no reconocido",
      message: error.mensaje,
      suggestion:
        "El documento no parece ser una factura estándar. Verifica el archivo.",
    },
    datos_incompletos: {
      title: "Datos incompletos",
      message: error.mensaje,
      suggestion:
        "No se pudo extraer la información. Puedes ingresar los datos manualmente.",
    },
    error_desconocido: {
      title: "Error inesperado",
      message: error.mensaje,
      suggestion:
        "Intenta nuevamente o contacta soporte si el problema persiste.",
    },
  };

  const errorInfo = errorMessages[error.tipo];

  return (
    <Alert
      severity="error"
      icon={<ErrorIcon sx={{ fontSize: 24 }} />}
      sx={{
        borderRadius: 2,
        "& .MuiAlert-message": {
          width: "100%",
        },
        border: "1px solid #ffcdd2",
        backgroundColor: "#fff5f5",
      }}
      action={
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Reintentar">
            <IconButton
              color="inherit"
              size="small"
              onClick={onRetry}
              sx={{ "&:hover": { backgroundColor: "rgba(244, 67, 54, 0.1)" } }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cerrar">
            <IconButton
              color="inherit"
              size="small"
              onClick={onClear}
              sx={{ "&:hover": { backgroundColor: "rgba(244, 67, 54, 0.1)" } }}
            >
              <Close />
            </IconButton>
          </Tooltip>
        </Box>
      }
    >
      <AlertTitle sx={{ fontWeight: 600, color: "#c62828" }}>
        {errorInfo.title}
      </AlertTitle>
      <Typography variant="body2" sx={{ mb: 1, color: "#333" }}>
        {errorInfo.message}
      </Typography>
      <Typography variant="caption" sx={{ color: "#666" }}>
        <strong>Sugerencia:</strong> {errorInfo.suggestion}
      </Typography>
    </Alert>
  );
}

// ============ SUCCESS DISPLAY ============

interface SuccessDisplayProps {
  onNewFile: () => void;
}

export function SuccessDisplay({ onNewFile }: SuccessDisplayProps) {
  return (
    <Alert
      severity="success"
      icon={<CheckCircle sx={{ fontSize: 24 }} />}
      sx={{
        borderRadius: 2,
        border: "1px solid #c8e6c9",
        backgroundColor: "#f1f8e9",
        "& .MuiAlert-message": {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        },
      }}
      action={
        <Button
          color="inherit"
          size="small"
          onClick={onNewFile}
          startIcon={<CloudUpload />}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "#2e7d32",
            "&:hover": {
              backgroundColor: "rgba(46, 125, 50, 0.1)",
            },
          }}
        >
          Nueva factura
        </Button>
      }
    >
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, color: "#2e7d32" }}>
          ¡Datos extraídos exitosamente!
        </Typography>
        <Typography variant="caption" sx={{ color: "#555" }}>
          Los datos de la factura han sido procesados y están listos para
          revisión.
        </Typography>
      </Box>
    </Alert>
  );
}
