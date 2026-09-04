# Manual Oficial de Políticas, Estándares de Datos y Seguridad en Directus — AppKancan

---

## 1. Introducción y Marco Normativo

El presente documento constituye la norma oficial de gobernanza de datos para la plataforma **AppKancan**. Su propósito es establecer los lineamientos obligatorios de diseño, nomenclatura, organización, idioma y seguridad aplicables a todas las colecciones, campos, relaciones y políticas administradas a través de **Directus**.

### 1.1. Alcance
Esta política aplica a todos los desarrolladores, arquitectos de software, administradores de base de datos y personal técnico que diseñe, modifique o mantenga modelos de información dentro del ecosistema AppKancan.

### 1.2. Directus como Capa de Gestión de Datos
En AppKancan, toda la estructura de la base de datos se modela y administra exclusivamente mediante el panel administrativo de Directus (Data Studio). Por lo tanto:
* No se ejecutan scripts manuales DDL de SQL en los entornos de base de datos; la creación de tablas, índices, llaves foráneas y tipos de datos se gestiona a través de la interfaz visual de colecciones y campos de Directus.
* Cada campo debe contar con su correspondiente configuración de interfaz visual, tipo de dato nativo, reglas de validación y permisos asociados.

---

## 2. Política Oficial de Idioma y Nomenclatura

Para garantizar la coherencia arquitectónica, la interoperabilidad de las APIs y la alineación con las mejores prácticas de la industria, se establece una separación estricta entre identificadores técnicos y descripciones funcionales.

### 2.1. Regla de Idioma Técnico (Inglés Obligatorio)
Todos los identificadores de bajo nivel deben registrarse estrictamente en **idioma inglés** y bajo el formato **snake_case** (caracteres en minúscula separados por guion bajo). Esta regla aplica sin excepción a:
1. Nombres de colecciones (tablas).
2. Nombres de campos (columnas).
3. Nombres de llaves foráneas y campos relacionales.
4. Nombres de roles de usuario.
5. Nombres de políticas de acceso (Policies).

### 2.2. Uso del Español (Documentación y Funcionalidad)
El idioma español se utiliza en los siguientes componentes:
1. Documentación técnica y funcional del repositorio.
2. Descripciones y textos de ayuda de campos en la interfaz de Directus.
3. Descripciones oficiales de las políticas de acceso.
4. Mensajes de validación e interfaz para los usuarios finales.

```
+-------------------------------------------------------------------------------+
|                             DISTRIBUCIÓN DE IDIOMAS                           |
+---------------------------------------+---------------------------------------+
|          EN INGLÉS (TÉCNICO)          |          EN ESPAÑOL (FUNCIONAL)       |
+---------------------------------------+---------------------------------------+
| - Nombres de colecciones              | - Descripciones de políticas          |
| - Nombres de campos                   | - Descripciones y etiquetas en UI     |
| - Relaciones y Foreign Keys           | - Mensajes de validación y errores    |
| - Nombres de políticas y roles        | - Documentación del repositorio       |
+---------------------------------------+---------------------------------------+
```

### 2.3. Estándar de Nomenclatura de Colecciones
* **Colecciones de Datos:** Deben nombrarse en **plural** o mediante un término colectivo representativo (por ejemplo: `prj_projects`, `core_stores`, `acc_invoices`).
* **Colecciones Intermedias / Tablas Pivote (Relaciones Many-to-Many):** Se nombran combinando ambas entidades en **singular**: `{entidad_principal}_{entidad_secundaria}` (por ejemplo: `user_role`, `project_tag`, `store_employee`).

### 2.4. Estándar de Nomenclatura de Campos
* **Campos Generales:** Palabras en minúscula separadas por guion bajo (por ejemplo: `start_date`, `total_amount`, `first_name`).
* **Campos Relacionales / Foreign Keys (Many-to-One):** Deben seguir obligatoriamente la convención `{entidad_singular}_id` (por ejemplo: `store_id`, `employee_id`, `project_id`, `user_id`).
* **Campos Booleanos:** Deben iniciar con un prefijo condicional que denote un estado booleano (`is_`, `has_`, `can_`, `allow_`), tales como `is_active`, `is_approved`, `has_discount`, `allow_notifications`.

