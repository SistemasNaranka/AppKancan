# Documentación Técnica Completa - Aplicación de Reservas de Salas

## 1. Estructura del Proyecto

### 1.1 Organización General del Proyecto

El proyecto AppKancan es una aplicación web desarrollada con React y TypeScript que incluye un módulo completo para la gestión de reservas de salas de reuniones. La aplicación de reservas reside en el directorio `src/apps/reservas/` y permite a los usuarios crear, visualizar, editar y cancelar reservas de salas de forma intuitiva.

La aplicación utiliza Vite como herramienta de construcción, Material UI (MUI) para la interfaz de usuario, TanStack Query para el manejo de datos asíncronos con caché inteligente, y React Hook Form con Yup para la validación de formularios. El backend está implementado con Directus CMS, proporcionando una API REST para todas las operaciones CRUD.

### 1.2 Estructura de Directorios Detallada

```
src/apps/reservas/
├── components/                    # Componentes React reutilizables
│   ├── DialogEditarReserva.tsx   # Modal para editar reservas existentes
│   ├── DialogNuevaReserva.tsx    # Modal para crear nuevas reservas
│   ├── EstadoSalas.tsx           # Estado actual de las salas (disponible/ocupada)
│   ├── FiltrosReservas.tsx       # Filtros para buscar reservas
│   ├── FloatingHelpButton.tsx    # Botón flotante de ayuda/tutorial
│   ├── index.ts                  # Re-exportaciones de componentes
│   ├── MisReservasCards.tsx      # Tarjetas de reservas del usuario
│   ├── ProximasReuniones.tsx     # Lista de próximas reuniones
│   ├── PulsatingMeetingIndicator.tsx # Indicador pulsante para reuniones en curso
│   ├── ReservasHeader.tsx        # Encabezado de la aplicación
│   ├── ReservasTour.tsx          # Tour guiado con React Joyride
│   ├── TablaReservas.tsx         # Tabla de reservas
│   ├── TourContext.tsx           # Contexto del sistema de tour
│   ├── VistaCalendario.tsx       # Vista de calendario mensual
│   └── VistaSemanal.tsx          # Vista de calendario semanal
│
├── pages/                        # Páginas de la aplicación
│   ├── home.tsx                  # Página de inicio (wrapper)
│   └── ReservasPage.tsx          # Página principal de reservas
│
├── services/                     # Capa de comunicación con API
│   └── reservas.ts               # Funciones CRUD para reservas
│
├── types/                        # Definiciones TypeScript
│   └── reservas.types.ts         # Tipos, interfaces y constantes
│
├── utils/                        # Utilidades
│   └── reservas.utils.ts         # Funciones auxiliares
│
├── views/                        # Vistas principales
│   └── ReservasView.tsx          # Vista principal con tabs
│
└── routes.tsx                    # Configuración de rutas
```

### 1.3 Propósito de Cada Directorio y Archivo

El directorio `components/` contiene todos los componentes visuales de la interfaz. Cada componente tiene una responsabilidad específica: `DialogNuevaReserva.tsx` maneja el formulario de creación, `VistaSemanal.tsx` y `VistaCalendario.tsx` muestran las reservas en diferentes formatos temporales, y `MisReservasCards.tsx` presenta las reservas del usuario en formato de tarjetas.

El directorio `services/` centraliza toda la comunicación con Directus. El archivo `reservas.ts` contiene funciones para obtener, crear, actualizar y cancelar reservas, así como verificar conflictos de horario y obtener configuraciones dinámicas desde la base de datos.

El directorio `types/` define la estructura de datos mediante TypeScript, incluyendo las interfaces `Reserva`, `NuevaReserva`, `ActualizarReserva` y `FiltrosReserva`, además de constantes como `SALAS_DISPONIBLES` y `COLORES_ESTADO`.

El directorio `views/` contiene la vista principal `ReservasView.tsx` que orquesta todos los componentes y maneja la navegación entre pestañas (Reserva, Mis Reservas, Calendario).

---

## 2. Arquitectura y Patrones de Diseño

### 2.1 Arquitectura General del Sistema

La aplicación sigue una arquitectura basada en componentes con flujo unidireccional de datos. El flujo principal es: **API (Directus) → TanStack Query (caché) → Componentes (UI)**. Esta arquitectura garantiza que los datos fluyan de forma predecible y permite una gestión eficiente del estado.

```
┌─────────────────────────────────────────────────────────────────┐
│                         ReservasView                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Reserva   │  │ Mis Reservas│  │      Calendario         │  │
│  │    (Tab)    │  │    (Tab)    │  │        (Tab)            │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                     │                 │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────────▼──────────┐     │
│  │ EstadoSalas │  │MisReservas  │  │ VistaSemanal /      │     │
│  │ Proximas    │  │   Cards     │  │ VistaCalendario     │     │
│  │ Reuniones   │  │             │  │                     │     │
│  └─────────────┘  └─────────────┘  └─────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   TanStack Query  │
                    │   (React Query)   │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  services/reservas│
                    │      (API)        │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │     Directus      │
                    │   (Backend CMS)   │
                    └───────────────────┘
```

### 2.2 Patrones de Diseño Implementados

**Patrón Provider (Context API)**
El `TourProvider` envuelve la aplicación para proporcionar estado del tour guiado a todos los componentes. Esto evita prop drilling y permite que componentes como `DialogNuevaReserva` y `MisReservasCards` accedan al estado del tour.

```typescript
// Uso del patrón Provider
const ReservasView: React.FC = () => {
  return (
    <TourProvider>
      <ReservasViewContent />
    </TourProvider>
  );
};
```

**Patrón de Hooks Personalizados**
Se utilizan hooks de TanStack Query para encapsular la lógica de obtención de datos:

```typescript
// Obtener todas las reservas con caché y refetch automático
const { data: todasReservas = [], isLoading } = useQuery({
  queryKey: ["reservas", "todas"],
  queryFn: () => getReservas({}),
  refetchInterval: 30000, // Actualizar cada 30 segundos
});
```

**Patrón de Composición de Componentes**
Los componentes grandes se construyen componiendo componentes más pequeños. `ReservasView` compone `EstadoSalas`, `ProximasReuniones`, `VistaSemanal`, `VistaCalendario` y `MisReservasCards`.

