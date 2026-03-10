# Guía de Estándares para Base de Datos - AppKancan

## Introducción

Esta guía establece las convenciones y estándares que todo el equipo debe seguir al trabajar con la base de datos de AppKancan. El objetivo es mantener una base de datos ordenada, coherente y fácil de mantener.

---

## ⚠️ Nota Importante: Nombres en Inglés

**TODOS los nombres de tablas, campos, y código SQL deben estar en INGLÉS.**
El resto de la documentación (explicaciones, ejemplos verbales) puede estar en español.

---

## Sistema de Prefijos por Áreas de Negocio

### La Pregunta Clave

**¿La información de esta tabla le importa a otra ÁREA?**

```
┌─────────────────────────────────────────────────────────────┐
│ ¿Los datos de esta tabla son relevantes para               │
│ otras áreas del negocio diferentes a la propia?             │
└─────────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
        SÍ ════════►                     NO ════════►
           │                               │
           ▼                               ▼
┌─────────────────────┐          ┌─────────────────────────┐
│       CORE_         │          │   PREFIJO DE ÁREA       │
│   (Universales)     │          │    (Específico)        │
└─────────────────────┘          └─────────────────────────┘
```

---

## Nivel 1: `core_` - Universal

**Criterio**: Tablas cuya información le importa a **MÚLTIPLES ÁREAS** del negocio.

Si los datos de esta tabla son relevantes para 2 o más áreas diferentes, debe ser `core_`.

| Tabla             | Descripción              | ¿Por qué es core?                                      |
| ----------------- | ------------------------ | ------------------------------------------------------ |
| `core_users`      | Usuarios del sistema     | Le importa a: auth, todas las apps                     |
| `core_roles`      | Roles de usuario         | Le importa a: auth, todas las apps                     |
| `core_stores`     | Catálogo de tiendas      | Le importa a: ventas, comisiones, proyectos, logística |
| `core_companies`  | Compañías/Empresas       | Le importa a: todas las áreas                          |
| `core_employees`  | Empleados                | Le importa a: RRHH, comisiones, proyectos              |
| `core_positions`  | Cargos/Puestos           | Le importa a: RRHH, comisiones                         |
| `core_apps`       | Aplicaciones disponibles | Le importa a: auth, navegación                         |
| `core_warehouses` | Bodegas                  | Le importa a: logística, inventario                    |
| `core_categories` | Categorías               | Le importa a: ventas, productos, proyectos             |

---

## Nivel 2: Prefijos por ÁREA (en INGLÉS)

**Criterio**: Tablas específicas de un área del negocio. Su información solo le importa a esa área.

| Prefijo | Área (Español)   | Área (English)  | Apps que incluye                |
| ------- | ---------------- | --------------- | ------------------------------- |
| `prj_`  | Proyectos        | Projects        | Gestión de Proyectos            |
| `com_`  | Comercio         | Commerce        | Comisiones, Promociones, Ventas |
| `log_`  | Logística        | Logistics       | Traslados, Muestras             |
| `hr_`   | Recursos Humanos | Human Resources | Gestión de Personal             |
| `acc_`  | Contabilidad     | Accounting      | Facturación, Contabilización    |
| `res_`  | Reservas         | Reservations    | Reservas de Salas/Recursos      |
| `sal_`  | Ventas           | Sales           | Informes de Ventas              |
| `mkt_`  | Mercadeo         | Marketing       | Campañas, Publicidad            |
| `des_`  | Diseño           | Design          | Diseño gráfico, branding        |
| `prod_` | Producción       | Production      | Manufacturing, operaciones      |
| `sys_`  | Sistemas         | Systems         | TI, infraestructura             |
| `adm_`  | Administración   | Administration  | Gestión administrativa          |
| `mgt_`  | Gerencia         | Management      | Dirección, reportes ejecutivos  |

---

## Tabla Completa de Áreas

