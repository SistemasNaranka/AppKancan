# Solución COMPLETA para Actualización de Empleados - Comisiones

## 🎯 **PROBLEMA COMPLETO IDENTIFICADO**

### **Problema Principal:**

1. **Botón deshabilitado**: El botón está deshabilitado cuando `hasExistingData` es `true` (línea 618 en CodesModal.tsx)
2. **Texto del botón estático**: No cambia entre "Guardar" y "Actualizar"
3. **Falta recálculo en guardado**: Los presupuestos no se recalculan antes de guardar
4. **Datos no se actualizan en interfaz**: Después de guardar, hay que recargar la página manualmente

### **Análisis del Flujo Actual:**

#### **Código Problemático en CodesModal.tsx:**

```typescript
// ❌ PROBLEMA 1: Botón deshabilitado cuando hay datos existentes
disabled={
  empleadosAsignados.length === 0 ||
  saving ||
  !hasPermission ||
  !canSave ||
  hasExistingData  // ← ¡ESTO ES EL PROBLEMA PRINCIPAL!
}

// ❌ PROBLEMA 2: Texto estático que no cambia
{
  saving
    ? "Guardando..."
    : hasExistingData
    ? `Asignación Existente (${empleadosAsignados.length} empleados)`  // ← NO CAMBIA A "ACTUALIZAR"
    : `Guardar Asignación (${empleadosAsignados.length} empleados)`
}
```

#### **Flujo Actual Problemático:**

```
1. Usuario abre modal → Carga empleados existentes
2. Usuario modifica empleados → Recálculo individual ✅
3. Usuario intenta hacer clic → Botón DESHABILITADO ❌
4. Usuario no puede guardar actualizaciones ❌
5. Datos desactualizados en interfaz ❌
```

## 🛠️ **SOLUCIÓN INTEGRAL**

### **1. HABILITAR BOTÓN PARA ACTUALIZACIONES**

#### **Modificar CodesModal.tsx:**

```typescript
// ✅ SOLUCIÓN 1: Habilitar botón para actualizaciones
disabled={
  empleadosAsignados.length === 0 ||
  saving ||
  !hasPermission ||
  !canSave
  // ❌ REMOVER: || hasExistingData
}

// ✅ SOLUCIÓN 2: Texto dinámico del botón
{
  saving
    ? "Guardando..."
    : hasExistingData
    ? `Actualizar Asignación (${empleadosAsignados.length} empleados)`  // ← CAMBIAR A "ACTUALIZAR"
    : `Guardar Asignación (${empleadosAsignados.length} empleados)`
}
```

### **2. RECÁLCULO COMPLETO ANTES DE GUARDAR**

#### **Modificar useEmployeeOperations.ts:**

```typescript
const handleSaveAsignaciones = async (
  fechaActual: string,
  cargosDisponibles: DirectusCargo[]
) => {
  if (empleadosAsignados.length === 0) {
    setError("Debe asignar al menos un empleado");
    setMessageType("error");
    return;
  }

  if (!hasRequiredRoles()) {
    setError("Debe asignar al menos un gerente o coadministrador");
    setMessageType("error");
    return;
  }

  try {
    console.log("🚀 Iniciando guardado de asignaciones...");
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

    // ... resto del código igual
  }
};
```

### **3. VALIDACIÓN MEJORADA DE GERENTE**

#### **Modificar useEmployeeOperations.ts:**

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

### **4. FUERZA RECARGA DE DATOS DESPUÉS DE GUARDAR**

#### **Modificar useOptimizedCommissionData.ts:**

```typescript
// ✅ MEJORAR función refetch para invalidación más agresiva
const refetch = useCallback(() => {
  console.log("🔄 Forzando recarga de datos de comisiones...");

  // Invalidar múltiples claves relacionadas
  queryClient.invalidateQueries({
    queryKey: ["commission-data"],
    exact: false, // Invalidar todas las variantes
  });

  // También invalidar consultas relacionadas
  queryClient.invalidateQueries({
    queryKey: ["budgets"],
    exact: false,
  });

  queryClient.invalidateQueries({
    queryKey: ["staff"],
    exact: false,
  });

  queryClient.invalidateQueries({
    queryKey: ["ventas"],
    exact: false,
  });

  // Forzar refetch inmediato
  return queryClient.refetchQueries({
    queryKey: ["commission-data", selectedMonth],
    type: "active",
  });
}, [queryClient, selectedMonth]);
```

### **5. LÓGICA DE BOTÓN DINÁMICO EN HOOK**

#### **Modificar useEmployeeOperations.ts:**

