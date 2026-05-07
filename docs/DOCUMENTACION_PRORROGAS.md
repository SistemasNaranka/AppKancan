# Documentación Técnica Completa - Aplicación de Prórrogas y Contratos

## 1. Estructura del Proyecto

### 1.1 Organización General

La aplicación de Prórrogas reside en `src/apps/prorrogas/` y gestiona el ciclo de vida de los contratos laborales y sus prórrogas dentro del ecosistema AppKancan. Permite registrar contratos, extenderlos mediante prórrogas con duración calculada automáticamente, cambiar el cargo de un empleado conservando trazabilidad, y consultar dashboards con el estado actual de la nómina contratada.

La aplicación está construida sobre **React + TypeScript** con **Vite** como bundler, **Material UI (MUI)** para la capa visual, y **Directus** como backend (acceso vía `@directus/sdk` con WebSocket para sincronización en tiempo real). El estado global se maneja con `useReducer + Context API` propio del módulo, sin recurrir a TanStack Query para esta vertical.

### 1.2 Estructura de Directorios

```
src/apps/prorrogas/
├── api/                          # Capa de comunicación con Directus
│   ├── create.ts                 # Mutaciones (crear/actualizar/eliminar)
│   ├── read.ts                   # Lecturas y agregados
│   ├── write.ts                  # Re-export legacy
│   └── index.ts                  # Barrel export
│
├── components/                   # Componentes React de la UI
│   ├── CambiarCargoModal.tsx     # Modal para promover/cambiar cargo
│   ├── ContractDetail.tsx        # Vista de detalle del contrato
│   ├── ContractSelectorModal.tsx # Modal para elegir contrato a prorrogar
│   ├── ContractTable.tsx         # Tabla principal (Resumen / Contratos)
│   ├── ContractTimeline.tsx      # Línea de tiempo de prórrogas
│   ├── ContractsView.tsx         # Vista alternativa de listado
│   ├── ContratoForm.tsx          # Formulario crear/editar contrato
│   ├── DashboardView.tsx         # Vista de KPIs y gráficos
│   ├── EmployeeGrid.tsx          # Grilla de empleados
│   ├── EmployeesView.tsx         # Vista contenedora de empleados
│   ├── KPICard.tsx               # Tarjeta de indicador
│   ├── NotificationBell.tsx      # Campana de alertas (≤60 días)
│   ├── ProrrogaForm.tsx          # Formulario para crear prórroga
│   ├── ReportsModal.tsx          # Modal de reportes y análisis
│   ├── StatCards.tsx             # Tarjetas de estadísticas en Resumen
│   ├── StatusChip.tsx            # Chip de estado (vigente/proximo/vencido)
│   ├── TabsNav.tsx               # Navegación por pestañas
│   └── TopBar.tsx                # Barra superior con búsqueda + campana
│
├── config/
│   └── cargos.ts                 # Mapeo cargos legacy → nombres + áreas
│
├── contexts/
│   └── ContractContext.tsx       # Provider global del módulo (reducer + WS)
│
├── hooks/
│   └── useContracts.ts           # Hook principal: enriquecimiento + filtros
│
├── lib/
│   ├── mockData.ts               # Datos de prueba locales
│   ├── theme.ts                  # Tema MUI específico del módulo
│   └── utils.ts                  # Helpers de fecha / reglas de negocio
│
├── pages/
│   └── Home.tsx                  # Página raíz, inyecta providers
│
├── types/
│   └── types.ts                  # Interfaces, tipos y constantes
│
└── routes.tsx                    # Definición de la ruta /prorrogas
```

### 1.3 Propósito de Cada Directorio

El directorio **`api/`** centraliza toda la comunicación con Directus. `read.ts` expone funciones de consulta (`getContratos`, `getContratoById`, `getContratoStats`, `getProrrogasByContrato`, `getHistorialCargos`) que aplican normalización del campo `cargo` (Directus lo devuelve como objeto `{id, nombre}` cuando se expande la relación). `create.ts` agrupa todas las mutaciones: creación/actualización/eliminación de contratos, prórrogas, documentos e historial de cargos. La función `crearProrroga` aplica la regla de negocio de duración automáticamente, y `actualizarProrroga` mantiene sincronizada la `fecha_final` del contrato padre.

