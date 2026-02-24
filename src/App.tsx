// src/App.tsx
import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import "./App.css";
import { QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./router/AppRoutes";
import { AuthProvider } from "@/auth/hooks/AuthProvider";
import { AppProvider } from "./apps/hooks/AppProvider";
import client from "./services/tankstack/QueryClient";
import { AppThemeProvider } from "@/shared/hooks/ThemeContext";
import { SnackbarProvider } from "@/shared/components/SnackbarsPosition/SnackbarContext"; // Nuevo import
import { ForcePasswordChangeModal } from "@/auth/components/ForcePasswordChangeModal";
import { useAuth } from "@/auth/hooks/useAuth";

const AppWithPasswordModal = () => {
  const { user, isAuthenticated } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.requires_password_change) {
      setModalOpen(true);
    } else {
      setModalOpen(false);
    }
  }, [isAuthenticated, user]);

  return (
    <>
      <AppRoutes />
      <ForcePasswordChangeModal open={modalOpen} onClose={() => {}} />
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={client}>
      <AppThemeProvider>
        <SnackbarProvider> {/* Envoltura necesaria para la función global */}
          <BrowserRouter>
            <AuthProvider>
              <AppProvider>
                <AppWithPasswordModal />
              </AppProvider>
            </AuthProvider>
          </BrowserRouter>
        </SnackbarProvider>
      </AppThemeProvider>
    </QueryClientProvider>
  );
}

export default App;