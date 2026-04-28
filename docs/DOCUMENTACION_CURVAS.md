# Documentación Técnica - Aplicación de Curvas de Distribución

## 1. Introducción

### 1.1 Descripción General

La aplicación de Curvas de Distribución es un módulo dentro de AppKancan que gestiona la planificación y despacho de mercancía hacia las distintas tiendas. Permite cargar plantillas (Excel), construir matrices de distribución por tienda/talla, validar físicamente lo despachado mediante escaneo de códigos de barras, y analizar los envíos realizados.

El módulo se conecta a Directus para persistencia de datos (colecciones `log_curvas`, `envios_curvas`, `util_tiendas`, `log_curve_scans`, etc.) y soporta concurrencia entre usuarios de Bodega mediante un sistema de bloqueos por tienda/referencia.

### 1.2 Características Principales

- **Carga de archivos Excel**: Procesamiento de Matriz General y Detalle de Producto
- **Edición dinámica de matrices**: DataGrid editable con cambio de tallas y celdas
- **Sistema de Despacho (Bodega)**: Validación física por escaneo de códigos de barras
- **Bloqueos de concurrencia**: Una tienda solo puede ser escaneada por un usuario a la vez (timeout 7 min)
- **Estados de lote**: Borrador y Confirmado para plantillas y envíos
- **Análisis de envíos**: Vista detallada de despachos por rango de fechas
- **Roles y permisos**: Admin, Bodega y Producción con permisos diferenciados
- **Reutilización de lotes**: Reaprovechar plantillas previas en una nueva fecha
- **Lazy loading**: Carga diferida de páginas para optimización

---

## 2. Estructura del Proyecto

### 2.1 Organización de Directorios

```
src/apps/curvas/
├── api/                              # Capa de comunicación con servicios externos
│   └── directus/
│       ├── bloqueos.ts               # Bloqueos de concurrencia (log_curve_scans)
│       ├── create.ts                 # Operaciones de creación/eliminación en Directus
│       └── read.ts                   # Operaciones de lectura desde Directus
│
├── components/                       # Componentes React reutilizables
│   ├── DynamicLoadMatrix.tsx         # Matriz dinámica editable de carga
│   └── FileUploadArea.tsx            # Área de drag & drop para archivos Excel
│
├── contexts/                         # Contextos React
│   └── CurvasContext.tsx             # Contexto global del módulo (estado y acciones)
│
├── hooks/                            # Custom Hooks
│   ├── useCurvasData.ts              # Wrapper para acceder a datos del contexto
│   └── useCurvasPolicies.ts          # Resolución de políticas y rol del usuario
│
├── layouts/                          # Layouts del módulo
│   ├── CurvasLayout.tsx              # Layout secundario
│   └── CurvasRouteLayout.tsx         # Layout principal con AppBar y Tabs
│
├── pages/                            # Páginas de la aplicación
│   ├── AnalisisPage.tsx              # Vista de análisis de envíos
│   ├── DashboardPage.tsx             # Dashboard con DataGrid editable
│   ├── EnviosPage.tsx                # Sistema de Despacho (Bodega)
│   ├── EnviosPage.components.tsx     # Componentes auxiliares de Envíos
│   ├── EnviosPage.utils.ts           # Utilidades de Envíos
│   ├── UploadPage.tsx                # Carga de archivos Excel
│   ├── useEnviosLogic.ts             # Lógica de negocio de Envíos
│   └── index.ts                      # Re-exportaciones
│
├── types/                            # Definiciones TypeScript
│   └── index.ts                      # Tipos, interfaces y constantes (PERMISSIONS)
│
├── utils/                            # Utilidades
│   └── excelProcessor.ts             # Procesamiento de archivos Excel
│
└── routes.tsx                        # Definición de rutas con lazy loading
```

---

## 3. Tipos de Datos

### 3.1 Roles y Permisos

