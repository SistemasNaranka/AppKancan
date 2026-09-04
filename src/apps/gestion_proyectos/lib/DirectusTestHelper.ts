import directus, { directusUrl } from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import {
  readItems,
  readItem,
  createItem,
  updateItem,
  deleteItem,
  readUsers,
  readUser,
  readRoles,
  readRole,
  readFiles,
  readFile,
} from "@directus/sdk";

export interface RequestConfig {
  collection: string;
  action: 'readItems' | 'readItem' | 'createItem' | 'updateItem' | 'deleteItem' | 'readMe';
  id?: string;
  fields?: string;
  filter?: string;
  sort?: string;
  limit?: number;
  payload?: string;
  safeMode?: boolean; // Por defecto true para no alterar la BD real en escrituras/borrados
}

export interface DiagnosticResult {
  isError: boolean;
  httpStatus?: number;
  code?: string;
  message?: string;
  rootCauseSpan?: string;
  recommendationSpan?: string;
  rawResponse?: any;
  latencyMs: number;
}

/**
 * Determina si la colección enviada es una colección del sistema de Directus
 */
export function isSystemCollection(collectionName: string): boolean {
  return collectionName.startsWith('directus_');
}

/**
 * Convierte los parámetros de la solicitud en un concepto de consulta SQL tradicional
 */
export function generateSQLEquivalent(config: RequestConfig): string {
  const table = config.collection || 'tabla';
  
  if (config.action === 'readMe') {
    return `-- Directus Auth Query\nSELECT * FROM directus_users WHERE id = CURRENT_AUTHENTICATED_USER;`;
  }

  if (config.action === 'readItem') {
    const fields = config.fields && config.fields.trim() !== '' ? config.fields.trim() : '*';
    const idVal = config.id ? `'${config.id}'` : '1';
    return `SELECT ${fields} FROM ${table} WHERE id = ${idVal};`;
  }

  if (config.action === 'createItem') {
    let payloadObj: any = {};
    try {
      if (config.payload) payloadObj = JSON.parse(config.payload);
    } catch {
      payloadObj = { nota: 'Payload JSON Inválido' };
    }
    const cols = Object.keys(payloadObj).join(', ') || 'columna_1, columna_2';
    const vals = Object.values(payloadObj).map(v => typeof v === 'string' ? `'${v}'` : JSON.stringify(v)).join(', ') || "'valor_1', 'valor_2'";
    return `INSERT INTO ${table} (${cols})\nVALUES (${vals}); ${config.safeMode !== false ? '-- (MODO SEGURO ACTIVO: No ejecutado en BD)' : ''}`;
  }

  if (config.action === 'updateItem') {
    let payloadObj: any = {};
    try {
      if (config.payload) payloadObj = JSON.parse(config.payload);
    } catch {
      payloadObj = {};
    }
    const updates = Object.entries(payloadObj).map(([k, v]) => `${k} = ${typeof v === 'string' ? `'${v}'` : JSON.stringify(v)}`).join(', ');
    const idVal = config.id ? `'${config.id}'` : '1';
    return `UPDATE ${table}\nSET ${updates || 'campo = nuevo_valor'}\nWHERE id = ${idVal}; ${config.safeMode !== false ? '-- (MODO SEGURO ACTIVO: No ejecutado en BD)' : ''}`;
  }

  if (config.action === 'deleteItem') {
    const idVal = config.id ? `'${config.id}'` : '1';
    return `DELETE FROM ${table} WHERE id = ${idVal}; ${config.safeMode !== false ? '-- (MODO SEGURO ACTIVO: No ejecutado en BD)' : ''}`;
  }

  // Default: readItems
  const fields = config.fields && config.fields.trim() !== '' ? config.fields.trim() : '*';
  let sql = `SELECT ${fields}\nFROM ${table}`;

  if (config.filter && config.filter.trim() !== '') {
    try {
      const filterObj = JSON.parse(config.filter);
      const whereClauses: string[] = [];
      
      Object.entries(filterObj).forEach(([field, ops]: [string, any]) => {
        if (typeof ops === 'object' && ops !== null) {
          Object.entries(ops).forEach(([op, val]) => {
            if (op === '_eq') whereClauses.push(`${field} = ${typeof val === 'string' ? `'${val}'` : val}`);
            else if (op === '_neq') whereClauses.push(`${field} != ${typeof val === 'string' ? `'${val}'` : val}`);
            else if (op === '_contains') whereClauses.push(`${field} LIKE '%${val}%'`);
            else if (op === '_in') whereClauses.push(`${field} IN (${Array.isArray(val) ? val.map(v => `'${v}'`).join(', ') : val})`);
            else if (op === '_null') whereClauses.push(`${field} ${val ? 'IS NULL' : 'IS NOT NULL'}`);
            else whereClauses.push(`${field} ${op} ${JSON.stringify(val)}`);
          });
        } else {
          whereClauses.push(`${field} = '${ops}'`);
        }
      });
      
      if (whereClauses.length > 0) {
        sql += `\nWHERE ${whereClauses.join(' AND ')}`;
      }
    } catch {
      sql += `\nWHERE -- Error al procesar JSON de filtro`;
    }
  }

  if (config.sort && config.sort.trim() !== '') {
    const sortCols = config.sort.split(',').map(s => {
      const col = s.trim();
      return col.startsWith('-') ? `${col.substring(1)} DESC` : `${col} ASC`;
    }).join(', ');
    sql += `\nORDER BY ${sortCols}`;
  }

  if (config.limit !== undefined && config.limit > 0) {
    sql += `\nLIMIT ${config.limit}`;
  }

  return `${sql};`;
}

