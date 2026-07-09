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
  createSupplierInvoice,
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
  const [causacionProgressOpen, setCausacionProgressOpen] = useState(false);
  const [causacionEntryId, setCausacionEntryId] = useState<number | null>(null);
  const [causacionEntryNumber, setCausacionEntryNumber] = useState<string | null>(null);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [causacionInvoiceId, setCausacionInvoiceId] = useState<number | null>(null);

  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const { user } = useAuth();
  const modelosIA = user?.models_ia;
  const geminiApiKey = user?.ia_key;

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
        setAutomaticoAsignado(null);
        setEntradas([]);
        setEntradaSeleccionada("");

        const datos = await extractData(file);
        let entries: any[] = [];
        let selectedEntry = "";

        if (datos.proveedor.nif) {
          const nitSinDv = getNitSinDv(datos.proveedor.nif);
          
          const proveedorData = await getAutomaticByNit(nitSinDv);
          if (proveedorData && proveedorData.automatic) {
            datos.automaticoAsignado = proveedorData.automatic;
            setAutomaticoAsignado(proveedorData.automatic);
          }

          setNitActual(nitSinDv);

          try {
            const supplier = await getSupplierByNit(nitSinDv);
            if (supplier && supplier.id) {
              const goodsReceipts = await getGoodsReceiptsBySupplierId(supplier.id);
              const pendingGoodsReceipts = (goodsReceipts || []).filter(
                (gr) => gr.status === "pendiente"
              );
              
              if (pendingGoodsReceipts && pendingGoodsReceipts.length > 0) {
                entries = pendingGoodsReceipts;
                if (pendingGoodsReceipts.length === 1) {
                  selectedEntry = pendingGoodsReceipts[0].document_number;
                  datos.entrada = selectedEntry;
                } else {
                  setModalEntradasOpen(true);
                }
              } else {
                setModalNoEntradasOpen(true);
              }
            } else {
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

  const handleContabilizar = useCallback(async (datos: DatosFacturaPDF) => {
    let supplierId: number | null = null;
    let goodsReceiptId: number | null = null;

    if (datos.proveedor.nif) {
      const nitSinDv = getNitSinDv(datos.proveedor.nif);
      try {
        const supplier = await getSupplierByNit(nitSinDv);
        if (supplier && supplier.id) {
          supplierId = supplier.id;
        }
      } catch (err) {
        console.error("Error al buscar proveedor para registrar factura:", err);
      }
    }

    const docNumber = datos.entrada || entradaSeleccionada;
    if (docNumber) {
      const entryObj = entradas.find((e) => e.document_number === docNumber);
      if (entryObj && entryObj.id) {
        goodsReceiptId = entryObj.id;
        setCausacionEntryId(entryObj.id);
        setCausacionEntryNumber(entryObj.document_number);
        try {
          await updateGoodsReceiptStatus(entryObj.id, "en_proceso");
        } catch (err) {
          console.error("Error al actualizar estado de la entrada:", err);
        }
      }
    }

    if (!supplierId || !goodsReceiptId) {
      setNotification({
        open: true,
        message: "Error: No se pudo asociar el proveedor o la entrada de mercancía para registrar la factura.",
        severity: "error",
      });
      return;
    }

    try {
      const createdInvoice = await createSupplierInvoice({
        supplier_id: supplierId,
        goods_receipt_id: goodsReceiptId,
        raw_invoice_number: datos.numeroFactura,
        clean_invoice_number: datos.numeroSinPrefijo || datos.numeroFactura,
        invoice_date: datos.fechaEmision,
        due_date: datos.fechaVencimiento,
        net_amount: Number(datos.subtotal || 0),
        tax_amount: Number(datos.totalImpuestos || 0),
        total_amount: Number(datos.total || 0),
        status: "en_proceso",
      });

      if (createdInvoice && createdInvoice.id) {
        setCausacionInvoiceId(createdInvoice.id);
      }
    } catch (err) {
      console.error("Error al registrar factura en Directus:", err);
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

  const handleUpdateResolution = useCallback(async () => {
    if (!datosFactura) return;

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
      const nitString = getNitSinDv(datosFactura.proveedor.nif);

      const proveedorExistente = await getAutomaticByNit(nitString);

      if (proveedorExistente && proveedorExistente.automatic) {
        const nuevosDatos = {
          ...datosFactura,
          automaticoAsignado: proveedorExistente.automatic,
          entrada: datosFactura.entrada || entradaSeleccionada || undefined,
        };
        setAutomaticoAsignado(proveedorExistente.automatic);
        setDatosFactura(nuevosDatos);
        setModalConfirmUltraOpen(true);
      } else {
        setNitActual(nitString);
        setModalAutomaticoOpen(true);
      }
    } catch (error) {
      console.error("Error al verificar proveedor:", error);
      setNotification({
        open: true,
        message:
          "Error de conexión. No se puede proceder sin validar el proveedor en la base de datos.",
        severity: "error",
      });
    }
  }, [datosFactura, handleContabilizar, entradaSeleccionada]);

  const handleSaveAutomatic = useCallback(
    async (automatico: string) => {
      if (!nitActual || !datosFactura) return;

      const nombreProveedor = datosFactura.proveedor.nombre;
      const nitProveedor = getNitSinDv(nitActual);

      setGuardandoAutomatico(true);
      try {
        await saveNitAutomatic(
          String(nitProveedor).trim(),
          String(automatico).trim(),
          String(nombreProveedor).trim(),
          datosFactura.numeroFactura,
          datosFactura.total,
        );

        setAutomaticoAsignado(automatico);
        setModalAutomaticoOpen(false);

        setNotification({
          open: true,
          message: `Proveedor registrado exitosamente con automático: ${automatico}`,
          severity: "success",
        });

        const nuevosDatos = {
          ...datosFactura,
          automaticoAsignado: automatico,
          entrada: datosFactura.entrada || entradaSeleccionada || undefined,
        };
        setDatosFactura(nuevosDatos);

        setModalConfirmUltraOpen(true);
      } catch (error) {
        console.error("Error al guardar automático:", error);
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

  const handleCloseNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, open: false }));
  }, []);

  const handleRefreshData = useCallback(async () => {
    setIsRefreshingData(true);
    const cooldownPromise = new Promise((resolve) => setTimeout(resolve, 5000));

    try {
      if (datosFactura && datosFactura.proveedor.nif) {
        const nitSinDv = getNitSinDv(datosFactura.proveedor.nif);
        
        const proveedorData = await getAutomaticByNit(nitSinDv);
        let nuevoAutomatico = "";
        if (proveedorData && proveedorData.automatic) {
          nuevoAutomatico = proveedorData.automatic;
          setAutomaticoAsignado(proveedorData.automatic);
        }

        let entries: any[] = [];
        let selectedEntry = "";

        const supplier = await getSupplierByNit(nitSinDv);
        if (supplier && supplier.id) {
          const goodsReceipts = await getGoodsReceiptsBySupplierId(supplier.id);
          const pendingGoodsReceipts = (goodsReceipts || []).filter(
            (gr) => gr.status === "pendiente"
          );
          
          if (pendingGoodsReceipts && pendingGoodsReceipts.length > 0) {
            entries = pendingGoodsReceipts;
            if (pendingGoodsReceipts.length === 1) {
              selectedEntry = pendingGoodsReceipts[0].document_number;
            } else {
              setModalEntradasOpen(true);
            }
          } else {
            setModalNoEntradasOpen(true);
          }
        } else {
          setModalNoEntradasOpen(true);
        }

        setDatosFactura((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            automaticoAsignado: nuevoAutomatico || prev.automaticoAsignado,
            entrada: selectedEntry || prev.entrada,
          };
        });

        setEntradas(entries);
        setEntradaSeleccionada(selectedEntry);
      }
    } catch (err) {
      console.error("Error al refrescar datos:", err);
    } finally {
      await cooldownPromise;
      setIsRefreshingData(false);
    }
  }, [datosFactura]);

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
    isRefreshingData,
    handleRefreshData,
    causacionInvoiceId,
  };
}
