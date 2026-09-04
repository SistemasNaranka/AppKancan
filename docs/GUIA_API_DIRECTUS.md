# 📘 Guía Completa de la API y WebSockets de Directus — Ecosistema AppKancan

---

## 🌟 1. Introducción y Arquitectura Global

**Directus** funciona en **AppKancan** como el **Backend as a Service (BaaS)** y capa de persistencia principal. Proporciona una API dual (**REST HTTP** y **WebSockets en Tiempo Real**) sobre la base de datos relacional del sistema, gestionando autenticación, permisos por roles y sincronización de datos para todas las aplicaciones del ecosistema.

```
                               ┌──────────────────────────────────────────────┐
                               │             AppKancan (React + Vite)         │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                                   ┌──────────────────────────────────────┐
                                   │  src/auth/services/                  │
                                   │  directusInterceptor.ts              │
                                   │  (Auto-refresco de tokens JWT/Mutex) │
                                   └──────────────────┬───────────────────┘
                                                      │
                                                      ▼
                                   ┌──────────────────────────────────────┐
                                   │  src/services/directus/directus.ts   │
                                   │  (Cliente Singleton REST + Realtime) │
                                   └──────────┬───────────────────┬───────┘
                                              │                   │
                            Peticiones HTTP REST         Canal WebSockets (ws://)
                            (CRUD, filtros, etc.)       (Eventos en vivo y Sync)
                                              │                   │
                                              ▼                   ▼
                                   ┌──────────────────────────────────────┐
                                   │        Servidor Directus API         │
                                   │  (Autenticación, Permisos, Reglas)   │
                                   └──────────────────┬───────────────────┘
                                                      │
                                                      ▼
                                   ┌──────────────────────────────────────┐
                                   │        Base de Datos Relacional      │
                                   └──────────────────────────────────────┘
```

### Módulos de AppKancan conectados a Directus
* **Horarios:** Planillas de asistencia, novedades, turnos, normas por tienda y reportes.
* **Comisiones:** Presupuestos de venta, porcentajes de cumplimiento y cálculo de comisiones.
* **Curvas y Envíos (Tiempo Real):** Bloqueo colaborativo de tallas y sincronización de escaneos concurrentes entre usuarios vía WebSockets.
* **Garantías y Resoluciones:** Seguimiento de solicitudes, estados de productos y trazabilidad.
* **Contabilización de Facturas (Tiempo Real):** Monitoreo del progreso de causación de mercancía en tiempo real.
* **Reservas:** Gestión de eventos, anticipos y disponibilidad de espacios.
* **Contactos / Directorio:** Información de personal, tiendas, extensiones y cargos.
* **Prórrogas (Tiempo Real):** Aprobación de extensiones y actualización inmediata en vivo (`adm_contracts`).
* **Gestión de Proyectos:** Seguimiento de proyectos corporativos, procesos y beneficios.
* **Notificaciones y Avisos:** Confirmación de lectura de módulos restablecidos y alertas globales.

