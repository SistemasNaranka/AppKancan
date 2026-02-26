# Documentación Técnica Completa - Aplicación de Comisiones

## 1. Estructura del Proyecto

### 1.1 Organización General del Proyecto

El proyecto AppKancan es una aplicación web desarrollada con React y TypeScript que gestiona el sistema de comisiones por cumplimiento de una empresa comercial. La aplicación está estructurada de forma modular, separando claramente las responsabilidades entre componentes de UI, lógica de negocio, servicios de API y definiciones de tipados.

La aplicación de comisiones reside específicamente en el directorio `src/apps/comisiones/` y contiene todos los archivos necesarios para el cálculo, visualización y gestión de comisiones de empleados. Esta modularización permite que la aplicación de comisiones pueda ser mantenida, actualizada y probada de forma independiente del resto del sistema.

El proyecto utiliza Vite como herramienta de construcción, lo que proporciona tiempos de desarrollo rápidos y optimizaciones de producción eficientes. La gestión de estado se realiza mediante una combinación de React Context para el estado global de la aplicación y TanStack Query para el manejo de datos asíncronos con caché inteligente. La interfaz de usuario está construida principalmente con Material UI (MUI) complemented con estilos personalizados mediante Tailwind CSS.

### 1.2 Estructura de Directorios Detallada

La estructura de directorios de la aplicación de comisiones sigue una arquitectura basada en características, donde cada módulo de funcionalidad tiene su propia carpeta con todos los recursos necesarios. Esta organización facilita la navegación del código y permite que los nuevos desarrolladores encuentren rápidamente los archivos relevantes para cada funcionalidad.

```
src/apps/comisiones/
├── api/                          # Capa de comunicación con servicios externos
│   └── directus/                 # Integración con Directus CMS
│       ├── create.ts            # Funciones para operaciones de escritura
│       └── read.ts              # Funciones para operaciones de lectura
│
├── components/                   # Componentes React reutilizables
│   ├── Charts.tsx               # Contenedor de gráficos principales
│   ├── ConfigurationPanel.tsx   # Panel de configuración de porcentajes
│   ├── ConfigurationTabsPanel.tsx # Panel con pestañas de configuración
│   ├── CSVData.tsx              # Procesamiento de datos CSV
│   ├── SummaryCards.tsx         # Tarjetas de resumen
│   │
│   ├── charts/                  # Componentes de gráficos
│   │   ├── CommissionDistributionChart.tsx
│   │   ├── NoDataChartMessage.tsx
│   │   └── TopSellersByRoleChart.tsx
│   │
│   ├── dataTable/               # Componentes de tabla de datos
│   │   ├── DataTable.tsx        # Tabla principal de visualización
│   │   ├── DataTableAccordion.tsx # Acordeón para tiendas
│   │   ├── DataTableAccordionTable.tsx # Tabla dentro del acordeón
│   │   └── PerformanceMessage.tsx # Mensaje de rendimiento
│   │
│   ├── modals/                  # Componentes de modales
│   │   ├── AddEmployeeSection.tsx
│   │   ├── AssignedEmployeesList.tsx
│   │   ├── AssignedEmployeesSection.tsx
│   │   ├── CodesModal.tsx       # Modal de códigos y asignación
│   │   ├── DaysWithoutBudgetPanel.tsx
│   │   ├── EditStoreBudgetModal.tsx
│   │   ├── EditStoreModalSimplified.tsx
│   │   ├── EmployeeInfoCard.tsx
│   │   ├── EmployeeSelector.tsx
│   │   ├── HomeModals.tsx       # Colección de modales
│   │   ├── InlineMessage.tsx
│   │   ├── NoDataModal.tsx
│   │   └── StoreFilterModal.tsx
│   │
│   └── ui/                      # Componentes de UI generales
│       ├── ExportButtons.tsx    # Botones de exportación
│       ├── HomeHeader.tsx       # Encabezado principal
│       ├── LoadingState.tsx     # Componente de carga
│       └── SimpleFilters.tsx    # Filtros simples
│
├── contexts/                    # Contextos de React
│   └── CommissionContext.tsx    # Estado global de comisiones
│
├── hooks/                       # Custom Hooks
│   ├── useAvailableMonths.ts    # Gestión de meses disponibles
│   ├── useBudgetValidation.ts   # Validación de presupuestos
│   ├── useEditStoreBudgetModalLogic.ts # Lógica del modal de edición de presupuesto
│   ├── useEditStoreModalLogic.ts # Lógica del modal de edición de tienda
│   ├── useEmployeeData.ts       # Datos de empleados
│   ├── useEmployeeManagement.ts # Gestión de empleados
│   ├── useEmployeeOperations.ts # Operaciones sobre empleados
│   ├── useFilters.optimized.ts  # Filtros optimizados
│   ├── useOptimizedCommissionData.ts # Datos de comisiones optimizados
│   ├── usePermissionsValidation.ts # Validación de permisos
│   ├── useStoreManagement.ts    # Gestión de tiendas
│   └── useUserPolicies.ts       # Políticas de usuario
│
├── lib/                         # Lógica de negocio
│   ├── calculations.budgets.ts  # Cálculos de presupuestos
│   ├── calculations.commissions.ts # Cálculos de comisiones
│   ├── calculations.summary.ts  # Resúmenes y totales
│   ├── calculations.utils.ts    # Utilidades de cálculos (combina basic, data, next-commission)
│   ├── modalHelpers.ts          # Utilidades de modales
│   ├── utils.ts                 # Utilidades generales
│   └── validation.ts            # Validaciones
│
├── pages/                       # Páginas de la aplicación
│   └── Home.tsx                 # Página principal de comisiones
│
├── routes.tsx                   # Configuración de rutas
├── types.ts                     # Definiciones TypeScript principales
└── types/
    └── modal.ts                 # Tipos de modales
```

### 1.3 Propósito de Cada Directorio y Archivo

El directorio `api/directus/` contiene todas las funciones que se comunican con el backend de Directus. Esta separación permite que la lógica de comunicación con servicios externos esté centralizada y pueda ser modificada sin afectar el resto de la aplicación. El archivo `read.ts` contiene funciones para obtener datos como tiendas, asesores, presupuestos y ventas, mientras que `create.ts` contiene funciones para guardar y actualizar información.

El directorio `components/` alberga todos los elementos visuales de la interfaz. Cada componente está diseñado para ser reutilizable y tener una responsabilidad específica. Por ejemplo, `SummaryCards.tsx` solo se encarga de mostrar las tarjetas de resumen con los totales, mientras que `DataTable.tsx` maneja la presentación de datos tabulares con todas sus funcionalidades de filtrado y paginación.

El directorio `hooks/` contiene hooks personalizados que encapsulan lógica reutilizable. Estos hooks separan la lógica de presentación de la lógica de negocio, facilitando las pruebas y el mantenimiento. El hook `useOptimizedCommissionData.ts` es particularmente importante ya que maneja toda la carga de datos con caché y optimizaciones de rendimiento.