```typescript
// src/apps/curvas/types/index.ts
export type UserRole = 'admin' | 'bodega' | 'produccion';

export interface RolePermissions {
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canManageShipments: boolean;
  canScan: boolean;
  canViewReports: boolean;
  canCompare: boolean;
}
```

### 3.2 Matriz General de Curvas

```typescript
export interface MatrizGeneralCurvas {
  id?: string;
  nombreHoja: string;
  referencia: string;
  filas: FilaMatrizGeneral[];
  curvas: TipoCurva[];
  totalesPorCurva: Record<TipoCurva, number>;
  totalGeneral: number;
  fechaCarga?: Date;
  fechaModificacion?: Date;
  usuarioModificacion?: string;
  estado?: 'borrador' | 'confirmado';
}

export interface FilaMatrizGeneral {
  id: string;
  tienda: Tienda;
  curvas: Record<TipoCurva, CeldaCurva>;
  total: number;
}
```

### 3.3 Detalle de Producto

```typescript
export interface DetalleProducto {
  id?: string;
  nombreHoja: string;
  referencia?: string;
  metadatos: MetadatosProducto;
  filas: FilaDetalleProducto[];
  tallas: Talla[];
  totalesPorTalla: Record<Talla, number>;
  totalGeneral: number;
  fechaCarga?: Date;
  fechaModificacion?: Date;
  usuarioModificacion?: string;
  estado?: 'borrador' | 'confirmado';
}

export interface MetadatosProducto {
  referencia: string;
  imagen: string;
  color: string;
  material?: string;
  marca?: string;
  proveedor: string;
  precio: number;
  linea: string;
  categoria?: string;
  subcategoria?: string;
}
```

### 3.4 Log de Curvas y Envíos

```typescript
export interface LogCurvas {
  id?: string;
  tienda_id: string;
  tienda_nombre?: string;
  plantilla: 'textil' | 'calzado_bolso';
  fecha: string;
  cantidad_talla: string; // JSON con {talla, codigo_barra, cantidad}
  referencia?: string;
  estado?: 'borrador' | 'confirmado';
  fecha_creacion?: string;
}

export interface EnvioCurva {
  id?: string;
  tienda_id: string;
  plantilla: string; // ID del registro origen en log_curvas
  fecha: string;
  cantidad_talla: string;
  referencia: string;
  tienda_nombre?: string;
  usuario_id?: string;
  estado?: 'borrador' | 'confirmado';
}

export interface CantidadTallaItem {
  talla: number;
  codigo_barra: string;
  cantidad: number;
}
```

### 3.5 Bloqueo de Concurrencia

```typescript
export interface BloqueoEscaner {
  id?: string;
  referencia: string;
  tienda_id: string;
  usuario_id: string;
  ultima_actividad: string; // ISO string
}
```

---

## 4. API y Servicios

### 4.1 Colecciones de Directus

| Colección          | Propósito                                                     |
| ------------------ | ------------------------------------------------------------- |
| `log_curvas`       | Plantillas/lotes de distribución (matriz_general/productos)   |
| `envios_curvas`    | Registros de despacho físico escaneado por Bodega             |
| `log_curve_scans`  | Bloqueos de concurrencia para escaneo simultáneo              |
| `util_tiendas`     | Catálogo de tiendas (incluye `codigo_ultra`)                  |
| `matriz_curvas`    | Matriz general de curvas persistida                           |
| `detalle_productos`| Detalle de productos (tallas y metadatos)                     |
| `historial_curvas` | Historial de cargas de archivos                               |
| `curvas`           | Catálogo de tipos de curva (01, 03, 05, etc.)                 |
| `tallas`           | Catálogo de tallas disponibles                                |

### 4.2 Funciones de Lectura ([read.ts](../src/apps/curvas/api/directus/read.ts))

