import * as pdfjsLib from 'pdfjs-dist';
import { descargarCvBytes } from '../directus/read';

// Misma configuración que resoluciones/pdfReader.ts
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const MIN_CARACTERES = 300; // menos que esto = escaneo o foto: se envía el PDF completo
const MAX_PAGINAS = 6;      // una hoja de vida rara vez pasa de aquí

export type HojaLeida =
  | { tipo: 'texto'; texto: string; bytes: number }
  | { tipo: 'pdf'; base64: string; bytes: number };

// Convierte por bloques: carácter por carácter es muy lento con PDF de varios MB
function aBase64(bytes: Uint8Array): string {
  let binario = '';
  const paso = 0x8000;
  for (let i = 0; i < bytes.length; i += paso) {
    binario += String.fromCharCode(...bytes.subarray(i, i + paso));
  }
  return btoa(binario);
}

async function extraerTexto(bytes: Uint8Array): Promise<string> {
  // Crítico: getDocument consume el buffer que recibe, por eso va una copia
  const pdf = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
  const paginas = Math.min(pdf.numPages, MAX_PAGINAS);
  let texto = '';
  for (let n = 1; n <= paginas; n++) {
    const contenido = await (await pdf.getPage(n)).getTextContent();
    texto += contenido.items.map((item: any) => item.str ?? '').join(' ') + '\n';
  }
  return texto.replace(/[ \t]+/g, ' ').trim();
}

// Texto si el PDF lo tiene; PDF completo si es escaneado o no se pudo leer
export async function leerHojaDeVida(cv: string): Promise<HojaLeida> {
  const bytes = new Uint8Array(await descargarCvBytes(cv));
  try {
    const texto = await extraerTexto(bytes);
    if (texto.length >= MIN_CARACTERES) {
      return { tipo: 'texto', texto, bytes: new TextEncoder().encode(texto).length };
    }
  } catch (err) {
    console.warn('[vacantes] No se pudo extraer texto, se enviará el PDF completo:', err);
  }
  return { tipo: 'pdf', base64: aBase64(bytes), bytes: bytes.length };
}