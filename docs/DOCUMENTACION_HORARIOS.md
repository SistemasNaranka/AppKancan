# Documentación Técnica Completa - Aplicación de Registro de Horarios

## 1. Estructura del Proyecto

### 1.1 Organización General del Proyecto

El módulo de **Registro de Horarios** forma parte de la aplicación AppKancan, desarrollada con React y TypeScript. Su propósito es gestionar la **asistencia diaria del personal** de una tienda: el registro de marcaciones de jornada (entrada, almuerzo y salida), la edición de horas con justificación, la gestión de novedades (incapacidades, permisos, vacaciones, etc.) y la consulta del historial de jornadas laborales.

La aplicación reside en el directorio `src/apps/horarios/` y utiliza el mismo stack tecnológico que el resto del proyecto: **Vite** como herramienta de construcción, **Material UI (MUI)** y **Tailwind CSS** para la interfaz, **TanStack Query (React Query)** para el manejo de datos asíncronos con caché, **Yup** para la validación de formularios, **Day.js** para el manejo de fechas y horas, y **Directus CMS** como backend (API REST).

### 1.2 Estructura de Directorios Detallada

```
src/apps/horarios/
├── api/
│   └── directus/
│       ├── create.ts              # Funciones de creación/actualización (novedades, registros)
│       └── read.ts                # Funciones de lectura (empleados, registros, novedades)
│
├── components/                    # Componentes React de la interfaz
│   ├── EmployeeCard.tsx           # Tarjeta de empleado con botones de marcación
│   ├── EditHourModal.tsx          # Modal para editar la hora de un evento
│   ├── ObservationModal.tsx       # Modal de solo lectura para ver observaciones
│   ├── HorariosLayout.tsx         # Layout contenedor (Outlet de rutas)
│   └── NavbarHorarios.tsx         # Barra de navegación superior con pestañas
│
├── hooks/                         # Hooks personalizados
│   ├── useHorarios.ts             # Lógica principal: empleados, marcaciones, novedades
│   └── useHistorial.ts            # Lógica de consulta y agrupación del historial
│
├── interfaces/
│   └── horarios.interface.ts      # Definiciones TypeScript del módulo
│
├── pages/                         # Páginas de la aplicación
│   ├── RegistrosPage.tsx          # Página principal con las pestañas
│   └── HistorialPage.tsx          # Vista de historial de asistencia
│
└── routes.tsx                     # Configuración de rutas del módulo
```

### 1.3 Propósito de Cada Directorio y Archivo

El directorio `api/directus/` centraliza toda la comunicación con Directus. `read.ts` contiene las funciones de lectura (`getEmpleados`, `getTiposNovedad`, `getNovedades`, `getTimeRecords`, `fetchTimeRecords`) y `create.ts` las de escritura (`createNovedad`, `createNovedades`, `createTimeRecord`, `updateTimeRecord`).

El directorio `components/` agrupa los componentes visuales. `EmployeeCard.tsx` es el núcleo de la interacción del usuario, ya que muestra a cada empleado y sus cuatro botones de marcación. `EditHourModal.tsx` y `ObservationModal.tsx` son modales auxiliares para editar horas y consultar observaciones, respectivamente.

El directorio `hooks/` encapsula la lógica de negocio. `useHorarios.ts` orquesta las consultas, el mapeo de datos crudos de Directus a estructuras de la UI y las mutaciones; `useHistorial.ts` consulta y agrupa los registros históricos por empleado y fecha.

El directorio `interfaces/` define las estructuras de datos del módulo. El directorio `pages/` contiene las dos páginas principales, y `routes.tsx` configura la navegación bajo la ruta `horarios`.

---

## 2. Arquitectura y Patrones de Diseño

### 2.1 Arquitectura General del Sistema

La aplicación sigue una arquitectura basada en componentes con flujo unidireccional de datos. El flujo principal es: **API (Directus) → TanStack Query (caché) → Hooks (lógica/mapeo) → Componentes (UI)**.