El directorio `lib/` contiene la lógica de negocio pura, sin dependencias de React. Esta arquitectura permite que estas funciones sean fácilmente testeables y reutilizables. Los archivos de cálculos están organizados por funcionalidad, haciendo que sea sencillo encontrar la lógica específica para cada tipo de cálculo.

---

## 2. Arquitectura y Patrones de Diseño

### 2.1 Arquitectura General del Sistema

La aplicación de comisiones sigue una arquitectura basada en componentes con flujo unidireccional de datos. Esta arquitectura se inspira en patrones de Flux y utiliza React Context para mantener un estado global accesible desde cualquier componente de la aplicación. El flujo de datos sigue el patrón: API → TanStack Query → Context → Componentes, garantizando que los datos fluyan de forma predecible y sean fácilmente rastreables.

La comunicación con el backend se realiza exclusivamente a través de Directus SDK, que proporciona una capa de abstracción sobre las operaciones CRUD. Todas las operaciones de lectura utilizan TanStack Query para beneficiarse del caché automático, la invalidación inteligente y los estados de carga. Las operaciones de escritura invalidan el caché correspondiente para forzar una actualización de los datos en pantalla.

El sistema implementa el patrón de separación de preocupaciones, donde cada capa tiene una responsabilidad específica. Los componentes de UI solo se encargan de la presentación, los hooks contienen lógica de presentación y estado, los contextos manejan el estado global, y la carpeta `lib` contiene lógica de negocio pura independiente de React.

### 2.2 Patrones de Diseño Implementados

La aplicación implementa varios patrones de diseño que mejoran la mantenibilidad y escalabilidad del código. El patrón de Provider se utiliza extensivamente con React Context para hacer accesible el estado de comisiones a todos los componentes que lo necesitan sin crear cadenas de props innecesarias. El `CommissionContext` envuelve toda la aplicación de comisiones y proporciona funciones para actualizar y acceder a los datos.

El patrón de Hook personalizado se usa para extraer lógica reutilizable en funciones independientes. Cada hook tiene una responsabilidad específica: `useOptimizedCommissionData` maneja la carga de datos, `useUserPolicies` gestiona los permisos, y `useFiltersOptimized` maneja la lógica de filtrado. Este patrón permite que la lógica sea compartida entre componentes y probada de forma independiente.

El patrón de Componente de Orden Superior (HOC) se aplica de forma implícita a través de la composición de componentes. Por ejemplo, el componente `DataTable` está construido componiendo componentes más pequeños como `DataTableAccordion`, `DataTableColumns` y `DataTableSkeleton`. Esta composición permite que cada componente sea más simple y fácil de mantener.

El patrón de Estrategia se utiliza en los cálculos de comisiones, donde diferentes roles de empleados tienen diferentes estrategias de cálculo. Las funciones `calculateGerenteCommission`, `calculateCajeroCommission` y `calculateGerenteOnlineCommission` implementan diferentes estrategias según el rol del empleado, permitiendo agregar nuevos roles sin modificar el código existente.

### 2.3 Flujo de Datos en la Aplicación

El flujo de datos en la aplicación de comisiones sigue un camino bien definido que comienza con la selección de un mes por parte del usuario. Cuando el usuario selecciona un mes, el componente `Home.tsx` utiliza el hook `useOptimizedCommissionData` para iniciar la carga de datos. Este hook utiliza TanStack Query para obtener los datos de la API de Directus, aplicando caché para evitar cargas innecesarias.

Una vez que los datos son obtenidos, pasan por un proceso de transformación donde se convierten de los formatos de Directus a los tipos internos de la aplicación. Por ejemplo, los registros de presupuestos diarios se transforman en objetos `BudgetRecord`, y los asesores se convierten en objetos `StaffMember`. Esta transformación se realiza en la función `processCommissionData` del hook.

Los datos transformados se sincronizan con el `CommissionContext` mediante las funciones `setBudgets`, `setStaff`, `setMonthConfigs` y `setVentas`. El contexto entonces actualiza su estado interno, lo que provoca que los componentes suscritos se re-rendericen con los nuevos datos. Los componentes como `SummaryCards`, `DataTable` y `Charts` reciben estos datos y los presentan al usuario.

Cuando el usuario realiza una modificación, como asignar empleados o cambiar presupuestos, los cambios se envían a la API mediante las funciones del módulo `create.ts`. Tras una escritura exitosa, el hook `useOptimizedCommissionData` invalida el caché correspondiente, forzando una recarga de datos que refleja los cambios realizados.

### 2.4 Gestión de Estado

La gestión de estado en la aplicación se divide en dos niveles: estado global y estado local. El estado global, manejado por `CommissionContext`, contiene los datos principales de la aplicación: presupuestos, personal, configuraciones mensuales y ventas. Este estado es accesible desde cualquier componente de la aplicación de comisiones y se actualiza mediante funciones proporcionadas por el contexto.

El estado local se maneja mediante `useState` dentro de los componentes individuales. Cada componente mantiene el estado que necesita para su funcionamiento, como el estado de expansión de acordeones, valores de filtros seleccionados y visibilidad de modales. Este estado local no necesita ser compartido y por lo tanto no se eleva al contexto global.

TanStack Query añade una tercera capa de gestión de estado: el estado del servidor. Este incluye datos en caché, estados de carga, errores y metadatos de las peticiones. La ventaja de usar TanStack Query es que maneja automáticamente escenarios complejos como la deduplicación de peticiones, la renovación de datos en segundo plano y la sincronización entre pestañas del navegador.

---

## 3. Tipos y Modelos de Datos

### 3.1 Definiciones TypeScript Principales

La aplicación utiliza TypeScript extensivamente para definir tipos estáticos que mejoran la seguridad del código y la experiencia de desarrollo. Todos los tipos están definidos en el archivo `types.ts` y en archivos de tipo específicos como `modal.ts`. Estas definiciones sirven como documentación viva del dominio de la aplicación.

El tipo `Role` define todos los roles de empleados posibles en el sistema:

```typescript
export type Role =
  | "gerente"
  | "asesor"
  | "cajero"
  | "logistico"
  | "gerente_online"
  | "coadministrador";
```

Cada rol tiene implicaciones específicas en el cálculo de comisiones, como se detalla en las secciones de lógica de negocio. El sistema está diseñado para que agregar nuevos roles sea relativamente sencillo: solo es necesario agregar el nuevo rol al tipo `Role` y crear las funciones de cálculo correspondientes.

### 3.1.1 Configuración de Umbrales de Comisión (Nuevo)

El sistema ahora soporta configuración dinámica de umbrales de comisión desde la base de datos:

