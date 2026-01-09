# Propuesta: Migración de Umbrales de Comisión a Base de Datos

## 1. Estado Actual (Hardcoded)

### Dónde está definido actualmente:

- **Archivo**: [`calculations.commissions.ts`](src/apps/comisiones/lib/calculations.commissions.ts)
- **Líneas**: ~20-40 (valores hardcoded en la función `getCommissionPercentage`)
- **Valores actuales**:
  ```
  90%  → 0.35% (comisión base)
  95%  → 0.50%
  100% → 0.65%
  110% → 0.85%
  ```

### Problema:

- Para cambiar un umbral hay que modificar código
- No hay flexibilidad para agregar/eliminar categorías
- No es configurable por mes como el presupuesto

---

## 2. Propuesta de Solución

### 2.1 Nueva Colección en Directus

**Nombre**: `comisiones_umbrales_mensual`

**Estructura de campos**:

| Campo      | Tipo         | Descripción                        |
| ---------- | ------------ | ---------------------------------- |
| `id`       | Integer (PK) | Identificador único                |
| `mes_anio` | String       | Formato "YYYY-MM" (ej: "2025-01")  |
| `umbrales` | JSON/M2A     | Array de objetos con configuración |

**Estructura del JSON `umbrales`**:

```json
[
  {
    "cumplimiento_min": 90,
    "comision_pct": 0.35,
    "nombre": "Cumplimiento Básico"
  },
  {
    "cumplimiento_min": 95,
    "comision_pct": 0.5,
    "nombre": "Cumplimiento Medio"
  },
  {
    "cumplimiento_min": 100,
    "comision_pct": 0.65,
    "nombre": "Cumplimiento Alto"
  },
  {
    "cumplimiento_min": 110,
    "comision_pct": 0.85,
    "nombre": "Sobrecumplimiento"
  }
]
```

### 2.2 Lógica de Cálculo (Simplificada)

A diferencia del presupuesto, **no se necesita `cumplimiento_max`** porque es implícito:

```typescript
// Ordenar umbrales por cumplimiento_min DESC
// Encontrar el primer umbral donde cumplimiento >= umbral.cumplimiento_min
// Si ninguno coincide, retornar 0 o comisión mínima
```

---

## 3. Cambios Requeridos en el Código

### 3.1 Types ([`types.ts`](src/apps/comisiones/types.ts))

```typescript
interface CommissionThreshold {
  cumplimiento_min: number; // 90, 95, 100, 110...
  comision_pct: number; // 0.0035, 0.0050...
  nombre: string; // "Básico", "Medio", "Alto"...
}

interface CommissionThresholdConfig {
  id?: number;
  mes_anio: string;
  umbrales: CommissionThreshold[];
}
```

### 3.2 API Read ([`api/directus/read.ts`](src/apps/comisiones/api/directus/read.ts))

```typescript
// Nueva función
export const obtenerUmbralesComisiones = async (
  mesAnio?: string  // "2025-01" o undefined para current
): Promise<CommissionThresholdConfig[]>;
```

### 3.3 API Create ([`api/directus/create.ts`](src/apps/comisiones/api/directus/create.ts))

```typescript
// Nueva función
export const guardarUmbralesComisiones = async (
  config: CommissionThresholdConfig
): Promise<void>;
```

### 3.4 Cálculos ([`calculations.commissions.ts`](src/apps/comisiones/lib/calculations.commissions.ts))

- Modificar `getCommissionPercentage()` para aceptar `thresholdConfig` opcional
- Si no hay configuración en BD, usar valores hardcoded actuales como fallback
- Mantener compatibilidad hacia atrás

### 3.5 UI ([`components/CommissionThresholdPanel.tsx`](src/apps/comisiones/components/CommissionThresholdPanel.tsx))

- Crear nuevo componente similar a `ConfigurationPanel`
- Tabla editable con columnas:
  - **% Cumplimiento Mínimo** (número)
  - **% Comisión** (número)
  - **Nombre** (texto)
  - Acciones (editar/eliminar/agregar)

---

