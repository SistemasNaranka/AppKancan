# Flujo de Autenticación y Carga Dinámica de Rutas

```mermaid
flowchart TD
    A[Usuario accede a /] --> B{¿Autenticado?}
    B -->|No| C[Redirigir a /login]
    C --> D[Mostrar Login Form]

    D --> E[Usuario ingresa<br/>email/password]
    E --> F[loginDirectus<br/>API Call]
    F --> G{¿Login exitoso?}
    G -->|Sí| H[Guardar tokens<br/>en localStorage]
    G -->|No| I[Mostrar error<br/>en Login]

    H --> J[setTokenDirectus<br/>Configurar cliente]
    J --> K[getCurrentUser<br/>Obtener datos usuario]
    K --> L[Set user en AuthContext]

    B -->|Sí| M[Inicialización AuthProvider]
    M --> N{Cargar tokens<br/>de localStorage}
    N -->|No tokens| O[Set loading=false<br/>No autenticado]

    N -->|Tokens encontrados| P{¿Token expirado?}
    P -->|Sí| Q[refreshDirectus<br/>API Call]
    Q --> R{¿Refresh exitoso?}
    R -->|Sí| S[Guardar nuevos tokens]
    R -->|No| T[Borrar tokens<br/>Set user=null]

    P -->|No| U[setTokenDirectus<br/>con token válido]
    S --> U

    U --> V[getCurrentUser<br/>API Call]
    V --> W{¿Usuario obtenido?}
    W -->|Sí| X[Set user en AuthContext]
    W -->|No| T

    X --> Y[Set loading=false<br/>Autenticado]

    Y --> Z[useApps hook<br/>Obtener apps del usuario]
    Z --> AA{¿Apps cargadas?}
    AA -->|No| BB[Mostrar loading]

    AA -->|Sí| CC[Cargar rutas dinámicas<br/>import.meta.glob]
    CC --> DD[Filtrar apps permitidas<br/>por permisos]
    DD --> EE[Promise.all<br/>Importar módulos]
    EE --> FF[loadAndValidateRoutes<br/>Validar rutas]
    FF --> GG{¿Errores en rutas?}
    GG -->|Sí| HH[Mostrar ErrorPage<br/>con errores]
    GG -->|No| II[Set modulosComplejosFiltrados]

    II --> JJ[Render Layout<br/>con rutas cargadas]
    JJ --> KK[Usuario navega<br/>por la app]

    T --> O
    O --> LL[Redirigir a /login<br/>si no autenticado]

    style A fill:#e3f2fd
    style D fill:#f3e5f5
    style F fill:#fff3e0
    style Z fill:#e8f5e8
    style CC fill:#e8f5e8
    style JJ fill:#c8e6c9
```

## Descripción del Flujo

### 1. Acceso Inicial

- Usuario accede a la aplicación
- AuthProvider verifica estado de autenticación

### 2. Proceso de Login

- Si no autenticado, redirige a `/login`
- Usuario ingresa credenciales
- API call a Directus para autenticación
- Tokens guardados en localStorage
- Usuario obtenido y seteado en contexto

### 3. Inicialización de Sesión

- Al recargar página, verifica tokens existentes
- Si expirados, intenta refresh automático
- Si refresh falla, limpia sesión
- Obtiene datos del usuario actual

### 4. Carga Dinámica de Apps

- Hook `useApps` obtiene lista de apps permitidas para el usuario
- Usa `import.meta.glob` para cargar rutas dinámicamente
- Filtra solo las apps que el usuario tiene permisos
- Importa los módulos de rutas con `Promise.all`

### 5. Validación de Rutas

- `loadAndValidateRoutes` valida estructura de rutas
- Verifica que cada ruta tenga `path`, `element`, etc.
- Si hay errores, muestra página de error con detalles
- Si válidas, setea las rutas filtradas

### 6. Renderizado Final

- Layout principal renderiza con rutas cargadas
- Usuario puede navegar por módulos permitidos