Un aspecto clave del módulo es que **los datos crudos de Directus se transforman en el hook** antes de llegar a la UI. La tabla `com_time_records` almacena un registro por cada evento de marcación; el hook `useHorarios` agrupa esos registros por empleado y los convierte en un objeto `RegistrosAsistencia` con un campo por cada evento de la jornada.

```
┌─────────────────────────────────────────────────────────────────┐
│                        RegistrosPage                             │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────┐ ┌────────────┐  │
│  │  REGISTROS  │ │  NOVEDADES  │ │ HISTORIAL  │ │   MALLA    │  │
│  │   (Tab 0)   │ │   (Tab 1)   │ │  (Tab 2)   │ │ (Tab 3)    │  │
│  └──────┬──────┘ └──────┬──────┘ └─────┬──────┘ └────────────┘  │
│         │               │              │                         │
│  ┌──────▼──────┐ ┌──────▼──────┐ ┌─────▼────────┐               │
│  │EmployeeCard │ │ Tabla de    │ │HistorialPage │               │
│  │  (x N)      │ │ Novedades   │ │              │               │
│  └─────────────┘ └─────────────┘ └──────────────┘               │
└─────────────────────────────────────────────────────────────────┘
            │                              │
   ┌────────▼─────────┐          ┌─────────▼─────────┐
   │   useHorarios    │          │   useHistorial    │
   └────────┬─────────┘          └─────────┬─────────┘
            │                              │
   ┌────────▼─────────┐          ┌─────────▼─────────┐
   │  TanStack Query  │          │  TanStack Query   │
   └────────┬─────────┘          └─────────┬─────────┘
            │                              │
   ┌────────▼──────────────────────────────▼─────────┐
   │             api/directus (read/create)           │
   └────────────────────────┬─────────────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │     Directus      │
                  │   (Backend CMS)   │
                  └───────────────────┘
```

### 2.2 Patrones de Diseño Implementados

**Patrón de Hooks Personalizados**
La lógica de obtención y mutación de datos se encapsula en hooks que exponen una API limpia a los componentes. `useHorarios` retorna los empleados ya mapeados y las funciones de acción (`registrarEvento`, `agregarNovedad`, etc.), aislando a la UI de los detalles de Directus.

**Patrón de Caché y Sincronización (TanStack Query)**
Cada consulta tiene su propia `queryKey` y tiempos de `staleTime` ajustados según la volatilidad del dato (5 min para empleados, 10 min para tipos de novedad). Las mutaciones invalidan las claves afectadas en `onSuccess`, lo que provoca un *refetch* automático y mantiene la UI sincronizada.

**Máquina de Estados de la Jornada**
El estado de cada empleado (`estadoActual`) se deriva de los registros existentes y determina qué botón de marcación está activo. Es una máquina de estados secuencial:

```
entrada_pendiente → jornada_iniciada → en_almuerzo → regreso_almuerzo → jornada_finalizada
```

**Capa de Mapeo / Adaptador**
Los datos de Directus (`log_type`, `record_time`, etc.) se traducen a las claves internas (`inicioJornada`, `inicioAlmuerzo`, …) mediante funciones de mapeo como `getEventKey`, garantizando que la UI trabaje siempre con un modelo consistente.

---

## 3. Modelo de Datos

### 3.1 Interfaces TypeScript (`horarios.interface.ts`)

```typescript
// Registros de marcación agrupados de un empleado para un día
interface RegistrosAsistencia {
  inicioJornada: string | null;
  inicioAlmuerzo: string | null;
  finAlmuerzo: string | null;
  finJornada: string | null;
  observaciones: Record<string, string>;        // observación por evento
  ids?: Record<string, number>;                 // id del registro en BD por evento
  horasOriginales?: Record<string, string | null>;  // hora original marcada
  horasEditadas?: Record<string, string | null>;    // hora corregida (si fue editada)
}

// Empleado con su estado y registros del día
interface EmpleadoAsistencia {
  id: string;
  documento: string;
  nombre: string;
  cargo?: string;
  estadoActual: string;     // estado de la máquina de jornada
  registros: RegistrosAsistencia;
}

// Fila del historial (agrupado por empleado + fecha)
interface HistorialRow {
  fecha: string;
  empleado: string;
  inicio_turno: string | null;
  inicio_almuerzo: string | null;
  fin_almuerzo: string | null;
  fin_turno: string | null;
  observaciones_evento: ObservacionEvento[];
}

interface ObservacionEvento {
  evento: string;
  hora: string | null;
  observacion: string;
}
```

