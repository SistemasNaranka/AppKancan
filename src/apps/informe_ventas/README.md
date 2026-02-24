# Informe de Ventas

Aplicación para visualizar y analizar las ventas por asesor, tienda y zona.

## Descripción

Esta aplicación muestra información de ventas incluyendo:

- Nombre del asesor y su venta en unidades
- Valor de la venta
- Tienda/bodega a la que pertenece
- Zona de ubicación
- Línea de venta (colección, básicos, promoción, liquidación, segunda)
- Agrupación (Indigo/Liviano)

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                  Docker Container                        │
│                    Puerto: 11000                         │
│  ┌─────────────────┐    ┌──────────────────────────┐   │
│  │   Frontend      │    │   API Backend            │   │
│  │   (React)       │───▶│   (Express)              │   │
│  │   /dist         │    │   /api/*                 │   │
│  └─────────────────┘    └──────────────────────────┘   │
│                                  │                       │
│                                  ▼                       │
│                         ┌─────────────────┐             │
│                         │   MySQL DB      │             │
│                         │ 192.168.19.250  │             │
│                         │ kancan/naranka  │             │
│                         └─────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

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
4. La aplicación estará disponible en el puerto 11000

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
│   ├── FiltrosVentas.tsx    # Componente de filtros
│   ├── TablaVentas.tsx      # Tabla de datos
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

| Endpoint                                    | Descripción                   |
| ------------------------------------------- | ----------------------------- |
| `GET /api/health`                           | Verificar estado del servidor |
| `GET /api/zonas`                            | Obtener zonas/procesos        |
| `GET /api/ciudades`                         | Obtener ciudades              |
| `GET /api/tiendas`                          | Obtener tiendas/bodegas       |
| `GET /api/grupos-homogeneos`                | Obtener grupos homogéneos     |
| `GET /api/ventas?fecha_desde=&fecha_hasta=` | Obtener ventas con filtros    |
| `GET /api/asesores`                         | Obtener lista de asesores     |

## Filtros Disponibles

- **Fecha Desde/Hasta**: Rango de fechas para la consulta
- **Zona**: Filtrar por zona/proceso
- **Ciudad**: Filtrar por ciudad
- **Tienda/Bodega**: Filtrar por tienda específica
- **Asesor**: Filtrar por nombre de asesor
- **Línea de Venta**: Colección, Básicos, Promoción, Liquidación, Segunda
- **Agrupación**: Indigo, Liviano

## Base de Datos

Las consultas se realizan sobre las siguientes tablas:

### Base de datos `kancan`

- `procesos` - Zonas
- `ciudades` - Ciudades
- `bodegas` - Tiendas
- `ventas_YYYY` - Ventas por año
- `devoluciones_YYYY` - Devoluciones por año

### Base de datos `naranka`

- `grupos_homogeneos` - Agrupaciones y líneas de venta
- `ventas_YYYY` - Ventas por año
- `devoluciones_YYYY` - Devoluciones por año

## Notas Importantes

1. El servidor backend y el frontend se ejecutan en el mismo contenedor
2. Las credenciales de MySQL se configuran como variables de entorno en Coolify
3. El puerto por defecto es 11000
4. La API está disponible en `/api/*` y el frontend en todas las demás rutas
