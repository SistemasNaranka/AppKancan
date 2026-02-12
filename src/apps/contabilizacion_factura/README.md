# Módulo de Contabilización de Facturas

Este módulo maneja la contabilización y gestión de facturas en la aplicación.

## 📁 Estructura de Carpetas

```
contabilizacion_factura/
├── api/
│   └── directus/
│       ├── read.ts          # Funciones de lectura desde Directus
│       └── create.ts        # Funciones de creación/actualización/eliminación
├── components/
│   └── WelcomeMessage.tsx   # Componente de mensaje de bienvenida
├── hooks/
│   └── useContabilizacionFactura.ts  # Hook personalizado para lógica del módulo
├── layouts/
│   └── MainLayout.tsx       # Layout principal del módulo
├── pages/
│   └── Home.tsx             # Página principal
├── types/
│   └── index.ts             # Tipos e interfaces TypeScript
└── routes.tsx               # Configuración de rutas
```

## 🎯 Convenciones

- **api/**: Lógica para interactuar con Directus
  - `directus/read.ts`: Funciones de lectura
  - `directus/create.ts`: Funciones de creación, actualización y eliminación

- **components/**: Componentes visuales específicos del módulo
  - Listas de datos, formularios, detalles individuales

- **hooks/**: Lógica reutilizable y manejo de estado
  - `useContabilizacionFactura.ts`: Hook principal del módulo

- **pages/**: Vistas principales que se visualizan en la plataforma

- **layouts/**: Estructura visual general de la aplicación

- **types/**: Interfaces y tipos TypeScript específicos del módulo

## 🚀 Uso

El módulo está disponible en la ruta `/contabilizacion-factura` de la aplicación.

## 📝 Próximos Pasos

1. Definir el esquema de datos en Directus
2. Implementar componentes de lista y formularios
3. Agregar validaciones y manejo de errores
4. Implementar funcionalidades específicas del negocio
