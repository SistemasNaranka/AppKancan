# Informe de Ventas

Aplicación para visualizar y analizar las ventas por asesor, tienda y zona.

## Descripción

Esta aplicación muestra información de ventas incluyendo:

- Nombre del asesor y su venta en unidades
- Valor de la venta
- Tienda/bodega a la que pertenece
- Ciudad y zona de ubicación
- Línea de venta (Colección, Básicos, Promoción)
- Agrupación (Indigo, Tela Liviana, Calzado, Complemento)

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Container                              │
│                      Puerto: 11000                               │
│  ┌─────────────────┐    ┌──────────────────────────────────┐     │
│  │   Frontend      │    │   API Backend                    │     │
│  │   (React)       │───▶│   (Express)                      │    │
│  │   /dist         │    │   /api/*                         │   │
│  └─────────────────┘    └──────────────────────────────────┘   │
│                                  │                               │
│                                  ▼                               │
│                         ┌─────────────────┐                     │
│                         │   MySQL DB      │                     │
│                         │ 192.168.19.250  │                     │
│                         │ kancan/naranka  │                     │
│                         └─────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

## Seguridad

### Variables de Entorno Protegidas

- El archivo `.env` está excluido de Git (incluido en `.gitignore`)
- Las credenciales de BD se configuran directamente en Coolify
- **Nunca** se exponen credenciales en el navegador

### Lo que NO es visible en el navegador:

- Credenciales de base de datos (`DB_USER`, `DB_PASSWORD`, `DB_HOST`)
- Conexión directa a MySQL
- Queries SQL

### Lo que SÍ es visible en el navegador:

- Llamadas a endpoints `/api/*`
- Respuestas JSON con datos procesados

## Despliegue en Coolify

### 1. Variables de Entorno en Coolify

Configura estas variables en el panel de Coolify:

| Variable      | Descripción         | Ejemplo          |
| ------------- | ------------------- | ---------------- |
| `DB_USER`     | Usuario de MySQL    | `tu_usuario`     |
| `DB_PASSWORD` | Contraseña de MySQL | `tu_contraseña`  |
| `DB_HOST`     | Host de MySQL       | `192.168.19.250` |
| `PORT`        | Puerto del servidor | `11000`          |

### 2. Proceso de Despliegue

1. Sube los cambios a GitHub
2. Coolify detectará los cambios automáticamente
3. Se construirá el contenedor Docker
4. Las variables de entorno se inyectan en tiempo de ejecución
5. La aplicación estará disponible en el puerto 11000

## Desarrollo Local

### Opción 1: Solo Frontend (sin datos reales)

```bash
# En la raíz del proyecto
npm run dev
```

### Opción 2: Frontend + Backend completo

```bash
# Terminal 1: Iniciar el servidor backend
cd server
npm install
DB_USER=tu_usuario DB_PASSWORD=tu_contraseña node index.js

# Terminal 2: Iniciar el frontend
npm run dev
```

## Estructura de Archivos

```
src/apps/informe_ventas/
├── api/
│   └── mysql/
│       └── read.ts          # API para conectar con backend
├── components/
│   ├── FiltrosVentas.tsx    # Componente de filtros contextuales
│   ├── TablaVentas.tsx      # Tabla de datos con checkboxes de agrupación
│   └── TarjetasResumen.tsx  # Tarjetas de resumen
├── hooks/
│   └── useInformeVentas.ts  # Hook principal de lógica
├── pages/
│   └── Home.tsx             # Página principal
├── types.ts                 # Tipos TypeScript
├── routes.tsx               # Configuración de rutas
└── README.md                # Este archivo

server/
├── index.js                 # Servidor Express (API + Frontend)
└── package.json             # Dependencias del servidor
```

## Endpoints de la API

| Endpoint                                      | Descripción                          |
| --------------------------------------------- | ------------------------------------ |
| `GET /api/health`                             | Verificar estado del servidor        |
| `GET /api/zonas?fecha_desde=&fecha_hasta=`    | Zonas filtradas por fecha            |
| `GET /api/ciudades?fecha_desde=&fecha_hasta=` | Ciudades filtradas por fecha         |
| `GET /api/tiendas?fecha_desde=&fecha_hasta=`  | Tiendas filtradas por fecha          |
| `GET /api/grupos-homogeneos`                  | Obtener grupos homogéneos            |
| `GET /api/grupos`                             | Obtener grupos con agrupación        |
| `GET /api/agrupaciones`                       | Agrupaciones mapeadas (4 valores)    |
| `GET /api/lineas-venta`                       | Líneas de venta mapeadas (3 valores) |
| `GET /api/asesores`                           | Obtener lista de asesores            |
| `GET /api/ventas?fecha_desde=&fecha_hasta=`   | Ventas con filtros completos         |

### Filtros del endpoint `/api/ventas`

| Parámetro     | Descripción                                |
| ------------- | ------------------------------------------ |
| `fecha_desde` | Fecha inicial (YYYY-MM-DD)                 |
| `fecha_hasta` | Fecha final (YYYY-MM-DD)                   |
| `bodega`      | Nombre de la tienda                        |
| `asesor`      | Nombre del vendedor                        |
| `zona`        | Zona geográfica                            |
| `ciudad`      | Ciudad                                     |
| `linea_venta` | Colección, Básicos, Promoción              |
| `agrupacion`  | Indigo, Tela Liviana, Calzado, Complemento |

## Filtros Contextuales

La aplicación implementa **filtros contextuales**: cada filtro muestra solo opciones válidas basadas en los filtros anteriores.

**Orden de aplicación:**

1. Fechas (obligatorias)
2. Zona → se carga según el rango de fechas
3. Ciudad → se filtra por zona seleccionada
4. Tienda → se filtra por ciudad seleccionada
5. Asesor → disponible según los filtros anteriores
6. Línea de Venta → Colección, Básicos, Promoción
7. Agrupación → Indigo, Tela Liviana, Calzado, Complemento

## Mapeo de Valores

### Líneas de Venta (BD → Usuario)

| Valor en BD   | Valor mostrado |
| ------------- | -------------- |
| `colección`   | Colección      |
| `basic`       | Básicos        |
| `promocion`   | Promoción      |
| `liquidacion` | Promoción      |
| `segundas`    | Promoción      |

### Agrupaciones (BD → Usuario)

| Valor en BD                             | Valor mostrado |
| --------------------------------------- | -------------- |
| `indigo`, `jeans`                       | Indigo         |
| `nacional`, `importado`, `tela liviana` | Tela Liviana   |
| `calzado`                               | Calzado        |
| `accesorios`                            | Complemento    |

## Base de Datos

Las consultas se realizan sobre las siguientes tablas:

### Base de datos `kancan`

- `bodegas` - Tiendas con ciudad y zona
- `ventas_YYYY` - Ventas por año
- `devoluciones_YYYY` - Devoluciones por año

### Base de datos `naranka`

- `referencias` - Referencias de productos
- `grupos_homogeneos` - Líneas de venta
- `grupos` - Agrupaciones (Indigo/Liviano)
- `ventas_YYYY` - Ventas por año
- `devoluciones_YYYY` - Devoluciones por año

## Características de la Interfaz

### Tabla de Ventas

- **Búsqueda**: Filtra por asesor, tienda, ciudad o zona
- **Ordenamiento**: Por cualquier columna
- **Paginación**: 25, 50 o 100 filas por página
- **Agrupaciones**: Checkboxes para seleccionar qué columnas mostrar
  - Indigo (unidades y valor)
  - Tela Liviano (unidades y valor)
  - Calzado (unidades y valor)
  - Complemento (unidades y valor)

### Tarjetas de Resumen

- Total Unidades
- Total Valor
- Promedio por Asesor

## Notas Importantes

1. El servidor backend y el frontend se ejecutan en el mismo contenedor
2. Las credenciales de MySQL se configuran como variables de entorno en Coolify
3. El puerto por defecto es 11000
4. La API está disponible en `/api/*` y el frontend en todas las demás rutas
5. Los filtros contextuales se cargan dinámicamente según el rango de fechas
6. Las consultas SQL usan parámetros preparados para prevenir inyección SQL