**Patrón de Estado Calculado**
El estado de las reservas (`estadoCalculado`) se calcula dinámicamente basándose en la fecha/hora actual, sin modificar la base de datos:

```typescript
export const calcularEstadoReserva = (reserva: Reserva): EstadoReserva => {
  const ahora = new Date();
  const fechaInicio = new Date(`${reserva.fecha}T${reserva.hora_inicio}`);
  const fechaFin = new Date(`${reserva.fecha}T${reserva.hora_final}`);

  if (ahora >= fechaFin) return "Finalizado";
  if (ahora >= fechaInicio && ahora < fechaFin) return "En curso";
  return "Vigente";
};
```

### 2.3 Flujo de Datos

```
1. Usuario abre la aplicación
        ↓
2. TanStack Query ejecuta getReservas()
        ↓
3. Directus SDK hace request a la API
        ↓
4. API retorna datos de tabla "reuniones_reservas"
        ↓
5. procesarReservas() calcula estados dinámicos
        ↓
6. Datos se almacenan en caché de TanStack Query
        ↓
7. Componentes React renderizan con los datos
        ↓
8. Cada 30 segundos, TanStack Query revalida
```

---

## 3. Tipos y Definiciones

### 3.1 Interfaces Principales

```typescript
/**
 * Estructura de una reserva tal cual viene de Directus
 */
export interface Reserva {
  id: number;
  date_created: string;
  usuario_id: UsuarioReserva | null;
  nombre_sala: string;
  fecha: string;              // Formato: "YYYY-MM-DD"
  hora_inicio: string;        // Formato: "HH:mm" o "HH:mm:ss"
  hora_final: string;         // Formato: "HH:mm" o "HH:mm:ss"
  estado: EstadoReserva;      // Estado guardado en BD
  titulo_reunion: string;
  observaciones?: string;
  area?: string;
  estadoCalculado?: EstadoReserva; // Estado calculado dinámicamente
}

/**
 * Datos del usuario asociado a una reserva
 */
export interface UsuarioReserva {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  rol_usuario?: {
    id: number;
    area?: string;
  };
}

/**
 * Datos para crear una nueva reserva
 */
export interface NuevaReserva {
  nombre_sala: Sala;
  fecha: string;
  hora_inicio: string;
  hora_final: string;
  titulo_reunion: string;
  observaciones?: string;
}

/**
 * Datos para actualizar una reserva existente
 */
export interface ActualizarReserva {
  nombre_sala?: Sala;
  fecha?: string;
  hora_inicio?: string;
  hora_final?: string;
  estado?: EstadoReserva;
  titulo_reunion?: string;
  observaciones?: string;
}

/**
 * Filtros para consultar reservas
 */
export interface FiltrosReserva {
  fecha?: string;
  nombre_sala?: Sala | "";
  estado?: EstadoReserva | "";
  usuario_id?: string;
}
```

### 3.2 Tipos y Constantes

```typescript
/**
 * Estados posibles de una reserva
 */
export type EstadoReserva = "Vigente" | "En curso" | "Finalizado" | "Cancelado";

/**
 * Salas disponibles para reservar
 */
export type Sala = "Sala Principal" | "Sala Secundaria";

export const SALAS_DISPONIBLES: Sala[] = ["Sala Principal", "Sala Secundaria"];

/**
 * Colores de fondo por estado
 */
export const COLORES_ESTADO: Record<EstadoReserva, string> = {
  "Vigente": "#004680",    // Azul corporativo
  "En curso": "#0F9568",   // Verde
  "Finalizado": "#F3F4F6", // Gris claro
  "Cancelado": "#FEE2E2",  // Rojo claro
};

/**
 * Colores de texto por estado
 */
export const COLORES_TEXTO_ESTADO: Record<EstadoReserva, string> = {
  "Vigente": "#5CB6FF",
  "En curso": "#41ECB3",
  "Finalizado": "#374151",
  "Cancelado": "#DC2626",
};

/**
 * Configuración por defecto de horarios
 */
export const CONFIGURACION_POR_DEFECTO: ConfiguracionReservas = {
  hora_inicio_operacion: "07:00",
  hora_fin_operacion: "18:00",
  intervalo_reserva_minutos: 60,
  dias_laborales: [1, 2, 3, 4, 5], // Lunes a Viernes
};

/**
 * Duración mínima de reunión
 */
export const DURACION_MINIMA_MINUTOS = 30;
```

### 3.3 Funciones de Utilidad de Tipos

```typescript
/**
 * Verifica si una reserva está finalizada
 */
export const estaFinalizado = (estado: string): boolean => {
  const estadoLower = estado?.toLowerCase() || "";
  return estadoLower === "finalizada" || estadoLower === "finalizado";
};

/**
 * Verifica si una reserva está cancelada
 */
export const estaCancelado = (estado: string): boolean => {
  const estadoLower = estado?.toLowerCase() || "";
  return estadoLower === "cancelada" || estadoLower === "cancelado";
};

/**
 * Verifica si una reserva puede ser modificada
 * Solo las reservas en estado "Vigente" pueden modificarse
 */
export const puedeModificarse = (estado: string): boolean => {
  const estadoLower = estado?.toLowerCase() || "";
  return estadoLower === "vigente";
};

/**
 * Genera un color consistente basado en el ID de la reserva
 */
export const getReservaColor = (id: number): string => {
  if (!id) return "#9e9e9e";
  return PALETA_RESERVAS[id % PALETA_RESERVAS.length];
};
```

---

## 4. Servicios y API

### 4.1 Estructura del Servicio de Reservas

El archivo `services/reservas.ts` centraliza toda la comunicación con Directus:

```typescript
// Campos que se solicitan de cada reserva
const RESERVATION_FIELDS = [
  "id",
  "date_created",
  {
    usuario_id: [
      "id",
      "first_name",
      "last_name",
      "email",
      { rol_usuario: ["id", "area"] },
    ],
  },
  "nombre_sala",
  "fecha",
  "hora_inicio",
  "hora_final",
  "estado",
  "titulo_reunion",
  "observaciones",
  "area",
];
```

### 4.2 Funciones de Lectura

