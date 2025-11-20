## 20. Cómo Añadir una Nueva Aplicación

### 20.1. Entendiendo la Arquitectura Modular

El sistema AppKancan está diseñado con una arquitectura modular que permite agregar nuevas aplicaciones de manera independiente. Cada aplicación es como un "módulo" que se puede desarrollar, probar y desplegar sin afectar las demás aplicaciones del sistema.

**¿Por qué funciona así?**

- **Independencia**: Una app puede fallar sin afectar las otras
- **Escalabilidad**: Se pueden agregar nuevas funcionalidades sin tocar código existente
- **Mantenimiento**: Cada app se actualiza por separado
- **Reutilización**: Componentes compartidos entre todas las apps

### 20.2. Estructura de Carpetas de una Nueva App

Cuando creas una nueva aplicación, debes seguir esta estructura organizada:

```
src/apps/[nombre-app]/           ← Carpeta principal con el nombre de tu app
├── routes.tsx                   ← ⚠️ ARCHIVO OBLIGATORIO - Define las URLs
├── layouts/                     ← Estructura visual de la app
│   └── [NombreApp]Layout.tsx    ← Layout principal de la aplicación
├── components/                  ← Piezas visuales específicas de tu app
│   ├── [NombreApp]List.tsx      ← Para mostrar listas de datos
│   ├── [NombreApp]Form.tsx      ← Para formularios de creación/edición
│   └── [NombreApp]Detail.tsx    ← Para mostrar detalles individuales
├── hooks/                       ← Lógica reutilizable de tu app
│   ├── use[NombreApp].ts        ← Hook principal para datos
│   └── use[NombreApp]Form.ts    ← Hook para manejo de formularios
├── api/                         ← Comunicación con servicios externos
│   └── directus/                ← Carpeta para llamadas a Directus
│       ├── read.ts              ← Funciones para obtener datos
│       └── create.ts            ← Funciones para guardar datos
├── types/                       ← Definiciones de datos TypeScript
│   └── [nombreApp].ts           ← Interfaces y tipos de tu app
└── data/                        ← Datos de prueba para desarrollo
    └── mock[NombreApp].ts       ← Datos falsos para testing
```

**¿Por qué esta estructura?**
Cada carpeta tiene un propósito específico, lo que hace que el código sea fácil de encontrar y mantener. Por ejemplo, toda la lógica de comunicación con el servidor va en `api/`, mientras que los componentes visuales van en `components/`.

### 20.3. El Archivo routes.tsx - El Más Importante

Este archivo es **obligatorio** y le dice al sistema qué páginas tiene tu aplicación y cómo acceder a ellas.

**¿Qué hace exactamente?**

- Define las URLs donde estará disponible tu app
- Indica qué componente mostrar en cada URL
- Optimiza la carga usando "lazy loading" (carga bajo demanda)

**Ejemplo explicado:**

```typescript
import { RouteObject } from "react-router-dom";
import { lazy } from "react";

// lazy() hace que la página se cargue solo cuando se necesita
// Esto mejora la velocidad inicial de la aplicación
const HomePage = lazy(() => import("./pages/Home"));
const CreatePage = lazy(() => import("./pages/Create"));

const routes: RouteObject[] = [
  {
    path: "/mi-app", // ⚠️ DEBE comenzar con "/" - Esta es la URL
    element: <HomePage />, // Qué componente mostrar en esta URL
    index: true, // Esta es la página principal de la app
  },
  {
    path: "/mi-app/crear", // URL para crear nuevos elementos
    element: <CreatePage />, // Componente que maneja la creación
  },
];

// ⚠️ export default es OBLIGATORIO - El sistema lo busca así
export default routes;
```

**¿Por qué lazy loading?**
Sin lazy loading, todas las apps se cargarían al inicio, haciendo la aplicación lenta. Con lazy loading, cada app se carga solo cuando el usuario la visita.

### 20.4. Proceso Paso a Paso para Crear una Nueva App

#### Paso 1: Planificación

Antes de escribir código, piensa:

- **¿Qué hace mi app?** (ej: gestionar productos, usuarios, reportes)
- **¿Quién la usará?** (ej: administradores, vendedores, clientes)
- **¿Qué datos necesita?** (ej: productos, usuarios, transacciones)

#### Paso 2: Crear la Estructura Básica

```bash
# Crear la carpeta principal
mkdir -p src/apps/nueva-app

# Crear todas las subcarpetas necesarias
mkdir -p src/apps/nueva-app/{routes,layouts,components,hooks,api/directus,types,data}

# Crear los archivos base
touch src/apps/nueva-app/routes.tsx
touch src/apps/nueva-app/layouts/NuevaAppLayout.tsx
```

#### Paso 3: Definir las Rutas

Empieza por crear el archivo `routes.tsx` con las páginas básicas que necesitas.

#### Paso 4: Crear el Layout Principal

El layout es como el "esqueleto" visual de tu app. Aquí defines el título, la navegación interna, y dónde se mostrarán los contenidos.

```typescript
// src/apps/nueva-app/layouts/NuevaAppLayout.tsx
import React from "react";
import { Box, Typography, Paper } from "@mui/material";

const NuevaAppLayout: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      {/* Título de la aplicación */}
      <Typography variant="h4" gutterBottom>
        Mi Nueva Aplicación
      </Typography>

      {/* Contenedor principal con fondo blanco */}
      <Paper sx={{ p: 3, mt: 2 }}>
        {/* Aquí irán los componentes específicos de cada página */}
        <Typography>Contenido de la aplicación aquí...</Typography>
      </Paper>
    </Box>
  );
};

export default NuevaAppLayout;
```

#### Paso 5: Registrar la App en el Sistema

Para que tu app aparezca en el menú y sea accesible, debes registrarla en la base de datos de Directus.

**En Directus Admin Panel:**

1. Ve a la colección "apps"
2. Crea un nuevo registro con:
   - **Nombre**: "Mi Nueva App" (lo que verá el usuario)
   - **Ruta**: "/nueva-app" (debe coincidir con routes.tsx)
   - **Categoría**: "principal" o "secundaria"
   - **Ícono**: nombre del ícono (ej: "settings", "user")

**En la base de datos:**

```sql
-- Esto se hace automáticamente desde Directus Admin
INSERT INTO apps (nombre, ruta, categoria, icono_app)
VALUES ('Mi Nueva App', '/nueva-app', 'principal', 'settings');
```

#### Paso 6: Asignar Permisos a Usuarios

No todos los usuarios deben ver todas las apps. Debes especificar quién puede acceder.

```sql
-- Dar acceso a usuarios específicos
INSERT INTO app_usuario (usuario_id, app_id)
SELECT u.id, a.id
FROM directus_users u
CROSS JOIN apps a
WHERE u.email = 'usuario@empresa.com'  -- Cambia por el email real
AND a.nombre = 'Mi Nueva App';
```

