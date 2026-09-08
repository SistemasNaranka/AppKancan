import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Pagination,
  Paper,
  Tooltip,
  Fade,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  EditNote as EditNoteIcon,
  DeleteForever as DeleteForeverIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { ISegment, TGrupo } from '../interfaces/ruleta.interface';
import { aplicarColorPorGrupo, migrarSegment, GRUPO_COLOR, GRUPO_POR_PREMIO } from '../utils/rangos';

const STORAGE_KEY = 'ruleta_premios';

const descripcionesPorPremio: Record<string, string> = {
  'Jean de línea': 'Jean de línea premium',
  'Jean básico': 'Jean básico clásico',
  'Bonos $100k': 'Bono de $100.000',
  'Bonos $50k': 'Bono de $50.000',
  'Bonos $30k': 'Bono de $30.000',
  'Blusas básicas': 'Blusa básica',
  'Tote bag denim': 'Bolso tote de denim',
  'Tops': 'Top de moda',
  'Pañoletas': 'Pañoleta decorativa',
  'Bambas': 'Bamba exclusiva',
};

const getInicial = (nombre: string): string => {
  if (!nombre) return '?';
  return nombre.trim().charAt(0).toUpperCase();
};

const getIconoDecorativo = (nombre: string) => {
  const lower = nombre.toLowerCase();
  if (lower.includes('jean') || lower.includes('denim')) return '👖';
  if (lower.includes('bono') || lower.includes('$')) return '💰';
  if (lower.includes('blusa')) return '👚';
  if (lower.includes('top')) return '👕';
  if (lower.includes('pañole')) return '🧣';
  if (lower.includes('bamba')) return '👟';
  if (lower.includes('tote')) return '👜';
  return '🎁';
};

const getDescripcion = (nombre: string): string => {
  return descripcionesPorPremio[nombre] || 'Premio exclusivo de KANCAN';
};

const getPremiosFromStorage = (): ISegment[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed.map(migrarSegment);
    } catch {}
  }
  return Object.entries(GRUPO_POR_PREMIO).map(([label, grupo]) =>
    aplicarColorPorGrupo(label, grupo)
  );
};

const savePremiosToStorage = (premios: ISegment[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(premios));
};

// ===== ESTILOS DE TARJETAS MÁS VISIBLES =====
const PremioCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  border: '1px solid #d0d7de', // borde más oscuro
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  width: '100%',
  maxWidth: '340px',
  flex: '1 1 280px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: '#ffffff', // fondo blanco sólido
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    borderColor: '#1976D2',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    opacity: 0.8,
  },
}));

const ColorCircle = styled(Box)<{ color: string }>(({ color }) => ({
  width: 56,
  height: 56,
  borderRadius: '50%',
  backgroundColor: color,
  border: '3px solid #ffffff',
  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: 800,
  fontSize: '1.4rem',
  fontFamily: "'Poppins', sans-serif",
  textShadow: '0 2px 6px rgba(0,0,0,0.25)',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.08)',
  },
}));

const DecoratedBadge = styled(Box)({
  position: 'absolute',
  top: 12,
  right: 12,
  fontSize: '1.4rem',
  opacity: 0.2,
  transform: 'rotate(8deg)',
  pointerEvents: 'none',
});

