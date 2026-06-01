# Documentación — Módulo de Notificaciones

## 1. Introducción

El módulo de Notificaciones permite a los usuarios crear, enviar y gestionar notificaciones en tiempo real hacia terminales y grupos de trabajo dentro del ecosistema AppKancan. Soporta envío inmediato, programado y recordatorios personales.

**Características principales:**
- Historial completo de notificaciones con auto-refresco cada 30 s
- Filtrado por tipo (Éxito, Advertencia, Error) y rango de fechas
- Creación con destino flexible: todas las terminales, grupo/área o terminales específicas
- Programación de envío y recordatorios personales
- Exportación a CSV
- Tour guiado interactivo (React Joyride)

---

## 2. Estructura del Proyecto

```
src/apps/notificaciones/
├── routes.tsx                          # Definición de rutas
├── interfaces/
│   └── notification.interface.ts       # Tipos TypeScript
├── services/
│   └── notification.service.ts         # Integración Directus + API notificador
├── utils/
│   └── notification.utils.ts           # Helpers: filtrado, estilos, exportación
├── pages/
│   └── HistorialNotificaciones.tsx     # Página principal — listado + filtros
└── components/
    ├── CreateNotification.tsx           # Formulario de creación
    ├── NotificationHeader.tsx           # Encabezado sticky con contador y botón crear
    ├── NotificationTable.tsx            # Tabla paginada de registros
    ├── NotificationDetailModal.tsx      # Modal de detalle de notificación
    ├── NotificationsTourContext.tsx     # Contexto del tour guiado
    ├── NotificationsTour.tsx            # Componente Joyride del tour
    ├── ExportButton.tsx                 # Exportación CSV
    ├── NotificationFilters.tsx          # Selector de rango (componente standalone)
    └── NotificationTelemetry.tsx        # Panel de telemetría (solo referencia)
```

---

## 3. Rutas

| Ruta                    | Componente               | Descripción                  |
|-------------------------|--------------------------|------------------------------|
| `/notificaciones`       | HistorialNotificaciones  | Historial y filtros           |
| `/notificaciones/crear` | CreateNotification       | Formulario de nueva notif.   |

Las rutas se cargan dinámicamente desde `src/router/AppRoutes.tsx` mediante `import.meta.glob("@/apps/**/routes.tsx")`, condicionadas al permiso `notificaciones` en el perfil del usuario.

---

## 4. Tipos de Datos

### `INotification`
```typescript
interface INotification {
  id: string;
  titulo: string;
  mensaje: string;
  tipo_notificacion: 'ENTREGADO' | 'ERROR' | 'ADVERTENCIA' | 'INFORMACIÓN' | 'EN COLA';
  progreso: number;
  fecha: string;        // formato dd/MM/yyyy
  hora: string;         // formato HH:mm:ss
  destinatarios?: string;
  persistente?: boolean;
  duracion?: number;    // segundos
}
```

### `ICreateNotification`
```typescript
interface ICreateNotification {
  destinatarios: string | string[];
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  duracion_seg: number;
  persistente: boolean;
  clickeable?: boolean;
  mostrar_boton_cerrar?: boolean;
  pausar_al_hover?: boolean;
  excluir?: string[];
  ruta_accion?: string | null;
  fecha_programada?: string | null;
}
```

### `INotificationGroup`
```typescript
interface INotificationGroup {
  id: string | number;
  name: string;
}
```

---

## 5. Servicios y API

**Archivo:** `src/apps/notificaciones/services/notification.service.ts`

### Tablas Directus

| Tabla                       | Uso                                      |
|-----------------------------|------------------------------------------|
| `core_notifications`        | Historial de notificaciones entregadas   |
| `core_notifier_clients`     | Terminales disponibles como destinatario |
| `core_notification_groups`  | Grupos/áreas de trabajo                  |

### Métodos del servicio

| Método                        | Descripción                                            |
|-------------------------------|--------------------------------------------------------|
| `obtenerRegistrosEntrega()`   | Lee hasta 500 registros de `core_notifications`        |
| `obtenerClientesNotificadores()` | Lista terminales activas disponibles               |
| `obtenerGrupos()`             | Lista grupos/áreas disponibles                         |
| `enviarNotificacion(payload)` | POST a `http://192.168.19.245:5050/notify` con JWT     |
| `eliminarNotificacion(id)`    | Elimina registro de `core_notifications`               |

