import * as pdfjsLib from "pdfjs-dist";
import { cargarTokenStorage } from "@/auth/services/tokenDirectus";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface DataPDF {
  numero_formulario: string;
  razon_social: string;
  prefijo: string;
  desde_numero: number;
  hasta_numero: number;
  vigencia: number;
  tipo_solicitud: string;
  fecha_creacion: string;
  tienda_nombre: string;
}

const PROMPT_RESOLUCIONES = `Eres un experto tributario y de auditoría en Colombia. Tu tarea es extraer con precisión absoluta los datos de un documento de resolución de facturación de la DIAN.

Extrae los siguientes campos y devuélvelos en formato JSON puro:
{
  "numero_formulario": "String (El número de formulario/resolución de 14 dígitos que usualmente empieza con 1876)",
  "razon_social": "String (Razón social del obligado. Debe ser exactamente una de estas: 'NARANKA SAS', 'KAN CAN JEANS', o 'MARIA FERNANDA PEREZ VELEZ')",
  "prefijo": "String (El prefijo autorizado, ej: 'LE26', 'PR', etc.)",
  "desde_numero": Number (El número inicial del rango autorizado)",
  "hasta_numero": Number (El número final del rango autorizado)",
  "vigencia": Number (Vigencia de la resolución en meses, ej: 12, 18, 24)",
  "tipo_solicitud": "String (El tipo de solicitud. Debe ser: 'Habilitación', 'Autorización', o 'Principal')",
  "fecha_creacion": "String (La fecha de la resolución en formato YYYY-MM-DD)",
"
}

Restricciones:
- Devuelve SOLO el objeto JSON, sin formato markdown como \`\`\`json ni texto explicativo.
- Si no encuentras un valor, pon null.
- Limpia los números de comas o puntos de miles (deben ser enteros numéricos).`;

function parseResponse(response: string): any {
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
        throw new Error("No se pudo parsear el JSON de respuesta de la IA");
      }
    }
    throw new Error("No se encontró JSON válido en la respuesta de la IA");
  }
}

function extractWithRegex(texto1: string, texto2: string): DataPDF {
  const numeroMatch = texto1.match(/\b(1876\d{10})\b/);
  const numero_formulario = numeroMatch ? numeroMatch[1] : "";

  const fechaMatch = texto1.match(/(\d{4}-\d{2}-\d{2})/);
  const fecha_creacion = fechaMatch ? fechaMatch[1] : "";

  let razon_social = "";
  if (texto1.includes("NARANKA")) {
    razon_social = "NARANKA SAS";
  } else if (texto1.includes("KAN CAN JEANS")) {
    razon_social = "KAN CAN JEANS";
  } else if (
    texto1.includes("PEREZ VELEZ MARIA FERNANDA") ||
    texto1.includes("MARIA FERNANDA PEREZ VELEZ")
  ) {
    razon_social = "MARIA FERNANDA PEREZ VELEZ";
  }

  const municipioMatch = texto1.match(
    /([A-Za-zÁÉÍÓÚáéíóúÑñ]+)\s+SUBDIRECCION/i,
  );
  const tienda_nombre = municipioMatch
    ? municipioMatch[1].trim().toUpperCase()
    : "";

  const prefijoMatch = texto2.match(/\b([A-Z]{2}\d{1,4})\b/);
  const prefijo = prefijoMatch ? prefijoMatch[1] : "";

  const desdeMatch = texto2.match(/\b[A-Z]{2}\d{1,4}\b\s+(\d+)/);
  const desde_numero = desdeMatch ? parseInt(desdeMatch[1]) : 1;

  const hastaMatch = texto2.match(/(\d{1,3}(?:,\d{3})+)/);
  const hasta_numero = hastaMatch
    ? parseInt(hastaMatch[1].replace(/,/g, ""))
    : 0;

  const vigenciaMatch = texto2.match(/\b(\d{1,2})\s+HABILITACIÓN/i);
  const vigencia = vigenciaMatch ? parseInt(vigenciaMatch[1]) : 12;

  let tipo_solicitud = "Principal";
  if (texto2.includes("HABILITACIÓN")) {
    tipo_solicitud = "Habilitación";
  } else if (texto2.includes("AUTORIZACIÓN")) {
    tipo_solicitud = "Autorización";
  }

  return {
    numero_formulario,
    razon_social,
    prefijo,
    desde_numero,
    hasta_numero,
    vigencia,
    tipo_solicitud,
    fecha_creacion,
    tienda_nombre,
  };
}