```typescript
/**
 * Obtiene todas las reservas con filtros opcionales
 */
export async function getReservas(filtros?: FiltrosReserva): Promise<Reserva[]>

/**
 * Obtiene reservas de un mes específico (para calendario)
 */
export async function getReservasMes(año: number, mes: number): Promise<Reserva[]>

/**
 * Obtiene las reservas del usuario autenticado
 */
export async function getMisReservas(filtros?: FiltrosReserva): Promise<Reserva[]>

/**
 * Obtiene una reserva por ID
 */
export async function getReservaById(id: number): Promise<Reserva>

/**
 * Obtiene la configuración de horarios desde la BD
 */
export async function getConfiguracionReserva(): Promise<ConfiguracionReserva | null>
```

### 4.3 Funciones de Escritura

```typescript
/**
 * Crea una nueva reserva
 * Automáticamente asigna el usuario autenticado y estado "Vigente"
 */
export async function crearReserva(datos: NuevaReserva): Promise<Reserva>

/**
 * Actualiza una reserva existente
 */
export async function actualizarReserva(
  id: number,
  datos: ActualizarReserva
): Promise<Reserva>

/**
 * Cancela una reserva (cambia estado a "Cancelado")
 */
export async function cancelarReserva(id: number): Promise<Reserva>

/**
 * Elimina una reserva permanentemente
 */
export async function eliminarReserva(id: number): Promise<void>
```

### 4.4 Funciones de Validación

```typescript
/**
 * Verifica si hay conflicto de horario para una sala/fecha/hora
 * Retorna true si existe conflicto
 */
export async function verificarConflictoHorario(
  sala: string,
  fecha: string,
  horaInicio: string,
  horaFinal: string,
  reservaIdExcluir?: number // Para excluir la reserva actual al editar
): Promise<boolean>
```

### 4.5 Funciones de Mantenimiento

```typescript
/**
 * Actualiza automáticamente las reservas que ya finalizaron
 * a estado "Finalizado" en la base de datos
 */
export async function actualizarReservasFinalizadas(): Promise<number>
```

### 4.6 Procesamiento de Estados

```typescript
/**
 * Procesa las reservas para calcular estados dinámicos
 * NO modifica la BD, solo calcula el estado para mostrar
 */
function procesarReservas(reservas: Reserva[]): Reserva[] {
  return reservas.map((reserva) => ({
    ...reserva,
    estadoCalculado: calcularEstadoReserva(reserva),
  }));
}
```

---

## 5. Componentes Principales

### 5.1 ReservasView (Vista Principal)

**Archivo:** `views/ReservasView.tsx`

**Responsabilidad:** Orquestar todos los componentes y manejar la navegación entre pestañas.

**Características:**
- Sistema de tabs animado (Reserva, Mis Reservas, Calendario)
- Integración con TourProvider para tutorial interactivo
- Manejo de diálogos de crear/editar/cancelar reservas
- Notificaciones con Snackbar
- Actualización automática cada 30 segundos

**Props:** Ninguna (componente raíz)

**Hooks utilizados:**
- `useQuery` para obtener reservas
- `useMutation` para crear/actualizar/cancelar
- `useTourContext` para el sistema de tour
- `useAuth` para obtener usuario actual
- `useApps` para obtener área del usuario

```typescript
const ReservasView: React.FC = () => {
  return (
    <TourProvider>
      <ReservasViewContent />
    </TourProvider>
  );
};
```

### 5.2 DialogNuevaReserva (Formulario de Creación)

**Archivo:** `components/DialogNuevaReserva.tsx`

**Responsabilidad:** Formulario completo para crear una nueva reserva.

**Características:**
- Validación con Yup y React Hook Form
- Selector de sala con ToggleButton
- Selectores de hora con horario dinámico desde BD
- Calendario integrado (StaticDatePicker)
- Verificación de conflictos en tiempo real
- Sistema de tour integrado con tooltips custom

**Props:**
```typescript
interface DialogNuevaReservaProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (datos: NuevaReserva) => Promise<void>;
  verificarConflicto?: (sala, fecha, horaInicio, horaFinal) => Promise<boolean>;
  fechaInicial?: string;
  salaInicial?: Sala;
  horaInicial?: string;
}
```

### 5.3 VistaSemanal (Calendario Semanal)

**Archivo:** `components/VistaSemanal.tsx`

**Responsabilidad:** Mostrar reservas en formato de calendario semanal (Lunes a Viernes).

**Características:**
- Grid de horas x días
- Soporte para reservas de media hora
- Popover con detalle al hacer clic
- Indicador pulsante para reuniones en curso
- Navegación entre semanas
- Selectores de mes/año
- Selector de sala
- Colores por ID de reserva

**Props:**
```typescript
interface VistaSemanalProps {
  reservas: Reserva[];
  onNuevaReserva?: (fecha?, sala?, hora?) => void;
  onEditarReserva?: (reserva: Reserva) => void;
  onCancelarReserva?: (reserva: Reserva) => void;
  usuarioActualId?: string;
  vistaCalendario?: "semanal" | "mes";
  onCambiarVista?: (vista) => void;
  salaInicial?: string;
}
```

### 5.4 VistaCalendario (Calendario Mensual)

**Archivo:** `components/VistaCalendario.tsx`

**Responsabilidad:** Mostrar reservas en formato de calendario mensual.

**Características:**
- Vista de mes completo
- Reservas mostradas como chips en cada día
- Popover con lista de reservas del día
- Popover de detalle de reserva
- Toggle para mostrar/ocultar fines de semana
- Navegación entre meses
- Selector de sala con Segmented Control

**Props:** Similar a VistaSemanal

### 5.5 MisReservasCards (Tarjetas de Mis Reservas)

**Archivo:** `components/MisReservasCards.tsx`

**Responsabilidad:** Mostrar las reservas del usuario actual en formato de tarjetas.

**Características:**
- Separación por estado (En curso, Vigentes, Finalizadas, Canceladas)
- Tabs para alternar entre categorías
- Tarjetas con información completa
- Acciones de editar/cancelar
- Indicador pulsante para reuniones en curso
- Integración con tour (mock data)

**Props:**
```typescript
interface MisReservasCardsProps {
  reservas: Reserva[];
  usuarioActualId?: string;
  onEditar?: (reserva: Reserva) => void;
  onCancelar?: (reserva: Reserva) => void;
  loading?: boolean;
}
```

### 5.6 DialogEditarReserva (Formulario de Edición)