| Función                  | Descripción                                              |
| ------------------------ | -------------------------------------------------------- |
| `getMatrizGeneral`       | Obtiene la matriz general por referencia                 |
| `getDetalleProducto`     | Obtiene el detalle de un producto                        |
| `getTiendas`             | Obtiene tiendas desde `util_tiendas` ordenadas           |
| `getDefaultTiendas`      | Filtra excluyendo "Oficina" y "Tienda Online"            |
| `getCurvas`              | Obtiene los tipos de curva disponibles                   |
| `getTallas`              | Obtiene las tallas disponibles                           |
| `getHistorialCargas`     | Historial reciente de cargas                             |
| `getLogCurvas`           | Logs filtrados por fecha y/o referencia                  |
| `getEnviosCurvas`        | Envíos despachados (hidrata escaneo físico)              |
| `getEnviosAnalisis`      | Envíos por rango de fechas para módulo de Análisis       |
| `getResumenFechasCurvas` | Estado consolidado por fecha (pendiente/enviado)         |

### 4.3 Funciones de Escritura ([create.ts](../src/apps/curvas/api/directus/create.ts))

| Función                  | Descripción                                                |
| ------------------------ | ---------------------------------------------------------- |
| `saveMatrizGeneral`      | Guarda la matriz general en Directus                       |
| `saveDetalleProducto`    | Guarda detalle de producto                                 |
| `saveHistorialCarga`     | Registra entrada en `historial_curvas`                     |
| `saveBatchCurvas`        | Guarda múltiples matrices en lote                          |
| `saveLogCurvas`          | Guarda un registro de log                                  |
| `saveLogsBatch`          | Guarda múltiples logs y devuelve sus IDs generados         |
| `saveEnvioCurva`         | Guarda un registro en `envios_curvas`                      |
| `saveEnviosBatch`        | Guarda múltiples envíos en lote                            |
| `deleteEnvioDrafts`      | Elimina borradores previos para evitar duplicados          |
| `deleteLogCurvasByRef`   | Elimina logs previos por referencia y plantilla            |

### 4.4 Funciones de Bloqueo ([bloqueos.ts](../src/apps/curvas/api/directus/bloqueos.ts))

| Función                              | Descripción                                              |
| ------------------------------------ | -------------------------------------------------------- |
| `obtenerBloqueosActivos`             | Bloqueos con actividad < 7 minutos                       |
| `intentarBloquearTienda`             | Intenta tomar el lock; renueva si ya es del usuario      |
| `renovarBloqueo`                     | Actualiza `ultima_actividad` para mantener vigente       |
| `liberarTienda`                      | Libera el lock de una tienda específica                  |
| `liberarTodasLasTiendasDeUsuario`    | Libera todos los locks de un usuario en una referencia   |
| `liberarTodosLosBloqueosDeUsuario`   | Libera todos los locks globales del usuario              |

---

## 5. Componentes Principales

### 5.1 CurvasRouteLayout

**Archivo:** [`src/apps/curvas/layouts/CurvasRouteLayout.tsx`](../src/apps/curvas/layouts/CurvasRouteLayout.tsx)

Layout principal del módulo con:

- AppBar fija con título dinámico ("Distribución Central" o "Sistema de Despacho")
- Tabs de navegación (Carga, Dashboard, Envíos, Análisis)
- Redirección automática para usuarios de bodega (`debeAterrizarEnDespacho`)
- Portales por página para inyectar controles contextuales en el header

**Lógica de redirección:**

```typescript
useEffect(() => {
  const p = location.pathname.toLowerCase();
  if (isRestrictedToBodega &&
      (p === '/curvas' || p.includes('/upload') || p.includes('/dashboard'))) {
    navigate('/curvas/envios', { replace: true });
  }
}, [isRestrictedToBodega, location.pathname, navigate]);
```

### 5.2 UploadPage

**Archivo:** [`src/apps/curvas/pages/UploadPage.tsx`](../src/apps/curvas/pages/UploadPage.tsx)

Página de carga de archivos Excel. Recibe la Matriz General y/o el Detalle de Producto, los procesa con `excelProcessor` y los carga en el contexto.

### 5.3 DashboardPage