interface AdministrarPremiosProps {
  onPremiosChange: (premios: ISegment[]) => void;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const AdministrarPremios: React.FC<AdministrarPremiosProps> = ({ onPremiosChange }) => {
  const [premios, setPremios] = useState<ISegment[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formGrupo, setFormGrupo] = useState<TGrupo>('G3');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    const stored = getPremiosFromStorage();
    setPremios(stored);
    onPremiosChange(stored);
  }, []);

  useEffect(() => {
    if (premios.length > 0) {
      savePremiosToStorage(premios);
      onPremiosChange(premios);
    }
  }, [premios]);

  const handleOpenModal = (index?: number) => {
    if (index !== undefined) {
      setEditingIndex(index);
      setFormLabel(premios[index].label);
      setFormGrupo(premios[index].grupo);
    } else {
      setEditingIndex(null);
      setFormLabel('');
      setFormGrupo('G3');
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingIndex(null);
    setFormLabel('');
  };

  const handleSavePremio = () => {
    if (!formLabel.trim()) {
      setSnackbar({ open: true, message: 'El nombre del premio es obligatorio', severity: 'error' });
      return;
    }
    const newPremio: ISegment = aplicarColorPorGrupo(formLabel.trim(), formGrupo);
    let newPremios: ISegment[];
    if (editingIndex !== null) {
      newPremios = [...premios];
      newPremios[editingIndex] = newPremio;
    } else {
      newPremios = [...premios, newPremio];
    }
    setPremios(newPremios);
    setSnackbar({ open: true, message: 'Premio guardado correctamente', severity: 'success' });
    handleCloseModal();
  };

  const handleDeletePremio = (index: number) => {
    if (window.confirm('¿Estás seguro de eliminar este premio?')) {
      const newPremios = premios.filter((_, i) => i !== index);
      setPremios(newPremios);
      setSnackbar({ open: true, message: 'Premio eliminado', severity: 'success' });
    }
  };

  const totalPages = Math.ceil(premios.length / rowsPerPage);
  const displayedPremios = premios.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <Box>
      {/* ===== ENCABEZADO ===== */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1E293B" sx={{ fontFamily: "'Poppins', sans-serif" }}>
            Administrar Premios
          </Typography>
          <Typography variant="body2" color="#94A3B8">
            Gestiona los premios disponibles en la ruleta
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
          sx={{
            bgcolor: '#1976D2',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '12px',
            px: 3,
            py: 1,
            '&:hover': { bgcolor: '#1565C0' },
          }}
        >
          Agregar premio
        </Button>
      </Box>

      {/* ===== CONTENEDOR CON FONDO VISIBLE ===== */}
      <Box
        sx={{
          bgcolor: '#eef2f6',
          borderRadius: '16px',
          p: 3,
          border: '1px solid #d0d7de',
          minHeight: '200px',
        }}
      >
        {premios.length === 0 ? (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: '16px',
              border: '2px dashed #E2E8F0',
              bgcolor: '#F8FAFC',
            }}
          >
            <Typography variant="h6" color="#94A3B8">No hay premios configurados</Typography>
            <Typography variant="body2" color="#94A3B8" sx={{ mt: 1 }}>
              Haz clic en "Agregar premio" para comenzar
            </Typography>
          </Paper>
        ) : (
          <>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                justifyContent: 'flex-start',
              }}
            >
              {displayedPremios.map((premio, index) => {
                const realIndex = (page - 1) * rowsPerPage + index;
                const inicial = getInicial(premio.label);
                const iconoDecorativo = getIconoDecorativo(premio.label);
                const descripcion = getDescripcion(premio.label);
                return (
                  <Fade in timeout={350} key={realIndex}>
                    <PremioCard>
                      <DecoratedBadge>{iconoDecorativo}</DecoratedBadge>
                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 1.5 }}>
                          <ColorCircle color={premio.color}>{inicial}</ColorCircle>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="h6"
                              fontWeight={700}
                              color="#1E293B"
                              sx={{ fontFamily: "'Poppins', sans-serif", lineHeight: 1.2 }}
                            >
                              {premio.label}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="#64748B"
                              sx={{ mt: 0.5, fontSize: '0.8rem' }}
                            >
                              {descripcion}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Typography variant="caption" color="#94A3B8" fontWeight={500}>
                                #{realIndex + 1}
                              </Typography>
                              <Chip
                                label="Activo"
                                size="small"
                                sx={{
                                  bgcolor: '#E8F5E9',
                                  color: '#2E7D32',
                                  fontWeight: 600,
                                  fontSize: '0.6rem',
                                  height: 20,
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                      <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end', gap: 0.5, borderTop: '1px solid #E8EDF2' }}>
                        <Tooltip title="Editar premio">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenModal(realIndex)}
                            sx={{
                              color: '#1976D2',
                              backgroundColor: '#E3F2FD',
                              borderRadius: '50%',
                              p: 0.8,
                              '&:hover': {
                                backgroundColor: '#BBDEFB',
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s',
                            }}
                          >
                            <EditNoteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar premio">
                          <IconButton
                            size="small"
                            onClick={() => handleDeletePremio(realIndex)}
                            sx={{
                              color: '#D32F2F',
                              backgroundColor: '#FFEBEE',
                              borderRadius: '50%',
                              p: 0.8,
                              '&:hover': {
                                backgroundColor: '#FFCDD2',
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s',
                            }}
                          >
                            <DeleteForeverIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </CardActions>
                    </PremioCard>
                  </Fade>
                );
              })}
            </Box>

            {/* ===== PAGINACIÓN ===== */}
            {totalPages > 1 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 3,
                  pt: 2,
                  borderTop: '1px solid #E2E8F0',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Typography variant="body2" color="#64748B" fontWeight={500}>
                  Mostrando {displayedPremios.length} de {premios.length} premios
                </Typography>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                  shape="rounded"
                  size="large"
                  showFirstButton
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      fontWeight: 600,
                      borderRadius: '8px',
                    },
                    '& .Mui-selected': {
                      bgcolor: '#1976D2 !important',
                      color: '#fff',
                    },
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Box>

      {/* ===== MODAL ===== */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          },
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2.5,
            background: 'linear-gradient(135deg, #004680, #003366)',
            color: '#ffffff',
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {editingIndex !== null ? (
              <>
                <EditNoteIcon sx={{ fontSize: 28 }} />
                <Typography variant="h6" fontWeight={700}>
                  Editar premio
                </Typography>
              </>
            ) : (
              <>
                <AddIcon sx={{ fontSize: 28 }} />
                <Typography variant="h6" fontWeight={700}>
                  Agregar nuevo premio
                </Typography>
              </>
            )}
          </Box>
          <IconButton onClick={handleCloseModal} sx={{ color: '#ffffff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#fafbfc' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: '16px',
                bgcolor: '#ffffff',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: GRUPO_COLOR[formGrupo].color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '1.6rem',
                  fontFamily: "'Poppins', sans-serif",
                  textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                }}
              >
                {formLabel ? formLabel.trim().charAt(0).toUpperCase() : '?'}
              </Box>
              <Box>
                <Typography variant="body2" color="#94A3B8" fontWeight={500}>
                  Vista previa
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color="#1E293B"
                  sx={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {formLabel || 'Nombre del premio'}
                </Typography>
                <Typography variant="caption" color="#94A3B8">
                  Rango: <span style={{ fontWeight: 600, color: GRUPO_COLOR[formGrupo].color }}>{GRUPO_COLOR[formGrupo].label}</span>
                </Typography>
              </Box>
            </Box>

            <TextField
              label="Nombre del premio *"
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              fullWidth
              size="medium"
              autoFocus
              placeholder="Ej: Jean de línea"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  bgcolor: '#ffffff',
                  '&:hover fieldset': {
                    borderColor: '#1976D2',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1976D2',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500,
                  color: '#64748B',
                },
              }}
            />

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                gutterBottom
                display="block"
                sx={{ fontWeight: 600, fontSize: '0.8rem' }}
              >
                Selecciona un rango
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  mt: 0.5,
                  p: 1.5,
                  bgcolor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                }}
              >
                {(Object.keys(GRUPO_COLOR) as TGrupo[]).map((g) => {
                  const selected = formGrupo === g;
                  const meta = GRUPO_COLOR[g];
                  return (
                    <Box
                      key={g}
                      onClick={() => setFormGrupo(g)}
                      sx={{
                        flex: 1,
                        cursor: 'pointer',
                        borderRadius: '10px',
                        p: 1.25,
                        border: selected ? `2px solid ${meta.color}` : '2px solid #E2E8F0',
                        bgcolor: selected ? `${meta.color}15` : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        transition: 'all 0.2s ease',
                        '&:hover': { borderColor: meta.color },
                      }}
                    >
                      <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: meta.color, border: '2px solid #ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                      <Box sx={{ lineHeight: 1.2 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#1E293B' }}>{g}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#64748B' }}>{meta.label}</Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1.5, display: 'block', fontStyle: 'italic' }}
              >
                💡 El color se asigna automáticamente según el rango
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2.5,
            px: 3,
            borderTop: '1px solid #E2E8F0',
            bgcolor: '#ffffff',
            gap: 1,
          }}
        >
          <Button
            onClick={handleCloseModal}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              px: 3,
              color: '#64748B',
              '&:hover': {
                bgcolor: '#F1F5F9',
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSavePremio}
            variant="contained"
            disableElevation
            sx={{
              bgcolor: '#004680',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '10px',
              px: 4,
              '&:hover': {
                bgcolor: '#003366',
              },
            }}
          >
            {editingIndex !== null ? 'Actualizar premio' : 'Guardar premio'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdministrarPremios;