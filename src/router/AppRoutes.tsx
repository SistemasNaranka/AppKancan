import { useRoutes, Navigate, RouteObject } from "react-router-dom";
import { Suspense, lazy, useMemo } from "react";
import Layout from "@/shared/components/layout/Layout";
import Login from "@/auth/pages/Login";
import NotFound from "./pages/NotFound";
import ErrorPage from "./pages/ErrorPage";
import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";
import { loadAndValidateRoutes } from "./routeValidator";
import { useState, useEffect } from "react";

type LazyLoader = () => Promise<{ default: React.ComponentType<unknown> }>;

export default function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const { apps, area, loading: appsLoading } = useApps();

  const [modulosComplejosFiltrados, setModulosComplejosFiltrados] = useState<RouteObject[]>([]);
  const [errorEnRutas, setErrorEnRutas] = useState<unknown>(null);

  const isLoading = isAuthenticated && (apps === null || appsLoading);

  // ✅ Hook siempre en el mismo orden
  const homeRoute = useMemo<RouteObject | null>(() => {
    if (!area) return null;

    const homes = import.meta.glob("@/homes/**/Home.tsx");
    const areaLower = area.toLowerCase();
    const homePath = Object.keys(homes).find((path) =>
      path.toLowerCase().includes(`/homes/${areaLower}/home.tsx`)
    );

    if (!homePath) return null;
    const HomeComponent = lazy(homes[homePath] as LazyLoader);

    return {
      path: "/home",
      element: (
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando inicio de {area}...</p>
              </div>
            </div>
          }
        >
          <HomeComponent />
        </Suspense>
      ),
    };
  }, [area]);

  // 🔄 Importación dinámica (lazy)
    useEffect(() => {
      if (!isAuthenticated || !apps || isLoading) return;

      const cargarRutas = async () => {
        try {
          const rutasDisponibles = import.meta.glob<{ default: RouteObject[] }>(
            "@/apps/**/routes.tsx"
          );

          // Solo carga las apps permitidas
          const modulosPermitidos = Object.entries(rutasDisponibles).filter(([path]) =>
            apps.some((app) =>
              path.toLowerCase().includes(`/apps${app.ruta.toLowerCase()}/routes.tsx`)
            )
          );
          
          // Importar dinámicamente solo esas rutas
          const modulosCargados = await Promise.all(
            modulosPermitidos.map(([, importer]) => importer())
          );

          // Validar las rutas cargadas
          const { routes: rutasValidadas, error } = loadAndValidateRoutes(
            Object.fromEntries(
              modulosPermitidos.map(([path], i) => [path, modulosCargados[i]])
            )
          );

          if (error) {
            setErrorEnRutas(
              new Error(
                error.map((e) => e.message).join("\n\n" + "-".repeat(80) + "\n\n")
              )
            );
          }

          setModulosComplejosFiltrados(rutasValidadas);
        } catch (error) {
          console.error("Error cargando rutas:", error);
          setErrorEnRutas(error);
        }
      };

      cargarRutas();
    }, [isAuthenticated, apps, isLoading]);

  let routes: RouteObject[] = [];

  if (!isAuthenticated) {
    routes = [
      { path: "/login", element: <Login /> },
      { path: "*", element: <Navigate to="/login" replace /> },
    ];
  } else if (isLoading) {
    routes = [
      {
        path: "*",
        element: (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando aplicación...</p>
            </div>
          </div>
        ),
      },
    ];
  } else {

    if (errorEnRutas && import.meta.env.DEV) {
      routes = [{ path: "*", element: <ErrorPage error={errorEnRutas} /> }];
    } else {
      routes = [
        {
          path: "/login",
          element: <Navigate to="/" replace />,
        },
        {
          path: "/",
          element: <Layout />,
          children: [
            ...(homeRoute ? [homeRoute] : []),
            ...modulosComplejosFiltrados,
            {
              index: true,
              element: homeRoute ? (
                <Navigate to="/home" replace />
              ) : (
                <div className="p-8">
                  <h2 className="text-3xl font-bold mb-4">Bienvenido 👋</h2>
                  <p className="text-gray-600">
                    No hay home personalizado configurado
                  </p>
                </div>
              ),
            },
          ],
        },
        { path: "*", element: <NotFound /> },
      ];
    }
  }

  const element = useRoutes(routes);
  return element;
}