**Archivo:** [`src/apps/curvas/pages/DashboardPage.tsx`](../src/apps/curvas/pages/DashboardPage.tsx)

Dashboard principal con DataGrid editable. Muestra la matriz general y el detalle por producto. Permite:

- Edición directa de celdas (solo Admin)
- Cambio de encabezados de tallas
- Confirmación de lotes (borrador → confirmado)
- Reutilización de lotes anteriores

### 5.4 EnviosPage (Sistema de Despacho)

**Archivo:** [`src/apps/curvas/pages/EnviosPage.tsx`](../src/apps/curvas/pages/EnviosPage.tsx)

Sistema de Despacho para usuarios de Bodega. Permite:

- Escanear códigos de barras
- Validar cantidad escaneada vs cantidad planificada
- Bloqueo de tienda durante el escaneo (concurrencia)
- Guardar envíos como borrador o confirmado
- Renovación automática del lock mientras se trabaja

### 5.5 AnalisisPage

**Archivo:** [`src/apps/curvas/pages/AnalisisPage.tsx`](../src/apps/curvas/pages/AnalisisPage.tsx)

Vista de análisis detallado con métricas y comparaciones por rango de fechas. Útil para auditar envíos realizados.

### 5.6 DynamicLoadMatrix

**Archivo:** [`src/apps/curvas/components/DynamicLoadMatrix.tsx`](../src/apps/curvas/components/DynamicLoadMatrix.tsx)

Matriz dinámica editable utilizada en Dashboard y Envíos. Soporta:

- Edición de celdas con estado interno
- Resaltado condicional (cero / mayor que cero)
- Soporte para teclado (navegación, atajos)
- Inputs numéricos y de texto

### 5.7 FileUploadArea

**Archivo:** [`src/apps/curvas/components/FileUploadArea.tsx`](../src/apps/curvas/components/FileUploadArea.tsx)

Área de drag & drop con feedback visual de progreso, validación de tipo y tamaño de archivo.

---

## 6. Hooks Personalizados

### 6.1 useCurvasPolicies

**Archivo:** [`src/apps/curvas/hooks/useCurvasPolicies.ts`](../src/apps/curvas/hooks/useCurvasPolicies.ts)

Resuelve el rol del usuario y las políticas relevantes.

```typescript
const {
  hasPolicy,         // (policyName: string) => boolean
  esBodega,          // () => boolean
  esAdmin,           // () => boolean
  debeAterrizarEnDespacho, // () => boolean (redirección a envíos)
  userRole           // 'admin' | 'bodega' | 'produccion'
} = useCurvasPolicies();
```

**Reglas de resolución:**

- `esAdmin`: rol `admin/administrador/gerencia/gerente`, política `CurvasAdmin` o `CurvasBodegaAdmin`, o rol `sistemas` sin políticas restrictivas
- `esBodega`: política `CurvasBodegaDespacho`, `CurvasBodega` o área `bodega/logistica`
- `debeAterrizarEnDespacho`: cualquier usuario que no sea admin

### 6.2 useCurvasData

**Archivo:** [`src/apps/curvas/hooks/useCurvasData.ts`](../src/apps/curvas/hooks/useCurvasData.ts)

Wrapper del `CurvasContext` para acceder a datos y acciones.

```typescript
const {
  archivos,
  datosCurvas,
  procesarArchivo,
  limpiarDatos,
  getArchivoPorTipo,
  permissions,
  userRole,
} = useCurvasData();
```

### 6.3 useEnviosLogic

**Archivo:** [`src/apps/curvas/pages/useEnviosLogic.ts`](../src/apps/curvas/pages/useEnviosLogic.ts)

Encapsula la lógica de negocio de la página de Envíos: escaneo, comparación, bloqueos y guardado.

---

## 7. Contexto Global (CurvasContext)

**Archivo:** [`src/apps/curvas/contexts/CurvasContext.tsx`](../src/apps/curvas/contexts/CurvasContext.tsx)