```typescript
// Un umbral individual de comisión
export interface CommissionThreshold {
  cumplimiento_min: number; // Porcentaje mínimo (90, 95, 100, 110...)
  comision_pct: number; // Porcentaje en decimal (0.0035 = 0.35%)
  nombre: string; // Etiqueta para UI ("Muy Regular", "Regular"...)
  color?: string; // Color hexadecimal opcional
}

// Configuración de umbrales por mes
export interface CommissionThresholdConfig {
  mes: string; // "MMM YYYY"
  anio: string; // "YYYY"
  cumplimiento_valores: CommissionThreshold[];
}
```

Esta configuración permite modificar los porcentajes de comisión sin cambiar el código, directamente desde Directus.

### 3.2 Estructuras de Datos Principales

El tipo `BudgetRecord` representa un presupuesto diario de una tienda y contiene la siguiente información:

```typescript
export interface BudgetRecord {
  tienda: string; // Nombre de la tienda
  tienda_id: number; // ID de la tienda en Directus
  empresa: string; // Nombre de la empresa
  fecha: string; // Fecha en formato YYYY-MM-DD
  presupuesto_total: number; // Presupuesto total del día
  presupuesto_gerente?: number; // Presupuesto asignado al gerente
  presupuesto_asesores?: number; // Presupuesto total de asesores
}
```

Este registro es fundamental porque representa el punto de partida para todos los cálculos de comisiones. El presupuesto total se distribuye entre los diferentes roles según las reglas configuradas para el mes correspondiente.

El tipo `StaffMember` representa a un empleado y sus datos básicos:

```typescript
export interface StaffMember {
  id: string; // ID único del empleado
  nombre: string; // Nombre completo
  documento: number; // Documento de identidad
  tienda: string; // Tienda donde trabaja
  fecha: string; // Fecha de asignación
  rol: Role; // Rol del empleado
}
```

El tipo `EmployeeCommission` es el resultado de todos los cálculos y contiene información detallada sobre la comisión de cada empleado:

```typescript
export interface EmployeeCommission {
  id: string;
  nombre: string;
  documento: number;
  rol: Role;
  cargo_id?: number;
  tienda: string;
  fecha: string;
  presupuesto: number; // Presupuesto del empleado
  ventas: number; // Ventas realizadas
  cumplimiento_pct: number; // Porcentaje de cumplimiento
  comision_pct: number; // Porcentaje de comisión aplicado
  comision_monto: number; // Monto de comisión calculado
  proxima_comision: number | string; // Próxima comisión o 'NN' si está en máximo
  proximo_presupuesto?: number; // Presupuesto necesario para siguiente comisión
  proxima_venta?: number; // Venta adicional necesaria
  proximo_monto_comision?: number; // Comisión que recibirá next mes
  dias_laborados: number; // Días que trabajó en el período
}
```

### 3.3 Interfaces de Directus

Las interfaces de Directus mapean las colecciones de la base de datos a objetos TypeScript. Estas interfaces definen la estructura de los datos que llegan desde la API de Directus y se utilizan en las funciones del módulo `read.ts` para tipar las respuestas.

```typescript
export interface DirectusTienda {
  id: number;
  nombre: string;
  codigo_ultra: number;
  empresa: string;
}

export interface DirectusCargo {
  id: number;
  nombre: string;
}

export interface DirectusAsesor {
  id: number;
  nombre?: string;
  documento: number;
  tienda_id: number | DirectusTienda;
  cargo_id: number | DirectusCargo;
}

export interface DirectusPresupuestoDiarioTienda {
  id: number;
  tienda_id: number;
  presupuesto: number;
  fecha: string;
}

export interface DirectusPresupuestoDiarioEmpleado {
  id: number;
  asesor: number;
  tienda_id: number;
  cargo: number;
  fecha: string;
  presupuesto: number;
}

export interface DirectusVentasDiariasEmpleado {
  id: number;
  fecha: string;
  asesor_id: number;
  tienda_id: number;
  venta: number;
}

export interface DirectusPorcentajeMensual {
  id: number;
  fecha: string; // YYYY-MM
  gerente_tipo: "fijo" | "distributivo";
  gerente_porcentaje: number;
  asesor_tipo: "fijo" | "distributivo";
  asesor_porcentaje: number;
  coadministrador_tipo: "fijo" | "distributivo";
  coadministrador_porcentaje: number;
  cajero_tipo: "fijo" | "distributivo";
  cajero_porcentaje: number;
  logistico_tipo: "fijo" | "distributivo";
  logistico_porcentaje: number;
}

export interface DirectusPorcentajeMensualNuevo {
  id: number;
  mes: string; // MM
  anio: string; // YYYY
  configuracion_roles: Array<{
    rol: string;
    tipo_calculo: "Fijo" | "Distributivo";
    porcentaje: number;
  }>;
}
```

### 3.4 Interfaces de Estado de la Aplicación

El estado global de la aplicación está definido en la interfaz `AppState`:

```typescript
export interface AppState {
  budgets: BudgetRecord[]; // Lista de presupuestos
  staff: StaffMember[]; // Lista de personal
  monthConfigs: MonthConfig[]; // Configuraciones mensuales
  ventas: VentasData[]; // Datos de ventas
  ventasMensuales: VentasMensualesData[];
  presupuestosEmpleados: any[]; // Presupuestos de empleados
  thresholdConfig: CommissionThresholdConfig | null; // Configuración de umbrales
}
```

La interfaz `MonthConfig` define la configuración de porcentaje para un mes específico:

```typescript
export interface MonthConfig {
  mes: string; // Formato "MMM YYYY"
  porcentaje_gerente: number; // Porcentaje entre 0 y 10
}
```

---

## 4. Lógica de Negocio y Cálculos

### 4.1 Reglas de Cálculo de Comisiones

El sistema de comisiones se basa en el concepto de cumplimiento, que es el porcentaje de ventas realizadas respecto al presupuesto asignado. El cumplimiento se calcula dividiendo las ventas entre el presupuesto y multiplicando por 100. Este porcentaje determina el porcentaje de comisión que recibirá el empleado según una escala predefinida.

La fórmula del cumplimiento es:

```
Cumplimiento (%) = (Ventas / Presupuesto) * 100
```

Por ejemplo, si un empleado tiene un presupuesto de 10,000,000 y realiza ventas por $9,500,000, su cumplimiento sería del 95%, lo que le otorgaría una comisión del 0.50% sobre sus ventas.

### 4.2 Escala de Porcentajes de Comisión

El sistema implementa una escala de cinco niveles de comisión basada en el cumplimiento. **Esta escala ahora es configurable dinámicamente desde la base de datos** a través de la tabla `commission_thresholds_config`:

| Rango de Cumplimiento | Porcentaje de Comisión | Categoría    |
| --------------------- | ---------------------- | ------------ |
| Mayor o igual a 110%  | 1.00%                  | Excelente    |
| 100% a 109.99%        | 0.70%                  | Buena        |
| 95% a 99.99%          | 0.50%                  | Regular      |
| 90% a 94.99%          | 0.35%                  | Muy Regular  |
| Menor a 90%           | 0%                     | Sin Comisión |

