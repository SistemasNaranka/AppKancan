# 📘 Guía de Configuración de Rutas

## 📂 Estructura de Archivos

```
src/
└── apps/
    ├── usuarios/
    │   ├── routes.tsx          ✅ Archivo de rutas (REQUERIDO)
    │   └── pages/
    │       ├── UsuariosLista.tsx
    │       └── UsuarioDetalle.tsx
    │
    └── productos/
        ├── routes.tsx          ✅ Archivo de rutas (REQUERIDO)
        └── pages/
            └── ProductosLista.tsx
```

---

## ✅ Estructura CORRECTA de `routes.tsx`

```typescript
import { RouteObject } from "react-router-dom";
import MiComponente from "./pages/MiComponente";

const routes: RouteObject[] = [
  {
    path: "/mi-ruta",
    element: <MiComponente />
  }
];

export default routes;
```

### 📋 Checklist:
- ✅ Importar `RouteObject` de `react-router-dom`
- ✅ Crear array tipado como `RouteObject[]`
- ✅ Cada ruta debe tener `path` (string que empieza con `/`)
- ✅ Cada ruta debe tener `element` (componente JSX)
- ✅ Exportar con `export default`

---

## ❌ Errores Comunes y Cómo Solucionarlos

### Error 1: FALTA_DEFAULT_EXPORT
```typescript
// ❌ MAL
export const routes = [...];

// ✅ BIEN
const routes: RouteObject[] = [...];
export default routes;
```

### Error 2: TIPO_INCORRECTO
```typescript
// ❌ MAL - No es un array
export default { path: "/usuarios", element: <div/> };

// ✅ BIEN - Es un array
export default [{ path: "/usuarios", element: <div/> }];
```

### Error 3: ARRAY_VACÍO
```typescript
// ❌ MAL
const routes: RouteObject[] = [];
export default routes;

// ✅ BIEN - Debe tener al menos una ruta
const routes: RouteObject[] = [
  { path: "/usuarios", element: <Usuarios /> }
];
export default routes;
```

### Error 4: PATH_FORMATO_INCORRECTO
```typescript
// ❌ MAL - Path no empieza con '/'
{ path: "usuarios", element: <div/> }

// ✅ BIEN
{ path: "/usuarios", element: <div/> }
```

### Error 5: FALTA_ELEMENT
```typescript
// ❌ MAL - No tiene element
{ path: "/usuarios" }

// ✅ BIEN
{ path: "/usuarios", element: <Usuarios /> }
```

---

## 🎯 Ejemplos Completos

### Ejemplo 1: Ruta Simple
```typescript
import { RouteObject } from "react-router-dom";
import Usuarios from "./pages/Usuarios";

const routes: RouteObject[] = [
  {
    path: "/usuarios",
    element: <Usuarios />
  }
];

export default routes;
```

### Ejemplo 2: Múltiples Rutas
```typescript
import { RouteObject } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Perfil from "./pages/Perfil";
import Ajustes from "./pages/Ajustes";

const routes: RouteObject[] = [
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/perfil", element: <Perfil /> },
  { path: "/ajustes", element: <Ajustes /> }
];

export default routes;
```

### Ejemplo 3: Rutas con Hijos (Nested)
```typescript
import { RouteObject } from "react-router-dom";
import Usuarios from "./pages/Usuarios";
import UsuarioDetalle from "./pages/UsuarioDetalle";

const routes: RouteObject[] = [
  {
    path: "/usuarios",
    element: <Usuarios />,
    children: [
        {
            path: ":id", // ✅ rutas hijas pueden ser relativas o dinámicas
            element: <UsuarioDetalle />
        }
    ]
  }
];

export default routes;
```
> ℹ️ **Nota:** En rutas anidadas, los hijos pueden tener paths relativos o dinámicos:
> ```ts
> { path: ":id" }  // ✅ Correcto
> { path: "*" }    // ✅ Correcto
> { path: "/usuarios/:id" } // ⚠️ Incorrecto (no debe empezar con "/")
> ```

### Ejemplo 4: Con Lazy Loading
```typescript
import { RouteObject } from "react-router-dom";
import { Suspense, lazy } from "react";

const Usuarios = lazy(() => import("./pages/Usuarios"));

const routes: RouteObject[] = [
  {
    path: "/usuarios",
    element: (
      <Suspense fallback={<div>Cargando...</div>}>
        <Usuarios />
      </Suspense>
    )
  }
];

export default routes;
```

---

## 🔍 Sistema de Validación

El sistema validará automáticamente:

1. ✅ Que el archivo exporte un `default`
2. ✅ Que el export sea un array
3. ✅ Que el array no esté vacío
4. ✅ Que cada ruta tenga `path` o `index`
5. ✅ Que el `path` sea un string
6. ✅ Que el `path` comience con `/` (solo si es ruta raíz)
   🟢 Las rutas hijas pueden usar `:param` o `*` sin `/`
7. ✅ Que cada ruta tenga `element`, `Component` o `children`
8. ✅ Que los `children` también cumplan las reglas

---

## 🚨 Mensajes de Error

Si encuentras un error, verás un mensaje detallado como:

```
[RouteValidationError] @/apps/usuarios/routes.tsx
FALTA_DEFAULT_EXPORT: El archivo debe tener un 'export default' con un array de RouteObject[].

Ejemplo correcto:
import { RouteObject } from "react-router-dom";

const routes: RouteObject[] = [
  { path: "/usuarios", element: <Usuarios /> }
];

export default routes;
```

---

## 💡 Tips

1. **Siempre usa TypeScript**: Ayuda a detectar errores antes
2. **Usa Lazy Loading**: Mejora el rendimiento
3. **Paths descriptivos**: Usa nombres claros (`/usuarios`, `/productos`)
4. **Suspense para lazy**: Siempre envuelve componentes lazy en Suspense
5. **Revisa la consola**: Los errores son muy descriptivos

---

## 📚 Recursos

- [React Router Docs](https://reactrouter.com/)
- [RouteObject Type](https://reactrouter.com/en/main/route/route)
- Ver ejemplo completo: `src/router/routeValidator.ts`