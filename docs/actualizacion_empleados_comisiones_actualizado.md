# Sistema de Actualización de Empleados - Comisiones (ACTUALIZADO)

## RESUMEN CORREGIDO DEL PROBLEMA

**ERROR ANTERIOR**: Pensé que era actualización selectiva de registros individuales.
**REALIDAD**: Es un **RECÁLCULO COMPLETO** del presupuesto de toda la tienda/fecha.

## Información CRUCIAL AÑADIDA

### 1. **Recálculo Masivo de Presupuestos**

- Al agregar o eliminar **CUALQUIER** empleado → se recalculan los presupuestos de **TODOS** los empleados de esa tienda/fecha
- No es actualización selectiva, sino un recálculo completo del presupuesto total

### 2. **Validación Crítica del Gerente**

- **Regla de negocio**: Una tienda NUNCA puede quedar sin gerente
- Si se actualiza/quita el gerente → **NO se puede guardar**
- Esta validación debe ejecutarse ANTES del recálculo

## Entendimiento CORREGIDO del Problema

### Situación Actual

1. **Flujo de guardado**: Los empleados se guardan con presupuesto asignado
2. **Retorno a la vista**: Se cargan los empleados que trabajaron esos días específicos
3. **Estado del botón**: "Guardar" está deshabilitado (comportamiento correcto)
4. **Problema REAL**: Al modificar la lista, el sistema debe:
   - ✅ Validar que existe al menos un gerente
   - ✅ Recalcular los presupuestos de TODOS los empleados
   - ✅ Actualizar el botón a "Actualizar"

### Requerimientos CORREGIDOS

#### 1. **Validación Previa OBLIGATORIA**

- **Antes de cualquier operación**: Verificar que hay al menos un gerente
- **Si no hay gerente**: Bloquear la operación y mostrar error
- **Si hay gerente**: Proceder con el recálculo

#### 2. **Recálculo Completo del Presupuesto**

- **Alcance**: TODOS los empleados de la tienda específica del día específico
- **Tipo de operación**: Recálculo completo, no actualización selectiva
- **Resultado**: Nuevos presupuestos para todos los empleados

#### 3. **Lógica de Operación Revisada**

- **CREAR**: Empleados nuevos + recálculo completo de TODOS
- **ELIMINAR**: Empleados removidos + recálculo completo de TODOS
- **ACTUALIZAR**: Datos modificados + recálculo completo de TODOS

#### 4. **Cambio de Etiqueta del Botón**

- **Estado inicial**: "Guardar" (para registros nuevos)
- **Estado posterior**: "Actualizar" (cuando ya existen registros para esa tienda/fecha)
- **Estado bloqueado**: Deshabilitado si no hay gerente

## Ejemplos CORREGIDOS de Escenarios

### **Escenario A: Eliminación con Recálculo**

**Contexto**: Tienda "Centro" - 15/12/2025

**Estado inicial**:

```
Empleados guardados:
- ID: 101, Juan Pérez, Gerente, $800,000
- ID: 102, María García, Vendedora, $500,000
- ID: 103, Carlos López, Cajera, $450,000
```

**Acción del usuario**: Eliminar empleado ID 103 (Carlos López)

**Resultado esperado**:

- **Validación**: ✅ Hay gerente (Juan Pérez)
- **Acción del sistema**:
  - Eliminar SOLO el registro de Carlos
  - **RECALCULAR** presupuestos de TODOS los empleados restantes
- **Registros finales**:
  - ID: 101, Juan Pérez, Gerente, $750,000 ← RECALCULADO
  - ID: 102, María García, Vendedora, $520,000 ← RECALCULADO

### **Escenario B: Eliminación INVÁLIDA (Sin Gerente)**

**Contexto**: Tienda "Norte" - 16/12/2025

**Estado inicial**:

```
Empleados guardados:
- ID: 201, Ana Torres, Gerente, $850,000
- ID: 202, Luis Martínez, Vendedor, $480,000
```

**Acción del usuario**: Eliminar empleado ID 201 (Ana Torres - la gerente)

**Resultado esperado**:

- **Validación**: ❌ NO hay gerente después de la eliminación
- **Acción del sistema**:
  - **BLOQUEAR** la operación
  - Mostrar mensaje: "No se puede eliminar el gerente. La tienda debe tener al menos un gerente."
- **Registros finales**: SIN CAMBIOS (los mismos que el estado inicial)

### **Escenario C: Adición con Recálculo**

**Contexto**: Tienda "Sur" - 17/12/2025

**Estado inicial**:

```
Empleados guardados:
- ID: 301, Pedro Ramírez, Gerente, $820,000
- ID: 302, Sandra Morales, Vendedora, $510,000
```

**Acción del usuario**: Agregar 2 empleados nuevos

**Resultado esperado**:

- **Validación**: ✅ Hay gerente (Pedro)
- **Acción del sistema**:
  - Crear 2 registros nuevos
  - **RECALCULAR** presupuestos de TODOS los empleados (incluyendo los nuevos)
