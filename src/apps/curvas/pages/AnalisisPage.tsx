/** @jsxImportSource react */
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Box, Container, Typography, Paper, Stack, TextField, Avatar, Button, Chip, Fade, Skeleton, Tooltip, InputAdornment, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { Search as SearchIcon, Person as PersonIcon, Store as StoreIcon, Analytics as AnalyticsIcon, FilterList as FilterIcon, CalendarToday as CalendarIcon, LibraryBooks as LibraryBooksIcon } from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import CustomSelectionModal from "../../../shared/components/selectionmodal/CustomSelectionModal";

import { useAnalisisData } from "../hooks/useAnalisisData";
import { useAnalisisExport } from "../hooks/useAnalisisExport";
import { AnalisisTopBar } from "../components/AnalisisTopBar";
import { BRAND, MAIN_FONT } from "../utils/analisis.constants";

const getHeatColor = (value: number, max: number) => {
  if (max <= 0 || value === 0) return { bg: "inherit", text: "inherit", fw: 400 };
  const ratio = value / max;
  if (ratio < 0.25) return { bg: "#f0f9ff", text: "#0369a1", fw: 600 };
  if (ratio < 0.5) return { bg: "#e0f2fe", text: "#0284c7", fw: 600 };
  if (ratio < 0.75) return { bg: "#bae6fd", text: "#0ea5e9", fw: 700 };
  return { bg: "#7dd3fc", text: "#0369a1", fw: 700 };
};

