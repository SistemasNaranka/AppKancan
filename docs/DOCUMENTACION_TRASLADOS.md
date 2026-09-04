# Documentación Técnica - Aplicación de Traslados

## 1. Introducción

### 1.1 Descripción General

La aplicación de Traslados es un módulo dentro de AppKancan que permite a los usuarios autorizados visualizar y aprobar traslados pendientes entre bodegas. La aplicación se conecta a un webhook externo para obtener los datos de traslados y enviar las aprobaciones al sistema Ultra Systems.

### 1.2 Características Principales

- **Visualización de traslados pendientes**: Lista de traslados con información de origen, destino y unidades
- **Filtrado**: Por bodega destino y nombre/búsqueda
- **Selección múltiple**: Selección individual o masiva de traslados
- **Aprobación con autenticación**: Requiere contraseña del Ultra Systems para aprobar
- **Tour guiado**: Tutorial interactivo para nuevos usuarios
- **Control de acceso**: Validación de permisos por usuario

---

## 2. Estructura del Proyecto

### 2.1 Organización de Directorios

```
src/apps/traslados/
├── api/                          # Capa de comunicación con servicios externos
│   └── obtenerTraslados.ts       # Funciones para obtener y aprobar traslados
│
├── components/                   # Componentes React reutilizables
│   ├── AprobacionFeedback.tsx    # Feedback visual de aprobación
│   ├── CargaSkeletons.tsx        # Skeletons de carga
│   ├── ConfirmacionAprobacion.tsx # Modal de confirmación con contraseña Ultra Systems
│   ├── ContadorPendientesYSeleccionados.tsx # Contadores visuales con animación
│   ├── ControlesSuperiores.tsx   # Botones de control (Tutorial, Aprobar)
│   ├── ControlesTour.tsx         # Controles interactivos del tour guiado
│   ├── ListaTraslados.tsx        # Lista de traslados con estados
│   ├── PanelPendientes.tsx       # Panel principal con tour integrado
│   ├── PendientesFilters.tsx     # Filtros de búsqueda por bodega y nombre
│   ├── StoreTrasladosFilters.tsx # Filtros específicos para vista por tienda
│   ├── StoreTrasladosHeader.tsx  # Cabecera resumida para tiendas
│   ├── StoreTrasladosTour.tsx    # Tour específico para vista por tienda
│   ├── TrasladoDetalleModal.tsx  # Modal emergente con desglose de prendas/referencias y buscador
│   ├── TrasladoListItem.tsx      # Item individual de traslado
│   ├── traslados-tour-index.ts   # Pasos e índice del tutorial interactivo
│   ├── TrasladosHelpButton.tsx   # Botón flotante de ayuda
│   ├── TrasladosTour.tsx         # Componente del tour guiado (React Joyride)
│   ├── TrasladosTourContext.tsx  # Contexto y máquina de estado del tour
│   └── ValidarAcceso.tsx         # Modal de validación de acceso de usuario
│
├── hooks/                        # Custom Hooks
│   ├── types.ts                  # Definiciones de tipos TypeScript
│   ├── useAccessValidation.ts    # Validación de acceso de usuario
│   └── useCountAnimation.ts      # Animación de contadores
│
├── pages/                        # Páginas de la aplicación
│   └── TrasladosPanel.tsx        # Página principal
│
└── routes.tsx                    # Definición de rutas
```

---

## 3. Tipos de Datos

### 3.1 Interfaz Traslado

```typescript
// src/apps/traslados/hooks/types.ts
export interface Traslado {
  traslado: number; // ID único del traslado
  fecha: string; // Fecha del traslado
  bodega_origen: string; // Código de bodega origen
  nombre_origen: string; // Nombre de bodega origen
  bodega_destino: string; // Código de bodega destino
  nombre_destino: string; // Nombre de bodega destino
  unidades: number; // Cantidad de unidades
}
```

### 3.2 Interfaz de Validación de Acceso

```typescript
// src/apps/traslados/hooks/useAccessValidation.ts
export interface AccessValidationResult {
  isValid: boolean;
  errorType: "no-access" | "incomplete" | null;
  missingFields: string[];
}
```

### 3.3 Request de Aprobación

