# Guía de Políticas y Roles en Directus - AppKancan

## Introducción

Directus (v11+) utiliza **Policies** (conjuntos de permisos) y **Roles** (grupos de usuarios) para controlar el acceso a la información. Esta guía establece las convenciones para mantener consistencia.

---

## ⚠️ Nota Importante: Nombres en Inglés

**TODOS los nombres de políticas y roles deben estar en INGLÉS.**
Las explicaciones y descripciones pueden estar en español.

---

## 1. Reglas Obligatorias

### Nombres de Políticas y Roles

- Usar **snake_case** en minúsculas (igual que tablas y campos)
- Siempre en inglés

### Prefijos según Tipo de Permiso

Estos prefijos son la mejor práctica recomendada por la comunidad Directus:

| Prefijo   | Uso                                                 | Ejemplo                    |
| --------- | --------------------------------------------------- | -------------------------- |
| `access_` | Acceso general (interfaz, menús, apps)              | `access_interfaz_directus` |
| `read_`   | Solo lectura                                        | `read_stores`              |
| `create_` | Solo creación                                       | `create_invoices`          |
| `update_` | Solo edición                                        | `update_projects`          |
| `delete_` | Solo eliminación                                    | `delete_records`           |
| `crud_`   | CRUD completo (create + read + update + delete)     | `crud_resolutions`         |
| `full_`   | Control total (incluye acciones especiales)         | `full_projects`            |
| `manage_` | Gestión administrativa (políticas, configuraciones) | `manage_policies`          |

### Entidades

- Usar singular o plural según cómo se usa en las tablas
- Ejemplos: `stores`, `promotions`, `commissions`

### Roles

- Nombres cortos y claros (sin prefijos de acción)
- Ejemplos: `administrator`, `basic`, `public`, `store_manager`

---

## 2. Plantilla de Descripción

Siempre usa esta estructura para las descripciones de políticas:

```
Permite [acción] sobre [entidad]. Asignada a [público o rol específico].
```

**Ejemplo:**

- "Allows reading stores for store-level users."

---

## 3. Conversión de Políticas Actuales

Aquí está la tabla de conversión de tus políticas actuales a los nuevos nombres estándar:

| Nombre Actual           | Nombre Recomendado            | Tipo   | Descripción Estandarizada                                                     |
| ----------------------- | ----------------------------- | ------ | ----------------------------------------------------------------------------- |
| acceso_interfaz         | `access_interfaz_directus`    | Policy | Permite acceso a la interfaz completa de Directus (menús, navegación y apps). |
| administracion          | `access_administracion`       | Policy | Permite acceso completo al módulo de administración.                          |
| adminPolitica           | `manage_policies`             | Policy | Permite crear, editar y eliminar políticas de acceso.                         |
| basico                  | `rol_basic`                   | Role   | Rol básico para acceder a la aplicación.                                      |
| causarFactura           | `create_invoices`             | Policy | Permite crear facturas nuevas.                                                |
| comparar_archivos       | `access_compare_files`        | Policy | Permite comparar archivos en el sistema.                                      |
| createPromociones       | `create_promotions`           | Policy | Permite crear nuevas promociones.                                             |
| crudResoluciones        | `crud_resolutions`            | Policy | Permite CRUD completo sobre resoluciones.                                     |
| gestionProyectos        | `full_projects`               | Policy | Permite gestión completa de proyectos (CRUD + acciones especiales).           |
| leer_apps               | `read_apps`                   | Policy | Permite leer la lista de aplicaciones y accesos.                              |
| Público                 | `public`                      | Role   | Controla qué datos de la API están disponibles sin autenticar.                |
| readComisionesAdmin     | `read_commissions_admin`      | Policy | Permite lectura de comisiones para usuarios administradores.                  |
| readComisionesComercial | `read_commissions_commercial` | Policy | Permite lectura de comisiones para usuarios comerciales.                      |
| readComisionesTienda    | `read_commissions_store`      | Policy | Permite lectura de comisiones para usuarios de tienda.                        |
| readPromociones         | `read_promotions`             | Policy | Permite lectura de promociones.                                               |
| readReservaSalasAdmin   | `read_meeting_rooms_admin`    | Policy | Permite lectura de reservas de salas para administradores.                    |
| ReadReservasUser        | `read_meeting_rooms_user`     | Policy | Permite lectura de reservas para usuarios finales.                            |
| readTiendas             | `read_stores`                 | Policy | Permite lectura de tiendas.                                                   |
| TrasladosJefezona       | `read_transfers_zone_manager` | Policy | Permite lectura de traslados para jefes de zona.                              |

---

## 4. Cómo Aplicar los Cambios en Directus

### Paso a Paso

1. Ve a **Settings → Access Control → Policies**
2. Edita cada política:
   - Cambia el **Nombre** al nuevo (snake_case en inglés)
   - Pega la **Descripción** estandarizada
3. Repite para todas las políticas
4. En **Roles**, renombra los roles a snake_case:
   - "basic" → `basic_role`
   - "Público" → `public`

---

## 5. Ejemplo de Uso en Código

Cuando uses políticas en el código:

```typescript
// ✅ Correcto - Nombre en inglés
const canSeeConfig = () => hasPolicy("read_commissions_admin");
const canAssignEmployees = () =>
  hasPolicy("read_commissions_admin") || hasPolicy("read_commissions_store");

// ❌ Incorrecto - Nombre en español o mal formato
const canSeeConfig = () => hasPolicy("leerComisionesAdmin");
```

---

## 6. Resumen de Prefijos

| Prefijo   | Significado           |
| --------- | --------------------- |
| `access_` | Acceso general        |
| `read_`   | Lectura               |
| `create_` | Creación              |
| `update_` | Actualización         |
| `delete_` | Eliminación           |
| `crud_`   | Todas las operaciones |
| `full_`   | Control total         |
| `manage_` | Administración        |

---

> **⚠️ IMPORTANTE:** Los nombres de políticas y roles deben estar en INGLÉS con formato snake_case. Las descripciones pueden estar en español.

---

_Esta guía es de cumplimiento obligatorio para mantener la consistencia de nuestro sistema de permisos. Cualquier duda, consultar con el líder técnico._
