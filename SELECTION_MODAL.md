# SelectionModal Component - Documentación Completa

## 📋 Descripción General

`SelectionModal` es un componente React moderno y atractivo construido con **Material UI 7.3.4** que proporciona una interfaz elegante para seleccionar múltiples elementos. Incluye dos modos: **selección** (interactivo) y **consulta** (solo lectura).

### Características Principales

✨ **Diseño Moderno**
- Gradientes de color atractivos (púrpura/azul)
- Animaciones suaves y transiciones
- Interfaz responsiva y accesible

🔍 **Autocomplete Inteligente**
- Menú desplegable mientras escribes
- Filtrado en tiempo real
- Búsqueda en label y descripción
- Selección directa desde el dropdown

✅ **Selección Múltiple**
- Seleccionar/deseleccionar elementos individuales
- Botones separados: "Seleccionar todo" y "Deseleccionar todo"
- Indicador visual de elementos seleccionados
- Contador de seleccionados

📱 **Grid Responsivo**
- Máximo 3 columnas en pantallas grandes
- 2 columnas en tablets
- 1 columna en móviles
- Scroll interno sin afectar la estructura

👁️ **Modo Consulta**
- Visualización de solo lectura
- Perfecto para mostrar información
- Sin botones de confirmación

---

## 🚀 Instalación

### 1. Dependencias Requeridas

El componente requiere las siguientes librerías:

```bash
pnpm add @mui/material@7.3.4 @mui/icons-material @emotion/react @emotion/styled
```

### 2. Importar el Componente

```typescript
import SelectionModal, { SelectionItem } from '@/components/SelectionModal';
import { useSelectionModal } from '@/hooks/useSelectionModal';
```

---

## 📖 Uso Básico

### Ejemplo Simple

```typescript
import React, { useState } from 'react';
import { Button } from '@mui/material';
import SelectionModal, { SelectionItem } from '@/components/SelectionModal';
import { useSelectionModal } from '@/hooks/useSelectionModal';

const items: SelectionItem[] = [
  { id: 1, label: 'Elemento A', description: 'Descripción A' },
  { id: 2, label: 'Elemento B', description: 'Descripción B' },
  { id: 3, label: 'Elemento C', description: 'Descripción C' },
];

export default function MyComponent() {
  const modal = useSelectionModal();
  const [selected, setSelected] = useState<(string | number)[]>([]);

  const handleConfirm = (selectedIds: (string | number)[]) => {
    setSelected(selectedIds);
    console.log('Seleccionados:', selectedIds);
  };

  return (
    <>
      <Button onClick={modal.openModal} variant="contained">
        Abrir Modal
      </Button>

      <SelectionModal
        open={modal.open}
        onClose={modal.closeModal}
        onConfirm={handleConfirm}
        items={items}
        mode="select"
        title="Selecciona elementos"
      />

      <p>Seleccionados: {selected.length}</p>
    </>
  );
}
```

---

## 🎯 Props del Componente

### `SelectionModalProps`

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `open` | `boolean` | ✅ | Controla si el modal está abierto |
| `onClose` | `() => void` | ✅ | Callback cuando se cierra el modal |
| `onConfirm` | `(selected: (string \| number)[]) => void` | ✅ | Callback cuando se confirma la selección |
| `items` | `SelectionItem[]` | ✅ | Array de elementos a mostrar |
| `title` | `string` | ❌ | Título del modal (default: "Selecciona elementos") |
| `mode` | `'select' \| 'view'` | ❌ | Modo del modal (default: "select") |
| `initialSelected` | `(string \| number)[]` | ❌ | IDs inicialmente seleccionados (default: []) |
| `modalHeight` | `number \| string` | ❌ | Altura fija del modal (default: 600) |
| `maxColumns` | `number` | ❌ | Número máximo de columnas en el grid (default: 3) |

### `SelectionItem`

```typescript
interface SelectionItem {
  id: string | number;      // ID único del elemento
  label: string;            // Texto visible del elemento
  description?: string;     // Descripción opcional
}
```

---

## 🎨 Modos de Funcionamiento

### Modo Selección (`mode="select"`)

- ✅ Permite seleccionar/deseleccionar elementos
- ✅ Muestra checkbox en cada elemento
- ✅ Botones separados: "Seleccionar todo" y "Deseleccionar todo"
- ✅ Botón de confirmación
- ✅ Contador de seleccionados
- ✅ Autocomplete dropdown mientras escribes

```typescript
<SelectionModal
  open={modal.open}
  onClose={modal.closeModal}
  onConfirm={handleConfirm}
  items={items}
  mode="select"
  title="Selecciona elementos"
  modalHeight={600}
  maxColumns={3}
/>
```

