# Documentación Técnica - Aplicación de Comparación de Plataformas

## 1. Introducción

### 1.1 Descripción General

La aplicación de Comparación de Plataformas es un módulo dentro de AppKancan que permite cargar, normalizar y comparar archivos de ventas de diferentes plataformas financieras (Sistecréditos, Transferencias, Addi, Redebán). La aplicación facilita la consolidación de datos de múltiples fuentes para su análisis y comparación.

### 1.2 Características Principales

- **Carga de archivos múltiples**: Soporte para CSV, XLS y XLSX
- **Normalización automática**: Mapeo de nombres de tiendas y columnas
- **Vista agrupada**: Agrupación de datos por tienda y fuente
- **Drag & Drop**: Arrastrar y soltar archivos para cargar
- **Exportación**: Descarga de archivos normalizados en Excel
- **Validación**: Verificación de calidad del mapeo de datos

---

## 2. Estructura del Proyecto

### 2.1 Organización de Directorios

```
src/apps/comparacion_plataformas/
├── api/                          # (No utilizado - usa services/)
│
├── components/                   # Componentes React reutilizables
│   ├── Button.tsx                # Botón personalizado
│   ├── CustomTabs.tsx            # Pestañas personalizadas
│   ├── FilePreview.tsx           # Vista previa de archivo
│   ├── FileSidebar.tsx           # Barra lateral de archivos
│   ├── GroupedView.tsx           # Vista agrupada por tienda
│   ├── HomeHeader.tsx            # Encabezado con acciones
│   ├── ValidationAlert.tsx       # Alertas de validación
│   └── modals/
│       └── Modalconfirmacion.tsx # Modal de confirmación
│
├── hooks/                        # Custom Hooks
│   └── useFileProcessor.ts       # Hook principal de procesamiento
│
├── pages/                        # Páginas de la aplicación
│   └── home.tsx                  # Página principal
│
├── services/                     # Servicios de API
│   └── mapeoService.ts           # Servicio de mapeo con Directus
│
├── types/                        # Definiciones de tipos
│   └── mapeo.types.ts            # Tipos de mapeo
│
├── utils/                        # Utilidades
│   ├── fileNormalization.ts      # Normalización de archivos
│   ├── formatters.ts             # Formateadores de datos
│   ├── sortingUtils.ts           # Utilidades de ordenamiento
│   └── storeSorting.ts           # Ordenamiento de tiendas
│
└── routes.tsx                    # Definición de rutas
```

---

## 3. Tipos de Datos

### 3.1 MapeoNombreArchivo

Estructura de datos proveniente de Directus (tabla `mapeo_nombres_archivos`):

```typescript
export interface MapeoNombreArchivo {
  id: number;
  Archivo_origen: string; // Nombre del archivo (ej: "Maria Perez - Bco Occidente")
  Tienda_archivo: string; // Nombre de tienda en el archivo
  Tienda_ID: number; // ID de la tienda
  Nombre: string; // Nombre normalizado final
  Terminal: string; // ID de terminal
  Idadquiriente?: string; // ID de adquiriente
}
```

### 3.2 MapeoArchivo

Configuración de normalización por tipo de archivo:

```typescript
export interface MapeoArchivo {
  archivoOrigen: string;
  columnasEliminar: string[];
}
```

### 3.3 TiendaMapeo

Mapeo de nombres de tiendas para reemplazo:

```typescript
export interface TiendaMapeo {
  archivoOrigen: string; // Tipo de archivo
  tiendaArchivo: string; // Nombre original en el archivo
  tiendaNormalizada: string; // Nombre final normalizado
  tiendaId: number; // ID de la tienda
  terminal?: string; // ID de terminal
  idadquiriente?: string; // ID de adquiriente
}
```

### 3.4 ArchivoSubido

Archivo subido por el usuario:

```typescript
export interface ArchivoSubido {
  nombre: string;
  tipo: string; // "CSV", "XLSX", "XLS"
  datos: any[];
  columnas: string[];
  normalizado?: boolean;
  tipoArchivo?: string;
  columnasEliminar?: string[];
}
```