**¿Por qué se hace así?**
El sistema de permisos asegura que cada usuario vea solo las aplicaciones que necesita, manteniendo la seguridad y la simplicidad de la interfaz.

### 20.5. Validaciones Automáticas del Sistema

Cuando creas una nueva app, el sistema verifica automáticamente varios aspectos:

- ✅ **¿Existe routes.tsx?** - Sin este archivo, la app no funciona
- ✅ **¿Tiene export default?** - El sistema busca las rutas de esta manera
- ✅ **¿Las rutas comienzan con "/"?** - Formato requerido para URLs
- ✅ **¿Usa lazy loading?** - Para optimizar performance
- ✅ **¿La estructura es correcta?** - Carpetas y archivos en los lugares correctos

**¿Qué pasa si algo falla?**
El sistema muestra errores específicos en la consola del navegador durante desarrollo, ayudándote a corregir los problemas antes de que afecten a los usuarios.

### 20.6. Desarrollo Iterativo

Después de tener la estructura básica:

1. **Agrega componentes visuales** en la carpeta `components/`
2. **Crea hooks personalizados** en `hooks/` para lógica reutilizable
3. **Implementa llamadas a API** en `api/directus/`
4. **Define tipos de datos** en `types/` para TypeScript
5. **Agrega datos de prueba** en `data/` para desarrollo

**Consejo:** Empieza simple y agrega funcionalidades gradualmente. Es más fácil corregir errores en etapas pequeñas que en un sistema complejo completo.

---

## 21. Sistema de Componentes Compartidos

### 21.1. ¿Por Qué Componentes Compartidos?

Imagina que cada aplicación tuviera que crear sus propios botones, formularios y diseños. Sería:

- ❌ Repetitivo: Mismo código en múltiples lugares
- ❌ Inconsistente: Cada app se vería diferente
- ❌ Difícil de mantener: Cambios en un botón requerirían actualizar todas las apps

**Los componentes compartidos solucionan esto creando una "librería" común que todas las apps pueden usar.**

### 21.2. Arquitectura Atomic Design

El sistema sigue el patrón "Atomic Design", que organiza los componentes como si fueran átomos, moléculas y organismos:

```
🧬 ÁTOMOS (básicos)
├── Botones individuales
├── Campos de texto
└── Íconos

🧪 MOLÉCULAS (combinaciones)
├── Grupos de botones
├── Campos de formulario con etiquetas
└── Elementos de navegación

🧫 ORGANISMOS (complejos)
├── Barras laterales completas
├── Formularios enteros
└── Layouts de página
```

**¿Por qué funciona?**
Es como construir con LEGO: piezas simples (átomos) se combinan para hacer piezas más complejas (moléculas), que a su vez forman estructuras completas (organismos).

### 21.3. Componentes Más Importantes

#### 21.3.1. CancelButton - Para Cancelar Acciones

**¿Qué hace?** Crea botones estandarizados para cancelar operaciones.

**¿Por qué existe?** Todas las apps necesitan botones de "Cancelar" que se vean iguales y funcionen de manera consistente.

**Cómo se usa:**

```typescript
<CancelButton onClick={handleCancel} disabled={loading}>
  Cancelar Operación
</CancelButton>
```

**Características automáticas:**

- Color gris (secundario) para indicar acción no destructiva
- Ícono de "X" para claridad visual
- Se deshabilita automáticamente cuando está cargando
- Texto personalizable según la acción

#### 21.3.2. ActionButton - Para Acciones Principales

**¿Qué hace?** Botones para las acciones más importantes de cada pantalla.

**¿Por qué existe?** Las acciones principales (Guardar, Crear, Enviar) deben destacarse y tener estados visuales claros.

**Cómo se usa:**

```typescript
<ActionButton
  onClick={handleSave}
  loading={saving}
  color="primary"
  icon={<SaveIcon />}
>
  Guardar Cambios
</ActionButton>
```

**Estados inteligentes:**

- **Normal**: Botón azul con ícono
- **Loading**: Muestra spinner y cambia texto a "Procesando..."
- **Disabled**: Se apaga cuando no se puede usar
- **Colores**: Azul (primary), verde (success), rojo (error)

#### 21.3.3. CustomSelectionModal - Para Seleccionar Múltiples Elementos

**¿Qué hace?** Ventanas modales para seleccionar varios elementos de una lista.

**¿Por qué existe?** Muchas apps necesitan seleccionar tiendas, productos o usuarios de listas grandes.

**Cómo se usa:**

```typescript
<CustomSelectionModal
  open={modalOpen} // ¿Está visible?
  onClose={() => setModalOpen(false)} // Función para cerrar
  title="Seleccionar Tiendas" // Título de la ventana
  items={tiendas} // Lista completa de elementos
  selectedItems={selectedTiendas} // Elementos ya seleccionados
  onSelectionChange={setSelectedTiendas} // Función que recibe la selección
  getItemKey={(tienda) => tienda.id} // Cómo identificar cada elemento
  getItemLabel={(tienda) => tienda.nombre} // Qué mostrar al usuario
  searchPlaceholder="Buscar tienda..." // Texto del buscador
/>
```

**Funcionalidades incluidas:**

- **Búsqueda en tiempo real**: Filtra mientras escribes
- **Selección múltiple**: Checkbox para cada elemento
- **Seleccionar todo**: Botón para marcar/desmarcar todos
- **Contador**: Muestra "X elementos seleccionados"
- **Responsive**: Se adapta a móviles y desktop

### 21.4. Sistema de Íconos Inteligente

**¿Qué hace?** Permite usar íconos por nombre en lugar de importar cada uno.

**¿Por qué existe?** Facilita cambiar íconos sin tocar código y asegura consistencia visual.

**Cómo funciona internamente:**

```typescript
// Lista de íconos disponibles
const ICON_MAP = {
  settings: Settings, // Engranaje
  user: User, // Persona
  home: Home, // Casa
  "shopping-cart": ShoppingCart, // Carrito
  // ... más de 50 íconos
};

// Uso simple
<DynamicIcon name="settings" size={24} />;
```

**Beneficios:**

- **Consistencia**: Todos usan los mismos íconos
- **Flexibilidad**: Cambiar ícono solo requiere cambiar el nombre
- **Performance**: Íconos se cargan bajo demanda
- **Fallback**: Si un ícono no existe, muestra uno por defecto

### 21.5. Gestión de Tema Global

**¿Qué hace?** Permite cambiar entre tema claro y oscuro en toda la aplicación.

**¿Por qué existe?** Algunos usuarios prefieren interfaces oscuras, especialmente en ambientes con poca luz.

**Cómo funciona:**

