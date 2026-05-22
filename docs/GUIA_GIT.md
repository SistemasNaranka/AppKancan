# 🔄 Guía de Comandos Git

Comandos esenciales para trabajar en equipo sin romper código.

---

## 📝 git add

**Qué hace:** Prepara cambios para commit (staging area).

### Sintaxis
```bash
git add [archivo]        # Agregar archivo específico
git add .                # Agregar todos cambios
git add src/             # Agregar carpeta específica
```

### Ejemplo
```bash
git add src/components/Button.tsx    # Una archivo
git add .                             # Todos
```

**Cuándo usar:** Antes de commit. Agrega solo cambios que quieres guardar.

---

## ⬇️ git pull

**Qué hace:** Descarga cambios remotos e integra con rama local.

### Sintaxis
```bash
git pull                              # Pull de rama actual
git pull origin [rama]                # Pull de rama específica
git pull --rebase                     # Pull sin merge automático
```

### Ejemplo
```bash
git pull                    # Trae cambios desde main (si estás en main)
git pull origin desarrollo  # Trae rama desarrollo
```

**Cuándo usar:** Antes de empezar trabajo. Mantiene tu rama sincronizada.

---

## 💾 git commit

**Qué hace:** Guarda cambios en historial local con mensaje.

### Sintaxis
```bash
git commit -m "mensaje"                    # Mensaje corto
git commit -m "Título" -m "Descripción"   # Título + descripción
```

### Mensajes buenos
```bash
git commit -m "fix: token expiry check en auth"
git commit -m "feat: agregar exportar a CSV"
git commit -m "refactor: simplificar lógica de filtros"
```

### Mensajes malos ❌
```bash
git commit -m "cambios"
git commit -m "fix bug"
git commit -m "actualización"
```

**Patrón:** `[tipo]: [acción] [componente]`
- `fix:` bug fix
- `feat:` feature nueva
- `refactor:` cambio código sin cambiar funcionalidad
- `docs:` documentación
- `test:` tests

---

## ⬆️ git push

**Qué hace:** Envía commits locales a repositorio remoto.

### Sintaxis
```bash
git push                           # Push a rama actual
git push origin [rama]             # Push a rama específica
git push origin --delete [rama]    # Borrar rama remota
```

### Ejemplo
```bash
git push                    # Si estás en "desarrollo", envía a origin/desarrollo
git push origin main        # Envía rama main
```

⚠️ **NO hacer** `git push --force` sin razón. Borra historial de otros.

**Cuándo usar:** Después de commit. Comparte cambios con equipo.

---

## 🔀 Resolver Conflictos

Conflictos ocurren cuando 2+ personas editan misma línea.

### Paso 1: Hacer pull
```bash
git pull origin [rama]
```

Si hay conflictos, Git marca cambios en archivos:

```typescript
// archivo.ts
<<<<<< HEAD
const valor = 10;  // 👈 TU CAMBIO
=======
const valor = 20;  // 👈 CAMBIO DE OTRO
>>>>>> origin/rama
```

### Paso 2: Resolver manualmente

Elige qué código mantener:

**Opción A: Mantener tu cambio**
```typescript
const valor = 10;
```

**Opción B: Mantener cambio del otro**
```typescript
const valor = 20;
```

**Opción C: Combinar ambos**
```typescript
const valor = 15;  // promedio o lógica combinada
```

Borra marcadores `<<<<<<<`, `=======`, `>>>>>>>`

### Paso 3: Confirmar resolución

```bash
git add [archivo]           # Marcar como resuelto
git commit -m "resolve: conflict en archivo.ts"
git push
```

---

## 🚨 Conflicto en Equipo: Proceso Completo

Escenario: Tú y otro dev editaron mismo componente.

### 1. Obtener últimos cambios
```bash
git pull origin desarrollo
```

Output si hay conflictos:
```
CONFLICT (content): Merge conflict in src/components/Header.tsx
Automatic merge failed; fix conflicts and then commit the result.
```

### 2. Ver archivos con conflicto
```bash
git status
```

### 3. Abrir archivo y resolver
```
src/components/Header.tsx:
- Linea 15: Decisión tuya vs otro dev
- Linea 42: Lógica conflictiva
```

**Opción simple:** Mantener un cambio
**Opción mejor:** Combinar ambos inteligentemente
**Opción segura:** Habla con quien hizo otro cambio

### 4. Marcar resuelto
```bash
git add src/components/Header.tsx
```

### 5. Completar merge
```bash
git commit -m "resolve: merge conflict Header component"
git push
```

---

## 📋 Workflow Típico (Diario)

```bash
# Mañana: actualizar rama
git pull origin desarrollo

# Trabajar en features
git add src/pages/NewPage.tsx
git commit -m "feat: nueva página de usuarios"

# Terminar día
git push origin desarrollo

# Si hay conflictos en pull
git status              # Ver qué está en conflicto
# → Resolver archivos manualmente
git add .               # Marcar resueltos
git commit -m "resolve conflicts"
git push
```

---

## ⚠️ Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `nothing to commit` | No hiciste cambios o no hiciste `add` | `git add .` primero |
| `Your branch is behind` | Pull no hecho | `git pull` |
| `reject ... (non-fast-forward)` | Otro pushed mientras trabajabas | `git pull` luego `git push` |
| `fatal: refusing to merge unrelated histories` | Ramas sin historia común | Usa `git pull --allow-unrelated-histories` |

---

## 🎯 Resumen Rápido

| Comando | Para qué |
|---------|----------|
| `git add .` | Preparar cambios |
| `git commit -m "msg"` | Guardar cambios |
| `git push` | Enviar a remoto |
| `git pull` | Traer cambios remotos |
| `git status` | Ver estado actual |
| `git log` | Ver historial commits |