### Mapeo de estados
```
Directus status  →  UI tipo_notificacion
SUCCESS          →  ENTREGADO
ERROR            →  ERROR
WARNING          →  ADVERTENCIA
INFO             →  INFORMACIÓN
(sin estado)     →  EN COLA
```

---

## 6. Componentes Principales

### 6.1 HistorialNotificaciones
**Archivo:** `src/apps/notificaciones/pages/HistorialNotificaciones.tsx`

Página raíz del módulo. Orquesta estado, filtros y sub-componentes.

**Estado:**
```typescript
registros:     INotification[]       // datos cargados del servicio
cargando:      boolean
filtroEstado:  'TODOS' | 'ENTREGADO' | 'ADVERTENCIA' | 'ERROR'
rangoFecha:    'todos' | 'hoy' | 'ayer' | '7' | '30'
selectedNotif: INotification | null  // notificación seleccionada en modal
```

**Comportamientos clave:**
- Auto-refresco cada 30 s via `setInterval`
- Filtrado cliente: combina `tipo_notificacion` + rango de fechas
- Eliminar actualiza el estado local sin re-fetch
- Envuelve el layout con `NotificationsTourProvider`

---

### 6.2 NotificationHeader
**Archivo:** `src/apps/notificaciones/components/NotificationHeader.tsx`

Encabezado sticky (`position: sticky, top: 0`) con:
- Ícono + título "Historial de Notificaciones"
- Contador de registros filtrados
- Botón **Crear Notificación** → navega a `/notificaciones/crear`

**Props:**
```typescript
{ total: number }
```

---

### 6.3 NotificationTable
**Archivo:** `src/apps/notificaciones/components/NotificationTable.tsx`

Tabla paginada (5 ítems/página) con grid CSS.

**Columnas:** Asunto · Mensaje · Estado · Fecha y Hora · Acciones

**Badge de estado:**
| Tipo       | Fondo     | Texto     |
|------------|-----------|-----------|
| ENTREGADO  | verde     | verde     |
| ERROR      | rojo      | rojo      |
| ADVERTENCIA| ámbar     | ámbar     |
| EN COLA    | azul      | azul      |

**Props:**
```typescript
{
  registros:   INotification[];
  cargando:    boolean;
  onSelect:    (n: INotification) => void;
  onEliminar:  (id: string) => void;
  onRefrescar: () => void;
}
```

---

### 6.4 NotificationDetailModal
**Archivo:** `src/apps/notificaciones/components/NotificationDetailModal.tsx`

Dialog MUI (`maxWidth="sm"`) con detalle completo:
- ID, título, tipo (badge)
- Mensaje completo en bloque resaltado
- Remitente y duración en grilla 2 columnas
- Fecha y hora de registro

**Props:**
```typescript
{
  open:          boolean;
  notificacion:  INotification | null;
  onClose:       () => void;
}
```

---

### 6.5 CreateNotification
**Archivo:** `src/apps/notificaciones/components/CreateNotification.tsx`

Formulario de creación con tres secciones:

**Destino:**
- Todas las terminales activas
- Grupo/área específica
- Terminales individuales (selección múltiple)

**Contenido:**
- Título (máx. 100 caracteres)
- Mensaje (máx. 600 caracteres)
- Tipo de alerta: Info / Éxito / Advertencia / Error

**Opciones avanzadas:**
- Duración en pantalla (5–360 s, default 15)
- Persistente (requiere cierre manual)
- Clickeable + ruta de acción
- Excluir terminales específicas
- Programar envío (fecha + hora)
- Recordatorio personal

---

### 6.6 ExportButton
**Archivo:** `src/apps/notificaciones/components/ExportButton.tsx`

Exporta registros actuales a `Historial_Notificaciones.csv`.  
Columnas: ID, Título, Mensaje (sin HTML), Tipo, Progreso, Fecha, Hora.

---

## 7. Tour Guiado

**Archivos:**
- `src/apps/notificaciones/components/NotificationsTourContext.tsx`
- `src/apps/notificaciones/components/NotificationsTour.tsx`

### Activación
El tour se activa de dos formas:
1. **PeekButton**: usuario hace clic en el ícono de notificaciones en el FAB flotante
2. **URL**: navegando a `/notificaciones?tour=start`

### Flujo
```
PeekButton click
  → startTutorial("notificaciones")   [TutorialContext global]
  → navigate("/notificaciones")
  → NotificationsTourProvider detecta activeTutorial === "notificaciones"
  → endTutorial() + startTour()
  → Joyride inicia con 5 pasos
```