```typescript
// Tema claro (predeterminado)
const lightTheme = createTheme({
  palette: {
    primary: { main: "#1976d2" }, // Azul principal
    secondary: { main: "#dc004e" }, // Rojo/rosa
    background: {
      default: "#fafafa", // Fondo gris muy claro
      paper: "#ffffff", // Fondos blancos
    },
  },
  typography: {
    fontFamily: '"Inter", sans-serif', // Fuente moderna
  },
});

// Tema oscuro
const darkTheme = createTheme({
  palette: {
    mode: "dark", // Activa modo oscuro
    primary: { main: "#90caf9" }, // Azul más claro
    background: {
      default: "#121212", // Fondo muy oscuro
      paper: "#1e1e1e", // Gris oscuro para tarjetas
    },
  },
});
```

**¿Cómo cambia el usuario?**
En la app de Configuración, hay un interruptor que cambia entre modos. El sistema recuerda la preferencia del usuario.

### 21.6. Utilidades Compartidas

#### 21.6.1. Validación de Estados HTTP

**¿Qué hace?** Ayuda a identificar si una respuesta del servidor fue exitosa o no.

```typescript
import { isSuccessStatus, isClientError } from "@/shared/utils/hasStatus";

// Después de una llamada a API
if (isSuccessStatus(response.status)) {
  // ✅ Respuesta exitosa (200-299)
  mostrarDatos(response.data);
} else if (isClientError(response.status)) {
  // ❌ Error del cliente (400-499), como datos inválidos
  mostrarErrorValidacion(response.error);
} else {
  // 🔄 Error del servidor (500-599)
  mostrarErrorServidor();
}
```

#### 21.6.2. Validación de Formularios

**¿Qué hace?** Valida automáticamente los datos que los usuarios ingresan en formularios.

```typescript
import { loginCredentialsSchema } from "@/shared/utils/loginSchema";

// Al enviar un formulario
const validateForm = async (formData) => {
  try {
    // Valida que el email tenga formato correcto
    // Valida que la contraseña tenga al menos 8 caracteres
    await loginCredentialsSchema.validate(formData);
    return { isValid: true };
  } catch (error) {
    // Retorna errores específicos por campo
    return {
      isValid: false,
      errors: {
        email: "El formato del email no es válido",
        password: "La contraseña debe tener al menos 8 caracteres",
      },
    };
  }
};
```

#### 21.6.3. Almacenamiento Local Persistente

**¿Qué hace?** Guarda datos en el navegador del usuario que persisten entre sesiones.

```typescript
import { useLocalStorage } from "@/shared/hooks/useLocalStorage";

// Preferencias del usuario que se recuerdan
const [userPrefs, setUserPrefs, removePrefs] = useLocalStorage(
  "user-preferences", // Nombre único para estos datos
  { theme: "light", language: "es" } // Valores por defecto
);

// Uso
setUserPrefs({ theme: "dark", language: "es" }); // Guardar
// Al recargar la página, userPrefs tendrá el valor guardado
```

**¿Por qué es útil?**

- Recordar preferencias del usuario
- Mantener estados entre sesiones
- Cache de datos pequeños

---

## 22. Despliegue con Docker - Cómo Funciona Realmente

### 22.1. ¿Qué es Docker y Por Qué Lo Usamos?

Docker es como una "caja mágica" que empaqueta aplicaciones completas con todo lo necesario para funcionar. En AppKancan, usamos Docker porque:

**Problemas que resuelve:**

- ❌ **"En mi máquina funciona"** → ✅ Funciona igual en todos lados
- ❌ Dependencias faltantes → ✅ Todo incluido en la caja
- ❌ Conflictos entre aplicaciones → ✅ Cada app en su propia caja
- ❌ Dificultad para actualizar → ✅ Versiones controladas

**En AppKancan, Docker crea "contenedores" para cada parte del sistema.**

### 22.2. Arquitectura de Contenedores en AppKancan

```
🐳 PRODUCCIÓN - Sistema Completo
├── 🖥️ appkancan:11000     ← Frontend (tu aplicación React)
├── 🗄️ directus:8055       ← Backend (API y base de datos)
├── 🐘 postgres:5432       ← Base de datos PostgreSQL
└── 🌐 nodered:1880        ← Middleware para integraciones
```

**¿Cómo se comunican?**

- **AppKancan** habla con **Directus** para obtener datos
- **Directus** guarda datos en **PostgreSQL**
- **AppKancan** envía datos a **Node-RED** para integraciones
- Todo sucede dentro de una red privada segura

### 22.3. El Proceso de Construcción (Build)

Docker construye la aplicación en dos etapas, como preparar una comida compleja:

#### Etapa 1: Preparación (Builder)

```dockerfile
FROM node:20-bullseye-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --force

COPY . .
RUN npm run build
```

**¿Qué hace esta etapa?**

1. Toma una "caja base" con Node.js instalado
2. Copia la lista de ingredientes (package.json)
3. Instala todas las dependencias necesarias
4. Copia todo el código fuente
5. "Cocina" la aplicación (npm run build)
6. Resultado: archivos optimizados listos para producción

#### Etapa 2: Servicio (Production)

```dockerfile
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo 'server { \
    listen 11000; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 11000
CMD ["nginx", "-g", "daemon off;"]
```

**¿Qué hace esta etapa?**

1. Toma una "caja base" con NGINX (servidor web)
2. Copia los archivos "cocidos" de la etapa anterior
3. Configura NGINX para servir la aplicación
4. Expone el puerto 11000 para acceso externo
5. Resultado: Servidor web listo para recibir visitas

**¿Por qué dos etapas?**

- **Builder**: Tiene herramientas de desarrollo pesadas (no necesarias en producción)
- **Production**: Solo tiene lo esencial para servir la app (más ligero y seguro)

### 22.4. Docker Compose - El "Chef" que Coordina Todo

Docker Compose es como un chef que coordina múltiples platos al mismo tiempo.

```yaml
version: "3.8"
services:
  # 🌐 Frontend - AppKancan
  appkancan:
    build: . # Construye usando el Dockerfile
    ports:
      - "11000:11000" # Conecta puerto externo → interno
    depends_on:
      - directus # Espera a que Directus esté listo
    networks:
      - appkancan-network # Conecta a la red privada

  # 🗄️ Backend - Directus
  directus:
    image: directus/directus:latest # Usa imagen pre-construida
    ports:
      - "8055:8055"
    environment: # Variables de configuración
      SECRET: ${DIRECTUS_SECRET}
      DB_HOST: postgres # Conecta a PostgreSQL
    depends_on:
      - postgres # Espera a la base de datos
    networks:
      - appkancan-network

  # 🐘 Base de datos
  postgres:
    image: postgres:15-alpine # Base de datos PostgreSQL
    environment:
      POSTGRES_DB: appkancan
      POSTGRES_USER: directus
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data # Datos persistentes
    networks:
      - appkancan-network

  # 🌐 Middleware
  nodered:
    image: nodered/node-red:latest
    ports:
      - "1880:1880"
    networks:
      - appkancan-network
```

