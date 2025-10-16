# 📘 Guía para Desarrolladores: Agregar una Nueva App

Esta guía te explica paso a paso cómo crear y configurar una nueva aplicación en la carpeta `apps`.

---

## 📁 Estructura Básica de una App

Cada app debe seguir esta estructura dentro de `src/apps/`:

```
src/apps/
└── mi-app/                    # 👈 Nombre de tu app
    ├── routes.tsx             # ✅ OBLIGATORIO - Define las rutas
    ├── pages/                 # Componentes de páginas
    │   └── MiAppHome.tsx
    ├── api/                   # Llamadas a APIs
    │   └── directus/
    │       ├── getMiApp.ts
    │       ├── updateMiApp.ts
    │       └── deleteMiApp.ts
    ├── components/            # Componentes específicos de la app
    ├── hooks/                 # Hooks personalizados (opcional)
    └── types/                 # Tipos TypeScript (opcional)
```

---

## 🚀 Paso 1: Crear el archivo `routes.tsx`

**Ubicación:** `src/apps/mi-app/routes.tsx`

Este archivo es **OBLIGATORIO** y define cómo React Router cargará tu app.

### ✅ Ejemplo Básico (Ruta Simple)

```tsx
import MiAppHome from "./pages/MiAppHome";
import { RouteObject } from "react-router-dom";

const routes: RouteObject[] = [
  {
    path: "/mi-app",  // 👈 Ruta principal (debe empezar con "/")
    element: <MiAppHome />,
  },
];

export default routes;
```

### 🔹 Ejemplo con Rutas Anidadas (Children)

```tsx
import MiAppHome from "./pages/MiAppHome";
import DetalleItem from "./pages/DetalleItem";
import CrearItem from "./pages/CrearItem";
import { RouteObject } from "react-router-dom";

const routes: RouteObject[] = [
  {
    path: "/mi-app",
    element: <MiAppHome />,
    children: [
      {
        path: "crear",  // 👈 Ruta relativa (sin "/")
        element: <CrearItem />,
      },
      {
        path: ":id",  // 👈 Ruta dinámica
        element: <DetalleItem />,
      },
    ],
  },
];

export default routes;
```

**URLs generadas:**
- `/mi-app` → MiAppHome
- `/mi-app/crear` → CrearItem
- `/mi-app/123` → DetalleItem (con `id=123`)

---

## 📋 Reglas del `routes.tsx`

### ✅ Obligatorio
1. **Debe exportar un array** de `RouteObject[]` como `default export`
2. **Rutas raíz** deben empezar con `/` (ejemplo: `/mi-app`)
3. **Rutas hijas** deben ser relativas (ejemplo: `crear`, `:id`)
4. Cada ruta debe tener:
   - `path` (string) o `index` (boolean)
   - `element` (componente React) o `children` (array de rutas)

### ❌ Errores Comunes

| ❌ Error | ✅ Correcto |
|---------|------------|
| `export routes = [...]` | `export default routes` |
| `path: "mi-app"` (sin `/`) | `path: "/mi-app"` |
| `children: [{ path: "/crear" }]` | `children: [{ path: "crear" }]` |
| Array vacío `[]` | Al menos una ruta definida |

---

## 🛠️ Paso 2: Crear el Componente Principal

**Ubicación:** `src/apps/mi-app/pages/MiAppHome.tsx`

### Ejemplo con TanStack Query (recomendado)

```tsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getMiApp } from "@/apps/mi-app/api/directus/getMiApp";
import { CircularProgress, Box, Typography } from "@mui/material";

type Item = {
  id: string;
  nombre: string;
};

const MiAppHome: React.FC = () => {
  const { data, isLoading, isError } = useQuery<Item[]>({
    queryKey: ["mi-app"],
    queryFn: getMiApp,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Typography color="error">Error al cargar datos</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Mi App
      </Typography>
      {/* Tu contenido aquí */}
    </Box>
  );
};

export default MiAppHome;
```

---

## 📡 Paso 3: Crear Funciones de API (Directus)

**Ubicación:** `src/apps/mi-app/api/directus/getMiApp.ts`

### ✅ Función GET (Leer datos)