---

## 4. Fuentes de Datos Soportadas

### 4.1 Plataformas Configuradas

| Plataforma     | Color   | Descripción              |
| -------------- | ------- | ------------------------ |
| SISTECREDITOS  | Azul    | Créditos Sistecréditos   |
| TRANSFERENCIAS | Verde   | Transferencias bancarias |
| ADDI           | Púrpura | Créditos Addi            |
| REDEBAN        | Naranja | Transacciones Redebán    |

### 4.2 Tipos de Archivo Reconocidos

| Archivo Origen                | Columnas a Eliminar                                   |
| ----------------------------- | ----------------------------------------------------- |
| Maria Perez - Bco Occidente   | RESPUESTA, ALIASEMISOR, TIPO, ENTIDAD_ORIGEN, etc.    |
| transactions                  | ID Transacción, Nombre Cliente, Tipo de venta, etc.   |
| ReporteDiariodeVentasComercio | Cantidad de Transacciones, Tasa Aerop o Propina, etc. |
| Creditos                      | Almacén, Identificación, Pagaré, Factura, etc.        |

---

## 5. Servicios

### 5.1 mapeoService

**Archivo:** [`src/apps/comparacion_plataformas/services/mapeoService.ts`](../src/apps/comparacion_plataformas/services/mapeoService.ts)

#### obtenerMapeosArchivos()

Obtiene los mapeos de la tabla `mapeo_nombres_archivos` desde Directus.

```typescript
export const obtenerMapeosArchivos = async (): Promise<MapeoNombreArchivo[]>
```

**Campos obtenidos:**

- `archivo_origen`
- `tienda_archivo`
- `terminal`
- `idadquiriente`
- `tienda_id.id`
- `tienda_id.nombre`

#### procesarMapeosParaNormalizacion()

Procesa los datos de Directus y genera las estructuras de mapeo.

```typescript
export const procesarMapeosParaNormalizacion = (
  mapeos: MapeoNombreArchivo[]
): { tablasMapeo: MapeoArchivo[]; tiendaMapeos: TiendaMapeo[] }
```

---

## 6. Hook Principal

### 6.1 useFileProcessor

**Archivo:** [`src/apps/comparacion_plataformas/hooks/useFileProcessor.ts`](../src/apps/comparacion_plataformas/hooks/useFileProcessor.ts)

Hook que maneja todo el procesamiento de archivos.

#### Estado

```typescript
const [archivos, setArchivos] = useState<ArchivoSubido[]>([]);
const [archivoSeleccionado, setArchivoSeleccionado] =
  useState<ArchivoSubido | null>(null);
const [tablasMapeo, setTablasMapeo] = useState<MapeoArchivo[]>([]);
const [tiendaMapeos, setTiendaMapeos] = useState<TiendaMapeo[]>([]);
const [cargando, setCargando] = useState(false);
const [cargandoMapeos, setCargandoMapeos] = useState(true);
const [errorMapeos, setErrorMapeos] = useState<string | null>(null);
const [validacionesArchivos, setValidacionesArchivos] = useState<
  Record<string, ResultadoValidacion>
>({});
```

#### Funciones Principales

| Función                          | Descripción                  |
| -------------------------------- | ---------------------------- |
| `cargarDatosMapeo()`             | Carga mapeos desde Directus  |
| `leerArchivo(archivo)`           | Lee y parsea CSV/Excel       |
| `procesarArchivosRaw(files)`     | Procesa archivos arrastrados |
| `handleSubirArchivos(e)`         | Maneja input de archivos     |
| `handleEliminarArchivo(nombre)`  | Elimina archivo de la lista  |
| `procesarArchivo(archivo)`       | Normaliza un archivo         |
| `normalizarTodosArchivos()`      | Normaliza todos los archivos |
| `exportarArchivosNormalizados()` | Exporta a Excel              |

#### Retorno