const AnalisisPage = () => {
  const data = useAnalisisData();
  const { handleExportar } = useAnalisisExport(data.matrixData, data.selectedRef);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = document.getElementById("analisis-page-header-portal");
    if (el) setPortalTarget(el);
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <>
        {portalTarget && createPortal(<AnalisisTopBar data={data} exportFn={handleExportar} />, portalTarget)}

        <CustomSelectionModal
          open={data.showRefModal}
          onClose={() => data.setShowRefModal(false)}
          onConfirm={(selected) => {
            if (selected.length > 0) {
              data.setSelectedRef(data.uniqueReferences[Number(selected[0])] ?? null);
              data.setShowRefModal(false);
            }
          }}
          items={data.refSummaryItems}
          title="Seleccionar Referencia"
          initialSelected={data.selectedRef ? [data.uniqueReferences.indexOf(data.selectedRef)] : []}
          labelKey="label"
        />

        <Container maxWidth="xl" sx={{ py: 2, fontFamily: MAIN_FONT }}>
          <Paper elevation={0} sx={{ display: { xs: "flex", md: "none" }, gap: 1, p: 1.5, mb: 2, borderRadius: 2, border: "1px solid #e2e8f0", flexWrap: "wrap" }}>
            <TextField size="small" fullWidth placeholder="Buscar tienda…" value={data.filtroTienda} onChange={(e) => data.setFiltroTienda(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16 }} /></InputAdornment> }} />
          </Paper>

          {!data.selectedRef ? (
            <Fade in={true}>
              <Box sx={{ py: 12, textAlign: "center" }}>
                <Box sx={{ width: 88, height: 88, borderRadius: "50%", mx: "auto", mb: 2.5, bgcolor: BRAND.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><AnalyticsIcon sx={{ fontSize: 42, color: BRAND.primary, opacity: 0.5 }} /></Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#475569", fontFamily: MAIN_FONT }}>Selecciona una referencia</Typography>
                <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5, mb: 2 }}>{data.uniqueReferences.length > 0 ? `${data.uniqueReferences.length} referencia(s) disponibles` : `Sin datos`}</Typography>
              </Box>
            </Fade>
          ) : data.loading ? (
            <Stack spacing={1.5}><Skeleton variant="rounded" height={40} /><Skeleton variant="rounded" height={380} /></Stack>
          ) : data.matrixData && data.matrixData.filas.length > 0 ? (
            <Fade in={true}>
              <Box>
                {/* Info bar */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, flexWrap: "wrap", gap: 0.8 }}>
                  <Chip icon={<StoreIcon sx={{ fontSize: 13 }} />} label={`${data.matrixData.tiendasUnicas} tiendas`} size="small" sx={{ bgcolor: BRAND.bg, color: BRAND.dark, fontWeight: 700, fontSize: "0.7rem" }} />
                  <Chip icon={<PersonIcon sx={{ fontSize: 13 }} />} label={`${data.matrixData.usuariosUnicos} usuarios`} size="small" sx={{ bgcolor: "#f3e8ff", color: "#6b21a8", fontWeight: 700, fontSize: "0.7rem" }} />
                  <Chip label={`${data.matrixData.grandTotal.toLocaleString("es-CO")} unidades`} size="small" sx={{ bgcolor: "#f0fdf4", color: "#15803d", fontWeight: 700, fontSize: "0.7rem" }} />
                  <Box sx={{ flexGrow: 1 }} />
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600, fontSize: "0.7rem" }}><CalendarIcon sx={{ fontSize: 11, verticalAlign: "middle", mr: 0.3 }} />{data.fecha?.format("DD MMM YYYY")}</Typography>
                </Stack>

                {/* Matrix Table */}
                <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <TableContainer sx={{ maxHeight: "calc(100vh - 240px)", overflowX: "auto" }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ bgcolor: "#f1f5f9", fontWeight: 800, position: "sticky", left: 0, zIndex: 101 }}>ESTABLECIMIENTO</TableCell>
                          <TableCell sx={{ bgcolor: "#f8fafc", fontWeight: 800, position: "sticky", left: { xs: 140, md: 210 }, zIndex: 101 }}>USUARIO</TableCell>
                          {data.selectedRef === "ALL_HISTORICAL" && <><TableCell sx={{ bgcolor: "#f8fafc", fontWeight: 800 }}>FECHA</TableCell><TableCell sx={{ bgcolor: "#f8fafc", fontWeight: 800 }}>REF</TableCell></>}
                          {data.matrixData.tallas.map((t, idx) => <TableCell key={t} align="center" sx={{ bgcolor: idx % 2 === 0 ? "#fafafa" : "#ffffff", fontWeight: 800 }}>Talla {t}</TableCell>)}
                          <TableCell align="center" sx={{ bgcolor: "#e2e8f0", fontWeight: 900 }}>TOTAL</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.matrixData.filas.map((f, i) => (
                          <TableRow key={`${f.tiendaId}-${f.usuarioId}-${i}`} hover>
                            <TableCell sx={{ position: "sticky", left: 0, zIndex: 5, bgcolor: i % 2 === 0 ? "white" : "#f8fafc" }}><Typography variant="body2" fontWeight={700}>{f.tiendaNombre}</Typography></TableCell>
                            <TableCell sx={{ position: "sticky", left: { xs: 140, md: 210 }, zIndex: 5, bgcolor: i % 2 === 0 ? "white" : "#f8fafc" }}><Typography sx={{ fontSize: "0.78rem", fontWeight: 600 }}>{f.usuarioNombre}</Typography></TableCell>
                            {data.selectedRef === "ALL_HISTORICAL" && <><TableCell>{f.fecha}</TableCell><TableCell>{f.referencia}</TableCell></>}
                            {data.matrixData!.tallas.map((talla) => {
                              const val = f.tallas[talla] || 0;
                              const { bg, text, fw } = getHeatColor(val, data.matrixData!.maxCellValue);
                              return <TableCell key={talla} align="center" sx={{ bgcolor: val > 0 ? bg : "inherit", color: text, fontWeight: fw, py: 0.5 }}>{val > 0 ? val : ""}</TableCell>
                            })}
                            <TableCell align="center" sx={{ fontWeight: 800, bgcolor: f.total > 0 ? "#f1f5f9" : "inherit" }}>{f.total > 0 ? f.total : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Box>
            </Fade>
          ) : <Alert severity="info">No hay datos para esta fecha.</Alert>}
        </Container>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </>
    </LocalizationProvider>
  );
};
export default AnalisisPage;