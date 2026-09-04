export interface TutorialChallenge {
  id: string;
  level: number;
  levelTitle: string;
  title: string;
  description: string;
  dbConcept: string;
  hintQuery: {
    collection: string;
    action: 'readItems' | 'readItem' | 'createItem' | 'updateItem' | 'deleteItem';
    fields?: string;
    filter?: string;
    sort?: string;
    limit?: number;
    payload?: string;
  };
  expectedKeywords: string[];
  explanation: string;
}

export const TUTORIAL_CHALLENGES: TutorialChallenge[] = [
  {
    id: 'challenge-1',
    level: 1,
    levelTitle: 'Nivel 1: Lectura Básica (SELECT)',
    title: 'Consultar Lista de Productos',
    description: 'En SQL escribirías `SELECT id, name, price, stock, status FROM test_products LIMIT 5`. La columna se llama `status` en inglés pero los valores guardados en negocio se registran en español ("disponible").',
    dbConcept: 'SELECT id, name, price, stock, status FROM test_products LIMIT 5;',
    hintQuery: {
      collection: 'test_products',
      action: 'readItems',
      fields: 'id, name, price, stock, status',
      limit: 5,
    },
    expectedKeywords: ['fields', 'test_products'],
    explanation: 'Siguiendo el estándar, el nombre de la columna es `status` (inglés), pero el texto del valor guardado es "disponible" (español).',
  },
  {
    id: 'challenge-2',
    level: 2,
    levelTitle: 'Nivel 2: Filtros y Búsquedas (WHERE)',
    title: 'Filtrar Productos Disponibles y con Stock',
    description: 'Filtrar donde `status` sea igual a "disponible" y `stock` sea mayor que 0. En Directus los filtros se organizan en objetos JSON usando `_eq` y `_gt`.',
    dbConcept: 'SELECT * FROM test_products WHERE status = "disponible" AND stock > 0;',
    hintQuery: {
      collection: 'test_products',
      action: 'readItems',
      fields: 'id, name, price, stock, status',
      filter: JSON.stringify({
        status: { _eq: 'disponible' },
        stock: { _gt: 0 }
      }, null, 2),
      limit: 10,
    },
    expectedKeywords: ['filter', '_eq', '_gt'],
    explanation: 'El operador `_eq` busca la coincidencia exacta con el valor en español `"disponible"`.',
  },
  {
    id: 'challenge-3',
    level: 3,
    levelTitle: 'Nivel 3: Relaciones y Claves Foráneas (JOIN)',
    title: 'Consultar Productos y su Categoría (Foreign Key category_id)',
    description: '`test_products` se conecta mediante `category_id` a `test_categories`. Solicitamos `category_id.name` o `category_id.description` para hacer el JOIN automático.',
    dbConcept: 'SELECT p.name, p.price, c.name AS category FROM test_products p JOIN test_categories c ON p.category_id = c.id;',
    hintQuery: {
      collection: 'test_products',
      action: 'readItems',
      fields: 'id, name, price, stock, status, category_id.name, category_id.description',
      limit: 5,
    },
    expectedKeywords: ['category_id.name', 'test_products'],
    explanation: 'La sintaxis de punto (`relacion.campo`) le indica a Directus que realice un JOIN implícito en la base de datos de manera limpia.',
  },
  {
    id: 'challenge-4',
    level: 4,
    levelTitle: 'Nivel 4: Inserción con Clave Foránea (INSERT)',
    title: 'Registrar un Nuevo Producto Asociado a una Categoría',
    description: 'Inserta un nuevo registro en `test_products` enviando la clave foránea `category_id: 1` y el estado en español `"disponible"`.',
    dbConcept: 'INSERT INTO test_products (category_id, sku, name, price, stock, status) VALUES (1, "SKU-RGB-001", "Mouse Gamer RGB", 85000, 15, "disponible");',
    hintQuery: {
      collection: 'test_products',
      action: 'createItem',
      payload: JSON.stringify({
        category_id: 1,
        sku: 'SKU-RGB-001',
        name: 'Mouse Gamer RGB',
        price: 85000,
        stock: 15,
        status: 'disponible'
      }, null, 2),
    },
    expectedKeywords: ['createItem', 'name', 'category_id'],
    explanation: 'La clave foránea `category_id` se vincula con el ID de `test_categories`, guardando el valor de `status` como `"disponible"`.',
  },
  {
    id: 'challenge-5',
    level: 5,
    levelTitle: 'Nivel 5: Arquitectura de AppKancan (withAutoRefresh & Session)',
    title: 'Entender la envoltura withAutoRefresh',
    description: 'En este proyecto AppKancan, todas las consultas reales usan `withAutoRefresh(() => directus.request(...))` para verificar y renovar el token JWT automáticamente.',
    dbConcept: '-- Petición autenticada con renovación automática del Token JWT de Directus',
    hintQuery: {
      collection: 'test_categories',
      action: 'readItems',
      fields: 'id, name, code, status',
      limit: 5,
    },
    expectedKeywords: ['test_categories'],
    explanation: '`withAutoRefresh` previene que las peticiones del usuario fallen por token expirado (error 401 Unauthorized), renovando la sesión en segundo plano.',
  },
];

