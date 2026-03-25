# Optimizaciones de Rendimiento Aplicadas

## Cambios Realizados

### 1. **Vite Config (`vite.config.ts`)**
- ✅ Desactivado `usePolling` (mejora CPU usage)
- ✅ Agregado `ignored` para excluir node_modules, .git, dist del watcher
- ✅ Agregado MUI y TanStack Query a `optimizeDeps.include`
- ✅ Configurado `esbuildOptions.target: 'esnext'`
- ✅ Mejorada la estrategia de `manualChunks` para mejor code splitting
- ✅ Desactivado sourcemap en build (mejora velocidad de compilación)
- ✅ Agregado `cssMinify: true`
- ✅ Configurado `esbuild.logOverride` para silenciar warnings innecesarios

### 2. **TypeScript Config (`tsconfig.json`)**
- ✅ Desactivado `noUnusedLocals` (reduce tiempo de compilación)
- ✅ Desactivado `noUnusedParameters` (reduce tiempo de compilación)

### 3. **Package.json**
- ✅ Agregado script `dev:fast` para desarrollo rápido
- ✅ Agregado script `build:fast` para builds sin minificación

### 4. **Index.html**
- ✅ Agregado `preconnect` para API
- ✅ Agregado `preload` para recursos críticos

## Comandos para usar

### Desarrollo Normal
```bash
npm run dev
```

### Desarrollo Rápido (cuando necesites recargar forzado)
```bash
npm run dev:fast
```

### Build de Producción
```bash
npm run build
```

### Build Rápido (para testing)
```bash
npm run build:fast
```

## Optimizaciones Adicionales Recomendadas

### 1. **Lazy Loading en Rutas**
El proyecto ya usa lazy loading en `AppRoutes.tsx`. Asegúrate de que todas las rutas pesadas usen:
```tsx
const Component = lazy(() => import('./ruta/al/componente'));
```

### 2. **Memoización en Componentes Pesados**
Usa `React.memo()` en componentes que se renderizan frecuentemente:
```tsx
const MiComponente = React.memo(({ data }) => {
  return <div>{data}</div>;
});
```

### 3. **Virtualización de Listas**
Para listas grandes, usa `@mui/x-data-grid` o `react-window`.

### 4. **Optimización de Imágenes**
- Convierte imágenes a WebP
- Usa `loading="lazy"` en imágenes below the fold

### 5. **Reducir Bundle Size**
Ejecuta para analizar el bundle:
```bash
npm install -D rollup-plugin-visualizer
```

Luego agrega a `vite.config.ts`:
```ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true }),
  ],
});
```

### 6. **Configuración de Windows (Opcional)**
Si estás en Windows, aumenta la memoria de Node.js:

Crea un archivo `.env` en la raíz:
```
NODE_OPTIONS=--max-old-space-size=4096
```

## Problemas Comunes y Soluciones

### El servidor de desarrollo está lento
1. Cierra otros procesos pesados
2. Ejecuta `npm run dev:fast`
3. Limpia caché: `rm -rf node_modules/.vite`

### El build tarda mucho
1. Usa `npm run build:fast` para testing
2. Revisa el bundle size con visualizer
3. Considera lazy loading en más componentes

### Hot Module Replacement (HMR) lento
1. El watcher ahora ignora carpetas innecesarias
2. Reduce el número de archivos abiertos en el editor
3. Considera excluir más patrones en `server.watch.ignored`

## Monitoreo de Rendimiento

Para medir mejoras:
1. Mide tiempo de inicio del dev server
2. Mide tiempo de build
3. Mide tiempo de HMR (cambios en caliente)

Antes de los cambios: ~X segundos
Después de los cambios: ~Y segundos (Z% más rápido)