### 3.2 Colecciones de Directus Utilizadas

| Colección | Uso | Campos relevantes |
| ----------- | ----- | ------------------- |
| `adm_employees` | Listado de empleados | `id`, `first_name`, `last_name`, `store_id`, `position_id.name` |
| `com_time_records` | Marcaciones de jornada | `record_date`, `record_time`, `updated_record_time`, `log_type`, `employee_id`, `store_id`, `observations` |
| `com_newness` | Catálogo de tipos de novedad | `id`, `name` |
| `com_newness_reports` | Novedades registradas | `employee_id`, `newness_id`, `report_date`, `observations`, `store_id` |

> **Nota:** El identificador de tienda está fijado como constante `STORE_ID = 90` en `useHorarios.ts` y como valor por defecto en las funciones de creación de `create.ts`.

### 3.3 Tipos de Evento de Jornada (`log_type`)

El campo `log_type` en `com_time_records` usa estos valores literales, que se mapean a las claves internas de la UI:

| `log_type` (Directus) | Clave interna | Estado que habilita el siguiente |
| ----------------------- | --------------- | ---------------------------------- |
| `Comenzar Jornada` | `inicioJornada` | `jornada_iniciada` |
| `Iniciar Almuerzo` | `inicioAlmuerzo` | `en_almuerzo` |
| `Finalizar Almuerzo` | `finAlmuerzo` | `regreso_almuerzo` |
| `Terminar Jornada` | `finJornada` | `jornada_finalizada` |

---

## 4. Capa de API (`api/directus/`)

### 4.1 Lectura (`read.ts`)

| Función | Descripción |
| --------- | ------------- |
| `getEmpleados(storeId)` | Obtiene los empleados de `adm_employees` y los inicializa con registros vacíos y estado `entrada_pendiente`. |
| `getTiposNovedad()` | Carga el catálogo de tipos de novedad desde `com_newness`. |
| `getNovedades()` | Obtiene las novedades registradas (`com_newness_reports`) ordenadas por id descendente. |
| `getTimeRecords(storeId, date)` | Obtiene las marcaciones de una tienda en una fecha específica (usado en la vista de Registros). |
| `fetchTimeRecords(fechaInicio?, fechaFin?)` | Obtiene marcaciones por rango de fechas (usado en el Historial). Aplica filtros `_gte` / `_lte`. |

Todas las funciones envuelven la petición con `withAutoRefresh()`, que renueva automáticamente el token de Directus si ha expirado. Los errores se capturan y se devuelve un arreglo vacío para no romper la UI.

### 4.2 Escritura (`create.ts`)

| Función | Descripción |
| --------- | ------------- |
| `createNovedad(data)` | Crea una novedad individual en `com_newness_reports`. |
| `createNovedades(items[])` | Crea varias novedades en lote (usado al registrar un rango de días). |
| `createTimeRecord(data)` | Crea una marcación nueva en `com_time_records`. |
| `updateTimeRecord(id, data)` | Actualiza la observación, la hora original o la hora corregida (`updated_record_time`) de una marcación. |

A diferencia de las lecturas, las funciones de escritura **relanzan el error** (`throw`) con un mensaje legible extraído de `error.errors[0].message`, para que la mutación de TanStack Query lo capture y muestre un snackbar.

---

## 5. Lógica de Negocio (Hooks)

### 5.1 `useHorarios`

Es el hook central de la pestaña **Registros**. Realiza cuatro consultas (empleados, tipos de novedad, novedades y marcaciones del día) y expone la lógica completa de gestión.