**Archivo:** `components/DialogEditarReserva.tsx`

**Responsabilidad:** Formulario para editar una reserva existente.

**Características:**
- Carga datos de la reserva seleccionada al abrir
- Misma estructura de formulario que DialogNuevaReserva
- Validación que excluye la reserva actual al verificar conflictos
- Configuración de horarios dinámica desde BD
- Filtro de hora final basado en hora inicio + 1 hora mínimo

**Props:**
```typescript
interface DialogEditarReservaProps {
  open: boolean;
  reserva: Reserva | null;
  onClose: () => void;
  onSubmit: (id: number, datos: ActualizarReserva) => Promise<void>;
  verificarConflicto?: (
    sala: string,
    fecha: string,
    horaInicio: string,
    horaFinal: string,
    reservaIdExcluir: number
  ) => Promise<boolean>;
}
```

**Validaciones:**
- Título: obligatorio, 3-100 caracteres
- Sala: obligatoria, debe ser válida
- Fecha: obligatoria, no puede ser pasada
- Hora inicio: dentro del horario de operación
- Hora final: al menos 1 hora después de inicio
- Observaciones: máximo 500 caracteres

### 5.7 FiltrosReservas (Panel de Filtros)

**Archivo:** `components/FiltrosReservas.tsx`

**Responsabilidad:** Proporcionar filtros para buscar reservas.

**Características:**
- Botón que abre Popover con opciones
- Filtro por fecha (date picker)
- Filtro por sala (select)
- Filtro por estado (select)
- Indicador visual cuando hay filtros activos
- Botón "Limpiar filtros"

**Props:**
```typescript
interface FiltrosReservasProps {
  filtros: FiltrosReserva;
  onFiltrosChange: (filtros: FiltrosReserva) => void;
}
```

### 5.8 FloatingHelpButton (Botón de Tutorial)

**Archivo:** `components/FloatingHelpButton.tsx`

**Responsabilidad:** Iniciar el tour guiado de la aplicación.

**Características:**
- Botón con ícono de ayuda
- Estado deshabilitado durante el tour
- Callback `onBeforeStart` para preparar la UI antes del tour
- Delay de 100ms para permitir cambios de pestaña

**Props:**
```typescript
interface FloatingHelpButtonProps {
  onBeforeStart?: () => void;
}
```

### 5.9 TablaReservas (Tabla de Reservas)

**Archivo:** `components/TablaReservas.tsx`

**Responsabilidad:** Mostrar reservas en formato tabular.

**Características:**
- Columnas: Sala, Área, Fecha, Hora Inicio, Hora Fin, Estado, Acciones
- Filtrado automático de vigentes/en curso
- Chips de estado con colores
- Indicador pulsante para "En curso"
- Botones de editar/cancelar

### 5.7 EstadoSalas (Estado Actual de Salas)

**Archivo:** `components/EstadoSalas.tsx`

**Responsabilidad:** Mostrar el estado actual de disponibilidad de cada sala.

**Características:**
- Indica si cada sala está Disponible u Ocupada
- Muestra la próxima reunión programada
- Botones de acción: "Ver Cronograma" y "Reservar Ahora"

### 5.8 ProximasReuniones (Próximas Reuniones)

**Archivo:** `components/ProximasReuniones.tsx`

**Responsabilidad:** Listar las próximas reuniones programadas.

**Características:**
- Lista cronológica de reuniones futuras
- Información resumida de cada reunión
- Botón para ver calendario completo

### 5.9 DialogEditarReserva (Formulario de Edición)

**Archivo:** `components/DialogEditarReserva.tsx`

**Responsabilidad:** Formulario para modificar una reserva existente.

**Características:**
- Pre-carga datos de la reserva seleccionada
- Validación con Yup y React Hook Form
- Horarios dinámicos desde configuración de BD
- Verificación de conflictos (excluyendo la reserva actual)
- Contador de caracteres en observaciones
- Selector de sala con ToggleButton
- Calendario integrado (StaticDatePicker)

**Props:**
```typescript
interface DialogEditarReservaProps {
  open: boolean;
  reserva: Reserva | null;
  onClose: () => void;
  onSubmit: (id: number, datos: ActualizarReserva) => Promise<void>;
  verificarConflicto?: (
    sala: string,
    fecha: string,
    horaInicio: string,
    horaFinal: string,
    reservaIdExcluir: number
  ) => Promise<boolean>;
}
```

**Validaciones:**
- Título: obligatorio, 3-100 caracteres
- Sala: obligatoria
- Fecha: obligatoria, no puede ser pasada
- Hora inicio: obligatoria, dentro del horario de operación
- Hora fin: obligatoria, al menos 1 hora después del inicio
- Observaciones: opcional, máximo 500 caracteres

### 5.10 FiltrosReservas (Componente de Filtros)

**Archivo:** `components/FiltrosReservas.tsx`

**Responsabilidad:** Proporcionar filtros para buscar reservas.

**Características:**
- Botón que abre Popover con filtros
- Filtro por fecha (DatePicker)
- Filtro por sala (Select)
- Filtro por estado (Select)
- Botón "Limpiar filtros"
- Indicador visual cuando hay filtros activos

**Props:**
```typescript
interface FiltrosReservasProps {
  filtros: FiltrosReserva;
  onFiltrosChange: (filtros: FiltrosReserva) => void;
}
```

### 5.11 FloatingHelpButton (Botón de Tutorial)

**Archivo:** `components/FloatingHelpButton.tsx`

**Responsabilidad:** Iniciar el tour guiado de la aplicación.

**Características:**
- Botón con ícono de ayuda
- Estado deshabilitado durante el tour
- Callback `onBeforeStart` para preparar la UI
- Delay de 100ms antes de iniciar el tour

**Props:**
```typescript
interface FloatingHelpButtonProps {
  onBeforeStart?: () => void; // Callback antes de iniciar (ej: cambiar a pestaña Reserva)
}
```

### 5.12 PulsatingMeetingIndicator (Indicador Pulsante)

**Archivo:** `components/PulsatingMeetingIndicator.tsx`

**Responsabilidad:** Mostrar indicador visual animado para reuniones en curso.

**Características:**
- Círculo con animación de pulso CSS
- Configurable en tamaño y color
- Se muestra solo cuando la reunión está activa

---

