/**
 * Hook para extracción de datos de facturas PDF
 * Utiliza pdfjs-dist para parsear documentos
 */

import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
    DatosFacturaPDF,
    ErrorProcesamientoPDF,
    ConceptoFactura,
    ImpuestosDetalle,
    TipoErrorPDF,
    formatFileSize,
} from '../types';

// Configurar worker de pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Hook principal para extracción de PDF
 */
export function usePDFExtractor() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<ErrorProcesamientoPDF | null>(null);
    const [progress, setProgress] = useState(0);

    const extractData = useCallback(async (file: File): Promise<DatosFacturaPDF> => {
        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            // Validar archivo
            if (!validateFile(file)) {
                throw createError('archivo_invalido', 'El archivo no es válido o está vacío');
            }

            setProgress(10);

            // Validar tipo MIME
            if (!validatePDFType(file)) {
                throw createError('archivo_invalido', 'El archivo debe ser un PDF válido');
            }

            setProgress(20);

            // Leer archivo como ArrayBuffer
            const arrayBuffer = await readFileAsArrayBuffer(file);
            
            setProgress(30);

            // Cargar documento PDF
            const pdf = await loadPDFDocument(arrayBuffer);
            
            setProgress(40);

            // Extraer texto de todas las páginas
            const textContent = await extractTextFromPDF(pdf);
            
            setProgress(60);

            // Parsear datos de la factura
            const invoiceData = parseInvoiceData(textContent, file);
            
            setProgress(90);

            // Validar datos extraídos
            if (!invoiceData.numeroFactura && !invoiceData.proveedor.nombre) {
                throw createError(
                    'datos_incompletos',
                    'No se pudieron extraer los datos de la factura. El formato del PDF no es reconocido.'
                );
            }

            setProgress(100);

            return invoiceData;
        } catch (err) {
            const processingError = handleError(err);
            setError(processingError);
            throw processingError;
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
        setProgress(0);
    }, []);

    return {
        extractData,
        isProcessing,
        error,
        progress,
        clearError,
    };
}

// ============ FUNCIONES AUXILIARES ============

function validateFile(file: File): boolean {
    return file !== null && file !== undefined && file.size > 0;
}

function validatePDFType(file: File): boolean {
    const validTypes = [
        'application/pdf',
        'application/x-pdf',
        'pdf',
    ];
    return validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.pdf');
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsArrayBuffer(file);
    });
}

async function loadPDFDocument(arrayBuffer: ArrayBuffer): Promise<pdfjsLib.PDFDocumentProxy> {
    try {
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        return await loadingTask.promise;
    } catch (err) {
        if ((err as Error).message.includes('password')) {
            throw createError('pdf_protegido', 'El PDF está protegido con contraseña');
        }
        throw createError('extraccion_fallida', 'Error al procesar el documento PDF');
    }
}

async function extractTextFromPDF(pdf: pdfjsLib.PDFDocumentProxy): Promise<string> {
    const textContent: string[] = [];
    
    const numPages = pdf.numPages;
    
    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContentItems = await page.getTextContent();
        
        const pageText = textContentItems.items
            .map((item: any) => item.str)
            .join(' ');
        
        textContent.push(pageText);
    }
    
    return textContent.join('\n\n');
}