### 2.5. Glosario de Términos Estandarizados

| Concepto de Negocio | Nombre Técnico Obligatorio | Términos No Permitidos |
| :--- | :--- | :--- |
| Tienda / Sucursal | `store` / `core_stores` | `tienda`, `sucursal` |
| Empleado / Personal | `employee` / `core_employees` | `empleado`, `personal` |
| Cargo / Puesto | `position` / `core_positions` | `cargo`, `puesto` |
| Presupuesto | `budget` / `com_budgets` | `presupuesto` |
| Novedad / Asistencia | `novelty` / `hr_attendance` | `novedad`, `asistencia` |
| Traslado / Muestras | `transfer` / `log_transfers` | `traslado`, `envio` |
| Factura / Recepción | `invoice` / `acc_invoices` | `factura`, `causacion` |
| Garantía | `warranty` / `acc_warranties` | `garantia` |
| Fecha de Inicio / Fin | `start_date` / `end_date` | `fecha_inicio`, `fecha_fin` |
| Estado / Etapa | `status` | `estado`, `fase` |
| Cantidad / Monto | `quantity` / `amount` | `cantidad`, `valor`, `precio` |
| Observaciones / Notas | `notes` / `description` | `observaciones`, `detalle` |

---

## 3. Clasificación y Prefijos por Áreas de Negocio

La arquitectura de datos de AppKancan divide las colecciones en dos grandes niveles jerárquicos para garantizar modularidad y evitar dependencias circulares.

### 3.1. Nivel 1: Colecciones Universales (`core_`)
Corresponde a entidades maestras cuyo contenido es consumido transversalmente por dos o más aplicaciones del ecosistema.
* Criterio: Si la información de una tabla es requerida tanto por Recursos Humanos como por                                                                                                         Comercial, Logística o Proyectos, dicha tabla debe ubicarse en el núcleo universal con el prefijo `core_`.
* Ejemplos: `core_users`, `core_roles`, `core_stores`, `core_employees`, `core_positions`, `core_companies`, `core_apps`, `core_warehouses`.

### 3.2. Nivel 2: Colecciones Departamentales o de Módulo
Corresponde a colecciones cuyos datos pertenecen exclusivamente al flujo funcional de un área de negocio específica.

| Prefijo | Área en Español | Área en Inglés | Módulos y Aplicaciones Asociadas | Ejemplos de Colecciones |
| :--- | :--- | :--- | :--- | :--- |
| `core_` | Universal | Core / Master | Datos compartidos por todo el sistema | `core_users`, `core_stores`, `core_employees` |
| `prj_` | Proyectos | Projects | Gestión de Proyectos, Procesos, Tareas | `prj_projects`, `prj_processes`, `prj_tasks` |
| `com_` | Comercio | Commerce | Presupuestos, Comisiones, Promociones | `com_budgets`, `com_settings`, `com_commissions` |
| `log_` | Logística | Logistics | Traslados de Mercancía, Muestras, Curvas | `log_transfers`, `log_samples`, `log_curve_scans` |
| `hr_` | Gestión Humana | Human Resources | Horarios, Asistencia, Normas de Tienda | `hr_schedules`, `hr_attendance`, `hr_store_rules` |
| `acc_` | Contabilidad | Accounting | Facturación, Resoluciones, Garantías | `acc_invoices`, `acc_resolutions`, `acc_goods_receipts` |
| `res_` | Reservas | Reservations | Reserva de Salas de Juntas y Recursos | `res_bookings`, `res_rooms`, `res_resources` |
| `sal_` | Ventas | Sales | Informes de Ventas y Cierres Diarios | `sal_reports`, `sal_daily_totals` |
| `mkt_` | Mercadeo | Marketing | Campañas Publicitarias y Material POP | `mkt_campaigns`, `mkt_banners` |
| `sys_` | Sistemas | Systems | Auditoría técnica y configuraciones core | `sys_logs`, `sys_notice_confirmations` |
| `adm_` | Administración | Administration | Contratos de Arriendo, Actas, Prórrogas | `adm_contracts`, `adm_position_history` |

---

## 4. Estándar de Configuración de Colecciones y Campos en Directus

Al registrar una colección en Directus, se debe configurar una secuencia ordenada de campos que asegure legibilidad y consistencia técnica.

