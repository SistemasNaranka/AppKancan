/**
 * Componente principal para carga y visualización de facturas PDF
 * Módulo de Contabilización de Facturas
 * Integrado con Google Gemini (gemma-3-27b-it) y Ollama como fallback
 * La API key de Gemini se obtiene del usuario autenticado (campo key_gemini en Directus)
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Fade,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import {
  CloudUpload,
  PictureAsPdf,
  CheckCircle,
  Error as ErrorIcon,
  Close,
  Refresh,
  Description,
  AttachMoney,
  CalendarToday,
  Store,
  Receipt,
  PlayArrow,
  SmartToy,
  CloudQueue,
  Warning,
} from "@mui/icons-material";
import {
  useHybridExtractor,
  ProveedorIA,
  EstadoHibrido,
} from "../hooks/useHybridExtractor";
import {
  DatosFacturaPDF,
  EstadoProceso,
  ErrorProcesamientoPDF,
  TipoErrorPDF,
  formatCurrency,
  formatDate,
  formatFileSize,
} from "../types";
import { useAuth } from "@/auth/hooks/useAuth";

// ============ CONSTANTES ============

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES = ["application/pdf", "application/x-pdf"];

const ESTADO_CONFIG: Record<
  EstadoProceso,
  { label: string; color: "info" | "warning" | "success" | "error" | "default" }
> = {
  idle: { label: "Esperando archivo", color: "default" },
  cargando: { label: "Cargando archivo", color: "info" },
  procesando: { label: "Extrayendo datos", color: "info" },
  validando: { label: "Validando información", color: "warning" },
  completado: { label: "Proceso completado", color: "success" },
  error: { label: "Error en el proceso", color: "error" },
};

// ============ CONFIGURACIÓN DEL EJECUTABLE ============

// Protocolo URI registrado en Windows
const PROTOCOLO_EMPRESA = "empresa://";

// ============ FUNCIÓN PARA EJECUTAR .EXE ============

/**
 * Ejecuta el programa corporativo usando el protocolo URI registrado
 * El protocolo llama a un VBS que ejecuta el .exe
 */
function ejecutarActualizarResolucion(datosFactura?: DatosFacturaPDF | null) {
  // Construir la URI (por ahora sin parámetros)
  // Cuando contabilidad dé los parámetros, se pueden agregar así:
  // const uri = `${PROTOCOLO_EMPRESA}${datosFactura?.numeroFactura}`;
  const uri = PROTOCOLO_EMPRESA;

  // Ejecutar el protocolo
  window.location.href = "empresa://";
}

// ============ COMPONENTES AUXILIARES ============

/**
 * Componente de área de carga de archivos con drag-and-drop
 */