**¿Qué significa cada parte?**

- **services**: Lista de aplicaciones a ejecutar
- **build**: Construye la imagen desde código local
- **image**: Usa imagen pre-construida de Docker Hub
- **ports**: Conecta puertos del contenedor con el exterior
- **depends_on**: Orden de inicio (quién espera a quién)
- **environment**: Variables de configuración
- **volumes**: Datos que sobreviven reinicios
- **networks**: Red privada para comunicación

### 22.5. Secuencia de Inicio - El Orden Importa

Cuando ejecutas `docker compose up -d`, sucede esto:

1. **PostgreSQL arranca primero** (base de datos)

   - Crea las tablas si no existen
   - Espera conexiones

2. **Directus espera a PostgreSQL**

   - Verifica conexión a base de datos
   - Inicia servidor API
   - Crea tablas de Directus si es necesario

3. **AppKancan espera a Directus**

   - Verifica que la API esté responding
   - Inicia servidor NGINX
   - Sirve la aplicación React

4. **Node-RED inicia en paralelo**
   - Carga flujos de integración
   - Espera conexiones de webhook

**¿Por qué este orden?**
Si AppKancan iniciara antes que Directus, fallaría al intentar conectarse a una API que no existe.

### 22.6. Comunicación entre Contenedores

Los contenedores se comunican a través de una red privada:

```
AppKancan → Directus: http://directus:8055/api/...
Directus → PostgreSQL: postgres:5432
AppKancan → Node-RED: http://nodered:1880/webhook/...
```

**¿Cómo saben las direcciones?**

- **directus**, **postgres**, **nodered** son nombres de servicios en docker-compose.yml
- Docker DNS resuelve estos nombres a direcciones IP internas
- La red **appkancan-network** mantiene todo privado y seguro

### 22.7. Datos Persistentes - Lo que Sobrevive Reinicios

```yaml
volumes:
  postgres_data: # Datos de PostgreSQL
  directus_uploads: # Archivos subidos por usuarios
  nodered_data: # Configuración de flujos Node-RED
```

**¿Dónde se guardan en el disco?**

- **PostgreSQL**: `./postgres_data/` → `/var/lib/postgresql/data`
- **Directus**: `./directus/uploads/` → `/directus/uploads`
- **Node-RED**: `./nodered/data/` → `/data`

**¿Por qué es importante?**
Sin volumes, al reiniciar contenedores perderías:

- ❌ Todos los datos de usuarios
- ❌ Archivos subidos
- ❌ Configuraciones personalizadas

### 22.8. Variables de Entorno - Configuración Flexible

```env
# Archivo .env (fuera de los contenedores)
# Base de datos
POSTGRES_DB=appkancan
POSTGRES_USER=directus
POSTGRES_PASSWORD=tu_password_seguro_aqui

# Directus
DIRECTUS_SECRET=tu_secret_muy_largo_y_seguro
ADMIN_EMAIL=admin@appkancan.com
ADMIN_PASSWORD=password_muy_seguro

# AppKancan
VITE_DIRECTUS_URL=http://localhost:8055
VITE_WEBHOOK_URL_TRASLADOS=http://localhost:1880/webhook/traslados
```

**¿Por qué variables de entorno?**

- **Seguridad**: Contraseñas no quedan en el código
- **Flexibilidad**: Cambiar configuración sin reconstruir
- **Entornos**: Desarrollo, staging, producción con configs diferentes

### 22.9. Monitoreo y Solución de Problemas

#### Ver Logs en Tiempo Real

```bash
# Todos los servicios a la vez
docker compose logs -f

# Solo un servicio específico
docker compose logs -f appkancan

# Últimas 50 líneas
docker compose logs --tail=50 directus
```

#### Verificar que Todo Funciona

```bash
# Estado de todos los contenedores
docker compose ps

# Verificar conectividad
curl -f http://localhost:11000    # AppKancan
curl -f http://localhost:8055/server/health  # Directus
```

#### Problemas Comunes y Soluciones

**Problema: "App no carga"**

```
Posible causa: Error en el build de React
Solución: docker compose logs appkancan
         Buscar errores de compilación
```

**Problema: "No se conecta a Directus"**

```
Posible causa: Directus no inició correctamente
Solución: docker compose ps
         Si está "restarting", ver logs: docker compose logs directus
```

**Problema: "Base de datos no responde"**

```
Posible causa: Contraseña incorrecta o disco lleno
Solución: docker compose logs postgres
         Verificar espacio: df -h
```

### 22.10. Actualización sin Interrupciones

```bash
# Detener servicios
docker compose down

# Actualizar código
git pull origin main

# Reconstruir e iniciar
docker compose up -d --build
```

**¿Qué hace --build?**
Fuerza reconstrucción de imágenes, aplicando cambios en el código.

### 22.11. Entornos Diferentes

Puedes tener configuraciones para desarrollo, pruebas y producción:

```bash
# Desarrollo (con hot reload)
docker compose -f docker-compose.dev.yml up

# Producción (optimizado)
docker compose -f docker-compose.prod.yml up -d

# Testing
docker compose -f docker-compose.test.yml up --abort-on-container-exit
```

**¿Por qué diferentes archivos?**

- **Desarrollo**: Variables de debug activadas, volúmenes para hot reload
- **Producción**: Optimizaciones de performance, seguridad máxima
- **Testing**: Configuración especial para ejecutar pruebas automatizadas

---

## 23. Desarrollo y Testing

### 23.1. Entorno de Desarrollo Local

```bash
# Instalar dependencias del proyecto
npm install

# Iniciar servidor de desarrollo con hot reload
npm run dev

# Construir versión de producción
npm run build

# Ejecutar pruebas automatizadas
npm test

# Verificar calidad del código
npm run lint
```

### 23.2. Estructura de Testing

```
📁 src/
├── 📁 __tests__/           # Pruebas unitarias
├── 📁 __mocks__/           # Datos falsos para pruebas
└── 📁 components/
    └── 📁 __tests__/       # Pruebas específicas de componentes
```

### 23.3. CI/CD - Despliegue Automático

```yaml
# .github/workflows/ci.yml
name: CI/CD
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

### 21.4. Sistema de Íconos Inteligente - Implementación Real

**¿Qué hace?** Convierte nombres de texto en componentes de íconos reales de Material-UI.

**¿Por qué existe?** Permite cambiar íconos desde la base de datos sin tocar código, y asegura que todos usen la misma librería de íconos.

**Cómo funciona internamente en el proyecto:**

```typescript
// Importa TODOS los íconos de Material-UI de una vez
import * as Icons from "@mui/icons-material";

