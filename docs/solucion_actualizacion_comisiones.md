# Solución para Actualización de Empleados - Comisiones

## ANÁLISIS DEL CÓDIGO ACTUAL

### ✅ **Lo que YA FUNCIONA:**

1. **Recálculo existente**: La función `calcularPresupuestosTodosEmpleados` ya existe y funciona correctamente
2. **Lógica de cálculo**: `calculateBudgetsWithFixedDistributive` en `calculations.budgets.ts` hace el recálculo completo
3. **Operaciones individuales**: `handleAddEmpleado` y `handleRemoveEmpleado` ya llaman al recálculo
4. **Eliminación previa**: Ya elimina datos existentes antes de guardar (línea 558-568 en useEmployeeOperations.ts)

### ❌ **PROBLEMAS IDENTIFICADOS:**

#### **Problema 1: Falta Recálculo Antes de Guardar**

```typescript
// En handleSaveAsignaciones (línea 572-578):
const presupuestosParaGuardar = empleadosAsignados.map((empleado) => ({
  asesor: empleado.asesor.id,
  fecha: fechaActual,
  presupuesto: empleado.presupuesto, // ❌ Usa presupuestos CALCULADOS ANTERIORMENTE
  tienda_id: empleado.tiendaId,
  cargo: mapearCargoACargoId(empleado.cargoAsignado),
}));
```

**Problema**: Los presupuestos pueden estar desactualizados si se hicieron cambios después del último recálculo.

#### **Problema 2: Botón No Cambia Dinámicamente**

```typescript
// En useEmployeeOperations.ts (línea 104-106):
const newCanSave =
  hasManagerOrCoadmin && empleadosAsignados.length > 0 && !hasExistingData;
```

**Problema**: El botón siempre dice "Guardar" incluso cuando debería decir "Actualizar".

#### **Problema 3: Falta Validación de Gerente**

**Estado actual**: Solo valida que hay gerente para habilitar el guardado, pero no valida antes de operaciones de eliminación.

## SOLUCIÓN PROPUESTA

### **1. INTEGRAR RECÁLCULO COMPLETO EN GUARDADO**

#### **Modificar `handleSaveAsignaciones`:**

```typescript
const handleSaveAsignaciones = async (fechaActual: string, cargosDisponibles: DirectusCargo[]) => {
  // ✅ NUEVO: Validación de gerente ANTES de cualquier operación
  if (!hasRequiredRoles()) {
    setError("Debe asignar al menos un gerente o coadministrador");
    setMessageType("error");
    return;
  }

  try {
    setSaving(true);
    setError(null);

    // ✅ NUEVO: Recálculo completo ANTES de guardar
    const empleadosConRoles = empleadosAsignados.map(e => ({
      asesor: e.asesor,
      cargoAsignado: e.cargoAsignado
    }));

    const presupuestosRecalculados = await calcularPresupuestosTodosEmpleados(
      empleadosConRoles,
      fechaActual
    );

    if (presupuestosRecalculados === null) {
      setError("No se pudo recalcular el presupuesto");
      setMessageType("error");
      return;
    }

    // ✅ USAR PRESUPUESTOS RECALCULADOS
    const presupuestosParaGuardar = empleadosAsignados.map((empleado) => ({
      asesor: empleado.asesor.id,
      fecha: fechaActual,
      presupuesto: presupuestosRecalculados[empleado.asesor.id], // ← RECÁLCULO COMPLETO
      tienda_id: empleado.tiendaId,
      cargo: mapearCargoACargoId(empleado.cargoAsignado),
    }));

    // ... resto del código de guardado igual
  }
};
```

### **2. CAMBIO DINÁMICO DEL BOTÓN**

#### **Modificar lógica de `canSave`:**

```typescript
useEffect(() => {
  const hasManagerOrCoadmin = empleadosAsignados.some((empleado) =>
    ROLES_EXCLUSIVOS.includes(
      empleado.cargoAsignado.toLowerCase() as RolExclusivo
    )
  );

  // ✅ NUEVA LÓGICA: Determinar texto del botón
  let buttonText = "Guardar";
  let buttonAction = "save";

  if (hasExistingData) {
    buttonText = "Actualizar";
    buttonAction = "update";
  }

  const newCanSave = hasManagerOrCoadmin && empleadosAsignados.length > 0;

  // Actualizar estados
  setCanSave(newCanSave);
  setButtonConfig({ text: buttonText, action: buttonAction });
}, [empleadosAsignados, hasExistingData]);
```

### **3. VALIDACIÓN MEJORADA DE GERENTE**

#### **Modificar `handleRemoveEmpleado`:**