Esta escala está implementada en la función `getCommissionPercentage` del archivo `calculations.commissions.ts`, que ahora soporta configuración dinámica:

```typescript
export const getCommissionPercentage = (
  compliance: number,
  thresholdConfig?: CommissionThreshold[],
): number => {
  // Usar configuración proporcionada o valores por defecto
  const umbrales =
    thresholdConfig && thresholdConfig.length > 0
      ? thresholdConfig
      : DEFAULT_THRESHOLDS;

  // Ordenar por cumplimiento_min descendente para encontrar el umbral correcto
  const umbral = umbrales
    .sort((a, b) => b.cumplimiento_min - a.cumplimiento_min)
    .find((u) => compliance >= u.cumplimiento_min);

  return umbral?.comision_pct || 0;
};
```

Los valores por defecto (hardcodeados) se usan cuando no hay configuración en la base de datos:

```typescript
const DEFAULT_THRESHOLDS = [
  { cumplimiento_min: 90, comision_pct: 0.0035, nombre: "Muy Regular" },
  { cumplimiento_min: 95, comision_pct: 0.005, nombre: "Regular" },
  { cumplimiento_min: 100, comision_pct: 0.007, nombre: "Buena" },
  { cumplimiento_min: 110, comision_pct: 0.01, nombre: "Excelente" },
];
```

### 4.3 Cálculo de Comisión por Rol

Cada rol de empleado tiene reglas de cálculo específicas que reflejan la naturaleza de su trabajo y responsabilidad dentro de la organización. Estas reglas están encapsuladas en funciones dedicadas que pueden ser llamadas desde cualquier parte de la aplicación.

#### 4.3.1 Asesores y Coadministradores

Para estos roles, el cálculo de comisión es completamente individual:

```
Comisión = (Ventas del empleado / 1.19) * Porcentaje de comisión
```

El division por 1.19 elimina el IVA de la venta base, ya que las comisiones se calculan sobre el valor sin impuestos. Esta fórmula se aplica a cada empleado de forma independiente, sin verse afectada por el rendimiento de sus compañeros.

#### 4.3.2 Gerentes

Los gerentes tienen un tratamiento especial donde sus cálculos se basan en el rendimiento de la tienda completa, no en sus datos individuales:

```
Cumplimiento = Ventas totales de tienda / Presupuesto total de tienda
Porcentaje de comisión = Basado en cumplimiento de la tienda
Comisión = (Ventas totales de tienda / 1.19) * Porcentaje de comisión
```

Esta lógica reconoce que el gerente es responsable del rendimiento general de la tienda y debe ser compensado en consecuencia. Aunque en la tabla se muestran las ventas y presupuesto individuales del gerente, estos valores son solo informativos y no afectan el cálculo de su comisión.

#### 4.3.3 Cajeros y Logísticos

Para estos roles, la comisión se divide colectivamente entre todos los empleados que trabajaron en la tienda:

```
Venta base por empleado = Ventas totales de tienda / Cantidad total de empleados
Comisión por empleado = (Venta base por empleado / 1.19) * Porcentaje de comisión
```

Esta fórmula refleja el principio de que el trabajo en equipo de caja y logística contribuye al resultado general de la tienda, por lo que todos comparten la comisión correspondiente.

#### 4.3.4 Gerente Online

Este rol tiene la regla más simple: una comisión fija del 1% sobre sus ventas individuales, independientemente del cumplimiento:

```
Comisión = (Ventas individuales / 1.19) * 0.01
```

Esta comisión fija refleja que el Gerente Online tiene una responsabilidad y estructura de compensación diferente a los demás roles.

### 4.4 Eliminación de IVA en Cálculos

Todas las comisiones se calculan sobre la venta base sin IVA. Esto es importante para mantener la consistencia con las prácticas contables y porque el IVA es un impuesto que no representa ingreso para la empresa.

```typescript
export const calculateBaseSale = (
  venta_total: number,
  iva_factor: number = 1.19,
): number => {
  return round(venta_total / iva_factor);
};
```

El factor de IVA de 1.19 corresponde a un impuesto del 19%, que es el estándar en Colombia. Si las tasas de IVA cambian en el futuro, solo sería necesario modificar este valor en la función.

### 4.5 Sistema de Presupuesto Fijo/Distributivo

El sistema permite configurar cada rol como "fijo" o "distributivo", lo que determina cómo se asigna el presupuesto:

- **Fijo**: El porcentaje especificado se asigna al rol sin importar la cantidad de empleados. Si hay múltiples empleados del mismo rol, se divide el presupuesto entre ellos.
- **Distributivo**: El porcentaje especificado se distribuye proporcionalmente entre todos los empleados del rol.

La función `calculateBudgetsWithFixedDistributive` implementa esta lógica:

```typescript
export const calculateBudgetsWithFixedDistributive = (
  presupuesto_total: number,
  porcentajes: {
    gerente_tipo: "fijo" | "distributivo";
    gerente_porcentaje: number;
    // ... otros roles
  },
  empleadosPorRol: {
    gerente: number;
    asesor: number;
    // ... otros roles
  },
): { [rol: string]: number } => {
  // 1. Calcular fijos primero (restan del presupuesto total)
  // 2. Distribuir el restante entre roles distributivos
  // 3. Gerente Online: presupuesto fijo de 1 por empleado
};
```

### 4.6 Cálculo de Próxima Comisión

El sistema proporciona proyecciones sobre cuál será la próxima comisión del empleado si mejora su rendimiento. Esta funcionalidad utiliza una escala de escalones donde cada nivel de comisión corresponde a un presupuesto objetivo:

| Comisión Actual | Próxima Comisión | Factor de Presupuesto |
| --------------- | ---------------- | --------------------- |
| 0%              | 0.35%            | 0.90                  |
| 0.35%           | 0.50%            | 0.95                  |
| 0.50%           | 0.70%            | 1.00                  |
| 0.70%           | 1.00%            | 1.10                  |
| 1.00%           | NN (Máximo)      | -                     |

Las funciones que implementan esta lógica están en `calculations.next-commission.ts`:

```typescript
export const getNextCommission = (comisionActual: number): number | string => {
  const escalonesComision: Record<number, number | string> = {
    0: 0.0035,
    0.0035: 0.005,
    0.005: 0.007,
    0.007: 0.01,
    0.01: "NN",
  };
  return escalonesComision[comisionActual] ?? "NN";
};

export const getNextBudget = (
  proximaComision: number | string,
  presupuestoActual: number,
): number | null => {
  if (proximaComision === "NN") return null;

  const factoresPresupuesto: Record<number, number> = {
    0.0035: 0.9,
    0.005: 0.95,
    0.007: 1.0,
    0.01: 1.1,
  };

  const factor = factoresPresupuesto[proximaComision as number];
  if (factor === undefined) return null;

  return Math.round(presupuestoActual * factor * 100) / 100;
};
```

---

## 5. Funcionalidades de la API

### 5.1 Integración con Directus