| Prefijo | Área Español     | Área English    | Descripción                                |
| ------- | ---------------- | --------------- | ------------------------------------------ |
| `core_` | Universal        | Universal       | Datos compartidos por todas las áreas      |
| `prj_`  | Proyectos        | Projects        | Gestión de proyectos y procesos            |
| `com_`  | Comercio         | Commerce        | Ventas, comisiones, promociones            |
| `sal_`  | Ventas           | Sales           | Información de ventas                      |
| `mkt_`  | Mercadeo         | Marketing       | Campañas, publicidad, análisis de mercado  |
| `des_`  | Diseño           | Design          | Diseño gráfico, branding, identidad visual |
| `prod_` | Producción       | Production      | Manufacturing, producción, operaciones     |
| `log_`  | Logística        | Logistics       | Traslados, muestras, distribución          |
| `inv_`  | Inventario       | Inventory       | Control de inventario, stock               |
| `hr_`   | Recursos Humanos | Human Resources | Empleados, nóminas, contratos              |
| `acc_`  | Contabilidad     | Accounting      | Facturación, libros contables              |
| `res_`  | Reservas         | Reservations    | Reservas de salas, recursos                |
| `sys_`  | Sistemas         | Systems         | TI, infraestructura, configuración         |
| `adm_`  | Administración   | Administration  | Gestión administrativa, documentos         |
| `mgt_`  | Gerencia         | Management      | Dirección, KPIs, reportes ejecutivos       |

### Ejemplos por Área

```sql
-- ============================================
-- AREA: PROJECTS (prj_)
-- ============================================
prj_projects      -- Projects
prj_processes     -- Project processes
prj_benefits     -- Benefits/Improvements

-- ============================================
-- AREA: COMMERCE (com_)
-- ============================================
com_budgets   -- Store budgets
com_settings     -- Commission settings
com_sales       -- Daily sales
com_promos      -- Promotions

-- ============================================
-- AREA: LOGISTICS (log_)
-- ============================================
log_transfers    -- Transfer requests
log_samples     -- Sample requests

-- ============================================
-- AREA: ACCOUNTING (acc_)
-- ============================================
acc_resolutions  -- Invoice resolutions
acc_invoices    -- Invoices

-- ============================================
-- AREA: HUMAN RESOURCES (hr_)
-- ============================================
hr_contracts     -- Contracts
hr_attendance   -- Attendance
```

---

## Cómo Determinar el Prefijo

### Paso 1: Identifica las áreas relacionadas

Pregúntate: ¿Qué áreas del negocio necesitan esta información?

| Si le importa a...  | Debe ser...                                        |
| ------------------- | -------------------------------------------------- |
| 3+ áreas diferentes | `core_`                                            |
| 2 áreas diferentes  | Evaluar si es `core_` o poner en el área principal |
| 1 sola área         | Prefijo del área                                   |

### Paso 2: Identifica el área principal

Si la tabla es de una sola área, ¿cuál es?

| Tabla                 | Área Principal | Prefijo |
| --------------------- | -------------- | ------- |
| Presupuesto de tienda | Commerce       | `com_`  |
| Proceso de proyecto   | Projects       | `prj_`  |
| Solicitud de traslado | Logistics      | `log_`  |
| Resolución de factura | Accounting     | `acc_`  |
| Campaña mercadeo      | Marketing      | `mkt_`  |
| Diseño de marca       | Design         | `des_`  |
| Orden de producción   | Production     | `prod_` |

### Paso 3: Ejemplos de decisión

| Tabla propuesta          | Áreas que le importan       | ¿Core o Área? | Prefijo             |
| ------------------------ | --------------------------- | ------------- | ------------------- |
| Presupuesto diario       | Comercio, Diseño, Marketing | Múltiples     | `core_budgets`      |
| Línea de trazo diseño    | Diseño, Sistemas            | Múltiples     | `core_design_lines` |
| Configuración comisiones | Solo Comercio               | Área          | `com_settings`      |
| Detalle proyecto         | Solo Proyectos              | Área          | `prj_details`       |

---

## Diagrama de Decisión para Nuevas Tablas

