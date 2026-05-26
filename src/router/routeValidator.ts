import { RouteObject } from "react-router-dom";

/**
 * Errores específicos para rutas
 */
export class RouteValidationError extends Error {
  constructor(
    public filePath: string,
    public errorType: string,
    public details: string
  ) {
    super(`[RouteValidationError] ${filePath}\n${errorType}: ${details}`);
    this.name = "RouteValidationError";
  }
}

/**
 * Valida la estructura de un módulo de rutas
 */
export function validateRouteModule(filePath: string, module: any): void {
  if (!module) {
    throw new RouteValidationError(
      filePath,
      "MÓDULO_VACÍO",
      "El archivo no exporta ningún módulo. Asegúrate de tener un 'export default'."
    );
  }

  if (!module.default) {
    throw new RouteValidationError(
      filePath,
      "FALTA_DEFAULT_EXPORT",
      `El archivo debe tener un 'export default' con un array de RouteObject[].`
    );
  }

  if (!Array.isArray(module.default)) {
    throw new RouteValidationError(
      filePath,
      "TIPO_INCORRECTO",
      `El 'export default' debe ser un array de RouteObject[]. Recibido: ${typeof module.default}`
    );
  }

  if (module.default.length === 0) {
    throw new RouteValidationError(
      filePath,
      "ARRAY_VACÍO",
      `El array de rutas está vacío. Debes definir al menos una ruta.`
    );
  }

  module.default.forEach((route: any, index: number) => {
    validateRouteObject(filePath, route, index);
  });
}

/**
 * Valida una ruta individual
 */
function validateRouteObject(
  filePath: string,
  route: any,
  index: number,
  isChild = false
): void {
  if (typeof route !== "object" || route === null) {
    throw new RouteValidationError(
      filePath,
      `RUTA_INVÁLIDA [${index}]`,
      `La ruta debe ser un objeto, recibido: ${typeof route}`
    );
  }

  if (!route.path && !route.index) {
    throw new RouteValidationError(
      filePath,
      `FALTA_PATH [${index}]`,
      `Toda ruta debe tener 'path' (string) o 'index' (boolean).`
    );
  }

  if (route.path !== undefined && typeof route.path !== "string") {
    throw new RouteValidationError(
      filePath,
      `PATH_TIPO_INCORRECTO [${index}]`,
      `El 'path' debe ser un string.`
    );
  }

  if (route.path) {
    // ✅ Permitir rutas absolutas para módulos siblings
    // En AppRoutes.tsx, las rutas de módulos se agregan como siblings del Layout
    // por lo que necesitan ser absolutas para funcionar correctamente
    // Solo validamos que no estén vacías
    if (route.path.trim() === "") {
      throw new RouteValidationError(
        filePath,
        `PATH_VACÍO [${index}]`,
        `La ruta no puede estar vacía.`
      );
    }
  }

  if (!route.element && !route.children && !route.Component) {
    throw new RouteValidationError(
      filePath,
      `FALTA_ELEMENT [${index}]`,
      `La ruta debe tener 'element', 'Component' o 'children'.`
    );
  }

  // Children debe ser un array de tipo RouteObject[]
  if (route.children) {
    if (!Array.isArray(route.children)) {
      throw new RouteValidationError(
        filePath,
        `CHILDREN_TIPO_INCORRECTO [${index}]`,
        `'children' debe ser un array de RouteObject[].`
      );
    }

    route.children.forEach((child: any, childIndex: number) => {
      validateRouteObject(filePath, child, childIndex, true);
    });
  }
}

/**
 * Carga y valida rutas sin detener la app.
 * Retorna { routes, error } en lugar de lanzar throw.
 */
export function loadAndValidateRoutes(
  routeModules: Record<string, { default: RouteObject[] }>
): { routes: RouteObject[]; error: RouteValidationError[] | null } {
  const validatedRoutes: RouteObject[] = [];
  const errors: RouteValidationError[] = [];

  for (const filePath in routeModules) {
    try {
      const module = routeModules[filePath];
      validateRouteModule(filePath, module);
      validatedRoutes.push(...module.default);
    } catch (error) {
      if (error instanceof RouteValidationError) {
        errors.push(error);
        console.error(`❌ ${error.message}`);
      } else {
        console.error(`❌ Error inesperado en ${filePath}:`, error);
      }
    }
  }

  if (errors.length > 0) {
    console.group(" SE ENCONTRARON ERRORES EN LAS RUTAS ");
    errors.forEach((e) => console.error(e.message));
    console.groupEnd();
    return { routes: validatedRoutes, error: errors };
  }

  return { routes: validatedRoutes, error: null };
}
