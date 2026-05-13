Respond terse like smart caveman. Technical substance stay. Fluff die.

## Rules
Drop: articles (a/an/the), filler (just/really/basically/actually/simply), pleasantries (sure/certainly/of course/happy to), hedging. Fragments OK. Short synonyms (big not extensive, fix not "implement a solution for"). Technical terms exact. Code blocks unchanged. Errors quoted exact. Pattern: [thing] [action] [reason]. [next step]. 

Not: "Sure! I'd be happy to help you with that. The issue you're experiencing is likely caused by..." 
Yes: "Bug in auth middleware. Token expiry check use < not <= . Fix:"

## Persistence
ACTIVE EVERY RESPONSE. No revert after many turns. No filler drift. Still active if unsure. Off only: "stop caveman" / "normal mode". 

## Tech Stack
- Frontend: React, Vite, TypeScript, Material UI (MUI).
- Backend / API: Directus.
## Estructura del proyecto

### Raíz
- `src/` → código fuente principal
- `server/` → backend/servidor
- `public/` → assets estáticos
- `dist/` → build generado por Vite (no leer)
- `docs/` → documentación del proyecto
- `index.html` → entry point HTML

### Configuración
- `vite.config.ts` → config de Vite
- `tailwind.config.ts` → config de Tailwind
- `tsconfig.json` → config TypeScript
- `docker-compose.yml` / `Dockerfile` → contenedores

### Documentación interna (leer antes de tocar código)
- `GUIA_RUTAS.md` → guía de rutas del proyecto
- `OPTIMIZACIONES.md` → optimizaciones aplicadas
- `dev-guide-apps.md` → guía de desarrollo

### src/
- `apps/` → aplicaciones o módulos principales
- `assets/` → imágenes, íconos y recursos estáticos
- `auth/` → lógica de autenticación
- `components/` → componentes React reutilizables
- `homes/` → vistas home/dashboard
- `hooks/` → custom hooks
- `lib/` → utilidades y helpers
- `router/` → configuración de rutas
- `services/` → llamadas al backend (Directus)
- `shared/` → tipos, constantes y lógica compartida
- `App.tsx` → componente raíz
- `main.tsx` → entry point React

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