## 6. Sistema de Tour Guiado

### 6.1 TourContext (Contexto del Tour)

**Archivo:** `components/TourContext.tsx`

**Responsabilidad:** Manejar el estado y flujo del tour interactivo.

**Fases del Tour:**
```typescript
export type TourPhase =
  | "IDLE"                // No hay tour activo
  | "RESERVA_CLICK_BUTTON" // Esperando click en "Nueva Reserva"
  | "DIALOG_TOUR"         // Tour dentro del diálogo
  | "RESERVA_CONTINUE"    // Continuar en pestaña Reserva
  | "MIS_RESERVAS"        // Tour en Mis Reservas
  | "CALENDARIO"          // Tour en Calendario
  | "COMPLETED";          // Tour completado
```

**Estado proporcionado:**
```typescript
interface TourContextType {
  tourPhase: TourPhase;
  isFullTourRunning: boolean;
  stepIndex: number;
  startFullTour: () => void;
  nextPhase: () => void;
  setStepIndex: (index: number) => void;
  stopTour: () => void;
  completeTour: () => void;
  userCreatedReservation: Reserva | null;
  setUserCreatedReservation: (reserva: Reserva | null) => void;
  mockReservasAdicionales: Reserva[];
  // ... callbacks para cambio de pestaña y diálogos
}
```

### 6.2 ReservasTour (Componente Principal de Tour)

**Archivo:** `components/ReservasTour.tsx`

**Responsabilidad:** Implementar el tour con React Joyride y coordinar las fases.

**Pasos por Fase:**

**Fase RESERVA_CLICK_BUTTON:**
```typescript
const STEPS_RESERVA_CLICK: Step[] = [
  {
    target: ".tour-nueva-reserva",
    content: "¡Comencemos! Haz clic en 'Nueva reserva' para crear tu primera reservación.",
    placement: "bottom",
    spotlightClicks: true,
    hideFooter: true,
  },
];
```

**Fase RESERVA_CONTINUE (después del diálogo):**
```typescript
const STEPS_RESERVA_CONTINUE: Step[] = [
  {
    target: ".tour-estado-salas",
    content: "Estado de las Salas - Ver disponibilidad en tiempo real",
  },
  {
    target: ".tour-proximas-reuniones",
    content: "Próximas Reuniones - Lista de reuniones programadas para hoy",
  },
];
```

**Fase MIS_RESERVAS:**
```typescript
const STEPS_MIS_RESERVAS: Step[] = [
  {
    target: ".tour-mis-reservas-tabs",
    content: "Filtrar por Estado - Vigentes, Finalizadas o Canceladas",
  },
  {
    target: ".tour-reserva-card",
    content: "¡Tu Reserva! - Puedes editarla o cancelarla",
  },
];
```

**Fase CALENDARIO:**
```typescript
const STEPS_CALENDARIO: Step[] = [
  { target: ".tour-sala-selector", content: "Filtro de Sala" },
  { target: ".tour-vista-selector", content: "Tipo de Vista (Semanal/Mensual)" },
  { target: ".tour-navegacion", content: "Navegación entre semanas/meses" },
  { target: ".tour-selector-fecha", content: "Selector Rápido de fecha" },
  { target: ".tour-periodo", content: "Período Visible" },
  { target: ".tour-calendario", content: "¡Tu Reserva en el Calendario!" },
];
```

**Custom Tooltip:**
El componente incluye un tooltip personalizado con:
- Header con indicador de paso (ej: "Paso 2 de 5")
- Botón de cerrar
- Contenido del paso
- Footer con botones "Atrás" y "Siguiente/Continuar"
- Estilos consistentes con la UI de la aplicación

**Configuración de Joyride:**
```typescript
<Joyride
  run={runTour}
  steps={currentSteps}
  stepIndex={stepIndex}
  continuous
  showSkipButton
  showProgress
  disableOverlayClose
  scrollToFirstStep
  spotlightClicks
  tooltipComponent={CustomTooltip}
  styles={{
    spotlight: {
      borderRadius: 8,
      boxShadow: "0 0 0 3px #004680, 0 0 25px rgba(0, 70, 128, 0.4)",
    },
  }}
/>
```

### 6.3 Tour dentro del Diálogo

El `DialogNuevaReserva` implementa su propio sistema de tour con tooltips personalizados:

```typescript
const DIALOG_TOUR_STEPS: DialogTourStep[] = [
  { target: "tour-dialog-titulo", title: "Título de la Reunión", ... },
  { target: "tour-dialog-sala", title: "Seleccionar Sala", ... },
  { target: "tour-dialog-horas", title: "Horario de la Reunión", ... },
  { target: "tour-dialog-fecha", title: "Fecha de la Reserva", ... },
  { target: "tour-dialog-observaciones", title: "Observaciones", ... },
  { target: "tour-dialog-submit", title: "¡Confirma tu Reserva!", ... },
];
```

### 6.4 Flujo Completo del Tour

```
1. Usuario hace clic en botón "Tutorial"
        ↓
2. onBeforeStart() cambia a pestaña "Reserva"
        ↓
3. startFullTour() inicia fase RESERVA_CLICK_BUTTON
        ↓
4. Joyride muestra tooltip en botón "Nueva Reserva"
        ↓
5. Usuario hace clic → openDialogForTour()
        ↓
6. Fase cambia a DIALOG_TOUR
        ↓
7. DialogNuevaReserva muestra tour interno (6 pasos)
        ↓
8. Usuario completa formulario → onFormSubmitted()
        ↓
9. Se crea reserva mock, diálogo se cierra
        ↓
10. Fase cambia a RESERVA_CONTINUE
        ↓
11. Joyride muestra tour de Estado Salas y Próximas Reuniones
        ↓
12. nextPhase() → fase MIS_RESERVAS
        ↓
13. Tab cambia a "Mis Reservas"
        ↓
14. Joyride muestra tour de tabs y tarjeta de reserva
        ↓
15. nextPhase() → fase CALENDARIO
        ↓
16. Tab cambia a "Calendario"
        ↓
17. Joyride muestra tour de controles del calendario
        ↓
18. Tour termina → fase COMPLETED → IDLE
```

---

## 7. Flujos de Usuario Principales

### 7.1 Crear una Nueva Reserva