// El componente recibe un nombre como "ShoppingCart", "Settings", etc.
interface DynamicIconProps {
  iconName?: string; // Nombre del ícono como string
  color?:
    | "inherit"
    | "primary"
    | "secondary"
    | "error"
    | "warning"
    | "info"
    | "success";
}

export function DynamicIcon({ iconName, color = "inherit", ...props }) {
  // Si no viene nombre, usa ícono por defecto
  if (!iconName) return <Folder color={color} {...props} />;

  // 🔍 Busca el ícono en el objeto gigante de Material-UI
  // Icons.ShoppingCart, Icons.Settings, Icons.User, etc.
  const IconComponent = (Icons as Record<string, React.ElementType>)[iconName];

  // Si no encuentra el ícono, avisa y usa el por defecto
  if (!IconComponent) {
    console.warn(`⚠️ Icono "${iconName}" no encontrado, usando Folder`);
    return <Folder color={color} {...props} />;
  }

  // Devuelve el ícono correcto con todas las props
  return <IconComponent color={color} {...props} />;
}
```

**¿Cómo se usa en el proyecto?**

```typescript
// En la base de datos Directus, las apps tienen un campo "icono_app"
// Que contiene strings como "ShoppingCart", "Settings", "LocalOffer"

// En el código, se usa así:
<DynamicIcon name={app.icono_app} size={24} />

// Esto automáticamente muestra el ícono correcto para cada app
// Sin necesidad de importar cada ícono individualmente
```

**Beneficios en el proyecto:**

- **Flexibilidad**: Cambiar ícono de una app editando solo la base de datos
- **Consistencia**: Todos los íconos vienen de la misma librería (Material-UI)
- **Mantenibilidad**: No hay imports dispersos de íconos por todo el código
- **Robustez**: Si un ícono no existe, usa uno por defecto sin romper la app

### 21.5. Gestión de Tema Global - Implementación Completa

**¿Qué hace?** Crea dos temas completos (claro y oscuro) que afectan toda la aplicación automáticamente.

**¿Por qué existe?** Algunos usuarios prefieren interfaces oscuras, especialmente en ambientes de producción con poca luz.

**Implementación real en el proyecto:**

```typescript
// Usa la fuente Inter de Google Fonts
import "@fontsource/inter/400.css";
import "@fontsource/inter/400-italic.css";

// Tema oscuro personalizado para el proyecto
export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#006ACC", // Azul brillante para botones principales
      light: "#B8DCFF", // Azul claro para hovers
      dark: "#003D75", // Azul profundo para estados activos
      contrastText: "#FFFFFF", // Texto blanco sobre botones azules
    },
    secondary: {
      main: "#48A9A6", // Verde azulado para acciones secundarias
      light: "#6FC7C4",
      dark: "#2D7E7B",
      contrastText: "#FFFFFF",
    },
    // Colores semánticos para estados
    error: { main: "#E57373", contrastText: "#FFFFFF" },
    warning: { main: "#FFB74D", contrastText: "#1E1E1E" },
    success: { main: "#428F44", contrastText: "#FFFFFF" },
    info: { main: "#4FC3F7", contrastText: "#FFFFFF" },

    // Fondos específicos para tema oscuro
    background: {
      default: "#121212", // Fondo general muy oscuro
      paper: "#1E1E1E", // Tarjetas y paneles
    },
    text: {
      primary: "#FFFFFF", // Texto principal blanco
      secondary: "#B0BEC5", // Texto secundario gris azulado
    },
    divider: "#333", // Líneas divisorias
    bgAlt: "#2B2B2B", // Fondo alternativo para secciones
  },
  typography: {
    fontFamily: "'Inter', sans-serif", // Fuente moderna y legible
    fontSize: 13, // Tamaño base optimizado
  },
  components: {
    // Personalizaciones específicas de Material-UI
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" }, // Sin gradientes por defecto
      },
    },
  },
});

// Tema claro complementario
export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#004680", // Azul más profundo para claro
      light: "#E6F4FF",
      dark: "#002747",
      contrastText: "#FFFFFF",
    },
    // ... configuración similar pero optimizada para fondo claro
    background: {
      default: "#E6E6E6", // Fondo gris muy claro
      paper: "#FFFFFF", // Tarjetas blancas
    },
    text: {
      primary: "#333333", // Texto oscuro para contraste
      secondary: "#555555",
    },
  },
  // ... misma configuración de fuente y componentes
});
```

**¿Cómo cambia el usuario de tema?**
En la app de Configuración, hay un componente `ThemeSwitch` que permite alternar entre modos. La selección se guarda automáticamente y persiste entre sesiones.

**¿Cómo afecta esto a toda la app?**

- **Botones**: Cambian de color automáticamente
- **Fondos**: Se ajustan para mantener legibilidad
- **Textos**: Colores óptimos para cada fondo
- **Íconos**: Colores apropiados para cada tema
- **Todos los componentes**: Se adaptan sin código adicional

---

## 22. Despliegue con Docker - Configuración Actual del Proyecto

### 22.1. Docker Compose Actual del Proyecto

**El proyecto actualmente usa una configuración simple pero efectiva:**

```yaml
# docker-compose.yml actual
services:
  appkancan:
    build:
      context: . # Usa el directorio actual
      dockerfile: Dockerfile # Archivo Docker personalizado
    ports:
      - "11000:11000" # Puerto externo → interno
    restart: unless-stopped # Reinicia automáticamente
```

**¿Por qué esta configuración simple?**

- **Desarrollo primero**: El enfoque inicial fue desarrollo local
- **Iteración rápida**: Fácil de modificar y probar
- **Dependencias mínimas**: No requiere bases de datos externas para desarrollo
- **Simplicidad**: Un solo contenedor para toda la aplicación

### 22.2. Dockerfile del Proyecto - Construcción Real

```dockerfile
# Dockerfile actual del proyecto
FROM node:20-bullseye-slim AS builder

# Instalar dependencias
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --force

# Copiar código y construir
COPY . .
RUN npm run build

# Servidor de producción
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de NGINX
RUN echo 'server { \
    listen 11000; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 11000
