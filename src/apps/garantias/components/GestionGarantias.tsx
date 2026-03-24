import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Chip,
  IconButton,
  Divider,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Fab,
} from "@mui/material";

// ── Icons (usando Material Symbols via fuente o @mui/icons-material) ──────────
import SearchIcon from "@mui/icons-material/Search";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CategoryIcon from "@mui/icons-material/Category";
import TuneIcon from "@mui/icons-material/Tune";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LaptopMacIcon from "@mui/icons-material/LaptopMac";
import CoffeeMakerIcon from "@mui/icons-material/CoffeeMaker";
import CheckIcon from "@mui/icons-material/Check";
import PendingIcon from "@mui/icons-material/Pending";
import EngineeringIcon from "@mui/icons-material/Engineering";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AddIcon from "@mui/icons-material/Add";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import FindInPageIcon from "@mui/icons-material/FindInPage";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import StorageIcon from "@mui/icons-material/Storage";
import SpeedIcon from "@mui/icons-material/Speed";

// ── Paleta (coincide con el design system del mockup) ─────────────────────────
const PRIMARY = "#001e40";
const PRIMARY_CONTAINER = "#003366";
const SURFACE_TINT = "#3a5f94";
const ERROR = "#ba1a1a";
const ERROR_CONTAINER = "#ffdad6";
const SECONDARY_CONTAINER = "#c6e4f4";
const ON_SECONDARY_CONTAINER = "#4a6774";
const SURFACE_LOW = "#f3f4f5";
const SURFACE_HIGH = "#e7e8e9";
const SURFACE_LOWEST = "#ffffff";
const OUTLINE_VARIANT = "#c3c6d1";

// ── Stat cards data ────────────────────────────────────────────────────────────
const STAT_CARDS = [
  { label: "Total", value: 48, icon: <StorageIcon />, color: "#6366f1", bg: "#eef2ff" },
  { label: "Pendientes", value: 24, icon: <HourglassEmptyIcon />, color: "#f59e0b", bg: "#fffbeb" },
  { label: "En Revisión", value: 8, icon: <FindInPageIcon />, color: "#3b82f6", bg: "#eff6ff" },
  { label: "Aprobadas", value: 10, icon: <CheckCircleIcon />, color: "#22c55e", bg: "#f0fdf4" },
  { label: "Rechazadas", value: 4, icon: <CancelIcon />, color: "#ef4444", bg: "#fef2f2" },
  { label: "Completadas", value: 2, icon: <TaskAltIcon />, color: "#a855f7", bg: "#faf5ff" },
];

// ── Claims data ───────────────────────────────────────────────────────────────
const CLAIMS = [
  {
    id: "WR-9021-X",
    product: "Nevera Premium Glass v2",
    client: "Juan Pérez",
    date: "12 May, 2024",
    priority: "Alta Prioridad",
    priorityColor: { bg: SECONDARY_CONTAINER, text: ON_SECONDARY_CONTAINER },
    borderColor: ERROR,
    icon: <WarningAmberIcon />,
    iconBg: ERROR_CONTAINER,
    iconColor: "#93000a",
  },
  {
    id: "WR-8842-A",
    product: "Portátil Workstation Z1",
    client: "Tech Solutions SL",
    date: "14 May, 2024",
    priority: "Media",
    priorityColor: { bg: SURFACE_HIGH, text: "#43474f" },
    borderColor: SURFACE_TINT,
    icon: <LaptopMacIcon />,
    iconBg: PRIMARY_CONTAINER,
    iconColor: "#ffffff",
  },
  {
    id: "WR-8750-B",
    product: "Cafetera Expreso Pro",
    client: "María García",
    date: "15 May, 2024",
    priority: "Media",
    priorityColor: { bg: SURFACE_HIGH, text: "#43474f" },
    borderColor: SURFACE_TINT,
    icon: <CoffeeMakerIcon />,
    iconBg: PRIMARY_CONTAINER,
    iconColor: "#ffffff",
    opacity: 0.75,
  },
];

