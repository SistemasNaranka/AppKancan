# Sistema de Actualización de Empleados - Comisiones

## Resumen del Problema

El sistema actual de comisiones tiene un problema delicado con la funcionalidad de actualización de empleados. Cuando se guardan empleados con presupuesto asignado y se retorna a la vista, el botón "Guardar" se deshabilita correctamente, pero cuando se realizan modificaciones (agregar/eliminar empleados), el sistema no actualiza los registros de manera inteligente y selectiva.

## Entendimiento del Problema

### Situación Actual

1. **Flujo de guardado**: Los empleados se guardan con presupuesto asignado
2. **Retorno a la vista**: Se cargan los empleados que trabajaron esos días específicos
3. **Estado del botón**: "Guardar" está deshabilitado (comportamiento correcto)
4. **Problema**: Al modificar la lista, no hay lógica para actualizar selectivamente

### Requerimientos Identificados

#### 1. **Actualización Selectiva por Contexto**

- **Alcance limitado**: Solo la tienda específica del día específico
- **No afecta otros datos**: Los cambios no deben impactar otras tiendas o fechas
- **Integridad referencial**: Mantener la consistencia de IDs (no modificar IDs de empleados existentes)

#### 2. **Lógica de Operación Inteligente**

- **CREAR**: Solo registros nuevos (empleados agregados)
- **ACTUALIZAR**: Solo registros modificados (datos del empleado cambiados, excepto IDs)
- **ELIMINAR**: Solo registros removidos (empleados específicos de esa tienda/fecha)

#### 3. **Cambio de Etiqueta del Botón**

- **Estado inicial**: "Guardar" (para registros nuevos)
- **Estado posterior**: "Actualizar" (cuando ya existen registros para esa tienda/fecha)

## Ejemplos Detallados de Escenarios

### **Escenario A: Eliminación Selectiva**

**Contexto**: Tienda "Centro" - 15/12/2025

**Estado inicial**:

```
Empleados guardados:
- ID: 101, Juan Pérez, Vendedor, $500,000
- ID: 102, María García, Cajera, $450,000
- ID: 103, Carlos López, Supervisor, $600,000
```

**Acción del usuario**: Eliminar empleado ID 102 (María García)

**Resultado esperado**:

- **Acción del sistema**: Eliminar SOLO el registro de María García de la Tienda "Centro" del 15/12/2025
- **Registros restantes**:
  - ID: 101, Juan Pérez, Vendedor, $500,000
  - ID: 103, Carlos López, Supervisor, $600,000
- **Registros no afectados**: Todos los registros de Juan y Carlos en otras tiendas y fechas

### **Escenario B: Adición Selectiva**

**Contexto**: Tienda "Norte" - 16/12/2025

**Estado inicial**:

```
Empleados guardados:
- ID: 201, Ana Torres, Vendedora, $480,000
- ID: 202, Luis Martínez, Seguridad, $400,000
```

**Acción del usuario**: Agregar 2 empleados nuevos

**Resultado esperado**:

- **Acción del sistema**: Crear SOLO 2 registros nuevos para la Tienda "Norte" del 16/12/2025
- **Registros finales**:
  - ID: 201, Ana Torres, Vendedora, $480,000
  - ID: 202, Luis Martínez, Seguridad, $400,000
  - ID: 203, Nueva Empleada, Asistente, $350,000 ← NUEVO
  - ID: 204, Nuevo Empleado, Promotor, $380,000 ← NUEVO

### **Escenario C: Actualización Selectiva**

**Contexto**: Tienda "Sur" - 17/12/2025

**Estado inicial**:

```
Empleados guardados:
- ID: 301, Pedro Ramírez, Vendedor, $520,000
- ID: 302, Sandra Morales, Cajera, $470,000
```

**Acción del usuario**: Modificar datos de Pedro (cambio de cargo y salario)

**Resultado esperado**:

- **Acción del sistema**: Actualizar SOLO el registro de Pedro (ID: 301) de la Tienda "Sur" del 17/12/2025
- **Registros finales**:
  - ID: 301, Pedro Ramírez, Supervisor, $580,000 ← ACTUALIZADO (cargo y salario)
  - ID: 302, Sandra Morales, Cajera, $470,000 ← SIN CAMBIOS

### **Escenario D: Combinación de Operaciones**

**Contexto**: Tienda "Este" - 18/12/2025

**Estado inicial**:

```
Empleados guardados:
- ID: 401, Ricardo Silva, Vendedor, $510,000
- ID: 402, Carmen Vega, Promotora, $390,000
- ID: 403, Diego Herrera, Seguridad, $420,000
```

**Acción del usuario**:

- Eliminar ID: 402 (Carmen)
- Modificar datos de Ricardo (cargo a Supervisor)
- Agregar 1 empleado nuevo

**Resultado esperado**:

- **Acción del sistema**:

  - **ELIMINAR**: Solo registro de Carmen (ID: 402) de Tienda "Este" 18/12/2025
  - **ACTUALIZAR**: Solo registro de Ricardo (ID: 401) - cambiar cargo a Supervisor
  - **CREAR**: Solo 1 registro nuevo para el empleado agregado

- **Registros finales**:
  - ID: 401, Ricardo Silva, Supervisor, $580,000 ← ACTUALIZADO
  - ID: 403, Diego Herrera, Seguridad, $420,000 ← SIN CAMBIOS
  - ID: 404, Nueva Empleada, Vendedora, $450,000 ← NUEVO

## Consideraciones Técnicas Importantes

### 1. **Claves de Identificación**

- **Combinación única**: Tienda + Fecha + ID_Empleado
- **Alcance de operaciones**: Determinado por Tienda + Fecha específicas
- **Aislamiento de datos**: No afectar registros de otras tiendas o fechas

### 2. **Datos Modificables vs No Modificables**

- **Modificables**: Nombre, cargo, salario, comisiones, etc.
- **No modificables**: ID_Empleado, Tienda, Fecha (para mantener integridad)

### 3. **Estados del Botón**

```
Estado inicial (sin registros) → "Guardar"
Estado con registros existentes → "Actualizar"
```

### 4. **Validaciones Necesarias**

- Verificar que el empleado pertenece a la tienda específica
- Confirmar que la fecha está dentro del período válido
- Validar permisos del usuario para la tienda específica
- Comprobar que no hay dependencias que impidan la eliminación

## Riesgos y Consideraciones

### **Riesgo Alto**: Eliminación Incorrecta

- **Problema**: Eliminar registros de empleados en todas las tiendas/fechas
- **Mitigación**: Siempre filtrar por Tienda + Fecha específicas

### **Riesgo Medio**: Actualización Parcial

- **Problema**: No actualizar todos los campos modificados
- **Mitigación**: Comparación completa antes/después de cambios

### **Riesgo Bajo**: Conflictos de Concurrencia

- **Problema**: Dos usuarios modificando simultáneamente
- **Mitigación**: Locks o timestamps de actualización

## Próximos Pasos

1. ✅ **Análisis del problema** - COMPLETADO
2. ⏳ **Diseño de la lógica de actualización selectiva**
3. ⏳ **Definición de la interfaz de usuario (botón dinámico)**
4. ⏳ **Implementación de la lógica de negocio**
5. ⏳ **Pruebas de los diferentes escenarios**
6. ⏳ **Validación de integridad de datos**

---

**Nota**: Este documento representa mi entendimiento actual del problema. Se requiere validación del usuario antes de proceder con la implementación.