```
┌─────────────────────────────────────────────────────────────────┐
│                    NUEVA TABLA: ¿qué es?                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ ¿Es una entidad del negocio? │
              │ (tienda, usuario, empleado,  │
              │  bodega, compañía, cargo)   │
              └───────────────────────────────┘
                        │             │
                       SÍ             NO
                        │             │
                        ▼             ▼
            ┌───────────────┐   ┌───────────────────────────────┐
            │    CORE_      │   │ ¿Para qué sirve esta tabla?  │
            │ (Entidad del │   └───────────────────────────────┘
            │   negocio)   │               │
            └───────────────┘               ▼
                                  ┌───────────────────────────┐
                                  │ ¿Le importa a más de      │
                                  │ un área del negocio?      │
                                  └───────────────────────────┘
                                              │
                                  ┌───────────┴───────────┐
                                 SÍ                     NO
                                  │                     │
                                  ▼                     ▼
                        ┌───────────────┐    ┌─────────────────────┐
                        │    CORE_      │    │ ¿Qué área del       │
                        │ (múltiples   │    │ negocio usa esta    │
                        │   áreas)      │    │ tabla principalmente?│
                        └───────────────┘    └─────────────────────┘
                                                     │
                           ┌─────────┬─────────┬─────┴─────┬─────────┐
                          prj_     com_     log_       rh_      con_      res_
                       (Proyectos)(Comercio)(Logística)(RRHH)  (Contab.)(Reservas)
```

---

## Serie de Preguntas para Definir una Tabla

### Pregunta 1: Identidad

```
¿Esta tabla representa una entidad fundamental del negocio?
- Usuarios, Tiendas, Empleados, Cargos, Bodegas, Compañías

→ SÍ: Es CORE (core_users, core_stores, core_employees, etc.)
→ NO: Continúa a Pregunta 2
```

### Pregunta 2: Áreas

```
¿Esta tabla le importa a más de un área del negocio?

Áreas disponibles:
- prj_ = Proyectos
- com_ = Comercio (ventas, comisiones, promociones)
- log_ = Logística (traslados, muestras)
- rh_ = Recursos Humanos
- con_ = Contabilidad
- res_ = Reservas

→ SÍ (2+ áreas): Es CORE
→ NO: Continúa a Pregunta 3
```

### Pregunta 3: Área Principal

```
¿Cuál es el área principal que usa esta tabla?

Selecciona el prefijo correspondiente:
- prj_: Gestión de Proyectos
- com_: Comercio (ventas, comisiones, promociones)
- log_: Logística (traslados, muestras)
- rh_: Recursos Humanos
- con_: Contabilidad
- res_: Reservas
- ven_: Ventas
```

### Pregunta 4: Nombre de la Tabla

```
¿Cómo debe llamarse la tabla?

Reglas:
- snake_case en minúsculas
- Plural o término colectivo
- El nombre debe ser claro y descriptivo

Ejemplos:
- prj_projects (proyectos)
- com_presupuesto (presupuestos comerciales)
- log_solicitudes (solicitudes de logística)
```

---

## Checklist de Validación

Antes de finalizar una tabla, verifica:

- [ ] ¿Respondí las preguntas 1-4?
- [ ] ¿El prefijo corresponde al área correcta?
- [ ] ¿El nombre está en snake_case?
- [ ] ¿Está en plural o término colectivo?
- [ ] ¿El orden de columnas sigue la plantilla estándar?

---

## Nombres de Campos

- Siempre **snake_case** en minúsculas
- Nunca usar: mayúsculas, espacios, guiones, camelCase o kebab-case

| ❌ Incorrecto | ✅ Correcto  |
| ------------- | ------------ |
| startDate     | start_date   |
| ProjectId     | project_id   |
| FullName      | full_name    |
| totalAmount   | total_amount |

---

## Foreign Keys (FK)

**Regla**: `{tabla_referenciada}_id`

| ❌ Incorrecto | ✅ Correcto   |
| ------------- | ------------- |
| `id_user`     | `user_id`     |
| `id_employee` | `employee_id` |
| `id_store`    | `store_id`    |

**Por qué**: Es más legible y sigue el patrón "referenced_table_id".

---

## Tablas Pivote (Many-to-Many)

**Regla**: `{tabla_1}_{tabla_2}` (AMBOS en singular)

| ❌ Incorrecto         | ✅ Correcto        |
| --------------------- | ------------------ |
| `app_users`           | `user_app`         |
| `roles_users`         | `user_role`        |
| `products_categories` | `category_product` |

**Orden**: La tabla principal primero (la que tiene más sentido en el contexto del negocio).

### Plural o Singular