El directorio **`components/`** contiene los componentes visuales. La jerarquía es plana — todos los componentes se cuelgan directamente de aquí — con responsabilidades bien delimitadas: tabla principal, formularios, vistas de detalle, modales, y componentes de presentación (chips, KPIs).

El directorio **`contexts/`** aloja un Context Provider que mantiene el estado del módulo mediante `useReducer`. Este provider se conecta vía WebSocket a Directus para sincronizar cambios en tiempo real en las colecciones `contratos` y `historial_cargos`.

El directorio **`hooks/`** contiene `useContracts`, hook compuesto que enriquece los contratos crudos del contexto con campos derivados (`daysLeft`, `contractStatus`, `lastProrroga`) y aplica filtros, ordenamientos y agregados.

El directorio **`lib/utils.ts`** concentra las reglas de negocio puras (sin acceso a estado): cálculo de días restantes, suma de meses con la regla "menos un día", duración de prórroga según número, formateo de fechas y cargos.

El directorio **`config/cargos.ts`** mantiene compatibilidad hacia atrás: los contratos antiguos guardaban el cargo como entero (1-6); este módulo mapea esos IDs a sus nombres legibles. También define el catálogo de cargos canónicos con su área asociada.

---

## 2. Arquitectura y Patrones de Diseño

### 2.1 Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                            Home.tsx                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ThemeProvider → ContractProvider → Inner                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│   ┌──────────────────────────┼─────────────────────────────┐    │
│   │     TopBar       │   TabsNav    │   <main>             │    │
│   │  (búsqueda +     │  (Resumen /  │   StatCards          │    │
│   │   campana)       │   Contratos /│   ContractTable      │    │
│   │                  │   Empleados) │   ContractDetail     │    │
│   └──────────────────┴──────────────┴──────────────────────┘    │
│                                                                  │
│   FAB nuevo contrato + Modales (ProrrogaForm, ContratoForm,     │
│   ContractSelectorModal, CambiarCargoModal)                     │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Context (state + actions)
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                      ContractContext                             │
│   ┌─────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│   │   Reducer        │  │ WebSocket sub  │  │  API calls     │   │
│   │ (state)          │←→│ (Directus RT)  │  │  (read/write)  │   │
│   └─────────────────┘  └────────────────┘  └────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                       Directus (REST + WS)
            colecciones: contratos · prorrogas ·
            historial_cargos · documentos · util_cargo
```

### 2.2 Patrones Aplicados

**Provider + Reducer.** Todo el estado del módulo vive en `ContractContext`, manejado por un reducer puro. Las acciones disparan dispatches tipados (`SET_CONTRATOS`, `ADD_PRORROGA`, `UPSERT_CONTRATO`, etc.). Los componentes nunca mutan estado directamente: invocan funciones expuestas por el contexto (`addProrroga`, `updateContrato`, etc.) que internamente hacen la llamada a la API y luego despachan.

**Datos enriquecidos derivados.** El hook `useContracts` no almacena estado adicional; es un selector puro que toma `contratos` del contexto y produce `EnrichedContrato[]` con campos calculados (`daysLeft`, `contractStatus`, `fechaVencimiento`, `lastProrroga`). Esto evita duplicación de estado y garantiza coherencia.

**Sincronización en tiempo real (WebSocket).** El provider abre una suscripción Directus a `contratos` e `historial_cargos`. Cuando llega un evento `create/update/delete`, refresca solo el contrato afectado vía `getContratoById` y despacha `UPSERT_CONTRATO` o `REMOVE_CONTRATO`. No se recarga toda la lista para minimizar trafico de red y parpadeos.

**Gates por autenticación.** El provider espera a que `useAuth().loading` sea false antes de disparar queries iniciales o abrir el WebSocket. Esto evita llamadas sin token válido (que retornarían 403).

**Reglas de negocio puras en `lib/utils.ts`.** La duración de una prórroga, el cálculo de fecha fin (con la resta de un día), y el estado visual (vigente/próximo/vencido) son funciones puras testables sin acoplamiento al framework.

### 2.3 Flujo Unidireccional de Datos

```
   Usuario actúa (click / submit)
          │
          ▼
   Componente llama acción del contexto (ej. addProrroga)
          │
          ▼
   Contexto hace llamada API (api/create.ts)
          │
          ▼
   Directus persiste y emite evento por WS
          │
          ├──► Respuesta directa → dispatch ADD_PRORROGA
          │
          └──► Evento WebSocket → getContratoById → dispatch UPSERT_CONTRATO
          │
          ▼
   Reducer actualiza state.contratos
          │
          ▼
   useContracts re-deriva enriched, filteredContratos, counts
          │
          ▼
   Componentes re-renderizan con datos frescos
