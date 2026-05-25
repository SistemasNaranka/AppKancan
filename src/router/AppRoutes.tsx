// AppRoutes.tsx
import { useRoutes, RouteObject, Navigate } from "react-router-dom";
import { Suspense, lazy, useMemo, useState, useEffect } from "react";
import Layout from "@/shared/components/layout/Layout";
import Login from "@/auth/pages/Login";
import NotFound from "./pages/NotFound";
import ErrorPage from "./pages/ErrorPage";
import ErrorBoundary from "@/shared/components/ErrorBoundary";
import LoadingSpinner from "@/shared/components/LoadingSpinner";
import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";
import { loadAndValidateRoutes, RouteValidationError } from "./routeValidator";

type LazyLoader = () => Promise<{ default: React.ComponentType<unknown> }>;

// Cache para rutas ya cargadas
const routesCache: Record<string, RouteObject[]> = {};

export default function AppRoutes() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { apps, area, loading: appsLoading, loadingStatus } = useApps();

  const [modulosComplejosFiltrados, setModulosComplejosFiltrados] = useState<
    RouteObject[]
  >([]);
  const [errorEnRutas, setErrorEnRutas] = useState<unknown>(null);

  const isLoading = isAuthenticated && (apps === null || appsLoading);

  // Función para obtener el mensaje de carga según el estado
  const getLoadingMessage = (): string => {
    // Si está cargando autenticación
    if (authLoading) {
      return "Verificando autenticación...";
    }

    // Si no tiene apps asignadas - mostrar el mensaje específico
    if (loadingStatus.status === "no_apps") {
      return loadingStatus.message;
    }

    // Si no tiene área definida - mostrar el mensaje específico
    if (loadingStatus.status === "no_area") {
      return loadingStatus.message;
    }

    // Si está cargando apps (estado inicial)
    if (loadingStatus.status === "loading") {
      return "Cargando aplicación...";
    }

    // Si el área está definida pero no se encontró el componente Home
    // (esto indica un problema de configuración del sistema)
    if (!homeRoute && area) {
      return `El área "${area}" no tiene una página de inicio configurada.`;
    }

    // Si las rutas de módulos aún no están cargadas (estado transitorio)
    if (modulosComplejosFiltrados.length === 0) {
      return "Cargando módulos...";
    }

    return "Cargando aplicación...";
  };

  // ----------------------------
  // Home por área
  // ----------------------------
  const homeRoute = useMemo<RouteObject | null>(() => {
    if (!area) return null;

    const homes = import.meta.glob("@/homes/**/Home.tsx");
    const areaLower = area.toLowerCase();
    const homePath = Object.keys(homes).find((path) =>
      path.toLowerCase().includes(`/homes/${areaLower}/home.tsx`),
    );

    if (!homePath) return null;
    const HomeComponent = lazy(homes[homePath] as LazyLoader);

    // Prefetch para mejorar percepción de carga
    homes[homePath]();

    return {
      path: "home",
      element: (
        <ErrorBoundary>
          <Suspense
            fallback={
              <LoadingSpinner
                message={`Cargando inicio de ${area}...`}
                size="medium"
              />
            }
          >
            <HomeComponent />
          </Suspense>
        </ErrorBoundary>
      ),
    };
  }, [area]);

  // ----------------------------
  // Carga rutas dinámicas de apps
  // ----------------------------
  useEffect(() => {
    if (!isAuthenticated || !apps || isLoading) return;

    const cargarRutas = async () => {
      try {
        const rutasDisponibles = import.meta.glob<{ default: RouteObject[] }>(
          "@/apps/**/routes.tsx",
        );

        // Filtrar apps permitidas
        const modulosPermitidos = Object.entries(rutasDisponibles).filter(
          ([path]) =>
            apps.some((app) => {
              const rutaLimipia = app.ruta
                .toLowerCase()
                .replace(/^\/|\/$/g, ""); // "comisiones"
              return (
                path.toLowerCase().includes(rutaLimipia) &&
                path.toLowerCase().endsWith("routes.tsx")
              );
            }),
        );

        const modulosCargados = await Promise.all(
          modulosPermitidos.map(async ([path, importer]) => {
            if (routesCache[path]) return routesCache[path];
            const module = await importer();
            routesCache[path] = module.default;
            return module.default;
          }),
        );

        // Validación
        const { routes: rutasValidadas, error } = loadAndValidateRoutes(
          Object.fromEntries(
            modulosPermitidos.map(([path], i) => [
              path,
              { default: modulosCargados[i] },
            ]),
          ),
        );

        if (error) {
          setErrorEnRutas(
            new Error(
              error
                .map((e: RouteValidationError) => e.message)
                .join("\n\n" + "-".repeat(80) + "\n\n"),
            ),
          );
        }

        setModulosComplejosFiltrados(rutasValidadas);
      } catch (err) {
        console.error("Error cargando rutas:", err);
        setErrorEnRutas(err);
      }
    };

    cargarRutas();
  }, [isAuthenticated, apps, isLoading]);

  // ----------------------------
  // Configuración de rutas - SIEMPRE LLAMAR useRoutes EN EL MISMO ORDEN
  // ----------------------------
  let routesToUse: RouteObject[];

  if (authLoading) {
    // Durante verificación de autenticación, mostrar solo spinner
    routesToUse = [
      {
        path: "*",
        element: (
          <LoadingSpinner
            message="Verificando autenticación..."
            size="large"
            fullScreen
          />
        ),
      },
    ];
  } else if (!isAuthenticated) {
    // Usuario no autenticado - solo rutas de login
    routesToUse = [
      { path: "/login", element: <Login /> },
      { path: "*", element: <Login /> },
    ];
  } else if (
    isLoading ||
    loadingStatus.status === "no_apps" ||
    loadingStatus.status === "no_area" ||
    modulosComplejosFiltrados.length === 0 ||
    !homeRoute
  ) {
    // Cargando datos de la app o rutas no cargadas - mostrar spinner con mensaje específico
    routesToUse = [
      {
        path: "*",
        element: (
          <LoadingSpinner
            message={getLoadingMessage()}
            size="large"
            fullScreen
          />
        ),
      },
    ];
  } else if (errorEnRutas && import.meta.env.DEV) {
    // Error en desarrollo - mostrar página de error
    routesToUse = [{ path: "*", element: <ErrorPage error={errorEnRutas} /> }];
  } else {
    // Rutas principales de la aplicación autenticada
    routesToUse = [
      {
        path: "/",
        element: (
          <ErrorBoundary>
            <Layout />
          </ErrorBoundary>
        ),
        children: [
          { index: true, element: <Navigate to="home" replace /> },
          ...(homeRoute ? [homeRoute] : []),
          ...modulosComplejosFiltrados.map((mod) => ({
            ...mod,
            element: (
              <Suspense
                fallback={
                  <LoadingSpinner message="Cargando módulo..." size="small" />
                }
              >
                {mod.element}
              </Suspense>
            ),
          })),
        ],
      },
    ];

    // Ruta 404 para rutas no encontradas
    routesToUse.push({
      path: "*",
      element: <NotFound />,
    });

    // Solo agregar ErrorPage en casos muy específicos de error del sistema
    if (errorEnRutas && !isLoading && import.meta.env.DEV) {
      routesToUse.push({
        path: "*",
        element: <ErrorPage error={errorEnRutas} />,
      });
    }
  }

  // Suprimir warnings de React Router durante estados de carga
  const originalWarn = console.warn;
  if (
    authLoading ||
    isLoading ||
    modulosComplejosFiltrados.length === 0 ||
    !homeRoute
  ) {
    console.warn = (...args) => {
      if (!args[0]?.includes?.("No routes matched location")) {
        originalWarn(...args);
      }
    };
  }

  const result = useRoutes(routesToUse);

  // Restaurar console.warn después de renderizar
  if (
    authLoading ||
    isLoading ||
    modulosComplejosFiltrados.length === 0 ||
    !homeRoute
  ) {
    setTimeout(() => {
      console.warn = originalWarn;
    }, 0);
  }

  return result;
}
