# KANCAN · App KanCan

## MANUAL TÉCNICO Y FUNCIONAL DEL PANEL DE ADMINISTRACIÓN - VACANTES
**Sistema de Gestión de Postulaciones (Módulo Interno / Aplicativo)**  
*Versión 1.0 · Octubre 2026*  
*Naranka S.A.S.*

---

## TABLA DE CONTENIDO
1. Introducción y Objetivo del Aplicativo
2. Arquitectura General del Sistema
3. Estructura de Archivos del Módulo
4. Funcionamiento del Panel de Administración
5. Base de Datos en Directus
6. Estados del Proceso de Selección
7. Seguridad y Validaciones Implementadas
8. Módulo de Exportación a Excel
9. Manejo de Hojas de Vida (PDF)
10. Suite de Tests Automatizados
11. Manual de Uso — Reclutador / Gestión Humana
12. Glosario Técnico
13. Contacto y Soporte

---

## 1. INTRODUCCIÓN Y OBJETIVO DEL APLICATIVO

### 1.1 Descripción general
El módulo Vacantes es una aplicación web integrada dentro de la plataforma App KanCan. Su propósito principal es permitir al equipo de Gestión Humana revisar, clasificar y gestionar las postulaciones y hojas de vida recibidas para las tiendas de KanCan y Naranka.

### 1.2 Objetivos específicos del panel
* Centralizar la información de los candidatos en una base de datos segura.
* Permitir al equipo de Gestión Humana revisar, filtrar y clasificar postulaciones.
* Facilitar la visualización y descarga de hojas de vida en formato PDF.
* Exportar toda la información a Excel para análisis externo.
* Cambiar el estado de cada candidato con un solo clic.
* Mantener un histórico consultable de todas las postulaciones.

### 1.3 Beneficios del sistema

| Antes (proceso manual) | Con el sistema implementado |
| :--- | :--- |
| Recepción por correo electrónico | Sistema centralizado |
| Sin validación de datos | Validación completa y normalización |
| Búsqueda manual en carpetas | Buscador con múltiples filtros |
| Cambio de estado por WhatsApp | Cambio de estado con un clic |
| Sin historial ni métricas | Exportable a Excel con un clic |
| Riesgo de perder archivos | Almacenamiento estructurado en Directus |
| Sin control de duplicados | Detección automática de correos/cédulas repetidas |

---

## 2. ARQUITECTURA GENERAL DEL SISTEMA

### 2.1 Descripción de la arquitectura
El módulo está construido bajo una arquitectura cliente-servidor de tres capas. Cada capa tiene una responsabilidad específica y se comunica con las demás mediante HTTPS.

### 2.2 Componentes principales

| Capa | Tecnología | Función |
| :--- | :--- | :--- |
| **Frontend (SPA)** | React + TypeScript + Vite | Interfaz del panel de administración |
| **Backend (API)** | Node.js + Express | Valida, procesa y gestiona la comunicación con Directus |
| **CMS Headless** | Directus 11 | Base de datos, autenticación y almacenamiento |
| **Base de Datos** | MySQL / PostgreSQL | Persistencia de postulaciones |
| **Almacenamiento** | Local (carpeta `/uploads`) | Guarda los PDFs de las hojas de vida |

### 2.3 Flujo de cambio de estado
1. El reclutador abre el panel de Vacantes.
2. Busca al candidato usando filtros o el buscador.
3. Hace clic en el selector de Estado.
4. Elige el nuevo estado (En revisión, Entrevista, etc.).
5. El frontend envía un PATCH a Directus.
6. Directus actualiza el registro y devuelve la confirmación.
7. La tabla se actualiza automáticamente.

---

## 3. ESTRUCTURA DE ARCHIVOS DEL MÓDULO

### 3.1 Carpeta del módulo Vacantes
```text
src/apps/vacantes/
│
├── api/
│   └── directus/
│       ├── read.ts            → Lectura de postulaciones
│       └── write.ts           → Actualización de estados
│
├── components/
│   ├── DetalleModal.tsx       → Modal con detalle completo
│   └── EstadoSelect.tsx       → Selector de estado con colores
│
├── page/
│   └── VacantesPage.tsx       → Página principal del panel
│
└── routes.tsx                 → Registro de la ruta /vacantes