/**
 * Genera el snippet runnable de código en TypeScript usando Directus SDK
 */
export function generateSDKCodeSnippet(config: RequestConfig): string {
  const colName = config.collection || 'sys_projects';
  const collectionStr = `'${colName}'`;

  if (config.action === 'readMe') {
    return `import directus from '@/services/directus/directus';
import { readMe } from '@directus/sdk';

try {
  const currentUser = await directus.request(readMe());
  console.log('Usuario Autenticado:', currentUser);
} catch (error) {
  console.error('Error Directus SDK:', error);
}`;
  }

  // Manejo de colecciones del sistema (directus_users, directus_roles, directus_files)
  if (colName === 'directus_users') {
    if (config.action === 'readItem') {
      // REGLA DE DIRECTUS SDK: Para directus_users se usa readUser(), NO readItem()
      return `import directus from '@/services/directus/directus';
import { readUser } from '@directus/sdk';

try {
  const user = await directus.request(
    readUser('${config.id || '1'}')
  );
  console.log('Usuario obtenido:', user);
} catch (error) {
  console.error('Error Directus SDK:', error);
}`;
    }
    // REGLA DE DIRECTUS SDK: Para directus_users se usa readUsers(), NO readItems()
    return `import directus from '@/services/directus/directus';
import { readUsers } from '@directus/sdk';

try {
  const users = await directus.request(
    readUsers({ limit: ${config.limit || 5} })
  );
  console.log('Usuarios obtenidos:', users);
} catch (error) {
  console.error('Error Directus SDK:', error);
}`;
  }

  if (colName === 'directus_roles') {
    // REGLA DE DIRECTUS SDK: Para directus_roles se usa readRoles(), NO readItems()
    return `import directus from '@/services/directus/directus';
import { readRoles } from '@directus/sdk';

try {
  const roles = await directus.request(readRoles());
  console.log('Roles obtenidos:', roles);
} catch (error) {
  console.error('Error Directus SDK:', error);
}`;
  }

  if (colName === 'directus_files') {
    // REGLA DE DIRECTUS SDK: Para directus_files se usa readFiles(), NO readItems()
    return `import directus from '@/services/directus/directus';
import { readFiles } from '@directus/sdk';

try {
  const files = await directus.request(readFiles());
  console.log('Archivos obtenidos:', files);
} catch (error) {
  console.error('Error Directus SDK:', error);
}`;
  }

  if (config.action === 'readItem') {
    const fieldsArr = config.fields ? config.fields.split(',').map(f => `'${f.trim()}'`) : [];
    const fieldsOption = fieldsArr.length > 0 ? `, {\n    fields: [${fieldsArr.join(', ')}]\n  }` : '';
    const idVal = config.id ? `'${config.id}'` : `'ID_AQUI'`;
    return `import directus from '@/services/directus/directus';
import { readItem } from '@directus/sdk';

try {
  const item = await directus.request(
    readItem(${collectionStr}, ${idVal}${fieldsOption})
  );
  console.log('Registro obtenido:', item);
} catch (error) {
  console.error('Error Directus SDK:', error);
}`;
  }

  if (config.action === 'createItem') {
    let payloadObjStr = '{\n    name: "Ejemplo"\n  }';
    try {
      if (config.payload) {
        payloadObjStr = JSON.stringify(JSON.parse(config.payload), null, 4);
      }
    } catch {
      payloadObjStr = config.payload || '{}';
    }
    return `import directus from '@/services/directus/directus';
import { createItem } from '@directus/sdk';

try {
  const newItem = await directus.request(
    createItem(${collectionStr}, ${payloadObjStr})
  );
  console.log('Registro creado con éxito:', newItem);
} catch (error) {
  console.error('Error al crear registro:', error);
}`;
  }

  if (config.action === 'updateItem') {
    const idVal = config.id ? `'${config.id}'` : `'ID_AQUI'`;
    let payloadObjStr = '{\n    name: "Nuevo Nombre"\n  }';
    try {
      if (config.payload) {
        payloadObjStr = JSON.stringify(JSON.parse(config.payload), null, 4);
      }
    } catch {
      payloadObjStr = config.payload || '{}';
    }
    return `import directus from '@/services/directus/directus';
import { updateItem } from '@directus/sdk';

try {
  const updatedItem = await directus.request(
    updateItem(${collectionStr}, ${idVal}, ${payloadObjStr})
  );
  console.log('Registro actualizado:', updatedItem);
} catch (error) {
  console.error('Error al actualizar:', error);
}`;
  }

  if (config.action === 'deleteItem') {
    const idVal = config.id ? `'${config.id}'` : `'ID_AQUI'`;
    return `import directus from '@/services/directus/directus';
import { deleteItem } from '@directus/sdk';

try {
  await directus.request(deleteItem(${collectionStr}, ${idVal}));
  console.log('Registro eliminado exitosamente');
} catch (error) {
  console.error('Error al eliminar:', error);
}`;
  }

  // Default: readItems
  const options: string[] = [];
  if (config.fields && config.fields.trim() !== '') {
    const fieldsArr = config.fields.split(',').map(f => `'${f.trim()}'`).join(', ');
    options.push(`fields: [${fieldsArr}]`);
  }
  if (config.filter && config.filter.trim() !== '') {
    try {
      const parsed = JSON.parse(config.filter);
      options.push(`filter: ${JSON.stringify(parsed, null, 6).replace(/\n\s*}/g, ' }')}`);
    } catch {
      options.push(`filter: { /* JSON inválido */ }`);
    }
  }
  if (config.sort && config.sort.trim() !== '') {
    const sortArr = config.sort.split(',').map(s => `'${s.trim()}'`).join(', ');
    options.push(`sort: [${sortArr}]`);
  }
  if (config.limit !== undefined) {
    options.push(`limit: ${config.limit}`);
  }

  const optionsStr = options.length > 0 ? `, {\n    ${options.join(',\n    ')}\n  }` : '';

  return `import directus from '@/services/directus/directus';
import { readItems } from '@directus/sdk';

try {
  const items = await directus.request(
    readItems(${collectionStr}${optionsStr})
  );
  console.log('Registros obtenidos:', items);
} catch (error) {
  console.error('Error Directus SDK:', error);
}`;
}

