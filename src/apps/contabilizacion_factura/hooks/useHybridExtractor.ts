/**
 * Hook híbrido para extracción de datos de facturas PDF
 * Primero intenta con Google Gemini (modelo configurable desde Directus)
 * Si falla, usa Ollama como fallback/contingencia
 *
 * La API key de Gemini se obtiene del usuario autenticado (campo key_gemini en Directus)
 * El modelo de IA se obtiene del usuario autenticado (campo modelo_ia en Directus)
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

// Modelo por defecto si no está configurado en Directus
const MODELO_POR_DEFECTO = "gemma-3-27b-it";

// Prompt para extracción de datos de factura (igual para ambos proveedores)
const PROMPT_EXTRACCION = `Eres un experto en auditoría contable colombiana. Tu tarea es extraer datos de facturas electrónicas con precisión absoluta.

 REGLAS DE ORO PARA EVITAR CONFUSIONES:
1. IDENTIFICACIÓN DE ROLES: 
   - El EMISOR (Proveedor) es quien vende el producto/servicio. Suele estar en la parte superior.
   - El RECEPTOR (Cliente) SIEMPRE es NARANKA S.A.S (NIT 900335781-7). 
   - PROHIBIDO: No uses los datos de NARANKA S.A.S como proveedor.

2. EXTRACCIÓN DE DATOS:
   - nit_proveedor: Extrae el NIT del EMISOR (el que vende). Ignora el NIT de Naranka.
   - valor_total: Busca el valor final después de impuestos. Debe ser un número puro.
   - numero_factura: Busca el prefijo y número.

3. FORMATO DE SALIDA (JSON PURO):
{
    "nit_proveedor": "String",
    "numero_factura": "String",
    "valor_total": Number,
    "fecha_emision": "YYYY-MM-DD",
    "fecha_vencimiento": "YYYY-MM-DD o null",
    "nombre_proveedor": "String (Nombre de la empresa que vende)",
    "subtotal": Number,
    "impuestos": Number,
    "moneda": "COP"
}

Restricciones:
- Sin texto adicional, sin bloques de código \`\`\`json. Solo el objeto.
- Si un número tiene puntos o comas de miles, conviértelo a formato computacional.
- Si no encuentras un dato, pon null.`;
/**
 * Respuesta esperada de la IA
 */
interface RespuestaExtraccion {
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
 * Tipo de proveedor de IA utilizado
 */
export type ProveedorIA = "gemini" | "ollama" | null;

/**
 * Estado del procesamiento híbrido
 */
export interface EstadoHibrido {
  proveedorUsado: ProveedorIA;
  modeloUsado: string | null; // Nombre del modelo que procesó la factura
  intentoGemini: boolean;
  intentoOllama: boolean;
  errorGemini: string | null;
  errorOllama: string | null;
}

/**
 * Hook principal para extracción de PDF con Gemini y fallback a Ollama
 * @param geminiApiKey - API key de Gemini obtenida del usuario autenticado (campo key_gemini en Directus)
 * @param modeloIA - Modelo de IA a usar obtenido del usuario autenticado (campo modelo_ia en Directus)
 */
export function useHybridExtractor(geminiApiKey?: string, modeloIA?: string) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<ErrorProcesamientoPDF | null>(null);
  const [progress, setProgress] = useState(0);
  const [modeloActual, setModeloActual] = useState<string>("");
  const [estadoHibrido, setEstadoHibrido] = useState<EstadoHibrido>({
    proveedorUsado: null,
    modeloUsado: null,
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

        // Usar el modelo configurado en Directus o el modelo por defecto
        const modeloAUsar = modeloIA || MODELO_POR_DEFECTO;
        const response = await ai.models.generateContent({
          model: modeloAUsar,
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
    [convertPDFToBytes, geminiApiKey, modeloIA],
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
        fechaVencimiento: datos.fecha_vencimiento || undefined,
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
        modeloUsado: null,
        intentoGemini: false,
        intentoOllama: false,
        errorGemini: null,
        errorOllama: null,
      };
      setEstadoHibrido(nuevoEstado);

      try {
        // Paso 1: Validar archivo (0-5%)
        if (!file || file.size === 0) {
          throw createError(
            "archivo_invalido",
            "El archivo no es válido o está vacío",
          );
        }
        setProgress(5);

        // Paso 2: Validar tipo MIME (5-10%)
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

        // Paso 3: Preparar documento (10-20%)
        setProgress(15);
        let response: string;

        // Intentar extracción con Gemini primero
        try {
          nuevoEstado.intentoGemini = true;
          setEstadoHibrido({ ...nuevoEstado });
          setProgress(20);

          // Paso 4: Conectar con Gemini (20-30%)
          setProgress(25);

          // Paso 5: Enviar PDF a Gemini (30-50%)
          setProgress(30);
          response = await extractWithGemini(file);

          // Paso 6: Recibir respuesta de Gemini (50-60%)
          setProgress(50);
          nuevoEstado.proveedorUsado = "gemini";
          nuevoEstado.modeloUsado = modeloIA || MODELO_POR_DEFECTO;
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

          // Fallback a Ollama
          setProgress(35);
          nuevoEstado.intentoOllama = true;
          setEstadoHibrido({ ...nuevoEstado });

          try {
            // Paso 4b: Conectar con Ollama (35-45%)
            setProgress(40);

            // Paso 5b: Enviar PDF a Ollama (45-55%)
            setProgress(45);
            response = await extractWithOllama(file);

            // Paso 6b: Recibir respuesta de Ollama (55-60%)
            setProgress(55);
            nuevoEstado.proveedorUsado = "ollama";
            nuevoEstado.modeloUsado = modeloActual;
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

        // Paso 7: Parsear respuesta JSON (60-75%)
        setProgress(65);
        const datosExtraidos = parseResponse(response);
        setProgress(75);

        // Paso 8: Construir objeto de datos (75-85%)
        setProgress(80);
        const datosFactura = buildDatosFactura(datosExtraidos, file);
        setProgress(85);

        // Paso 9: Validar datos extraídos (85-95%)
        setProgress(90);
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

        // Paso 10: Finalizar (95-100%)
        setProgress(95);
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
      modeloUsado: null,
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