> [!TIP]
> Si experimentas errores de base de datos, permisos (403), registros duplicados o bloqueos de red, consulta la [Guía de Errores de Directus](file:///c:/Users/PC-DESARROLLO/Documents/proyecto/AppKancan/docs/GUIA_ERRORES_DIRECTUS.md) para ver diagnósticos y soluciones paso a paso.

---

## 📂 2. Estructura Estándar de Archivos por Aplicación

Cada aplicación de AppKancan organiza su capa de datos dentro de su propio módulo para mantener el proyecto limpio y desacoplado:

```
src/apps/[nombre_app]/
├── api/
│   └── directus/
│       ├── read.ts       # Consultas de lectura (SELECT, filtros, agregaciones)
│       ├── create.ts     # Inserciones (INSERT individual y masivo)
│       ├── update.ts     # Modificaciones (UPDATE parcial y total)
│       └── delete.ts     # Eliminaciones (DELETE)
├── hooks/
│   ├── use[Entidad].ts   # Hooks con React Query para REST
│   └── use[Entidad]Sync.ts # Hooks con WebSockets para tiempo real
└── types/
    └── [modulo].types.ts # Interfaces y tipos TypeScript
```

---

## 🔑 3. Conceptos Fundamentales de Conexión

### 3.1. Cliente Centralizado (`directus.ts`)
El cliente SDK está instanciado como un **Singleton** en `src/services/directus/directus.ts`. Incluye soporte para autenticación JSON, peticiones REST y WebSockets en tiempo real (`realtime`):

```typescript
import { createDirectus, rest, authentication, realtime } from "@directus/sdk";
import { resolveNetworkUrl } from "@/shared/utils/network";

const directusUrl = resolveNetworkUrl(import.meta.env.VITE_DIRECTUS_URL);

const directus = createDirectus(directusUrl)
  .with(authentication("json"))
  .with(rest())
  .with(realtime()); // ⚡ Habilita WebSockets en todo el proyecto

export default directus;
```

### 3.2. Auto-Refresco de Tokens (`withAutoRefresh`)
**Regla de oro:** Todas las peticiones REST a Directus deben envolverse en la función `withAutoRefresh`.

#### ¿Por qué es obligatoria?
1. **Prevención de Expiración:** Comprueba si el token de acceso JWT ha expirado antes de enviar la petición.
2. **Control de Concurrencia (Mutex Singleton):** Si múltiples peticiones se ejecutan al mismo tiempo cuando el token expira, solo una realiza la renovación con Directus mientras las demás esperan la misma promesa, evitando llamadas duplicadas y desautenticaciones accidentales.
3. **Reintento Automático (401):** Si el servidor responde con `401 Unauthorized`, renueva el token inmediatamente y reintenta la petición original de forma transparente para el usuario.

```typescript
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import directus from "@/services/directus/directus";

// Patrón estándar de llamada REST:
const resultado = await withAutoRefresh(() =>
  directus.request(miOperacionSDK)
);
```

---

## 📖 4. Operaciones de Lectura (REST / Queries)

Las operaciones de lectura se gestionan con `readItems` (para colecciones de negocio) y `readItem` (para un registro específico por su ID).

### 4.1. Parámetros Principales de Consulta

| Parámetro | Tipo | Explicación |
| :--- | :--- | :--- |
| `fields` | `string[]` | Campos exactos que deseas recuperar. **Buenas prácticas:** Especifica solo los campos necesarios para optimizar la red y la memoria. |
| `filter` | `object` | Reglas de filtrado usando los operadores de Directus (`_eq`, `_neq`, `_contains`, `_gte`, etc.). |
| `sort` | `string[]` | Orden de los resultados. Anteponer un guion `-` indica orden descendente (ej: `["-fecha_creacion", "nombre"]`). |
| `limit` | `number` | Número máximo de registros por consulta (por defecto 100). Usar `-1` para traer todos los registros cuando sea necesario. |
| `offset` | `number` | Desplazamiento de registros para paginación (ej: página 2 con límite 20 usa `offset: 20`). |

### 4.2. Operadores de Filtro Más Utilizados

* `_eq`: Igual a (`{ estado: { _eq: "activo" } }`)
* `_neq`: Diferente de (`{ estado: { _neq: "cancelado" } }`)
* `_contains`: Contiene texto (búsqueda parcial insensible a mayúsculas)
* `_in`: Coincide con cualquiera de los valores en un arreglo (`{ tienda_id: { _in: [1, 2, 5] } }`)
* `_gte` / `_lte`: Mayor/Igual o Menor/Igual (rangos de fechas y montos)
* `_null`: Verifica si el campo es nulo (`{ fecha_entrega: { _null: true } }`)
* `_and` / `_or`: Combinación lógica de múltiples condiciones

### 4.3. Ejemplo de Implementación: Lectura con Filtros

```typescript
import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems } from "@directus/sdk";
import type { Proyecto } from "../types";

export async function getProyectosFiltrados(estado?: string): Promise<Proyecto[]> {
  try {
    const filter: Record<string, any> = {};
    if (estado) {
      filter.estado = { _eq: estado };
    }

    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("gp_proyectos", {
          fields: ["id", "nombre", "estado", "fecha_inicio", "area_beneficiada"],
          filter,
          sort: ["-fecha_inicio"],
          limit: 50,
        })
      )
    );

    return items as Proyecto[];
  } catch (error) {
    console.error("❌ Error al obtener proyectos:", error);
    return []; // Retorno seguro para proteger la UI
  }
}
```

---

## ✍️ 5. Operaciones de Escritura (Create, Update, Delete)

### 5.1. Creación (`createItem` y `createItems`)
* **Individual (`createItem`):** Envía un objeto con los datos a insertar. Retorna el registro creado con su ID generado.
* **Masivo (`createItems`):** Envía un arreglo de objetos para inserción en una sola transacción eficiente.

```typescript
import { createItem } from "@directus/sdk";

export async function createRegistro(data: NuevoRegistroInput): Promise<string | null> {
  try {
    const res = await withAutoRefresh(() =>
      directus.request(createItem("nombre_tabla", data))
    );
    return res.id;
  } catch (error) {
    console.error("❌ Error al crear registro:", error);
    return null;
  }
}
```

### 5.2. Actualización (`updateItem` y `updateItems`)
* Permite enviar **cargas útiles parciales (`Partial<T>`)**, es decir, solo los campos que cambiaron.
* No envíes campos con valor `undefined`. Si deseas vaciar un campo en base de datos, envía `null`.

```typescript
import { updateItem } from "@directus/sdk";

export async function updateRegistro(id: string | number, data: Partial<RegistroInput>): Promise<boolean> {
  try {
    await withAutoRefresh(() =>
      directus.request(updateItem("nombre_tabla", id, data))
    );
    return true;
  } catch (error) {
    console.error(`❌ Error actualizando registro ${id}:`, error);
    return false;
  }
}
```

### 5.3. Eliminación (`deleteItem` y `deleteItems`)

```typescript
import { deleteItem } from "@directus/sdk";

export async function deleteRegistro(id: string | number): Promise<boolean> {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItem("nombre_tabla", id))
    );
    return true;
  } catch (error) {
    console.error(`❌ Error eliminando registro ${id}:`, error);
    return false;
  }
}
```

---

## ⚡ 6. Tiempo Real con WebSockets (Directus Realtime)

El módulo de tiempo real permite que múltiples usuarios vean actualizaciones **instantáneamente** sin necesidad de refrescar la página ni saturar el servidor con *polling* constante.

```
Usuario A (Guarda un registro)
       │
       ▼ (HTTP POST / PUT)
Servidor Directus
       │
       ├──> Persiste en Base de Datos
       │
       └──> Emite Evento por WebSockets (ws://)
                     │
                     ├──────────────────────────────┐
                     ▼                              ▼
             Usuario B (Navegador)          Usuario C (Navegador)
             (Vista se actualiza en vivo)   (Vista se actualiza en vivo)
```

### 6.1. Método `directus.subscribe`
Para escuchar cambios en una colección se utiliza `directus.subscribe()`. Este método devuelve un objeto con:
* `subscription`: Un iterador asíncrono (`AsyncIterable`) que emite los mensajes en tiempo real.
* `unsubscribe` / `stop`: Función de cancelación obligatoria para cerrar la conexión cuando el componente se desmonte.

### 6.2. Eventos Disponibles
* `create`: Se dispara cuando se inserta un nuevo registro.
* `update`: Se dispara cuando se modifica un registro existente.
* `delete`: Se dispara cuando se elimina un registro.
* `init`: Emite el estado inicial de la consulta al conectarse.

### 6.3. Patrón Estándar de Integración en React

Este es el patrón oficial utilizado en módulos como **Curvas**, **Prórrogas** y **Contabilización de Facturas**:

```typescript
import { useEffect } from "react";
import directus from "@/services/directus/directus";

export function useLiveSync(onDataChange: () => void) {
  useEffect(() => {
    let unsubscribeFn: (() => void) | undefined;
    let isActive = true;

    async function startSubscription() {
      try {
        // 1. Iniciar la suscripción a la tabla deseada
        const { subscription, unsubscribe } = await directus.subscribe("log_curve_shipments", {
          event: "create", // o omitir para escuchar todos los eventos
          query: {
            fields: ["id", "tienda_id", "cantidad_talla"],
          },
        });

        unsubscribeFn = unsubscribe;

        // 2. Procesar los mensajes entrantes en un bucle asíncrono
        for await (const message of subscription) {
          if (!isActive) break;

          if (message.event === "create" || message.event === "update") {
            console.log("⚡ Cambio en tiempo real detectado:", message.data);
            onDataChange(); // Actualizar estado de React o invalidar queries
          }
        }
      } catch (err) {
        console.error("❌ Error en conexión WebSocket:", err);
      }
    }

    startSub();

    // 3. LIMPIEZA OBLIGATORIA: Previene fugas de memoria y conexiones huérfanas
    return () => {
      isActive = false;
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, [onDataChange]);
}
```

### 6.4. Casos de Uso Reales en AppKancan

1. **Curvas y Envíos (`useEnviosDataSync.ts` / `useCurvasLocks.ts`):**  
   Sincroniza en vivo los escaneos de prendas entre varias bodegas/tiendas y bloquea temporalmente tallas para evitar que dos usuarios editen la misma curva a la vez.
2. **Prórrogas de Contratos (`ContractContext.tsx`):**  
   Escucha cambios en `adm_contracts` para reflejar aprobaciones de prórrogas en pantalla de inmediato.
3. **Causación de Facturas (`CausacionProgressModal.tsx`):**  
   Muestra una barra de progreso que avanza en tiempo real a medida que el backend procesa las entradas de mercancía (`acc_goods_receipts`).

---

## 🛡️ 7. Colecciones del Sistema vs Colecciones de Negocio

Directus diferencia sus tablas internas (del sistema) de las tablas creadas para la lógica de la empresa:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ COLECCIONES DE NEGOCIO                                                   │
│ Tablas creadas para las apps (ej: `horarios_planilla`, `gp_proyectos`)   │
│ ➜ Se consultan con: `readItems('tabla')`, `createItem('tabla', ...)`    │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ COLECCIONES DEL SISTEMA                                                  │
│ Tablas nativas de Directus (`directus_users`, `directus_roles`, etc.)    │
│ ➜ Se consultan con funciones especializadas del SDK:                     │
│    • readMe()       -> Datos del usuario autenticado actual             │
│    • readUsers()    -> Listado de usuarios del sistema                  │
│    • readRoles()    -> Listado de roles y permisos                      │
│    • readFiles()    -> Archivos multimedia adjuntos                     │
└──────────────────────────────────────────────────────────────────────────┘
```

> [!WARNING]
> Intentar consultar `directus.request(readItems("directus_users"))` puede generar errores `403 Forbidden`. Usa siempre las funciones nativas `readUsers()` o `readMe()`.

---

## ⚛️ 8. Integración con React y TanStack Query

La forma estándar de consumir los servicios REST de Directus en las vistas de AppKancan es mediante **TanStack Query (React Query)**:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProyectosFiltrados } from "../api/directus/read";
import { createRegistro } from "../api/directus/create";

export function useProyectos(estado?: string) {
  const queryClient = useQueryClient();

  // 1. Consulta con cache automático
  const query = useQuery({
    queryKey: ["proyectos", estado],
    queryFn: () => getProyectosFiltrados(estado),
    staleTime: 1000 * 60 * 5, // 5 minutos de cache fresco
  });

  // 2. Mutación con invalidación de cache
  const createMutation = useMutation({
    mutationFn: createRegistro,
    onSuccess: () => {
      // Invalida la lista para que la tabla se actualice sola
      queryClient.invalidateQueries({ queryKey: ["proyectos"] });
    },
  });

  return {
    proyectos: query.data ?? [],
    cargando: query.isLoading,
    error: query.error,
    crearProyecto: createMutation.mutateAsync,
    guardando: createMutation.isPending,
  };
}
```

---

## 📋 9. Resumen de Funciones Directus SDK

| Tipo | Operación | Función SDK | Descripción |
| :--- | :--- | :--- | :--- |
| **REST** | Leer varios | `readItems(coleccion, params)` | Obtiene lista de registros con filtros, orden y paginación |
| **REST** | Leer uno | `readItem(coleccion, id, params)` | Obtiene un único registro por su ID |
| **REST** | Crear uno | `createItem(coleccion, payload)` | Inserta un nuevo registro |
| **REST** | Crear varios | `createItems(coleccion, payload[])` | Inserción masiva en una sola petición |
| **REST** | Actualizar uno | `updateItem(coleccion, id, payload)` | Modificación parcial o total de un registro |
| **REST** | Actualizar varios | `updateItems(coleccion, ids[], payload)` | Aplica los mismos cambios a múltiples IDs |
| **REST** | Eliminar uno | `deleteItem(coleccion, id)` | Borra un registro por ID |
| **REST** | Eliminar varios | `deleteItems(coleccion, ids[])` | Borra múltiples registros por lista de IDs |
| **REST** | Usuario actual | `readMe(params)` | Datos del usuario con sesión activa |
| **REST** | Usuarios sistema | `readUsers(params)` | Consulta usuarios del sistema |
| **REST** | Agregaciones | `aggregate(coleccion, params)` | Funciones `count`, `sum`, `avg`, `min`, `max` |
| **Realtime** | Suscripción en vivo | `directus.subscribe(coleccion, opts)` | Escucha eventos WebSocket en tiempo real (`create`, `update`, `delete`) |

---

## 🎯 10. Buenas Prácticas y Reglas Obligatorias

1. **Envoltura Universal en REST:** Nunca invoques `directus.request(...)` directamente sin pasar por `withAutoRefresh(...)`.
2. **Limpieza en WebSockets:** Siempre ejecuta la función de limpieza (`unsubscribe` o `stop`) en el retorno del `useEffect`. No hacerlo genera fugas de memoria y múltiples conexiones duplicadas.
3. **Filtros en Suscripciones:** Especifica `fields` y `query` en `directus.subscribe` para recibir únicamente los datos necesarios y evitar tráfico innecesario en la red.
4. **Defensividad ante Fallos:** Envuelve las llamadas en bloques `try / catch` y proporciona retornos seguros (`[]`, `null` o `false`) para evitar que la interfaz de usuario quede en blanco.
5. **Tipado Estricto:** Define siempre interfaces TypeScript para las cargas útiles de entrada (`Input`) y salida (`Interface`).
6. **Separación de Responsabilidades:** No coloques llamadas directas a Directus dentro del JSX. Usa la carpeta `api/directus/` y consúmela a través de hooks.
