# Guía de Estándares para Base de Datos - AppKancan

## Introducción

Esta guía establece las convenciones y estándares que todo el equipo debe seguir al trabajar con la base de datos de AppKancan. El objetivo es mantener una base de datos ordenada, coherente y fácil de mantener.

---

## ⚠️ Nota Importante: Nombres en Inglés

**TODOS los nombres de tablas, campos, y código SQL deben estar en INGLÉS.**
El resto de la documentación (explicaciones, ejemplos verbales) puede estar en español.

Esto asegura consistencia con nuestro código y facilita el trabajo en equipo internacional.

---

## 1. Convenciones de Nomenclatura

### Nombres de Tablas

- Usar **snake_case** en minúsculas
- Preferiblemente en plural o términos colectivos
- **Distinguir entre tablas universales y específicas de proyecto**:

#### Tablas Universales (con prefijo `core_`)

Son aquellas que se usan en **múltiples módulos** del sistema y son compartidas por toda la aplicación. Usamos el prefijo `core_` para identificarlas claramente:

| Tabla             | Descripción                      |
| ----------------- | -------------------------------- |
| `core_users`      | Usuarios del sistema             |
| `core_roles`      | Roles de usuario                 |
| `core_stores`     | Catálogo de tiendas              |
| `core_categories` | Categorías generales             |
| `core_companies`  | Compañías                        |
| `core_employees`  | Empleados                        |
| `core_positions`  | Cargos/Puestos                   |
| `core_apps`       | Aplicaciones/Módulos disponibles |

#### Tablas Específicas de Proyecto (con prefijo)

Son aquellas que pertenecen a un **módulo específico** y no se comparten:

| Prefijo          | Módulo               | Ejemplo                         |
| ---------------- | -------------------- | ------------------------------- |
| `gp_`            | Gestión de Proyectos | `gp_projects`, `gp_processes`   |
| `util_`          | Utilidades/Catálogos | `util_stores`, `util_config`    |
| `promo_`         | Promociones          | `promo_types`, `promo_stores`   |
| `inv_`           | Inventario           | `inv_movements`, `inv_products` |
| `hr_`            | Recursos Humanos     | `hr_employees`, `hr_contracts`  |
| `acc_`           | Contabilidad         | `acc_invoices`, `acc_reports`   |
| `comm_` o `com_` | Comisiones           | `comm_monthly`, `comm_settings` |

**Ejemplos:**

```sql
-- Tablas universales (se usan en varios módulos)
users
roles
stores
categories
companies

-- Tablas específicas de un proyecto (con prefijo)
gp_projects (gestión de proyectos)
gp_processes (procesos de proyectos)
promo_types (tipos de promociones)
comm_settings (configuración de comisiones)
```

### Nombres de Campos

- Siempre **snake_case** en minúsculas
- Nunca usar: mayúsculas, espacios, guiones, camelCase o kebab-case

| ❌ Incorrecto | ✅ Correcto  |
| ------------- | ------------ |
| startDate     | start_date   |
| ProjectId     | project_id   |
| FullName      | full_name    |
| totalAmount   | total_amount |

---

## 2. ¿Qué Tipo de Tabla Crear?

Antes de crear una nueva tabla, responde estas preguntas para determinar su tipo:

### Flujo de Decisión

```
┌─────────────────────────────────────────────────────────────┐
│ ¿La tabla almacenará datos que se usarán en múltiples apps  │
│ o módulos diferentes del sistema?                           │
└─────────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
        SÍ ════════►                     NO ════════►
           │                               │
           ▼                               ▼
┌─────────────────────┐          ┌─────────────────────────┐
│   TABLA UNIVERSAL   │          │ ¿Pertenece a un módulo  │
│   (prefijo core_)   │          │ específico del sistema? │
└─────────────────────┘          └─────────────────────────┘
                                          │
                          ┌───────────────┴───────────────┐
                          ▼                               ▼
                       SÍ ════════►                     NO ════════►
                          │                               │
                          ▼                               ▼
               ┌──────────────────┐            ┌──────────────────┐
               │ TABLA DE MÓDULO  │            │   TABLA DE       │
               │ (prefijo propio) │            │   UTILIDAD       │
               └──────────────────┘            │ (prefijo util_)  │
                                                └──────────────────┘
```

### Preguntas Clave

| Pregunta                             | Respuesta → Tipo de Tabla           |
| ------------------------------------ | ----------------------------------- |
| ¿Se usará en más de una app?         | SÍ → `core_` / NO → ver siguiente   |
| ¿Es un catálogo general del sistema? | SÍ → `core_` / NO → ver siguiente   |
| ¿Pertenece a un módulo específico?   | SÍ → `gp_`, `promo_`, `comm_`, etc. |
| ¿Es una tabla de ayuda/utilidad?     | SÍ → `util_`                        |

### Ejemplos de Decisión

| Escenario                               | Tipo      | Nombre          |
| --------------------------------------- | --------- | --------------- |
| Catálogo de tiendas para todas las apps | Universal | `core_stores`   |
| Roles de usuario del sistema            | Universal | `core_roles`    |
| Proyectos de gestión de proyectos       | Módulo    | `gp_projects`   |
| Configuración de comisiones             | Módulo    | `comm_settings` |
| Tipos de promociones                    | Módulo    | `promo_types`   |
| Catálogo de ciudades (uso general)      | Utilidad  | `util_cities`   |
| Configuración global de la app          | Utilidad  | `util_config`   |

### Sufijos Estándar

| Sufijo      | Uso                                 |
| ----------- | ----------------------------------- |
| `_id`       | Foreign keys (project_id, store_id) |
| `_date`     | Campos de fecha                     |
| `_time`     | Campos de hora                      |
| `_quantity` | Cantidades                          |
| `_total`    | Totales                             |
| `_status`   | Estados                             |
| `_notes`    | Observaciones                       |