```

---

## 3. Modelo de Datos

### 3.1 Colecciones Directus

| Colección          | Propósito                                                    |
| ------------------ | ------------------------------------------------------------ |
| `contratos`        | Contrato laboral del empleado                                |
| `prorrogas`        | Extensiones del contrato (relación 1:N a contratos)          |
| `historial_cargos` | Trazabilidad de cambios de cargo (relación N:1 a contratos)  |
| `documentos`       | Archivos asociados al contrato                               |
| `util_cargo`       | Catálogo de cargos (FK desde `contratos.cargo`)              |

### 3.2 Tipos Principales (`types/types.ts`)

```ts
// Estado visual derivado de los días restantes
type ContractStatus = 'vigente' | 'proximo' | 'vencido';

// Estado del flujo de aprobación de la solicitud
type RequestStatus =
  | 'pendiente' | 'en_revision' | 'aprobada'
  | 'rechazada' | 'completada';

interface Contrato {
  id: number;
  numero_contrato?: string;
  nombre: string;
  apellido: string;
  documento: string;
  cargo: string | number;        // Normalizado a string en UI
  area?: string;
  empresa?: string;
  tipo_contrato?: string;
  request_status: RequestStatus;
  fecha_ingreso: string;         // YYYY-MM-DD
  fecha_final: string;           // YYYY-MM-DD
  prorrogas?: Prorroga[];
  documentos?: Documento[];
  date_created?: string;
  date_updated?: string;
}

interface Prorroga {
  id: number;
  contrato: number;              // FK
  numero: number;                // 0 = inicial, 1, 2, 3, ...
  label: string;                 // "Contrato Inicial" | "Prórroga N"
  descripcion: string;
  fecha_ingreso: Date | string;
  fecha_final: Date | string;
  duracion: number;              // meses
}

