# Plan: Sistema de Gestión de Proyectos del Área de Sistemas

## 1. Resumen Ejecutivo

**Nombre propuesto:** Sistema de Registro y Medición de Proyectos de Sistemas (SRMPS)  
**Propósito:** Registrar y documentar todos los proyectos desarrollados por el área de sistemas, midiendo el impacto en tiempos y produtividade para justificar el trabajo ante gerencia y áreas comerciales.

---

## 2. Modelo de Datos (Entidades y Relaciones)

### 2.1 Entidad: Proyecto

| Campo            | Tipo        | Descripción                       |
| ---------------- | ----------- | --------------------------------- |
| id               | UUID        | Identificador único               |
| nombre           | String(255) | Nombre del proyecto               |
| area_beneficiada | String(100) | Área que se beneficia             |
| descripcion      | Text        | Descripción general               |
| encargados       | JSON Array  | Lista de responsables             |
| fecha_inicio     | Date        | Fecha de inicio                   |
| fecha_entrega    | Date        | Fecha de entrega                  |
| estado           | Enum        | planning, en_progreso, completado |
| creado_por       | String      | Usuario que registró              |
| fecha_creacion   | DateTime    | Timestamp                         |

### 2.2 Entidad: Proceso (Paso del Proyecto)

| Campo               | Tipo        | Descripción                     |
| ------------------- | ----------- | ------------------------------- |
| id                  | UUID        | Identificador único             |
| proyecto_id         | UUID FK     | Relación al proyecto            |
| nombre_paso         | String(255) | Nombre del paso/proceso         |
| tiempo_antes        | Integer     | Segundos antes (manual)         |
| tiempo_despues      | Integer     | Segundos después (automatizado) |
| frecuencia_tipo     | Enum        | diaria, semanal, mensual        |
| frecuencia_cantidad | Integer     | Veces que se ejecuta            |
| observaciones       | Text        | Notas adicionales               |
| orden               | Integer     | Orden del paso                  |

### 2.3 Entidad: Mejora (Post-Entrega)

| Campo          | Tipo        | Descripción                          |
| -------------- | ----------- | ------------------------------------ |
| id             | UUID        | Identificador único                  |
| proyecto_id    | UUID FK     | Relación al proyecto                 |
| titulo         | String(255) | Título de la mejora                  |
| descripcion    | Text        | Descripción detallada                |
| tipo           | Enum        | mejora, idea, bug, feedback          |
| prioridad      | Enum        | alta, media, baja                    |
| estado         | Enum        | pendiente, en_progreso, implementada |
| fecha_creacion | DateTime    | Timestamp                            |

---

## 3. Estructura de Directus (Colecciones)

### 3.1 Colección: `sistemas_proyectos`

```
- id (uuid, PK)
- nombre (string)
- area_beneficiada (string)
- descripcion (text)
- encargados (json)
- fecha_inicio (date)
- fecha_entrega (date)
- estado (enum: planning, en_progreso, completado)
- creado_por (string)
- fecha_creacion (datetime)
```

### 3.2 Colección: `sistemas_procesos`

```
- id (uuid, PK)
- proyecto (uuid, FK → sistemas_proyectos)
- nombre_paso (string)
- tiempo_antes (integer) - segundos
- tiempo_despues (integer) - segundos
- frecuencia_tipo (enum: diaria, semanal, mensual)
- frecuencia_cantidad (integer)
- observaciones (text)
- orden (integer)
```

### 3.3 Colección: `sistemas_mejoras`

```
- id (uuid, PK)
- proyecto (uuid, FK → sistemas_proyectos)
- titulo (string)
- descripcion (text)
- tipo (enum: mejora, idea, bug, feedback)
- prioridad (enum: alta, media, baja)
- estado (enum: pendiente, en_progreso, implementada)
- fecha_creacion (datetime)
```

---

## 4. Arquitectura de la Aplicación

### 4.1 Estructura de Archivos

```
src/apps/gestion_proyectos/
├── routes.tsx
├── types.ts
├── api/
│   ├── directus/
│   │   ├── create.ts
│   │   ├── read.ts
│   │   └── update.ts
├── components/
│   ├── ProyectoCard.tsx
│   ├── ProyectoForm.tsx
│   ├── ProcesoItem.tsx
│   ├── ProcesoForm.tsx
│   ├── MejoraItem.tsx
│   ├── MejoraForm.tsx
│   ├── ResumenTiempos.tsx
│   ├── FiltrosProyectos.tsx
│   └── MetricCard.tsx
├── hooks/
│   ├── useProyectos.ts
│   ├── useProcesos.ts
│   └── useCalculosTiempos.ts
├── pages/
│   ├── Home.tsx
│   ├── DetalleProyecto.tsx
│   ├── NuevoProyecto.tsx
│   ├── EditarProyecto.tsx
│   └── Informes.tsx
└── utils/
    ├── calculos.ts
    └── exportadores.ts
```