---

## 2. Orden de Columnas en las Tablas

Cuando crees o modifiques una tabla, sigue este orden específico. Es nuestra **regla de oro** para mantener la consistencia:

### Jerarquía de Columnas

1. **ID principal** (siempre primero)
2. **Foreign Keys** (todas agrupadas)
3. **Códigos/Claves naturales** (code_ultra, document, sku)
4. **Campos de negocio principales** (name, status, order_index, discount)
5. **Booleanos y estados**
6. **Fechas y horas de negocio** (start_date, end_time)
7. **Auditoría** (date_created, date_updated, created_by)
8. **Campos opcionales/descriptivos**
9. **Campos grandes al final** (description, notes, JSONB)

---

## 3. Tipos de Datos Recomendados

| Campo                | Tipo                               | Ejemplo                                                           |
| -------------------- | ---------------------------------- | ----------------------------------------------------------------- |
| ID principal         | `SERIAL PRIMARY KEY` o `BIGSERIAL` | `id SERIAL PRIMARY KEY`                                           |
| Foreign Keys         | `INTEGER NOT NULL`                 | `project_id INTEGER NOT NULL`                                     |
| Nombres cortos       | `VARCHAR(255)`                     | `name VARCHAR(255)`                                               |
| Descripciones largas | `TEXT`                             | `description TEXT`                                                |
| Listas/árboles       | `JSONB`                            | `managers JSONB`                                                  |
| Fechas               | `DATE`                             | `start_date DATE`                                                 |
| Horas                | `TIME`                             | `start_time TIME`                                                 |
| Duraciones           | `INTERVAL`                         | `estimated_time INTERVAL`                                         |
| Auditoría            | `TIMESTAMP WITH TIME ZONE`         | `date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP` |
| Decimales            | `DECIMAL(p,s)`                     | `discount DECIMAL(5,2)`                                           |

---

## 4. Plantilla Estándar

Usa esta plantilla al crear nuevas tablas:

```sql
CREATE TABLE table_name (
    -- 1. Primary Key
    id SERIAL PRIMARY KEY,

    -- 2. Foreign Keys (agrupadas)
    project_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,

    -- 3-4. Campos principales de negocio
    name VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    order_index INTEGER NOT NULL,

    -- 5. Booleanos y estados
    is_active BOOLEAN DEFAULT true,

    -- 6. Fechas y horas de negocio
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME NOT NULL,
    end_time TIME,

    -- 7. Auditoría
    date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- 8-9. Opcionales y campos grandes (siempre al final)
    description TEXT,
    notes TEXT,
    managers JSONB
);
```

---

## 5. Ejemplos Reales del Proyecto

### gp_projects (Gestión de Proyectos)

```sql
CREATE TABLE gp_projects (
    id SERIAL PRIMARY KEY,

    -- Campos de negocio
    project_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'in_progress',

    -- Fechas
    start_date DATE NOT NULL,
    estimated_date DATE,
    delivery_date DATE,

    -- Opcionales
    benefit_area VARCHAR(255),
    description TEXT,
    managers JSONB,

    -- Auditoría
    date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### gp_processes (Procesos de Proyecto)

```sql
CREATE TABLE gp_processes (
    id SERIAL PRIMARY KEY,

    -- Foreign Key
    project_id INTEGER NOT NULL,

    -- Campos principales
    name VARCHAR(255) NOT NULL,
    order_index INTEGER NOT NULL,

    -- Tiempos
    time_before INTERVAL,
    time_after INTERVAL,
    frequency_type VARCHAR(20) NOT NULL,
    frequency_quantity INTEGER NOT NULL,
    days_of_week JSONB,

    -- Auditoría
    date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### util_stores (Catálogo de Tiendas)

```sql
CREATE TABLE util_stores (
    id SERIAL PRIMARY KEY,
    code_ultra INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL
);
```

### promos (Promociones)

```sql
CREATE TABLE promos (
    id SERIAL PRIMARY KEY,

    -- Foreign Key
    type_id INTEGER NOT NULL,

    -- Datos principales
    name VARCHAR(255) NOT NULL,

    -- Fechas y horas
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Valores
    discount DECIMAL(5,2) NOT NULL,

    -- Opcionales
    notes TEXT,

    -- Auditoría
    date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Buenas Prácticas

### Al Crear una Nueva Tabla

1. **Sigue la plantilla** - Usa el orden establecido
2. **Nombra correctamente** - snake_case, plural para tablas
3. **Define tipos adecuados** - No usar VARCHAR para todo
4. **Agrega auditoría** - date_created y date_updated
5. **Documenta** - Agrega comentarios si es necesario

### Al Modificar una Tabla Existente

1. **Mantén el orden** - No mezcles las columnas
2. **No inventar campos** - Solo reordena si es necesario
3. **Respeta los tipos** - No cambies tipos sin razón

---

## Resumen Rápido

| Regla  | Descripción                                                               |
| ------ | ------------------------------------------------------------------------- |
| Tablas | snake_case, plural o colectivo                                            |
| Campos | snake_case, minúsculas                                                    |
| Orden  | id → fk → códigos → negocio → booleanos → fechas → auditoría → opcionales |
| Tipos  | SERIAL, INTEGER, VARCHAR, TEXT, JSONB, DATE, TIME, INTERVAL               |

---

> **⚠️ IMPORTANTE:** Los nombres de tablas, campos y código SQL deben estar en INGLÉS. El resto de la documentación puede estar en español.

---

_Esta guía es de cumplimiento obligatorio para mantener la coherencia de nuestra base de datos. Cualquier duda, consultar con el líder técnico._