CMD ["nginx", "-g", "daemon off;"]
```

**¿Qué hace cada paso?**

1. **FROM node:20**: Toma una "caja base" con Node.js para desarrollo
2. **npm ci**: Instala dependencias exactas (más rápido que npm install)
3. **npm run build**: Crea la versión optimizada de React
4. **FROM nginx:alpine**: Cambia a servidor web ligero
5. **COPY dist**: Mueve los archivos construidos
6. **Config NGINX**: Sirve SPA con manejo de rutas

### 22.3. Limitaciones del Despliegue Actual

**Problemas identificados:**

- **Sin base de datos**: No incluye PostgreSQL o Directus
- **Sin persistencia**: Datos se pierden al reiniciar
- **Sin escalabilidad**: Un solo contenedor
- **Sin monitoreo**: Sin logs centralizados

**¿Por qué funciona para desarrollo?**

- **Iteración rápida**: Construcción y prueba inmediatas
- **Recursos mínimos**: No requiere infraestructura compleja
- **Debugging fácil**: Un solo punto de falla

### 22.4. Evolución del Despliegue

**Fases planeadas:**

**Fase 1 (Actual)**: Despliegue simple para desarrollo

```yaml
services:
  appkancan: # Solo frontend
    build: .
    ports: ["11000:11000"]
```

**Fase 2 (Próxima)**: Despliegue completo con backend

```yaml
services:
  appkancan: # Frontend
  directus: # Backend API
  postgres: # Base de datos
  nodered: # Integraciones
```

**Fase 3 (Futuro)**: Despliegue en producción

```yaml
services:
  appkancan: # Frontend con load balancer
  directus: # Backend escalable
  postgres: # Base de datos con réplicas
  redis: # Cache y sesiones
  monitoring: # Logs y métricas
```

---

## 24. Funcionalidades Completas del Proyecto

### 24.1. Sistema de Autenticación Avanzado

- **JWT Tokens**: Autenticación stateless con refresh automático
- **Control de Sesiones**: Expiración automática y renovación transparente
- **Gestión de Roles**: Permisos granulares por usuario y aplicación
- **Auditoría**: Registro completo de accesos y acciones
- **Seguridad Multi-capa**: Validación en cliente y servidor

### 24.2. Arquitectura Modular Dinámica

- **Lazy Loading**: Aplicaciones se cargan bajo demanda
- **Code Splitting**: Separación automática de bundles
- **Hot Module Replacement**: Recarga instantánea en desarrollo
- **Tree Shaking**: Eliminación automática de código no usado
- **Performance**: Optimización automática de assets

### 24.3. Interfaz de Usuario Adaptativa

- **Responsive Design**: Funciona en desktop, tablet y móvil
- **Tema Dinámico**: Cambio automático entre claro y oscuro
- **Accesibilidad**: Cumplimiento de estándares WCAG
- **Internacionalización**: Soporte multi-idioma preparado
- **Feedback Visual**: Estados de carga, errores y confirmaciones

### 24.4. Gestión de Estado Inteligente

- **React Query**: Cache inteligente de datos del servidor
- **Context API**: Estado global compartido entre módulos
- **Local Storage**: Persistencia de preferencias de usuario
- **Sincronización**: Estado consistente entre pestañas
- **Optimización**: Actualizaciones selectivas de componentes

### 24.5. Sistema de Componentes Reutilizables

- **Atomic Design**: Componentes desde átomos hasta organismos
- **TypeScript**: Seguridad de tipos en todos los componentes
- **Material-UI**: Base sólida de componentes probados
- **Personalización**: Temas y estilos adaptables al proyecto
- **Documentación**: Props y ejemplos de uso claros

---

## 25. Componente de Barra Lateral (AppSidebar) - Navegación Principal

### 25.1. ¿Qué Hace la Barra Lateral?

La barra lateral es el corazón de la navegación de la aplicación. Muestra todas las aplicaciones disponibles para el usuario y permite navegar entre ellas.

### 25.2. Funcionalidades Principales

- **Navegación Dinámica**: Muestra solo apps permitidas para el usuario
- **Agrupación por Categorías**: Organiza apps en grupos lógicos
- **Responsive**: Se adapta a móvil y desktop
- **Estados Visuales**: Indica app activa y hover effects
- **Persistencia**: Recuerda categorías expandidas/colapsadas

### 25.3. Implementación Técnica

```typescript
export function AppSidebar({ open, setOpen }: Props) {
  const { isAuthenticated } = useAuth();     // Verifica login
  const { apps, loading } = useApps();       // Obtiene apps del usuario
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();             // Página actual

  // ✅ Si no está autenticado, redirige a login
  if (!isAuthenticated) return <Navigate to="/login" />;

  // ✅ Agrupa apps por categoría para organizar el menú
  const groupedApps = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const app of apps) {
      const categoria = app.categoria || "Sin categoría";
      if (!groups[categoria]) groups[categoria] = [];
      groups[categoria].push(app);
    }
    return groups;
  }, [apps]);
```

### 25.4. Comportamiento en Diferentes Dispositivos

#### En Desktop:

- **Drawer Permanente**: Siempre visible, ancho ajustable
- **Animación Fluida**: Se expande/colapsa suavemente
- **Categorías Expandidas**: Muestra jerarquía completa
- **Footer Fijo**: Información de usuario siempre visible

#### En Móvil:

- **Drawer Temporal**: Aparece como overlay
- **Toolbar Fijo**: Botón de menú en parte superior
- **Cierre Automático**: Se cierra al seleccionar opción
- **Gestos Táctiles**: Soporte completo para touch

### 25.5. Estados y Estados Visuales

```typescript
// Estados del drawer
const [expanded, setExpanded] = useState<Record<string, boolean>>({});

// Toggle de categorías
const toggleCategory = (cat: string) =>
  setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));

// Toggle del drawer completo
const toggleDrawer = () => setOpen(!open);
```

### 25.6. Integración con Sistema de Rutas

```typescript
// Cada app tiene su propia ruta
const app = {
  id: "promociones",
  nombre: "Promociones",
  ruta: "/promociones", // ← Esta ruta se usa en React Router
  categoria: "principal",
  icono_app: "LocalOffer",
};

// El sidebar genera links automáticamente
<NavLink to={app.ruta}>
  <DynamicIcon name={app.icono_app} />
  {open && app.nombre}
</NavLink>;
```

### 25.7. Optimizaciones de Performance

- **Memoización**: `useMemo` para agrupación de apps
- **Lazy Loading**: Componentes se cargan bajo demanda
- **Scroll Independiente**: Solo la lista hace scroll, header/footer fijos
- **Renderizado Condicional**: Solo muestra elementos necesarias

---

## 26. Carga Dinámica de Aplicaciones - Sistema de Navegación

### 26.1. ¿Qué es la Carga Dinámica y Por Qué es Importante?

La carga dinámica es una técnica que permite cargar partes de la aplicación solo cuando se necesitan, en lugar de cargar todo el código al inicio. En AppKancan, esto significa que cada aplicación (Promociones, Traslados, Artículos, etc.) se carga únicamente cuando el usuario hace clic en ella.

**¿Por qué es crucial para AppKancan?**

- **Performance Inicial**: La aplicación principal carga en 2-3 segundos en lugar de 10-15 segundos
- **Uso de Memoria**: Solo mantiene en memoria las apps que el usuario está usando
- **Escalabilidad**: Puedes agregar 50 aplicaciones sin afectar el tiempo de carga inicial
- **Experiencia de Usuario**: Los usuarios ven la interfaz inmediatamente, no esperan a que cargue todo

**Comparación con sistemas tradicionales:**

```
❌ Sistema Tradicional:
   - Carga TODAS las apps al inicio
   - 15 segundos de espera inicial
   - 50MB de memoria usados siempre
   - Agregar apps hace el sistema más lento