**Mapeo de registros → estado**
Por cada empleado, filtra sus marcaciones del día y construye su objeto `RegistrosAsistencia`. Para cada evento prioriza la hora corregida sobre la original (`updated_record_time || record_time`) y deriva el `estadoActual` evaluando, en orden inverso, qué eventos ya existen.

**Filtrado de empleados con novedad**
Los empleados que ya tienen una novedad registrada *hoy* (`idsConNovedadHoy`) se excluyen del listado de marcación, ya que no deben fichar ese día.

**Funciones expuestas:**

| Función | Descripción |
| --------- | ------------- |
| `registrarEvento(id, tipo, horaOverride?, obsOverride?)` | Crea o actualiza una marcación. Si ya existe el registro para ese evento y fecha, lo actualiza con `updated_record_time`; si no, lo crea. |
| `guardarObservacion(id, tipo, texto)` | Actualiza la observación de un registro existente. |
| `agregarNovedad(novedad)` | Valida fechas y genera una novedad por cada día del rango `fechaInicio`–`fechaFin` mediante `createNovedades`. |
| `resetHorarios()` | Invalida las consultas para forzar una recarga desde el servidor. |
| `eliminarEmpleado(id)` | Actualmente desactivado (solo registra en consola); la baja real se gestiona vía novedad. |

### 5.2 `useHistorial`

Hook de la pestaña **Historial**. Consulta `fetchTimeRecords` por rango de fechas y, mediante la opción `select` de React Query, transforma los registros con `agruparRegistros`:

- Agrupa las marcaciones por `empleado + fecha`.
- Por cada grupo busca las cuatro marcaciones de la jornada y arma una `HistorialRow`.
- Recopila las observaciones no vacías en `observaciones_evento` para mostrarlas en el `ObservationModal`.

---

## 6. Componentes de la Interfaz

### 6.1 `RegistrosPage`

Página principal del módulo. Renderiza el encabezado con título dinámico y un sistema de **cuatro pestañas**:

| Tab | Contenido |
| ----- | ----------- |
| **0 — Registros** | Grid responsivo de `EmployeeCard` para marcar asistencia. |
| **1 — Novedades** | Tabla de novedades registradas con búsqueda por nombre, filtro por fecha y paginación (5 por página). |
| **2 — Historial** | Embebe el componente `HistorialPage`. |
| **3 — Malla Horaria** | Placeholder (pendiente de implementación). |

Incluye helpers de presentación `getIconForTipo` y `getChipColor` que asignan ícono y color según el tipo de novedad (descanso, incapacidad, vacaciones, etc.).

### 6.2 `EmployeeCard`

Tarjeta individual de cada empleado. Muestra nombre, cargo, estado actual y los **cuatro botones de marcación** secuenciales. Cada fila de botón incluye:

- **Botón de hora** (reloj): abre `EditHourModal` para corregir la hora de un evento ya registrado.
- **Botón principal de marcación**: registra el evento; se deshabilita si no es el paso activo o si la jornada ya terminó. Muestra la hora en formato 12 horas (`formatTo12Hour`).
- **Botón de observación**: abre un modal para agregar/editar la nota del evento (máx. 500 caracteres).

También contiene el **modal de registro de novedad**, validado con Yup (`novedadSchema`): exige tipo de novedad, fechas válidas y que la fecha fin no sea anterior a la de inicio.

### 6.3 `EditHourModal`

Modal para corregir la hora de una marcación ya registrada. Usa un `TimePicker` (formato AM/PM) y **exige un motivo de al menos 7 caracteres** antes de permitir guardar. El botón Guardar permanece deshabilitado mientras no haya cambios en la hora o en la observación. Al confirmar, devuelve la hora en formato `hh:mm A`, que `registrarEvento` reinterpreta como `updated_record_time`.

### 6.4 `ObservationModal`

Modal de **solo lectura** (construido con Tailwind y `motion/react` para las animaciones) que lista todas las observaciones de una fila del historial, mostrando evento, hora y texto. Se abre desde los indicadores azules de la tabla de `HistorialPage`.

