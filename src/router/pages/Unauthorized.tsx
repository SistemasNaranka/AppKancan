import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/hooks/useAuth";

/**
 * Página que se muestra cuando el usuario no tiene permisos
 * para acceder a un recurso específico
 */
export default function Unauthorized() {
  const navigate = useNavigate();
  const { user,isAuthenticated, logout } = useAuth();

  const handleGoHome = () => {
    navigate("/");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        {/* Icono de advertencia */}
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Título y mensaje */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Acceso Denegado
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          No tienes los permisos necesarios para acceder a este recurso
        </p>

        {/* Información del usuario */}
        {isAuthenticated && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Sesión actual:
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              {user?.email}
            </p>
          </div>
        )}

        {/* Sugerencias */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            ¿Qué puedes hacer?
          </p>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>• Verifica que tengas los permisos correctos</li>
            <li>• Contacta a un administrador si crees que esto es un error</li>
            <li>• Regresa a la página de inicio</li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div className="space-y-3">
          <button
            onClick={handleGoHome}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Volver al Inicio
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Volver Atrás
          </button>

          <button
            onClick={handleLogout}
            className="w-full px-6 py-3 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors text-sm"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}