| Tipo            | Forma               | Ejemplo                    |
| --------------- | ------------------- | -------------------------- |
| Tablas de datos | Plural              | `users`, `stores`          |
| Tablas pivote   | Singular + Singular | `user_role`, `project_tag` |
| Foreign keys    | Singular + `_id`    | `user_id`                  |

---

## Ejemplo Completo con FK y Pivote

```sql
-- Tabla principal (Projects)
CREATE TABLE prj_projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla con FK
CREATE TABLE prj_tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,    -- FK: referencia a prj_projects
    employee_id INTEGER NOT NULL,    -- FK: referencia a core_employees
    store_id INTEGER,                -- FK: referencia a core_stores
    title VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    start_date DATE,
    end_date DATE
);

-- Tabla pivote (Many-to-Many): Usuarios con Roles
CREATE TABLE user_role (
    user_id INTEGER NOT NULL,       -- FK: referencia a core_users
    role_id INTEGER NOT NULL,        -- FK: referencia a core_roles
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Tabla pivote (Many-to-Many): Proyectos con Tags
CREATE TABLE project_tag (
    project_id INTEGER NOT NULL,    -- FK: referencia a prj_projects
    tag_id INTEGER NOT NULL,        -- FK: referencia a core_tags
    PRIMARY KEY (project_id, tag_id)
);
```

---

## Resumen: Reglas de Nomenclatura

### 1. Prefijos de Tablas (Áreas)

| Tipo           | Prefijo | Ejemplo                       |
| -------------- | ------- | ----------------------------- |
| Universal      | `core_` | `core_users`, `core_stores`   |
| Projects       | `prj_`  | `prj_projects`, `prj_tasks`   |
| Commerce       | `com_`  | `com_settings`, `com_budgets` |
| Sales          | `sal_`  | `sal_reports`                 |
| Marketing      | `mkt_`  | `mkt_campaigns`               |
| Design         | `des_`  | `des_brand`                   |
| Production     | `prod_` | `prod_orders`                 |
| Logistics      | `log_`  | `log_transfers`               |
| Inventory      | `inv_`  | `inv_stock`                   |
| HR             | `hr_`   | `hr_contracts`                |
| Accounting     | `acc_`  | `acc_invoices`                |
| Reservations   | `res_`  | `res_bookings`                |
| Systems        | `sys_`  | `sys_config`                  |
| Administration | `adm_`  | `adm_docs`                    |
| Management     | `mgt_`  | `mgt_reports`                 |

### 2. Nombres de Tablas

| Tipo            | Forma               | Ejemplo                    |
| --------------- | ------------------- | -------------------------- |
| Tablas de datos | Plural              | `users`, `stores`          |
| Tablas pivote   | Singular + Singular | `user_role`, `project_tag` |

### 3. Nombres de Campos

- snake_case en minúsculas
- Ejemplo: `start_date`, `full_name`, `total_amount`

### 4. Foreign Keys

- Forma: `{tabla}_id`
- Ejemplo: `user_id`, `employee_id`, `store_id`

### 5. Orden de Columnas

1. ID principal (`id`)
2. Foreign Keys
3. Códigos naturales (`code_ultra`, `sku`)
4. Campos principales (`name`, `status`)
5. Booleanos
6. Fechas de negocio
7. Auditoría (`date_created`, `date_updated`)
8. Campos opcionales
9. Campos grandes (`description`, `JSONB`)

---

## Orden de Columnas en las Tablas

Cuando crees o modifiques una tabla, sigue este orden específico:

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

## Tipos de Datos Recomendados

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

## Notas Importantes

1. **Las áreas pueden crecer** - Si creas una nueva app, evalúa si pertenece a un área existente o si necesitas una nueva

2. **Migración futura** - Si una tabla `core_` termina siendo solo de un área, puedes moverla. Si una tabla de área termina siendo relevante para otras, migrarla a `core_`

---

> **⚠️ IMPORTANTE:** Los nombres de tablas, campos y código SQL deben estar en INGLÉS. El resto de la documentación puede estar en español.

---

_Esta guía es de cumplimiento obligatorio para mantener la coherencia de nuestra base de datos. Cualquier duda, consultar con el líder técnico._