### 6.5 `HistorialPage`

Vista de historial con filtros por rango de fechas (Desde/Hasta) y por nombre de empleado (búsqueda normalizada sin acentos). La tabla muestra las marcaciones de cada jornada y calcula el **total de horas trabajadas** (`calcularHoras`), descontando el tiempo de almuerzo. Los eventos con observación se marcan con un punto azul que abre el `ObservationModal`. Incluye paginación configurable (5 / 20 / Todos).

### 6.6 `HorariosLayout` y `NavbarHorarios`

`HorariosLayout` es un contenedor mínimo que renderiza el `<Outlet>` de las rutas hijas. `NavbarHorarios` es una barra de navegación superior con pestañas (REGISTROS, NOVEDADES, HISTORIAL, MALLA HORARIA); actualmente las pestañas distintas de REGISTROS están deshabilitadas, ya que la navegación interna se resuelve dentro de `RegistrosPage`.

---

## 7. Rutas (`routes.tsx`)

```typescript
const rutasHorarios: RouteObject[] = [
  {
    path: 'horarios',
    element: <HorariosLayout />,
    children: [
      { path: 'registros', element: <RegistrosPage /> },
      { index: true, element: <Navigate to="registros" replace /> },
      { path: '*', element: <Navigate to="registros" replace /> },
    ],
  },
];
```

La ruta base `horarios` redirige por defecto a `horarios/registros`. Cualquier subruta no reconocida también redirige a `registros`.

---

## 8. Flujos de Trabajo Principales

### 8.1 Marcación de Jornada

1. El usuario ve la tarjeta del empleado en estado `entrada_pendiente`.
2. Pulsa **Comenzar Jornada** → `registrarEvento` crea un `com_time_records` con `log_type = 'Comenzar Jornada'`.
3. La consulta se invalida, el empleado pasa a `jornada_iniciada` y se habilita **Iniciar Almuerzo**.
4. El proceso continúa secuencialmente hasta `Terminar Jornada`, momento en que la tarjeta muestra "Jornada completada".

### 8.2 Corrección de Hora

1. Sobre un evento ya marcado, el usuario pulsa el botón del reloj.
2. En `EditHourModal` ajusta la hora y escribe el motivo (mín. 7 caracteres).
3. Al guardar, `registrarEvento` detecta que el registro existe y lo actualiza con `updated_record_time` + la observación.

### 8.3 Registro de Novedad

1. En una tarjeta en estado `entrada_pendiente`, el usuario pulsa el ícono de advertencia.
2. Completa el formulario (tipo, rango de fechas, observación), validado con Yup.
3. `agregarNovedad` genera una novedad por cada día del rango y las inserta en lote.
4. El empleado desaparece del listado de marcación de ese día.

### 8.4 Consulta de Historial

1. El usuario abre la pestaña **Historial**.
2. Filtra por rango de fechas y/o nombre.
3. `useHistorial` agrupa los registros por empleado/día y calcula las horas trabajadas.
4. Los puntos azules permiten abrir el `ObservationModal` con el detalle de las observaciones.

---

## 9. Consideraciones y Notas Técnicas

- **`STORE_ID` está fijado a 90** tanto en el hook como en la capa de creación. Para soportar múltiples tiendas debería parametrizarse.
- **Hora original vs. hora corregida:** la UI siempre prioriza `updated_record_time` sobre `record_time`, preservando un rastro de auditoría de la hora marcada originalmente.
- **Resiliencia:** las lecturas devuelven arreglos vacíos ante error; las escrituras propagan el error para notificar al usuario vía snackbar global (`useGlobalSnackbar`).
- **Internacionalización de fechas:** se usa `dayjs` con locale `es` para formatear fechas y horas en español.
- **Pendientes:** la pestaña **Malla Horaria** es un placeholder, y `eliminarEmpleado` está deshabilitado intencionalmente.

---

*Documento generado como referencia técnica del módulo `src/apps/horarios`.*
