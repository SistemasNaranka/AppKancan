# KANCAN · App KanCan
## MANUAL TÉCNICO Y FUNCIONAL: MÓDULO DE VACANTES Y EVALUACIÓN CON IA
**Sistema Integral de Gestión de Postulaciones y Evaluación Automatizada con Google Gemini (Relación 1 a 1)**

| Ficha del documento | Detalle |
| :--- | :--- |
| **Versión:** | 3.2 · Octubre 2026 |
| **Desarrollado para:** | Naranka S.A.S. (KanCan Jeans Colombia) |
| **Alcance:** | Panel de administración de postulaciones + módulo de evaluación automática de hojas de vida con IA |

---

## TABLA DE CONTENIDO
1. [Introducción y Objetivo del Aplicativo](#1-introducción-y-objetivo-del-aplicativo)
2. [Arquitectura General del Sistema y Ecosistema de IA](#2-arquitectura-general-del-sistema-y-ecosistema-de-ia)
3. [Estructura de Archivos del Módulo (Frontend y Backend)](#3-estructura-de-archivos-del-módulo-frontend-y-backend)
4. [Funcionamiento del Panel de Administración](#4-funcionamiento-del-panel-de-administración)
5. [Modelo de Datos en Directus (Relación Directa 1 a 1)](#5-modelo-de-datos-en-directus-relación-directa-1-a-1)
6. [Flujo Automático (Webhook) para IA en Directus](#6-flujo-automático-webhook-para-ia-en-directus)
7. [Motor de Inteligencia Artificial (Google Gemini) y Modelos Fallback](#7-motor-de-inteligencia-artificial-google-gemini-y-modelos-fallback)
8. [Módulo Backend (Node.js + Express)](#8-módulo-backend-nodejs--express)
9. [Módulo Frontend (React + Vite), Componentes y Asistente de IA](#9-módulo-frontend-react--vite-componentes-y-asistente-de-ia)
10. [Estados del Proceso de Selección y Semáforo de IA](#10-estados-del-proceso-de-selección-y-semáforo-de-ia)
11. [Seguridad, Validaciones e Infraestructura](#11-seguridad-validaciones-e-infraestructura)
12. [Módulo de Exportación a Excel](#12-módulo-de-exportación-a-excel)
13. [Manejo de Hojas de Vida (PDF) y Seguridad de Archivos](#13-manejo-de-hojas-de-vida-pdf-y-seguridad-de-archivos)
14. [Suite de Tests Automatizados](#14-suite-de-tests-automatizados)
15. [Manual de Uso: Reclutador / Gestión Humana](#15-manual-de-uso-reclutador--gestión-humana)
16. [Glosario Técnico](#16-glosario-técnico)
17. [Contacto y Soporte Tecnológico](#17-contacto-y-soporte-tecnológico)

---

## 1. INTRODUCCIÓN Y OBJETIVO DEL APLICATIVO

### 1.1 Descripción general
El módulo **Vacantes** es una aplicación web integrada dentro de la plataforma **App KanCan**. Su propósito principal es permitir al equipo de Gestión Humana recibir, almacenar, clasificar y evaluar las postulaciones y hojas de vida (CV en formato PDF) de los candidatos para las tiendas de KanCan y Naranka, apoyándose en Inteligencia Artificial (**Google Gemini**) para la evaluación automática de cada perfil.

### 1.2 Objetivos específicos del panel
* Centralizar la información de los candidatos en una base de datos segura y normalizada.
* Automatizar la evaluación de currículums mediante un motor de IA (Google Gemini) con análisis 1 a 1 contra el cargo al que se postula el candidato.
* Facilitar la revisión, filtrado y clasificación mediante un semáforo visual de puntajes.
* Visualizar y descargar hojas de vida en formato PDF con control estricto de sesión.
* Cambiar el estado de cada candidato con un solo clic.
* Exportar toda la información a Excel para análisis gerencial.
* Mantener un histórico consultable de todas las postulaciones y estados del proceso.

### 1.3 Beneficios del sistema

| Antes (proceso manual) | Con el sistema implementado (con IA) |
| :--- | :--- |
| Recepción caótica por correo electrónico | Sistema centralizado y automatizado |
| Sin validación de datos | Validación estricta y normalización |
| Búsqueda manual en carpetas | Buscador avanzado con múltiples filtros |
| Cambio de estado por WhatsApp | Cambio de estado interactivo con un clic |
| Sin historial ni métricas | Reportes exportables a Excel con filtros |
| Riesgo de perder archivos | Almacenamiento estructurado en Directus |
| Sin control de duplicados | Detección automática de correos/cédulas repetidas |
| Revisión lenta sujeta a fatiga | Evaluación instantánea 1 a 1 por IA (Google Gemini) |

---

## 2. ARQUITECTURA GENERAL DEL SISTEMA Y ECOSISTEMA DE IA

### 2.1 Descripción de la arquitectura
El sistema opera bajo una arquitectura híbrida cliente-servidor de tres capas, distribuida entre la nube y la red local de la empresa. Cada capa tiene una responsabilidad específica y se comunica con las demás mediante HTTPS.

### 2.2 Componentes principales

| Capa | Tecnología | Función principal y ubicación |
| :--- | :--- | :--- |
| **Frontend (SPA)** | React + TypeScript + Vite + Material UI | Panel de administración interactivo. Alojado en Vercel. |
| **Backend (API)** | Node.js + Express | Lógica de negocio, gestión de locks, conversión a Base64 y llamadas a IA. Alojado en Render. |
| **CMS Headless** | Directus 11 | Gestión de datos, autenticación, flujos automáticos (webhooks) y archivos. Servidor local Naranka. |
| **Base de Datos** | MySQL | Persistencia estructurada de postulaciones y cargos. |
| **Almacenamiento** | Directus (carpeta `/uploads`) | Guarda los PDFs de las hojas de vida. |
| **Túnel Seguro** | Cloudflare Tunnel | Conecta Render con el Directus local sin exponer puertos del router. |
| **Motor de IA** | Google AI Studio (API Gemini) | Evaluación algorítmica de los PDFs mediante modelos con sistema de fallback. |

### 2.3 Flujo de cambio de estado
1. El reclutador abre el panel de Vacantes.
2. Busca al candidato usando filtros o el buscador.
3. Hace clic en el selector de Estado.
4. Elige el nuevo estado (*En revisión, Entrevista, etc.*).
5. El frontend envía un `PATCH` a Directus.
6. Directus actualiza el registro y devuelve la confirmación.
7. La tabla se actualiza automáticamente.

### 2.4 Flujo de evaluación automática con IA
1. El candidato se postula a un cargo y se crea el registro en `app_applications` con su PDF.
2. El Flow de Directus detecta el evento `items.create` y envía un `POST` con el `applicationId` al backend en Render.
3. El backend activa un candado (*lock*) en memoria para ese candidato, evitando ejecuciones duplicadas.
4. Obtiene el registro y la descripción del cargo (`app_positions.descripcion`), descarga el PDF desde Directus y lo convierte a Base64.
5. Envía el PDF y la rúbrica de 100 puntos a Google Gemini, saltando al siguiente modelo de respaldo si hay error 429 o 503.
6. Gemini devuelve un JSON estructurado; el resultado queda guardado en los campos `ai_score` y `ai_analysis` del registro.
7. El panel muestra el puntaje con su semáforo y el análisis detallado del candidato.

---

## 3. ESTRUCTURA DE ARCHIVOS DEL MÓDULO (FRONTEND Y BACKEND)

### 3.1 Carpeta del módulo en el frontend
```text
src/apps/vacantes/
│
├── api/
│   └── directus/
│       ├── read.ts   → Lectura de postulaciones y descarga de PDFs
│       └── write.ts  → Actualización de estados y datos
│
├── components/
│   ├── DetalleModal.tsx    → Modal con la ficha completa del candidato
│   ├── EstadoSelect.tsx    → Selector de estado con colores oficiales
│   ├── AsistenteIA.tsx     → Modal flotante: evaluación por lotes (10 CVs)
│   ├── ModalAnalisisIA.tsx → Panel lateral: desglose de IA y preguntas
│   └── AccionIA.tsx        → Chip con semáforo y puntaje de IA
│
├── page/
│   └── VacantesPage.tsx    → Página principal (tabla, filtros, exportación)
│
└── routes.tsx              → Registro de la ruta /vacantes en el enrutador
```

### 3.2 Descripción de los archivos del frontend

| Archivo | Responsabilidad |
| :--- | :--- |
| `read.ts` | Capa de lectura contra Directus: `getApplications()`, `abrirCv()`, `formatearFecha()` y helpers de lectura. |
| `write.ts` | Capa de escritura contra Directus: `updateApplicationStatus()` para actualizar el estado. |
| `DetalleModal.tsx` | Modal que muestra todos los datos del candidato al hacer clic en 👁️. |
| `EstadoSelect.tsx` | Dropdown con colores por cada estado del proceso. |
| `AsistenteIA.tsx` | Modal flotante que evalúa lotes de hasta 10 CVs, con filtro de caché para omitir candidatos ya evaluados. |
| `ModalAnalisisIA.tsx` | Panel lateral con el desglose numérico, las fortalezas y las preguntas "A Verificar" para la entrevista. |
| `AccionIA.tsx` | Chip visual con el semáforo y el puntaje de IA de cada candidato. |
| `analizarHojasDeVida.ts` | Lógica del frontend que dispara el análisis de hojas de vida con IA a través del proxy `/ia/gemini/extraer`. |
| `VacantesPage.tsx` | Componente principal con tabla, filtros, búsqueda y exportación. |
| `routes.tsx` | Registra la ruta `/vacantes` en el enrutador de la app. |

### 3.3 Archivos del backend

| Archivo | Responsabilidad |
| :--- | :--- |
| `server/routes/ia-vacantes.js` | Ruta del motor de IA: recibe el aviso del webhook, aplica el candado, descarga el PDF, lo convierte a Base64, consulta a Gemini con modelos de respaldo y guarda el resultado. |
| `public/index.html` | Formulario público de postulación (con el logo de KanCan en el encabezado). |
| `public/styles.css` | Estilos del formulario público. |
| `public/form.js` | Lógica del formulario público en el navegador: captura de datos y envío de la postulación. |
| `directus.js` | Cliente de Directus del backend (Node/CommonJS): crea el registro con `createItem` y convierte la fecha de consentimiento a hora de Colombia antes de guardarla. |
| `.env` | Variables de entorno: conexión a Directus, límites de seguridad y puerto (ver sección 8.7). |

---

## 4. FUNCIONAMIENTO DEL PANEL DE ADMINISTRACIÓN

### 4.1 Descripción
El panel de administración está en la ruta `/vacantes` y es accesible solo para usuarios autenticados en Directus que tengan los permisos adecuados.

### 4.2 Elementos del panel

| Elemento | Función |
| :--- | :--- |
| **Encabezado** | Muestra el título 'Postulaciones' y el contador de resultados |
| **Buscador** | Busca por cédula, nombre, correo, teléfono, ciudad, estado o cargo |
| **Filtro Ciudad** | Filtra por ciudad con botón X para limpiar |
| **Filtro Cargo** | Filtra por cargo con botón X para limpiar |
| **Chips de estado** | Muestra el conteo por estado y filtra al hacer clic |
| **Tabla de datos** | Muestra las postulaciones con 11 columnas, incluido el puntaje de IA |
| **Paginación** | Permite elegir entre 5, 10, 25 o 50 filas por página |
| **Botón Exportar** | Descarga la información filtrada en formato Excel |
| **Botón ✨ IA Asistente** | Botón flotante que abre el modal para evaluar lotes de hasta 10 postulaciones con IA |

### 4.3 Columnas de la tabla
1. **Tipo** — Fuente: `document_type`
2. **Documento** — Fuente: `document_number`
3. **Nombre** — Fuente: `full_name`
4. **Teléfono** — Fuente: `phone`
5. **Ciudad** — Fuente: `city`
6. **Experiencia** — Fuente: `years_experience`
7. **Cargo** — Fuente: Relación directa con `app_positions` (`app_positions_id`)
8. **Puntaje IA** — Fuente: `ai_score` (chip con semáforo)
9. **Estado** — Fuente: `status` (selector con colores)
10. **Fecha de postulación** — Fuente: `date_created`
11. **Acción** — Fuente: Botones 👁️ y 📄

### 4.4 Acciones sobre cada postulación
* **👁️:** Abre el detalle completo del candidato y el panel lateral con el análisis de IA (desglose, fortalezas y preguntas a verificar).
* **📄:** Abre la hoja de vida en PDF.
* **Selector Estado:** Cambia el estado del candidato.

### 4.5 Filtros por estado (chips)
Cada chip muestra el nombre del estado y el conteo de candidatos en ese estado. Ejemplo: `'Recibido (12)'` indica que hay 12 candidatos en estado Recibido. Al hacer clic en un chip, la tabla se filtra automáticamente. Al hacer clic en la X del chip activo, se quita el filtro.

---

## 5. MODELO DE DATOS EN DIRECTUS (RELACIÓN DIRECTA 1 A 1)

> **CAMBIO DE ARQUITECTURA DE DATOS:** Se eliminó definitivamente la antigua tabla intermedia M2M (`app_applications_positions`). Ahora el sistema opera bajo una relación `ForeignKey` directa de 1 a 1: cada postulación apunta a un único cargo específico, permitiendo a la IA realizar una evaluación mucho más precisa contra la descripción de esa vacante.

### 5.1 Colección principal: `app_applications`

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | Integer (auto) | Identificador único auto-incremental |
| `document_type` | String | Tipo de documento (CC, CE, PPT) |
| `document_number` | String | Número de documento normalizado, sin puntos |
| `full_name` | String | Nombre completo del candidato |
| `email` | String | Correo electrónico |
| `phone` | String | Teléfono de contacto / WhatsApp |
| `city` | String | Ciudad de residencia |
| `education_level` | String | `bachiller`, `tecnico_tecnologo` o `profesional` |
| `years_experience` | Integer | Años de experiencia laboral (1 a 99) |
| `cv` | UUID (File) | Referencia al archivo PDF en `directus_files` |
| `app_positions_id` | ForeignKey | Relación directa (1 a 1) con la tabla `app_positions` |
| `ai_score` | Integer | Puntaje calculated por la IA (0 a 100) |
| `ai_analysis` | JSON | Estructura JSON con desglose, fortalezas y preguntas de verificación |
| `consent_text` | Text | Texto de autorización aceptado |
| `consent_accepted_at` | Timestamp | Fecha y hora del consentimiento |
| `status` | String | Estado actual del proceso de selección |
| `date_created` | Timestamp | Fecha y hora de creación del registro |

### 5.2 Colección de cargos: `app_positions`
Almacena las vacantes disponibles. Cuenta con el campo crítico `descripcion`, que contiene el perfil requerido y los requisitos del cargo exacto que lee la Inteligencia Artificial.

### 5.3 Colecciones relacionadas

| Colección | Función |
| :--- | :--- |
| `app_positions` | Catálogo de cargos disponibles, con su descripción y requisitos |
| `directus_files` | Almacena los archivos PDF subidos |
| `directus_users` | Usuarios del sistema con rol, API Key de IA y lista de modelos (campo `models_ia`) |

---

## 6. FLUJO AUTOMÁTICO (WEBHOOK) PARA IA EN DIRECTUS

Para que el sistema analice a los candidatos de manera automática en el instante en que postulan (sin intervención manual), se configura un Flow en Directus que dispara un Webhook hacia el backend en Render.

### Guía paso a paso para el equipo de Sistemas:
1. **¿Cómo encontrarlo?:** En el panel de Directus (ej. `http://192.168.19.245:8055`), ir al menú lateral izquierdo, hacer clic en **Ajustes (⚙️)** y seleccionar la sección **Flujos (Flows)**. Hacer clic en '+' para crear uno nuevo.
2. **Nombre sugerido:** `'Evaluación Automática de IA — Vacantes'`.
3. **Configurar el disparador (Trigger):**
   * **Tipo:** `Event Hook`
   * **Acción:** `Action (Non-Blocking)` *(vital para no bloquear la interfaz del usuario)*
   * **Alcance (Scope):** `items.create`
   * **Colección:** `app_applications`
4. **Configurar la operación Webhook:**
   * Agregar una operación `Webhook / Request URL`.
   * **Método:** `POST`
   * **URL:** `https://[tu-backend].onrender.com/api/ia/vacantes/analizar`
   * **Headers:** `Content-Type: application/json`
   * **Body (JSON):** `{"applicationId": "{{ $trigger.key }}"}`
5. **Permisos de ejecución ($full):**
   * **IMPORTANTE:** Seleccionar el lienzo general y, en el panel derecho, buscar **Accountability** (Responsabilidad) y cambiarlo a **`$full`**. Esto evita que Directus rechace la petición por falta de sesión en procesos automáticos de fondo.
6. **Activar el flujo:** Comprobar que el interruptor superior derecho esté en **Activo** (azul) y guardar.

---

## 7. MOTOR DE INTELIGENCIA ARTIFICIAL (GOOGLE GEMINI) Y MODELOS FALLBACK

### 7.1 Modelos y sistema de respaldo
El sistema obtiene dinámicamente la lista de modelos desde el perfil del usuario en Directus (campo `models_ia`). Para mitigar saturaciones o el error 503, implementa un sistema de respaldo automático en estricto orden de prioridad:

| Modelo Gemini | Prioridad | Propósito |
| :--- | :--- | :--- |
| `gemini-3.8-flash` | 1 (Principal) | Máxima inteligencia analítica y precisión. |
| `gemini-3.6-flash` | 2 (Respaldo 1) | Alta capacidad de procesamiento. |
| `gemini-3.5-flash-lite` | 3 (Respaldo 2) | Modelo rápido y ligero. |
| `gemini-3.1-flash-lite` | 4 (Último recurso) | Máxima disponibilidad de cuota de emergencia. |

### 7.2 El prompt matemático (rúbrica de 100 puntos)
La IA evalúa el currículum contra el cargo único asignado y retorna un JSON estructurado con la siguiente rúbrica exacta:

$$\text{Puntaje Total} = \text{ExpCargo} + \text{ExpRetail} + \text{Habilidades} + \text{Formación}$$

| Criterio | Puntaje |
| :--- | :--- |
| Experiencia en el cargo exacto | 0 a 40 pts |
| Experiencia en Retail / Moda / Ventas | 0 a 25 pts |
| Habilidades clave (caja, inventario, atención) | 0 a 25 pts |
| Formación académica | 0 a 10 pts |
| **Total Máximo** | **100 pts** |

---

## 8. MÓDULO BACKEND (NODE.JS + EXPRESS)

### 8.1 Descripción general y despliegue
El backend es una aplicación Node.js + Express alojada en Render. Cumple tres funciones:
1. Servir el formulario público de postulación.
2. Recibir y validar las postulaciones antes de guardarlas en Directus.
3. Ejecutar el motor de evaluación con IA.

Se comunica con el Directus local de Naranka a través de un Cloudflare Tunnel, sin exponer puertos del router.

| Aspecto | Detalle |
| :--- | :--- |
| **Tecnología** | Node.js + Express |
| **Alojamiento** | Render |
| **Conexión con Directus** | Cloudflare Tunnel (servicio de Windows en la oficina) |
| **Monitoreo** | UptimeRobot consulta `/api/health` cada 5 minutos para evitar suspensión de Render |
| **Archivo principal IA** | `server/routes/ia-vacantes.js` |

### 8.2 Rutas y endpoints

| Ruta | Uso |
| :--- | :--- |
| `/api/ia/vacantes/analizar` | Evalúa a un candidato con IA. Lo invoca el Flow de Directus (`POST`) con `{"applicationId": "<id>"}`. |
| `/api/health` | Verificación de estado del servidor; consultado por UptimeRobot cada 5 minutos. |
| `/ia/gemini/extraer` | Proxy hacia la API de Gemini que usa el frontend para el Asistente de IA. |
| `/` (carpeta `public/`) | Sirve el formulario público de postulación (`index.html`, `styles.css` y `form.js`). |

### 8.3 Flujo interno del motor de IA
Al recibir una llamada en `/api/ia/vacantes/analizar`:
1. Recibe el `applicationId` enviado por el webhook de Directus.
2. Consulta el candado en memoria: si ese candidato ya está en proceso, se descarta la solicitud duplicada.
3. Marca al candidato como en proceso con `enProceso.add(applicationId)`.
4. Lee de Directus el registro de la postulación y la descripción del cargo asignado (`app_positions.descripcion`).
5. Descarga el PDF de la hoja de vida desde Directus y lo convierte a Base64.
6. Obtiene del perfil del usuario en Directus la lista de modelos (`models_ia`) y la API Key.
7. Envía a Gemini el PDF en Base64 junto con el prompt y la rúbrica de 100 puntos, probando los modelos en orden de prioridad.
8. Ante un error 429 (cuota agotada) o 503 (saturación), aplica reintentos exponenciales y salta al siguiente modelo.
9. Recibe el JSON estructurado y guarda el puntaje y el análisis (`ai_score` y `ai_analysis`) en Directus.
10. Libera el candado (`enProceso.delete(applicationId)`).

### 8.4 Sistema de candado (Lock)
Utiliza un `Set` en memoria (`enProceso.add(applicationId)`) para prevenir ejecuciones simultáneas duplicadas sobre el mismo candidato.

### 8.5 Procesamiento de PDFs en Base64
El backend descarga el archivo PDF directamente desde Directus y lo convierte a Base64 para enviarlo a la API de Google Gemini, sin depender de librerías externas de extracción de texto.

### 8.6 Formulario público de postulación
Express sirve la carpeta `public/` con el formulario. Cuando un candidato envía su postulación:
1. Normaliza datos: correo en minúsculas y número de documento sin puntos ni espacios.
2. Verifica firma binaria (*magic bytes*) de PDF real y tamaño máximo (`MAX_PDF_MB`).
3. Valida que no exista otra postulación con el mismo correo o cédula.
4. Sube el PDF a Directus en la carpeta `DIRECTUS_CV_FOLDER`.
5. Crea el registro en `app_applications` mediante `createItem`.
6. Guarda la fecha de consentimiento (`consent_accepted_at`) convertida a hora de Colombia (`directus.js`).

### 8.7 Variables de entorno (`.env`)

| Variable | Descripción |
| :--- | :--- |
| `DIRECTUS_URL` | URL del servidor Directus (ej. `http://192.168.19.245:8055`) |
| `DIRECTUS_TOKEN` | Token de API de Directus que usa el backend |
| `DIRECTUS_CV_FOLDER` | UUID de la carpeta de Directus donde se guardan las hojas de vida |
| `RATE_LIMIT_MAX` | Máximo de solicitudes por IP por minuto (valor actual: `30`) |
| `MAX_PDF_MB` | Tamaño máximo permitido para cada PDF en MB (valor actual: `5`) |
| `ENFORCE_HTTPS` | Activa (`1`) o desactiva (`0`) la obligatoriedad de HTTPS |
| `PORT` | Puerto en el que escucha Express (valor actual: `3000`) |

---

## 9. MÓDULO FRONTEND (REACT + VITE), COMPONENTES Y ASISTENTE DE IA

### 9.1 `VacantesPage.tsx` (página principal)
Componente principal del módulo registrado en `/vacantes`. Reúne la tabla de postulaciones con 11 columnas, paginación, buscador universal, filtros por ciudad/cargo, chips de estado, botón de exportación a Excel y el botón flotante ✨ IA Asistente.

### 9.2 `DetalleModal.tsx`
Modal que se abre con el ícono 👁️ y muestra la ficha completa del candidato: datos personales, de contacto, educación, experiencia, cargo y estado.

### 9.3 `EstadoSelect.tsx`
Selector desplegable con los 6 estados del proceso y sus colores oficiales. Guarda los cambios mediante `updateApplicationStatus()` (`PATCH`).

### 9.4 `AsistenteIA.tsx` (modal flotante)
Modal para evaluar lotes de hasta 10 currículums. Permite seleccionar el cargo y cuenta con filtro de caché para omitir candidatos evaluados, con opción de forzar reevaluación.

### 9.5 `ModalAnalisisIA.tsx` (panel lateral)
Panel lateral que expone el contenido de `ai_analysis`:
* Desglose numérico por cada criterio de la rúbrica.
* Fortalezas identificadas en el perfil.
* Preguntas "A Verificar" sugeridas para la entrevista.

### 9.6 `AccionIA.tsx` (chip de semáforo)
Chip visual que muestra el puntaje de IA en la tabla y lo colorea según el semáforo: Verde (75 a 100), Amarillo (50 a 74) y Rojo (0 a 49).

---

## 10. ESTADOS DEL PROCESO DE SELECCIÓN Y SEMÁFORO DE IA

### 10.1 Los 6 estados

| Estado | Color Hex | Significado |
| :--- | :--- | :--- |
| **Recibido** | `#FEF3C7` | La postulación llegó y está pendiente de revisión |
| **En revisión** | `#DBEAFE` | El equipo de RRHH está evaluando |
| **Preseleccionado** | `#EDE9FE` | El candidato pasó el primer filtro |
| **Entrevista** | `#FFEDD5` | Tiene entrevista programada |
| **Contratado** | `#DCFCE7` | Fue contratado. Fin exitoso |
| **Rechazado** | `#FEE2E2` | No continuó en el proceso |

### 10.2 Semáforo visual de puntuación de IA

| Nivel | Puntaje | Color | Significado y acción |
| :--- | :--- | :--- | :--- |
| **Alto** | 75 - 100 pts | 🟢 Verde | Candidato óptimo. Llamar a entrevista de inmediato. |
| **Medio** | 50 - 74 pts | 🟡 Amarillo | Candidato con potencial. Evaluar en entrevista. |
| **Bajo** | 0 - 49 pts | 🔴 Rojo | No cumple con los requisitos mínimos del cargo. |

---

## 11. SEGURIDAD, VALIDACIONES E INFRAESTRUCTURA

### 11.1 Medidas de seguridad
* **Rate limiting:** Máximo 30 solicitudes por IP por minuto.
* **Validación MIME:** Verificación por firmas binarias (*magic bytes*) para validar PDFs reales.
* **Normalización:** Correos en minúsculas y documentos sin puntos ni espacios.
* **Cloudflare Tunnel:** Servicio de Windows para conectar Render con Directus de forma segura.
* **UptimeRobot:** Monitor HTTP apuntando a `/api/health` cada 5 minutos.

### 11.2 Permisos de acceso en Directus (`rrhh_vacantes`)

| Colección | Permiso |
| :--- | :--- |
| `app_applications` | Lectura y actualización (para cambiar estados) |
| `app_positions` | Lectura |
| `directus_files` | Lectura (necesaria para abrir las hojas de vida) |

---

## 12. MÓDULO DE EXPORTACIÓN A EXCEL

Descarga las postulaciones en formato `.xlsx` (`postulaciones-YYYY-MM-DD.xlsx`) respetando automáticamente todos los filtros activos aplicados en la tabla (búsqueda, ciudad, cargo o estado).

---

## 13. MANEJO DE HOJAS DE VIDA (PDF) Y SEGURIDAD DE ARCHIVOS

1. El reclutador hace clic en el botón 📄.
2. El frontend solicita el archivo mediante `readAssetRaw()` adjuntando el token de sesión.
3. Directus verifica permisos y devuelve el stream del PDF.
4. El frontend crea un Blob y abre una pestaña nueva en el navegador.

> **NOTA DE SEGURIDAD:** El archivo **NO** se sirve por URL directa (`/assets/uuid`) porque devolvería `403 Forbidden`. Se debe usar siempre `readAssetRaw()` con la sesión activa.

---

## 14. SUITE DE TESTS AUTOMATIZADOS

* **Total de tests:** 31 (pruebas unitarias e integrales)
* **Resultado:** 31 pasados (100% de éxito)
* **Comando de ejecución:**
```bash
npm test
```

---

## 15. MANUAL DE USO: RECLUTADOR / GESTIÓN HUMANA

1. **Ingresar al panel:** Acceder a la URL `/vacantes` e iniciar sesión.
2. **Revisar nuevos:** Filtrar por el chip 'Recibido' y ordenar por 'Puntaje IA' para ver primero los perfiles Verdes.
3. **Evaluar lotes:** Presionar el botón flotante **✨ IA Asistente**, seleccionar el cargo y procesar hasta 10 CVs.
4. **Revisar detalle:** Hacer clic en 👁️ para abrir las fortalezas y preguntas de entrevista, y en 📄 para abrir el PDF.
5. **Actualizar estado:** Utilizar el selector desplegable en la tabla para cambiar el estado (*Entrevista, Contratado, etc.*).
6. **Exportar:** Aplicar los filtros deseados y hacer clic en **Exportar a Excel**.

---

## 16. GLOSARIO TÉCNICO

| Término | Definición |
| :--- | :--- |
| **API** | Interfaz de programación para comunicación entre sistemas. |
| **Backend** | Servidor Node.js + Express que procesa la lógica y la IA. |
| **Base64** | Codificación de archivos PDF en cadena de texto dentro de JSON. |
| **Cloudflare Tunnel** | Conecta el backend en Render con el Directus local de forma segura. |
| **Fallback** | Mecanismo de respaldo que salta a un modelo de IA alternativo si el principal falla. |
| **ForeignKey** | Clave foránea que establece la relación directa 1 a 1 entre postulación y cargo. |
| **Lock (candado)** | Control en memoria que evita evaluar un candidato dos veces simultáneamente. |
| **Webhook** | Aviso automático de Directus al backend cuando se crea un nuevo registro. |

---

## 17. CONTACTO Y SOPORTE TECNOLÓGICO

* **Soporte técnico:** Departamento de Sistemas — Naranka S.A.S.
* **Jefe de Sistemas:** Emilton
* **Repositorio GitHub:** `https://github.com/SistemasNaranka/Vacancies`
* **Módulo:** `/vacantes`


---
*App KanCan · Módulo Vacantes y Evaluación con IA · Versión 3.2 · Naranka S.A.S. · Octubre 2026*