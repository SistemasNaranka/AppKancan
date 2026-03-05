# Política de Idioma del Proyecto - AppKancan

## Fecha de Vigencia: Marzo 2026

---

## Introducción

A partir de **marzo de 2026**, el proyecto AppKancan adoptará el **inglés** como idioma principal para todo el código fuente, estructuras de datos y configuraciones del sistema. Esta decisión busca mejorar la mantenibilidad del código, facilitar la colaboración futura y mantener coherencia con los estándares de la industria del desarrollo de software.

---

## 📌 Regla Principal

| Elemento                                                     | Idioma                       | Ejemplo                                      |
| ------------------------------------------------------------ | ---------------------------- | -------------------------------------------- |
| **Código fuente** (componentes, funciones, hooks, variables) | Inglés                       | `useUserAuth`, `getUserData`                 |
| **Nombres de archivos**                                      | Inglés                       | `useHybridExtractor.ts`, `authProvider.tsx`  |
| **Base de datos** (tablas, campos)                           | Inglés                       | `gp_projects`, `start_date`                  |
| **Políticas y roles**                                        | Inglés                       | `read_commissions_admin`, `manage_policies`  |
| **Comentarios en código**                                    | Inglés (preferido) o Español | `// Get user data from API`                  |
| **Documentación**                                            | Español                      | "Esta función obtiene los datos del usuario" |
| **Descripciones**                                            | Español                      | Descripción de políticas, mensajes de UI     |

---

## 📋 Elementos que Deben Estar en Inglés

### 1. Código Fuente

```typescript
// ✅ Correcto
const userData = await getUserInformation();
const isAuthenticated = checkAuthStatus();
function calculateCommission(amount: number): number { ... }

// ❌ Incorrecto
const datosUsuario = await obtenerInformacion();
const estaAutenticado = verificarAutenticacion();
function calcularComision(monto: number): number { ... }
```

### 2. Nombres de Archivos

```
// ✅ Correcto
src/auth/hooks/useAuth.ts
src/apps/comisiones/components/CommissionChart.tsx
src/services/directus/auth.service.ts

// ❌ Incorrecto
src/auth/hooks/usarAutenticacion.ts
src/apps/comisiones/components/GraficoComisiones.tsx
```

### 3. Base de Datos

```sql
-- ✅ Correcto
CREATE TABLE gp_projects (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(255),
    start_date DATE,
    status VARCHAR(30)
);

-- ❌ Incorrecto
CREATE TABLE gp_proyectos (
    id SERIAL PRIMARY KEY,
    nombre_proyecto VARCHAR(255),
    fecha_inicio DATE,
    estado VARCHAR(30)
);
```

### 4. Políticas y Roles (Directus)

```
// ✅ Correcto
- read_commissions_admin
- create_invoices
- manage_policies
- access_interfaz

// ❌ Incorrecto
- leerComisionesAdmin
- crearFacturas
- administrarPoliticas
```

### 5. Funciones y Variables

```typescript
// ✅ Correcto
const getTotalSales = () => { ... };
const calculateDiscount = (price: number, discount: number) => { ... };
const isUserActive = user.status === 'active';

// ❌ Incorrecto
const obtenerTotalVentas = () => { ... };
const calcularDescuento = (precio: number, descuento: number) => { ... };
const usuarioActivo = usuario.estado === 'activo';
```

---

## 📝 Elementos que Pueden Estar en Español

### 1. Documentación

```markdown
# Documentación del Sistema

Esta guía explica cómo funciona el módulo de comisiones.
Los cálculos se realizan basándose en...
```

### 2. Descripciones de Políticas

```
Permite leer las comisiones de los administradores.
Asignado a usuarios con rol de administrador.
```

### 3. Comentarios Explicativos (opcional)

```typescript
// Obtener información del usuario desde la API
// NOTA: This can also be in English: // Get user information from API
const userInfo = await fetchUserData();
```

### 4. Mensajes de UI (opcional - зависит del contexto)

```typescript
// Se puede usar español o inglés según preferencia del equipo
alert("Usuario creado exitosamente");
// or / o
alert("User created successfully");
```

---

## 🤖 Recomendaciones: Uso de IA para Traducción

Si no tienes conocimiento del idioma inglés, te recomendamos usar herramientas de IA para facilitar la transición:

### Traductores Online

| Herramienta      | Enlace               | Uso                       |
| ---------------- | -------------------- | ------------------------- |
| Google Translate | translate.google.com | Traducción rápida         |
| DeepL            | deepl.com            | Traducción más natural    |
| Bing Translator  | bing.com/translator  | Integración con Microsoft |

### Asistentes de IA para Código

| Herramienta    | Enlace                      | Uso                                 |
| -------------- | --------------------------- | ----------------------------------- |
| GitHub Copilot | github.com/features/copilot | Sugiere código en inglés            |
| ChatGPT        | chat.openai.com             | Explica y traduce código            |
| Claude         | claude.ai                   | Ayuda con refactorización en inglés |

### Cómo Usar un Traductor para Variables

1. **Identifica** la variable o función en español
2. **Traduce** el concepto a inglés (no palabra por palabra)
3. **Aplica** la nomenclatura correcta

| Español          | Inglés (Código) |
| ---------------- | --------------- |
| obtener_usuarios | getUsers        |
| lista_productos  | productsList    |
| fecha_creacion   | createdAt       |
| total_ventas     | totalSales      |
| estado_activo    | activeStatus    |

---

## 🔧 Ayudas para la Transición

### Patrones de Nomenclatura Comunes

| Concepto Español | Patrón Inglés | Ejemplo             |
| ---------------- | ------------- | ------------------- |
| obtener/get      | get           | `getUsers()`        |
| crear            | create        | `createUser()`      |
| actualizar       | update        | `updateUser()`      |
| eliminar         | delete        | `deleteUser()`      |
| lista/listado    | list          | `usersList`         |
| número/cantidad  | count         | `itemsCount`        |
| total            | total         | `salesTotal`        |
| primero/first    | first         | `firstItem`         |
| último/last      | last          | `lastItem`          |
| activo           | active        | `isActive`          |
| disponible       | available     | `isAvailable`       |
| verificar        | check/verify  | `checkPermission()` |
| calcular         | calculate     | `calculateTotal()`  |

### Conversión de camelCase a snake_case

```javascript
// Si tienes variables en español
const nombreUsuario = "Juan";
const fechaNacimiento = "1990-01-01";

// Convierte a inglés
const userName = "Juan";
const birthDate = "1990-01-01";

// snake_case para nombres de funciones
function obtener_usuario() {} // ❌
function getUser() {} // ✅
```

---

## ⚠️ Nota para el Equipo

- **Sin penalizaciones**: Esta es una guía de transición, no una regla estrictiva con penalizaciones
- **Mejora progresiva**: Se espera que cada nuevo archivo o modificación siga el estándar
- **Ayuda mutua**: Si ves algo en español en el código, siéntete libre de sugerir la versión en inglés
- **Documentación vigente**: La documentación existente puede permanecer en español

---

## Recursos Adicionales

- [Google Translate](https://translate.google.com)
- [DeepL Translator](https://www.deepl.com)
- [ChatGPT](https://chat.openai.com)
- [GitHub Copilot](https://github.com/features/copilot)

---

> **Nota importante:** Esta política es una guía de referencia. El objetivo es mejorar la calidad y consistencia del código. Si tienes sugerencias, por favor comunícalas al líder técnico.

---

_Documento creado: Marzo 2026_
_Última actualización: Marzo 2026_