✅ AppKancan con Carga Dinámica:
   - Carga SOLO la app seleccionada
   - 3 segundos de espera inicial
   - 10MB de memoria base + apps activas
   - Agregar apps no afecta velocidad
```

### 26.2. Arquitectura del Sistema de Carga Dinámica

El sistema funciona en capas que se comunican entre sí:

```
👤 Usuario hace clic en "Promociones"
   ↓
🎯 React Router detecta la ruta "/promociones"
   ↓
🔍 Sistema de rutas busca el componente lazy
   ↓
📦 Import dinámico carga el código de Promociones
   ↓
⚡ Componente se renderiza con Suspense fallback
   ↓
✨ Usuario ve la aplicación cargada
```

**Componentes clave del sistema:**

- **AppProvider**: Gestiona qué apps puede ver el usuario
- **React Router**: Maneja la navegación y rutas
- **Lazy Loading**: Carga código bajo demanda
- **Suspense**: Muestra loading mientras carga
- **Context API**: Comparte estado entre componentes

### 26.3. Proceso de Carga - Paso a Paso Detallado

#### Paso 1: Verificación de Autenticación del Usuario

Antes de cargar cualquier aplicación, el sistema verifica que el usuario esté autenticado y determina qué apps puede acceder.

```typescript
// Este código está en AppProvider.tsx
const { isAuthenticated } = useAuth(); // Hook que verifica tokens JWT

if (!isAuthenticated) {
  // Si no está autenticado:
  setArea(null); // Limpia área funcional
  setApps([]); // No hay apps disponibles
  setLoading(false); // Termina estado de carga
  return; // Sale de la función
}

// Si está autenticado, continúa al siguiente paso
```

**¿Por qué este paso primero?**

- **Seguridad**: Nunca carga apps para usuarios no autenticados
- **Performance**: Evita llamadas innecesarias a APIs
- **Consistencia**: Estado limpio si hay problemas de autenticación

#### Paso 2: Consulta de Permisos y Aplicaciones Permitidas

Una vez autenticado, el sistema consulta Directus para saber qué aplicaciones puede usar el usuario.

```typescript
// Obtiene lista de apps permitidas desde la base de datos
const data = await getApps(); // Llama a Directus API
setApps(data); // Guarda las apps en el estado global

// También obtiene el área funcional del usuario (producción, contabilidad, etc.)
const areaUsuario = await getUserArea();
const areaValue = areaUsuario[0].area?.toLowerCase() || null;
setArea(areaValue); // Ej: "produccion", "contabilidad"
```

**¿Qué información viene de Directus?**

```json
[
  {
    "id": "promociones",
    "nombre": "Promociones",
    "ruta": "/promociones",
    "categoria": "principal",
    "icono_app": "LocalOffer"
  },
  {
    "id": "traslados",
    "nombre": "Traslados",
    "ruta": "/traslados",
    "categoria": "principal",
    "icono_app": "LocalShipping"
  }
]
```

**¿Cómo funciona la consulta a Directus?**

- Usa tokens JWT para autenticación
- Consulta tablas `app_usuario` y `apps`
- Filtra por permisos del usuario actual
- Retorna solo apps autorizadas

#### Paso 3: Descubrimiento y Filtrado de Módulos Disponibles

El sistema busca todos los archivos de rutas disponibles y filtra solo los que corresponden a apps permitidas.

```typescript
// Vite genera un mapa de todos los archivos routes.tsx en /apps/
const rutasDisponibles = import.meta.glob("@/apps/**/routes.tsx");

/*
Esto crea un objeto como:
{
  "/src/apps/promociones/routes.tsx": () => import("/src/apps/promociones/routes.tsx"),
  "/src/apps/traslados/routes.tsx": () => import("/src/apps/traslados/routes.tsx"),
  "/src/apps/articulos/routes.tsx": () => import("/src/apps/articulos/routes.tsx"),
}
*/

// Filtra solo las rutas de apps que el usuario puede acceder
const modulosPermitidos = Object.entries(rutasDisponibles).filter(([path]) =>
  // path incluye algo como "/src/apps/promociones/routes.tsx"
  // app.ruta es "/promociones"
  apps.some((app) => path.includes(`/apps${app.ruta}/routes.tsx`))
);
```

**Resultado después del filtrado:**

- **Usuario con permisos limitados**: Solo carga `promociones` y `traslados`
- **Usuario administrador**: Carga todas las apps disponibles
- **Usuario básico**: Solo carga apps asignadas específicamente

#### Paso 4: Carga Bajo Demanda con Lazy Loading

Cuando el usuario navega a una aplicación, se carga el código necesario.

```typescript
// En routes.tsx de cada aplicación
import { lazy } from "react";

// lazy() crea una función que importa el componente solo cuando se necesita
const HomePage = lazy(() => import("./pages/Home"));
const CreatePage = lazy(() => import("./pages/Create"));
const EditPage = lazy(() => import("./pages/Edit"));

// Las rutas se definen normalmente, pero los componentes se cargan bajo demanda
const routes: RouteObject[] = [
  {
    path: "/promociones", // Ruta principal
    element: <PromotionsLayout />, // Este se carga inmediatamente
  },
  {
    path: "/promociones/crear", // Ruta para crear
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <CreatePromotionPage /> {/* Este se carga solo al visitar */}
      </Suspense>
    ),
  },
  {
    path: "/promociones/:id/editar", // Ruta para editar
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <EditPromotionPage /> {/* Este también se carga bajo demanda */}
      </Suspense>
    ),
  },
];
```

**¿Cómo funciona Suspense?**

- **Sin Suspense**: Usuario vería pantalla blanca mientras carga
- **Con Suspense**: Usuario ve un spinner o mensaje de carga
- **Fallback**: Componente que se muestra durante la carga

**¿Qué significa lazy loading aquí?**

- **Bundle Splitting**: Cada página se convierte en un archivo JavaScript separado
- **On-Demand Loading**: El archivo se descarga solo cuando se visita la ruta
- **Cache del Navegador**: Una vez cargado, queda en cache para visitas futuras

### 26.4. Sistema de Validación Automática de Módulos

Antes de registrar las rutas, el sistema valida que cada módulo tenga la estructura correcta.

```typescript
// Función que valida cada módulo cargado
const { routes: rutasValidadas, error } = loadAndValidateRoutes(modules);

