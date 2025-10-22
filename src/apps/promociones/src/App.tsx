import { Toaster } from "@resoluciones/components/ui/toaster";
import { Toaster as Sonner } from "@resoluciones/components/ui/sonner";
import { TooltipProvider } from "@resoluciones/components/ui/tooltip";
import { StoresModalProvider } from "./hooks/storesModalContext";
import Index from "./pages/Index";
import "./index.css";  // ← IMPORTANTE: Importar los estilos

const App = () => (
  <StoresModalProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {/* Renderizamos directamente el componente Index sin router */}
          <Index />
        </TooltipProvider>
    </StoresModalProvider>
);

export default App;