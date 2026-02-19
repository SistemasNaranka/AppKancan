/**
 * Hook para extracción de datos de facturas PDF usando Ollama IA
 * Convierte el PDF a imagen y usa un modelo de visión para extraer datos
 * Usa la librería oficial de Ollama para JavaScript
 */

import { useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import ollama from "ollama/browser";
import { DatosFacturaPDF, ErrorProcesamientoPDF, TipoErrorPDF } from "../types";

// Configurar worker de pdfjs-dist usando el worker del paquete
// @ts-ignore - Vite manejará la importación del worker
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Prompt para extracción de datos de factura
const PROMPT_EXTRACCION = `Analiza esta factura y extrae la siguiente información en formato JSON:
{
    "nit_proveedor": "NIT o identificación fiscal del proveedor",
    "numero_factura": "Número de factura",
    "valor_total": "Valor total de la factura (solo el número, sin símbolos de moneda)",
    "fecha_emision": "Fecha de emisión en formato YYYY-MM-DD",
    "fecha_vencimiento": "Fecha de vencimiento de la factura",
    "nombre_proveedor": "Nombre o razón social del proveedor",
    "subtotal": "Subtotal antes de impuestos (solo el número)",
    "impuestos": "Valor de impuestos (solo el número)",
    "moneda": "Código de moneda ISO (ej: COP, EUR, USD)"

}

IMPORTANTE:
- Devuelve SOLO el JSON puro, sin texto adicional ni bloques de código.
- Si no puedes encontrar algún campo, usa null como valor.
- Los valores numéricos deben ser números sin comas ni puntos como separadores de miles.
- Asegúrate de que el JSON sea válido.`;

/**
 * Respuesta esperada de Ollama
 */
interface RespuestaOllama {
  nit_proveedor: string | null;
  numero_factura: string | null;
  valor_total: number | null;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  nombre_proveedor: string | null;
  subtotal: number | null;
  impuestos: number | null;
  moneda: string | null;
}

/**
 * Hook principal para extracción de PDF con Ollama
 */
export function useOllamaExtractor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<ErrorProcesamientoPDF | null>(null);
  const [progress, setProgress] = useState(0);
  const [modeloActual, setModeloActual] = useState<string>("");

  /**
   * Convierte una página del PDF a imagen (base64)
   */
  const convertPDFToImage = useCallback(
    async (file: File): Promise<{ base64: string; numPages: number }> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;

            // Cargar el documento PDF
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer })
              .promise;
            const numPages = pdf.numPages;

            // Obtener la primera página
            const page = await pdf.getPage(1);

            // Configurar escala para buena calidad
            const scale = 2.0;
            const viewport = page.getViewport({ scale });

            // Crear canvas para renderizar
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            if (!context) {
              throw new Error("No se pudo crear el contexto del canvas");
            }

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            // Renderizar la página
            await page.render({
              canvasContext: context,
              viewport: viewport,
              canvas: canvas,
            }).promise;

            // Convertir a base64 (sin el prefijo data:image/png;base64,)
            const base64 = canvas.toDataURL("image/png").split(",")[1];

            resolve({ base64, numPages });
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error("Error al leer el archivo"));
        reader.readAsArrayBuffer(file);
      });
    },
    [],
  );

  /**
   * Limpia y parsea la respuesta de Ollama
   */
  const parseOllamaResponse = useCallback(
    (response: string): RespuestaOllama => {
      // Intentar extraer JSON de la respuesta
      let jsonStr = response.trim();

      // Si la respuesta tiene bloques de código markdown, extraer el contenido
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      // Intentar parsear el JSON
      try {
        return JSON.parse(jsonStr);
      } catch {
        // Si falla, intentar encontrar un objeto JSON en el texto
        const jsonObjectMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          try {
            return JSON.parse(jsonObjectMatch[0]);
          } catch {
            throw new Error("No se pudo parsear la respuesta de Ollama");
          }
        }
        throw new Error("No se encontró JSON válido en la respuesta");
      }
    },
    [],
  );

  /**
   * Procesa un archivo PDF y extrae los datos usando Ollama
   */
  const extractData = useCallback(
    async (file: File): Promise<DatosFacturaPDF> => {
      setIsProcessing(true);
      setError(null);
      setProgress(0);

      try {
        // Paso 1: Validar archivo
        if (!file || file.size === 0) {
          throw createError(
            "archivo_invalido",
            "El archivo no es válido o está vacío",
          );
        }
        setProgress(5);

        // Paso 2: Validar tipo MIME
        const validTypes = ["application/pdf", "application/x-pdf"];
        if (
          !validTypes.includes(file.type) &&
          !file.name.toLowerCase().endsWith(".pdf")
        ) {
          throw createError(
            "archivo_invalido",
            "El archivo debe ser un PDF válido",
          );
        }
        setProgress(10);

        // Paso 3: Verificar que hay un modelo seleccionado
        if (!modeloActual) {
          throw createError(
            "error_desconocido",
            "No hay un modelo seleccionado. Por favor, selecciona un modelo de visión de Ollama.",
          );
        }
        setProgress(15);

        // Paso 4: Convertir PDF a imagen
        setProgress(20);
        const { base64, numPages } = await convertPDFToImage(file);
        setProgress(40);

        // Paso 5: Enviar a Ollama para procesamiento usando la librería oficial
        setProgress(50);

        let response: string;
        try {
          const result = await ollama.generate({
            model: modeloActual,
            prompt: PROMPT_EXTRACCION,
            images: [base64],
            format: "json",
            stream: false,
          });
          response = result.response;
        } catch (ollamaError) {
          const errorMsg =
            ollamaError instanceof Error
              ? ollamaError.message
              : "Error desconocido";
          if (
            errorMsg.includes("Failed to fetch") ||
            errorMsg.includes("NetworkError") ||
            errorMsg.includes("ECONNREFUSED")
          ) {
            throw createError(
              "error_desconocido",
              "No se puede conectar con Ollama. Asegúrate de que Ollama esté ejecutándose en http://127.0.0.1:11434",
            );
          }
          if (errorMsg.includes("model") || errorMsg.includes("not found")) {
            throw createError(
              "error_desconocido",
              `El modelo '${modeloActual}' no está disponible. Ejecuta 'ollama pull ${modeloActual}' para descargarlo.`,
            );
          }
          throw createError(
            "extraccion_fallida",
            `Error de Ollama: ${errorMsg}`,
          );
        }

        setProgress(80);

        // Paso 6: Parsear respuesta
        const datosOllama = parseOllamaResponse(response);
        setProgress(90);

        // Paso 7: Construir objeto DatosFacturaPDF
        const datosFactura: DatosFacturaPDF = {
          numeroFactura: datosOllama.numero_factura || "Sin número",
          fechaEmision: datosOllama.fecha_emision || new Date().toISOString(),
          fechaVencimiento: datosOllama.fecha_vencimiento || new Date().toISOString(),
          proveedor: {
            nombre: datosOllama.nombre_proveedor || "Proveedor no identificado",
            nif: datosOllama.nit_proveedor || undefined,
          },
          conceptos: [], // Ollama no extrae conceptos individuales por ahora
          impuestos: datosOllama.impuestos
            ? [
                {
                  base:
                    datosOllama.subtotal ||
                    (datosOllama.valor_total || 0) / 1.19,
                  tipo: 19, // IVA Colombia por defecto
                  importe: datosOllama.impuestos,
                },
              ]
            : [],
          subtotal: datosOllama.subtotal || 0,
          totalImpuestos: datosOllama.impuestos || 0,
          total: datosOllama.valor_total || 0,
          moneda: datosOllama.moneda || "COP",
          archivo: {
            nombre: file.name,
            tamaño: file.size,
            fechaCarga: new Date().toISOString(),
          },
        };

        // Validar que se extrajeron datos mínimos
        if (
          !datosOllama.numero_factura &&
          !datosOllama.nit_proveedor &&
          !datosOllama.valor_total
        ) {
          throw createError(
            "datos_incompletos",
            "No se pudieron extraer datos de la factura. Verifica que el documento sea una factura válida.",
          );
        }

        setProgress(100);
        return datosFactura;
      } catch (err) {
        const processingError = handleError(err);
        setError(processingError);
        throw processingError;
      } finally {
        setIsProcessing(false);
      }
    },
    [convertPDFToImage, parseOllamaResponse, modeloActual],
  );

  /**
   * Cambia el modelo de Ollama a usar
   */
  const setModelo = useCallback((modelo: string) => {
    setModeloActual(modelo);
  }, []);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setError(null);
    setProgress(0);
  }, []);

  /**
   * Obtiene la lista de modelos disponibles en Ollama
   */
  const getModelosDisponibles = useCallback(async (): Promise<string[]> => {
    try {
      const response = await ollama.list();
      return response.models.map((m) => m.name);
    } catch (error) {
      console.warn("Error al obtener modelos de Ollama:", error);
      return [];
    }
  }, []);

  return {
    extractData,
    isProcessing,
    error,
    progress,
    clearError,
    modeloActual,
    setModelo,
    getModelosDisponibles,
  };
}

// ============ FUNCIONES AUXILIARES ============

function createError(
  tipo: TipoErrorPDF,
  mensaje: string,
): ErrorProcesamientoPDF {
  return {
    tipo,
    mensaje,
    detalles: undefined,
  };
}

function handleError(err: unknown): ErrorProcesamientoPDF {
  if (isErrorProcesamientoPDF(err)) {
    return err;
  }

  const errorMessage = err instanceof Error ? err.message : "Error desconocido";

  if (errorMessage.includes("password") || errorMessage.includes("protegido")) {
    return createError("pdf_protegido", "El PDF está protegido con contraseña");
  }

  if (errorMessage.includes("archivo")) {
    return createError("archivo_invalido", errorMessage);
  }

  if (errorMessage.includes("Ollama") || errorMessage.includes("connection")) {
    return createError("error_desconocido", errorMessage);
  }

  return createError(
    "error_desconocido",
    `Ocurrió un error durante el procesamiento: ${errorMessage}`,
  );
}

function isErrorProcesamientoPDF(err: unknown): err is ErrorProcesamientoPDF {
  return (
    typeof err === "object" && err !== null && "tipo" in err && "mensaje" in err
  );
}

export default useOllamaExtractor;