Contexto centralizado que provee estado y acciones para todo el módulo.

### 7.1 Estado expuesto

- **Usuario:** `userRole`, `permissions`
- **Datos:** `datosCurvas`, `archivos`, `tiendasDict`
- **Edición:** `celdasEditadas`, `hasChanges`
- **Envíos:** `envios`, `articulosEscaneados`, `validationData`
- **Concurrencia:** `bloqueosActivos`
- **Notificaciones:** `notificacionCambios`, `lastLogsUpdate`

### 7.2 Acciones principales

| Acción                      | Descripción                                            |
| --------------------------- | ------------------------------------------------------ |
| `procesarArchivo`           | Procesa un Excel y carga datos al contexto             |
| `cargarDatosManuales`       | Carga datos sin archivo (entrada manual)               |
| `cargarDatosGuardados`      | Recupera datos persistidos por fecha                   |
| `cargarDatosPorFecha`       | Filtra datos por una fecha específica                  |
| `editarCelda`               | Edita una celda del DataGrid                           |
| `cambiarTalla`              | Renombra una talla del encabezado                      |
| `guardarCambios`            | Persiste los cambios pendientes                        |
| `confirmarLote`             | Marca un lote como `confirmado`                        |
| `descartarCambios`          | Revierte ediciones no guardadas                        |
| `actualizarValorValidacion` | Actualiza el valor escaneado (validación física)       |
| `guardarEnvioDespacho`      | Guarda los envíos en `envios_curvas`                   |
| `intentarBloquear`          | Toma o renueva el bloqueo de una tienda                |
| `desmarcarTienda`           | Libera el bloqueo de una tienda                        |
| `reutilizarLote`            | Crea un nuevo registro a partir de un lote anterior    |

---

## 8. Control de Acceso

### 8.1 Políticas de Usuario

| Política                | Comportamiento                                              |
| ----------------------- | ----------------------------------------------------------- |
| `CurvasAdmin`           | Acceso total al módulo                                      |
| `CurvasBodegaAdmin`     | Admin con permisos de bodega                                |
| `CurvasBodegaDespacho`  | Solo Sistema de Despacho (envíos)                           |
| `CurvasBodega`          | Solo Sistema de Despacho (envíos)                           |

### 8.2 Permisos por Rol

| Permiso              | Admin | Bodega | Producción |
| -------------------- | :---: | :----: | :--------: |
| `canUpload`          |   ✓   |   ✗    |     ✓      |
| `canEdit`            |   ✓   |   ✗    |     ✓      |
| `canDelete`          |   ✓   |   ✗    |     ✗      |
| `canExport`          |   ✓   |   ✓    |     ✓      |
| `canManageShipments` |   ✓   |   ✓    |     ✓      |
| `canScan`            |   ✓   |   ✓    |     ✓      |
| `canViewReports`     |   ✓   |   ✓    |     ✓      |
| `canCompare`         |   ✓   |   ✓    |     ✓      |

### 8.3 Aterrizaje según el Rol

- **Admin / Producción:** `/curvas/upload` (página de carga)
- **Bodega / Logística:** `/curvas/envios` (sistema de despacho)

---

## 9. Sistema de Concurrencia

### 9.1 Mecanismo de Bloqueos

Cuando un usuario de Bodega selecciona una tienda para escanear, se crea un registro en `log_curve_scans`. Mientras el lock esté vigente (actividad < 7 min), ningún otro usuario puede tomar esa tienda para esa referencia.

### 9.2 Ciclo de Vida del Lock

```
┌──────────────────┐
│ Usuario abre     │
│ tienda en Envíos │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ intentarBloquear │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌───────────────┐
│ Libre │  │ Otro usuario  │
└───┬───┘  └───────┬───────┘
    │              │
    ▼              ▼
┌────────────┐  ┌─────────────┐
│ Lock       │  │ Bloqueado   │
│ adquirido  │  │ (read-only) │
└────┬───────┘  └─────────────┘
     │
     ▼
┌──────────────────┐
│ renovarBloqueo   │
│ (heartbeat)      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ liberarTienda    │
│ (al cerrar/save) │
└──────────────────┘
```