La aplicación utiliza Directus como backend, que es un CMS y API de código abierto que proporciona una interfaz administrativa y una API RESTful sobre cualquier base de datos SQL. La comunicación con Directus se realiza mediante el SDK oficial de Directus para JavaScript/TypeScript.

Todas las operaciones de lectura y escritura pasan por el cliente de Directus configurado en el servicio central de la aplicación. El SDK maneja automáticamente la autenticación mediante tokens JWT, la serialización de datos y la gestión de relaciones entre colecciones.

### 5.2 Funciones de Lectura

El archivo `api/directus/read.ts` contiene todas las funciones para obtener datos del sistema:

```typescript
// Obtener todas las tiendas accesibles para el usuario
export async function obtenerTiendas(): Promise<DirectusTienda[]> {
  const tiendaIds = await obtenerTiendasIdsUsuarioActual();
  const data = await directus.request(
    readItems("util_tiendas", {
      fields: ["id", "nombre", "codigo_ultra", "empresa"],
      filter: { id: { _in: tiendaIds } },
      sort: ["id"],
      limit: -1,
    }),
  );
  return data as DirectusTienda[];
}

// Obtener todos los asesores con sus relaciones
export async function obtenerAsesores(): Promise<DirectusAsesor[]> {
  const data = await directus.request(
    readItems("asesores", {
      fields: [
        "id",
        "documento",
        "tienda_id.id",
        "tienda_id.nombre",
        "tienda_id.codigo_ultra",
        "cargo_id.id",
        "cargo_id.nombre",
        "nombre",
      ],
      sort: ["id"],
      limit: -1,
    }),
  );
  return data as DirectusAsesor[];
}

// Obtener presupuestos diarios por tienda
export async function obtenerPresupuestosDiarios(
  tiendaId?: number,
  fechaInicio?: string,
  fechaFin?: string,
  mesSeleccionado?: string,
): Promise<DirectusPresupuestoDiarioTienda[]> {
  // Filtra por tienda y rango de fechas
  // Para el mes actual, filtra hasta la fecha actual
}

// Obtener porcentajes mensuales
export async function obtenerPorcentajesMensuales(
  tiendaId?: number,
  mesAnio?: string,
): Promise<DirectusPorcentajeMensual[]> {
  // Obtiene configuración de porcentajes para un mes específico
}

// Obtener presupuestos de empleados
export async function obtenerPresupuestosEmpleados(
  tiendaId?: number,
  fecha?: string,
  mesSeleccionado?: string,
): Promise<DirectusPresupuestoDiarioEmpleado[]> {
  // Obtiene presupuestos diarios asignados a empleados
}

// Obtener ventas de empleados
export async function obtenerVentasEmpleados(
  tiendaId?: number,
  fecha?: string,
  mesSeleccionado?: string,
): Promise<DirectusVentasDiariasEmpleado[]> {
  // Obtiene ventas diarias por empleado
}
```

### 5.3 Funciones de Escritura

El archivo `api/directus/create.ts` contiene todas las funciones para modificar datos:

```typescript
// Guardar porcentajes mensuales (crear o actualizar)
export async function guardarPorcentajesMensuales(
  porcentajes: Omit<DirectusPorcentajeMensual, "id">,
): Promise<DirectusPorcentajeMensual> {
  // Verifica si ya existe registro para el mes
  // Si existe, actualiza; si no, crea nuevo
}

// Guardar presupuestos de empleados
export async function guardarPresupuestosEmpleados(
  presupuestos: Omit<DirectusPresupuestoDiarioEmpleado, "id">[],
): Promise<DirectusPresupuestoDiarioEmpleado[]> {
  // Crea nuevos registros de presupuestos
}

// Eliminar presupuestos de empleados para una fecha y tienda
export async function eliminarPresupuestosEmpleados(
  tiendaId: number,
  fecha: string,
): Promise<void> {
  // Elimina todos los presupuestos de empleados para la fecha especificada
}

// Actualizar presupuesto de un empleado específico
export async function actualizarPresupuestoEmpleado(
  id: number,
  presupuesto: number,
): Promise<DirectusPresupuestoDiarioEmpleado> {
  // Actualiza el presupuesto de un empleado
}

// Guardar ventas de empleados
export async function guardarVentasEmpleados(
  ventas: Omit<DirectusVentasDiariasEmpleado, "id">[],
): Promise<DirectusVentasDiariasEmpleado[]> {
  // Crea o actualiza ventas de empleados
}

// Guardar ventas de tienda
export async function guardarVentasTienda(
  venta: Omit<DirectusVentasDiariasTienda, "id">,
): Promise<DirectusVentasDiariasTienda> {
  // Crea o actualiza ventas totales de tienda
}

// Guardar presupuestos de tienda desde CSV
export async function guardarPresupuestosTienda(
  presupuestos: Omit<DirectusPresupuestoDiarioTienda, "id">[],
): Promise<DirectusPresupuestoDiarioTienda[]> {
  // Crea o actualiza presupuestos de tienda
}
```

### 5.4 Manejo de Errores

Todas las funciones de API incluyen manejo de errores básico que lanza las excepciones para que sean capturadas por los componentes que llaman las funciones. Los errores comunes incluyen:

- **Error 404**: La colección o registro no existe
- **Error 401**: No autorizado (token expirado)
- **Error 403**: Permisos insuficientes
- **Error de red**: Problemas de conexión

TanStack Query maneja automáticamente los errores de red y proporciona estados de retry configurables. En caso de error, los componentes muestran estados de error apropiados mediante el componente `LoadingState` o modales de error.

### 5.5 interceptor de Autenticación

La aplicación implementa un interceptor que renueva automáticamente los tokens de autenticación cuando están próximos a expirar. Esto garantiza que las operaciones de larga duración no fallen por token expirado:

```typescript
// El interceptor withAutoRefresh envuelve las peticiones
// y maneja la renovación automática del token JWT
const data = await withAutoRefresh(() =>
  directus.request(readItems(...))
);
```

---

## 6. Componentes de UI

### 6.1 Componente Principal: Home.tsx

El componente `Home.tsx` es el punto de entrada principal de la aplicación de comisiones. Coordina todos los demás componentes y maneja la lógica de alto nivel como la selección de mes, la carga de datos y la sincronización con el contexto.

El componente utiliza varios hooks especializados para manejar diferentes aspectos de la funcionalidad:

```typescript
export default function Home() {
  // Hooks de datos
  const { availableMonths, currentMonth, isLoadingMonths, changeMonth } =
    useAvailableMonths();
  const {
    hasBudgetData,
    validationCompleted,
    error: budgetError,
  } = useBudgetValidation();

  // Hook de datos de comisiones optimizado
  const {
    data: commissionData,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useOptimizedCommissionData(selectedMonth);

  // Hook de filtros
  const {
    filterTienda,
    filterRol,
    expandedTiendas,
    isFiltering,
    setFilterTienda,
    toggleFilterRol,
    clearFilterRol,
    handleToggleAllStores,
    toggleSingleStore,
    applyFilters,
    getUniqueTiendas,
    getFilteredComissionsForCards,
    clearFilterCache,
  } = useFiltersOptimized();

  // ... resto del componente
}
```