```typescript
return {
  archivos,
  archivoSeleccionado,
  cargando,
  cargandoMapeos,
  errorMapeos,
  validacionesArchivos,
  duplicadosAdvertencia,
  mostrarConfirmacionDuplicados,
  duplicadosParaNormalizar,
  setArchivoSeleccionado,
  handleSubirArchivos,
  handleEliminarArchivo,
  normalizarTodosArchivos,
  confirmarNormalizacionConDuplicados,
  cancelarNormalizacionConDuplicados,
  limpiarAdvertenciaDuplicados,
  exportarArchivosNormalizados,
  procesarArchivosRaw,
  gruposPorTienda,
  columnasPorFuente,
  cargarDatosMapeo,
};
```

---

## 7. Componentes Principales

### 7.1 Home

**Archivo:** [`src/apps/comparacion_plataformas/pages/home.tsx`](../src/apps/comparacion_plataformas/pages/home.tsx)

Página principal que orquesta toda la funcionalidad.

**Características:**

- Drag & Drop global para archivos
- Gestión de estados de carga y error
- Coordinación entre componentes hijos

**Estados:**

```typescript
const [mostrarAgrupado, setMostrarAgrupado] = useState(false);
const [busqueda, setBusqueda] = useState("");
const [valorSeleccionado, setValorSeleccionado] = useState<string | null>(null);
const [dragActive, setDragActive] = useState(false);
```

### 7.2 HomeHeader

**Archivo:** [`src/apps/comparacion_plataformas/components/HomeHeader.tsx`](../src/apps/comparacion_plataformas/components/HomeHeader.tsx)

Barra de acciones sticky con controles principales.

**Props:**

```typescript
interface HomeHeaderProps {
  archivos: ArchivoSubido[];
  cargando: boolean;
  cargandoMapeos: boolean;
  errorMapeos: string | null;
  mostrarAgrupado: boolean;
  setMostrarAgrupado: (val: boolean) => void;
  handleSubirArchivos: (e: React.ChangeEvent<HTMLInputElement>) => void;
  normalizarTodosArchivos: () => void;
  exportarArchivosNormalizados: (tiendaFiltrada?: string | null) => void;
  busqueda: string;
  setBusqueda: (val: string) => void;
  valorSeleccionado: string | null;
  setValorSeleccionado: (val: string | null) => void;
  tiendasDisponibles: string[];
  procesarArchivosRaw: (files: FileList | File[]) => Promise<void>;
}
```

**Acciones:**

- Subir archivos
- Normalizar archivos
- Exportar a Excel
- Cambiar vista (individual/agrupada)
- Buscar tiendas

### 7.3 GroupedView

**Archivo:** [`src/apps/comparacion_plataformas/components/GroupedView.tsx`](../src/apps/comparacion_plataformas/components/GroupedView.tsx)

Vista agrupada por tienda con tablas por fuente.

**Props:**

```typescript
interface GroupedViewProps {
  gruposPorTienda: Record<string, Record<string, any[]>>;
  columnasPorFuente: Record<string, string[]>;
  busqueda: string;
  valorSeleccionado: string | null;
}
```

**Características:**

- Grid 2x2 de tablas por fuente
- Totales por fuente y tienda
- Colores diferenciados por plataforma
- Resaltado de valores negativos o cero

### 7.4 FileSidebar

**Archivo:** [`src/apps/comparacion_plataformas/components/FileSidebar.tsx`](../src/apps/comparacion_plataformas/components/FileSidebar.tsx)

Barra lateral con lista de archivos cargados.

**Funcionalidades:**

- Lista de archivos con iconos
- Indicador de archivo seleccionado
- Botón de eliminar por archivo
- Indicador de estado (normalizado/sin normalizar)

### 7.5 FilePreview

**Archivo:** [`src/apps/comparacion_plataformas/components/FilePreview.tsx`](../src/apps/comparacion_plataformas/components/FilePreview.tsx)

Vista previa de datos del archivo seleccionado.

**Características:**

- Tabla con datos del archivo
- Scroll horizontal para muchas columnas
- Indicador de tipo de archivo

### 7.6 ValidationAlert