```
1. Usuario hace clic en "Nueva Reserva"
        ↓
2. Se abre DialogNuevaReserva
        ↓
3. Usuario completa el formulario:
   - Título de la reunión
   - Selecciona sala
   - Selecciona hora inicio y fin
   - Selecciona fecha en calendario
   - (Opcional) Agrega observaciones
        ↓
4. Sistema verifica conflictos en tiempo real
        ↓
5. Usuario hace clic en "Confirmar Reservación"
        ↓
6. Sistema valida el formulario con Yup
        ↓
7. Si es válido, se llama a crearReserva()
        ↓
8. Directus crea el registro con estado "Vigente"
        ↓
9. TanStack Query invalida caché de reservas
        ↓
10. Se muestra Snackbar de éxito
        ↓
11. Diálogo se cierra
        ↓
12. Vista se actualiza mostrando la nueva reserva
```

### 7.2 Ver Reservas en Calendario

```
1. Usuario navega a pestaña "Calendario"
        ↓
2. Por defecto se muestra VistaSemanal
        ↓
3. Usuario puede:
   - Cambiar entre vista Semanal/Mensual
   - Navegar entre semanas/meses
   - Filtrar por sala
        ↓
4. Clic en una reserva abre Popover con detalle
        ↓
5. Desde el Popover puede:
   - Ver información completa
   - Editar (si es su reserva y está vigente)
   - Cancelar (si es su reserva y está vigente)
```

### 7.3 Gestionar Mis Reservas

```
1. Usuario navega a pestaña "Mis Reservas"
        ↓
2. Se muestran sus reservas en formato de tarjetas
        ↓
3. Reservas separadas por estado:
   - En curso (siempre visible arriba)
   - Vigentes (tab activo por defecto)
   - Finalizadas (tab)
   - Canceladas (tab)
        ↓
4. Usuario puede:
   - Ver detalle de cada reserva
   - Editar reservas vigentes
   - Cancelar reservas vigentes
```

### 7.4 Cancelar una Reserva

```
1. Usuario hace clic en botón de cancelar
        ↓
2. Se abre diálogo de confirmación
        ↓
3. Se muestra información de la reserva a cancelar
        ↓
4. Usuario confirma haciendo clic en "Sí, cancelar"
        ↓
5. Sistema llama a cancelarReserva(id)
        ↓
6. Directus actualiza estado a "Cancelado"
        ↓
7. TanStack Query invalida caché
        ↓
8. Se muestra Snackbar de confirmación
        ↓
9. Diálogo se cierra
        ↓
10. Reserva aparece en tab "Canceladas"
```

---

## 8. Casos de Uso

### 8.1 Caso de Uso: Reservar Sala para Reunión

**Actor:** Usuario autenticado

**Precondiciones:**
- Usuario ha iniciado sesión
- Existe al menos una sala disponible

**Flujo principal:**
1. El usuario hace clic en "Nueva Reserva"
2. El sistema muestra el formulario de reserva
3. El usuario ingresa título: "Sincronización semanal"
4. El usuario selecciona "Sala Principal"
5. El usuario selecciona hora inicio: 10:00 AM
6. El usuario selecciona hora fin: 11:00 AM
7. El usuario selecciona fecha en el calendario
8. El usuario hace clic en "Confirmar Reservación"
9. El sistema verifica que no hay conflictos
10. El sistema crea la reserva
11. El sistema muestra mensaje de éxito

**Flujo alternativo - Conflicto de horario:**
1. En el paso 9, el sistema detecta un conflicto
2. El sistema muestra alerta: "Ya existe una reserva en este horario"
3. El usuario modifica la hora o fecha
4. El flujo continúa desde el paso 8

### 8.2 Caso de Uso: Ver Estado Actual de Salas

**Actor:** Usuario autenticado

**Flujo principal:**
1. El usuario accede a la pestaña "Reserva"
2. El sistema muestra el estado de cada sala
3. Para cada sala se indica:
   - Estado: "Disponible" u "Ocupada"
   - Si ocupada: título de la reunión actual
   - Próxima reunión programada
4. El usuario puede hacer clic en "Ver Cronograma" para ir al calendario

### 8.3 Caso de Uso: Editar Reserva Propia

**Actor:** Usuario autenticado (propietario de la reserva)

**Precondiciones:**
- La reserva está en estado "Vigente"
- La reserva pertenece al usuario actual
- La fecha/hora de inicio aún no ha llegado

**Flujo principal:**
1. El usuario localiza su reserva (en Mis Reservas o Calendario)
2. El usuario hace clic en el icono de editar
3. El sistema muestra el formulario con los datos actuales
4. El usuario modifica los campos deseados
5. El usuario hace clic en "Guardar Cambios"
6. El sistema verifica conflictos (excluyendo la reserva actual)
7. El sistema actualiza la reserva
8. El sistema muestra mensaje de éxito

### 8.4 Caso de Uso: Realizar Tour Guiado

**Actor:** Usuario nuevo

**Flujo principal:**
1. El usuario hace clic en el botón de ayuda (ícono de graduación)
2. El sistema inicia el tour en la pestaña "Reserva"
3. El tour guía al usuario a hacer clic en "Nueva Reserva"
4. Se abre el diálogo con tour interno explicando cada campo
5. El usuario completa el formulario (o usa datos de ejemplo)
6. El sistema crea una reserva de demostración
7. El tour continúa en "Mis Reservas" mostrando la reserva creada
8. El tour finaliza en "Calendario" mostrando la reserva en contexto
9. El sistema muestra mensaje de tour completado

---

## 9. Configuración Dinámica

### 9.1 Horarios desde Base de Datos

La aplicación obtiene la configuración de horarios desde la tabla `configuracion_reserva`:

```typescript
export interface ConfiguracionReserva {
  id: number;
  hora_apertura: string;  // Ej: "08:00:00"
  hora_cierre: string;    // Ej: "18:00:00"
}

// En el componente
const { data: configuracion } = useQuery({
  queryKey: ["configuracion_reservas"],
  queryFn: getConfiguracionReserva,
  staleTime: 5 * 60 * 1000, // Cache por 5 minutos
});
```

### 9.2 Generación Dinámica de Opciones de Hora

