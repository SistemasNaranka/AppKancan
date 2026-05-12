// src/apps/reservas/components/MisReservasCards.tsx

import React, { useMemo, useState } from "react";
import {
  Box,
  Card,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import CalendarIcon from "@mui/icons-material/CalendarMonth";
import TimeIcon from "@mui/icons-material/AccessTime";
import NotesIcon from "@mui/icons-material/Notes";
import AreaIcon from "@mui/icons-material/Business";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Reserva, EstadoReserva } from "../types/reservas.types";
import {
  COLORES_ESTADO,
  COLORES_TEXTO_ESTADO,
  puedeModificarse,
  capitalize,
} from "../types/reservas.types";
import { useTourContext } from "./TourContext";

interface MisReservasCardsProps {
  reservas: Reserva[];
  usuarioActualId?: string;
  onEditar?: (reserva: Reserva) => void;
  onCancelar?: (reserva: Reserva) => void;
  onNuevaReserva?: () => void;
  loading?: boolean;
}

type TabKey = "todas" | "vigentes" | "finalizadas" | "canceladas";

const ITEMS_PER_PAGE = 6;

const MisReservasCards: React.FC<MisReservasCardsProps> = ({
  reservas,
  usuarioActualId,
  onEditar,
  onCancelar,
  onNuevaReserva,
  loading = false,
}) => {
  const [tab, setTab] = useState<TabKey>("todas");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { isFullTourRunning, tourPhase, userCreatedReservation, mockReservasAdicionales } =
    useTourContext();

  const isTourActive = isFullTourRunning && tourPhase === "MIS_RESERVAS";

  const tourReservas: Reserva[] = useMemo(() => {
    if (!isTourActive) return [];
    const out: Reserva[] = [];
    if (userCreatedReservation) out.push(userCreatedReservation);
    out.push(...mockReservasAdicionales);
    return out;
  }, [isTourActive, userCreatedReservation, mockReservasAdicionales]);

  const reservasToShow = isTourActive ? tourReservas : reservas;

  const getEstado = (r: Reserva) =>
    (r.estadoCalculado || r.estado)?.toLowerCase() || "";

  const reservasVigentes = reservasToShow.filter(
    (r) => getEstado(r) === "vigente" || getEstado(r) === "en curso",
  );
  const reservasFinalizadas = reservasToShow.filter(
    (r) => getEstado(r) === "finalizado" || getEstado(r) === "finalizada",
  );
  const reservasCanceladas = reservasToShow.filter(
    (r) => getEstado(r) === "cancelado" || getEstado(r) === "cancelada",
  );

  // Filtrar por tab activo
  const baseList =
    tab === "todas"
      ? reservasToShow
      : tab === "vigentes"
        ? reservasVigentes
        : tab === "finalizadas"
          ? reservasFinalizadas
          : reservasCanceladas;

  // Búsqueda libre
  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return baseList;
    return baseList.filter((r) =>
      [
        r.nombre_sala,
        r.titulo_reunion,
        r.area,
        r.observaciones,
        r.fecha,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [baseList, search]);

  // Reset page al cambiar tab/search
  React.useEffect(() => {
    setPage(1);
  }, [tab, search]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE));
  const pagedList = filteredList.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const puedeModificar = (reserva: Reserva): boolean => {
    if (isTourActive) return false;
    if (!usuarioActualId) return false;
    if (!reserva.usuario_id) return false;
    if (reserva.usuario_id.id !== usuarioActualId) return false;
    const estadoActual = reserva.estadoCalculado || reserva.estado;
    if (!puedeModificarse(estadoActual)) return false;
    const ahora = new Date();
    const fechaReserva = new Date(`${reserva.fecha}T${reserva.hora_inicio}`);
    return fechaReserva > ahora;
  };

  const formatearFecha = (fecha: string): string => {
    try {
      return format(new Date(fecha + "T12:00:00"), "EEE, d MMM yyyy", { locale: es });
    } catch {
      return fecha;
    }
  };

  const formatearHora = (hora: string) => {
    const [h, m] = hora.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return hora;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const truncarTexto = (texto: string, limite: number) =>
    !texto ? "" : texto.length > limite ? texto.slice(0, limite) + "..." : texto;

  // ── Sub-componentes ──────────────────────────────────────────────────────

  const FilterChip: React.FC<{
    label: string;
    count: number;
    value: TabKey;
    color: string;
  }> = ({ label, count, value, color }) => {
    const active = tab === value;
    return (
      <Chip
        onClick={() => setTab(value)}
        label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{label}</Typography>
            <Box
              sx={{
                bgcolor: active ? "rgba(255,255,255,0.25)" : color,
                color: active ? "#fff" : "#fff",
                px: 0.85,
                py: 0.05,
                borderRadius: 10,
                fontSize: "0.7rem",
                fontWeight: 700,
                minWidth: 18,
                textAlign: "center",
              }}
            >
              {count}
            </Box>
          </Box>
        }
        sx={{
          height: 32,
          px: 0.5,
          cursor: "pointer",
          bgcolor: active ? "#004680" : "#f1f5f9",
          color: active ? "#fff" : "#475569",
          border: "1px solid",
          borderColor: active ? "#004680" : "transparent",
          "&:hover": {
            bgcolor: active ? "#003a6b" : "#e2e8f0",
          },
        }}
      />
    );
  };

  const EstadoChip: React.FC<{ estado: EstadoReserva }> = ({ estado }) => {
    // Override: "Vigente"/"En curso" usan verde sólido como el badge del filtro.
    const esVigente = estado === "Vigente" || estado === "En curso";
    const bg = esVigente ? "#16a34a" : (COLORES_ESTADO[estado] ?? "#e5e7eb");
    const color = esVigente ? "#ffffff" : (COLORES_TEXTO_ESTADO[estado] ?? "#374151");
    return (
      <Chip
        label={String(estado).toUpperCase()}
        size="small"
        sx={{
          backgroundColor: bg,
          color,
          fontWeight: 700,
          fontSize: "0.65rem",
          height: 20,
          letterSpacing: "0.03em",
        }}
      />
    );
  };

  const RowReserva: React.FC<{ reserva: Reserva; className?: string }> = ({ reserva, className }) => {
    const canModify = puedeModificar(reserva);
    const estado = (reserva.estadoCalculado || reserva.estado) as EstadoReserva;

    return (
      <TableRow
        className={className}
        sx={{
          "&:hover": { bgcolor: "#f8fafc" },
          "& td": { borderColor: "#e5e7eb" },
        }}
      >
        {/* ESPACIO & ESTADO */}
        <TableCell sx={{ py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: "#e8f0f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MeetingRoomIcon sx={{ fontSize: 20, color: "#004680" }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, color: "#004680", fontSize: "0.9rem" }} noWrap>
                {reserva.titulo_reunion}
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <EstadoChip estado={estado} />
              </Box>
            </Box>
          </Box>
        </TableCell>

        {/* FECHA Y HORA */}
        <TableCell sx={{ py: 2 }}>
          <Stack spacing={0.4}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <CalendarIcon sx={{ fontSize: 15, color: "#64748b" }} />
              <Typography sx={{ fontSize: "0.83rem", color: "#1a2a3a", fontWeight: 500 }}>
                {formatearFecha(reserva.fecha)}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <TimeIcon sx={{ fontSize: 15, color: "#64748b" }} />
              <Typography sx={{ fontSize: "0.83rem", color: "#475569" }}>
                {formatearHora(reserva.hora_inicio)} - {formatearHora(reserva.hora_final)}
              </Typography>
            </Box>
          </Stack>
        </TableCell>

        {/* DETALLES */}
        <TableCell sx={{ py: 2 }}>
          <Stack spacing={0.4}>
            {reserva.titulo_reunion && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <MeetingRoomIcon sx={{ fontSize: 15, color: "#64748b" }} />
                <Typography sx={{ fontSize: "0.83rem", color: "#1a2a3a" }}>
                  {truncarTexto(reserva.nombre_sala, 30)}
                </Typography>
              </Box>
            )}
            {reserva.area && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <AreaIcon sx={{ fontSize: 15, color: "#64748b" }} />
                <Typography sx={{ fontSize: "0.83rem", color: "#475569" }}>
                  {capitalize(reserva.area)}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <PeopleIcon sx={{ fontSize: 15, color: "#64748b" }} />
              <Typography sx={{ fontSize: "0.83rem", color: "#475569" }}>
                {reserva.participantes?.length ?? 0}{" "}
                {(reserva.participantes?.length ?? 0) === 1 ? "participante" : "participantes"}
              </Typography>
            </Box>
            {!reserva.titulo_reunion && !reserva.area && (
              <Typography sx={{ fontSize: "0.83rem", color: "#94a3b8" }}>—</Typography>
            )}
          </Stack>
        </TableCell>

        {/* ACCIONES */}
        <TableCell sx={{ py: 2 }} align="right">
          {canModify ? (
            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
              {onEditar && (
                <Tooltip title="Editar">
                  <IconButton
                    size="small"
                    onClick={() => onEditar(reserva)}
                    sx={{
                      color: "#004680",
                      "&:hover": { bgcolor: "rgba(0,70,128,0.08)" },
                    }}
                  >
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              )}
              {onCancelar && (
                <Tooltip title="Cancelar">
                  <IconButton
                    size="small"
                    onClick={() => onCancelar(reserva)}
                    sx={{
                      color: "#ef4444",
                      "&:hover": { bgcolor: "rgba(239,68,68,0.08)" },
                    }}
                  >
                    <CancelIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          ) : (
            <Typography sx={{ fontSize: "0.75rem", color: "#cbd5e1" }}>—</Typography>
          )}
        </TableCell>
      </TableRow>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading && !isTourActive) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          Cargando reservas...
        </Typography>
      </Box>
    );
  }

  return (
    <Card
      sx={{
        borderRadius: 2.5,
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e5e7eb",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#1a2a3a" }}>
          Historial de Reservas
        </Typography>
      </Box>

      {/* ── Toolbar: Tabs + Search ──────────────────────────────────────── */}
      <Box
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e5e7eb",
          gap: 2,
          flexWrap: "wrap",
          bgcolor: "#fafbfd",
        }}
      >
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap className="tour-mis-reservas-tabs">
          <FilterChip
            label="Todas"
            count={reservasToShow.length}
            value="todas"
            color="#0070c0"
          />
          <FilterChip
            label="Vigentes"
            count={reservasVigentes.length}
            value="vigentes"
            color="#16a34a"
          />
          <FilterChip
            label="Finalizadas"
            count={reservasFinalizadas.length}
            value="finalizadas"
            color="#9ca3af"
          />
          <FilterChip
            label="Canceladas"
            count={reservasCanceladas.length}
            value="canceladas"
            color="#ef4444"
          />
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Buscar reserva"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "#94a3b8" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 240,
              "& .MuiOutlinedInput-root": {
                bgcolor: "#fff",
                borderRadius: 1.5,
                fontSize: "0.85rem",
              },
            }}
          />
        </Stack>
      </Box>

      {/* ── Tabla ──────────────────────────────────────────────────────── */}
      {filteredList.length === 0 ? (
        <Box sx={{ py: 8, textAlign: "center", color: "#94a3b8" }}>
          <Typography variant="body2">
            {search
              ? `No se encontraron reservas para "${search}"`
              : "No hay reservas en esta categoría"}
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ "& th": { borderColor: "#e5e7eb", bgcolor: "#fafbfd" } }}>
                <TableCell
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 1.5,
                  }}
                >
                  Título & Estado
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 1.5,
                  }}
                >
                  Fecha y Hora
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 1.5,
                  }}
                >
                  Detalles
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 1.5,
                  }}
                >
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedList.map((reserva, index) => (
                <RowReserva
                  key={reserva.id}
                  reserva={reserva}
                  className={index === 0 ? "tour-reserva-card" : undefined}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Footer: count + paginación ─────────────────────────────────── */}
      {filteredList.length > 0 && (
        <Box
          sx={{
            px: 3,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #e5e7eb",
            bgcolor: "#fafbfd",
          }}
        >
          <Typography sx={{ fontSize: "0.8rem", color: "#64748b" }}>
            Mostrando {pagedList.length} de {filteredList.length} reservas
          </Typography>
          {totalPages > 1 && (
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              size="small"
              shape="rounded"
              color="primary"
            />
          )}
        </Box>
      )}
    </Card>
  );
};

export default MisReservasCards;