### Modo Consulta (`mode="view"`)

- 👁️ Solo lectura
- 👁️ Sin checkboxes
- 👁️ Sin botón de confirmación
- 👁️ Autocomplete disponible
- 👁️ Muestra elementos seleccionados con chip

```typescript
<SelectionModal
  open={modal.open}
  onClose={modal.closeModal}
  onConfirm={() => {}}  // No se usa en modo view
  items={items}
  mode="view"
  title="Elementos disponibles"
  initialSelected={[1, 3, 5]}
  modalHeight={600}
/>
```

---

## 🪝 Hook `useSelectionModal`

El hook `useSelectionModal` simplifica el manejo del estado del modal:

```typescript
const modal = useSelectionModal();

// Propiedades disponibles:
modal.open      // boolean - Estado del modal
modal.openModal  // () => void - Abre el modal
modal.closeModal // () => void - Cierra el modal
```

### Ejemplo Completo

```typescript
import { useSelectionModal } from '@/hooks/useSelectionModal';

export default function Component() {
  const modal = useSelectionModal();

  return (
    <>
      <Button onClick={modal.openModal}>Abrir</Button>
      <SelectionModal
        open={modal.open}
        onClose={modal.closeModal}
        onConfirm={handleConfirm}
        items={items}
      />
    </>
  );
}
```

---

## 🔍 Autocomplete Dropdown

El componente incluye un autocomplete inteligente que muestra coincidencias mientras escribes:

```typescript
// El usuario escribe "Elemento A" en el campo de búsqueda
// El dropdown muestra automáticamente las coincidencias
// Al hacer click en una opción, se selecciona/deselecciona
```

**Características:**
- Búsqueda en tiempo real
- Menú desplegable automático
- Selección directa desde el dropdown
- Búsqueda en label y descripción
- Máximo 200px de altura para el dropdown

---

## 📱 Grid Responsivo

El componente utiliza un grid responsive que se adapta al tamaño de la pantalla:

```typescript
// Pantallas pequeñas (móviles): 1 columna
// Tablets: 2 columnas
// Pantallas grandes: 3 columnas (máximo)

<SelectionModal
  maxColumns={3}  // Puedes cambiar el máximo de columnas
  // ... otras props
/>
```

**Breakpoints:**
- `xs` (0px): 1 columna
- `sm` (600px): 2 columnas
- `md` (960px): 3 columnas (máximo)

---

## 🎨 Personalización de Estilos

El componente usa Material UI y Emotion para estilos. Puedes personalizar los colores modificando el componente:

### Cambiar Colores Principales

En `SelectionModal.tsx`, busca las referencias a `#667eea` (azul) y `#764ba2` (púrpura):

```typescript
// Cambiar el gradiente del header
background: 'linear-gradient(135deg, #TU_COLOR_1 0%, #TU_COLOR_2 100%)',

// Cambiar color del checkbox
color: '#TU_COLOR',

// Cambiar color del botón
background: 'linear-gradient(135deg, #TU_COLOR_1 0%, #TU_COLOR_2 100%)',
```

### Ejemplo: Tema Verde

```typescript
// Reemplaza los gradientes
background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
color: '#10b981',
```

### Cambiar Altura del Modal

```typescript
<SelectionModal
  modalHeight={700}  // Aumenta la altura fija
  // ... otras props
/>
```

---

## 📊 Manejo de Datos Grandes

El componente está optimizado para manejar grandes volúmenes de datos:

```typescript
// Genera 1000 elementos de ejemplo
const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  label: `Elemento ${i + 1}`,
  description: `Descripción del elemento ${i + 1}`,
}));

<SelectionModal
  items={largeDataset}
  modalHeight={600}  // Altura fija
  maxColumns={3}     // Grid responsivo
  // ... otras props
/>
```

---

## 🔄 Integración con Formularios

### Ejemplo con React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import SelectionModal from '@/components/SelectionModal';
import { useSelectionModal } from '@/hooks/useSelectionModal';

