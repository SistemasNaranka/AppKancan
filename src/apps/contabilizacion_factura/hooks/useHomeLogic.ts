import { useState, useCallback } from "react";
import { useAuth } from "@/auth/hooks/useAuth";
import { useHybridExtractor } from "../hooks/useHybridExtractor";
import { DatosFacturaPDF, EstadoProceso, getNitSinDv } from "../types";
import {
  saveNitAutomatic,
  getAutomaticByNit,
  getSupplierByNit,
  getGoodsReceiptsBySupplierId,
  updateGoodsReceiptStatus,
} from "../services/api";
import { executeContabilizarFactura } from "../utils/contabilizacion";

export function useHomeLogic() {
  const [datosFactura, setDatosFactura] = useState<DatosFacturaPDF | null>(null);
  const [modalAutomaticoOpen, setModalAutomaticoOpen] = useState(false);
  const [nitActual, setNitActual] = useState<string | null>(null);
  const [, setGuardandoAutomatico] = useState(false);
  const [, setAutomaticoAsignado] = useState<string | null>(null);
  const [entradas, setEntradas] = useState<any[]>([]);
  const [entradaSeleccionada, setEntradaSeleccionada] = useState<string>("");
  const [modalEntradasOpen, setModalEntradasOpen] = useState(false);
  const [modalNoEntradasOpen, setModalNoEntradasOpen] = useState(false);
  const [modalConfirmUltraOpen, setModalConfirmUltraOpen] = useState(false);
  const [protocoloLanzado, setProtocoloLanzado] = useState(false);

  // Estados para el progreso y WebSocket de causación
  const [causacionProgressOpen, setCausacionProgressOpen] = useState(false);
  const [causacionEntryId, setCausacionEntryId] = useState<number | null>(null);
  const [causacionEntryNumber, setCausacionEntryNumber] = useState<string | null>(null);

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

  // Obtener usuario autenticado para acceder a sus modelos de IA y validar su API key de Gemini
  const { user } = useAuth();
  const modelosIA = user?.models_ia;
  const geminiApiKey = user?.ia_key;

  // Hook de extracción (Gemini con fallback entre modelos)
  const hybridExtractor = useHybridExtractor(modelosIA);

  const {
    extractData,
    isProcessing,
    error,
    progress,
    clearError,
    estadoHibrido,
  } = hybridExtractor;

  const handleEntradaChange = useCallback((documentNumber: string) => {
    setEntradaSeleccionada(documentNumber);
    setDatosFactura((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        entrada: documentNumber,
      };
    });
  }, []);

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!geminiApiKey) {
        setNotification({
          open: true,
          message: "Error: No tienes una API key de Gemini configurada.",
          severity: "error",
        });
        return;
      }
      try {
        // Limpiar automático y entradas previas
        setAutomaticoAsignado(null);
        setEntradas([]);
        setEntradaSeleccionada("");

        const datos = await extractData(file);
        let entries: any[] = [];
        let selectedEntry = "";

        // Verificar si el NIT ya tiene un automático asignado y buscar entradas de mercancía
        if (datos.proveedor.nif) {
          const nitSinDv = getNitSinDv(datos.proveedor.nif);
          
          // 1. Obtener automático
          const proveedorData = await getAutomaticByNit(nitSinDv);
          if (proveedorData && proveedorData.automatic) {
            datos.automaticoAsignado = proveedorData.automatic;
            setAutomaticoAsignado(proveedorData.automatic);
          }

          // Guardar NIT actual para posibles avisos
          setNitActual(nitSinDv);

          // 2. Buscar en acc_suppliers y luego en acc_goods_receipts
          try {
            const supplier = await getSupplierByNit(nitSinDv);
            if (supplier && supplier.id) {
              const goodsReceipts = await getGoodsReceiptsBySupplierId(supplier.id);
              // Filtrar para mostrar solo las entradas en estado 'pendiente'
              const pendingGoodsReceipts = (goodsReceipts || []).filter(
                (gr) => gr.status === "pendiente"
              );
              
              if (pendingGoodsReceipts && pendingGoodsReceipts.length > 0) {
                entries = pendingGoodsReceipts;
                if (pendingGoodsReceipts.length === 1) {
                  // Si solo hay una, asignarla por defecto
                  selectedEntry = pendingGoodsReceipts[0].document_number;
                  datos.entrada = selectedEntry;
                } else {
                  // Si hay varias, abrir el modal emergente de selección
                  setModalEntradasOpen(true);
                }
              } else {
                // Si existe el proveedor pero no tiene entradas habilitadas en estado 'pendiente'
                setModalNoEntradasOpen(true);
              }
            } else {
              // Si no existe el proveedor en acc_suppliers, tampoco tiene entradas vinculadas
              setModalNoEntradasOpen(true);
            }
          } catch (apiErr) {
            console.error("Error al buscar proveedor o entradas:", apiErr);
            setModalNoEntradasOpen(true);
          }
        }

        setEntradas(entries);
        setEntradaSeleccionada(selectedEntry);
        setDatosFactura(datos);
      } catch (err) {
        console.error("Error procesando archivo:", err);
      }
    },
    [extractData, geminiApiKey],
  );

  const handleRetry = useCallback(() => {
    clearError();
  }, [clearError]);

  const handleClear = useCallback(() => {
    clearError();
    setDatosFactura(null);
    setEntradas([]);
    setEntradaSeleccionada("");
    setModalNoEntradasOpen(false);
    setProtocoloLanzado(false);
  }, [clearError]);

  const handleNewFile = useCallback(() => {
    setDatosFactura(null);
    clearError();
    setEntradas([]);
    setEntradaSeleccionada("");
    setModalNoEntradasOpen(false);
    setProtocoloLanzado(false);
  }, [clearError]);

  // Función auxiliar para actualizar el estado de la entrada de mercancías y luego contabilizar la factura
  const handleContabilizar = useCallback(async (datos: DatosFacturaPDF) => {
    const docNumber = datos.entrada || entradaSeleccionada;
    if (docNumber) {
      const entryObj = entradas.find((e) => e.document_number === docNumber);
      if (entryObj && entryObj.id) {
        setCausacionEntryId(entryObj.id);
        setCausacionEntryNumber(entryObj.document_number);
        try {
          await updateGoodsReceiptStatus(entryObj.id, "en_proceso");
          console.log(`Estado de entrada #${docNumber} actualizado a 'en_proceso'`);
        } catch (err) {
          console.error("Error al actualizar estado de la entrada:", err);
        }
      }
    }
    executeContabilizarFactura(datos);
    setCausacionProgressOpen(true);
  }, [entradas, entradaSeleccionada]);

  const handleCausacionSuccess = useCallback(() => {
    setNotification({
      open: true,
      message: "¡Factura contabilizada con éxito!",
      severity: "success",
    });
    handleNewFile();
  }, [handleNewFile]);

  const handleCausacionFailure = useCallback((message: string) => {
    setNotification({
      open: true,
      message: `Error en causación: ${message}`,
      severity: "error",
    });
  }, []);

  // Función para manejar el botón Actualizar Resolución con verificación de NIT
  const handleUpdateResolution = useCallback(async () => {
    if (!datosFactura) return;

    // Si no hay NIT ni nombre, NO permitir actualizar - requiere validación obligatoria
    if (!datosFactura.proveedor.nif || !datosFactura.proveedor.nombre) {
      setNotification({
        open: true,
        message:
          "Error: Se requiere NIT y nombre del proveedor para actualizar la resolución",
        severity: "error",
      });
      return;
    }

    try {
      // Verificar si existe un proveedor con ese NIT (el NIT sin DV es el identificador único)
      const nitString = getNitSinDv(datosFactura.proveedor.nif);

      const proveedorExistente = await getAutomaticByNit(nitString);

      if (proveedorExistente && proveedorExistente.automatic) {
        // El proveedor YA EXISTE - usar automático existente sin abrir modal
        console.log(
          "Proveedor encontrado por NIT sin DV, usando automático:",
          proveedorExistente.automatic,
        );
        const nuevosDatos = {
          ...datosFactura,
          automaticoAsignado: proveedorExistente.automatic,
          entrada: datosFactura.entrada || entradaSeleccionada || undefined,
        };
        setAutomaticoAsignado(proveedorExistente.automatic);
        setDatosFactura(nuevosDatos);
        // Abrir modal de confirmación de Ultra
        setModalConfirmUltraOpen(true);
      } else {
        // El proveedor NO EXISTE - abrir modal para registrar el automático
        setNitActual(nitString);
        setModalAutomaticoOpen(true);
      }
    } catch (error) {
      console.error("Error al verificar proveedor:", error);
      // En caso de error de conexión, NO permitir continuar sin validación
      setNotification({
        open: true,
        message:
          "Error de conexión. No se puede proceder sin validar el proveedor en la base de datos.",
        severity: "error",
      });
    }
  }, [datosFactura, handleContabilizar, entradaSeleccionada]);

  // Función para guardar el número automático y ejecutar
  const handleSaveAutomatic = useCallback(
    async (automatico: string) => {
      if (!nitActual || !datosFactura) return;

      const nombreProveedor = datosFactura.proveedor.nombre;
      const nitProveedor = getNitSinDv(nitActual);

      // Debug: verificar que el nombre llega correctamente
      console.log("Datos a guardar:", {
        nit: nitProveedor,
        automatico,
        nombreProveedor,
        numeroFactura: datosFactura.numeroFactura,
        valorFactura: datosFactura.total,
      });

      setGuardandoAutomatico(true);
      try {
        // Guardar con datos adicionales del proveedor
        await saveNitAutomatic(
          String(nitProveedor).trim(),
          String(automatico).trim(),
          String(nombreProveedor).trim(),
          datosFactura.numeroFactura,
          datosFactura.total,
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
        const nuevosDatos = {
          ...datosFactura,
          automaticoAsignado: automatico,
          entrada: datosFactura.entrada || entradaSeleccionada || undefined,
        };
        setDatosFactura(nuevosDatos);

        // Abrir modal de confirmación de Ultra
        setModalConfirmUltraOpen(true);
      } catch (error) {
        console.error("Error al guardar automático:", error);
        // Mostrar notificación de error
        setNotification({
          open: true,
          message: "Error al guardar el registro. Por favor, intenta de nuevo.",
          severity: "error",
        });
      } finally {
        setGuardandoAutomatico(false);
      }
    },
    [nitActual, datosFactura, handleContabilizar, entradaSeleccionada],
  );

  // Función para cerrar notificaciones
  const handleCloseNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, open: false }));
  }, []);

  // Determinar estado basado en el hook
  const getStatus = useCallback((): EstadoProceso => {
    if (isProcessing) {
      if (progress < 30) return "cargando";
      if (progress < 70) return "procesando";
      if (progress < 90) return "validando";
      return "procesando";
    }
    if (error) return "error";
    if (datosFactura) return "completado";
    return "idle";
  }, [isProcessing, progress, error, datosFactura]);

  // Función para obtener mensaje de procesamiento según el progreso
  const getProcessingMessage = useCallback((): string => {
    if (progress < 15) return "Validando archivo PDF...";
    if (progress < 25) return "Preparando documento...";
    if (progress < 35) return "Conectando con Google Gemini...";
    if (progress < 50) return "Enviando documento a la IA...";
    if (progress < 65) return "Analizando factura con IA...";
    if (progress < 80) return "Procesando respuesta JSON...";
    if (progress < 95) return "Validando datos extraídos...";
    return "¡Extracción completada!";
  }, [progress]);

  const estado = getStatus();

  return {
    datosFactura,
    setDatosFactura,
    modalAutomaticoOpen,
    setModalAutomaticoOpen,
    nitActual,
    entradas,
    entradaSeleccionada,
    modalEntradasOpen,
    setModalEntradasOpen,
    modalNoEntradasOpen,
    setModalNoEntradasOpen,
    modalConfirmUltraOpen,
    setModalConfirmUltraOpen,
    protocoloLanzado,
    setProtocoloLanzado,
    causacionProgressOpen,
    setCausacionProgressOpen,
    causacionEntryId,
    causacionEntryNumber,
    handleCausacionSuccess,
    handleCausacionFailure,
    notification,
    handleCloseNotification,
    isProcessing,
    progress,
    error,
    estadoHibrido,
    geminiApiKey,
    modelosIA,
    estado,
    handleEntradaChange,
    handleFileSelected,
    handleRetry,
    handleClear,
    handleNewFile,
    handleContabilizar,
    handleUpdateResolution,
    handleSaveAutomatic,
    getProcessingMessage,
  };
}
