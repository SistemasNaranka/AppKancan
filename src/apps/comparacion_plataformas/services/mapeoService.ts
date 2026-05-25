// src/apps/pruebas/services/mapeoService.ts
import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { cargarTokenStorage } from "@/auth/services/tokenDirectus";
import { setTokenDirectus } from "@/services/directus/auth";
import { readItems } from "@directus/sdk";
import { MapeoArchivo, TiendaMapeo } from "../types/mapeo.types";

/**
 * Estructura tal cual viene de Directus (tabla mapeo_nombres_archivos)
 */
export interface FileNameMapping {
  source_file: string;
  store_file: string;
  terminal: string; // Nuevo campo
  acquirer_id: string; // Nuevo campo
  store_id: {
    id: number;
    name: string;
  };
}

/**
 * Asegura que el token esté establecido en el cliente de Directus
 */
const asegurarToken = async () => {
  const tokens = cargarTokenStorage();
  if (tokens?.access) {
    await setTokenDirectus(tokens.access);
  }
};

/**
 * Obtiene todos los registros de la tabla Mapeo_Nombres_Archivos
 */
export const obtenerMapeosArchivos = async (): Promise<FileNameMapping[]> => {
  try {
    // Asegurar que el token esté establecido antes de la petición
    await asegurarToken();

    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("acc_file_name_mapping", {
          fields: [
            "source_file",
            "store_file",
            "terminal",
            "acquirer_id",
            "store_id.id",
            "store_id.name",
          ],
          limit: -1,
        })
      )
    );

    return data as FileNameMapping[];
  } catch (error) {
    console.error("❌ Error al obtener mapeos de archivos:", error);
    throw error;
  }
};

/**
 * Procesa los datos de Directus y los convierte en las estructuras que necesita el componente
 */
export const procesarMapeosParaNormalizacion = (
  mapeos: FileNameMapping[]
): { tablasMapeo: MapeoArchivo[]; tiendaMapeos: TiendaMapeo[] } => {

  // 1. Agrupar por archivo_origen para obtener los tipos de archivo únicos
  const archivoOrigenUnicos = [...new Set(mapeos.map(m => m.source_file))];

  //===========================  LISTA DE COLUMNAS A ELIMINAR  ===========================//

  // 2. Configuración de columnas a eliminar por tipo de archivo
  const columnasEliminarPorTipo: Record<string, string[]> = {
    "Maria Perez - Bco Occidente": [
      "RESPUESTA",
      "ALIASEMISOR",
      "TIPO",
      "ENTIDAD_ORIGEN",
      "ENTIDAD_DESTINO",
      "CANAL",
      "CODIGOAPROBACIONDEPOSITO",
      "IDADQUIRIENTE",
      "IDEMISOR",
      "IDTERMINAL",
      "TRANSACCION",
      "IDOPERACION",
      "tiendaid"
    ],
    "transactions": [
      "ID Transacción",
      "Nombre Cliente",
      "Tipo de venta",
      "Fecha Cancelación",
      "Nombre Aliado",
      "Ally Slug",
      "Store Slug",
      "ID Crédito",
      "Canal",
      "Estado",
      "Sub-estado",
      "ID Cancelación",
      "Razón Cancelación",
      "Usuario Cancelación",
      "Email vendedor",
      "ID Orden",
      "tiendaid"
    ],
    "ReporteDiariodeVentasComercio": [
      "Cantidad de Transacciones",
      "Tasa Aerop o Propina",
      "comisión",
      "Retenciones",
    ],//						
    "Creditos": [
      "Almacén",
      "Identificación",
      "Pagaré",
      "Factura",
      "Retención",
      "Usuario Almacén",
    ],
  };

  // 3. Crear tablasMapeo con las columnas específicas para cada tipo
  const tablasMapeo: MapeoArchivo[] = archivoOrigenUnicos.map(archivoOrigen => ({
    source_file: archivoOrigen,
    columnasEliminar: columnasEliminarPorTipo[archivoOrigen] || [],
  }));

  // 4. Crear tiendaMapeos (mapeo de nombres de tiendas)
  const tiendaMapeos: TiendaMapeo[] = mapeos.map(m => ({
    source_file: m.source_file,
    store_file: m.store_file,
    tiendaNormalizada: m.store_id.name,
    store_id: m.store_id.id,
    terminal: m.terminal,
    acquirer_id: m.acquirer_id
  }));

  return { tablasMapeo, tiendaMapeos };
};