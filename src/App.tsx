import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import "./App.css";
/* import { ReactQueryDevtools } from "@tanstack/react-query-devtools"; */
import { QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./router/AppRoutes";
import { AuthProvider } from "@/auth/hooks/AuthProvider";
import { AppProvider } from "./apps/hooks/AppProvider";
import client from "./services/tankstack/QueryClient";
import { AppThemeProvider } from "@/shared/hooks/ThemeContext";
import { TutorialProvider } from "@/shared/hooks/TutorialContext";
import { SnackbarProvider } from "@/shared/components/SnackbarsPosition/SnackbarContext";
import { ForcePasswordChangeModal } from "@/auth/components/ForcePasswordChangeModal";
import PeekButtonContainer from "@/shared/components/PeekButtonContainer";
import WhatsNewModal from "@/shared/components/WhatsNewModal";
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
      {isAuthenticated && !user?.requires_password_change && <PeekButtonContainer />}
      {isAuthenticated && !user?.requires_password_change && <WhatsNewModal />}
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={client}>
      <AppThemeProvider>
        <SnackbarProvider>
          <BrowserRouter>
            <AuthProvider>
              <AppProvider>
                <TutorialProvider>
                  <AppWithPasswordModal />
                </TutorialProvider>
              </AppProvider>
            </AuthProvider>
          </BrowserRouter>
        </SnackbarProvider>
      </AppThemeProvider>
      {/*       <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}

export default App;