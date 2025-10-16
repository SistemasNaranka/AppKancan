import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/hooks/useAuth";

/**
 * Componente simple para páginas no encontradas (404)
 */
export default function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Determinar a dónde redirigir según estado de autenticación
  const returnPath = isAuthenticated ? "/" : "/login";
  const returnLabel = isAuthenticated ? "Volver al Inicio" : "Ir al Login";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center">
        {/* Número 404 */}
        <h1 className="text-9xl font-extrabold text-gray-200 dark:text-gray-700">
          404
        </h1>

        {/* Mensaje */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Página no encontrada
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Lo sentimos, la página que buscas no existe o no tienes acceso a ella.
          </p>
        </div>

        {/* Estado de sesión */}
        {isAuthenticated && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Sesión activa como: <strong>{user?.email}</strong>
          </p>
        )}

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(returnPath)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            {returnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}