```typescript
// src/apps/traslados/api/obtenerTraslados.ts
export interface AprobacionTrasladosRequest {
  traslados: Array<{
    traslado: number;
    fecha: string;
  }>;
  empresa: string;
  codigo_ultra: string;
  clave: string;
}
```

---

## 4. API y Servicios

### 4.1 Variables de Entorno

| Variable | Descripción |
| :--- | :--- |
| `VITE_WEBHOOK_USERNAME` | Usuario para autenticación Basic Auth del webhook |
| `VITE_WEBHOOK_PASSWORD` | Contraseña para autenticación Basic Auth del webhook |
| `VITE_WEBHOOK_URL_TRASLADOS` | URL principal para obtener traslados pendientes |
| `VITE_WEBHOOK_URL_TRASLADOS_TIENDAS` | URL específica para consultar traslados por tiendas |
| `VITE_WEBHOOK_URL_POST_TRASLADOS_COMERCIAL` | URL para consultar traslados de múltiples tiendas (Área Manager) |
| `VITE_WEBHOOK_URL_POST_TRASLADOS` | URL para procesar y aprobar traslados en Ultra Systems |

---

### 4.2 Funciones de API

> 🆕 **[NUEVO - ADICIÓN TÉCNICA AGOSTO 2026]**

#### obtenerTrasladosJefeZona()

Obtiene los traslados pendientes correspondientes a las múltiples tiendas asignadas a un Área Manager / Jefe de Zona.

```typescript
export async function obtenerTrasladosJefeZona(
  ultra_code: string,
  company: string,
  tiendas: UserStoreAccess[],
): Promise<Traslado[]>;
```

- **Mapeo Automático de Bodegas**: Para la empresa Kancan, si el `store_id` contiene el prefijo `10` (ejemplo `1090`), la función remueve el prefijo para enviar el ID limpio de bodega (`90`) al servicio comercial.

#### obtenerTraslados()

Obtiene la lista de traslados pendientes para el usuario de tienda u operativo.

```typescript
export async function obtenerTraslados(
  ultra_code: string,
  company: string,
  esTienda: boolean = false,
): Promise<Traslado[]>;
```

**Parámetros:**

- `codigo_ultra`: Código del usuario en Ultra Systems
- `empresa`: Nombre de la empresa del usuario

**Retorna:**

- Array de objetos `Traslado`

#### aprobarTraslados()

Envía los traslados seleccionados para su aprobación.

```typescript
export async function aprobarTraslados(
  trasladosSeleccionados: Traslado[],
  empresa: string,
  codigo_ultra: string,
  clave: string,
): Promise<any>;
```

**Parámetros:**

- `trasladosSeleccionados`: Array de traslados a aprobar
- `empresa`: Nombre de la empresa
- `codigo_ultra`: Código del usuario
- `clave`: Contraseña del Ultra Systems

**Estructura del payload enviado:**

```json
{
  "traslados": [{ "traslado": 12345, "fecha": "2025-10-24T10:30:00" }],
  "empresa": "MI_EMPRESA_SAS",
  "codigo_ultra": "U123456",
  "clave": "mi_contraseña_segura"
}
```

---

## 5. Componentes Principales

### 5.1 TrasladosPanel

**Archivo:** [`src/apps/traslados/pages/TrasladosPanel.tsx`](../src/apps/traslados/pages/TrasladosPanel.tsx)

Componente principal que orquesta toda la funcionalidad de la aplicación.

**Características:**

- Validación de acceso del usuario
- Carga de traslados con TanStack Query
- Gestión de estado de selección
- Filtrado de traslados
- Manejo de errores y notificaciones

**Props del estado:**