function obtenerModelosIA(modelosIA: any): string[] {
  if (!modelosIA) return ["gemma-3-27b-it"];
  try {
    const parsed = typeof modelosIA === "string" ? JSON.parse(modelosIA) : modelosIA;
    if (Array.isArray(parsed)) {
      const names = parsed.map((m: any) => m.name).filter(Boolean);
      if (names.length > 0) return names;
    }
  } catch (e) {
    console.error("Error al parsear models_ia:", e);
  }
  return ["gemma-3-27b-it"];
}

export async function LearnPDF(
  archivo: File,
  geminiApiKey?: string,
  modelosIA?: any
): Promise<DataPDF | string> {
  try {
    const arrayBuffer = await archivo.arrayBuffer();
    const arrayBufferCopy = arrayBuffer.slice(0);
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    if (pdf.numPages < 2) {
      return "El PDF debe tener 2 o más páginas";
    }

    const pagina1 = await pdf.getPage(1);
    const textoPagina1 = await pagina1.getTextContent();
    const texto1 = textoPagina1.items.map((item: any) => item.str).join(" ");

    const pagina2 = await pdf.getPage(2);
    const textoPagina2 = await pagina2.getTextContent();
    const texto2 = textoPagina2.items.map((item: any) => item.str).join(" ");

    let finalData: DataPDF | null = null;
    let geminiErrorDetails = "";

    if (geminiApiKey) {
      const modelos = obtenerModelosIA(modelosIA);

      const uint8Array = new Uint8Array(arrayBufferCopy);
      let binary = "";
      const len = uint8Array.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Data = btoa(binary);

      // Obtener el token de Directus para autenticar la petición al proxy
      const tokens = cargarTokenStorage();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (tokens?.access) {
        headers["Authorization"] = `Bearer ${tokens.access}`;
      }

      const API_URL = import.meta.env.VITE_VENTAS_API_URL || "/api";

      for (let i = 0; i < modelos.length; i++) {
        const modeloAUsar = modelos[i];
        try {
          const contents = [
            {
              role: "user",
              parts: [
                { text: PROMPT_RESOLUCIONES },
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: base64Data,
                  },
                },
              ],
            },
          ];

          const response = await fetch(`${API_URL}/ia/gemini/extraer`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              model: modeloAUsar,
              contents,
            }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || errData.error || `HTTP ${response.status}`);
          }

          const resData = await response.json();
          const responseText = resData.text || "";
          const parsed = parseResponse(responseText);

          if (parsed && parsed.numero_formulario) {
            finalData = {
              numero_formulario: parsed.numero_formulario,
              razon_social: parsed.razon_social || "",
              prefijo: parsed.prefijo || "",
              desde_numero: parsed.desde_numero || 1,
              hasta_numero: parsed.hasta_numero || 0,
              vigencia: parsed.vigencia || 12,
              tipo_solicitud: parsed.tipo_solicitud || "Principal",
              fecha_creacion: parsed.fecha_creacion || "",
              tienda_nombre: parsed.tienda_nombre || "",
            };
            return finalData;
          } else {
            throw new Error("La respuesta de la IA no contenía el formato JSON esperado o le faltaba el número de resolución.");
          }
        } catch (geminiError: any) {
          console.error(`Error con modelo: ${modeloAUsar}`);
          geminiErrorDetails = geminiError?.message || String(geminiError);
        }
      }
    } else {
      console.warn("API Key de Gemini no configurada en el perfil del usuario.");
    }

    const regexData = extractWithRegex(texto1, texto2);

    if (regexData.numero_formulario && regexData.fecha_creacion) {
      return regexData;
    }

    if (geminiApiKey) {
      return `Error al extraer datos con la IA: ${geminiErrorDetails}. Además, el análisis alternativo (Regex) falló al leer el formato de este PDF. Por favor verifica que el archivo sea una resolución válida de la DIAN.`;
    } else {
      return "No tienes configurada la API Key de Gemini en tu perfil (ia_key). Adicionalmente, el análisis alternativo (Regex) falló al procesar el formato de este PDF.";
    }
  } catch (error) {
    console.error("Error al procesar PDF:", error);
    return "Error al leer el archivo PDF. Asegúrate de que no esté protegido o dañado.";
  }
}
