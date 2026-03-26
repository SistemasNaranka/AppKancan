# Guía de Uso de API Directus - AppKancan

## Introducción

Esta guía documenta cómo conectarse a la base de datos y realizar operaciones CRUD utilizando la estructura de API existente en AppKancan. El sistema utiliza **Directus SDK** como ORM y un sistema de **auto-refresco de tokens** para mantener la sesión activa.

---

## Estructura de Archivos API

Cada módulo/app tiene su propia carpeta de API organizada así:

```
src/apps/[nombre_app]/
├── api/
│   └── directus/
│       ├── read.ts    # Funciones de lectura (SELECT)
│       └── create.ts  # Funciones de escritura (INSERT, UPDATE, DELETE)
├── types/
│   └── types.ts       # Definiciones de tipos TypeScript
```

---

## Conceptos Clave

### 1. Cliente Directus

El cliente de Directus ya está configurado y disponible en:

```typescript
import directus from "@/services/directus/directus";
```

### 2. Auto-Refresco de Tokens

**SIEMPRE** debes usar `withAutoRefresh` para envolver tus peticiones. Esto asegura que el token de acceso se refresque automáticamente si está expirado.

```typescript
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import directus from "@/services/directus/directus";
```

---

## Operaciones CRUD

### READ (Lectura)

#### Importaciones necesarias

```typescript
import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, readItem } from "@directus/sdk";
```

#### Leer todos los registros de una tabla

```typescript
export async function getAllItems(): Promise<Item[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("nombre_tabla", {
          fields: ["id", "nombre", "estado", "fecha_creacion"],
          sort: ["-fecha_creacion"],
          limit: 100,
        }),
      ),
    );

    return items.map((item: any) => ({
      id: item.id,
      nombre: item.nombre,
      estado: item.estado,
    }));
  } catch (error) {
    console.error("❌ Error al cargar items:", error);
    return [];
  }
}
```

#### Leer un registro por ID

```typescript
export async function getItemById(id: string): Promise<Item | null> {
  try {
    const item = await withAutoRefresh(() =>
      directus.request(readItem("nombre_tabla", id)),
    );

    if (!item) return null;

    return {
      id: item.id,
      nombre: item.nombre,
      estado: item.estado,
    };
  } catch (error) {
    console.error("❌ Error al cargar item:", error);
    return null;
  }
}
```

#### Leer con filtros

```typescript
export async function getItemsByFilter(estado: string): Promise<Item[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("nombre_tabla", {
          filter: {
            estado: { _eq: estado },
          },
          fields: ["id", "nombre", "estado"],
        }),
      ),
    );

    return items;
  } catch (error) {
    console.error("❌ Error al filtrar items:", error);
    return [];
  }
}
```

#### Opciones comunes de readItems

| Opción   | Tipo       | Descripción                             |
| -------- | ---------- | --------------------------------------- |
| `fields` | `string[]` | Campos a retornar                       |
| `filter` | `object`   | Filtros de búsqueda                     |
| `sort`   | `string[]` | Ordenamiento (use `-` para descendente) |
| `limit`  | `number`   | Límite de resultados                    |
| `offset` | `number`   | Para paginación                         |

---

### CREATE (Creación)

#### Importaciones necesarias

```typescript
import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { createItem, createItems } from "@directus/sdk";
```

#### Crear un registro

```typescript
export async function createItem(
  data: CreateItemInput,
): Promise<string | null> {
  try {
    const payload = {
      nombre: data.nombre,
      descripcion: data.descripcion || null,
      estado: data.estado || "activo",
      fecha_inicio: data.fecha_inicio,
    };

    const result = await withAutoRefresh(() =>
      directus.request(createItem("nombre_tabla", payload)),
    );

    return result.id;
  } catch (error) {
    console.error("❌ Error al crear item:", error);
    return null;
  }
}
```

#### Crear múltiples registros

```typescript
export async function createMultipleItems(
  items: CreateItemInput[],
): Promise<boolean> {
  try {
    const payload = items.map((item) => ({
      nombre: item.nombre,
      descripcion: item.descripcion || null,
      estado: item.estado || "activo",
    }));

    await withAutoRefresh(() =>
      directus.request(createItems("nombre_tabla", payload)),
    );

    return true;
  } catch (error) {
    console.error("❌ Error al crear items:", error);
    return false;
  }
}
```

---

### UPDATE (Actualización)

#### Importaciones necesarias

```typescript
import { updateItem } from "@directus/sdk";
```

#### Actualizar un registro

