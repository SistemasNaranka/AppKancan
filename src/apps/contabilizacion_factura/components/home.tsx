/**
 * Componente principal para carga y visualización de facturas PDF
 * Módulo de Contabilización de Facturas
 * Integrado con Ollama IA para extracción inteligente
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
  EventBusy,
  Store,
  Receipt,
  PlayArrow,
  SmartToy,
  FilePresent,
  MonetizationOn,
  Inventory,
} from "@mui/icons-material";
import { useOllamaExtractor } from "../hooks/useOllamaExtractor";
import {
  DatosFacturaPDF,
  EstadoProceso,
  ErrorProcesamientoPDF,
  TipoErrorPDF,
  formatCurrency,
  formatDate,
  formatFileSize,
} from "../types";

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
 * 
 * Parámetros que se envían al programa corporativo:
 * - numero: Número de factura
 * - serie: Serie de la factura
 * - fechaEmision: Fecha de emisión de la factura
 * - fechaVencimiento: Fecha de vencimiento de la factura
 * - proveedor: Nombre del proveedor
 * - proveedorNif: NIF/CIF del proveedor
 * - total: Monto total de la factura
 */
function ejecutarActualizarResolucion(datosFactura?: DatosFacturaPDF | null) {
  if (!datosFactura) {
    alert("No hay datos de factura para actualizar");
    return;
  }

  // Construir los parámetros de la factura
  const params = new URLSearchParams({
    numero: datosFactura.numeroFactura,
    serie: datosFactura.serie || "",
    fechaEmision: datosFactura.fechaEmision,
    fechaVencimiento: datosFactura.fechaVencimiento || "",
    proveedor: datosFactura.proveedor.nombre,
    proveedorNif: datosFactura.proveedor.nif || "",
    total: datosFactura.total.toString(),
    moneda: datosFactura.moneda,
  });

  // Construir el URI del protocolo con los parámetros
  const uri = `${PROTOCOLO_EMPRESA}actualizar?${params.toString()}`;
  
  console.log("Ejecutando protocolo con parámetros:", uri);
  window.location.href = uri;
}

// ============ COMPONENTES AUXILIARES ============

/**
 * Componente de área de carga de archivos con drag-and-drop - Moderno
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
              sx={{ mb: 2, fontSize: { xs: "0.9rem", sm: "1rem" }, color: "#666" }}
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
              onClick={handleButtonClick}
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

/**
 * Componente para mostrar información de la factura extraída
 * Diseño limpio tipo tarjeta según imagen de referencia
 */