```tsx
import directus from "@/services/directus/directus";
import { readItems } from "@directus/sdk";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";

export async function getMiApp() {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(readItems('mi_coleccion', { limit: 50 }))
    );
    return items;
  } catch (error) {
    console.error("Error cargando datos:", error);
    throw error;
  }
}
```

### ✅ Función UPDATE (Actualizar)

```tsx
import directus from "@/services/directus/directus";
import { updateItem } from "@directus/sdk";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";

export async function updateMiApp(id: string, data: any) {
  try {
    await withAutoRefresh(() =>
      directus.request(updateItem('mi_coleccion', id, data))
    );
  } catch (error) {
    console.error("Error actualizando:", error);
    throw error;
  }
}
```

### ✅ Función DELETE (Eliminar)

```tsx
import directus from "@/services/directus/directus";
import { deleteItem } from "@directus/sdk";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";

export async function deleteMiApp(id: string) {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItem('mi_coleccion', id))
    );
  } catch (error) {
    console.error("Error eliminando:", error);
    throw error;
  }
}
```

---

## 🔍 Paso 4: Validación Automática

El sistema **valida automáticamente** tus rutas al cargar la app. Si hay errores, verás:

### Ejemplo de Error en Consola

```
🚨 SE ENCONTRARON ERRORES EN LAS RUTAS 🚨

[Error 1/1]
[RouteValidationError] @/apps/mi-app/routes.tsx
FALTA_DEFAULT_EXPORT: El archivo debe tener un 'export default' con un array de RouteObject[]
```

### ¿Dónde se define la validación?
- **Archivo:** `src/router/routeValidator.ts`
- **Función:** `loadAndValidateRoutes()`

---

## 🎯 Paso 5: Configurar Permisos en Directus

Para que tu app aparezca en el menú, debes configurar los permisos:

1. **Ir a Directus** → Configuración → Roles
2. Seleccionar el rol del usuario
3. En la colección `apps`, agregar tu app con:
   - `nombre`: "Mi App"
   - `url`: `/mi-app` (debe coincidir con el `path` en `routes.tsx`)
   - `icono`: `"Home"` (opcional)

---

## 🧪 Checklist de Verificación

Antes de hacer commit, verifica:

- [ ] El archivo `routes.tsx` existe y tiene `export default`
- [ ] Las rutas raíz empiezan con `/`
- [ ] Las rutas hijas NO empiezan con `/`
- [ ] Cada ruta tiene `element` o `children`
- [ ] Los componentes de página existen
- [ ] Las funciones de API usan `withAutoRefresh()`
- [ ] La app está agregada en Directus con el mismo `path`

---

## 📚 Referencia Rápida

### Estructura Completa de un `RouteObject`

```tsx
const routes: RouteObject[] = [
  {
    path: "/mi-app",           // ✅ Obligatorio (string)
    element: <MiAppHome />,    // ✅ Obligatorio (JSX)
    children: [                // ❓ Opcional (array)
      {
        path: "crear",         // Relativo a la ruta padre
        element: <Crear />
      },
      {
        path: ":id",           // Parámetro dinámico
        element: <Detalle />
      },
      {
        index: true,           // Ruta por defecto
        element: <Dashboard />
      }
    ]
  }
];
```

---

## 🆘 Problemas Comunes

### 1. "La app no aparece en el menú"
**Solución:** Verifica que el `path` en `routes.tsx` coincida con el configurado en Directus.

### 2. "Error: FALTA_DEFAULT_EXPORT"
**Solución:** Agrega `export default routes;` al final de `routes.tsx`.

### 3. "Error: PATH_FORMATO_INCORRECTO"
**Solución:** Las rutas raíz deben empezar con `/`, las hijas no.

### 4. "401 Unauthorized en Directus"
**Solución:** El token expiró. Usa `withAutoRefresh()` en todas las llamadas a Directus.

---

## 🎓 Ejemplo Completo

Ver apps existentes como referencia:
- `src/apps/empresas/` (ejemplo simple)
- `src/apps/personas/` (ejemplo con formularios)
- `src/apps/traslados/` (ejemplo complejo)

---

## 📞 Soporte

Si tienes dudas, revisa:
1. La consola del navegador (F12)
2. El archivo `src/router/routeValidator.ts`
3. El archivo `src/router/AppRoutes.tsx`