export default function FormComponent() {
  const { register, watch, setValue } = useForm({
    defaultValues: {
      selectedItems: [],
    },
  });

  const modal = useSelectionModal();
  const selectedItems = watch('selectedItems');

  const handleConfirm = (selected: (string | number)[]) => {
    setValue('selectedItems', selected);
  };

  return (
    <>
      <Button onClick={modal.openModal}>
        Seleccionar ({selectedItems.length})
      </Button>

      <SelectionModal
        open={modal.open}
        onClose={modal.closeModal}
        onConfirm={handleConfirm}
        items={items}
        initialSelected={selectedItems}
      />
    </>
  );
}
```

---

## ♿ Accesibilidad

El componente incluye características de accesibilidad:

- ✅ Soporte para teclado (Tab, Enter, Escape)
- ✅ Labels semánticos
- ✅ Contraste de colores WCAG AA
- ✅ Aria labels en elementos interactivos
- ✅ Cierre con tecla Escape
- ✅ Navegación con flechas en autocomplete

---

## 🐛 Troubleshooting

### El modal no se abre

```typescript
// ❌ Incorrecto
const [open, setOpen] = useState(false);
<SelectionModal open={open} onClose={() => {}} ... />

// ✅ Correcto - usa el hook
const modal = useSelectionModal();
<SelectionModal open={modal.open} onClose={modal.closeModal} ... />
```

### Los estilos no se aplican

Asegúrate de que Material UI esté correctamente instalado:

```bash
pnpm add @mui/material@7.3.4 @emotion/react @emotion/styled
```

### El autocomplete no funciona

Verifica que los items tengan propiedades `label` válidas:

```typescript
// ❌ Incorrecto
const items = [{ id: 1 }];  // Falta label

// ✅ Correcto
const items = [{ id: 1, label: 'Elemento 1' }];
```

### El grid no se adapta

Asegúrate de que `maxColumns` sea un número válido:

```typescript
<SelectionModal
  maxColumns={3}  // Debe ser un número entre 1 y 4
  // ... otras props
/>
```

---

## 📝 Archivos del Componente

```
client/src/
├── components/
│   └── SelectionModal.tsx      # Componente principal
├── hooks/
│   └── useSelectionModal.ts    # Hook para manejo de estado
└── pages/
    └── Home.tsx                # Ejemplo de uso
```

---

## 🎯 Casos de Uso

### 1. Selector de Categorías

```typescript
const categories = [
  { id: 'cat1', label: 'Electrónica', description: 'Productos electrónicos' },
  { id: 'cat2', label: 'Ropa', description: 'Prendas de vestir' },
  // ...
];

<SelectionModal
  items={categories}
  title="Selecciona categorías"
  onConfirm={handleCategories}
  mode="select"
  // ...
/>
```

### 2. Asignación de Permisos

```typescript
const permissions = [
  { id: 'read', label: 'Lectura', description: 'Permite leer contenido' },
  { id: 'write', label: 'Escritura', description: 'Permite crear/editar' },
  { id: 'delete', label: 'Eliminación', description: 'Permite eliminar' },
  // ...
];

<SelectionModal
  items={permissions}
  title="Asigna permisos"
  mode="select"
  onConfirm={handlePermissions}
  maxColumns={2}
  // ...
/>
```

### 3. Visualización de Elementos Seleccionados

```typescript
<SelectionModal
  items={allItems}
  title="Elementos seleccionados"
  mode="view"
  initialSelected={selectedIds}
  // ...
/>
```

---

## 🚀 Mejoras Futuras

Posibles mejoras que podrías implementar:

- [ ] Paginación para datasets muy grandes
- [ ] Búsqueda avanzada con filtros múltiples
- [ ] Ordenamiento de elementos
- [ ] Drag & drop para reordenar
- [ ] Exportar selección a CSV
- [ ] Temas oscuro/claro
- [ ] Internacionalización (i18n)
- [ ] Validación de selecciones mínimas/máximas

---

## 📄 Licencia

Este componente es parte del proyecto `mui-selection-modal` y está disponible para uso libre.

---

## 💡 Tips y Mejores Prácticas

1. **Usa IDs únicos**: Asegúrate de que cada elemento tenga un ID único
2. **Descriptions opcionales**: Las descripciones hacen el componente más informativo
3. **Manejo de estado**: Usa el hook `useSelectionModal` para simplificar
4. **Datos iniciales**: Siempre pasa `initialSelected` cuando reabre el modal
5. **Altura fija**: El modal mantiene una altura fija para mejor UX
6. **Grid responsivo**: El grid se adapta automáticamente al tamaño de pantalla
7. **Autocomplete**: Aprovecha el autocomplete para búsquedas rápidas

---

**Versión**: 2.0.0  
**Última actualización**: Octubre 2025

## Changelog

### v2.0.0
- ✨ Altura fija del modal (no cambia según items)
- ✨ Botones separados para Seleccionar/Deseleccionar todo
- ✨ Grid responsivo (máximo 3 columnas)
- ✨ Autocomplete dropdown mientras escribes
- 🐛 Mejoras en la responsividad
- 🎨 Mejor visualización en dispositivos móviles

### v1.0.0
- 🎉 Versión inicial del componente