```typescript
const generarHorasRango = (horaInicio: string, horaFin: string): string[] => {
  const horas: string[] = [];
  const [horaIni] = horaInicio.split(":").map(Number);
  const [horaFinNum] = horaFin.split(":").map(Number);

  for (let hora = horaIni; hora <= horaFinNum; hora++) {
    horas.push(`${hora.toString().padStart(2, "0")}:00`);
    horas.push(`${hora.toString().padStart(2, "0")}:30`);
  }

  return horas;
};
```

---

## 10. Funciones de Utilidad

### 10.1 Archivo reservas.utils.ts

**Archivo:** `utils/reservas.utils.ts`

Este archivo contiene funciones auxiliares puras para manipulación de fechas, horas y validaciones.

### 10.2 Funciones de Formateo de Fecha

```typescript
/**
 * Formatea una fecha al formato legible español
 * Ejemplo: "15 de Enero 2025"
 */
export function formatearFecha(fecha: string | Date): string;

/**
 * Formatea una fecha al formato corto
 * Ejemplo: "15/01/2025"
 */
export function formatearFechaCorta(fecha: string | Date): string;

/**
 * Obtiene el nombre del día de la semana en español
 * Ejemplo: "lunes", "martes"
 */
export function obtenerDiaSemana(fecha: string | Date): string;
```

### 10.3 Funciones de Manipulación de Hora

```typescript
/**
 * Formatea una hora de HH:mm:ss a HH:mm
 */
export function formatearHora(hora: string): string;

/**
 * Convierte una hora HH:mm a minutos desde medianoche
 * Ejemplo: "14:30" → 870
 */
export function horaAMinutos(hora: string): number;

/**
 * Convierte minutos desde medianoche a formato HH:mm
 * Ejemplo: 870 → "14:30"
 */
export function minutosAHora(minutos: number): string;

/**
 * Calcula la duración en minutos entre dos horas
 */
export function calcularDuracion(horaInicio: string, horaFinal: string): number;

/**
 * Formatea la duración en texto legible
 * Ejemplo: 90 → "1 hora 30 minutos"
 */
export function formatearDuracion(minutos: number): string;
```

### 10.4 Funciones de Validación

```typescript
/**
 * Valida si una hora está dentro del horario permitido
 */
export function validarHorario(
  hora: string,
  horarioInicio: string,
  horarioFin: string
): boolean;

/**
 * Verifica si una fecha es hoy
 */
export function esFechaHoy(fecha: string | Date): boolean;

/**
 * Verifica si una fecha es futura
 */
export function esFechaFutura(fecha: string | Date): boolean;

/**
 * Verifica si una fecha es un fin de semana
 */
export function esFinDeSemana(fecha: string | Date): boolean;

/**
 * Verifica si una reunión ya ha iniciado
 */
export function reunionHaIniciado(fecha: string, horaInicio: string): boolean;

/**
 * Verifica si una reunión ya ha finalizado
 */
export function reunionHaFinalizado(fecha: string, horaFinal: string): boolean;
```

### 10.5 Funciones de Generación

```typescript
/**
 * Genera un rango de horas disponibles con intervalos específicos
 * Ejemplo: generarRangoHoras("08:00", "18:00", 30)
 * Retorna: ["08:00", "08:30", "09:00", ...]
 */
export function generarRangoHoras(
  inicio: string,
  fin: string,
  intervaloMinutos: number = 30
): string[];

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 */
export function obtenerFechaActual(): string;

/**
 * Obtiene la hora actual en formato HH:mm
 */
export function obtenerHoraActual(): string;
```

### 10.6 Función de Detección de Solapamiento

```typescript
/**
 * Valida si dos rangos de tiempo se solapan
 * Útil para detectar conflictos de horario
 * 
 * Casos detectados:
 * 1. inicio2 está dentro del rango 1
 * 2. fin2 está dentro del rango 1
 * 3. rango 2 contiene completamente al rango 1
 */
export function rangosSeSolapan(
  inicio1: string,
  fin1: string,
  inicio2: string,
  fin2: string
): boolean {
  const min1Inicio = horaAMinutos(inicio1);
  const min1Fin = horaAMinutos(fin1);
  const min2Inicio = horaAMinutos(inicio2);
  const min2Fin = horaAMinutos(fin2);

  // Caso 1: inicio2 está dentro del rango 1
  if (min2Inicio >= min1Inicio && min2Inicio < min1Fin) return true;

  // Caso 2: fin2 está dentro del rango 1
  if (min2Fin > min1Inicio && min2Fin <= min1Fin) return true;

  // Caso 3: rango 2 contiene completamente al rango 1
  if (min2Inicio <= min1Inicio && min2Fin >= min1Fin) return true;

  return false;
}
```

---

## 11. Consideraciones Técnicas

### 11.1 Rendimiento

La aplicación implementa varias técnicas de optimización:

- **Caché de datos:** TanStack Query almacena reservas con `refetchInterval: 30000`
- **Memoización:** Uso de `useMemo` para cálculos costosos
- **Callbacks estables:** Uso de `useCallback` para prevenir re-renders
- **Lazy loading:** Los componentes de calendario solo renderizan días visibles
- **Procesamiento eficiente:** Estados calculados solo cuando cambian los datos

### 11.2 Manejo de Errores

```typescript
// En servicios
try {
  const items = await withAutoRefresh(() =>
    directus.request(readItems("reuniones_reservas", {...}))
  );
  return procesarReservas(items as Reserva[]);
} catch (error) {
  console.error("❌ Error al cargar reservas:", error);
  throw error;
}

// En componentes
const mutationCrear = useMutation({
  mutationFn: crearReserva,
  onError: (error: any) => {
    setSnackbar({
      open: true,
      message: error.message || "Error al crear la reserva",
      severity: "error",
    });
  },
});
```

### 11.3 Validación de Formularios

La validación se realiza con Yup:

```typescript
const schema = yup.object().shape({
  titulo_reunion: yup
    .string()
    .required("El título es obligatorio")
    .min(3, "Mínimo 3 caracteres")
    .max(100, "Máximo 100 caracteres"),
  nombre_sala: yup
    .string()
    .required("Selecciona una sala")
    .oneOf(SALAS_DISPONIBLES, "Sala no válida"),
  fecha: yup
    .string()
    .required("La fecha es obligatoria"),
  hora_inicio: yup
    .string()
    .required("La hora de inicio es obligatoria"),
  hora_final: yup
    .string()
    .required("La hora de fin es obligatoria"),
  observaciones: yup
    .string()
    .max(500, "Máximo 500 caracteres"),
});
```