**Archivo:** [`src/apps/comparacion_plataformas/components/ValidationAlert.tsx`](../src/apps/comparacion_plataformas/components/ValidationAlert.tsx)

Muestra alertas de validación del mapeo.

**Tipos de alertas:**

- Errores de mapeo
- Advertencias de calidad
- Estadísticas de procesamiento

---

## 8. Utilidades

### 8.1 fileNormalization

**Archivo:** [`src/apps/comparacion_plataformas/utils/fileNormalization.ts`](../src/apps/comparacion_plataformas/utils/fileNormalization.ts)

#### fuzzyMatch()

Calcula similitud entre dos strings usando fuzzy matching.

```typescript
export const fuzzyMatch = (search: string, target: string): number
```

**Retorna:** Valor entre 0 y 1

**Normalización:**

- Convierte a minúsculas
- Elimina fechas (DD-MM-YYYY, YYYY-MM-DD)
- Elimina caracteres especiales
- Compara palabras clave

#### findBestMatch()

Encuentra el mejor mapeo para un nombre de archivo.

```typescript
export const findBestMatch = (
  fileName: string,
  mappingTable: MapeoArchivo[]
): { mapeo: MapeoArchivo; tipoArchivo: string } | null
```

**Umbral mínimo:** 50% de coincidencia

#### eliminarColumnasPorNombre()

Elimina columnas específicas de los datos.

```typescript
export const eliminarColumnasPorNombre = (
  datos: any[],
  columnasEliminar: string[]
): any[]
```

#### mapearNombresTiendasEnTodasLasCeldas()

Mapea nombres de tiendas en todas las celdas de los datos.

#### validarDatosNormalizados()

Valida la calidad del mapeo de tiendas.

```typescript
export const validarDatosNormalizados = (
  datos: any[],
  tipoArchivo: string
): ResultadoValidacion
```

### 8.2 formatters

**Archivo:** [`src/apps/comparacion_plataformas/utils/formatters.ts`](../src/apps/comparacion_plataformas/utils/formatters.ts)

#### formatearValor()

Formatea un valor según el tipo de columna.

```typescript
export const formatearValor = (valor: any, nombreColumna: string): string
```

#### formatearMoneda()

Formatea un número como moneda.

```typescript
export const formatearMoneda = (valor: number): string
```

### 8.3 sortingUtils

**Archivo:** [`src/apps/comparacion_plataformas/utils/sortingUtils.ts`](../src/apps/comparacion_plataformas/utils/sortingUtils.ts)

Utilidades para ordenar grupos de datos.

### 8.4 storeSorting

**Archivo:** [`src/apps/comparacion_plataformas/utils/storeSorting.ts`](../src/apps/comparacion_plataformas/utils/storeSorting.ts)

Ordenamiento específico de tiendas por código.

---

## 9. Flujo de Datos

### 9.1 Flujo de Carga

```
┌─────────────────┐
│ Usuario         │
│ arrastra        │
│ archivos        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ procesarArchivos│
│ Raw()           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ leerArchivo()   │
│ (CSV/Excel)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ findBestMatch() │
│ (identificar    │
│  tipo)          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ setArchivos()   │
│ (actualizar     │
│  estado)        │
└─────────────────┘
```

### 9.2 Flujo de Normalización

```
┌─────────────────┐
│ normalizarTodos │
│ Archivos()      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ procesarArchivo │
│ (por cada uno)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ mapearNombres   │
│ Tiendas()       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ eliminarColumnas│
│ PorNombre()     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ validarDatos    │
│ Normalizados()  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ setValidaciones │
│ Archivos()      │
└─────────────────┘
```

### 9.3 Flujo de Exportación

```
┌─────────────────┐
│ exportarArchivos│
│ Normalizados()  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ExcelJS Workbook│
│ (crear libro)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ agregarHojaPor  │
│ Tienda()        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ saveAs()        │
│ (descargar)     │
└─────────────────┘
```

---

## 10. Rutas

### 10.1 Definición

**Archivo:** [`src/apps/comparacion_plataformas/routes.tsx`](../src/apps/comparacion_plataformas/routes.tsx)