export interface SdkFunctionDetail {
  functionName: string;
  httpMethod: string;
  signature: string;
  description: string;
  useCase: string;
  exampleSnippet: string;
  returnedDataExample: string;
}

export const SDK_FUNCTIONS_EXPLANATION: SdkFunctionDetail[] = [
  {
    functionName: 'readItems',
    httpMethod: 'GET',
    signature: 'readItems(collection, queryOptions)',
    description: 'Consulta una lista de registros de una tabla personalizada.',
    useCase: 'Obtener listados, grillas de productos, reportes filtrados.',
    exampleSnippet: `const productos = await directus.request(
  readItems('test_products', {
    fields: ['id', 'name', 'price', 'status', 'category_id.name'],
    filter: { status: { _eq: 'disponible' } },
    limit: 5
  })
);`,
    returnedDataExample: `[
  {
    "id": 1,
    "name": "Teclado Mecánico RGB",
    "price": 150000,
    "status": "disponible",
    "category_id": {
      "name": "Periféricos & Hardware"
    }
  },
  {
    "id": 2,
    "name": "Mouse Ergonómico Inalámbrico",
    "price": 85000,
    "status": "disponible",
    "category_id": {
      "name": "Periféricos & Hardware"
    }
  }
]`,
  },
  {
    functionName: 'readItem',
    httpMethod: 'GET',
    signature: 'readItem(collection, id, queryOptions)',
    description: 'Consulta una sola fila de la base de datos por su clave primaria (ID).',
    useCase: 'Pantallas de detalle, formularios de edición.',
    exampleSnippet: `const producto = await directus.request(
  readItem('test_products', 1, {
    fields: ['id', 'name', 'price', 'stock', 'status']
  })
);`,
    returnedDataExample: `{
  "id": 1,
  "name": "Teclado Mecánico RGB",
  "price": 150000,
  "stock": 25,
  "status": "disponible"
}`,
  },
  {
    functionName: 'createItem',
    httpMethod: 'POST',
    signature: 'createItem(collection, payload)',
    description: 'Inserta una nueva fila en la tabla especificando sus valores en un objeto JSON.',
    useCase: 'Formularios de registro de nuevo producto o categoría.',
    exampleSnippet: `const nuevoProducto = await directus.request(
  createItem('test_products', {
    category_id: 1,
    sku: 'SKU-RGB-001',
    name: 'Audífonos Gamer 7.1',
    price: 180000,
    stock: 12,
    status: 'disponible'
  })
);`,
    returnedDataExample: `{
  "id": 3,
  "date_created": "2026-08-05T14:10:00.000Z",
  "category_id": 1,
  "sku": "SKU-RGB-001",
  "name": "Audífonos Gamer 7.1",
  "price": 180000,
  "stock": 12,
  "status": "disponible"
}`,
  },
  {
    functionName: 'updateItem',
    httpMethod: 'PATCH',
    signature: 'updateItem(collection, id, payload)',
    description: 'Actualiza parcialmente los valores de una fila existente especificando su ID.',
    useCase: 'Editar precio, cambiar estado a descontinuado, ajustar stock.',
    exampleSnippet: `const productoActualizado = await directus.request(
  updateItem('test_products', 1, {
    price: 135000,
    stock: 30,
    status: 'disponible'
  })
);`,
    returnedDataExample: `{
  "id": 1,
  "name": "Teclado Mecánico RGB",
  "price": 135000,
  "stock": 30,
  "status": "disponible"
}`,
  },
  {
    functionName: 'deleteItem',
    httpMethod: 'DELETE',
    signature: 'deleteItem(collection, id)',
    description: 'Elimina permanentemente una fila de la base de datos por su ID.',
    useCase: 'Acciones de borrado explícitas.',
    exampleSnippet: `// Elimina la fila con ID = 1
await directus.request(
  deleteItem('test_products', 1)
);`,
    returnedDataExample: `// Directus retorna HTTP 204 No Content (cuerpo vacío al eliminar con éxito)`,
  },
  {
    functionName: 'readUsers',
    httpMethod: 'GET',
    signature: 'readUsers(queryOptions)',
    description: 'Función especializada obligatoria para consultar la tabla del sistema directus_users.',
    useCase: 'Listar usuarios, asignaciones de personal.',
    exampleSnippet: `const usuarios = await directus.request(
  readUsers({
    fields: ['id', 'first_name', 'last_name', 'email', 'role.name'],
    limit: 5
  })
);`,
    returnedDataExample: `[
  {
    "id": "e3a8907f-7123-4aef-b921-998811223344",
    "first_name": "Carlos",
    "last_name": "Mendoza",
    "email": "carlos.mendoza@empresa.com",
    "role": {
      "name": "Administrador de Sistemas"
    }
  }
]`,
  },
  {
    functionName: 'readRoles',
    httpMethod: 'GET',
    signature: 'readRoles(queryOptions)',
    description: 'Función especializada para consultar la tabla del sistema directus_roles.',
    useCase: 'Verificar permisos y roles de usuario.',
    exampleSnippet: `const roles = await directus.request(
  readRoles({
    fields: ['id', 'name', 'description']
  })
);`,
    returnedDataExample: `[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Administrador",
    "description": "Acceso total al panel de administración de Directus"
  }
]`,
  },
  {
    functionName: 'readFiles',
    httpMethod: 'GET',
    signature: 'readFiles(queryOptions)',
    description: 'Función especializada para consultar la tabla de archivos y multimedia directus_files.',
    useCase: 'Galerías de imágenes, adjuntos, PDFs.',
    exampleSnippet: `const archivos = await directus.request(
  readFiles({
    fields: ['id', 'title', 'filename_download', 'type', 'filesize'],
    limit: 5
  })
);`,
    returnedDataExample: `[
  {
    "id": "f8923bc1-4455-6677-8899-aabbccddeeff",
    "title": "Manual de Usuario PDF",
    "filename_download": "manual_v1.pdf",
    "type": "application/pdf",
    "filesize": 1048576
  }
]`,
  },
  {
    functionName: 'readMe',
    httpMethod: 'GET',
    signature: 'readMe(queryOptions)',
    description: 'Obtiene el perfil y datos del usuario actualmente autenticado en la sesión.',
    useCase: 'Barra superior, nombre de usuario activo, foto de perfil.',
    exampleSnippet: `const miPerfil = await directus.request(
  readMe({
    fields: ['id', 'first_name', 'email', 'avatar']
  })
);`,
    returnedDataExample: `{
  "id": "e3a8907f-7123-4aef-b921-998811223344",
  "first_name": "Carlos",
  "email": "carlos.mendoza@empresa.com",
  "avatar": "99bb88aa-1122-3344-5566-77889900aabb"
}`,
  },
];