### 4.1. Secuencia Estándar de Campos en Directus

1. **Identificador Primario:**
   * Nombre: `id`
   * Tipo en Directus: Entero Autonumérico (Integer / Big Integer) o UUID.
2. **Campos Relacionales (Foreign Keys Many-to-One):**
   * Nombre: `{entidad}_id` (por ejemplo: `store_id`, `project_id`).
   * Interfaz: Menú desplegable relacional configurado a la colección de destino.
3. **Códigos de Integración y Claves Naturales:**
   * Nombres: `code_ultra`, `document_number`, `sku`, `barcode`.
   * Tipo: String / Input.
4. **Campos de Negocio Principales:**
   * Nombres: `name`, `title`, `status`, `amount`, `order_index`.
   * Tipo: String, Dropdown de opciones o Numérico.
5. **Banderas de Control y Estados Booleanos:**
   * Nombres: `is_active`, `is_approved`, `is_closed`.
   * Tipo: Booleano (Toggle Switch) con valor por defecto definido (`true` o `false`).
6. **Fechas de Negocio:**
   * Nombres: `start_date`, `end_date`, `due_date`.
   * Tipo: Date o DateTime.
7. **Campos de Auditoría del Sistema (Obligatorios):**
   * `date_created`: Tipo DateTime, configurado con asignación automática de fecha al crear.
   * `date_updated`: Tipo DateTime, configurado con actualización automática al modificar.
   * `user_created`: Relación al usuario de Directus que creó el registro.
   * `user_updated`: Relación al usuario de Directus que modificó el registro.
8. **Campos Descriptivos y Extensos:**
   * Nombres: `description`, `notes`, `metadata`.
   * Tipo: Text (Área de texto enriquecido) o JSON / Repeater para estructuras complejas.

### 4.2. Tipos de Datos e Interfaces en Directus

| Requerimiento de Negocio | Tipo de Dato en Directus | Interfaz Visual Recomendada |
| :--- | :--- | :--- |
| Identificador autonumérico | Integer (Serial) | Input de solo lectura |
| Nombres, títulos y códigos | String | Input de texto estándar |
| Descripciones largas | Text | Textarea o Markdown |
| Valores monetarios y comisiones | Float / Decimal (12, 2) | Input numérico con 2 decimales |
| Porcentajes de cumplimiento | Float / Decimal (5, 2) | Input numérico |
| Estados de proceso | String | Dropdown con opciones fijas en inglés |
| Interruptores sí / no | Boolean | Toggle switch |
| Fechas de calendario | Date | Date picker |
| Horas de turno | Time | Time picker |
| Fecha y hora de auditoría | DateTime (Timestamptz) | DateTime picker (sistema) |
| Relación muchos a uno | Integer (Relacional M2O) | Dropdown de colección relacionada |
| Metadatos y configuraciones | JSON / JSONB | Editor de código JSON |

---

## 5. Políticas de Acceso y Roles de Seguridad en Directus

Directus v11 implementa un modelo de control de acceso granular basado en la separación de **Roles** (agrupaciones de usuarios) y **Policies** (conjuntos modulares de permisos sobre colecciones).

### 5.1. Nomenclatura Oficial de Políticas de Acceso
Cada política debe nombrarse en minúsculas (`snake_case`) iniciando con un prefijo funcional que declare explícitamente su alcance operativo:

| Prefijo de Política | Tipo de Operación Permitida | Ejemplo Oficial |
| :--- | :--- | :--- |
| `access_` | Acceso general a módulos, interfaces o paneles administrativos | `access_directus_app`, `access_admin_panel` |
| `read_` | Permiso exclusivo de consulta y lectura (SELECT) | `read_stores`, `read_commissions_admin`, `read_promotions` |
| `create_` | Permiso exclusivo de creación e inserción (INSERT) | `create_invoices`, `create_promotions` |
| `update_` | Permiso exclusivo de modificación (UPDATE) | `update_projects`, `update_attendance` |
| `delete_` | Permiso exclusivo de eliminación (DELETE) | `delete_records`, `delete_draft_projects` |
| `crud_` | Permiso completo sobre la colección (Create, Read, Update, Delete) | `crud_resolutions`, `crud_bookings` |
| `full_` | Control total funcional y estructural sobre el módulo | `full_projects`, `full_system_settings` |
| `manage_` | Administración de usuarios, roles, políticas y configuraciones | `manage_policies`, `manage_users` |