### 9.3 Timeout

- Tiempo de inactividad antes de liberar: **7 minutos**
- El cliente debe renovar periódicamente para mantener el lock
- Al cerrar sesión o limpiar datos: se libera vía `liberarTodosLosBloqueosDeUsuario`

---

## 10. Flujo de Datos

### 10.1 Flujo de Carga (Admin)

```
┌───────────────┐
│  UploadPage   │
└───────┬───────┘
        │
        ▼
┌───────────────────┐
│ FileUploadArea    │
│ (drag & drop)     │
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│ excelProcessor    │
│ (parse XLSX)      │
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│ procesarArchivo   │
│ (Context)         │
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│ DashboardPage     │
│ (DataGrid)        │
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│ guardarCambios    │
│ → log_curvas      │
└───────────────────┘
```

### 10.2 Flujo de Despacho (Bodega)

```
┌───────────────┐
│  EnviosPage   │
└───────┬───────┘
        │
        ▼
┌──────────────────────┐
│ getLogCurvas (fecha) │
└───────┬──────────────┘
        │
        ▼
┌──────────────────────┐
│ Selecciona tienda    │
└───────┬──────────────┘
        │
        ▼
┌──────────────────────┐
│ intentarBloquear     │
└───────┬──────────────┘
        │ ✓
        ▼
┌──────────────────────┐
│ Escaneo de barras    │
│ (DynamicLoadMatrix)  │
└───────┬──────────────┘
        │
        ▼
┌──────────────────────┐
│ guardarEnvioDespacho │
│ → envios_curvas      │
└───────┬──────────────┘
        │
        ▼
┌──────────────────────┐
│ liberarTienda        │
└──────────────────────┘
```

---

## 11. Estados del Lote

### 11.1 Estados Definidos

| Estado       | Descripción                                          | Acciones Permitidas      |
| ------------ | ---------------------------------------------------- | ------------------------ |
| `borrador`   | Lote en construcción, editable                       | Editar, Confirmar, Eliminar |
| `confirmado` | Lote cerrado, listo para despacho/escaneo            | Solo lectura             |

### 11.2 Transiciones

- **borrador → confirmado:** vía `confirmarLote` o `confirmarLoteConDatos`
- **No hay transición inversa** (los lotes confirmados son inmutables)

---

## 12. Rutas

### 12.1 Definición

**Archivo:** [`src/apps/curvas/routes.tsx`](../src/apps/curvas/routes.tsx)

```typescript
const routes: RouteObject[] = [
  {
    path: '/curvas',
    element: (
      <CurvasProvider>
        <CurvasRouteLayout />
      </CurvasProvider>
    ),
    children: [
      { index: true,           element: <UploadPage /> },
      { path: 'upload',        element: <UploadPage /> },
      { path: 'dashboard',     element: <DashboardPage /> },
      { path: 'envios',        element: <EnviosPage /> },
      { path: 'analisis',      element: <AnalisisPage /> },
    ],
  },
];
```

### 12.2 URLs

| Ruta                  | Página         | Acceso              |
| --------------------- | -------------- | ------------------- |
| `/curvas`             | UploadPage     | Admin / Producción  |
| `/curvas/upload`      | UploadPage     | Admin / Producción  |
| `/curvas/dashboard`   | DashboardPage  | Admin / Producción  |
| `/curvas/envios`      | EnviosPage     | Todos los roles     |
| `/curvas/analisis`    | AnalisisPage   | Admin / Producción  |

Todas las páginas se cargan con **lazy loading** (`React.lazy` + `Suspense`).

---

## 13. Procesamiento de Excel

### 13.1 excelProcessor

**Archivo:** [`src/apps/curvas/utils/excelProcessor.ts`](../src/apps/curvas/utils/excelProcessor.ts)

