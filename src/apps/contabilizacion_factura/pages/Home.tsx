/**
 * Página principal para carga y visualización de facturas PDF
 * Módulo de Contabilización de Facturas
 * Integrado con Google Gemini y Ollama como fallback
 * La API key y modelo de IA se obtienen del usuario autenticado (campos key_gemini y modelo_ia en Directus)
 */

import { useState, useCallback, useEffect } from "react";
import { Box, Typography, Paper, Button, Chip, Alert, Snackbar } from "@mui/material";
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
import { AutomaticoModal } from "../components/AutomaticoModal";

// Utilidades y tipos
import { DatosFacturaPDF, EstadoProceso } from "../types";
import {
  ESTADO_CONFIG,
  ejecutarActualizarResolucion,
} from "../utils/resolucion";

// API
import { saveNitAutomatico, getAutomaticoByNit } from "../services/api";

export default function Home() {
  const [datosFactura, setDatosFactura] = useState<DatosFacturaPDF | null>(
    null,
  );
  const [modelosDisponibles, setModelosDisponibles] = useState<string[]>([]);
  const [cargandoModelos, setCargandoModelos] = useState(true);
  const [conexionErrorOllama, setConexionErrorOllama] = useState(false);
  const [modalAutomaticoOpen, setModalAutomaticoOpen] = useState(false);
  const [nitActual, setNitActual] = useState<string | null>(null);
  const [guardandoAutomatico, setGuardandoAutomatico] = useState(false);
  const [automaticoAsignado, setAutomaticoAsignado] = useState<string | null>(null);

  // Estados para notificaciones
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

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
        // Limpiar automático asignado previamente
        setAutomaticoAsignado(null);
        
        const datos = await extractData(file);
        
        // Verificar si el NIT ya tiene un automático asignado
        if (datos.proveedor.nif) {
          const proveedorData = await getAutomaticoByNit(datos.proveedor.nif);
          if (proveedorData && proveedorData.automatico) {
            datos.automaticoAsignado = proveedorData.automatico;
            setAutomaticoAsignado(proveedorData.automatico);
          }
        }
        
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

  // Función para manejar el botón Actualizar Resolución con verificación de NIT
  const handleActualizarResolucion = useCallback(async () => {
    if (!datosFactura) return;

    // Si no hay NIT ni nombre, NO permitir actualizar - requiere validación obligatoria
    if (!datosFactura.proveedor.nif || !datosFactura.proveedor.nombre) {
      setNotification({
        open: true,
        message: "Error: Se requiere NIT y nombre del proveedor para actualizar la resolución",
        severity: "error",
      });
      return;
    }

    try {
      // Verificar si existe un proveedor con ese NIT (el NIT es el identificador único)
      const nitString = String(datosFactura.proveedor.nif).trim();

      const proveedorExistente = await getAutomaticoByNit(nitString);

      if (proveedorExistente && proveedorExistente.automatico) {
        // El proveedor YA EXISTE - usar automático existente sin abrir modal
        console.log("Proveedor encontrado por NIT, usando automático:", proveedorExistente.automatico);
        datosFactura.automaticoAsignado = proveedorExistente.automatico;
        setAutomaticoAsignado(proveedorExistente.automatico);

        setNotification({
          open: true,
          message: `Proveedor reconocido (NIT: ${nitString}), usando automático existente: ${proveedorExistente.automatico}`,
          severity: "success",
        });

        ejecutarActualizarResolucion(datosFactura);
      } else {
        // El proveedor NO EXISTE - abrir modal para registrar el automático
        setNitActual(datosFactura.proveedor.nif);
        setModalAutomaticoOpen(true);
      }
    } catch (error) {
      console.error("Error al verificar proveedor:", error);
      // En caso de error de conexión, NO permitir continuar sin validación
      setNotification({
        open: true,
        message: "Error de conexión. No se puede proceder sin validar el proveedor en la base de datos.",
        severity: "error",
      });
      // NO ejecutar la actualización - requiere validación obligatoria
    }
  }, [datosFactura]);

  // Función para guardar el número automático y ejecutar
  const handleGuardarAutomatico = useCallback(async (automatico: string) => {
    if (!nitActual || !datosFactura) return;

    const nombreProveedor = datosFactura.proveedor.nombre;
    const nitProveedor = nitActual;

    // Debug: verificar que el nombre llega correctamente
    console.log("Datos a guardar:", {
      nit: nitProveedor,
      automatico,
      nombreProveedor,
      numeroFactura: datosFactura.numeroFactura,
      valorFactura: datosFactura.total
    });

    setGuardandoAutomatico(true);
    try {
      // Guardar con datos adicionales del proveedor
      await saveNitAutomatico(
        String(nitProveedor).trim(),
        String(automatico).trim(),
        String(nombreProveedor).trim(),
        datosFactura.numeroFactura,
        datosFactura.total
      );
      
      // Éxito: Cerrar modal y continuar con el flujo
      setAutomaticoAsignado(automatico);
      setModalAutomaticoOpen(false);
      
      // Mostrar notificación de éxito
      setNotification({
        open: true,
        message: `Proveedor registrado exitosamente con automático: ${automatico}`,
        severity: "success",
      });
      
      // Actualizar datos factura con el automático asignado
      setDatosFactura({
        ...datosFactura,
        automaticoAsignado: automatico
      });
      
      // Ejecutar el programa corporativo
      ejecutarActualizarResolucion(datosFactura);
    } catch (error) {
      console.error("Error al guardar automático:", error);
      // Mostrar notificación de error
      setNotification({
        open: true,
        message: "Error al guardar el registro. Por favor, intenta de nuevo.",
        severity: "error",
      });
      // No cerrar el modal para que el usuario pueda intentar de nuevo
    } finally {
      setGuardandoAutomatico(false);
    }
  }, [nitActual, datosFactura]);

  // Función para cerrar notificaciones
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

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
                onClick={handleActualizarResolucion}
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

      {/* Modal para ingresar número automático cuando el NIT es nuevo */}
      <AutomaticoModal
        open={modalAutomaticoOpen}
        nit={nitActual}
        proveedorNombre={datosFactura?.proveedor.nombre}
        numeroFactura={datosFactura?.numeroFactura}
        onClose={() => setModalAutomaticoOpen(false)}
        onConfirm={handleGuardarAutomatico}
      />

      {/* Notificaciones */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}