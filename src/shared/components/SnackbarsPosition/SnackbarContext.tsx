// Adaptador del snackbar global sobre Sileo (toasts con animación física).
// Conserva la API previa (useGlobalSnackbar / showSnackbar) para no tocar los
// call sites; por dentro enruta a los métodos de Sileo según la severidad.
import { createContext, useContext, useEffect, ReactNode } from 'react';
import { sileo, Toaster } from 'sileo';
import 'sileo/styles.css';
import './sileoOverrides.css';

type Severity = 'success' | 'error' | 'warning' | 'info';

// Color de fondo del toast según el estado (mismo color para todo el toast).
export const SILEO_STATE_FILL: Record<string, string> = {
  success: '#4a9e62',
  error: '#c62828',
  warning: '#b45309',
  info: '#01579b',
  loading: '#8995a5',
  action: '#004680',
};

interface SnackbarContextType {
  showSnackbar: (message: string, severity?: Severity) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const showSnackbar = (message: string, severity: Severity = 'info') => {
    sileo[severity]({ title: message, duration: 4000, fill: SILEO_STATE_FILL[severity] });
  };

  // Cerrar el toast con un click. Sileo solo cierra con swipe y no expone el id
  // en el DOM. Para que no desaparezca de golpe, animamos el toast clickeado
  // deslizándolo hacia abajo (como el swipe) y luego lo limpiamos.
  useEffect(() => {
    let cerrando = false;
    const onClick = (e: MouseEvent) => {
      const toast = (e.target as HTMLElement)?.closest?.('[data-sileo-toast]') as HTMLElement | null;
      if (!toast || cerrando || toast.getAttribute('data-state') === 'loading') return;
      cerrando = true;
      toast.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
      requestAnimationFrame(() => {
        toast.style.transform = 'translateY(60px) scale(0.95)';
        toast.style.opacity = '0';
      });
      window.setTimeout(() => {
        sileo.clear();
        cerrando = false;
      }, 350);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Toaster position="bottom-center" />
    </SnackbarContext.Provider>
  );
};

export const useGlobalSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error('useGlobalSnackbar debe usarse dentro de SnackbarProvider');
  return context;
};