interface HistorialCargo {
  id: number;
  contrato_id: number;
  cargo_anterior: string | number;
  cargo_nuevo: string | number;
  fecha_efectividad: string;
}
```

### 3.3 Tipo Enriquecido

El hook `useContracts` produce este tipo derivado para todas las vistas:

```ts
interface EnrichedContrato extends Contrato {
  lastProrroga: Prorroga | null;     // Última prórroga por número
  fechaVencimiento: string | null;   // Fuente única de verdad para vencimiento
  daysLeft: number;                  // Días hasta hoy (negativo si venció)
  contractStatus: ContractStatus;    // Calculado a partir de daysLeft
}
```

---

## 4. Reglas de Negocio

### 4.1 Duración de Prórroga (`getProrrogaDuration`)

```
Prórroga 0 a 3  →  4 meses
Prórroga 4 o más → 12 meses
```

La numeración refleja la realidad legal colombiana: las primeras prórrogas son cortas (4 meses cada una), pero a partir de la cuarta el contrato pasa a renovación anual obligatoria.

### 4.2 Cálculo de Fecha Final (`addMonths` + `computeEndDate`)

Si una prórroga inicia el `02/02/2026` y dura `4 meses`, el cálculo nominal sería `02/06/2026`. La regla de negocio resta un día: la fecha final real es `01/06/2026`. Esta regla aplica a TODAS las prórrogas sin excepción.

```ts
addMonths(dateStr, months) = parseISO(dateStr) + months meses - 1 día
```

### 4.3 Estado Visual del Contrato (`computeContractStatus` / `getContractStatus`)

| Días restantes (`daysLeft`) | Estado     | Color UI    |
| --------------------------- | ---------- | ----------- |
| `< 0`                       | `vencido`  | Gris        |
| `0` a `7`                   | `proximo` (Crítico) | Rojo |
| `8` a `30`                  | `proximo` (Por vencer) | Ámbar |
| `> 30`                      | `vigente`  | Verde       |

> **Nota:** El umbral exacto entre "proximo" y "vigente" varía ligeramente entre `useContracts` (30 días) y `getContractStatus` en `lib/utils.ts` (50 días). El primero se usa para tabla y dashboard; el segundo para cómputos auxiliares.

### 4.4 Campana de Notificaciones

`NotificationBell` muestra todos los contratos con `0 ≤ daysLeft ≤ 60`, ordenados por proximidad de vencimiento. Sub-umbral urgente (rojo) ≤ 15 días.

### 4.5 Cambio de Cargo (transaccional)

`crearHistorialCargo` ejecuta tres operaciones encadenadas:

1. Crea registro en `historial_cargos` (cargo anterior + nuevo + fecha efectividad).
2. Resuelve el nombre del cargo nuevo a su FK en `util_cargo`.
3. Actualiza `contratos.cargo` (y opcionalmente `area`) con la nueva FK.

Si los pasos 2 o 3 fallan, se ejecuta **rollback** del registro de historial creado en el paso 1, dejando inconsistencia solo si el rollback también falla (caso registrado en consola).

### 4.6 Numeración de Prórrogas

`getNextProrrogaNumber(prorrogas)` retorna `Math.max(...numero) + 1`, o `0` si la lista está vacía. La prórroga 0 representa el contrato inicial cuando se modela como entrada de la línea de tiempo.

---

## 5. Capa de Datos (Context + Hook)

### 5.1 ContractContext

Estado interno (`State`):

```ts
interface State {
  contratos: Contrato[];
  stats: ContratoStats | null;
  selectedId: number | null;
  filters: UIFilters;       // { search, tab, sortBy, contractStatus? }
  loading: boolean;
  saving: boolean;
  error: string | null;
  successMsg: string | null;
}
```

**Acciones expuestas:**

| Acción              | Efecto                                                              |
| ------------------- | ------------------------------------------------------------------- |
| `loadContratos()`   | Carga inicial de contratos + stats                                  |
| `select(id)`        | Selecciona un contrato para mostrar detalle                         |
| `setTab(tab)`       | Cambia pestaña (resumen/contratos/empleados/...)                    |
| `setFilter(parc)`   | Actualiza filtros parcialmente (search, sortBy, contractStatus)     |
| `addContrato`       | Crea contrato vía API y despacha                                    |
| `updateContrato`    | Actualiza + recarga                                                 |
| `deleteContrato`    | Elimina + remueve del estado                                        |
| `addProrroga`       | Calcula `numero`, crea prórroga (la API resuelve duración y fechas) |
| `updateProrroga`    | Recalcula fechas si cambia `fecha_ingreso` y sincroniza contrato    |
| `deleteProrroga`    | Elimina + recarga                                                   |
| `clearMessages`     | Limpia error y successMsg                                           |

**Suscripción WebSocket.** Al iniciar (post-auth), el provider abre `directus.subscribe('contratos')` y `directus.subscribe('historial_cargos')`. Cada mensaje con `type: 'subscription'` y `event` en `[create, update, delete]` provoca refresh del contrato afectado o eliminación local.

### 5.2 useContracts

Selector compuesto que envuelve el contexto y agrega:

| Salida              | Descripción                                                         |
| ------------------- | ------------------------------------------------------------------- |
| `allEnriched`       | Todos los contratos con campos derivados                            |
| `filteredContratos` | `allEnriched` filtrado por tab + búsqueda y ordenado por `sortBy`   |
| `recentContratos`   | Top 10 más recientes (por id descendente)                           |
| `alertContratos`    | Contratos con `daysLeft ≤ 7`, ordenados ascendente                  |
| `dashboardStats`    | `{ total, activos, por_vencer, criticos, vencidos, nuevos_este_mes }` |
| `counts`            | Conteos por `contractStatus` + `request_status`                     |

**Filtros de tab:**

```ts
'activos'    → c.contractStatus === 'vigente'
'vencidos'   → c.contractStatus === 'vencido'
'por_vencer' → 0 ≤ daysLeft ≤ 30
'criticos'   → 0 ≤ daysLeft ≤ 7
```

**Orden (`sortBy`):**

```ts
'vencimiento' → asc por daysLeft (más urgentes primero)
'nombre'      → localeCompare por nombre+apellido
'prorroga'    → desc por número de prórrogas
```

---

## 6. Componentes Principales

### 6.1 Home.tsx

Página raíz. Inyecta `ThemeProvider`, `CssBaseline` y `ContractProvider`. Renderiza `<Inner>` que orquesta:

- `<TopBar />` — búsqueda global + campana de notificaciones.
- `<TabsNav />` — pestañas Resumen / Contratos / Empleados con badges.
- `<main>` — renderiza condicionalmente:
  - Si hay `selectedContrato` → `<ContractDetail />`.
  - Si tab es `empleados` → `<EmployeeGrid />`.
  - Si tab es `resumen` → `<StatCards />` + `<ContractTable />`.
  - Otros tabs → `<ContractTable />`.
- FAB flotante para crear contrato nuevo.
- Modales bajo demanda: `ProrrogaForm`, `ContratoForm`, `ContractSelectorModal`.

### 6.2 ContractTable

Tabla de contratos con paginación local (6 ítems por página). Columnas: Contrato (avatar + nombre + cargo), Área, Vencimiento, Estado, Acciones (Ver / Prórroga). En tab "Resumen" muestra contratos recientes por defecto, o resultados de búsqueda si `filters.search` no está vacío. La columna "Vencimiento" es clickable y cicla entre orden ninguno → ascendente → descendente. En la vista de Resumen renderiza también una sidebar (`ResumenSidebar`) con accesos rápidos y distribución de estados.

### 6.3 ContractDetail

Vista de detalle al seleccionar un contrato. Muestra datos del empleado, contrato y prórrogas asociadas en formato timeline. Permite editar contrato, agregar prórroga, cambiar cargo (modal), eliminar prórroga, descargar reporte.

### 6.4 ProrrogaForm

Formulario para crear una prórroga. Calcula automáticamente `numero` (siguiente disponible), `duracion` (4 o 12 meses según número) y `fecha_final` (preview). El usuario solo ingresa `fecha_inicio` y opcionalmente `descripcion`.

### 6.5 ContratoForm

Formulario unificado para crear o editar contrato. Recibe `initialData` opcional para modo edición. Valida campos obligatorios (nombre, documento, cargo, fechas) y resuelve `cargo` por nombre a FK al guardar.

### 6.6 NotificationBell

Campana en `TopBar`. Filtra `allEnriched` por `0 ≤ daysLeft ≤ 60`, ordena por proximidad. Cada ítem es clickable y selecciona el contrato (cierra el popover y navega al detalle). Estilo urgente para `daysLeft ≤ 15`.

### 6.7 StatCards

Tarjetas de KPIs en la vista Resumen: Activos, Por vencer, Críticos, Vencidos. Click en una tarjeta navega a la pestaña correspondiente con filtro aplicado.

### 6.8 CambiarCargoModal

Modal para cambiar el cargo de un empleado. Internamente llama a `crearHistorialCargo`, que aplica el flujo transaccional descrito en §4.5.

---

## 7. Capa API (`api/`)

### 7.1 Lecturas (`read.ts`)

Todas las funciones envuelven la llamada con `withAutoRefresh` para reintentar tras refresh de token expirado. El campo `cargo` se normaliza siempre a string (Directus puede devolverlo como objeto expandido o número legacy).

| Función                        | Endpoint Directus           | Notas                                |
| ------------------------------ | --------------------------- | ------------------------------------ |
| `getContratos(filters, pag)`   | `contratos` + `aggregate`   | Devuelve `PaginatedResponse`         |
| `getContratoById(id)`          | `contratos` con filter      | Para upsert tras evento WS           |
| `getContratoStats(filters)`    | `aggregate(contratos)`      | Solo retorna `total` por ahora       |
| `getProrrogasByContrato(id)`   | `prorrogas` filtrado        | Ordenado por `numero` ascendente     |
| `getHistorialCargos(id)`       | `historial_cargos` filtrado | Ordenado por `date_created` desc     |

**Campos expandidos por defecto:**

```ts
['*', 'cargo.id', 'cargo.nombre', 'tipo_contrato',
 'fecha_final', 'prorrogas.*', 'documentos.*']
```

### 7.2 Mutaciones (`create.ts`)

| Función                    | Lógica adicional                                                     |
| -------------------------- | -------------------------------------------------------------------- |
| `crearContrato(data)`      | Resuelve `cargo` (string nombre → FK), aplica `request_status: 'pendiente'` por defecto |
| `actualizarContrato(id,d)` | Resuelve `cargo` si viene como string                                |
| `eliminarContrato(id)`     | Hard delete                                                          |
| `cambiarRequestStatus`     | Wrapper de `actualizarContrato`                                      |
| `crearProrroga(d)`         | Aplica regla de duración + `addMonths - 1 día`                       |
| `actualizarProrroga(id,d)` | Recalcula fechas si cambia `fecha_ingreso`, sincroniza contrato      |
| `eliminarProrroga(id)`     | Hard delete                                                          |
| `crearDocumento(d)`        | Default `firmado: false`, fecha hoy                                  |
| `eliminarDocumento(id)`    | Hard delete                                                          |
| `crearHistorialCargo(d)`   | Transaccional con rollback (ver §4.5)                                |

---

## 8. Estados y Flujos de UI

### 8.1 Pestañas (`TabsNav`)

```
Resumen     → StatCards + ContractTable (recientes / búsqueda)
Contratos   → ContractTable (todos)
Empleados   → EmployeeGrid
```

Cuando se selecciona un contrato (`selectedContrato`), todas las pestañas pasan a mostrar `<ContractDetail>`. Al cerrar el detalle (`select(null)`) vuelve la vista anterior.

### 8.2 Filtros adicionales

Los tabs `activos`, `vencidos`, `por_vencer`, `criticos` aplican un filtro adicional sobre el listado, accesibles desde las tarjetas de `StatCards` o el botón "Ver todos".

### 8.3 Búsqueda Global

`TopBar` actualiza `filters.search`. El hook `useContracts` la aplica sobre múltiples campos: `nombre`, `apellido`, `cargo`, `area`, `empresa`, `documento`, `tipo_contrato`, `numero_contrato`. Case-insensitive, sin acentos no normalizados.

### 8.4 Indicadores Visuales

- **Borde lateral rojo/ámbar** en filas con `daysLeft ≤ 7` o `≤ 30` respectivamente.
- **Chip de estado** con punto de color (verde/ámbar/rojo/gris).
- **Avatar coloreado** por hash del id (paleta de 5 colores).
- **Campana con badge numérico** si hay alertas en los próximos 60 días.

---

## 9. Compatibilidad y Migración

### 9.1 Cargos Legacy

Antes de la migración a `util_cargo`, los contratos guardaban el cargo como entero 1-6. `config/cargos.ts` mantiene el mapa `LEGACY_ID_MAP` y la función `getCargoLabel(cargo)` que resuelve cualquier representación (número, string, objeto Directus expandido) al nombre legible.

### 9.2 Catálogo Canónico

```ts
ROLES_AREAS = [
  { nombre: 'Gerente',         area: 'Administrativa' },
  { nombre: 'Asesor',          area: 'Comercial'      },
  { nombre: 'Cajero',          area: 'Comercial'      },
  { nombre: 'Logistico',       area: 'Logística'      },
  { nombre: 'Coadministrador', area: 'Administrativa' },
  { nombre: 'Gerente Online',  area: 'Sistemas'       },
];
```

Al crear/editar un contrato, si se cambia el cargo, el área asociada puede actualizarse mediante el modal `CambiarCargoModal` (consulta este catálogo).

---

## 10. Rendimiento y Optimizaciones

### 10.1 Memoización

Todos los selectores derivados en `useContracts` usan `useMemo` con dependencias específicas. `enriched` solo recalcula cuando cambia `contratos`. `filteredContratos` recalcula cuando cambia `enriched` o `filters`.

### 10.2 WebSocket en lugar de polling

El módulo nunca hace polling. Toda la sincronización post-mutación local llega vía WS, lo que reduce la carga sobre Directus y mantiene la UI siempre fresca aun cuando otro usuario modifica datos en otra sesión.

### 10.3 Refresh selectivo

Cuando llega un evento WS, solo se refresca el contrato afectado (`getContratoById`), no toda la lista. El reducer hace upsert preservando relaciones ya cargadas (`prorrogas`, `documentos`) si el payload no las trae.

### 10.4 Paginación Local

`ContractTable` pagina en cliente (6 por página). Aceptable porque el módulo carga el universo de contratos al inicio (volumen esperado < 1000). Si se escala a más, conviene migrar a paginación server-side reusando `getContratos(filters, pagination)` que ya soporta `offset/limit`.

---

## 11. Configuración y Despliegue

La aplicación se monta en la ruta `/prorrogas` mediante `routes.tsx` y se integra al router global desde `src/router/AppRoutes`. No requiere variables de entorno propias; consume las mismas credenciales Directus del módulo de auth (`src/auth/services/directusInterceptor.ts`).

**Permisos requeridos en Directus:**

- Lectura/escritura sobre `contratos`, `prorrogas`, `historial_cargos`, `documentos`.
- Lectura sobre `util_cargo`.
- Permiso de suscripción WebSocket sobre `contratos` y `historial_cargos` (este último opcional — si falta, el módulo registra warning pero no rompe).

---

## 12. Errores y Casos Borde Manejados

| Caso                                          | Manejo                                                       |
| --------------------------------------------- | ------------------------------------------------------------ |
| Token expirado                                | `withAutoRefresh` reintenta tras refresh                     |
| 403 al cargar contratos                       | Error log diferenciado, retorna lista vacía                  |
| `cargo` inexistente en `util_cargo`           | Excepción explícita "util_cargo no encontrado"               |
| `fecha_final` inválida en formato             | `safeFormatDate` retorna `—`                                 |
| Contrato sin `fecha_final`                    | `daysLeft = Infinity`, estado fallback `vigente`             |
| Prórroga sin `fecha_final`                    | Display fallback al `fecha_final` del contrato               |
| Suscripción WS rechazada                      | `historial_cargos` opcional; `contratos` registra error      |
| Rollback de historial fallido                 | Console error, posible inconsistencia documentada            |
| AuthProvider aún cargando                     | Provider espera (`authLoading`) antes de queries iniciales   |
| LocalStorage bloqueado (modo privado)         | Try/catch silencioso en persistencia de fecha                |

---

## 13. Próximas Mejoras Sugeridas

- **Paginación server-side** en `ContractTable` cuando el universo crezca > 1k contratos.
- **Reportes exportables** (PDF/Excel) desde `ReportsModal`.
- **Notificaciones push** (no solo campana en UI) para vencimientos críticos.
- **Soft delete** en `contratos` y `prorrogas` con flag `archived`.
- **Historial completo** de modificaciones (no solo cambios de cargo).
- **Tests unitarios** sobre `lib/utils.ts` (reglas de negocio puras, fácilmente testables).
- **Unificar umbrales** entre `useContracts.computeContractStatus` (30 días) y `lib/utils.getContractStatus` (50 días).

---

**Última actualización:** 2026-05-05
**Autor:** Equipo de Desarrollo AppKancan