if (error) {
  // Si hay errores, los muestra en consola para debugging
  error.forEach((err) => {
    console.error(`❌ ${err.code}: ${err.message}`);
    console.error(`📁 Archivo: ${err.path}`);
  });
}
```

**Validaciones realizadas automáticamente:**

- ✅ **Export Default**: Verifica que `routes.tsx` exporte `export default routes`
- ✅ **Formato de Rutas**: Confirma que todas las rutas comiencen con "/"
- ✅ **Estructura de Archivos**: Valida que existan carpetas `components/`, `hooks/`, etc.
- ✅ **Lazy Loading**: Verifica que se use `lazy()` para componentes pesados
- ✅ **Tipos TypeScript**: Confirma que los tipos estén correctamente definidos

**¿Qué pasa si una validación falla?**

- **En desarrollo**: Errores aparecen en consola del navegador
- **En producción**: Módulo se salta pero app continúa funcionando
- **Logging**: Todos los errores se registran para análisis posterior

### 26.5. Context API - Cómo se Comparte el Estado Global

El sistema usa React Context para compartir información entre todos los componentes.

```typescript
// AppContext.tsx - Define qué información está disponible globalmente
interface AppContextType {
  area: string | null; // Área funcional del usuario
  apps: App[]; // Lista de aplicaciones permitidas
  loading: boolean; // ¿Está cargando información?
  reloadApps: () => Promise<void>; // Función para recargar apps
}

// AppProvider.tsx - Proporciona el contexto a toda la app
<AppContext.Provider
  value={{
    area, // Ej: "produccion"
    apps, // Array de objetos App
    loading, // true/false
    reloadApps, // Función para refrescar
  }}
>
  {children} {/* Toda la aplicación puede acceder a esto */}
</AppContext.Provider>;

// Cualquier componente puede usar el hook useApps()
const MiComponente: React.FC = () => {
  const { apps, area, loading } = useApps();

  if (loading) return <div>Cargando aplicaciones...</div>;

  return (
    <div>
      <p>Área: {area}</p>
      <p>Aplicaciones disponibles: {apps.length}</p>
    </div>
  );
};
```

**¿Por qué Context API en lugar de props drilling?**

- **Simplicidad**: Cualquier componente accede sin pasar props por 10 niveles
- **Centralización**: Un solo lugar para gestionar estado global de apps
- **Reactividad**: Cuando cambia, todos los componentes se actualizan automáticamente
- **Separación**: Lógica de estado separada de lógica de UI

### 26.6. Integración Completa con React Router

El sistema combina rutas estáticas y dinámicas para crear la navegación completa.

```typescript
// AppRoutes.tsx - El componente principal que maneja todas las rutas
const AppRoutes: React.FC = () => {
  const { apps } = useApps(); // Obtiene apps permitidas del contexto

  return (
    <Routes>
      {/* 🔒 RUTAS ESTÁTICAS - Siempre disponibles */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/not-found" element={<NotFound />} />

      {/* 🔄 RUTAS DINÁMICAS - Basadas en permisos del usuario */}
      {apps.map((app) => (
        <Route
          key={app.id} // Clave única para React
          path={`${app.ruta}/*`} // Ruta con wildcard para sub-rutas
          element={<AppLayout />} // Layout que contiene la app
        />
      ))}

      {/* 🏠 RUTA POR DEFECTO - Redirige a home si no encuentra ruta */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
```

**¿Cómo funciona el wildcard `/*`?**

- **`/promociones/*`** coincide con `/promociones`, `/promociones/crear`, `/promociones/123/editar`
- **AppLayout** decide qué componente mostrar basado en la sub-ruta
- **Flexibilidad**: Cada app maneja sus propias sub-rutas internamente

**Flujo completo de navegación:**

```
Usuario hace clic en "Promociones" →
React Router activa ruta "/promociones" →
AppRoutes encuentra la ruta dinámica →
Carga AppLayout con la app de promociones →
AppLayout renderiza PromotionsLayout →
Usuario ve la aplicación de promociones
```

### 26.7. Optimizaciones de Performance en la Carga Dinámica

#### Code Splitting Automático

```typescript
// Vite automáticamente separa el código en chunks
// Chunk principal: app principal, routing, componentes compartidos
// Chunk promociones: solo cuando se visita /promociones
// Chunk traslados: solo cuando se visita /traslados
```

#### Preloading Inteligente

```typescript
// El sistema puede precargar apps que el usuario probablemente visite
const preloadApp = (appId: string) => {
  const app = apps.find((a) => a.id === appId);
  if (app) {
    // Carga el código en background sin bloquear UI
    import(`@/apps/${appId}/routes.tsx`);
  }
};
```

#### Cache Eficiente

- **Browser Cache**: Una vez cargada, la app queda en cache del navegador
- **Service Worker**: Puede cachear apps para uso offline
- **Memory Management**: Apps no usadas se pueden descargar de memoria

### 26.8. Manejo de Errores en la Carga Dinámica

```typescript
// Si una app falla al cargar, el sistema maneja el error
const AppLayout: React.FC = () => {
  return (
    <ErrorBoundary
      fallback={
        <div>
          <h2>Error al cargar la aplicación</h2>
          <button onClick={() => window.location.reload()}>
            Recargar página
          </button>
        </div>
      }
    >
      <Suspense fallback={<LoadingSpinner />}>
        <Outlet /> {/* Aquí se renderiza la app específica */}
      </Suspense>
    </ErrorBoundary>
  );
};
```

**Tipos de errores manejados:**

- **Error de Red**: Falló la descarga del código
- **Error de Import**: Archivo no encontrado o corrupto
- **Error de Render**: Componente tiene bugs
- **Error de Permisos**: Usuario ya no tiene acceso

### 26.9. Monitoreo y Analytics de la Carga Dinámica

```typescript
// El sistema puede medir performance de carga
const trackAppLoad = (appId: string, loadTime: number) => {
  // Envía métricas a servicio de analytics
  analytics.track("app_loaded", {
    app_id: appId,
    load_time_ms: loadTime,
    user_id: currentUser.id,
    timestamp: new Date().toISOString(),
  });
};
```

**Métricas importantes:**

- **Tiempo de carga inicial**: Cuánto tarda la app principal
- **Tiempo de carga por app**: Cuánto tarda cada aplicación específica
- **Tasa de éxito de carga**: Porcentaje de cargas exitosas
- **Uso de memoria**: Cuánta RAM usa cada app cargada

---

**Fin del Documento - Documentación Técnica Completa**

_Esta documentación incluye explicaciones detalladas de todos los sistemas internos del proyecto AppKancan, desde la implementación técnica hasta el funcionamiento real de cada componente._