function FileUploadArea({
  onFileSelected,
  isProcessing,
  progress,
}: {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
  progress: number;
}) {
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

  return (
    <Box>
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
        sx={{
          border: "2px dashed",
          borderColor: isDragOver ? "primary.main" : "grey.300",
          backgroundColor: isDragOver ? "primary.50" : "grey.50",
          borderRadius: 3,
          p: { xs: 3, sm: 5, md: 6 },
          textAlign: "center",
          cursor: isProcessing ? "not-allowed" : "pointer",
          transition: "all 0.3s ease",
          position: "relative",
          overflow: "hidden",
          "&:hover": {
            borderColor: isProcessing ? "grey.300" : "primary.main",
            backgroundColor: isProcessing ? "grey.50" : "primary.50",
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
                height: 4,
                borderRadius: 0,
                backgroundColor: "transparent",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 0,
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
            gap: 2,
            opacity: isProcessing ? 0.7 : 1,
          }}
        >
          {/* Icono principal */}
          <Box
            sx={{
              width: { xs: 64, sm: 80 },
              height: { xs: 64, sm: 80 },
              borderRadius: "50%",
              background: isDragOver
                ? "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)"
                : "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
              transform: isDragOver ? "scale(1.1)" : "scale(1)",
            }}
          >
            {isProcessing ? (
              <Refresh
                sx={{
                  fontSize: { xs: 36, sm: 44 },
                  color: "primary.main",
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
                  fontSize: { xs: 36, sm: 44 },
                  color: "primary.main",
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
                color: "text.primary",
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
              sx={{ mb: 2, fontSize: { xs: "0.9rem", sm: "1rem" } }}
            >
              Arrastra y suelta el archivo aquí o haz clic para seleccionar
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                backgroundColor: "grey.100",
                px: 2,
                py: 0.5,
                borderRadius: 1,
                mx: "auto",
                maxWidth: 300,
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
              onClick={handleButtonClick}
              startIcon={<PictureAsPdf />}
              sx={{
                mt: 2,
                px: 4,
                py: 1.2,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                "&:hover": {
                  boxShadow: "0 6px 16px rgba(25, 118, 210, 0.4)",
                  transform: "translateY(-2px)",
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
            sx={{ mt: 2, borderRadius: 2 }}
            onClose={() => setDragError(null)}
          >
            {dragError}
          </Alert>
        </Fade>
      )}
    </Box>
  );
}

/**
 * Componente para mostrar información de la factura extraída
 */
function InvoiceInfoCard({ datosFactura }: { datosFactura: DatosFacturaPDF }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header con información general */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "grey.200",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
            p: { xs: 2, sm: 3 },
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{ opacity: 0.8, fontSize: "0.75rem" }}
            >
              Factura
            </Typography>
            <Typography
              variant="h4"
              component="h3"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.5rem", sm: "2rem" },
              }}
            >
              {datosFactura.numeroFactura || "Sin número"}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Chip
              icon={
                <CalendarToday
                  sx={{ color: "inherit !important", fontSize: 16 }}
                />
              }
              label={`Emisión: ${formatDate(datosFactura.fechaEmision)}`}
              sx={{
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "white",
                backdropFilter: "blur(4px)",
              }}
              size="small"
            />
            {datosFactura.fechaVencimiento && (
              <Chip
                icon={
                  <CalendarToday
                    sx={{ color: "inherit !important", fontSize: 16 }}
                  />
                }
                label={`Vence: ${formatDate(datosFactura.fechaVencimiento)}`}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                  backdropFilter: "blur(4px)",
                }}
                size="small"
              />
            )}
          </Box>
        </Box>

        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 3,
            }}
          >
            {/* Proveedor */}
            <Box>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
              >
                <Store sx={{ fontSize: 20, color: "primary.main" }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Proveedor
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {datosFactura.proveedor.nombre}
              </Typography>
              {datosFactura.proveedor.nif && (
                <Typography variant="body2" color="text.secondary">
                  NIF: {datosFactura.proveedor.nif}
                </Typography>
              )}
            </Box>

            {/* Archivo */}
            <Box>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
              >
                <PictureAsPdf sx={{ fontSize: 20, color: "error.main" }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Archivo origen
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {datosFactura.archivo.nombre}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(datosFactura.archivo.tamaño)} • Cargado:{" "}
                {formatDate(datosFactura.archivo.fechaCarga)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabla de conceptos */}
      {datosFactura.conceptos.length > 0 && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "grey.200",
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 3 }, pb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Receipt sx={{ fontSize: 20, color: "primary.main" }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Conceptos
              </Typography>
              <Chip
                label={`${datosFactura.conceptos.length} items`}
                size="small"
                sx={{ ml: "auto" }}
              />
            </Box>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "grey.50" }}>
                  <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Cant.
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    P. Unit.
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Importe
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datosFactura.conceptos.map((concepto, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      "&:nth-of-type(odd)": { backgroundColor: "transparent" },
                      "&:hover": { backgroundColor: "grey.50" },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {concepto.descripcion}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {concepto.cantidad.toLocaleString("es-ES")}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(
                          concepto.precioUnitario,
                          datosFactura.moneda,
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(concepto.importe, datosFactura.moneda)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Totales e impuestos */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "grey.200",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 0,
          }}
        >
          {/* Desglose de impuestos */}
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              borderRight: { md: "1px solid" },
              borderColor: "grey.200",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Desglose de Impuestos
            </Typography>
            {datosFactura.impuestos.length > 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {datosFactura.impuestos.map((impuesto, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: 1,
                      borderBottom:
                        index < datosFactura.impuestos.length - 1
                          ? "1px solid"
                          : "none",
                      borderColor: "grey.100",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Base imponible ({impuesto.tipo}%)
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(impuesto.base, datosFactura.moneda)}
                    </Typography>
                  </Box>
                ))}
                {datosFactura.impuestos.map((impuesto, index) => (
                  <Box
                    key={`iva-${index}`}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      IVA {impuesto.tipo}%
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatCurrency(impuesto.importe, datosFactura.moneda)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No se detectaron impuestos
              </Typography>
            )}
          </Box>

          {/* Totales */}
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Resumen
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  py: 1,
                  borderBottom: "1px solid",
                  borderColor: "grey.100",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="body2">
                  {formatCurrency(datosFactura.subtotal, datosFactura.moneda)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  py: 1,
                  borderBottom: "1px solid",
                  borderColor: "grey.100",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Total Impuestos
                </Typography>
                <Typography variant="body2">
                  {formatCurrency(
                    datosFactura.totalImpuestos,
                    datosFactura.moneda,
                  )}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  py: 2,
                  backgroundColor: "primary.50",
                  px: 2,
                  mx: -2,
                  borderRadius: 2,
                  mt: 1,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  TOTAL
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  {formatCurrency(datosFactura.total, datosFactura.moneda)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}

/**
 * Componente de feedback visual durante el procesamiento
 */
function ProcessingFeedback({
  message,
  progress,
}: {
  message: string;
  progress: number;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        py: 4,
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          backgroundColor: "primary.50",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "3px solid",
            borderColor: "grey.200",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "3px solid",
            borderColor: "primary.main",
            borderTopColor: "transparent",
            animation: "spin 1s linear infinite",
            "@keyframes spin": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(360deg)" },
            },
          }}
        />
      </Box>
      <Typography variant="h6" color="text.secondary">
        {message}
      </Typography>
      <Box sx={{ width: "100%", maxWidth: 300 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: "grey.200",
            "& .MuiLinearProgress-bar": {
              borderRadius: 3,
            },
          }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary">
        {progress}% completado
      </Typography>
    </Box>
  );
}

/**
 * Componente de mensaje de error
 */
function ErrorDisplay({
  error,
  onRetry,
  onClear,
}: {
  error: ErrorProcesamientoPDF;
  onRetry: () => void;
  onClear: () => void;
}) {
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
      icon={<ErrorIcon />}
      sx={{
        borderRadius: 3,
        "& .MuiAlert-message": {
          width: "100%",
        },
      }}
      action={
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Reintentar">
            <IconButton color="inherit" size="small" onClick={onRetry}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cerrar">
            <IconButton color="inherit" size="small" onClick={onClear}>
              <Close />
            </IconButton>
          </Tooltip>
        </Box>
      }
    >
      <AlertTitle sx={{ fontWeight: 600 }}>{errorInfo.title}</AlertTitle>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {errorInfo.message}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        <strong>Sugerencia:</strong> {errorInfo.suggestion}
      </Typography>
    </Alert>
  );
}

