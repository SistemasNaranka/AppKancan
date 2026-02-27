# Configuración de Despliegue - AppKancan

## 22.6.1. Configuración de Despliegue

### 22.6.1.1 Docker Compose

```yaml
services:
  appkancan:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "11000:11000"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=11000
```

### 22.6.1.2 Dockerfile

El Dockerfile utiliza un proceso de build de dos etapas para optimizar el tamaño de la imagen final:

```dockerfile
# ===========================
# Etapa 1: Build (Node Debian)
# ===========================
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# Copiar package.json del proyecto principal
COPY package*.json ./

# Instalar dependencias
RUN npm install --no-optional --force

# Copiar el resto del código
COPY . .

# Instalar versión nativa de rollup para Linux
RUN npm install @rollup/rollup-linux-x64-gnu --force

# Construir el proyecto frontend
RUN npm run build

# ===========================
# Etapa 2: Producción (Node.js)
# ===========================
FROM node:20-bullseye-slim

WORKDIR /app

# Copiar archivos del frontend construido
COPY --from=builder /app/dist ./dist

# Copiar el servidor backend
COPY server ./server

# Instalar dependencias del servidor
WORKDIR /app/server
RUN npm install --production

# Volver al directorio principal
WORKDIR /app

# Exponer puerto
EXPOSE 11000

# Variables de entorno
ENV PORT=11000
ENV NODE_ENV=production

# Iniciar el servidor unificado (frontend + API)
CMD ["node", "server/index.js"]
```

### 22.6.1.3 Variables de Entorno

#### Frontend (Vite)

| Variable                          | Descripción                              | Ejemplo                       |
| --------------------------------- | ---------------------------------------- | ----------------------------- |
| `VITE_DIRECTUS_URL`               | URL del servidor Directus                | `https://directus.kancan.com` |
| `VITE_VENTAS_API_URL`             | URL del servidor de ventas (API Express) | `/api` (proxy)                |
| `VITE_WEBHOOK_USERNAME`           | Usuario para webhooks de traslados       | -                             |
| `VITE_WEBHOOK_PASSWORD`           | Contraseña para webhooks de traslados    | -                             |
| `VITE_WEBHOOK_URL_POST_TRASLADOS` | URL del webhook para aprobar traslados   | -                             |
| `VITE_WEBHOOK_URL_TRASLADOS`      | URL del webhook para obtener traslados   | -                             |

#### Backend (Express - server/)

El servidor Express (`server/index.js`) usa las siguientes variables de entorno:

| Variable      | Descripción                    | Ejemplo      |
| ------------- | ------------------------------ | ------------ |
| `PORT`        | Puerto del servidor            | `11000`      |
| `NODE_ENV`    | Entorno de ejecución           | `production` |
| `DB_HOST`     | Host de la base de datos MySQL | `localhost`  |
| `DB_USER`     | Usuario de la base de datos    | `root`       |
| `DB_PASSWORD` | Contraseña de la base de datos | -            |
| `DB_NAME`     | Nombre de la base de datos     | `ventas`     |

> **Nota**: Las variables de entorno se configuran en el archivo `.env` del proyecto y en la plataforma de despliegue (Coolify).

### 22.6.1.4 Integración con Inteligencia Artificial

AppKancan incluye integración con IA para la extracción de datos de facturas PDF en el módulo de **Contabilización de Facturas**.

#### Proveedores de IA

El sistema utiliza un enfoque híbrido con dos proveedores:

1. **Google Gemini** (Principal)
   - API key configurada por usuario en Directus (campo `key_gemini`)
   - Modelo configurable (campo `modelo_ia`, ej: `gemma-3-27b-it`)
   - La API key se almacena encriptada en Directus

2. **Ollama** (Fallback)
   - Servidor local de Ollama como alternativa
   - Se usa cuando Gemini no está disponible o falla

#### Campos de Usuario en Directus

Los siguientes campos deben existir en la colección de usuarios de Directus:

| Campo                      | Tipo    | Descripción                                     |
| -------------------------- | ------- | ----------------------------------------------- |
| `key_gemini`               | String  | API key de Google Gemini (encriptada)           |
| `modelo_ia`                | String  | Modelo de IA a usar (ej: `gemma-3-27b-it`)      |
| `requires_password_change` | Boolean | Indica si el usuario debe cambiar su contraseña |

#### Estado de IA en la Interfaz

