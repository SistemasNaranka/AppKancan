# Documentación del Sistema AppKancan

## Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Sistema de Autenticación y Roles](#sistema-de-autenticación-y-roles)
3. [Homes por Rol](#homes-por-rol)
4. [Barra Lateral (Sidebar)](#barra-lateral-sidebar)
5. [Sistema de Políticas y Permisos](#sistema-de-políticas-y-permisos)
6. [Verificador de Conexión WiFi](#verificador-de-conexión-wifi)
7. [Panel de Configuración](#panel-de-configuración)
8. [Integración con Inteligencia Artificial](#integración-con-inteligencia-artificial)
9. [Estructura de Base de Datos](#estructura-de-base-de-datos)
10. [Navegación y Rutas](#navegación-y-rutas)
11. [Módulos y Aplicaciones](#módulos-y-aplicaciones-del-sistema)
12. [Comisiones](#comisiones)
13. [Reservas](#reservas)
14. [Traslados](#traslados)
15. [Informe de Ventas](#informe-de-ventas)
16. [Muestras (Scanner)](#muestras-scanner)
17. [Contabilización de Facturas (IA)](#contabilización-de-facturas-ia)
18. [Componentes Compartidos](#componentes-compartidos)
19. [Servicios del Sistema](#servicios-del-sistema)

---

## Arquitectura General

El sistema **AppKancan** es una aplicación web desarrollada con las siguientes tecnologías principales:

| Tecnología            | Propósito                              |
| --------------------- | -------------------------------------- |
| **React**             | Framework frontend principal           |
| **TypeScript**        | Lenguaje tipado                        |
| **Vite**              | Build tool y servidor de desarrollo    |
| **MUI (Material UI)** | Componentes de interfaz de usuario     |
| **React Router**      | Enrutamiento de la aplicación          |
| **Directus**          | CMS y API backend                      |
| **TanStack Query**    | Gestión de estado y caché              |
| **Google Gemini API** | Extracción de datos de facturas con IA |
| **Ollama**            | Fallback local para IA                 |

### Estructura de Directorios

```
src/
├── apps/                    # Módulos/aplicaciones del sistema
│   ├── hooks/               # Contextos y hooks globales
│   ├── comisiones/          # App de comisiones
│   ├── contabilizacion_factura/  # App de facturas con IA
│   ├── reservas/           # App de reservas
│   ├── traslados/          # App de traslados
│   └── ...                 # Otras apps
├── auth/                    # Sistema de autenticación
│   ├── hooks/              # AuthProvider, AuthContext
│   ├── services/           # Servicios de autenticación
│   └── components/         # Componentes de auth
├── homes/                   # Páginas home por rol
│   ├── administracion/
│   ├── comercial/
│   ├── gerencia/
│   └── ...                 # Otros roles
├── router/                  # Configuración de rutas
├── services/                # Servicios de API
│   └── directus/           # Integración con Directus
└── shared/                  # Componentes compartidos
    ├── components/          # Componentes reutilizables
    └── hooks/              # Hooks globales
```

---

## Sistema de Autenticación y Roles

### Flujo de Autenticación

El sistema de autenticación utiliza **Directus** como proveedor de identidad. El flujo es el siguiente:

1. El usuario ingresa sus credenciales (email/password) en [`Login.tsx`](src/auth/pages/Login.tsx)
2. [`AuthProvider.tsx`](src/auth/hooks/AuthProvider.tsx) procesa el login mediante [`loginDirectus()`](src/services/directus/auth.ts:22)
3. Se almacenan tokens JWT en el storage del navegador
4. Se obtiene información del usuario incluyendo rol y políticas

### Datos del Usuario

El objeto [`User`](src/auth/hooks/AuthContext.ts:10) contiene:

```typescript
type User = {
  email: string; // Correo electrónico
  id: string; // ID único en Directus
  nombre: string; // Primer nombre
  apellido: string; // Apellido
  empresa: string; // Empresa del usuario
  codigo_ultra: string; // Código interno
  rol?: string; // Nombre del rol (ej: "Administrador")
  tienda_id?: number; // ID de tienda asignada
  policies?: string[]; // Lista de políticas activas
  requires_password_change: boolean; // Si debe cambiar contraseña
  key_gemini?: string; // API key de Gemini (encriptada)
  modelo_ia?: string; // Modelo de IA a usar
};
```

### Extracción de Políticas

Las políticas se extraen tanto del usuario como de su rol:

```typescript
// En AuthProvider.tsx (líneas 28-41)
const extractPolicies = (userData: any): string[] => {
  // Políticas directas del usuario
  const directPolicies =
    userData?.policies?.map((p: any) => p.policy.name) || [];

  // Políticas del rol
  const rolePolicies =
    userData?.role?.policies?.map((p: any) => p.policy.name) || [];

  // Combinar ambas listas
  return [...directPolicies, ...rolePolicies];
};
```

### Renovación de Tokens

El sistema implementa renovación automática de tokens mediante el interceptor [`directusInterceptor.ts`](src/auth/services/directusInterceptor.ts):

- Si el token expira, se intenta refrescar automáticamente
- Si el refresh_token también falla, se cierra la sesión
- Los tokens se almacenan en localStorage y sessionStorage

---

## Homes por Rol

### Estructura de Homes

El sistema cuenta con múltiples páginas de inicio ([`Home.tsx`](src/homes/administracion/Home.tsx)) específicas para cada área/rol:

| Rol/Directorio                                         | Descripción             |
| ------------------------------------------------------ | ----------------------- |
| [`administracion/`](src/homes/administracion/Home.tsx) | Área de administración  |
| [`comercial/`](src/homes/comercial/Home.tsx)           | Área comercial          |
| [`contabilidad/`](src/homes/contabilidad/Home.tsx)     | Área de contabilidad    |
| [`diseno/`](src/homes/diseno/Home.tsx)                 | Área de diseño          |
| [`gerencia/`](src/homes/gerencia/Home.tsx)             | Área de gerencia        |
| [`gestion_humana/`](src/homes/gestion_humana/Home.tsx) | Gestión humana          |
| [`logistica/`](src/homes/logistica/Home.tsx)           | Área de logística       |
| [`mercadeo/`](src/homes/mercadeo/Home.tsx)             | Área de mercadeo        |
| [`naranka/`](src/homes/naranka/Home.tsx)               | Área específica Naranka |
| [`produccion/`](src/homes/produccion/Home.tsx)         | Área de producción      |
| [`sistemas/`](src/homes/sistemas/Home.tsx)             | Área de sistemas        |
| [`tienda/`](src/homes/tienda/Home.tsx)                 | Área de tienda          |
| [`pruebas/`](src/homes/pruebas/Home.tsx)               | Área de pruebas         |

### Determinación del Home

La selección del home se realiza en [`AppRoutes.tsx`](src/router/AppRoutes.tsx:33):

```typescript
const homeRoute = useMemo<RouteObject | null>(() => {
  if (!area) return null;

  const homes = import.meta.glob("@/homes/**/Home.tsx");
  const areaLower = area.toLowerCase();
  const homePath = Object.keys(homes).find((path) =>
    path.toLowerCase().includes(`/homes/${areaLower}/home.tsx`),
  );
  // Carga dinámicamente el componente Home correspondiente
}, [area]);
```

### Contenido del Home

Cada Home incluye:

1. **Fecha y Hora**: Reloj en tiempo real con fecha formateada
2. **Saludo Personalizado**: "Buenos días/tardes/noches" según la hora
3. **Información del Usuario**: Nombre completo y área/rol
4. **Indicador de Conexión**: Estado de WiFi con latencia
5. **Aplicaciones Disponibles**: Grid de apps asignadas al usuario

---

## Barra Lateral (Sidebar)

### Componentes del Sidebar

El sidebar está compuesto por varios componentes en [`src/shared/components/ui-sidebar/`](src/shared/components/ui-sidebar/):

| Componente                                                            | Archivo                              | Función |
| --------------------------------------------------------------------- | ------------------------------------ | ------- |
| [`SidebarHeader`](src/shared/components/ui-sidebar/SidebarHeader.tsx) | Encabezado con logo y botón collapse |
| [`SidebarList`](src/shared/components/ui-sidebar/SidebarList.tsx)     | Lista de navegación con categorías   |
| [`SidebarFooter`](src/shared/components/ui-sidebar/SidebarFooter.tsx) | Pie con usuario y logout             |

### Estructura del Sidebar

El componente principal [`AppSidebar.tsx`](src/shared/components/layout/app-sidebar.tsx) maneja:

- **Modo Desktop**: Drawer permanente con animación de collapse
- **Modo Móvil**: Drawer temporal (overlay) con toolbar

```typescript
// Ancho del sidebar
const drawerWidth = 240;
const collapsedWidth = 70;
```

### Agrupación por Categoría

Las aplicaciones se agrupan automáticamente por categoría:

```typescript
const groupedApps = useMemo(() => {
  const groups: Record<string, any[]> = {};
  for (const app of apps) {
    const categoria = app.categoria || "Sin categoría";
    if (!groups[categoria]) groups[categoria] = [];
    groups[categoria].push(app);
  }
  return groups;
}, [apps]);
```

### Navegación

El sidebar muestra:

- Enlace a "Inicio" (home)
- Categorías expandibles con sus aplicaciones
- Iconos dinámicos para cada app (definidos en la BD)

---

## Sistema de Políticas y Permisos

### Concepto de Políticas

Las **políticas** en AppKancan son permisos granulares definidos en Directus que controlan qué funcionalidades puede ver y usar cada usuario.

### Obtención de Políticas

Las políticas se obtienen durante la autenticación:

1. Directus define políticas a nivel de rol y usuario
2. [`AuthProvider.tsx`](src/auth/hooks/AuthProvider.tsx) las extrae y las guarda en el contexto
3. Estan disponibles en `user.policies` como array de strings

### Hook de Políticas

El hook [`useUserPolicies()`](src/apps/comisiones/hooks/useUserPolicies.ts) proporciona funciones helper:

```typescript
export const useUserPolicies = () => {
  const { user } = useAuth();

  const hasPolicy = (policyName: string): boolean => {
    return user?.policies?.includes(policyName) || false;
  };

  const canSeeConfig = (): boolean => hasPolicy("readComisionesAdmin");
  const canAssignEmployees = (): boolean =>
    hasPolicy("readComisionesAdmin") || hasPolicy("readComisionesTienda");
  // ... más funciones
};
```

### Ejemplo de Uso en Comisiones

En el módulo de comisiones, las políticas controlan el acceso:

| Política                  | Funcionalidad               |
| ------------------------- | --------------------------- |
| `readComisionesAdmin`     | Ver panel de administración |
| `readComisionesTienda`    | Ver datos de tienda         |
| `readComisionesComercial` | Ver datos comerciales       |

### Validación de Rutas

El sistema también valida que las rutas existan y estén correctamente definidas mediante [`routeValidator.ts`](src/router/routeValidator.ts).

---

## Verificador de Conexión WiFi

### Implementación

Cada Home incluye un verificador de conexión a internet que monitorea constantemente la calidad de la conexión.

### Lógica de Verificación

En [`Home.tsx`](src/homes/administracion/Home.tsx:105-148):

```typescript
const check = async () => {
  try {
    const start = performance.now();
    await fetch("https://www.google.com/favicon.ico", {
      mode: "no-cors",
      cache: "no-cache",
    });
    const ping = Math.round(performance.now() - start);

    // Determinar calidad según latencia
    const level =
      connectionLevels.find((l) => ping > l.max) || connectionLevels[3];
    setConn({
      online: true,
      strength: level.strength,
      ping,
      quality: level.quality,
    });
  } catch {
    setConn({ online: false, strength: 0, ping: 0, quality: "Sin conexión" });
  }
};

// Verificar cada 10 segundos
const i = setInterval(check, 10000);
```

### Niveles de Calidad

| Latencia (ms) | Calidad      | Icono                    |
| ------------- | ------------ | ------------------------ |
| 0-100         | Excelente    | SignalWifi4Bar (verde)   |
| 101-200       | Buena        | SignalWifi3Bar (verde)   |
| 201-300       | Regular      | SignalWifi2Bar (naranja) |
| >300          | Pobre        | SignalWifi1Bar (naranja) |
| Sin conexión  | Sin conexión | SignalWifiOff (gris)     |

### Eventos del Navegador

El sistema también detecta cambios de estado online/offline:

```typescript
window.addEventListener("online", on);
window.addEventListener("offline", off);
```

### Visualización

La conexión se muestra con:

- Icono de WiFi dinámico según intensidad
- Tooltip con detalles (estado, calidad, latencia)
- Color codificado (verde/naranja/gris)

---

## Panel de Configuración

### Ubicación

El panel de configuración está en [`src/apps/Configuracion/`](src/apps/Configuracion/)

### Componentes Principales

| Componente                                                                           | Archivo                              | Función |
| ------------------------------------------------------------------------------------ | ------------------------------------ | ------- |
| [`ConfigPanel.tsx`](src/apps/Configuracion/pages/ConfigPanel.tsx)                    | Página principal de configuración    |
| [`PasswordAdminPanel.tsx`](src/apps/Configuracion/components/PasswordAdminPanel.tsx) | Panel de cambio de contraseñas admin |
| [`ThemeSwitch.tsx`](src/apps/Configuracion/components/ThemeSwitch.tsx)               | Cambio de tema claro/oscuro          |
| [`HeaderUserInfo.tsx`](src/apps/Configuracion/components/HeaderUserInfo.tsx)         | Información del usuario              |

### Funcionalidades

1. **Cambio de Tema**: Integración con [`ThemeContext.tsx`](src/shared/hooks/ThemeContext.tsx)
2. **Gestión de Contraseñas**: Cambio de contraseña propia y reset de otros usuarios (admin)
3. **Configuración de IA**: API key de Gemini y modelo de IA

---

## Integración con Inteligencia Artificial

### Visión General

AppKancan integra IA principalmente en el módulo de **Contabilización de Facturas** ([`src/apps/contabilizacion_factura/`](src/apps/contabilizacion_factura/)).

### Proveedores de IA

El sistema soporta dos proveedores:

| Proveedor         | Uso            | Configuración                             |
| ----------------- | -------------- | ----------------------------------------- |
| **Google Gemini** | Principal      | API key en campo `key_gemini` del usuario |
| **Ollama**        | Fallback/Local | Servidor local                            |

### Hook de Extracción

El hook [`useHybridExtractor()`](src/apps/contabilizacion_factura/hooks/useHybridExtractor.ts:92) implementa:

1. **Extracción con Gemini**: Convierte PDF a bytes y envía a la API
2. **Fallback a Ollama**: Si Gemini falla, usa Ollama local
3. **Progreso en tiempo real**: Muestra barra de progreso

### Flujo de Extracción

```
1. Usuario sube archivo PDF
2. Se valida tipo y tamaño
3. Se intenta con Gemini:
   - Convierte PDF a base64
   - Envía con prompt de extracción
   - Si falla, intenta con Ollama
4. Se parsea respuesta JSON
5. Se construye objeto DatosFacturaPDF
6. Se valida que tenga datos útiles
```

### Configuración por Usuario

Cada usuario puede tener su propia configuración:

```typescript
// En AuthContext
key_gemini?: string;   // API key personal de Gemini
modelo_ia?: string;   // Modelo a usar (ej: "gemma-3-27b-it")
```

### Prompt de Extracción

El sistema usa un prompt especializado para facturas colombianas:

```typescript
const PROMPT_EXTRACCION = `Eres un experto en auditoría contable colombiana.
Tu tarea es extraer datos de facturas electrónicas con precisión absoluta.

REGLAS:
1. El EMISOR es quien vende (parte superior)
2. El RECEPTOR es siempre NARANKA S.A.S (NIT 900335781-7)
3. Extraer: nit_proveedor, numero_factura, valor_total, fechas, etc.

Formato de salida: JSON puro`;
```

### Estados de IA

El componente [`IAStatusBadge.tsx`](src/apps/contabilizacion_factura/components/IAStatusBadge.tsx) muestra qué proveedor se usó y si hubo errores.

---

## Estructura de Base de Datos

### Colecciones Principales en Directus

| Colección     | Descripción                          |
| ------------- | ------------------------------------ |
| `users`       | Usuarios del sistema                 |
| `roles`       | Roles disponibles                    |
| `policies`    | Políticas de permisos                |
| `app_usuario` | Apps asignadas a usuarios            |
| `app`         | Catálogo de aplicaciones disponibles |
| `rol_usuario` | Relación usuario-rol con área        |

### Tablas de Relación

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│     users       │────<│   rol_usuario    │>────│     roles       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               │ area (string)
                               ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  app_usuario   │────<│       app       │<────│    policies     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Obtención de Apps

[`apps.ts`](src/services/directus/apps.ts) obtiene las apps del usuario:

```typescript
export async function getApps() {
  const items = await directus.request(
    readItems("app_usuario", {
      fields: [
        "id",
        "app_id.id",
        "app_id.nombre",
        "app_id.ruta",
        "app_id.categoria",
        "app_id.icono_app",
        "app_id.icono_categoria",
        "app_id.rol.name",
      ],
    }),
  );
  // Retorna apps filtradas para el usuario actual
}
```

### Obtención del Área

```typescript
export async function getUserArea() {
  return await directus.request(
    readItems("rol_usuario", {
      fields: ["id", "area", "rol_id.name"],
    }),
  );
}
```

---

## Navegación y Rutas

### Sistema de Rutas

El enrutamiento se configura en [`AppRoutes.tsx`](src/router/AppRoutes.tsx):

1. **Rutas públicas**: `/login`
2. **Rutas autenticadas**: `/home`, `/app/*`
3. **Validación de rutas**: [`routeValidator.ts`](src/router/routeValidator.ts)

### Carga Dinámica

Las rutas de apps se cargan dinámicamente:

```typescript
const rutasDisponibles = import.meta.glob("@/apps/**/routes.tsx");

// Filtrar solo las apps permitidas para el usuario
const modulosPermitidos = Object.entries(rutasDisponibles).filter(([path]) =>
  apps.some((app) => {
    const rutaLimpia = app.ruta.toLowerCase().replace(/^\/|\/$/g, "");
    return path.toLowerCase().includes(rutaLimpia);
  }),
);
```

### Provider de Apps

[`AppProvider.tsx`](src/apps/hooks/AppProvider.tsx) carga las apps y determina el área:

```typescript
const cargarApps = useCallback(async () => {
  const data = await getApps();
  setApps(data);

  const areaUsuario = await getUserArea();
  const areaValue = areaUsuario[0]?.area?.toLowerCase() || null;
  setArea(areaValue);
}, [isAuthenticated]);
```

### Persistencia de Navegación

El sistema guarda la última ruta visitada para redirigir después del login:

- **sessionStorage**: Ruta de la sesión actual
- **localStorage**: Ruta persistente entre sesiones

---

## Resumen de Flujos Principales

### Login

```
Login.tsx → AuthProvider.login() → getCurrentUser()
→ extractPolicies() → setUser() → AppProvider.cargarApps()
→ getApps() + getUserArea() → AppRoutes determina Home
```

### Navegación

```
Sidebar → App.ruta → AppRoutes filtra rutas permitidas
→ Lazy load del módulo → Validación de estructura
```

### IA Facturas

```
Usuario sube PDF → useHybridExtractor.extractData()
→ Gemini (o fallback Ollama) → Parse JSON
→ buildDatosFactura() → Mostrar en UI
```

---

## Módulos y Aplicaciones del Sistema

AppKancan cuenta con múltiples módulos que se asignan dinámicamente a cada usuario según su rol y configuración en Directus.

### Catálogo de Módulos

| Módulo                          | Ruta                       | Descripción                                                        |
| ------------------------------- | -------------------------- | ------------------------------------------------------------------ |
| **Comisiones**                  | `/comisiones`              | Gestión de comisiones por vendedor con gráficos y tablas dinámicas |
| **Contabilización de Facturas** | `/contabilizacion_factura` | Extracción de datos de facturas PDF con IA (Gemini/Ollama)         |
| **Reservas**                    | `/reservas`                | Sistema de reservas de salas con calendario y tours guiados        |
| **Traslados**                   | `/traslados`               | Gestión de traslados entre bodegas con aprobación masiva           |
| **Informe de Ventas**           | `/informe_ventas`          | Reportes de ventas con backend Express + MySQL                     |
| **Resoluciones**                | `/resoluciones`            | Gestión de resoluciones de facturación                             |
| **Promociones**                 | `/promociones`             | Administración de promociones con vista calendario                 |
| **Muestras**                    | `/muestras`                | Sistema de scanner de referencias de productos                     |
| **Gestión de Proyectos**        | `/gestion_proyectos`       | Seguimiento de proyectos con estados                               |
| **Comparación de Plataformas**  | `/comparacion_plataformas` | Comparación de datos entre sistemas                                |
| **Configuración**               | `/configuracion`           | Panel de configuración del usuario                                 |

---

## Comisiones

Módulo completo de gestión de comisiones con múltiples características:

- **Gráficos de Distribución**: Visualización de comisiones por rol
- **Tablas Dinámicas**: Datos por vendedor, tienda, zona
- **Configuración por Tienda**: Presupuestos y metas
- **Políticas de Acceso**: Control granular por permisos

### Hook de Políticas

```typescript
// src/apps/comisiones/hooks/useUserPolicies.ts
export const useUserPolicies = () => {
  const canSeeConfig = () => hasPolicy("readComisionesAdmin");
  const canAssignEmployees = () =>
    hasPolicy("readComisionesAdmin") || hasPolicy("readComisionesTienda");
  const canSeeStoreFilter = () =>
    hasPolicy("readComisionesAdmin") || hasPolicy("readComisionesComercial");
};
```

---

## Reservas

Sistema completo de reservas de salas de reuniones.

### Características Principales

- **Calendario Mensual y Semanal**: Dos vistas disponibles
- **Gestión de Salas**: Múltiples salas configurables
- **Estados de Reserva**: Vigente, En curso, Completada, Cancelada
- **Tour Guiado**: Tutorial interactivo con `react-joyride`
- **Validaciones**: Conflictos de horario, permisos de usuario

### Fases del Tour de Reservas

```typescript
type TourPhase =
  | "IDLE" // No hay tour activo
  | "RESERVA_CLICK_BUTTON" // Esperando click en Nueva Reserva
  | "DIALOG_TOUR" // Tour dentro del diálogo
  | "RESERVA_CONTINUE" // Continuar tour
  | "MIS_RESERVAS" // Tour en Mis Reservas
  | "CALENDARIO" // Tour en Calendario
  | "COMPLETED"; // Tour completado
```

---

## Traslados

Gestión de traslados de inventario entre bodegas.

### Funcionalidades

- **Aprobación Masiva**: Seleccionar múltiples traslados a la vez
- **Filtros Avanzados**: Por bodega origen/destino, número de traslado
- **Validación de Acceso**: Por políticas de usuario
- **Tour Guiado**: Tutorial paso a paso integrado
- **Confirmación con Contraseña**: Seguridad adicional para aprobaciones

### Componentes

- [`PanelPendientes.tsx`](src/apps/traslados/components/PanelPendientes.tsx) - Panel principal
- [`ValidarAccesso.tsx`](src/apps/traslados/components/ValidarAccesso.tsx) - Modal de acceso
- [`ControlesTour.tsx`](src/apps/traslados/components/ControlesTour.tsx) - Control del tour

---

## Informe de Ventas

Módulo de reportes con arquitectura separada.

### Arquitectura

```
Puerto: 11000 (Docker)
├── Frontend (React)
├── Backend API (Express)
└── MySQL (192.168.19.250)
    ├── kancan (ventas, devoluciones)
    └── naranka (referencias, grupos)
```

### Endpoints Principales

| Endpoint            | Función                     |
| ------------------- | --------------------------- |
| `GET /api/zonas`    | Lista de zonas              |
| `GET /api/ciudades` | Ciudades por zona           |
| `GET /api/tiendas`  | Tiendas por ciudad          |
| `GET /api/ventas`   | Datos de ventas con filtros |

### Filtros Contextuales

El sistema implementa **filtros en cascada**:

1. Fecha (obligatorio)
2. Zona → se carga según fechas
3. Ciudad → filtra por zona
4. Tienda → filtra por ciudad
5. Asesor → según filtros anteriores

---

## Muestras (Scanner)

Sistema de scanner de referencias de productos.

### Características

- **Bodegas por Usuario**: Se cargan desde Directus
- **Procesamiento de Códigos**: Limpia y toma primeros 6 dígitos
- **Gestión de Cantidades**: Incrementar, reducir, eliminar
- **Persistencia**: Datos en caché de TanStack Query

```typescript
// Procesamiento de código
const procesarCodigo = (input: string): string => {
  const limpio = input.trim().replace(/^0+/, "");
  // Si empieza con 44, tomar todo; si no, solo 6 dígitos
  return limpio.startsWith("44") ? limpio : limpio.slice(0, 6);
};
```

---

## Contabilización de Facturas (IA)

### Flujo de Extracción

```
1. Usuario sube PDF
2. Validar tipo MIME (application/pdf)
3. Convertir a bytes/base64
4. Intentar con Google Gemini:
   - Éxito → parsear JSON
   - Error → fallback a Ollama
5. Construir objeto DatosFacturaPDF
6. Mostrar en UI
```

### Configuración de Usuario

| Campo        | Descripción                          |
| ------------ | ------------------------------------ |
| `key_gemini` | API key personal de Google Gemini    |
| `modelo_ia`  | Modelo a usar (ej: `gemma-3-27b-it`) |

---

## Componentes Compartidos

### CustomSelectionModal

Modal genérico para selección múltiple:

- Búsqueda en tiempo real
- Seleccionar todo / Deseleccionar todo
- Tecla Escape para cerrar
- Grid adaptativo responsive
- Modo vista/selección

### DynamicIcon

Iconos dinámicos desde la BD:

```typescript
// Los nombres coinciden con iconos de MUI
<DynamicIcon iconName={app.icono_app} />
```

---

## Servicios del Sistema

### Directus SDK

```typescript
import directus from "@/services/directus/directus";
import { readItems, createItems } from "@directus/sdk";

const items = await directus.request(
  readItems("mi_coleccion", { fields: ["*"] }),
);
```

### Interceptor Auto-Refresh

[`directusInterceptor.ts`](src/auth/services/directusInterceptor.ts) maneja:

- Renovación automática de tokens
- Reintento de peticiones fallidas
- Manejo de errores de autenticación

---

## Colecciones de Directus

| Colección             | Propósito                     |
| --------------------- | ----------------------------- |
| `users`               | Usuarios del sistema          |
| `roles`               | Roles disponibles             |
| `policies`            | Políticas de permisos         |
| `app_usuario`         | Apps asignadas a usuarios     |
| `app`                 | Catálogo de aplicaciones      |
| `rol_usuario`         | Relación usuario-rol con área |
| `util_bodega_usuario` | Bodegas por usuario           |

---

## Glosario Extendido

| Término            | Definición                                           |
| ------------------ | ---------------------------------------------------- |
| **Directus**       | CMS headless que provee API y autenticación          |
| **Política**       | Permiso granular definido en Directus                |
| **Rol**            | Grupo de usuarios con permisos similares             |
| **Área**           | Departamento del usuario (admin, comercial, etc.)    |
| **App**            | Módulo funcional de la aplicación                    |
| **Home**           | Página de inicio específica por área                 |
| **Gemini**         | API de Google para procesamiento de lenguaje natural |
| **Ollama**         | Servidor local de modelos de IA                      |
| **JWT**            | JSON Web Token para autenticación                    |
| **Tour**           | Tutorial guiado interactivo (react-joyride)          |
| **TanStack Query** | Biblioteca para gestión de estado de servidor        |
| **Policy**         | Permiso específico para acceder a funcionalidades    |

---

_Documentación generada para AppKancan - Sistema de Gestión Empresarial_
