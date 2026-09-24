import { useState } from 'react';
import { useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { ISegment, TGrupo, Tienda } from '../interfaces/ruleta.interface';
import { deactivatePrize } from '../api/directus/write';
import { guardarPremio } from '../services/premiosService';
import { normKey, buildPremiosFromData } from '../utils/premios';

interface UsePremioFormParams {
  premios: ISegment[];
  prizesData: any;
  tiendas: Tienda[];
  refetchPremios: UseQueryResult['refetch'];
}

export const usePremioForm = ({ premios, prizesData, tiendas, refetchPremios }: UsePremioFormParams) => {
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

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePremio, setDeletePremio] = useState<ISegment | null>(null);

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

  return {
    openModal,
    editingPremioId,
    formLabel,
    setFormLabel,
    formGrupo,
    setFormGrupo,
    formCantidadesPorTienda,
    setFormCantidadesPorTienda,
    restantesDelPremioEditado,
    saving,
    snackbar,
    setSnackbar,
    deleteDialogOpen,
    deletePremio,
    handleOpenModal,
    handleCloseModal,
    handleSavePremio,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    handleConfirmDelete,
  };
};