export interface CheatSheetOperator {
  operator: string;
  sqlEquivalent: string;
  exampleJson: string;
  description: string;
}

export const CHEAT_SHEET_OPERATORS: CheatSheetOperator[] = [
  {
    operator: '_eq',
    sqlEquivalent: 'campo = valor',
    exampleJson: '{\n  "status": {\n    "_eq": "disponible"\n  }\n}',
    description: 'Igualdad exacta. Filtra registros donde el campo coincide perfectamente con el valor enviado.',
  },
  {
    operator: '_neq',
    sqlEquivalent: 'campo != valor',
    exampleJson: '{\n  "status": {\n    "_neq": "agotado"\n  }\n}',
    description: 'No igual. Excluye los registros que tengan este valor específico.',
  },
  {
    operator: '_contains',
    sqlEquivalent: "campo LIKE '%valor%'",
    exampleJson: '{\n  "name": {\n    "_contains": "Mouse"\n  }\n}',
    description: 'Búsqueda parcial de texto (contiene la palabra ingresada).',
  },
  {
    operator: '_icontains',
    sqlEquivalent: "ILIKE '%valor%'",
    exampleJson: '{\n  "name": {\n    "_icontains": "teclado"\n  }\n}',
    description: 'Contiene texto sin importar mayúsculas ni minúsculas.',
  },
  {
    operator: '_starts_with',
    sqlEquivalent: "campo LIKE 'valor%'",
    exampleJson: '{\n  "sku": {\n    "_starts_with": "SKU-RGB"\n  }\n}',
    description: 'El texto del campo inicia con la secuencia indicada.',
  },
  {
    operator: '_ends_with',
    sqlEquivalent: "campo LIKE '%valor'",
    exampleJson: '{\n  "sku": {\n    "_ends_with": "-001"\n  }\n}',
    description: 'El texto del campo termina con la secuencia indicada.',
  },
  {
    operator: '_in',
    sqlEquivalent: "campo IN ('A', 'B')",
    exampleJson: '{\n  "status": {\n    "_in": ["disponible", "agotado"]\n  }\n}',
    description: 'El campo coincide con cualquiera de los elementos listados en el arreglo.',
  },
  {
    operator: '_between',
    sqlEquivalent: 'campo BETWEEN min AND max',
    exampleJson: '{\n  "price": {\n    "_between": [50000, 200000]\n  }\n}',
    description: 'Filtra por un rango inclusivo numérico o de fechas [minimo, maximo].',
  },
  {
    operator: '_null',
    sqlEquivalent: 'campo IS NULL / IS NOT NULL',
    exampleJson: '{\n  "category_id": {\n    "_null": false\n  }\n}',
    description: 'Verifica si un campo relacional o descriptivo está lleno (`false`) o vacío (`true`).',
  },
  {
    operator: '_gt / _gte',
    sqlEquivalent: 'campo > valor / campo >= valor',
    exampleJson: '{\n  "stock": {\n    "_gt": 0\n  }\n}',
    description: 'Mayor que (_gt) o Mayor o igual que (_gte).',
  },
  {
    operator: '_lt / _lte',
    sqlEquivalent: 'campo < valor / campo <= valor',
    exampleJson: '{\n  "price": {\n    "_lte": 100000\n  }\n}',
    description: 'Menor que (_lt) o Menor o igual que (_lte).',
  },
  {
    operator: '_and / _or',
    sqlEquivalent: 'CONDICION_1 AND/OR CONDICION_2',
    exampleJson: '{\n  "_or": [\n    { "status": { "_eq": "disponible" } },\n    { "stock": { "_gt": 5 } }\n  ]\n}',
    description: 'Agrupa múltiples condiciones lógicas usando Y (_and) u Ó (_or).',
  },
];