```typescript
const routes: RouteObject[] = [
  {
    path: "/comparacion_plataformas",
    element: <Home />,
  },
];
```

### 10.2 Acceso

URL: `/comparacion_plataformas`

---

## 11. Dependencias

### 11.1 Librerías Externas

| Librería        | Uso                        |
| --------------- | -------------------------- |
| `@mui/material` | Componentes de UI          |
| `papaparse`     | Parseo de archivos CSV     |
| `xlsx`          | Lectura de archivos Excel  |
| `exceljs`       | Creación de archivos Excel |
| `file-saver`    | Descarga de archivos       |
| `@directus/sdk` | Conexión con Directus      |

### 11.2 Servicios Internos

| Servicio           | Ubicación                             |
| ------------------ | ------------------------------------- |
| `directus`         | `@/services/directus/directus`        |
| `withAutoRefresh`  | `@/auth/services/directusInterceptor` |
| `setTokenDirectus` | `@/services/directus/auth`            |

---

## 12. Manejo de Errores

### 12.1 Errores de Carga

| Error                      | Causa                   | Solución             |
| -------------------------- | ----------------------- | -------------------- |
| "Formato no soportado"     | Extensión no válida     | Usar CSV, XLS o XLSX |
| "Error al leer el archivo" | Archivo corrupto        | Verificar integridad |
| "Error al cargar mapeos"   | Sin conexión a Directus | Verificar conexión   |

### 12.2 Errores de Mapeo

| Error                         | Causa                        | Solución                          |
| ----------------------------- | ---------------------------- | --------------------------------- |
| "No se encontró coincidencia" | Archivo no reconocido        | Agregar mapeo en Directus         |
| "Tienda no mapeada"           | Nombre de tienda desconocido | Actualizar mapeo_nombres_archivos |

---

## 13. Optimizaciones

### 13.1 Lectura de Excel

```typescript
const workbook = XLSX.read(arrayData, {
  type: "array",
  cellDates: true,
  cellStyles: false, // Ignorar estilos
  cellFormula: false, // Ignorar fórmulas
  cellNF: false, // Ignorar formatos numéricos
});
```

### 13.2 Procesamiento Paralelo

```typescript
const nuevosArchivos = await Promise.all(
  fileArray.map(async (file) => {
    // Procesar archivos en paralelo
  }),
);
```

### 13.3 Memoización

```typescript
const gruposFiltrados = useMemo(() => {
  // Filtrar y calcular totales
}, [gruposPorTienda, busqueda, valorSeleccionado]);
```

---

## 14. Configuración de Directus

### 14.1 Tabla: mapeo_nombres_archivos

| Campo          | Tipo     | Descripción               |
| -------------- | -------- | ------------------------- |
| id             | integer  | ID único                  |
| archivo_origen | string   | Tipo de archivo           |
| tienda_archivo | string   | Nombre original de tienda |
| tienda_id      | relation | Relación a tienda         |
| terminal       | string   | ID de terminal            |
| idadquiriente  | string   | ID de adquiriente         |

### 14.2 Permisos Requeridos

- Lectura sobre `mapeo_nombres_archivos`
- Lectura sobre `tiendas` (relación)

---

## 15. Casos de Uso

### 15.1 Cargar y Normalizar Archivos

1. Arrastrar archivos a la aplicación
2. Los archivos se identifican automáticamente
3. Click en "Normalizar"
4. Revisar validaciones
5. Exportar si es correcto

### 15.2 Comparar Ventas por Tienda

1. Cargar archivos de todas las plataformas
2. Normalizar todos los archivos
3. Cambiar a "Vista Agrupada"
4. Buscar tienda específica
5. Comparar totales por fuente

### 15.3 Exportar Datos Consolidados

1. Cargar y normalizar archivos
2. Click en "Exportar"
3. Se descarga archivo Excel con:
   - Una hoja por tienda
   - Datos de todas las fuentes
   - Totales calculados

---

_Documentación actualizada: Enero 2024_
_Versión: 1.0_
