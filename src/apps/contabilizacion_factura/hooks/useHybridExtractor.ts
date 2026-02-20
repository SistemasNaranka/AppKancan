/**
 * Hook híbrido para extracción de datos de facturas PDF
 * Primero intenta con Google Gemini (gemma-3-27b-it)
 * Si falla, usa Ollama como fallback/contingencia
 *
 * La API key de Gemini se obtiene del usuario autenticado (campo key_gemini en Directus)
 */

import { useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import ollama from "ollama/browser";
import { GoogleGenAI } from "@google/genai";
import { DatosFacturaPDF, ErrorProcesamientoPDF, TipoErrorPDF } from "../types";

// Configurar worker de pdfjs-dist usando el worker del paquete
// @ts-ignore - Vite manejará la importación del worker
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Prompt para extracción de datos de factura (igual para ambos proveedores)
const PROMPT_EXTRACCION = `Analiza esta factura y extrae la siguiente información en formato JSON:
{
    "nit_proveedor": "NIT o identificación fiscal del proveedor",
    "numero_factura": "Número de factura",
    "valor_total": "Valor total de la factura (solo el número, sin símbolos de moneda)",
    "fecha_emision": "Fecha de emisión en formato YYYY-MM-DD",
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
 * Respuesta esperada de la IA
 */
interface RespuestaExtraccion {
  nit_proveedor: string | null;
  numero_factura: string | null;
  valor_total: number | null;
  fecha_emision: string | null;
  nombre_proveedor: string | null;
  subtotal: number | null;
  impuestos: number | null;
  moneda: string | null;
}

/**
 * Tipo de proveedor de IA utilizado
 */
export type ProveedorIA = "gemini" | "ollama" | null;

/**
 * Estado del procesamiento híbrido
 */
export interface EstadoHibrido {
  proveedorUsado: ProveedorIA;
  intentoGemini: boolean;
  intentoOllama: boolean;
  errorGemini: string | null;
  errorOllama: string | null;
}

/**
 * Hook principal para extracción de PDF con Gemini y fallback a Ollama
 * @param geminiApiKey - API key de Gemini obtenida del usuario autenticado (campo key_gemini en Directus)
 */
export function useHybridExtractor(geminiApiKey?: string) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<ErrorProcesamientoPDF | null>(null);
  const [progress, setProgress] = useState(0);
  const [modeloActual, setModeloActual] = useState<string>("");
  const [estadoHibrido, setEstadoHibrido] = useState<EstadoHibrido>({
    proveedorUsado: null,
    intentoGemini: false,
    intentoOllama: false,
    errorGemini: null,
    errorOllama: null,
  });

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
   * Convierte un archivo PDF a bytes para Gemini
   */
  const convertPDFToBytes = useCallback(
    async (file: File): Promise<Uint8Array> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          resolve(new Uint8Array(arrayBuffer));
        };
        reader.onerror = () =>
          reject(new Error("Error al leer el archivo PDF"));
        reader.readAsArrayBuffer(file);
      });
    },
    [],
  );

  /**
   * Limpia y parsea la respuesta de la IA
   */
  const parseResponse = useCallback((response: string): RespuestaExtraccion => {
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
          throw new Error("No se pudo parsear la respuesta de la IA");
        }
      }
      throw new Error("No se encontró JSON válido en la respuesta");
    }
  }, []);

  /**
   * Extrae datos usando Google Gemini
   */
  const extractWithGemini = useCallback(
    async (file: File): Promise<string> => {
      if (!geminiApiKey) {
        throw new Error("No hay API key de Gemini configurada para el usuario");
      }

      // Debug: verificar que la API key se está recibiendo
      console.log(
        "Gemini API Key recibida (primeros 10 caracteres):",
        geminiApiKey?.substring(0, 10) + "...",
      );
      console.log("Longitud de API Key:", geminiApiKey?.length);

      const ai = new GoogleGenAI({ apiKey: geminiApiKey });

      // Convertir PDF a bytes
      const pdfBytes = await convertPDFToBytes(file);

      try {
        // Convertir Uint8Array a base64 de forma segura (evita stack overflow con archivos grandes)
        let binary = "";
        const len = pdfBytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(pdfBytes[i]);
        }
        const base64Data = btoa(binary);

        // Usar el modelo gemma-3-27b-it
        const response = await ai.models.generateContent({
          model: "gemma-3-27b-it",
          contents: [
            {
              role: "user",
              parts: [
                { text: PROMPT_EXTRACCION },
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        });

        return response.text || "";
      } catch (geminiError) {
        const errorMsg =
          geminiError instanceof Error
            ? geminiError.message
            : "Error desconocido con Gemini";
        throw new Error(`Gemini: ${errorMsg}`);
      }
    },
    [convertPDFToBytes, geminiApiKey],
  );

  /**
   * Extrae datos usando Ollama (fallback)
   */
  const extractWithOllama = useCallback(
    async (file: File): Promise<string> => {
      if (!modeloActual) {
        throw new Error("No hay un modelo de Ollama seleccionado");
      }

      // Convertir PDF a imagen para Ollama
      const { base64 } = await convertPDFToImage(file);

      try {
        const result = await ollama.generate({
          model: modeloActual,
          prompt: PROMPT_EXTRACCION,
          images: [base64],
          format: "json",
          stream: false,
        });
        return result.response;
      } catch (ollamaError) {
        const errorMsg =
          ollamaError instanceof Error
            ? ollamaError.message
            : "Error desconocido con Ollama";
        throw new Error(`Ollama: ${errorMsg}`);
      }
    },
    [convertPDFToImage, modeloActual],
  );

  /**
   * Construye el objeto DatosFacturaPDF desde la respuesta parseada
   */
  const buildDatosFactura = useCallback(
    (datos: RespuestaExtraccion, file: File): DatosFacturaPDF => {
      return {
        numeroFactura: datos.numero_factura || "Sin número",
        fechaEmision: datos.fecha_emision || new Date().toISOString(),
        proveedor: {
          nombre: datos.nombre_proveedor || "Proveedor no identificado",
          nif: datos.nit_proveedor || undefined,
        },
        conceptos: [], // La IA no extrae conceptos individuales por ahora
        impuestos: datos.impuestos
          ? [
              {
                base: datos.subtotal || (datos.valor_total || 0) / 1.19,
                tipo: 19, // IVA Colombia por defecto
                importe: datos.impuestos,
              },
            ]
          : [],
        subtotal: datos.subtotal || 0,
        totalImpuestos: datos.impuestos || 0,
        total: datos.valor_total || 0,
        moneda: datos.moneda || "COP",
        archivo: {
          nombre: file.name,
          tamaño: file.size,
          fechaCarga: new Date().toISOString(),
        },
      };
    },
    [],
  );

  /**
   * Procesa un archivo PDF y extrae los datos usando Gemini con fallback a Ollama
   */
  const extractData = useCallback(
    async (file: File): Promise<DatosFacturaPDF> => {
      setIsProcessing(true);
      setError(null);
      setProgress(0);

      // Resetear estado híbrido
      const nuevoEstado: EstadoHibrido = {
        proveedorUsado: null,
        intentoGemini: false,
        intentoOllama: false,
        errorGemini: null,
        errorOllama: null,
      };
      setEstadoHibrido(nuevoEstado);

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

        // Paso 3: Intentar extracción con Gemini primero
        setProgress(20);
        let response: string;

        try {
          nuevoEstado.intentoGemini = true;
          setEstadoHibrido({ ...nuevoEstado });

          response = await extractWithGemini(file);
          nuevoEstado.proveedorUsado = "gemini";
          setEstadoHibrido({ ...nuevoEstado });
          setProgress(60);
        } catch (geminiError) {
          // Guardar error de Gemini
          const errorMsg =
            geminiError instanceof Error
              ? geminiError.message
              : "Error desconocido";
          nuevoEstado.errorGemini = errorMsg;
          setEstadoHibrido({ ...nuevoEstado });

          console.warn("Gemini falló, intentando con Ollama:", errorMsg);

          // Paso 4: Fallback a Ollama
          setProgress(40);
          nuevoEstado.intentoOllama = true;
          setEstadoHibrido({ ...nuevoEstado });

          try {
            response = await extractWithOllama(file);
            nuevoEstado.proveedorUsado = "ollama";
            setEstadoHibrido({ ...nuevoEstado });
            setProgress(60);
          } catch (ollamaError) {
            const ollamaErrorMsg =
              ollamaError instanceof Error
                ? ollamaError.message
                : "Error desconocido";
            nuevoEstado.errorOllama = ollamaErrorMsg;
            setEstadoHibrido({ ...nuevoEstado });

            // Ambos fallaron, lanzar error combinado
            throw createError(
              "extraccion_fallida",
              `Ambos proveedores fallaron:\n- Gemini: ${errorMsg}\n- Ollama: ${ollamaErrorMsg}`,
            );
          }
        }

        setProgress(70);

        // Paso 5: Parsear respuesta
        const datosExtraidos = parseResponse(response);
        setProgress(85);

        // Paso 6: Construir objeto DatosFacturaPDF
        const datosFactura = buildDatosFactura(datosExtraidos, file);
        setProgress(95);

        // Paso 7: Validar que se extrajeron datos mínimos
        if (
          !datosExtraidos.numero_factura &&
          !datosExtraidos.nit_proveedor &&
          !datosExtraidos.valor_total
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
    [extractWithGemini, extractWithOllama, parseResponse, buildDatosFactura],
  );

  /**
   * Cambia el modelo de Ollama a usar (para fallback)
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
    setEstadoHibrido({
      proveedorUsado: null,
      intentoGemini: false,
      intentoOllama: false,
      errorGemini: null,
      errorOllama: null,
    });
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
    estadoHibrido,
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

  if (
    errorMessage.includes("Gemini") ||
    errorMessage.includes("Ollama") ||
    errorMessage.includes("connection")
  ) {
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

export default useHybridExtractor;