### 11.4 Seguridad

- **Autenticación:** Tokens JWT manejados por `withAutoRefresh`
- **Autorización:** Solo el propietario puede editar/cancelar sus reservas
- **Validación de permisos:** `puedeModificar()` verifica propiedad y estado
- **Sanitización:** Los datos se validan antes de enviar a la API

### 11.5 Accesibilidad

- **Contraste de colores:** Estados con colores distintivos y alto contraste
- **Navegación por teclado:** Tabs y botones accesibles con Tab/Enter
- **ARIA labels:** Tooltips y labels descriptivos
- **Responsive design:** Diseño adaptativo para móvil y escritorio
- **Indicadores visuales:** Animación pulsante para reuniones en curso

---

## 11. Funciones de Utilidad

### 11.1 Archivo reservas.utils.ts

**Archivo:** `utils/reservas.utils.ts`

**Responsabilidad:** Funciones auxiliares para manipulación de fechas, horas y validaciones.

### 11.2 Funciones de Formato

```typescript
/**
 * Formatea una fecha al formato legible español
 * @example formatearFecha("2024-01-15") → "15 de enero 2024"
 */
export function formatearFecha(fecha: string | Date): string

/**
 * Formatea una fecha al formato corto
 * @example formatearFechaCorta("2024-01-15") → "15/01/2024"
 */
export function formatearFechaCorta(fecha: string | Date): string

/**
 * Formatea una hora de HH:mm:ss a HH:mm
 * @example formatearHora("14:30:00") → "14:30"
 */
export function formatearHora(hora: string): string

/**
 * Formatea la duración en texto legible
 * @example formatearDuracion(90) → "1 hora 30 minutos"
 */
export function formatearDuracion(minutos: number): string
```

### 11.3 Funciones de Conversión

```typescript
/**
 * Convierte una hora HH:mm a minutos desde medianoche
 * @example horaAMinutos("14:30") → 870
 */
export function horaAMinutos(hora: string): number

/**
 * Convierte minutos desde medianoche a formato HH:mm
 * @example minutosAHora(870) → "14:30"
 */
export function minutosAHora(minutos: number): string

/**
 * Calcula la duración en minutos entre dos horas
 * @example calcularDuracion("14:00", "15:30") → 90
 */
export function calcularDuracion(horaInicio: string, horaFinal: string): number
```

### 11.4 Funciones de Validación

```typescript
/**
 * Valida si una hora está dentro del horario permitido
 */
export function validarHorario(
  hora: string,
  horarioInicio: string,
  horarioFin: string
): boolean

/**
 * Verifica si dos rangos de tiempo se solapan
 */
export function rangosSeSolapan(
  inicio1: string, fin1: string,
  inicio2: string, fin2: string
): boolean

/**
 * Verifica si una fecha es hoy
 */
export function esFechaHoy(fecha: string | Date): boolean

/**
 * Verifica si una fecha es futura
 */
export function esFechaFutura(fecha: string | Date): boolean

/**
 * Verifica si una fecha es fin de semana
 */
export function esFinDeSemana(fecha: string | Date): boolean
```

### 11.5 Funciones de Estado de Reunión

```typescript
/**
 * Verifica si una reunión ya ha iniciado
 */
export function reunionHaIniciado(fecha: string, horaInicio: string): boolean

/**
 * Verifica si una reunión ya ha finalizado
 */
export function reunionHaFinalizado(fecha: string, horaFinal: string): boolean
```

### 11.6 Funciones de Generación

```typescript
/**
 * Genera un rango de horas disponibles con intervalos específicos
 * @example generarRangoHoras("08:00", "18:00", 30)
 * → ["08:00", "08:30", "09:00", ..., "18:00"]
 */
export function generarRangoHoras(
  inicio: string,
  fin: string,
  intervaloMinutos: number = 30
): string[]

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 */
export function obtenerFechaActual(): string

/**
 * Obtiene la hora actual en formato HH:mm
 */
export function obtenerHoraActual(): string

/**
 * Obtiene el nombre del día de la semana en español
 * @example obtenerDiaSemana("2024-01-15") → "lunes"
 */
export function obtenerDiaSemana(fecha: string | Date): string
```

---

## 12. Glosario de Términos

| Término | Definición |
|---------|------------|
| **Reserva** | Registro de ocupación de una sala para una fecha y horario específicos |
| **Sala** | Espacio físico disponible para reuniones (Principal o Secundaria) |
| **Estado Vigente** | Reserva programada que aún no ha comenzado |
| **Estado En curso** | Reunión que está ocurriendo en este momento (calculado dinámicamente) |
| **Estado Finalizado** | Reunión que ya terminó |
| **Estado Cancelado** | Reserva anulada por el usuario |
| **estadoCalculado** | Estado determinado en tiempo real basado en fecha/hora actual |
| **Conflicto de horario** | Cuando dos reservas se solapan en la misma sala |
| **Tour** | Sistema interactivo de guía para nuevos usuarios |
| **TanStack Query** | Biblioteca para gestión de estado del servidor con caché |
| **Directus** | CMS headless usado como backend |
| **Popover** | Elemento flotante que muestra información adicional |
| **Segmented Control** | Control de selección visual tipo iOS/Material |

---

## 13. Dependencias Principales

| Paquete | Versión | Uso |
|---------|---------|-----|
| `react` | ^18.x | Framework de UI |
| `@mui/material` | ^5.x | Componentes de interfaz |
| `@mui/x-date-pickers` | ^6.x | Selectores de fecha/hora |
| `@tanstack/react-query` | ^5.x | Gestión de estado del servidor |
| `@directus/sdk` | ^13.x | Cliente de API para Directus |
| `react-hook-form` | ^7.x | Manejo de formularios |
| `yup` | ^1.x | Validación de esquemas |
| `date-fns` | ^2.x | Manipulación de fechas |
| `react-joyride` | ^2.x | Tour guiado interactivo |

---

_Documentación generada para la Aplicación de Reservas de Salas - AppKancan_
_Esta documentación está diseñada para ser autosuficiente y permitir a nuevos desarrolladores comprender completamente el sistema._