export interface ErrorScenario {
  id: string;
  name: string;
  httpStatus: number;
  code: string;
  title: string;
  description: string;
  howToTrigger: {
    collection: string;
    action: 'readItems' | 'readItem' | 'createItem' | 'updateItem' | 'deleteItem';
    id?: string;
    fields?: string;
    filter?: string;
    payload?: string;
    limit?: number;
  };
  rootCause: string;
  solution: string;
}

export const ERROR_LAB_SCENARIOS: ErrorScenario[] = [
  {
    id: 'err-collection-forbidden',
    name: 'Error 403: Tabla Inexistente o Sin Permiso (COLLECTION_FORBIDDEN)',
    httpStatus: 403,
    code: 'COLLECTION_FORBIDDEN',
    title: 'Tabla No Existe en Directus o Rol Sin Permisos',
    description: 'Ocurre cuando se intenta consultar o modificar una colección/tabla que no existe en la base de datos o sobre la cual tu rol de usuario no tiene permisos configurados (ej: "test_name" o "tabla_inexistente").',
    howToTrigger: {
      collection: 'test_name',
      action: 'readItems',
      limit: 1,
    },
    rootCause: 'Directus protege la base de datos mediante seguridad por oscuridad (Security by Obscurity) respondiendo HTTP 403 FORBIDDEN tanto si la tabla NO EXISTE como si el usuario NO TIENE PERMISOS para acceder a ella.',
    solution: '1. Verificar la ortografía del nombre de la tabla (ej. "test_name"). 2. Si la tabla sí existe, ir a Directus Admin > Configuración > Roles y Permisos y conceder permisos de acceso a tu rol.',
  },
  {
    id: 'err-core-collections',
    name: 'Error 400: Uso Erróneo de readItems en Colección del Sistema',
    httpStatus: 400,
    code: 'CORE_COLLECTION_FUNCTION_MISMATCH',
    title: 'Cannot use readItems for core collections',
    description: 'Ocurre al intentar consultar colecciones del sistema (directus_users, directus_roles) usando la función genérica readItems() en lugar de las funciones especializadas del SDK.',
    howToTrigger: {
      collection: 'directus_users',
      action: 'readItems',
      limit: 1,
    },
    rootCause: 'El SDK de Directus prohíbe el uso de readItems() para colecciones del sistema. Exige usar readUsers(), readRoles(), readFiles().',
    solution: 'Importar e invocar `readUsers()` o `readRoles()` directamente desde `@directus/sdk`.',
  },
  {
    id: 'err-forbidden',
    name: 'Error 400: Campo Inexistente o Sin Permiso (FIELD_NOT_FOUND)',
    httpStatus: 400,
    code: 'FIELD_NOT_FOUND_IN_COLLECTION',
    title: 'Campo Inexistente Solicitado en la Colección',
    description: 'Ocurre cuando la consulta solicita en "fields" campos que no existen en la definición de la tabla en Directus (ej: pedir "price" o "stock" en "test_categories").',
    howToTrigger: {
      collection: 'test_categories',
      action: 'readItems',
      fields: 'id, name, price, stock',
      limit: 1,
    },
    rootCause: 'La tabla `test_categories` solo tiene los campos (id, name, code, status, description). Los campos price y stock corresponden a `test_products`.',
    solution: 'Eliminar "price, stock" de la lista de campos al consultar la tabla `test_categories`.',
  },
  {
    id: 'err-invalid-payload',
    name: 'Error 400: Campo Inexistente o Inválido en Payload (INVALID_PAYLOAD)',
    httpStatus: 400,
    code: 'INVALID_PAYLOAD',
    title: 'Datos de Payload Rechazados por el Esquema',
    description: 'Ocurre cuando se envía en el `createItem` o `updateItem` una propiedad que no existe en el modelo de datos de la colección o tiene un tipo incompatible.',
    howToTrigger: {
      collection: 'test_products',
      action: 'createItem',
      payload: JSON.stringify({
        invalid_field_xyz: 'Test value',
        name: 'Error Test Product'
      }, null, 2),
    },
    rootCause: 'Directus valida el cuerpo del mensaje contra el esquema de la BD. `invalid_field_xyz` no es una columna válida en la tabla `test_products`.',
    solution: 'Verificar la ortografía de las columnas en la definición de la colección o revisar las interfaces TypeScript.',
  },
  {
    id: 'err-missing-required-field',
    name: 'Error 400: Campo Obligatorio Faltante (FAILED_VALIDATION)',
    httpStatus: 400,
    code: 'FAILED_VALIDATION',
    title: 'Validation failed for field "name". Value is required.',
    description: 'Ocurre al intentar crear o actualizar un registro omitiendo un campo que fue marcado como obligatorio (Required / Not Null) en la base de datos o en la interfaz de Directus.',
    howToTrigger: {
      collection: 'test_products',
      action: 'createItem',
      payload: JSON.stringify({
        category_id: 1,
        sku: 'SKU-SIN-NOMBRE-001',
        price: 45000,
        stock: 5,
        status: 'disponible'
      }, null, 2),
    },
    rootCause: 'Directus valida las reglas de integridad de datos antes de escribir en la base de datos. La columna "name" es requerida para poder registrar un producto.',
    solution: 'Incluir el campo "name" con un valor de texto no vacío dentro del objeto JSON del payload.',
  },
  {
    id: 'err-record-not-unique',
    name: 'Error 400: Valor Duplicado en Campo Único (RECORD_NOT_UNIQUE)',
    httpStatus: 400,
    code: 'RECORD_NOT_UNIQUE',
    title: 'Field "sku" has to be unique (Entrada Duplicada)',
    description: 'Ocurre cuando se intenta registrar o actualizar una fila asignando un valor que ya existe en una columna configurada con restricción de unicidad (UNIQUE) en la BD.',
    howToTrigger: {
      collection: 'test_products',
      action: 'createItem',
      payload: JSON.stringify({
        category_id: 1,
        sku: 'SKU-RGB-001',
        name: 'Mouse Gamer Repetido',
        price: 85000,
        stock: 10,
        status: 'disponible'
      }, null, 2),
    },
    rootCause: 'La columna "sku" tiene un índice único en la base de datos para evitar códigos de producto duplicados. El SKU "SKU-RGB-001" ya está asignado a otro registro.',
    solution: 'Asignar un código SKU nuevo y único que no exista previamente en la tabla.',
  },
  {
    id: 'err-id-forbidden-not-found',
    name: 'Error 403: ID Inexistente o Sin Permiso (FORBIDDEN)',
    httpStatus: 403,
    code: 'FORBIDDEN',
    title: 'You don\'t have permission to access this (ID Inexistente o Fila Restringida)',
    description: 'Ocurre al consultar, actualizar o eliminar un ID específico que no existe en la base de datos. Directus responde con HTTP 403 "You don\'t have permission to access this" por seguridad para no revelar a roles sin privilegios qué IDs existen.',
    howToTrigger: {
      collection: 'test_products',
      action: 'readItem',
      id: '1000',
    },
    rootCause: 'El registro con ID = 1000 no existe en la tabla "test_products" o tu rol de usuario no tiene permisos de fila (row-level permissions) para acceder a él.',
    solution: 'Verificar los IDs reales existentes en la tabla pulsando el botón "Ver Tabla en BD" o ejecutando una consulta readItems().',
  },
  {
    id: 'err-not-found',
    name: 'Error 404: Registro No Encontrado (RECORD_NOT_FOUND)',
    httpStatus: 404,
    code: 'RECORD_NOT_FOUND',
    title: 'El ID Consultado No Existe',
    description: 'Ocurre al intentar leer o actualizar un registro específico con una clave primaria (ID) que no existe en la base de datos.',
    howToTrigger: {
      collection: 'test_products',
      action: 'readItem',
      id: '9999999',
    },
    rootCause: 'La función `readItem("test_products", id)` no encontró ninguna fila con la clave primaria dada.',
    solution: 'Asegurar que el ID existe previamente o envolver la búsqueda en un bloque `try/catch` para manejar la ausencia del registro.',
  },
  {
    id: 'err-bad-filter',
    name: 'Error 400: Filtro Mal Estructurado (INVALID_QUERY)',
    httpStatus: 400,
    code: 'INVALID_QUERY',
    title: 'Operador de Filtro Desconocido o Sintaxis JSON Errónea',
    description: 'Ocurre al enviar un objeto `filter` con operadores que no existen en Directus (ej: usar `equals` en lugar de `_eq`).',
    howToTrigger: {
      collection: 'test_products',
      action: 'readItems',
      filter: JSON.stringify({ status: { equals: 'disponible' } }, null, 2),
    },
    rootCause: 'Los operadores de Directus siempre inician con guion bajo (ej. `_eq`, `_contains`, `_in`). El operador `equals` no es reconocido por la API.',
    solution: 'Consultar la Cheat Sheet y reemplazar por `_eq`, `_neq`, `_contains`, etc.',
  },
  {
    id: 'err-invalid-fk',
    name: 'Error 400: Clave Foránea Inexistente (INVALID_FOREIGN_KEY)',
    httpStatus: 400,
    code: 'INVALID_FOREIGN_KEY',
    title: 'Violación de Integridad Referencial (Foreign Key No Existe)',
    description: 'Ocurre al intentar crear o actualizar un registro asignando una clave foránea (ej: category_id: 9999) que NO existe en la tabla padre (test_categories).',
    howToTrigger: {
      collection: 'test_products',
      action: 'createItem',
      payload: JSON.stringify({
        category_id: 9999,
        sku: 'SKU-FK-ERR',
        name: 'Producto con Categoria Inexistente',
        price: 50000,
        stock: 10,
        status: 'disponible'
      }, null, 2),
    },
    rootCause: 'La base de datos relacional valida que el ID enviado en `category_id` (9999) exista previamente en la columna `id` de `test_categories`.',
    solution: 'Crear primero el registro en la tabla padre `test_categories` o utilizar un ID relacional existente (ej. category_id: 1).',
  },
  {
    id: 'err-cannot-delete-parent',
    name: 'Error 500/400: Restricción de Borrado por Clave Foránea (CANNOT_DELETE_PARENT)',
    httpStatus: 500,
    code: 'CANNOT_DELETE_PARENT',
    title: 'Cannot delete or update a parent row: a foreign key constraint fails',
    description: 'Ocurre al intentar eliminar un registro padre (ej. la categoría con ID 1 en "test_categories") que tiene productos hijos asociados en "test_products" que dependen de él.',
    howToTrigger: {
      collection: 'test_categories',
      action: 'deleteItem',
      id: '1',
    },
    rootCause: 'La base de datos relacional rechaza el borrado para evitar registros huérfanos. La relación category_id está configurada con restricción RESTRICT/NO ACTION.',
    solution: 'Eliminar o reasignar primero los productos hijos asociados a esa categoría antes de borrar la categoría padre, o configurar la relación con On Delete: Cascade en Directus.',
  },
  {
    id: 'err-data-type-mismatch',
    name: 'Error 500: Tipo de Dato Incompatible con la BD',
    httpStatus: 500,
    code: 'INTERNAL_SERVER_ERROR',
    title: 'An unexpected error occurred (Incompatibilidad de Tipo de Dato)',
    description: 'Ocurre al enviar en el payload un tipo de dato incompatible con la definición del campo en la base de datos (por ejemplo, enviar una cadena de texto a una columna numérico/float o un valor no convertible). Directus intenta procesarlo en el motor de BD (MySQL/PostgreSQL), la base de datos rechaza la conversión y responde con HTTP 500 "An unexpected error occurred."',
    howToTrigger: {
      collection: 'test_products',
      action: 'createItem',
      payload: JSON.stringify({
        category_id: 9999,
        sku: 'SKU-TYPE-ERR',
        name: 'Producto con Tipo de Dato Incompatible',
        price: 'VALOR_TEXTO_INVALIDO',
        stock: 10,
        status: 'disponible'
      }, null, 2),
    },
    rootCause: 'Error Interno de BD / Incompatibilidad de Tipo de Dato: Directus retornó un error HTTP 500 porque el motor de la base de datos (MySQL/PostgreSQL) rechazó un valor cuyo tipo no coincide con la definición de la columna.',
    solution: 'Revisar que los tipos de datos enviados en el JSON coincidan exactamente con la definición del campo en Directus. Para columnas numéricas o float, enviar números puros sin comillas (ejemplo: price: 45000.50 en lugar de un texto).',
  },
];
