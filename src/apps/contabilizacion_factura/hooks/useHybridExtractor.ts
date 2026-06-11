import { useState, useCallback, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { GoogleGenAI } from "@google/genai";
import { DatosFacturaPDF, ErrorProcesamientoPDF, TipoErrorPDF } from "../types";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const MODELO_POR_DEFECTO = "gemini-3.5-flash";

const PROMPT_EXTRACCION = `Eres un experto en auditoría contable colombiana. Tu tarea es extraer datos de facturas electrónicas con precisión absoluta.

REGLAS DE ORO PARA EVITAR CONFUSIONES:
1. IDENTIFICACIÓN DE ROLES: 
   - El EMISOR (Proveedor) es quien vende el producto/servicio. Suele estar en la parte superior.
   - El RECEPTOR (Cliente) SIEMPRE es NARANKA S.A.S (NIT 900335781-7). 
   - PROHIBIDO: No uses los datos de NARANKA S.A.S como proveedor.

2. EXTRACCIÓN DE DATOS:
   - nit_proveedor: Extrae el NIT del EMISOR (el que vende). Ignora el NIT de Naranka.
   - valor_total: Busca el valor final después de impuestos. Debe ser un número puro.
   - numero_factura: Busca el número de factura completo incluyendo su prefijo (Ej: "FE1654895", "FEN441536", "R4RM5947").

3. REGLA PARA MANEJO DE PREFIJOS (numero_sin_prefijo):
   - El prefijo son las letras iniciales autorizadas por la DIAN que anteceden al número consecutivo de la factura.
   - En el campo "numero_sin_prefijo", debes limpiar completamente el prefijo de letras y dejar ÚNICAMENTE los dígitos numéricos finales del consecutivo (Ej: Si "numero_factura" es "FE1654895", "numero_sin_prefijo" debe ser "1654895").
   - Si la factura NO tiene prefijo de letras y su numeración es puramente numérica (Ej: "1111452172"), el valor de "numero_sin_prefijo" será exactamente igual al de "numero_factura" (en formato String de números).

4. FORMATO DE SALIDA (JSON PURO):
{
    "es_factura_valida": Boolean,
    "nit_proveedor": "String",
    "numero_factura": "String",
    "numero_sin_prefijo": "String",
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
- Si no encuentras un dato, pon null.
- Si "es_factura_valida" es false, por favor pon todos los demás campos del JSON en null.`;

interface RespuestaExtraccion {
  es_factura_valida: boolean | null;
  nit_proveedor: string | null;
  numero_factura: string | null;
  numero_sin_prefijo: string | null;
  valor_total: number | null;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  nombre_proveedor: string | null;
  subtotal: number | null;
  impuestos: number | null;
  moneda: string | null;
}

export type ProveedorIA = "gemini" | null;

export interface EstadoHibrido {
  proveedorUsado: ProveedorIA;
  modeloUsado: string | null;
  intentoGemini: boolean;
  errorGemini: string | null;
}

function obtenerModelosIA(modelosIA: any): string[] {
  if (!modelosIA) return [MODELO_POR_DEFECTO];
  try {
    const parsed = typeof modelosIA === "string" ? JSON.parse(modelosIA) : modelosIA;
    if (Array.isArray(parsed)) {
      const names = parsed.map((m: any) => m.name).filter(Boolean);
      if (names.length > 0) return names;
    }
  } catch (e) {
    console.error("Error al parsear models_ia:", e);
  }
  return [MODELO_POR_DEFECTO];
}

export function useHybridExtractor(geminiApiKey?: string, modelosIA?: any) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<ErrorProcesamientoPDF | null>(null);
  const [progress, setProgressRaw] = useState(0);
  
  const lastUpdateRef = useRef<number>(0);
  const THROTTLE_INTERVAL = 100;
  
  const setProgress = useCallback((value: number) => {
    const now = Date.now();
    const valueClamped = Math.min(100, Math.max(0, Math.round(value)));
    
    if (now - lastUpdateRef.current >= THROTTLE_INTERVAL && valueClamped > 0) {
      lastUpdateRef.current = now;
      setProgressRaw(valueClamped);
    } else if (valueClamped >= 100) {
      setProgressRaw(100);
    }
  }, []);
  const [estadoHibrido, setEstadoHibrido] = useState<EstadoHibrido>({
    proveedorUsado: null,
    modeloUsado: null,
    intentoGemini: false,
    errorGemini: null,
  });


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

const parseResponse = useCallback((response: string): RespuestaExtraccion => {
    let jsonStr = response.trim();

    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    try {
      return JSON.parse(jsonStr);
    } catch {
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

const extractWithGemini = useCallback(
    async (file: File, modeloAUsar: string): Promise<string> => {
      if (!geminiApiKey) {
        throw new Error("No hay API key de Gemini configurada para el usuario");
      }

      const ai = new GoogleGenAI({ apiKey: geminiApiKey });

      const pdfBytes = await convertPDFToBytes(file);

      try {
        let binary = "";
        const len = pdfBytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(pdfBytes[i]);
        }
        const base64Data = btoa(binary);

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
    [convertPDFToBytes, geminiApiKey],
  );


const buildInvoiceData = useCallback(
    (datos: RespuestaExtraccion, file: File): DatosFacturaPDF => {
      return {
        numeroFactura: datos.numero_factura || "Sin número",
        numeroSinPrefijo: datos.numero_sin_prefijo || datos.numero_factura || "Sin número",
        automatico: "",
        fechaEmision: datos.fecha_emision || new Date().toISOString(),
        fechaVencimiento: datos.fecha_vencimiento || undefined,
        proveedor: {
          nombre: datos.nombre_proveedor || "Proveedor no identificado",
          nif: datos.nit_proveedor || undefined,
        },
        conceptos: [],
        impuestos: datos.impuestos
          ? [
              {
                base: datos.subtotal || (datos.valor_total || 0) / 1.19,
                tipo: 19,
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

  const extractData = useCallback(
    async (file: File): Promise<DatosFacturaPDF> => {
      setIsProcessing(true);
      setError(null);
      setProgressRaw(0);

      const nuevoEstado: EstadoHibrido = {
        proveedorUsado: null,
        modeloUsado: null,
        intentoGemini: false,
        errorGemini: null,
      };
      setEstadoHibrido(nuevoEstado);

      try {
        if (!file || file.size === 0) {
          throw createError(
            "archivo_invalido",
            "El archivo no es válido o está vacío",
          );
        }
        setProgress(5);

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

        setProgress(15);
        let response: string = "";

        const modelos = obtenerModelosIA(modelosIA);
        let geminiExitoso = false;
        let ultimoErrorGemini = "";

        if (geminiApiKey) {
          for (let i = 0; i < modelos.length; i++) {
            const modeloAUsar = modelos[i];
            try {
              nuevoEstado.intentoGemini = true;
              nuevoEstado.modeloUsado = modeloAUsar;
              setEstadoHibrido({ ...nuevoEstado });
              setProgress(20 + i * 2);

              response = await extractWithGemini(file, modeloAUsar);
              
              if (response) {
                console.log(`Modelo usado: ${modeloAUsar}`);
                nuevoEstado.proveedorUsado = "gemini";
                nuevoEstado.modeloUsado = modeloAUsar;
                setEstadoHibrido({ ...nuevoEstado });
                geminiExitoso = true;
                break;
              }
            } catch (geminiError: any) {
              const errorMsg = geminiError instanceof Error ? geminiError.message : String(geminiError);
              console.error(`Error con modelo: ${modeloAUsar}`);
              ultimoErrorGemini = errorMsg;
            }
          }
        } else {
          ultimoErrorGemini = "No hay API key de Gemini configurada para el usuario";
          console.warn(ultimoErrorGemini);
        }

        if (geminiExitoso) {
          setProgress(60);
        } else {
          nuevoEstado.errorGemini = ultimoErrorGemini || "Todos los modelos de Gemini fallaron";
          setEstadoHibrido({ ...nuevoEstado });

          throw createError(
            "extraccion_fallida",
            `El procesamiento con la IA falló: ${nuevoEstado.errorGemini}`,
          );
        }

        setProgress(65);
        const datosExtraidos = parseResponse(response);
        setProgress(75);

        setProgress(80);
        const datosFactura = buildInvoiceData(datosExtraidos, file);
        setProgress(85);

        setProgress(90);
        if (datosExtraidos.es_factura_valida === false) {
          throw createError(
            "archivo_invalido",
            "El archivo PDF enviado no parece ser una factura válida o documento equivalente.",
          );
        }

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
    [extractWithGemini, parseResponse, buildInvoiceData, modelosIA, geminiApiKey],
  );

const clearError = useCallback(() => {
    setError(null);
    setProgressRaw(0);
    setEstadoHibrido({
      proveedorUsado: null,
      modeloUsado: null,
      intentoGemini: false,
      errorGemini: null,
    });
  }, []);

  return {
    extractData,
    isProcessing,
    error,
    progress,
    clearError,
    estadoHibrido,
  };
}


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
  if (isPdfProcessingError(err)) {
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
    errorMessage.includes("connection")
  ) {
    return createError("error_desconocido", errorMessage);
  }

  return createError(
    "error_desconocido",
    `Ocurrió un error durante el procesamiento: ${errorMessage}`,
  );
}

function isPdfProcessingError(err: unknown): err is ErrorProcesamientoPDF {
  return (
    typeof err === "object" && err !== null && "tipo" in err && "mensaje" in err
  );
}

export default useHybridExtractor;