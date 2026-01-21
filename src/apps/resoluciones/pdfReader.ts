import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface DatosPDF {
  fecha_vencimiento: string;
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

export async function leerPDF(archivo: File): Promise<DatosPDF | string> {
  try {
    const arrayBuffer = await archivo.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Validar que tenga 2 páginas
    if (pdf.numPages < 2) {
      return 'El PDF debe tener 2 o más páginas';
    }

    // Leer página 1
    const pagina1 = await pdf.getPage(1);
    const textoPagina1 = await pagina1.getTextContent();
    const texto1 = textoPagina1.items.map((item: any) => item.str).join(' ');

    // Leer página 2
    const pagina2 = await pdf.getPage(2);
    const textoPagina2 = await pagina2.getTextContent();
    const texto2 = textoPagina2.items.map((item: any) => item.str).join(' ');

    // Extraer número de formulario (resolución)
    const numeroMatch = texto1.match(/\b(1876\d{10})\b/);
    const numero_formulario = numeroMatch ? numeroMatch[1] : '';

    // Extraer fecha
    const fechaMatch = texto1.match(/(\d{4}-\d{2}-\d{2})/);
    const fecha_creacion = fechaMatch ? fechaMatch[1] : '';

    // Extraer razón social
    let razon_social = '';
    if (texto1.includes('NARANKA')) {
      razon_social = 'NARANKA SAS';
    } else if (texto1.includes('KAN CAN JEANS')) {
      razon_social = 'KAN CAN JEANS';
    } else if (texto1.includes('PEREZ VELEZ MARIA FERNANDA') || texto1.includes('MARIA FERNANDA PEREZ VELEZ')) {
      razon_social = 'MARIA FERNANDA PEREZ VELEZ';
    }

// Extraer municipio (ciudad) - última palabra antes de SUBDIRECCION
    const municipioMatch = texto1.match(/([A-Za-zÁÉÍÓÚáéíóúÑñ]+)\s+SUBDIRECCION/i);
    const tienda_nombre = municipioMatch ? municipioMatch[1].trim().toUpperCase() : '';

    // Extraer prefijo
    const prefijoMatch = texto2.match(/\b([A-Z]{2}\d{1,4})\b/);
    const prefijo = prefijoMatch ? prefijoMatch[1] : '';

    // Extraer desde
    const desde_numero = 1;

    // Extraer hasta
    const hastaMatch = texto2.match(/(\d{1,3}(?:,\d{3})+)/);
    const hasta_numero = hastaMatch ? parseInt(hastaMatch[1].replace(/,/g, '')) : 0;

    // Extraer vigencia
    const vigenciaMatch = texto2.match(/\b(\d{1,2})\s+HABILITACIÓN/i);
    const vigencia = vigenciaMatch ? parseInt(vigenciaMatch[1]) : 12;

    // Extraer tipo solicitud
    let tipo_solicitud = 'Principal';
    if (texto2.includes('HABILITACIÓN')) {
      tipo_solicitud = 'Habilitación';
    } else if (texto2.includes('AUTORIZACIÓN')) {
      tipo_solicitud = 'Autorización';
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
  } catch (error) {
    console.error('Error al leer PDF:', error);
    return 'Error al leer el archivo PDF';
  }
}