```typescript
export async function updateItem(
  id: string,
  data: Partial<CreateItemInput>,
): Promise<boolean> {
  try {
    const payload: any = {};

    if (data.nombre) payload.nombre = data.nombre;
    if (data.descripcion !== undefined) payload.descripcion = data.descripcion;
    if (data.estado) payload.estado = data.estado;

    await withAutoRefresh(() =>
      directus.request(updateItem("nombre_tabla", id, payload)),
    );

    return true;
  } catch (error) {
    console.error("❌ Error al actualizar item:", error);
    return false;
  }
}
```

---

### DELETE (Eliminación)

#### Importaciones necesarias

```typescript
import { deleteItem, deleteItems } from "@directus/sdk";
```

#### Eliminar un registro

```typescript
export async function deleteItem(id: string): Promise<boolean> {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItem("nombre_tabla", id)),
    );

    return true;
  } catch (error) {
    console.error("❌ Error al eliminar item:", error);
    return false;
  }
}
```

#### Eliminar múltiples registros

```typescript
export async function deleteMultipleItems(ids: string[]): Promise<boolean> {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItems("nombre_tabla", ids)),
    );

    return true;
  } catch (error) {
    console.error("❌ Error al eliminar items:", error);
    return false;
  }
}
```

---

## Ejemplo Completo: Gestión de Proyectos

### Estructura de archivos

```
src/apps/gestion_proyectos/
├── api/
│   └── directus/
│       ├── read.ts      # getProyectos, getProyectoById, etc.
│       └── create.ts     # createProyecto, updateProyecto, deleteProyecto, etc.
├── types/
│   └── types.ts         # Proyecto, Proceso, Beneficio, etc.
```

### read.ts

```typescript
import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, readItem } from "@directus/sdk";
import type { Proyecto, Proceso, Beneficio } from "../../types";

/**
 * Obtiene todos los proyectos
 */
export async function getProyectos(): Promise<Proyecto[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("gp_proyectos", {
          fields: [
            "id",
            "nombre",
            "area_beneficiada",
            "descripcion",
            "encargados",
            "fecha_inicio",
            "fecha_estimada",
            "fecha_entrega",
            "estado",
            "tipo_proyecto",
          ],
          sort: ["-fecha_inicio"],
        }),
      ),
    );

    return items.map((item: any) => ({
      id: item.id,
      nombre: item.nombre,
      area_beneficiada: item.area_beneficiada,
      descripcion: item.descripcion || "",
      encargados: item.encargados || [],
      fecha_inicio: item.fecha_inicio,
      fecha_estimada: item.fecha_estimada,
      fecha_entrega: item.fecha_entrega,
      estado: item.estado,
      tipo_proyecto: item.tipo_proyecto,
    }));
  } catch (error) {
    console.error("❌ Error al cargar proyectos:", error);
    return [];
  }
}

/**
 * Obtiene un proyecto por ID con sus procesos y beneficios
 */
export async function getProyectoById(id: string): Promise<Proyecto | null> {
  try {
    const proyecto = await withAutoRefresh(() =>
      directus.request(readItem("gp_proyectos", id)),
    );

    if (!proyecto) return null;

    // Cargar procesos relacionados
    const procesos = await withAutoRefresh(() =>
      directus.request(
        readItems("gp_proceso", {
          filter: {
            proyecto_id: { _eq: id },
          },
          sort: ["orden"],
        }),
      ),
    );

    // Cargar beneficios relacionados
    const beneficios = await withAutoRefresh(() =>
      directus.request(
        readItems("gp_beneficios", {
          filter: {
            proyecto_id: { _eq: id },
          },
        }),
      ),
    );

    return {
      id: proyecto.id,
      nombre: proyecto.nombre,
      area_beneficiada: proyecto.area_beneficiada,
      descripcion: proyecto.descripcion || "",
      encargado: proyecto.encargados || [],
      fecha_inicio: proyecto.fecha_inicio,
      fecha_estimada: proyecto.fecha_estimada,
      fecha_entrega: proyecto.fecha_entrega,
      estado: proyecto.estado,
      tipo_proyecto: proyecto.tipo_proyecto,
      procesos: procesos.map((p: any) => ({
        id: p.id,
        proyecto_id: p.proyecto_id,
        nombre: p.nombre,
        tiempo_antes: p.tiempo_antes,
        tiempo_despues: p.tiempo_despues,
        frecuencia_tipo: p.frecuencia_tipo,
        frecuencia_cantidad: p.frecuencia_cantidad,
        dias_semana: p.dias_semana,
        orden: p.orden,
      })),
      beneficios: beneficios.map((b: any) => ({
        id: b.id,
        proyecto_id: b.proyecto_id,
        descripcion: b.descripcion,
      })),
    };
  } catch (error) {
    console.error("❌ Error al cargar proyecto:", error);
    return null;
  }
}
```

### create.ts