/**
 * Genera la representación de la petición HTTP REST equivalente
 */
export function generateHTTPRequest(config: RequestConfig): { method: string; url: string; body?: string } {
  const baseUrl = directusUrl || 'https://tu-directus-api.com';
  const table = config.collection || 'sys_projects';

  if (config.action === 'readMe') {
    return { method: 'GET', url: `${baseUrl}/users/me` };
  }

  if (table === 'directus_users') {
    return { method: 'GET', url: `${baseUrl}/users` };
  }
  if (table === 'directus_roles') {
    return { method: 'GET', url: `${baseUrl}/roles` };
  }
  if (table === 'directus_files') {
    return { method: 'GET', url: `${baseUrl}/files` };
  }

  if (config.action === 'readItem') {
    const params = new URLSearchParams();
    if (config.fields) params.append('fields', config.fields);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return { method: 'GET', url: `${baseUrl}/items/${table}/${config.id || '1'}${queryString}` };
  }

  if (config.action === 'createItem') {
    return { method: 'POST', url: `${baseUrl}/items/${table}`, body: config.payload };
  }

  if (config.action === 'updateItem') {
    return { method: 'PATCH', url: `${baseUrl}/items/${table}/${config.id || '1'}`, body: config.payload };
  }

  if (config.action === 'deleteItem') {
    return { method: 'DELETE', url: `${baseUrl}/items/${table}/${config.id || '1'}` };
  }

  // readItems
  const params = new URLSearchParams();
  if (config.fields) params.append('fields', config.fields);
  if (config.sort) params.append('sort', config.sort);
  if (config.limit !== undefined) params.append('limit', config.limit.toString());
  if (config.filter) {
    try {
      const obj = JSON.parse(config.filter);
      Object.entries(obj).forEach(([k, v]) => {
        if (typeof v === 'object' && v !== null) {
          Object.entries(v).forEach(([op, val]) => {
            params.append(`filter[${k}][${op}]`, String(val));
          });
        } else {
          params.append(`filter[${k}][_eq]`, String(v));
        }
      });
    } catch {
      params.append('filter', config.filter);
    }
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return { method: 'GET', url: `${baseUrl}/items/${table}${queryString}` };
}

/**
 * Esquemas de validación estática para simular comportamiento real de Directus en Modo Seguro
 */
const KNOWN_COLLECTION_SCHEMAS: Record<string, {
  validFields: string[];
  requiredFieldsOnCreate: string[];
  fieldTypes: Record<string, 'string' | 'number' | 'integer'>;
}> = {
  test_products: {
    validFields: ['id', 'date_created', 'category_id', 'sku', 'name', 'price', 'stock', 'status', 'description'],
    requiredFieldsOnCreate: ['name', 'price', 'stock', 'category_id'],
    fieldTypes: {
      name: 'string',
      price: 'number',
      stock: 'integer',
      category_id: 'integer',
      sku: 'string',
      status: 'string',
      description: 'string',
    },
  },
  test_categories: {
    validFields: ['id', 'date_created', 'name', 'code', 'status', 'description'],
    requiredFieldsOnCreate: ['name'],
    fieldTypes: {
      name: 'string',
      code: 'string',
      status: 'string',
      description: 'string',
    },
  },
};

export function validateSafeModePayload(config: RequestConfig): { isValid: boolean; errorDiagnostic?: DiagnosticResult; parsedPayload?: any } {
  // 1. Validar ID en acciones que lo requieren
  if (config.action === 'readItem' || config.action === 'updateItem' || config.action === 'deleteItem') {
    if (!config.id || config.id.trim() === '' || isNaN(Number(config.id))) {
      return {
        isValid: false,
        errorDiagnostic: {
          isError: true,
          httpStatus: 400,
          code: 'INVALID_PRIMARY_KEY',
          message: `El ID especificado "${config.id || ''}" no es un entero válido.`,
          rootCauseSpan: `Identificador Primario Inválido: La acción ${config.action} exige un ID numérico válido para localizar la fila en la tabla "${config.collection}".`,
          recommendationSpan: 'Ingresa un número entero positivo en el campo ID (ejemplo: 1, 2, 3).',
          rawResponse: { error: 'ID invalido o vacio' },
          latencyMs: 5,
        },
      };
    }
  }

  // 2. Validar JSON en createItem / updateItem
  if (config.action === 'createItem' || config.action === 'updateItem') {
    if (!config.payload || config.payload.trim() === '') {
      return {
        isValid: false,
        errorDiagnostic: {
          isError: true,
          httpStatus: 400,
          code: 'INVALID_PAYLOAD',
          message: 'El payload JSON se encuentra vacío.',
          rootCauseSpan: 'Cuerpo de Petición Vacío: Las operaciones de creación o actualización requieren un objeto JSON con los valores a guardar.',
          recommendationSpan: 'Escribe un objeto JSON válido entre llaves. Ejemplo: { "name": "Ejemplo", "price": 100 }',
          rawResponse: { error: 'Payload vacio' },
          latencyMs: 5,
        },
      };
    }

    let parsedPayload: any = null;
    try {
      parsedPayload = JSON.parse(config.payload);
    } catch (err: any) {
      return {
        isValid: false,
        errorDiagnostic: {
          isError: true,
          httpStatus: 400,
          code: 'INVALID_JSON_SYNTAX',
          message: `Sintaxis JSON errónea: ${err.message}`,
          rootCauseSpan: 'Sintaxis JSON Inválida: El texto en el campo Payload no cumple con la especificación JSON (faltan comillas dobles, comas sobrantes o llaves abiertas).',
          recommendationSpan: 'Revisa la ortografía del JSON. Ejemplo válido: { "name": "Producto", "price": 85000 }',
          rawResponse: { error: err.message, payload_ingresado: config.payload },
          latencyMs: 5,
        },
      };
    }

    if (typeof parsedPayload !== 'object' || parsedPayload === null || Array.isArray(parsedPayload)) {
      return {
        isValid: false,
        errorDiagnostic: {
          isError: true,
          httpStatus: 400,
          code: 'INVALID_PAYLOAD',
          message: 'El payload debe ser un objeto JSON {...}',
          rootCauseSpan: 'Tipo de Datos del Payload Incorrecto: Se envió un número, texto o arreglo simple en lugar de un objeto JSON estructurado.',
          recommendationSpan: 'Asegúrate de envolver tus campos dentro de llaves {...}.',
          rawResponse: { error: 'Se esperaba un objeto JSON', tipo_recibido: typeof parsedPayload },
          latencyMs: 5,
        },
      };
    }

    // 3. Validar Esquema de Campos de la Colección si es conocida
    const schema = KNOWN_COLLECTION_SCHEMAS[config.collection];
    if (schema) {
      const keys = Object.keys(parsedPayload);
      const invalidKeys = keys.filter(k => !schema.validFields.includes(k));

      if (invalidKeys.length > 0) {
        const fieldsList = invalidKeys.map(k => `"${k}"`).join(', ');
        return {
          isValid: false,
          errorDiagnostic: {
            isError: true,
            httpStatus: 400,
            code: 'FIELD_NOT_FOUND_IN_COLLECTION',
            message: `You don't have permission to access fields ${fieldsList} in collection "${config.collection}" or they do not exist.`,
            rootCauseSpan: `Campo(s) Inexistente(s) en la Tabla "${config.collection}": El payload enviado incluye ${fieldsList}, pero esa tabla NO tiene esas columnas definidas en la base de datos.`,
            recommendationSpan: `Remueve ${fieldsList} del payload. Los campos válidos en "${config.collection}" son: ${schema.validFields.join(', ')}.`,
            rawResponse: [
              {
                message: `You don't have permission to access fields ${fieldsList} in collection "${config.collection}" or they do not exist.`,
                extensions: { code: 'FORBIDDEN' }
              }
            ],
            latencyMs: 8,
          },
        };
      }

      // Validar Campos Requeridos en Inserción (createItem)
      if (config.action === 'createItem') {
        const missingRequired = schema.requiredFieldsOnCreate.filter(f => !(f in parsedPayload) || parsedPayload[f] === undefined || parsedPayload[f] === '');
        if (missingRequired.length > 0) {
          const reqStr = missingRequired.map(f => `"${f}"`).join(', ');
          return {
            isValid: false,
            errorDiagnostic: {
              isError: true,
              httpStatus: 400,
              code: 'FAILED_VALIDATION',
              message: `Faltan campos obligatorios para crear en "${config.collection}".`,
              rootCauseSpan: `Falló la Validación del Esquema: Se intentó crear un registro en "${config.collection}" omitiendo los campos requeridos: ${reqStr}.`,
              recommendationSpan: `Incluye los campos obligatorios en tu JSON de payload: ${reqStr}.`,
              rawResponse: { error: `Campos obligatorios faltantes: ${reqStr}` },
              latencyMs: 8,
            },
          };
        }
      }

      // Validar Tipos de Datos (números, enteros)
      for (const [key, val] of Object.entries(parsedPayload)) {
        const expected = schema.fieldTypes[key];
        if (expected === 'number' && typeof val !== 'number') {
          return {
            isValid: false,
            errorDiagnostic: {
              isError: true,
              httpStatus: 500,
              code: 'INTERNAL_SERVER_ERROR',
              message: 'An unexpected error occurred.',
              rootCauseSpan: `Error Interno de Base de Datos (Incompatibilidad de Tipo de Dato / Type Mismatch): Directus retornaría un error HTTP 500 (INTERNAL_SERVER_ERROR) porque el motor de la base de datos (MySQL/PostgreSQL) rechaza un valor incompatible. Una de las causas principales es enviar una cadena de texto (ejemplo: "${val}") a un campo numérico/float (como "${key}"), o en general enviar un tipo de dato que no coincide con el configurado en la BD.`,
              recommendationSpan: `Revisa que los tipos de datos en tu JSON coincidan exactamente con la definición de las columnas en Directus. Si la columna en la BD es numérica/float, envía números puros sin comillas (ejemplo: ${key}: 45000.50 en lugar de "${val}").`,
              rawResponse: [
                {
                  message: 'An unexpected error occurred.',
                  extensions: {
                    code: 'INTERNAL_SERVER_ERROR'
                  }
                }
              ],
              latencyMs: 8,
            },
          };
        }
        if (expected === 'integer' && (!Number.isInteger(val))) {
          return {
            isValid: false,
            errorDiagnostic: {
              isError: true,
              httpStatus: 400,
              code: 'FAILED_VALIDATION',
              message: `El campo "${key}" debe ser un número entero.`,
              rootCauseSpan: `Incompatibilidad de Tipo de Dato: El campo "${key}" requiere un número entero (ej. 15), pero se envió "${val}".`,
              recommendationSpan: `Asegúrate de que "${key}" sea un entero sin decimales ni comillas.`,
              rawResponse: { error: `Entero invalido para "${key}"` },
              latencyMs: 8,
            },
          };
        }
      }
    }

    return { isValid: true, parsedPayload };
  }

  return { isValid: true };
}

/**
 * Ejecuta la consulta de Directus real o simulada con protección de datos
 */
export async function executeDirectusTest(config: RequestConfig): Promise<DiagnosticResult> {
  const startTime = performance.now();
  const safeMode = config.safeMode !== false; // Seguro por defecto

  // PROTECCION DE SEGURIDAD: Prevenir borrados o modificaciones reales si safeMode está activo
  if (safeMode && (config.action === 'deleteItem' || config.action === 'updateItem' || config.action === 'createItem')) {
    // 🔍 VALIDACIÓN REAL DE ESQUEMA ANTES DE SIMULAR
    const validation = validateSafeModePayload(config);
    if (!validation.isValid && validation.errorDiagnostic) {
      return validation.errorDiagnostic;
    }

    const actionText = config.action === 'deleteItem' ? 'ELIMINAR (DELETE)' : config.action === 'updateItem' ? 'ACTUALIZAR (PATCH)' : 'CREAR (POST)';
    
    return {
      isError: false,
      latencyMs: 12,
      rawResponse: {
        _simulado: true,
        _mensaje_seguridad: `[MODO SEGURO ACTIVO]: La petición de ${actionText} fue validada correctamente contra el esquema de la BD (JSON válido, campos permitidos y tipos compatibles), pero NO fue ejecutada en la base de datos real para proteger tus datos.`,
        _estado_validacion: 'APROBADO - El payload y la estructura cumplen con los tipos y campos requeridos por la tabla.',
        coleccion: config.collection,
        id_objetivo: config.id || '1',
        payload_enviado: validation.parsedPayload || config.payload,
        nota_educativa: 'En tu código real de producción, esta función llamaría a directus.request(' + config.action + '(...)) modificando la base de datos.',
      },
    };
  }

  try {
    let result: any = null;
    const colName = config.collection || 'sys_projects';

    // REGLA DE DIRECTUS SDK: Manejo inteligente de colecciones del sistema
    if (colName === 'directus_users') {
      if (config.action === 'readItem') {
        const idVal = config.id || '1';
        result = await withAutoRefresh(() => directus.request(readUser(idVal)));
      } else {
        const queryOpts: any = {};
        if (config.fields) queryOpts.fields = config.fields.split(',').map(f => f.trim()).filter(Boolean);
        if (config.limit) queryOpts.limit = config.limit;
        result = await withAutoRefresh(() => directus.request(readUsers(queryOpts)));
      }
    } else if (colName === 'directus_roles') {
      if (config.action === 'readItem') {
        const idVal = config.id || '1';
        result = await withAutoRefresh(() => directus.request(readRole(idVal)));
      } else {
        result = await withAutoRefresh(() => directus.request(readRoles()));
      }
    } else if (colName === 'directus_files') {
      if (config.action === 'readItem') {
        const idVal = config.id || '1';
        result = await withAutoRefresh(() => directus.request(readFile(idVal)));
      } else {
        result = await withAutoRefresh(() => directus.request(readFiles()));
      }
    } else if (config.action === 'readMe') {
      const { readMe } = await import('@directus/sdk');
      result = await withAutoRefresh(() => directus.request(readMe()));
    } else if (config.action === 'readItem') {
      const fieldsArr = config.fields ? config.fields.split(',').map(f => f.trim()).filter(Boolean) : undefined;
      const idVal = config.id || '1';
      result = await withAutoRefresh(() =>
        directus.request(
          readItem(config.collection, idVal, fieldsArr ? { fields: fieldsArr as any } : undefined)
        )
      );
    } else if (config.action === 'createItem') {
      const payload = config.payload ? JSON.parse(config.payload) : {};
      result = await withAutoRefresh(() =>
        directus.request(createItem(config.collection, payload))
      );
    } else if (config.action === 'updateItem') {
      const idVal = config.id || '1';
      const payload = config.payload ? JSON.parse(config.payload) : {};
      result = await withAutoRefresh(() =>
        directus.request(updateItem(config.collection, idVal, payload))
      );
    } else if (config.action === 'deleteItem') {
      const idVal = config.id || '1';
      result = await withAutoRefresh(() =>
        directus.request(deleteItem(config.collection, idVal))
      );
    } else {
      // readItems
      const queryOpts: any = {};
      if (config.fields && config.fields.trim() !== '') {
        queryOpts.fields = config.fields.split(',').map(f => f.trim()).filter(Boolean);
      }
      if (config.filter && config.filter.trim() !== '') {
        queryOpts.filter = JSON.parse(config.filter);
      }
      if (config.sort && config.sort.trim() !== '') {
        queryOpts.sort = config.sort.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (config.limit !== undefined && config.limit >= -1) {
        queryOpts.limit = config.limit;
      }

      result = await withAutoRefresh(() =>
        directus.request(readItems(config.collection, queryOpts))
      );
    }

    const endTime = performance.now();
    return {
      isError: false,
      rawResponse: result,
      latencyMs: Math.round(endTime - startTime),
    };
  } catch (err: any) {
    const endTime = performance.now();
    return diagnoseDirectusError(err, Math.round(endTime - startTime), config);
  }
}

/**
 * Desglosa y diagnostica errores de Directus SDK entregando información explicativa en español
 */
export function diagnoseDirectusError(error: any, latencyMs: number = 0, config?: RequestConfig): DiagnosticResult {
  console.warn('[Directus Test Diagnóstico]:', error);

  let httpStatus = error?.status || error?.response?.status || 500;
  let directusErrors = error?.errors || error?.response?.data?.errors || [];
  let firstError = directusErrors[0] || {};
  let code = firstError?.extensions?.code || firstError?.code || error?.code || 'UNKNOWN_ERROR';
  let rawMessage = firstError?.message || error?.message || String(error) || 'Ocurrió un error inesperado al consultar la API de Directus.';

  let rootCause = 'Ocurrió un problema de comunicación o ejecución con el SDK de Directus.';
  let recommendation = 'Revisa la consola del navegador para inspeccionar los detalles de la pila de llamadas (stack trace).';

  // 1. Detección de Campos Inexistentes en Colección (ej: "price", "stock" en "test_categories")
  const missingFieldsMatch = rawMessage.match(/permission to access fields?\s+(.+?)\s+in collection\s+"([^"]+)"/i) ||
                             rawMessage.match(/fields?\s+(.+?)\s+in collection\s+"([^"]+)"\s+or they do not exist/i);

  // 2. Detección de Colección Sin Permiso o Tabla Inexistente (HTTP 403 COLLECTION_FORBIDDEN)
  const collectionForbiddenMatch = rawMessage.match(/permission to access collection\s+"([^"]+)"/i) ||
                                   (firstError?.extensions?.reason && String(firstError.extensions.reason).match(/permission to access collection\s+"([^"]+)"/i));

  // 3. Detección de Violación de Clave Foránea (INVALID_FOREIGN_KEY)
  const fkMatch = rawMessage.match(/Invalid foreign key "([^"]+)" for field "([^"]+)" in collection "([^"]+)"/i);

  // 4. Detección de Validación Fallida / Campo Obligatorio Faltante (FAILED_VALIDATION / required)
  const isRequiredField = firstError?.extensions?.type === 'required' ||
                          rawMessage.includes('Value is required') ||
                          rawMessage.includes('is required');

  // 5. Detección de Valor Duplicado en Campo Único (RECORD_NOT_UNIQUE / UNIQUE_VIOLATION)
  const isUniqueViolation = code === 'RECORD_NOT_UNIQUE' ||
                            rawMessage.includes('has to be unique') ||
                            rawMessage.includes('Duplicate entry');

  // 6. Detección de Violación de Restricción de Borrado Padre (CANNOT_DELETE_PARENT)
  const isDeleteConstraint = rawMessage.includes('Cannot delete or update a parent row') ||
                             rawMessage.includes('foreign key constraint fails') ||
                             rawMessage.includes('FOREIGN KEY constraint failed');

  if (missingFieldsMatch) {
    const fieldsStr = missingFieldsMatch[1]; // ej: '"price", "stock"'
    const collStr = missingFieldsMatch[2];   // ej: 'test_categories'
    httpStatus = 400;
    code = 'FIELD_NOT_FOUND_IN_COLLECTION';
    rootCause = `Campo(s) Inexistente(s) en la Colección: La consulta solicita los campos ${fieldsStr} en la tabla "${collStr}", pero esos campos NO existen en esa colección (o tu usuario no tiene permiso sobre ellos).`;
    recommendation = `Elimina ${fieldsStr} del parámetro 'fields' al consultar "${collStr}". Revisa los campos reales de la tabla "${collStr}" en Directus Admin.`;
  } else if (collectionForbiddenMatch) {
    const collStr = collectionForbiddenMatch[1];
    httpStatus = 403;
    code = 'COLLECTION_FORBIDDEN';
    rootCause = `Tabla Inexistente o Sin Permiso: Directus protege la base de datos agrupando 2 posibles casos bajo este error:
• Caso 1 (Tabla Inexistente): La tabla "${collStr}" NO existe en la base de datos (verifica si tiene un error tipográfico en el nombre).
• Caso 2 (Permisos Faltantes): La tabla "${collStr}" sí existe, pero tu rol de usuario en Directus no tiene permisos asignados para consultarla o modificarla.`;
    recommendation = `1. Verifica la ortografía del nombre de la tabla "${collStr}" (letras exactas, sin espacios ni caracteres incorrectos).
2. Si la tabla sí existe en Directus, ve a: Panel Directus -> Configuración -> Roles y Permisos -> Selecciona tu rol -> Otorga permisos de lectura/escritura a la colección "${collStr}".`;
  } else if (fkMatch || code === 'INVALID_FOREIGN_KEY' || firstError?.extensions?.code === 'INVALID_FOREIGN_KEY') {
    const val = firstError?.extensions?.value || (Array.isArray(fkMatch) ? fkMatch[1] : 'id_enviado');
    const field = firstError?.extensions?.field || (Array.isArray(fkMatch) ? fkMatch[2] : 'category_id');
    const collection = firstError?.extensions?.collection || (Array.isArray(fkMatch) ? fkMatch[3] : 'test_products');

    httpStatus = 400;
    code = 'INVALID_FOREIGN_KEY';
    rootCause = `Violación de Clave Foránea (Foreign Key Inexistente): Se intentó asignar el ID = "${val}" en la columna relacional "${field}" de la tabla "${collection}", pero ese ID NO EXISTE en la tabla padre referenciada.`;
    recommendation = `Asegúrate de crear primero la fila correspondiente en la tabla padre (ejemplo: "test_categories") y usar su ID válido, o usa un ID de categoría que ya exista en la base de datos.`;
  } else if (isRequiredField || code === 'FAILED_VALIDATION') {
    httpStatus = 400;
    code = 'FAILED_VALIDATION (REQUIRED_FIELD_MISSING)';
    const fieldName = firstError?.extensions?.field || 'campo_obligatorio';
    rootCause = `Campo Obligatorio Faltante en el Payload: Directus rechazó la creación/actualización porque el campo obligatorio "${fieldName}" no fue incluido o se envió vacío.`;
    recommendation = `Agrega el campo "${fieldName}" con un valor válido en tu JSON de payload. Ejemplo: { "${fieldName}": "Valor requerido" }`;
  } else if (isUniqueViolation) {
    httpStatus = 400;
    code = 'RECORD_NOT_UNIQUE (DUPLICATE_ENTRY)';
    const fieldName = firstError?.extensions?.field || 'columna_unica';
    rootCause = `Violación de Restricción Única (Valor Duplicado): Se intentó guardar un registro con un valor que ya existe en la columna "${fieldName}" (marcada como UNIQUE en la BD).`;
    recommendation = `Cambia el valor de "${fieldName}" en el payload para que sea único en la base de datos.`;
  } else if (isDeleteConstraint || (config?.action === 'deleteItem' && (code === 'INTERNAL_SERVER_ERROR' || rawMessage.toLowerCase().includes('unexpected error')))) {
    httpStatus = 500;
    code = 'CANNOT_DELETE_PARENT (FOREIGN_KEY_RESTRICT)';
    rootCause = `Restricción de Integridad Referencial en Borrado (Evitar Eliminación / Restrict): Directus y la base de datos rechazaron la eliminación del registro con ID = "${config?.id || 'seleccionado'}" en la tabla "${config?.collection || 'padre'}". Esto ocurre porque existen registros hijos en otra tabla que dependen de él (ej: productos vinculados a esta categoría) y la relación está configurada como "Evitar eliminación" (RESTRICT/NO ACTION).`;
    recommendation = `1. Elimina o reasigna primero los registros hijos asociados a este ID antes de borrar la fila padre.
2. Si deseas que se borre todo automáticamente, cambia la relación en Directus Admin a 'Al Eliminar: En Cascada' (CASCADE).
3. Si deseas que los hijos queden sin padre (vacíos), cámbiala a 'Al Eliminar: Poner en Nulo' (SET NULL).`;
  } else if (rawMessage.includes("You don't have permission to access this") || httpStatus === 403 || code === 'FORBIDDEN') {
    httpStatus = 403;
    code = 'FORBIDDEN';
    rootCause = `Registro No Encontrado o Permiso Denegado:
• Causa 1 (ID Inexistente): El ID solicitado NO existe en la base de datos. Por seguridad, Directus responde con HTTP 403 en lugar de 404 para no revelar qué IDs existen a usuarios sin permisos totales.
• Causa 2 (Filtro de Permisos): El registro existe pero tu rol de usuario no tiene permisos para ver o modificar esta fila específica.`;
    recommendation = `Verifica que el ID ingresado realmente exista en la tabla (puedes pulsar el botón 'Ver Tabla en BD' o consultar con readItems para ver los IDs disponibles).`;
  } else if (httpStatus === 401 || code === 'INVALID_TOKEN' || code === 'TOKEN_EXPIRED' || code === 'INVALID_CREDENTIALS') {
    httpStatus = 401;
    code = 'UNAUTHORIZED (TOKEN_EXPIRED)';
    rootCause = `Sesión Expirada o No Autenticado: El token JWT de acceso de Directus no es válido o ha caducado.`;
    recommendation = `En la plataforma AppKancan, asegúrate de envolver las llamadas con withAutoRefresh(() => directus.request(...)) para renovar la sesión automáticamente.`;
  } else if (code === 'INTERNAL_SERVER_ERROR' || firstError?.extensions?.code === 'INTERNAL_SERVER_ERROR' || rawMessage.toLowerCase().includes('unexpected error')) {
    httpStatus = 500;
    code = 'INTERNAL_SERVER_ERROR (DATA_TYPE_MISMATCH)';
    rootCause = `Error Interno de Base de Datos (Incompatibilidad de Tipo de Dato / Type Mismatch): Directus retornó un error HTTP 500 (INTERNAL_SERVER_ERROR) porque el motor de la base de datos (MySQL/PostgreSQL) rechazó un valor cuya estructura o tipo de dato no coincide con la definición de la columna en la BD (por ejemplo, enviar un texto a una columna numérico/float o un valor no ejecutable).`;
    recommendation = `Revisa que los tipos de datos en tu JSON coincidan exactamente con la definición de las columnas en Directus. Si la columna en la BD es numérica/float, envía números puros sin comillas (ejemplo: price: 45000.50).`;
  } else if (rawMessage.includes('Cannot use readItems for core collections') || rawMessage.includes('Cannot use readItem for core collections')) {
    httpStatus = 400;
    code = 'CORE_COLLECTION_FUNCTION_MISMATCH';
    rootCause = 'Función del SDK Incompatible: Las colecciones del sistema de Directus (directus_users, directus_roles, directus_files) exigen usar las funciones específicas `readUsers()`, `readRoles()`, `readFiles()`.';
    recommendation = 'Reemplaza `readItems(...)` por `readUsers(...)`, `readRoles(...)` o `readFiles(...)` importadas de `@directus/sdk`.';
  } else if (httpStatus === 404 || code === 'RECORD_NOT_FOUND') {
    httpStatus = 404;
    code = 'RECORD_NOT_FOUND';
    rootCause = 'Registro No Encontrado: No existe ningún registro con el ID o clave primaria especificada en la base de datos.';
    recommendation = 'Verifica que el ID existe previamente en la tabla antes de hacer la búsqueda o modificación.';
  } else if (httpStatus === 400 || code === 'INVALID_PAYLOAD' || code === 'INVALID_QUERY') {
    httpStatus = 400;
    rootCause = `Consulta o Payload Inválido: La petición fue rechazada por el servidor Directus (${rawMessage}).`;
    recommendation = 'Revisa que los nombres de los campos coincidan exactamente con la base de datos y que los operadores de filtro inicien con guion bajo (ej. _eq, _contains).';
  } else if (rawMessage.toLowerCase().includes('json') || error instanceof SyntaxError) {
    httpStatus = 400;
    code = 'INVALID_JSON_SYNTAX';
    rootCause = 'Sintaxis JSON Errónea: El texto ingresado en el filtro o payload no es un JSON válido.';
    recommendation = 'Revisa comillas dobles, comas o llaves del JSON.';
  }

  return {
    isError: true,
    httpStatus,
    code,
    message: rawMessage,
    rootCauseSpan: rootCause,
    recommendationSpan: recommendation,
    rawResponse: error?.response?.data || error?.errors || (Array.isArray(directusErrors) && directusErrors.length > 0 ? directusErrors : { error: String(error) }),
    latencyMs,
  };
}
