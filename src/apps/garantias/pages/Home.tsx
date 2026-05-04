import React, { useState } from "react";
import {
  Box,
  Typography,
  Fab,
  Grid,
  Card,
  CardContent,
  Stack,
  Button,
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckIcon from '@mui/icons-material/Check';
import PendingIcon from '@mui/icons-material/Pending';
import EngineeringIcon from '@mui/icons-material/Engineering';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { useGlobalSnackbar } from "@/shared/components/SnackbarsPosition/SnackbarContext";

import { GarantiaStatsCards } from "../components/GarantiaStatsCards";
import { GarantiaTable } from "../components/GarantiaTable";
import { GarantiaForm } from "../components/GarantiaForm";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { GarantiaDetail } from "../components/GarantiaDetail";

import {
  useGarantias,
  useGarantiaStats,
  useCrearGarantia,
  useActualizarGarantia,
  useEliminarGarantia,
} from "../hooks/useGarantias";

// ── Types ────────────────────────────────────────────────────────────────────
interface GarantiaFilters {
  estado?: string[];
  tipo_garantia?: string[];
  fecha_inicio?: string;
  fecha_fin?: string;
  search?: string;
  tienda_id?: number;
}

interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
}

interface DirectusGarantia {
  id: number;
  cliente_nombre: string;
  cliente_documento: string;
  cliente_telefono: string;
  cliente_email?: string;
  cliente_direccion?: string;
  producto_nombre: string;
  producto_referencia: string;
  producto_sku?: string;
  producto_tienda_id?: number;
  producto_tienda_nombre?: string;
  numero_factura?: string;
  fecha_compra?: string;
  valor_compra?: number;
  tipo_garantia: string;
  descripcion_problema: string;
  fecha_solicitud: string;
  fecha_vence_garantia?: string;
  estado: string;
  nota_interna?: string;
  resolucion?: string;
  fecha_resolucion?: string;
}

interface CreateGarantia {
  cliente_nombre: string;
  cliente_documento: string;
  cliente_telefono: string;
  cliente_email?: string;
  cliente_direccion?: string;
  producto_nombre: string;
  producto_referencia: string;
  producto_sku?: string;
  numero_factura?: string;
  fecha_compra?: string;
  valor_compra?: number;
  tipo_garantia: string;
  descripcion_problema: string;
  fecha_solicitud: string;
  fecha_vence_garantia?: string;
  estado: string;
}

interface UpdateGarantia {
  [key: string]: string | number | undefined;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_PAGE = 0;
const DEFAULT_LIMIT = 10;

const PRIMARY = "#001e40";
const SURFACE_LOW = "#f3f4f5";
const SURFACE_HIGH = "#e7e8e9";
const OUTLINE_VARIANT = "#c3c6d1";

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { label: "Resumen",      icon: <DashboardIcon fontSize="small" />,      estadoFilter: undefined },
  { label: "Pendientes",   icon: <PendingActionsIcon fontSize="small" />,  estadoFilter: "pendiente" },
  { label: "En Revisión",  icon: <FindInPageIcon fontSize="small" />,      estadoFilter: "en_revision" },
  { label: "Aprobadas",    icon: <CheckCircleIcon fontSize="small" />,     estadoFilter: "aprobada" },
  { label: "Rechazadas",   icon: <CancelIcon fontSize="small" />,          estadoFilter: "rechazada" },
  { label: "Completadas",  icon: <TaskAltIcon fontSize="small" />,         estadoFilter: "completada" },
];

// ── Flow steps ────────────────────────────────────────────────────────────────
const FLOW_STEPS = [
  { label: "Recibido",   icon: <CheckIcon fontSize="small" />,        active: true,  current: false },
  { label: "Validación", icon: <PendingIcon fontSize="small" />,       active: true,  current: true  },
  { label: "Taller",     icon: <EngineeringIcon fontSize="small" />,   active: false, current: false },
  { label: "Envío",      icon: <LocalShippingIcon fontSize="small" />, active: false, current: false },
];