Encargado de parsear archivos `.xlsx` y construir las estructuras `MatrizGeneralCurvas` y `DetalleProducto`.

**Funciones principales:**

- `procesarMatrizGeneral`: parsea la hoja de matriz general
- `procesarDetalleProducto`: parsea hojas de detalle por producto

### 13.2 Tipos de Archivo Soportados

| Tipo                   | Descripción                                      |
| ---------------------- | ------------------------------------------------ |
| `matriz_general`       | Distribución por tienda y curva (01, 03, 05...)  |
| `detalle_producto_a`   | Detalle por tallas (Producto A)                  |
| `detalle_producto_b`   | Detalle por tallas (Producto B)                  |

---

## 14. Dependencias

### 14.1 Librerías Externas

| Librería                | Uso                                  |
| ----------------------- | ------------------------------------ |
| `@mui/material`         | Componentes de UI                    |
| `@mui/x-data-grid`      | DataGrid editable                    |
| `@directus/sdk`         | Comunicación con Directus            |
| `xlsx`                  | Lectura/escritura de Excel           |
| `react-router-dom`      | Navegación y lazy loading            |
| `@emotion/react`        | Estilos CSS-in-JS                    |

### 14.2 Servicios Internos

| Servicio                                | Uso                                    |
| --------------------------------------- | -------------------------------------- |
| `@/services/directus/directus`          | Cliente Directus                       |
| `@/auth/services/directusInterceptor`   | `withAutoRefresh` para tokens          |
| `@/auth/hooks/useAuth`                  | Datos del usuario autenticado          |
| `@/apps/hooks/useApps`                  | Área del usuario                       |

---

## 15. Manejo de Errores

### 15.1 Errores de API

Todas las funciones del API capturan errores y devuelven valores seguros (`null`, `false`, `[]`, `{}`) para evitar interrumpir la UI.

```typescript
try {
  const response = await withAutoRefresh(() => directus.request(...));
  return response;
} catch (error) {
  console.error('Error fetching ...', error);
  return [];
}
```

### 15.2 Errores de Concurrencia

| Caso                          | Resolución                                     |
| ----------------------------- | ---------------------------------------------- |
| Tienda bloqueada por otro     | UI muestra modo solo-lectura                   |
| Lock expirado                 | Otro usuario puede tomarlo automáticamente     |
| Sin red al renovar            | Lock expira a los 7 min y se libera solo       |

---

## 16. Optimizaciones

### 16.1 Lazy Loading de Páginas

```typescript
const UploadPage = lazy(() => import('./pages/UploadPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EnviosPage = lazy(() => import('./pages/EnviosPage'));
const AnalisisPage = lazy(() => import('./pages/AnalisisPage'));
```

### 16.2 Memoización

- `useMemo` y `useCallback` ampliamente usados en `CurvasContext` para evitar recomputaciones
- Diccionario de tiendas (`tiendasDict`) precalculado para lookups rápidos

### 16.3 Carga incremental

- `getLogCurvas` admite filtro `lastUpdated` para traer solo registros nuevos
- `refreshLogs` permite refrescar bajo demanda sin recargar todo

---

## 17. Consideraciones de Seguridad

### 17.1 Autenticación

- Todas las llamadas a Directus se realizan con `withAutoRefresh` (refresh token automático)
- Los datos del usuario se validan vía `useAuth` antes de mostrar la aplicación

### 17.2 Autorización

- Permisos centralizados en `PERMISSIONS` y resueltos por `useCurvasPolicies`
- Redirección forzada a `/curvas/envios` para usuarios sin acceso a edición
- Validación de rol antes de cada acción crítica (editar, eliminar, confirmar)

### 17.3 Concurrencia

- Locks evitan que dos usuarios escaneen la misma tienda simultáneamente
- Timeout automático de 7 min impide bloqueos indefinidos

---

_Documentación actualizada: Abril 2026_
_Versión: 1.0_
