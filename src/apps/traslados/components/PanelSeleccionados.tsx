import React, { useState } from 'react';
import { Paper, Typography, Box, Divider, Button, Checkbox, Snackbar, Alert } from '@mui/material';
import TrasladoListItem from './TrasladoListItem';
import type { Traslado } from './TrasladoCard';
import FormControlLabel from '@mui/material/FormControlLabel';

interface PanelSeleccionadosProps {
  seleccionados: Traslado[];
  handleAprobarTodosSeleccionados: () => void;
  loading: boolean;
  checkedSeleccionados: number[]; // ✅ nuevo
  setCheckedSeleccionados: React.Dispatch<React.SetStateAction<number[]>>; // ✅ nuevo
  deseleccionarTodosSeleccionados: () => void; // ✅ nuevo
  onDevolverTraslado?: (t: Traslado) => void;
}

const PanelSeleccionados: React.FC<PanelSeleccionadosProps> = ({
  seleccionados,
  handleAprobarTodosSeleccionados,
  loading,
  onDevolverTraslado,
}) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Alternar selección de un traslado
  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  // Seleccionar o deseleccionar todos
  const toggleSelectAll = () => {
    if (selectedIds.length === seleccionados.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(seleccionados.map(t => t.id));
    }
  };

  // Desaprobar solo los seleccionados
  const handleDesaprobarSeleccionados = () => {
    if (selectedIds.length === 0) {
      setSnackbarMessage('Por favor, selecciona los traslados que deseas desaprobar.');
      setSnackbarOpen(true);
      return;
    }

    if (!onDevolverTraslado) return;

    selectedIds.forEach(id => {
      const transferToReturn = seleccionados.find(t => t.id === id);
      if (transferToReturn) {
        onDevolverTraslado(transferToReturn);
      }
    });

    setSelectedIds([]);
  };

  return (  
    <Paper 
      elevation={4} 
      sx={{ 
        p: 3,
        borderRadius: 4,
        minHeight: 500,
        background: 'linear-gradient(135deg, #e0f7fa 0%, #FFF8E1 100%)', 
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.07)',
        border: '1.5px solid #b2dfdb',
        borderColor: 'primary.main'
      }}
    >
      {/* Cabecera con título y checkbox global */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
  <Typography 
    variant="h6" 
    fontWeight={700} 
    color="success.main"
    sx={{ userSelect: 'none' }}
  >
    Traslados Seleccionados para Aprobar
  </Typography>

  <FormControlLabel
    control={
      <Checkbox
        checked={selectedIds.length === seleccionados.length && seleccionados.length > 0}
        indeterminate={selectedIds.length > 0 && selectedIds.length < seleccionados.length}
        onChange={toggleSelectAll}
        size="small"
        sx={{
          background: 'white',
          boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
          border: '1.5px solid #e0e0e0',
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.18s',
          '&:hover': {
            background: '#f3f3f3',
            borderColor: '#757575',
            transform: 'scale(1.1)',
          },
        }}
        color="primary"
      />
    }
    label="Seleccionar todo"
    sx={{
      userSelect: 'none',
      mr: 0,
      '& .MuiFormControlLabel-label': {
        fontSize: '0.875rem',
        color: 'text.secondary',
      },
    }}
  />
</Box>

      {/* Botones de acción */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant="contained"
          color="info"
          size="small"
          onClick={handleDesaprobarSeleccionados}
          disabled={seleccionados.length === 0 || loading}
        >
          Desaprobar  
        </Button>

        <Button
          variant="contained"
          size="small"
          color="success"
          onClick={handleAprobarTodosSeleccionados}
          disabled={seleccionados.length === 0 || loading}
        >
          Aprobar 
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Lista de traslados */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
        gap: 2,
        overflowX: 'hidden',
        pr: 1,
        boxSizing: 'border-box',
        alignItems: 'start',
        userSelect: 'none',
      }}>
        {seleccionados.length === 0 ? (
          <Typography color="text.secondary">
            No hay traslados seleccionados.
          </Typography>
        ) : (
          seleccionados.map((t) => (
            <Box key={t.id} sx={{ pb: 1, position: 'relative' }}>
              <TrasladoListItem
                traslado={t}
                compact
                estado="embarque"
                onTrasladoClick={() => {
                  // Animación visual al hacer clic
                  const el = document.getElementById(`traslado-card-${t.id}`);
                  if (el) {
                    el.style.transition = 'box-shadow 0.2s, transform 0.2s';
                    el.style.boxShadow = '0 8px 32px 0 rgba(38,198,218,0.18)';
                    el.style.transform = 'scale(1.04)';
                    setTimeout(() => {
                      el.style.boxShadow = '';
                      el.style.transform = '';
                    }, 220);
                  }

                  // Alternar selección
                  toggleSelect(t.id);
                }}
              />

              {/* Checkbox visual (no interactivo) */}
              <Checkbox
                checked={selectedIds.includes(t.id)}
                onChange={() => toggleSelect(t.id)} 
                size="small"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 3,
                  background: 'white',
                  boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                  border: '1.5px solid #e0e0e0',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.18s',
                  '&:hover': {
                    background: '#f3f3f3',
                    borderColor: '#757575',
                    transform: 'scale(1.1)',
                  },
                }}
                color="primary"
              />
            </Box>
          ))
        )}
      </Box>

      {/* Snackbar para mensajes de validación */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="warning" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default PanelSeleccionados;