### 4.2 Rutas

- `/gestion-proyectos` - Dashboard principal
- `/gestion-proyectos/nuevo` - Crear proyecto
- `/gestion-proyectos/:id` - Ver detalle
- `/gestion-proyectos/:id/editar` - Editar proyecto
- `/gestion-proyectos/informes` - Informes y métricas

---

## 5. Funcionalidades Principales

### 5.1 Gestión de Proyectos

- Crear nuevo proyecto con información básica
- Editar proyecto existente
- Eliminar proyecto (con confirmación)
- Lista de proyectos con filtros (estado, área, fecha)
- Vista de detalle con todos los procesos y mejoras

### 5.2 Gestión de Procesos (Pasos)

- Agregar múltiples pasos a un proyecto
- Cada paso tiene: nombre, tiempo antes, tiempo después, frecuencia
- Reordenar pasos (drag & drop o botones)
- Editar paso individual
- Eliminar paso
- **Cálculo automático de reducción de tiempo**

### 5.3 Cálculos de Tiempos (Core Feature)

```
// Por cada proceso:
tiempo_ahorrado = tiempo_antes - tiempo_despues
ejecuciones_mes = frecuencia_cantidad * veces_por_mes
ahorro_mensual = tiempo_ahorrado * ejecuciones_mes

// Ejemplo del usuario:
- Digitar valores: 15s → 4s = 11s ahorrado
- Frecuencia: 20 veces/día = 100 veces/semana
- Ahorro semanal: 11s * 100 = 1100s = 18 minutos/semana
- Ahorro mensual: ~72 minutos/mes
```

### 5.4 Seguimiento Post-Entrega

- Registrar mejoras/ideas para cada proyecto
- Feedback de usuarios
- Estado de cada mejora
- Historial de cambios

### 5.5 Informes y Gráficos

- Resumen de proyectos por estado
- Total tiempo ahorrado (mes, año, total)
- Proyectos por área beneficiada
- Top proyectos con mayor impacto
- Exportar a PDF/Excel

---

## 6. Página Principal (Dashboard)

### 6.1 Header

- Título: "Gestión de Proyectos - Área de Sistemas"
- Botón: "Nuevo Proyecto"
- Filtros: Estado, Área, Fecha

### 6.2 Tarjetas de Resumen

- Total proyectos
- Proyectos activos
- Proyectos completados
- **Tiempo total ahorrado** (mes/año)

### 6.3 Lista de Proyectos

- Cards o tabla con:
  - Nombre del proyecto
  - Área beneficiada
  - Estado (badge)
  - Fecha inicio - entrega
  - Tiempo ahorrado total
  - Acciones (ver, editar, eliminar)

### 6.4 Vista de Detalle de Proyecto

- Información general
- Lista de procesos con tiempos
- Métricas calculadas
- Sección de mejoras/feedback

---

## 7. Valor Agregado del Sistema

1. **Justificación ante gerencia** - Métricas concretas del trabajo del área
2. **Historial de proyectos** - Todo queda documentado
3. **Medición de ROI** - Tiempo ahorrado = dinero ahorrado
4. **Mejora continua** - Feedback post-entrega
5. **Transparencia** - Qué se hace, para quién, y el impacto

---

## 8. Plan de Implementación (Fases)

### Fase 1: Estructura Base

- Crear colecciones en Directus
- Configurar rutas
- Tipos TypeScript
- API básica (CRUD)

### Fase 2: Frontend Core

- Formulario de proyecto
- Lista de proyectos
- Detalle de proyecto

### Fase 3: Gestión de Procesos

- Agregar/editar/eliminar pasos
- Formulario de proceso
- Reordenamiento

### Fase 4: Cálculos y Métricas

- Lógica de cálculo de tiempos
- Resumen de ahorros
- Gráficos

### Fase 5: Mejoras Post-Entrega

- Sección de mejoras
- Feedback de usuarios

### Fase 6: Informes

- Dashboard de métricas
- Exportación PDF/Excel

---

## 9. Pendientes para Confirmación

- [ ] Nombre final de la app (Gestión Proyectos / Registro Proyectos / something else?)
- [ ] ¿Necesitas incluir empleados específicos en "encargados"? ¿Ya tienes una lista en Directus?
- [ ] ¿Quieres incluir了这个 para que también sea visible en el home de GERENCIA (solo lectura)?
- [ ] ¿El cálculo de frecuencia debe incluir opciones adicionales (mensual, anual)?

---

_Documento creado para validación del usuario antes de implementación._
