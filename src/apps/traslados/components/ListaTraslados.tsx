import { Box, Fade, Typography, Button } from "@mui/material";
import { Traslado } from "../hooks/types";
import TrasladoListItem from "./TrasladoListItem";
import { SkeletonCard } from "./CargaSkeletons";
import RefreshIcon from "@mui/icons-material/Refresh";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useAuth } from "@/auth/hooks/useAuth";
import { useState, useMemo } from "react";
import TrasladoDetalleModal from "./TrasladoDetalleModal";

type ListaTrasladosProps = {
  loading?: boolean;
  isError?: boolean;
  traslados: Traslado[];
  idsSeleccionados: number[];
  onToggleSeleccion: (id: number) => void;
  onRetry?: () => void;
  totalPendientes?: number;
  tienePoliticaTrasladosTiendas?: boolean;
  filtroTipo?: "todos" | "enviados" | "recibidos";
};

/**
 * Componente mejorado para listar traslados con:
 * - Skeleton loaders durante la carga
 * - Mensaje cuando no hay datos
 * - Mensaje cuando no hay coincidencias con filtro
 * - Manejo de errores
 */
export const ListaTraslados: React.FC<ListaTrasladosProps> = ({
  loading = false,
  isError = false,
  traslados = [],
  idsSeleccionados = [],
  onToggleSeleccion,
  onRetry,
  totalPendientes = 0,
  tienePoliticaTrasladosTiendas = false,
  filtroTipo = "todos",
}) => {
  const { user } = useAuth();
  const codigoUltra = user?.ultra_code ?? "";

  // Estados para el modal de detalle (Solo para tiendas)
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTrasladoId, setSelectedTrasladoId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<Traslado[]>([]);

  // Lógica de agrupación para vista tienda
  const trasladosAgrupados = useMemo(() => {
    if (!tienePoliticaTrasladosTiendas) return { cards: traslados, details: new Map<number, Traslado[]>() };

    const map = new Map<number, Traslado>();
    const itemsMap = new Map<number, Traslado[]>();

    traslados.forEach((t) => {
      // Guardar el item para el detalle
      const id = t.traslado;
      if (!itemsMap.has(id)) itemsMap.set(id, []);
      itemsMap.get(id)!.push(t);

      // Agrupar para la vista principal
      if (!map.has(id)) {
        map.set(id, { ...t });
      } else {
        const existing = map.get(id)!;
        existing.unidades += t.unidades;
      }
    });

    return {
      cards: Array.from(map.values()),
      details: itemsMap
    };
  }, [traslados, tienePoliticaTrasladosTiendas]);

  // Filtrado final sobre los datos agrupados o planos
  const filtrados = useMemo(() => {
    const data = tienePoliticaTrasladosTiendas ? trasladosAgrupados.cards : traslados;
    return data;
  }, [traslados, trasladosAgrupados, tienePoliticaTrasladosTiendas]);

  const handleVerDetalle = (id: number) => {
    if (!tienePoliticaTrasladosTiendas) return;
    const items = trasladosAgrupados.details.get(id) || [];
    setSelectedTrasladoId(id);
    setSelectedItems(items);
    setModalOpen(true);
  };

  // Helper para renderizar el modal
  const renderModal = () => (
    tienePoliticaTrasladosTiendas && (
      <TrasladoDetalleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        trasladoId={selectedTrasladoId}
        items={selectedItems}
      />
    )
  );

  // Estado 1: CARGANDO - Mostrar skeletons
  if (loading) {
    return <SkeletonCard count={20} height={180} />;
  }

  // Estado 2: ERROR - Mostrar mensaje de error con opción de reintentar
  if (isError) {
    return (
      <>
        <Fade in timeout={500}>
          <Box
            sx={{
              backgroundColor: tienePoliticaTrasladosTiendas ? "#FFFFFF" : "#fff5f5",
              border: tienePoliticaTrasladosTiendas ? "1px solid #E2E8F0" : "1px solid #ffcdd2",
              borderRadius: 4,
              boxShadow: tienePoliticaTrasladosTiendas ? "0 10px 15px -3px rgba(0, 0, 0, 0.05)" : "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              py: 8,
              px: 3,
              textAlign: "center",
              mt: 2,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: tienePoliticaTrasladosTiendas ? "#FEF2F2" : "rgba(211, 47, 47, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1,
              }}
            >
              <ErrorOutlineIcon sx={{ fontSize: 40, color: "#EF4444" }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: tienePoliticaTrasladosTiendas ? "#1E293B" : "#d32f2f" }}>
              Error al cargar los traslados
            </Typography>
            <Typography sx={{ color: "#64748B", maxWidth: 400, fontSize: "0.95rem", mb: 1 }}>
              Ocurrió un problema al obtener los datos de los traslados. Por favor, intenta de nuevo.
            </Typography>
            {onRetry && (
              <Button
                variant="contained"
                onClick={onRetry}
                startIcon={<RefreshIcon />}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  backgroundColor: tienePoliticaTrasladosTiendas ? "primary.main" : "#d32f2f",
                  "&:hover": { backgroundColor: tienePoliticaTrasladosTiendas ? "primary.dark" : "#b71c1c" },
                }}
              >
                Reintentar
              </Button>
            )}
          </Box>
        </Fade>
        {renderModal()}
      </>
    );
  }

  // Estado 3: SIN DATOS (nunca ha habido traslados)
  if (totalPendientes === 0 && filtrados.length === 0) {
    return (
      <>
        <Fade in timeout={500}>
          <Box
            sx={{
              backgroundColor: tienePoliticaTrasladosTiendas ? "#FFFFFF" : "#f3e5f5",
              border: tienePoliticaTrasladosTiendas ? "1px solid #E2E8F0" : "1px solid #e1bee7",
              borderRadius: 4,
              boxShadow: tienePoliticaTrasladosTiendas ? "0 10px 15px -3px rgba(0, 0, 0, 0.05)" : "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              py: 10,
              px: 3,
              textAlign: "center",
              mt: 2,
            }}
          >
            <Box sx={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: tienePoliticaTrasladosTiendas ? "#F8FAFC" : "rgba(156, 39, 176, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
              <FolderOpenIcon sx={{ fontSize: 40, color: tienePoliticaTrasladosTiendas ? "#94A3B8" : "#9c27b0" }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: tienePoliticaTrasladosTiendas ? "#1E293B" : "text.primary" }}>
              No hay traslados pendientes
            </Typography>
            <Typography sx={{ color: "#64748B", maxWidth: 400, fontSize: "0.95rem" }}>
              Todos los traslados han sido procesados. Aquí aparecerán nuevos traslados cuando estén disponibles.
            </Typography>
          </Box>
        </Fade>
        {renderModal()}
      </>
    );
  }

  // Estado 4: CON FILTROS pero sin coincidencias (el usuario filtró y no encontró nada)
  if (filtrados.length === 0 && totalPendientes > 0) {
    return (
      <>
        <Fade in timeout={500}>
          <Box
            sx={{
              backgroundColor: tienePoliticaTrasladosTiendas ? "#FFFFFF" : "#e3f2fd",
              border: tienePoliticaTrasladosTiendas ? "1px solid #E2E8F0" : "1px solid #90caf9",
              borderRadius: 4,
              boxShadow: tienePoliticaTrasladosTiendas ? "0 10px 15px -3px rgba(0, 0, 0, 0.05)" : "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              py: 10,
              px: 3,
              textAlign: "center",
              mt: 2,
            }}
          >
            <Box sx={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: tienePoliticaTrasladosTiendas ? "#EFF6FF" : "rgba(25, 118, 210, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
              <SearchOffIcon sx={{ fontSize: 40, color: tienePoliticaTrasladosTiendas ? "primary.main" : "#1976d2" }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: tienePoliticaTrasladosTiendas ? "#1E293B" : "text.primary" }}>
              No hay coincidencias
            </Typography>
            <Typography sx={{ color: "#64748B", maxWidth: 400, fontSize: "0.95rem" }}>
              No encontramos traslados que coincidan con tus filtros actuales. Intenta ajustar los criterios de búsqueda o fecha.
            </Typography>
            <Box sx={{ mt: 2, px: 2, py: 1, backgroundColor: tienePoliticaTrasladosTiendas ? "#F8FAFC" : "rgba(0,0,0,0.02)", borderRadius: "10px", border: "1px dashed #CBD5E1" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748B" }}>
                Traslados totales disponibles: {totalPendientes}
              </Typography>
            </Box>
          </Box>
        </Fade>
        {renderModal()}
      </>
    );
  }

  // Caso Especial: VISTA DE TIENDA con filtro "TODOS" -> Separar en columnas
  if (tienePoliticaTrasladosTiendas && filtroTipo === "todos") {
    const enviados = filtrados.filter((t) => String(t.bodega_origen) === String(codigoUltra));
    const porRecibir = filtrados.filter((t) => String(t.bodega_origen) !== String(codigoUltra));

    return (
      <>
        <Fade in timeout={500}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
              width: "100%",
              alignItems: "start",
            }}
          >
            {/* COLUMNA ENVIADOS */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1, borderBottom: "2px solid #2563EB", mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1E293B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Enviados</Typography>
                <Box sx={{ backgroundColor: "#2563EB", color: "white", px: 1.2, py: 0.2, borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700 }}>{enviados.length}</Box>
              </Box>
              {enviados.length > 0 ? (
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", width: "100%" }}>
                  {enviados.map((t) => (
                    <TrasladoListItem
                      key={t.traslado ?? `enviado-${Math.random()}`}
                      traslado={t}
                      isSelected={false}
                      onTrasladoClick={() => handleVerDetalle(t.traslado)}
                      compact
                      tienePoliticaTrasladosTiendas={tienePoliticaTrasladosTiendas}
                      isSplitView={true}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: "#94A3B8", fontStyle: "italic", py: 2, textAlign: "center" }}>No tienes envíos pendientes</Typography>
              )}
            </Box>

            {/* COLUMNA POR RECIBIR */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1, borderBottom: "2px solid #F59E0B", mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1E293B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Por Recibir</Typography>
                <Box sx={{ backgroundColor: "#F59E0B", color: "white", px: 1.2, py: 0.2, borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700 }}>{porRecibir.length}</Box>
              </Box>
              {porRecibir.length > 0 ? (
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", width: "100%" }}>
                  {porRecibir.map((t) => (
                    <TrasladoListItem
                      key={t.traslado ?? `recibir-${Math.random()}`}
                      traslado={t}
                      isSelected={false}
                      onTrasladoClick={() => handleVerDetalle(t.traslado)}
                      compact
                      tienePoliticaTrasladosTiendas={tienePoliticaTrasladosTiendas}
                      isSplitView={true}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: "#94A3B8", fontStyle: "italic", py: 2, textAlign: "center" }}>No hay traslados por recibir</Typography>
              )}
            </Box>
          </Box>
        </Fade>
        {renderModal()}
      </>
    );
  }

  // Estado 5: DATOS DISPONIBLES - Mostrar lista normal
  return (
    <>
      <Fade in timeout={500}>
        <Box
          sx={{
            overflowX: "hidden",
            pr: 1, pt: 1, pb: 1,
            display: "grid",
            gap: 2,
            boxSizing: "border-box",
            alignItems: "start",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            justifyItems: "center",
          }}
        >
          {filtrados.map((t) => {
            const isSelected = t.traslado !== undefined && idsSeleccionados.includes(t.traslado);
            const canSelect = !tienePoliticaTrasladosTiendas;
            return (
              <TrasladoListItem
                key={t.traslado ?? `traslado-${Math.random()}`}
                traslado={t}
                isSelected={canSelect && isSelected}
                onTrasladoClick={() =>
                  tienePoliticaTrasladosTiendas
                    ? handleVerDetalle(t.traslado)
                    : canSelect && t.traslado !== undefined
                    ? onToggleSeleccion(t.traslado)
                    : undefined
                }
                compact
                tienePoliticaTrasladosTiendas={tienePoliticaTrasladosTiendas}
              />
            );
          })}
        </Box>
      </Fade>
      {renderModal()}
    </>
  );
};

export default ListaTraslados;