### 6.2 Componente SummaryCards

El componente `SummaryCards` muestra tarjetas con los totales de comisiones para una visualización rápida. Cada tarjeta representa un rol específico y muestra el monto total de comisiones para ese rol en el período seleccionado.

Las tarjetas tienen las siguientes características:

- **Total Comisiones**: Muestra el total general con borde azul (#3680F7)
- **Gerentes**: Muestra comisiones de gerentes con borde morado (#7138F5)
- **Asesores**: Muestra comisiones de asesores con borde verde (#419061)
- **Cajeros**: Muestra comisiones de cajeros con borde amarillo (#F7B036)
- **Logísticos**: Muestra comisiones de logísticos con borde rojo (#EF4444)

Cada tarjeta es interactiva: al hacer clic en una tarjeta de rol, se activa el filtro para mostrar solo ese rol en la tabla. Al hacer clic en "Total Comisiones", se limpian todos los filtros y se expanden todas las tiendas.

### 6.3 Componente DataTable

El componente `DataTable` es el componente principal de visualización de datos. Muestra las tiendas en formato de acordeón, donde cada tienda puede expandirse para mostrar sus empleados con detalle de comisiones.

Características principales:

- **Carga incremental**: Si hay muchas tiendas expandidas, carga solo 5 inicialmente y añade 2 cada 120ms
- **Filtrado por rol**: Filtra empleados según los roles seleccionados
- **Expandir/colapsar todo**: Botón para expandir o colapsar todas las tiendas
- **Optimización de render**: Usa `React.memo` con comparadores personalizados para evitar re-renders innecesarios

### 6.4 Componente DataTableAccordion

El acordeón de tienda muestra el resumen de una tienda y sus empleados cuando se expande. Cada acordeón contiene:

- **Header**: Nombre de la tienda, presupuesto, ventas, cumplimiento y total comisiones
- **Gráfico mini**: Representación visual del cumplimiento
- **Tabla de empleados**: Lista de empleados con sus métricas individuales

### 6.5 Componente Charts

El componente `Charts` contiene los gráficos de análisis visual. Los gráficos disponibles son:

- **CommissionDistributionChart**: Gráfico de torta mostrando distribución de comisiones por rol
- **TopSellersByRoleChart**: Gráfico de barras verticales con los mejores vendedores por rol
- **NoDataChartMessage**: Componente para mostrar mensaje cuando no hay datos

### 6.6 Componentes de Modales

La aplicación utiliza múltiples modales para funcionalidades específicas:

#### 6.6.1 ConfigurationPanel y ConfigurationTabsPanel

Permite configurar los umbrales de comisión y gestionar presupuestos y personal manualmente. El `ConfigurationTabsPanel` organiza la configuración en pestañas:

- **Pestaña de empleados**: Gestión de empleados asignados
- **Pestaña de presupuestos**: Configuración de presupuestos por tienda
- **Pestaña de umbrales**: Configuración de umbrales de comisión (nuevo)

#### 6.6.2 CodesModal

Modal principal para asignar empleados y presupuestos diarios. Incluye:

- Selector de empleado
- Selector de tienda
- Selector de cargo
- Lista de empleados asignados
- Carga de CSV para presupuestos

#### 6.6.3 EditStoreModalSimplified y EditStoreBudgetModal

Modales para administradores que permiten editar presupuestos de tiendas:

- `EditStoreModalSimplified`: Edición simplificada de tienda
- `EditStoreBudgetModal`: Edición de presupuestos

#### 6.6.4 ExportButtons

Botones para exportar datos en diferentes formatos:

- **PDF**: Exporta a PDF usando jspdf-autotable
- **Excel**: Exporta a Excel usando xlsx
- **CSV**: Exporta a CSV usando papaparse

### 6.7 Componente SimpleFilters

El componente `SimpleFilters` contiene los controles de filtrado principales:

- **Selector de mes**: Desplegable con los meses disponibles
- **Filtro de tienda**: Dropdown con las tiendas accesibles (solo para admins)
- **Filtros de rol**: Chips que permiten filtrar por rol

---

## 7. Hooks y Utilitarios

### 7.1 useOptimizedCommissionData

Este hook es el más importante de la aplicación. Maneja toda la carga de datos de comisiones con optimizaciones de rendimiento:

```typescript
export const useOptimizedCommissionData = (selectedMonth: string) => {
  const query = useQuery({
    queryKey: ["commission-data", selectedMonth, user?.id],
    queryFn: () => processCommissionData(selectedMonth),
    enabled: !!user && !!selectedMonth,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos en caché
    refetchOnWindowFocus: false, // No recargar al volver
    refetchOnMount: false, // No recargar al montar
    refetchOnReconnect: false, // No recargar al reconectar
    retry: 1,
    retryDelay: 1000,
    networkMode: "online",
  });

  // Función para forzar recarga
  const refetch = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["commission-data"],
      exact: false,
    });
    queryClient.removeQueries({ queryKey: ["commission-data"], exact: false });
    return queryClient.refetchQueries({
      queryKey: ["commission-data", selectedMonth],
      type: "active",
    });
  }, [queryClient, selectedMonth]);

  // Precarga de mes
  const prefetchMonth = useCallback(
    (month: string) => {
      if (!user) return;
      queryClient.prefetchQuery({
        queryKey: ["commission-data", month, user.id],
        queryFn: () => processCommissionData(month),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
      });
    },
    [queryClient, user],
  );

  return {
    data,
    isLoading,
    isRefetching,
    isError,
    error,
    dataLoadAttempted: query.isLoading === false,
    hasData: !!data && (data.budgets.length > 0 || data.staff.length > 0),
    refetch,
    prefetchMonth,
  };
};
```

### 7.2 useUserPolicies

Este hook gestiona las políticas de acceso del usuario:

```typescript
export const useUserPolicies = () => {
  const { hasPolicy } = useAuth();

  return {
    canSeeConfig: () => hasPolicy("readComisionesAdmin"),
    canAssignEmployees: () => hasPolicy("assignEmployees"),
    canSeeStoreFilter: () => hasPolicy("readComisionesAdmin"),
    hasPolicy: (policy: string) => hasPolicy(policy),
  };
};
```

### 7.3 useFiltersOptimized

Este hook maneja toda la lógica de filtrado:

```typescript
export const useFiltersOptimized = () => {
  const [filterTienda, setFilterTienda] = useState<string[]>([]);
  const [filterRol, setFilterRol] = useState<Role[]>([]);
  const [expandedTiendas, setExpandedTiendas] = useState<Set<string>>(
    new Set(),
  );

  // Toggle de rol
  const toggleFilterRol = useCallback((role: Role) => {
    setFilterRol((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }, []);

  // Limpiar filtros de rol
  const clearFilterRol = useCallback(() => {
    setFilterRol([]);
  }, []);

  // Toggle de tienda individual
  const toggleSingleStore = useCallback((tiendaKey: string) => {
    setExpandedTiendas((prev) => {
      const next = new Set(prev);
      if (next.has(tiendaKey)) {
        next.delete(tiendaKey);
      } else {
        next.add(tiendaKey);
      }
      return next;
    });
  }, []);

  // Expandir/colapsar todas
  const handleToggleAllStores = useCallback(
    (keys: string[], shouldExpand: boolean, shouldClear: boolean) => {
      if (shouldClear) {
        setExpandedTiendas(new Set());
      } else if (shouldExpand) {
        setExpandedTiendas(new Set(keys));
      } else {
        setExpandedTiendas(new Set());
      }
    },
    [],
  );

  // Aplicar filtros al resumen
  const applyFilters = useCallback(
    (mesResumen: MesResumen) => {
      let result = mesResumen;

      // Filtrar por rol
      if (filterRol.length > 0) {
        result = {
          ...result,
          tiendas: result.tiendas
            .map((tienda) => ({
              ...tienda,
              empleados: tienda.empleados.filter((emp) =>
                filterRol.includes(emp.rol),
              ),
            }))
            .filter((tienda) => tienda.empleados.length > 0),
        };
      }

      return result;
    },
    [filterRol],
  );

  // Obtener tiendas únicas
  const getUniqueTiendas = useCallback((mesResumen: MesResumen | null) => {
    if (!mesResumen) return [];
    const tiendas = new Set<string>();
    mesResumen.tiendas.forEach((t) => tiendas.add(t.tienda));
    return Array.from(tiendas);
  }, []);

  return {
    filterTienda,
    filterRol,
    expandedTiendas,
    isFiltering: filterRol.length > 0 || filterTienda.length > 0,
    setFilterTienda,
    toggleFilterRol,
    clearFilterRol,
    handleToggleAllStores,
    toggleSingleStore,
    applyFilters,
    getUniqueTiendas,
  };
};
```

### 7.4 CommissionContext

El contexto de comisiones proporciona estado global y funciones para manipularlo:

```typescript
interface CommissionContextType {
  state: AppState;
  setBudgets: (budgets: BudgetRecord[]) => void;
  setStaff: (staff: StaffMember[]) => void;
  setMonthConfigs: (configs: MonthConfig[]) => void;
  setVentas: (ventas: VentasData[]) => void;
  setVentasMensuales: (ventasMensuales: VentasMensualesData[]) => void;
  updateMonthConfig: (mes: string, porcentaje_gerente: number) => void;
  addStaffMember: (member: StaffMember) => void;
  removeStaffMember: (id: string) => void;
  updateVentas: (
    tienda: string,
    fecha: string,
    ventas_tienda: number,
    ventas_por_asesor: Record<string, number>
  ) => void;
  updatePresupuestosEmpleados: (presupuestos: any[]) => void;
  getMonthConfig: (mes: string) => MonthConfig | undefined;
  resetData: () => void;
}

export const CommissionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AppState>({
    budgets: [],
    staff: [],
    monthConfigs: [],
    ventas: [],
    ventasMensuales: [],
    presupuestosEmpleados: [],
  });

  // Funciones de actualización...

  return (
    <CommissionContext.Provider value={value}>
      {children}
    </CommissionContext.Provider>
  );
};
```

### 7.5 Funciones Utilitarias

El archivo `lib/utils.ts` y `lib/calculations.utils.ts` contienen funciones utilitarias. **Nota: `calculations.utils.ts` ahora combina las funciones que antes estaban en `calculations.basic.ts`, `calculations.data.ts` y `calculations.next-commission.ts`**:

```typescript
// Redondeo a 2 decimales
export const round = (value: number): number => {
  return Math.round(value * 100) / 100;
};

// Obtener mes y año de una fecha
export const getMonthYear = (dateStr: string): string => {
  const date = new Date(dateStr + "T00:00:00");
  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

// Obtener fecha actual (hora local de Colombia)
export const getCurrentDate = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

// Verificar si es mes actual
export const isCurrentMonth = (mes: string): boolean => {
  const [mesNombre, anioStr] = mes.split(" ");
  const mesesMap: Record<string, number> = {
    Ene: 0,
    Feb: 1,
    Mar: 2,
    Abr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Ago: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dic: 11,
  };
  const ahora = new Date();
  return (
    ahora.getFullYear() === parseInt(anioStr) &&
    ahora.getMonth() === mesesMap[mesNombre]
  );
};

// Calcular próxima comisión (desde calculations.utils.ts)
export const getNextCommission = (
  currentCompliance: number,
  currentCommissionPct: number,
  thresholds: CommissionThreshold[],
): number | string => {
  // Encuentra el siguiente umbral y retorna la comisión correspondiente
  // Retorna 'NN' si ya está en el máximo
};

// Calcular próximo presupuesto necesario
export const getNextBudget = (
  currentSales: number,
  nextThreshold: number,
): number => {
  // Calcula el presupuesto necesario para alcanzar el siguiente umbral
};
```

---

## 8. Funcionalidades Principales

### 8.1 Visualización de Comisiones

La funcionalidad principal de la aplicación es mostrar las comisiones calculadas de forma clara y organizada. El usuario puede:

1. **Seleccionar un mes**: Usando el selector de meses en el header
2. **Ver resumen**: Las tarjetas de resumen muestran los totales
3. **Explorar tiendas**: Cada tienda se puede expandir para ver sus empleados
4. **Filtrar por rol**: Haciendo clic en las tarjetas de resumen
5. **Ver detalles**: Cada empleado muestra su presupuesto, ventas, cumplimiento y comisión

Los datos se actualizan automáticamente cuando:

- Se cambia de mes
- Se guarda una modificación
- Se invalida el caché manualmente

### 8.2 Asignación de Empleados

La funcionalidad de asignación permite agregar empleados a tiendas y asignarles presupuestos:

1. Hacer clic en "EDITAR PRESUPUESTO"
2. Seleccionar un empleado del dropdown
3. Elegir la tienda y cargo
4. Hacer clic en "Asignar"
5. Los cambios se guardan en Directus y se actualiza la vista

### 8.3 Configuración de Umbrales de Comisión (Nuevo)

El panel de configuración ahora permite ajustar los umbrales de comisión de forma dinámica:

1. **Umbrales de cumplimiento**: Define los porcentajes mínimos para cada nivel de comisión
2. **Porcentajes de comisión**: Define el porcentaje de comisión para cada umbral
3. **Nombres de categorías**: Etiquetas personalizadas para cada nivel (Excelente, Buena, Regular, etc.)
4. **Colores**: Colores opcionales para la visualización

Esta configuración se guarda en la tabla `commission_thresholds_config` de Directus y permite modificar los parámetros sin cambiar el código.

### 8.4 Configuración de Porcentajes de Gerente

El panel de configuración permite ajustar los parámetros del sistema:

1. **Porcentaje del gerente**: Define qué porcentaje del presupuesto va al gerente (0-10%)
2. **Gestión de presupuestos**: Agregar/modificar presupuestos diarios de tienda
3. **Gestión de personal**: Agregar/eliminar personal del mes

### 8.5 Importación de CSV

La aplicación permite cargar presupuestos desde archivos CSV:

1. Abrir el modal de edición
2. Hacer clic en "Cargar CSV"
3. Seleccionar el archivo con formato: `tienda,fecha,presupuesto`
4. Los datos se procesan y guardan automáticamente

### 8.5 Exportación de Datos

Los datos pueden exportarse en múltiples formatos:

- **CSV**: Genera un archivo de texto delimitado por comas

### 8.6 Filtrado Avanzado

El sistema ofrece múltiples formas de filtrar los datos:

- **Por mes**: Selector en el header
- **Por tienda**: Dropdown de tiendas (solo admins)
- **Por rol**: Clic en las tarjetas de resumen
- **Expandir/colapsar**: Control de visualización de tiendas

---

## 9. Casos de Uso y Flujos de Usuario

### 9.1 Caso de Uso: Visualizar Comisiones del Mes

**Actor**: Usuario con acceso a la aplicación

**Flujo principal**:

1. El usuario accede a la página de comisiones
2. El sistema carga los datos del mes actual
3. El usuario ve las tarjetas de resumen con totales
4. El usuario puede expandir tiendas para ver detalles
5. El usuario puede hacer clic en filtros para ver roles específicos

**Flujo alternativo - Cambiar de mes**:

1. El usuario abre el selector de meses
2. Selecciona otro mes disponible
3. El sistema carga los datos del mes seleccionado
4. La vista se actualiza con los nuevos datos

### 9.2 Caso de Uso: Asignar Empleados

**Actor**: Usuario con permiso de asignación

**Flujo principal**:

1. El usuario hace clic en "EDITAR PRESUPUESTO"
2. Se abre el modal de asignación
3. El usuario busca y selecciona un empleado
4. El usuario selecciona la tienda y cargo
5. El usuario hace clic en "Asignar"
6. El sistema guarda los datos y muestra confirmación
7. La vista de comisiones se actualiza

### 9.3 Caso de Uso: Configurar Porcentajes

**Actor**: Administrador

**Flujo principal**:

1. El administrador hace clic en "Configuración"
2. Se abre el panel de configuración
3. El administrador modifica el porcentaje del gerente
4. El administrador hace clic en "Guardar Configuración"
5. Los cambios se aplican para cálculos futuros

### 9.4 Caso de Uso: Importar Presupuestos desde CSV

**Actor**: Administrador

**Flujo principal**:

1. El administrador hace clic en "EDITAR PRESUPUESTO"
2. Selecciona la opción "Cargar CSV"
3. El sistema muestra el formulario de carga
4. El administrador selecciona el archivo CSV
5. El sistema valida el formato
6. El sistema procesa y guarda los datos
7. Se muestra el resultado de la importación

**Flujo alternativo - Error de formato**:

1. El sistema detecta un error en el formato del CSV
2. Muestra un mensaje de error descriptivo
3. El usuario puede descargar una plantilla de ejemplo

### 9.5 Caso de Uso: Exportar Reporte

**Actor**: Usuario con acceso a la aplicación

**Flujo principal**:

1. El usuario navega al período deseado
2. El usuario hace clic en el botón de exportación
3. Selecciona el formato deseado (PDF/Excel/CSV)
4. El sistema genera el archivo
5. El navegador descarga el archivo

### 9.6 Caso de Uso: Filtrar por Rol

**Actor**: Usuario con acceso a la aplicación

**Flujo principal**:

1. El usuario ve la vista con todas las tiendas
2. El usuario hace clic en la tarjeta "Gerentes"
3. El sistema filtra para mostrar solo gerentes
4. Las tiendas sin gerentes se ocultan
5. El usuario puede hacer clic en "Total Comisiones" para limpiar el filtro

---

## 10. Consideraciones Técnicas

### 10.1 Rendimiento

La aplicación implementa varias técnicas de optimización de rendimiento:

- **Caché de datos**: TanStack Query almacena datos por 5-30 minutos
- **Carga incremental**: La tabla carga primero 5 tiendas y añade 2 cada 120ms
- **Memoización**: Componentes usan `React.memo` con comparadores personalizados
- **Evitar re-renders**: Los callbacks se memoizan con `useCallback`
- **Consultas paralelas**: `Promise.all` para cargar datos simultáneamente

### 10.2 Manejo de Errores

El sistema maneja errores en múltiples niveles:

- **Errores de red**: TanStack Query reintenta automáticamente
- **Errores de API**: Se muestran mensajes informativos
- **Errores de validación**: Se muestran junto a los campos correspondientes
- **Errores de permisos**: Se muestran modales de acceso denegado

### 10.3 Seguridad

La seguridad se implementa en varios niveles:

- **Autenticación**: Tokens JWT con renovación automática
- **Autorización**: Políticas de usuario que controlan el acceso
- **Validación de datos**: Validaciones en cliente y servidor
- **Sanitización**: Escape de datos en la UI

### 10.4 Accesibilidad

La aplicación considera aspectos de accesibilidad:

- **Contraste de colores**: Colores con contraste suficiente
- **Keyboard navigation**: Navegación por teclado posible
- **ARIA labels**: Etiquetas para lectores de pantalla
- **Responsive design**: Diseño adaptativo a diferentes tamaños

---

## 11. Glosario de Términos

| Término                      | Definición                                                                              |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| **Cumplimiento**             | Porcentaje de ventas respecto al presupuesto (ventas / presupuesto \* 100)              |
| **Presupuesto Fijo**         | Porcentaje del presupuesto total asignado a un rol, dividido entre sus empleados        |
| **Presupuesto Distributivo** | Porcentaje del presupuesto dividido proporcionalmente entre todos los empleados del rol |
| **Venta Base**               | Venta sin IVA, utilizada para el cálculo de comisiones                                  |
| **Días Laborados**           | Días que el empleado trabajó durante el período                                         |
| **Directus**                 | CMS y API de código abierto utilizado como backend                                      |
| **TanStack Query**           | Biblioteca para gestión de estado del servidor en React                                 |
| **Rol**                      | Cargo o posición del empleado (gerente, asesor, cajero, etc.)                           |
| **Escalón**                  | Nivel en la escala de comisiones (0%, 0.35%, 0.50%, 0.70%, 1.00%)                       |
| **IVA**                      | Impuesto al Valor Agregado (19% en Colombia)                                            |

---

_Documentación generada para la Aplicación de Comisiones - AppKancan_
_Esta documentación está diseñada para ser autosuficiente y permitir a nuevos desarrolladores comprender completamente el sistema._

_Última actualización: Febrero 2026 - Incluye soporte para configuración dinámica de umbrales de comisión_