```typescript
const [filtroBodegaDestino, setFiltroBodegaDestino] = useState("");
const [filtroNombre, setFiltroNombre] = useState("");
const [idsSeleccionados, setIdsSeleccionados] = useState<number[]>([]);
const [snackbarOpen, setSnackbarOpen] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Query de TanStack:**

```typescript
const {
  data: pendientes = [],
  isLoading,
  isError,
} = useQuery({
  queryKey: ["traslados_pendientes", user?.codigo_ultra, user?.empresa],
  queryFn: async () => {
    return await obtenerTraslados(codigo, empresa);
  },
  staleTime: 1000 * 60 * 60, // 1 hora
  gcTime: 1000 * 60 * 60 * 2, // 2 horas
  enabled: !!user?.codigo_ultra && !!user?.empresa && accessValidation.isValid,
});
```

### 5.2 PanelPendientes

**Archivo:** [`src/apps/traslados/components/PanelPendientes.tsx`](../src/apps/traslados/components/PanelPendientes.tsx)

Panel contenedor con el tour guiado integrado.

**Props:**

```typescript
type PanelPendientesProps = {
  filtroBodegaDestino: string;
  setFiltroBodegaDestino: (v: string) => void;
  filtroNombre: string;
  setFiltroNombre: (v: string) => void;
  filtrados: Traslado[];
  bodegasDestino: string[];
  isError?: boolean;
  loading: boolean;
  idsSeleccionados: number[];
  onToggleSeleccion: (id: number) => void;
  onToggleSeleccionarTodos: (seleccionar: boolean) => void;
  totalPendientes: number;
  onEliminarTrasladosAprobados?: (
    ids: number[],
    clave: string,
  ) => Promise<void>;
  onRetry?: () => void;
  tienePoliticaTrasladosJefezona?: boolean;
};
```

### 5.3 ListaTraslados

**Archivo:** [`src/apps/traslados/components/ListaTraslados.tsx`](../src/apps/traslados/components/ListaTraslados.tsx)

Componente que renderiza la lista de traslados con múltiples estados.

**Estados manejados:**

1. **Cargando**: Muestra skeletons de carga
2. **Error**: Muestra mensaje con botón de reintentar
3. **Sin datos**: Muestra mensaje cuando no hay traslados
4. **Sin coincidencias**: Muestra mensaje cuando el filtro no encuentra resultados
5. **Datos disponibles**: Muestra la grilla de traslados

### 5.4 TrasladoListItem

**Archivo:** [`src/apps/traslados/components/TrasladoListItem.tsx`](../src/apps/traslados/components/TrasladoListItem.tsx)

Tarjeta individual que muestra la información de un traslado.

**Props:**

```typescript
interface Props {
  traslado: Traslado;
  onTrasladoClick?: () => void;
  compact?: boolean;
  isSelected?: boolean;
}
```

**Información mostrada:**

- Número de traslado
- Fecha
- Bodega origen
- Bodega destino
- Unidades (en chip)

### 5.5 ConfirmacionAprobacion

**Archivo:** [`src/apps/traslados/components/ConfirmacionAprobacion.tsx`](../src/apps/traslados/components/ConfirmacionAprobacion.tsx)

Modal de confirmación que solicita la contraseña del Ultra Systems.

**Características:**

- Campo de contraseña con visibilidad toggleable
- Validación de mínimo 4 dígitos
- Solo acepta caracteres numéricos
- Soporte para tecla Enter

### 5.6 Modal de Detalle de Referencias (`TrasladoDetalleModal`)

> 🆕 **[NUEVO - ADICIÓN TÉCNICA AGOSTO 2026]**

**Archivo:** `src/apps/traslados/components/TrasladoDetalleModal.tsx`

Modal emergente que despliega el desglose detallado de prendas y referencias contenidas en un traslado:

- **Buscador en Tiempo Real**: Permite filtrar referencias por código SKU o por nombre de la prenda.
- **Contador Dinámico de Unidades**: Suma automáticamente las unidades físicas totales de las referencias filtradas.
- **Tabla Adaptativa**: Muestra las columnas *Referencia*, *Nombre Referencia* y *Unidades* con scroll interno.

### 5.7 AccessValidationModal

**Archivo:** [`src/apps/traslados/components/ValidarAcceso.tsx`](../src/apps/traslados/components/ValidarAcceso.tsx)

Modal que se muestra cuando el usuario no tiene acceso configurado.

---

## 8. Matriz de Permisos y Perfiles de Usuario

> 🆕 **[NUEVO - ADICIÓN TÉCNICA AGOSTO 2026]**

| Rol / Perfil | Consulta de Traslados | Método API Utilizado | Requisito de Aprobación |
| :--- | :--- | :--- | :--- |
| **Usuario Operativo Tienda** | Solo traslados con destino a su tienda asignada | `obtenerTraslados(codigo, empresa, true)` | Contraseña Ultra Systems en `ConfirmacionAprobacion` |
| **Área Manager / Jefe de Zona** | Traslados consolidados de todas sus tiendas asignadas | `obtenerTrasladosJefeZona(codigo, empresa, tiendas)` | Contraseña Ultra Systems en `ConfirmacionAprobacion` |
| **Administrador General** | Acceso total a todas las bodegas | `obtenerTraslados(codigo, empresa, false)` | Contraseña Ultra Systems en `ConfirmacionAprobacion` |

---

## 9. Sistema de Tours Guiados e Inducción (`TrasladosTourContext`)

> 🆕 **[NUEVO - ADICIÓN TÉCNICA AGOSTO 2026]**

La aplicación integra la librería `react-joyride` junto a `TrasladosTourContext.tsx` y `ControlesTour.tsx`:

- **Recorrido Paso a Paso**: Guía al usuario por la barra de búsqueda, selector de bodegas, checkboxes de selección masiva y botón de aprobación.
- **Botón Flotante de Ayuda (`TrasladosHelpButton.tsx`)**: Permite reiniciar el tour de capacitación en cualquier momento sin recargar la página.

---

_Documentación técnica actualizada del Módulo de Traslados - AppKancan (Agosto 2026)_

---

## 6. Hooks Personalizados

### 6.1 useAccessValidation

**Archivo:** [`src/apps/traslados/hooks/useAccessValidation.ts`](../src/apps/traslados/hooks/useAccessValidation.ts)

Valida que el usuario tenga los datos necesarios para acceder a la aplicación.

```typescript
export function useAccessValidation(
  user: UserData | null | undefined,
): AccessValidationResult;
```

**Validaciones:**

- `codigo_ultra`: Debe ser no nulo y no vacío
- `empresa`: Debe ser un string no vacío

**Retorna:**

```typescript
{
  isValid: boolean;           // true si tiene acceso
  errorType: "no-access" | "incomplete" | null;
  missingFields: string[];    // Campos faltantes
}
```

### 6.2 useCountAnimation

**Archivo:** [`src/apps/traslados/hooks/useCountAnimation.ts`](../src/apps/traslados/hooks/useCountAnimation.ts)

Hook para animar contadores numéricos con transición suave.

---

## 7. Flujo de Datos

### 7.1 Flujo de Carga

```
┌─────────────────┐
│ TrasladosPanel  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ useAccessValid. │────▶│ AccessValidation │
└────────┬────────┘     │     Modal        │
         │ ✓            └──────────────────┘
         ▼
