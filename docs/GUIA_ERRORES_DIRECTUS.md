# 🛠️ Guía Técnica de Diagnóstico y Solución de Errores - Directus API & SDK

---

## 📑 Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Estructura Estándar de Errores en Directus](#2-estructura-estándar-de-errores-en-directus)
3. [El Principio de Seguridad por Oscuridad (Security by Obscurity)](#3-el-principio-de-seguridad-por-oscuridad)
4. [Catálogo Completo de Errores](#4-catálogo-completo-de-errores)
   - [Error 1: COLLECTION_FORBIDDEN (Tabla Inexistente o Sin Permisos)](#error-1-collection_forbidden-http-403)
   - [Error 2: FORBIDDEN en readItem (ID Inexistente o Fila Restringida)](#error-2-forbidden-en-readitem-http-403)
   - [Error 3: FAILED_VALIDATION (Campo Obligatorio Faltante)](#error-3-failed_validation-http-400)
   - [Error 4: RECORD_NOT_UNIQUE (Valor Duplicado en Campo Único)](#error-4-record_not_unique-http-400)
   - [Error 5: FIELD_NOT_FOUND_IN_COLLECTION (Campo Inexistente en la Tabla)](#error-5-field_not_found_in_collection-http-400)
   - [Error 6: INVALID_FOREIGN_KEY (Clave Foránea Inexistente)](#error-6-invalid_foreign_key-http-400)
   - [Error 7: CANNOT_DELETE_PARENT (Restricción de Borrado por Clave Foránea)](#error-7-cannot_delete_parent-http-400--500)
   - [Error 8: CORE_COLLECTION_FUNCTION_MISMATCH (Función Errónea del SDK)](#error-8-core_collection_function_mismatch-http-400)
   - [Error 9: INVALID_QUERY (Operador de Filtro Desconocido o Incompatible)](#error-9-invalid_query-http-400--422)
   - [Error 10: INVALID_JSON_SYNTAX / INVALID_PAYLOAD (JSON Mal Formado)](#error-10-invalid_json_syntax--invalid_payload-http-400)
   - [Error 11: INTERNAL_SERVER_ERROR / DATA_TYPE_MISMATCH (Incompatibilidad de Tipos en BD)](#error-11-internal_server_error--data_type_mismatch-http-500)
   - [Error 12: VALUE_TOO_LONG (Longitud de Texto Excedida)](#error-12-value_too_long-http-400--500)
   - [Error 13: TOKEN_EXPIRED / UNAUTHORIZED (Sesión Caducada)](#error-13-token_expired--unauthorized-http-401)
   - [Error 14: NETWORK_ERROR / CORS_ERROR (Fallo de Conexión o CORS)](#error-14-network_error--cors_error-http-0)
5. [Buenas Prácticas de Manejo de Errores en AppKancan](#5-buenas-prácticas-de-manejo-de-errores-en-appkancan)

---

## 1. Introducción

En la plataforma **AppKancan**, **Directus** actúa como la capa central de backend headless, gestión de base de datos relacional y servidor de APIs REST/GraphQL/WebSocket. Cada módulo de la aplicación (como Gestión de Proyectos, Garantías, Horarios, Notificaciones, etc.) se comunica con Directus utilizando el cliente oficial `@directus/sdk` combinado con un interceptor de renovación de tokens JWT (`withAutoRefresh`).

Durante el desarrollo e integración de nuevos módulos o funcionalidades, es común enfrentarse a respuestas de error emitidas por Directus. Estos errores pueden originarse por múltiples motivos:

- **Problemas de permisos y roles:** Restricciones de acceso a tablas, columnas o filas individuales.
- **Violaciones de integridad en base de datos:** Claves foráneas inexistentes, campos únicos duplicados o restricciones de borrado en cascada.
- **Fallos de esquema y validación:** Campos obligatorios omitidos, tipos de datos incompatibles o nombres de campos inexistentes.
- **Errores de sintaxis y protocolo:** JSONs mal formateados, operadores de filtro inválidos o tokens de sesión caducados.

### 🎯 Objetivo de esta Guía

El propósito de este documento es proporcionar al equipo de desarrollo una **referencia técnica definitiva**:

1. Comprender con exactitud **qué significa cada error** devuelto por Directus.
2. Identificar la **causa raíz** en la base de datos o en la petición del cliente.
3. Aplicar la **solución técnica exacta** con ejemplos de código en TypeScript y configuración en Directus Admin.
4. Facilitar el uso del **Laboratorio de Errores** y el **Playground de Pruebas de API** integrado en el módulo de Gestión de Proyectos para depurar y simular errores en un entorno controlado.

---

## 2. Estructura Estándar de Errores en Directus

Cuando una petición a Directus falla, la API responde con un array de errores bajo la propiedad `errors`:

```json
{
  "errors": [
    {
      "message": "Mensaje legible del error",
      "extensions": {
        "code": "CODIGO_DEL_ERROR",
        "field": "nombre_campo",
        "reason": "Explicación detallada",
        "type": "tipo_de_validacion"
      }
    }
  ]
}
```

> [!IMPORTANT]
> En el SDK de Directus (`@directus/sdk`), el código de error real (`FAILED_VALIDATION`, `RECORD_NOT_UNIQUE`, `FORBIDDEN`, etc.) se ubica dentro de `error.errors[0].extensions.code` o `error.response.data.errors[0].extensions.code`.

---

## 3. El Principio de Seguridad por Oscuridad

Directus aplica deliberadamente **Seguridad por Oscuridad (Security by Obscurity)**:

- **Para Tablas:** Si consultas una tabla que **NO EXISTE**, Directus devuelve `HTTP 403 FORBIDDEN` con el mensaje _"You don't have permission to access collection '...' or it does not exist"_.
- **Para IDs:** Si consultas con `readItem` un **ID que no existe**, Directus devuelve `HTTP 403 FORBIDDEN` con el mensaje _"You don't have permission to access this."_ en lugar de `HTTP 404 NOT FOUND`.

**¿Por qué?** Para evitar que un usuario no autenticado o con permisos limitados pueda escanear y descubrir qué tablas o IDs existen en la base de datos de la empresa mediante ataques de enumeración.

---

## 4. Catálogo Completo de Errores

---

### Error 1: `COLLECTION_FORBIDDEN` (HTTP 403)

#### ¿Por qué ocurre?

Ocurre al intentar consultar o modificar una colección/tabla en la base de datos bajo dos posibles causas:

1. **La tabla NO existe** (error tipográfico en el nombre, mayúsculas/minúsculas o tabla no creada).
2. **La tabla sí existe**, pero el rol de usuario actual en Directus no tiene permisos asignados de lectura/escritura sobre ella.

#### Respuesta de Directus:

```json
[
  {
    "message": "You don't have permission to access collection \"test_name\" or it does not exist. Queried in root.",
    "extensions": {
      "reason": "You don't have permission to access collection \"test_name\" or it does not exist. Queried in root.",
      "code": "FORBIDDEN"
    }
  }
]
```

#### Código que lo provoca:

```typescript
// 'tabla_inexistente' no existe en la base de datos
const data = await directus.request(readItems("tabla_inexistente"));
```

#### Solución:

1. Verificar que el nombre de la colección esté escrito exactamente como fue creada en la base de datos.
2. Si la tabla sí existe, ingresar a **Directus Admin > Configuración > Roles y Permisos**, seleccionar el rol de usuario correspondiente y habilitar permisos de lectura/creación/edición sobre la tabla.

---

### Error 2: `FORBIDDEN` en `readItem` (HTTP 403)

#### ¿Por qué ocurre?

Ocurre al solicitar una sola fila por su clave primaria (`readItem`, `updateItem` o `deleteItem`) con un ID inexistente o restringido:

1. **El ID consultado no existe** en la tabla (ej. ID `1000`).
2. **El registro existe pero está filtrado** por reglas de permiso por fila (_Row-Level Permissions_, ej. solo ver registros creados por el propio usuario).

#### Respuesta de Directus:

```json
[
  {
    "message": "You don't have permission to access this.",
    "extensions": {
      "code": "FORBIDDEN"
    }
  }
]
```

#### Código que lo provoca:

```typescript
// El producto con ID 1000 no existe en test_products
const producto = await directus.request(readItem("test_products", 1000));
```

#### Solución:

1. Asegurar que el ID enviado realmente exista en la tabla antes de consultarlo (puedes listar primero con `readItems`).
2. Envolver siempre la llamada `readItem` en un bloque `try/catch` para manejar elegantemente cuando un registro no exista o haya sido eliminado.

```typescript
try {
  const item = await withAutoRefresh(() =>
    directus.request(readItem("test_products", id)),
  );
  return item;
} catch (error: any) {
  if (error?.errors?.[0]?.extensions?.code === "FORBIDDEN") {
    console.warn(`Registro con ID ${id} no encontrado o sin permisos.`);
    return null;
  }
  throw error;
}
```

---

### Error 3: `FAILED_VALIDATION` (HTTP 400)

#### ¿Por qué ocurre?

Ocurre al ejecutar `createItem` o `updateItem` omitiendo un campo obligatorio (_Required / Not Null_) o enviándolo con valor `null`/cadena vacía.

#### Respuesta de Directus:

```json
[
  {
    "message": "Validation failed for field \"name\". Value is required.",
    "extensions": {
      "field": "name",
      "path": [],
      "type": "required",
      "code": "FAILED_VALIDATION"
    }
  }
]
```

#### Código que lo provoca:

```typescript
// Falta el campo obligatorio 'name'
await directus.request(
  createItem("test_products", {
    price: 50000,
    stock: 10,
  }),
);
```

#### Solución:

Incluir todos los campos obligatorios en el payload JSON:

```typescript
await directus.request(
  createItem("test_products", {
    name: "Mouse Gamer Ergonómico", // Campo obligatorio incluido
    price: 50000,
    stock: 10,
    status: "disponible",
  }),
);
```

---

### Error 4: `RECORD_NOT_UNIQUE` (HTTP 400)

#### ¿Por qué ocurre?

Se intentó crear o actualizar un registro con un valor que ya existe en una columna configurada con índice de unicidad (`UNIQUE`) en la base de datos (por ejemplo: `sku`, `code`, `email`, `cedula`).

#### Respuesta de Directus:

```json
[
  {
    "message": "Field \"sku\" has to be unique.",
    "extensions": {
      "field": "sku",
      "code": "RECORD_NOT_UNIQUE"
    }
  }
]
```

#### Código que lo provoca:

```typescript
// 'SKU-RGB-001' ya fue registrado previamente en otro producto
await directus.request(
  createItem("test_products", {
    name: "Nuevo Mouse",
    sku: "SKU-RGB-001",
  }),
);
```

#### Solución:

Generar un código/valor único que no exista en la tabla antes de enviar la inserción o actualización.

---

### Error 5: `FIELD_NOT_FOUND_IN_COLLECTION` (HTTP 400)

#### ¿Por qué ocurre?

La consulta solicita en el parámetro `fields` nombres de columnas que no existen en el modelo de datos de la tabla (o tu rol no tiene permiso de ver esa columna específica).

#### Respuesta de Directus:

```json
[
  {
    "message": "You don't have permission to access fields \"price\", \"stock\" in collection \"test_categories\" or they do not exist.",
    "extensions": {
      "code": "FORBIDDEN"
    }
  }
]
```

#### Código que lo provoca:

```typescript
// 'price' y 'stock' pertenecen a 'test_products', no a 'test_categories'
await directus.request(
  readItems("test_categories", {
    fields: ["id", "name", "price", "stock"],
  }),
);
```

#### Solución:

Remover las columnas inexistentes del arreglo `fields` o revisar las interfaces TypeScript del módulo.

```typescript
await directus.request(
  readItems("test_categories", {
    fields: ["id", "name", "code", "description"],
  }),
);
```

---

### Error 6: `INVALID_FOREIGN_KEY` (HTTP 400)

#### ¿Por qué ocurre?

Violación de Integridad Referencial: Se intentó asociar una clave foránea (ej: `category_id: 9999`) que **no existe** en la columna primaria de la tabla padre referenciada (`test_categories`).

#### Respuesta de Directus:

```json
[
  {
    "message": "Invalid foreign key \"9999\" for field \"category_id\" in collection \"test_products\".",
    "extensions": {
      "field": "category_id",
      "collection": "test_products",
      "value": "9999",
      "code": "INVALID_FOREIGN_KEY"
    }
  }
]
```

#### Código que lo provoca:

```typescript
// La categoría con ID 9999 no existe en la base de datos
await directus.request(
  createItem("test_products", {
    name: "Teclado Mecánico",
    category_id: 9999,
  }),
);
```

#### Solución:

1. Crear primero la fila en la tabla padre (`test_categories`) y usar su ID generado.
2. Utilizar un ID relacional existente.

---

### Error 7: `CANNOT_DELETE_PARENT / RESTRICT_ON_DELETE` (HTTP 500)

#### ¿Por qué ocurre?

Intentar eliminar una fila padre (ej. una categoría en `test_categories`) que tiene registros hijos vinculados en otra tabla (ej. productos en `test_products` con `category_id = 1`) cuando la relación en Directus está configurada con la regla **"Evitar eliminación" (`RESTRICT` / `NO ACTION`)** en lugar de `CASCADE` o `SET NULL`.

Al recibir la orden `DELETE`, el motor de base de datos relacional (MySQL/PostgreSQL) rechaza la operación para proteger la integridad y no dejar registros huérfanos. Por seguridad, Directus captura esa excepción interna de base de datos y la enmascara al cliente como un error 500 estándar.

#### Respuesta de Directus:

```json
[
  {
    "message": "An unexpected error occurred.",
    "extensions": {
      "code": "INTERNAL_SERVER_ERROR"
    }
  }
]
```

#### Solución:

1. **Reasignar o eliminar primero los registros hijos**: Modificar los productos que apuntan a esta categoría o eliminarlos antes de borrar la categoría padre.
2. **Configurar el comportamiento deseado en Directus Admin**:
   - Ir a **Directus Admin > Configuración > Modelo de Datos > `test_products` > Campo `category_id` > Relación > Al Eliminar (On Delete)**:
     - **`Restrict` (Evitar eliminación)**: Bloquea el borrado si hay hijos y lanza este error 500 (comportamiento actual).
     - **`Set Null` (Poner en Nulo)**: Permite borrar la categoría y deja `category_id = NULL` en los productos vinculados.
     - **`Cascade` (En Cascada)**: Borra la categoría y elimina automáticamente todos sus productos vinculados.

---

### Error 8: `CORE_COLLECTION_FUNCTION_MISMATCH` (HTTP 400)

#### ¿Por qué ocurre?

El SDK de Directus prohíbe utilizar las funciones genéricas `readItems()` o `readItem()` sobre las colecciones del sistema (`directus_users`, `directus_roles`, `directus_files`, etc.).

#### Respuesta del SDK:

```
Error: Cannot use readItems for core collections. Use readUsers instead.
```

#### Solución:

Importar e invocar la función especializada de `@directus/sdk`:

```typescript
// ❌ INCORRECTO
directus.request(readItems("directus_users"));

// ✅ CORRECTO
import { readUsers, readRoles, readFiles, readMe } from "@directus/sdk";

const usuarios = await directus.request(readUsers({ limit: 10 }));
const roles = await directus.request(readRoles());
const archivos = await directus.request(readFiles());
const miPerfil = await directus.request(readMe());
```

---

### Error 9: `INVALID_QUERY` (HTTP 400 / 422)

#### ¿Por qué ocurre?

Ocurre cuando el objeto `filter` utiliza operadores inválidos (ej. usar `equals` en vez de `_eq`), o cuando se aplica un operador de texto (`_contains`, `_starts_with`) sobre una columna numérica o fecha.

#### Respuesta de Directus:

```json
[
  {
    "message": "Invalid filter operator \"equals\" on field \"status\".",
    "extensions": {
      "code": "INVALID_QUERY"
    }
  }
]
```

#### Solución:

Utilizar siempre operadores con guion bajo (`_eq`, `_neq`, `_contains`, `_gt`, `_lt`, `_in`, `_between`, `_null`):

```typescript
// ✅ CORRECTO
const filtro = {
  status: { _eq: "disponible" },
  stock: { _gt: 0 },
};
```

---

### Error 10: `INVALID_JSON_SYNTAX / INVALID_PAYLOAD` (HTTP 400)

#### ¿Por qué ocurre?

El texto escrito en el campo de filtro o payload no cumple con la sintaxis de JSON válido (por ejemplo: olvidar las comillas dobles en un valor de texto como `"sku": SKU-RGB-001`, usar comillas simples, comas sobrantes al final o llaves sin cerrar). El analizador `JSON.parse()` del cliente/SDK rechaza la petición antes de enviarla o Directus responde con error de payload.

#### Respuesta Completa de Error:

```json
{
  "error": "SyntaxError: Unexpected token 'S', ...\"\n  \"sku\": SKU-RGB-00\"... is not valid JSON"
}
```

#### Solución:

Revisar que todas las claves y cadenas de texto estén estrictamente entre comillas dobles (`"`), que no haya comas al final del último elemento y que las llaves estén correctamente cerradas:

```json
{
  "name": "Producto Válido",
  "sku": "SKU-RGB-001",
  "price": 85000
}
```

---

### Error 11: `INTERNAL_SERVER_ERROR / DATA_TYPE_MISMATCH` (HTTP 500)

#### ¿Por qué ocurre?

Se envió un tipo de dato incompatible con la columna de base de datos (por ejemplo, enviar un string `"CIEN_MIL"` a una columna `DECIMAL/FLOAT`, o un array a un campo escalar). El motor SQL (MySQL/PostgreSQL) rechaza la conversión y Directus retorna HTTP 500.

#### Respuesta de Directus:

```json
[
  {
    "message": "An unexpected error occurred.",
    "extensions": {
      "code": "INTERNAL_SERVER_ERROR"
    }
  }
]
```

#### Solución:

Verificar que los valores enviados coincidan con los tipos de datos en la base de datos:

- Números: `price: 45000` (sin comillas).
- Booleanos: `activo: true` (no `"true"`).
- Fechas: cadenas ISO 8601 (`"2026-08-20T12:00:00.000Z"`).

---

### Error 12: `VALUE_TOO_LONG` (HTTP 400 / 500)

#### ¿Por qué ocurre?

El texto enviado supera la longitud máxima configurada en la columna de la base de datos (ej. enviar 150 caracteres a un campo `VARCHAR(50)`).

#### Respuesta de Directus:

```json
[
  {
    "message": "Data too long for column 'sku' at row 1",
    "extensions": {
      "code": "INTERNAL_SERVER_ERROR"
    }
  }
]
```

#### Solución:

Validar la longitud máxima en el frontend antes de enviar o truncar el texto al límite de la columna.

---

### Error 13: `TOKEN_EXPIRED / UNAUTHORIZED` (HTTP 401)

#### ¿Por qué ocurre?

El token JWT de sesión expiró o no se enviaron credenciales válidas en la cabecera `Authorization: Bearer <token>`.

#### Respuesta de Directus:

```json
[
  {
    "message": "Token expired.",
    "extensions": {
      "code": "TOKEN_EXPIRED"
    }
  }
]
```

#### Solución:

En AppKancan, **todas** las llamadas deben usar la envoltura `withAutoRefresh`:

```typescript
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import directus from "@/services/directus/directus";

export async function consultarDatos() {
  return await withAutoRefresh(() =>
    directus.request(readItems("test_products")),
  );
}
```

---

### Error 14: `NETWORK_ERROR / CORS_ERROR` (HTTP 0)

#### ¿Por qué ocurre?

El navegador no pudo comunicarse con el servidor de Directus por:

1. El servidor de Directus está apagado o reiniciándose.
2. La variable `VITE_DIRECTUS_URL` en `.env` apunta a un host o puerto incorrecto.
3. El dominio del frontend no está permitido en la variable `CORS_ORIGIN` de Directus.

#### Solución:

1. Verificar que el servidor Directus esté activo (`curl -I http://localhost:8055/server/ping`).
2. Verificar el archivo `.env`:
   ```env
   VITE_DIRECTUS_URL=http://localhost:8055
   ```
3. En el `.env` del servidor Directus, habilitar:
   ```env
   CORS_ENABLED=true
   CORS_ORIGIN=true
   ```

---

## 5. Buenas Prácticas de Manejo de Errores en AppKancan

1. **Usar siempre `withAutoRefresh`**: Evita errores 401 por expiración de tokens en sesiones prolongadas.
2. **Validar antes de enviar**: Comprobar tipos de datos, obligatoriedad y longitudes en el cliente.
3. **Manejar errores específicos en `try/catch`**:
   ```typescript
   try {
     const data = await withAutoRefresh(() => directus.request(...));
     return data;
   } catch (error: any) {
     const code = error?.errors?.[0]?.extensions?.code;
     if (code === 'RECORD_NOT_UNIQUE') {
       toast.error('El código o SKU ya se encuentra registrado.');
     } else if (code === 'FAILED_VALIDATION') {
       toast.error('Por favor completa todos los campos requeridos.');
     } else {
       toast.error('Ocurrió un error al guardar los datos.');
     }
     throw error;
   }
   ```
4. **Probar y diagnosticar en el Playground de Gestión de Proyectos**:
   Utiliza la pestaña de **Laboratorio de Errores** y el **Playground con Diagnóstico Automático** para simular y comprender cualquier comportamiento anómalo antes de llevar código a producción.
