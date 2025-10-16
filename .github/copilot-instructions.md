# Copilot Instructions for react-app

## Project Overview
This is a React + TypeScript project bootstrapped with Vite. The main objective is to validate both user roles and policies obtained from Directus. Based on these, the sidebar dynamically displays different modules for each user. The architecture is designed to make it easy and scalable for developers to add new modules—just update the config and add the corresponding component.

The structure is modular, with feature, config, and component separation under `src/`.

## Key Directories & Files
- `src/components/`: Reusable UI components (e.g., `Sidebar`, `Button`, `Card`, `List`).
- `src/config/apps.ts`: Centralized app definitions and role-based access logic.
- `src/features/`, `src/services/`, `src/store/`: Reserved for business logic, API calls, and state management.
- `vite.config.ts`: Vite build configuration.
- `App.tsx`: Main entry point, sets up layout and (optionally) routing.

## Routing & SPA Patterns
- Uses `react-router-dom` (see `package.json`) for client-side routing.
- Sidebar navigation should use `<Link>` from `react-router-dom` for route changes.
- Page components (e.g., Dashboard, Sistemas, Gestion) are rendered via `<Routes>` in `App.tsx`.

## Role-Based UI
- App visibility is controlled by user roles, defined in `src/config/apps.ts`.
- Components should filter or adapt UI based on the `userRole` prop.

## Developer Workflows
- **Start dev server:** `npm run dev`
- **Build for production:** `npm run build`
- **Lint:** `npm run lint` (if configured)
- **Type-check:** `npm run typecheck` (if configured)
- **Hot reload:** Enabled by Vite out of the box.

## Conventions & Patterns
- Prefer functional components and hooks.
- Use TypeScript interfaces for props and data models.
- Centralize config and role logic in `src/config/`.
- Use relative imports within `src/`.
- Keep UI logic in `components/`, business logic in `features/` or `services/`.

## External Integrations
- Simulated backend data (Directus) is currently hardcoded in `src/config/apps.ts`.
- For real API calls, use service modules under `src/services/`.

## Example: Role-Based Sidebar
```tsx
<Sidebar userRole="admin" />
```

## Example: Routing Setup
```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
// ...
<BrowserRouter>
  <Sidebar userRole={userRole} />
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    {/* ...other routes... */}
  </Routes>
</BrowserRouter>
```

## Troubleshooting
- If a component does not render, check prop types and imports.
- For routing issues, ensure `<Link>` is used and paths match those in `apps.ts`.

---

If any conventions or workflows are unclear, please ask for clarification or examples from the codebase.