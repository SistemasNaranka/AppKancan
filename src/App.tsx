import { BrowserRouter } from "react-router-dom";
import "./App.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import AppRoutes from "./router/AppRoutes";
import { AuthProvider } from "@/auth/hooks/AuthProvider";
import { AppProvider } from "./apps/hooks/AppProvider";
import { client } from "./services/tankstack/QueryClient";
import Apptheme from "./shared/hooks/Apptheme";
import { ThemeProvider } from "@emotion/react";

function App() {
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider theme={Apptheme}>
        <BrowserRouter>
          <AuthProvider>
            <AppProvider>
              <AppRoutes />
            </AppProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;