El componente [`IAStatusBadge`](src/apps/contabilizacion_factura/components/IAStatusBadge.tsx) muestra el estado de conexión de los proveedores de IA en la interfaz.

---

## 22.6.1.5 Sistema de Cambio de Contraseña

### Flujo de Cambio de Contraseña Forzado

Cuando un usuario tiene el campo `requires_password_change` en `true`, el sistema muestra automáticamente el modal de cambio de contraseña obligatorio.

#### Componentes Involucrados

1. **[`ForcePasswordChangeModal`](src/auth/components/ForcePasswordChangeModal.tsx)**
   - Modal que aparece automáticamente cuando el usuario inicia sesión
   - Impide el acceso a la aplicación hasta que se cambie la contraseña
   - Valida que la nueva contraseña tenga al menos 4 caracteres
   - Confirma que las contraseñas coincidan

2. **[`usePasswordReset`](src/auth/hooks/usePasswordReset.ts)**
   - Hook que maneja la lógica de cambio de contraseña
   - Valida los requisitos de la contraseña
   - Llama a la API de Directus para actualizar la contraseña

3. **[`updateUserPassword`](src/services/directus/auth.ts)**
   - Función que comunica con la API de Directus para actualizar la contraseña
   - Requiere el token de autenticación del usuario

#### API de Directus

```typescript
// Actualizar contraseña de usuario
updateUserPassword(userId: string, newPassword: string): Promise<void>

// Resetear contraseña (admin)
resetUserPassword(userId: string, newPassword: string): Promise<void>
```

#### Panel de Administración de Contraseñas

El módulo de Configuración incluye el panel [`PasswordAdminPanel`](src/apps/Configuracion/components/PasswordAdminPanel.tsx) que permite a los administradores cambiar la contraseña de cualquier usuario.

---

## 22.6.1.6 Flujo de Despliegue

### Desarrollo

```
1. Desarrollador edita código en VS Code
      ↓
2. Vite detecta cambios y hace hot reload
      ↓
3. Browser muestra cambios inmediatamente
      ↓
4. Vite proxyea API calls a Directus y al servidor Express
```

### Producción

```
1. Commit & Push: Código se sube a repositorio GitHub
      ↓
2. Coolify: Plataforma clona el repositorio desde GitHub
      ↓
3. Configuración: Se agregan variables de entorno:
   - VITE_DIRECTUS_URL
   - VITE_VENTAS_API_URL
   - Variables de base de datos (DB_HOST, DB_USER, etc.)
      ↓
4. Build Automático: Coolify ejecuta docker-compose build
      ↓
5. Despliegue: Contenedor se inicia con puerto 11000 expuesto
      ↓
6. API Calls:
   - Frontend hace requests directos a Directus
   - API de informes de ventas va al servidor Express integrado
```

### Arquitectura de Producción

```
┌─────────────────────────────────────────────────────────────┐
│                     Contenedor Docker                        │
│  ┌─────────────────────┐    ┌────────────────────────────┐ │
│  │   Frontend (Vite)   │    │   Backend (Express)         │ │
│  │   Archivos estáticos│    │   - /api/informeVentas     │ │
│  │   deldist           │    │   - Conexión MySQL         │ │
│  └─────────────────────┘    └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         ↓                              ↓
    Puerto 11000                   Puerto 11000
         ↓                              ↓
┌──────────────────┐         ┌──────────────────────────────┐
│   Usuario final  │         │   Directus (externo)         │
│   (Navegador)    │         │   MySQL (externo)            │
└──────────────────┘         └──────────────────────────────┘
```

---

## 22.6.1.7 Configuración de Vite

El archivo [`vite.config.ts`](vite.config.ts) configura el proxy para el desarrollo:

```typescript
proxy: {
  "/api": {
    target: "http://localhost:11000",
    changeOrigin: true,
  },
},
```

Esto permite que en desarrollo, las llamadas a `/api` se redirijan al servidor Express local en el puerto 11000.

---

## Notas Adicionales

- El servidor Express (`server/index.js`) sirve tanto la API del frontend como las rutas de API (`/api/*`)
- En producción, el servidor Express sirve los archivos estáticos del directorio `dist` automáticamente
- La configuración de Ollama es opcional y solo se usa como fallback para la extracción de facturas con IA
- Las API keys de Gemini se almacenan encriptadas en Directus y se obtienen del perfil del usuario autenticado