### 5.2. Estructura Obligatoria para Descripciones de Políticas
Toda política debe registrar una descripción formal en idioma español en el campo correspondiente de Directus, redactada bajo la siguiente estructura:

```
Permite [acción técnica u operativa] sobre [colección o módulo]. Asignada a [perfil o rol destinatario].
```

**Ejemplos de descripciones estandarizadas:**
* Política `read_stores`: *"Permite consultar el catálogo general de tiendas y sucursales. Asignada a todos los usuarios autenticados."*
* Política `read_commissions_admin`: *"Permite la lectura total de comisiones y presupuestos comerciales. Asignada a directores y administradores."*
* Política `create_invoices`: *"Permite registrar y causar facturas de proveedores. Asignada al equipo de contabilidad."*
* Política `manage_policies`: *"Permite crear, modificar y auditar políticas de seguridad. Asignada exclusivamente a administradores de sistemas."*

### 5.3. Tabla de Homologación de Políticas en AppKancan

| Nombre Legado | Nombre Oficial Estandarizado | Tipo | Descripción Oficial |
| :--- | :--- | :--- | :--- |
| `acceso_interfaz` | `access_directus_app` | Policy | Permite acceder a la interfaz web de Directus y navegación general. |
| `administracion` | `access_admin_panel` | Policy | Permite acceso a los paneles administrativos del sistema. |
| `adminPolitica` | `manage_policies` | Policy | Permite administrar políticas de control de acceso y permisos de Directus. |
| `basico` | `basic_user` | Role | Rol base para usuarios estándar de la plataforma. |
| `causarFactura` | `create_invoices` | Policy | Permite registrar y causar facturas de proveedores. |
| `comparar_archivos` | `access_compare_files` | Policy | Permite acceso a la utilidad de cruce y comparación de archivos. |
| `createPromociones` | `create_promotions` | Policy | Permite crear nuevas promociones comerciales. |
| `crudResoluciones` | `crud_resolutions` | Policy | Permite operaciones CRUD completas sobre resoluciones de facturación. |
| `gestionProyectos` | `full_projects` | Policy | Permite control integral sobre proyectos, tareas y procesos. |
| `leer_apps` | `read_apps` | Policy | Permite consultar el catálogo de aplicaciones asignadas al usuario. |
| `Público` | `public` | Role | Define los endpoints accesibles sin autenticación previa. |
| `readComisionesAdmin` | `read_commissions_admin` | Policy | Permite consultar reportes completos de comisiones para administradores. |
| `readComisionesTienda`| `read_commissions_store` | Policy | Permite consultar comisiones restringidas a la tienda del usuario. |
| `readTiendas` | `read_stores` | Policy | Permite lectura del catálogo de tiendas y sucursales. |
| `TrasladosJefezona` | `read_transfers_zone_manager` | Policy | Permite consultar traslados de tiendas asignadas a la zona del jefe. |

---

## 6. Procedimiento de Creación y Mantenimiento de Datos

Para introducir una nueva colección o modificar una existente en el entorno de producción de Directus, se debe seguir este procedimiento:

1. **Definición de Entidad y Alcance:** Determinar si la información requerida es universal (`core_`) o específica de un área funcional (`prj_`, `com_`, `log_`, `hr_`, `acc_`, `res_`, etc.).
2. **Definición de Campos en Inglés:** Establecer los nombres técnicos de los campos en inglés (`snake_case`), configurando llaves foráneas `{entidad}_id` y banderas booleanas con prefijo.
3. **Inclusión de Campos de Auditoría:** Configurar obligatoriamente `date_created`, `date_updated`, `user_created` y `user_updated`.
4. **Configuración de Permisos en Directus:**
   * Crear o reutilizar políticas con los prefijos oficiales (`read_`, `create_`, `crud_`).
   * Redactar la descripción funcional en español.
   * Asignar las políticas a los roles correspondientes.
5. **Actualización de Modelos en Código:** Reflejar las interfaces TypeScript correspondientes en `src/apps/[app]/types/` respetando los nombres exactos de los campos creados en Directus.
