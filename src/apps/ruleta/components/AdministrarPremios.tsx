import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  Pagination,
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Storefront as StorefrontIcon } from '@mui/icons-material';
import PremioCard from './admin/PremioCard';
import ConfirmarEliminarDialog from './admin/ConfirmarEliminarDialog';
import PremioFormDialog from './admin/PremioFormDialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ISegment, TGrupo, Tienda } from '../interfaces/ruleta.interface';
import { getStores } from '../api/directus/read';
import { getPrizesWithInventory, deactivatePrize } from '../api/directus/write';
import { guardarPremio } from '../services/premiosService';

import { AZUL, AZUL_BG, AZUL_BORDER, esTiendaAutorizada } from '../utils/constantes';
import { normKey, buildPremiosFromData } from '../utils/premios';

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
      <PremioFormDialog
        open={openModal}
        editingPremioId={editingPremioId}
        formLabel={formLabel}
        setFormLabel={setFormLabel}
        formGrupo={formGrupo}
        setFormGrupo={setFormGrupo}
        formCantidadesPorTienda={formCantidadesPorTienda}
        setFormCantidadesPorTienda={setFormCantidadesPorTienda}
        restantesDelPremioEditado={restantesDelPremioEditado}
        tiendas={tiendas}
        saving={saving}
        onClose={handleCloseModal}
        onSave={handleSavePremio}
      />

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