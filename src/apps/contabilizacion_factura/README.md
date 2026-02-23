# Módulo de Contabilización de Facturas

Este módulo maneja la contabilización y gestión de facturas mediante extracción de datos con IA.

## 📁 Estructura de Carpetas

```
contabilizacion_factura/
├── components/
│   ├── FeedbackComponents.tsx   # Componentes de feedback (procesamiento, error, éxito)
│   ├── FileUploadArea.tsx       # Área de carga de archivos con drag-and-drop
│   ├── IAStatusBadge.tsx        # Indicadores de estado de IA (Gemini/Ollama)
│   └── InvoiceInfoCard.tsx      # Tarjeta de información de factura extraída
├── hooks/
│   └── useHybridExtractor.ts    # Hook híbrido para extracción con Gemini/Ollama
├── pages/
│   └── Home.tsx                 # Página principal del módulo
├── types/
│   └── index.ts                 # Tipos e interfaces TypeScript
├── utils/
│   └── resolucion.ts            # Utilidades y configuración de estados
├── actualizarResolucion.exe     # Ejecutable corporativo
├── ejecutar.vbs                 # Script VBS para ejecutar el .exe
└── routes.tsx                   # Configuración de rutas
```

## 🎯 Convenciones

- **components/**: Componentes visuales específicos del módulo
  - `FeedbackComponents.tsx`: Componentes de procesamiento, error y éxito
  - `FileUploadArea.tsx`: Zona de carga de PDFs
  - `IAStatusBadge.tsx`: Indicadores de estado de conexión IA
  - `InvoiceInfoCard.tsx`: Visualización de datos de factura

- **hooks/**: Lógica reutilizable y manejo de estado
  - `useHybridExtractor.ts`: Hook principal para extracción con Gemini (primario) y Ollama (fallback)

- **pages/**: Vistas principales que se visualizan en la plataforma

- **types/**: Interfaces y tipos TypeScript específicos del módulo

- **utils/**: Utilidades y constantes de configuración

## 🤖 Funcionamiento de la IA

El módulo utiliza un sistema híbrido de extracción:

1. **Google Gemini** (primario): Procesa el PDF directamente
2. **Ollama** (fallback): Procesa una imagen del PDF si Gemini falla

La API key de Gemini y el modelo se obtienen del usuario autenticado (campos `key_gemini` y `modelo_ia` en Directus).

## 🚀 Uso

El módulo está disponible en la ruta `/contabilizacion_factura` de la aplicación.

## 📝 Flujo de Trabajo

1. Usuario carga un archivo PDF
2. El sistema valida el archivo
3. Se extraen los datos usando IA
4. Se muestran los datos extraídos para revisión
5. Usuario puede ejecutar el programa corporativo para actualizar la resolución