```typescript
const handleRemoveEmpleado = async (asesorId: number) => {
  // ✅ NUEVO: Verificar si es gerente antes de eliminar
  const empleadoAEliminar = empleadosAsignados.find(
    (e) => e.asesor.id === asesorId
  );
  const isGerente =
    empleadoAEliminar &&
    ROLES_EXCLUSIVOS.includes(
      empleadoAEliminar.cargoAsignado.toLowerCase() as RolExclusivo
    );

  if (isGerente) {
    // Verificar si quedan otros gerentes
    const gerentesRestantes = empleadosAsignados.filter(
      (e) =>
        e.asesor.id !== asesorId &&
        ROLES_EXCLUSIVOS.includes(e.cargoAsignado.toLowerCase() as RolExclusivo)
    );

    if (gerentesRestantes.length === 0) {
      setError(
        "No se puede eliminar el último gerente. Asigne otro gerente primero."
      );
      setMessageType("error");
      return;
    }
  }

  // ✅ Continuar con la eliminación y recálculo...
};
```

### **4. INTERFAZ DE USUARIO ACTUALIZADA**

#### **En el Modal (CodesModal.tsx):**

```typescript
// ✅ BOTÓN DINÁMICO
<Button
  variant="contained"
  disabled={!canSave || saving}
  onClick={() => {
    if (buttonConfig.action === "save") {
      handleSaveAsignaciones(fechaActual, cargosDisponibles);
    } else {
      // Mismo método, pero el texto será "Actualizar"
      handleSaveAsignaciones(fechaActual, cargosDisponibles);
    }
  }}
>
  {buttonConfig.text} {/* "Guardar" o "Actualizar" */}
</Button>
```

## FLUJO FINAL CORREGIDO

### **Escenario A: Primera Vez (Sin datos existentes)**

```
1. Usuario asigna empleados → Recálculo automático ✅
2. Botón muestra "Guardar" ✅
3. Usuario hace clic →
   - Validar gerente ✅
   - Recalcular TODOS los presupuestos ✅
   - Eliminar datos existentes ✅
   - Guardar con presupuestos actualizados ✅
```

### **Escenario B: Actualización (Con datos existentes)**

```
1. Cargar empleados existentes → Estado hasExistingData = true ✅
2. Botón muestra "Actualizar" ✅
3. Usuario modifica (agrega/elimina/modifica) → Recálculo automático ✅
4. Usuario hace clic →
   - Validar gerente ✅
   - Recalcular TODOS los presupuestos ✅
   - Eliminar datos existentes ✅
   - Guardar con presupuestos actualizados ✅
```

### **Escenario C: Eliminación de Gerente**

```
1. Usuario intenta eliminar gerente ✅
2. Sistema verifica gerentes restantes ✅
3. Si es el último gerente → BLOQUEAR con error ✅
4. Si hay otros gerentes → Permitir eliminación + recálculo ✅
```

## ARCHIVOS A MODIFICAR

1. **`useEmployeeOperations.ts`**:

   - Agregar recálculo en `handleSaveAsignaciones`
   - Mejorar validación de gerente en `handleRemoveEmpleado`
   - Implementar lógica de botón dinámico

2. **`CodesModal.tsx`** (o componente modal correspondiente):

   - Implementar botón con texto dinámico
   - Manejar estados de validación

3. **`useEmployeeManagement.ts`**:
   - Sincronizar nuevos estados del botón

## BENEFICIOS DE LA SOLUCIÓN

1. ✅ **Recálculo completo**: Siempre se recalculan todos los presupuestos antes de guardar
2. ✅ **Botón dinámico**: Cambia entre "Guardar" y "Actualizar" según el contexto
3. ✅ **Validación robusta**: Previene eliminación del último gerente
4. ✅ **Consistencia**: Los datos guardados siempre reflejan el estado actual
5. ✅ **UX mejorada**: Usuario sabe exactamente qué operación está realizando

## TESTING REQUERIDO

1. **Casos de prueba para recálculo**:

   - Agregar empleado → verificar recálculo de todos
   - Eliminar empleado → verificar recálculo de todos
   - Modificar empleado → verificar recálculo de todos

2. **Casos de prueba para botón**:

   - Sin datos → botón "Guardar"
   - Con datos → botón "Actualizar"

3. **Casos de prueba para validación**:
   - Eliminar último gerente → debe dar error
   - Eliminar gerente con otros gerentes → debe permitir
   - Guardar sin gerente → debe dar error

---

**Nota**: Esta solución mantiene toda la lógica existente y solo agrega las mejoras necesarias para corregir los problemas identificados.