┌─────────────────┐
│  TanStack Query │
│  (obtenerTrasla.)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PanelPendientes │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ListaTraslados  │
└─────────────────┘
```

### 7.2 Flujo de Aprobación

```
┌─────────────────┐
│ Usuario         │
│ selecciona      │
│ traslados       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Click APROBAR   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Confirmacion    │
│ Aprobacion      │
│ (solicita clave)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ aprobarTraslados│
│ (API call)      │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌───────┐
│ Éxito │  │ Error │
└───┬───┘  └───┬───┘
    │          │
    ▼          ▼
┌───────┐  ┌───────┐
│Update │  │ Mostrar│
│Cache  │  │ Error  │
└───────┘  └───────┘
```

---

## 8. Control de Acceso

### 8.1 Políticas de Usuario

La aplicación verifica la política `TrasladosJefezona`:

```typescript
const tienePoliticaTrasladosJefezona =
  user?.policies?.includes("TrasladosJefezona") ?? false;
```

**Comportamiento:**

- Si tiene la política: No puede aprobar traslados (solo ver)
- Si no tiene la política: Puede aprobar traslados

### 8.2 Datos Requeridos del Usuario

| Campo          | Descripción                         | Origen   |
| -------------- | ----------------------------------- | -------- |
| `codigo_ultra` | Código del usuario en Ultra Systems | Directus |
| `empresa`      | Nombre de la empresa                | Directus |
| `policies`     | Array de políticas del usuario      | Directus |

---

## 9. Tour Guiado

### 9.1 Implementación

El tour guiado utiliza un contexto propio (`TrasladosTourContext`) y se integra con el componente `TrasladosTour`.

**Puntos del tour:**

1. `contador-pendientes`: Contador de traslados pendientes
2. `lista-traslados`: Lista de traslados
3. `aprobar`: Botón de aprobación

### 9.2 Estructura

```typescript
// TrasladosTourProvider envuelve el contenido
<TrasladosTourProvider>
  <TrasladosTour>
    {/* Contenido del panel */}
  </TrasladosTour>
