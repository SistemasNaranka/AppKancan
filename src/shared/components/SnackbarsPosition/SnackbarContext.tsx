// src/shared/hooks/SnackbarContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface SnackbarContextType {
  showSnackbar: (message: string, severity?: AlertColor) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const [snack, setSnack] = useState({
    open: false,
    message: '',
    severity: 'info' as AlertColor,
  });

  const showSnackbar = (message: string, severity: AlertColor = 'info') => {
    setSnack({ open: true, message, severity });
  };

  const handleClose = (_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnack((prev) => ({ ...prev, open: false }));
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar 
        open={snack.open} 
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        autoHideDuration={4000}
      >
        <Alert 
          onClose={handleClose} 
          severity={snack.severity} 
          variant="filled" 
          sx={{ width: '100%', maxWidth: 400, borderRadius: 2, 

          // COLORES POR SEVERIDAD — sobrescribe los de MUI:
          '&.MuiAlert-filledSuccess': { backgroundColor: '#2e7d32', color: '#fff' },
          '&.MuiAlert-filledError':   { backgroundColor: '#c62828', color: '#fff' },
          '&.MuiAlert-filledWarning': { backgroundColor: '#e65100', color: '#fff' },
          '&.MuiAlert-filledInfo':    { backgroundColor: '#01579b', color: '#fff' },

          // TIPOGRAFÍA:
          fontSize: '0.95rem',
          fontWeight: 600,
          
          }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export const useGlobalSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error('useGlobalSnackbar debe usarse dentro de SnackbarProvider');
  return context;
};