function parseInvoiceData(text: string, file: File): DatosFacturaPDF {
    // Patrones de búsqueda para datos de factura
    const patterns = {
        numeroFactura: [
            /Factura\s*[# NºN°]*\s*[:.]?\s*([A-Z0-9\-]+)/i,
            /N[º°]\s*Factura\s*[:.]?\s*([A-Z0-9\-]+)/i,
            /Factura\s*N[º°]\s*([A-Z0-9\-]+)/i,
            /Número\s*[:.]?\s*([A-Z0-9\-]+)/i,
        ],
        fechaEmision: [
            /Fecha\s*[:.]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
            /Emitida?\s*[:.]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        ],
        fechaVencimiento: [
            /Vencimiento\s*[:.]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
            /Pagadero\s*hasta\s*[:.]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        ],
        cifNif: [
            /(?:CIF|NIF|DNI)\s*[:.]?\s*([A-Z0-9\-]+)/i,
        ],
        importeTotal: [
            /Total\s*[:.]?\s*([\d.,]+)\s*(?:€|EUR)?/i,
            /Importe\s*Total\s*[:.]?\s*([\d.,]+)/i,
            /TOTAL\s*[:.]?\s*([\d.,]+)/i,
        ],
    };

    // Extraer datos usando patrones
    const numeroFactura = extractFirstMatch(text, patterns.numeroFactura) || '';
    const fechaEmision = extractFirstMatch(text, patterns.fechaEmision) || new Date().toISOString();
    const fechaVencimiento = extractFirstMatch(text, patterns.fechaVencimiento);
    const cifNif = extractFirstMatch(text, patterns.cifNif);

    // Intentar extraer importe total
    let total = 0;
    const importeMatch = extractFirstMatch(text, patterns.importeTotal);
    if (importeMatch) {
        total = parseNumber(importeMatch);
    }

    // Extraer proveedor (heurística: texto antes de "Factura" o datos de empresa)
    const proveedor = extractProveedor(text, cifNif || undefined);

    // Extraer conceptos (heurística básica)
    const conceptos = extractConceptos(text);

    // Calcular impuestos
    const impuestos = calculateImpuestos(conceptos, total);

    // Calcular subtotal
    const subtotal = conceptos.reduce((sum, c) => sum + c.importe, 0);
    const totalImpuestos = impuestos.reduce((sum, i) => sum + i.importe, 0);

    return {
        numeroFactura,
        fechaEmision,
        fechaVencimiento: fechaVencimiento || undefined,
        proveedor,
        conceptos,
        impuestos,
        subtotal,
        totalImpuestos,
        total,
        moneda: 'EUR',
        archivo: {
            nombre: file.name,
            tamaño: file.size,
            fechaCarga: new Date().toISOString(),
        },
    };
}

function extractFirstMatch(text: string, patterns: RegExp[]): string | null {
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    return null;
}

function extractProveedor(text: string, cifNif?: string): DatosFacturaPDF['proveedor'] {
    // Intentar extraer nombre de empresa
    const empresaPatterns = [
        /(?:De|Proveedor|Vendedor|Emisor)[:.]?\s*([A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑ0-9\s.,&'-]+?)(?:\n|Factura|NIF|CIF|$)/i,
        /([A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑ\s.,&'-]{5,40})\s*(?:NIF|CIF)/i,
    ];

    const nombre = extractFirstMatch(text, empresaPatterns) || 'Proveedor no identificado';

    return {
        nombre: nombre.trim(),
        nif: cifNif || undefined,
    };
}

function extractConceptos(text: string): ConceptoFactura[] {
    // Heurística básica: buscar líneas con descripción y precio
    const conceptoPatterns = [
        /([A-Za-zÁÉÍÓÚÜÑ0-9\s.,&'-]{3,50})\s+(\d+[,.]?\d*)?\s*[@xX]\s*([\d.,]+)\s*([\d.,]+)/g,
        /([A-Za-zÁÉÍÓÚÜÑ0-9\s.,&'-]{3,50})\s+(\d+[,.]?\d*)\s+([\d.,]+)\s+([\d.,]+)/g,
    ];

    const conceptos: ConceptoFactura[] = [];
    const lines = text.split('\n');

    // Patrón simple para detectar líneas de items
    const itemPattern = /^(.+?)\s+(\d+[,.]?\d*)\s+(?:€|EUR)?\s*([\d.,]+)\s*(?:€|EUR)?$/i;

    for (const line of lines) {
        const match = line.match(itemPattern);
        if (match) {
            const descripcion = match[1].trim();
            const cantidad = parseNumber(match[2]);
            const precioUnitario = parseNumber(match[3]);
            const importe = cantidad * precioUnitario;

            if (descripcion.length > 3 && !isNaN(cantidad) && !isNaN(precioUnitario)) {
                conceptos.push({
                    descripcion,
                    cantidad,
                    precioUnitario,
                    importe,
                });
            }
        }
    }

    // Si no se encontraron conceptos, devolver vacío
    return conceptos.slice(0, 10); // Limitar a 10 items
}

function calculateImpuestos(conceptos: ConceptoFactura[], total: number): ImpuestosDetalle[] {
    if (conceptos.length === 0 && total > 0) {
        // Si hay total pero no conceptos, asumir IVA estándar
        return [{
            base: total / 1.21,
            tipo: 21,
            importe: total - (total / 1.21),
        }];
    }

    if (conceptos.length > 0) {
        const subtotal = conceptos.reduce((sum, c) => sum + c.importe, 0);
        // Asumir IVA del 21% por defecto
        const iva = subtotal * 0.21;
        return [{
            base: subtotal,
            tipo: 21,
            importe: iva,
        }];
    }

    return [];
}

function parseNumber(str: string): number {
    if (!str) return 0;
    // Normalizar separadores decimales
    const normalized = str.replace(/,/g, '.').replace(/[^\d.]/g, '');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
}

function createError(tipo: TipoErrorPDF, mensaje: string): ErrorProcesamientoPDF {
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
    
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    
    if (errorMessage.includes('password') || errorMessage.includes('protegido')) {
        return createError('pdf_protegido', 'El PDF está protegido con contraseña');
    }
    
    if (errorMessage.includes('archivo')) {
        return createError('archivo_invalido', errorMessage);
    }
    
    return createError('error_desconocido', 'Ocurrió un error durante el procesamiento');
}

function isErrorProcesamientoPDF(err: unknown): err is ErrorProcesamientoPDF {
    return (
        typeof err === 'object' &&
        err !== null &&
        'tipo' in err &&
        'mensaje' in err
    );
}