### Pasos del tour

| # | Target            | Título                     | Descripción                                      |
|---|-------------------|----------------------------|--------------------------------------------------|
| 1 | `#notif-header`   | Historial de Notificaciones| Introducción al módulo                           |
| 2 | `#notif-btn-crear`| Crear Notificación         | Cómo crear y enviar nuevas notificaciones        |
| 3 | `#notif-filtros`  | Filtros de Estado          | Filtrar por Todos / Éxito / Advertencia / Error  |
| 4 | `#notif-rango-fecha` | Filtro de Fecha         | Seleccionar rango: hoy, ayer, 7 o 30 días        |
| 5 | `#notif-tabla`    | Tabla de Notificaciones    | Ver detalle y eliminar registros                 |

### Persistencia
Completar el tour guarda `notificaciones-tour-completed-v1 = "true"` en `localStorage`.

---

## 8. Utilidades

**Archivo:** `src/apps/notificaciones/utils/notification.utils.ts`

| Función                          | Descripción                                                  |
|----------------------------------|--------------------------------------------------------------|
| `cleanHtml(html)`                | Elimina etiquetas HTML (uso en CSV export)                   |
| `getStatusConfig(type)`          | Devuelve `{ bg, color, label }` según tipo de notificación   |
| `filterNotifications(items, q)`  | Filtra por ID, título o mensaje                              |

---

## 9. Flujo de Datos

```
Usuario abre /notificaciones
       ↓
HistorialNotificaciones montado
       ↓
servicioNotificaciones.obtenerRegistrosEntrega()
       ↓
setRegistros(datos)  →  filtrado cliente (tipo + fecha)
       ↓
NotificationTable muestra dataFiltrada
       ↓
Auto-refresh cada 30 s (setInterval)
```

**Flujo envío de notificación:**
```
CreateNotification
       ↓
Validación campos (título, mensaje, destino)
       ↓
servicioNotificaciones.enviarNotificacion(payload)
       ↓
POST http://192.168.19.245:5050/notify  [Bearer JWT]
       ↓
Éxito → snackbar + reset form
Error → mensaje de error inline
```

---

## 10. Estados de la Interfaz

| Estado          | Descripción                                             |
|-----------------|---------------------------------------------------------|
| Cargando        | LinearProgress visible, tabla sin datos                 |
| Sin resultados  | Mensaje "No hay notificaciones" en tabla vacía          |
| Filtrado activo | Badge contador refleja registros filtrados, no totales  |
| Modal abierto   | Backdrop + Dialog con detalle completo                  |
| Enviando        | Botón con spinner, campos deshabilitados                |

---

## 11. Dependencias

| Librería                  | Versión  | Uso                                        |
|---------------------------|----------|--------------------------------------------|
| `@mui/material`           | ^5.x     | Todos los componentes de UI                |
| `@mui/x-date-pickers`     | ^7.x     | Selectores de fecha/hora en CrearNotif.    |
| `dayjs`                   | ^1.x     | Manipulación de fechas (locale es)         |
| `react-joyride`           | ^2.x     | Tour guiado interactivo                    |
| `@directus/sdk`           | ^17.x    | Cliente Directus para lectura/escritura    |

---

## 12. Consideraciones Técnicas

**Seguridad:**
- Todas las llamadas al notificador incluyen `Authorization: Bearer <JWT>`
- El token se obtiene via `tokenDirectus.service.ts` con auto-refresh

**Rendimiento:**
- Filtrado 100% en cliente — sin llamadas extra al backend al cambiar filtros
- `useCallback` en `cargarDatos` para estabilizar la referencia en `setInterval`

**Accesibilidad:**
- Botones con `aria-label` en acciones de tabla
- Modal con foco atrapado (comportamiento MUI Dialog)

---

## 13. Glosario

| Término              | Definición                                                          |
|----------------------|---------------------------------------------------------------------|
| Terminal             | Equipo/punto de venta identificado por un código en el sistema      |
| Notificador          | Servicio independiente en `192.168.19.245:5050` que distribuye notifs|
| Grupo/Área           | Conjunto de terminales agrupadas por departamento o función         |
| Persistente          | Notificación que no desaparece automáticamente                      |
| Programada           | Notificación con fecha/hora de envío diferida                       |
| Recordatorio         | Notificación personal enviada a la terminal del usuario actual      |