## 4. Diagrama de Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                    Home.tsx (contexto)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Cargar mes actual                                        │
│     ↓                                                         │
│  2. Fetch: obtenerPorcentajesMensuales() → presupuestos      │
│     ↓                                                         │
│  3. Fetch: obtenerUmbralesComisiones(mes) → umbrales (NUEVO) │
│     ↓                                                         │
│  4. Pasar ambos al CommissionContext                         │
│     ↓                                                         │
│  5. DataTable usa:                                           │
│    - presupuestos para % cumplimiento vs presupuesto         │
│    - umbrales para calcular comisión basada en % cumplimiento│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Pasos de Implementación

### Fase 1: Base de Datos (Directus)

- [ ] Crear colección `comisiones_umbrales_mensual`
- [ ] Configurar permisos (lectura/escritura)
- [ ] Insertar registros con valores actuales (backfill)

### Fase 2: API Layer

- [ ] Definir tipos en `types.ts`
- [ ] Crear `obtenerUmbralesComisiones()` en `read.ts`
- [ ] Crear `guardarUmbralesComisiones()` en `create.ts`

### Fase 3: Lógica de Negocio

- [ ] Actualizar `getCommissionPercentage()` en `calculations.commissions.ts`
- [ ] Agregar fallback a valores hardcoded
- [ ] Mantener compatibilidad con código existente

### Fase 4: UI de Configuración

- [ ] Crear `CommissionThresholdPanel.tsx`
- [ ] Integrar en `HomeModals.tsx` o crear modal propio
- [ ] Conectar con API de lectura/escritura

### Fase 5: Integración

- [ ] Actualizar `CommissionContext.tsx` para cargar umbrales
- [ ] Modificar hooks que usan `getCommissionPercentage()`
- [ ] Testing de extremo a extremo

---

## 6. Complejidad: Media

### Razones:

1. **No requiere cambios estructurales grandes** - sigue el patrón existente de `ConfigurationPanel`
2. **Lógica de cálculo es simple** - solo buscar umbral mayor o igual
3. **Fallback permite rollback** - si hay error en BD, usa valores actuales
4. **UI es repetitiva** - mismo patrón que configuración de presupuesto

### Lo que lo hace menos complejo:

- Solo 2 campos por umbral (cumplimiento_min + comision_pct)
- No hay relaciones complejas (es array JSON, no M2A separada)
- Sin validaciones cruzadas entre umbrales

### Consideraciones:

- Necesita validación: `cumplimiento_min` debe ser único
- Ordenamiento: siempre procesar de mayor a menor cumplimiento
- UX: mostrar mensaje si no hay configuración para un mes

---

## 7. Preguntas Pendientes

1. ¿Los umbrales aplican a **todos los roles** igual o varían por rol?

   - Actual: misma comisión para todos los roles
   - Si varía por rol, hay que agregar campo `rol_id` al JSON

2. ¿Hay **historico de cambios**?

   - Si: agregar campo `fecha_modificacion` + `usuario_modifico`

3. ¿Se pueden configurar **reglas especiales** (ej: 85% para tienda X)?
   - Actual: umbrales globales
   - Si requiere excepciones por tienda, hay que cambiar estructura

---

## 8. Estimación de Esfuerzo

| Fase                     | Tiempo Estimado |
| ------------------------ | --------------- |
| Base de Datos (Directus) | 15 min          |
| Types + API Read         | 30 min          |
| API Create               | 20 min          |
| Lógica de Cálculo        | 45 min          |
| UI Panel                 | 2 horas         |
| Integración              | 1 hora          |
| **Total**                | **~4.5 horas**  |

---

## 9. Recomendación Final

**Proceder con la implementación** porque:

1. ✅ Elimina hardcoding (mantenimiento más fácil)
2. ✅ Sigue el patrón existente (menor riesgo)
3. ✅ Fallback garantiza continuidad si hay problemas
4. ✅ UI similar reduce curva de aprendizaje
5. ✅ Tiempo razonable (~4-5 horas)

**Para comenzar**: Solo necesito confirmación de las preguntas pendientes (especialmente #1 sobre si varía por rol).