```typescript
// ✅ NUEVO: Estado para configuración del botón
const [buttonConfig, setButtonConfig] = useState({
  text: "Guardar",
  action: "save",
  disabled: false,
});

// ✅ NUEVO: Actualizar configuración del botón
useEffect(() => {
  const hasManagerOrCoadmin = empleadosAsignados.some((empleado) =>
    ROLES_EXCLUSIVOS.includes(
      empleado.cargoAsignado.toLowerCase() as RolExclusivo
    )
  );

  // Determinar configuración del botón
  let newConfig = {
    text: hasExistingData ? "Actualizar" : "Guardar",
    action: hasExistingData ? "update" : "save",
    disabled: !hasManagerOrCoadmin || empleadosAsignados.length === 0,
  };

  // Solo actualizar si cambió
  if (JSON.stringify(buttonConfig) !== JSON.stringify(newConfig)) {
    setButtonConfig(newConfig);
  }
}, [empleadosAsignados, hasExistingData, buttonConfig]);
```

## 🔄 **FLUJO CORREGIDO COMPLETO**

### **Escenario A: Primera Vez (Sin datos existentes)**

```
1. Usuario abre modal → Sin empleados asignados
2. Usuario asigna empleados → Recálculo individual ✅
3. Botón muestra "Guardar" ✅
4. Usuario hace clic →
   - Validar gerente ✅
   - Recalcular TODOS los presupuestos ✅
   - Eliminar datos existentes ✅
   - Guardar con presupuestos actualizados ✅
   - Forzar recarga de datos ✅
```

### **Escenario B: Actualización (Con datos existentes)**

```
1. Usuario abre modal → Carga empleados existentes
2. Usuario modifica empleados → Recálculo individual ✅
3. Botón muestra "Actualizar" ✅ (NO deshabilitado)
4. Usuario hace clic →
   - Validar gerente ✅
   - Recalcular TODOS los presupuestos ✅
   - Eliminar datos existentes ✅
   - Guardar con presupuestos actualizados ✅
   - Forzar recarga de datos ✅
```

### **Escenario C: Eliminación de Gerente**

```
1. Usuario intenta eliminar gerente ✅
2. Sistema verifica gerentes restantes ✅
3. Si es el último gerente → BLOQUEAR con error ✅
4. Si hay otros gerentes → Permitir eliminación + recálculo ✅
```

## 📁 **ARCHIVOS A MODIFICAR**

### **1. `src/apps/comisiones/components/CodesModal.tsx`:**

- Habilitar botón para actualizaciones (línea 613-619)
- Cambiar texto dinámico del botón (línea 628-632)

### **2. `src/apps/comisiones/hooks/useEmployeeOperations.ts`:**

- Agregar recálculo completo en `handleSaveAsignaciones`
- Mejorar validación de gerente en `handleRemoveEmpleado`
- Implementar lógica de botón dinámico

### **3. `src/apps/comisiones/hooks/useOptimizedCommissionData.ts`:**

- Mejorar función `refetch` para invalidación más agresiva

### **4. `src/apps/comisiones/hooks/useEmployeeManagement.ts`:**

- Sincronizar nuevos estados del botón

## ✅ **BENEFICIOS DE LA SOLUCIÓN**

1. ✅ **Botón habilitado**: Siempre se puede guardar/actualizar cuando hay empleados válidos
2. ✅ **Texto dinámico**: "Guardar" → "Actualizar" según el contexto
3. ✅ **Recálculo completo**: Siempre se recalculan todos los presupuestos antes de guardar
4. ✅ **Validación robusta**: Previene eliminación del último gerente
5. ✅ **Actualización de interfaz**: Los datos se recargan automáticamente después de guardar
6. ✅ **Consistencia**: Los datos guardados siempre reflejan el estado actual
7. ✅ **UX mejorada**: Usuario sabe exactamente qué operación está realizando

## 🧪 **TESTING REQUERIDO**

### **Casos de prueba para botón:**

- [ ] Sin datos → botón "Guardar" habilitado
- [ ] Con datos → botón "Actualizar" habilitado (NO deshabilitado)
- [ ] Sin gerente → botón deshabilitado
- [ ] Sin empleados → botón deshabilitado

### **Casos de prueba para recálculo:**

- [ ] Agregar empleado → verificar recálculo de todos
- [ ] Eliminar empleado → verificar recálculo de todos
- [ ] Modificar empleado → verificar recálculo de todos
- [ ] Guardar → verificar que se usan presupuestos recalculados

### **Casos de prueba para actualización de interfaz:**

- [ ] Guardar exitoso → datos se actualizan sin recargar página
- [ ] Eliminar último gerente → debe dar error y NO guardar
- [ ] Múltiples operaciones → todos los cálculos deben ser consistentes

---

**Esta solución resuelve TODOS los problemas identificados:**

1. ✅ Botón deshabilitado
2. ✅ Texto estático del botón
3. ✅ Falta de recálculo en guardado
4. ✅ Datos no actualizados en interfaz