</TrasladosTourProvider>
```

---

## 10. Estados de la Interfaz

### 10.1 Estados de Carga

| Estado            | Descripción                   | Componente                |
| ----------------- | ----------------------------- | ------------------------- |
| Cargando          | Obteniendo datos del servidor | `SkeletonCard`            |
| Error             | Fallo en la carga             | Card con botón reintentar |
| Sin datos         | No hay traslados pendientes   | Card informativa          |
| Sin coincidencias | Filtro sin resultados         | Card informativa          |
| Datos             | Lista de traslados            | `TrasladoListItem`        |

### 10.2 Estados de Aprobación

| Estado     | Descripción           | UI                    |
| ---------- | --------------------- | --------------------- |
| Procesando | Enviando aprobación   | Modal con spinner     |
| Éxito      | Aprobación completada | Check verde + mensaje |
| Error      | Fallo en aprobación   | Icono error + mensaje |

---

## 11. Rutas

### 11.1 Definición

**Archivo:** [`src/apps/traslados/routes.tsx`](../src/apps/traslados/routes.tsx)

```typescript
const routes: RouteObject[] = [
  {
    path: "/traslados",
    element: <TrasladosPanel />,
  },
];
```

### 11.2 Acceso

URL: `/traslados`

---

## 12. Dependencias

### 12.1 Librerías Externas

| Librería                | Uso                        |
| ----------------------- | -------------------------- |
| `@mui/material`         | Componentes de UI          |
| `@emotion/react`        | Estilos CSS-in-JS          |
| `@tanstack/react-query` | Manejo de datos asíncronos |
| `react-router-dom`      | Navegación                 |

### 12.2 Componentes Compartidos

| Componente      | Ubicación                                  |
| --------------- | ------------------------------------------ |
| `CancelButton`  | `@/shared/components/button/CancelButton`  |
| `ConfirmButton` | `@/shared/components/button/ConfirmButton` |

---

## 13. Manejo de Errores

### 13.1 Errores de API

```typescript
try {
  const resultado = await aprobarTraslados(...);
  // Éxito
} catch (err: any) {
  console.error("❌ Error al aprobar traslados:", err);
  setError(err.message || "Error al aprobar traslados");
}
```

### 13.2 Errores de Validación

| Error                    | Causa                        | Solución             |
| ------------------------ | ---------------------------- | -------------------- |
| "Usuario no autenticado" | Sin sesión                   | Iniciar sesión       |
| "Datos incompletos"      | Falta codigo_ultra o empresa | Contactar sistemas   |
| "Contraseña inválida"    | Clave incorrecta             | Verificar contraseña |

---

## 14. Optimizaciones

### 14.1 Caché de TanStack Query

```typescript
staleTime: 1000 * 60 * 60,      // Datos frescos por 1 hora
gcTime: 1000 * 60 * 60 * 2,     // Garbage collection a las 2 horas
```

### 14.2 Memoización

- `useMemo` para filtrado de traslados
- `useMemo` para lista de bodegas destino únicas

```typescript
const filtrados = useMemo(() => {
  return pendientes.filter((t) => {
    // Lógica de filtrado
  });
}, [pendientes, filtroBodegaDestino, filtroNombre]);
```

---

## 15. Consideraciones de Seguridad

### 15.1 Autenticación

- Los webhooks requieren autenticación Basic Auth
- La aprobación requiere la contraseña del Ultra Systems
- Los datos del usuario se validan antes de mostrar la aplicación

### 15.2 Validaciones

- Contraseña mínimo 4 dígitos numéricos
- Solo caracteres numéricos en campo de contraseña
- Máximo 10 caracteres en contraseña

---

_Documentación actualizada: Enero 2026_
_Versión: 1.0_