- **Registros finales**:
  - ID: 301, Pedro Ramírez, Gerente, $780,000 ← RECALCULADO
  - ID: 302, Sandra Morales, Vendedora, $490,000 ← RECALCULADO
  - ID: 303, Nueva Empleada, Promotora, $380,000 ← NUEVO + RECALCULADO
  - ID: 304, Nuevo Empleado, Asistente, $350,000 ← NUEVO + RECALCULADO

### **Escenario D: Modificación con Recálculo**

**Contexto**: Tienda "Este" - 18/12/2025

**Estado inicial**:

```
Empleados guardados:
- ID: 401, Ricardo Silva, Gerente, $830,000
- ID: 402, Carmen Vega, Vendedora, $520,000
- ID: 403, Diego Herrera, Cajero, $460,000
```

**Acción del usuario**: Cambiar el cargo de Diego de Cajero a Vendedor

**Resultado esperado**:

- **Validación**: ✅ Hay gerente (Ricardo)
- **Acción del sistema**:
  - Actualizar cargo de Diego
  - **RECALCULAR** presupuestos de TODOS los empleados
- **Registros finales**:
  - ID: 401, Ricardo Silva, Gerente, $810,000 ← RECALCULADO
  - ID: 402, Carmen Vega, Vendedora, $500,000 ← RECALCULADO
  - ID: 403, Diego Herrera, Vendedor, $480,000 ← ACTUALIZADO + RECALCULADO

## Consideraciones Técnicas CORREGIDAS

### 1. **Orden de Operaciones Crítico**

```
1. IDENTIFICAR cambios (agregar/eliminar/modificar)
2. VALIDAR gerente (¿quedará al menos uno?)
   ├── SI: Proceder al paso 3
   └── NO: Bloquear y mostrar error
3. APLICAR cambios (crear/actualizar/eliminar)
4. RECALCULAR presupuestos de TODOS los empleados
5. GUARDAR cambios
6. ACTUALIZAR botón a "Actualizar"
```

### 2. **Validaciones Necesarias**

- ✅ Verificar que existe al menos un gerente ANTES de cualquier operación
- ✅ Confirmar que el empleado pertenece a la tienda específica
- ✅ Validar que la fecha está dentro del período válido
- ✅ Comprobar permisos del usuario para la tienda específica

### 3. **Estados del Botón Revisados**

```
Sin registros → "Guardar"
Con registros + hay gerente → "Actualizar"
Con registros + SIN gerente → "Actualizar" (DESHABILITADO)
Error de validación → Mensaje específico
```

### 4. **Manejo de Errores**

- **Error de gerente**: "No se puede [operación]. La tienda debe tener al menos un gerente."
- **Error de permisos**: "No tiene permisos para modificar esta tienda."
- **Error de cálculo**: "Error al recalcular presupuestos. Intente nuevamente."

## Riesgos y Consideraciones CORREGIDOS

### **Riesgo Alto**: Eliminar Último Gerente

- **Problema**: Dejar la tienda sin gerente
- **Mitigación**: Validación OBLIGATORIA antes de cualquier eliminación

### **Riesgo Alto**: Recálculo Incorrecto

- **Problema**: Errores en el recálculo masivo de presupuestos
- **Mitigación**: Validación del algoritmo de recálculo + pruebas exhaustivas

### **Riesgo Medio**: Concurrencia

- **Problema**: Dos usuarios modificando simultáneamente
- **Mitigación**: Locks específicos por tienda/fecha

## Flujo de Trabajo Corregido

### **Validación Previa**

```
VERIFICAR_GERENTE(tienda, fecha):
  empleados = OBTENER_EMPLEADOS(tienda, fecha)
  gerentes = FILTRAR_POR_CARGO(empleados, "Gerente")
  RETURN gerentes.length > 0
```

### **Operación con Recálculo**

```
PROCESAR_CAMBIOS(tienda, fecha, cambios):
  IF NOT VERIFICAR_GERENTE(tienda, fecha):
    RETURN ERROR("Debe haber al menos un gerente")

  APLICAR_CAMBIOS(cambios)  // Crear/Actualizar/Eliminar
  EMPLEADOS = OBTENER_EMPLEADOS(tienda, fecha)
  RECALCULAR_PRESUPUESTOS(EMPLEADOS)  // Para TODOS
  GUARDAR_CAMBIOS()
  ACTUALIZAR_BOTON("Actualizar")
```

## Próximos Pasos CORREGIDOS

1. ✅ **Análisis del problema** - COMPLETADO (con corrección)
2. ⏳ **Diseñar validación de gerente**
3. ⏳ **Diseñar lógica de recálculo masivo**
4. ⏳ **Definir manejo de errores específicos**
5. ⏳ **Diseñar interfaz con botón dinámico**
6. ⏳ **Implementar y probar validaciones**
7. ⏳ **Implementar recálculo completo**
8. ⏳ **Pruebas de todos los escenarios**

---

**CORRECCIÓN IMPORTANTE**: El problema NO es actualización selectiva, sino recálculo completo con validaciones críticas de gerente.