/**
 * Componente de éxito
 */
function SuccessDisplay({ onNewFile }: { onNewFile: () => void }) {
  return (
    <Alert
      severity="success"
      icon={<CheckCircle />}
      sx={{
        borderRadius: 3,
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
          }}
        >
          Nueva factura
        </Button>
      }
    >
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          ¡Datos extraídos exitosamente!
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Los datos de la factura han sido procesados y están listos para
          revisión.
        </Typography>
      </Box>
    </Alert>
  );
}

// ============ COMPONENTE DE CONFIGURACIÓN HÍBRIDA ============

/**
 * Componente para configurar el sistema híbrido Gemini + Ollama
 * Muestra el estado de ambos proveedores y permite seleccionar modelo Ollama para fallback
 */
function HybridConfigPanel({
  modeloActual,
  onModeloChange,
  modelosDisponibles,
  cargandoModelos,
  conexionErrorOllama,
  geminiApiKeyConfigured,
}: {
  modeloActual: string;
  onModeloChange: (modelo: string) => void;
  modelosDisponibles: string[];
  cargandoModelos: boolean;
  conexionErrorOllama: boolean;
  geminiApiKeyConfigured: boolean;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "grey.200",
        p: 2,
        mb: 2,
        backgroundColor: "background.paper",
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}
      >
        <CloudQueue sx={{ color: "primary.main" }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Extracción con IA (Gemini + Ollama Fallback)
        </Typography>
      </Box>

      {/* Estado de los proveedores */}
      <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {/* Gemini Status */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            backgroundColor: geminiApiKeyConfigured ? "success.50" : "error.50",
            border: "1px solid",
            borderColor: geminiApiKeyConfigured ? "success.main" : "error.main",
          }}
        >
          {geminiApiKeyConfigured ? (
            <CheckCircle sx={{ fontSize: 20, color: "success.main" }} />
          ) : (
            <ErrorIcon sx={{ fontSize: 20, color: "error.main" }} />
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Google Gemini (gemma-3-27b-it) - Proveedor Principal
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {geminiApiKeyConfigured
                ? "API Key configurada correctamente"
                : "API Key no configurada - Agrega VITE_GEMINI_API_KEY al .env"}
            </Typography>
          </Box>
        </Box>

        {/* Ollama Status */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            backgroundColor: conexionErrorOllama ? "warning.50" : "info.50",
            border: "1px solid",
            borderColor: conexionErrorOllama ? "warning.main" : "info.main",
          }}
        >
          {conexionErrorOllama ? (
            <Warning sx={{ fontSize: 20, color: "warning.main" }} />
          ) : (
            <SmartToy sx={{ fontSize: 20, color: "info.main" }} />
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Ollama - Fallback de Contingencia
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {conexionErrorOllama
                ? "No disponible - Se usará solo Gemini"
                : `${modelosDisponibles.length} modelo(s) disponible(s) para fallback`}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Selector de modelo Ollama para fallback */}
      {!conexionErrorOllama && modelosDisponibles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <FormControl size="small" sx={{ minWidth: 250 }}>
            <InputLabel id="modelo-select-label">
              Modelo Ollama (Fallback)
            </InputLabel>
            <Select
              labelId="modelo-select-label"
              value={
                modelosDisponibles.includes(modeloActual) ? modeloActual : ""
              }
              label="Modelo Ollama (Fallback)"
              onChange={(e) => onModeloChange(e.target.value)}
              disabled={cargandoModelos}
              startAdornment={
                cargandoModelos ? (
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                ) : null
              }
            >
              {modelosDisponibles.map((modelo) => (
                <MenuItem key={modelo} value={modelo}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2">{modelo}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Información de ayuda */}
      <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
        <Typography variant="caption">
          <strong>Flujo de extracción:</strong> Primero intenta con Google
          Gemini. Si falla (tokens agotados, error de conexión), automáticamente
          usa Ollama como respaldo.
        </Typography>
      </Alert>
    </Paper>
  );
}

// ============ COMPONENTE PRINCIPAL ============

/**
 * Componente principal para carga y visualización de facturas PDF
 * Usa Google Gemini como proveedor principal y Ollama como fallback
 * La API key de Gemini se obtiene del usuario autenticado (campo key_gemini en Directus)
 */
export default function Home() {
  const [datosFactura, setDatosFactura] = useState<DatosFacturaPDF | null>(
    null,
  );
  const [modelosDisponibles, setModelosDisponibles] = useState<string[]>([]);
  const [cargandoModelos, setCargandoModelos] = useState(true);
  const [conexionErrorOllama, setConexionErrorOllama] = useState(false);

  // Obtener usuario autenticado para acceder a su API key de Gemini
  const { user } = useAuth();
  const geminiApiKey = user?.key_gemini;

  // Hook de extracción híbrido (Gemini + Ollama fallback)
  // Se pasa la API key del usuario autenticado
  const hybridExtractor = useHybridExtractor(geminiApiKey);

  // Verificar configuración de API keys y cargar modelos Ollama al montar
  useEffect(() => {
    const inicializar = async () => {
      // Cargar modelos de Ollama para fallback
      setCargandoModelos(true);
      setConexionErrorOllama(false);
      try {
        const modelos = await hybridExtractor.getModelosDisponibles();
        setModelosDisponibles(modelos);
        // Seleccionar el primer modelo disponible automáticamente
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
    modeloActual,
    estadoHibrido,
  } = hybridExtractor;

  const handleFileSelected = useCallback(
    async (file: File) => {
      // Permitir procesamiento si Gemini está configurado o si Ollama está disponible
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

  const handleModeloChange = useCallback(
    (modelo: string) => {
      hybridExtractor.setModelo(modelo);
    },
    [hybridExtractor],
  );

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

  // Mensajes de procesamiento dinámicos según el proveedor
  const getMensajeProcesamiento = () => {
    if (estadoHibrido.intentoOllama && !estadoHibrido.intentoGemini) {
      // Solo Ollama (fallback ya intentado)
      if (progress < 30) return "Convirtiendo PDF a imagen...";
      if (progress < 50) return "Conectando con Ollama (fallback)...";
      return "Analizando factura con Ollama...";
    }
    if (estadoHibrido.intentoGemini && estadoHibrido.errorGemini) {
      // Gemini falló, intentando Ollama
      if (progress < 50) return "Gemini falló, cambiando a Ollama...";
      return "Analizando factura con Ollama (fallback)...";
    }
    // Gemini como principal
    if (progress < 30) return "Preparando documento...";
    if (progress < 50) return "Conectando con Google Gemini...";
    if (progress < 80) return "Analizando factura con IA...";
    return "Extrayendo datos...";
  };

  // Obtener información del proveedor usado para mostrar
  const getProveedorInfo = () => {
    if (!datosFactura || isProcessing) return null;

    if (estadoHibrido.proveedorUsado === "gemini") {
      return {
        label: "Google Gemini",
        color: "primary" as const,
        icon: <CloudQueue sx={{ fontSize: 16 }} />,
      };
    }
    if (estadoHibrido.proveedorUsado === "ollama") {
      return {
        label: "Ollama (Fallback)",
        color: "warning" as const,
        icon: <SmartToy sx={{ fontSize: 16 }} />,
      };
    }
    return null;
  };

  const proveedorInfo = getProveedorInfo();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              fontSize: { xs: "1.5rem", sm: "2rem" },
            }}
          >
            Contabilización de Facturas
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Sube tus facturas PDF para extraer y gestionar los datos
            automáticamente con IA
          </Typography>
        </Box>

        {/* Indicador de estado */}
        {estado !== "idle" && (
          <Chip
            icon={estado === "completado" ? <CheckCircle /> : <CloudQueue />}
            label={ESTADO_CONFIG[estado].label}
            color={ESTADO_CONFIG[estado].color}
            sx={{
              fontWeight: 600,
            }}
          />
        )}
      </Box>

      {/* Panel de configuración híbrida */}
      {estado === "idle" && (
        <HybridConfigPanel
          modeloActual={modeloActual}
          onModeloChange={handleModeloChange}
          modelosDisponibles={modelosDisponibles}
          cargandoModelos={cargandoModelos}
          conexionErrorOllama={conexionErrorOllama}
          geminiApiKeyConfigured={!!geminiApiKey}
        />
      )}

      {/* Contenido principal */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
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
              borderRadius: 3,
              border: "1px solid",
              borderColor: "grey.200",
              p: 4,
            }}
          >
            <ProcessingFeedback
              message={getMensajeProcesamiento()}
              progress={progress}
            />
            {/* Mostrar si hubo fallback */}
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
          <Box>
            <ErrorDisplay
              error={error}
              onRetry={handleRetry}
              onClear={handleClear}
            />
          </Box>
        )}

        {/* Vista de éxito */}
        {datosFactura && !isProcessing && !error && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <SuccessDisplay onNewFile={handleNewFile} />

            {/* Indicador del proveedor usado */}
            {proveedorInfo && (
              <Alert
                severity={
                  proveedorInfo.color === "warning" ? "warning" : "info"
                }
                sx={{ borderRadius: 2 }}
                icon={proveedorInfo.icon}
              >
                <Typography variant="body2">
                  Datos extraídos con <strong>{proveedorInfo.label}</strong>
                  {estadoHibrido.errorGemini && (
                    <span>
                      {" "}
                      (Gemini falló:{" "}
                      {estadoHibrido.errorGemini.substring(0, 50)}...)
                    </span>
                  )}
                </Typography>
              </Alert>
            )}

            <InvoiceInfoCard datosFactura={datosFactura} />

            {/* Botones de acción */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="outlined"
                onClick={handleNewFile}
                startIcon={<Close />}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={() => ejecutarActualizarResolucion(datosFactura)}
                startIcon={<PlayArrow />}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 4,
                  backgroundColor: "#004680",
                  "&:hover": {
                    backgroundColor: "#005AA3",
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
