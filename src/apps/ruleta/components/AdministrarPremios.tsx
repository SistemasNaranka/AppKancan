import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
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
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  EditNote as EditNoteIcon,
  Close as CloseIcon,
  Inventory2 as InventoryIcon,
  Storefront as StorefrontIcon,
} from '@mui/icons-material';
import PremioCard from './admin/PremioCard';
import ConfirmarEliminarDialog from './admin/ConfirmarEliminarDialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ISegment, TGrupo, Tienda } from '../interfaces/ruleta.interface';
import { GRUPO_COLOR } from '../utils/rangos';
import { getStores } from '../api/directus/read';
import { getPrizesWithInventory, deactivatePrize } from '../api/directus/write';
import { guardarPremio } from '../services/premiosService';

import { AZUL, AZUL_BG, AZUL_BORDER, esTiendaAutorizada } from '../utils/constantes';
import { normKey, buildPremiosFromData, estiloRestante } from '../utils/premios';

// ============================================================
// PROPS
// ============================================================
interface SelectedStore {
  id: number | null;
  name: string;
  ultra_code?: string | number;
}

interface AdministrarPremiosProps {
  onPremiosChange: (premios: ISegment[]) => void;
  selectedStore?: SelectedStore | null;
}

// ============================================================
// COMPONENTE
// ============================================================
const AdministrarPremios: React.FC<AdministrarPremiosProps> = ({
  onPremiosChange,
  selectedStore,
}) => {
  const queryClient = useQueryClient();

  const [openModal, setOpenModal] = useState(false);
  const [editingPremioId, setEditingPremioId] = useState<number | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formGrupo, setFormGrupo] = useState<TGrupo>('G3');
  const [formCantidadesPorTienda, setFormCantidadesPorTienda] = useState<Record<string, string>>({});
  const [restantesDelPremioEditado, setRestantesDelPremioEditado] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [page, setPage] = useState(1);
  const rowsPerPage = 12;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePremio, setDeletePremio] = useState<ISegment | null>(null);

  // 🏪 Tiendas
  const { data: tiendasCompletas = [] } = useQuery<Tienda[]>({
    queryKey: ['adminTiendas'],
    queryFn: getStores,
    staleTime: 30 * 60 * 1000,
  });

  const tiendas = useMemo(() => {
    return tiendasCompletas.filter((t) => esTiendaAutorizada(t.name));
  }, [tiendasCompletas]);

  // 🎁 Premios + inventario
  const {
    data: prizesData,
    isLoading: loadingPremios,
    isError: errorPremios,
    refetch: refetchPremios,
  } = useQuery({
    queryKey: ['ruletaPrizesInventory'],
    queryFn: getPrizesWithInventory,
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000,
  });

  const premios: ISegment[] = useMemo(() => {
    return buildPremiosFromData(prizesData);
  }, [prizesData]);

  useEffect(() => {
    onPremiosChange(premios);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [premios]);

  // ============================================================
  // 🔎 FILTRO POR TIENDA
  // ============================================================
  const storeFilterKey = useMemo(() => {
    if (!selectedStore || selectedStore.id == null) return null;
    return selectedStore.ultra_code != null
      ? normKey(selectedStore.ultra_code)
      : null;
  }, [selectedStore]);

  const premiosFiltrados = useMemo(() => {
    if (!storeFilterKey) return premios;
    return premios.filter((p) => {
      const cant = p.cantidadesPorTienda?.[storeFilterKey];
      return cant !== undefined && cant > 0;
    });
  }, [premios, storeFilterKey]);

  useEffect(() => {
    setPage(1);
  }, [storeFilterKey]);

  // ============================================================
  // MANEJADORES DEL MODAL
  // ============================================================
  const handleOpenModal = async (premio?: ISegment) => {
    let premiosFrescos: ISegment[] = premios;
    try {
      const fresh = await refetchPremios();
      const built = buildPremiosFromData(fresh.data);
      if (built.length > 0) premiosFrescos = built;
    } catch (e) {
      console.warn('No se pudo refrescar, usando caché:', e);
    }

    if (premio?.id != null) {
      const p = premiosFrescos.find((x) => x.id === premio.id) ?? premio;
      setEditingPremioId(p.id as number);
      setFormLabel(p.label ?? '');
      setFormGrupo((p.grupo as TGrupo) ?? 'G3');
      setFormCantidadesPorTienda(
        p.cantidadesPorTienda
          ? Object.fromEntries(
              Object.entries(p.cantidadesPorTienda).map(([k, v]) => [
                normKey(k),
                String(v ?? ''),
              ])
            )
          : {}
      );
      setRestantesDelPremioEditado(p.restantesPorTienda ?? {});
    } else {
      setEditingPremioId(null);
      setFormLabel('');
      setFormGrupo('G3');
      setFormCantidadesPorTienda({});
      setRestantesDelPremioEditado({});
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setOpenModal(false);
    setEditingPremioId(null);
    setFormLabel('');
    setFormCantidadesPorTienda({});
    setRestantesDelPremioEditado({});
  };

  const handleSavePremio = async () => {
    if (!formLabel.trim()) {
      setSnackbar({
        open: true,
        message: 'El nombre del premio es obligatorio',
        severity: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      await guardarPremio({
        prizeId: editingPremioId,
        nombre: formLabel,
        grupo: formGrupo,
        cantidadesPorTienda: formCantidadesPorTienda,
        tiendas,
        inventarioActual: prizesData?.inventory ?? [],
      });

      await queryClient.invalidateQueries({ queryKey: ['ruletaPrizesInventory'] });
      await refetchPremios();

      setSnackbar({
        open: true,
        message: 'Premio guardado correctamente',
        severity: 'success',
      });
      setOpenModal(false);
      setEditingPremioId(null);
      setFormLabel('');
      setFormCantidadesPorTienda({});
      setRestantesDelPremioEditado({});
    } catch (error) {
      console.error('❌ Error al guardar premio:', error);
      setSnackbar({
        open: true,
        message: 'No se pudo guardar el premio. Intenta de nuevo.',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteDialog = (premio: ISegment) => {
    setDeletePremio(premio);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (saving) return;
    setDeleteDialogOpen(false);
    setDeletePremio(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletePremio?.id) return;

    setSaving(true);
    try {
      await deactivatePrize(deletePremio.id);
      await queryClient.invalidateQueries({ queryKey: ['ruletaPrizesInventory'] });
      setSnackbar({
        open: true,
        message: 'Premio eliminado correctamente',
        severity: 'success',
      });
      setDeleteDialogOpen(false);
      setDeletePremio(null);
    } catch (error) {
      console.error('❌ Error al eliminar premio:', error);
      setSnackbar({
        open: true,
        message: 'No se pudo eliminar el premio. Intenta de nuevo.',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(premiosFiltrados.length / rowsPerPage);
  const displayedPremios = premiosFiltrados.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <Box>
      {/* ENCABEZADO */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1E293B" sx={{ fontFamily: "'Poppins', sans-serif" }}>
            Gestor de Premios
          </Typography>
          <Typography variant="body2" color="#94A3B8">
            {storeFilterKey
              ? `Filtrando por: ${selectedStore?.name ?? 'tienda'}`
              : 'Gestiona los premios y su stock disponible'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
          sx={{
            bgcolor: AZUL,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '12px',
            px: 3,
            py: 1,
            '&:hover': { bgcolor: '#003366' },
          }}
        >
          Agregar premio
        </Button>
      </Box>

      {/* BANNER FILTRO */}
      {storeFilterKey && (
        <Paper
          elevation={0}
          sx={{
            mb: 2, p: 1.5, px: 2, borderRadius: '12px',
            bgcolor: AZUL_BG, border: `1px solid ${AZUL_BORDER}`,
            display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap',
          }}
        >
          <StorefrontIcon sx={{ color: AZUL, fontSize: 20 }} />
          <Typography sx={{ fontSize: '0.85rem', color: AZUL, fontWeight: 700 }}>
            Mostrando solo premios con stock en:
          </Typography>
          <Chip
            label={selectedStore?.name}
            size="small"
            sx={{ bgcolor: AZUL, color: '#fff', fontWeight: 700, fontSize: '0.72rem', borderRadius: '8px' }}
          />
          <Typography sx={{ fontSize: '0.75rem', color: '#475569', ml: 'auto' }}>
            {premiosFiltrados.length} de {premios.length} premios
          </Typography>
        </Paper>
      )}

      {/* CONTENEDOR PREMIOS */}
      <Box sx={{ bgcolor: '#eef2f6', borderRadius: '16px', p: 2, border: '1px solid #d0d7de', minHeight: '200px' }}>
        {loadingPremios ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '2px dashed #E2E8F0', bgcolor: '#F8FAFC' }}>
            <CircularProgress size={28} sx={{ color: AZUL, mb: 1.5 }} />
            <Typography variant="h6" color="#94A3B8">Cargando premios...</Typography>
          </Paper>
        ) : errorPremios ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '2px dashed #FFCDD2', bgcolor: '#FFF5F5' }}>
            <Typography variant="h6" color="#D32F2F">No se pudieron cargar los premios</Typography>
            <Button variant="outlined" onClick={() => refetchPremios()} sx={{ textTransform: 'none', mt: 2 }}>
              Reintentar
            </Button>
          </Paper>
        ) : premiosFiltrados.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '2px dashed #E2E8F0', bgcolor: '#F8FAFC' }}>
            <Typography variant="h6" color="#94A3B8">
              {storeFilterKey ? `No hay premios con stock en ${selectedStore?.name}` : 'No hay premios configurados'}
            </Typography>
          </Paper>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start' }}>
              {displayedPremios.map((premio, index) => (
                <PremioCard
                  key={premio.id ?? (page - 1) * rowsPerPage + index}
                  premio={premio}
                  storeFilterKey={storeFilterKey}      
                  selectedStoreName={selectedStore?.name}
                  tiendas={tiendas}
                  onEdit={handleOpenModal}
                  onDelete={handleOpenDeleteDialog}
                />
              ))}
            </Box>

            {totalPages > 1 && (
              <Box sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                mt: 3, pt: 2, borderTop: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 1,
              }}>
                <Typography variant="body2" color="#64748B" fontWeight={500}>
                  Mostrando {displayedPremios.length} de {premiosFiltrados.length} premios
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
                    '& .MuiPaginationItem-root': { fontWeight: 600, borderRadius: '8px' },
                    '& .Mui-selected': { bgcolor: `${AZUL} !important`, color: '#fff' },
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Box>

      {/* ===== MODAL CREAR/EDITAR ===== */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' } }}
      >
        <DialogTitle sx={{
          m: 0, p: 2.5,
          background: `linear-gradient(135deg, ${AZUL}, #003366)`,
          color: '#ffffff', fontWeight: 700,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {editingPremioId != null ? (
              <>
                <EditNoteIcon sx={{ fontSize: 28 }} />
                <Typography variant="h6" fontWeight={700}>Editar premio</Typography>
              </>
            ) : (
              <>
                <AddIcon sx={{ fontSize: 28 }} />
                <Typography variant="h6" fontWeight={700}>Agregar nuevo premio</Typography>
              </>
            )}
          </Box>
          <IconButton onClick={handleCloseModal} sx={{ color: '#ffffff' }} disabled={saving}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#fafbfc' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            {/* VISTA PREVIA */}
            <Box sx={{
              p: 2.5, borderRadius: '16px', bgcolor: '#ffffff',
              border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 2.5,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <Box sx={{
                width: 64, height: 64, borderRadius: '50%',
                bgcolor: GRUPO_COLOR[formGrupo].color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ffffff', fontWeight: 800, fontSize: '1.6rem',
                fontFamily: "'Poppins', sans-serif", textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'all 0.3s ease',
              }}>
                {formLabel ? formLabel.trim().charAt(0).toUpperCase() : '?'}
              </Box>
              <Box>
                <Typography variant="body2" color="#94A3B8" fontWeight={500}>Vista previa</Typography>
                <Typography variant="h6" fontWeight={700} color="#1E293B" sx={{ fontFamily: "'Poppins', sans-serif" }}>
                  {formLabel || 'Nombre del premio'}
                </Typography>
                <Typography variant="caption" color="#94A3B8">
                  Rango: <span style={{ fontWeight: 600, color: GRUPO_COLOR[formGrupo].color }}>
                    {GRUPO_COLOR[formGrupo].label}
                  </span>
                </Typography>
              </Box>
            </Box>

            {/* NOMBRE */}
            <TextField
              label="Nombre del premio *"
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              fullWidth
              size="medium"
              autoFocus
              placeholder="Ej: Jean de línea"
              required
              disabled={saving}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px', bgcolor: '#ffffff',
                  '&:hover fieldset': { borderColor: AZUL },
                  '&.Mui-focused fieldset': { borderColor: AZUL, borderWidth: '2px' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: AZUL },
              }}
            />

            {/* RANGO */}
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, fontSize: '0.8rem', mb: 0.5 }}>
                Selecciona un rango
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5, p: 1.5, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                {(Object.keys(GRUPO_COLOR) as TGrupo[]).map((g) => {
                  const selected = formGrupo === g;
                  const meta = GRUPO_COLOR[g];
                  return (
                    <Box
                      key={g}
                      onClick={() => !saving && setFormGrupo(g)}
                      sx={{
                        flex: 1, cursor: saving ? 'default' : 'pointer',
                        opacity: saving ? 0.6 : 1, borderRadius: '10px', p: 1.25,
                        border: selected ? `2px solid ${meta.color}` : '2px solid #E2E8F0',
                        bgcolor: selected ? `${meta.color}15` : '#ffffff',
                        display: 'flex', alignItems: 'center', gap: 1.25,
                        transition: 'all 0.2s ease',
                        '&:hover': { borderColor: saving ? undefined : meta.color },
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
            </Box>

            {/* CANTIDAD / STOCK */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: '10px',
                  background: `linear-gradient(135deg, ${AZUL}, #003366)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, boxShadow: `0 4px 10px -2px ${AZUL}66`,
                }}>
                  <InventoryIcon sx={{ fontSize: 18, color: '#fff' }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: AZUL, lineHeight: 1.15, fontFamily: "'Poppins', sans-serif" }}>
                    Stock por tienda
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500, lineHeight: 1.3 }}>
                    Total asignado · El chip muestra el disponible real
                  </Typography>
                </Box>
              </Box>

              <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#fff', borderRadius: '14px', border: `1px solid ${AZUL_BORDER}` }}>
                <Box sx={{
                  display: 'flex', flexDirection: 'column', gap: 0.75,
                  maxHeight: 320, overflowY: 'auto', pr: 0.5,
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: AZUL_BORDER, borderRadius: 3 },
                }}>
                  {tiendas.length === 0 ? (
                    <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                      Cargando tiendas...
                    </Typography>
                  ) : (
                    tiendas.map((t, index) => {
                      const storeKey = normKey(t.ultra_code);
                      const restante = restantesDelPremioEditado[storeKey];
                      const colorRestante =
                        restante === undefined ? '#94A3B8' : estiloRestante(restante).color;

                      return (
                        <Box
                          key={t.id}
                          sx={{
                            display: 'flex', alignItems: 'center', gap: 1.5,
                            bgcolor: index % 2 === 0 ? '#F8FAFC' : '#ffffff',
                            borderRadius: '10px', px: 1.25, py: 0.75,
                            border: '1px solid #E8EEF4', transition: 'all 0.15s ease',
                            '&:hover': { bgcolor: AZUL_BG, borderColor: AZUL_BORDER },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                            <StorefrontIcon sx={{ fontSize: 16, color: '#94A3B8', flexShrink: 0 }} />
                            <Typography sx={{
                              fontSize: '0.8rem', fontWeight: 600, color: '#1E293B',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {t.name}
                            </Typography>
                          </Box>

                          <TextField
                            type="number"
                            size="small"
                            value={formCantidadesPorTienda[storeKey] ?? ''}
                            onChange={(e) =>
                              setFormCantidadesPorTienda((prev) => ({
                                ...prev, [storeKey]: e.target.value,
                              }))
                            }
                            placeholder="0"
                            disabled={saving}
                            inputProps={{ min: 0 }}
                            sx={{
                              width: 68,
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '8px', bgcolor: '#fff',
                                fontSize: '0.85rem', fontWeight: 700,
                                '& input': { textAlign: 'center', padding: '6px 8px', color: AZUL },
                                '& fieldset': { borderColor: AZUL_BORDER },
                                '&:hover fieldset': { borderColor: AZUL },
                                '&.Mui-focused fieldset': { borderColor: AZUL, borderWidth: '2px' },
                              },
                            }}
                          />

                          {restante !== undefined && (
                            <Tooltip title="Disponible en Directus">
                              <Typography sx={{
                                fontSize: '0.7rem', fontWeight: 800,
                                color: colorRestante, bgcolor: `${colorRestante}18`,
                                border: `1px solid ${colorRestante}40`,
                                px: 0.85, py: 0.4, borderRadius: '6px',
                                whiteSpace: 'nowrap', minWidth: 38, textAlign: 'center',
                              }}>
                                {restante}
                              </Typography>
                            </Tooltip>
                          )}
                        </Box>
                      );
                    })
                  )}
                </Box>
              </Paper>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, px: 3, borderTop: '1px solid #E2E8F0', bgcolor: '#ffffff', gap: 1 }}>
          <Button
            onClick={handleCloseModal}
            disabled={saving}
            sx={{
              textTransform: 'none', borderRadius: '10px', fontWeight: 600,
              px: 3, color: '#64748B', '&:hover': { bgcolor: '#F1F5F9' },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSavePremio}
            variant="contained"
            disableElevation
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
            sx={{
              bgcolor: AZUL, textTransform: 'none', fontWeight: 700,
              borderRadius: '10px', px: 4, '&:hover': { bgcolor: '#003366' },
            }}
          >
            {saving ? 'Guardando...' : editingPremioId != null ? 'Actualizar premio' : 'Guardar premio'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL ELIMINAR */}
      <ConfirmarEliminarDialog
        open={deleteDialogOpen}
        premioLabel={deletePremio?.label ?? ''}
        saving={saving}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ borderRadius: '12px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdministrarPremios;