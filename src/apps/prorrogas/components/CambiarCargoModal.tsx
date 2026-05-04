import React, { useState, useEffect, useMemo } from 'react';
import { useContractContext } from '../contexts/ContractContext';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  MenuItem,
  CircularProgress,
  Stack,
  Chip,
  IconButton,
  Card,
  CardContent,
  Slide,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Contrato, HistorialCargo } from '../types/types';
import { getHistorialCargos } from '../api/read';
import { crearHistorialCargo } from '../api/create';
import { actualizarCargoEnContrato } from '../api/write';
import { formatDate } from '../lib/utils';
import { ROLES_AREAS, getCargoLabel } from '../config/cargos';

interface Props {
  open: boolean;
  onClose: () => void;
  contrato: Contrato;
  onCargoChanged: () => Promise<void>;
}

const Transition = React.forwardRef(function Transition(
  props: any,
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CambiarCargoModal: React.FC<Props> = ({ open, onClose, contrato, onCargoChanged }) => {
  // Use live context to get the most up-to-date cargo after mutations
  const { selectedContrato } = useContractContext();
  const liveContrato = selectedContrato?.id === contrato.id ? selectedContrato : contrato;
  const [historial, setHistorial] = useState<HistorialCargo[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [nuevoCargo, setNuevoCargo] = useState<string>('');
  const [fechaEfectividad, setFechaEfectividad] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchHistory = async (showSpinner = true) => {
    if (showSpinner) setLoadingHistory(true);
    const data = await getHistorialCargos(contrato.id);
    setHistorial(data as HistorialCargo[]);
    if (showSpinner) setLoadingHistory(false);
  };

  useEffect(() => {
    if (open) {
      fetchHistory(true);
      setIsAddingMode(false);
      setNuevoCargo('');
      // Seleccionar automáticamente la fecha actual
      setFechaEfectividad(new Date().toISOString().split('T')[0]);
    }
  }, [open, contrato.id]);

  const handleSave = async () => {
    if (!nuevoCargo || !fechaEfectividad) return;

    const cargoAnterior =
      typeof liveContrato.cargo === 'object' &&
      liveContrato.cargo !== null &&
      'nombre' in liveContrato.cargo
        ? (liveContrato.cargo as any).nombre
        : getCargoLabel(liveContrato.cargo);

    const selectedRole = ROLES_AREAS.find(r => r.nombre === nuevoCargo);
    const nuevaArea = selectedRole ? selectedRole.area : undefined;

    // 1️⃣ Crear registro en historial_cargos
    const success = await (crearHistorialCargo as any)({
      contrato_id: contrato.id,
      cargo_anterior: cargoAnterior || 'Desconocido',
      cargo_nuevo: nuevoCargo,
      fecha_efectividad: fechaEfectividad,
      nueva_area: nuevaArea,
    });

    if (success) {
      // 2️⃣ Actualizar cargo (y área) en la tabla contratos
      // Esto hace que el cambio se refleje en toda la app:
      // el WebSocket del ContractContext detecta el UPDATE y
      // ejecuta UPSERT_CONTRATO, re-renderizando todos los
      // componentes que consumen el contexto.
      await actualizarCargoEnContrato(contrato.id, nuevoCargo, nuevaArea);

      // 3️⃣ Optimizar UI agregando el item localmente sin esperar re-fetch
      setHistorial(prev => [
        {
          id: Date.now(),
          contrato_id: contrato.id,
          cargo_anterior: cargoAnterior,
          cargo_nuevo: nuevoCargo,
          fecha_efectividad: fechaEfectividad,
          date_created: new Date().toISOString(),
        } as HistorialCargo,
        ...prev,
      ]);

      // 4️⃣ Notificar al componente padre para que refresque si es necesario
      await onCargoChanged();
      setIsAddingMode(false);

      // 5️⃣ Sincronizar historial en background sin spinner
      fetchHistory(false);
    }

    setSaving(false);
  };

  const currentCargoName = useMemo(() => {
    const cargo = liveContrato.cargo;
    if (typeof cargo === 'object' && cargo !== null && 'nombre' in cargo) {
      return (cargo as any).nombre;
    }
    return getCargoLabel(cargo);
  }, [liveContrato.cargo]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
            fullWidth
      TransitionComponent={Transition}
      PaperProps={{ 
        sx: { 
          borderRadius: 4, 
          overflow: 'hidden',
          bgcolor: '#f8fafc',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        } 
      }}
    >
      {/* Header Premium */}
      <Box sx={{ bgcolor: '#004680', color: '#fff', p: 3, pb: 4, position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ 
              width: 48, height: 48, borderRadius: 3, 
              bgcolor: 'rgba(255,255,255,0.1)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center' 
            }}>
              <WorkOutlineIcon sx={{ fontSize: 24, color: '#93c5fd' }} />
            </Box>
            <Box>
              <Typography variant="overline" sx={{ color: '#93c5fd', fontWeight: 700, letterSpacing: '0.05em', display: 'block', mb: 0.2, lineHeight: 1 }}>
                Cargo Actual del Empleado
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2, color: "#93c5fd", paddingTop: 1 }}>
                {currentCargoName || 'Sin Cargo'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      
      <DialogContent sx={{ p: 0, overflowY: 'visible' }}>
        <Box sx={{ mt: -2, px: 3, pb: 1, pt: 4, }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', bgcolor: '#fff', border: '1px solid #e2e8f0' }}>
            
            {!isAddingMode ? (
              <Box>
                <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                  <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                    Historial de Movimientos
                      </Typography>
                  <Button 
                    size="small"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => setIsAddingMode(true)}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, color: '#004680', '&:hover': { bgcolor: '#f0f9ff' } }}
                  >
                    Nuevo Cargo
                  </Button>
                </Box>
                
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                  {loadingHistory ? (
                    <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress size={28} sx={{ color: '#004680' }} /></Box>
                  ) : historial.length === 0 ? (
                    <Box sx={{ p: 5, textAlign: 'center' }}>
                      <WorkOutlineIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        Aún no se han registrado cambios de cargo para este empleado.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ p: 3, maxHeight: 320, overflowY: 'auto' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {historial.map((h, i) => {
                          const isLast = i === historial.length - 1;
                          const isLatest = i === 0;
                          return (
                            <Box key={h.id} sx={{ display: 'flex', gap: 2.5 }}>
                              {/* Timeline Track */}
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Box sx={{ 
                                  width: 14, height: 14, borderRadius: '50%', 
                                  bgcolor: isLatest ? '#10b981' : '#cbd5e1', 
                                  border: '3px solid #fff', 
                                  boxShadow: isLatest ? '0 0 0 2px #d1fae5' : '0 0 0 1px #e2e8f0', 
                                  zIndex: 2,
                                  mt: 0.5
                                }} />
                                {!isLast && <Box sx={{ width: 2, flex: 1, bgcolor: '#e2e8f0', my: 0.5, minHeight: 40 }} />}
                              </Box>
                              {/* Timeline Content */}
                              <Box sx={{ pb: isLast ? 1 : 4, pt: 0, flex: 1 }}>
                                <Typography variant="body2" fontWeight={800} color="text.primary">
                                  {getCargoLabel(h.cargo_nuevo)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                  Realizado el <strong>{formatDate(h.fecha_efectividad)}</strong>
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                  <Chip 
                                    label={getCargoLabel(h.cargo_anterior)} 
                                    size="small" 
                                    sx={{ height: 22, fontSize: '0.68rem', bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600 }} 
                                  />
                                  <ArrowForwardIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    <Chip
                                    label={getCargoLabel(h.cargo_nuevo)} 
                      size="small"
                                    sx={{ height: 22, fontSize: '0.68rem', bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 700 }} 
                    />
                                </Stack>
                  </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Box>
            ) : (
              /* MODO AGREGAR NUEVO CARGO */
              <Box>
                <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <Typography variant="subtitle2" fontWeight={800} color="#004680">
                    Configurar Nuevo Cargo
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Selecciona la nueva posición y desde cuándo aplica.
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    select
                    label="Asignar a nueva posición"
                    value={nuevoCargo}
                    onChange={(e) => setNuevoCargo(e.target.value)}
                    fullWidth
                    size="small"
                    disabled={saving}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  >
                    {ROLES_AREAS.map((o) => (
                      <MenuItem key={o.nombre} value={o.nombre} sx={{ fontWeight: 500 }}>
                        {o.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    type="date"
                    label="Fecha de Efectividad"
                    value={fechaEfectividad}
                    onChange={(e) => setFechaEfectividad(e.target.value)}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    disabled={saving}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </CardContent>
              </Box>
            )}
          </Card>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 0, justifyContent: 'center' }}>
        {isAddingMode && (
          <Stack direction="row" spacing={2} width="100%" px={1}>
            <Button 
              fullWidth
              onClick={() => setIsAddingMode(false)} 
              disabled={saving} 
              sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 700, borderRadius: 2 }}
            >
              Volver al historial
            </Button>
            <Button 
              fullWidth
              variant="contained" 
              onClick={handleSave} 
              disabled={saving || !nuevoCargo || !fechaEfectividad}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, boxShadow: 'none', bgcolor: '#004680', '&:hover': { bgcolor: '#003366', boxShadow: 'none' } }}
            >
              {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Confirmar Cambio'}
        </Button>
          </Stack>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CambiarCargoModal;