```typescript
import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { createItem, createItems, deleteItem, updateItem } from "@directus/sdk";
import type {
  CreateProyectoInput,
  CreateProcesoInput,
  CreateBeneficioInput,
} from "../../types";

/**
 * Crea un nuevo proyecto
 */
export async function createProyecto(
  data: CreateProyectoInput,
): Promise<string | null> {
  try {
    const payload: any = {
      nombre: data.nombre,
      area_beneficiada: data.area_beneficiada,
      descripcion: data.descripcion || null,
      fecha_inicio: data.fecha_inicio,
      fecha_estimada: data.fecha_estimada || null,
      fecha_entrega: data.fecha_entrega || null,
      estado: data.estado,
      tipo_proyecto: data.tipo_proyecto,
    };

    // Solo agregar encargado si tiene datos
    if (data.encargados && data.encargados.length > 0) {
      payload.encargados = data.encargados;
    }

    const result = await withAutoRefresh(() =>
      directus.request(createItem("gp_proyectos", payload)),
    );

    return result.id;
  } catch (error) {
    console.error("❌ Error al crear proyecto:", error);
    return null;
  }
}

/**
 * Actualiza un proyecto
 */
export async function updateProyecto(
  id: string,
  data: Partial<CreateProyectoInput>,
): Promise<boolean> {
  try {
    const payload: any = {};

    if (data.nombre) payload.nombre = data.nombre;
    if (data.area_beneficiada) payload.area_beneficiada = data.area_beneficiada;
    if (data.descripcion) payload.descripcion = data.descripcion;
    if (data.fecha_inicio) payload.fecha_inicio = data.fecha_inicio;
    if (data.fecha_estimada) payload.fecha_estimada = data.fecha_estimada;
    if (data.fecha_entrega !== undefined)
      payload.fecha_entrega = data.fecha_entrega;
    if (data.estado) payload.estado = data.estado;
    if (data.tipo_proyecto) payload.tipo_proyecto = data.tipo_proyecto;
    if (data.encargados) payload.encargados = data.encargados;

    await withAutoRefresh(() =>
      directus.request(updateItem("gp_proyectos", id, payload)),
    );

    return true;
  } catch (error) {
    console.error("❌ Error al actualizar proyecto:", error);
    return false;
  }
}

/**
 * Elimina un proyecto
 */
export async function deleteProyecto(id: string): Promise<boolean> {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItem("gp_proyectos", id)),
    );

    return true;
  } catch (error) {
    console.error("❌ Error al eliminar proyecto:", error);
    return false;
  }
}
```

---

## Uso en Componentes React

### Ejemplo con TanStack Query (Recomendado)

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProyectos, createProyecto, deleteProyecto } from "./api/directus/read";

// Query para obtener datos
function useProyectos() {
  return useQuery({
    queryKey: ["proyectos"],
    queryFn: getProyectos,
  });
}

// Mutation para crear datos
function useCreateProyecto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProyecto,
    onSuccess: () => {
      // Invalidar cache para recargar datos
      queryClient.invalidateQueries({ queryKey: ["proyectos"] });
    },
  });
}

// Uso en componente
function ProyectosPage() {
  const { data: proyectos, isLoading } = useProyectos();
  const createMutation = useCreateProyecto();

  const handleCreate = async (data: CreateProyectoInput) => {
    await createMutation.mutateAsync(data);
  };

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div>
      {proyectos?.map((proyecto) => (
        <div key={proyecto.id}>{proyecto.nombre}</div>
      ))}
    </div>
  );
}
```

---

## Resumen de Funciones SDK Directus

| Función                        | Uso                          |
| ------------------------------ | ---------------------------- |
| `readItems(tabla, opciones)`   | Leer múltiples registros     |
| `readItem(tabla, id)`          | Leer un registro por ID      |
| `createItem(tabla, datos)`     | Crear un registro            |
| `createItems(tabla, datos[])`  | Crear múltiples registros    |
| `updateItem(tabla, id, datos)` | Actualizar un registro       |
| `deleteItem(tabla, id)`        | Eliminar un registro         |
| `deleteItems(tabla, ids[])`    | Eliminar múltiples registros |

---

## Notas Importantes

1. **SIEMPRE** usa `withAutoRefresh` para envolver las peticiones
2. **SIEMPRE** usa try-catch para manejar errores
3. **SIEMPRE** retorna valores por defecto en caso de error (arrays vacío `[]` o `null`)
4. **Nombra** las funciones de forma descriptiva: `getProyectos`, `createProyecto`, `updateProyecto`, `deleteProyecto`
5. **Define** tipos TypeScript para los datos de entrada y salida

---

> Esta guía es de cumplimiento obligatorio para mantener la consistencia en las conexiones a la base de datos del proyecto.