// ── Flow steps ────────────────────────────────────────────────────────────────
const FLOW_STEPS = [
  { label: "Recibido", icon: <CheckIcon fontSize="small" />, active: true, current: false },
  { label: "Validación", icon: <PendingIcon fontSize="small" />, active: true, current: true },
  { label: "Taller", icon: <EngineeringIcon fontSize="small" />, active: false, current: false },
  { label: "Envío", icon: <LocalShippingIcon fontSize="small" />, active: false, current: false },
];

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { label: "Resumen", icon: <DashboardIcon fontSize="small" /> },
  { label: "Pendientes", icon: <PendingActionsIcon fontSize="small" /> },
  { label: "En Revisión", icon: <FindInPageIcon fontSize="small" /> },
  { label: "Aprobadas", icon: <CheckCircleIcon fontSize="small" /> },
  { label: "Rechazadas", icon: <CancelIcon fontSize="small" /> },
  { label: "Completadas", icon: <TaskAltIcon fontSize="small" /> },
];

// ═════════════════════════════════════════════════════════════════════════════
export default function GestionGarantias() {
  const [activeTab, setActiveTab] = useState(1);
  const [priority, setPriority] = useState("Media");
  const [dateRange, setDateRange] = useState("30d");
  const [productType, setProductType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  return (
    <Box sx={{ bgcolor: "#f8f9fa", minHeight: "100vh", p: { xs: 2, md: 4 }, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight={900}
          sx={{ color: PRIMARY, fontFamily: "'Manrope', sans-serif", letterSpacing: "-0.5px" }}
        >
          Gestión de Garantías
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
          Administre las garantías de sus clientes
        </Typography>
      </Box>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {STAT_CARDS.map((card) => (
          <Grid item xs={6} sm={4} md={2} key={card.label}>
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${OUTLINE_VARIANT}`,
                borderRadius: 2,
                transition: "box-shadow 0.2s, transform 0.2s",
                "&:hover": { boxShadow: "0 4px 16px rgba(0,30,64,0.10)", transform: "translateY(-2px)" },
              }}
            >
              <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: "16px !important" }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                    {card.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={900} sx={{ color: PRIMARY, fontFamily: "'Manrope', sans-serif", mt: 0.5 }}>
                    {card.value}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: card.bg, color: card.color, borderRadius: "12px", p: 1.2, display: "flex" }}>
                  {React.cloneElement(card.icon, { sx: { fontSize: 26 } })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Search + Filters card ────────────────────────────────────────────── */}
      <Card elevation={0} sx={{ border: `1px solid ${OUTLINE_VARIANT}`, borderRadius: 2, mb: 4 }}>
        <CardContent sx={{ p: "20px !important" }}>
          {/* Row 1: search + estado + tipo */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por cliente, producto, factura..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#94a3b8" }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: "8px", bgcolor: SURFACE_LOWEST },
              }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Estado</InputLabel>
              <Select value={statusFilter} label="Estado" onChange={(e) => setStatusFilter(e.target.value)} sx={{ borderRadius: "8px", bgcolor: SURFACE_LOWEST }}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pending">Pendiente</MenuItem>
                <MenuItem value="review">En Revisión</MenuItem>
                <MenuItem value="approved">Aprobada</MenuItem>
                <MenuItem value="rejected">Rechazada</MenuItem>
                <MenuItem value="done">Completada</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Tipo</InputLabel>
              <Select value={typeFilter} label="Tipo" onChange={(e) => setTypeFilter(e.target.value)} sx={{ borderRadius: "8px", bgcolor: SURFACE_LOWEST }}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="electronics">Electrónica</MenuItem>
                <MenuItem value="appliances">Línea Blanca</MenuItem>
                <MenuItem value="furniture">Mobiliario</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Row 2: date range */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <TextField
              label="Fecha desde"
              type="date"
              size="small"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 180, bgcolor: SURFACE_LOWEST, borderRadius: "8px" }}
            />
            <TextField
              label="Fecha hasta"
              type="date"
              size="small"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 180, bgcolor: SURFACE_LOWEST, borderRadius: "8px" }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "inline-flex",
          bgcolor: SURFACE_LOW,
          borderRadius: "16px",
          p: "6px",
          gap: "4px",
          mb: 4,
          border: `1px solid ${OUTLINE_VARIANT}20`,
          flexWrap: "wrap",
        }}
      >
        {TABS.map((tab, idx) => (
          <Button
            key={tab.label}
            onClick={() => setActiveTab(idx)}
            startIcon={tab.icon}
            size="small"
            sx={{
              borderRadius: "12px",
              px: 2.5,
              py: 1,
              fontSize: "0.8rem",
              fontWeight: activeTab === idx ? 700 : 600,
              fontFamily: "'Inter', sans-serif",
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

      {/* ── Bento header + mini stats ─────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${OUTLINE_VARIANT}`,
              borderRadius: 2,
              bgcolor: SURFACE_LOW,
              height: "100%",
              display: "flex",
              alignItems: "center",
            }}
          >
            <CardContent sx={{ p: "32px !important" }}>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ color: PRIMARY, fontFamily: "'Manrope', sans-serif", mb: 1 }}
              >
                Revisión de Pendientes
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b", maxWidth: 460, lineHeight: 1.7 }}>
                Tienes{" "}
                <Box component="span" fontWeight={700} sx={{ color: PRIMARY }}>
                  12 nuevas solicitudes
                </Box>{" "}
                que requieren atención inmediata para cumplir con el SLA de 48 horas.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Grid container spacing={2} height="100%">
            <Grid item xs={6}>
              <Card
                elevation={0}
                sx={{
                  bgcolor: PRIMARY,
                  borderRadius: 2,
                  height: "100%",
                  boxShadow: "0 4px 20px rgba(0,30,64,0.15)",
                }}
              >
                <CardContent sx={{ p: "24px !important", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                  <PendingActionsIcon sx={{ color: "#7dd3fc" }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                      En Espera
                    </Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ color: "#fff", fontFamily: "'Manrope', sans-serif" }}>
                      24
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card elevation={0} sx={{ border: `1px solid ${OUTLINE_VARIANT}`, borderRadius: 2, height: "100%" }}>
                <CardContent sx={{ p: "24px !important", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                  <SpeedIcon sx={{ color: PRIMARY }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                      Tiempo Medio
                    </Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ color: PRIMARY, fontFamily: "'Manrope', sans-serif" }}>
                      1.2
                      <Box component="span" sx={{ fontSize: "0.75rem", fontWeight: 400, ml: 0.5 }}>días</Box>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* ── Advanced filters row ─────────────────────────────────────────────── */}
      <Card elevation={0} sx={{ border: `1px solid ${OUTLINE_VARIANT}`, borderRadius: 2, mb: 4 }}>
        <CardContent sx={{ p: "20px !important" }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-end" flexWrap="wrap">
            {/* Date filter */}
            <Box sx={{ flex: 1, minWidth: 180 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#94a3b8", mb: 1, display: "block" }}>
                Fecha de Solicitud
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", bgcolor: SURFACE_LOWEST, borderRadius: "8px", px: 1.5, border: `1px solid ${OUTLINE_VARIANT}` }}>
                <CalendarTodayIcon sx={{ fontSize: 16, color: "#94a3b8", mr: 1 }} />
                <Select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  variant="standard"
                  disableUnderline
                  size="small"
                  sx={{ flex: 1, fontSize: "0.875rem", fontWeight: 500, color: PRIMARY, py: 1 }}
                >
                  <MenuItem value="30d">Últimos 30 días</MenuItem>
                  <MenuItem value="7d">Última semana</MenuItem>
                  <MenuItem value="year">Año en curso</MenuItem>
                </Select>
              </Box>
            </Box>

            {/* Product type */}
            <Box sx={{ flex: 1, minWidth: 180 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#94a3b8", mb: 1, display: "block" }}>
                Tipo de Producto
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", bgcolor: SURFACE_LOWEST, borderRadius: "8px", px: 1.5, border: `1px solid ${OUTLINE_VARIANT}` }}>
                <CategoryIcon sx={{ fontSize: 16, color: "#94a3b8", mr: 1 }} />
                <Select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  variant="standard"
                  disableUnderline
                  size="small"
                  sx={{ flex: 1, fontSize: "0.875rem", fontWeight: 500, color: PRIMARY, py: 1 }}
                >
                  <MenuItem value="all">Todos los productos</MenuItem>
                  <MenuItem value="electronics">Electrónica</MenuItem>
                  <MenuItem value="appliances">Línea Blanca</MenuItem>
                  <MenuItem value="furniture">Mobiliario</MenuItem>
                </Select>
              </Box>
            </Box>

            {/* Priority toggle */}
            <Box sx={{ flex: 1, minWidth: 180 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#94a3b8", mb: 1, display: "block" }}>
                Prioridad
              </Typography>
              <Stack direction="row" spacing={1}>
                {["Alta", "Media", "Baja"].map((p) => (
                  <Button
                    key={p}
                    onClick={() => setPriority(p)}
                    size="small"
                    sx={{
                      borderRadius: "8px",
                      px: 2,
                      py: 1,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textTransform: "none",
                      bgcolor: priority === p ? PRIMARY : SURFACE_HIGH,
                      color: priority === p ? "#fff" : PRIMARY,
                      boxShadow: priority === p ? "0 2px 8px rgba(0,30,64,0.2)" : "none",
                      "&:hover": { bgcolor: PRIMARY, color: "#fff" },
                    }}
                  >
                    {p}
                  </Button>
                ))}
              </Stack>
            </Box>

            <Button
              variant="contained"
              startIcon={<TuneIcon />}
              sx={{
                bgcolor: PRIMARY,
                borderRadius: "8px",
                px: 3,
                py: 1.5,
                fontWeight: 700,
                textTransform: "none",
                boxShadow: "0 2px 10px rgba(0,30,64,0.2)",
                "&:hover": { bgcolor: PRIMARY_CONTAINER },
                whiteSpace: "nowrap",
              }}
            >
              Aplicar Filtros
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* ── Claims List ──────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 6 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, px: 1 }}>
          <Typography variant="caption" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 2, color: "#94a3b8" }}>
            Lista de Solicitudes Pendientes
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            Mostrando 12 de 24 resultados
          </Typography>
        </Stack>

        <Stack spacing={2}>
          {CLAIMS.map((claim) => (
            <Card
              key={claim.id}
              elevation={0}
              sx={{
                border: `1px solid ${OUTLINE_VARIANT}`,
                borderLeft: `4px solid ${claim.borderColor}`,
                borderRadius: 2,
                opacity: claim.opacity ?? 1,
                transition: "box-shadow 0.2s, transform 0.15s",
                "&:hover": {
                  boxShadow: "0 4px 20px rgba(0,30,64,0.10)",
                  transform: "translateX(2px)",
                  bgcolor: SURFACE_LOW,
                },
              }}
            >
              <CardContent sx={{ p: "20px !important" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  {/* Left: icon + info */}
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "12px",
                        bgcolor: claim.iconBg,
                        color: claim.iconColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {claim.icon}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ color: PRIMARY, fontFamily: "'Manrope', sans-serif", lineHeight: 1.2 }}>
                        {claim.id}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500 }}>
                        {claim.product} • {claim.client}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Right: date + priority + arrow */}
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
                      <Typography variant="caption" fontWeight={700} sx={{ color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>
                        Fecha
                      </Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ color: PRIMARY }}>
                        {claim.date}
                      </Typography>
                    </Box>
                    <Chip
                      label={claim.priority}
                      size="small"
                      sx={{
                        bgcolor: claim.priorityColor.bg,
                        color: claim.priorityColor.text,
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        letterSpacing: 0.8,
                        textTransform: "uppercase",
                        borderRadius: "99px",
                      }}
                    />
                    <IconButton
                      size="small"
                      sx={{
                        bgcolor: SURFACE_HIGH,
                        borderRadius: "50%",
                        "&:hover": { bgcolor: PRIMARY, color: "#fff" },
                        transition: "all 0.2s",
                      }}
                    >
                      <ChevronRightIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>

      {/* ── Global Flow State ────────────────────────────────────────────────── */}
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${OUTLINE_VARIANT}`,
          borderRadius: 3,
          mb: 4,
          boxShadow: "0 4px 24px rgba(0,30,64,0.06)",
        }}
      >
        <CardContent sx={{ p: "32px !important" }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: PRIMARY, fontFamily: "'Manrope', sans-serif", mb: 4 }}>
            Estado de Flujo Global
          </Typography>
          <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Connector line */}
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "10%",
                right: "10%",
                height: "2px",
                bgcolor: OUTLINE_VARIANT,
                opacity: 0.4,
                transform: "translateY(-50%)",
                zIndex: 0,
              }}
            />
            {FLOW_STEPS.map((step, idx) => (
              <Stack key={step.label} alignItems="center" spacing={1.5} sx={{ position: "relative", zIndex: 1 }}>
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
        aria-label="Nueva garantía"
        sx={{
          position: "fixed",
          bottom: 32,
          right: 32,
          bgcolor: PRIMARY,
          "&:hover": { bgcolor: PRIMARY_CONTAINER },
          boxShadow: "0 4px 16px rgba(0,30,64,0.35)",
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}
