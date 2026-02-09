import { BrowserRouter } from "react-router-dom";
import "./App.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import AppRoutes from "./router/AppRoutes";
import { AuthProvider } from "@/auth/hooks/AuthProvider";
import { AppProvider } from "./apps/hooks/AppProvider";
import client from "./services/tankstack/QueryClient";
import { AppThemeProvider } from "@/shared/hooks/ThemeContext";
import { ForcePasswordChangeModal } from "@/auth/components/ForcePasswordChangeModal";
import { useAuth } from "@/auth/hooks/useAuth";

// Componente que usa el modal de cambio de contraseña
const AppWithPasswordModal = () => {
  const { user, isAuthenticated } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Mostrar modal solo si el usuario está autenticado y requiere cambio de contraseña
    if (isAuthenticated && user?.requires_password_change) {
      setModalOpen(true);
    } else {
      setModalOpen(false);
    }
  }, [isAuthenticated, user]);

  return (
    <>
      <AppRoutes />
      <ForcePasswordChangeModal
        open={modalOpen}
        onClose={() => {
          // No permitir cerrar el modal sin cambiar la contraseña
        }}
      />
    </>
  );
};

import { useState, useEffect } from "react";

function App() {
  return (
    <QueryClientProvider client={client}>
      <AppThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppProvider>
              <AppWithPasswordModal />
            </AppProvider>
          </AuthProvider>
        </BrowserRouter>
      </AppThemeProvider>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}

export default App;