function InvoiceInfoCard({ datosFactura }: { datosFactura: DatosFacturaPDF }) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid #e8eaed",
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
    >
      {/* ── Cabecera: Factura | Fecha ── PDF filename ── */}
      <Box
        sx={{
          display: "flex",
          backgroundColor: "#E8F0FE",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 1.75,
          borderBottom: "1px solid #e8eaed",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0 }}>
          <CalendarToday sx={{ fontSize: 15, color: "#888", mr: 0.75 }} />
          <Typography variant="body2" sx={{ color: "#555" }}>
            <strong> FECHA EMISIÓN: </strong>{formatDate(datosFactura.fechaEmision)}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0 }}>
          <EventBusy sx={{ fontSize: 15, color: "#888", mr: 0.75 }} />
           <Typography variant="body2" sx={{ color: "#555" }}>
            <strong> FECHA VENCIMIENTO: </strong> {formatDate(datosFactura.fechaVencimiento)}
          </Typography>
        </Box>

        {datosFactura.archivo?.nombre && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75,}}>
            <Description sx={{ fontSize: 15, color: "#888" }} />
            <Typography
              variant="body2"
              sx={{ color: "#666", fontSize: "0.8rem", fontFamily: "monospace" }}
            >
              {datosFactura.archivo.nombre}
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Sección proveedor ── */}
      <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid #e8eaed" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Ícono empresa */}
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "12px",
              backgroundColor: "#e8f0fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Store sx={{ fontSize: 24, color: "#004680" }} />
          </Box>

          <Box>
            <Typography
              variant="overline"
              sx={{ color: "#888", fontSize: "0.65rem", letterSpacing: 1.2, lineHeight: 1.2, display: "block" }}
            >
              Proveedor
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3, fontSize: "1.15rem" }}
            >
              {datosFactura.proveedor.nombre}
            </Typography>
            {/* Badges: Factura + NIF */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
              {/* Badge Factura */}
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  backgroundColor: "#f0f4f8",
                  borderRadius: "6px",
                  px: 1.25,
                  py: 0.35,
                  border: "1px solid #e0e6ef",
                }}
              >
                <Typography variant="caption" sx={{ color: "#444", fontWeight: 600, fontSize: "0.75rem" }}>
                  Factura&nbsp;
                </Typography>
                <Typography variant="caption" sx={{ color: "#004680", fontWeight: 800, fontSize: "0.75rem" }}>
                  {datosFactura.numeroFactura || "Sin número"}
                </Typography>
              </Box>

              {/* Badge NIF */}
              {datosFactura.proveedor.nif && (
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    backgroundColor: "#f0f4f8",
                    borderRadius: "6px",
                    px: 1.25,
                    py: 0.35,
                    border: "1px solid #e0e6ef",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#444", fontWeight: 600, fontSize: "0.75rem" }}>
                    NIF&nbsp;
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#1a1a1a", fontWeight: 700, fontSize: "0.75rem" }}>
                    {datosFactura.proveedor.nif}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── Conceptos (si existen) ── */}
      {datosFactura.conceptos.length > 0 && (
        <Box sx={{ borderBottom: "1px solid #e8eaed" }}>
          <Box sx={{ px: 3, py: 1.5, borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 1 }}>
            <Receipt sx={{ fontSize: 16, color: "#004680" }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1a1a1a" }}>
              Conceptos
            </Typography>
            <Chip
              label={`${datosFactura.conceptos.length} items`}
              size="small"
              sx={{ ml: "auto", backgroundColor: "#f0f4f8", color: "#004680", fontWeight: 600, fontSize: "0.7rem", height: 22 }}
            />
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#fafafa" }}>
                  <TableCell sx={{ fontWeight: 600, color: "#888", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: 0.5, py: 1.25, borderBottom: "1px solid #eee" }}>Descripción</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: "#888", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: 0.5, py: 1.25, borderBottom: "1px solid #eee" }}>Cant.</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: "#888", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: 0.5, py: 1.25, borderBottom: "1px solid #eee" }}>P. Unit.</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: "#888", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: 0.5, py: 1.25, borderBottom: "1px solid #eee" }}>Importe</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datosFactura.conceptos.map((concepto, index) => (
                  <TableRow key={index} sx={{ "&:hover": { backgroundColor: "#f8fafc" } }}>
                    <TableCell sx={{ py: 1.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: "#1a1a1a" }}>{concepto.descripcion}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Typography variant="body2" sx={{ color: "#555" }}>{concepto.cantidad.toLocaleString("es-ES")}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Typography variant="body2" sx={{ color: "#555" }}>{formatCurrency(concepto.precioUnitario, datosFactura.moneda)}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#1a1a1a" }}>{formatCurrency(concepto.importe, datosFactura.moneda)}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ── Impuestos + Resumen ── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        }}
      >
        {/* Desglose de impuestos */}
        <Box
          sx={{
            p: 3,
            borderRight: { md: "1px solid #e8eaed" },
            borderBottom: { xs: "1px solid #e8eaed", md: "none" },
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1a1a1a", mb: 2 }}>
            Desglose de Impuestos
          </Typography>

          {datosFactura.impuestos.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {datosFactura.impuestos.map((impuesto, index) => (
                <Box
                  key={`base-${index}`}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 1.25,
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    Base imponible ({impuesto.tipo}%)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#1a1a1a" }}>
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
                    alignItems: "center",
                    py: 1.25,
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    IVA {impuesto.tipo}%
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#1a1a1a" }}>
                    {formatCurrency(impuesto.importe, datosFactura.moneda)}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: "#aaa", fontStyle: "italic" }}>
              No se detectaron impuestos
            </Typography>
          )}
        </Box>

        {/* Resumen */}
        <Box sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1a1a1a", mb: 2 }}>
            Resumen
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                py: 1.25,
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <Typography variant="body2" sx={{ color: "#666" }}>Subtotal</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#1a1a1a" }}>
                {formatCurrency(datosFactura.subtotal, datosFactura.moneda)}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                py: 1.25,
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <Typography variant="body2" sx={{ color: "#666" }}>Total Impuestos</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#1a1a1a" }}>
                {formatCurrency(datosFactura.totalImpuestos, datosFactura.moneda)}
              </Typography>
            </Box>

            {/* TOTAL - fondo azul claro */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                py: 1.5,
                px: 2,
                mt: 1.5,
                backgroundColor: "#e8f0fe",
                borderRadius: "10px",
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 700, color: "#1a1a1a" }}>
                TOTAL
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#004680", fontSize: "1.25rem" }}>
                {formatCurrency(datosFactura.total, datosFactura.moneda)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

/**
 * Componente de feedback visual durante el procesamiento - Moderno
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
        gap: 3,
        py: 5,
      }}
    >
      <Box
        sx={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          backgroundColor: "#f0f4f8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 72,
            height: 72,
            borderRadius: "50%",
            border: "3px solid #e0e0e0",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 72,
            height: 72,
            borderRadius: "50%",
            border: "3px solid #004680",
            borderTopColor: "#fff",
            animation: "spin 1s linear infinite",
            "@keyframes spin": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(360deg)" },
            },
          }}
        />
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h6" sx={{ color: "#1a1a1a", fontWeight: 600, mb: 0.5 }}>
          {message}
        </Typography>
        <Typography variant="body2" sx={{ color: "#666" }}>
          Por favor espera mientras procesamos tu documento
        </Typography>
      </Box>
      <Box sx={{ width: "100%", maxWidth: 320 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: "#e0e0e0",
            "& .MuiLinearProgress-bar": {
              borderRadius: 3,
              backgroundColor: "#004680",
            },
          }}
        />
      </Box>
      <Typography variant="caption" sx={{ color: "#888" }}>
        {progress}% completado
      </Typography>
    </Box>
  );
}

/**
 * Componente de mensaje de error - Moderno
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
            <IconButton color="inherit" size="small" onClick={onRetry} sx={{ "&:hover": { backgroundColor: "rgba(244, 67, 54, 0.1)" } }}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cerrar">
            <IconButton color="inherit" size="small" onClick={onClear} sx={{ "&:hover": { backgroundColor: "rgba(244, 67, 54, 0.1)" } }}>
              <Close />
            </IconButton>
          </Tooltip>
        </Box>
      }
    >
      <AlertTitle sx={{ fontWeight: 600, color: "#c62828" }}>{errorInfo.title}</AlertTitle>
      <Typography variant="body2" sx={{ mb: 1, color: "#333" }}>
        {errorInfo.message}
      </Typography>
      <Typography variant="caption" sx={{ color: "#666" }}>
        <strong>Sugerencia:</strong> {errorInfo.suggestion}
      </Typography>
    </Alert>
  );
}

/**
 * Componente de éxito - Moderno
 */
function SuccessDisplay({ onNewFile }: { onNewFile: () => void }) {
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
          Los datos de la factura han sido procesados y están listos para revisión.
        </Typography>
      </Box>
    </Alert>
  );
}

// ============ COMPONENTE DE CONFIGURACIÓN OLLAMA - MODERNO ============

/**
 * Componente para configurar Ollama - Moderno
 */
function OllamaConfigPanel({
  modeloActual,
  onModeloChange,
  modelosDisponibles,
  cargandoModelos,
  conexionError,
}: {
  modeloActual: string;
  onModeloChange: (modelo: string) => void;
  modelosDisponibles: string[];
  cargandoModelos: boolean;
  conexionError: boolean;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: conexionError ? "#ffcdd2" : "#e0e0e0",
        p: 2.5,
        backgroundColor: conexionError ? "#fff5f5" : "#fafafa",
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 2 }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "10px",
            backgroundColor: conexionError ? "#ffebee" : "#e3f2fd",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SmartToy
            sx={{ color: conexionError ? "#c62828" : "#004680", fontSize: 22 }}
          />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#1a1a1a", lineHeight: 1.3 }}>
            Extracción con IA (Ollama)
          </Typography>
          <Typography variant="caption" sx={{ color: "#666" }}>
            Selecciona el modelo de visión para extraer datos
          </Typography>
        </Box>
      </Box>

      {/* Selector de modelo */}
      <FormControl size="small" sx={{ minWidth: 280, mt: 1 }}>
        <InputLabel id="modelo-select-label" sx={{ fontSize: "0.875rem" }}>Modelo de Visión</InputLabel>
        <Select
          labelId="modelo-select-label"
          value={
            modelosDisponibles.includes(modeloActual) ? modeloActual : ""
          }
          label="Modelo de Visión"
          onChange={(e) => onModeloChange(e.target.value)}
          disabled={
            cargandoModelos ||
            conexionError ||
            modelosDisponibles.length === 0
          }
          startAdornment={
            cargandoModelos ? (
              <CircularProgress size={16} sx={{ mr: 1, color: "#004680" }} />
            ) : null
          }
          sx={{
            backgroundColor: "white",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#ddd",
            },
          }}
        >
          {modelosDisponibles.length === 0 && !cargandoModelos ? (
            <MenuItem disabled value="">
              <Typography variant="body2" sx={{ color: "#888" }}>
                No hay modelos disponibles
              </Typography>
            </MenuItem>
          ) : (
            modelosDisponibles.map((modelo) => (
              <MenuItem key={modelo} value={modelo}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Inventory sx={{ fontSize: 16, color: "#666" }} />
                  <Typography variant="body2">{modelo}</Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {/* Información de estado */}
      {conexionError ? (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 1.5, backgroundColor: "#ffebee" }}>
          <Typography variant="caption" sx={{ color: "#c62828" }}>
            <strong>Error de conexión:</strong> No se puede conectar con Ollama.
            Asegúrate de que Ollama esté ejecutándose en{" "}
            <code style={{ backgroundColor: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: 4 }}>http://127.0.0.1:11434</code>
          </Typography>
        </Alert>
      ) : modelosDisponibles.length === 0 && !cargandoModelos ? (
        <Alert severity="warning" sx={{ mt: 2, borderRadius: 1.5, backgroundColor: "#fff8e1" }}>
          <Typography variant="caption" sx={{ color: "#f57c00" }}>
            <strong>Sin modelos:</strong> No se encontraron modelos de visión
            instalados. Descarga uno con:{" "}
            <code style={{ backgroundColor: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: 4 }}>ollama pull llama3.2-vision</code>
          </Typography>
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mt: 2, borderRadius: 1.5, backgroundColor: "#e3f2fd" }}>
          <Typography variant="caption" sx={{ color: "#1565c0" }}>
            <strong>Requisitos:</strong> Ollama debe estar ejecutándose en{" "}
            <code style={{ backgroundColor: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: 4 }}>http://127.0.0.1:11434</code>. Descarga el modelo con:{" "}
            <code style={{ backgroundColor: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: 4 }}>ollama pull {modeloActual}</code>
          </Typography>
        </Alert>
      )}
    </Paper>
  );
}

// ============ COMPONENTE PRINCIPAL ============

/**
 * Componente principal para carga y visualización de facturas PDF
 * Usa exclusivamente Ollama IA para la extracción
 */
export default function Home() {
  const [datosFactura, setDatosFactura] = useState<DatosFacturaPDF | null>(
    null,
  );
  const [modelosDisponibles, setModelosDisponibles] = useState<string[]>([]);
  const [cargandoModelos, setCargandoModelos] = useState(true);
  const [conexionError, setConexionError] = useState(false);

  // Hook de extracción Ollama
  const ollamaExtractor = useOllamaExtractor();

  // Cargar modelos disponibles al montar
  useEffect(() => {
    const cargarModelos = async () => {
      setCargandoModelos(true);
      setConexionError(false);
      try {
        const modelos = await ollamaExtractor.getModelosDisponibles();
        setModelosDisponibles(modelos);
        // Seleccionar el primer modelo disponible automáticamente
        if (modelos.length > 0 && !ollamaExtractor.modeloActual) {
          ollamaExtractor.setModelo(modelos[0]);
        }
      } catch {
        console.log("No se pudieron cargar los modelos de Ollama");
        setConexionError(true);
      } finally {
        setCargandoModelos(false);
      }
    };
    cargarModelos();
  }, []);

  const {
    extractData,
    isProcessing,
    error,
    progress,
    clearError,
    modeloActual,
  } = ollamaExtractor;

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (conexionError || modelosDisponibles.length === 0) {
        return;
      }
      try {
        const datos = await extractData(file);
        setDatosFactura(datos);
      } catch (err) {
        console.error("Error procesando archivo:", err);
      }
    },
    [extractData, conexionError, modelosDisponibles],
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
      ollamaExtractor.setModelo(modelo);
    },
    [ollamaExtractor],
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

  // Mensajes de procesamiento para Ollama
  const getMensajeProcesamiento = () => {
    if (progress < 30) return "Convirtiendo PDF a imagen...";
    if (progress < 50) return "Conectando con Ollama...";
    if (progress < 80) return "Analizando factura con IA...";
    return "Extrayendo datos...";
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {/* Header - Modern styling */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          pb: 2,
          borderBottom: "1px solid #eee",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              color: "#1a1a1a",
              fontSize: { xs: "1.5rem", sm: "2rem" },
              letterSpacing: "-0.02em",
            }}
          >
            Contabilización de Facturas
          </Typography>
          <Typography variant="body1" sx={{ mt: 0.5, color: "#666" }}>
            Sube tus facturas PDF para extraer y gestionar los datos automáticamente con IA
          </Typography>
        </Box>

        {/* Indicador de estado */}
        {estado !== "idle" && (
          <Chip
            icon={estado === "completado" ? <CheckCircle /> : <SmartToy />}
            label={ESTADO_CONFIG[estado].label}
            color={ESTADO_CONFIG[estado].color}
            sx={{
              fontWeight: 600,
              px: 1,
              "& .MuiChip-icon": {
                fontSize: 18,
              },
            }}
          />
        )}
      </Box>

      {/* Panel de configuración Ollama */}
      {estado === "idle" && (
        <OllamaConfigPanel
          modeloActual={modeloActual}
          onModeloChange={handleModeloChange}
          modelosDisponibles={modelosDisponibles}
          cargandoModelos={cargandoModelos}
          conexionError={conexionError}
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
              borderRadius: 2,
              border: "1px solid #eee",
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
              p: 2,
            }}
          >
            <ProcessingFeedback
              message={getMensajeProcesamiento()}
              progress={progress}
            />
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <InvoiceInfoCard datosFactura={datosFactura} />

            {/* Botones de acción */}
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                justifyContent: "flex-end",
                pt: 2.5,
                pb: 0.5,
              }}
            >
              <Button
                variant="outlined"
                onClick={handleNewFile}
                sx={{
                  borderRadius: 1.5,
                  textTransform: "none",
                  borderColor: "#d0d5dd",
                  color: "#444",
                  px: 3,
                  py: 1,
                  fontWeight: 500,
                  "&:hover": {
                    borderColor: "#999",
                    backgroundColor: "#f9f9f9",
                  },
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={() => ejecutarActualizarResolucion(datosFactura)}
                sx={{
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3.5,
                  py: 1,
                  backgroundColor: "#004680",
                  boxShadow: "0 2px 8px rgba(0, 70, 128, 0.3)",
                  "&:hover": {
                    backgroundColor: "#003d66",
                    boxShadow: "0 4px 12px rgba(0, 70, 128, 0.4)",
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