// ═════════════════════════════════════════════════════════════════════════════
export default function Home() {
  const { showSnackbar } = useGlobalSnackbar();

  // ── Filter & pagination state ──────────────────────────────────────────────
  const [filters, setFilters] = useState<GarantiaFilters>({});
  const [pagination, setPagination] = useState<PaginationParams>({
    page: DEFAULT_PAGE,
    limit: DEFAULT_LIMIT,
  });

  // ── Modal state ────────────────────────────────────────────────────────────
  const [formModalOpen, setFormModalOpen]     = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedGarantia, setSelectedGarantia] = useState<DirectusGarantia | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // ── Active tab state ───────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(0);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: garantiasData, isLoading: isLoadingGarantias } = useGarantias(filters, pagination);
  const { data: stats, isLoading: isLoadingStats } = useGarantiaStats(filters);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const crearGarantia      = useCrearGarantia();
  const actualizarGarantia = useActualizarGarantia();
  const eliminarGarantia   = useEliminarGarantia();

  // ── Handlers ──────────────────────────────────────────────────────────────

  // Debe ir ANTES de handleTabChange porque este la llama
  const handleFiltersChange = (newFilters: Partial<GarantiaFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: DEFAULT_PAGE }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setActiveTab(0);
    setPagination((prev) => ({ ...prev, page: DEFAULT_PAGE }));
  };

  const handleTabChange = (idx: number) => {
    setActiveTab(idx);
    const tab = TABS[idx];
    if (tab.estadoFilter) {
      handleFiltersChange({ estado: [tab.estadoFilter] });
    } else {
      // "Resumen" → limpiar filtro de estado
      setFilters((prev) => {
        const { estado, ...rest } = prev;
        return rest;
      });
      setPagination((prev) => ({ ...prev, page: DEFAULT_PAGE }));
    }
  };

  const handlePageChange  = (newPage: number)  => setPagination((prev) => ({ ...prev, page: newPage }));
  const handleLimitChange = (newLimit: number) => setPagination((prev) => ({ ...prev, limit: newLimit, page: DEFAULT_PAGE }));

  const handleCreate = () => {
    setSelectedGarantia(null);
    setFormMode("create");
    setFormModalOpen(true);
  };

  const handleView = (garantia: DirectusGarantia) => {
    setSelectedGarantia(garantia);
    setDetailModalOpen(true);
  };

  const handleEdit = (garantia: DirectusGarantia) => {
    setSelectedGarantia(garantia);
    setFormMode("edit");
    setFormModalOpen(true);
    setDetailModalOpen(false);
  };

  const handleDelete = (garantia: DirectusGarantia) => {
    setSelectedGarantia(garantia);
    setDeleteModalOpen(true);
  };

  const handleFormSubmit = async (data: CreateGarantia | UpdateGarantia) => {
    try {
      if (formMode === "create") {
        await crearGarantia.mutateAsync(data as CreateGarantia);
        showSnackbar("Garantía creada exitosamente", "success");
      } else {
        await actualizarGarantia.mutateAsync({
          id: selectedGarantia!.id,
          updates: data as UpdateGarantia,
        });
        showSnackbar("Garantía actualizada exitosamente", "success");
      }
      setFormModalOpen(false);
      setSelectedGarantia(null);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al guardar la garantía";
      showSnackbar(msg, "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedGarantia) return;
    try {
      await eliminarGarantia.mutateAsync(selectedGarantia.id);
      showSnackbar("Garantía eliminada exitosamente", "success");
      setDeleteModalOpen(false);
      setSelectedGarantia(null);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al eliminar la garantía";
      showSnackbar(msg, "error");
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const garantias      = garantiasData?.data  || [];
  const totalGarantias = garantiasData?.total || 0;

  // pendingCount tipado correctamente desde el shape de useGarantiaStats
  const statsTyped = stats as { pendiente?: number; en_revision?: number; aprobada?: number; rechazada?: number; completada?: number } | undefined;
  const pendingCount = statsTyped?.pendiente ?? 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 3 }}>

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <Box>
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{
            color: "#004680",
            letterSpacing: "0.5px",
          }}
        >
          Gestión de Garantías
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Administre las garantías de sus clientes
        </Typography>
      </Box>

      {/* ── Stat Cards (componente existente) ───────────────────────────────── */}
      <GarantiaStatsCards stats={stats} isLoading={isLoadingStats} />

      {/* ── Segmented Tabs ──────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          bgcolor: SURFACE_LOW,
          borderRadius: "16px",
          p: "6px",
          gap: "4px",
          border: `1px solid ${OUTLINE_VARIANT}20`,
          width: "fit-content",
        }}
      >
        {TABS.map((tab, idx) => (
          <Button
            key={tab.label}
            onClick={() => handleTabChange(idx)}
            startIcon={tab.icon}
            size="small"
            sx={{
              borderRadius: "12px",
              px: 2.5,
              py: 1,
              fontSize: "0.8rem",
              fontWeight: activeTab === idx ? 700 : 600,
              color: activeTab === idx ? "#fff" : "#64748b",
              bgcolor: activeTab === idx ? PRIMARY : "transparent",
              boxShadow: activeTab === idx ? "0 4px 12px rgba(0,30,64,0.25)" : "none",
              textTransform: "none",
              minWidth: "auto",
              transition: "all 0.2s",
              "&:hover": {
                bgcolor: activeTab === idx ? PRIMARY : "rgba(255,255,255,0.5)",
                color: activeTab === idx ? "#fff" : PRIMARY,
              },
            }}
          >
            {tab.label}
          </Button>
        ))}
      </Box>

      {/* ── Bento: contexto + mini stats (sólo tab Pendientes) ──────────────── */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Texto contextual */}
          <Grid item xs={12} md={8}>
            <Card
              elevation={0}
              sx={{
                bgcolor: SURFACE_LOW,
                border: `1px solid ${OUTLINE_VARIANT}`,
                borderRadius: 2,
                height: "100%",
                display: "flex",
                alignItems: "center",
              }}
            >
              <CardContent sx={{ p: "28px !important" }}>
                <Typography
                  variant="h5"
                  fontWeight={800}
                  sx={{ color: PRIMARY, mb: 1 }}
                >
                  Revisión de Pendientes
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", maxWidth: 460, lineHeight: 1.7 }}>
                  Tienes{" "}
                  <Box component="span" fontWeight={700} sx={{ color: PRIMARY }}>
                    {pendingCount} solicitudes pendientes
                  </Box>{" "}
                  que requieren atención inmediata para cumplir con el SLA de 48 horas.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Mini stats */}
          <Grid item xs={12} md={4}>
            <Grid container spacing={2} height="100%">
              <Grid item xs={6}>
                <Card
                  elevation={0}
                  sx={{
                    bgcolor: PRIMARY,
                    borderRadius: 2,
                    height: "100%",
                    boxShadow: "0 4px 20px rgba(0,30,64,0.18)",
                  }}
                >
                  <CardContent
                    sx={{
                      p: "20px !important",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "100%",
                    }}
                  >
                    <PendingActionsIcon sx={{ color: "#7dd3fc" }} />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "rgba(255,255,255,0.6)",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        En Espera
                      </Typography>
                      <Typography
                        variant="h4"
                        fontWeight={900}
                        sx={{ color: "#fff" }}
                      >
                        {pendingCount}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card
                  elevation={0}
                  sx={{
                    border: `1px solid ${OUTLINE_VARIANT}`,
                    borderRadius: 2,
                    height: "100%",
                  }}
                >
                  <CardContent
                    sx={{
                      p: "20px !important",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "100%",
                    }}
                  >
                    <SpeedIcon sx={{ color: PRIMARY }} />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#94a3b8",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        Tiempo Medio
                      </Typography>
                      <Typography
                        variant="h4"
                        fontWeight={900}
                        sx={{ color: PRIMARY }}
                      >
                        1.2
                        <Box component="span" sx={{ fontSize: "0.75rem", fontWeight: 400, ml: 0.5 }}>
                          días
                        </Box>
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}

      {/* ── Tabla (componente existente) ─────────────────────────────────────── */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <GarantiaTable
          garantias={garantias}
          total={totalGarantias}
          page={pagination.page}
          limit={pagination.limit}
          isLoading={isLoadingGarantias}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Box>

      {/* ── Estado de Flujo Global ───────────────────────────────────────────── */}
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${OUTLINE_VARIANT}`,
          borderRadius: 3,
          boxShadow: "0 4px 24px rgba(0,30,64,0.06)",
        }}
      >
        <CardContent sx={{ p: "28px !important" }}>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ color: PRIMARY, mb: 4 }}
          >
            Estado de Flujo Global
          </Typography>
          <Box
            sx={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
            }}
          >
            {/* Línea conectora */}
            <Box
              sx={{
                position: "absolute",
                top: "22px",
                left: "12%",
                right: "12%",
                height: "2px",
                bgcolor: OUTLINE_VARIANT,
                opacity: 0.4,
                zIndex: 0,
              }}
            />

            {FLOW_STEPS.map((step) => (
              <Stack
                key={step.label}
                alignItems="center"
                spacing={1.5}
                sx={{ position: "relative", zIndex: 1 }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    bgcolor: step.active ? PRIMARY : SURFACE_HIGH,
                    color: step.active ? "#fff" : "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: step.current
                      ? `0 0 0 6px rgba(0,30,64,0.12), 0 0 0 3px rgba(0,30,64,0.08)` 
                      : "none",
                    transition: "all 0.3s",
                  }}
                >
                  {step.icon}
                </Box>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  sx={{ color: step.active ? PRIMARY : "#94a3b8" }}
                >
                  {step.label}
                </Typography>
              </Stack>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* ── FAB ──────────────────────────────────────────────────────────────── */}
      <Fab
        color="primary"
        onClick={handleCreate}
        sx={{ position: "fixed", bottom: 32, right: 32 }}
      >
        <AddIcon />
      </Fab>

      {/* ── Modales (sin cambios) ────────────────────────────────────────────── */}
      <GarantiaForm
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        garantia={selectedGarantia}
        isLoading={crearGarantia.isPending || actualizarGarantia.isPending}
        mode={formMode}
      />

      <ConfirmDeleteModal
        open={deleteModalOpen}
        garantia={selectedGarantia}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={eliminarGarantia.isPending}
      />

      <GarantiaDetail
        open={detailModalOpen}
        garantia={selectedGarantia}
        onClose={() => setDetailModalOpen(false)}
        onEdit={handleEdit}
      />
    </Box>
  );
}